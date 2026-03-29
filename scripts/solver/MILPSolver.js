/**
 * MILP Solver for Pen the Pet - Node.js Generation Pipeline Only
 *
 * Uses the JavaScript MILP solver (glpk.js) for provably optimal wall placement.
 * This file is used ONLY by the generation scripts (scripts/generate-*.js),
 * never loaded in the browser.
 *
 * The solver formulates the problem as a Mixed Integer Linear Program:
 * - Binary variables for wall placement and pen membership
 * - Network flow ensures the pen is connected to home
 * - Vertex-cut constraints ensure the pen boundary is walls/water
 * - Boundary tiles excluded (pet would escape)
 */

const PathfindingUtils = require('../../js/game/PathfindingUtils.js');
const { NUMERIC_TO_TILE, NUMERIC_ID_TO_SCORE } = require('../../js/tiles/tileData.js');

// Make NUMERIC_ID_TO_SCORE available globally for PathfindingUtils.calculatePennedScore
if (typeof global !== 'undefined' && typeof global.NUMERIC_ID_TO_SCORE === 'undefined') {
    global.NUMERIC_ID_TO_SCORE = NUMERIC_ID_TO_SCORE;
}

class MILPSolver {
    /**
     * Solve the map to find optimal wall placement using the Python MILP solver.
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
            const score = PathfindingUtils.calculatePennedScore(map, homeRow, homeCol);
            return {
                walls: Array(verticalTiles).fill(null).map(() => Array(horizontalTiles).fill(0)),
                goalArea: score,
                optimalWallCount: 0
            };
        }

        return this._solveJS(map, maxWalls);
    }

    /**
     * Solve using the JavaScript MILP solver (glpk.js).
     * @private
     */
    static _solveJS(numericMap, maxWalls) {
        const { solveMap } = require('./solve.js');

        // Convert numeric map to string format expected by the solver
        const stringMap = numericMap.map(row => row.map(tile => {
            return NUMERIC_TO_TILE[tile] || 'grass';
        }));

        let result;
        try {
            result = solveMap(stringMap, maxWalls);
        } catch (err) {
            console.error('MILP solver failed:', err.message);
            return null;
        }

        if (!result.feasible) {
            console.log('MILP solver: no feasible solution found');
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
}

module.exports = MILPSolver;
