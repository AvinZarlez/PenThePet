/**
 * Unit Tests for Grid.js
 * 
 * Tests the Grid class for game state management.
 * Grid no longer generates maps - it only loads pre-generated maps from maps/YYYY.json.
 */

const Grid = require('../../js/Grid.js');

// Mock CONFIG if not available
if (typeof global.CONFIG === 'undefined') {
    global.CONFIG = require('../../js/config.js');
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

        test('should return empty array if no tiles loaded', () => {
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

        test('should update grid size when loading different sized map', () => {
            const grid = new Grid(3);
            const differentSizeMap = [
                ['grass', 'grass'],
                ['grass', 'home']
            ];

            grid.loadMap(differentSizeMap);
            expect(grid.size).toBe(2);
            expect(grid.tiles.length).toBe(2);
            expect(grid.getTile(1, 1)).toBe('home');
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

    describe('Integration Tests', () => {
        test('should support full workflow: load -> modify -> reset', () => {
            const grid = new Grid(3);
            const map = [
                ['grass', 'grass', 'grass'],
                ['grass', 'home', 'grass'],
                ['grass', 'grass', 'grass']
            ];
            
            grid.loadMap(map);
            grid.saveInitialState();

            grid.setTile(0, 0, 'wall');
            expect(grid.getTile(0, 0)).toBe('wall');

            grid.reset();
            expect(grid.getTile(0, 0)).toBe('grass');
        });

        test('should support workflow: load -> save -> verify', () => {
            const grid = new Grid(7);
            const map = Array(7).fill(null).map(() => Array(7).fill('grass'));
            map[3][3] = 'home';
            
            grid.loadMap(map);

            const allTiles = grid.getAllTiles();
            const homePos = grid.getHomePosition();

            expect(homePos).toBeTruthy();
            expect(homePos.row).toBe(3);
            expect(homePos.col).toBe(3);
            expect(allTiles.length).toBe(7);
        });
    });
});

describe('parseCompactMap', () => {
    test('converts a compact string into a 2D tile array', () => {
        // 3x3: row0=gwg, row1=whw, row2=gwg
        const result = Grid.parseCompactMap('gwgwhwgwg', 3);
        expect(result).toEqual([
            ['grass', 'water', 'grass'],
            ['water', 'home', 'water'],
            ['grass', 'water', 'grass'],
        ]);
    });

    test('recognizes all three tile characters', () => {
        const result = Grid.parseCompactMap('ghw', 3);
        expect(result[0]).toEqual(['grass', 'home', 'water']);
    });

    test('defaults unknown characters to grass', () => {
        const result = Grid.parseCompactMap('x', 1);
        expect(result[0][0]).toBe('grass');
    });

    test('throws when mapStr is not a string', () => {
        expect(() => Grid.parseCompactMap([], 3)).toThrow();
    });

    test('returns correct dimensions for a 7x7 map', () => {
        const mapStr = 'g'.repeat(49);
        const result = Grid.parseCompactMap(mapStr, 7);
        expect(result.length).toBe(7);
        expect(result[0].length).toBe(7);
    });
});

describe('parseCompactSolution', () => {
    test('converts a flat array into coordinate pairs', () => {
        expect(Grid.parseCompactSolution([1, 0, 2, 3, 5, 4])).toEqual([
            [1, 0],
            [2, 3],
            [5, 4],
        ]);
    });

    test('returns empty array for empty input', () => {
        expect(Grid.parseCompactSolution([])).toEqual([]);
    });

    test('returns empty array for non-array input', () => {
        expect(Grid.parseCompactSolution(null)).toEqual([]);
    });

    test('ignores a trailing unpaired element', () => {
        // Odd-length array: last element has no pair
        expect(Grid.parseCompactSolution([1, 0, 2])).toEqual([[1, 0]]);
    });
});
