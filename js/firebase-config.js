/**
 * Firebase Configuration for Cloud Sync
 *
 * To enable cloud sync between devices, create a free Firebase project
 * and fill in your project's configuration values below.
 *
 * See docs/CLOUD_SYNC_SETUP.md for full setup instructions.
 *
 * Note: Firebase API keys are NOT secret — they identify your project but
 * access is controlled by Firebase Authentication and Firestore Security Rules.
 * It is safe to commit this file with your actual project values.
 *
 * Leave apiKey empty to disable cloud sync (app works in local-only mode).
 */

const FIREBASE_CONFIG = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FIREBASE_CONFIG;
}
