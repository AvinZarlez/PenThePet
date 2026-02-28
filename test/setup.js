/**
 * Jest Setup File
 * 
 * This file runs before all tests to set up the testing environment.
 */

// Setup JSDOM environment for browser-like testing
global.document = document;
global.window = window;

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Load game modules in the correct order for Node.js environment
// Note: MILPSolver is loaded for generation pipeline tests (MapGenerator.test.js).
// It is NOT used by browser-side code (Grid.test.js, Menu.test.js, etc.)
global.CONSTANTS = require('../js/constants.js');
global.CONFIG = require('../js/config.js');
global.CookieUtils = require('../js/CookieUtils.js');
global.DateUtils = require('../js/DateUtils.js');
global.PathfindingUtils = require('../js/PathfindingUtils.js');
global.MILPSolver = require('../scripts/solver/MILPSolver.js');
global.MapGenerator = require('../js/MapGenerator.js');

// Mock getTileType for tests that need it
global.getTileType = function(tileType) {
    const TILE_TYPES = {
        grass: {
            name: 'grass',
            displayName: 'Grass',
            description: 'Grass tile - can be clicked to place walls',
            clickable: true,
            cssClass: 'grass',
            gradient: 'linear-gradient(135deg, #a8e063 0%, #56ab2f 100%)',
            ariaLabel: (row, col) => `Grass tile at row ${row + 1}, column ${col + 1}. Click to place a wall.`,
        },
        water: {
            name: 'water',
            displayName: 'Water',
            description: 'Water tile - blocks movement',
            clickable: false,
            cssClass: 'water',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            ariaLabel: (row, col) => `Water tile at row ${row + 1}, column ${col + 1}. Blocks movement.`,
        },
        wall: {
            name: 'wall',
            displayName: 'Wall',
            description: 'Wall tile - blocks movement',
            clickable: true,
            cssClass: 'wall',
            gradient: 'linear-gradient(135deg, #b0b0b0 0%, #606060 100%)',
            ariaLabel: (row, col) => `Wall at row ${row + 1}, column ${col + 1}. Click to remove.`,
        },
        home: {
            name: 'home',
            displayName: 'Home',
            description: 'Home tile - starting position',
            clickable: false,
            cssClass: 'home',
            gradient: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
            ariaLabel: (row, col) => `Home tile at row ${row + 1}, column ${col + 1}. Your pet starts here.`,
        },
    };
    return TILE_TYPES[tileType] || TILE_TYPES.grass;
};
