#!/usr/bin/env node

/**
 * Generate Daily Maps Script
 * 
 * Generates maps for the game with metadata including:
 * - dayNumber: Sequential ordering (1, 2, 3, ...)
 * - mapName: Random English word
 * - date: Date string in YYYY-MM-DD format
 * - size: Grid size
 * - goal: Maximum achievable area
 * - maxWalls: Minimum walls needed to achieve goal
 * - map: The 2D tile array
 */

const fs = require('fs');
const path = require('path');

// Load modules
const CONSTANTS = require('../js/constants.js');
const MapGenerator = require('../js/MapGenerator.js');
const { getRandomWord } = require('../js/wordList.js');

/**
 * Generate a new map with metadata
 * @param {number} dayNumber - Sequential day number (1, 2, 3, ...)
 * @param {string} date - Date string in YYYY-MM-DD format
 * @param {number} size - Grid size (7-21)
 * @returns {Object} Map data with metadata
 */
function generateMapWithMetadata(dayNumber, date, size) {
    console.log(`\nGenerating map #${dayNumber} for ${date} (size ${size}x${size})...`);
    
    const generator = new MapGenerator(size);
    const result = generator.generate(date);
    
    // Get a random word for the map name
    const mapName = getRandomWord();
    
    const mapData = {
        dayNumber: dayNumber,
        mapName: mapName,
        date: date,
        size: result.map.length,
        goal: result.goal,
        maxWalls: result.maxWalls,
        map: result.map
    };
    
    console.log(`  ✓ Generated "${mapName}" (Day ${dayNumber})`);
    console.log(`    Goal: ${result.goal}, Max Walls: ${result.maxWalls}`);
    
    return mapData;
}

/**
 * Generate multiple maps with sequential day numbers
 * @param {number} count - Number of maps to generate
 * @param {string} startDate - Starting date (YYYY-MM-DD)
 * @param {Array<number>} sizes - Array of grid sizes to cycle through
 * @returns {Object} Maps object keyed by date
 */
function generateMaps(count, startDate, sizes = [7, 9, 11]) {
    const maps = {};
    const start = new Date(startDate);
    
    for (let i = 0; i < count; i++) {
        const dayNumber = i + 1;
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        // Cycle through sizes
        const size = sizes[i % sizes.length];
        
        try {
            const mapData = generateMapWithMetadata(dayNumber, dateString, size);
            maps[dateString] = mapData;
        } catch (error) {
            console.error(`  ✗ Failed to generate map for ${dateString}:`, error.message);
            // Don't stop, continue with next map
        }
    }
    
    return maps;
}

/**
 * Load existing maps and get the next day number
 * @param {string} filePath - Path to maps.json
 * @returns {number} Next day number to use
 */
function getNextDayNumber(filePath) {
    if (!fs.existsSync(filePath)) {
        return 1;
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
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
 * Validate maps database for consistency
 * @param {Object} maps - Maps object keyed by date
 * @returns {Object} Validation results with issues array and fixed flag
 */
function validateMapsDatabase(maps) {
    const issues = [];
    const dates = Object.keys(maps).sort();
    
    // Check A: Only one map per calendar day
    const dateSet = new Set();
    for (const date of dates) {
        if (dateSet.has(date)) {
            issues.push({
                type: 'duplicate_date',
                message: `Duplicate map for date: ${date}`,
                date: date
            });
        }
        dateSet.add(date);
    }
    
    // Check B: No gaps in map numbers
    const dayNumbers = dates.map(date => maps[date].dayNumber).sort((a, b) => a - b);
    for (let i = 0; i < dayNumbers.length; i++) {
        const expected = i + 1;
        if (dayNumbers[i] !== expected) {
            issues.push({
                type: 'gap_in_numbers',
                message: `Gap in day numbers: expected ${expected}, got ${dayNumbers[i]}`,
                expected: expected,
                actual: dayNumbers[i]
            });
            break; // Only report the first gap
        }
    }
    
    // Check C: No two maps have the same name
    const nameMap = new Map();
    for (const date of dates) {
        const mapName = maps[date].mapName;
        if (nameMap.has(mapName)) {
            issues.push({
                type: 'duplicate_name',
                message: `Duplicate map name "${mapName}" found on ${date} and ${nameMap.get(mapName)}`,
                name: mapName,
                dates: [nameMap.get(mapName), date]
            });
        }
        nameMap.set(mapName, date);
    }
    
    return {
        valid: issues.length === 0,
        issues: issues
    };
}

/**
 * Fix issues in maps database
 * @param {Object} maps - Maps object keyed by date
 * @returns {Object} Fixed maps object
 */
function fixMapsDatabase(maps) {
    const fixed = { ...maps };
    const dates = Object.keys(fixed).sort();
    
    // Fix day numbers (no gaps, sequential)
    dates.forEach((date, index) => {
        fixed[date].dayNumber = index + 1;
    });
    
    // Fix duplicate names by appending a number
    const usedNames = new Set();
    for (const date of dates) {
        let mapName = fixed[date].mapName;
        let counter = 1;
        
        while (usedNames.has(mapName)) {
            mapName = `${fixed[date].mapName}-${counter}`;
            counter++;
        }
        
        if (mapName !== fixed[date].mapName) {
            console.log(`  Renamed "${fixed[date].mapName}" to "${mapName}" for ${date}`);
            fixed[date].mapName = mapName;
        }
        
        usedNames.add(mapName);
    }
    
    return fixed;
}

/**
 * Main function to regenerate all maps
 */
function main() {
    const args = process.argv.slice(2);
    const outputPath = path.join(__dirname, '../maps.json');
    
    // Parse command line arguments
    let count = 10;  // Default: generate 10 maps
    let startDate = new Date().toISOString().split('T')[0];  // Default: today
    let sizes = [7, 9, 11];  // Default sizes to cycle through
    let fresh = false;  // Default: append to existing maps
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--count' && i + 1 < args.length) {
            count = parseInt(args[i + 1]);
        } else if (args[i] === '--start-date' && i + 1 < args.length) {
            startDate = args[i + 1];
        } else if (args[i] === '--sizes' && i + 1 < args.length) {
            sizes = args[i + 1].split(',').map(s => parseInt(s.trim()));
        } else if (args[i] === '--fresh') {
            fresh = true;
        }
    }
    
    console.log('='.repeat(60));
    console.log('Map Generation Script');
    console.log('='.repeat(60));
    console.log(`Mode: ${fresh ? 'FRESH (replace all)' : 'APPEND (add to existing)'}`);
    console.log(`Count: ${count} maps`);
    console.log(`Start Date: ${startDate}`);
    console.log(`Sizes: ${sizes.join(', ')}`);
    console.log('='.repeat(60));
    
    let maps = {};
    let nextDayNumber = 1;
    
    // Load existing maps if not fresh
    if (!fresh && fs.existsSync(outputPath)) {
        const data = fs.readFileSync(outputPath, 'utf8');
        maps = JSON.parse(data);
        nextDayNumber = getNextDayNumber(outputPath);
        console.log(`\nLoaded ${Object.keys(maps).length} existing maps`);
        console.log(`Starting from day number ${nextDayNumber}`);
    } else if (fresh) {
        console.log('\nStarting fresh - all existing maps will be replaced');
    }
    
    // Generate new maps
    console.log(`\nGenerating ${count} new maps...`);
    const newMaps = generateMaps(count, startDate, sizes);
    
    // Update day numbers for fresh generation
    if (fresh) {
        const sortedDates = Object.keys(newMaps).sort();
        sortedDates.forEach((date, index) => {
            newMaps[date].dayNumber = index + 1;
        });
        maps = newMaps;
    } else {
        // Merge new maps with existing
        Object.keys(newMaps).forEach((date, index) => {
            newMaps[date].dayNumber = nextDayNumber + index;
            maps[date] = newMaps[date];
        });
    }
    
    // Validate and fix database before saving
    console.log('\nValidating maps database...');
    let validation = validateMapsDatabase(maps);
    
    if (!validation.valid) {
        console.log(`\n⚠ Found ${validation.issues.length} issue(s):`);
        validation.issues.forEach(issue => {
            console.log(`  - ${issue.message}`);
        });
        
        console.log('\nFixing issues...');
        maps = fixMapsDatabase(maps);
        
        // Validate again
        validation = validateMapsDatabase(maps);
        if (validation.valid) {
            console.log('✓ All issues fixed successfully!');
        } else {
            console.error('✗ Some issues could not be fixed automatically:');
            validation.issues.forEach(issue => {
                console.error(`  - ${issue.message}`);
            });
        }
    } else {
        console.log('✓ Database validation passed!');
    }
    
    // Save to file
    fs.writeFileSync(outputPath, JSON.stringify(maps, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log(`✓ Successfully saved ${Object.keys(maps).length} maps to ${outputPath}`);
    console.log('='.repeat(60));
    
    // Show summary
    console.log('\nMap Summary:');
    const sortedDates = Object.keys(maps).sort();
    sortedDates.forEach(date => {
        const map = maps[date];
        console.log(`  Day ${map.dayNumber}: ${date} - "${map.mapName}" (${map.size}x${map.size}, goal: ${map.goal}, walls: ${map.maxWalls})`);
    });
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { 
    generateMapWithMetadata, 
    generateMaps, 
    validateMapsDatabase, 
    fixMapsDatabase, 
    getNextDayNumber 
};
