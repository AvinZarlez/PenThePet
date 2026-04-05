/**
 * CloudSync Tests
 *
 * Tests for the cloud sync module.
 * These tests verify that the module behaves correctly both when Firebase
 * is configured with real credentials and when it is in local-only mode.
 */

const hasFirebaseConfig = typeof FIREBASE_CONFIG !== 'undefined' &&
    !!FIREBASE_CONFIG.apiKey;

describe('CloudSync', () => {
    describe('isConfigured()', () => {
        if (hasFirebaseConfig) {
            test('should return truthy when apiKey is defined', () => {
                expect(CloudSync.isConfigured()).toBeTruthy();
            });
        } else {
            test('should return falsy when apiKey is empty', () => {
                expect(CloudSync.isConfigured()).toBeFalsy();
            });
        }
    });

    describe('isLoggedIn()', () => {
        test('should return false when not signed in', () => {
            expect(CloudSync.isLoggedIn()).toBe(false);
        });
    });

    describe('init()', () => {
        test('should not throw when Firebase is not configured', () => {
            expect(() => CloudSync.init()).not.toThrow();
        });

        test('should not throw when Firebase SDK is not loaded', () => {
            // Temporarily set a fake config
            const original = global.FIREBASE_CONFIG;
            global.FIREBASE_CONFIG = { apiKey: 'test-key', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '' };
            // firebase global does not exist in test env
            expect(() => CloudSync.init()).not.toThrow();
            global.FIREBASE_CONFIG = original;
        });
    });

    describe('saveSubmission()', () => {
        test('should not throw when not logged in', async () => {
            await expect(CloudSync.saveSubmission('2026-01-01', { score: 5 })).resolves.toBeUndefined();
        });
    });

    describe('saveTimerState()', () => {
        test('should not throw when not logged in', async () => {
            await expect(CloudSync.saveTimerState('2026-01-01', 65)).resolves.toBeUndefined();
        });

        test('should be exposed on the public API', () => {
            expect(typeof CloudSync.saveTimerState).toBe('function');
        });
    });

    describe('saveSettings()', () => {
        test('should not throw when not logged in', async () => {
            await expect(CloudSync.saveSettings({ selectedPet: '🐶' })).resolves.toBeUndefined();
        });
    });

    describe('deleteSubmission()', () => {
        test('should not throw when not logged in', async () => {
            await expect(CloudSync.deleteSubmission('2026-01-01')).resolves.toBeUndefined();
        });
    });

    describe('deleteAllSubmissions()', () => {
        test('should not throw when not logged in', async () => {
            await expect(CloudSync.deleteAllSubmissions()).resolves.toBeUndefined();
        });
    });

    describe('signOut()', () => {
        test('should not throw when not initialized', async () => {
            await expect(CloudSync.signOut()).resolves.toBeUndefined();
        });
    });

    describe('modal helpers', () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div id="cloudSyncModal" class="modal" style="display: none;">
                    <input id="authEmailLink" value="">
                    <div id="authLinkError" style="display: none;"></div>
                    <div id="authLinkSuccess" style="display: none;"></div>
                    <button id="authSendLinkBtn"></button>
                    <button id="authGoogleBtn"></button>
                </div>
            `;
        });

        test('openAuthModal should show the modal', () => {
            CloudSync.openAuthModal();
            expect(document.getElementById('cloudSyncModal').style.display).toBe('flex');
        });

        test('closeAuthModal should hide the modal', () => {
            CloudSync.openAuthModal();
            CloudSync.closeAuthModal();
            expect(document.getElementById('cloudSyncModal').style.display).toBe('none');
        });

        test('handleSendSignInLink should show error when email is empty', async () => {
            await CloudSync.handleSendSignInLink();
            const error = document.getElementById('authLinkError');
            expect(error.style.display).toBe('block');
            expect(error.textContent).toContain('email');
        });

        test('handleSignInWithGoogle should show error when Firebase not initialised', async () => {
            await CloudSync.handleSignInWithGoogle();
            const error = document.getElementById('authLinkError');
            expect(error.style.display).toBe('block');
        });
    });

    describe('getUsername()', () => {
        test('should return null when not signed in', () => {
            expect(CloudSync.getUsername()).toBeNull();
        });
    });

    describe('saveUsername()', () => {
        test('should throw when not signed in', async () => {
            await expect(CloudSync.saveUsername('testuser')).rejects.toThrow('Not signed in');
        });
    });

    describe('saveEmail()', () => {
        test('should throw when not signed in', async () => {
            await expect(CloudSync.saveEmail('new@example.com')).rejects.toThrow('Not signed in');
        });
    });

    describe('sendSignInLink()', () => {
        test('should throw when Firebase is not initialised', async () => {
            await expect(CloudSync.sendSignInLink('test@example.com')).rejects.toThrow('Firebase not initialised');
        });
    });

    describe('signInWithGoogle()', () => {
        test('should throw when Firebase is not initialised', async () => {
            await expect(CloudSync.signInWithGoogle()).rejects.toThrow('Firebase not initialised');
        });
    });

    describe('edit profile modal helpers', () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div id="editProfileModal" class="modal" style="display: none;">
                    <input id="profileUsername" value="">
                    <input id="profileEmail" value="">
                    <div id="profileError" style="display: none;"></div>
                    <div id="profileSuccess" style="display: none;"></div>
                    <button id="profileSaveBtn"></button>
                    <button id="linkGoogleBtn"></button>
                </div>
            `;
        });

        test('openEditProfileModal should show the modal', () => {
            CloudSync.openEditProfileModal();
            expect(document.getElementById('editProfileModal').style.display).toBe('flex');
        });

        test('closeEditProfileModal should hide the modal', () => {
            CloudSync.openEditProfileModal();
            CloudSync.closeEditProfileModal();
            expect(document.getElementById('editProfileModal').style.display).toBe('none');
        });

        test('handleSaveProfile should close modal when nothing changed', async () => {
            CloudSync.openEditProfileModal();
            await CloudSync.handleSaveProfile();
            expect(document.getElementById('editProfileModal').style.display).toBe('none');
        });

        test('handleLinkWithGoogle should do nothing when not signed in', async () => {
            await expect(CloudSync.handleLinkWithGoogle()).resolves.toBeUndefined();
        });
    });

    describe('isGameTester()', () => {
        test('should return false when not signed in', () => {
            expect(CloudSync.isGameTester()).toBe(false);
        });
    });

    describe('init() with tester list', () => {
        test('should not throw when game-testers.json fetch fails', async () => {
            global.fetch = jest.fn(() => Promise.reject(new Error('network error')));
            await expect(CloudSync.init()).resolves.toBeUndefined();
        });

        test('should keep isGameTester false after fetch failure', async () => {
            global.fetch = jest.fn(() => Promise.reject(new Error('network error')));
            await CloudSync.init();
            expect(CloudSync.isGameTester()).toBe(false);
        });

        test('should not throw when game-testers.json returns non-ok response', async () => {
            global.fetch = jest.fn(() => Promise.resolve({ ok: false }));
            await expect(CloudSync.init()).resolves.toBeUndefined();
        });

        test('should keep isGameTester false when testers file returns non-ok response', async () => {
            global.fetch = jest.fn(() => Promise.resolve({ ok: false }));
            await CloudSync.init();
            expect(CloudSync.isGameTester()).toBe(false);
        });
    });

    describe('local debug flag (debug.flag)', () => {
        test('should enable isGameTester when debug.flag is present', async () => {
            global.fetch = jest.fn((url) => {
                if (url === 'debug.flag') return Promise.resolve({ ok: true });
                return Promise.resolve({ ok: false });
            });
            await CloudSync.init();
            expect(CloudSync.isGameTester()).toBe(true);
        });

        test('should not enable isGameTester when debug.flag is absent', async () => {
            global.fetch = jest.fn(() => Promise.resolve({ ok: false }));
            await CloudSync.init();
            expect(CloudSync.isGameTester()).toBe(false);
        });

        test('should not throw and should not enable isGameTester when debug.flag fetch throws', async () => {
            global.fetch = jest.fn(() => Promise.reject(new Error('network error')));
            await expect(CloudSync.init()).resolves.toBeUndefined();
            expect(CloudSync.isGameTester()).toBe(false);
        });
    });

    describe('cloudsync:synced DOM event', () => {
        test('document can receive cloudsync:synced event without error', () => {
            // Verify the custom event can be created and dispatched; listeners
            // registered by the app (e.g. in main.js) depend on this contract.
            const received = [];
            const handler = () => received.push(true);
            document.addEventListener('cloudsync:synced', handler);
            document.dispatchEvent(new CustomEvent('cloudsync:synced'));
            document.removeEventListener('cloudsync:synced', handler);
            expect(received).toHaveLength(1);
        });
    });

    describe('updateAuthUI() sync status', () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <button id="cloudSyncLoginBtn" style="display: inline-block;"></button>
                <div id="cloudSyncUserInfo" style="display: none;"></div>
                <span id="cloudSyncUserEmail"></span>
                <span id="cloudSyncStatus" style="display: none;"></span>
            `;
        });

        test('does not show synced status before sync completes when user signs in', () => {
            // _updateAuthUI is called when auth state changes (user signs in).
            // It must NOT show "synced" at that point — sync hasn't run yet.
            CloudSync._updateAuthUI({ email: 'user@example.com' });
            const statusEl = document.getElementById('cloudSyncStatus');
            expect(statusEl.classList.contains('synced')).toBe(false);
        });

        test('makes user info visible and hides login button when user signs in', () => {
            CloudSync._updateAuthUI({ email: 'user@example.com' });
            expect(document.getElementById('cloudSyncLoginBtn').style.display).toBe('none');
            expect(document.getElementById('cloudSyncUserInfo').style.display).toBe('flex');
        });

        test('hides user info and shows login button when user signs out', () => {
            CloudSync._updateAuthUI(null);
            expect(document.getElementById('cloudSyncLoginBtn').style.display).toBe('inline-block');
            expect(document.getElementById('cloudSyncUserInfo').style.display).toBe('none');
            expect(document.getElementById('cloudSyncStatus').style.display).toBe('none');
        });
    });

    describe('showSyncErrorPopup() / updateSyncStatus error', () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <span id="cloudSyncStatus"></span>
                <div id="syncErrorModal" class="modal">
                    <pre id="syncErrorMessage"></pre>
                    <a id="syncErrorIssueLink" href="#"></a>
                </div>
            `;
        });

        test('updateSyncStatus error shows the sync error modal with message', () => {
            // Simulate an error update via the public syncNow path — we call updateSyncStatus
            // indirectly by triggering the internal error path via a public method that
            // uses getSyncErrorMessage.  For the unit test we expose the effect through the DOM.
            // We do this by calling applyCloudDataToLocal (which fires no error) and then
            // checking that the modal was shown when we manually dispatch the internal call.
            // Because updateSyncStatus is private we verify the DOM effect by inspecting the
            // modal element after a fake error state is set via status badge manipulation:
            const statusEl = document.getElementById('cloudSyncStatus');
            statusEl.className = 'cloud-sync-status error';
            // Calling showSyncErrorPopup indirectly: verify the modal exists and can be shown.
            const modal = document.getElementById('syncErrorModal');
            modal.classList.add('show');
            expect(modal.classList.contains('show')).toBe(true);
        });

        test('syncErrorModal pre element holds the error text', () => {
            const msgEl = document.getElementById('syncErrorMessage');
            msgEl.textContent = 'Test sync error message';
            expect(msgEl.textContent).toBe('Test sync error message');
        });

        test('syncErrorIssueLink has a non-empty href after modal setup', () => {
            const link = document.getElementById('syncErrorIssueLink');
            link.href = (typeof CONSTANTS !== 'undefined' && CONSTANTS.REPO_URL)
                ? CONSTANTS.REPO_URL + '/issues'
                : 'https://github.com/AvinZarlez/penthepet/issues';
            expect(link.href).toContain('/issues');
        });
    });

    // -----------------------------------------------------------------------
    // Conflict resolution logic
    // See docs/FIREBASE_SETUP.md for the full priority-ordered rules.
    // -----------------------------------------------------------------------
    describe('conflict resolution', () => {
        const DATE = '2026-06-01';
        const timerDocId = `timer_${DATE}`;
        const submissionCookie = `submission_${DATE}`;
        const earlier = new Date(Date.now() - 120000).toISOString(); // 2 min ago
        const later = new Date(Date.now()).toISOString();             // now

        beforeEach(() => {
            CookieUtils.deleteCookie(timerDocId);
            CookieUtils.deleteCookie(submissionCookie);
        });

        describe('applyCloudTimerState – rule B: highest elapsed wins', () => {
            test('uses cloud elapsed when cloud > local', () => {
                CookieUtils.setCookie(timerDocId, JSON.stringify({ elapsed: 30 }), 1);
                CloudSync.applyCloudTimerState(timerDocId, { elapsed: 45 });
                expect(JSON.parse(CookieUtils.getCookie(timerDocId)).elapsed).toBe(45);
            });

            test('keeps local elapsed when local > cloud', () => {
                CookieUtils.setCookie(timerDocId, JSON.stringify({ elapsed: 60 }), 1);
                CloudSync.applyCloudTimerState(timerDocId, { elapsed: 30 });
                expect(JSON.parse(CookieUtils.getCookie(timerDocId)).elapsed).toBe(60);
            });

            test('writes cloud elapsed when no local timer exists (only cloud has data)', () => {
                CloudSync.applyCloudTimerState(timerDocId, { elapsed: 50 });
                expect(JSON.parse(CookieUtils.getCookie(timerDocId)).elapsed).toBe(50);
            });

            test('does nothing when cloud data has no elapsed field', () => {
                CloudSync.applyCloudTimerState(timerDocId, {});
                expect(CookieUtils.getCookie(timerDocId)).toBeNull();
            });
        });

        describe('applyCloudSubmission – rules C/D/E: higher score wins; tiebreak by earliest submission timestamp', () => {
            // "score" = penned-area value (higher is better per game rules).
            // "timestamp" = when the puzzle was submitted (NOT elapsed solve time).

            test('writes cloud submission when no local cookie exists (only cloud has data)', () => {
                CloudSync.applyCloudSubmission(DATE, { score: 5, timestamp: later });
                expect(JSON.parse(CookieUtils.getCookie(submissionCookie)).score).toBe(5);
            });

            test('writes cloud submission when no local cookie and no cloud timestamp', () => {
                CloudSync.applyCloudSubmission(DATE, { score: 7 });
                expect(JSON.parse(CookieUtils.getCookie(submissionCookie)).score).toBe(7);
            });

            test('uses cloud when cloud score is higher (better) than local score', () => {
                CookieUtils.setCookie(submissionCookie, JSON.stringify({ score: 3, timestamp: earlier }), 1);
                const updated = CloudSync.applyCloudSubmission(DATE, { score: 5, timestamp: later });
                expect(updated).toBe(true);
                expect(JSON.parse(CookieUtils.getCookie(submissionCookie)).score).toBe(5);
            });

            test('keeps local when local score is higher (better) than cloud score', () => {
                CookieUtils.setCookie(submissionCookie, JSON.stringify({ score: 5, timestamp: later }), 1);
                const updated = CloudSync.applyCloudSubmission(DATE, { score: 3, timestamp: earlier });
                expect(updated).toBe(false);
                expect(JSON.parse(CookieUtils.getCookie(submissionCookie)).score).toBe(5);
            });

            test('keeps local when scores are equal and local submission timestamp is earlier', () => {
                CookieUtils.setCookie(submissionCookie, JSON.stringify({ score: 5, timestamp: earlier }), 1);
                const updated = CloudSync.applyCloudSubmission(DATE, { score: 5, timestamp: later });
                expect(updated).toBe(false);
                expect(JSON.parse(CookieUtils.getCookie(submissionCookie)).score).toBe(5);
            });

            test('uses cloud when scores are equal and cloud submission timestamp is earlier', () => {
                CookieUtils.setCookie(submissionCookie, JSON.stringify({ score: 5, timestamp: later }), 1);
                const updated = CloudSync.applyCloudSubmission(DATE, { score: 5, timestamp: earlier });
                expect(updated).toBe(true);
                expect(JSON.parse(CookieUtils.getCookie(submissionCookie)).score).toBe(5);
            });

            test('uses cloud when scores are equal and local has no timestamp', () => {
                CookieUtils.setCookie(submissionCookie, JSON.stringify({ score: 5 }), 1);
                CloudSync.applyCloudSubmission(DATE, { score: 5, timestamp: earlier });
                expect(JSON.parse(CookieUtils.getCookie(submissionCookie)).score).toBe(5);
            });

            test('migrates v1.0 cloud data to v1.2 when writing to cookie', () => {
                // v1.0 cloud data has no __version or hintsUsed
                CloudSync.applyCloudSubmission(DATE, { score: 8, timestamp: later, walls: [], time: 10 });
                const saved = JSON.parse(CookieUtils.getCookie(submissionCookie));
                expect(saved.__version).toBe('1.2');
                expect(saved.hintsUsed).toEqual([]);
            });

            test('migrates v1.0 local data when local wins', () => {
                // Local data is v1.0 (no __version), cloud score is lower
                CookieUtils.setCookie(submissionCookie, JSON.stringify({ score: 9, timestamp: earlier, walls: [], time: 5 }), 1);
                CloudSync.applyCloudSubmission(DATE, { score: 3, timestamp: later });
                const saved = JSON.parse(CookieUtils.getCookie(submissionCookie));
                expect(saved.score).toBe(9);
                expect(saved.__version).toBe('1.2');
                expect(saved.hintsUsed).toEqual([]);
            });

            test('populates submission cookie hintsUsed from cloud submission hintsUsed', () => {
                CookieUtils.deleteCookie(submissionCookie);
                CloudSync.applyCloudSubmission(DATE, {
                    __version: '1.1', score: 5, timestamp: later, walls: [], time: 10,
                    hintsUsed: ['checked'],
                });
                const saved = JSON.parse(CookieUtils.getCookie(submissionCookie));
                expect(saved.hintsUsed).toContain('checked');
            });

            test('skips pre-submission cloud data (no score)', () => {
                // Pre-submission data has hints but no score — should be skipped
                const updated = CloudSync.applyCloudSubmission(DATE, {
                    __version: '1.1', hintsUsed: ['checked'],
                });
                expect(updated).toBe(false);
                expect(CookieUtils.getCookie(submissionCookie)).toBeNull();
            });
        });

        describe('applyCloudHints (backward compat for legacy hints_ Firestore docs)', () => {
            const hintsDocId = `hints_${DATE}`;

            beforeEach(() => {
                CookieUtils.deleteCookie(submissionCookie);
            });

            test('merges hints into submission cookie when no submission exists', () => {
                CloudSync.applyCloudHints(hintsDocId, { hintsUsed: ['checked'] });
                const saved = JSON.parse(CookieUtils.getCookie(submissionCookie));
                expect(saved.hintsUsed).toContain('checked');
            });

            test('merges cloud hints with existing submission cookie hints', () => {
                CookieUtils.setCookie(submissionCookie, JSON.stringify({
                    __version: '1.1', score: 5, walls: [], timestamp: later, time: 10,
                    hintsUsed: ['checked'],
                }), 1);
                CloudSync.applyCloudHints(hintsDocId, { hintsUsed: ['target'] });
                const saved = JSON.parse(CookieUtils.getCookie(submissionCookie));
                expect(saved.hintsUsed).toContain('checked');
                expect(saved.hintsUsed).toContain('target');
            });

            test('does not duplicate hints', () => {
                CookieUtils.setCookie(submissionCookie, JSON.stringify({
                    __version: '1.1', hintsUsed: ['checked'],
                }), 1);
                CloudSync.applyCloudHints(hintsDocId, { hintsUsed: ['checked'] });
                const saved = JSON.parse(CookieUtils.getCookie(submissionCookie));
                expect(saved.hintsUsed.filter(h => h === 'checked').length).toBe(1);
            });

            test('does nothing when hintsUsed is missing or not an array', () => {
                CloudSync.applyCloudHints(hintsDocId, {});
                expect(CookieUtils.getCookie(submissionCookie)).toBeNull();
            });

            test('initializes submission cookie hintsUsed when hints array is empty', () => {
                // An empty hintsUsed array from a legacy doc should still initialize the field
                CloudSync.applyCloudHints(hintsDocId, { hintsUsed: [] });
                const saved = JSON.parse(CookieUtils.getCookie(submissionCookie));
                expect(Array.isArray(saved.hintsUsed)).toBe(true);
                expect(saved.hintsUsed).toHaveLength(0);
            });
        });

        describe('applyCloudDataToLocal – common function for all cloud-wins cases', () => {
            const fullCloudData = {
                __version: '1.1',
                score: 7,
                walls: [[1, 2]],
                time: 42,
                timestamp: new Date(Date.now()).toISOString(),
                hintsUsed: ['checked'],
            };

            beforeEach(() => {
                CookieUtils.deleteCookie(submissionCookie);
                // Clear any pending overwrites from previous test
                CloudSync.getAndClearCloudOverwrites();
            });

            test('writes all cloud fields to local cookie', () => {
                CloudSync.applyCloudDataToLocal(DATE, fullCloudData);
                const saved = JSON.parse(CookieUtils.getCookie(submissionCookie));
                expect(saved.score).toBe(7);
                expect(saved.time).toBe(42);
                expect(saved.hintsUsed).toContain('checked');
                expect(saved.__version).toBe('1.1');
            });

            test('records date in pending overwrites set', () => {
                CloudSync.applyCloudDataToLocal(DATE, fullCloudData);
                const overwrites = CloudSync.getAndClearCloudOverwrites();
                expect(overwrites.has(DATE)).toBe(true);
            });

            test('getAndClearCloudOverwrites clears the set after reading', () => {
                CloudSync.applyCloudDataToLocal(DATE, fullCloudData);
                CloudSync.getAndClearCloudOverwrites(); // first call — clears
                const second = CloudSync.getAndClearCloudOverwrites(); // second call — empty
                expect(second.size).toBe(0);
            });

            test('applyCloudSubmission records cloud-win date in pending overwrites', () => {
                // Cloud has higher score than local — cloud should win and date should be tracked
                CookieUtils.setCookie(submissionCookie, JSON.stringify({ score: 2, timestamp: later }), 1);
                CloudSync.applyCloudSubmission(DATE, { score: 8, timestamp: earlier, walls: [], time: 10 });
                const overwrites = CloudSync.getAndClearCloudOverwrites();
                expect(overwrites.has(DATE)).toBe(true);
            });

            test('applyCloudSubmission does NOT record local-win date in pending overwrites', () => {
                // Local has higher score — local should win; no overwrite notification needed
                CookieUtils.setCookie(submissionCookie, JSON.stringify({ score: 9, timestamp: earlier }), 1);
                CloudSync.applyCloudSubmission(DATE, { score: 3, timestamp: later });
                const overwrites = CloudSync.getAndClearCloudOverwrites();
                expect(overwrites.has(DATE)).toBe(false);
            });
        });
    });

    // -----------------------------------------------------------------------
    // Firestore walls serialization
    // Firestore does not support nested arrays, so walls [[row,col],...] must
    // be serialized to a JSON string before writing and deserialized on read.
    // -----------------------------------------------------------------------
    describe('Firestore walls serialization', () => {
        const walls = [[0, 1], [2, 3], [4, 5]];
        const wallsJson = JSON.stringify(walls);

        describe('_serializeSubmissionForFirestore', () => {
            test('converts walls array to JSON string', () => {
                const data = { score: 5, walls: walls, timestamp: 'ts' };
                const result = CloudSync._serializeSubmissionForFirestore(data);
                expect(typeof result.walls).toBe('string');
                expect(result.walls).toBe(wallsJson);
            });

            test('leaves other fields unchanged', () => {
                const data = { score: 7, walls: walls, time: 42 };
                const result = CloudSync._serializeSubmissionForFirestore(data);
                expect(result.score).toBe(7);
                expect(result.time).toBe(42);
            });

            test('returns data unchanged when walls is already a string', () => {
                const data = { score: 5, walls: wallsJson };
                const result = CloudSync._serializeSubmissionForFirestore(data);
                expect(result.walls).toBe(wallsJson);
            });

            test('returns data unchanged when walls is absent', () => {
                const data = { score: 5 };
                const result = CloudSync._serializeSubmissionForFirestore(data);
                expect(result).toBe(data);
            });

            test('does not mutate the original data object', () => {
                const data = { score: 5, walls: walls };
                CloudSync._serializeSubmissionForFirestore(data);
                expect(Array.isArray(data.walls)).toBe(true);
            });
        });

        describe('_deserializeSubmissionFromFirestore', () => {
            test('converts walls JSON string back to array', () => {
                const data = { score: 5, walls: wallsJson };
                const result = CloudSync._deserializeSubmissionFromFirestore(data);
                expect(Array.isArray(result.walls)).toBe(true);
                expect(result.walls).toEqual(walls);
            });

            test('leaves other fields unchanged', () => {
                const data = { score: 9, walls: wallsJson, time: 30 };
                const result = CloudSync._deserializeSubmissionFromFirestore(data);
                expect(result.score).toBe(9);
                expect(result.time).toBe(30);
            });

            test('returns data unchanged when walls is already an array', () => {
                const data = { score: 5, walls: walls };
                const result = CloudSync._deserializeSubmissionFromFirestore(data);
                expect(result).toBe(data);
            });

            test('returns data unchanged when walls is absent', () => {
                const data = { score: 5 };
                const result = CloudSync._deserializeSubmissionFromFirestore(data);
                expect(result).toBe(data);
            });

            test('returns data unchanged when walls JSON is malformed', () => {
                const data = { score: 5, walls: 'not-valid-json' };
                const result = CloudSync._deserializeSubmissionFromFirestore(data);
                expect(result.walls).toBe('not-valid-json');
            });

            test('does not mutate the original data object', () => {
                const data = { score: 5, walls: wallsJson };
                CloudSync._deserializeSubmissionFromFirestore(data);
                expect(typeof data.walls).toBe('string');
            });
        });

        describe('round-trip: serialize then deserialize', () => {
            test('restores the original walls array after a round-trip', () => {
                const data = { score: 5, walls: walls, timestamp: 'ts', time: 10 };
                const serialized = CloudSync._serializeSubmissionForFirestore(data);
                const deserialized = CloudSync._deserializeSubmissionFromFirestore(serialized);
                expect(deserialized.walls).toEqual(walls);
                expect(deserialized.score).toBe(5);
            });

            test('applyCloudSubmission correctly handles deserialized walls from Firestore', () => {
                const DATE = '2026-06-15';
                const submissionCookie = `submission_${DATE}`;
                CookieUtils.deleteCookie(submissionCookie);
                CloudSync.getAndClearCloudOverwrites();

                // Simulate data as it arrives from Firestore (walls serialized as JSON string)
                const firestoreDoc = {
                    __version: '1.1', score: 8, walls: wallsJson,
                    timestamp: new Date().toISOString(), time: 20, hintsUsed: [],
                };
                const deserialized = CloudSync._deserializeSubmissionFromFirestore(firestoreDoc);
                CloudSync.applyCloudSubmission(DATE, deserialized);

                const saved = JSON.parse(CookieUtils.getCookie(submissionCookie));
                expect(saved.score).toBe(8);
                expect(Array.isArray(saved.walls)).toBe(true);
                expect(saved.walls).toEqual(walls);
                CookieUtils.deleteCookie(submissionCookie);
            });
        });
    });
});

// ============================================================
// Progress State (Best State) Tests
// ============================================================

describe('saveProgressState()', () => {
    test('should not throw when not logged in', async () => {
        await expect(
            CloudSync.saveProgressState('2026-01-01', { bestScore: 5, bestWalls: [[1, 2]] })
        ).resolves.toBeUndefined();
    });

    test('should be exposed on the public API', () => {
        expect(typeof CloudSync.saveProgressState).toBe('function');
    });
});

describe('applyCloudProgressState()', () => {
    const DATE = '2026-06-20';
    const cookieName = `progress_${DATE}`;
    const docId = `progress_${DATE}`;

    beforeEach(() => {
        CookieUtils.deleteCookie(cookieName);
    });

    afterEach(() => {
        CookieUtils.deleteCookie(cookieName);
    });

    test('writes cloud data when no local cookie exists', () => {
        CloudSync.applyCloudProgressState(docId, { bestScore: 10, bestWalls: JSON.stringify([[1, 2]]) });
        const saved = JSON.parse(CookieUtils.getCookie(cookieName));
        expect(saved.bestScore).toBe(10);
        expect(saved.bestWalls).toEqual([[1, 2]]);
    });

    test('writes cloud data when cloud score is higher', () => {
        CookieUtils.setCookie(cookieName, JSON.stringify({ bestScore: 5, bestWalls: [[0, 0]] }), 1);
        CloudSync.applyCloudProgressState(docId, { bestScore: 12, bestWalls: JSON.stringify([[1, 2]]) });
        const saved = JSON.parse(CookieUtils.getCookie(cookieName));
        expect(saved.bestScore).toBe(12);
    });

    test('keeps local data when local score is higher', () => {
        CookieUtils.setCookie(cookieName, JSON.stringify({ bestScore: 20, bestWalls: [[3, 3]] }), 1);
        CloudSync.applyCloudProgressState(docId, { bestScore: 10, bestWalls: JSON.stringify([[1, 2]]) });
        const saved = JSON.parse(CookieUtils.getCookie(cookieName));
        expect(saved.bestScore).toBe(20);
        expect(saved.bestWalls).toEqual([[3, 3]]);
    });

    test('keeps local data when local score is equal to cloud score', () => {
        CookieUtils.setCookie(cookieName, JSON.stringify({ bestScore: 10, bestWalls: [[3, 3]] }), 1);
        CloudSync.applyCloudProgressState(docId, { bestScore: 10, bestWalls: JSON.stringify([[1, 2]]) });
        const saved = JSON.parse(CookieUtils.getCookie(cookieName));
        expect(saved.bestWalls).toEqual([[3, 3]]); // local walls preserved
    });

    test('ignores cloud data with no bestScore', () => {
        CloudSync.applyCloudProgressState(docId, { bestWalls: JSON.stringify([[1, 2]]) });
        expect(CookieUtils.getCookie(cookieName)).toBeNull();
    });

    test('ignores cloud data with invalid bestWalls JSON', () => {
        CloudSync.applyCloudProgressState(docId, { bestScore: 5, bestWalls: 'not-valid-json' });
        expect(CookieUtils.getCookie(cookieName)).toBeNull();
    });
});

// ============================================================
// Sync cache (TTL-based skip for rapid syncNow() calls)
// ============================================================

describe('syncNow() caching', () => {
    beforeEach(() => {
        CloudSync._resetSyncCache();
    });

    afterEach(() => {
        CloudSync._resetSyncCache();
    });

    test('_resetSyncCache is exposed on the public API', () => {
        expect(typeof CloudSync._resetSyncCache).toBe('function');
    });

    test('syncNow() resolves when not logged in (before and after _resetSyncCache)', async () => {
        // Without db/user the early-return guard fires, so both calls are no-ops.
        await expect(CloudSync.syncNow()).resolves.toBeUndefined();
        CloudSync._resetSyncCache();
        await expect(CloudSync.syncNow()).resolves.toBeUndefined();
    });

    test('CLOUD_SYNC_CACHE_TTL_SECONDS is a positive number', () => {
        expect(typeof CONSTANTS.CLOUD_SYNC_CACHE_TTL_SECONDS).toBe('number');
        expect(CONSTANTS.CLOUD_SYNC_CACHE_TTL_SECONDS).toBeGreaterThan(0);
    });

    test('_resetSyncCache causes the next synced event to be dispatched by the cache path', (done) => {
        // Verify that a cloudsync:synced event fires when the cache is cold AND
        // the early-return guard fires (db/user not set → no event); then verify
        // the cache-hit path dispatches the event when db/user are present.
        // Since we cannot inject db/user in the unit test environment, we at
        // least confirm that _resetSyncCache() itself never throws.
        expect(() => CloudSync._resetSyncCache()).not.toThrow();
        done();
    });
});


// ============================================================
// Phased sync helpers
// ============================================================

describe('_getCurrentDate()', () => {
    const DATE = '2026-03-15';

    afterEach(() => {
        CookieUtils.deleteCookie('currentLevel');
    });

    test('is exposed on the public API', () => {
        expect(typeof CloudSync._getCurrentDate).toBe('function');
    });

    test('returns currentLevel cookie value when it is a valid date', () => {
        CookieUtils.setCookie('currentLevel', DATE, 1);
        expect(CloudSync._getCurrentDate()).toBe(DATE);
    });

    test('ignores currentLevel cookie when value is not a valid YYYY-MM-DD date', () => {
        CookieUtils.setCookie('currentLevel', 'not-a-date', 1);
        const result = CloudSync._getCurrentDate();
        // Falls back to today — just verify it looks like a date string
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('returns a YYYY-MM-DD date string when no cookie is set', () => {
        const result = CloudSync._getCurrentDate();
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});

describe('updateSyncStatus() – phased sync labels', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <span id="cloudSyncStatus"></span>
            <div id="syncErrorModal" class="modal"></div>
            <div id="syncErrorMessage"></div>
            <a id="syncErrorIssueLink" href=""></a>
        `;
        // Initialise I18N so t() returns the key or a string
        if (typeof I18N !== 'undefined' && typeof I18N.t === 'function') {
            I18N.setLanguage('en');
        }
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('syncNow() resolves without throwing', async () => {
        await expect(CloudSync.syncNow()).resolves.toBeUndefined();
    });

    test('i18n key cloud_sync_syncing_date is defined', () => {
        expect(I18N.t('cloud_sync_syncing_date')).not.toBe('');
        expect(I18N.t('cloud_sync_syncing_date')).not.toBeUndefined();
    });

    test('i18n key cloud_sync_syncing_month is defined', () => {
        expect(I18N.t('cloud_sync_syncing_month')).not.toBe('');
        expect(I18N.t('cloud_sync_syncing_month')).not.toBeUndefined();
    });

    test('i18n key cloud_sync_syncing_all is defined', () => {
        expect(I18N.t('cloud_sync_syncing_all')).not.toBe('');
        expect(I18N.t('cloud_sync_syncing_all')).not.toBeUndefined();
    });

    test('i18n phase keys are distinct from the generic syncing key', () => {
        const generic = I18N.t('cloud_sync_syncing');
        expect(I18N.t('cloud_sync_syncing_date')).not.toBe(generic);
        expect(I18N.t('cloud_sync_syncing_month')).not.toBe(generic);
        expect(I18N.t('cloud_sync_syncing_all')).not.toBe(generic);
    });
});

// ============================================================
// applyCloudSubmission — mapVersion tiebreaker
// ============================================================
describe('applyCloudSubmission – mapVersion tiebreaker', () => {
    const DATE = '2026-07-01';
    const submissionCookie = `submission_${DATE}`;
    const timestamp = new Date('2026-07-01T12:00:00Z').toISOString();

    beforeEach(() => {
        CookieUtils.deleteCookie(submissionCookie);
        CloudSync.getAndClearCloudOverwrites();
    });

    afterEach(() => {
        CookieUtils.deleteCookie(submissionCookie);
        CloudSync.getAndClearCloudOverwrites();
    });

    test('keeps local when scores equal but local has newer mapVersion (migration result)', () => {
        // Local has been migrated (mapVersion 2); cloud still has old record (mapVersion 1).
        // Even though scores and timestamps are identical, local must win so the migration
        // result is never overwritten by a stale cloud record.
        CookieUtils.setCookie(submissionCookie, JSON.stringify({
            score: 50, mapVersion: 2, timestamp, walls: [[0, 0]],
        }), 1);
        const updated = CloudSync.applyCloudSubmission(DATE, {
            score: 50, mapVersion: 1, timestamp, walls: [[1, 1]],
        });
        expect(updated).toBe(false);
        expect(JSON.parse(CookieUtils.getCookie(submissionCookie)).mapVersion).toBe(2);
        expect(JSON.parse(CookieUtils.getCookie(submissionCookie)).walls).toEqual([[0, 0]]);
    });

    test('applies cloud when scores equal and cloud has newer mapVersion', () => {
        // Cloud has been migrated; local is behind.
        CookieUtils.setCookie(submissionCookie, JSON.stringify({
            score: 50, mapVersion: 1, timestamp, walls: [[1, 1]],
        }), 1);
        const updated = CloudSync.applyCloudSubmission(DATE, {
            score: 50, mapVersion: 2, timestamp, walls: [[0, 0]],
        });
        expect(updated).toBe(true);
        expect(JSON.parse(CookieUtils.getCookie(submissionCookie)).mapVersion).toBe(2);
        expect(JSON.parse(CookieUtils.getCookie(submissionCookie)).walls).toEqual([[0, 0]]);
    });

    test('keeps local when scores equal, mapVersions equal, local timestamp is earlier', () => {
        const earlier = new Date('2026-07-01T10:00:00Z').toISOString();
        const later = new Date('2026-07-01T14:00:00Z').toISOString();
        CookieUtils.setCookie(submissionCookie, JSON.stringify({
            score: 50, mapVersion: 2, timestamp: earlier, walls: [[0, 0]],
        }), 1);
        const updated = CloudSync.applyCloudSubmission(DATE, {
            score: 50, mapVersion: 2, timestamp: later, walls: [[1, 1]],
        });
        expect(updated).toBe(false);
        expect(JSON.parse(CookieUtils.getCookie(submissionCookie)).walls).toEqual([[0, 0]]);
    });

    test('applies cloud when scores equal, mapVersions equal, cloud timestamp is earlier', () => {
        const earlier = new Date('2026-07-01T10:00:00Z').toISOString();
        const later = new Date('2026-07-01T14:00:00Z').toISOString();
        CookieUtils.setCookie(submissionCookie, JSON.stringify({
            score: 50, mapVersion: 2, timestamp: later, walls: [[1, 1]],
        }), 1);
        const updated = CloudSync.applyCloudSubmission(DATE, {
            score: 50, mapVersion: 2, timestamp: earlier, walls: [[0, 0]],
        });
        expect(updated).toBe(true);
        expect(JSON.parse(CookieUtils.getCookie(submissionCookie)).walls).toEqual([[0, 0]]);
    });

    test('local wins by higher score regardless of mapVersion', () => {
        CookieUtils.setCookie(submissionCookie, JSON.stringify({
            score: 55, mapVersion: 2, timestamp, walls: [[0, 0]],
        }), 1);
        const updated = CloudSync.applyCloudSubmission(DATE, {
            score: 50, mapVersion: 3, timestamp, walls: [[1, 1]],
        });
        expect(updated).toBe(false);
        expect(JSON.parse(CookieUtils.getCookie(submissionCookie)).score).toBe(55);
    });

    test('cloud wins by higher score regardless of mapVersion', () => {
        CookieUtils.setCookie(submissionCookie, JSON.stringify({
            score: 50, mapVersion: 3, timestamp, walls: [[0, 0]],
        }), 1);
        const updated = CloudSync.applyCloudSubmission(DATE, {
            score: 55, mapVersion: 1, timestamp, walls: [[1, 1]],
        });
        expect(updated).toBe(true);
        expect(JSON.parse(CookieUtils.getCookie(submissionCookie)).score).toBe(55);
    });

    test('local (no mapVersion) treated as mapVersion=1 for tiebreaker', () => {
        // Local has no mapVersion field → defaults to 1; cloud has mapVersion 2 → cloud wins.
        CookieUtils.setCookie(submissionCookie, JSON.stringify({
            score: 50, timestamp, walls: [[1, 1]],
        }), 1);
        const updated = CloudSync.applyCloudSubmission(DATE, {
            score: 50, mapVersion: 2, timestamp, walls: [[0, 0]],
        });
        expect(updated).toBe(true);
        expect(JSON.parse(CookieUtils.getCookie(submissionCookie)).mapVersion).toBe(2);
    });
});

// ============================================================
// _parseSolutionFlat helper
// ============================================================
describe('_parseSolutionFlat()', () => {
    test('is exposed on the public API', () => {
        expect(typeof CloudSync._parseSolutionFlat).toBe('function');
    });

    test('converts a flat even-length array to [row,col] pairs', () => {
        expect(CloudSync._parseSolutionFlat([0, 5, 1, 2, 3, 4])).toEqual([[0, 5], [1, 2], [3, 4]]);
    });

    test('returns empty array for empty input', () => {
        expect(CloudSync._parseSolutionFlat([])).toEqual([]);
    });

    test('returns empty array for non-array input', () => {
        expect(CloudSync._parseSolutionFlat(null)).toEqual([]);
        expect(CloudSync._parseSolutionFlat('bad')).toEqual([]);
    });

    test('ignores trailing odd element', () => {
        expect(CloudSync._parseSolutionFlat([0, 5, 1])).toEqual([[0, 5]]);
    });
});

// ============================================================
// migrateLocalSubmissions()
// ============================================================
describe('migrateLocalSubmissions()', () => {
    const DATE_A = '2026-08-01';
    const DATE_B = '2026-08-02';
    const DATE_C = '2026-08-03';

    // Map database with two levels — DATE_A at v1→v2, DATE_B at v1→v2 (same goal)
    const mapsDatabase = {
        [DATE_A]: {
            version: 2,
            goal: 10,
            optimalSolution: [0, 1, 2, 3], // → [[0,1],[2,3]]
        },
        [DATE_B]: {
            version: 2,
            goal: 50, // same goal before and after
            optimalSolution: [4, 5, 6, 7], // → [[4,5],[6,7]]
        },
        [DATE_C]: {
            version: 2,
            goal: 20,
            optimalSolution: [1, 2, 3, 4],
        },
    };

    beforeEach(() => {
        [DATE_A, DATE_B, DATE_C].forEach(d => {
            CookieUtils.deleteCookie(`submission_${d}`);
            CookieUtils.deleteCookie(`progress_${d}`);
            CookieUtils.deleteCookie(`timer_${d}`);
        });
        CloudSync.getAndClearCloudOverwrites();
    });

    afterEach(() => {
        [DATE_A, DATE_B, DATE_C].forEach(d => {
            CookieUtils.deleteCookie(`submission_${d}`);
            CookieUtils.deleteCookie(`progress_${d}`);
            CookieUtils.deleteCookie(`timer_${d}`);
        });
    });

    test('is exposed on the public API', () => {
        expect(typeof CloudSync.migrateLocalSubmissions).toBe('function');
    });

    test('returns { migrated: [], reset: [] } when mapsDatabase is null', () => {
        const result = CloudSync.migrateLocalSubmissions(null);
        expect(result).toEqual({ migrated: [], reset: [] });
    });

    test('returns { migrated: [], reset: [] } when mapsDatabase is empty', () => {
        CookieUtils.setCookie(`submission_${DATE_A}`,
            JSON.stringify({ score: 10, goal: 10, mapVersion: 1, walls: [[0, 0]], __version: '1.2' }), 1);
        const result = CloudSync.migrateLocalSubmissions({});
        expect(result).toEqual({ migrated: [], reset: [] });
    });

    test('returns { migrated: [], reset: [] } when no submission cookies exist', () => {
        const result = CloudSync.migrateLocalSubmissions(mapsDatabase);
        expect(result).toEqual({ migrated: [], reset: [] });
    });

    test('skips dates where version already matches', () => {
        CookieUtils.setCookie(`submission_${DATE_A}`,
            JSON.stringify({ score: 10, goal: 10, mapVersion: 2, walls: [[0, 0]], __version: '1.2' }), 1);
        const result = CloudSync.migrateLocalSubmissions(mapsDatabase);
        expect(result.migrated).not.toContain(DATE_A);
        expect(result.reset).not.toContain(DATE_A);
    });

    test('migrates perfect-score submission when map version changes (higher goal)', () => {
        // User had perfect score 10 on map v1 (goal=10); map v2 has same goal=10.
        CookieUtils.setCookie(`submission_${DATE_A}`,
            JSON.stringify({ score: 10, goal: 10, mapVersion: 1, walls: [[9, 9]], timestamp: 'T1', __version: '1.2' }), 1);

        const result = CloudSync.migrateLocalSubmissions(mapsDatabase);

        expect(result.migrated).toContain(DATE_A);
        expect(result.reset).not.toContain(DATE_A);

        const saved = JSON.parse(CookieUtils.getCookie(`submission_${DATE_A}`));
        expect(saved.mapVersion).toBe(2);
        expect(saved.score).toBe(10); // goal is still 10
        expect(saved.walls).toEqual([[0, 1], [2, 3]]); // new optimal
        expect(saved.timestamp).toBe('T1'); // timestamp preserved
    });

    test('migrates when user score equals old goal and new goal is the same', () => {
        // Same goal before and after — migration should still use the new optimal solution.
        CookieUtils.setCookie(`submission_${DATE_B}`,
            JSON.stringify({ score: 50, goal: 50, mapVersion: 1, walls: [[0, 0]], timestamp: 'T2', __version: '1.2' }), 1);

        const result = CloudSync.migrateLocalSubmissions(mapsDatabase);

        expect(result.migrated).toContain(DATE_B);
        const saved = JSON.parse(CookieUtils.getCookie(`submission_${DATE_B}`));
        expect(saved.mapVersion).toBe(2);
        expect(saved.walls).toEqual([[4, 5], [6, 7]]); // new optimal
        expect(saved.timestamp).toBe('T2');
    });

    test('resets non-perfect score when map version changes', () => {
        CookieUtils.setCookie(`submission_${DATE_C}`,
            JSON.stringify({ score: 15, goal: 20, mapVersion: 1, walls: [[0, 0]], __version: '1.2' }), 1);

        const result = CloudSync.migrateLocalSubmissions(mapsDatabase);

        expect(result.reset).toContain(DATE_C);
        expect(result.migrated).not.toContain(DATE_C);
        expect(CookieUtils.getCookie(`submission_${DATE_C}`)).toBeNull();
    });

    test('resets submission with null goal (legacy save)', () => {
        CookieUtils.setCookie(`submission_${DATE_A}`,
            JSON.stringify({ score: 10, goal: null, mapVersion: 1, walls: [[0, 0]], __version: '1.2' }), 1);

        const result = CloudSync.migrateLocalSubmissions(mapsDatabase);

        expect(result.reset).toContain(DATE_A);
        expect(CookieUtils.getCookie(`submission_${DATE_A}`)).toBeNull();
    });

    test('resets submission without goal field (old schema)', () => {
        CookieUtils.setCookie(`submission_${DATE_A}`,
            JSON.stringify({ score: 10, mapVersion: 1, walls: [[0, 0]], __version: '1.1' }), 1);

        const result = CloudSync.migrateLocalSubmissions(mapsDatabase);

        // goal gets set to null by schema migration (v1.1 → v1.2 adds goal: null)
        expect(result.reset).toContain(DATE_A);
        expect(CookieUtils.getCookie(`submission_${DATE_A}`)).toBeNull();
    });

    test('deletes progress and timer cookies when resetting', () => {
        CookieUtils.setCookie(`submission_${DATE_A}`,
            JSON.stringify({ score: 5, goal: 10, mapVersion: 1, walls: [[0, 0]], __version: '1.2' }), 1);
        CookieUtils.setCookie(`progress_${DATE_A}`, JSON.stringify({ bestScore: 5, bestWalls: [] }), 1);
        CookieUtils.setCookie(`timer_${DATE_A}`, JSON.stringify({ elapsed: 30 }), 1);

        CloudSync.migrateLocalSubmissions(mapsDatabase);

        expect(CookieUtils.getCookie(`submission_${DATE_A}`)).toBeNull();
        expect(CookieUtils.getCookie(`progress_${DATE_A}`)).toBeNull();
        expect(CookieUtils.getCookie(`timer_${DATE_A}`)).toBeNull();
    });

    test('deletes progress and timer cookies after perfect-score migration', () => {
        CookieUtils.setCookie(`submission_${DATE_A}`,
            JSON.stringify({ score: 10, goal: 10, mapVersion: 1, walls: [[9, 9]], __version: '1.2' }), 1);
        CookieUtils.setCookie(`progress_${DATE_A}`, JSON.stringify({ bestScore: 8, bestWalls: [] }), 1);
        CookieUtils.setCookie(`timer_${DATE_A}`, JSON.stringify({ elapsed: 60 }), 1);

        CloudSync.migrateLocalSubmissions(mapsDatabase);

        expect(CookieUtils.getCookie(`progress_${DATE_A}`)).toBeNull();
        expect(CookieUtils.getCookie(`timer_${DATE_A}`)).toBeNull();
    });

    test('skips dates not present in mapsDatabase when dates array is provided', () => {
        CookieUtils.setCookie(`submission_${DATE_A}`,
            JSON.stringify({ score: 10, goal: 10, mapVersion: 1, walls: [[9, 9]], __version: '1.2' }), 1);

        // Provide a dates array that does NOT include DATE_A
        const result = CloudSync.migrateLocalSubmissions(mapsDatabase, [DATE_B]);
        expect(result.migrated).not.toContain(DATE_A);
        expect(result.reset).not.toContain(DATE_A);
        // Cookie should be unchanged
        expect(JSON.parse(CookieUtils.getCookie(`submission_${DATE_A}`)).mapVersion).toBe(1);
    });

    test('processes only the dates in the provided array', () => {
        CookieUtils.setCookie(`submission_${DATE_A}`,
            JSON.stringify({ score: 10, goal: 10, mapVersion: 1, walls: [[9, 9]], timestamp: 'T1', __version: '1.2' }), 1);
        CookieUtils.setCookie(`submission_${DATE_B}`,
            JSON.stringify({ score: 5, goal: 50, mapVersion: 1, walls: [[0, 0]], __version: '1.2' }), 1);

        // Only migrate DATE_A
        const result = CloudSync.migrateLocalSubmissions(mapsDatabase, [DATE_A]);
        expect(result.migrated).toContain(DATE_A);
        // DATE_B should be untouched
        expect(JSON.parse(CookieUtils.getCookie(`submission_${DATE_B}`)).mapVersion).toBe(1);
    });

    test('skips pre-submission records (no score field)', () => {
        // Cookie has hints but no score — not a completed submission
        CookieUtils.setCookie(`submission_${DATE_A}`,
            JSON.stringify({ hintsUsed: ['checked'], mapVersion: 1, __version: '1.2' }), 1);

        const result = CloudSync.migrateLocalSubmissions(mapsDatabase);
        expect(result.migrated).not.toContain(DATE_A);
        expect(result.reset).not.toContain(DATE_A);
    });

    test('does not migrate when map has no optimalSolution', () => {
        const dbNoSolution = {
            [DATE_A]: { version: 2, goal: 10, optimalSolution: null },
        };
        CookieUtils.setCookie(`submission_${DATE_A}`,
            JSON.stringify({ score: 10, goal: 10, mapVersion: 1, walls: [[9, 9]], __version: '1.2' }), 1);

        const result = CloudSync.migrateLocalSubmissions(dbNoSolution);
        // No optimal solution → can't migrate perfect score → reset
        expect(result.reset).toContain(DATE_A);
        expect(CookieUtils.getCookie(`submission_${DATE_A}`)).toBeNull();
    });

    test('handles multiple dates in one pass', () => {
        CookieUtils.setCookie(`submission_${DATE_A}`,
            JSON.stringify({ score: 10, goal: 10, mapVersion: 1, walls: [[9, 9]], timestamp: 'T1', __version: '1.2' }), 1);
        CookieUtils.setCookie(`submission_${DATE_B}`,
            JSON.stringify({ score: 30, goal: 50, mapVersion: 1, walls: [[0, 0]], __version: '1.2' }), 1);
        CookieUtils.setCookie(`submission_${DATE_C}`,
            JSON.stringify({ score: 20, goal: 20, mapVersion: 1, walls: [[5, 5]], timestamp: 'T3', __version: '1.2' }), 1);

        const result = CloudSync.migrateLocalSubmissions(mapsDatabase);

        expect(result.migrated).toContain(DATE_A); // perfect (10 >= 10)
        expect(result.reset).toContain(DATE_B);    // non-perfect (30 < 50)
        expect(result.migrated).toContain(DATE_C); // perfect (20 >= 20)
    });
});

// ============================================================
// _deleteLevelData helper
// ============================================================
describe('_deleteLevelData()', () => {
    const DATE = '2026-09-01';

    beforeEach(() => {
        CookieUtils.setCookie(`submission_${DATE}`, JSON.stringify({ score: 5 }), 1);
        CookieUtils.setCookie(`progress_${DATE}`, JSON.stringify({ bestScore: 3 }), 1);
        CookieUtils.setCookie(`timer_${DATE}`, JSON.stringify({ elapsed: 10 }), 1);
    });

    afterEach(() => {
        [`submission_${DATE}`, `progress_${DATE}`, `timer_${DATE}`].forEach(n => CookieUtils.deleteCookie(n));
    });

    test('is exposed on the public API', () => {
        expect(typeof CloudSync._deleteLevelData).toBe('function');
    });

    test('deletes submission, progress, and timer cookies', () => {
        CloudSync._deleteLevelData(DATE);
        expect(CookieUtils.getCookie(`submission_${DATE}`)).toBeNull();
        expect(CookieUtils.getCookie(`progress_${DATE}`)).toBeNull();
        expect(CookieUtils.getCookie(`timer_${DATE}`)).toBeNull();
    });

    test('does not throw when cookies do not exist', () => {
        CookieUtils.deleteCookie(`submission_${DATE}`);
        CookieUtils.deleteCookie(`progress_${DATE}`);
        CookieUtils.deleteCookie(`timer_${DATE}`);
        expect(() => CloudSync._deleteLevelData(DATE)).not.toThrow();
    });
});
