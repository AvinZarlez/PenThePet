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
        
        // 1. Must have a valid path from home to edge
        if (!this._hasPathToEdge(map)) {
            errors.push('Map does not have a valid path from home to edge');
        }
        
        // 2. Goal area must be >= 5 (prevents trivially easy maps)
        if (solution.goalArea < 5) {
            errors.push(`Goal area too small (${solution.goalArea} < 5) - map is too easy`);
        }
        
        // 3. Optimal walls must fit within the wall budget for this grid size
        const maxWallsForSize = CONSTANTS.maxWallsForSize(map.length);
        if (solution.optimalWallCount > maxWallsForSize) {
            errors.push(`Too many walls needed (${solution.optimalWallCount} > ${maxWallsForSize} for size ${map.length})`);
        }
        
        // 4. At least one optimal wall must be on a non-edge tile (prevents trivial solutions)
        if (solution.optimalSolution && solution.optimalSolution.length > 0) {
            if (this._allWallsOnEdge(map, solution.optimalSolution)) {
                errors.push('All optimal walls are on edge tiles - map is too easy');
            }
        }
        
        // 5. All walkable tiles must be reachable from home
        if (!this._allWalkableTilesReachable(map)) {
            errors.push('Not all walkable tiles are reachable from home');
        }
        
        // 6. Every available wall must be needed for the optimal score
        if (solution.maxWalls !== undefined) {
            if (solution.optimalWallCount !== solution.maxWalls) {
                errors.push(`Not all walls needed for optimal score (uses ${solution.optimalWallCount} of ${solution.maxWalls} walls)`);
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * Check if map has a valid path from home to edge.
     * Delegates to PathfindingUtils.hasPathToEdge() for shared BFS logic.
     * @private
     * @param {Array} map - 2D array of tile type strings
     * @returns {boolean} True if path exists from home to edge
     */
    static _hasPathToEdge(map) {
        return PathfindingUtils.hasPathToEdge(map);
    }
    
    /**
     * Check if all walls in solution are on edge tiles
     * @private
     */
    static _allWallsOnEdge(map, wallPositions) {
        const size = map.length;
        const maxIndex = size - 1;
        
        for (const [row, col] of wallPositions) {
            if (row !== 0 && row !== maxIndex && col !== 0 && col !== maxIndex) {
                return false; // found a non-edge wall
            }
        }
        
        return true; // all walls on edge
    }
    
    /**
     * Check if all walkable tiles are reachable from home.
     * Delegates to PathfindingUtils.allWalkableTilesReachable() for shared BFS logic.
     * @private
     * @param {Array} map - 2D array of tile type strings
     * @returns {boolean} True if all walkable tiles are reachable from home
     */
    static _allWalkableTilesReachable(map) {
        return PathfindingUtils.allWalkableTilesReachable(map);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapValidator;
}
