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
     * Calculate the maximum achievable area (goal) for a given map.
     * Uses the MILP solver to find the optimal wall placements, then runs BFS
     * to determine the resulting penned area.
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

        // BFS from home to find all tiles inside the penned area
        const size = map.length;
        let homeRow = -1, homeCol = -1;
        for (let i = 0; i < size && homeRow < 0; i++) {
            for (let j = 0; j < map[i].length; j++) {
                if (map[i][j] === 'home') { homeRow = i; homeCol = j; break; }
            }
        }
        const pennedTiles = [];
        if (homeRow >= 0) {
            const visited = new Set([`${homeRow},${homeCol}`]);
            const queue = [[homeRow, homeCol]];
            const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            while (queue.length > 0) {
                const [row, col] = queue.shift();
                for (const [dr, dc] of dirs) {
                    const nr = row + dr, nc = col + dc;
                    const key = `${nr},${nc}`;
                    if (nr < 0 || nr >= size || nc < 0 || nc >= map[nr].length) continue;
                    if (visited.has(key) || wallPositions.has(key)) continue;
                    if (isBlockingTile(map[nr][nc])) continue;
                    visited.add(key);
                    queue.push([nr, nc]);
                }
            }
            for (const key of visited) {
                const [r, c] = key.split(',').map(Number);
                pennedTiles.push([r, c]);
            }
        }

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

}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapGenerator;
}
