/**
 * Site Runtime Configuration
 *
 * This file holds all runtime configuration values that are injected at
 * deploy time from GitHub repository secrets by the Pages workflow.
 * The committed version always contains empty strings; real values are
 * substituted only in the deployed bundle.
 *
 * ── Firebase Cloud Sync ───────────────────────────────────────────────────
 * Leave apiKey empty to disable cloud sync. The app works in full
 * local-only (cookie) mode when Firebase is not configured.
 *
 * To enable cloud sync on your own fork:
 *   1. Create a Firebase project and register a web app.
 *   2. Add the four Firebase values below as repository secrets in GitHub
 *      (Settings → Secrets and variables → Actions):
 *        FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID,
 *        FIREBASE_APP_ID
 *   3. The deploy workflow will inject them automatically on every push.
 *
 * See docs/CLOUD_SYNC_SETUP.md for full Firebase setup instructions.
 */

const FIREBASE_CONFIG = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    appId: ''
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FIREBASE_CONFIG;
}
