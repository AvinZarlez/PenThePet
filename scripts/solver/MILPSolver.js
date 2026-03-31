/**
 * MILP Solver for Pen the Pet - Node.js Generation Pipeline Only
 *
 * Calls the Python MILP solver (PuLP + CBC) for provably optimal wall placement.
 * This file is used ONLY by the generation scripts (scripts/generate-*.js),
 * never loaded in the browser.
 *
 * The Python solver formulates the problem as a Mixed Integer Linear Program:
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
    static _lastError = null;

    static getLastError() {
        return this._lastError;
    }

    /**
     * Solve the map to find optimal wall placement using the Python MILP solver.
     *
     * @param {Array} map - 2D array where 0=water, 1=grass, 2=home (numeric format)
     * @param {number} maxWalls - Maximum number of walls available
     * @returns {Object} Object with {walls, goalArea, optimalWallCount} or null
     */
    static solveMap(map, maxWalls) {
        this._lastError = null;
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
            this._lastError = 'No home position found in map';
            console.error(this._lastError);
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

        return this._solvePython(map, maxWalls);
    }

    /**
     * Solve using the Python MILP solver.
     * Calls scripts/solver/solve.py via child_process.
     * @private
     */
    static _solvePython(numericMap, maxWalls) {
        const { execFileSync } = require('child_process');
        const path = require('path');

        // Convert numeric map to string format for the Python solver
        const stringMap = numericMap.map(row => row.map(tile => {
            return NUMERIC_TO_TILE[tile] || 'grass';
        }));

        const input = JSON.stringify({ map: stringMap, maxWalls: maxWalls });
        const solverPath = path.resolve(__dirname, 'solve.py');

        let output;
        try {
            output = execFileSync('python3', [solverPath], {
                input: input,
                encoding: 'utf-8',
                timeout: 150000, // 150s - slightly above Python's 120s solver timeout
                maxBuffer: 10 * 1024 * 1024
            });
        } catch (err) {
            this._lastError = err && err.stderr ? String(err.stderr) : err.message;
            console.error('Python solver failed:', err.message);
            return null;
        }

        let result;
        try {
            result = JSON.parse(output.trim());
        } catch (_err) { // eslint-disable-line no-unused-vars
            this._lastError = 'Failed to parse Python solver output';
            console.error('Failed to parse Python solver output:', output);
            return null;
        }

        if (!result.feasible) {
            this._lastError = 'Solver could not find a feasible solution for this map.';
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
}

module.exports = MILPSolver;
