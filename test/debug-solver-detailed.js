/**
 * Test with added logging to MILPSolver
 */

// Copy of MILPSolver with logging
class MILPSolverDebug {
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
        
        const bestSolution = this._findBestWallPlacement(map, maxWalls, homeRow, homeCol);
        
        if (bestSolution === null) {
            console.error('Failed to find solution');
            return null;
        }
        
        return bestSolution;
    }
    
    static _findBestWallPlacement(map, maxWalls, homeRow, homeCol) {
        const verticalTiles = map.length;
        const horizontalTiles = map[0].length;
        
        console.log('\n=== _findBestWallPlacement ===');
        console.log(`Map: ${verticalTiles}x${horizontalTiles}, Home: [${homeRow},${homeCol}], MaxWalls: ${maxWalls}`);
        
        // Check if already penned
        if (this._isPenned(map, homeRow, homeCol)) {
            const area = this._calculatePennedArea(map, homeRow, homeCol);
            console.log('Already penned!');
            return { 
                walls: Array(verticalTiles).fill(null).map(() => Array(horizontalTiles).fill(0)),
                goalArea: area
            };
        }
        
        let bestSolution = null;
        let bestArea = Infinity;
        
        // Strategy 1: Try to create tight enclosures around home
        console.log('\n--- Strategy 1: Enclosures ---');
        const enclosures = this._generateEnclosureCandidates(map, homeRow, homeCol, maxWalls);
        console.log(`Generated ${enclosures.length} enclosure candidates`);
        
        let enclosuresChecked = 0;
        let enclosuresPenned = 0;
        
        for (const enclosure of enclosures) {
            enclosuresChecked++;
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
                enclosuresPenned++;
                const area = this._calculatePennedArea(testMap, homeRow, homeCol);
                
                if (enclosuresPenned <= 5) {
                    console.log(`  Enclosure ${enclosuresChecked}: ${walls.length} walls, Area=${area}, bestArea=${bestArea}`);
                }
                
                if (area < bestArea && walls.length <= maxWalls) {
                    console.log(`  *** NEW BEST: Area=${area}, Walls=${walls.length}`);
                    bestArea = area;
                    bestSolution = walls;
                }
            }
        }
        
        console.log(`Enclosures: checked ${enclosuresChecked}, penned ${enclosuresPenned}, bestArea=${bestArea}`);
        
        // Strategy 2: Use BFS to find shortest paths to edge, then block them
        console.log('\n--- Strategy 2: Path Blocking ---');
        if (bestArea > 5) {
            console.log('bestArea > 5, trying path blocking...');
            const criticalCells = this._findCriticalPathCells(map, homeRow, homeCol);
            const pathSolution = this._findBestPathBlocking(map, criticalCells, maxWalls, homeRow, homeCol);
            
            if (pathSolution) {
                console.log(`Path blocking found: Area=${pathSolution.area}`);
                if (pathSolution.area < bestArea) {
                    console.log(`*** Path blocking is better! Area=${pathSolution.area}`);
                    bestArea = pathSolution.area;
                    bestSolution = pathSolution.walls;
                }
            } else {
                console.log('Path blocking found no solution');
            }
        } else {
            console.log(`Skipping path blocking (bestArea=${bestArea} <= 5)`);
        }
        
        console.log(`\nFinal result: bestArea=${bestArea}, walls=${bestSolution ? bestSolution.length : 'null'}`);
        
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
    
    static _generateEnclosureCandidates(map, homeRow, homeCol, maxWalls) {
        const candidates = [];
        const verticalTiles = map.length;
        const horizontalTiles = map[0].length;
        
        for (let distance = 1; distance <= Math.min(5, maxWalls); distance++) {
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
            
            candidates.push([...ring]);
            
            if (ring.length <= maxWalls) {
                for (let i = 0; i < ring.length; i++) {
                    const partial = ring.filter((_, idx) => idx !== i);
                    candidates.push(partial);
                }
            }
        }
        
        candidates.sort((a, b) => a.length - b.length);
        
        return candidates;
    }
    
    static _findCriticalPathCells(map, homeRow, homeCol) {
        return []; // Stub for now
    }
    
    static _findBestPathBlocking(map, criticalCells, maxWalls, homeRow, homeCol) {
        return null; // Stub for now
    }
    
    static _isPenned(map, homeRow, homeCol) {
        const verticalTiles = map.length;
        const horizontalTiles = map[0].length;
        
        const visited = new Set([`${homeRow},${homeCol}`]);
        const queue = [[homeRow, homeCol]];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        while (queue.length > 0) {
            const [row, col] = queue.shift();
            
            if (row === 0 || row === verticalTiles - 1 || col === 0 || col === horizontalTiles - 1) {
                return false;
            }
            
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
                if (tileType === 0 || tileType === 5) {
                    continue;
                }
                
                visited.add(key);
                queue.push([newRow, newCol]);
            }
        }
        
        return true;
    }
    
    static _calculatePennedArea(map, homeRow, homeCol) {
        const verticalTiles = map.length;
        const horizontalTiles = map[0].length;
        
        const visited = new Set([`${homeRow},${homeCol}`]);
        const queue = [[homeRow, homeCol]];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        while (queue.length > 0) {
            const [row, col] = queue.shift();
            
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
                if (tileType === 0 || tileType === 5) {
                    continue;
                }
                
                visited.add(key);
                queue.push([newRow, newCol]);
            }
        }
        
        return visited.size;
    }
}

// Test map
const stringMap = [
    ['water', 'grass', 'grass', 'grass', 'grass'],
    ['grass', 'water', 'water', 'grass', 'grass'],
    ['water', 'grass', 'home', 'grass', 'grass'],
    ['grass', 'water', 'grass', 'grass', 'water'],
    ['grass', 'water', 'grass', 'grass', 'grass']
];

const numericMap = stringMap.map(row => row.map(tile => {
    if (tile === 'water') return 0;
    if (tile === 'grass') return 1;
    if (tile === 'home') return 2;
    return 1;
}));

console.log('Testing with debug MILPSolver');
const solution = MILPSolverDebug.solveMap(numericMap, 5);
console.log('\nFinal solution:', solution);
