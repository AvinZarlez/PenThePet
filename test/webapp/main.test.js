/**
 * Main Entry Point Tests
 *
 * Tests for loadTodayMap() – specifically the fallback behaviour when
 * today's puzzle does not exist in the maps database.
 *
 * loadTodayMap() fetches one or more maps/YYYY.json files and merges them.
 * Each fetch call in the test receives the same mock payload so that all
 * relevant dates are always available regardless of which year file is
 * requested.
 */

const { loadTodayMap } = require('../../js/main.js');

// Helper: build a resolved fetch mock that returns the given maps object
// for every request (year file, previous year, or saved-level year).
function makeFetch(mapsDb) {
    return jest.fn(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mapsDb),
        })
    );
}

describe('loadTodayMap()', () => {
    let originalGetTodayDate;

    beforeEach(() => {
        // Store original so we can restore after each test
        originalGetTodayDate = DateUtils.getTodayDate;
        // Clear any currentLevel cookie between tests
        document.cookie = 'currentLevel=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
    });

    afterEach(() => {
        DateUtils.getTodayDate = originalGetTodayDate;
        jest.restoreAllMocks();
    });

    test('returns today\'s map when it exists in the database', async () => {
        DateUtils.getTodayDate = () => '2026-03-01';
        global.fetch = makeFetch({
            '2026-03-01': { date: '2026-03-01', dayNumber: 1 },
        });

        const result = await loadTodayMap();
        expect(result).toEqual({ date: '2026-03-01', dayNumber: 1 });
    });

    test('falls back to the latest past date when today\'s map is missing', async () => {
        DateUtils.getTodayDate = () => '2026-03-02';
        global.fetch = makeFetch({
            '2026-03-01': { date: '2026-03-01', dayNumber: 2 },
            '2026-02-28': { date: '2026-02-28', dayNumber: 1 },
        });

        const result = await loadTodayMap();
        // 2026-03-01 is the most recent date <= 2026-03-02
        expect(result).toEqual({ date: '2026-03-01', dayNumber: 2 });
    });

    test('picks the latest of multiple past dates', async () => {
        DateUtils.getTodayDate = () => '2026-05-10';
        global.fetch = makeFetch({
            '2026-01-01': { date: '2026-01-01', dayNumber: 1 },
            '2026-04-30': { date: '2026-04-30', dayNumber: 3 },
            '2026-03-15': { date: '2026-03-15', dayNumber: 2 },
        });

        const result = await loadTodayMap();
        expect(result).toEqual({ date: '2026-04-30', dayNumber: 3 });
    });

    test('returns null when no maps are available at or before today', async () => {
        DateUtils.getTodayDate = () => '2020-01-01';
        global.fetch = makeFetch({
            '2026-03-01': { date: '2026-03-01', dayNumber: 1 },
        });

        const result = await loadTodayMap();
        expect(result).toBeNull();
    });

    test('uses cookie-selected level when it exists in the database', async () => {
        DateUtils.getTodayDate = () => '2026-03-01';
        document.cookie = 'currentLevel=2026-02-28; path=/';
        global.fetch = makeFetch({
            '2026-03-01': { date: '2026-03-01', dayNumber: 2 },
            '2026-02-28': { date: '2026-02-28', dayNumber: 1 },
        });

        const result = await loadTodayMap();
        expect(result).toEqual({ date: '2026-02-28', dayNumber: 1 });
    });

    test('ignores cookie-selected level when it is not in the database', async () => {
        DateUtils.getTodayDate = () => '2026-03-01';
        document.cookie = 'currentLevel=2025-12-31; path=/';
        global.fetch = makeFetch({
            '2026-03-01': { date: '2026-03-01', dayNumber: 1 },
        });

        const result = await loadTodayMap();
        // Cookie level not found → falls back to today
        expect(result).toEqual({ date: '2026-03-01', dayNumber: 1 });
    });

    test('returns null when fetch fails', async () => {
        DateUtils.getTodayDate = () => '2026-03-01';
        global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const result = await loadTodayMap();
        expect(result).toBeNull();

        consoleSpy.mockRestore();
    });

    test('returns null when fetch response is not ok', async () => {
        DateUtils.getTodayDate = () => '2026-03-01';
        global.fetch = jest.fn(() =>
            Promise.resolve({ ok: false })
        );

        const result = await loadTodayMap();
        expect(result).toBeNull();
    });
});
