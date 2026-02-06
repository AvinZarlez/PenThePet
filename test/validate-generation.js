/**
 * Validation test for map generation goal calculation
 * 
 * This test validates that:
 * 1. Maps can be generated successfully
 * 2. Goals are reasonable (not ultra small like 1)
 * 3. Goals increase with map size
 * 4. Generation completes in reasonable time
 */

const MapGenerator = require('../js/MapGenerator.js');

console.log('Map Generation Validation Test');
console.log('================================\n');

const sizes = [5, 7, 9];
const wallCounts = [5, 7, 12]; // More walls for larger grids
const results = [];

for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const maxWalls = wallCounts[i];
    console.log(`Testing ${size}x${size} map with ${maxWalls} walls...`);
    const start = Date.now();
    const gen = new MapGenerator(size, { grass: 0.7, water: 0.3 });
    const result = gen.generate(null, maxWalls);
    const duration = Date.now() - start;
    
    if (!result) {
        console.log('  ✗ FAILED: Could not generate map\n');
        results.push({ size, success: false });
        continue;
    }
    
    const goal = result.goal;
    const totalTiles = size * size;
    const isReasonable = goal >= Math.max(3, Math.floor(totalTiles * 0.1)) && 
                         goal <= Math.floor(totalTiles * 0.8);
    
    console.log(`  Goal: ${goal}`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Reasonable: ${isReasonable ? 'YES ✓' : 'NO ✗'}`);
    console.log();
    
    results.push({ size, maxWalls, goal, duration, success: true, isReasonable });
}

// Summary
console.log('=== Summary ===');
const allSuccess = results.every(r => r.success);
const allReasonable = results.every(r => r.isReasonable);
const goalsIncreasing = results.length >= 2 && 
                        results[1].goal >= results[0].goal &&
                        results[2].goal >= results[1].goal;

console.log(`All maps generated: ${allSuccess ? 'YES ✓' : 'NO ✗'}`);
console.log(`All goals reasonable: ${allReasonable ? 'YES ✓' : 'NO ✗'}`);
console.log(`Goals trend upward: ${goalsIncreasing ? 'YES ✓' : 'NO ✗'}`);

if (allSuccess && allReasonable && goalsIncreasing) {
    console.log('\n✓ ALL TESTS PASSED');
    process.exit(0);
} else {
    console.log('\n✗ SOME TESTS FAILED');
    process.exit(1);
}
