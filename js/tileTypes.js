/**
 * Tile Type Definitions
 * 
 * Defines the properties and behavior of different tile types in the game.
 * Add new tile types here to extend the game with additional block types.
 */

const TILE_TYPES = {
    grass: {
        name: 'grass',
        displayName: 'Grass',
        description: 'Grass tile - click to build a wall',
        clickable: true,
        cssClass: 'grass',
        gradient: 'linear-gradient(135deg, #7ed957 0%, #4caf50 100%)',
        ariaLabel: (row, col) => `Grass tile at row ${row + 1}, column ${col + 1}. Click to build a wall.`,
    },

    water: {
        name: 'water',
        displayName: 'Water',
        description: 'Water tile - cannot be clicked',
        clickable: false,
        cssClass: 'water',
        gradient: 'linear-gradient(135deg, #4fc3f7 0%, #2196f3 100%)',
        ariaLabel: (row, col) => `Water tile at row ${row + 1}, column ${col + 1}. Cannot be clicked.`,
    },

    wall: {
        name: 'wall',
        displayName: 'Wall',
        description: 'Wall - placed by player',
        clickable: false,
        cssClass: 'wall',
        gradient: 'linear-gradient(135deg, #8d6e63 0%, #5d4037 100%)',
        ariaLabel: (row, col) => `Wall at row ${row + 1}, column ${col + 1}.`,
    },

    // Add more tile types here for future expansion
    // Example:
    // sand: {
    //     name: 'sand',
    //     displayName: 'Sand',
    //     description: 'Sand tile - special properties',
    //     clickable: true,
    //     cssClass: 'sand',
    //     gradient: 'linear-gradient(135deg, #ffd54f 0%, #ffb300 100%)',
    //     ariaLabel: (row, col) => `Sand tile at row ${row + 1}, column ${col + 1}.`,
    // },
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
