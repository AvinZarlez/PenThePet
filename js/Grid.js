/**
 * Grid Class
 * 
 * Manages the game grid data structure and tile generation.
 * Responsible for creating, storing, and manipulating the grid state.
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
     * Generate a new random grid based on tile distribution
     */
    generate() {
        this.tiles = [];
        for (let i = 0; i < this.size; i++) {
            const row = [];
            for (let j = 0; j < this.size; j++) {
                row.push(this._generateRandomTile());
            }
            this.tiles.push(row);
        }
    }

    /**
     * Generate a random tile type based on configuration
     * @private
     * @returns {string} The tile type name
     */
    _generateRandomTile() {
        const rand = Math.random();
        const grassThreshold = CONFIG.tileDistribution.grass;
        
        // Currently supports grass and water
        // Future: extend this to support more tile types
        return rand < grassThreshold ? 'grass' : 'water';
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
     * Change the grid size and regenerate
     * @param {number} newSize - The new grid size
     */
    resize(newSize) {
        if (newSize >= CONFIG.grid.minSize && newSize <= CONFIG.grid.maxSize) {
            this.size = newSize;
            this.generate();
            this.saveInitialState();
        }
    }

    /**
     * Get all tiles in the grid
     * @returns {Array} 2D array of tile types
     */
    getAllTiles() {
        return this.tiles;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Grid;
}
