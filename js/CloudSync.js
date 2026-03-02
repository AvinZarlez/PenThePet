/**
 * Cloud Sync Module
 *
 * Provides optional Firebase Authentication and Firestore sync so users
 * can access their puzzle submissions from any browser or device.
 *
 * This module is entirely opt-in. When FIREBASE_CONFIG.apiKey is empty the
 * module stays dormant and the app works in local-only (cookie) mode.
 *
 * ── HOW COOKIE ↔ CLOUD SYNC WORKS ──────────────────────────────────────────
 *
 * Every piece of user data lives first as a browser cookie, then is mirrored
 * to Firestore when the user is signed in.  The mapping is:
 *
 *   Cookie name              Firestore doc (under users/{uid}/submissions/)
 *   ─────────────────────────────────────────────────────────────────────────
 *   submission_YYYY-MM-DD    YYYY-MM-DD          (puzzle result)
 *   timer_YYYY-MM-DD         timer_YYYY-MM-DD    (in-progress elapsed seconds)
 *   selectedPet              settings.selectedPet (part of settings doc)
 *   hintMode                 settings.hintMode    (part of settings doc)
 *
 * Cookies NOT synced to cloud (intentional):
 *   currentLevel   — transient UI state (which puzzle is open); device-local
 *   debugMode      — developer tool; not meaningful across devices
 *
 * To add a new synced value in future:
 *   1. Write the cookie as normal.
 *   2. Call the appropriate CloudSync upload function (e.g. saveSettings())
 *      immediately after writing the cookie, guarded by:
 *        if (typeof CloudSync !== 'undefined' && CloudSync.isConfigured() && CloudSync.isLoggedIn())
 *   3. In syncFromCloud() / the realtime listener, apply the downloaded value
 *      to the cookie so it is available locally.
 *   4. In uploadLocalSubmissions(), include the new cookie in the upload pass
 *      so offline data is pushed when the user next signs in.
 *
 * ── WHEN SYNC RUNS ───────────────────────────────────────────────────────────
 *
 *   • Sign in (auth state change) — full sync of all levels.
 *   • Realtime listener — continuous push of any remote changes while signed in.
 *   • Open level selector — explicit syncNow() before calendar is populated,
 *     so completion checkmarks (✓/🏆) are accurate.
 *   • Select / load a level — explicit syncNow() before the level is rendered,
 *     so the loaded submission/timer state is always current.
 *   • After every sync — the `cloudsync:synced` event fires; main.js reloads
 *     the currently displayed level if its submission state or data changed.
 *
 * ── CONFLICT RESOLUTION ──────────────────────────────────────────────────────
 *
 * For each puzzle date, sync applies these rules in priority order:
 *
 *   1. ONLY ONE SIDE HAS DATA — copy it to the other so both match.
 *
 *   2. ONE SIDE IS SUBMITTED, OTHER IS IN-PROGRESS — the submitted result
 *      always wins.  "Submitted" means a `submission_YYYY-MM-DD` cookie /
 *      Firestore doc exists.  "In-progress" means only a timer exists (no
 *      submission).  The winning submission is written to both sides.
 *
 *   3. BOTH IN-PROGRESS (timer only, no submission on either side) —
 *      HIGHEST ELAPSED WINS (max-merge).  The timer should never go
 *      backwards; both sides are updated to the larger elapsed value.
 *
 *   4. BOTH SUBMITTED — EARLIEST TIMESTAMP WINS.  The first completed
 *      solve is the authentic result.  Whichever submission has the earlier
 *      `timestamp` field is kept on both sides.  If either side lacks a
 *      timestamp, the cloud value is used as a safe default.
 *
 * Settings (selectedPet, hintMode, username): CLOUD WINS always.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Import FIREBASE_CONFIG if in Node.js environment
if (typeof FIREBASE_CONFIG === 'undefined' && typeof require !== 'undefined') {
    global.FIREBASE_CONFIG = require('./firebase-config.js');
}

const CloudSync = (function () {
    let auth = null;
    let db = null;
    let currentUser = null;
    let unsubscribeListener = null;
    let isSyncing = false;
    let username = null;
    let gameTesters = [];

    const COLLECTION_NAME = 'submissions';
    const SETTINGS_DOC = 'settings';
    const TIMER_DOC_PREFIX = 'timer_';

    // ----------------------------------------------------------------
    // Configuration helpers
    // ----------------------------------------------------------------

    /**
     * Returns true when a Firebase project has been configured.
     * @returns {boolean}
     */
    function isConfigured() {
        return typeof FIREBASE_CONFIG !== 'undefined' &&
            FIREBASE_CONFIG.apiKey &&
            FIREBASE_CONFIG.apiKey !== '';
    }

    // ----------------------------------------------------------------
    // Game tester helpers
    // ----------------------------------------------------------------

    /**
     * Load the list of game-tester Firebase UIDs from game-testers.json.
     * Falls back to an empty list if the file cannot be read.
     */
    async function loadGameTesters() {
        try {
            const response = await fetch('game-testers.json');
            if (response.ok) {
                const data = await response.json();
                gameTesters = Array.isArray(data.testers) ? data.testers : [];
            }
        } catch (e) {
            console.warn('CloudSync: Could not load game-testers.json — debug mode disabled for all users.', e);
        }
    }

    /**
     * Returns true when the currently signed-in user's Firebase UID appears
     * in the game-testers list.
     * @returns {boolean}
     */
    function isGameTester() {
        if (!currentUser) return false;
        return gameTesters.includes(currentUser.uid);
    }

    /**
     * Show or hide the debug mode option in the Options modal and enforce
     * debug mode off for non-testers.
     * Called whenever auth state or username changes.
     */
    function updateDebugOptionVisibility() {
        const allowed = isGameTester();
        const cookiesAvailable = typeof CookieUtils !== 'undefined';

        const debugOptionItem = document.getElementById('debugModeOptionItem');
        if (debugOptionItem) {
            debugOptionItem.style.display = allowed ? '' : 'none';
        }

        // Force debug off for non-testers; restore saved preference for testers
        const debugEnabled = allowed && cookiesAvailable &&
            CookieUtils.getCookie('debugMode') === 'true';

        if (!allowed && cookiesAvailable) {
            CookieUtils.setCookie('debugMode', 'false', 365);
        }

        const debugSection = document.querySelector('.debug-section');
        if (debugSection) {
            debugSection.style.display = debugEnabled ? 'block' : 'none';
        }
        const debugModeCheckbox = document.getElementById('debugModeCheckbox');
        if (debugModeCheckbox) {
            debugModeCheckbox.checked = debugEnabled;
        }
    }

    // ----------------------------------------------------------------
    // Initialisation
    // ----------------------------------------------------------------

    /**
     * Initialise Firebase and wire up the auth state listener.
     * Called once from main.js after the DOM is ready.
     */
    async function init() {
        await loadGameTesters();
        updateDebugOptionVisibility(); // hide debug option until tester status confirmed

        if (!isConfigured()) {
            return; // local-only mode
        }

        // firebase compat SDK must be loaded via <script> tags in index.html
        if (typeof firebase === 'undefined') {
            console.error('CloudSync: Firebase SDK not loaded');
            return;
        }

        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(FIREBASE_CONFIG);
            }
            auth = firebase.auth();
            db = firebase.firestore();
            auth.onAuthStateChanged(handleAuthStateChange);
            completeSignInWithEmailLink().catch(function (e) {
                console.error('CloudSync: Email link sign-in check failed:', e);
            });
            showCloudSyncUI();
            showOptionsAccountSection();
        } catch (e) {
            console.error('CloudSync: Firebase initialisation failed:', e);
        }
    }

    // ----------------------------------------------------------------
    // UI helpers
    // ----------------------------------------------------------------

    /** Show the cloud sync button once Firebase is ready. */
    function showCloudSyncUI() {
        const loginBtn = document.getElementById('cloudSyncLoginBtn');
        if (loginBtn) {
            loginBtn.style.display = 'inline-block';
        }
    }

    /** Show the account section in the Options modal once Firebase is ready. */
    function showOptionsAccountSection() {
        const section = document.getElementById('optionsAccountSection');
        if (section) section.style.display = 'block';
        updateOptionsAccountSection();
    }

    /** Update header UI to reflect signed-in / signed-out state. */
    function updateAuthUI(user) {
        const loginBtn = document.getElementById('cloudSyncLoginBtn');
        const userInfo = document.getElementById('cloudSyncUserInfo');
        const userEmail = document.getElementById('cloudSyncUserEmail');
        const syncStatus = document.getElementById('cloudSyncStatus');

        if (user) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (userInfo) userInfo.style.display = 'flex';
            if (userEmail) userEmail.textContent = username || user.email;
            updateSyncStatus('synced');
        } else {
            username = null;
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (userInfo) userInfo.style.display = 'none';
            if (syncStatus) syncStatus.style.display = 'none';
        }
    }

    /** Update the Options modal account section to reflect signed-in / signed-out state. */
    function updateOptionsAccountSection() {
        const signedOutSection = document.getElementById('optionsAccountSignedOut');
        const signedInSection = document.getElementById('optionsAccountSignedIn');
        const optionsUsername = document.getElementById('optionsUsername');

        if (currentUser) {
            if (signedOutSection) signedOutSection.style.display = 'none';
            if (signedInSection) signedInSection.style.display = 'block';
            if (optionsUsername) optionsUsername.textContent = username || currentUser.email;
        } else {
            if (signedOutSection) signedOutSection.style.display = 'block';
            if (signedInSection) signedInSection.style.display = 'none';
        }
    }

    /** Update the small sync status badge. */
    function updateSyncStatus(state, errorMsg) {
        const el = document.getElementById('cloudSyncStatus');
        if (!el) return;
        el.style.display = 'inline-block';
        if (state === 'syncing') {
            el.textContent = '🔄 Syncing…';
            el.title = 'Syncing with cloud';
            el.className = 'cloud-sync-status syncing';
        } else if (state === 'synced') {
            el.textContent = '☁️ Synced';
            el.title = 'All data synced to cloud';
            el.className = 'cloud-sync-status synced';
        } else if (state === 'error') {
            el.textContent = '⚠️ Sync error';
            el.title = errorMsg || 'Sync failed';
            el.className = 'cloud-sync-status error';
        }
    }

    // ----------------------------------------------------------------
    // Auth state
    // ----------------------------------------------------------------

    /** Handle Firebase auth state changes. */
    async function handleAuthStateChange(user) {
        currentUser = user;
        updateAuthUI(user);
        updateOptionsAccountSection();
        updateDebugOptionVisibility(); // enforce debug off when signed out

        if (user) {
            await syncFromCloud();
            startRealtimeListener();
        } else {
            stopRealtimeListener();
        }
    }

    // ----------------------------------------------------------------
    // Authentication actions
    // ----------------------------------------------------------------

    /**
     * Sign in with a Google account using a popup.
     */
    async function signInWithGoogle() {
        if (!auth) throw new Error('Firebase not initialised');
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await auth.signInWithPopup(provider);
        } catch (e) {
            throw new Error(getAuthErrorMessage(e.code), { cause: e });
        }
    }

    /**
     * Send a passwordless sign-in link to the given email address.
     * The user receives an email with a magic link; clicking it returns them
     * to the app where completeSignInWithEmailLink() finishes sign-in.
     * @param {string} email
     */
    async function sendSignInLink(email) {
        if (!auth) throw new Error('Firebase not initialised');
        const actionCodeSettings = {
            url: window.location.origin + window.location.pathname,
            handleCodeInApp: true
        };
        try {
            await auth.sendSignInLinkToEmail(email, actionCodeSettings);
            window.localStorage.setItem('emailForSignIn', email);
        } catch (e) {
            throw new Error(getAuthErrorMessage(e.code), { cause: e });
        }
    }

    /**
     * Check whether the current URL contains a sign-in email link and, if
     * so, complete the passwordless sign-in automatically. Called from init().
     */
    async function completeSignInWithEmailLink() {
        if (!auth) return;
        if (typeof window === 'undefined') return;
        if (!auth.isSignInWithEmailLink(window.location.href)) return;

        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
            // User opened the link on a different device — ask for their email
            email = window.prompt('Please enter your email to complete sign-in:');
        }
        if (!email) return;

        try {
            await auth.signInWithEmailLink(email, window.location.href);
            window.localStorage.removeItem('emailForSignIn');
            // Remove the sign-in token from the URL without reloading the page
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
            console.error('CloudSync: Failed to complete email link sign-in:', e);
        }
    }

    /** Sign out the current user. */
    async function signOut() {
        if (!auth) return;
        stopRealtimeListener();
        await auth.signOut();
    }

    // ----------------------------------------------------------------
    // Data sync — upload
    // ----------------------------------------------------------------

    /**
     * Upload a single submission to Firestore.
     * Also write the local cookie before calling this (see Game.saveSubmission).
     * Called automatically from Game.saveSubmission().
     * @param {string} dateString - Puzzle date (YYYY-MM-DD)
     * @param {Object} data - {score, walls, timestamp, time}
     */
    async function saveSubmission(dateString, data) {
        if (!db || !currentUser) return;
        try {
            isSyncing = true;
            updateSyncStatus('syncing');
            const docRef = db
                .collection('users')
                .doc(currentUser.uid)
                .collection(COLLECTION_NAME)
                .doc(dateString);
            await docRef.set(data);
            updateSyncStatus('synced');
        } catch (e) {
            console.error('CloudSync: Failed to save submission:', e);
            updateSyncStatus('error', getSyncErrorMessage(e));
        } finally {
            isSyncing = false;
        }
    }

    /**
     * Upload user settings (selectedPet, hintMode) to Firestore.
     * Also write the local cookie before calling this (see Menu._savePetToCookie,
     * Menu._saveHintModeToCookie).
     * @param {Object} settings - {selectedPet?, hintMode?}
     */
    async function saveSettings(settings) {
        if (!db || !currentUser) return;
        try {
            const docRef = db
                .collection('users')
                .doc(currentUser.uid)
                .collection(COLLECTION_NAME)
                .doc(SETTINGS_DOC);
            await docRef.set(settings, { merge: true });
        } catch (e) {
            console.error('CloudSync: Failed to save settings:', e);
        }
    }

    /**
     * Save a display username to Firestore and update the UI.
     * @param {string} newUsername
     */
    async function saveUsername(newUsername) {
        if (!db || !currentUser) throw new Error('Not signed in');
        await saveSettings({ username: newUsername });
        username = newUsername;
        updateAuthUI(currentUser);
        updateOptionsAccountSection();
    }

    /**
     * Update the Firebase Auth email for the current user.
     * Uses verifyBeforeUpdateEmail so the change only takes effect after
     * the user clicks the verification link in their inbox.
     * @param {string} newEmail
     */
    async function saveEmail(newEmail) {
        if (!auth || !currentUser) throw new Error('Not signed in');
        try {
            await currentUser.verifyBeforeUpdateEmail(newEmail);
        } catch (e) {
            throw new Error(getAuthErrorMessage(e.code), { cause: e });
        }
    }

    /**
     * Upload the current in-progress timer state for a puzzle to Firestore.
     * Also write the local cookie before calling this (see Game._saveTimerState).
     * Called from Game._saveTimerState() every 30 seconds and on pause.
     * Conflict resolution: HIGHEST ELAPSED WINS (see applyCloudTimerState).
     * @param {string} dateString - Puzzle date (YYYY-MM-DD)
     * @param {number} elapsed - Elapsed seconds
     */
    async function saveTimerState(dateString, elapsed) {
        if (!db || !currentUser) return;
        try {
            const docRef = db
                .collection('users')
                .doc(currentUser.uid)
                .collection(COLLECTION_NAME)
                .doc(TIMER_DOC_PREFIX + dateString);
            await docRef.set({ elapsed: elapsed }, { merge: true });
        } catch (e) {
            console.error('CloudSync: Failed to save timer state:', e);
        }
    }

    /**
     * Apply a cloud timer state to the local cookie.
     * Conflict rule 3: BOTH IN-PROGRESS → HIGHEST ELAPSED WINS. See docs/CLOUD_SYNC_SETUP.md.
     * @param {string} docId - Firestore doc ID (e.g. 'timer_2026-01-01')
     * @param {Object} data - {elapsed: number}
     */
    function applyCloudTimerState(docId, data) {
        if (!data || typeof data.elapsed !== 'number') return;
        const localValue = CookieUtils.getCookie(docId);
        let localElapsed = 0;
        if (localValue) {
            try {
                localElapsed = JSON.parse(localValue).elapsed || 0;
            } catch { /* ignore malformed cookie */ }
        }
        const elapsed = Math.max(localElapsed, data.elapsed);
        CookieUtils.setCookie(docId, JSON.stringify({ elapsed: elapsed }), 365);
    }

    /**
     * Apply a cloud submission to the local cookie using conflict resolution.
     * Conflict rule 4: BOTH SUBMITTED → EARLIEST TIMESTAMP WINS. See docs/CLOUD_SYNC_SETUP.md.
     * @param {string} dateString - Puzzle date (YYYY-MM-DD)
     * @param {Object} cloudData - Cloud submission data
     * @returns {boolean} true if the local cookie was updated, false if local was kept
     */
    function applyCloudSubmission(dateString, cloudData) {
        const cookieName = 'submission_' + dateString;
        const localValue = CookieUtils.getCookie(cookieName);
        if (localValue) {
            try {
                const localData = JSON.parse(localValue);
                if (localData.timestamp && cloudData.timestamp &&
                    new Date(localData.timestamp) < new Date(cloudData.timestamp)) {
                    return false; // local was submitted first — keep it; upload will follow
                }
            } catch { /* fall through to use cloud data */ }
        }
        CookieUtils.setCookie(cookieName, JSON.stringify(cloudData), 365);
        return true;
    }

    // ----------------------------------------------------------------
    // Data sync — delete
    // ----------------------------------------------------------------

    /**
     * Delete a single submission from Firestore.
     * Called automatically from Game.deleteSubmission().
     * @param {string} dateString - Puzzle date (YYYY-MM-DD)
     */
    async function deleteSubmission(dateString) {
        if (!db || !currentUser) return;
        try {
            isSyncing = true;
            updateSyncStatus('syncing');
            const docRef = db
                .collection('users')
                .doc(currentUser.uid)
                .collection(COLLECTION_NAME)
                .doc(dateString);
            await docRef.delete();
            updateSyncStatus('synced');
        } catch (e) {
            console.error('CloudSync: Failed to delete submission:', e);
            updateSyncStatus('error', getSyncErrorMessage(e));
        } finally {
            isSyncing = false;
        }
    }

    /**
     * Delete ALL submissions and settings from Firestore.
     * Called from Menu.resetAllData() (debug "Reset All Data" button).
     */
    async function deleteAllSubmissions() {
        if (!db || !currentUser) return;
        try {
            isSyncing = true;
            updateSyncStatus('syncing');
            const collRef = db
                .collection('users')
                .doc(currentUser.uid)
                .collection(COLLECTION_NAME);
            const snapshot = await collRef.get();
            const batch = db.batch();
            snapshot.forEach(function (doc) {
                batch.delete(doc.ref);
            });
            await batch.commit();
            updateSyncStatus('synced');
        } catch (e) {
            console.error('CloudSync: Failed to delete all submissions:', e);
            updateSyncStatus('error', getSyncErrorMessage(e));
        } finally {
            isSyncing = false;
        }
    }

    // ----------------------------------------------------------------
    // Data sync — download & merge
    // ----------------------------------------------------------------

    /**
     * Download all cloud submissions and merge into local cookies.
     * Conflict resolution rules: see docs/CLOUD_SYNC_SETUP.md.
     */
    async function syncFromCloud() {
        if (!db || !currentUser) return;

        try {
            // Guard our own writes so the realtime listener ignores them.
            isSyncing = true;
            updateSyncStatus('syncing');

            const collRef = db
                .collection('users')
                .doc(currentUser.uid)
                .collection(COLLECTION_NAME);

            const snapshot = await collRef.get();

            snapshot.forEach(function (doc) {
                if (doc.id === SETTINGS_DOC) {
                    applyCloudSettings(doc.data());
                    return;
                }
                if (doc.id.startsWith(TIMER_DOC_PREFIX)) {
                    applyCloudTimerState(doc.id, doc.data());
                    return;
                }
                // Submission conflict resolution — see docs/CLOUD_SYNC_SETUP.md
                applyCloudSubmission(doc.id, doc.data());
            });

            // Upload any local-only data that the cloud does not yet have.
            await uploadLocalSubmissions();

            updateSyncStatus('synced');

            // Notify the app that cookies may have changed (see cloudsync:synced in main.js).
            if (typeof document !== 'undefined') {
                document.dispatchEvent(new CustomEvent('cloudsync:synced'));
            }
        } catch (e) {
            console.error('CloudSync: Failed to sync from cloud:', e);
            updateSyncStatus('error', getSyncErrorMessage(e));
        } finally {
            isSyncing = false;
        }
    }

    /**
     * Apply cloud-stored settings to local cookies.
     * Settings: CLOUD WINS — always overwrites local values with cloud values.
     * @param {Object} settings
     */
    function applyCloudSettings(settings) {
        if (!settings) return;
        // Cloud wins: apply cloud value regardless of whether a local cookie exists.
        if (settings.selectedPet) {
            CookieUtils.setCookie('selectedPet', settings.selectedPet, 365);
        }
        if (settings.hintMode) {
            CookieUtils.setCookie('hintMode', settings.hintMode, 365);
        }
        if (settings.username !== undefined) {
            username = settings.username;
            updateAuthUI(currentUser);
            updateOptionsAccountSection();
        }
    }

    /**
     * Upload all local submission_*, timer_*, and settings cookies to Firestore.
     * Called after syncFromCloud() so each cookie already holds the winning value.
     * Uses { merge: true } to avoid clobbering fields on concurrent devices.
     */
    async function uploadLocalSubmissions() {
        if (!db || !currentUser) return;

        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const parts = cookie.trim().split('=');
            const name = parts[0];
            if (!name.startsWith('submission_') && !name.startsWith(TIMER_DOC_PREFIX)) continue;
            const value = CookieUtils.getCookie(name);
            if (!value) continue;

            try {
                const data = JSON.parse(value);
                const docId = name.startsWith('submission_')
                    ? name.replace('submission_', '')
                    : name; // timer_YYYY-MM-DD kept as-is
                const docRef = db
                    .collection('users')
                    .doc(currentUser.uid)
                    .collection(COLLECTION_NAME)
                    .doc(docId);
                await docRef.set(data, { merge: true });
            } catch (e) {
                console.error('CloudSync: Failed to upload local cookie', name, ':', e);
            }
        }

        const selectedPet = CookieUtils.getCookie('selectedPet');
        const hintMode = CookieUtils.getCookie('hintMode');
        if (selectedPet || hintMode) {
            const settings = {};
            if (selectedPet) settings.selectedPet = selectedPet;
            if (hintMode) settings.hintMode = hintMode;
            try {
                const docRef = db
                    .collection('users')
                    .doc(currentUser.uid)
                    .collection(COLLECTION_NAME)
                    .doc(SETTINGS_DOC);
                await docRef.set(settings, { merge: true });
            } catch (e) {
                console.error('CloudSync: Failed to upload local settings:', e);
            }
        }
    }

    // ----------------------------------------------------------------
    // Realtime listener
    // ----------------------------------------------------------------

    /** Start listening for realtime changes from other devices. */
    function startRealtimeListener() {
        if (!db || !currentUser) return;
        stopRealtimeListener();

        const collRef = db
            .collection('users')
            .doc(currentUser.uid)
            .collection(COLLECTION_NAME);

        unsubscribeListener = collRef.onSnapshot(function (snapshot) {
            if (isSyncing) return; // ignore our own writes
            let submissionsUpdated = false;
            let timerUpdated = false;
            const localWinUploads = []; // docs where local submission "won" — push back to cloud

            snapshot.docChanges().forEach(function (change) {
                if (change.type === 'added' || change.type === 'modified') {
                    if (change.doc.id === SETTINGS_DOC) {
                        applyCloudSettings(change.doc.data());
                        return;
                    }
                    if (change.doc.id.startsWith(TIMER_DOC_PREFIX)) {
                        applyCloudTimerState(change.doc.id, change.doc.data());
                        // Timer update from another device — notify main.js to refresh the display.
                        timerUpdated = true;
                        return;
                    }
                    // Submission conflict resolution — see docs/CLOUD_SYNC_SETUP.md.
                    // Returns true if cloud was applied; false if local submission was kept.
                    const cloudApplied = applyCloudSubmission(change.doc.id, change.doc.data());
                    submissionsUpdated = true;
                    if (!cloudApplied) {
                        // Local submission "won" — schedule a writeback so other devices converge.
                        localWinUploads.push(change.doc.id);
                    }
                } else if (change.type === 'removed') {
                    // Submission deleted on another device — remove local cookie too.
                    if (change.doc.id === SETTINGS_DOC) return;
                    if (change.doc.id.startsWith(TIMER_DOC_PREFIX)) {
                        CookieUtils.deleteCookie(change.doc.id);
                        return;
                    }
                    CookieUtils.deleteCookie('submission_' + change.doc.id);
                    submissionsUpdated = true;
                }
            });

            // Push any local-win submissions back so all devices converge immediately.
            // Fire-and-forget: the resulting echo snapshot will see identical timestamps
            // and write the same cookie value — a harmless no-op.
            localWinUploads.forEach(function (docId) {
                const cookieValue = CookieUtils.getCookie('submission_' + docId);
                if (!cookieValue) return;
                try {
                    collRef.doc(docId).set(JSON.parse(cookieValue)).catch(function (e) {
                        console.error('CloudSync: Failed to push local win to Firestore:', e);
                    });
                } catch (e) { /* malformed cookie — defer to next full sync */ }
            });

            // Notify the app whenever submissions or timers changed.
            if ((submissionsUpdated || timerUpdated) && typeof document !== 'undefined') {
                document.dispatchEvent(new CustomEvent('cloudsync:synced'));
            }
        });
    }

    /** Stop the realtime listener. */
    function stopRealtimeListener() {
        if (unsubscribeListener) {
            unsubscribeListener();
            unsubscribeListener = null;
        }
    }

    // ----------------------------------------------------------------
    // Auth modal helpers (called from inline onclick in HTML)
    // ----------------------------------------------------------------

    function openAuthModal() {
        const modal = document.getElementById('cloudSyncModal');
        if (modal) {
            modal.style.display = 'flex';
            clearAuthLinkError();
            clearAuthLinkSuccess();
            const emailInput = document.getElementById('authEmailLink');
            if (emailInput) emailInput.focus();
        }
    }

    function closeAuthModal() {
        const modal = document.getElementById('cloudSyncModal');
        if (modal) modal.style.display = 'none';
        clearAuthLinkError();
        clearAuthLinkSuccess();
    }

    function openEditProfileModal() {
        const modal = document.getElementById('editProfileModal');
        if (modal) {
            const usernameInput = document.getElementById('profileUsername');
            const emailInput = document.getElementById('profileEmail');
            if (usernameInput) usernameInput.value = username || '';
            if (emailInput && currentUser) emailInput.value = currentUser.email || '';
            modal.style.display = 'flex';
            clearProfileError();
            clearProfileSuccess();
            updateLinkedProviders();
            if (usernameInput) usernameInput.focus();
        }
    }

    function closeEditProfileModal() {
        const modal = document.getElementById('editProfileModal');
        if (modal) modal.style.display = 'none';
        clearProfileError();
        clearProfileSuccess();
    }

    function clearAuthLinkError() {
        const el = document.getElementById('authLinkError');
        if (el) {
            el.style.display = 'none';
            el.textContent = '';
        }
    }

    function showAuthLinkError(msg) {
        const el = document.getElementById('authLinkError');
        if (el) {
            el.textContent = msg;
            el.style.display = 'block';
        }
    }

    function clearAuthLinkSuccess() {
        const el = document.getElementById('authLinkSuccess');
        if (el) {
            el.style.display = 'none';
            el.textContent = '';
        }
    }

    function showAuthLinkSuccess(msg) {
        const el = document.getElementById('authLinkSuccess');
        if (el) {
            el.textContent = msg;
            el.style.display = 'block';
        }
    }

    function clearProfileError() {
        const el = document.getElementById('profileError');
        if (el) {
            el.style.display = 'none';
            el.textContent = '';
        }
    }

    function showProfileError(msg) {
        const el = document.getElementById('profileError');
        if (el) {
            el.textContent = msg;
            el.style.display = 'block';
        }
    }

    function clearProfileSuccess() {
        const el = document.getElementById('profileSuccess');
        if (el) {
            el.style.display = 'none';
            el.textContent = '';
        }
    }

    function showProfileSuccess(msg) {
        const el = document.getElementById('profileSuccess');
        if (el) {
            el.textContent = msg;
            el.style.display = 'block';
        }
    }

    /** Called by the Send Sign-In Link button in the passwordless view. */
    async function handleSendSignInLink() {
        clearAuthLinkError();
        clearAuthLinkSuccess();
        const emailInput = document.getElementById('authEmailLink');
        const email = emailInput ? emailInput.value.trim() : '';
        if (!email) {
            showAuthLinkError('Please enter your email address.');
            return;
        }
        const btn = document.getElementById('authSendLinkBtn');
        if (btn) btn.disabled = true;
        try {
            await sendSignInLink(email);
            showAuthLinkSuccess(`A sign-in link has been sent to ${email}. Check your inbox and click the link to sign in.`);
        } catch (e) {
            showAuthLinkError(e.message);
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    /** Called by the Sign in with Google button in the auth modal. */
    async function handleSignInWithGoogle() {
        clearAuthLinkError();
        const btn = document.getElementById('authGoogleBtn');
        if (btn) btn.disabled = true;
        try {
            await signInWithGoogle();
            closeAuthModal();
        } catch (e) {
            showAuthLinkError(e.message);
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    /**
     * Returns true if the current user has the given Firebase provider linked.
     * @param {string} providerId - e.g. 'google.com'
     * @returns {boolean}
     */
    function hasLinkedProvider(providerId) {
        if (!currentUser) return false;
        for (var i = 0; i < currentUser.providerData.length; i++) {
            if (currentUser.providerData[i].providerId === providerId) return true;
        }
        return false;
    }

    /**
     * Update the connected-accounts buttons in the edit profile modal.
     * Checks providerData of the current user and marks Google as
     * connected or disconnected.
     */
    function updateLinkedProviders() {
        if (!currentUser) return;
        updateProviderButton('linkGoogleBtn', hasLinkedProvider('google.com'));
    }

    /** Helper to update a single provider link/unlink button. */
    function updateProviderButton(btnId, isLinked) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        btn.textContent = isLinked ? 'Disconnect' : 'Connect';
        if (isLinked) {
            btn.classList.add('linked-account-disconnect');
        } else {
            btn.classList.remove('linked-account-disconnect');
        }
    }

    /**
     * Toggle Google account link/unlink for the currently signed-in user.
     * Called from the Connect/Disconnect Google button in Edit Profile.
     */
    async function handleLinkWithGoogle() {
        if (!auth || !currentUser) return;
        clearProfileError();
        clearProfileSuccess();
        try {
            if (hasLinkedProvider('google.com')) {
                await currentUser.unlink('google.com');
                showProfileSuccess('Google account disconnected.');
            } else {
                const provider = new firebase.auth.GoogleAuthProvider();
                await currentUser.linkWithPopup(provider);
                showProfileSuccess('Google account connected.');
            }
            updateLinkedProviders();
        } catch (e) {
            showProfileError(getAuthErrorMessage(e.code));
        }
    }

    /** Called by the Sign Out button. */
    async function handleSignOut() {
        try {
            await signOut();
        } catch (e) {
            console.error('CloudSync: Sign out failed:', e);
        }
    }

    /** Called by the Save Changes button in the edit profile modal. */
    async function handleSaveProfile() {
        clearProfileError();
        clearProfileSuccess();
        const usernameInput = document.getElementById('profileUsername');
        const emailInput = document.getElementById('profileEmail');
        const newUsername = usernameInput ? usernameInput.value.trim() : '';
        const newEmail = emailInput ? emailInput.value.trim() : '';

        const btn = document.getElementById('profileSaveBtn');
        if (btn) btn.disabled = true;

        let emailVerificationPending = false;
        try {
            if ((newUsername || '') !== (username || '')) {
                await saveUsername(newUsername);
            }
            if (newEmail && currentUser && newEmail !== currentUser.email) {
                await saveEmail(newEmail);
                emailVerificationPending = true;
            }
            if (emailVerificationPending) {
                showProfileSuccess(`A verification email has been sent to ${newEmail}. Your email will update after you click the link.`);
                if (emailInput && currentUser) emailInput.value = currentUser.email || '';
            } else {
                closeEditProfileModal();
            }
        } catch (e) {
            showProfileError(e.message);
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    // ----------------------------------------------------------------
    // Error messages
    // ----------------------------------------------------------------

    function getAuthErrorMessage(code) {
        const messages = {
            'auth/user-not-found': 'No account found with that email.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/email-already-in-use': 'An account with that email already exists.',
            'auth/weak-password': 'Password must be at least 6 characters.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
            'auth/invalid-credential': 'Invalid email or password.',
            'auth/operation-not-allowed': 'This sign-in method is not enabled in the Firebase console.',
            'auth/invalid-api-key': 'Invalid Firebase API key. Check firebase-config.js.',
            'auth/configuration-not-found': 'Firebase Authentication is not configured. Enable it in the Firebase console.',
            'auth/requires-recent-login': 'Please sign out and sign in again before changing your email.',
            'auth/expired-action-code': 'The sign-in link has expired. Please request a new one.',
            'auth/invalid-action-code': 'The sign-in link is invalid or has already been used.',
            'auth/popup-closed-by-user': 'Sign-in cancelled. Please try again.',
            'auth/popup-blocked': 'The sign-in popup was blocked. Please allow popups for this site.',
            'auth/cancelled-popup-request': 'Only one sign-in popup can be open at a time.',
            'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method. Sign in with that method first, then connect additional accounts from your profile settings.',
            'auth/credential-already-in-use': 'This account is already linked to another user.',
            'auth/provider-already-linked': 'This sign-in method is already connected to your account.'
        };
        if (code && code.startsWith('auth/requests-from-referer-') && code.endsWith('-are-blocked')) {
            const blockedDomain = code
                .replace('auth/requests-from-referer-', '')
                .replace(/-are-blocked$/, '');
            return 'The domain "' + blockedDomain + '" is not authorised to use Firebase. ' +
                'Check: (1) Google Cloud Console → API key → HTTP referrers includes ' +
                blockedDomain + '/* (Step 6), ' +
                '(2) Firebase console → Authentication → Settings → Authorised Domains ' +
                'includes ' + blockedDomain + ' (Step 7), ' +
                'and (3) the <meta name="referrer" content="no-referrer-when-downgrade"> ' +
                'tag is present in index.html. See docs/CLOUD_SYNC_SETUP.md for instructions.';
        }
        return messages[code] || 'Authentication error (' + code + '). Check the browser console.';
    }

    function getSyncErrorMessage(e) {
        const code = e && (e.code || '');
        const messages = {
            'permission-denied': 'Firestore permission denied. Check your security rules (see docs/CLOUD_SYNC_SETUP.md).',
            'failed-precondition': 'Firestore database not found. Create one in the Firebase console.',
            'unavailable': 'Firestore service unavailable. Check your internet connection.',
            'unauthenticated': 'Please sign out and sign in again.',
            'resource-exhausted': 'Firebase free tier quota exceeded.'
        };
        const shortCode = code.replace('firestore/', '');
        return messages[shortCode] || messages[code] || 'Sync failed (' + (code || 'unknown') + '). Check the browser console.';
    }

    // ----------------------------------------------------------------
    // Public API
    // ----------------------------------------------------------------

    return {
        init: init,
        syncNow: syncFromCloud,
        isConfigured: isConfigured,
        isLoggedIn: function () { return currentUser !== null; },
        isGameTester: isGameTester,
        getUsername: function () { return username; },
        saveSubmission: saveSubmission,
        saveTimerState: saveTimerState,
        deleteSubmission: deleteSubmission,
        deleteAllSubmissions: deleteAllSubmissions,
        saveSettings: saveSettings,
        saveUsername: saveUsername,
        saveEmail: saveEmail,
        sendSignInLink: sendSignInLink,
        signInWithGoogle: signInWithGoogle,
        signOut: signOut,
        openAuthModal: openAuthModal,
        closeAuthModal: closeAuthModal,
        openEditProfileModal: openEditProfileModal,
        closeEditProfileModal: closeEditProfileModal,
        handleSendSignInLink: handleSendSignInLink,
        handleSignInWithGoogle: handleSignInWithGoogle,
        handleLinkWithGoogle: handleLinkWithGoogle,
        handleSignOut: handleSignOut,
        handleSaveProfile: handleSaveProfile,
        // Exposed for unit testing of conflict resolution logic.
        applyCloudTimerState: applyCloudTimerState,
        applyCloudSubmission: applyCloudSubmission
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudSync;
}
