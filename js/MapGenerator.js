/**
 * Map Generator
 * 
 * Generates valid game maps that ensure the pet can always reach an edge
 * when no walls are placed. Delegates path validation to PathfindingUtils.
 */

// Node.js-only module - used by generation scripts, never loaded in browser
(function() {
    if (typeof require !== 'undefined') {
        if (typeof global.CONSTANTS === 'undefined') {
            global.CONSTANTS = require('./constants.js');
        }
        if (typeof global.TILE_DATA === 'undefined') {
            const td = require('./tileData.js');
            global.TILE_DATA = td.TILE_DATA;
            global.TILE_TO_NUMERIC = td.TILE_TO_NUMERIC;
        }
        if (typeof global.PathfindingUtils === 'undefined') {
            global.PathfindingUtils = require('./PathfindingUtils.js');
        }
        if (typeof global.MILPSolver === 'undefined') {
            global.MILPSolver = require('../scripts/solver/MILPSolver.js');
        }
        if (typeof global.MapValidator === 'undefined') {
            global.MapValidator = require('./MapValidator.js');
        }
    }
})();

class MapGenerator {
    /**
     * Create a new MapGenerator
     * @param {number} size - The size of the grid (size x size)
     * @param {Object} tileDistribution - Object with tile type probabilities
     */
    constructor(size, tileDistribution = null) {
        this.size = size;
        this.tileDistribution = tileDistribution || CONSTANTS.TILE_DISTRIBUTION;
        this.maxAttempts = CONSTANTS.MAX_GENERATION_ATTEMPTS; // Maximum attempts to generate a valid map
    }

    /**
     * Generate a valid map with guaranteed path to edge and goal calculation
     * Uses CONSTANTS.maxWallsForSize(size) for wall count based on grid size
     * Retries generation if map doesn't meet quality standards
     * @param {string} _dateString - Optional date string for seeded generation (unused)
     * @returns {Object} Object containing map and goal, or throws error if unable to generate
     */
    generate(_dateString = null) {
        const maxWalls = CONSTANTS.maxWallsForSize(this.size);
        
        // Keep trying until we get a valid map that meets quality standards
        let totalAttempts = 0;
        const maxTotalAttempts = 1000; // Safety limit to prevent infinite loops
        
        while (totalAttempts < maxTotalAttempts) {
            let attempts = 0;
            let map;
            let result;
            
            // Try to generate a valid random map
            while (attempts < this.maxAttempts) {
                map = this._generateRandomMap();
                if (this._validateMap(map)) {
                    // Calculate the goal using exhaustive search (accuracy over speed)
                    result = this.calculateGoal(map, maxWalls);
                    
                    // Check if we got a valid result
                    if (result !== null && result.optimalWallCount <= maxWalls) {
                        // Validate the map meets quality standards
                        const validation = MapValidator.validate(map, result);
                        
                        if (validation.valid) {
                            return { 
                                map, 
                                goal: result.goalArea, 
                                maxWalls: maxWalls,
                                optimalSolution: result.optimalSolution
                            };
                        } else {
                            // Log validation failures for debugging
                            if (totalAttempts % 10 === 0) {
                                console.log(`Validation failed: ${validation.errors.join(', ')}`);
                            }
                        }
                    }
                }
                attempts++;
            }
            
            totalAttempts++;
            if (totalAttempts % 10 === 0) {
                console.log(`Generation attempt ${totalAttempts}: No valid solution found, retrying...`);
            }
        }
        
        // If we reach here, we failed to generate a valid map
        // Do NOT fall back to any alternative method - throw an error as required
        throw new Error(`Failed to generate valid map after ${maxTotalAttempts} attempts. ` +
            'This indicates either the solver is not finding solutions, or the quality ' +
            'constraints are too strict for the given parameters.');
    }

    /**
     * Generate a random map without validation.
     * Uses chance values from TILE_DATA to determine tile counts,
     * builds an exact-size tile list, then shuffles to randomise placement.
     * @private
     * @returns {Array} 2D array of tile types
     */
    _generateRandomMap() {
        const totalTiles = this.size * this.size;
        const reservedTiles = 1; // home tile placed separately
        const fillCount = totalTiles - reservedTiles;
        
        // Build a list of eligible tile types and their chances from TILE_DATA
        const eligibleTiles = [];
        let totalChance = 0;
        for (const [name, data] of Object.entries(TILE_DATA)) {
            if (data.chance > 0) {
                eligibleTiles.push({ name, chance: data.chance });
                totalChance += data.chance;
            }
        }
        
        // Compute how many of each tile type based on chance proportions
        const tileList = [];
        let placed = 0;
        for (let i = 0; i < eligibleTiles.length; i++) {
            const t = eligibleTiles[i];
            let count;
            if (i === eligibleTiles.length - 1) {
                // Last tile type gets the remainder to ensure exact total
                count = fillCount - placed;
            } else {
                count = Math.floor((t.chance / totalChance) * fillCount);
            }
            for (let j = 0; j < count; j++) {
                tileList.push(t.name);
            }
            placed += count;
        }
        
        // Shuffle the tile list (Fisher-Yates)
        for (let i = tileList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tileList[i], tileList[j]] = [tileList[j], tileList[i]];
        }
        
        // Insert home at center position so every slot is accounted for
        const centerIndex = Math.floor(this.size / 2) * this.size + Math.floor(this.size / 2);
        tileList.splice(centerIndex, 0, 'home');
        
        // Build the 2D map
        const map = [];
        let idx = 0;
        for (let i = 0; i < this.size; i++) {
            const row = [];
            for (let j = 0; j < this.size; j++) {
                row.push(tileList[idx++]);
            }
            map.push(row);
        }
        
        return map;
    }

    /**
     * Validate that a map has a path from home to edge with no walls.
     * Delegates to PathfindingUtils.hasPathToEdge() for shared BFS logic.
     * @private
     * @param {Array} map - 2D array of tile types
     * @returns {boolean} True if map is valid
     */
    _validateMap(map) {
        return PathfindingUtils.hasPathToEdge(map);
    }

    /**
     * Convert map from string format to numeric format.
     * Uses TILE_TO_NUMERIC from tileData.js for the mapping.
     * @param {Array} stringMap - 2D array of tile type strings
     * @returns {Array} 2D array of numeric tile values
     * @private
     */
    _mapToNumeric(stringMap) {
        return stringMap.map(row => row.map(tile => {
            return TILE_TO_NUMERIC[tile] !== undefined ? TILE_TO_NUMERIC[tile] : 1;
        }));
    }
    
    /**
     * Calculate the maximum achievable area (goal) for a given map
     * Uses the MILP solver to find the optimal wall placements
     * @param {Array} map - 2D array of tile types (strings)
     * @param {number} maxWalls - Maximum number of walls that can be placed
     * @returns {Object|null} Object with {goalArea, optimalWallCount, optimalSolution}, or null if pet cannot be penned
     */
    calculateGoal(map, maxWalls) {
        // Convert map from tile type strings to numbers for the solver
        const numericMap = this._mapToNumeric(map);
        
        // Use the MILP solver to find optimal solution
        const solution = MILPSolver.solveMap(numericMap, maxWalls);
        
        if (solution === null) {
            return null;
        }
        
        return {
            goalArea: solution.goalArea,
            optimalWallCount: solution.optimalWallCount || 0,
            optimalSolution: solution.walls ? this._convertWallsToCoordinates(solution.walls) : []
        };
    }

    /**
     * Convert walls 2D array to array of [row, col] coordinates
     * @private
     * @param {Array} walls - 2D array where 1 indicates wall position
     * @returns {Array} Array of [row, col] coordinates
     */
    _convertWallsToCoordinates(walls) {
        const coordinates = [];
        for (let i = 0; i < walls.length; i++) {
            for (let j = 0; j < walls[i].length; j++) {
                if (walls[i][j] === 1) {
                    coordinates.push([i, j]);
                }
            }
        }
        return coordinates;
    }

}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapGenerator;
}
