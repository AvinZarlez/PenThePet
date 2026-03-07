/**
 * Pathfinding Utilities
 * 
 * Shared BFS pathfinding logic used by the game, solver pipeline,
 * map generator, and map validator.
 * 
 * This module is the single source of truth for:
 * - Checking if the pet is penned in (numeric map format)
 * - Calculating penned area size (numeric map format)
 * - Checking if home has a path to an edge (string map format)
 */

// Import blocking-tile sets from tileData if in Node.js environment
if (typeof BLOCKING_NUMERIC_IDS === 'undefined' && typeof require !== 'undefined') {
    const _td = require('./tileData.js');
    if (typeof global.BLOCKING_NUMERIC_IDS === 'undefined') {
        global.BLOCKING_NUMERIC_IDS = _td.BLOCKING_NUMERIC_IDS;
    }
    if (typeof global.BLOCKING_TILES === 'undefined') {
        global.BLOCKING_TILES = _td.BLOCKING_TILES;
    }
    if (typeof global.isBlockingTile === 'undefined') {
        global.isBlockingTile = _td.isBlockingTile;
    }
    if (typeof global.FILLABLE_TILES === 'undefined') {
        global.FILLABLE_TILES = _td.FILLABLE_TILES;
    }
    if (typeof global.isFillableTile === 'undefined') {
        global.isFillableTile = _td.isFillableTile;
    }
    if (typeof global.FILLABLE_NUMERIC_IDS === 'undefined') {
        global.FILLABLE_NUMERIC_IDS = _td.FILLABLE_NUMERIC_IDS;
    }
    if (typeof global.FILLED_SCORE_MAP === 'undefined') {
        global.FILLED_SCORE_MAP = _td.FILLED_SCORE_MAP;
    }
}

class PathfindingUtils {

    // -------------------------------------------------------------------------
    // Private shared helpers
    // -------------------------------------------------------------------------

    /**
     * Find the home tile position in a string map.
     * @private
     * @param {Array} map - 2D array of tile type strings
     * @returns {[number, number]} [homeRow, homeCol], or [-1, -1] if not found
     */
    static _findHome(map) {
        for (let i = 0; i < map.length; i++) {
            for (let j = 0; j < map[i].length; j++) {
                if (map[i][j] === 'home') return [i, j];
            }
        }
        return [-1, -1];
    }

    /**
     * BFS from a start position, collecting every reachable cell key.
     * Stops at cells where isBlocking returns true.
     *
     * @private
     * @param {Array} map - 2D map array (numeric or string)
     * @param {number} startRow
     * @param {number} startCol
     * @param {Function} isBlocking - (tileValue, row, col) => boolean
     * @returns {Set<string>} Set of "row,col" keys reachable from start (inclusive)
     */
    static _bfsReachable(map, startRow, startCol, isBlocking) {
        const rows = map.length;
        const cols = map[0].length;
        const visited = new Set([`${startRow},${startCol}`]);
        const queue = [[startRow, startCol]];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        while (queue.length > 0) {
            const [row, col] = queue.shift();
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                const key = `${newRow},${newCol}`;
                if (newRow < 0 || newRow >= rows || newCol < 0 || newCol >= cols) continue;
                if (visited.has(key)) continue;
                if (isBlocking(map[newRow][newCol], newRow, newCol)) continue;
                visited.add(key);
                queue.push([newRow, newCol]);
            }
        }

        return visited;
    }

    /**
     * Return true if any key in visited sits on the map edge.
     * @private
     * @param {Set<string>} visited
     * @param {number} rows
     * @param {number} cols
     * @returns {boolean}
     */
    static _reachesEdge(visited, rows, cols) {
        for (const key of visited) {
            const [r, c] = key.split(',').map(Number);
            if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) return true;
        }
        return false;
    }

    // -------------------------------------------------------------------------
    // Public API — numeric map (used by game runtime and solver)
    // -------------------------------------------------------------------------

    /**
     * Compute the shortest path distance (BFS) from home to any edge tile.
     * Used by hole placement validation to compare path lengths.
     *
     * @param {Array} map - 2D array of tile type strings
     * @param {Function} [isBlocking] - Optional custom blocking function (tile, row, col) => boolean.
     *   Defaults to isBlockingTile(tile).
     * @returns {number} Shortest distance in steps from home to an edge, or Infinity if unreachable
     */
    static shortestPathToEdge(map, isBlocking) {
        const [homeRow, homeCol] = PathfindingUtils._findHome(map);
        if (homeRow < 0) return Infinity;

        const rows = map.length, cols = map[0].length;
        if (homeRow === 0 || homeRow === rows - 1 || homeCol === 0 || homeCol === cols - 1) return 0;

        const blockFn = isBlocking || (tile => isBlockingTile(tile));
        const visited = new Set([`${homeRow},${homeCol}`]);
        const queue = [[homeRow, homeCol, 0]];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        while (queue.length > 0) {
            const [row, col, dist] = queue.shift();
            for (const [dr, dc] of directions) {
                const nr = row + dr;
                const nc = col + dc;
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                const key = `${nr},${nc}`;
                if (visited.has(key)) continue;
                if (blockFn(map[nr][nc], nr, nc)) continue;
                if (nr === 0 || nr === rows - 1 || nc === 0 || nc === cols - 1) return dist + 1;
                visited.add(key);
                queue.push([nr, nc, dist + 1]);
            }
        }
        return Infinity;
    }

    /**
     * Check if home is penned in (cannot reach any edge).
     *
     * @param {Array} map - 2D array where 0=water, 1=grass, 2=home, 5=wall
     * @param {number} homeRow - Row index of home tile
     * @param {number} homeCol - Column index of home tile
     * @returns {boolean} True if penned (cannot reach edge), false otherwise
     */
    static isPenned(map, homeRow, homeCol) {
        const visited = PathfindingUtils._bfsReachable(
            map, homeRow, homeCol,
            tile => BLOCKING_NUMERIC_IDS.has(tile)
        );
        return !PathfindingUtils._reachesEdge(visited, map.length, map[0].length);
    }

    /**
     * Calculate the penned area size (number of tiles reachable from home).
     *
     * @param {Array} map - 2D array where 0=water, 1=grass, 2=home, 5=wall
     * @param {number} homeRow - Row index of home tile
     * @param {number} homeCol - Column index of home tile
     * @returns {number} Number of tiles in the penned area (including home)
     */
    static calculatePennedArea(map, homeRow, homeCol) {
        return PathfindingUtils._bfsReachable(
            map, homeRow, homeCol,
            tile => BLOCKING_NUMERIC_IDS.has(tile)
        ).size;
    }

    /**
     * Calculate the penned score (weighted sum of tiles reachable from home).
     * Uses score values from TILE_DATA (via NUMERIC_ID_TO_SCORE lookup).
     *
     * @param {Array} map - 2D array of numeric tile IDs (see tileData.js numericId)
     * @param {number} homeRow - Row index of home tile
     * @param {number} homeCol - Column index of home tile
     * @param {Object} scoreMap - Optional map of numericId to score (default: NUMERIC_ID_TO_SCORE from tileData)
     * @returns {number} Weighted score of the penned area
     */
    static calculatePennedScore(map, homeRow, homeCol, scoreMap) {
        const scores = scoreMap || (typeof NUMERIC_ID_TO_SCORE !== 'undefined' ? NUMERIC_ID_TO_SCORE : {0:0, 1:1, 2:1, 3:3, 5:0});
        const visited = PathfindingUtils._bfsReachable(
            map, homeRow, homeCol,
            tile => BLOCKING_NUMERIC_IDS.has(tile)
        );
        let score = 0;
        for (const key of visited) {
            const [r, c] = key.split(',').map(Number);
            const t = map[r][c];
            score += scores[t] !== undefined ? scores[t] : 1;
        }
        return score;
    }

    // -------------------------------------------------------------------------
    // Public API — string map (used by MapGenerator and MapValidator)
    // -------------------------------------------------------------------------

    /**
     * Check if home can reach a map edge (no walls placed).
     * Used by MapGenerator and MapValidator to verify map connectivity.
     *
     * @param {Array} map - 2D array of tile type strings ('grass', 'water', 'home')
     * @returns {boolean} True if home can reach an edge, false otherwise
     */
    static hasPathToEdge(map) {
        const [homeRow, homeCol] = PathfindingUtils._findHome(map);
        if (homeRow < 0) return false;

        const rows = map.length, cols = map[0].length;
        if (homeRow === 0 || homeRow === rows - 1 || homeCol === 0 || homeCol === cols - 1) return true;

        const visited = PathfindingUtils._bfsReachable(
            map, homeRow, homeCol,
            tile => isBlockingTile(tile)
        );
        return PathfindingUtils._reachesEdge(visited, rows, cols);
    }

    /**
     * Check that every non-blocking tile on the map is reachable from home.
     * Fillable tiles (e.g. holes) are treated as passable during traversal
     * because the player can fill them by placing a wall.
     *
     * @param {Array} map - 2D array of tile type strings ('grass', 'water', 'home', 'star', 'bee', 'hole')
     * @returns {boolean} True if all walkable tiles are reachable from home
     */
    static allWalkableTilesReachable(map) {
        const [homeRow, homeCol] = PathfindingUtils._findHome(map);
        if (homeRow < 0) return false;

        const _isFillable = typeof isFillableTile === 'function' ? isFillableTile : () => false;
        const visited = PathfindingUtils._bfsReachable(
            map, homeRow, homeCol,
            tile => isBlockingTile(tile) && !_isFillable(tile)
        );
        for (let i = 0; i < map.length; i++) {
            for (let j = 0; j < map[i].length; j++) {
                if (!isBlockingTile(map[i][j]) && !visited.has(`${i},${j}`)) return false;
            }
        }
        return true;
    }

    /**
     * Check that every non-edge walkable tile is reachable from home
     * without traversing edge tiles. Holes are treated as passable since
     * filling a hole with a wall counts as accessing that path.
     *
     * This prevents maps where interior tiles are only accessible by
     * walking along the perimeter.
     *
     * @param {Array} map - 2D array of tile type strings
     * @returns {boolean} True if all non-edge walkable tiles are reachable via an interior-only path
     */
    static allNonEdgeTilesReachableViaInterior(map) {
        const [homeRow, homeCol] = PathfindingUtils._findHome(map);
        if (homeRow < 0) return false;

        const rows = map.length;
        const cols = map[0].length;

        const _isFillable = typeof isFillableTile === 'function' ? isFillableTile : () => false;

        // BFS from home, treating edge tiles and non-fillable blocking tiles as barriers.
        // Holes (fillable tiles) are passable since they can be filled by placing a wall.
        const visited = PathfindingUtils._bfsReachable(
            map, homeRow, homeCol,
            (tile, r, c) => {
                if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) return true;
                return isBlockingTile(tile) && !_isFillable(tile);
            }
        );

        // Every non-edge, non-blocking tile must be reachable via an interior path
        for (let r = 1; r < rows - 1; r++) {
            for (let c = 1; c < cols - 1; c++) {
                if (!isBlockingTile(map[r][c]) && !visited.has(`${r},${c}`)) return false;
            }
        }

        return true;
    }

    /**
     * Count tiles reachable from home via BFS using a custom blocking function.
     * Used by hole strength validation to measure the impact of a hole.
     *
     * @param {Array} map - 2D array of tile type strings
     * @param {Function} [isBlockingFn] - Custom blocking function (tile, row, col) => boolean
     * @returns {number} Number of tiles reachable from home
     */
    static reachableAreaCount(map, isBlockingFn) {
        const [homeRow, homeCol] = PathfindingUtils._findHome(map);
        if (homeRow < 0) return 0;

        const blockFn = isBlockingFn || (tile => isBlockingTile(tile));
        const visited = PathfindingUtils._bfsReachable(
            map, homeRow, homeCol,
            blockFn
        );
        return visited.size;
    }

    /**
     * Find all tile positions inside the penned area (reachable from home without
     * crossing blocking tiles or the given wall positions).
     * Called by calculateGoal in MapGenerator to determine the penned area after solving.
     *
     * For fillable tiles (e.g. holes) that have a wall placed on them, the tile
     * becomes passable rather than blocked — the wall "fills" the tile.
     *
     * @param {Array} map - 2D array of tile type strings ('grass', 'water', 'home', etc.)
     * @param {Set<string>} [wallPositions] - Optional set of "row,col" strings for placed walls
     * @returns {Array<Array<number>>} Array of [row, col] positions inside the penned area
     */
    static getPennedTiles(map, wallPositions) {
        const [homeRow, homeCol] = PathfindingUtils._findHome(map);
        if (homeRow < 0) return [];

        const blocked = wallPositions || new Set();
        const _isFillable = typeof isFillableTile === 'function' ? isFillableTile : () => false;
        const visited = PathfindingUtils._bfsReachable(
            map, homeRow, homeCol,
            (tile, r, c) => {
                const key = `${r},${c}`;
                if (blocked.has(key)) {
                    // Wall placed here: fillable tiles become passable, others become walls
                    return !_isFillable(tile);
                }
                return isBlockingTile(tile);
            }
        );
        return [...visited].map(key => key.split(',').map(Number));
    }
}

// Export for use in Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PathfindingUtils;
}
