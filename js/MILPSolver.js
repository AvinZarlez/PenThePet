/**
 * MILP Solver for Pen the Pet
 * 
 * Based on the Python solver using scipy.optimize.milp
 * This implements a solver to find the optimal wall placement 
 * that maximizes the penned area.
 * 
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
        let combinationsChecked = 0;
        
        // Try all combinations from 1 to maxWalls
        for (let numWalls = 1; numWalls <= Math.min(maxWalls, grassTiles.length); numWalls++) {
            console.log(`  Checking combinations with ${numWalls} walls...`);
            const startTime = Date.now();
            let countForThisSize = 0;
            
            // Use iterative combination generation instead of storing all combinations
            const result = this._checkCombinationsIteratively(
                map, grassTiles, numWalls, homeRow, homeCol, bestArea
            );
            
            combinationsChecked += result.checked;
            countForThisSize = result.checked;
            
            if (result.solution) {
                bestArea = result.area;
                bestSolution = result.solution;
            }
            
            const elapsed = Date.now() - startTime;
            console.log(`    Checked ${countForThisSize} combinations in ${elapsed}ms, best area: ${bestArea}`);
            
            // Early exit if we've found a solution and checked reasonable amount
            if (bestSolution && numWalls >= Math.min(maxWalls, 8)) {
                console.log(`  Early exit: found solution with ${numWalls} walls`);
                break;
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
     * Check combinations iteratively without storing all combinations in memory
     * @private
     */
    static _checkCombinationsIteratively(map, grassTiles, k, homeRow, homeCol, currentBestArea) {
        let bestSolution = null;
        let bestArea = currentBestArea;
        let checked = 0;
        const maxToCheck = 100000; // Safety limit per wall count
        
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
     * Heuristic search for larger maps
     * @private
     */
    static _heuristicSearch(map, maxWalls, homeRow, homeCol) {
        const verticalTiles = map.length;
        const horizontalTiles = map[0].length;
        
        let bestSolution = null;
        let bestArea = 0;
        
        // Get all grass tiles with metrics
        const grassTiles = [];
        for (let i = 0; i < verticalTiles; i++) {
            for (let j = 0; j < horizontalTiles; j++) {
                if (map[i][j] === 1) {
                    const distToEdge = Math.min(
                        i, verticalTiles - 1 - i,
                        j, horizontalTiles - 1 - j
                    );
                    const distFromHome = Math.abs(i - homeRow) + Math.abs(j - homeCol);
                    grassTiles.push({ row: i, col: j, distToEdge, distFromHome });
                }
            }
        }
        
        // Try multiple strategies
        const attempts = 500;
        
        for (let attempt = 0; attempt < attempts; attempt++) {
            const testMap = map.map(row => [...row]);
            const walls = [];
            
            // Create candidate list with different sorting strategies
            let candidates = [...grassTiles];
            
            if (attempt % 4 === 0) {
                // Strategy 1: Prioritize edges
                candidates.sort((a, b) => a.distToEdge - b.distToEdge);
            } else if (attempt % 4 === 1) {
                // Strategy 2: Prioritize distance from home
                candidates.sort((a, b) => b.distFromHome - a.distFromHome);
            } else if (attempt % 4 === 2) {
                // Strategy 3: Balanced
                candidates.sort((a, b) => (a.distToEdge - a.distFromHome / 2) - (b.distToEdge - b.distFromHome / 2));
            } else {
                // Strategy 4: Random with bias
                for (let i = 0; i < candidates.length; i++) {
                    const range = Math.min(10, candidates.length - i);
                    const j = i + Math.floor(Math.random() * range);
                    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
                }
            }
            
            // Place walls
            for (const candidate of candidates) {
                if (walls.length >= maxWalls) break;
                
                const { row, col } = candidate;
                if (testMap[row][col] !== 1) continue;
                
                testMap[row][col] = 5;
                walls.push([row, col]);
                
                if (PathfindingUtils.isPenned(testMap, homeRow, homeCol)) {
                    const area = PathfindingUtils.calculatePennedArea(testMap, homeRow, homeCol);
                    if (area > bestArea) {
                        bestArea = area;
                        bestSolution = [...walls];
                    }
                    break;
                }
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
            optimalWallCount: bestSolution.length  // Record how many walls were actually used
        };
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
        let bestArea = 0; // Start with 0 to find MAXIMUM (returns null if no solution pens the pet)
        
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
                    
                    if (PathfindingUtils.isPenned(testMap, homeRow, homeCol)) {
                        const area = PathfindingUtils.calculatePennedArea(testMap, homeRow, homeCol);
                        if (area > bestArea) { // MAXIMIZE area!
                            bestArea = area;
                            bestSolution = [...walls];
                        }
                        break;
                    }
                }
            }
        }
        
        return bestSolution ? { 
            walls: bestSolution, 
            area: bestArea,
            optimalWallCount: bestSolution.length  // Record how many walls were actually used
        } : null;
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

