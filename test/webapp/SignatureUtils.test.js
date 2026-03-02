/**
 * SignatureUtils Tests
 *
 * Unit tests for SignatureUtils: buildPayload, _fallbackHash,
 * _parseDateFromDisplay, _parseTimeToSeconds, parseShareText,
 * and the async sign / verify flow (using the fallback hash path
 * because no ECDSA keys are configured in the test environment).
 */

// SignatureUtils requires FIREBASE_CONFIG to exist in global scope
global.FIREBASE_CONFIG = { signaturePublicKey: '', signaturePrivateKey: '' };

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
        const h = SignatureUtils._fallbackHash('test');
        expect(h).toMatch(/^[0-9a-f]{8}$/);
    });

    test('is deterministic', () => {
        const data = 'Alice|2026-03-01|8|10|93';
        expect(SignatureUtils._fallbackHash(data)).toBe(SignatureUtils._fallbackHash(data));
    });

    test('different inputs produce different hashes (sanity check)', () => {
        expect(SignatureUtils._fallbackHash('aaa')).not.toBe(SignatureUtils._fallbackHash('bbb'));
    });
});

// ---------------------------------------------------------------------------
// _parseTimeToSeconds
// ---------------------------------------------------------------------------
describe('SignatureUtils._parseTimeToSeconds()', () => {
    test('parses MM:SS', () => {
        expect(SignatureUtils._parseTimeToSeconds('01:23')).toBe(83);
    });

    test('parses H:MM:SS', () => {
        expect(SignatureUtils._parseTimeToSeconds('1:02:03')).toBe(3723);
    });

    test('returns 0 for empty / invalid', () => {
        expect(SignatureUtils._parseTimeToSeconds('')).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// _parseDateFromDisplay
// ---------------------------------------------------------------------------
describe('SignatureUtils._parseDateFromDisplay()', () => {
    test('parses "March 1, 2026" to "2026-03-01"', () => {
        expect(SignatureUtils._parseDateFromDisplay('March 1, 2026')).toBe('2026-03-01');
    });

    test('returns null for garbage input', () => {
        expect(SignatureUtils._parseDateFromDisplay('not a date')).toBeNull();
    });

    test('returns null for empty string', () => {
        expect(SignatureUtils._parseDateFromDisplay('')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// parseShareText
// ---------------------------------------------------------------------------
describe('SignatureUtils.parseShareText()', () => {
    const validMessage = [
        'Pen The Pet 🐶',
        'Day 42 - March 1, 2026',
        'Score: 80% (8/10) Time: 01:33',
        'Signature: Alice abc123def4',
    ].join('\n');

    test('parses a valid share message', () => {
        const result = SignatureUtils.parseShareText(validMessage);
        expect(result).not.toBeNull();
        expect(result.username).toBe('Alice');
        expect(result.date).toBe('2026-03-01');
        expect(result.score).toBe(8);
        expect(result.goal).toBe(10);
        expect(result.timeSeconds).toBe(93);
        expect(result.signature).toBe('abc123def4');
    });

    test('handles multi-word username', () => {
        const msg = [
            'Pen The Pet 🐶',
            'Day 1 - March 1, 2026',
            'Score: 50% (5/10) Time: 00:30',
            'Signature: John Doe 000000ff',
        ].join('\n');
        const result = SignatureUtils.parseShareText(msg);
        expect(result).not.toBeNull();
        expect(result.username).toBe('John Doe');
        expect(result.signature).toBe('000000ff');
    });

    test('returns null for missing Day line', () => {
        const bad = 'Score: 80% (8/10) Time: 01:33\nSignature: Alice abc123';
        expect(SignatureUtils.parseShareText(bad)).toBeNull();
    });

    test('returns null for missing Score line', () => {
        const bad = 'Day 42 - March 1, 2026\nSignature: Alice abc123';
        expect(SignatureUtils.parseShareText(bad)).toBeNull();
    });

    test('returns null for missing Signature line', () => {
        const bad = 'Day 42 - March 1, 2026\nScore: 80% (8/10) Time: 01:33';
        expect(SignatureUtils.parseShareText(bad)).toBeNull();
    });

    test('returns null for null input', () => {
        expect(SignatureUtils.parseShareText(null)).toBeNull();
    });

    test('returns null for empty string', () => {
        expect(SignatureUtils.parseShareText('')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// sign + verify (fallback path — no ECDSA keys configured)
// ---------------------------------------------------------------------------
describe('SignatureUtils sign() + verify() — fallback mode', () => {
    test('sign() returns a non-empty string', async () => {
        const sig = await SignatureUtils.sign('Alice|2026-03-01|8|10|93');
        expect(typeof sig).toBe('string');
        expect(sig.length).toBeGreaterThan(0);
    });

    test('verify() returns true for a matching payload+signature', async () => {
        const payload = 'Alice|2026-03-01|8|10|93';
        const sig = await SignatureUtils.sign(payload);
        expect(await SignatureUtils.verify(payload, sig)).toBe(true);
    });

    test('verify() returns false for a tampered payload', async () => {
        const payload = 'Alice|2026-03-01|8|10|93';
        const sig = await SignatureUtils.sign(payload);
        const tampered = 'Alice|2026-03-01|10|10|93'; // score changed
        expect(await SignatureUtils.verify(tampered, sig)).toBe(false);
    });

    test('verify() returns false for a wrong signature', async () => {
        const payload = 'Alice|2026-03-01|8|10|93';
        expect(await SignatureUtils.verify(payload, 'deadbeef')).toBe(false);
    });

    test('full round-trip: sign then verify via parseShareText', async () => {
        const username = 'Alice';
        const date = '2026-03-01';
        const score = 8;
        const goal = 10;
        const timeSeconds = 93;
        const payload = SignatureUtils.buildPayload(username, date, score, goal, timeSeconds);
        const sig = await SignatureUtils.sign(payload);

        const msg = [
            'Pen The Pet 🐶',
            'Day 42 - March 1, 2026',
            `Score: 80% (${score}/${goal}) Time: 01:33`,
            `Signature: ${username} ${sig}`,
        ].join('\n');

        const parsed = SignatureUtils.parseShareText(msg);
        expect(parsed).not.toBeNull();
        const reconstructed = SignatureUtils.buildPayload(
            parsed.username, parsed.date, parsed.score, parsed.goal, parsed.timeSeconds
        );
        expect(await SignatureUtils.verify(reconstructed, parsed.signature)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// sign() with invalid / non-empty private key (covers !jwk fallback branch)
// ---------------------------------------------------------------------------
describe('SignatureUtils.sign() — invalid key config', () => {
    const originalPriv = global.FIREBASE_CONFIG.signaturePrivateKey;

    afterEach(() => {
        global.FIREBASE_CONFIG.signaturePrivateKey = originalPriv;
    });

    test('falls back to hash when signaturePrivateKey is invalid JSON', async () => {
        global.FIREBASE_CONFIG.signaturePrivateKey = 'not-valid-json{';
        const payload = 'Alice|2026-03-01|8|10|93';
        const sig = await SignatureUtils.sign(payload);
        expect(sig).toBe(SignatureUtils._fallbackHash(payload));
    });

    test('falls back to hash when signaturePrivateKey is valid JSON but wrong key type', async () => {
        global.FIREBASE_CONFIG.signaturePrivateKey = JSON.stringify({ kty: 'RSA' });
        const payload = 'Alice|2026-03-01|8|10|93';
        const sig = await SignatureUtils.sign(payload);
        // Should still return something (fallback hash on import error)
        expect(typeof sig).toBe('string');
        expect(sig.length).toBeGreaterThan(0);
    });
});

// ---------------------------------------------------------------------------
// verify() with invalid / non-empty public key (covers !jwk fallback branch)
// ---------------------------------------------------------------------------
describe('SignatureUtils.verify() — invalid key config', () => {
    const originalPub = global.FIREBASE_CONFIG.signaturePublicKey;

    afterEach(() => {
        global.FIREBASE_CONFIG.signaturePublicKey = originalPub;
    });

    test('returns false when signaturePublicKey is invalid JSON', async () => {
        global.FIREBASE_CONFIG.signaturePublicKey = '{{invalid}}';
        const payload = 'Alice|2026-03-01|8|10|93';
        expect(await SignatureUtils.verify(payload, 'anysig')).toBe(false);
    });

    test('falls back when signaturePublicKey is valid JSON but wrong key type', async () => {
        global.FIREBASE_CONFIG.signaturePublicKey = JSON.stringify({ kty: 'RSA' });
        const payload = 'Alice|2026-03-01|8|10|93';
        // Should return something (not throw)
        const result = await SignatureUtils.verify(payload, 'deadbeef');
        expect(typeof result).toBe('boolean');
    });
});
