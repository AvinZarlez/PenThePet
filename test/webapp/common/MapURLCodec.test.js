/**
 * MapURLCodec Tests
 *
 * Unit tests for the MapURLCodec module (js/common/MapURLCodec.js).
 * Tests cover:
 *   - encodeMapData / decodeMapData round-trip
 *   - codec version field (v) is written and preserved
 *   - validation of required fields (map, size, goal, maxWalls)
 *   - map string length vs. declared size mismatch
 *   - computeSaveKey stability (same layout → same key)
 *   - computeSaveKey format ("map_" + 8 hex chars)
 *   - graceful null returns for malformed / empty inputs
 *   - optional fields (date, mapName, optimalSolution, dayNumber) survive the round-trip
 *   - Unicode characters in mapName are handled correctly
 */

const MapURLCodecModule = require('../../../js/common/MapURLCodec.js');

// The module exports an IIFE object, so we can use it directly.
const codec = MapURLCodecModule;

// ── Fixtures ─────────────────────────────────────────────────────────────────

/** A minimal valid 9×9 map (81 chars, one 'h', rest 'g'). */
function makeMinimalMapData(overrides = {}) {
    const size = overrides.size || 9;
    const mapStr = 'h' + 'g'.repeat(size * size - 1);
    return {
        map: mapStr,
        size,
        goal: 10,
        maxWalls: 6,
        date: '2026-01-01',
        mapName: 'Test Map',
        optimalSolution: [0, 1, 2, 3],
        dayNumber: 42,
        ...overrides,
    };
}

// ── encode / decode round-trip ────────────────────────────────────────────────

describe('MapURLCodec.encodeMapData / decodeMapData', () => {
    test('round-trips a complete map data object', () => {
        const original = makeMinimalMapData();
        const encoded = codec.encodeMapData(original);
        const decoded = codec.decodeMapData(encoded);

        expect(decoded).not.toBeNull();
        expect(decoded.map).toBe(original.map);
        expect(decoded.size).toBe(original.size);
        expect(decoded.goal).toBe(original.goal);
        expect(decoded.maxWalls).toBe(original.maxWalls);
        expect(decoded.date).toBe(original.date);
        expect(decoded.mapName).toBe(original.mapName);
        expect(decoded.optimalSolution).toEqual(original.optimalSolution);
        expect(decoded.dayNumber).toBe(original.dayNumber);
    });

    test('encoded string contains no URL-unsafe characters', () => {
        const encoded = codec.encodeMapData(makeMinimalMapData());
        // Base64url uses A-Z, a-z, 0-9, -, _  (no +, /, or = padding)
        expect(encoded).toMatch(/^[A-Za-z0-9\-_]+$/);
        expect(encoded).not.toContain('+');
        expect(encoded).not.toContain('/');
        expect(encoded).not.toContain('=');
    });

    test('includes codec version field in encoded payload', () => {
        const encoded = codec.encodeMapData(makeMinimalMapData());
        const decoded = codec.decodeMapData(encoded);
        expect(decoded).not.toBeNull();
        expect(decoded.v).toBe(codec.CODEC_VERSION);
    });

    test('handles missing optional fields gracefully', () => {
        const minimal = {
            map: 'h' + 'g'.repeat(80),
            size: 9,
            goal: 5,
            maxWalls: 4,
        };
        const encoded = codec.encodeMapData(minimal);
        const decoded = codec.decodeMapData(encoded);

        expect(decoded).not.toBeNull();
        expect(decoded.map).toBe(minimal.map);
        expect(decoded.size).toBe(9);
        expect(decoded.date).toBe('');
        expect(decoded.mapName).toBe('');
        expect(decoded.optimalSolution).toEqual([]);
        expect(decoded.dayNumber).toBeNull();
    });

    test('preserves Unicode characters in mapName', () => {
        const data = makeMinimalMapData({ mapName: 'Prairié du Châtaignier 🌰' });
        const encoded = codec.encodeMapData(data);
        const decoded = codec.decodeMapData(encoded);
        expect(decoded).not.toBeNull();
        expect(decoded.mapName).toBe('Prairié du Châtaignier 🌰');
    });

    test('round-trips a 17×17 map', () => {
        const size = 17;
        const data = makeMinimalMapData({ size, map: 'h' + 'g'.repeat(size * size - 1) });
        const encoded = codec.encodeMapData(data);
        const decoded = codec.decodeMapData(encoded);
        expect(decoded).not.toBeNull();
        expect(decoded.size).toBe(17);
        expect(decoded.map.length).toBe(17 * 17);
    });
});

// ── decodeMapData validation ──────────────────────────────────────────────────

describe('MapURLCodec.decodeMapData validation', () => {
    test('returns null for an empty string', () => {
        expect(codec.decodeMapData('')).toBeNull();
    });

    test('returns null for a non-string input', () => {
        expect(codec.decodeMapData(null)).toBeNull();
        expect(codec.decodeMapData(42)).toBeNull();
        expect(codec.decodeMapData(undefined)).toBeNull();
    });

    test('returns null for random garbage', () => {
        expect(codec.decodeMapData('not-valid-base64url!!')).toBeNull();
    });

    test('returns null when map string is empty', () => {
        const data = makeMinimalMapData({ map: '' });
        void data; // fixture only used to confirm the type; payload is built manually below
        // Build an invalid encoded payload directly (bypassing the production encoder,
        // which would produce a valid object — we need to test decoder rejection).
        const payload = { v: 1, date: '', mapName: '', size: 9, goal: 5, maxWalls: 4, map: '', optimalSolution: [], dayNumber: null };
        const json = JSON.stringify(payload);
        const bytes = encodeURIComponent(json).replace(/%([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
        const encoded = btoa(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        expect(codec.decodeMapData(encoded)).toBeNull();
    });

    test('returns null when map string length does not match size', () => {
        // Build a payload where map.length !== size * size (bypassing production encoder).
        const payload = { v: 1, date: '', mapName: '', size: 9, goal: 5, maxWalls: 4, map: 'gg', optimalSolution: [], dayNumber: null };
        const json = JSON.stringify(payload);
        const bytes = encodeURIComponent(json).replace(/%([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
        const encoded = btoa(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        expect(codec.decodeMapData(encoded)).toBeNull();
    });

    test('returns null when required numeric fields are missing', () => {
        // Each case omits a different required field; built manually to bypass encoder validation.
        const cases = [
            { map: 'h' + 'g'.repeat(80), goal: 5, maxWalls: 4 },           // missing size
            { map: 'h' + 'g'.repeat(80), size: 9, maxWalls: 4 },            // missing goal
            { map: 'h' + 'g'.repeat(80), size: 9, goal: 5 },                // missing maxWalls
        ];
        for (const partial of cases) {
            const payload = { v: 1, date: '', mapName: '', optimalSolution: [], dayNumber: null, ...partial };
            const json = JSON.stringify(payload);
            const bytes = encodeURIComponent(json).replace(/%([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
            const encoded = btoa(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            expect(codec.decodeMapData(encoded)).toBeNull();
        }
    });
});

// ── computeSaveKey ────────────────────────────────────────────────────────────

describe('MapURLCodec.computeSaveKey', () => {
    test('returns a string prefixed with "map_"', () => {
        const key = codec.computeSaveKey(makeMinimalMapData());
        expect(key).toMatch(/^map_[0-9a-f]{8}$/);
    });

    test('same puzzle layout → same key regardless of metadata', () => {
        const layout = makeMinimalMapData();
        const variant = { ...layout, mapName: 'Different Name', date: '2099-12-31', dayNumber: 999 };
        expect(codec.computeSaveKey(layout)).toBe(codec.computeSaveKey(variant));
    });

    test('different map string → different key', () => {
        const a = makeMinimalMapData({ map: 'h' + 'g'.repeat(80) });
        const b = makeMinimalMapData({ map: 'g' + 'h' + 'g'.repeat(79) });
        expect(codec.computeSaveKey(a)).not.toBe(codec.computeSaveKey(b));
    });

    test('different size → different key (even with same map prefix)', () => {
        const map9 = makeMinimalMapData({ size: 9, map: 'h' + 'g'.repeat(80) });
        const map11 = makeMinimalMapData({ size: 11, map: 'h' + 'g'.repeat(120) });
        expect(codec.computeSaveKey(map9)).not.toBe(codec.computeSaveKey(map11));
    });

    test('key is stable across multiple calls with the same input', () => {
        const data = makeMinimalMapData();
        const key1 = codec.computeSaveKey(data);
        const key2 = codec.computeSaveKey(data);
        expect(key1).toBe(key2);
    });
});

// ── _fnv32hex ─────────────────────────────────────────────────────────────────

describe('MapURLCodec._fnv32hex', () => {
    test('returns an 8-character lowercase hex string', () => {
        const result = codec._fnv32hex('hello');
        expect(result).toMatch(/^[0-9a-f]{8}$/);
    });

    test('is deterministic', () => {
        expect(codec._fnv32hex('test')).toBe(codec._fnv32hex('test'));
    });

    test('different inputs produce different hashes', () => {
        expect(codec._fnv32hex('abc')).not.toBe(codec._fnv32hex('xyz'));
    });

    test('empty string does not throw', () => {
        expect(() => codec._fnv32hex('')).not.toThrow();
    });
});
