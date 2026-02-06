/**
 * Simple test to verify map generation goal is reasonable
 */

const MapGenerator = require('../js/MapGenerator.js');

console.log('Testing map generation with different sizes...\n');

// Test 5x5 map
console.log('=== 5x5 Map ===');
const gen5 = new MapGenerator(5, { grass: 0.7, water: 0.3 });
const result5 = gen5.generate(null, 5);
console.log(`Goal: ${result5.goal}`);
console.log(`Map size: 5x5 = 25 tiles`);
console.log(`Reasonable? ${result5.goal >= 3 && result5.goal <= 20 ? 'YES ✓' : 'NO ✗'}`);

// Test 7x7 map
console.log('\n=== 7x7 Map ===');
const gen7 = new MapGenerator(7, { grass: 0.7, water: 0.3 });
const result7 = gen7.generate(null, 7);
console.log(`Goal: ${result7.goal}`);
console.log(`Map size: 7x7 = 49 tiles`);
console.log(`Reasonable? ${result7.goal >= 5 && result7.goal <= 40 ? 'YES ✓' : 'NO ✗'}`);

// Test 9x9 map
console.log('\n=== 9x9 Map ===');
const gen9 = new MapGenerator(9, { grass: 0.7, water: 0.3 });
const result9 = gen9.generate(null, 9);
console.log(`Goal: ${result9.goal}`);
console.log(`Map size: 9x9 = 81 tiles`);
console.log(`Reasonable? ${result9.goal >= 8 && result9.goal <= 70 ? 'YES ✓' : 'NO ✗'}`);

console.log('\n=== Summary ===');
console.log('All goals should be reasonable numbers (not 1 or ultra small)');
console.log(`5x5 goal: ${result5.goal}`);
console.log(`7x7 goal: ${result7.goal}`);
console.log(`9x9 goal: ${result9.goal}`);
