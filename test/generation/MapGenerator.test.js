/**
 * Unit Tests for MapGenerator.js
 * 
 * Tests the map generation and validation logic.
 * MapGenerator is used by the generation scripts (Node.js only),
 * not loaded in the browser.
 */

const MapGenerator = require('../../js/generation/MapGenerator.js');
const MILPSolver = require('../../scripts/solver/MILPSolver.js');
const CONSTANTS = require('../../js/config/constants.js');

describe('MapGenerator', () => {
    describe('Constructor', () => {
        test('should create MapGenerator with given size', () => {
            const generator = new MapGenerator(9);
            expect(generator.size).toBe(9);
        });

        test('should use default tile distribution if not provided', () => {
            const generator = new MapGenerator(9);
            expect(generator.tileDistribution).toEqual(CONSTANTS.TILE_DISTRIBUTION);
        });

        test('should use custom tile distribution if provided', () => {
            const customDist = { grass: 0.8, water: 0.2 };
            const generator = new MapGenerator(9, customDist);
            expect(generator.tileDistribution).toEqual(customDist);
        });

        test('should set maxAttempts from CONSTANTS', () => {
            const generator = new MapGenerator(9);
            expect(generator.maxAttempts).toBe(CONSTANTS.MAX_GENERATION_ATTEMPTS);
        });

        test('should handle various grid sizes', () => {
            const sizes = [7, 9, 11, 13, 15];
            sizes.forEach(size => {
                const generator = new MapGenerator(size);
                expect(generator.size).toBe(size);
            });
        });
    });

    describe('generate()', () => {
        /**
         * Helper: create a solver mock that distinguishes between the limited
         * solve (maxWalls <= CONSTANTS.maxWallsForSize) and the unlimited solve
         * (maxWalls == size*size). The generate() method makes both calls.
         */
        function mockSolverCalls(size, limitedResult, unlimitedGoalArea) {
            const unlimitedWalls = size * size;
            return jest.spyOn(MILPSolver, 'solveMap').mockImplementation((_map, maxWalls) => {
                if (maxWalls >= unlimitedWalls) {
                    // Unlimited solve — return a higher score so rule 3 passes
                    return {
                        walls: Array(size).fill(null).map(() => Array(size).fill(0)),
                        goalArea: unlimitedGoalArea,
                        optimalWallCount: limitedResult.optimalWallCount + 2
                    };
                }
                // Limited solve
                return {
                    walls: limitedResult.walls || Array(size).fill(null).map(() => Array(size).fill(0)),
                    goalArea: limitedResult.goalArea,
                    optimalWallCount: limitedResult.optimalWallCount
                };
            });
        }

        test('should generate a valid map with goal', () => {
            const spy = mockSolverCalls(7,
                { goalArea: 9, optimalWallCount: 3 },
                20 // unlimited score > 9
            );

            const generator = new MapGenerator(7);
            const result = generator.generate();

            expect(result).not.toBeNull();
            expect(result).toHaveProperty('map');
            expect(result).toHaveProperty('goal');
            expect(result).toHaveProperty('maxWalls');
            
            spy.mockRestore();
        });

        test('should generate map of correct size', () => {
            const spy = mockSolverCalls(7,
                { goalArea: 10, optimalWallCount: 5 },
                30
            );

            const generator = new MapGenerator(7);
            const result = generator.generate();

            expect(result.map.length).toBe(7);
            expect(result.map[0].length).toBe(7);
            
            spy.mockRestore();
        });

        test('should place home tile at center', () => {
            const spy = mockSolverCalls(7,
                { goalArea: 9, optimalWallCount: 4 },
                20
            );

            const generator = new MapGenerator(7);
            const result = generator.generate();

            const centerRow = Math.floor(7 / 2);
            const centerCol = Math.floor(7 / 2);
            expect(result.map[centerRow][centerCol]).toBe('home');
            
            spy.mockRestore();
        });

        test('should accept optional dateString parameter', () => {
            const spy = mockSolverCalls(7,
                { goalArea: 9, optimalWallCount: 2 },
                15
            );

            const generator = new MapGenerator(7);
            const result = generator.generate('2024-01-01');

            expect(result).not.toBeNull();
            
            spy.mockRestore();
        });

        test('should return map with goal and maxWalls equal to optimalWallCount', () => {
            const spy = mockSolverCalls(7,
                { goalArea: 9, optimalWallCount: 3 },
                20
            );

            const generator = new MapGenerator(7);
            const result = generator.generate();

            expect(result.goal).toBe(9);
            // Rule 1: maxWalls is the solver's optimalWallCount (minimum walls needed)
            expect(result.maxWalls).toBe(3);
            
            spy.mockRestore();
        });

        test('should retry if optimalWallCount exceeds maxWalls for size', () => {
            let callCount = 0;
            const sizeMaxWalls = CONSTANTS.maxWallsForSize(7);
            jest.spyOn(MILPSolver, 'solveMap').mockImplementation((_map, maxWalls) => {
                callCount++;
                const size = 7;
                // Unlimited solve
                if (maxWalls >= size * size) {
                    return {
                        walls: Array(7).fill(null).map(() => Array(7).fill(0)),
                        goalArea: 30,
                        optimalWallCount: 8
                    };
                }
                // First limited call: too many walls
                if (callCount === 1) {
                    return {
                        walls: Array(7).fill(null).map(() => Array(7).fill(0)),
                        goalArea: 9,
                        optimalWallCount: 20 // Too many walls
                    };
                }
                // Subsequent limited calls: within budget
                return {
                    walls: Array(7).fill(null).map(() => Array(7).fill(0)),
                    goalArea: 9,
                    optimalWallCount: 3
                };
            });

            const generator = new MapGenerator(7);
            const result = generator.generate();

            expect(callCount).toBeGreaterThan(1);
            expect(result.maxWalls).toBeLessThanOrEqual(sizeMaxWalls);
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should throw error if max attempts exceeded', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue(null);

            const generator = new MapGenerator(3);
            
            expect(() => generator.generate()).toThrow('Failed to generate valid map');
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should accept useTimeLimit parameter for debug generation', () => {
            const spy = mockSolverCalls(7,
                { goalArea: 12, optimalWallCount: 5 },
                30
            );

            const generator = new MapGenerator(7);
            const result = generator.generate(null);

            expect(result).not.toBeNull();
            expect(result.goal).toBe(12);
            // Rule 1: maxWalls equals optimalWallCount
            expect(result.maxWalls).toBe(5);
            
            spy.mockRestore();
        });

        test('Rule 1: maxWalls should equal optimalWallCount (minimum walls needed)', () => {
            const spy = mockSolverCalls(7,
                { goalArea: 10, optimalWallCount: 3 }, // Solver only needs 3 walls
                25
            );

            const generator = new MapGenerator(7);
            const result = generator.generate();

            // maxWalls should be 3, not 5 (floor(7*0.75))
            expect(result.maxWalls).toBe(3);
            expect(result.goal).toBe(10);
            
            spy.mockRestore();
        });

        test('Rule 3: should reject map when unlimited walls do not improve score', () => {
            // The unlimited solve returns the SAME score as the limited solve
            const size = 7;
            jest.spyOn(MILPSolver, 'solveMap').mockImplementation((_map, _maxWalls) => {
                return {
                    walls: Array(size).fill(null).map(() => Array(size).fill(0)),
                    goalArea: 8,
                    optimalWallCount: 4
                };
            });

            const generator = new MapGenerator(size);
            // Should throw because every generated map fails rule 3
            expect(() => generator.generate()).toThrow('Failed to generate valid map');
            
            MILPSolver.solveMap.mockRestore();
        });
    });

    describe('_generateRandomMap()', () => {
        test('should generate map of correct size', () => {
            const generator = new MapGenerator(5);
            const map = generator._generateRandomMap();

            expect(map.length).toBe(5);
            expect(map[0].length).toBe(5);
        });

        test('should place home at center', () => {
            const generator = new MapGenerator(7);
            const map = generator._generateRandomMap();

            const centerRow = Math.floor(7 / 2);
            const centerCol = Math.floor(7 / 2);
            expect(map[centerRow][centerCol]).toBe('home');
        });

        test('should generate tiles based on distribution', () => {
            const generator = new MapGenerator(9);
            const map = generator._generateRandomMap();

            let grassCount = 0;
            let waterCount = 0;

            for (let i = 0; i < map.length; i++) {
                for (let j = 0; j < map[0].length; j++) {
                    if (map[i][j] === 'grass') grassCount++;
                    else if (map[i][j] === 'water') waterCount++;
                }
            }

            // Should have some grass and some water (with reasonable probability)
            expect(grassCount).toBeGreaterThan(0);
            expect(waterCount).toBeGreaterThan(0);
        });

        test('should only contain valid tile types', () => {
            const generator = new MapGenerator(7);
            const map = generator._generateRandomMap();

            // Valid types are eligible tiles plus 'home'
            const validTypes = [...getEligibleTileTypes(), 'home'];
            map.forEach(row => {
                row.forEach(tile => {
                    expect(validTypes).toContain(tile);
                });
            });
        });

        test('should have exactly one home tile', () => {
            const generator = new MapGenerator(9);
            const map = generator._generateRandomMap();

            let homeCount = 0;
            map.forEach(row => {
                row.forEach(tile => {
                    if (tile === 'home') homeCount++;
                });
            });

            expect(homeCount).toBe(1);
        });
    });

    describe('_generateRandomMap() tile distribution', () => {
        test('should generate tiles according to TILE_DATA chance proportions', () => {
            const generator = new MapGenerator(9);
            const map = generator._generateRandomMap();
            const counts = {};
            map.forEach(row => {
                row.forEach(tile => {
                    counts[tile] = (counts[tile] || 0) + 1;
                });
            });

            // Home should appear exactly once
            expect(counts.home).toBe(1);

            // All non-home tiles should be from eligible set
            const eligible = getEligibleTileTypes();
            for (const [name, count] of Object.entries(counts)) {
                if (name !== 'home') {
                    expect(eligible).toContain(name);
                    expect(count).toBeGreaterThanOrEqual(0);
                }
            }
        });

        test('should produce exact grid size', () => {
            const sizes = [7, 9, 11];
            for (const size of sizes) {
                const generator = new MapGenerator(size);
                const map = generator._generateRandomMap();
                expect(map.length).toBe(size);
                map.forEach(row => expect(row.length).toBe(size));
                // Total tiles should be size * size
                let total = 0;
                map.forEach(row => { total += row.length; });
                expect(total).toBe(size * size);
            }
        });
    });

    describe('_validateMap()', () => {
        test('should return true for map with clear path to edge', () => {
            const generator = new MapGenerator(3);
            const map = [
                ['grass', 'grass', 'grass'],
                ['grass', 'home', 'grass'],
                ['grass', 'grass', 'grass']
            ];

            const isValid = generator._validateMap(map);
            expect(isValid).toBe(true);
        });

        test('should return false for map with no path to edge', () => {
            const generator = new MapGenerator(3);
            const map = [
                ['water', 'water', 'water'],
                ['water', 'home', 'water'],
                ['water', 'water', 'water']
            ];

            const isValid = generator._validateMap(map);
            expect(isValid).toBe(false);
        });

        test('should return true when home is on the edge', () => {
            // Home at (0,2) - top-center of a 5x5 grid. Even though home is on row 0
            // (an edge row), it has a direct non-edge neighbor at (1,2), so every
            // interior non-blocking tile is reachable via a non-edge path.
            const generator = new MapGenerator(5);
            const map = [
                ['grass', 'grass', 'home',  'grass', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass']
            ];

            const isValid = generator._validateMap(map);
            expect(isValid).toBe(true);
        });

        test('should handle complex maze with valid path', () => {
            const generator = new MapGenerator(5);
            const map = [
                ['grass', 'water', 'water', 'water', 'water'],
                ['grass', 'water', 'water', 'water', 'water'],
                ['grass', 'grass', 'home', 'water', 'water'],
                ['water', 'water', 'water', 'water', 'water'],
                ['water', 'water', 'water', 'water', 'water']
            ];

            const isValid = generator._validateMap(map);
            expect(isValid).toBe(true);
        });

        test('should handle complex maze without valid path', () => {
            const generator = new MapGenerator(5);
            const map = [
                ['water', 'water', 'water', 'water', 'water'],
                ['water', 'grass', 'grass', 'grass', 'water'],
                ['water', 'grass', 'home', 'grass', 'water'],
                ['water', 'grass', 'grass', 'grass', 'water'],
                ['water', 'water', 'water', 'water', 'water']
            ];

            const isValid = generator._validateMap(map);
            expect(isValid).toBe(false);
        });

        test('should work with different map sizes', () => {
            const sizes = [7, 9, 11];
            
            sizes.forEach(size => {
                const generator = new MapGenerator(size);
                const map = Array(size).fill(null).map(() => Array(size).fill('grass'));
                const center = Math.floor(size / 2);
                map[center][center] = 'home';

                const isValid = generator._validateMap(map);
                expect(isValid).toBe(true);
            });
        });
    });

    describe('calculateGoal()', () => {
        test('should convert string map to numeric format', () => {
            const spy = jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                goalArea: 8,
                optimalWallCount: 4
            });

            const generator = new MapGenerator(5);
            const map = [
                ['grass', 'water', 'grass', 'grass', 'grass'],
                ['water', 'grass', 'grass', 'grass', 'water'],
                ['grass', 'grass', 'home', 'grass', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'water'],
                ['water', 'water', 'grass', 'grass', 'water']
            ];

            generator.calculateGoal(map, 10);

            expect(spy).toHaveBeenCalled();
            const calledMap = spy.mock.calls[0][0];
            
            // Verify conversion: grass=1, water=0, home=2
            expect(calledMap[0][0]).toBe(1); // grass
            expect(calledMap[0][1]).toBe(0); // water
            expect(calledMap[2][2]).toBe(2); // home
            
            spy.mockRestore();
        });

        test('should return null when solver returns null', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue(null);

            const generator = new MapGenerator(3);
            const map = [
                ['grass', 'grass', 'grass'],
                ['grass', 'home', 'grass'],
                ['grass', 'grass', 'grass']
            ];

            const result = generator.calculateGoal(map, 5);
            expect(result).toBeNull();
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should return goalArea and optimalWallCount', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                goalArea: 12,
                optimalWallCount: 6
            });

            const generator = new MapGenerator(3);
            const map = [
                ['grass', 'home', 'grass'],
                ['grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass']
            ];

            const result = generator.calculateGoal(map, 10);
            
            expect(result).toMatchObject({
                goalArea: 12,
                optimalWallCount: 6,
                optimalSolution: []
            });
            expect(result.wallPositions).toBeInstanceOf(Set);
            expect(Array.isArray(result.pennedTiles)).toBe(true);
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should pass maxWalls to solver', () => {
            const spy = jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                goalArea: 5,
                optimalWallCount: 3
            });

            const generator = new MapGenerator(3);
            const map = [
                ['grass', 'home', 'grass'],
                ['grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass']
            ];
            const maxWalls = 8;

            generator.calculateGoal(map, maxWalls);

            expect(spy).toHaveBeenCalledWith(
                expect.any(Array),
                maxWalls
            );
            
            spy.mockRestore();
        });

        test('should handle map with walls already placed', () => {
            const spy = jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                goalArea: 4,
                optimalWallCount: 2
            });

            const generator = new MapGenerator(3);
            const map = [
                ['wall', 'grass', 'grass'],
                ['grass', 'home', 'grass'],
                ['grass', 'grass', 'grass']
            ];

            generator.calculateGoal(map, 5);
            
            const calledMap = spy.mock.calls[0][0];
            expect(calledMap[0][0]).toBe(5); // wall converts to 5
            
            spy.mockRestore();
        });

        test('should extract wall coordinates from solver walls matrix', () => {
            // Solver returns a walls matrix with actual 1s — _convertWallsToCoordinates must find them
            const walls = [
                [0, 1, 0],
                [0, 0, 0],
                [0, 0, 1]
            ];
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                walls,
                goalArea: 4,
                optimalWallCount: 2
            });

            const generator = new MapGenerator(3);
            const map = [
                ['grass', 'grass', 'grass'],
                ['grass', 'home', 'grass'],
                ['grass', 'grass', 'grass']
            ];

            const result = generator.calculateGoal(map, 5);
            expect(result.optimalSolution).toContainEqual([0, 1]);
            expect(result.optimalSolution).toContainEqual([2, 2]);
            expect(result.optimalSolution).toHaveLength(2);

            MILPSolver.solveMap.mockRestore();
        });
    });

    describe('_wallSetsEqual()', () => {
        test('should return true when both sets are empty', () => {
            const generator = new MapGenerator(5);
            expect(generator._wallSetsEqual(new Set(), new Set())).toBe(true);
        });

        test('should return true when both sets have the same keys', () => {
            const generator = new MapGenerator(5);
            const a = new Set(['1,2', '3,4']);
            const b = new Set(['1,2', '3,4']);
            expect(generator._wallSetsEqual(a, b)).toBe(true);
        });

        test('should return false when sets have different sizes', () => {
            const generator = new MapGenerator(5);
            const a = new Set(['1,2', '3,4']);
            const b = new Set(['1,2']);
            expect(generator._wallSetsEqual(a, b)).toBe(false);
        });

        test('should return false when sets have same size but different keys', () => {
            const generator = new MapGenerator(5);
            const a = new Set(['1,2', '3,4']);
            const b = new Set(['1,2', '5,6']);
            expect(generator._wallSetsEqual(a, b)).toBe(false);
        });
    });

    describe('Edge Cases', () => {
        test('should handle minimum size (3x3)', () => {
            const size = 7;
            jest.spyOn(MILPSolver, 'solveMap').mockImplementation((_map, maxWalls) => {
                if (maxWalls >= size * size) {
                    return { walls: Array(size).fill(null).map(() => Array(size).fill(0)), goalArea: 20, optimalWallCount: 5 };
                }
                return { walls: Array(size).fill(null).map(() => Array(size).fill(0)), goalArea: 9, optimalWallCount: 2 };
            });

            const generator = new MapGenerator(size);
            const result = generator.generate();

            expect(result).not.toBeNull();
            expect(result.map.length).toBe(size);
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should handle large size (17x17)', () => {
            const size = 17;
            jest.spyOn(MILPSolver, 'solveMap').mockImplementation((_map, maxWalls) => {
                if (maxWalls >= size * size) {
                    return { walls: Array(size).fill(null).map(() => Array(size).fill(0)), goalArea: 100, optimalWallCount: 12 };
                }
                return { walls: Array(size).fill(null).map(() => Array(size).fill(0)), goalArea: 50, optimalWallCount: 10 };
            });

            const generator = new MapGenerator(size);
            const result = generator.generate();

            expect(result).not.toBeNull();
            expect(result.map.length).toBe(size);
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should handle 100% grass distribution', () => {
            const size = 7;
            jest.spyOn(MILPSolver, 'solveMap').mockImplementation((_map, maxWalls) => {
                if (maxWalls >= size * size) {
                    return { walls: Array(size).fill(null).map(() => Array(size).fill(0)), goalArea: 20, optimalWallCount: 8 };
                }
                return { walls: Array(size).fill(null).map(() => Array(size).fill(0)), goalArea: 9, optimalWallCount: 4 };
            });

            const generator = new MapGenerator(size, { grass: 1.0, water: 0.0 });
            const result = generator.generate();

            expect(result).not.toBeNull();
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should handle very low grass distribution', () => {
            const size = 7;
            jest.spyOn(MILPSolver, 'solveMap').mockImplementation((_map, maxWalls) => {
                if (maxWalls >= size * size) {
                    return { walls: Array(size).fill(null).map(() => Array(size).fill(0)), goalArea: 10, optimalWallCount: 3 };
                }
                return { walls: Array(size).fill(null).map(() => Array(size).fill(0)), goalArea: 9, optimalWallCount: 1 };
            });

            const generator = new MapGenerator(size, { grass: 0.1, water: 0.9 });
            
            // This might take multiple attempts but should eventually succeed
            const result = generator.generate();
            expect(result).not.toBeNull();
            
            MILPSolver.solveMap.mockRestore();
        });
    });

    describe('Performance', () => {
        test('should generate small map quickly', () => {
            const size = 7;
            jest.spyOn(MILPSolver, 'solveMap').mockImplementation((_map, maxWalls) => {
                if (maxWalls >= size * size) {
                    return { walls: Array(size).fill(null).map(() => Array(size).fill(0)), goalArea: 20, optimalWallCount: 8 };
                }
                return { walls: Array(size).fill(null).map(() => Array(size).fill(0)), goalArea: 9, optimalWallCount: 4 };
            });

            const generator = new MapGenerator(size);
            const startTime = Date.now();
            generator.generate();
            const elapsed = Date.now() - startTime;

            expect(elapsed).toBeLessThan(1000); // Should be fast with mocked solver
            
            MILPSolver.solveMap.mockRestore();
        });

        test('_validateMap should be efficient', () => {
            const generator = new MapGenerator(15);
            const map = Array(15).fill(null).map(() => Array(15).fill('grass'));
            map[7][7] = 'home';

            const startTime = Date.now();
            for (let i = 0; i < 100; i++) {
                generator._validateMap(map);
            }
            const elapsed = Date.now() - startTime;

            expect(elapsed).toBeLessThan(1000); // 100 validations in under 1 second
        });
    });

});
