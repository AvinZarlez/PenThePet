/**
 * Map Generator
 * 
 * Generates valid game maps that ensure the pet can always reach an edge
 * when no walls are placed. Uses BFS pathfinding to validate connectivity.
 */

// For Node.js environment - import dependencies if not in browser
(function() {
    if (typeof require !== 'undefined') {
        if (typeof CONSTANTS === 'undefined' && typeof global !== 'undefined') {
            global.CONSTANTS = require('./constants.js');
        }
        if (typeof MILPSolver === 'undefined' && typeof global !== 'undefined') {
            global.MILPSolver = require('./MILPSolver.js');
        }
    }
})();

class MapGenerator {
    /**
     * Create a new MapGenerator
     * @param {number} size - The size of the grid (size x size)
     * @param {Object} tileDistribution - Object with tile type probabilities
     */
    constructor(size, tileDistribution = null) {
        this.size = size;
        this.tileDistribution = tileDistribution || CONSTANTS.TILE_DISTRIBUTION;
        this.maxAttempts = CONSTANTS.MAX_GENERATION_ATTEMPTS; // Maximum attempts to generate a valid map
    }

    /**
     * Generate a valid map with guaranteed path to edge and goal calculation
     * Uses CONSTANTS.MAX_WALLS for maximum wall count
     * Retries generation if no solution exists with <= MAX_WALLS
     * @param {string} _dateString - Optional date string for seeded generation (unused)
     * @returns {Object} Object containing map and goal, or throws error if unable to generate
     */
    generate(_dateString = null) {
        const maxWalls = CONSTANTS.MAX_WALLS; // Always use constant max walls
        
        // Keep trying until we get a valid map that can be solved with <= MAX_WALLS
        let totalAttempts = 0;
        const maxTotalAttempts = 1000; // Safety limit to prevent infinite loops
        
        while (totalAttempts < maxTotalAttempts) {
            let attempts = 0;
            let map = null;
            let result = null;
            
            // Try to generate a valid random map
            while (attempts < this.maxAttempts) {
                map = this._generateRandomMap();
                if (this._validateMap(map)) {
                    // Calculate the goal (maximum achievable area) and optimal wall count
                    // This uses ONLY accurate exhaustive search - no heuristics
                    result = this.calculateGoal(map, maxWalls);
                    
                    // If result is not null and uses <= MAX_WALLS, we have a valid map
                    if (result !== null && result.optimalWallCount <= maxWalls) {
                        return { 
                            map, 
                            goal: result.goalArea, 
                            maxWalls: result.optimalWallCount,  // Use optimal wall count
                            optimalSolution: result.optimalSolution  // Include optimal wall positions
                        };
                    }
                    // If result is null or needs too many walls, try again
                }
                attempts++;
            }
            
            // If random generation failed, try guaranteed valid map
            map = this._generateGuaranteedValidMap();
            result = this.calculateGoal(map, maxWalls);
            
            // Check if this map is solvable with <= MAX_WALLS
            if (result !== null && result.optimalWallCount <= maxWalls) {
                return { 
                    map, 
                    goal: result.goalArea,
                    optimalSolution: result.optimalSolution,
                    maxWalls: result.optimalWallCount
                };
            }
            
            totalAttempts++;
            console.log(`Generation attempt ${totalAttempts}: No valid solution found, retrying...`);
        }
        
        // Should never reach here, but throw error if we do
        throw new Error(`Failed to generate valid map after ${maxTotalAttempts} attempts`);
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
        const waterRatio = this.tileDistribution.water || (1 - this.tileDistribution.grass);
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const coordKey = `${i},${j}`;
                if (map[i][j] === 'home' || pathCells.has(coordKey)) {
                    continue;
                }
                
                if (Math.random() < waterRatio) {
                    map[i][j] = 'water';
                }
            }
        }
        
        return map;
    }

    /**
     * Calculate the maximum achievable area (goal) for a given map
     * Uses the MILP solver to find the optimal wall placements
     * @param {Array} map - 2D array of tile types
     * @param {number} maxWalls - Maximum number of walls that can be placed
     * @returns {Object|null} Object with {goalArea, optimalWallCount}, or null if pet cannot be penned
     */
    calculateGoal(map, maxWalls) {
        // Convert map from tile type strings to numbers for the solver
        // 0 = water, 1 = grass, 2 = home, 5 = wall (though we won't have walls initially)
        const numericMap = map.map(row => row.map(tile => {
            if (tile === 'water') return 0;
            if (tile === 'grass') return 1;
            if (tile === 'home') return 2;
            if (tile === 'wall') return 5;
            return 1; // default to grass
        }));
        
        // Use the MILP solver to find optimal solution
        const solution = MILPSolver.solveMap(numericMap, maxWalls);
        
        if (solution === null) {
            return null;
        }
        
        return {
            goalArea: solution.goalArea,
            optimalWallCount: solution.optimalWallCount || 0,
            optimalSolution: solution.walls ? this._convertWallsToCoordinates(solution.walls) : []
        };
    }
    
    /**
     * Convert walls 2D array to array of [row, col] coordinates
     * @private
     * @param {Array} walls - 2D array where 1 indicates wall position
     * @returns {Array} Array of [row, col] coordinates
     */
    _convertWallsToCoordinates(walls) {
        const coordinates = [];
        for (let i = 0; i < walls.length; i++) {
            for (let j = 0; j < walls[i].length; j++) {
                if (walls[i][j] === 1) {
                    coordinates.push([i, j]);
                }
            }
        }
        return coordinates;
    }

}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapGenerator;
}
