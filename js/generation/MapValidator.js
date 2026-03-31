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
            global.CONSTANTS = require('../config/constants.js');
        }
        if (typeof PathfindingUtils === 'undefined' && typeof global !== 'undefined') {
            global.PathfindingUtils = require('../game/PathfindingUtils.js');
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
        
        // 2. Goal area must be >= 9 (prevents trivially easy maps)
        if (solution.goalArea < 9) {
            errors.push(`Goal area too small (${solution.goalArea} < 9) - map is too easy`);
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
        
        // 12. Every non-edge walkable tile must be reachable without traversing edge tiles
        // Holes are treated as passable (they can be filled), but edge tiles cannot be used
        if (!this._allNonEdgeTilesReachableViaInterior(map)) {
            errors.push('Not all non-edge tiles are reachable from home without traversing edge tiles');
        }
        
        // 6. Every available wall must be needed for the optimal score.
        // NOTE: Generation/editor should align map maxWalls down to optimalWallCount.
        // This validator no longer rejects maps for having spare wall budget.
        
        // 7. No score-modifying tiles adjacent to home (they are always penned, not an interesting choice)
        const adjScoreTiles = this._scoreModifyingTilesAdjacentToHome(map);
        if (adjScoreTiles.length > 0) {
            errors.push(`Score-modifying tiles adjacent to home at: ${adjScoreTiles.map(([r, c]) => `(${r},${c})`).join(', ')}`);
        }

        // 8. At least one star tile must exist in the map
        if (!this._hasAtLeastOneStar(map)) {
            errors.push('Map has no star tiles - at least one star is required');
        }
        
        // 9. At least one bee tile must exist in the map
        if (!this._hasAtLeastOneBee(map)) {
            errors.push('Map has no bee tiles - at least one bee is required');
        }
        
        // 9. No adjacent holes (fillable tiles that block movement)
        if (this._hasAdjacentHoles(map)) {
            errors.push('Map has adjacent hole tiles - holes must not be next to each other');
        }
        
        // 10. Holes must be strategically significant (area loss > WEAK_HOLE_THRESHOLD)
        const weakHoles = this._findWeakHoles(map);
        if (weakHoles.length > 0) {
            const t = typeof CONSTANTS !== 'undefined' ? CONSTANTS.WEAK_HOLE_THRESHOLD : 2;
            errors.push(`Map has ${weakHoles.length} hole(s) that cut off ${t} or fewer tiles`);
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
     * Check that every non-edge walkable tile is reachable from home
     * without traversing edge tiles. Holes are treated as passable.
     * Delegates to PathfindingUtils.allNonEdgeTilesReachableViaInterior().
     * @private
     * @param {Array} map - 2D array of tile type strings
     * @returns {boolean} True if all non-edge walkable tiles are reachable via interior path
     */
    static _allNonEdgeTilesReachableViaInterior(map) {
        return PathfindingUtils.allNonEdgeTilesReachableViaInterior(map);
    }

    /**
     * Find score-modifying tiles (e.g. stars, bees) that are orthogonally adjacent to home.
     * Such tiles are always penned regardless of wall placement and offer no strategic choice.
     * Score-modifying tiles are identified as passable tiles with a score other than 0 or 1.
     * @private
     * @param {Array} map - 2D array of tile type strings
     * @returns {Array<Array<number>>} Array of [row, col] positions of adjacent score-modifying tiles
     */
    static _scoreModifyingTilesAdjacentToHome(map) {
        const rows = map.length;
        const cols = map[0].length;
        const [homeR, homeC] = MapValidator._findHomePosition(map);
        if (homeR === -1) return [];

        const adjacent = [];
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of dirs) {
            const r = homeR + dr, c = homeC + dc;
            if (r >= 0 && r < rows && c >= 0 && c < cols && MapValidator._isScoreModifyingTile(map[r][c])) {
                adjacent.push([r, c]);
            }
        }
        return adjacent;
    }

    /**
     * Returns true if the tile is a score-modifying tile (score is not 0 or 1).
     * Stars (+3) and bees (-3) are score-modifying; grass, water, home, etc. are not.
     * @param {string} tile - Tile type string
     * @returns {boolean}
     */
    static _isScoreModifyingTile(tile) {
        const _tileData = typeof TILE_DATA !== 'undefined' ? TILE_DATA : {};
        const d = _tileData[tile];
        return d ? (d.score !== 0 && d.score !== 1) : false;
    }

    /**
     * Find the [row, col] position of the home tile in a 2D map array.
     * Returns [-1, -1] if no home tile is found.
     * @param {Array} map - 2D array of tile type strings
     * @returns {Array<number>} [row, col] or [-1, -1]
     */
    static _findHomePosition(map) {
        const rows = map.length;
        const cols = map[0].length;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (map[r][c] === 'home') return [r, c];
            }
        }
        return [-1, -1];
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
     * For each fillable tile, computes the reachable area from home with the
     * hole blocking vs. filled (passable). If the area loss (tiles cut off by
     * the hole) is ≤ WEAK_HOLE_THRESHOLD, the hole is "weak" — it doesn't
     * create a meaningful obstacle.
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

        const weakHoles = [];
        for (const [hr, hc] of holes) {
            // Reachable area with hole blocking
            const holeArea = PathfindingUtils.reachableAreaCount(map, (tile) => _isBlocking(tile));

            // Reachable area if this hole were passable (as if filled)
            const filledArea = PathfindingUtils.reachableAreaCount(map, (tile, r, c) => {
                if (r === hr && c === hc) return false; // treat this hole as passable
                return _isBlocking(tile);
            });

            // If the hole cuts off ≤ WEAK_HOLE_THRESHOLD tiles, it's weak
            const threshold = typeof CONSTANTS !== 'undefined' ? CONSTANTS.WEAK_HOLE_THRESHOLD : 2;
            const areaLoss = filledArea - holeArea;
            if (areaLoss <= threshold) {
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
