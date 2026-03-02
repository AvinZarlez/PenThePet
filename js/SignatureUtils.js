/**
 * SignatureUtils
 *
 * Generates and verifies score tokens for the Pen the Pet share/verify flow.
 *
 * ── Token format ──────────────────────────────────────────────────────────
 * A token is a self-contained string that encodes all the game data AND a
 * tamper-detection checksum in a single value:
 *
 *   <base64url(payload)>.<hexsig>
 *
 * where  payload  = "username|date|score|goal|timeSeconds"  (pipe-separated)
 *   and  hexsig   = FNV-1a hash of the payload (fallback)
 *                OR ECDSA-P256 hex signature   (when a public key is configured)
 *
 * Because the token contains all the data, the recipient only needs to paste
 * the token (or the full share message) to see every detail and verify it.
 *
 * ── Security model ────────────────────────────────────────────────────────
 * Signing happens entirely in the browser using a deterministic hash.  This
 * means the "signature" is tamper-evident at the application level — casual
 * users cannot accidentally corrupt a score — but a technically motivated
 * user who reads the JavaScript source could forge one.
 *
 * Truly unforgeable signatures would require a server-side signing endpoint.
 * Since Pen the Pet is a static GitHub Pages site, that is out of scope for
 * now.  The ECDSA path in verify() is preserved for a future upgrade.
 *
 * IMPORTANT: The PRIVATE key must NEVER be placed in browser JavaScript.
 * Only the public key (stored in FIREBASE_CONFIG.signaturePublicKey) is used
 * client-side, for ECDSA verification only.
 */

const SignatureUtils = (() => {
    // ----------------------------------------------------------------
    // Internal helpers
    // ----------------------------------------------------------------

    /**
     * Return the public key JWK string from FIREBASE_CONFIG, or '' if absent.
     * @returns {string}
     */
    function _publicKeyStr() {
        return (typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG.signaturePublicKey) || '';
    }

    /**
     * Parse a JWK JSON string, returning null on any error.
     * @param {string} str
     * @returns {Object|null}
     */
    function _parseJwk(str) {
        try {
            return JSON.parse(str);
        } catch {
            return null;
        }
    }

    /**
     * Deterministic FNV-1a 32-bit hash, returned as an 8-char hex string.
     * Used as the signature when no ECDSA keys are configured.
     * @param {string} data
     * @returns {string}
     */
    function _fallbackHash(data) {
        let h = 0x811c9dc5;
        for (let i = 0; i < data.length; i++) {
            h ^= data.charCodeAt(i);
            h = Math.imul(h, 0x01000193) >>> 0;
        }
        return h.toString(16).padStart(8, '0');
    }

    /**
     * Convert a hex string to a Uint8Array.
     * @param {string} hex
     * @returns {Uint8Array}
     */
    function _fromHex(hex) {
        const arr = new Uint8Array(hex.length / 2);
        for (let i = 0; i < arr.length; i++) {
            arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
        }
        return arr;
    }

    /**
     * Encode a UTF-8 string to a URL-safe base64 string (no padding).
     * @param {string} str
     * @returns {string}
     */
    function _base64urlEncode(str) {
        // Convert UTF-8 string to percent-encoded, then to binary, then base64
        const binary = encodeURIComponent(str)
            .replace(/%([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
        return btoa(binary)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    /**
     * Decode a URL-safe base64 string back to a UTF-8 string.
     * @param {string} b64url
     * @returns {string}
     */
    function _base64urlDecode(b64url) {
        const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if needed
        const padded = b64 + '==='.slice(0, (4 - b64.length % 4) % 4);
        const binary = atob(padded);
        // Convert binary bytes back to UTF-8
        return decodeURIComponent(
            binary.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        );
    }

    // ----------------------------------------------------------------
    // Public API
    // ----------------------------------------------------------------

    /**
     * Build the canonical payload string that is embedded in the token.
     * @param {string} username
     * @param {string} date        - ISO date string, e.g. "2026-03-01"
     * @param {number} score
     * @param {number} goal
     * @param {number} timeSeconds
     * @returns {string}
     */
    function buildPayload(username, date, score, goal, timeSeconds) {
        return `${username}|${date}|${score}|${goal}|${timeSeconds}`;
    }

    /**
     * Create a self-contained share token that encodes the payload AND its
     * tamper-detection signature:
     *
     *   <base64url(payload)>.<hexsig>
     *
     * The hexsig is computed with the FNV-1a fallback hash (client-side only).
     * If a server-side ECDSA signer is integrated in the future, the hexsig
     * portion can be replaced with the ECDSA hex signature — the decodeToken()
     * and verify() methods already support it.
     *
     * @param {string} payload - The canonical payload string from buildPayload()
     * @returns {Promise<string>} The full self-contained token
     */
    async function sign(payload) {
        const hexSig = _fallbackHash(payload);
        return `${_base64urlEncode(payload)}.${hexSig}`;
    }

    /**
     * Decode a share token and return all the embedded game fields.
     * Returns null if the token is malformed.
     *
     * @param {string} token - A token produced by sign()
     * @returns {{payload:string, username:string, date:string, score:number,
     *            goal:number, timeSeconds:number, signature:string}|null}
     */
    function decodeToken(token) {
        if (!token || typeof token !== 'string') return null;
        const dotIdx = token.indexOf('.');
        if (dotIdx === -1) return null;

        const encoded = token.slice(0, dotIdx);
        const signature = token.slice(dotIdx + 1);

        try {
            const payload = _base64urlDecode(encoded);
            const parts = payload.split('|');
            if (parts.length !== 5) return null;

            const score = parseInt(parts[2], 10);
            const goal = parseInt(parts[3], 10);
            const timeSeconds = parseInt(parts[4], 10);

            if (isNaN(score) || isNaN(goal) || isNaN(timeSeconds)) return null;

            return {
                payload,
                username: parts[0],
                date: parts[1],
                score,
                goal,
                timeSeconds,
                signature,
            };
        } catch {
            return null;
        }
    }

    /**
     * Extract the token from user-pasted text.
     *
     * Accepts two forms:
     *   1. The full share message  — finds the "Signature: <token>" line
     *   2. Just the token itself  — uses the trimmed input directly
     *
     * @param {string} text - Raw pasted text
     * @returns {string|null} The token, or null if nothing usable was found
     */
    function extractToken(text) {
        if (!text || typeof text !== 'string') return null;
        const trimmed = text.trim();

        // Look for a "Signature: <token>" line anywhere in the text
        for (const line of trimmed.split('\n')) {
            const m = line.trim().match(/^Signature:\s*(.+)$/i);
            if (m) return m[1].trim();
        }

        // Treat the entire input as a bare token
        return trimmed || null;
    }

    /**
     * Verify a share token.
     *
     * If an ECDSA public key is configured in FIREBASE_CONFIG.signaturePublicKey the
     * signature portion is verified using Web Crypto ECDSA-P256-SHA256.
     * Otherwise, the FNV-1a fallback hash is recomputed and compared.
     *
     * @param {string} token - A token produced by sign()
     * @returns {Promise<boolean>}
     */
    async function verify(token) {
        const decoded = decodeToken(token);
        if (!decoded) return false;

        const publicKeyStr = _publicKeyStr();

        if (!publicKeyStr) {
            // Fallback: recompute hash and compare
            return _fallbackHash(decoded.payload) === decoded.signature;
        }

        try {
            const jwk = _parseJwk(publicKeyStr);
            if (!jwk) return false;

            const key = await crypto.subtle.importKey(
                'jwk',
                jwk,
                { name: 'ECDSA', namedCurve: 'P-256' },
                false,
                ['verify']
            );

            const encoder = new TextEncoder();
            const sigBytes = _fromHex(decoded.signature);

            return await crypto.subtle.verify(
                { name: 'ECDSA', hash: 'SHA-256' },
                key,
                sigBytes,
                encoder.encode(decoded.payload)
            );
        } catch {
            return false;
        }
    }

    return {
        buildPayload,
        sign,
        decodeToken,
        extractToken,
        verify,
        /** @internal exposed for unit tests only */
        _fallbackHash,
        _base64urlEncode,
        _base64urlDecode,
    };
})();

// Export for use in Node.js / Jest tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SignatureUtils;
}

