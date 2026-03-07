/**
 * Unit Tests for scripts/lib/mapUtils.js
 *
 * Tests the map database validation and fixing logic.
 */

const { 
    validateMapsDatabase, 
    fixMapsDatabase, 
    getNextDayNumber,
    weaveInsert,
} = require('../../scripts/lib/mapUtils.js');
const fs = require('fs');

describe('Map Database Validation', () => {
    describe('validateMapsDatabase', () => {
        test('should pass validation for valid database', () => {
            const maps = {
                '2026-01-01': {
                    dayNumber: 1,
                    mapName: 'Alpha',
                    date: '2026-01-01',
                    size: 7
                },
                '2026-01-02': {
                    dayNumber: 2,
                    mapName: 'Beta',
                    date: '2026-01-02',
                    size: 9
                },
                '2026-01-03': {
                    dayNumber: 3,
                    mapName: 'Gamma',
                    date: '2026-01-03',
                    size: 11
                }
            };
            
            const result = validateMapsDatabase(maps);
            expect(result.valid).toBe(true);
            expect(result.issues).toHaveLength(0);
        });

        test('should detect gaps in day numbers', () => {
            const maps = {
                '2026-01-01': {
                    dayNumber: 1,
                    mapName: 'Alpha',
                    date: '2026-01-01'
                },
                '2026-01-02': {
                    dayNumber: 3,  // Gap: missing day 2
                    mapName: 'Beta',
                    date: '2026-01-02'
                }
            };
            
            const result = validateMapsDatabase(maps);
            expect(result.valid).toBe(false);
            expect(result.issues).toHaveLength(1);
            expect(result.issues[0].type).toBe('gap_in_numbers');
            expect(result.issues[0].expected).toBe(2);
            expect(result.issues[0].actual).toBe(3);
        });

        test('should detect duplicate map names', () => {
            const maps = {
                '2026-01-01': {
                    dayNumber: 1,
                    mapName: 'Alpha',
                    date: '2026-01-01'
                },
                '2026-01-02': {
                    dayNumber: 2,
                    mapName: 'Alpha',  // Duplicate name
                    date: '2026-01-02'
                }
            };
            
            const result = validateMapsDatabase(maps);
            expect(result.valid).toBe(false);
            expect(result.issues).toHaveLength(1);
            expect(result.issues[0].type).toBe('duplicate_name');
            expect(result.issues[0].name).toBe('Alpha');
        });

        test('should detect multiple issues at once', () => {
            const maps = {
                '2026-01-01': {
                    dayNumber: 1,
                    mapName: 'Alpha',
                    date: '2026-01-01'
                },
                '2026-01-02': {
                    dayNumber: 3,  // Gap
                    mapName: 'Alpha',  // Duplicate name
                    date: '2026-01-02'
                }
            };
            
            const result = validateMapsDatabase(maps);
            expect(result.valid).toBe(false);
            expect(result.issues.length).toBeGreaterThanOrEqual(2);
        });

        test('should handle empty database', () => {
            const maps = {};
            
            const result = validateMapsDatabase(maps);
            expect(result.valid).toBe(true);
            expect(result.issues).toHaveLength(0);
        });

        test('should handle single map database', () => {
            const maps = {
                '2026-01-01': {
                    dayNumber: 1,
                    mapName: 'Alpha',
                    date: '2026-01-01'
                }
            };
            
            const result = validateMapsDatabase(maps);
            expect(result.valid).toBe(true);
            expect(result.issues).toHaveLength(0);
        });
    });

    describe('fixMapsDatabase', () => {
        test('should fix gaps in day numbers', () => {
            const maps = {
                '2026-01-01': {
                    dayNumber: 1,
                    mapName: 'Alpha',
                    date: '2026-01-01'
                },
                '2026-01-02': {
                    dayNumber: 5,  // Gap
                    mapName: 'Beta',
                    date: '2026-01-02'
                },
                '2026-01-03': {
                    dayNumber: 10,  // Gap
                    mapName: 'Gamma',
                    date: '2026-01-03'
                }
            };
            
            const fixed = fixMapsDatabase(maps);
            
            // Check that day numbers are now sequential
            expect(fixed['2026-01-01'].dayNumber).toBe(1);
            expect(fixed['2026-01-02'].dayNumber).toBe(2);
            expect(fixed['2026-01-03'].dayNumber).toBe(3);
            
            // Validate the fixed database
            const validation = validateMapsDatabase(fixed);
            expect(validation.valid).toBe(true);
        });

        test('should fix duplicate map names', () => {
            const maps = {
                '2026-01-01': {
                    dayNumber: 1,
                    mapName: 'Alpha',
                    date: '2026-01-01'
                },
                '2026-01-02': {
                    dayNumber: 2,
                    mapName: 'Alpha',  // Duplicate
                    date: '2026-01-02'
                },
                '2026-01-03': {
                    dayNumber: 3,
                    mapName: 'Alpha',  // Duplicate
                    date: '2026-01-03'
                }
            };
            
            const fixed = fixMapsDatabase(maps);
            
            // Check that names are now unique
            expect(fixed['2026-01-01'].mapName).toBe('Alpha');
            expect(fixed['2026-01-02'].mapName).toBe('Alpha-1');
            expect(fixed['2026-01-03'].mapName).toBe('Alpha-2');
            
            // Validate the fixed database
            const validation = validateMapsDatabase(fixed);
            expect(validation.valid).toBe(true);
        });

        test('should preserve other map properties', () => {
            const maps = {
                '2026-01-01': {
                    dayNumber: 5,  // Wrong number
                    mapName: 'Alpha',
                    date: '2026-01-01',
                    size: 7,
                    goal: 10,
                    maxWalls: 9,
                    map: [['grass', 'water']]
                }
            };
            
            const fixed = fixMapsDatabase(maps);
            
            // Check that other properties are preserved
            expect(fixed['2026-01-01'].size).toBe(7);
            expect(fixed['2026-01-01'].goal).toBe(10);
            expect(fixed['2026-01-01'].maxWalls).toBe(9);
            expect(fixed['2026-01-01'].map).toEqual([['grass', 'water']]);
        });

        test('should not modify valid database', () => {
            const maps = {
                '2026-01-01': {
                    dayNumber: 1,
                    mapName: 'Alpha',
                    date: '2026-01-01'
                },
                '2026-01-02': {
                    dayNumber: 2,
                    mapName: 'Beta',
                    date: '2026-01-02'
                }
            };
            
            const fixed = fixMapsDatabase(maps);
            
            // Everything should remain the same
            expect(fixed['2026-01-01'].dayNumber).toBe(1);
            expect(fixed['2026-01-01'].mapName).toBe('Alpha');
            expect(fixed['2026-01-02'].dayNumber).toBe(2);
            expect(fixed['2026-01-02'].mapName).toBe('Beta');
        });
    });

    describe('getNextDayNumber', () => {
        test('should return 1 for non-existent directory', () => {
            const fakeDir = '/tmp/nonexistent-maps-test-dir-' + Date.now();
            const result = getNextDayNumber(fakeDir);
            expect(result).toBe(1);
        });

        test('should return correct next day number from existing directory', () => {
            const testDir = '/tmp/test-maps-dir-' + Date.now();
            fs.mkdirSync(testDir);
            const testMaps = {
                '2026-01-01': { dayNumber: 1, mapName: 'Alpha' },
                '2026-01-02': { dayNumber: 2, mapName: 'Beta' },
                '2026-01-03': { dayNumber: 3, mapName: 'Gamma' }
            };
            fs.writeFileSync(`${testDir}/2026.json`, JSON.stringify(testMaps));

            try {
                const result = getNextDayNumber(testDir);
                expect(result).toBe(4);
            } finally {
                fs.rmSync(testDir, { recursive: true });
            }
        });

        test('should handle empty maps directory', () => {
            const testDir = '/tmp/test-maps-empty-dir-' + Date.now();
            fs.mkdirSync(testDir);
            fs.writeFileSync(`${testDir}/2026.json`, JSON.stringify({}));

            try {
                const result = getNextDayNumber(testDir);
                expect(result).toBe(1);
            } finally {
                fs.rmSync(testDir, { recursive: true });
            }
        });

        test('should handle non-sequential day numbers', () => {
            const testDir = '/tmp/test-maps-nonseq-dir-' + Date.now();
            fs.mkdirSync(testDir);
            const testMaps = {
                '2026-01-01': { dayNumber: 1, mapName: 'Alpha' },
                '2026-01-02': { dayNumber: 5, mapName: 'Beta' },  // Gap
                '2026-01-03': { dayNumber: 3, mapName: 'Gamma' }
            };
            fs.writeFileSync(`${testDir}/2026.json`, JSON.stringify(testMaps));

            try {
                const result = getNextDayNumber(testDir);
                expect(result).toBe(6);  // Next after max (5)
            } finally {
                fs.rmSync(testDir, { recursive: true });
            }
        });
    });

    describe('Integration: Validation and Fix Together', () => {
        test('should fix all issues and pass validation', () => {
            const maps = {
                '2026-01-01': {
                    dayNumber: 1,
                    mapName: 'Alpha',
                    date: '2026-01-01'
                },
                '2026-01-02': {
                    dayNumber: 5,  // Gap
                    mapName: 'Alpha',  // Duplicate name
                    date: '2026-01-02'
                },
                '2026-01-03': {
                    dayNumber: 3,  // Out of order
                    mapName: 'Beta',
                    date: '2026-01-03'
                }
            };
            
            // Validate original - should fail
            let validation = validateMapsDatabase(maps);
            expect(validation.valid).toBe(false);
            
            // Fix issues
            const fixed = fixMapsDatabase(maps);
            
            // Validate fixed - should pass
            validation = validateMapsDatabase(fixed);
            expect(validation.valid).toBe(true);
            expect(validation.issues).toHaveLength(0);
        });
    });

    describe('maps/ directory structure', () => {
        let maps;
        
        beforeAll(() => {
            const mapsDir = require('path').join(__dirname, '../../maps');
            const { readAllMaps } = require('../../scripts/lib/mapUtils.js');
            maps = readAllMaps(mapsDir);
        });
        
        test('all maps should have optimalSolution field', () => {
            const dates = Object.keys(maps);
            expect(dates.length).toBeGreaterThan(0);
            
            for (const date of dates) {
                const map = maps[date];
                expect(map).toHaveProperty('optimalSolution');
                expect(Array.isArray(map.optimalSolution)).toBe(true);
                expect(map.optimalSolution.length).toBeGreaterThan(0);
            }
        });
        
        test('optimalSolution entries should be flat [row, col, ...] number pairs', () => {
            const dates = Object.keys(maps);
            
            for (const date of dates) {
                const map = maps[date];
                // Flat array: even indices are rows, odd indices are columns
                expect(map.optimalSolution.length % 2).toBe(0);
                for (let i = 0; i < map.optimalSolution.length; i++) {
                    expect(typeof map.optimalSolution[i]).toBe('number');
                    const val = map.optimalSolution[i];
                    // Coordinates should be within grid bounds
                    expect(val).toBeGreaterThanOrEqual(0);
                    expect(val).toBeLessThan(map.size);
                }
            }
        });
        
        test('optimalSolution wall count should equal maxWalls (all walls needed)', () => {
            const dates = Object.keys(maps);
            
            for (const date of dates) {
                const map = maps[date];
                // Flat array: divide by 2 to get number of walls
                const wallCount = map.optimalSolution.length / 2;
                // Rule 1: maxWalls is the minimum needed, so wall count must equal it
                expect(wallCount).toBe(map.maxWalls);
            }
        });
        
        test('all maps should have required fields', () => {
            const dates = Object.keys(maps);
            const requiredFields = ['dayNumber', 'mapName', 'date', 'size', 'goal', 'maxWalls', 'map', 'optimalSolution'];
            
            for (const date of dates) {
                for (const field of requiredFields) {
                    expect(maps[date]).toHaveProperty(field);
                }
            }
        });
        
        test('should have at least 7 maps for a full week', () => {
            const dates = Object.keys(maps);
            expect(dates.length).toBeGreaterThanOrEqual(7);
        });
    });
});

// ---------------------------------------------------------------------------
// weaveInsert tests
// ---------------------------------------------------------------------------

describe('weaveInsert', () => {
    /**
     * Build a minimal maps object for testing.
     * @param {string[]} dates - Array of YYYY-MM-DD date strings
     * @returns {Object}
     */
    function buildMaps(dates) {
        const maps = {};
        dates.forEach((date, i) => {
            maps[date] = {
                date,
                mapName: `Map-${i + 1}`,
                dayNumber: i + 1,
                size: 9,
                goal: 10,
                maxWalls: 5,
            };
        });
        return maps;
    }

    test('preserves maps before the insertion zone unchanged', () => {
        // today = 2026-01-01, insertion zone starts at 2026-01-03
        const today = '2026-01-01';
        const maps = buildMaps(['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04']);
        const newMap = { date: 'TEMP', mapName: 'New', size: 9, goal: 10, maxWalls: 5 };

        const result = weaveInsert(maps, [newMap], today);

        // Fixed portion (< today+2 = 2026-01-03) must not change
        expect(result['2026-01-01']).toBeDefined();
        expect(result['2026-01-01'].mapName).toBe('Map-1');
        expect(result['2026-01-02']).toBeDefined();
        expect(result['2026-01-02'].mapName).toBe('Map-2');
    });

    test('total map count equals existing + new', () => {
        const today = '2026-01-01';
        const maps = buildMaps(['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05']);
        const newMaps = [
            { date: 'TEMP-1', mapName: 'A', size: 9, goal: 10, maxWalls: 5 },
            { date: 'TEMP-2', mapName: 'B', size: 9, goal: 10, maxWalls: 5 },
            { date: 'TEMP-3', mapName: 'C', size: 9, goal: 10, maxWalls: 5 },
        ];

        const result = weaveInsert(maps, newMaps, today);
        expect(Object.keys(result)).toHaveLength(5 + 3);
    });

    test('insertion zone maps retain their relative order among each other', () => {
        const today = '2026-01-01';
        // Fixed: 01-01, 01-02. Insertion zone: 01-03, 01-04, 01-05
        const maps = buildMaps(['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05']);
        const TRIALS = 50;

        // Run many times to be confident order is preserved regardless of random placement
        for (let trial = 0; trial < TRIALS; trial++) {
            const newMaps = [{ date: 'TEMP', mapName: 'New', size: 9, goal: 10, maxWalls: 5 }];
            const result = weaveInsert(maps, newMaps, today);

            // Extract the sorted result dates in the insertion zone
            const resultDates = Object.keys(result).sort().filter(d => d >= '2026-01-03');
            const resultNames = resultDates.map(d => result[d].mapName);

            // Map-3, Map-4, Map-5 should appear in this relative order
            const existingInOrder = resultNames.filter(n => ['Map-3', 'Map-4', 'Map-5'].includes(n));
            expect(existingInOrder).toEqual(['Map-3', 'Map-4', 'Map-5']);
        }
    });

    test('newly inserted maps are assigned dates in the insertion zone', () => {
        const today = '2026-01-01';
        const maps = buildMaps(['2026-01-01', '2026-01-02', '2026-01-03']);
        const newMaps = [
            { date: 'TEMP-1', mapName: 'X', size: 9, goal: 10, maxWalls: 5 },
            { date: 'TEMP-2', mapName: 'Y', size: 9, goal: 10, maxWalls: 5 },
        ];

        const result = weaveInsert(maps, newMaps, today);

        // All result dates must be valid YYYY-MM-DD strings
        for (const date of Object.keys(result)) {
            expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }

        // No TEMP dates should remain
        expect(Object.keys(result).some(d => d.startsWith('TEMP'))).toBe(false);
    });

    test('all dates in the insertion zone are sequential with no gaps', () => {
        const today = '2026-01-01';
        const maps = buildMaps(['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04']);
        const newMaps = [
            { date: 'TEMP-1', mapName: 'A', size: 9, goal: 10, maxWalls: 5 },
            { date: 'TEMP-2', mapName: 'B', size: 9, goal: 10, maxWalls: 5 },
        ];

        const result = weaveInsert(maps, newMaps, today);
        const sortedDates = Object.keys(result).sort();

        // Verify dates are consecutive (no gaps)
        for (let i = 1; i < sortedDates.length; i++) {
            const prev = new Date(sortedDates[i - 1]);
            const curr = new Date(sortedDates[i]);
            const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
            expect(diffDays).toBe(1);
        }
    });

    test('works correctly when there are no existing maps in the insertion zone', () => {
        const today = '2026-01-05';
        // All maps are before insertion zone (< today+2 = 2026-01-07)
        const maps = buildMaps(['2026-01-01', '2026-01-02', '2026-01-03']);
        const newMaps = [
            { date: 'TEMP-1', mapName: 'A', size: 9, goal: 10, maxWalls: 5 },
            { date: 'TEMP-2', mapName: 'B', size: 9, goal: 10, maxWalls: 5 },
        ];

        const result = weaveInsert(maps, newMaps, today);
        expect(Object.keys(result)).toHaveLength(5);

        // New maps placed starting at insertion zone
        expect(result['2026-01-07']).toBeDefined();
        expect(result['2026-01-08']).toBeDefined();
    });

    test('works correctly when all existing maps are in the insertion zone', () => {
        const today = '2025-12-31';
        // insertion zone starts at 2026-01-02 — all test maps are within it
        const maps = buildMaps(['2026-01-02', '2026-01-03', '2026-01-04']);
        const newMaps = [{ date: 'TEMP', mapName: 'Z', size: 9, goal: 10, maxWalls: 5 }];

        const result = weaveInsert(maps, newMaps, today);
        expect(Object.keys(result)).toHaveLength(4);
    });

    test('works correctly with empty existing maps', () => {
        const today = '2026-01-01';
        const newMaps = [
            { date: 'TEMP-1', mapName: 'A', size: 9, goal: 10, maxWalls: 5 },
            { date: 'TEMP-2', mapName: 'B', size: 9, goal: 10, maxWalls: 5 },
        ];

        const result = weaveInsert({}, newMaps, today);
        expect(Object.keys(result)).toHaveLength(2);
        // Both new maps start from insertion zone
        expect(result['2026-01-03']).toBeDefined();
        expect(result['2026-01-04']).toBeDefined();
    });

    test('passes validateMapsDatabase after fixMapsDatabase', () => {
        const today = '2026-01-01';
        const maps = buildMaps(['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05']);
        const newMaps = [
            { date: 'TEMP-1', mapName: 'Alpha', size: 9, goal: 10, maxWalls: 5 },
            { date: 'TEMP-2', mapName: 'Beta', size: 9, goal: 10, maxWalls: 5 },
            { date: 'TEMP-3', mapName: 'Gamma', size: 9, goal: 10, maxWalls: 5 },
        ];

        const result = weaveInsert(maps, newMaps, today);
        const fixed = fixMapsDatabase(result);
        const validation = validateMapsDatabase(fixed);
        expect(validation.valid).toBe(true);
    });
});
