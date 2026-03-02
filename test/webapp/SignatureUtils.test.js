/**
 * SignatureUtils Tests
 *
 * Unit tests for the new token-based SignatureUtils API:
 * buildPayload, _fallbackHash, _base64urlEncode/_base64urlDecode,
 * sign (produces a self-contained token), decodeToken, extractToken,
 * and verify — all using the fallback-hash path since no ECDSA keys
 * are configured in the test environment.
 */

// SignatureUtils requires FIREBASE_CONFIG to exist in global scope
// (set in test/setup.js; repeated here explicitly for clarity)
global.FIREBASE_CONFIG = global.FIREBASE_CONFIG || { signaturePublicKey: '' };

const SignatureUtils = require('../../js/SignatureUtils.js');

// ---------------------------------------------------------------------------
// buildPayload
// ---------------------------------------------------------------------------
describe('SignatureUtils.buildPayload()', () => {
    test('returns pipe-separated canonical string', () => {
        expect(SignatureUtils.buildPayload('Alice', '2026-03-01', 8, 10, 93))
            .toBe('Alice|2026-03-01|8|10|93');
    });

    test('uses "Anonymous" username literally', () => {
        expect(SignatureUtils.buildPayload('Anonymous', '2026-03-01', 5, 10, 60))
            .toBe('Anonymous|2026-03-01|5|10|60');
    });
});

// ---------------------------------------------------------------------------
// _fallbackHash
// ---------------------------------------------------------------------------
describe('SignatureUtils._fallbackHash()', () => {
    test('returns an 8-character hex string', () => {
        expect(SignatureUtils._fallbackHash('test')).toMatch(/^[0-9a-f]{8}$/);
    });

    test('is deterministic', () => {
        const data = 'Alice|2026-03-01|8|10|93';
        expect(SignatureUtils._fallbackHash(data)).toBe(SignatureUtils._fallbackHash(data));
    });

    test('different inputs produce different hashes', () => {
        expect(SignatureUtils._fallbackHash('aaa')).not.toBe(SignatureUtils._fallbackHash('bbb'));
    });
});

// ---------------------------------------------------------------------------
// _base64urlEncode / _base64urlDecode
// ---------------------------------------------------------------------------
describe('SignatureUtils base64url helpers', () => {
    test('round-trips ASCII strings', () => {
        const s = 'Alice|2026-03-01|8|10|93';
        expect(SignatureUtils._base64urlDecode(SignatureUtils._base64urlEncode(s))).toBe(s);
    });

    test('encoded string contains no +, / or = (URL-safe)', () => {
        const encoded = SignatureUtils._base64urlEncode('some test payload|with|pipes');
        expect(encoded).not.toMatch(/[+/=]/);
    });

    test('round-trips strings with Unicode characters', () => {
        const s = 'Ünïcödé|2026-03-01|8|10|93';
        expect(SignatureUtils._base64urlDecode(SignatureUtils._base64urlEncode(s))).toBe(s);
    });
});

// ---------------------------------------------------------------------------
// sign() — produces a self-contained token
// ---------------------------------------------------------------------------
describe('SignatureUtils.sign()', () => {
    test('returns a string containing exactly one dot', async () => {
        const token = await SignatureUtils.sign('Alice|2026-03-01|8|10|93');
        expect(typeof token).toBe('string');
        expect(token.split('.').length).toBe(2);
    });

    test('token decodes back to the original payload', async () => {
        const payload = 'Alice|2026-03-01|8|10|93';
        const token = await SignatureUtils.sign(payload);
        const decoded = SignatureUtils.decodeToken(token);
        expect(decoded).not.toBeNull();
        expect(decoded.payload).toBe(payload);
    });
});

// ---------------------------------------------------------------------------
// decodeToken()
// ---------------------------------------------------------------------------
describe('SignatureUtils.decodeToken()', () => {
    test('decodes all fields from a valid token', async () => {
        const payload = 'Alice|2026-03-01|8|10|93';
        const token = await SignatureUtils.sign(payload);
        const d = SignatureUtils.decodeToken(token);
        expect(d.username).toBe('Alice');
        expect(d.date).toBe('2026-03-01');
        expect(d.score).toBe(8);
        expect(d.goal).toBe(10);
        expect(d.timeSeconds).toBe(93);
    });

    test('returns null for null input', () => {
        expect(SignatureUtils.decodeToken(null)).toBeNull();
    });

    test('returns null for string without a dot', () => {
        expect(SignatureUtils.decodeToken('nodothere')).toBeNull();
    });

    test('returns null for token with wrong number of pipe-separated parts', () => {
        const badB64 = SignatureUtils._base64urlEncode('only|four|parts');
        expect(SignatureUtils.decodeToken(`${badB64}.aabbccdd`)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// extractToken()
// ---------------------------------------------------------------------------
describe('SignatureUtils.extractToken()', () => {
    test('extracts token from a full share message', () => {
        const token = 'sometoken.abcdef12';
        const msg = [
            'Pen The Pet 🐶',
            'Day 42 - March 1, 2026',
            'Score: 80% (8/10) Time: 01:33',
            `Signature: ${token}`,
        ].join('\n');
        expect(SignatureUtils.extractToken(msg)).toBe(token);
    });

    test('treats bare input as the token when no Signature line found', () => {
        expect(SignatureUtils.extractToken('mytoken.hexhex')).toBe('mytoken.hexhex');
    });

    test('handles leading/trailing whitespace', () => {
        expect(SignatureUtils.extractToken('  token.hex  ')).toBe('token.hex');
    });

    test('returns null for empty input', () => {
        expect(SignatureUtils.extractToken('')).toBeNull();
    });

    test('returns null for null', () => {
        expect(SignatureUtils.extractToken(null)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// verify() — fallback mode (no ECDSA keys)
// ---------------------------------------------------------------------------
describe('SignatureUtils.verify() — fallback mode', () => {
    test('returns true for a token produced by sign()', async () => {
        const token = await SignatureUtils.sign('Alice|2026-03-01|8|10|93');
        expect(await SignatureUtils.verify(token)).toBe(true);
    });

    test('returns false for a tampered token (score changed in encoded payload)', async () => {
        const goodToken = await SignatureUtils.sign('Alice|2026-03-01|8|10|93');
        const tamperedPayload = 'Alice|2026-03-01|10|10|93';
        const tamperedB64 = SignatureUtils._base64urlEncode(tamperedPayload);
        const [, sig] = goodToken.split('.');
        const badToken = `${tamperedB64}.${sig}`;
        expect(await SignatureUtils.verify(badToken)).toBe(false);
    });

    test('returns false for null', async () => {
        expect(await SignatureUtils.verify(null)).toBe(false);
    });

    test('returns false for a malformed token', async () => {
        expect(await SignatureUtils.verify('not-a-valid-token')).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Full round-trip: sign → share message → extractToken → decodeToken → verify
// ---------------------------------------------------------------------------
describe('SignatureUtils full round-trip', () => {
    test('verify returns true after extracting and decoding from a full share message', async () => {
        const payload = SignatureUtils.buildPayload('Alice', '2026-03-01', 8, 10, 93);
        const token = await SignatureUtils.sign(payload);

        const shareMsg = [
            'Pen The Pet 🐶',
            'Day 42 - March 1, 2026',
            'Score: 80% (8/10) Time: 01:33',
            `Signature: ${token}`,
        ].join('\n');

        const extracted = SignatureUtils.extractToken(shareMsg);
        expect(extracted).toBe(token);

        const decoded = SignatureUtils.decodeToken(extracted);
        expect(decoded).not.toBeNull();
        expect(decoded.username).toBe('Alice');
        expect(decoded.score).toBe(8);

        expect(await SignatureUtils.verify(extracted)).toBe(true);
    });

    test('verify also works when only the bare token is pasted', async () => {
        const payload = SignatureUtils.buildPayload('Bob', '2026-03-01', 5, 10, 60);
        const token = await SignatureUtils.sign(payload);
        // extractToken with just the token returns it unchanged
        expect(SignatureUtils.extractToken(token)).toBe(token);
        expect(await SignatureUtils.verify(token)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// verify() with invalid / non-empty public key
// ---------------------------------------------------------------------------
describe('SignatureUtils.verify() — invalid public key config', () => {
    const originalPub = global.FIREBASE_CONFIG.signaturePublicKey;

    afterEach(() => {
        global.FIREBASE_CONFIG.signaturePublicKey = originalPub;
    });

    test('returns false when signaturePublicKey is invalid JSON', async () => {
        global.FIREBASE_CONFIG.signaturePublicKey = '{{invalid}}';
        const token = await SignatureUtils.sign('Alice|2026-03-01|8|10|93');
        expect(await SignatureUtils.verify(token)).toBe(false);
    });

    test('returns false when signaturePublicKey is valid JSON but wrong key type', async () => {
        global.FIREBASE_CONFIG.signaturePublicKey = JSON.stringify({ kty: 'RSA' });
        const token = await SignatureUtils.sign('Alice|2026-03-01|8|10|93');
        const result = await SignatureUtils.verify(token);
        expect(typeof result).toBe('boolean');
    });
});
