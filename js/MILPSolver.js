/**
 * MILP Solver for Pen the Pet
 *
 * Finds optimal wall placement to maximize the enclosed area around the pet's
 * home tile. Uses a Python MILP solver (PuLP + CBC) for provably optimal results
 * when running in Node.js (level generation pipeline). Falls back to a simpler
 * JavaScript search for browser use (level editor).
 *
 * The Python solver formulates the problem as a Mixed Integer Linear Program:
 * - Binary variables for wall placement and pen membership
 * - Network flow ensures the pen is connected to home
 * - Vertex-cut constraints ensure the pen boundary is walls/water
 * - Boundary tiles excluded (pet would escape)
 *
 * Usage:
 *   In Node.js (generation scripts): calls scripts/solver/solve.py via subprocess
 *   In browser (level editor): uses JS-based BFS search as approximation
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
     * Solve the map to find optimal wall placement.
     * In Node.js: calls the Python MILP solver for provably optimal results.
     * In browser: uses a JS-based search (approximate).
     *
     * @param {Array} map - 2D array where 0=water, 1=grass, 2=home (numeric format)
     * @param {number} maxWalls - Maximum number of walls available
     * @returns {Object} Object with {walls, goalArea, optimalWallCount} or null
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

        // Check if already penned (no walls needed)
        if (PathfindingUtils.isPenned(map, homeRow, homeCol)) {
            const area = PathfindingUtils.calculatePennedArea(map, homeRow, homeCol);
            return {
                walls: Array(verticalTiles).fill(null).map(() => Array(horizontalTiles).fill(0)),
                goalArea: area,
                optimalWallCount: 0
            };
        }

        // In Node.js, use the Python MILP solver for optimal results
        if (typeof require !== 'undefined') {
            return this._solvePython(map, maxWalls);
        }

        // In browser, fall back to JS search
        return this._solveJS(map, maxWalls, homeRow, homeCol);
    }

    /**
     * Solve using the Python MILP solver (Node.js only).
     * Calls scripts/solver/solve.py via child_process.
     * @private
     */
    static _solvePython(numericMap, maxWalls) {
        const { execFileSync } = require('child_process');
        const path = require('path');

        // Convert numeric map to string format for the Python solver
        const stringMap = numericMap.map(row => row.map(tile => {
            if (tile === 0) return 'water';
            if (tile === 1) return 'grass';
            if (tile === 2) return 'home';
            if (tile === 5) return 'wall';
            return 'grass';
        }));

        const input = JSON.stringify({ map: stringMap, maxWalls: maxWalls });
        const solverPath = path.resolve(__dirname, '..', 'scripts', 'solver', 'solve.py');

        let output;
        try {
            output = execFileSync('python3', [solverPath], {
                input: input,
                encoding: 'utf-8',
                timeout: 150000, // 150s - slightly above Python's 120s solver timeout
                maxBuffer: 10 * 1024 * 1024
            });
        } catch (err) {
            console.error('Python solver failed:', err.message);
            return null;
        }

        let result;
        try {
            result = JSON.parse(output.trim());
        } catch (err) { // eslint-disable-line no-unused-vars
            console.error('Failed to parse Python solver output:', output);
            return null;
        }

        if (!result.feasible) {
            console.log('Python solver: no feasible solution found');
            return null;
        }

        // Convert solution to walls 2D array format
        const verticalTiles = numericMap.length;
        const horizontalTiles = numericMap[0].length;
        const wallArray = Array(verticalTiles).fill(null).map(() => Array(horizontalTiles).fill(0));
        for (const [row, col] of result.optimalSolution) {
            wallArray[row][col] = 1;
        }

        return {
            walls: wallArray,
            goalArea: result.goalArea,
            optimalWallCount: result.optimalWallCount
        };
    }

    /**
     * JavaScript-based solver for browser use (level editor).
     * Uses BFS-based search - may not find optimal solution for large maps.
     * @private
     */
    static _solveJS(map, maxWalls, homeRow, homeCol) {
        const verticalTiles = map.length;
        const horizontalTiles = map[0].length;

        // Get all grass tiles
        const grassTiles = [];
        for (let i = 0; i < verticalTiles; i++) {
            for (let j = 0; j < horizontalTiles; j++) {
                if (map[i][j] === 1) {
                    grassTiles.push([i, j]);
                }
            }
        }

        let bestSolution = null;
        let bestArea = 0;

        // Try combinations from 1 to maxWalls (limited for browser performance)
        for (let numWalls = 1; numWalls <= Math.min(maxWalls, grassTiles.length); numWalls++) {
            const result = this._checkCombinationsIteratively(
                map, grassTiles, numWalls, homeRow, homeCol, bestArea
            );

            if (result.solution) {
                bestArea = result.area;
                bestSolution = result.solution;
            }
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
     * Check combinations iteratively without storing all combinations in memory.
     * Used by the JS-based solver for browser use.
     * @private
     */
    static _checkCombinationsIteratively(map, grassTiles, k, homeRow, homeCol, currentBestArea) {
        let bestSolution = null;
        let bestArea = currentBestArea;
        let checked = 0;

        let totalCombinations = 1;
        for (let i = 0; i < k; i++) {
            totalCombinations = totalCombinations * (grassTiles.length - i) / (i + 1);
        }
        totalCombinations = Math.floor(totalCombinations);

        // Limit to 5 million combinations for browser performance
        const maxToCheck = Math.min(totalCombinations, 5000000);

        const checkCombination = (indices) => {
            if (checked >= maxToCheck) return false;

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
                    return true;
                }
            }

            return false;
        };

        const indices = Array.from({ length: k }, (_, i) => i);
        checkCombination(indices);

        while (checked < maxToCheck) {
            let i = k - 1;
            while (i >= 0 && indices[i] === grassTiles.length - k + i) {
                i--;
            }

            if (i < 0) break;

            indices[i]++;
            for (let j = i + 1; j < k; j++) {
                indices[j] = indices[j - 1] + 1;
            }

            checkCombination(indices);
        }

        return { solution: bestSolution, area: bestArea, checked };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MILPSolver;
}

