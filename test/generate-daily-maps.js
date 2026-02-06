/**
 * Generate Daily Maps for maps.json
 * 
 * This script generates verified daily maps for the game using the corrected
 * map generation system (maximizing area, not minimizing).
 * 
 * For small maps, it uses brute force verification to ensure accuracy.
 */

const MapGenerator = require('../js/MapGenerator.js');
const BruteForceSolver = require('./BruteForceSolver.js');
const fs = require('fs');
const path = require('path');

function mapToNumeric(stringMap) {
    return stringMap.map(row => row.map(tile => {
        if (tile === 'water') return 0;
        if (tile === 'grass') return 1;
        if (tile === 'home') return 2;
        return 1;
    }));
}

async function generateDailyMap(size, maxWalls, date) {
    console.log(`\nGenerating ${size}x${size} map for ${date}...`);
    
    const generator = new MapGenerator(size, { grass: 0.7, water: 0.3 });
    const result = generator.generate(null, maxWalls);
    
    if (!result) {
        console.error('Failed to generate map');
        return null;
    }
    
    let verifiedGoal = result.goal;
    let optimalWallCount = result.maxWalls;  // MapGenerator now returns optimal wall count
    
    // For maps up to 7x7, verify with brute force for accuracy
    if (size <= 7) {
        console.log('  Running brute force verification...');
        const numericMap = mapToNumeric(result.map);
        const bruteStart = Date.now();
        const bruteResult = BruteForceSolver.solveMap(numericMap, maxWalls);
        const bruteDuration = Date.now() - bruteStart;
        
        if (bruteResult) {
            verifiedGoal = bruteResult.goalArea;
            optimalWallCount = bruteResult.wallPositions.length;
            const match = verifiedGoal === result.goal;
            console.log(`  MILP goal: ${result.goal}, Brute force goal: ${verifiedGoal}`);
            console.log(`  MILP walls: ${result.maxWalls}, Brute force walls: ${optimalWallCount}`);
            console.log(`  Match: ${match ? 'YES ✓' : 'NO ✗'}`);
            console.log(`  Verification took ${bruteDuration}ms`);
            
            // Use brute force result as it's guaranteed accurate
            result.goal = verifiedGoal;
            result.maxWalls = optimalWallCount;
        } else {
            console.warn('  Brute force could not find solution, using MILP result');
        }
    } else {
        console.log('  Using MILP solver (map too large for brute force)');
        console.log(`  Goal: ${result.goal}, Walls: ${optimalWallCount} (not verified)`);
    }
    
    return {
        [date]: {
            size: size,
            goal: result.goal,
            maxWalls: optimalWallCount,  // Use the optimal wall count, not the input maxWalls
            map: result.map
        }
    };
}

async function main() {
    console.log('PenThePet Daily Map Generator');
    console.log('==============================\n');
    console.log('Generating fresh maps with corrected goal calculation...\n');
    
    const maps = {};
    
    // Generate maps for recent dates
    const dates = [
        { date: '2026-02-05', size: 9, walls: 9 },
        { date: '2026-02-06', size: 7, walls: 9 },
        { date: '2026-02-07', size: 9, walls: 9 },
    ];
    
    for (const { date, size, walls } of dates) {
        const mapEntry = await generateDailyMap(size, walls, date);
        if (mapEntry) {
            Object.assign(maps, mapEntry);
        }
    }
    
    // Save to maps.json
    const mapsPath = path.join(__dirname, '..', 'maps.json');
    fs.writeFileSync(mapsPath, JSON.stringify(maps, null, 2));
    
    console.log('\n=== Summary ===');
    console.log(`Generated ${Object.keys(maps).length} maps`);
    console.log(`Saved to: ${mapsPath}`);
    
    // Display summary
    console.log('\nGenerated Maps:');
    for (const [date, data] of Object.entries(maps)) {
        console.log(`  ${date}: ${data.size}x${data.size}, goal=${data.goal}, maxWalls=${data.maxWalls}`);
    }
    
    console.log('\n✓ Map generation complete!');
    console.log('\nTo add more maps, edit the dates array in this script and run again.');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { generateDailyMap, mapToNumeric };
