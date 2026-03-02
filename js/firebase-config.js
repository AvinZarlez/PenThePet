/**
 * Firebase Configuration for Cloud Sync
 *
 * Values are intentionally left empty here. For the deployed site they are
 * injected at build time from GitHub repository secrets by the Pages workflow.
 *
 * To enable cloud sync on your own fork:
 *   1. Create a Firebase project and register a web app.
 *   2. Add the six values below as repository secrets in GitHub
 *      (Settings → Secrets and variables → Actions):
 *        FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID,
 *        FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID
 *   3. The deploy workflow will inject them automatically on every push.
 *
 * See docs/CLOUD_SYNC_SETUP.md for full setup instructions.
 *
 * Leave apiKey empty to disable cloud sync (app works in local-only mode).
 */

const FIREBASE_CONFIG = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    // ECDSA P-256 key pair for score signatures.
    // Values are injected at build time from GitHub secrets (SIGNATURE_PUBLIC_KEY,
    // SIGNATURE_PRIVATE_KEY) and must never be committed to the repository.
    // Leave empty to fall back to a deterministic checksum (no anti-forgery).
    signaturePublicKey: '',
    signaturePrivateKey: ''
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FIREBASE_CONFIG;
}
