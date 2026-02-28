/**
 * Unit Tests for generate-single-map.js utility functions
 */

const {
    parseSizeInput,
    getRandomSize,
    incrementDate,
    getNextAvailableDate,
} = require('../../scripts/generate-single-map.js');
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
    test('returns today when file does not exist', () => {
        const fakePath = '/tmp/nonexistent-maps-' + Date.now() + '.json';
        const today = new Date().toISOString().split('T')[0];
        expect(getNextAvailableDate(fakePath)).toBe(today);
    });

    test('returns day after latest date in existing file', () => {
        const testPath = '/tmp/test-maps-next-date-' + Date.now() + '.json';
        const testMaps = {
            '2026-01-01': { dayNumber: 1, mapName: 'Alpha' },
            '2026-01-05': { dayNumber: 2, mapName: 'Beta' },
        };
        fs.writeFileSync(testPath, JSON.stringify(testMaps));
        try {
            expect(getNextAvailableDate(testPath)).toBe('2026-01-06');
        } finally {
            if (fs.existsSync(testPath)) fs.unlinkSync(testPath);
        }
    });

    test('returns today when file has no dates', () => {
        const testPath = '/tmp/test-maps-empty-date-' + Date.now() + '.json';
        fs.writeFileSync(testPath, JSON.stringify({}));
        const today = new Date().toISOString().split('T')[0];
        try {
            expect(getNextAvailableDate(testPath)).toBe(today);
        } finally {
            if (fs.existsSync(testPath)) fs.unlinkSync(testPath);
        }
    });
});
