/**
 * Direct comparison test
 */

const MILPSolver = require('../js/MILPSolver.js');
const BruteForceSolver = require('./BruteForceSolver.js');

// Simple test map
const map = [
    [0, 1, 1, 1, 1],
    [1, 0, 0, 1, 1],
    [0, 1, 2, 1, 1],
    [1, 0, 1, 1, 0],
    [1, 0, 1, 1, 1]
];

console.log('Test map (0=water, 1=grass, 2=home):');
for (const row of map) console.log(row.join(' '));

console.log('\n--- Running Brute Force ---');
const bruteResult = BruteForceSolver.solveMap(map, 5);
console.log('Brute Force Result:', bruteResult ? bruteResult.goalArea : 'null');

console.log('\n--- Running MILP ---');
const milpResult = MILPSolver.solveMap(map, 5);
console.log('MILP Result:', milpResult ? milpResult.goalArea : 'null');

console.log('\n--- Comparison ---');
if (bruteResult && milpResult) {
    console.log(`Brute: ${bruteResult.goalArea}, MILP: ${milpResult.goalArea}`);
    console.log(`Match: ${bruteResult.goalArea === milpResult.goalArea ? 'YES ✓' : 'NO ✗'}`);
} else {
    console.log('One or both solvers failed');
}
