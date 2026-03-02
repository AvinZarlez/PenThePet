/**
 * SignatureUtils
 *
 * Generates and verifies cryptographic signatures for player scores using
 * ECDSA P-256 (or a deterministic fallback when no keys are configured).
 *
 * The private key is injected at build time from GitHub secrets and never
 * committed to the repository.  The public key is stored in FIREBASE_CONFIG
 * so that the verify screen can confirm any signature without a server.
 *
 * Canonical payload format (pipe-separated, no spaces):
 *   "<username>|<date>|<score>|<goal>|<timeSeconds>"
 *
 * When neither key is configured the module falls back to a simple hex
 * checksum so that the share/verify flow still works end-to-end (albeit
 * without meaningful anti-forgery protection).
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
     * Return the private key JWK string from FIREBASE_CONFIG, or '' if absent.
     * @returns {string}
     */
    function _privateKeyStr() {
        return (typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG.signaturePrivateKey) || '';
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
     * Deterministic hex checksum used as a fallback when no ECDSA keys are
     * configured.  Not cryptographically secure, but keeps the UI functional.
     * @param {string} data
     * @returns {string} 8-character hex string
     */
    function _fallbackHash(data) {
        let h = 0x811c9dc5; // FNV-1a 32-bit offset basis
        for (let i = 0; i < data.length; i++) {
            h ^= data.charCodeAt(i);
            h = Math.imul(h, 0x01000193) >>> 0;
        }
        return h.toString(16).padStart(8, '0');
    }

    /**
     * Convert a Uint8Array to a lower-case hex string.
     * @param {Uint8Array} bytes
     * @returns {string}
     */
    function _toHex(bytes) {
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
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

    // ----------------------------------------------------------------
    // Public API
    // ----------------------------------------------------------------

    /**
     * Build the canonical payload string that is signed.
     * @param {string} username
     * @param {string} date      - ISO date string, e.g. "2026-03-01"
     * @param {number} score
     * @param {number} goal
     * @param {number} timeSeconds
     * @returns {string}
     */
    function buildPayload(username, date, score, goal, timeSeconds) {
        return `${username}|${date}|${score}|${goal}|${timeSeconds}`;
    }

    /**
     * Sign a payload with the configured ECDSA private key.
     * Falls back to a deterministic hash when no private key is available.
     *
     * @param {string} payload - The canonical payload string
     * @returns {Promise<string>} Hex-encoded signature
     */
    async function sign(payload) {
        const privateKeyStr = _privateKeyStr();

        if (!privateKeyStr) {
            return _fallbackHash(payload);
        }

        try {
            const jwk = _parseJwk(privateKeyStr);
            if (!jwk) return _fallbackHash(payload);

            const key = await crypto.subtle.importKey(
                'jwk',
                jwk,
                { name: 'ECDSA', namedCurve: 'P-256' },
                false,
                ['sign']
            );

            const encoder = new TextEncoder();
            const sigBuffer = await crypto.subtle.sign(
                { name: 'ECDSA', hash: 'SHA-256' },
                key,
                encoder.encode(payload)
            );

            return _toHex(new Uint8Array(sigBuffer));
        } catch {
            return _fallbackHash(payload);
        }
    }

    /**
     * Verify a hex-encoded ECDSA signature against a payload.
     * When no public key is configured, falls back to comparing deterministic
     * hashes (consistent with the sign() fallback).
     *
     * @param {string} payload   - The canonical payload string
     * @param {string} signature - Hex-encoded signature to verify
     * @returns {Promise<boolean>}
     */
    async function verify(payload, signature) {
        const publicKeyStr = _publicKeyStr();

        if (!publicKeyStr) {
            // Fallback: compare hash strings
            return _fallbackHash(payload) === signature;
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
            const sigBytes = _fromHex(signature);

            return await crypto.subtle.verify(
                { name: 'ECDSA', hash: 'SHA-256' },
                key,
                sigBytes,
                encoder.encode(payload)
            );
        } catch {
            return false;
        }
    }

    /**
     * Parse the share-text block pasted by a user and extract the individual
     * fields needed for verification.
     *
     * Expected format (any extra whitespace is tolerated):
     *   Pen The Pet <emoji>
     *   Day <N> - <DATE>
     *   Score: <pct>% (<score>/<goal>) Time: <MM:SS>
     *   Signature: <username> <hexSig>
     *
     * @param {string} text - Raw pasted text
     * @returns {{username:string,date:string,score:number,goal:number,timeSeconds:number,signature:string}|null}
     *          Parsed fields, or null if the text cannot be parsed.
     */
    function parseShareText(text) {
        if (!text || typeof text !== 'string') return null;

        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

        // --- Day/Date line: "Day 42 - March 1, 2026" ---
        const dayLine = lines.find(l => /^Day\s+\d+\s+-\s+/i.test(l));
        if (!dayLine) return null;

        const dateStr = _parseDateFromDisplay(dayLine.replace(/^Day\s+\d+\s+-\s+/i, '').trim());
        if (!dateStr) return null;

        // --- Score line: "Score: 50% (5/10) Time: 01:23" ---
        const scoreLine = lines.find(l => /^Score:/i.test(l));
        if (!scoreLine) return null;

        const scoreMatch = scoreLine.match(/\((\d+)\/(\d+)\)/);
        const timeMatch = scoreLine.match(/Time:\s*([\d:]+)/i);
        if (!scoreMatch || !timeMatch) return null;

        const score = parseInt(scoreMatch[1], 10);
        const goal = parseInt(scoreMatch[2], 10);
        const timeSeconds = _parseTimeToSeconds(timeMatch[1]);

        // --- Signature line: "Signature: Username abc123..." ---
        const sigLine = lines.find(l => /^Signature:/i.test(l));
        if (!sigLine) return null;

        const sigParts = sigLine.replace(/^Signature:\s*/i, '').trim().split(/\s+/);
        if (sigParts.length < 2) return null;

        // Last token is the hex signature; everything before it is the username.
        const signature = sigParts[sigParts.length - 1];
        const username = sigParts.slice(0, -1).join(' ');

        return { username, date: dateStr, score, goal, timeSeconds, signature };
    }

    /**
     * Convert a displayed date string (e.g. "March 1, 2026") back to ISO
     * format "YYYY-MM-DD".  Returns null if parsing fails.
     * @param {string} displayDate
     * @returns {string|null}
     */
    function _parseDateFromDisplay(displayDate) {
        try {
            const d = new Date(displayDate);
            if (isNaN(d.getTime())) return null;
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch {
            return null;
        }
    }

    /**
     * Convert a "MM:SS" or "H:MM:SS" time string to total seconds.
     * @param {string} timeStr
     * @returns {number}
     */
    function _parseTimeToSeconds(timeStr) {
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return 0;
    }

    return {
        buildPayload,
        sign,
        verify,
        parseShareText,
        /** @internal exposed for unit tests only */
        _fallbackHash,
        _parseDateFromDisplay,
        _parseTimeToSeconds,
    };
})();

// Export for use in Node.js / Jest tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SignatureUtils;
}
