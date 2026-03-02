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
});
