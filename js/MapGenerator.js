/**
 * Map Generator
 * 
 * Generates valid game maps that ensure the pet can always reach an edge
 * when no walls are placed. Delegates path validation to PathfindingUtils.
 */

// Node.js-only module - used by generation scripts, never loaded in browser
(function() {
    if (typeof require !== 'undefined') {
        if (typeof global.CONSTANTS === 'undefined') {
            global.CONSTANTS = require('./constants.js');
        }
        if (typeof global.TILE_DATA === 'undefined') {
            const td = require('./tileData.js');
            global.TILE_DATA = td.TILE_DATA;
            global.TILE_TO_NUMERIC = td.TILE_TO_NUMERIC;
            global.isFillableTile = td.isFillableTile;
            global.getTileScore = td.getTileScore;
        }
        if (typeof global.PathfindingUtils === 'undefined') {
            global.PathfindingUtils = require('./PathfindingUtils.js');
        }
        if (typeof global.MILPSolver === 'undefined') {
            global.MILPSolver = require('../scripts/solver/MILPSolver.js');
        }
        if (typeof global.MapValidator === 'undefined') {
            global.MapValidator = require('./MapValidator.js');
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
     * Uses CONSTANTS.maxWallsForSize(size) for wall count based on grid size
     * Retries generation if map doesn't meet quality standards
     * @param {string} _dateString - Optional date string for seeded generation (unused)
     * @returns {Object} Object containing map and goal, or throws error if unable to generate
     */
    generate(_dateString = null) {
        const maxWalls = CONSTANTS.maxWallsForSize(this.size);
        
        // Keep trying until we get a valid map that meets quality standards
        let totalAttempts = 0;
        const maxTotalAttempts = 1000; // Safety limit to prevent infinite loops
        
        while (totalAttempts < maxTotalAttempts) {
            let attempts = 0;
            let map;
            let result;
            
            // Try to generate a valid random map
            while (attempts < this.maxAttempts) {
                map = this._generateRandomMap();
                this._fixAdjacentHoles(map);
                this._enforceMaxPerLevel(map);
                this._removeWeakHoles(map);
                this._placeStrategicHoles(map);
                if (this._validateMap(map)) {
                    // Calculate optimal goal for this map
                    result = this.calculateGoal(map, maxWalls);
                    
                    if (result !== null && result.optimalWallCount <= maxWalls) {
                        // Use the minimum walls actually needed (solver minimises via epsilon tiebreak)
                        const effectiveMaxWalls = result.optimalWallCount;
                        
                        const validation = MapValidator.validate(map, {
                            ...result,
                            maxWalls: effectiveMaxWalls
                        });
                        
                        if (validation.valid) {
                            // Verify wall budget is a real constraint: unlimited walls must score higher.
                            // Only runs for maps that pass all other checks, so cost is minimal.
                            const unlimitedResult = this.calculateGoal(map, this.size * this.size);
                            if (unlimitedResult !== null && unlimitedResult.goalArea > result.goalArea) {
                                // Prune unnecessary special tiles before accepting the map
                                const pruned = this._pruneUnnecessarySpecialTiles(map, effectiveMaxWalls, result);
                                if (pruned !== null) {
                                    map = pruned.map;
                                    result = pruned.solution;
                                }

                                // Re-validate after pruning (includes star/bee checks)
                                const finalValidation = MapValidator.validate(map, {
                                    ...result,
                                    maxWalls: result.optimalWallCount
                                });
                                if (finalValidation.valid) {
                                    return { 
                                        map, 
                                        goal: result.goalArea, 
                                        maxWalls: result.optimalWallCount,
                                        optimalSolution: result.optimalSolution
                                    };
                                }
                                if (totalAttempts % 10 === 0) {
                                    console.log(`Post-prune validation failed: ${finalValidation.errors.join(', ')}`);
                                }
                            } else {
                                // Wall budget doesn't constrain scoring - try another map
                                if (totalAttempts % 10 === 0) {
                                    console.log('Wall budget does not constrain scoring - skipping map');
                                }
                            }
                        } else {
                            if (totalAttempts % 10 === 0) {
                                console.log(`Validation failed: ${validation.errors.join(', ')}`);
                            }
                        }
                    }
                }
                attempts++;
            }
            
            totalAttempts++;
            if (totalAttempts % 10 === 0) {
                console.log(`Generation attempt ${totalAttempts}: No valid solution found, retrying...`);
            }
        }
        
        // No fallback — throw if all attempts exhausted
        throw new Error(`Failed to generate valid map after ${maxTotalAttempts} attempts. ` +
            'This indicates either the solver is not finding solutions, or the quality ' +
            'constraints are too strict for the given parameters.');
    }

    /**
     * Generate a random map without validation.
     * Uses chance values from TILE_DATA to determine tile types per-tile
     * via random rolls against a cumulative probability distribution.
     * @private
     * @returns {Array} 2D array of tile types
     */
    _generateRandomMap() {
        const center = Math.floor(this.size / 2);
        
        // Build cumulative probability distribution from TILE_DATA
        const cdf = [];
        let totalChance = 0;
        for (const [name, data] of Object.entries(TILE_DATA)) {
            if (data.chance > 0) {
                totalChance += data.chance;
                cdf.push({ name, cumulative: totalChance });
            }
        }
        // Normalise to [0, 1]
        for (const entry of cdf) entry.cumulative /= totalChance;
        
        // Build the 2D map with per-tile random rolls
        const map = [];
        for (let i = 0; i < this.size; i++) {
            const row = [];
            for (let j = 0; j < this.size; j++) {
                if (i === center && j === center) {
                    row.push('home');
                } else {
                    const r = Math.random();
                    let tileName = cdf[cdf.length - 1].name;
                    for (const entry of cdf) {
                        if (r < entry.cumulative) {
                            tileName = entry.name;
                            break;
                        }
                    }
                    row.push(tileName);
                }
            }
            map.push(row);
        }
        
        return map;
    }

    /**
     * Validate that a map has a path from home to edge with no walls.
     * Delegates to PathfindingUtils.hasPathToEdge() for shared BFS logic.
     * @private
     * @param {Array} map - 2D array of tile types
     * @returns {boolean} True if map is valid
     */
    _validateMap(map) {
        return PathfindingUtils.hasPathToEdge(map) && PathfindingUtils.allWalkableTilesReachable(map);
    }

    /**
     * Convert map from string format to numeric format.
     * Uses TILE_TO_NUMERIC from tileData.js for the mapping.
     * @param {Array} stringMap - 2D array of tile type strings
     * @returns {Array} 2D array of numeric tile values
     * @private
     */
    _mapToNumeric(stringMap) {
        return stringMap.map(row => row.map(tile => {
            return TILE_TO_NUMERIC[tile] !== undefined ? TILE_TO_NUMERIC[tile] : 1;
        }));
    }
    
    /**
     * Calculate the maximum achievable area (goal) for a given map.
     * Uses the MILP solver to find the optimal wall placements, then runs BFS
     * to determine the resulting penned area.
     *
     * For fillable tiles (e.g. holes), a wall placed on them "fills" them,
     * making them passable and scoring like their transformed tile type.
     * The solver handles this correctly in its objective function.
     *
     * @param {Array} map - 2D array of tile types (strings)
     * @param {number} maxWalls - Maximum number of walls that can be placed
     * @returns {Object|null} Object with {goalArea, optimalWallCount, optimalSolution, wallPositions, pennedTiles},
     *   or null if pet cannot be penned
     */
    calculateGoal(map, maxWalls) {
        // Convert map from tile type strings to numbers for the solver
        const numericMap = this._mapToNumeric(map);
        
        // Use the MILP solver to find optimal solution
        const solution = MILPSolver.solveMap(numericMap, maxWalls);
        
        if (solution === null) {
            return null;
        }

        const optimalSolution = solution.walls ? this._convertWallsToCoordinates(solution.walls) : [];
        const wallPositions = new Set(optimalSolution.map(([r, c]) => `${r},${c}`));
        const pennedTiles = PathfindingUtils.getPennedTiles(map, wallPositions);

        return {
            goalArea: solution.goalArea,
            optimalWallCount: solution.optimalWallCount || 0,
            optimalSolution,
            wallPositions,
            pennedTiles
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

    /**
     * Prune unnecessary special tiles from a map.
     *
     * For every score-increasing tile (star) inside the optimal penned area:
     *   Replace with grass, re-solve. If wall positions are unchanged, keep as grass.
     *   At least one star is always preserved so the level remains engaging.
     *
     * For every score-removing tile (bee) anywhere on the map:
     *   Replace with grass, re-solve. If wall positions are unchanged, keep as grass.
     *   At least one bee is always preserved so the level remains engaging.
     *
     * Returns the pruned map and its updated solution, or null if re-solving fails.
     *
     * @private
     * @param {Array} map - 2D array of tile type strings
     * @param {number} maxWalls - Wall budget used for re-solving
     * @param {Object} solution - Current solution from calculateGoal
     * @returns {{map: Array, solution: Object}|null}
     */
    _pruneUnnecessarySpecialTiles(map, maxWalls, solution) {
        const originalWalls = solution.wallPositions;
        let currentMap = map.map(row => [...row]);
        let totalStars = currentMap.reduce((acc, row) => acc + row.filter(t => t === 'star').length, 0);
        let totalBees  = currentMap.reduce((acc, row) => acc + row.filter(t => t === 'bee').length, 0);

        // Step 1: Prune unnecessary stars inside the penned area.
        // Always keep at least one star on the map.
        for (const [r, c] of solution.pennedTiles) {
            if (currentMap[r][c] !== 'star') continue;
            if (totalStars <= 1) continue; // Preserve the last star
            const testMap = currentMap.map(row => [...row]);
            testMap[r][c] = 'grass';
            const testSolution = this.calculateGoal(testMap, maxWalls);
            if (testSolution === null) continue;
            if (this._wallSetsEqual(originalWalls, testSolution.wallPositions)) {
                currentMap[r][c] = 'grass';
                totalStars--;
            }
        }

        // Step 2: Prune unnecessary bees anywhere on the map.
        // Always keep at least one bee on the map.
        for (let r = 0; r < currentMap.length; r++) {
            for (let c = 0; c < currentMap[r].length; c++) {
                if (currentMap[r][c] !== 'bee') continue;
                if (totalBees <= 1) continue; // Preserve the last bee
                const testMap = currentMap.map(row => [...row]);
                testMap[r][c] = 'grass';
                const testSolution = this.calculateGoal(testMap, maxWalls);
                if (testSolution === null) continue;
                if (this._wallSetsEqual(originalWalls, testSolution.wallPositions)) {
                    currentMap[r][c] = 'grass';
                    totalBees--;
                }
            }
        }

        // Re-solve the pruned map to get the final goal and solution
        const finalSolution = this.calculateGoal(currentMap, maxWalls);
        if (finalSolution === null) return null;

        return { map: currentMap, solution: finalSolution };
    }

    /**
     * Check if two wall-position sets contain the same coordinates.
     * @private
     * @param {Set<string>} a
     * @param {Set<string>} b
     * @returns {boolean}
     */
    _wallSetsEqual(a, b) {
        if (a.size !== b.size) return false;
        for (const key of a) {
            if (!b.has(key)) return false;
        }
        return true;
    }

    /**
     * Fix adjacent fillable tiles (holes) by replacing one of each pair with grass.
     * Scans in row-major order; when two adjacent fillable tiles are found,
     * the second one is replaced with grass.
     * @private
     * @param {Array} map - 2D array of tile types (modified in place)
     */
    _fixAdjacentHoles(map) {
        const _isFillable = typeof isFillableTile === 'function' ? isFillableTile : (t) => {
            const d = typeof TILE_DATA !== 'undefined' ? TILE_DATA[t] : null;
            return d ? (d.blocksMovement && d.wallPlaceable) : false;
        };
        const rows = map.length;
        const cols = map[0].length;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!_isFillable(map[r][c])) continue;
                // Check right neighbor
                if (c + 1 < cols && _isFillable(map[r][c + 1])) {
                    map[r][c + 1] = 'grass';
                }
                // Check down neighbor
                if (r + 1 < rows && _isFillable(map[r + 1][c])) {
                    map[r + 1][c] = 'grass';
                }
            }
        }
    }

    /**
     * Replace fillable tiles (holes) that can be easily bypassed with water.
     *
     * For each fillable tile, computes the shortest path from home to any edge
     * with the hole empty vs. filled. If the detour is ≤ 5 extra steps, the
     * hole is not strategically significant — replace it with water.
     *
     * @private
     * @param {Array} map - 2D array of tile types (modified in place)
     */
    _fixWeakHoles(map) {
        const _isFillable = typeof isFillableTile === 'function' ? isFillableTile : (t) => {
            const d = typeof TILE_DATA !== 'undefined' ? TILE_DATA[t] : null;
            return d ? (d.blocksMovement && d.wallPlaceable) : false;
        };
        const _isBlocking = typeof isBlockingTile === 'function' ? isBlockingTile : () => false;
        const rows = map.length;
        const cols = map[0].length;

        // Collect fillable tile positions
        const holes = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (_isFillable(map[r][c])) holes.push([r, c]);
            }
        }
        if (holes.length === 0) return;

        // Baseline: shortest path with all holes as-is (blocking)
        const baselineDist = PathfindingUtils.shortestPathToEdge(map, (tile) => _isBlocking(tile));

        for (const [hr, hc] of holes) {
            // Path length if this hole were passable (filled)
            const filledDist = PathfindingUtils.shortestPathToEdge(map, (tile, r, c) => {
                if (r === hr && c === hc) return false;
                return _isBlocking(tile);
            });

            const extraSteps = baselineDist - filledDist;
            if (extraSteps <= 5 && filledDist < Infinity) {
                map[hr][hc] = 'water';
            }
        }
    }

    /**
     * Enforce maxPerLevel limits from TILE_DATA.
     * For each tile type that has a maxPerLevel property, if the count exceeds
     * the limit, excess tiles are replaced with 'grass' (or 'water' for
     * blocking tiles). Replaces in reverse row-major order to keep earlier tiles.
     * @private
     * @param {Array} map - 2D array of tile types (modified in place)
     */
    _enforceMaxPerLevel(map) {
        const _tileData = typeof TILE_DATA !== 'undefined' ? TILE_DATA : {};
        // Build limits map: tileName -> maxPerLevel
        const limits = {};
        for (const [name, data] of Object.entries(_tileData)) {
            if (data.maxPerLevel !== undefined) {
                limits[name] = data.maxPerLevel;
            }
        }
        if (Object.keys(limits).length === 0) return;

        // Count occurrences and collect positions (first N are kept)
        const counts = {};
        const rows = map.length;
        const cols = map[0].length;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const tile = map[r][c];
                if (limits[tile] === undefined) continue;
                counts[tile] = (counts[tile] || 0) + 1;
                if (counts[tile] > limits[tile]) {
                    // Excess tile: replace with grass for passable tiles, water for blocking
                    const data = _tileData[tile];
                    map[r][c] = (data && data.blocksMovement) ? 'water' : 'grass';
                }
            }
        }
    }

    /**
     * Remove any randomly-placed weak holes by converting them to grass.
     * A hole is "weak" if filling it saves ≤ 5 steps on the path to the edge.
     * @private
     * @param {Array} map - 2D array of tile types (modified in place)
     */
    _removeWeakHoles(map) {
        const _isFillable = typeof isFillableTile === 'function' ? isFillableTile : (t) => {
            const d = typeof TILE_DATA !== 'undefined' ? TILE_DATA[t] : null;
            return d ? (d.blocksMovement && d.wallPlaceable) : false;
        };
        const _isBlocking = typeof isBlockingTile === 'function' ? isBlockingTile : (t) => {
            const d = typeof TILE_DATA !== 'undefined' ? TILE_DATA[t] : null;
            return d ? d.blocksMovement : false;
        };
        const rows = map.length;
        const cols = map[0].length;

        const holes = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (_isFillable(map[r][c])) holes.push([r, c]);
            }
        }
        if (holes.length === 0) return;

        const baselineDist = PathfindingUtils.shortestPathToEdge(map, (tile) => _isBlocking(tile));

        for (const [hr, hc] of holes) {
            const filledDist = PathfindingUtils.shortestPathToEdge(map, (tile, r, c) => {
                if (r === hr && c === hc) return false;
                return _isBlocking(tile);
            });
            const extraSteps = baselineDist - filledDist;
            const threshold = typeof CONSTANTS !== 'undefined' ? CONSTANTS.WEAK_HOLE_THRESHOLD : 2;
            if (extraSteps <= threshold || filledDist === Infinity) {
                map[hr][hc] = 'grass';
            }
        }
    }

    /**
     * Place holes at strategic bottleneck positions in the map.
     *
     * Scans every interior grass tile and measures how many extra steps
     * a player would need if that tile were a blocking hole. Tiles where
     * the detour exceeds CONSTANTS.WEAK_HOLE_THRESHOLD are good candidates
     * — they match the weak-hole validation threshold, so the validator
     * will accept them.
     *
     * Only attempts placement ~65% of the time so that some maps remain
     * hole-free (satisfying the ≥ 20% no-hole requirement).
     *
     * @private
     * @param {Array} map - 2D array of tile types (modified in place)
     */
    _placeStrategicHoles(map) {
        // Only attempt hole placement some of the time
        if (Math.random() > 0.65) return;

        const _isFillable = typeof isFillableTile === 'function' ? isFillableTile : (t) => {
            const d = typeof TILE_DATA !== 'undefined' ? TILE_DATA[t] : null;
            return d ? (d.blocksMovement && d.wallPlaceable) : false;
        };
        const _isBlocking = (tile) => {
            const d = typeof TILE_DATA !== 'undefined' ? TILE_DATA[tile] : null;
            return d ? d.blocksMovement : false;
        };
        const _tileData = typeof TILE_DATA !== 'undefined' ? TILE_DATA : {};
        const maxHoles = (_tileData.hole && _tileData.hole.maxPerLevel) || 3;
        const rows = map.length;
        const cols = map[0].length;

        // Count existing holes (from random placement that survived _removeWeakHoles)
        let existingHoles = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (_isFillable(map[r][c])) existingHoles++;
            }
        }
        if (existingHoles >= maxHoles) return;

        // Find home position
        let homeR = Math.floor(rows / 2), homeC = Math.floor(cols / 2);
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (map[r][c] === 'home') { homeR = r; homeC = c; }
            }
        }

        // Baseline path length (current map, no new holes)
        const baseline = PathfindingUtils.shortestPathToEdge(map, (tile) => _isBlocking(tile));
        if (baseline === Infinity) return;

        // Find candidate grass tiles where adding a hole creates a meaningful detour
        const threshold = typeof CONSTANTS !== 'undefined' ? CONSTANTS.WEAK_HOLE_THRESHOLD : 2;
        const candidates = [];
        for (let r = 1; r < rows - 1; r++) {
            for (let c = 1; c < cols - 1; c++) {
                if (map[r][c] !== 'grass') continue;
                // Skip tiles adjacent to home
                if (Math.abs(r - homeR) <= 1 && Math.abs(c - homeC) <= 1) continue;
                // Skip tiles adjacent to existing holes
                let adjToHole = false;
                if (r > 0 && _isFillable(map[r - 1][c])) adjToHole = true;
                if (r < rows - 1 && _isFillable(map[r + 1][c])) adjToHole = true;
                if (c > 0 && _isFillable(map[r][c - 1])) adjToHole = true;
                if (c < cols - 1 && _isFillable(map[r][c + 1])) adjToHole = true;
                if (adjToHole) continue;

                // Temporarily place hole and measure path increase
                map[r][c] = 'hole';
                const withHole = PathfindingUtils.shortestPathToEdge(map, (tile) => _isBlocking(tile));
                map[r][c] = 'grass';

                if (withHole === Infinity) continue;
                const impact = withHole - baseline;
                if (impact > threshold) {
                    candidates.push({ r, c, impact });
                }
            }
        }

        if (candidates.length === 0) return;

        // Shuffle candidates for variety
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }

        // Place holes one at a time, rechecking adjacency after each
        let placed = existingHoles;
        for (const { r, c } of candidates) {
            if (placed >= maxHoles) break;
            // Re-check adjacency (may have changed from earlier placements in this loop)
            let adjToHole = false;
            if (r > 0 && _isFillable(map[r - 1][c])) adjToHole = true;
            if (r < rows - 1 && _isFillable(map[r + 1][c])) adjToHole = true;
            if (c > 0 && _isFillable(map[r][c - 1])) adjToHole = true;
            if (c < cols - 1 && _isFillable(map[r][c + 1])) adjToHole = true;
            if (adjToHole) continue;

            map[r][c] = 'hole';
            placed++;
        }
    }

}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapGenerator;
}
