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

class PathfindingUtils {
    /**
     * Check if home is penned in (cannot reach any edge).
     * Uses BFS to explore all reachable tiles from home.
     * If any edge tile is reached, the pet can escape.
     * 
     * @param {Array} map - 2D array where 0=water, 1=grass, 2=home, 5=wall
     * @param {number} homeRow - Row index of home tile
     * @param {number} homeCol - Column index of home tile
     * @returns {boolean} True if penned (cannot reach edge), false otherwise
     */
    static isPenned(map, homeRow, homeCol) {
        const verticalTiles = map.length;
        const horizontalTiles = map[0].length;
        
        const visited = new Set([`${homeRow},${homeCol}`]);
        const queue = [[homeRow, homeCol]];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        while (queue.length > 0) {
            const [row, col] = queue.shift();
            
            // Check if reached edge
            if (row === 0 || row === verticalTiles - 1 || col === 0 || col === horizontalTiles - 1) {
                return false; // Can escape
            }
            
            // Explore neighbors
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                const key = `${newRow},${newCol}`;
                
                if (newRow < 0 || newRow >= verticalTiles || newCol < 0 || newCol >= horizontalTiles) {
                    continue;
                }
                
                if (visited.has(key)) {
                    continue;
                }
                
                const tileType = map[newRow][newCol];
                if (tileType === 0 || tileType === 5) { // water or wall
                    continue;
                }
                
                visited.add(key);
                queue.push([newRow, newCol]);
            }
        }
        
        return true; // Penned
    }
    
    /**
     * Calculate the penned area size (number of tiles reachable from home).
     * Uses BFS to count all tiles reachable from home without crossing water or walls.
     * 
     * @param {Array} map - 2D array where 0=water, 1=grass, 2=home, 5=wall
     * @param {number} homeRow - Row index of home tile
     * @param {number} homeCol - Column index of home tile
     * @returns {number} Number of tiles in the penned area (including home)
     */
    static calculatePennedArea(map, homeRow, homeCol) {
        const verticalTiles = map.length;
        const horizontalTiles = map[0].length;
        
        const visited = new Set([`${homeRow},${homeCol}`]);
        const queue = [[homeRow, homeCol]];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        while (queue.length > 0) {
            const [row, col] = queue.shift();
            
            // Explore neighbors
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                const key = `${newRow},${newCol}`;
                
                if (newRow < 0 || newRow >= verticalTiles || newCol < 0 || newCol >= horizontalTiles) {
                    continue;
                }
                
                if (visited.has(key)) {
                    continue;
                }
                
                const tileType = map[newRow][newCol];
                if (tileType === 0 || tileType === 5) { // water or wall
                    continue;
                }
                
                visited.add(key);
                queue.push([newRow, newCol]);
            }
        }
        
        return visited.size;
    }

    /**
     * Calculate the penned score (weighted sum of tiles reachable from home).
     * Uses score values from TILE_DATA (via NUMERIC_ID_TO_SCORE lookup).
     * Uses BFS to find all tiles reachable from home without crossing blocking tiles.
     * 
     * @param {Array} map - 2D array of numeric tile IDs (see tileData.js numericId)
     * @param {number} homeRow - Row index of home tile
     * @param {number} homeCol - Column index of home tile
     * @param {Object} scoreMap - Optional map of numericId→score (default: NUMERIC_ID_TO_SCORE from tileData)
     * @returns {number} Weighted score of the penned area
     */
    static calculatePennedScore(map, homeRow, homeCol, scoreMap) {
        // Use provided score map or fall back to the global NUMERIC_ID_TO_SCORE
        const scores = scoreMap || (typeof NUMERIC_ID_TO_SCORE !== 'undefined' ? NUMERIC_ID_TO_SCORE : {0:0, 1:1, 2:1, 3:3, 5:0});
        const verticalTiles = map.length;
        const horizontalTiles = map[0].length;
        
        const visited = new Set([`${homeRow},${homeCol}`]);
        const queue = [[homeRow, homeCol]];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        let score = scores[map[homeRow][homeCol]] !== undefined ? scores[map[homeRow][homeCol]] : 1;
        
        while (queue.length > 0) {
            const [row, col] = queue.shift();
            
            // Explore neighbors
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                const key = `${newRow},${newCol}`;
                
                if (newRow < 0 || newRow >= verticalTiles || newCol < 0 || newCol >= horizontalTiles) {
                    continue;
                }
                
                if (visited.has(key)) {
                    continue;
                }
                
                const tileType = map[newRow][newCol];
                if (tileType === 0 || tileType === 5) { // water or wall
                    continue;
                }
                
                visited.add(key);
                queue.push([newRow, newCol]);
                score += scores[tileType] !== undefined ? scores[tileType] : 1;
            }
        }
        
        return score;
    }

    /**
     * Used by MapGenerator and MapValidator to verify map connectivity.
     * Water tiles block movement; grass and home tiles are passable.
     * 
     * @param {Array} map - 2D array of tile type strings ('grass', 'water', 'home')
     * @returns {boolean} True if home can reach an edge, false otherwise
     */
    static hasPathToEdge(map) {
        const size = map.length;

        // Find home position
        let homeRow = -1, homeCol = -1;
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < map[i].length; j++) {
                if (map[i][j] === 'home') {
                    homeRow = i;
                    homeCol = j;
                    break;
                }
            }
            if (homeRow >= 0) break;
        }

        if (homeRow < 0) {
            return false; // No home found
        }

        // If home is already on the edge, it can escape
        if (homeRow === 0 || homeRow === size - 1 || homeCol === 0 || homeCol === map[0].length - 1) {
            return true;
        }

        const visited = new Set([`${homeRow},${homeCol}`]);
        const queue = [[homeRow, homeCol]];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        while (queue.length > 0) {
            const [row, col] = queue.shift();

            // Check if reached edge
            if (row === 0 || row === size - 1 || col === 0 || col === map[0].length - 1) {
                return true;
            }

            // Explore neighbors
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                const coordKey = `${newRow},${newCol}`;

                if (newRow < 0 || newRow >= size || newCol < 0 || newCol >= map[0].length) {
                    continue;
                }

                if (visited.has(coordKey)) {
                    continue;
                }

                if (map[newRow][newCol] === 'water') {
                    continue;
                }

                visited.add(coordKey);
                queue.push([newRow, newCol]);
            }
        }

        return false;
    }
}

// Export for use in Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PathfindingUtils;
}
