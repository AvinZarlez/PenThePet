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

const { loadTodayMap, resolveMapFromUrlParams } = require('../../js/main.js');

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
        // Clear relevant cookies between tests
        document.cookie = 'currentLevel=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
        document.cookie = 'lastVisitDate=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
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

    test('uses cookie-selected level when it exists in the database (same-day return visit)', async () => {
        DateUtils.getTodayDate = () => '2026-03-01';
        // Simulate a same-day return visit: lastVisitDate matches today
        document.cookie = 'lastVisitDate=2026-03-01; path=/';
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

    test('ignores cookie-selected level on first visit of the day (no lastVisitDate cookie)', async () => {
        DateUtils.getTodayDate = () => '2026-03-01';
        document.cookie = 'currentLevel=2026-02-28; path=/';
        // No lastVisitDate cookie → first visit today
        global.fetch = makeFetch({
            '2026-03-01': { date: '2026-03-01', dayNumber: 2 },
            '2026-02-28': { date: '2026-02-28', dayNumber: 1 },
        });

        const result = await loadTodayMap();
        expect(result).toEqual({ date: '2026-03-01', dayNumber: 2 });
    });

    test('ignores cookie-selected level when lastVisitDate is from a previous day', async () => {
        DateUtils.getTodayDate = () => '2026-03-02';
        document.cookie = 'lastVisitDate=2026-03-01; path=/';
        document.cookie = 'currentLevel=2026-01-15; path=/';
        global.fetch = makeFetch({
            '2026-03-02': { date: '2026-03-02', dayNumber: 3 },
            '2026-03-01': { date: '2026-03-01', dayNumber: 2 },
            '2026-01-15': { date: '2026-01-15', dayNumber: 1 },
        });

        const result = await loadTodayMap();
        expect(result).toEqual({ date: '2026-03-02', dayNumber: 3 });
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

/**
 * Tests for the cloudsync:synced event handler registered in initGame().
 *
 * The handler reloads the currently displayed level when the cloud sync
 * changes its submission state (e.g. first login on a new device that had
 * no local cookies).  It is intentionally a no-op when there is no change
 * so that mid-puzzle wall placements are not discarded unnecessarily.
 *
 * When mapsDatabase is not yet loaded (level selector was never opened),
 * the handler falls back to window.location.reload() so the page re-renders
 * with the cloud-synced cookie state.
 *
 * Notification rules:
 *   - non-submitted → submitted: no notification (reload is visually obvious)
 *   - submitted score or time changes: show notification
 */
describe('cloudsync:synced event handler logic', () => {
    // Re-implement the same conditional that main.js uses so we can test it
    // in isolation without needing to trigger the full initGame() flow.
    // reloadFn mirrors window.location.reload() and is injectable for testing.
    function simulateSyncHandler(game, menu, { reloadFn = () => {}, cloudOverwrites = new Set(), showNotification = () => {} } = {}) {
        if (!menu || !game || !game.currentDate) return;

        const currentSubmission = game.loadSubmission(game.currentDate);
        const hasSubmissionNow = currentSubmission !== null;
        const submissionStateChanged = game.isSubmitted !== hasSubmissionNow;
        const submissionDataChanged = game.isSubmitted && currentSubmission && (
            currentSubmission.score !== game.submittedScore
        );

        if (submissionStateChanged || submissionDataChanged) {
            if (menu.mapsDatabase && menu.mapsDatabase[game.currentDate]) {
                menu.loadLevel(menu.mapsDatabase[game.currentDate]);
                // Only notify when existing submission data changed (score/time).
                // Going from non-submitted → submitted is visually obvious — no notification.
                if (submissionDataChanged && cloudOverwrites.has(game.currentDate)) {
                    showNotification();
                }
            } else {
                reloadFn();
            }
            return;
        }
    }

    const MAP_DATA = { date: '2026-03-01', size: 5, map: 'X' };

    test('calls loadLevel when submission appears after sync (new-device login)', () => {
        const loadLevel = jest.fn();
        const reload = jest.fn();
        const game = {
            currentDate: '2026-03-01',
            isSubmitted: false,
            submittedScore: null,
            loadSubmission: jest.fn(() => ({ score: 10, walls: [] })),
        };
        const menu = {
            mapsDatabase: { '2026-03-01': MAP_DATA },
            loadLevel,
        };

        simulateSyncHandler(game, menu, { reloadFn: reload });

        expect(loadLevel).toHaveBeenCalledWith(MAP_DATA);
        expect(reload).not.toHaveBeenCalled();
    });

    test('does not show notification when going from non-submitted to submitted', () => {
        const loadLevel = jest.fn();
        const showNotification = jest.fn();
        const game = {
            currentDate: '2026-03-01',
            isSubmitted: false,
            submittedScore: null,
            loadSubmission: jest.fn(() => ({ score: 10, walls: [] })),
        };
        const menu = {
            mapsDatabase: { '2026-03-01': MAP_DATA },
            loadLevel,
        };
        const cloudOverwrites = new Set(['2026-03-01']);

        simulateSyncHandler(game, menu, { cloudOverwrites, showNotification });

        expect(loadLevel).toHaveBeenCalledWith(MAP_DATA);
        expect(showNotification).not.toHaveBeenCalled();
    });

    test('shows notification when existing submission data changes (score/walls)', () => {
        const loadLevel = jest.fn();
        const showNotification = jest.fn();
        const game = {
            currentDate: '2026-03-01',
            isSubmitted: true,
            submittedScore: 3,
            loadSubmission: jest.fn(() => ({ score: 7, walls: [] })),
        };
        const menu = {
            mapsDatabase: { '2026-03-01': MAP_DATA },
            loadLevel,
        };
        const cloudOverwrites = new Set(['2026-03-01']);

        simulateSyncHandler(game, menu, { cloudOverwrites, showNotification });

        expect(loadLevel).toHaveBeenCalledWith(MAP_DATA);
        expect(showNotification).toHaveBeenCalled();
    });

    test('does not call loadLevel when submission state is unchanged (already submitted)', () => {
        const loadLevel = jest.fn();
        const reload = jest.fn();
        const game = {
            currentDate: '2026-03-01',
            isSubmitted: true,
            submittedScore: 10,
            loadSubmission: jest.fn(() => ({ score: 10, walls: [] })),
        };
        const menu = {
            mapsDatabase: { '2026-03-01': MAP_DATA },
            loadLevel,
        };

        simulateSyncHandler(game, menu, { reloadFn: reload });

        expect(loadLevel).not.toHaveBeenCalled();
        expect(reload).not.toHaveBeenCalled();
    });

    test('does not call loadLevel when submission state is unchanged (not submitted)', () => {
        const loadLevel = jest.fn();
        const reload = jest.fn();
        const game = {
            currentDate: '2026-03-01',
            isSubmitted: false,
            submittedScore: null,
            loadSubmission: jest.fn(() => null),
        };
        const menu = {
            mapsDatabase: { '2026-03-01': MAP_DATA },
            loadLevel,
        };

        simulateSyncHandler(game, menu, { reloadFn: reload });

        expect(loadLevel).not.toHaveBeenCalled();
        expect(reload).not.toHaveBeenCalled();
    });

    test('does nothing when game is not initialised', () => {
        // Should not throw
        expect(() => simulateSyncHandler(null, {})).not.toThrow();
    });

    test('reloads page when mapsDatabase is null (level selector never opened)', () => {
        // This is the primary bug scenario: user clears browser data, reloads,
        // logs into cloud sync — mapsDatabase is null because they haven't opened
        // the level selector.  The submission cookie was already written by the
        // sync; we must reload so the page renders the submitted state.
        const loadLevel = jest.fn();
        const reload = jest.fn();
        const game = {
            currentDate: '2026-03-01',
            isSubmitted: false,
            submittedScore: null,
            loadSubmission: jest.fn(() => ({ score: 5, walls: [] })),
        };
        const menu = {
            mapsDatabase: null,
            loadLevel,
        };

        simulateSyncHandler(game, menu, { reloadFn: reload });

        expect(reload).toHaveBeenCalled();
        expect(loadLevel).not.toHaveBeenCalled();
    });

    test('reloads page when current level is not in mapsDatabase', () => {
        const loadLevel = jest.fn();
        const reload = jest.fn();
        const game = {
            currentDate: '2026-03-01',
            isSubmitted: false,
            submittedScore: null,
            loadSubmission: jest.fn(() => ({ score: 5, walls: [] })),
        };
        const menu = {
            mapsDatabase: {}, // level not present
            loadLevel,
        };

        simulateSyncHandler(game, menu, { reloadFn: reload });

        expect(reload).toHaveBeenCalled();
        expect(loadLevel).not.toHaveBeenCalled();
    });
});

/**
 * Tests for URL parameter handling via loadTodayMap(_testUrlParams) and
 * resolveMapFromUrlParams().
 *
 * When URL parameters are present:
 *   - The lastVisitDate cookie must NOT be updated.
 *   - ?date=YYYY-MM-DD loads that specific map, or falls back to latest with an error.
 *   - ?level=N loads the map whose dayNumber matches N, or falls back with an error.
 *   - If both are provided, date takes priority.
 *   - Future dates, missing levels, and malformed values each produce distinct errors.
 */
describe('URL parameter handling', () => {
    let originalGetTodayDate;

    const DB = {
        '2026-01-01': { date: '2026-01-01', dayNumber: 1, size: 5, map: 'X' },
        '2026-02-15': { date: '2026-02-15', dayNumber: 2, size: 5, map: 'X' },
        '2026-03-01': { date: '2026-03-01', dayNumber: 3, size: 5, map: 'X' },
    };

    beforeEach(() => {
        originalGetTodayDate = DateUtils.getTodayDate;
        DateUtils.getTodayDate = () => '2026-03-01';
        global.fetch = makeFetch(DB);
        // Start with no cookies
        document.cookie = 'lastVisitDate=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
        document.cookie = 'currentLevel=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
    });

    afterEach(() => {
        DateUtils.getTodayDate = originalGetTodayDate;
        jest.restoreAllMocks();
    });

    describe('loadTodayMap with URL date param', () => {
        test('loads the specified date when it exists', async () => {
            const result = await loadTodayMap({ urlDate: '2026-02-15', urlLevel: null });
            expect(result).toEqual(DB['2026-02-15']);
        });

        test('date param takes priority over level param', async () => {
            // day 3 is 2026-03-01; date param requests 2026-02-15
            const result = await loadTodayMap({ urlDate: '2026-02-15', urlLevel: '3' });
            expect(result).toEqual(DB['2026-02-15']);
        });

        test('does not update lastVisitDate cookie when URL param is used', async () => {
            // Start with no lastVisitDate
            const setCookieSpy = jest.spyOn(CookieUtils, 'setCookie');
            await loadTodayMap({ urlDate: '2026-02-15', urlLevel: null });
            const lastVisitCalls = setCookieSpy.mock.calls.filter(c => c[0] === 'lastVisitDate');
            expect(lastVisitCalls).toHaveLength(0);
        });

        test('falls back to latest level and returns map when date is in the future', async () => {
            DateUtils.getTodayDate = () => '2026-03-01';
            const result = await loadTodayMap({ urlDate: '2027-01-01', urlLevel: null });
            // Should still return the latest available level
            expect(result).toBeTruthy();
            expect(result.date).toBe('2026-03-01');
        });

        test('falls back to latest level when date does not exist in DB', async () => {
            const result = await loadTodayMap({ urlDate: '2026-06-15', urlLevel: null });
            expect(result).toBeTruthy();
            expect(result.date).toBe('2026-03-01');
        });

        test('falls back to latest level when date is malformed', async () => {
            const result = await loadTodayMap({ urlDate: 'not-a-date', urlLevel: null });
            expect(result).toBeTruthy();
        });
    });

    describe('loadTodayMap with URL level param', () => {
        test('loads the map with the matching dayNumber', async () => {
            const result = await loadTodayMap({ urlDate: null, urlLevel: '2' });
            expect(result).toEqual(DB['2026-02-15']);
        });

        test('does not update lastVisitDate cookie when URL param is used', async () => {
            const setCookieSpy = jest.spyOn(CookieUtils, 'setCookie');
            await loadTodayMap({ urlDate: null, urlLevel: '1' });
            const lastVisitCalls = setCookieSpy.mock.calls.filter(c => c[0] === 'lastVisitDate');
            expect(lastVisitCalls).toHaveLength(0);
        });

        test('falls back to latest level when level number does not exist', async () => {
            const result = await loadTodayMap({ urlDate: null, urlLevel: '99' });
            expect(result).toBeTruthy();
        });

        test('falls back to latest level when level is malformed (non-numeric)', async () => {
            const result = await loadTodayMap({ urlDate: null, urlLevel: 'abc' });
            expect(result).toBeTruthy();
        });

        test('falls back to latest level when level is zero', async () => {
            const result = await loadTodayMap({ urlDate: null, urlLevel: '0' });
            expect(result).toBeTruthy();
        });

        test('falls back to latest level when level exists only in the future', async () => {
            // DB has dayNumber 3 on 2026-03-01 (today), but suppose a future entry is day 99
            const futureDB = {
                ...DB,
                '2027-06-01': { date: '2027-06-01', dayNumber: 99, size: 5, map: 'X' },
            };
            global.fetch = makeFetch(futureDB);
            const result = await loadTodayMap({ urlDate: null, urlLevel: '99' });
            // Should fall back and return a past/current map, not the future one
            expect(result).toBeTruthy();
            expect(result.date).not.toBe('2027-06-01');
        });
    });

    describe('loadTodayMap with no URL params (normal flow)', () => {
        test('still loads today map normally when no params passed', async () => {
            const result = await loadTodayMap({ urlDate: null, urlLevel: null });
            expect(result).toEqual(DB['2026-03-01']);
        });
    });
});

/**
 * Tests for resolveMapFromUrlParams() — the pure resolution function.
 */
describe('resolveMapFromUrlParams()', () => {
    const TODAY = '2026-03-01';
    const DB = {
        '2026-01-01': { date: '2026-01-01', dayNumber: 1 },
        '2026-02-15': { date: '2026-02-15', dayNumber: 2 },
        '2026-03-01': { date: '2026-03-01', dayNumber: 3 },
    };

    describe('no URL params', () => {
        test('returns null map and null error when both params are null', () => {
            const result = resolveMapFromUrlParams({ urlDate: null, urlLevel: null }, DB, TODAY);
            expect(result.map).toBeNull();
            expect(result.error).toBeNull();
        });
    });

    describe('date param', () => {
        test('returns the map for a valid existing date', () => {
            const result = resolveMapFromUrlParams({ urlDate: '2026-02-15', urlLevel: null }, DB, TODAY);
            expect(result.map).toEqual(DB['2026-02-15']);
            expect(result.error).toBeNull();
        });

        test('date takes priority when both params are present', () => {
            const result = resolveMapFromUrlParams({ urlDate: '2026-02-15', urlLevel: '3' }, DB, TODAY);
            expect(result.map).toEqual(DB['2026-02-15']);
        });

        test('returns error for a future date', () => {
            const result = resolveMapFromUrlParams({ urlDate: '2027-01-01', urlLevel: null }, DB, TODAY);
            expect(result.map).toBeNull();
            expect(result.error).toContain('2027-01-01');
        });

        test('returns error when date does not exist in DB', () => {
            const result = resolveMapFromUrlParams({ urlDate: '2026-06-15', urlLevel: null }, DB, TODAY);
            expect(result.map).toBeNull();
            expect(result.error).toContain('2026-06-15');
        });

        test('returns error for malformed date (wrong format)', () => {
            const result = resolveMapFromUrlParams({ urlDate: 'not-a-date', urlLevel: null }, DB, TODAY);
            expect(result.map).toBeNull();
            expect(result.error).toBeTruthy();
        });

        test('returns error for date with only numbers', () => {
            const result = resolveMapFromUrlParams({ urlDate: '20260315', urlLevel: null }, DB, TODAY);
            expect(result.map).toBeNull();
            expect(result.error).toBeTruthy();
        });
    });

    describe('level param', () => {
        test('returns the map for a valid existing level number', () => {
            const result = resolveMapFromUrlParams({ urlDate: null, urlLevel: '2' }, DB, TODAY);
            expect(result.map).toEqual(DB['2026-02-15']);
            expect(result.error).toBeNull();
        });

        test('returns error when level does not exist', () => {
            const result = resolveMapFromUrlParams({ urlDate: null, urlLevel: '99' }, DB, TODAY);
            expect(result.map).toBeNull();
            expect(result.error).toContain('99');
        });

        test('returns error for non-numeric level', () => {
            const result = resolveMapFromUrlParams({ urlDate: null, urlLevel: 'abc' }, DB, TODAY);
            expect(result.map).toBeNull();
            expect(result.error).toBeTruthy();
        });

        test('returns error for zero level', () => {
            const result = resolveMapFromUrlParams({ urlDate: null, urlLevel: '0' }, DB, TODAY);
            expect(result.map).toBeNull();
            expect(result.error).toBeTruthy();
        });

        test('returns error for negative level', () => {
            const result = resolveMapFromUrlParams({ urlDate: null, urlLevel: '-1' }, DB, TODAY);
            expect(result.map).toBeNull();
            expect(result.error).toBeTruthy();
        });

        test('does not load a level whose date is in the future', () => {
            const futureDB = {
                '2027-01-01': { date: '2027-01-01', dayNumber: 99 },
            };
            const result = resolveMapFromUrlParams({ urlDate: null, urlLevel: '99' }, futureDB, TODAY);
            expect(result.map).toBeNull();
            expect(result.error).toBeTruthy();
        });
    });
});
