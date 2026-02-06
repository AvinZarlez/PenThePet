/**
 * Map Generator
 * 
 * Generates valid game maps that ensure the pet can always reach an edge
 * when no walls are placed. Uses BFS pathfinding to validate connectivity.
 */

class MapGenerator {
    /**
     * Create a new MapGenerator
     * @param {number} size - The size of the grid (size x size)
     * @param {Object} tileDistribution - Object with tile type probabilities
     */
    constructor(size, tileDistribution = { grass: 0.7, water: 0.3 }) {
        this.size = size;
        this.tileDistribution = tileDistribution;
        this.maxAttempts = 100; // Maximum attempts to generate a valid map
    }

    /**
     * Generate a valid map with guaranteed path to edge and goal calculation
     * @param {string} dateString - Optional date string for seeded generation
     * @param {number} maxWalls - Maximum number of walls available to the player
     * @returns {Object} Object containing map and goal, or null if unable to generate valid map
     */
    generate(dateString = null, maxWalls = 9) {
        let attempts = 0;
        let map = null;
        let goal = null;
        
        while (attempts < this.maxAttempts) {
            map = this._generateRandomMap();
            if (this._validateMap(map)) {
                // Calculate the goal (minimum achievable area)
                goal = this.calculateGoal(map, maxWalls);
                
                // If goal is null, the pet cannot be penned with available walls
                // Try generating a new map
                if (goal !== null) {
                    return { map, goal };
                }
            }
            attempts++;
        }
        
        // If we couldn't generate a valid random map, generate a guaranteed valid one
        console.warn('Could not generate valid random map, creating guaranteed valid map');
        map = this._generateGuaranteedValidMap();
        goal = this.calculateGoal(map, maxWalls);
        
        // If even the guaranteed map can't be penned, return null
        if (goal === null) {
            console.error('Unable to generate a map that can be penned with available walls');
            return null;
        }
        
        return { map, goal };
    }

    /**
     * Generate a random map without validation
     * @private
     * @returns {Array} 2D array of tile types
     */
    _generateRandomMap() {
        const map = [];
        for (let i = 0; i < this.size; i++) {
            const row = [];
            for (let j = 0; j < this.size; j++) {
                row.push(this._generateRandomTile());
            }
            map.push(row);
        }
        
        // Place home tile at center
        const centerRow = Math.floor(this.size / 2);
        const centerCol = Math.floor(this.size / 2);
        map[centerRow][centerCol] = 'home';
        
        return map;
    }

    /**
     * Generate a random tile type based on distribution
     * @private
     * @returns {string} The tile type name
     */
    _generateRandomTile() {
        const rand = Math.random();
        const grassThreshold = this.tileDistribution.grass;
        return rand < grassThreshold ? 'grass' : 'water';
    }

    /**
     * Validate that a map has a path from home to edge with no walls
     * @private
     * @param {Array} map - 2D array of tile types
     * @returns {boolean} True if map is valid
     */
    _validateMap(map) {
        const centerRow = Math.floor(this.size / 2);
        const centerCol = Math.floor(this.size / 2);
        
        // BFS to check if there's a path to any edge
        const visited = new Set();
        const queue = [[centerRow, centerCol]];
        visited.add(`${centerRow},${centerCol}`);
        
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        while (queue.length > 0) {
            const [row, col] = queue.shift();
            
            // Check if we reached an edge
            if (row === 0 || row === this.size - 1 || col === 0 || col === this.size - 1) {
                return true;
            }
            
            // Explore neighbors
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                const coordKey = `${newRow},${newCol}`;
                
                // Check bounds
                if (newRow < 0 || newRow >= this.size || newCol < 0 || newCol >= this.size) {
                    continue;
                }
                
                // Check if already visited
                if (visited.has(coordKey)) {
                    continue;
                }
                
                const tileType = map[newRow][newCol];
                
                // Only grass and home tiles are passable (water blocks)
                if (tileType === 'water') {
                    continue;
                }
                
                visited.add(coordKey);
                queue.push([newRow, newCol]);
            }
        }
        
        // No path to edge found
        return false;
    }

    /**
     * Generate a guaranteed valid map with a clear path to edge
     * Creates a path from center to an edge, then fills remaining tiles
     * @private
     * @returns {Array} 2D array of tile types
     */
    _generateGuaranteedValidMap() {
        const map = [];
        
        // Initialize with all grass
        for (let i = 0; i < this.size; i++) {
            const row = [];
            for (let j = 0; j < this.size; j++) {
                row.push('grass');
            }
            map.push(row);
        }
        
        // Place home at center
        const centerRow = Math.floor(this.size / 2);
        const centerCol = Math.floor(this.size / 2);
        map[centerRow][centerCol] = 'home';
        
        // Create a guaranteed path from center to top edge
        const pathCells = new Set();
        for (let row = 0; row <= centerRow; row++) {
            pathCells.add(`${row},${centerCol}`);
        }
        
        // Now randomly place water, but not on the path
        const waterRatio = this.tileDistribution.water || (1 - this.tileDistribution.grass);
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const coordKey = `${i},${j}`;
                if (map[i][j] === 'home' || pathCells.has(coordKey)) {
                    continue;
                }
                
                if (Math.random() < waterRatio) {
                    map[i][j] = 'water';
                }
            }
        }
        
        return map;
    }

    /**
     * Calculate the minimum achievable area (goal) for a given map
     * Uses a greedy approach to find the best wall placements
     * @param {Array} map - 2D array of tile types
     * @param {number} maxWalls - Maximum number of walls that can be placed
     * @returns {number|null} The minimum area size, or null if pet cannot be penned
     */
    calculateGoal(map, maxWalls) {
        // Find home position
        const centerRow = Math.floor(this.size / 2);
        const centerCol = Math.floor(this.size / 2);
        
        // Try to find the best wall placement using a greedy approach
        // We'll place walls strategically to minimize the penned area
        
        // Create a working copy of the map
        const workingMap = map.map(row => [...row]);
        
        // Try multiple strategies and pick the best
        let bestArea = null;
        
        // Strategy 1: Block the shortest paths to edges
        const strategy1Result = this._tryBlockShortestPaths(workingMap, maxWalls, centerRow, centerCol);
        if (strategy1Result !== null) {
            bestArea = strategy1Result;
        }
        
        // Strategy 2: Block in a circular pattern (if we have enough walls)
        const strategy2Result = this._tryCircularBlock(workingMap, maxWalls, centerRow, centerCol);
        if (strategy2Result !== null && (bestArea === null || strategy2Result < bestArea)) {
            bestArea = strategy2Result;
        }
        
        return bestArea;
    }

    /**
     * Try to block shortest paths to edges by placing walls strategically
     * @private
     * @param {Array} map - Working copy of the map
     * @param {number} maxWalls - Maximum walls available
     * @param {number} homeRow - Home tile row
     * @param {number} homeCol - Home tile column
     * @returns {number|null} Area size or null if cannot pen
     */
    _tryBlockShortestPaths(map, maxWalls, homeRow, homeCol) {
        const workingMap = map.map(row => [...row]);
        
        // Find all paths to edges and identify critical choke points
        const paths = this._findAllPathsToEdge(workingMap, homeRow, homeCol);
        
        if (paths.length === 0) {
            // Already penned (shouldn't happen with valid map, but handle it)
            return this._calculateAreaSize(workingMap, homeRow, homeCol);
        }
        
        // Count frequency of each cell in paths to find choke points
        const cellFrequency = new Map();
        for (const path of paths) {
            for (const cell of path) {
                cellFrequency.set(cell, (cellFrequency.get(cell) || 0) + 1);
            }
        }
        
        // Sort cells by frequency (most common = best choke points)
        const chokePoints = Array.from(cellFrequency.entries())
            .filter(([cell]) => {
                const [row, col] = cell.split(',').map(Number);
                return workingMap[row][col] === 'grass'; // Only place walls on grass
            })
            .sort((a, b) => b[1] - a[1])
            .map(([cell]) => cell);
        
        // Place walls at choke points
        let wallsPlaced = 0;
        for (const cell of chokePoints) {
            if (wallsPlaced >= maxWalls) break;
            
            const [row, col] = cell.split(',').map(Number);
            workingMap[row][col] = 'wall';
            wallsPlaced++;
            
            // Check if we've penned the pet
            if (this._isMapPenned(workingMap, homeRow, homeCol)) {
                return this._calculateAreaSize(workingMap, homeRow, homeCol);
            }
        }
        
        // Couldn't pen with available walls
        return null;
    }

    /**
     * Try to block in a circular/rectangular pattern around home
     * @private
     * @param {Array} map - Working copy of the map
     * @param {number} maxWalls - Maximum walls available
     * @param {number} homeRow - Home tile row
     * @param {number} homeCol - Home tile column
     * @returns {number|null} Area size or null if cannot pen
     */
    _tryCircularBlock(map, maxWalls, homeRow, homeCol) {
        const workingMap = map.map(row => [...row]);
        
        // Try increasing radii until we can pen or run out of walls
        for (let radius = 1; radius <= Math.floor(this.size / 2); radius++) {
            const boundaryMap = workingMap.map(row => [...row]);
            let wallsNeeded = 0;
            
            // Get cells at this radius (diamond/square pattern)
            const boundaryCells = [];
            for (let dr = -radius; dr <= radius; dr++) {
                for (let dc = -radius; dc <= radius; dc++) {
                    // Check if on the boundary (Manhattan distance = radius)
                    if (Math.abs(dr) + Math.abs(dc) === radius) {
                        const row = homeRow + dr;
                        const col = homeCol + dc;
                        
                        if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
                            boundaryCells.push([row, col]);
                        }
                    }
                }
            }
            
            // Check how many walls we need for this boundary
            for (const [row, col] of boundaryCells) {
                const tileType = boundaryMap[row][col];
                if (tileType === 'grass') {
                    wallsNeeded++;
                } else if (tileType !== 'water') {
                    // Can't form complete boundary (home or already blocked)
                    wallsNeeded = Infinity;
                    break;
                }
            }
            
            // If we can afford this boundary, place the walls
            if (wallsNeeded <= maxWalls) {
                for (const [row, col] of boundaryCells) {
                    if (boundaryMap[row][col] === 'grass') {
                        boundaryMap[row][col] = 'wall';
                    }
                }
                
                // Check if penned
                if (this._isMapPenned(boundaryMap, homeRow, homeCol)) {
                    return this._calculateAreaSize(boundaryMap, homeRow, homeCol);
                }
            }
        }
        
        return null;
    }

    /**
     * Find all paths from home to any edge (limited search for performance)
     * @private
     * @param {Array} map - The map to search
     * @param {number} startRow - Starting row
     * @param {number} startCol - Starting column
     * @returns {Array} Array of paths (each path is an array of cell coordinates)
     */
    _findAllPathsToEdge(map, startRow, startCol) {
        const paths = [];
        const maxPathsToFind = 10; // Limit for performance
        
        // BFS to find multiple paths
        const queue = [[startRow, startCol, []]];
        const visited = new Set([`${startRow},${startCol}`]);
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        while (queue.length > 0 && paths.length < maxPathsToFind) {
            const [row, col, path] = queue.shift();
            
            // Check if we reached an edge
            if (row === 0 || row === this.size - 1 || col === 0 || col === this.size - 1) {
                paths.push([...path, `${row},${col}`]);
                continue; // Don't explore further from edges
            }
            
            // Explore neighbors
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                const coordKey = `${newRow},${newCol}`;
                
                if (newRow < 0 || newRow >= this.size || newCol < 0 || newCol >= this.size) {
                    continue;
                }
                
                if (visited.has(coordKey)) {
                    continue;
                }
                
                const tileType = map[newRow][newCol];
                if (tileType === 'water' || tileType === 'wall') {
                    continue;
                }
                
                visited.add(coordKey);
                queue.push([newRow, newCol, [...path, coordKey]]);
            }
        }
        
        return paths;
    }

    /**
     * Check if the map has penned the pet (no path to edge)
     * @private
     * @param {Array} map - The map to check
     * @param {number} startRow - Home row
     * @param {number} startCol - Home column
     * @returns {boolean} True if penned
     */
    _isMapPenned(map, startRow, startCol) {
        const visited = new Set();
        const queue = [[startRow, startCol]];
        visited.add(`${startRow},${startCol}`);
        
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        while (queue.length > 0) {
            const [row, col] = queue.shift();
            
            // Check if we reached an edge
            if (row === 0 || row === this.size - 1 || col === 0 || col === this.size - 1) {
                return false; // Not penned, can reach edge
            }
            
            // Explore neighbors
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                const coordKey = `${newRow},${newCol}`;
                
                if (newRow < 0 || newRow >= this.size || newCol < 0 || newCol >= this.size) {
                    continue;
                }
                
                if (visited.has(coordKey)) {
                    continue;
                }
                
                const tileType = map[newRow][newCol];
                if (tileType === 'water' || tileType === 'wall') {
                    continue;
                }
                
                visited.add(coordKey);
                queue.push([newRow, newCol]);
            }
        }
        
        return true; // Penned, cannot reach edge
    }

    /**
     * Calculate the size of the accessible area from home
     * @private
     * @param {Array} map - The map
     * @param {number} startRow - Home row
     * @param {number} startCol - Home column
     * @returns {number} Number of accessible tiles
     */
    _calculateAreaSize(map, startRow, startCol) {
        const accessible = new Set();
        const queue = [[startRow, startCol]];
        accessible.add(`${startRow},${startCol}`);
        
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        while (queue.length > 0) {
            const [row, col] = queue.shift();
            
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                const coordKey = `${newRow},${newCol}`;
                
                if (newRow < 0 || newRow >= this.size || newCol < 0 || newCol >= this.size) {
                    continue;
                }
                
                if (accessible.has(coordKey)) {
                    continue;
                }
                
                const tileType = map[newRow][newCol];
                if (tileType === 'water' || tileType === 'wall') {
                    continue;
                }
                
                accessible.add(coordKey);
                queue.push([newRow, newCol]);
            }
        }
        
        return accessible.size;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapGenerator;
}
