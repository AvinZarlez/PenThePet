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

    describe('edit profile modal helpers', () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div id="editProfileModal" class="modal" style="display: none;">
                    <input id="profileUsername" value="">
                    <input id="profileEmail" value="">
                    <div id="profileError" style="display: none;"></div>
                    <button id="profileSaveBtn"></button>
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
    });

    describe('passwordless sign-in modal helpers', () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div id="cloudSyncModal" class="modal" style="display: none;">
                    <div id="authPasswordView">
                        <input id="authEmail" value="">
                        <input id="authPassword" value="">
                        <div id="authError" style="display: none;"></div>
                        <button id="authSignInBtn"></button>
                        <button id="authSignUpBtn"></button>
                    </div>
                    <div id="authPasswordlessView" style="display: none;">
                        <input id="authEmailLink" value="">
                        <div id="authLinkError" style="display: none;"></div>
                        <div id="authLinkSuccess" style="display: none;"></div>
                        <button id="authSendLinkBtn"></button>
                    </div>
                </div>
            `;
        });

        test('showPasswordlessView should show passwordless view and hide password view', () => {
            CloudSync.showPasswordlessView();
            expect(document.getElementById('authPasswordlessView').style.display).toBe('block');
            expect(document.getElementById('authPasswordView').style.display).toBe('none');
        });

        test('showPasswordView should show password view and hide passwordless view', () => {
            CloudSync.showPasswordlessView();
            CloudSync.showPasswordView();
            expect(document.getElementById('authPasswordView').style.display).toBe('block');
            expect(document.getElementById('authPasswordlessView').style.display).toBe('none');
        });

        test('handleSendSignInLink should show error when email is empty', async () => {
            CloudSync.showPasswordlessView();
            await CloudSync.handleSendSignInLink();
            const error = document.getElementById('authLinkError');
            expect(error.style.display).toBe('block');
            expect(error.textContent).toContain('email');
        });
    });
});
