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

    // -----------------------------------------------------------------------
    // Conflict resolution logic
    // See docs/CLOUD_SYNC_SETUP.md for the full priority-ordered rules.
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

        describe('applyCloudTimerState – rule 3: highest elapsed wins', () => {
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

        describe('applyCloudSubmission – rule 4: higher score wins; tiebreak by earliest submission timestamp', () => {
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
        });
    });
});
