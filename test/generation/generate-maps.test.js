/**
 * Unit Tests for scripts/lib/mapUtils.js
 *
 * Tests the map database validation and fixing logic.
 */

const { 
    validateMapsDatabase, 
    fixMapsDatabase, 
    getNextDayNumber 
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
        test('should return 1 for non-existent file', () => {
            const fakePath = '/tmp/nonexistent-maps-test-file.json';
            const result = getNextDayNumber(fakePath);
            expect(result).toBe(1);
        });

        test('should return correct next day number from existing file', () => {
            // Create a temporary test file
            const testPath = '/tmp/test-maps-' + Date.now() + '.json';
            const testMaps = {
                '2026-01-01': { dayNumber: 1, mapName: 'Alpha' },
                '2026-01-02': { dayNumber: 2, mapName: 'Beta' },
                '2026-01-03': { dayNumber: 3, mapName: 'Gamma' }
            };
            
            fs.writeFileSync(testPath, JSON.stringify(testMaps));
            
            try {
                const result = getNextDayNumber(testPath);
                expect(result).toBe(4);
            } finally {
                // Cleanup
                if (fs.existsSync(testPath)) {
                    fs.unlinkSync(testPath);
                }
            }
        });

        test('should handle empty maps file', () => {
            // Create a temporary test file with empty maps
            const testPath = '/tmp/test-maps-empty-' + Date.now() + '.json';
            fs.writeFileSync(testPath, JSON.stringify({}));
            
            try {
                const result = getNextDayNumber(testPath);
                expect(result).toBe(1);
            } finally {
                // Cleanup
                if (fs.existsSync(testPath)) {
                    fs.unlinkSync(testPath);
                }
            }
        });

        test('should handle non-sequential day numbers', () => {
            // Create a temporary test file with non-sequential day numbers
            const testPath = '/tmp/test-maps-nonseq-' + Date.now() + '.json';
            const testMaps = {
                '2026-01-01': { dayNumber: 1, mapName: 'Alpha' },
                '2026-01-02': { dayNumber: 5, mapName: 'Beta' },  // Gap
                '2026-01-03': { dayNumber: 3, mapName: 'Gamma' }
            };
            
            fs.writeFileSync(testPath, JSON.stringify(testMaps));
            
            try {
                const result = getNextDayNumber(testPath);
                expect(result).toBe(6);  // Next after max (5)
            } finally {
                // Cleanup
                if (fs.existsSync(testPath)) {
                    fs.unlinkSync(testPath);
                }
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

    describe('maps.json structure', () => {
        let maps;
        
        beforeAll(() => {
            const mapsPath = require('path').join(__dirname, '../../maps.json');
            const data = fs.readFileSync(mapsPath, 'utf8');
            maps = JSON.parse(data);
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
        
        test('optimalSolution entries should be [row, col] coordinate pairs', () => {
            const dates = Object.keys(maps);
            
            for (const date of dates) {
                const map = maps[date];
                for (const coord of map.optimalSolution) {
                    expect(Array.isArray(coord)).toBe(true);
                    expect(coord).toHaveLength(2);
                    expect(typeof coord[0]).toBe('number');
                    expect(typeof coord[1]).toBe('number');
                    // Coordinates should be within grid bounds
                    expect(coord[0]).toBeGreaterThanOrEqual(0);
                    expect(coord[0]).toBeLessThan(map.size);
                    expect(coord[1]).toBeGreaterThanOrEqual(0);
                    expect(coord[1]).toBeLessThan(map.size);
                }
            }
        });
        
        test('optimalSolution wall count should not exceed maxWalls', () => {
            const dates = Object.keys(maps);
            
            for (const date of dates) {
                const map = maps[date];
                expect(map.optimalSolution.length).toBeLessThanOrEqual(map.maxWalls);
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
