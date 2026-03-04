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
     * Uses chance values from TILE_DATA to determine tile counts,
     * builds an exact-size tile list, then shuffles to randomise placement.
     * @private
     * @returns {Array} 2D array of tile types
     */
    _generateRandomMap() {
        const totalTiles = this.size * this.size;
        const reservedTiles = 1; // home tile placed separately
        const fillCount = totalTiles - reservedTiles;
        
        // Build a list of eligible tile types and their chances from TILE_DATA
        const eligibleTiles = [];
        let totalChance = 0;
        for (const [name, data] of Object.entries(TILE_DATA)) {
            if (data.chance > 0) {
                eligibleTiles.push({ name, chance: data.chance });
                totalChance += data.chance;
            }
        }
        
        // Compute how many of each tile type based on chance proportions
        const tileList = [];
        let placed = 0;
        for (let i = 0; i < eligibleTiles.length; i++) {
            const t = eligibleTiles[i];
            let count;
            if (i === eligibleTiles.length - 1) {
                // Last tile type gets the remainder to ensure exact total
                count = fillCount - placed;
            } else {
                count = Math.floor((t.chance / totalChance) * fillCount);
            }
            for (let j = 0; j < count; j++) {
                tileList.push(t.name);
            }
            placed += count;
        }
        
        // Shuffle the tile list (Fisher-Yates)
        for (let i = tileList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tileList[i], tileList[j]] = [tileList[j], tileList[i]];
        }
        
        // Insert home at center position so every slot is accounted for
        const centerIndex = Math.floor(this.size / 2) * this.size + Math.floor(this.size / 2);
        tileList.splice(centerIndex, 0, 'home');
        
        // Build the 2D map
        const map = [];
        let idx = 0;
        for (let i = 0; i < this.size; i++) {
            const row = [];
            for (let j = 0; j < this.size; j++) {
                row.push(tileList[idx++]);
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
     * Calculate the maximum achievable area (goal) for a given map
     * Uses the MILP solver to find the optimal wall placements
     * @param {Array} map - 2D array of tile types (strings)
     * @param {number} maxWalls - Maximum number of walls that can be placed
     * @returns {Object|null} Object with {goalArea, optimalWallCount, optimalSolution}, or null if pet cannot be penned
     */
    calculateGoal(map, maxWalls) {
        // Convert map from tile type strings to numbers for the solver
        const numericMap = this._mapToNumeric(map);
        
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

    /**
     * Build a Set of "row,col" strings from an array of [row,col] coordinate pairs.
     * @private
     * @param {Array} coords - Array of [row, col] pairs
     * @returns {Set<string>}
     */
    _wallSet(coords) {
        return new Set(coords.map(([r, c]) => `${r},${c}`));
    }

    /**
     * Find all tile positions in the optimal penned area using BFS from home.
     * Walls from the solution are treated as blocking.
     * @private
     * @param {Array} map - 2D array of tile type strings
     * @param {Set<string>} wallPositions - Set of "row,col" strings for wall locations
     * @returns {Array<Array<number>>} Array of [row, col] positions inside the penned area
     */
    _getPennedTiles(map, wallPositions) {
        const size = map.length;
        let homeRow = -1, homeCol = -1;
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < map[i].length; j++) {
                if (map[i][j] === 'home') { homeRow = i; homeCol = j; }
            }
        }
        if (homeRow < 0) return [];

        const visited = new Set([`${homeRow},${homeCol}`]);
        const queue = [[homeRow, homeCol]];
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        while (queue.length > 0) {
            const [r, c] = queue.shift();
            for (const [dr, dc] of dirs) {
                const nr = r + dr, nc = c + dc;
                const key = `${nr},${nc}`;
                if (nr < 0 || nr >= size || nc < 0 || nc >= map[nr].length) continue;
                if (visited.has(key)) continue;
                if (wallPositions.has(key)) continue;
                if (map[nr][nc] === 'water') continue;
                visited.add(key);
                queue.push([nr, nc]);
            }
        }

        return [...visited].map(key => key.split(',').map(Number));
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
     * Uses a fast-path batch test: if removing ALL candidates at once leaves wall
     * positions unchanged, they are all pruned in a single solver call. Otherwise
     * each candidate is tested individually (slower fallback).
     *
     * Returns the pruned map and its updated solution, or null if re-solving fails.
     *
     * @private
     * @param {Array} map - 2D array of tile type strings
     * @param {number} maxWalls - Wall budget used for re-solving
     * @param {Object} solution - Current solution {goalArea, optimalWallCount, optimalSolution}
     * @returns {{map: Array, solution: Object}|null}
     */
    _pruneUnnecessarySpecialTiles(map, maxWalls, solution) {
        const originalWalls = this._wallSet(solution.optimalSolution);
        let currentMap = map.map(row => [...row]);

        const pennedTiles = this._getPennedTiles(currentMap, originalWalls);
        let totalStars = currentMap.reduce((acc, row) => acc + row.filter(t => t === 'star').length, 0);
        let totalBees  = currentMap.reduce((acc, row) => acc + row.filter(t => t === 'bee').length, 0);

        // Collect candidates: stars inside the penned area, bees anywhere
        const candidateStars = pennedTiles.filter(([r, c]) => currentMap[r][c] === 'star');
        const candidateBees  = [];
        for (let r = 0; r < currentMap.length; r++) {
            for (let c = 0; c < currentMap[r].length; c++) {
                if (currentMap[r][c] === 'bee') candidateBees.push([r, c]);
            }
        }

        // ── Fast-path: batch test all candidates at once ──────────────────
        // Build a test map with all candidates removed (respecting "keep 1" rule).
        // Stars outside the penned area are preserved; for bees they are all candidates.
        const starsOutsidePen = totalStars - candidateStars.length;
        const maxStarsToRemove = candidateStars.length - Math.max(0, 1 - starsOutsidePen);
        const maxBeesToRemove  = candidateBees.length  - (totalBees === candidateBees.length ? 1 : 0);
        const starsToRemoveBatch = candidateStars.slice(0, maxStarsToRemove);
        const beesToRemoveBatch  = candidateBees.slice(0, maxBeesToRemove);

        if (starsToRemoveBatch.length > 0 || beesToRemoveBatch.length > 0) {
            const batchMap = currentMap.map(row => [...row]);
            starsToRemoveBatch.forEach(([r, c]) => { batchMap[r][c] = 'grass'; });
            beesToRemoveBatch.forEach( ([r, c]) => { batchMap[r][c] = 'grass'; });

            const batchSolution = this.calculateGoal(batchMap, maxWalls);
            if (batchSolution !== null) {
                const batchWalls = this._wallSet(batchSolution.optimalSolution);
                if (this._wallSetsEqual(originalWalls, batchWalls)) {
                    // All candidates are unnecessary — apply batch prune and finish
                    currentMap = batchMap;
                    const finalSolution = this.calculateGoal(currentMap, maxWalls);
                    if (finalSolution === null) return null;
                    return { map: currentMap, solution: finalSolution };
                }
            }
        }

        // ── Slow-path: test each candidate individually ────────────────────
        for (const [r, c] of candidateStars) {
            if (currentMap[r][c] !== 'star') continue; // Already pruned in a prior step
            if (totalStars <= 1) continue;             // Preserve the last star
            const testMap = currentMap.map(row => [...row]);
            testMap[r][c] = 'grass';
            const testSolution = this.calculateGoal(testMap, maxWalls);
            if (testSolution === null) continue;
            const testWalls = this._wallSet(testSolution.optimalSolution);
            if (this._wallSetsEqual(originalWalls, testWalls)) {
                currentMap[r][c] = 'grass';
                totalStars--;
            }
        }

        for (let r = 0; r < currentMap.length; r++) {
            for (let c = 0; c < currentMap[r].length; c++) {
                if (currentMap[r][c] !== 'bee') continue;
                if (totalBees <= 1) continue; // Preserve the last bee
                const testMap = currentMap.map(row => [...row]);
                testMap[r][c] = 'grass';
                const testSolution = this.calculateGoal(testMap, maxWalls);
                if (testSolution === null) continue;
                const testWalls = this._wallSet(testSolution.optimalSolution);
                if (this._wallSetsEqual(originalWalls, testWalls)) {
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

}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapGenerator;
}
