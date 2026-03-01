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
                    <input id="authEmail" value="">
                    <input id="authPassword" value="">
                    <div id="authError" style="display: none;"></div>
                    <button id="authSignInBtn"></button>
                    <button id="authSignUpBtn"></button>
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

        test('handleSignIn should show error when fields are empty', async () => {
            await CloudSync.handleSignIn();
            const error = document.getElementById('authError');
            expect(error.style.display).toBe('block');
            expect(error.textContent).toContain('email');
        });

        test('handleSignUp should show error when fields are empty', async () => {
            await CloudSync.handleSignUp();
            const error = document.getElementById('authError');
            expect(error.style.display).toBe('block');
            expect(error.textContent).toContain('email');
        });
    });
});
