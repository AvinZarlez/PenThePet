/**
 * Constants
 * 
 * Centralized constants for game parameters and limits.
 * These values can be tweaked at the code level for easy configuration.
 */

const CONSTANTS = {
    // Wall configuration
    MAX_WALLS: 15,              // Absolute maximum walls (for largest grid sizes)
    
    /**
     * Calculate max walls for a given grid size.
     * Uses 75% of grid size as the wall budget - this provides a good balance
     * between challenge and solvability across different grid sizes.
     * Examples: 7x7→5, 9x9→6, 10x10→7, 11x11→8, 16x16→12, 21x21→15
     * @param {number} size - Grid size (one dimension)
     * @returns {number} Maximum walls allowed
     */
    maxWallsForSize: function(size) {
        return Math.floor(size * 0.75);
    },
    
    // Grid configuration
    MAX_GRID_SIZE: 21,          // Maximum grid size (21x21)
    MIN_GRID_SIZE: 7,           // Minimum grid size (7x7)
    DEFAULT_GRID_SIZE: 9,       // Default grid size (9x9)
    
    // Map data
    FIRST_MAP_YEAR: 2026,          // First year that has map data files in maps/

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
    
    // Gameplay
    ALLOW_WALL_REMOVAL: true,   // Allow clicking walls to remove them
    AUTO_SAVE_STATE: false,     // Auto-save game state to localStorage
    
    // Hints
    HINT_MODE_DEFAULT: 'disabled', // Default hint mode: 'disabled', 'checkOptimal', 'revealTarget'

    // UI timings
    SHARE_BUTTON_FLASH_MS: 2000,   // How long the "Copied!" label shows on the share button (ms)

    // Animal options for pet selection
    ANIMAL_OPTIONS: [
        { emoji: '🐶', name: 'Dog' },
        { emoji: '🐱', name: 'Cat' },
        { emoji: '🐰', name: 'Rabbit' },
        { emoji: '🐹', name: 'Hamster' },
        { emoji: '🐀', name: 'Rat' },
        { emoji: '🐇', name: 'Hare' },
        { emoji: '🐕‍🦺', name: 'Service Dog' },
        { emoji: '🐦', name: 'Bird' },
        { emoji: '🐢', name: 'Turtle' },
        { emoji: '🐍', name: 'Snake' },
        { emoji: '🐟', name: 'Fish' },
        { emoji: '🐠', name: 'Tropical Fish' },
        { emoji: '🕷️', name: 'Spider' },
        { emoji: '🐈‍⬛', name: 'Black Cat' },
        { emoji: '🦜', name: 'Parrot' },
        { emoji: '🐕', name: 'Dog Face' },
        { emoji: '🐩', name: 'Poodle' },
        { emoji: '🦎', name: 'Lizard' },
        { emoji: '🦮', name: 'Guide Dog' },
        { emoji: '🐈', name: 'Cat Face' },
        { emoji: '🐴', name: 'Horse Face' },
        { emoji: '🐎', name: 'Horse' },
        { emoji: '🐭', name: 'Mouse Face' },
        { emoji: '🐁', name: 'Mouse' },
        { emoji: '🐿️', name: 'Squirrel' },
        { emoji: '🪨', name: 'Rock' }
    ]
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONSTANTS;
}
