/**
 * Game Configuration
 * 
 * Centralized configuration for easy customization of game parameters.
 * Modify these values to change game behavior without touching game logic.
 * 
 * NOTE: Many values now reference CONSTANTS from constants.js
 */

// Import CONSTANTS if in Node.js environment
if (typeof CONSTANTS === 'undefined' && typeof require !== 'undefined') {
    global.CONSTANTS = require('./constants.js');
}

const CONFIG = {
    // Grid settings
    grid: {
        defaultSize: CONSTANTS.DEFAULT_GRID_SIZE,  // Default grid dimensions
        minSize: CONSTANTS.MIN_GRID_SIZE,          // Minimum allowed grid size
        maxSize: CONSTANTS.MAX_GRID_SIZE,          // Maximum allowed grid size
    },

    // Tile generation probabilities (should sum to 1.0)
    tileDistribution: CONSTANTS.TILE_DISTRIBUTION,

    // Cell visual settings
    cell: {
        size: CONSTANTS.CELL.MAX_SIZE,       // Cell size in pixels (desktop)
        sizeSmall: 40,                       // Cell size in pixels (mobile) - deprecated, dynamic sizing used
        gap: CONSTANTS.CELL.GAP,             // Gap between cells in pixels
    },

    // Game behavior
    gameplay: {
        allowWallRemoval: CONSTANTS.ALLOW_WALL_REMOVAL,  // If true, clicking walls removes them
        autoSaveState: CONSTANTS.AUTO_SAVE_STATE,        // If true, saves game state to localStorage
        goalAreaSize: 10,                                 // Goal area size threshold (calculated during generation)
    },

    // Hint system
    hints: {
        mode: CONSTANTS.HINT_MODE_DEFAULT,  // Options: 'disabled', 'checkOptimal', 'revealTarget'
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
