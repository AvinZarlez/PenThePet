/**
 * Game Configuration
 * 
 * Centralized configuration for easy customization of game parameters.
 * Modify these values to change game behavior without touching game logic.
 */

const CONFIG = {
    // Grid settings
    grid: {
        defaultSize: 8,        // Default grid dimensions (8x8)
        minSize: 4,            // Minimum allowed grid size
        maxSize: 20,           // Maximum allowed grid size
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
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
