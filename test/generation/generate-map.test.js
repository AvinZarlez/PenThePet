/**
 * Unit Tests for generate-map.js utility functions
 */

const {
    parseSizeInput,
    getRandomSize,
    incrementDate,
    getNextAvailableDate,
} = require('../../scripts/generate-map.js');
const fs = require('fs');

describe('parseSizeInput', () => {
    test('parses an exact size string', () => {
        const result = parseSizeInput('9');
        expect(result).toEqual({ type: 'exact', value: 9 });
    });

    test('parses an exact size number', () => {
        const result = parseSizeInput(11);
        expect(result).toEqual({ type: 'exact', value: 11 });
    });

    test('parses a valid range string', () => {
        const result = parseSizeInput('7-13');
        expect(result).toEqual({ type: 'range', min: 7, max: 13 });
    });

    test('parses a range where min equals max', () => {
        const result = parseSizeInput('9-9');
        expect(result).toEqual({ type: 'range', min: 9, max: 9 });
    });

    test('throws on invalid range (min > max)', () => {
        expect(() => parseSizeInput('13-7')).toThrow(/min.*<=.*max/i);
    });

    test('throws on size below minimum', () => {
        expect(() => parseSizeInput('3')).toThrow(/must be between/i);
    });

    test('throws on size above maximum', () => {
        expect(() => parseSizeInput('25')).toThrow(/must be between/i);
    });

    test('throws on range below minimum', () => {
        expect(() => parseSizeInput('3-9')).toThrow(/must be between/i);
    });

    test('throws on range above maximum', () => {
        expect(() => parseSizeInput('9-25')).toThrow(/must be between/i);
    });

    test('throws on non-numeric string', () => {
        expect(() => parseSizeInput('large')).toThrow(/invalid size/i);
    });
});

describe('getRandomSize', () => {
    test('returns exact value for exact input', () => {
        const parsed = { type: 'exact', value: 9 };
        expect(getRandomSize(parsed)).toBe(9);
    });

    test('returns a value within range for range input', () => {
        const parsed = { type: 'range', min: 7, max: 13 };
        for (let i = 0; i < 50; i++) {
            const size = getRandomSize(parsed);
            expect(size).toBeGreaterThanOrEqual(7);
            expect(size).toBeLessThanOrEqual(13);
        }
    });

    test('returns min when min equals max', () => {
        const parsed = { type: 'range', min: 9, max: 9 };
        expect(getRandomSize(parsed)).toBe(9);
    });
});

describe('incrementDate', () => {
    test('increments a regular date by one day', () => {
        expect(incrementDate('2026-01-01')).toBe('2026-01-02');
    });

    test('rolls over to the next month', () => {
        expect(incrementDate('2026-01-31')).toBe('2026-02-01');
    });

    test('rolls over to the next year', () => {
        expect(incrementDate('2026-12-31')).toBe('2027-01-01');
    });

    test('handles leap year correctly', () => {
        expect(incrementDate('2024-02-28')).toBe('2024-02-29');
        expect(incrementDate('2024-02-29')).toBe('2024-03-01');
    });
});

describe('getNextAvailableDate', () => {
    test('returns today when directory does not exist', () => {
        const fakeDir = '/tmp/nonexistent-maps-dir-' + Date.now();
        const today = new Date().toISOString().split('T')[0];
        expect(getNextAvailableDate(fakeDir)).toBe(today);
    });

    test('returns day after latest date in existing directory', () => {
        const testDir = '/tmp/test-maps-next-date-dir-' + Date.now();
        fs.mkdirSync(testDir);
        const testMaps = {
            '2026-01-01': { dayNumber: 1, mapName: 'Alpha' },
            '2026-01-05': { dayNumber: 2, mapName: 'Beta' },
        };
        fs.writeFileSync(`${testDir}/2026.json`, JSON.stringify(testMaps));
        try {
            expect(getNextAvailableDate(testDir)).toBe('2026-01-06');
        } finally {
            fs.rmSync(testDir, { recursive: true });
        }
    });

    test('returns today when directory has no dates', () => {
        const testDir = '/tmp/test-maps-empty-date-dir-' + Date.now();
        fs.mkdirSync(testDir);
        fs.writeFileSync(`${testDir}/2026.json`, JSON.stringify({}));
        const today = new Date().toISOString().split('T')[0];
        try {
            expect(getNextAvailableDate(testDir)).toBe(today);
        } finally {
            fs.rmSync(testDir, { recursive: true });
        }
    });
});
