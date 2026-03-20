/**
 * Grid Class
 *
 * Manages game grid state and tile data. Maps are loaded from maps/YYYY.json.
 * Also exports parseCompactMap() and parseCompactSolution() for decoding map data.
 */

// Import TILE_DATA lookup if in Node.js environment
if (typeof TILE_DATA === 'undefined' && typeof require !== 'undefined') {
    const _td = require('../tiles/tileData.js');
    global.TILE_DATA = _td.TILE_DATA;
    global.COMPACT_CHAR_TO_TILE = _td.COMPACT_CHAR_TO_TILE;
}

/** compact char → tile name; derived from TILE_DATA (single source of truth) */
const COMPACT_TILE_CHARS = (typeof COMPACT_CHAR_TO_TILE !== 'undefined')
    ? COMPACT_CHAR_TO_TILE
    : (() => {
        // Build from TILE_DATA when the pre-built table isn't available
        const map = {};
        for (const [name, data] of Object.entries(TILE_DATA)) {
            map[data.compactChar] = name;
        }
        return map;
    })();

/**
 * Parse a compact map string into a 2D array of tile type names.
 * Tiles are stored row-major: first `size` chars are row 0, etc.
 * @param {string} mapStr - Compact map string of length size*size
 * @param {number} size - Grid side length
 * @returns {Array} 2D array of tile type strings
 */
function parseCompactMap(mapStr, size) {
    if (typeof mapStr !== 'string') {
        throw new Error('parseCompactMap: mapStr must be a string');
    }
    const tiles = [];
    for (let i = 0; i < size; i++) {
        const row = [];
        for (let j = 0; j < size; j++) {
            const ch = mapStr[i * size + j];
            row.push(COMPACT_TILE_CHARS[ch] || 'grass');
        }
        tiles.push(row);
    }
    return tiles;
}

/**
 * Parse a compact (flat) solution array into coordinate pairs.
 * @param {Array<number>} flatArr - Flat array [r0, c0, r1, c1, ...]
 * @returns {Array<Array<number>>} Array of [row, col] coordinate pairs
 */
function parseCompactSolution(flatArr) {
    if (!Array.isArray(flatArr)) return [];
    const pairs = [];
    for (let i = 0; i + 1 < flatArr.length; i += 2) {
        pairs.push([flatArr[i], flatArr[i + 1]]);
    }
    return pairs;
}

class Grid {
    /**
     * Create a new Grid
     * @param {number} size - The size of the grid (size x size)
     */
    constructor(size = CONFIG.grid.defaultSize) {
        this.size = size;
        this.tiles = [];
        this.initialTiles = [];
    }

    /**
     * Get the position of the home tile
     * @returns {Object|null} Object with row and col properties, or null if not found
     */
    getHomePosition() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.tiles[i][j] === 'home') {
                    return { row: i, col: j };
                }
            }
        }
        return null;
    }

    /**
     * Save the current grid state as initial state for reset
     */
    saveInitialState() {
        this.initialTiles = this.tiles.map(row => [...row]);
    }

    /**
     * Restore the grid to its initial state
     */
    reset() {
        this.tiles = this.initialTiles.map(row => [...row]);
    }

    /**
     * Get the tile type at a specific position
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {string} The tile type name
     */
    getTile(row, col) {
        if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
            return this.tiles[row][col];
        }
        return null;
    }

    /**
     * Set the tile type at a specific position
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {string} tileType - The new tile type
     */
    setTile(row, col, tileType) {
        if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
            this.tiles[row][col] = tileType;
        }
    }

    /**
     * Get all tiles in the grid
     * @returns {Array} 2D array of tile types
     */
    getAllTiles() {
        return this.tiles;
    }

    /**
     * Load a pre-generated map into the grid.
     * Updates the grid size to match the map dimensions.
     * @param {Array} map - 2D array of tile types
     */
    loadMap(map) {
        if (!Array.isArray(map) || map.length === 0) {
            throw new Error('Invalid map: must be a non-empty 2D array');
        }
        this.size = map.length;
        this.tiles = map.map(row => [...row]); // Deep copy to avoid reference issues
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Grid;
    module.exports.parseCompactMap = parseCompactMap;
    module.exports.parseCompactSolution = parseCompactSolution;
}
