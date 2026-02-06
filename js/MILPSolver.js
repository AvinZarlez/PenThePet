/**
 * MILP Solver for Pen the Pet
 * 
 * Based on the Python solver using scipy.optimize.milp
 * This implements a solver to find the optimal wall placement 
 * that minimizes the penned area.
 * 
 * Copyright 2026 - Adapted from dynomight's Python implementation
 * Available under AGPL 3.0 license
 */

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
     * Find the best wall placement using a search algorithm
     * @private
     */
    static _findBestWallPlacement(map, maxWalls, homeRow, homeCol) {
        const verticalTiles = map.length;
        const horizontalTiles = map[0].length;
        
        // Start with a greedy approach: find cells that, when walled, block the most paths
        const pathCells = this._findPathCellsToEdges(map, homeRow, homeCol);
        
        if (pathCells.length === 0) {
            // Already penned
            const area = this._calculatePennedArea(map, [], homeRow, homeCol);
            return { 
                walls: Array(verticalTiles).fill(null).map(() => Array(horizontalTiles).fill(0)),
                goalArea: area
            };
        }
        
        // Score each potential wall location by how many paths it blocks
        const cellScores = new Map();
        for (const cell of pathCells) {
            const key = `${cell[0]},${cell[1]}`;
            cellScores.set(key, (cellScores.get(key) || 0) + 1);
        }
        
        // Sort cells by score (highest first)
        const sortedCells = Array.from(cellScores.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([key, score]) => {
                const [row, col] = key.split(',').map(Number);
                return { row, col, score };
            });
        
        // Try placing walls greedily
        let bestWalls = null;
        let bestArea = Infinity;
        
        // Try different combinations starting from the highest scored cells
        const maxAttempts = Math.min(100, Math.pow(2, Math.min(sortedCells.length, 10)));
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const walls = [];
            const testMap = map.map(row => [...row]);
            
            // Use a combination of greedy and random selection
            const cellsToTry = [...sortedCells];
            let wallsPlaced = 0;
            
            while (wallsPlaced < maxWalls && cellsToTry.length > 0) {
                // Pick cell (greedy for first few, then with some randomness)
                let cellIdx;
                if (wallsPlaced < maxWalls / 2) {
                    // Greedy: pick highest scored
                    cellIdx = 0;
                } else {
                    // Semi-random: pick from top few
                    const topN = Math.min(5, cellsToTry.length);
                    cellIdx = Math.floor(Math.random() * topN);
                }
                
                const cell = cellsToTry[cellIdx];
                cellsToTry.splice(cellIdx, 1);
                
                // Place wall if the cell is grass
                if (testMap[cell.row][cell.col] === 1) {
                    testMap[cell.row][cell.col] = 5; // 5 represents wall
                    walls.push([cell.row, cell.col]);
                    wallsPlaced++;
                    
                    // Check if penned
                    if (this._isPenned(testMap, homeRow, homeCol)) {
                        const area = this._calculatePennedArea(testMap, walls, homeRow, homeCol);
                        if (area < bestArea) {
                            bestArea = area;
                            bestWalls = [...walls];
                        }
                        break;
                    }
                }
            }
        }
        
        if (bestWalls === null) {
            return null;
        }
        
        // Convert wall list to 2D array
        const wallArray = Array(verticalTiles).fill(null).map(() => Array(horizontalTiles).fill(0));
        for (const [row, col] of bestWalls) {
            wallArray[row][col] = 1;
        }
        
        return { walls: wallArray, goalArea: bestArea };
    }
    
    /**
     * Find all cells that are part of paths from home to edges
     * @private
     */
    static _findPathCellsToEdges(map, homeRow, homeCol) {
        const verticalTiles = map.length;
        const horizontalTiles = map[0].length;
        const pathCells = [];
        
        // BFS to find all paths to edges
        const queue = [[homeRow, homeCol, []]];
        const visited = new Set([`${homeRow},${homeCol}`]);
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        const maxPaths = 50; // Limit to avoid excessive computation
        let pathsFound = 0;
        
        while (queue.length > 0 && pathsFound < maxPaths) {
            const [row, col, path] = queue.shift();
            
            // Check if reached edge
            if (row === 0 || row === verticalTiles - 1 || col === 0 || col === horizontalTiles - 1) {
                pathCells.push(...path);
                pathCells.push([row, col]);
                pathsFound++;
                continue;
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
                queue.push([newRow, newCol, [...path, [newRow, newCol]]]);
            }
        }
        
        return pathCells;
    }
    
    /**
     * Check if home is penned in
     * @private
     */
    static _isPenned(map, homeRow, homeCol) {
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
     * Calculate the penned area size
     * @private
     */
    static _calculatePennedArea(map, walls, homeRow, homeCol) {
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MILPSolver;
}

