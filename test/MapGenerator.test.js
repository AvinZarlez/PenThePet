/**
 * Unit Tests for MapGenerator.js
 * 
 * Tests the map generation and validation logic.
 */

const MapGenerator = require('../js/MapGenerator.js');
const MILPSolver = require('../js/MILPSolver.js');
const CONSTANTS = require('../js/constants.js');

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
        test('should generate a valid map with goal', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                walls: [[0, 0], [0, 0], [0, 0]],
                goalArea: 5,
                optimalWallCount: 3
            });

            const generator = new MapGenerator(3);
            const result = generator.generate();

            expect(result).not.toBeNull();
            expect(result).toHaveProperty('map');
            expect(result).toHaveProperty('goal');
            expect(result).toHaveProperty('maxWalls');
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should generate map of correct size', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                walls: Array(7).fill(null).map(() => Array(7).fill(0)),
                goalArea: 10,
                optimalWallCount: 5
            });

            const generator = new MapGenerator(7);
            const result = generator.generate();

            expect(result.map.length).toBe(7);
            expect(result.map[0].length).toBe(7);
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should place home tile at center', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                walls: Array(5).fill(null).map(() => Array(5).fill(0)),
                goalArea: 8,
                optimalWallCount: 4
            });

            const generator = new MapGenerator(5);
            const result = generator.generate();

            const centerRow = Math.floor(5 / 2);
            const centerCol = Math.floor(5 / 2);
            expect(result.map[centerRow][centerCol]).toBe('home');
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should accept optional dateString parameter', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                walls: Array(3).fill(null).map(() => Array(3).fill(0)),
                goalArea: 5,
                optimalWallCount: 2
            });

            const generator = new MapGenerator(3);
            const result = generator.generate('2024-01-01');

            expect(result).not.toBeNull();
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should return map with goal and maxWalls', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                walls: [[0, 0], [0, 0]],
                goalArea: 6,
                optimalWallCount: 3
            });

            const generator = new MapGenerator(3);
            const result = generator.generate();

            expect(result.goal).toBe(6);
            expect(result.maxWalls).toBe(3);
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should retry if optimalWallCount exceeds MAX_WALLS', () => {
            let callCount = 0;
            jest.spyOn(MILPSolver, 'solveMap').mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    return {
                        walls: Array(3).fill(null).map(() => Array(3).fill(0)),
                        goalArea: 5,
                        optimalWallCount: 20 // Too many walls
                    };
                }
                return {
                    walls: Array(3).fill(null).map(() => Array(3).fill(0)),
                    goalArea: 5,
                    optimalWallCount: 5 // Within limit
                };
            });

            const generator = new MapGenerator(3);
            const result = generator.generate();

            expect(callCount).toBeGreaterThan(1);
            expect(result.maxWalls).toBeLessThanOrEqual(CONSTANTS.MAX_WALLS);
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should throw error if max attempts exceeded', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue(null);

            const generator = new MapGenerator(3);
            
            expect(() => generator.generate()).toThrow('Failed to generate valid map');
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should accept useTimeLimit parameter for debug generation', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                walls: Array(7).fill(null).map(() => Array(7).fill(0)),
                goalArea: 12,
                optimalWallCount: 6
            });

            const generator = new MapGenerator(7);
            const result = generator.generate(null);

            expect(result).not.toBeNull();
            expect(result.goal).toBe(12);
            expect(result.maxWalls).toBe(6);
            
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

            const validTypes = ['grass', 'water', 'home'];
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

    describe('_generateRandomTile()', () => {
        test('should return grass or water', () => {
            const generator = new MapGenerator(5);
            const validTypes = ['grass', 'water'];

            for (let i = 0; i < 100; i++) {
                const tile = generator._generateRandomTile();
                expect(validTypes).toContain(tile);
            }
        });

        test('should respect custom distribution', () => {
            const generator = new MapGenerator(5, { grass: 1.0, water: 0.0 });
            
            // All tiles should be grass
            for (let i = 0; i < 100; i++) {
                const tile = generator._generateRandomTile();
                expect(tile).toBe('grass');
            }
        });

        test('should generate water with 0% grass distribution', () => {
            const generator = new MapGenerator(5, { grass: 0.0, water: 1.0 });
            
            // All tiles should be water
            for (let i = 0; i < 100; i++) {
                const tile = generator._generateRandomTile();
                expect(tile).toBe('water');
            }
        });

        test('should generate mixed tiles with balanced distribution', () => {
            const generator = new MapGenerator(5, { grass: 0.5, water: 0.5 });
            
            const counts = { grass: 0, water: 0 };
            for (let i = 0; i < 1000; i++) {
                counts[generator._generateRandomTile()]++;
            }

            // With 50/50 distribution, should be roughly balanced
            expect(counts.grass).toBeGreaterThan(300);
            expect(counts.water).toBeGreaterThan(300);
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
            const generator = new MapGenerator(3);
            const map = [
                ['home', 'grass', 'grass'],
                ['grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass']
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

    /*
     * Note: _generateGuaranteedValidMap() method has been removed (2026-02-06)
     * 
     * Reason: Per requirements, map generation must not fall back to simplified
     * map generation methods. If generation fails, it should throw an error
     * instead of falling back to a guaranteed valid but potentially lower-quality map.
     * 
     * This ensures all generated maps meet the same quality standards consistently.
     */

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
            
            expect(result).toEqual({
                goalArea: 12,
                optimalWallCount: 6,
                optimalSolution: []
            });
            
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
    });

    describe('Edge Cases', () => {
        test('should handle minimum size (3x3)', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                walls: Array(3).fill(null).map(() => Array(3).fill(0)),
                goalArea: 5,
                optimalWallCount: 2
            });

            const generator = new MapGenerator(3);
            const result = generator.generate();

            expect(result).not.toBeNull();
            expect(result.map.length).toBe(3);
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should handle large size (21x21)', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                walls: Array(21).fill(null).map(() => Array(21).fill(0)),
                goalArea: 50,
                optimalWallCount: 10
            });

            const generator = new MapGenerator(21);
            const result = generator.generate();

            expect(result).not.toBeNull();
            expect(result.map.length).toBe(21);
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should handle 100% grass distribution', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                walls: Array(5).fill(null).map(() => Array(5).fill(0)),
                goalArea: 8,
                optimalWallCount: 4
            });

            const generator = new MapGenerator(5, { grass: 1.0, water: 0.0 });
            const result = generator.generate();

            expect(result).not.toBeNull();
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should handle very low grass distribution', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                walls: Array(5).fill(null).map(() => Array(5).fill(0)),
                goalArea: 5,
                optimalWallCount: 1
            });

            const generator = new MapGenerator(5, { grass: 0.1, water: 0.9 });
            
            // This might take multiple attempts but should eventually succeed
            const result = generator.generate();
            expect(result).not.toBeNull();
            
            MILPSolver.solveMap.mockRestore();
        });
    });

    describe('Performance', () => {
        test('should generate small map quickly', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                walls: Array(5).fill(null).map(() => Array(5).fill(0)),
                goalArea: 8,
                optimalWallCount: 4
            });

            const generator = new MapGenerator(5);
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

    // NOTE: These tests are skipped by default because they run actual map generation
    // which can be slow. Run them manually when you need to verify generation works.
    describe.skip('Generation Smoke Tests', () => {
        /**
         * These tests validate that map generation works end-to-end:
         * 1. Maps can be generated successfully
         * 2. Goals are reasonable (not ultra small)
         * 3. Goals scale with map size
         * 4. Generation completes in reasonable time
         */

        test('should generate maps with reasonable goals', () => {
            // Use smaller maps for faster testing
            const testCases = [
                { size: 5, maxWalls: 5 },
                { size: 7, maxWalls: 7 }
            ];

            const results = [];

            for (const { size, maxWalls } of testCases) {
                const generator = new MapGenerator(size, { grass: 0.7, water: 0.3 });
                const startTime = Date.now();
                const result = generator.generate(null, maxWalls);
                const duration = Date.now() - startTime;

                expect(result).not.toBeNull();
                expect(result.goal).toBeGreaterThan(0);
                expect(result.map).toHaveLength(size);
                expect(result.maxWalls).toBeLessThanOrEqual(maxWalls);

                // Goals should be reasonable for the grid size
                const totalTiles = size * size;
                const minReasonable = Math.max(3, Math.floor(totalTiles * 0.1));
                const maxReasonable = Math.floor(totalTiles * 0.8);
                
                expect(result.goal).toBeGreaterThanOrEqual(minReasonable);
                expect(result.goal).toBeLessThanOrEqual(maxReasonable);

                // Generation should complete in reasonable time
                expect(duration).toBeLessThan(30000); // 30 seconds max

                results.push({ size, goal: result.goal, duration });
            }

            // Goals should generally trend upward with size
            if (results.length >= 2) {
                // Allow some flexibility - larger maps should tend to have larger goals
                // but don't require strict monotonic increase
                const avgGoalsIncreasing = results[results.length - 1].goal >= results[0].goal;
                expect(avgGoalsIncreasing).toBe(true);
            }
        }, 60000); // 60 second timeout for this test

        test('should generate valid maps consistently', () => {
            const generator = new MapGenerator(5, { grass: 0.7, water: 0.3 });
            
            // Generate multiple maps to ensure consistency  
            for (let i = 0; i < 2; i++) {
                const result = generator.generate(null, 5);
                
                expect(result).not.toBeNull();
                expect(result.map).toHaveLength(5);
                expect(result.goal).toBeGreaterThan(0);
                expect(result.maxWalls).toBeLessThanOrEqual(5);
                
                // Verify home tile exists
                const homeFound = result.map.some(row => 
                    row.some(tile => tile === 'home')
                );
                expect(homeFound).toBe(true);
            }
        }, 60000); // 60 second timeout for this test
    });
});
