/**
 * Brute Force Solver for Pen the Pet
 * 
 * This solver exhaustively searches all possible wall placements
 * to find the true optimal solution (maximum penned area).
 * 
 * This is intended for testing and validation, not production use.
 */

class BruteForceSolver {
    /**
     * Find the optimal wall placement by exhaustively checking all combinations
     * @param {Array} map - 2D array where 0=water, 1=grass, 2=home
     * @param {number} maxWalls - Maximum number of walls to place
     * @returns {Object} Object with {walls: Array, goalArea: number, combinations: number} or null
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
        
        // Find all grass tiles (potential wall locations)
        const grassTiles = [];
        for (let i = 0; i < verticalTiles; i++) {
            for (let j = 0; j < horizontalTiles; j++) {
                if (map[i][j] === 1) {
                    grassTiles.push([i, j]);
                }
            }
        }
        
        console.log(`Brute force solver: ${grassTiles.length} grass tiles, max ${maxWalls} walls`);
        
        let bestSolution = null;
        let bestArea = 0; // Start with 0 to find MAXIMUM (returns null if no solution pens the pet)
        let combinationsChecked = 0;
        
        // Generate all combinations of wall placements
        const combinations = this._generateCombinations(grassTiles, maxWalls);
        console.log(`Total combinations to check: ${combinations.length}`);
        
        for (const wallPositions of combinations) {
            combinationsChecked++;
            
            // Create test map with walls
            const testMap = map.map(row => [...row]);
            for (const [row, col] of wallPositions) {
                testMap[row][col] = 5; // 5 = wall
            }
            
            // Check if penned
            if (this._isPenned(testMap, homeRow, homeCol)) {
                const area = this._calculatePennedArea(testMap, homeRow, homeCol);
                if (area > bestArea) { // MAXIMIZE area, not minimize!
                    bestArea = area;
                    bestSolution = wallPositions;
                }
            }
            
            // Log progress every 10000 combinations
            if (combinationsChecked % 10000 === 0) {
                console.log(`Checked ${combinationsChecked}/${combinations.length} combinations, best area so far: ${bestArea}`);
            }
        }
        
        console.log(`Brute force complete: checked ${combinationsChecked} combinations`);
        
        if (bestSolution === null) {
            console.log('No solution found - pet cannot be penned with available walls');
            return null;
        }
        
        // Convert wall list to 2D array
        const wallArray = Array(verticalTiles).fill(null).map(() => Array(horizontalTiles).fill(0));
        for (const [row, col] of bestSolution) {
            wallArray[row][col] = 1;
        }
        
        console.log(`Best solution found: ${bestSolution.length} walls, area: ${bestArea}`);
        
        return { 
            walls: wallArray, 
            goalArea: bestArea,
            wallPositions: bestSolution,
            combinations: combinationsChecked
        };
    }
    
    /**
     * Generate all combinations of k items from array
     * @private
     */
    static _generateCombinations(array, k) {
        const combinations = [];
        
        // For each possible size from 1 to k
        for (let size = 1; size <= k; size++) {
            this._generateCombinationsOfSize(array, size, 0, [], combinations);
        }
        
        return combinations;
    }
    
    /**
     * Recursively generate combinations of specific size
     * @private
     */
    static _generateCombinationsOfSize(array, size, start, current, result) {
        if (current.length === size) {
            result.push([...current]);
            return;
        }
        
        for (let i = start; i < array.length; i++) {
            current.push(array[i]);
            this._generateCombinationsOfSize(array, size, i + 1, current, result);
            current.pop();
        }
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
    static _calculatePennedArea(map, homeRow, homeCol) {
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

// Export for use in Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BruteForceSolver;
}
