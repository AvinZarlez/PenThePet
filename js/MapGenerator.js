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
                this._reinforceHoles(map);
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
     * Reinforce weak holes by adding water tiles nearby to create bottlenecks,
     * or place holes at interior positions that naturally create detours.
     *
     * Two-phase approach:
     * Phase 1: Remove any randomly-placed holes that are on edges or weak.
     * Phase 2: Place holes at interior positions where they create a meaningful
     *          detour (extra > WEAK_HOLE_THRESHOLD), using water reinforcement
     *          to strengthen borderline positions.
     *
     * Only attempts hole placement ~65% of the time so that some maps remain
     * hole-free (satisfying the ≥ 20% no-hole requirement).
     *
     * @private
     * @param {Array} map - 2D array of tile types (modified in place)
     */
    _reinforceHoles(map) {
        const _isFillable = typeof isFillableTile === 'function' ? isFillableTile : (t) => {
            const d = typeof TILE_DATA !== 'undefined' ? TILE_DATA[t] : null;
            return d ? (d.blocksMovement && d.wallPlaceable) : false;
        };
        const _isBlocking = typeof isBlockingTile === 'function' ? isBlockingTile : (t) => {
            const d = typeof TILE_DATA !== 'undefined' ? TILE_DATA[t] : null;
            return d ? d.blocksMovement : false;
        };
        const _tileData = typeof TILE_DATA !== 'undefined' ? TILE_DATA : {};
        const threshold = typeof CONSTANTS !== 'undefined' ? CONSTANTS.WEAK_HOLE_THRESHOLD : 0;
        const maxHoles = (_tileData.hole && _tileData.hole.maxPerLevel) || 3;
        const rows = map.length;
        const cols = map[0].length;

        // Phase 1: Remove all randomly placed holes — we'll place them strategically
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (_isFillable(map[r][c])) {
                    map[r][c] = 'grass';
                }
            }
        }

        // Only attempt hole placement some of the time (25% chance of no holes)
        if (Math.random() > 0.75) return;

        // Find home position
        let homeR = Math.floor(rows / 2), homeC = Math.floor(cols / 2);
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (map[r][c] === 'home') { homeR = r; homeC = c; }
            }
        }

        // Phase 2: Find interior grass tiles that create a detour when blocked.
        // Score each candidate by its natural impact, then try reinforcement.
        const candidates = [];
        for (let r = 1; r < rows - 1; r++) {
            for (let c = 1; c < cols - 1; c++) {
                if (map[r][c] !== 'grass') continue;
                if (Math.abs(r - homeR) <= 1 && Math.abs(c - homeC) <= 1) continue;

                // Temporarily place hole and measure impact
                map[r][c] = 'hole';
                const strong = this._isHoleStrong(map, r, c, threshold, _isBlocking);
                map[r][c] = 'grass';

                if (strong) {
                    candidates.push({ r, c, natural: true });
                } else {
                    // Still a candidate for reinforcement
                    candidates.push({ r, c, natural: false });
                }
            }
        }

        // Sort: natural strong candidates first, then reinforcement candidates
        // Shuffle within each group for variety
        const naturals = candidates.filter(c => c.natural);
        const reinforceable = candidates.filter(c => !c.natural);
        for (const arr of [naturals, reinforceable]) {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        }
        const sortedCandidates = [...naturals, ...reinforceable];

        // Place holes
        let holeCount = 0;
        for (const { r, c, natural } of sortedCandidates) {
            if (holeCount >= maxHoles) break;
            if (map[r][c] !== 'grass') continue;

            // Check adjacency to existing holes
            let adjToHole = false;
            const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dr, dc] of dirs) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && _isFillable(map[nr][nc])) {
                    adjToHole = true;
                    break;
                }
            }
            if (adjToHole) continue;

            map[r][c] = 'hole';

            if (!PathfindingUtils.hasPathToEdge(map) || !PathfindingUtils.allWalkableTilesReachable(map)) {
                map[r][c] = 'grass';
                continue;
            }

            if (natural) {
                // Naturally strong — just verify
                if (this._isHoleStrong(map, r, c, threshold, _isBlocking)) {
                    holeCount++;
                    continue;
                }
            }

            // Try water reinforcement
            const reinforced = this._reinforceWithWater(map, r, c, threshold, _isBlocking);
            if (reinforced && PathfindingUtils.allWalkableTilesReachable(map)) {
                holeCount++;
            } else {
                map[r][c] = 'grass';
            }
        }
    }

    /**
     * Try to reinforce a hole at (hr,hc) by creating a water barrier line
     * through or near the hole. The barrier extends perpendicular to the escape
     * path direction, creating a "dam" that the pet must go around.
     *
     * The barrier must have at least 1 water tile on each side of the hole
     * to force a detour > 2 steps.
     *
     * @private
     * @param {Array} map - 2D map (modified in place; caller reverts if returns false)
     * @param {number} hr - Hole row
     * @param {number} hc - Hole column
     * @param {number} threshold - Minimum detour steps
     * @param {Function} _isBlocking - Blocking tile checker
     * @returns {boolean} True if hole was successfully reinforced
     */
    _reinforceWithWater(map, hr, hc, threshold, _isBlocking) {
        const rows = map.length;
        const cols = map[0].length;

        // Try creating a barrier in each orientation: horizontal row, vertical column
        const orientations = [
            // Horizontal barrier: convert tiles along row hr (extend left/right)
            { steps: [[0, -1], [0, 1]] },
            // Vertical barrier: convert tiles along column hc (extend up/down)
            { steps: [[-1, 0], [1, 0]] },
        ];

        for (const config of orientations) {
            const waterAdded = [];

            // Extend barrier in both directions from the hole
            for (const [dr, dc] of config.steps) {
                for (let dist = 1; dist <= Math.max(rows, cols); dist++) {
                    const nr = hr + dr * dist;
                    const nc = hc + dc * dist;
                    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) break;
                    if (map[nr][nc] !== 'grass') break;
                    waterAdded.push([nr, nc]);
                }
            }

            if (waterAdded.length < 2) continue; // Need at least 1 on each side

            // Place all water tiles
            for (const [wr, wc] of waterAdded) {
                map[wr][wc] = 'water';
            }

            // Verify connectivity — shorten barrier if needed
            while (waterAdded.length > 0) {
                if (PathfindingUtils.hasPathToEdge(map) && PathfindingUtils.allWalkableTilesReachable(map)) {
                    break;
                }
                // Remove last water tile
                const [wr, wc] = waterAdded.pop();
                map[wr][wc] = 'grass';
            }

            // Check hole strength
            if (waterAdded.length >= 2 && this._isHoleStrong(map, hr, hc, threshold, _isBlocking)) {
                return true;
            }

            // Revert
            for (const [wr, wc] of waterAdded) {
                map[wr][wc] = 'grass';
            }
        }

        return false;
    }

    /**
     * Check if a hole is strategically significant (area loss > threshold).
     * Measures how many tiles become unreachable from home when the hole is placed.
     * @private
     * @param {Array} map - 2D map
     * @param {number} hr - Hole row
     * @param {number} hc - Hole column
     * @param {number} threshold - Minimum area loss
     * @param {Function} _isBlocking - Blocking tile checker
     * @returns {boolean}
     */
    _isHoleStrong(map, hr, hc, threshold, _isBlocking) {
        // Measure reachable area with hole blocking
        const holeArea = PathfindingUtils.reachableAreaCount(map, (tile) => _isBlocking(tile));
        // Measure reachable area if hole were passable (filled)
        const filledArea = PathfindingUtils.reachableAreaCount(map, (tile, r, c) => {
            if (r === hr && c === hc) return false;
            return _isBlocking(tile);
        });
        // Area loss = tiles cut off by the hole
        return (filledArea - holeArea) > threshold;
    }

}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapGenerator;
}
