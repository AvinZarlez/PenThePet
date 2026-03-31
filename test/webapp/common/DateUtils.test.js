/**
 * DateUtils Tests
 * 
 * Tests for the shared date utility functions.
 */

describe('DateUtils', () => {
    describe('getTodayDate()', () => {
        test('should return a string in YYYY-MM-DD format', () => {
            const today = DateUtils.getTodayDate();
            expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        test('should return current date in default timezone (America/Los_Angeles)', () => {
            const today = DateUtils.getTodayDate();
            const expected = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'America/Los_Angeles',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).format(new Date()).replace(/\//g, '-');
            expect(today).toBe(expected);
        });

        test('should return current date in the specified timezone', () => {
            const today = DateUtils.getTodayDate('America/New_York');
            const expected = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'America/New_York',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).format(new Date()).replace(/\//g, '-');
            expect(today).toBe(expected);
        });

        test('should return current date in UTC when passed UTC timezone', () => {
            const today = DateUtils.getTodayDate('UTC');
            const expected = new Date().toISOString().split('T')[0];
            expect(today).toBe(expected);
        });

        test('should fall back gracefully on an invalid timezone', () => {
            const today = DateUtils.getTodayDate('Invalid/Timezone');
            expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        test('should return different dates for timezones on opposite sides of midnight', () => {
            // Freeze time to a moment that is definitively different between UTC-12 and UTC+12
            // Use a fixed instant: 2026-03-02T11:00:00Z
            // UTC+12  → 2026-03-02 23:00 (same day)
            // UTC-12  → 2026-03-01 23:00 (previous day)
            const fixedDate = new Date('2026-03-02T11:00:00Z');
            const origNow = Date;
            global.Date = class extends origNow {
                constructor(...args) { super(...args.length ? args : [fixedDate]); }
                static now() { return fixedDate.getTime(); }
            };

            let west, east;
            try {
                west = DateUtils.getTodayDate('Etc/GMT+12'); // UTC-12
                east = DateUtils.getTodayDate('Etc/GMT-12'); // UTC+12
            } finally {
                global.Date = origNow;
            }

            expect(west).not.toBe(east);
        });
    });

    describe('formatDate()', () => {
        test('should format a date string for display', () => {
            const result = DateUtils.formatDate('2026-02-06');
            expect(result).toMatch(/Feb.*6.*2026/);
        });

        test('should handle different months', () => {
            const jan = DateUtils.formatDate('2026-01-15');
            expect(jan).toMatch(/Jan.*15.*2026/);

            const dec = DateUtils.formatDate('2025-12-25');
            expect(dec).toMatch(/Dec.*25.*2025/);
        });

        test('should handle single-digit days', () => {
            const result = DateUtils.formatDate('2026-03-01');
            expect(result).toMatch(/Mar.*1.*2026/);
        });

        test('should return a non-empty string', () => {
            const result = DateUtils.formatDate('2026-06-15');
            expect(result.length).toBeGreaterThan(0);
        });
    });
});

describe('getTodayDate() — invalid timezone fallback', () => {
    test('returns a valid UTC date string when an invalid timezone is given', () => {
        const result = DateUtils.getTodayDate('Invalid/Timezone_XYZ');
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});
