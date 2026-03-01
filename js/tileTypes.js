/**
 * Tile Type Definitions
 * 
 * Defines the visual/rendering properties of each tile type.
 * Uses TILE_DATA from tileData.js as the source of truth for game-logic
 * properties (score, wallPlaceable, chance, etc.).
 *
 * Add new tile types here AND in tileData.js to extend the game.
 */

// Import TILE_DATA if in Node.js environment
if (typeof TILE_DATA === 'undefined' && typeof require !== 'undefined') {
    global.TILE_DATA = require('./tileData.js').TILE_DATA;
}

const TILE_TYPES = {
    grass: {
        name: 'grass',
        displayName: 'Grass',
        description: 'Grass tile - click to build a wall',
        clickable: TILE_DATA.grass.wallPlaceable,
        cssClass: 'grass',
        gradient: 'linear-gradient(135deg, #7ed957 0%, #4caf50 100%)',
        assets: TILE_DATA.grass.assets,
        ariaLabel: (row, col) => `Grass tile at row ${row + 1}, column ${col + 1}. Click to build a wall.`,
    },

    water: {
        name: 'water',
        displayName: 'Water',
        description: 'Water tile - cannot be clicked',
        clickable: TILE_DATA.water.wallPlaceable,
        cssClass: 'water',
        gradient: 'linear-gradient(135deg, #4fc3f7 0%, #2196f3 100%)',
        assets: TILE_DATA.water.assets,
        ariaLabel: (row, col) => `Water tile at row ${row + 1}, column ${col + 1}. Cannot be clicked.`,
    },

    wall: {
        name: 'wall',
        displayName: 'Wall',
        description: 'Wall - placed by player',
        clickable: true,   // walls are removable when clicked, handled separately
        cssClass: 'wall',
        gradient: 'linear-gradient(135deg, #8d6e63 0%, #5d4037 100%)',
        assets: TILE_DATA.wall.assets,
        ariaLabel: (row, col) => `Wall at row ${row + 1}, column ${col + 1}. Click to remove.`,
    },

    home: {
        name: 'home',
        displayName: 'Home',
        description: 'Home - pet starting location',
        clickable: TILE_DATA.home.wallPlaceable,
        cssClass: 'home',
        gradient: 'linear-gradient(135deg, #ffeb3b 0%, #ffc107 100%)',
        assets: TILE_DATA.home.assets,
        emoji: '🏠🐾',
        ariaLabel: (row, col) => `Home tile at row ${row + 1}, column ${col + 1}. Pet starting location.`,
    },

    star: {
        name: 'star',
        displayName: 'Star',
        description: `Star tile - worth ${TILE_DATA.star.score} points, click to build a wall`,
        clickable: TILE_DATA.star.wallPlaceable,
        cssClass: 'grass',
        gradient: 'linear-gradient(135deg, #7ed957 0%, #4caf50 100%)',
        assets: TILE_DATA.star.assets,
        ariaLabel: (row, col) => `Star tile at row ${row + 1}, column ${col + 1}. Worth ${TILE_DATA.star.score} points. Click to build a wall.`,
    },
};

/**
 * Get tile type by name
 * @param {string} typeName - The name of the tile type
 * @returns {Object} The tile type object
 */
function getTileType(typeName) {
    return TILE_TYPES[typeName] || TILE_TYPES.grass;
}

/**
 * Check if a tile type is clickable
 * @param {string} typeName - The name of the tile type
 * @returns {boolean} True if the tile can be clicked
 */
function isTileClickable(typeName) {
    const tileType = getTileType(typeName);
    return tileType.clickable;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TILE_TYPES, getTileType, isTileClickable };
}
