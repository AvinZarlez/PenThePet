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

// Load tile data first (single source of truth for tile properties)
const tileDataModule = require('../js/tileData.js');
global.TILE_DATA = tileDataModule.TILE_DATA;
global.COMPACT_CHAR_TO_TILE = tileDataModule.COMPACT_CHAR_TO_TILE;
global.TILE_TO_COMPACT_CHAR = tileDataModule.TILE_TO_COMPACT_CHAR;
global.NUMERIC_ID_TO_SCORE = tileDataModule.NUMERIC_ID_TO_SCORE;
global.TILE_TO_NUMERIC = tileDataModule.TILE_TO_NUMERIC;
global.NUMERIC_TO_TILE = tileDataModule.NUMERIC_TO_TILE;
global.isWallPlaceable = tileDataModule.isWallPlaceable;
global.getTileScore = tileDataModule.getTileScore;
global.getNumericTileScore = tileDataModule.getNumericTileScore;
global.getEligibleTileTypes = tileDataModule.getEligibleTileTypes;

// Load game modules in the correct order for Node.js environment
// Note: MILPSolver is loaded for generation pipeline tests (MapGenerator.test.js).
// It is NOT used by browser-side code (Grid.test.js, Menu.test.js, etc.)
global.CONSTANTS = require('../js/constants.js');
global.CONFIG = require('../js/config.js');
global.CookieUtils = require('../js/CookieUtils.js');
global.FIREBASE_CONFIG = require('../js/firebase-config.js');
global.CloudSync = require('../js/CloudSync.js');
global.DateUtils = require('../js/DateUtils.js');
global.PathfindingUtils = require('../js/PathfindingUtils.js');
global.MILPSolver = require('../scripts/solver/MILPSolver.js');
global.MapGenerator = require('../js/MapGenerator.js');

// Expose Grid and compact map parse helpers as globals (mirrors browser script-tag load order)
const _Grid = require('../js/Grid.js');
global.Grid = _Grid;
global.parseCompactMap = _Grid.parseCompactMap;
global.parseCompactSolution = _Grid.parseCompactSolution;

// Load getTileType from tileTypes.js (uses TILE_DATA as source of truth)
const { getTileType, isTileClickable, TILE_TYPES } = require('../js/tileTypes.js');
global.getTileType = getTileType;
global.isTileClickable = isTileClickable;
global.TILE_TYPES = TILE_TYPES;
