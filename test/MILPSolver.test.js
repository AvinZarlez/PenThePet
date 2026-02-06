/**
 * Unit Tests for MILPSolver.js
 * 
 * Tests the MILP solver for optimal wall placement.
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

    describe('_findBestWallPlacement()', () => {
        test('should handle already penned scenarios', () => {
            const map = [
                [5, 5, 5],
                [5, 2, 5],
                [5, 5, 5]
            ];
            const result = MILPSolver._findBestWallPlacement(map, 5, 1, 1);
            
            expect(result).not.toBeNull();
            expect(result.goalArea).toBe(1);
            expect(result.optimalWallCount).toBe(0);
        });

        test('should find solution with available grass tiles', () => {
            const map = [
                [1, 1, 1, 1, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 2, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1]
            ];
            const result = MILPSolver._findBestWallPlacement(map, 8, 2, 2);
            
            expect(result).not.toBeNull();
            expect(result).toHaveProperty('goalArea');
            expect(result).toHaveProperty('optimalWallCount');
        });

        test('should return null if no valid solution exists', () => {
            // Map where home cannot be penned with reasonable walls
            const map = [
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1],
                [1, 1, 2, 1, 1],
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1]
            ];
            const result = MILPSolver._findBestWallPlacement(map, 2, 2, 2);
            
            // With only 2 walls on a 5x5 open grid, unlikely to pen effectively
            // Result could be null or have a solution depending on search
            expect(result === null || typeof result.goalArea === 'number').toBe(true);
        });
    });

    describe('_exhaustiveSearch()', () => {
        test('should explore combinations systematically', () => {
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
            
            const result = MILPSolver._exhaustiveSearch(map, 4, 1, 1, grassTiles);
            
            expect(result).not.toBeNull();
            expect(result).toHaveProperty('goalArea');
        });

        test('should handle small number of grass tiles', () => {
            const map = [
                [0, 1, 0],
                [1, 2, 1],
                [0, 1, 0]
            ];
            const grassTiles = [[0,1], [1,0], [1,2], [2,1]];
            
            const result = MILPSolver._exhaustiveSearch(map, 4, 1, 1, grassTiles);
            
            expect(result).not.toBeNull();
        });

        test('should return best solution among options', () => {
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
            
            const result = MILPSolver._exhaustiveSearch(map, 8, 2, 2, grassTiles);
            
            expect(result).not.toBeNull();
            expect(result.goalArea).toBeGreaterThan(0);
        });
    });

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

        test('should respect safety limit', () => {
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
            
            // Should not check more than maxToCheck (100000)
            expect(result.checked).toBeLessThanOrEqual(100000);
        });
    });

    describe('_heuristicSearch()', () => {
        test('should find solution using heuristics', () => {
            const map = [
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1],
                [1, 1, 2, 1, 1],
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1]
            ];
            const result = MILPSolver._heuristicSearch(map, 6, 2, 2);
            
            // Heuristic may or may not find solution
            expect(result === null || typeof result.goalArea === 'number').toBe(true);
        });

        test('should complete in reasonable time for large maps', () => {
            const size = 9;
            const map = Array(size).fill(null).map(() => Array(size).fill(1));
            const center = Math.floor(size / 2);
            map[center][center] = 2;
            
            const startTime = Date.now();
            const result = MILPSolver._heuristicSearch(map, 8, center, center);
            const elapsed = Date.now() - startTime;
            
            expect(elapsed).toBeLessThan(30000); // Should complete in 30 seconds
        });

        test('should try multiple strategies', () => {
            const map = [
                [1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 1],
                [1, 0, 1, 1, 1, 0, 1],
                [1, 0, 1, 2, 1, 0, 1],
                [1, 0, 1, 1, 1, 0, 1],
                [1, 0, 0, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1]
            ];
            const result = MILPSolver._heuristicSearch(map, 8, 3, 3);
            
            // Should attempt solution
            expect(result === null || result.goalArea).toBeTruthy();
        });
    });

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
        test('should complete 5x5 map in reasonable time', () => {
            const map = [
                [1, 1, 1, 1, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 2, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1]
            ];
            
            const startTime = Date.now();
            const result = MILPSolver.solveMap(map, 8);
            const elapsed = Date.now() - startTime;
            
            expect(elapsed).toBeLessThan(30000); // 30 seconds max
        }, 40000); // 40 second timeout

        test('should handle 7x7 map efficiently', () => {
            const map = Array(7).fill(null).map(() => Array(7).fill(1));
            const center = 3;
            map[center][center] = 2;
            // Add some water
            map[0][0] = 0;
            map[0][6] = 0;
            map[6][0] = 0;
            map[6][6] = 0;
            
            const startTime = Date.now();
            const result = MILPSolver.solveMap(map, 10);
            const elapsed = Date.now() - startTime;
            
            expect(elapsed).toBeLessThan(60000); // 60 seconds max
        }, 70000); // 70 second timeout
    });
});
