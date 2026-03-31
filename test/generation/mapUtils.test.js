/**
 * Tests for scripts/lib/mapUtils.js
 *
 * Covers the following functions that were previously untested:
 *   - readAllMaps
 *   - saveMapsToDirectory
 *   - getNextDayNumber
 *   - validateMapsDatabase
 *   - fixMapsDatabase
 *   - weaveInsert
 */

const fs = require('fs');
const path = require('path');
const {
    readAllMaps,
    saveMapsToDirectory,
    getNextDayNumber,
    validateMapsDatabase,
    fixMapsDatabase,
    weaveInsert,
    incrementDate,
} = require('../../scripts/lib/mapUtils.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a fresh temp directory for each test that needs filesystem I/O. */
function tmpDir() {
    const dir = path.join('/tmp', `maputils-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

/** Write a maps object to a temp dir as YYYY.json files (one per year). */
function writeMaps(dir, maps) {
    const byYear = {};
    for (const date of Object.keys(maps)) {
        const year = date.substring(0, 4);
        if (!byYear[year]) byYear[year] = {};
        byYear[year][date] = maps[date];
    }
    for (const [year, yearMaps] of Object.entries(byYear)) {
        fs.writeFileSync(path.join(dir, `${year}.json`), JSON.stringify(yearMaps));
    }
}

// ---------------------------------------------------------------------------
// readAllMaps
// ---------------------------------------------------------------------------

describe('readAllMaps', () => {
    test('returns empty object when directory does not exist', () => {
        expect(readAllMaps('/tmp/nonexistent-maputils-' + Date.now())).toEqual({});
    });

    test('returns empty object when directory has no YYYY.json files', () => {
        const dir = tmpDir();
        try {
            expect(readAllMaps(dir)).toEqual({});
        } finally {
            fs.rmSync(dir, { recursive: true });
        }
    });

    test('reads maps from a single year file', () => {
        const dir = tmpDir();
        const maps = {
            '2026-01-01': { dayNumber: 1, mapName: 'Alpha', size: 9 },
            '2026-01-02': { dayNumber: 2, mapName: 'Beta', size: 11 },
        };
        writeMaps(dir, maps);
        try {
            const result = readAllMaps(dir);
            expect(result['2026-01-01'].mapName).toBe('Alpha');
            expect(result['2026-01-02'].mapName).toBe('Beta');
            expect(Object.keys(result).length).toBe(2);
        } finally {
            fs.rmSync(dir, { recursive: true });
        }
    });

    test('merges maps from multiple year files', () => {
        const dir = tmpDir();
        writeMaps(dir, {
            '2025-12-31': { dayNumber: 1, mapName: 'OldMap', size: 9 },
            '2026-01-01': { dayNumber: 2, mapName: 'NewMap', size: 11 },
        });
        try {
            const result = readAllMaps(dir);
            expect(Object.keys(result).length).toBe(2);
            expect(result['2025-12-31'].mapName).toBe('OldMap');
            expect(result['2026-01-01'].mapName).toBe('NewMap');
        } finally {
            fs.rmSync(dir, { recursive: true });
        }
    });

    test('ignores non-year JSON files (e.g. extra.json) and non-JSON files', () => {
        const dir = tmpDir();
        fs.writeFileSync(path.join(dir, 'README.md'), 'ignored');
        fs.writeFileSync(path.join(dir, 'extra.json'), JSON.stringify({ ignored: true }));
        writeMaps(dir, { '2026-03-01': { dayNumber: 1, mapName: 'Real' } });
        try {
            const result = readAllMaps(dir);
            expect(Object.keys(result)).toEqual(['2026-03-01']);
        } finally {
            fs.rmSync(dir, { recursive: true });
        }
    });

    test('sorts and reads files in lexicographic order (year order)', () => {
        const dir = tmpDir();
        writeMaps(dir, {
            '2024-06-01': { dayNumber: 1, mapName: 'Earliest' },
            '2026-06-01': { dayNumber: 3, mapName: 'Latest' },
            '2025-06-01': { dayNumber: 2, mapName: 'Middle' },
        });
        try {
            const result = readAllMaps(dir);
            const dates = Object.keys(result).sort();
            expect(dates[0]).toBe('2024-06-01');
            expect(dates[1]).toBe('2025-06-01');
            expect(dates[2]).toBe('2026-06-01');
        } finally {
            fs.rmSync(dir, { recursive: true });
        }
    });
});

// ---------------------------------------------------------------------------
// saveMapsToDirectory
// ---------------------------------------------------------------------------

describe('saveMapsToDirectory', () => {
    test('creates the directory when it does not exist', () => {
        const dir = path.join('/tmp', `maputils-save-${Date.now()}`);
        expect(fs.existsSync(dir)).toBe(false);
        try {
            saveMapsToDirectory(dir, { '2026-01-01': { dayNumber: 1, mapName: 'Alpha' } });
            expect(fs.existsSync(dir)).toBe(true);
        } finally {
            fs.rmSync(dir, { recursive: true });
        }
    });

    test('splits maps by year into separate YYYY.json files', () => {
        const dir = tmpDir();
        const maps = {
            '2025-12-31': { dayNumber: 1, mapName: 'OldMap' },
            '2026-01-01': { dayNumber: 2, mapName: 'NewMap' },
        };
        try {
            saveMapsToDirectory(dir, maps);
            expect(fs.existsSync(path.join(dir, '2025.json'))).toBe(true);
            expect(fs.existsSync(path.join(dir, '2026.json'))).toBe(true);
            const data2025 = JSON.parse(fs.readFileSync(path.join(dir, '2025.json'), 'utf8'));
            const data2026 = JSON.parse(fs.readFileSync(path.join(dir, '2026.json'), 'utf8'));
            expect(data2025['2025-12-31'].mapName).toBe('OldMap');
            expect(data2026['2026-01-01'].mapName).toBe('NewMap');
        } finally {
            fs.rmSync(dir, { recursive: true });
        }
    });

    test('round-trips maps correctly through save then readAllMaps', () => {
        const dir = tmpDir();
        const maps = {
            '2026-03-01': { dayNumber: 1, mapName: 'RoundTrip', size: 9, goal: 20 },
            '2026-03-02': { dayNumber: 2, mapName: 'AnotherMap', size: 11, goal: 25 },
        };
        try {
            saveMapsToDirectory(dir, maps);
            const loaded = readAllMaps(dir);
            expect(loaded['2026-03-01'].mapName).toBe('RoundTrip');
            expect(loaded['2026-03-01'].goal).toBe(20);
            expect(loaded['2026-03-02'].goal).toBe(25);
        } finally {
            fs.rmSync(dir, { recursive: true });
        }
    });

    test('writes valid JSON (parseable output)', () => {
        const dir = tmpDir();
        try {
            saveMapsToDirectory(dir, { '2026-05-05': { dayNumber: 1, mapName: 'Test' } });
            const raw = fs.readFileSync(path.join(dir, '2026.json'), 'utf8');
            expect(() => JSON.parse(raw)).not.toThrow();
        } finally {
            fs.rmSync(dir, { recursive: true });
        }
    });

    test('all maps for a given year are in the same YYYY.json file', () => {
        const dir = tmpDir();
        const maps = {
            '2026-01-01': { dayNumber: 1, mapName: 'Jan' },
            '2026-06-15': { dayNumber: 2, mapName: 'Jun' },
            '2026-12-31': { dayNumber: 3, mapName: 'Dec' },
        };
        try {
            saveMapsToDirectory(dir, maps);
            const files = fs.readdirSync(dir).filter(f => /^\d{4}\.json$/.test(f));
            expect(files).toEqual(['2026.json']);
            const data = JSON.parse(fs.readFileSync(path.join(dir, '2026.json'), 'utf8'));
            expect(Object.keys(data).length).toBe(3);
        } finally {
            fs.rmSync(dir, { recursive: true });
        }
    });
});

// ---------------------------------------------------------------------------
// getNextDayNumber
// ---------------------------------------------------------------------------

describe('getNextDayNumber', () => {
    test('returns 1 when directory does not exist', () => {
        expect(getNextDayNumber('/tmp/nonexistent-daynum-' + Date.now())).toBe(1);
    });

    test('returns 1 when directory exists but has no maps', () => {
        const dir = tmpDir();
        try {
            expect(getNextDayNumber(dir)).toBe(1);
        } finally {
            fs.rmSync(dir, { recursive: true });
        }
    });

    test('returns max day number + 1 from populated maps', () => {
        const dir = tmpDir();
        writeMaps(dir, {
            '2026-01-01': { dayNumber: 3, mapName: 'Third' },
            '2026-01-02': { dayNumber: 1, mapName: 'First' },
            '2026-01-03': { dayNumber: 2, mapName: 'Second' },
        });
        try {
            expect(getNextDayNumber(dir)).toBe(4);
        } finally {
            fs.rmSync(dir, { recursive: true });
        }
    });

    test('handles missing dayNumber fields gracefully (treats as 0)', () => {
        const dir = tmpDir();
        writeMaps(dir, { '2026-01-01': { mapName: 'NoDayNum' } });
        try {
            expect(getNextDayNumber(dir)).toBe(1);
        } finally {
            fs.rmSync(dir, { recursive: true });
        }
    });

    test('returns 1 when all maps have dayNumber 0 or missing', () => {
        const dir = tmpDir();
        writeMaps(dir, {
            '2026-01-01': { dayNumber: 0, mapName: 'Zero' },
            '2026-01-02': { mapName: 'Missing' },
        });
        try {
            expect(getNextDayNumber(dir)).toBe(1);
        } finally {
            fs.rmSync(dir, { recursive: true });
        }
    });
});

// ---------------------------------------------------------------------------
// validateMapsDatabase
// ---------------------------------------------------------------------------

describe('validateMapsDatabase', () => {
    test('returns valid=true for a clean sequential database', () => {
        const maps = {
            '2026-01-01': { dayNumber: 1, mapName: 'Alpha' },
            '2026-01-02': { dayNumber: 2, mapName: 'Beta' },
            '2026-01-03': { dayNumber: 3, mapName: 'Gamma' },
        };
        const result = validateMapsDatabase(maps);
        expect(result.valid).toBe(true);
        expect(result.issues).toHaveLength(0);
    });

    test('returns valid=true for an empty database', () => {
        expect(validateMapsDatabase({}).valid).toBe(true);
    });

    test('returns valid=true for a single-entry database', () => {
        const maps = { '2026-01-01': { dayNumber: 1, mapName: 'OnlyMap' } };
        expect(validateMapsDatabase(maps).valid).toBe(true);
    });

    test('detects a gap in day numbers', () => {
        const maps = {
            '2026-01-01': { dayNumber: 1, mapName: 'Alpha' },
            '2026-01-02': { dayNumber: 3, mapName: 'Beta' }, // gap: 2 missing
        };
        const result = validateMapsDatabase(maps);
        expect(result.valid).toBe(false);
        expect(result.issues.some(i => i.type === 'gap_in_numbers')).toBe(true);
    });

    test('gap issue includes expected and actual fields', () => {
        const maps = {
            '2026-01-01': { dayNumber: 1, mapName: 'Alpha' },
            '2026-01-02': { dayNumber: 5, mapName: 'Beta' },
        };
        const { issues } = validateMapsDatabase(maps);
        const gap = issues.find(i => i.type === 'gap_in_numbers');
        expect(gap).toBeDefined();
        expect(gap.expected).toBe(2);
        expect(gap.actual).toBe(5);
    });

    test('only reports the first gap (not every subsequent gap)', () => {
        const maps = {
            '2026-01-01': { dayNumber: 1, mapName: 'Alpha' },
            '2026-01-02': { dayNumber: 10, mapName: 'Beta' },
            '2026-01-03': { dayNumber: 20, mapName: 'Gamma' },
        };
        const { issues } = validateMapsDatabase(maps);
        const gaps = issues.filter(i => i.type === 'gap_in_numbers');
        expect(gaps).toHaveLength(1);
    });

    test('detects duplicate map names', () => {
        const maps = {
            '2026-01-01': { dayNumber: 1, mapName: 'Alpha' },
            '2026-01-02': { dayNumber: 2, mapName: 'Alpha' }, // duplicate
        };
        const result = validateMapsDatabase(maps);
        expect(result.valid).toBe(false);
        expect(result.issues.some(i => i.type === 'duplicate_name')).toBe(true);
    });

    test('duplicate name issue includes name and both dates', () => {
        const maps = {
            '2026-01-01': { dayNumber: 1, mapName: 'Twin' },
            '2026-01-02': { dayNumber: 2, mapName: 'Twin' },
        };
        const { issues } = validateMapsDatabase(maps);
        const dup = issues.find(i => i.type === 'duplicate_name');
        expect(dup.name).toBe('Twin');
        expect(dup.dates).toContain('2026-01-01');
        expect(dup.dates).toContain('2026-01-02');
    });

    test('reports multiple issues when both gap and duplicate name exist', () => {
        const maps = {
            '2026-01-01': { dayNumber: 1, mapName: 'Alpha' },
            '2026-01-02': { dayNumber: 3, mapName: 'Alpha' }, // gap + duplicate name
        };
        const result = validateMapsDatabase(maps);
        expect(result.valid).toBe(false);
        expect(result.issues.length).toBeGreaterThanOrEqual(2);
    });

    test('detects multiple duplicate names independently', () => {
        const maps = {
            '2026-01-01': { dayNumber: 1, mapName: 'Alpha' },
            '2026-01-02': { dayNumber: 2, mapName: 'Beta' },
            '2026-01-03': { dayNumber: 3, mapName: 'Alpha' }, // dup
            '2026-01-04': { dayNumber: 4, mapName: 'Beta' },  // dup
        };
        const result = validateMapsDatabase(maps);
        const dups = result.issues.filter(i => i.type === 'duplicate_name');
        expect(dups.length).toBeGreaterThanOrEqual(2);
    });
});

// ---------------------------------------------------------------------------
// fixMapsDatabase
// ---------------------------------------------------------------------------

describe('fixMapsDatabase', () => {
    test('reassigns sequential day numbers (sorted by date)', () => {
        const maps = {
            '2026-01-01': { dayNumber: 5, mapName: 'Alpha' },
            '2026-01-02': { dayNumber: 10, mapName: 'Beta' },
            '2026-01-03': { dayNumber: 1, mapName: 'Gamma' },
        };
        const fixed = fixMapsDatabase(maps);
        expect(fixed['2026-01-01'].dayNumber).toBe(1);
        expect(fixed['2026-01-02'].dayNumber).toBe(2);
        expect(fixed['2026-01-03'].dayNumber).toBe(3);
    });

    test('does not mutate the original maps object', () => {
        const maps = { '2026-01-01': { dayNumber: 99, mapName: 'Alpha' } };
        fixMapsDatabase(maps);
        expect(maps['2026-01-01'].dayNumber).toBe(99);
    });

    test('renames duplicate map names to unique names', () => {
        const maps = {
            '2026-01-01': { dayNumber: 1, mapName: 'Alpha' },
            '2026-01-02': { dayNumber: 2, mapName: 'Alpha' }, // duplicate
        };
        const fixed = fixMapsDatabase(maps);
        const names = [fixed['2026-01-01'].mapName, fixed['2026-01-02'].mapName];
        expect(new Set(names).size).toBe(2);
    });

    test('preserves the first occurrence of a duplicate name', () => {
        const maps = {
            '2026-01-01': { dayNumber: 1, mapName: 'Alpha' },
            '2026-01-02': { dayNumber: 2, mapName: 'Alpha' },
        };
        const fixed = fixMapsDatabase(maps);
        // The first date (2026-01-01) should keep the original name
        expect(fixed['2026-01-01'].mapName).toBe('Alpha');
        // The second date should get a different name
        expect(fixed['2026-01-02'].mapName).not.toBe('Alpha');
    });

    test('fixed database passes subsequent validateMapsDatabase check', () => {
        const maps = {
            '2026-01-01': { dayNumber: 100, mapName: 'Alpha' },
            '2026-01-02': { dayNumber: 200, mapName: 'Alpha' }, // both problems
        };
        const fixed = fixMapsDatabase(maps);
        expect(validateMapsDatabase(fixed).valid).toBe(true);
    });

    test('preserves all non-dayNumber map fields', () => {
        const maps = {
            '2026-01-01': { dayNumber: 5, mapName: 'Alpha', size: 9, goal: 20 },
            '2026-01-02': { dayNumber: 10, mapName: 'Beta', size: 11, goal: 30 },
        };
        const fixed = fixMapsDatabase(maps);
        expect(fixed['2026-01-01'].size).toBe(9);
        expect(fixed['2026-01-01'].goal).toBe(20);
        expect(fixed['2026-01-02'].size).toBe(11);
        expect(fixed['2026-01-02'].goal).toBe(30);
    });

    test('handles three or more maps with duplicate names', () => {
        const maps = {
            '2026-01-01': { dayNumber: 1, mapName: 'Alpha' },
            '2026-01-02': { dayNumber: 2, mapName: 'Alpha' },
            '2026-01-03': { dayNumber: 3, mapName: 'Alpha' },
        };
        const fixed = fixMapsDatabase(maps);
        const names = Object.values(fixed).map(m => m.mapName);
        expect(new Set(names).size).toBe(3);
    });
});

// ---------------------------------------------------------------------------
// weaveInsert
// ---------------------------------------------------------------------------

describe('weaveInsert', () => {
    const today = '2026-03-15';
    const insertionStart = incrementDate(incrementDate(today)); // 2026-03-17

    test('inserts a single new map at or after the insertion start date', () => {
        const result = weaveInsert({}, [{ mapName: 'New1', size: 9 }], today);
        const dates = Object.keys(result);
        expect(dates.length).toBe(1);
        expect(dates[0] >= insertionStart).toBe(true);
    });

    test('preserves maps before the insertion zone unchanged', () => {
        const existing = {
            '2026-03-14': { dayNumber: 1, mapName: 'Past' },   // before today
            '2026-03-15': { dayNumber: 2, mapName: 'Today' },  // today (still before zone)
            '2026-03-20': { dayNumber: 3, mapName: 'Future' }, // in zone
        };
        const result = weaveInsert(existing, [{ mapName: 'New', size: 9 }], today);
        // Maps before insertionStart are fixed
        expect(result['2026-03-14']).toBeDefined();
        expect(result['2026-03-14'].mapName).toBe('Past');
        expect(result['2026-03-15']).toBeDefined();
        expect(result['2026-03-15'].mapName).toBe('Today');
    });

    test('result contains all existing + new maps', () => {
        const existing = {
            '2026-03-20': { dayNumber: 1, mapName: 'ExFuture1' },
            '2026-03-21': { dayNumber: 2, mapName: 'ExFuture2' },
        };
        const newMaps = [{ mapName: 'New1', size: 9 }, { mapName: 'New2', size: 11 }];
        const result = weaveInsert(existing, newMaps, today);
        const insertionZoneDates = Object.keys(result).filter(d => d >= insertionStart);
        // 2 existing + 2 new = 4 in the insertion zone
        expect(insertionZoneDates.length).toBe(4);
    });

    test('assigns sequential dates starting from the insertion start date', () => {
        const newMaps = [
            { mapName: 'New1', size: 9 },
            { mapName: 'New2', size: 11 },
            { mapName: 'New3', size: 13 },
        ];
        const result = weaveInsert({}, newMaps, today);
        const dates = Object.keys(result).sort();
        expect(dates[0]).toBe(insertionStart);
        expect(dates[1]).toBe(incrementDate(insertionStart));
        expect(dates[2]).toBe(incrementDate(incrementDate(insertionStart)));
    });

    test('works with empty existing maps', () => {
        const result = weaveInsert({}, [{ mapName: 'Solo', size: 9 }], today);
        expect(Object.keys(result).length).toBe(1);
    });

    test('works with empty new maps list (only preserves existing)', () => {
        const existing = {
            '2026-03-14': { dayNumber: 1, mapName: 'Past' },
        };
        const result = weaveInsert(existing, [], today);
        expect(result['2026-03-14']).toBeDefined();
        expect(Object.keys(result).length).toBe(1);
    });

    test('inserts multiple new maps into a non-empty insertion zone', () => {
        const existing = {
            '2026-03-14': { dayNumber: 1, mapName: 'Fixed' },
            '2026-03-20': { dayNumber: 2, mapName: 'InZone' },
        };
        const newMaps = [{ mapName: 'Inserted', size: 9 }];
        const result = weaveInsert(existing, newMaps, today);
        // Fixed map preserved; zone has 1 existing + 1 new
        expect(result['2026-03-14'].mapName).toBe('Fixed');
        const zoneDates = Object.keys(result).filter(d => d >= insertionStart);
        expect(zoneDates.length).toBe(2);
    });

    test('does not include dates before insertion start in the insertion zone', () => {
        const existing = {
            '2026-03-10': { dayNumber: 1, mapName: 'WayPast' },
            '2026-03-16': { dayNumber: 2, mapName: 'OneDayAhead' },
            '2026-03-20': { dayNumber: 3, mapName: 'InZone' },
        };
        const result = weaveInsert(existing, [{ mapName: 'New', size: 9 }], today);
        // 2026-03-16 is only 1 day ahead, before insertionStart (2 days ahead)
        expect(result['2026-03-10'].mapName).toBe('WayPast');
        expect(result['2026-03-16'].mapName).toBe('OneDayAhead');
    });

    test('each new map in result has its date field set', () => {
        const newMaps = [{ mapName: 'TestMap', size: 9 }];
        const result = weaveInsert({}, newMaps, today);
        const entry = Object.values(result)[0];
        expect(entry.date).toBeDefined();
        expect(/^\d{4}-\d{2}-\d{2}$/.test(entry.date)).toBe(true);
    });
});
