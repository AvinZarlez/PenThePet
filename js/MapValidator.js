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
        
        // Validation 5: All walkable tiles must be reachable from home
        if (!this._allWalkableTilesReachable(map)) {
            errors.push('Not all walkable tiles are reachable from home');
        }
        
        // Validation 6: All available walls must be required for optimal score
        // When maxWalls is provided in the solution, the level must require every
        // single wall to achieve the goal. This prevents the player from having
        // "leftover" walls that aren't needed.
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
