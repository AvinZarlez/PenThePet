/**
 * Constants
 * 
 * Centralized constants for game parameters and limits.
 * These values can be tweaked at the code level for easy configuration.
 */

const CONSTANTS = {
    // Wall configuration
    MAX_WALLS: 15,              // Maximum number of walls that can be placed in any level
    
    // Grid configuration
    MAX_GRID_SIZE: 21,          // Maximum grid size (21x21)
    MIN_GRID_SIZE: 7,           // Minimum grid size (7x7)
    DEFAULT_GRID_SIZE: 9,       // Default grid size (9x9)
    
    // Map generation
    MAX_GENERATION_ATTEMPTS: 100,  // Maximum attempts to generate a valid map
    
    // Tile distribution (probabilities should sum to 1.0)
    TILE_DISTRIBUTION: {
        grass: 0.7,             // 70% chance of grass tiles
        water: 0.3,             // 30% chance of water tiles
    },
    
    // Cell visual settings
    CELL: {
        GAP: 3,                 // Gap between cells in pixels
        MIN_SIZE: 6,            // Minimum cell size in pixels (for very large grids on mobile)
        MAX_SIZE: 50,           // Maximum cell size in pixels (desktop)
    },
    
    // Grid sizing
    GRID_PADDING: 6,            // Padding around the grid in pixels
    AVAILABLE_HEIGHT_RATIO: 0.7, // Use 70% of viewport height for grid
    
    // Gameplay
    ALLOW_WALL_REMOVAL: true,   // Allow clicking walls to remove them
    AUTO_SAVE_STATE: false,     // Auto-save game state to localStorage
    
    // Hints
    HINT_MODE_DEFAULT: 'disabled', // Default hint mode: 'disabled', 'checkOptimal', 'revealTarget'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONSTANTS;
}
