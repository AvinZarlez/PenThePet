/**
 * Debug script to understand the current issue
 */

const MILPSolver = require('../js/MILPSolver.js');
const BruteForceSolver = require('./BruteForceSolver.js');

// Simple 5x5 test map
const testMap = [
    [0, 1, 1, 1, 0],  // 0=water, 1=grass, 2=home
    [1, 1, 1, 1, 1],
    [1, 1, 2, 1, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0]
];

console.log('Test Map (0=water, 1=grass, 2=home):');
testMap.forEach(row => console.log(row.join(' ')));

const maxWalls = 5;

console.log('\n--- Brute Force Solver ---');
const bruteResult = BruteForceSolver.solveMap(testMap, maxWalls);
if (bruteResult) {
    console.log(`Result: ${bruteResult.goalArea} area using ${bruteResult.wallPositions.length} walls`);
    console.log('Wall positions:', bruteResult.wallPositions);
    
    // Verify the solution
    const verifyMap = testMap.map(row => [...row]);
    for (const [r, c] of bruteResult.wallPositions) {
        verifyMap[r][c] = 5;
    }
    console.log('\nMap with walls (5=wall):');
    verifyMap.forEach(row => console.log(row.join(' ')));
    
    // Check if penned
    const isPenned = BruteForceSolver._isPenned(verifyMap, 2, 2);
    const area = BruteForceSolver._calculatePennedArea(verifyMap, 2, 2);
    console.log(`\nVerification: isPenned=${isPenned}, area=${area}`);
}

console.log('\n--- MILP Solver ---');
const milpResult = MILPSolver.solveMap(testMap, maxWalls);
if (milpResult) {
    console.log(`Result: ${milpResult.goalArea} area`);
    
    // Find wall positions from the walls array
    const wallPositions = [];
    for (let i = 0; i < milpResult.walls.length; i++) {
        for (let j = 0; j < milpResult.walls[i].length; j++) {
            if (milpResult.walls[i][j] === 1) {
                wallPositions.push([i, j]);
            }
        }
    }
    console.log(`Using ${wallPositions.length} walls`);
    console.log('Wall positions:', wallPositions);
    
    // Verify the solution
    const verifyMap = testMap.map(row => [...row]);
    for (const [r, c] of wallPositions) {
        verifyMap[r][c] = 5;
    }
    console.log('\nMap with walls (5=wall):');
    verifyMap.forEach(row => console.log(row.join(' ')));
    
    // Check if penned using brute force checker
    const isPenned = BruteForceSolver._isPenned(verifyMap, 2, 2);
    const area = BruteForceSolver._calculatePennedArea(verifyMap, 2, 2);
    console.log(`\nVerification with BruteForceSolver: isPenned=${isPenned}, area=${area}`);
    
    // Check if penned using MILP checker
    const isPennedMILP = MILPSolver._isPenned(verifyMap, 2, 2);
    const areaMILP = MILPSolver._calculatePennedArea(verifyMap, 2, 2);
    console.log(`Verification with MILPSolver: isPenned=${isPennedMILP}, area=${areaMILP}`);
}

console.log('\n--- Comparison ---');
if (bruteResult && milpResult) {
    if (bruteResult.goalArea === milpResult.goalArea) {
        console.log('✓ Results match!');
    } else {
        console.log(`✗ Results differ: Brute=${bruteResult.goalArea}, MILP=${milpResult.goalArea}`);
        console.log(`  Difference: ${milpResult.goalArea - bruteResult.goalArea} (MILP is ${milpResult.goalArea > bruteResult.goalArea ? 'larger' : 'smaller'})`);
    }
}
