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
        
        // Check if already penned
        if (this._isPenned(map, homeRow, homeCol)) {
            const area = this._calculatePennedArea(map, homeRow, homeCol);
            return { 
                walls: Array(verticalTiles).fill(null).map(() => Array(horizontalTiles).fill(0)),
                goalArea: area
            };
        }
        
        let bestSolution = null;
        let bestArea = Infinity;
        
        // Strategy 1: Try to create tight enclosures around home
        // Start with immediate neighbors of home, then expand outward
        const enclosures = this._generateEnclosureCandidates(map, homeRow, homeCol, maxWalls);
        
        for (const enclosure of enclosures) {
            const testMap = map.map(row => [...row]);
            const walls = [];
            
            // Place walls for this enclosure
            for (const [row, col] of enclosure) {
                if (testMap[row][col] === 1) {
                    testMap[row][col] = 5;
                    walls.push([row, col]);
                }
            }
            
            // Check if this pens the home
            if (this._isPenned(testMap, homeRow, homeCol)) {
                const area = this._calculatePennedArea(testMap, homeRow, homeCol);
                if (area < bestArea && walls.length <= maxWalls) {
                    bestArea = area;
                    bestSolution = walls;
                }
            }
        }
        
        // Strategy 2: Use BFS to find shortest paths to edge, then block them
        // Try blocking combinations of these critical paths
        if (bestArea > 5) { // Only if we haven't found a very small solution
            const criticalCells = this._findCriticalPathCells(map, homeRow, homeCol);
            const pathSolution = this._findBestPathBlocking(map, criticalCells, maxWalls, homeRow, homeCol);
            
            if (pathSolution && pathSolution.area < bestArea) {
                bestArea = pathSolution.area;
                bestSolution = pathSolution.walls;
            }
        }
        
        if (bestSolution === null) {
            return null;
        }
        
        // Convert wall list to 2D array
        const wallArray = Array(verticalTiles).fill(null).map(() => Array(horizontalTiles).fill(0));
        for (const [row, col] of bestSolution) {
            wallArray[row][col] = 1;
        }
        
        return { walls: wallArray, goalArea: bestArea };
    }
    
    /**
     * Generate candidate enclosures around the home
     * Start with tight enclosures and expand outward
     * @private
     */
    static _generateEnclosureCandidates(map, homeRow, homeCol, maxWalls) {
        const candidates = [];
        const verticalTiles = map.length;
        const horizontalTiles = map[0].length;
        
        // Generate enclosures at different distances from home
        for (let distance = 1; distance <= Math.min(5, maxWalls); distance++) {
            // Get all cells at this Manhattan distance
            const ring = [];
            for (let dr = -distance; dr <= distance; dr++) {
                for (let dc = -distance; dc <= distance; dc++) {
                    if (Math.abs(dr) + Math.abs(dc) !== distance) continue;
                    
                    const row = homeRow + dr;
                    const col = homeCol + dc;
                    
                    if (row < 0 || row >= verticalTiles || col < 0 || col >= horizontalTiles) {
                        continue;
                    }
                    
                    ring.push([row, col]);
                }
            }
            
            // Try full ring
            candidates.push([...ring]);
            
            // Also try partial rings (useful when some positions have water)
            if (ring.length <= maxWalls) {
                // Try removing each cell from the ring
                for (let i = 0; i < ring.length; i++) {
                    const partial = ring.filter((_, idx) => idx !== i);
                    candidates.push(partial);
                }
            }
        }
        
        // Sort candidates by size (smallest first)
        candidates.sort((a, b) => a.length - b.length);
        
        return candidates;
    }
    
    /**
     * Find critical cells that are on shortest paths to edges
     * @private
     */
    static _findCriticalPathCells(map, homeRow, homeCol) {
        const verticalTiles = map.length;
        const horizontalTiles = map[0].length;
        
        // BFS to find all cells reachable from home
        const distances = new Map();
        const queue = [[homeRow, homeCol, 0]];
        distances.set(`${homeRow},${homeCol}`, 0);
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        while (queue.length > 0) {
            const [row, col, dist] = queue.shift();
            
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                const key = `${newRow},${newCol}`;
                
                if (newRow < 0 || newRow >= verticalTiles || newCol < 0 || newCol >= horizontalTiles) {
                    continue;
                }
                
                if (distances.has(key)) {
                    continue;
                }
                
                const tileType = map[newRow][newCol];
                if (tileType === 0 || tileType === 5) {
                    continue;
                }
                
                distances.set(key, dist + 1);
                queue.push([newRow, newCol, dist + 1]);
            }
        }
        
        // Find cells that are on paths to edges
        const criticalCells = [];
        for (const [key, dist] of distances.entries()) {
            const [row, col] = key.split(',').map(Number);
            
            // Check if this cell is near an edge
            if (row === 0 || row === verticalTiles - 1 || col === 0 || col === horizontalTiles - 1) {
                // Backtrack to find cells on path
                this._backtrackPath(map, distances, row, col, criticalCells);
            }
        }
        
        // Count frequency of each cell on critical paths
        const cellCounts = new Map();
        for (const [row, col] of criticalCells) {
            const key = `${row},${col}`;
            cellCounts.set(key, (cellCounts.get(key) || 0) + 1);
        }
        
        // Return cells sorted by frequency (most critical first)
        return Array.from(cellCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([key, count]) => {
                const [row, col] = key.split(',').map(Number);
                return [row, col, count];
            });
    }
    
    /**
     * Backtrack from an edge cell to home to find path cells
     * @private
     */
    static _backtrackPath(map, distances, startRow, startCol, result) {
        const queue = [[startRow, startCol]];
        const visited = new Set([`${startRow},${startCol}`]);
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        while (queue.length > 0) {
            const [row, col] = queue.shift();
            const key = `${row},${col}`;
            const currentDist = distances.get(key);
            
            result.push([row, col]);
            
            if (currentDist === 0) {
                break; // Reached home
            }
            
            // Look for neighbors with distance one less
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                const newKey = `${newRow},${newCol}`;
                
                if (visited.has(newKey)) continue;
                
                const newDist = distances.get(newKey);
                if (newDist === currentDist - 1) {
                    visited.add(newKey);
                    queue.push([newRow, newCol]);
                }
            }
        }
    }
    
    /**
     * Find best solution by blocking critical path cells
     * @private
     */
    static _findBestPathBlocking(map, criticalCells, maxWalls, homeRow, homeCol) {
        let bestSolution = null;
        let bestArea = Infinity;
        
        // Try different combinations of blocking critical cells
        const attempts = Math.min(100, Math.pow(2, Math.min(criticalCells.length, 7)));
        
        for (let attempt = 0; attempt < attempts; attempt++) {
            const testMap = map.map(row => [...row]);
            const walls = [];
            
            // Select cells to wall based on criticality
            const candidates = [...criticalCells];
            
            for (let i = 0; i < maxWalls && candidates.length > 0; i++) {
                // Pick from top candidates with some randomness
                const idx = Math.floor(Math.random() * Math.min(5, candidates.length));
                const [row, col] = candidates[idx];
                candidates.splice(idx, 1);
                
                if (testMap[row][col] === 1) {
                    testMap[row][col] = 5;
                    walls.push([row, col]);
                    
                    if (this._isPenned(testMap, homeRow, homeCol)) {
                        const area = this._calculatePennedArea(testMap, homeRow, homeCol);
                        if (area < bestArea) {
                            bestArea = area;
                            bestSolution = [...walls];
                        }
                        break;
                    }
                }
            }
        }
        
        return bestSolution ? { walls: bestSolution, area: bestArea } : null;
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

