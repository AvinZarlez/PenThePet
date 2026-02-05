/**
 * Game Configuration
 * 
 * Centralized configuration for easy customization of game parameters.
 * Modify these values to change game behavior without touching game logic.
 */

const CONFIG = {
    // Grid settings
    grid: {
        defaultSize: 9,        // Default grid dimensions (9x9)
        minSize: 6,            // Minimum allowed grid size
        maxSize: 21,           // Maximum allowed grid size
    },

    // Tile generation probabilities (should sum to 1.0)
    tileDistribution: {
        grass: 0.7,            // 70% chance of grass tiles
        water: 0.3,            // 30% chance of water tiles
    },

    // Cell visual settings
    cell: {
        size: 50,              // Cell size in pixels (desktop)
        sizeSmall: 40,         // Cell size in pixels (mobile)
        gap: 3,                // Gap between cells in pixels
    },

    // Game behavior
    gameplay: {
        allowWallRemoval: false,    // If true, clicking walls removes them
        autoSaveState: false,        // If true, saves game state to localStorage
        goalAreaSize: 10,            // Goal area size threshold (TODO: calculate based on grid size/difficulty)
    },

    // Hint system
    hints: {
        mode: 'disabled',            // Options: 'disabled', 'checkOptimal', 'revealTarget'
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
