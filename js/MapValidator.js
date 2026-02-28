/**
 * Map Validator
 * 
 * Validates that generated maps meet quality and difficulty standards.
 * All map generation paths (test, production, debug) use these same rules.
 */

// Import dependencies if in Node.js environment
(function() {
    if (typeof require !== 'undefined') {
        if (typeof CONSTANTS === 'undefined' && typeof global !== 'undefined') {
            global.CONSTANTS = require('./constants.js');
        }
        if (typeof PathfindingUtils === 'undefined' && typeof global !== 'undefined') {
            global.PathfindingUtils = require('./PathfindingUtils.js');
        }
    }
})();

class MapValidator {
    /**
     * Validate a map meets all quality and difficulty requirements
     * @param {Array} map - 2D array of tile types (strings: 'grass', 'water', 'home')
     * @param {Object} solution - Solution object with {goalArea, optimalWallCount, optimalSolution}
     * @returns {Object} {valid: boolean, errors: Array<string>}
     */
    static validate(map, solution) {
        const errors = [];
        
        // Validation 1: Map must have valid path from home to edge (already checked during generation)
        if (!this._hasPathToEdge(map)) {
            errors.push('Map does not have a valid path from home to edge');
        }
        
        // Validation 2: Goal area must be >= 5 (minimum difficulty)
        if (solution.goalArea < 5) {
            errors.push(`Goal area too small (${solution.goalArea} < 5) - map is too easy`);
        }
        
        // Validation 3: Optimal walls must be <= maxWalls for this map size
        const maxWallsForSize = CONSTANTS.maxWallsForSize(map.length);
        if (solution.optimalWallCount > maxWallsForSize) {
            errors.push(`Too many walls needed (${solution.optimalWallCount} > ${maxWallsForSize} for size ${map.length})`);
        }
        
        // Validation 4: Walls should not ALL be on edge tiles only (too easy)
        if (solution.optimalSolution && solution.optimalSolution.length > 0) {
            if (this._allWallsOnEdge(map, solution.optimalSolution)) {
                errors.push('All optimal walls are on edge tiles - map is too easy');
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * Check if map has a valid path from home to edge
     * @private
     */
    static _hasPathToEdge(map) {
        const size = map.length;
        const centerRow = Math.floor(size / 2);
        const centerCol = Math.floor(size / 2);
        
        // Verify home is at center
        if (map[centerRow][centerCol] !== 'home') {
            return false;
        }
        
        // BFS to check path to edge
        const visited = new Set();
        const queue = [[centerRow, centerCol]];
        visited.add(`${centerRow},${centerCol}`);
        
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        while (queue.length > 0) {
            const [row, col] = queue.shift();
            
            // Check if reached edge
            if (row === 0 || row === size - 1 || col === 0 || col === size - 1) {
                return true;
            }
            
            // Explore neighbors
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                const coordKey = `${newRow},${newCol}`;
                
                if (newRow < 0 || newRow >= size || newCol < 0 || newCol >= size) {
                    continue;
                }
                
                if (visited.has(coordKey)) {
                    continue;
                }
                
                const tileType = map[newRow][newCol];
                if (tileType === 'water') {
                    continue;
                }
                
                visited.add(coordKey);
                queue.push([newRow, newCol]);
            }
        }
        
        return false;
    }
    
    /**
     * Check if all walls in solution are on edge tiles
     * @private
     */
    static _allWallsOnEdge(map, wallPositions) {
        const size = map.length;
        const maxIndex = size - 1;
        
        // Need at least one wall not on edge
        let hasNonEdgeWall = false;
        
        for (const [row, col] of wallPositions) {
            // Check if this wall is NOT on an edge
            if (row !== 0 && row !== maxIndex && col !== 0 && col !== maxIndex) {
                hasNonEdgeWall = true;
                break;
            }
        }
        
        // If we found a non-edge wall, validation passes (return false = not all on edge)
        // If we didn't find any non-edge walls, validation fails (return true = all on edge)
        return !hasNonEdgeWall;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapValidator;
}
