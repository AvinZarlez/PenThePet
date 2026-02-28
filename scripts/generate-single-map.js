#!/usr/bin/env node

/**
 * Generate a single map and add it to maps.json
 * Used by GitHub Actions workflow for daily map generation
 * 
 * This script uses ONLY MILPSolver (via MapGenerator) for production map generation.
 * BruteForceSolver is NOT used here - it's only for test verification in test/ directory.
 */

const fs = require('fs');
const path = require('path');
const MapGenerator = require('../js/MapGenerator.js');
const MapValidator = require('../js/MapValidator.js');
const { getRandomWord } = require('../js/wordList.js');

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
async function generateSingleMap(date, size, _maxWalls) {
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
    console.log(`  Goal: ${result.goal}, Walls: ${result.maxWalls}`);
    
    // Get a random name for the map
    const mapName = getRandomWord();
    
    console.log('\n✓ Map generated successfully!');
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
        map: result.map,
        optimalSolution: result.optimalSolution
    };
}

/**
 * Get the next available date from maps.json (day after the latest existing date).
 * If no maps exist, returns today's date.
 */
function getNextAvailableDate(mapsPath) {
    if (!fs.existsSync(mapsPath)) {
        return new Date().toISOString().split('T')[0];
    }
    
    const data = fs.readFileSync(mapsPath, 'utf8');
    const maps = JSON.parse(data);
    const dates = Object.keys(maps).sort();
    
    if (dates.length === 0) {
        return new Date().toISOString().split('T')[0];
    }
    
    // Get the day after the latest date (parse manually to avoid timezone issues)
    const [year, month, day] = dates[dates.length - 1].split('-').map(Number);
    const latestDate = new Date(year, month - 1, day);
    latestDate.setDate(latestDate.getDate() + 1);
    const y = latestDate.getFullYear();
    const m = String(latestDate.getMonth() + 1).padStart(2, '0');
    const d = String(latestDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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
    
    const mapsPath = path.join(__dirname, '../maps.json');
    
    // Auto-assign date if not provided
    if (!date) {
        date = getNextAvailableDate(mapsPath);
        console.log(`No date provided, auto-assigned: ${date}`);
    }
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        console.error('Error: Date must be in YYYY-MM-DD format');
        process.exit(1);
    }
    
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
    console.log('✓ Successfully added map to maps.json');
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

module.exports = { generateSingleMap, getNextDayNumber, getNextAvailableDate };
