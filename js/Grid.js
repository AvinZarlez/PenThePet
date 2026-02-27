/**
 * Grid Class
 * 
 * Manages the game grid data structure and tile state.
 * Maps are loaded from maps.json (generated offline by the Python solver pipeline).
 * This class handles state management: loading maps, tracking tiles, saving/restoring state.
 */

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
     * Load a pre-generated map into the grid
     * @param {Array} map - 2D array of tile types
     */
    loadMap(map) {
        if (!Array.isArray(map) || map.length !== this.size) {
            throw new Error('Invalid map: must be a 2D array matching grid size');
        }
        this.tiles = map.map(row => [...row]); // Deep copy to avoid reference issues
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Grid;
}
