/**
 * Main Entry Point Tests
 *
 * Tests for loadTodayMap() – specifically the fallback behaviour when
 * today's puzzle does not exist in the maps database.
 */

const { loadTodayMap } = require('../../js/main.js');

// Helper: build a resolved fetch mock that returns the given maps object.
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
        document.cookie = 'currentLevel=2026-02-15';
        global.fetch = makeFetch({
            '2026-02-15': { date: '2026-02-15', dayNumber: 5 },
            '2026-03-01': { date: '2026-03-01', dayNumber: 10 },
        });

        const result = await loadTodayMap();
        expect(result).toEqual({ date: '2026-02-15', dayNumber: 5 });
    });

    test('ignores cookie when that level is not in the database', async () => {
        DateUtils.getTodayDate = () => '2026-03-01';
        document.cookie = 'currentLevel=2025-01-01';
        global.fetch = makeFetch({
            '2026-03-01': { date: '2026-03-01', dayNumber: 10 },
        });

        const result = await loadTodayMap();
        // Falls through to today's map
        expect(result).toEqual({ date: '2026-03-01', dayNumber: 10 });
    });

    test('returns null when fetch fails', async () => {
        DateUtils.getTodayDate = () => '2026-03-01';
        global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

        const result = await loadTodayMap();
        expect(result).toBeNull();
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
