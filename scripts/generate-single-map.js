#!/usr/bin/env node

/**
 * Generate a single map (or multiple maps) and add them to maps.json
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
 * Parse a size input string into either an exact size or a range.
 * Accepts:
 *   - Exact: "9"  → { type: 'exact', value: 9 }
 *   - Range: "7-13" → { type: 'range', min: 7, max: 13 }
 * @param {string|number} sizeStr - Size string or number
 * @returns {{ type: 'exact', value: number } | { type: 'range', min: number, max: number }}
 */
function parseSizeInput(sizeStr) {
    const str = String(sizeStr).trim();
    const rangeMatch = str.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
        const min = parseInt(rangeMatch[1]);
        const max = parseInt(rangeMatch[2]);
        if (min > max) {
            throw new Error(`Invalid size range "${str}": min (${min}) must be <= max (${max})`);
        }
        return { type: 'range', min, max };
    }
    const exact = parseInt(str);
    if (isNaN(exact)) {
        throw new Error(`Invalid size "${str}": must be a number or range (e.g., "9" or "7-13")`);
    }
    return { type: 'exact', value: exact };
}

/**
 * Pick a random integer size from a parsed size input.
 * @param {{ type: 'exact', value: number } | { type: 'range', min: number, max: number }} parsed
 * @returns {number}
 */
function getRandomSize(parsed) {
    if (parsed.type === 'range') {
        const { min, max } = parsed;
        return min + Math.floor(Math.random() * (max - min + 1));
    }
    return parsed.value;
}

/**
 * Return the date string for the day after the given date.
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Next date in YYYY-MM-DD format
 */
function incrementDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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
    let startDate = null;
    let sizeInput = '9';
    let count = 1;
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--date' && i + 1 < args.length) {
            startDate = args[i + 1];
        } else if (args[i] === '--size' && i + 1 < args.length) {
            sizeInput = args[i + 1];
        } else if (args[i] === '--count' && i + 1 < args.length) {
            count = parseInt(args[i + 1]);
        }
    }
    
    const mapsPath = path.join(__dirname, '../maps.json');

    // Parse size input (supports "9" or "7-13")
    let parsedSize;
    try {
        parsedSize = parseSizeInput(sizeInput);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
    
    // Load existing maps
    let maps = {};
    if (fs.existsSync(mapsPath)) {
        const data = fs.readFileSync(mapsPath, 'utf8');
        maps = JSON.parse(data);
    }

    // Auto-assign start date if not provided
    if (!startDate) {
        startDate = getNextAvailableDate(mapsPath);
        console.log(`No date provided, auto-assigned${count > 1 ? ' start' : ''}: ${startDate}`);
    }
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        console.error('Error: Date must be in YYYY-MM-DD format');
        process.exit(1);
    }

    // For single map with an explicit date, error if date already exists (backwards-compat)
    if (count === 1 && maps[startDate]) {
        console.error(`Error: Map for ${startDate} already exists`);
        console.error(`Existing map: "${maps[startDate].mapName}" (Day ${maps[startDate].dayNumber})`);
        process.exit(1);
    }

    let nextDayNumber = getNextDayNumber(mapsPath);
    let currentDate = startDate;

    for (let i = 0; i < count; i++) {
        // Skip dates that already have maps when generating multiple maps
        if (count > 1) {
            while (maps[currentDate]) {
                console.log(`Map for ${currentDate} already exists, skipping...`);
                currentDate = incrementDate(currentDate);
            }
        }

        // Pick size for this map (random if range)
        const size = getRandomSize(parsedSize);

        // Generate the map
        const mapData = await generateSingleMap(currentDate, size);
        
        if (!mapData) {
            console.error('\n✗ Failed to generate valid map');
            process.exit(1);
        }

        // Assign day number
        mapData.dayNumber = nextDayNumber++;
        maps[currentDate] = mapData;

        console.log(`\n${'='.repeat(60)}`);
        console.log('✓ Successfully added map to maps.json');
        console.log(`  Day Number: ${mapData.dayNumber}`);
        console.log(`  Date: ${currentDate}`);
        console.log(`  Name: "${mapData.mapName}"`);
        console.log('='.repeat(60));

        currentDate = incrementDate(currentDate);
    }

    // Sort maps by date and save
    const sortedMaps = {};
    Object.keys(maps)
        .sort()
        .forEach(key => {
            sortedMaps[key] = maps[key];
        });
    
    fs.writeFileSync(mapsPath, JSON.stringify(sortedMaps, null, 2));

    if (count > 1) {
        console.log(`\n✓ Generated ${count} maps successfully`);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { generateSingleMap, getNextDayNumber, getNextAvailableDate, parseSizeInput, getRandomSize, incrementDate };
