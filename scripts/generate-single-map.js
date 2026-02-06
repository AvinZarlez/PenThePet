#!/usr/bin/env node

/**
 * Generate a single map and add it to maps.json
 * Used by GitHub Actions workflow for daily map generation
 */

const fs = require('fs');
const path = require('path');
const MapGenerator = require('../js/MapGenerator.js');
const MapValidator = require('../js/MapValidator.js');
const BruteForceSolver = require('../test/BruteForceSolver.js');
const { getRandomWord } = require('../js/wordList.js');

/**
 * Convert map from string format to numeric format
 */
function mapToNumeric(stringMap) {
    return stringMap.map(row => row.map(tile => {
        if (tile === 'water') return 0;
        if (tile === 'grass') return 1;
        if (tile === 'home') return 2;
        return 1;
    }));
}

/**
 * Get the next day number from maps.json
 */
function getNextDayNumber(mapsPath) {
    if (!fs.existsSync(mapsPath)) {
        return 1;
    }
    
    const data = fs.readFileSync(mapsPath, 'utf8');
    const maps = JSON.parse(data);
    
    let maxDay = 0;
    for (const dateKey in maps) {
        if (maps[dateKey].dayNumber && maps[dateKey].dayNumber > maxDay) {
            maxDay = maps[dateKey].dayNumber;
        }
    }
    
    return maxDay + 1;
}

/**
 * Generate a single map with validation and verification
 */
async function generateSingleMap(date, size, maxWalls) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Generating map for ${date} (${size}x${size})`);
    console.log('='.repeat(60));
    
    const generator = new MapGenerator(size, { grass: 0.7, water: 0.3 });
    let result;
    
    try {
        result = generator.generate(null);
    } catch (error) {
        console.error(`Failed to generate map: ${error.message}`);
        return null;
    }
    
    if (!result) {
        console.error('Failed to generate map - no result returned');
        return null;
    }
    
    // Validate the map meets quality standards
    console.log('\nValidating map quality...');
    const validation = MapValidator.validate(result.map, {
        goalArea: result.goal,
        optimalWallCount: result.maxWalls,
        optimalSolution: result.optimalSolution
    });
    
    if (!validation.valid) {
        console.error('✗ Generated map failed validation:');
        validation.errors.forEach(err => console.error(`  - ${err}`));
        return null;
    }
    
    console.log('✓ Map passed quality validation');
    
    let verifiedGoal = result.goal;
    let optimalWallCount = result.maxWalls;
    
    // For maps up to 7x7, verify with brute force for accuracy
    if (size <= 7) {
        console.log('\nRunning brute force verification...');
        const numericMap = mapToNumeric(result.map);
        const bruteStart = Date.now();
        
        try {
            const bruteResult = BruteForceSolver.solveMap(numericMap, maxWalls);
            const bruteDuration = Date.now() - bruteStart;
            
            if (bruteResult) {
                verifiedGoal = bruteResult.goalArea;
                optimalWallCount = bruteResult.wallPositions.length;
                const match = verifiedGoal === result.goal;
                
                console.log(`  Exhaustive: goal=${result.goal}, walls=${result.maxWalls}`);
                console.log(`  Brute force: goal=${verifiedGoal}, walls=${optimalWallCount}`);
                console.log(`  Match: ${match ? 'YES ✓' : 'NO ✗'}`);
                console.log(`  Verification took ${bruteDuration}ms`);
                
                // Use brute force result as it's guaranteed accurate
                result.goal = verifiedGoal;
                result.maxWalls = optimalWallCount;
            } else {
                console.warn('  ⚠ Brute force could not find solution, using exhaustive search result');
            }
        } catch (error) {
            console.warn(`  ⚠ Brute force verification failed: ${error.message}`);
            console.warn('  Using exhaustive search result');
        }
    } else {
        console.log('\n✓ Using exhaustive search result (map too large for brute force verification)');
        console.log(`  Goal: ${result.goal}, Walls: ${optimalWallCount}`);
    }
    
    // Get a random name for the map
    const mapName = getRandomWord();
    
    console.log(`\n✓ Map generated successfully!`);
    console.log(`  Name: "${mapName}"`);
    console.log(`  Goal: ${result.goal}`);
    console.log(`  Max Walls: ${result.maxWalls}`);
    console.log(`  Size: ${size}x${size}`);
    
    return {
        date: date,
        mapName: mapName,
        size: size,
        goal: result.goal,
        maxWalls: result.maxWalls,
        map: result.map
    };
}

/**
 * Main function
 */
async function main() {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let date = null;
    let size = 9;
    let maxWalls = 15;
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--date' && i + 1 < args.length) {
            date = args[i + 1];
        } else if (args[i] === '--size' && i + 1 < args.length) {
            size = parseInt(args[i + 1]);
        } else if (args[i] === '--max-walls' && i + 1 < args.length) {
            maxWalls = parseInt(args[i + 1]);
        }
    }
    
    if (!date) {
        console.error('Error: --date parameter is required (YYYY-MM-DD format)');
        process.exit(1);
    }
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        console.error('Error: Date must be in YYYY-MM-DD format');
        process.exit(1);
    }
    
    const mapsPath = path.join(__dirname, '../maps.json');
    
    // Load existing maps
    let maps = {};
    if (fs.existsSync(mapsPath)) {
        const data = fs.readFileSync(mapsPath, 'utf8');
        maps = JSON.parse(data);
        
        // Check if map for this date already exists
        if (maps[date]) {
            console.error(`Error: Map for ${date} already exists`);
            console.error(`Existing map: "${maps[date].mapName}" (Day ${maps[date].dayNumber})`);
            process.exit(1);
        }
    }
    
    // Generate the map
    const mapData = await generateSingleMap(date, size, maxWalls);
    
    if (!mapData) {
        console.error('\n✗ Failed to generate valid map');
        process.exit(1);
    }
    
    // Get next day number
    const dayNumber = getNextDayNumber(mapsPath);
    
    // Add day number to map data
    mapData.dayNumber = dayNumber;
    
    // Add to maps object
    maps[date] = mapData;
    
    // Sort maps by date
    const sortedMaps = {};
    Object.keys(maps)
        .sort()
        .forEach(key => {
            sortedMaps[key] = maps[key];
        });
    
    // Save to file
    fs.writeFileSync(mapsPath, JSON.stringify(sortedMaps, null, 2));
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✓ Successfully added map to maps.json`);
    console.log(`  Day Number: ${dayNumber}`);
    console.log(`  Date: ${date}`);
    console.log(`  Name: "${mapData.mapName}"`);
    console.log('='.repeat(60));
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { generateSingleMap, getNextDayNumber, mapToNumeric };
