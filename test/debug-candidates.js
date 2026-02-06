/**
 * More detailed debug script 
 */

const MILPSolver = require('../js/MILPSolver.js');

// Test map from test-maps-db.json (first one)
const stringMap = [
    ['water', 'grass', 'grass', 'grass', 'grass'],
    ['grass', 'water', 'water', 'grass', 'grass'],
    ['water', 'grass', 'home', 'grass', 'grass'],
    ['grass', 'water', 'grass', 'grass', 'water'],
    ['grass', 'water', 'grass', 'grass', 'grass']
];

// Convert to numeric
const numericMap = stringMap.map(row => row.map(tile => {
    if (tile === 'water') return 0;
    if (tile === 'grass') return 1;
    if (tile === 'home') return 2;
    return 1;
}));

// Manually call the enclosure generation to see what candidates it creates
const homeRow = 2, homeCol = 2, maxWalls = 5;
const verticalTiles = 5, horizontalTiles = 5;

console.log('Generating enclosure candidates...\n');

const candidates = [];

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

console.log(`Total candidates: ${candidates.length}\n`);

// Test first 20 candidates
console.log('Testing first 20 candidates:\n');
for (let i = 0; i < Math.min(20, candidates.length); i++) {
    const enclosure = candidates[i];
    const testMap = numericMap.map(row => [...row]);
    const walls = [];
    
    // Place walls for this enclosure
    for (const [row, col] of enclosure) {
        if (testMap[row][col] === 1) {
            testMap[row][col] = 5;
            walls.push([row, col]);
        }
    }
    
    // Check if this pens the home
    const isPenned = checkPenned(testMap, homeRow, homeCol);
    const area = isPenned ? calculateArea(testMap, homeRow, homeCol) : -1;
    
    console.log(`Candidate ${i}: ${enclosure.length} cells, ${walls.length} walls, Penned: ${isPenned}, Area: ${area}`);
    if (i < 5 || isPenned) {
        console.log(`  Enclosure: ${enclosure.map(([r, c]) => `[${r},${c}]`).join(', ')}`);
        console.log(`  Walls: ${walls.map(([r, c]) => `[${r},${c}]`).join(', ')}`);
    }
}

function checkPenned(map, homeRow, homeCol) {
    const visited = new Set([`${homeRow},${homeCol}`]);
    const queue = [[homeRow, homeCol]];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    while (queue.length > 0) {
        const [row, col] = queue.shift();
        
        if (row === 0 || row === 4 || col === 0 || col === 4) {
            return false;
        }
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            const key = `${newRow},${newCol}`;
            
            if (newRow < 0 || newRow >= 5 || newCol < 0 || newCol >= 5) {
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

function calculateArea(map, homeRow, homeCol) {
    const visited = new Set([`${homeRow},${homeCol}`]);
    const queue = [[homeRow, homeCol]];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    while (queue.length > 0) {
        const [row, col] = queue.shift();
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            const key = `${newRow},${newCol}`;
            
            if (newRow < 0 || newRow >= 5 || newCol < 0 || newCol >= 5) {
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
