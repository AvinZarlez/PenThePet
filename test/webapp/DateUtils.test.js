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

        test('should return current date', () => {
            const today = DateUtils.getTodayDate();
            const now = new Date();
            const expected = now.toISOString().split('T')[0];
            expect(today).toBe(expected);
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
