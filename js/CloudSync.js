/**
 * Cloud Sync Module
 *
 * Provides optional Firebase Authentication and Firestore sync so users
 * can access their puzzle submissions from any browser or device.
 *
 * This module is entirely opt-in. When FIREBASE_CONFIG.apiKey is empty the
 * module stays dormant and the app works in local-only (cookie) mode.
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

    const COLLECTION_NAME = 'submissions';
    const SETTINGS_DOC = 'settings';

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
    // Initialisation
    // ----------------------------------------------------------------

    /**
     * Initialise Firebase and wire up the auth state listener.
     * Called once from main.js after the DOM is ready.
     */
    function init() {
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
     * Sign in with email and password.
     * @param {string} email
     * @param {string} password
     */
    async function signIn(email, password) {
        if (!auth) throw new Error('Firebase not initialised');
        try {
            await auth.signInWithEmailAndPassword(email, password);
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

    /**
     * Create a new account.
     * @param {string} email
     * @param {string} password
     */
    async function signUp(email, password) {
        if (!auth) throw new Error('Firebase not initialised');
        try {
            await auth.createUserWithEmailAndPassword(email, password);
        } catch (e) {
            throw new Error(getAuthErrorMessage(e.code), { cause: e });
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
     * Called automatically from Game.saveSubmission().
     * @param {string} dateString - Puzzle date (YYYY-MM-DD)
     * @param {Object} data - {score, walls, timestamp}
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
     * Upload user settings (pet, hintMode) to Firestore.
     * @param {Object} settings - {selectedPet, hintMode}
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
     * Local data wins for same-date conflicts (user may have played offline).
     */
    async function syncFromCloud() {
        if (!db || !currentUser) return;

        try {
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
                const dateString = doc.id;
                const cookieName = 'submission_' + dateString;
                // Only import if local cookie is missing
                if (!CookieUtils.getCookie(cookieName)) {
                    CookieUtils.setCookie(cookieName, JSON.stringify(doc.data()), 365);
                }
            });

            // Upload any local-only submissions to the cloud
            await uploadLocalSubmissions();

            updateSyncStatus('synced');
        } catch (e) {
            console.error('CloudSync: Failed to sync from cloud:', e);
            updateSyncStatus('error', getSyncErrorMessage(e));
        }
    }

    /**
     * Apply cloud-stored settings to cookies if not already set locally.
     * @param {Object} settings
     */
    function applyCloudSettings(settings) {
        if (!settings) return;
        if (settings.selectedPet && !CookieUtils.getCookie('selectedPet')) {
            CookieUtils.setCookie('selectedPet', settings.selectedPet, 365);
        }
        if (settings.hintMode && !CookieUtils.getCookie('hintMode')) {
            CookieUtils.setCookie('hintMode', settings.hintMode, 365);
        }
        if (settings.username !== undefined) {
            username = settings.username;
            updateAuthUI(currentUser);
            updateOptionsAccountSection();
        }
    }

    /**
     * Scan local submission cookies and upload any missing in Firestore.
     */
    async function uploadLocalSubmissions() {
        if (!db || !currentUser) return;

        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const parts = cookie.trim().split('=');
            const name = parts[0];
            if (!name.startsWith('submission_')) continue;
            const dateString = name.replace('submission_', '');
            const value = CookieUtils.getCookie(name);
            if (!value) continue;

            try {
                const data = JSON.parse(value);
                const docRef = db
                    .collection('users')
                    .doc(currentUser.uid)
                    .collection(COLLECTION_NAME)
                    .doc(dateString);
                // Use set with merge to avoid overwriting cloud data
                await docRef.set(data, { merge: true });
            } catch {
                // skip malformed cookies
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
            snapshot.docChanges().forEach(function (change) {
                if (change.type === 'added' || change.type === 'modified') {
                    if (change.doc.id === SETTINGS_DOC) {
                        applyCloudSettings(change.doc.data());
                        return;
                    }
                    const dateString = change.doc.id;
                    const cookieName = 'submission_' + dateString;
                    CookieUtils.setCookie(cookieName, JSON.stringify(change.doc.data()), 365);
                }
            });
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
            showPasswordView();
            clearAuthLinkError();
            clearAuthLinkSuccess();
            const emailInput = document.getElementById('authEmail');
            if (emailInput) emailInput.focus();
        }
    }

    function closeAuthModal() {
        const modal = document.getElementById('cloudSyncModal');
        if (modal) modal.style.display = 'none';
        clearAuthError();
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
            if (usernameInput) usernameInput.focus();
        }
    }

    function closeEditProfileModal() {
        const modal = document.getElementById('editProfileModal');
        if (modal) modal.style.display = 'none';
        clearProfileError();
        clearProfileSuccess();
    }

    function clearAuthError() {
        const el = document.getElementById('authError');
        if (el) {
            el.style.display = 'none';
            el.textContent = '';
        }
    }

    function showAuthError(msg) {
        const el = document.getElementById('authError');
        if (el) {
            el.textContent = msg;
            el.style.display = 'block';
        }
    }

    function showPasswordlessView() {
        const passwordView = document.getElementById('authPasswordView');
        const passwordlessView = document.getElementById('authPasswordlessView');
        if (passwordView) passwordView.style.display = 'none';
        if (passwordlessView) passwordlessView.style.display = 'block';
        clearAuthLinkError();
        clearAuthLinkSuccess();
        const emailInput = document.getElementById('authEmailLink');
        if (emailInput) emailInput.focus();
    }

    function showPasswordView() {
        const passwordView = document.getElementById('authPasswordView');
        const passwordlessView = document.getElementById('authPasswordlessView');
        if (passwordView) passwordView.style.display = 'block';
        if (passwordlessView) passwordlessView.style.display = 'none';
        clearAuthError();
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

    function getAuthFormValues() {
        const email = (document.getElementById('authEmail') || {}).value || '';
        const password = (document.getElementById('authPassword') || {}).value || '';
        return { email: email.trim(), password };
    }

    /** Called by the Sign In button in the modal. */
    async function handleSignIn() {
        clearAuthError();
        const { email, password } = getAuthFormValues();
        if (!email || !password) {
            showAuthError('Please enter your email and password.');
            return;
        }
        const btn = document.getElementById('authSignInBtn');
        if (btn) btn.disabled = true;
        try {
            await signIn(email, password);
            closeAuthModal();
        } catch (e) {
            showAuthError(e.message);
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    /** Called by the Create Account button in the modal. */
    async function handleSignUp() {
        clearAuthError();
        const { email, password } = getAuthFormValues();
        if (!email || !password) {
            showAuthError('Please enter an email and password.');
            return;
        }
        const btn = document.getElementById('authSignUpBtn');
        if (btn) btn.disabled = true;
        try {
            await signUp(email, password);
            closeAuthModal();
        } catch (e) {
            showAuthError(e.message);
        } finally {
            if (btn) btn.disabled = false;
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
            'auth/invalid-action-code': 'The sign-in link is invalid or has already been used.'
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
        isConfigured: isConfigured,
        isLoggedIn: function () { return currentUser !== null; },
        getUsername: function () { return username; },
        saveSubmission: saveSubmission,
        deleteSubmission: deleteSubmission,
        deleteAllSubmissions: deleteAllSubmissions,
        saveSettings: saveSettings,
        saveUsername: saveUsername,
        saveEmail: saveEmail,
        sendSignInLink: sendSignInLink,
        signIn: signIn,
        signUp: signUp,
        signOut: signOut,
        openAuthModal: openAuthModal,
        closeAuthModal: closeAuthModal,
        openEditProfileModal: openEditProfileModal,
        closeEditProfileModal: closeEditProfileModal,
        showPasswordlessView: showPasswordlessView,
        showPasswordView: showPasswordView,
        handleSignIn: handleSignIn,
        handleSignUp: handleSignUp,
        handleSendSignInLink: handleSendSignInLink,
        handleSignOut: handleSignOut,
        handleSaveProfile: handleSaveProfile
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudSync;
}
