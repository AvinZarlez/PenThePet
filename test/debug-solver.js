/**
 * Debug script to trace MILP solver behavior
 */

const MILPSolver = require('../js/MILPSolver.js');

// Test map from test-maps-db.json (first one)
const stringMap = [
    ["water", "grass", "grass", "grass", "grass"],
    ["grass", "water", "water", "grass", "grass"],
    ["water", "grass", "home", "grass", "grass"],
    ["grass", "water", "grass", "grass", "water"],
    ["grass", "water", "grass", "grass", "grass"]
];

// Convert to numeric
const numericMap = stringMap.map(row => row.map(tile => {
    if (tile === 'water') return 0;
    if (tile === 'grass') return 1;
    if (tile === 'home') return 2;
    return 1;
}));

console.log('Testing map:');
for (let i = 0; i < 5; i++) {
    console.log(stringMap[i].map(t => t[0].toUpperCase()).join(' '));
}

console.log('\nHome is at [2, 2]');
console.log('Neighbors of home:');
console.log('  [1,2] = water (blocks)');
console.log('  [3,2] = grass (needs wall)');
console.log('  [2,1] = grass (needs wall)');
console.log('  [2,3] = grass (needs wall)');
console.log('\nExpected: 3 walls at [3,2], [2,1], [2,3] to create area=1');

console.log('\n--- Running MILP Solver with detailed logging ---');

// Add logging to test the enclosure generation
const homeRow = 2, homeCol = 2, maxWalls = 5;

// Manually test enclosure generation logic
console.log('\nTesting enclosure candidates:');
const candidates = [];
for (let distance = 1; distance <= Math.min(5, maxWalls); distance++) {
    const ring = [];
    for (let dr = -distance; dr <= distance; dr++) {
        for (let dc = -distance; dc <= distance; dc++) {
            if (Math.abs(dr) + Math.abs(dc) !== distance) continue;
            
            const row = homeRow + dr;
            const col = homeCol + dc;
            
            if (row < 0 || row >= 5 || col < 0 || col >= 5) {
                continue;
            }
            
            ring.push([row, col]);
        }
    }
    
    console.log(`\nDistance ${distance} ring (${ring.length} cells):`, ring);
    console.log(`  Tiles:`, ring.map(([r, c]) => `[${r},${c}]=${stringMap[r][c]}`).join(', '));
    
    // Check what would happen if we tried to pen with this ring
    const testMap = numericMap.map(row => [...row]);
    let wallsNeeded = 0;
    for (const [r, c] of ring) {
        if (testMap[r][c] === 1) {
            testMap[r][c] = 5;
            wallsNeeded++;
        }
    }
    
    // Check if penned
    const isPenned = checkPenned(testMap, homeRow, homeCol);
    const area = isPenned ? calculateArea(testMap, homeRow, homeCol) : -1;
    
    console.log(`  Walls needed: ${wallsNeeded}, Penned: ${isPenned}, Area: ${area}`);
}

console.log('\n--- Running actual MILP Solver ---');
const solution = MILPSolver.solveMap(numericMap, maxWalls);
console.log('Result:', solution);

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
