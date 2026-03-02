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
 *
 * ── Score Signature Keys ──────────────────────────────────────────────────
 * The ECDSA P-256 PUBLIC key is used by the Verify Score screen so players
 * can confirm each other's results.
 *
 * IMPORTANT SECURITY NOTE:
 *   Only the PUBLIC key should ever be placed here.  Because this file is
 *   served as static JavaScript, its full contents are visible to anyone
 *   who visits the site.  The PRIVATE key must NEVER appear in this file
 *   or anywhere else in the browser bundle.
 *
 *   For truly unforgeable signatures a server-side signing endpoint would
 *   be required.  Since Pen the Pet is a static GitHub Pages site, the
 *   current implementation uses a client-side deterministic hash (FNV-1a)
 *   as the signature — this prevents casual tampering but a technically
 *   motivated user could forge a hash.  The ECDSA path is preserved so
 *   that a future backend integration can upgrade security without
 *   changing the share/verify UI.
 *
 * See docs/SIGNATURE_KEYS.md for key generation instructions.
 */

const FIREBASE_CONFIG = {
    // ── Firebase ──────────────────────────────────────────────────────────
    apiKey: '',
    authDomain: '',
    projectId: '',
    appId: '',

    // ── Score signatures ──────────────────────────────────────────────────
    // ECDSA P-256 public key (JWK JSON string).
    // Injected at build time from the SIGNATURE_PUBLIC_KEY secret.
    // Leave empty to use the deterministic hash fallback.
    signaturePublicKey: ''
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FIREBASE_CONFIG;
}
