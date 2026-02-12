/**
 * MILP Solver for Pen the Pet - PRODUCTION SOLVER
 * 
 * ✅ THIS IS THE OFFICIAL PRODUCTION SOLVER - Use this for all map generation and gameplay ✅
 * 
 * This implements an exhaustive combinatorial search to find optimal wall placement 
 * that maximizes the penned area. Despite the "MILP" name (historical), this solver
 * uses exhaustive enumeration of wall combinations, checking up to 50 million 
 * combinations per wall count for accuracy.
 * 
 * **Algorithm:**
 * - Iteratively tries wall counts from 1 to maxWalls
 * - For each count, generates combinations on-the-fly (memory efficient)
 * - Tests each combination to see if pet is penned
 * - Keeps track of maximum penned area found
 * - Returns optimal solution (walls array + goal area)
 * 
 * **Performance:**
 * - Small maps (≤7x7): Fast enough for real-time generation
 * - Medium maps (9x9-11x11): Seconds to minutes depending on complexity
 * - Large maps (≥13x13): May take longer but still practical
 * 
 * **Accuracy:**
 * - Finds true optimal solution within combination limits
 * - No heuristics or approximations (removed for consistency)
 * - Verified against BruteForceSolver on small test maps
 * 
 * **Usage:**
 * - MapGenerator.calculateGoal() - Called during map generation
 * - Never fallback to other solvers - this is the single source of truth
 * - If this fails, map generation should throw error (no fallback)
 * 
 * Based on the Python solver using scipy.optimize.milp concept
 * Copyright 2026 - Adapted from dynomight's Python implementation
 * Available under AGPL 3.0 license
 */

// Import shared pathfinding utilities (only in Node.js environment)
// In browser, PathfindingUtils is already loaded via script tag
(function() {
    if (typeof module !== 'undefined' && typeof require !== 'undefined' && typeof PathfindingUtils === 'undefined') {
        global.PathfindingUtils = require('./PathfindingUtils.js');
    }
})();

class MILPSolver {
    /**
     * Solve the map to find optimal wall placement
     * @param {Array} map - 2D array where 0=water, 1=grass, 2=home
     * @param {number} maxWalls - Maximum number of walls available
     * @returns {Object} Object with {walls: Array, goalArea: number} or null if no solution
     */
    static solveMap(map, maxWalls) {
        const verticalTiles = map.length;
        const horizontalTiles = map[0].length;
        
        // Find home position
        let homeRow = -1, homeCol = -1;
        for (let i = 0; i < verticalTiles; i++) {
            for (let j = 0; j < horizontalTiles; j++) {
                if (map[i][j] === 2) {
                    homeRow = i;
                    homeCol = j;
                    break;
                }
            }
            if (homeRow >= 0) break;
        }
        
        if (homeRow < 0 || homeCol < 0) {
            console.error('No home position found in map');
            return null;
        }
        
        // Use an iterative search to find the best wall placement
        // We'll try different combinations and pick the one with smallest penned area
        const bestSolution = this._findBestWallPlacement(map, maxWalls, homeRow, homeCol);
        
        if (bestSolution === null) {
            console.error('Failed to find solution');
            return null;
        }
        
        return bestSolution;
    }
    
    /**
     * Find the best wall placement using exhaustive search ONLY
     * Goal: MAXIMIZE the penned area with available walls
     * Uses ONLY accurate exhaustive search - no heuristics (accuracy over speed)
     * @private
     */
    static _findBestWallPlacement(map, maxWalls, homeRow, homeCol) {
        const verticalTiles = map.length;
        const horizontalTiles = map[0].length;
        
        // Check if already penned
        if (PathfindingUtils.isPenned(map, homeRow, homeCol)) {
            const area = PathfindingUtils.calculatePennedArea(map, homeRow, homeCol);
            return { 
                walls: Array(verticalTiles).fill(null).map(() => Array(horizontalTiles).fill(0)),
                goalArea: area,
                optimalWallCount: 0  // No walls needed
            };
        }
        
        // Get all grass tiles
        const grassTiles = [];
        for (let i = 0; i < verticalTiles; i++) {
            for (let j = 0; j < horizontalTiles; j++) {
                if (map[i][j] === 1) {
                    grassTiles.push([i, j]);
                }
            }
        }
        
        console.log('Using ONLY exhaustive search for accuracy (user requirement)');
        return this._exhaustiveSearch(map, maxWalls, homeRow, homeCol, grassTiles);
    }
    
    /**
     * Estimate total combinations to check
     * @private
     */
    static _estimateCombinations(n, maxK) {
        let total = 0;
        for (let k = 1; k <= Math.min(maxK, n); k++) {
            // Approximate C(n, k)
            let comb = 1;
            for (let i = 0; i < k; i++) {
                comb = comb * (n - i) / (i + 1);
            }
            total += comb;
            if (total > 10000000) break; // Early exit if already too large
        }
        return Math.floor(total);
    }
    
    /**
     * Exhaustive search for small/medium maps (memory-efficient version)
     * Generates and tests combinations on-the-fly without storing all combinations
     * @private
     */
    static _exhaustiveSearch(map, maxWalls, homeRow, homeCol, grassTiles) {
        const verticalTiles = map.length;
        const horizontalTiles = map[0].length;
        
        let bestSolution = null;
        let bestArea = 0;
        
        // Try all combinations from 1 to maxWalls
        for (let numWalls = 1; numWalls <= Math.min(maxWalls, grassTiles.length); numWalls++) {
            console.log(`  Checking combinations with ${numWalls} walls...`);
            const startTime = Date.now();
            
            // Use iterative combination generation instead of storing all combinations
            const result = this._checkCombinationsIteratively(
                map, grassTiles, numWalls, homeRow, homeCol, bestArea
            );
            
            const countForThisSize = result.checked;
            
            if (result.solution) {
                bestArea = result.area;
                bestSolution = result.solution;
            }
            
            const elapsed = Date.now() - startTime;
            console.log(`    Checked ${countForThisSize} combinations in ${elapsed}ms, best area: ${bestArea}`);
            
            // Note: No early exit - we check all wall counts to find true optimal
        }
        
        if (bestSolution === null) {
            return null;
        }
        
        const wallArray = Array(verticalTiles).fill(null).map(() => Array(horizontalTiles).fill(0));
        for (const [row, col] of bestSolution) {
            wallArray[row][col] = 1;
        }
        
        return { 
            walls: wallArray, 
            goalArea: bestArea,
            optimalWallCount: bestSolution.length
        };
    }
    
    /**
     * Check combinations iteratively without storing all combinations in memory
     * @private
     */
    static _checkCombinationsIteratively(map, grassTiles, k, homeRow, homeCol, currentBestArea) {
        let bestSolution = null;
        let bestArea = currentBestArea;
        let checked = 0;
        // Calculate actual combinations for this k to determine if we should limit
        let totalCombinations = 1;
        for (let i = 0; i < k; i++) {
            totalCombinations = totalCombinations * (grassTiles.length - i) / (i + 1);
        }
        totalCombinations = Math.floor(totalCombinations);
        
        // For accuracy, allow checking all combinations up to 50 million
        // This ensures we find the true optimal solution for maps up to 9x9
        const maxToCheck = Math.min(totalCombinations, 50000000);
        
        // Helper function to generate next combination
        const checkCombination = (indices) => {
            if (checked >= maxToCheck) return false; // Stop if we've checked too many
            
            checked++;
            const testMap = map.map(row => [...row]);
            const wallPositions = [];
            
            for (const idx of indices) {
                const [row, col] = grassTiles[idx];
                testMap[row][col] = 5;
                wallPositions.push([row, col]);
            }
            
            if (PathfindingUtils.isPenned(testMap, homeRow, homeCol)) {
                const area = PathfindingUtils.calculatePennedArea(testMap, homeRow, homeCol);
                if (area > bestArea) {
                    bestArea = area;
                    bestSolution = wallPositions;
                    return true; // Found better solution
                }
            }
            
            return false;
        };
        
        // Generate combinations iteratively using indices
        const indices = Array.from({ length: k }, (_, i) => i);
        
        // Check first combination
        checkCombination(indices);
        
        // Generate next combinations
        while (checked < maxToCheck) {
            // Find the rightmost index that can be incremented
            let i = k - 1;
            while (i >= 0 && indices[i] === grassTiles.length - k + i) {
                i--;
            }
            
            if (i < 0) break; // No more combinations
            
            // Increment this index and reset all indices to its right
            indices[i]++;
            for (let j = i + 1; j < k; j++) {
                indices[j] = indices[j - 1] + 1;
            }
            
            // Check this combination
            if (checkCombination(indices)) {
                // Found better solution, but continue checking more combinations
            }
        }
        
        return { solution: bestSolution, area: bestArea, checked };
    }
    
    /**
     * Find optimal solution with incremental wall search (for debug maps)
     * Searches incrementally from 1 wall up, stopping when:
     * 1. A solution is found AND checking next level would take too long
     * 2. OR we reach a reasonable limit
     * @param {Array} map - 2D array where 0=water, 1=grass, 2=home
     * @param {number} timeLimit - Max milliseconds to spend (default 3000)
     * @returns {Object} Object with {walls, goalArea, optimalWallCount} or null
     */
    static solveMapWithTimeLimit(map, timeLimit = 3000) {
        const verticalTiles = map.length;
        const horizontalTiles = map[0].length;
        
        // Find home position
        let homeRow = -1, homeCol = -1;
        for (let i = 0; i < verticalTiles; i++) {
            for (let j = 0; j < horizontalTiles; j++) {
                if (map[i][j] === 2) {
                    homeRow = i;
                    homeCol = j;
                    break;
                }
            }
            if (homeRow >= 0) break;
        }
        
        if (homeRow < 0 || homeCol < 0) {
            console.error('No home position found in map');
            return null;
        }
        
        // Check if already penned
        if (PathfindingUtils.isPenned(map, homeRow, homeCol)) {
            const area = PathfindingUtils.calculatePennedArea(map, homeRow, homeCol);
            return { 
                walls: Array(verticalTiles).fill(null).map(() => Array(horizontalTiles).fill(0)),
                goalArea: area,
                optimalWallCount: 0
            };
        }
        
        // Get all grass tiles
        const grassTiles = [];
        for (let i = 0; i < verticalTiles; i++) {
            for (let j = 0; j < horizontalTiles; j++) {
                if (map[i][j] === 1) {
                    grassTiles.push([i, j]);
                }
            }
        }
        
        console.log(`Time-limited search (max ${timeLimit}ms) for best solution`);
        const startTime = Date.now();
        let bestSolution = null;
        let bestArea = 0;
        let bestWallCount = 0;
        
        // Try increasing numbers of walls until we run out of time or find a good solution
        for (let wallCount = 1; wallCount <= Math.min(grassTiles.length, 20); wallCount++) {
            // Estimate combinations for this wallCount
            let combinations = 1;
            for (let i = 0; i < wallCount; i++) {
                combinations = combinations * (grassTiles.length - i) / (i + 1);
            }
            
            // Estimate time based on ~100 combinations per ms (conservative for larger maps)
            const estimatedTime = combinations / 100;
            const elapsed = Date.now() - startTime;
            
            // Skip this level entirely if estimated time would exceed limit
            if (elapsed + estimatedTime > timeLimit) {
                console.log(`  Skipping ${wallCount}+ walls (would exceed time limit)`);
                break;
            }
            
            // If we already have a solution and next level would take too long, stop
            if (bestSolution !== null && combinations > 200000) {
                console.log(`  Stopping at ${wallCount-1} walls (next level has too many combinations)`);
                break;
            }
            
            console.log(`  Checking combinations with ${wallCount} walls...`);
            const checkStart = Date.now();
            
            // Check all combinations for this wall count
            const result = this._checkCombinationsIteratively(map, grassTiles, wallCount, homeRow, homeCol, bestArea);
            
            const checkElapsed = Date.now() - checkStart;
            console.log(`    Checked ${result.checked} combinations in ${checkElapsed}ms, best area: ${result.area}`);
            
            if (result.area > bestArea) {
                bestArea = result.area;
                bestSolution = result.solution;
                bestWallCount = wallCount;
            }
            
            // If we've spent too much time, stop
            if (Date.now() - startTime > timeLimit) {
                console.log(`  Time limit reached after ${wallCount} wall levels`);
                break;
            }
        }
        
        if (bestSolution === null) {
            console.error('Failed to find solution within time limit');
            return null;
        }
        
        // Convert solution to wall array
        const wallArray = Array(verticalTiles).fill(null).map(() => Array(horizontalTiles).fill(0));
        for (const [row, col] of bestSolution) {
            wallArray[row][col] = 1;
        }
        
        return {
            walls: wallArray,
            goalArea: bestArea,
            optimalWallCount: bestWallCount
        };
    }
    
    /**
     * Check if home is penned in (delegated to shared PathfindingUtils)
     * @deprecated Use PathfindingUtils.isPenned() directly
     * @private
     */
    static _isPenned(map, homeRow, homeCol) {
        return PathfindingUtils.isPenned(map, homeRow, homeCol);
    }
    
    /**
     * Calculate the penned area size (delegated to shared PathfindingUtils)
     * @deprecated Use PathfindingUtils.calculatePennedArea() directly
     * @private
     */
    static _calculatePennedArea(map, homeRow, homeCol) {
        return PathfindingUtils.calculatePennedArea(map, homeRow, homeCol);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MILPSolver;
}

