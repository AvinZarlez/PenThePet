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
        
        // 7. At least one star tile must exist in the map
        if (!this._hasAtLeastOneStar(map)) {
            errors.push('Map has no star tiles - at least one star is required');
        }
        
        // 8. At least one bee tile must exist in the map
        if (!this._hasAtLeastOneBee(map)) {
            errors.push('Map has no bee tiles - at least one bee is required');
        }
        
        // 9. No adjacent holes (fillable tiles that block movement)
        if (this._hasAdjacentHoles(map)) {
            errors.push('Map has adjacent hole tiles - holes must not be next to each other');
        }
        
        // 10. Holes must be strategically significant (detour > WEAK_HOLE_THRESHOLD steps)
        const weakHoles = this._findWeakHoles(map);
        if (weakHoles.length > 0) {
            const t = typeof CONSTANTS !== 'undefined' ? CONSTANTS.WEAK_HOLE_THRESHOLD : 2;
            errors.push(`Map has ${weakHoles.length} hole(s) that can be bypassed with ${t} or fewer extra steps`);
        }
        
        // 11. Tiles with maxPerLevel must not exceed their limit
        const maxPerLevelErrors = this._checkMaxPerLevel(map);
        for (const err of maxPerLevelErrors) {
            errors.push(err);
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

    /**
     * Check if at least one star tile exists in the map.
     * @private
     * @param {Array} map - 2D array of tile type strings
     * @returns {boolean} True if at least one star tile exists
     */
    static _hasAtLeastOneStar(map) {
        for (const row of map) {
            for (const tile of row) {
                if (tile === 'star') return true;
            }
        }
        return false;
    }

    /**
     * Check if at least one bee tile exists in the map.
     * @private
     * @param {Array} map - 2D array of tile type strings
     * @returns {boolean} True if at least one bee tile exists
     */
    static _hasAtLeastOneBee(map) {
        for (const row of map) {
            for (const tile of row) {
                if (tile === 'bee') return true;
            }
        }
        return false;
    }

    /**
     * Check if any two fillable tiles (e.g. holes) are adjacent to each other.
     * Fillable tiles are identified generically by blocksMovement AND wallPlaceable.
     * @private
     * @param {Array} map - 2D array of tile type strings
     * @returns {boolean} True if any adjacent holes are found
     */
    static _hasAdjacentHoles(map) {
        const _isFillable = typeof isFillableTile === 'function' ? isFillableTile : (t) => {
            const d = typeof TILE_DATA !== 'undefined' ? TILE_DATA[t] : null;
            return d ? (d.blocksMovement && d.wallPlaceable) : false;
        };
        const rows = map.length;
        const cols = map[0].length;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!_isFillable(map[r][c])) continue;
                // Check right and down neighbors (avoids double-counting)
                if (c + 1 < cols && _isFillable(map[r][c + 1])) return true;
                if (r + 1 < rows && _isFillable(map[r + 1][c])) return true;
            }
        }
        return false;
    }

    /**
     * Find holes (fillable tiles) that can be bypassed with 5 or fewer extra steps.
     *
     * For each fillable tile, computes the shortest path from home to any edge
     * with the hole empty (blocking) vs. filled (passable). If the difference
     * is ≤ 5 steps, the hole is "weak" — it doesn't create a meaningful obstacle.
     *
     * @private
     * @param {Array} map - 2D array of tile type strings
     * @returns {Array<Array<number>>} Array of [row, col] positions of weak holes
     */
    static _findWeakHoles(map) {
        const _isFillable = typeof isFillableTile === 'function' ? isFillableTile : (t) => {
            const d = typeof TILE_DATA !== 'undefined' ? TILE_DATA[t] : null;
            return d ? (d.blocksMovement && d.wallPlaceable) : false;
        };
        const _isBlocking = typeof isBlockingTile === 'function' ? isBlockingTile : () => false;
        const rows = map.length;
        const cols = map[0].length;

        // Collect all fillable tile positions
        const holes = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (_isFillable(map[r][c])) holes.push([r, c]);
            }
        }
        if (holes.length === 0) return [];

        // Baseline: shortest path with all holes empty (blocking)
        const baselineDist = PathfindingUtils.shortestPathToEdge(map, (tile) => _isBlocking(tile));

        const weakHoles = [];
        for (const [hr, hc] of holes) {
            // Temporarily make this hole passable (as if filled)
            const filledDist = PathfindingUtils.shortestPathToEdge(map, (tile, r, c) => {
                if (r === hr && c === hc) return false; // treat this hole as passable
                return _isBlocking(tile);
            });

            // If the detour around the hole is ≤ WEAK_HOLE_THRESHOLD extra steps, it's weak
            const threshold = typeof CONSTANTS !== 'undefined' ? CONSTANTS.WEAK_HOLE_THRESHOLD : 2;
            const extraSteps = baselineDist - filledDist;
            if (extraSteps <= threshold && filledDist < Infinity) {
                weakHoles.push([hr, hc]);
            }
        }

        return weakHoles;
    }

    /**
     * Check that no tile exceeds its maxPerLevel limit.
     * Reads the maxPerLevel property from TILE_DATA for each tile type.
     * @private
     * @param {Array} map - 2D array of tile type strings
     * @returns {Array<string>} Array of error messages (empty if all OK)
     */
    static _checkMaxPerLevel(map) {
        const _tileData = typeof TILE_DATA !== 'undefined' ? TILE_DATA : {};
        const counts = {};
        for (const row of map) {
            for (const tile of row) {
                counts[tile] = (counts[tile] || 0) + 1;
            }
        }
        const errors = [];
        for (const [name, data] of Object.entries(_tileData)) {
            if (data.maxPerLevel !== undefined && counts[name] > data.maxPerLevel) {
                errors.push(`Too many ${name} tiles (${counts[name]} > max ${data.maxPerLevel})`);
            }
        }
        return errors;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapValidator;
}
