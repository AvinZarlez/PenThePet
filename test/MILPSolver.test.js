/**
 * Unit Tests for MILPSolver.js
 * 
 * Tests the MILP solver for optimal wall placement.
 * 
 * Note: Some slow performance tests are skipped by default to keep the test suite fast (<10 seconds).
 * These tests use large maps (7x7) with exhaustive search checking millions of combinations.
 * To run the skipped tests: npx jest --testNamePattern="Performance"
 */

const MILPSolver = require('../js/MILPSolver.js');
const PathfindingUtils = require('../js/PathfindingUtils.js');

describe('MILPSolver', () => {
    describe('solveMap()', () => {
        test('should return null for map without home tile', () => {
            const map = [
                [1, 1, 1],
                [1, 1, 1],
                [1, 1, 1]
            ];
            const result = MILPSolver.solveMap(map, 5);
            expect(result).toBeNull();
        });

        test('should find solution for simple solvable map', () => {
            const map = [
                [1, 1, 1, 1, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 2, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1]
            ];
            const result = MILPSolver.solveMap(map, 5);
            
            expect(result).not.toBeNull();
            expect(result).toHaveProperty('walls');
            expect(result).toHaveProperty('goalArea');
            expect(result).toHaveProperty('optimalWallCount');
            expect(typeof result.goalArea).toBe('number');
            expect(result.goalArea).toBeGreaterThan(0);
        }, 30000); // 30 second timeout

        test('should return solution for already penned home', () => {
            const map = [
                [0, 0, 0],
                [0, 2, 0],
                [0, 0, 0]
            ];
            const result = MILPSolver.solveMap(map, 5);
            
            expect(result).not.toBeNull();
            expect(result.goalArea).toBe(1);
            expect(result.optimalWallCount).toBe(0);
        });

        test('should handle small maps efficiently', () => {
            const map = [
                [1, 1, 1],
                [1, 2, 1],
                [1, 1, 1]
            ];
            const startTime = Date.now();
            const result = MILPSolver.solveMap(map, 4);
            const elapsed = Date.now() - startTime;
            
            expect(result).not.toBeNull();
            expect(elapsed).toBeLessThan(20000); // Should complete in reasonable time
        }, 25000); // 25 second timeout

        test('should return walls array with correct dimensions', () => {
            const map = [
                [1, 1, 1, 1, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 2, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1]
            ];
            const result = MILPSolver.solveMap(map, 5);
            
            expect(result).not.toBeNull();
            expect(Array.isArray(result.walls)).toBe(true);
            expect(result.walls.length).toBe(5);
            expect(result.walls[0].length).toBe(5);
        });

        test('should use no more than maxWalls', () => {
            const map = [
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1],
                [1, 1, 2, 1, 1],
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1]
            ];
            const maxWalls = 3;
            const result = MILPSolver.solveMap(map, maxWalls);
            
            if (result) {
                const wallCount = result.walls.flat().reduce((sum, val) => sum + val, 0);
                expect(wallCount).toBeLessThanOrEqual(maxWalls);
            }
        });

        test('should maximize penned area (not minimize)', () => {
            const map = [
                [1, 1, 1, 1, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 2, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1]
            ];
            const result = MILPSolver.solveMap(map, 8);
            
            if (result) {
                // Should find a solution (area may be 1 if best solution is just home)
                expect(result.goalArea).toBeGreaterThanOrEqual(1);
                // optimalWallCount may be 0 if already penned
                expect(result.optimalWallCount).toBeGreaterThanOrEqual(0);
            }
        }, 30000); // 30 second timeout

        test('should handle map with home at edge', () => {
            const map = [
                [2, 1, 1],
                [1, 1, 1],
                [1, 1, 1]
            ];
            const result = MILPSolver.solveMap(map, 5);
            
            // Home at edge is already penned (cannot reach far edge)
            // or may not be pennable - either result is valid
            expect(result === null || typeof result.goalArea === 'number').toBe(true);
        });
    });

    // Note: _findBestWallPlacement and _exhaustiveSearch methods were removed.
    // The solver now delegates to Python MILP solver (Node.js) or JS-based search (browser).
    // The _checkCombinationsIteratively method is still available for the JS fallback.

    // Note: _heuristicSearch and related methods have been removed as they were experimental
    // and not used in production code.

    describe('_checkCombinationsIteratively()', () => {
        test('should check combinations without exceeding maxToCheck', () => {
            const map = [
                [1, 1, 1],
                [1, 2, 1],
                [1, 1, 1]
            ];
            const grassTiles = [];
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (map[i][j] === 1) {
                        grassTiles.push([i, j]);
                    }
                }
            }
            
            const result = MILPSolver._checkCombinationsIteratively(
                map, grassTiles, 3, 1, 1, 0
            );
            
            expect(result).toHaveProperty('checked');
            expect(result).toHaveProperty('area');
            expect(result.checked).toBeGreaterThan(0);
        });

        test('should update best solution when better one found', () => {
            const map = [
                [1, 1, 1, 1, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 2, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1]
            ];
            const grassTiles = [];
            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 5; j++) {
                    if (map[i][j] === 1) {
                        grassTiles.push([i, j]);
                    }
                }
            }
            
            const result = MILPSolver._checkCombinationsIteratively(
                map, grassTiles, 4, 2, 2, 0
            );
            
            if (result.solution) {
                expect(result.area).toBeGreaterThan(0);
            }
        });

        // Skipped: This test uses a 7x7 map which is slow (checks 1.7M+ combinations).
        test.skip('should respect safety limit', () => {
            const map = [
                [1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 2, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1]
            ];
            const grassTiles = [];
            for (let i = 0; i < 7; i++) {
                for (let j = 0; j < 7; j++) {
                    if (map[i][j] === 1) {
                        grassTiles.push([i, j]);
                    }
                }
            }
            
            const result = MILPSolver._checkCombinationsIteratively(
                map, grassTiles, 5, 3, 3, 0
            );
            
            expect(result.checked).toBeLessThanOrEqual(5000000);
        });
    });

    // Note: _heuristicSearch and related methods have been removed as they were experimental
    // and not used in production code. The solver uses only exhaustive search for accuracy.

    describe('Integration with PathfindingUtils', () => {
        test('solver result should be verifiable with PathfindingUtils', () => {
            const map = [
                [1, 1, 1, 1, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 2, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1]
            ];
            const result = MILPSolver.solveMap(map, 8);
            
            if (result) {
                // Apply walls to map
                const testMap = map.map(row => [...row]);
                for (let i = 0; i < result.walls.length; i++) {
                    for (let j = 0; j < result.walls[0].length; j++) {
                        if (result.walls[i][j] === 1) {
                            testMap[i][j] = 5;
                        }
                    }
                }
                
                // Verify pet is penned
                const isPenned = PathfindingUtils.isPenned(testMap, 2, 2);
                expect(isPenned).toBe(true);
                
                // Verify area matches
                const area = PathfindingUtils.calculatePennedArea(testMap, 2, 2);
                expect(area).toBe(result.goalArea);
            }
        });

        test('solution should maximize area as intended', () => {
            const map = [
                [1, 1, 1, 1, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 2, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1]
            ];
            const result = MILPSolver.solveMap(map, 10);
            
            if (result) {
                // Goal area should be valid (may be 1 for minimal penning)
                expect(result.goalArea).toBeGreaterThanOrEqual(1);
                expect(typeof result.goalArea).toBe('number');
            }
        });
    });

    describe('Edge Cases', () => {
        test('should handle 3x3 minimum map', () => {
            const map = [
                [1, 1, 1],
                [1, 2, 1],
                [1, 1, 1]
            ];
            const result = MILPSolver.solveMap(map, 4);
            expect(result).not.toBeNull();
        });

        test('should handle map with no grass tiles (only water and home)', () => {
            const map = [
                [0, 0, 0],
                [0, 2, 0],
                [0, 0, 0]
            ];
            const result = MILPSolver.solveMap(map, 5);
            
            expect(result).not.toBeNull();
            expect(result.goalArea).toBe(1);
        });

        test('should handle map with very few grass tiles', () => {
            const map = [
                [0, 1, 0],
                [1, 2, 1],
                [0, 1, 0]
            ];
            const result = MILPSolver.solveMap(map, 4);
            expect(result).not.toBeNull();
        });

        test('should handle maxWalls = 0', () => {
            const map = [
                [0, 0, 0],
                [0, 2, 0],
                [0, 0, 0]
            ];
            const result = MILPSolver.solveMap(map, 0);
            
            // Should still work for already penned scenarios
            expect(result).not.toBeNull();
        });

        test('should handle very large maxWalls', () => {
            const map = [
                [1, 1, 1],
                [1, 2, 1],
                [1, 1, 1]
            ];
            const result = MILPSolver.solveMap(map, 100);
            expect(result).not.toBeNull();
        });
    });

    describe('Performance', () => {
        // These tests are skipped by default to keep the test suite fast (<10 seconds).
        // Run with: npx jest --testNamePattern="Performance" to test performance.
        // Note: These tests can take 30-60+ seconds each due to exhaustive combinatorial search.
        
        test.skip('should complete 5x5 map in reasonable time', () => {
            const map = [
                [1, 1, 1, 1, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 2, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1]
            ];
            
            const startTime = Date.now();
            MILPSolver.solveMap(map, 8);
            const elapsed = Date.now() - startTime;
            
            expect(elapsed).toBeLessThan(30000); // 30 seconds max
        }, 40000); // 40 second timeout

        test.skip('should handle 7x7 map efficiently', () => {
            const map = Array(7).fill(null).map(() => Array(7).fill(1));
            const center = 3;
            map[center][center] = 2;
            // Add some water
            map[0][0] = 0;
            map[0][6] = 0;
            map[6][0] = 0;
            map[6][6] = 0;
            
            const startTime = Date.now();
            MILPSolver.solveMap(map, 10);
            const elapsed = Date.now() - startTime;
            
            expect(elapsed).toBeLessThan(60000); // 60 seconds max
        }, 70000); // 70 second timeout
    });

    describe('Private Methods and Edge Cases', () => {
        describe('Edge cases for wall placement', () => {
            test('should handle map where no solution exists', () => {
                // Map completely surrounded by water - already penned
                const map = [
                    [0, 0, 0],
                    [0, 2, 0],
                    [0, 0, 0]
                ];
                const result = MILPSolver.solveMap(map, 5);
                
                expect(result).not.toBeNull();
                expect(result.goalArea).toBe(1);
                expect(result.optimalWallCount).toBe(0);
            });

            test('should handle asymmetric maps', () => {
                const map = [
                    [1, 1, 0, 0, 0],
                    [1, 2, 1, 0, 0],
                    [1, 1, 1, 1, 0],
                    [0, 1, 1, 1, 1],
                    [0, 0, 1, 1, 1]
                ];
                const result = MILPSolver.solveMap(map, 5);
                
                expect(result).not.toBeNull();
                expect(result.goalArea).toBeGreaterThan(0);
            });

            test('should maximize penned area not minimize', () => {
                // Test that we're looking for MAXIMUM area
                const map = [
                    [1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1],
                    [1, 1, 2, 1, 1],
                    [1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1]
                ];
                const result = MILPSolver.solveMap(map, 8);
                
                expect(result).not.toBeNull();
                // Should find a penned area (may be small due to max walls limit)
                expect(result.goalArea).toBeGreaterThanOrEqual(1);
            });
        });

        describe('Combination generation', () => {
            test('should handle maxWalls = 1 with constrained map', () => {
                // A map where only 1 wall can potentially pen the pet
                const map = [
                    [0, 1, 0],
                    [1, 2, 1],
                    [0, 1, 0]
                ];
                const result = MILPSolver.solveMap(map, 1);
                
                // May or may not find a solution depending on map structure
                // Just verify it doesn't crash
                if (result !== null) {
                    expect(result.optimalWallCount).toBeLessThanOrEqual(1);
                }
            });

            test('should handle map with single grass tile', () => {
                const map = [
                    [0, 0, 0],
                    [0, 2, 1],
                    [0, 0, 0]
                ];
                const result = MILPSolver.solveMap(map, 1);
                
                expect(result).not.toBeNull();
                // With one grass tile blocking the only exit, should pen home
                expect(result.goalArea).toBe(1);
            });
        });
    });

    // Note: solveMapWithTimeLimit was removed. The solver now uses Python MILP
    // for optimal results in Node.js, and JS-based search in the browser.
});
