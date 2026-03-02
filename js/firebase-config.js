/**
 * Firebase Configuration (Deprecated — see site-config.js)
 *
 * This file has been renamed to site-config.js, which now holds all runtime
 * configuration (Firebase credentials and signature public key).
 *
 * This shim is kept only so that any external scripts that still reference
 * the old path continue to work.  Browser code loads site-config.js directly
 * via the <script> tag in index.html.
 */

// Node.js / Jest only — re-export from the canonical file
if (typeof module !== 'undefined' && module.exports) {
    module.exports = require('./site-config.js');
}

