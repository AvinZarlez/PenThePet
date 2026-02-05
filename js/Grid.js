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
     * Uses MapGenerator to ensure valid maps with paths to edge
     */
    generate(dateString = null) {
        // Note: dateString is accepted but not currently used for seeding
        // as implementing true seeded random would require additional library
        // For now, maps vary but this provides the framework for future enhancement
        
        const generator = new MapGenerator(this.size, CONFIG.tileDistribution);
        this.tiles = generator.generate(dateString);
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
     * Place a home tile at the center of the grid
     * Ensures only one home tile exists and it's not on an edge
     * @private
     */
    _placeHomeTile() {
        // Remove any existing home tiles first
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.tiles[i][j] === 'home') {
                    this.tiles[i][j] = 'grass';
                }
            }
        }
        
        // Place home at center (for now, can be randomized later)
        const centerRow = Math.floor(this.size / 2);
        const centerCol = Math.floor(this.size / 2);
        this.tiles[centerRow][centerCol] = 'home';
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
