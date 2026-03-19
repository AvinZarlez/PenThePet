/**
 * Tile Type Definitions — compatibility layer
 *
 * All tile properties now live in tileData.js (the single source of truth).
 * This file builds the legacy TILE_TYPES object that some rendering code
 * still references, deriving every value from TILE_DATA.
 *
 * To add a new tile type: edit tileData.js only — nothing else needs to change.
 */

// Import TILE_DATA if in Node.js environment
if (typeof TILE_DATA === 'undefined' && typeof require !== 'undefined') {
    const _td = require('./tileData.js');
    global.TILE_DATA = _td.TILE_DATA;
    global.getTileType = _td.getTileType;
    global.isTileClickable = _td.isTileClickable;
    global.isBlockingTile = _td.isBlockingTile;
    global.BLOCKING_TILES = _td.BLOCKING_TILES;
}

/**
 * TILE_TYPES — built programmatically from TILE_DATA.
 * Each entry is a shallow copy of its TILE_DATA definition.
 */
const TILE_TYPES = {};
for (const [name, data] of Object.entries(TILE_DATA)) {
    TILE_TYPES[name] = {
        ...data,
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TILE_TYPES, getTileType, isTileClickable };
}
