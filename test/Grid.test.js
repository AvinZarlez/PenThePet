/**
 * Unit Tests for Grid.js
 * 
 * Tests the Grid class for game state management.
 */

const Grid = require('../js/Grid.js');
const MILPSolver = require('../js/MILPSolver.js');
const CONSTANTS = require('../js/constants.js');

// Mock CONFIG if not available
if (typeof global.CONFIG === 'undefined') {
    global.CONFIG = require('../js/config.js');
}

describe('Grid', () => {

    describe('Constructor', () => {
        test('should create a Grid with default size', () => {
            const grid = new Grid();
            expect(grid).toBeInstanceOf(Grid);
            expect(grid.size).toBe(CONFIG.grid.defaultSize);
        });

        test('should create a Grid with custom size', () => {
            const customSize = 11;
            const grid = new Grid(customSize);
            expect(grid.size).toBe(customSize);
        });

        test('should initialize empty tiles array', () => {
            const grid = new Grid();
            expect(Array.isArray(grid.tiles)).toBe(true);
            expect(grid.tiles.length).toBe(0);
        });

        test('should initialize empty initialTiles array', () => {
            const grid = new Grid();
            expect(Array.isArray(grid.initialTiles)).toBe(true);
            expect(grid.initialTiles.length).toBe(0);
        });

        test('should accept various valid sizes', () => {
            const sizes = [7, 9, 11, 13, 15, 21];
            sizes.forEach(size => {
                const grid = new Grid(size);
                expect(grid.size).toBe(size);
            });
        });
    });

    describe('generate()', () => {
        test('should generate a map', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                walls: Array(3).fill(null).map(() => Array(3).fill(0)),
                goalArea: 5,
                optimalWallCount: 3
            });

            const grid = new Grid(3);
            const result = grid.generate();

            expect(result).not.toBeNull();
            expect(result).toHaveProperty('map');
            expect(result).toHaveProperty('goal');
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should set tiles to generated map', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                walls: Array(3).fill(null).map(() => Array(3).fill(0)),
                goalArea: 5,
                optimalWallCount: 3
            });

            const grid = new Grid(3);
            grid.generate();

            expect(grid.tiles).not.toBeNull();
            expect(grid.tiles.length).toBe(3);
            expect(grid.tiles[0].length).toBe(3);
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should accept optional dateString parameter', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                walls: Array(3).fill(null).map(() => Array(3).fill(0)),
                goalArea: 3,
                optimalWallCount: 2
            });

            const grid = new Grid(3);
            const result = grid.generate('2024-01-01');

            expect(result).not.toBeNull();
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should throw error when generation consistently fails', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue(null);

            const grid = new Grid(3);
            
            // Should throw error after max attempts, not return null
            expect(() => grid.generate()).toThrow('Failed to generate valid map');
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should handle generation with different sizes', () => {
            const sizes = [7, 9, 11];
            
            sizes.forEach(size => {
                jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                    walls: Array(size).fill(null).map(() => Array(size).fill(0)),
                    goalArea: 10,
                    optimalWallCount: 5
                });

                const grid = new Grid(size);
                grid.generate();

                expect(grid.tiles.length).toBe(size);
                expect(grid.tiles[0].length).toBe(size);
                
                MILPSolver.solveMap.mockRestore();
            });
        });
    });

    describe('getHomePosition()', () => {
        test('should return home position when home exists', () => {
            const grid = new Grid(3);
            grid.tiles = [
                ['grass', 'grass', 'grass'],
                ['grass', 'home', 'grass'],
                ['grass', 'grass', 'grass']
            ];

            const pos = grid.getHomePosition();
            expect(pos).toEqual({ row: 1, col: 1 });
        });

        test('should return null when no home exists', () => {
            const grid = new Grid(3);
            grid.tiles = [
                ['grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass']
            ];

            const pos = grid.getHomePosition();
            expect(pos).toBeNull();
        });

        test('should find home at corner position', () => {
            const grid = new Grid(3);
            grid.tiles = [
                ['home', 'grass', 'grass'],
                ['grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass']
            ];

            const pos = grid.getHomePosition();
            expect(pos).toEqual({ row: 0, col: 0 });
        });

        test('should find home at bottom-right', () => {
            const grid = new Grid(3);
            grid.tiles = [
                ['grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass'],
                ['grass', 'grass', 'home']
            ];

            const pos = grid.getHomePosition();
            expect(pos).toEqual({ row: 2, col: 2 });
        });

        test('should return first home if multiple exist (edge case)', () => {
            const grid = new Grid(3);
            grid.tiles = [
                ['home', 'grass', 'grass'],
                ['grass', 'home', 'grass'],
                ['grass', 'grass', 'grass']
            ];

            const pos = grid.getHomePosition();
            expect(pos).toEqual({ row: 0, col: 0 });
        });
    });

    describe('saveInitialState()', () => {
        test('should save a copy of current tiles', () => {
            const grid = new Grid(3);
            grid.tiles = [
                ['grass', 'grass', 'grass'],
                ['grass', 'home', 'grass'],
                ['grass', 'grass', 'grass']
            ];

            grid.saveInitialState();

            expect(grid.initialTiles).toEqual(grid.tiles);
        });

        test('should create a deep copy (not reference)', () => {
            const grid = new Grid(3);
            grid.tiles = [
                ['grass', 'grass', 'grass'],
                ['grass', 'home', 'grass'],
                ['grass', 'grass', 'grass']
            ];

            grid.saveInitialState();
            grid.tiles[0][0] = 'wall';

            expect(grid.initialTiles[0][0]).toBe('grass');
        });

        test('should update initialTiles when called multiple times', () => {
            const grid = new Grid(3);
            grid.tiles = [['grass', 'grass', 'grass']];
            grid.saveInitialState();

            grid.tiles = [['water', 'water', 'water']];
            grid.saveInitialState();

            expect(grid.initialTiles[0][0]).toBe('water');
        });
    });

    describe('reset()', () => {
        test('should restore tiles to initial state', () => {
            const grid = new Grid(3);
            grid.tiles = [
                ['grass', 'grass', 'grass'],
                ['grass', 'home', 'grass'],
                ['grass', 'grass', 'grass']
            ];
            grid.saveInitialState();

            grid.tiles[0][0] = 'wall';
            grid.tiles[0][1] = 'wall';

            grid.reset();

            expect(grid.tiles[0][0]).toBe('grass');
            expect(grid.tiles[0][1]).toBe('grass');
        });

        test('should create a new copy (not reference)', () => {
            const grid = new Grid(3);
            grid.tiles = [['grass', 'home', 'grass']];
            grid.saveInitialState();

            grid.reset();
            grid.tiles[0][0] = 'wall';

            expect(grid.initialTiles[0][0]).toBe('grass');
        });

        test('should work multiple times', () => {
            const grid = new Grid(3);
            grid.tiles = [['grass', 'home', 'grass']];
            grid.saveInitialState();

            grid.tiles[0][0] = 'wall';
            grid.reset();
            expect(grid.tiles[0][0]).toBe('grass');

            grid.tiles[0][1] = 'wall';
            grid.reset();
            expect(grid.tiles[0][1]).toBe('home');
        });
    });

    describe('getTile()', () => {
        test('should return correct tile at valid position', () => {
            const grid = new Grid(3);
            grid.tiles = [
                ['grass', 'water', 'grass'],
                ['water', 'home', 'grass'],
                ['grass', 'grass', 'wall']
            ];

            expect(grid.getTile(0, 0)).toBe('grass');
            expect(grid.getTile(0, 1)).toBe('water');
            expect(grid.getTile(1, 1)).toBe('home');
            expect(grid.getTile(2, 2)).toBe('wall');
        });

        test('should return null for out-of-bounds coordinates', () => {
            const grid = new Grid(3);
            grid.tiles = [['grass', 'home', 'grass']];

            expect(grid.getTile(-1, 0)).toBeNull();
            expect(grid.getTile(0, -1)).toBeNull();
            expect(grid.getTile(3, 0)).toBeNull();
            expect(grid.getTile(0, 3)).toBeNull();
        });

        test('should return null for coordinates beyond grid size', () => {
            const grid = new Grid(3);
            grid.tiles = [['grass'], ['grass'], ['grass']];

            expect(grid.getTile(10, 10)).toBeNull();
        });

        test('should handle edge positions correctly', () => {
            const grid = new Grid(3);
            grid.tiles = [
                ['a', 'b', 'c'],
                ['d', 'e', 'f'],
                ['g', 'h', 'i']
            ];

            expect(grid.getTile(0, 0)).toBe('a');
            expect(grid.getTile(0, 2)).toBe('c');
            expect(grid.getTile(2, 0)).toBe('g');
            expect(grid.getTile(2, 2)).toBe('i');
        });
    });

    describe('setTile()', () => {
        test('should set tile at valid position', () => {
            const grid = new Grid(3);
            grid.tiles = [
                ['grass', 'grass', 'grass'],
                ['grass', 'home', 'grass'],
                ['grass', 'grass', 'grass']
            ];

            grid.setTile(0, 0, 'wall');
            expect(grid.tiles[0][0]).toBe('wall');
        });

        test('should not modify tiles for out-of-bounds coordinates', () => {
            const grid = new Grid(3);
            grid.tiles = [['grass', 'grass', 'grass']];
            const originalLength = grid.tiles.length;

            grid.setTile(-1, 0, 'wall');
            grid.setTile(0, -1, 'wall');
            grid.setTile(5, 5, 'wall');

            expect(grid.tiles.length).toBe(originalLength);
        });

        test('should update multiple tiles', () => {
            const grid = new Grid(3);
            grid.tiles = [
                ['grass', 'grass', 'grass'],
                ['grass', 'home', 'grass'],
                ['grass', 'grass', 'grass']
            ];

            grid.setTile(0, 0, 'wall');
            grid.setTile(0, 1, 'wall');
            grid.setTile(0, 2, 'water');

            expect(grid.tiles[0][0]).toBe('wall');
            expect(grid.tiles[0][1]).toBe('wall');
            expect(grid.tiles[0][2]).toBe('water');
        });

        test('should allow overwriting existing tiles', () => {
            const grid = new Grid(3);
            grid.tiles = [['wall', 'grass', 'grass']];

            grid.setTile(0, 0, 'grass');
            expect(grid.tiles[0][0]).toBe('grass');

            grid.setTile(0, 0, 'water');
            expect(grid.tiles[0][0]).toBe('water');
        });
    });

    describe('getAllTiles()', () => {
        test('should return the tiles array', () => {
            const grid = new Grid(3);
            const mockTiles = [
                ['grass', 'grass', 'grass'],
                ['grass', 'home', 'grass'],
                ['grass', 'grass', 'grass']
            ];
            grid.tiles = mockTiles;

            const result = grid.getAllTiles();
            expect(result).toBe(mockTiles);
        });

        test('should return empty array if no tiles generated', () => {
            const grid = new Grid(3);
            const result = grid.getAllTiles();
            expect(result).toEqual([]);
        });

        test('should reflect changes to tiles', () => {
            const grid = new Grid(3);
            grid.tiles = [['grass', 'grass', 'grass']];

            const tiles = grid.getAllTiles();
            expect(tiles[0][0]).toBe('grass');

            grid.setTile(0, 0, 'wall');
            expect(tiles[0][0]).toBe('wall');
        });
    });

    describe('loadMap()', () => {
        test('should load a valid map', () => {
            const grid = new Grid(3);
            const map = [
                ['grass', 'grass', 'grass'],
                ['grass', 'home', 'grass'],
                ['grass', 'grass', 'grass']
            ];

            grid.loadMap(map);
            expect(grid.tiles).toEqual(map);
        });

        test('should create a deep copy of the map', () => {
            const grid = new Grid(3);
            const map = [
                ['grass', 'home', 'grass'],
                ['grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass']
            ];

            grid.loadMap(map);
            grid.tiles[0][0] = 'wall';

            expect(map[0][0]).toBe('grass');
        });

        test('should throw error for non-array input', () => {
            const grid = new Grid(3);
            expect(() => grid.loadMap('not an array')).toThrow();
        });

        test('should throw error for wrong size map', () => {
            const grid = new Grid(3);
            const wrongSizeMap = [
                ['grass', 'grass'],
                ['grass', 'home']
            ];

            expect(() => grid.loadMap(wrongSizeMap)).toThrow('Invalid map');
        });

        test('should allow loading different maps', () => {
            const grid = new Grid(3);
            const map1 = [
                ['grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass']
            ];
            const map2 = [
                ['water', 'water', 'water'],
                ['water', 'water', 'water'],
                ['water', 'water', 'water']
            ];

            grid.loadMap(map1);
            expect(grid.tiles[0][0]).toBe('grass');

            grid.loadMap(map2);
            expect(grid.tiles[0][0]).toBe('water');
        });
    });

    describe('resize()', () => {
        test('should change grid size within valid range', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                walls: Array(11).fill(null).map(() => Array(11).fill(0)),
                goalArea: 10,
                optimalWallCount: 5
            });

            const grid = new Grid(9);
            grid.resize(11);

            expect(grid.size).toBe(11);
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should not resize if new size is below minimum', () => {
            const grid = new Grid(9);
            const originalSize = grid.size;

            grid.resize(CONFIG.grid.minSize - 1);

            expect(grid.size).toBe(originalSize);
        });

        test('should not resize if new size is above maximum', () => {
            const grid = new Grid(9);
            const originalSize = grid.size;

            grid.resize(CONFIG.grid.maxSize + 1);

            expect(grid.size).toBe(originalSize);
        });

        test('should regenerate grid after resize', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                walls: Array(11).fill(null).map(() => Array(11).fill(0)),
                goalArea: 10,
                optimalWallCount: 5
            });

            const grid = new Grid(9);
            const oldTiles = grid.tiles;
            
            grid.resize(11);

            // After resize, tiles should be regenerated
            expect(grid.tiles).not.toBe(oldTiles);
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should save initial state after resize', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                walls: Array(11).fill(null).map(() => Array(11).fill(0)),
                goalArea: 10,
                optimalWallCount: 5
            });

            const grid = new Grid(9);
            grid.resize(11);

            // After resize, grid should have tiles
            expect(grid.tiles.length).toBeGreaterThan(0);
            
            MILPSolver.solveMap.mockRestore();
        });
    });

    describe('Integration Tests', () => {
        test('should support full workflow: generate -> modify -> reset', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                walls: Array(3).fill(null).map(() => Array(3).fill(0)),
                goalArea: 5,
                optimalWallCount: 3
            });

            const grid = new Grid(3);
            grid.generate();
            grid.saveInitialState();

            const originalTile = grid.getTile(0, 0);
            grid.setTile(0, 0, 'wall');
            expect(grid.getTile(0, 0)).toBe('wall');

            grid.reset();
            expect(grid.getTile(0, 0)).toBe(originalTile);
            
            MILPSolver.solveMap.mockRestore();
        });

        test('should support workflow: generate -> save -> load -> verify', () => {
            jest.spyOn(MILPSolver, 'solveMap').mockReturnValue({
                walls: Array(3).fill(null).map(() => Array(3).fill(0)),
                goalArea: 5,
                optimalWallCount: 3
            });

            const grid = new Grid(3);
            grid.generate();

            const allTiles = grid.getAllTiles();
            const homePos = grid.getHomePosition();

            expect(homePos).toBeTruthy();
            expect(homePos.row).toBeGreaterThanOrEqual(0);
            expect(homePos.col).toBeGreaterThanOrEqual(0);
            expect(allTiles.length).toBe(3);
            
            MILPSolver.solveMap.mockRestore();
        });
    });
});
