/**
 * Map Generator
 * 
 * Generates valid game maps that ensure the pet can always reach an edge
 * when no walls are placed. Uses BFS pathfinding to validate connectivity.
 */

class MapGenerator {
    /**
     * Create a new MapGenerator
     * @param {number} size - The size of the grid (size x size)
     * @param {Object} tileDistribution - Object with tile type probabilities
     */
    constructor(size, tileDistribution = { grass: 0.7, water: 0.3 }) {
        this.size = size;
        this.tileDistribution = tileDistribution;
        this.maxAttempts = 100; // Maximum attempts to generate a valid map
    }

    /**
     * Generate a valid map with guaranteed path to edge
     * @param {string} dateString - Optional date string for seeded generation
     * @returns {Array} 2D array of tile types
     */
    generate(dateString = null) {
        let attempts = 0;
        let map = null;
        
        while (attempts < this.maxAttempts) {
            map = this._generateRandomMap();
            if (this._validateMap(map)) {
                return map;
            }
            attempts++;
        }
        
        // If we couldn't generate a valid random map, generate a guaranteed valid one
        console.warn('Could not generate valid random map, creating guaranteed valid map');
        return this._generateGuaranteedValidMap();
    }

    /**
     * Generate a random map without validation
     * @private
     * @returns {Array} 2D array of tile types
     */
    _generateRandomMap() {
        const map = [];
        for (let i = 0; i < this.size; i++) {
            const row = [];
            for (let j = 0; j < this.size; j++) {
                row.push(this._generateRandomTile());
            }
            map.push(row);
        }
        
        // Place home tile at center
        const centerRow = Math.floor(this.size / 2);
        const centerCol = Math.floor(this.size / 2);
        map[centerRow][centerCol] = 'home';
        
        return map;
    }

    /**
     * Generate a random tile type based on distribution
     * @private
     * @returns {string} The tile type name
     */
    _generateRandomTile() {
        const rand = Math.random();
        const grassThreshold = this.tileDistribution.grass;
        return rand < grassThreshold ? 'grass' : 'water';
    }

    /**
     * Validate that a map has a path from home to edge with no walls
     * @private
     * @param {Array} map - 2D array of tile types
     * @returns {boolean} True if map is valid
     */
    _validateMap(map) {
        const centerRow = Math.floor(this.size / 2);
        const centerCol = Math.floor(this.size / 2);
        
        // BFS to check if there's a path to any edge
        const visited = new Set();
        const queue = [[centerRow, centerCol]];
        visited.add(`${centerRow},${centerCol}`);
        
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        while (queue.length > 0) {
            const [row, col] = queue.shift();
            
            // Check if we reached an edge
            if (row === 0 || row === this.size - 1 || col === 0 || col === this.size - 1) {
                return true;
            }
            
            // Explore neighbors
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                const coordKey = `${newRow},${newCol}`;
                
                // Check bounds
                if (newRow < 0 || newRow >= this.size || newCol < 0 || newCol >= this.size) {
                    continue;
                }
                
                // Check if already visited
                if (visited.has(coordKey)) {
                    continue;
                }
                
                const tileType = map[newRow][newCol];
                
                // Only grass and home tiles are passable (water blocks)
                if (tileType === 'water') {
                    continue;
                }
                
                visited.add(coordKey);
                queue.push([newRow, newCol]);
            }
        }
        
        // No path to edge found
        return false;
    }

    /**
     * Generate a guaranteed valid map with a clear path to edge
     * Creates a path from center to an edge, then fills remaining tiles
     * @private
     * @returns {Array} 2D array of tile types
     */
    _generateGuaranteedValidMap() {
        const map = [];
        
        // Initialize with all grass
        for (let i = 0; i < this.size; i++) {
            const row = [];
            for (let j = 0; j < this.size; j++) {
                row.push('grass');
            }
            map.push(row);
        }
        
        // Place home at center
        const centerRow = Math.floor(this.size / 2);
        const centerCol = Math.floor(this.size / 2);
        map[centerRow][centerCol] = 'home';
        
        // Create a guaranteed path from center to top edge
        const pathCells = new Set();
        for (let row = 0; row <= centerRow; row++) {
            pathCells.add(`${row},${centerCol}`);
        }
        
        // Now randomly place water, but not on the path
        const waterThreshold = 1 - this.tileDistribution.grass;
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const coordKey = `${i},${j}`;
                if (map[i][j] === 'home' || pathCells.has(coordKey)) {
                    continue;
                }
                
                if (Math.random() < waterThreshold) {
                    map[i][j] = 'water';
                }
            }
        }
        
        return map;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapGenerator;
}
