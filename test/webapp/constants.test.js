/**
 * Unit Tests for constants.js
 * 
 * Tests the CONSTANTS object structure and values.
 */

const CONSTANTS = require('../../js/constants.js');

describe('CONSTANTS', () => {
    describe('Structure', () => {
        test('should be an object', () => {
            expect(typeof CONSTANTS).toBe('object');
            expect(CONSTANTS).not.toBeNull();
        });

        test('should have all required top-level properties', () => {
            expect(CONSTANTS).toHaveProperty('MAX_WALLS');
            expect(CONSTANTS).toHaveProperty('MAX_GRID_SIZE');
            expect(CONSTANTS).toHaveProperty('MIN_GRID_SIZE');
            expect(CONSTANTS).toHaveProperty('DEFAULT_GRID_SIZE');
            expect(CONSTANTS).toHaveProperty('MAX_GENERATION_ATTEMPTS');
            expect(CONSTANTS).toHaveProperty('TILE_DISTRIBUTION');
            expect(CONSTANTS).toHaveProperty('CELL');
            expect(CONSTANTS).toHaveProperty('GRID_PADDING');
            expect(CONSTANTS).toHaveProperty('ALLOW_WALL_REMOVAL');
            expect(CONSTANTS).toHaveProperty('AUTO_SAVE_STATE');
            expect(CONSTANTS).toHaveProperty('HINT_MODE_DEFAULT');
        });
    });

    describe('Wall Configuration', () => {
        test('MAX_WALLS should be a positive number', () => {
            expect(typeof CONSTANTS.MAX_WALLS).toBe('number');
            expect(CONSTANTS.MAX_WALLS).toBeGreaterThan(0);
        });

        test('MAX_WALLS should be reasonable (1-50)', () => {
            expect(CONSTANTS.MAX_WALLS).toBeGreaterThanOrEqual(1);
            expect(CONSTANTS.MAX_WALLS).toBeLessThanOrEqual(50);
        });
    });

    describe('Grid Configuration', () => {
        test('MAX_GRID_SIZE should be a positive number', () => {
            expect(typeof CONSTANTS.MAX_GRID_SIZE).toBe('number');
            expect(CONSTANTS.MAX_GRID_SIZE).toBeGreaterThan(0);
        });

        test('MIN_GRID_SIZE should be a positive number', () => {
            expect(typeof CONSTANTS.MIN_GRID_SIZE).toBe('number');
            expect(CONSTANTS.MIN_GRID_SIZE).toBeGreaterThan(0);
        });

        test('DEFAULT_GRID_SIZE should be a positive number', () => {
            expect(typeof CONSTANTS.DEFAULT_GRID_SIZE).toBe('number');
            expect(CONSTANTS.DEFAULT_GRID_SIZE).toBeGreaterThan(0);
        });

        test('MIN_GRID_SIZE should be less than or equal to DEFAULT_GRID_SIZE', () => {
            expect(CONSTANTS.MIN_GRID_SIZE).toBeLessThanOrEqual(CONSTANTS.DEFAULT_GRID_SIZE);
        });

        test('DEFAULT_GRID_SIZE should be less than or equal to MAX_GRID_SIZE', () => {
            expect(CONSTANTS.DEFAULT_GRID_SIZE).toBeLessThanOrEqual(CONSTANTS.MAX_GRID_SIZE);
        });

        test('MIN_GRID_SIZE should be less than MAX_GRID_SIZE', () => {
            expect(CONSTANTS.MIN_GRID_SIZE).toBeLessThan(CONSTANTS.MAX_GRID_SIZE);
        });

        test('Grid sizes should be odd numbers (for centered home)', () => {
            expect(CONSTANTS.MIN_GRID_SIZE % 2).toBe(1);
            expect(CONSTANTS.DEFAULT_GRID_SIZE % 2).toBe(1);
            expect(CONSTANTS.MAX_GRID_SIZE % 2).toBe(1);
        });
    });

    describe('Map Generation', () => {
        test('MAX_GENERATION_ATTEMPTS should be a positive number', () => {
            expect(typeof CONSTANTS.MAX_GENERATION_ATTEMPTS).toBe('number');
            expect(CONSTANTS.MAX_GENERATION_ATTEMPTS).toBeGreaterThan(0);
        });

        test('MAX_GENERATION_ATTEMPTS should be reasonable (10-1000)', () => {
            expect(CONSTANTS.MAX_GENERATION_ATTEMPTS).toBeGreaterThanOrEqual(10);
            expect(CONSTANTS.MAX_GENERATION_ATTEMPTS).toBeLessThanOrEqual(1000);
        });
    });

    describe('Tile Distribution', () => {
        test('TILE_DISTRIBUTION should be an object', () => {
            expect(typeof CONSTANTS.TILE_DISTRIBUTION).toBe('object');
            expect(CONSTANTS.TILE_DISTRIBUTION).not.toBeNull();
        });

        test('TILE_DISTRIBUTION should have grass property', () => {
            expect(CONSTANTS.TILE_DISTRIBUTION).toHaveProperty('grass');
            expect(typeof CONSTANTS.TILE_DISTRIBUTION.grass).toBe('number');
        });

        test('TILE_DISTRIBUTION should have water property', () => {
            expect(CONSTANTS.TILE_DISTRIBUTION).toHaveProperty('water');
            expect(typeof CONSTANTS.TILE_DISTRIBUTION.water).toBe('number');
        });

        test('grass probability should be between 0 and 1', () => {
            expect(CONSTANTS.TILE_DISTRIBUTION.grass).toBeGreaterThanOrEqual(0);
            expect(CONSTANTS.TILE_DISTRIBUTION.grass).toBeLessThanOrEqual(1);
        });

        test('water probability should be between 0 and 1', () => {
            expect(CONSTANTS.TILE_DISTRIBUTION.water).toBeGreaterThanOrEqual(0);
            expect(CONSTANTS.TILE_DISTRIBUTION.water).toBeLessThanOrEqual(1);
        });

        test('probabilities should sum to 1', () => {
            const sum = CONSTANTS.TILE_DISTRIBUTION.grass + CONSTANTS.TILE_DISTRIBUTION.water;
            expect(sum).toBeCloseTo(1.0, 5);
        });
    });

    describe('Cell Configuration', () => {
        test('CELL should be an object', () => {
            expect(typeof CONSTANTS.CELL).toBe('object');
            expect(CONSTANTS.CELL).not.toBeNull();
        });

        test('CELL.GAP should be a non-negative number', () => {
            expect(typeof CONSTANTS.CELL.GAP).toBe('number');
            expect(CONSTANTS.CELL.GAP).toBeGreaterThanOrEqual(0);
        });

        test('CELL.MIN_SIZE should be a positive number', () => {
            expect(typeof CONSTANTS.CELL.MIN_SIZE).toBe('number');
            expect(CONSTANTS.CELL.MIN_SIZE).toBeGreaterThan(0);
        });

        test('CELL.MAX_SIZE should be a positive number', () => {
            expect(typeof CONSTANTS.CELL.MAX_SIZE).toBe('number');
            expect(CONSTANTS.CELL.MAX_SIZE).toBeGreaterThan(0);
        });

        test('CELL.MIN_SIZE should be less than CELL.MAX_SIZE', () => {
            expect(CONSTANTS.CELL.MIN_SIZE).toBeLessThan(CONSTANTS.CELL.MAX_SIZE);
        });
    });

    describe('Grid Sizing', () => {
        test('GRID_PADDING should be a non-negative number', () => {
            expect(typeof CONSTANTS.GRID_PADDING).toBe('number');
            expect(CONSTANTS.GRID_PADDING).toBeGreaterThanOrEqual(0);
        });

    });

    describe('Gameplay Settings', () => {
        test('ALLOW_WALL_REMOVAL should be a boolean', () => {
            expect(typeof CONSTANTS.ALLOW_WALL_REMOVAL).toBe('boolean');
        });

        test('AUTO_SAVE_STATE should be a boolean', () => {
            expect(typeof CONSTANTS.AUTO_SAVE_STATE).toBe('boolean');
        });
    });

    describe('Hints Configuration', () => {
        test('HINT_MODE_DEFAULT should be a string', () => {
            expect(typeof CONSTANTS.HINT_MODE_DEFAULT).toBe('string');
        });

        test('HINT_MODE_DEFAULT should be a valid mode', () => {
            const validModes = ['disabled', 'checkOptimal', 'revealTarget'];
            expect(validModes).toContain(CONSTANTS.HINT_MODE_DEFAULT);
        });
    });

    describe('Value Reasonableness', () => {
        test('all numeric values should be finite', () => {
            expect(Number.isFinite(CONSTANTS.MAX_WALLS)).toBe(true);
            expect(Number.isFinite(CONSTANTS.MAX_GRID_SIZE)).toBe(true);
            expect(Number.isFinite(CONSTANTS.MIN_GRID_SIZE)).toBe(true);
            expect(Number.isFinite(CONSTANTS.DEFAULT_GRID_SIZE)).toBe(true);
            expect(Number.isFinite(CONSTANTS.MAX_GENERATION_ATTEMPTS)).toBe(true);
            expect(Number.isFinite(CONSTANTS.CELL.GAP)).toBe(true);
            expect(Number.isFinite(CONSTANTS.CELL.MIN_SIZE)).toBe(true);
            expect(Number.isFinite(CONSTANTS.CELL.MAX_SIZE)).toBe(true);
            expect(Number.isFinite(CONSTANTS.GRID_PADDING)).toBe(true);

        });

        test('all numeric values should not be NaN', () => {
            expect(Number.isNaN(CONSTANTS.MAX_WALLS)).toBe(false);
            expect(Number.isNaN(CONSTANTS.MAX_GRID_SIZE)).toBe(false);
            expect(Number.isNaN(CONSTANTS.MIN_GRID_SIZE)).toBe(false);
            expect(Number.isNaN(CONSTANTS.DEFAULT_GRID_SIZE)).toBe(false);
            expect(Number.isNaN(CONSTANTS.MAX_GENERATION_ATTEMPTS)).toBe(false);
        });
    });
});
