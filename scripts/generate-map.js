#!/usr/bin/env node

/**
 * Map generation entry point — generates one or more maps and adds them to maps/YYYY.json.
 * Used by the GitHub Actions workflow and for local map generation.
 *
 * Supports:
 *   --date YYYY-MM-DD   Start date (default: next available date after last map)
 *   --size N or N-M     Exact size or a random range picked per map (default: 9)
 *   --count N           Number of maps to generate (default: 1)
 *   --fresh             Replace all existing maps (default: append)
 *   --weave             Randomly insert new maps into the existing list starting
 *                       two days after the current date (incompatible with --fresh)
 *
 * This script uses ONLY MILPSolver (via MapGenerator) for production map generation.
 * BruteForceSolver is NOT used here — it is only for test verification in test/.
 */

const path = require('path');
const MapGenerator = require('../js/generation/MapGenerator.js');
const MapValidator = require('../js/generation/MapValidator.js');
const { generateLevelName } = require('../js/generation/wordList.js');
const { encodeCompactMap, encodeCompactSolution } = require('../js/game/Grid.js');
const CONSTANTS = require('../js/config/constants.js');
const {
    parseSizeInput,
    getRandomSize,
    incrementDate,
    readAllMaps,
    saveMapsToDirectory,
    getNextAvailableDate,
    getNextDayNumber,
    validateMapsDatabase,
    fixMapsDatabase,
    weaveInsert,
} = require('./lib/mapUtils.js');

/**
 * Generate one map with MILP solving and quality validation.
 * Returns null on failure (caller decides whether to abort or continue).
 * @param {string} date - Date key in YYYY-MM-DD format
 * @param {number} size - Grid size
 * @returns {Promise<Object|null>}
 */
async function generateMap(date, size) {
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
        console.error('Failed to generate map — no result returned');
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

    const mapName = generateLevelName();

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
        map: encodeCompactMap(result.map),
        optimalSolution: encodeCompactSolution(result.optimalSolution),
        version: CONSTANTS.INITIAL_MAP_VERSION,
    };
}

/**
 * Main entry point — parses CLI args and drives the generation loop.
 */
async function main() {
    const args = process.argv.slice(2);
    let startDate = null;
    let sizeInput = '9';
    let count = 1;
    let fresh = false;
    let weave = false;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--date' && i + 1 < args.length) {
            startDate = args[i + 1];
        } else if (args[i] === '--size' && i + 1 < args.length) {
            sizeInput = args[i + 1];
        } else if (args[i] === '--count' && i + 1 < args.length) {
            count = parseInt(args[i + 1]);
        } else if (args[i] === '--fresh') {
            fresh = true;
        } else if (args[i] === '--weave') {
            weave = true;
        }
    }

    if (weave && fresh) {
        console.error('Error: --weave and --fresh cannot be used together');
        process.exit(1);
    }

    const mapsDir = path.join(__dirname, '../maps');

    // Parse size input — supports an exact value ("9") or a range ("7-17")
    let parsedSize;
    try {
        parsedSize = parseSizeInput(sizeInput);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }

    console.log('='.repeat(60));
    console.log('Map Generation');
    console.log('='.repeat(60));
    let modeLabel;
    if (fresh) {
        modeLabel = 'FRESH (replace all existing maps)';
    } else if (weave) {
        modeLabel = 'WEAVE (randomly insert into future dates)';
    } else {
        modeLabel = 'APPEND (add to existing maps)';
    }
    console.log(`Mode:  ${modeLabel}`);
    console.log(`Count: ${count}`);
    console.log(`Size:  ${sizeInput}`);
    console.log('='.repeat(60));

    // Load existing maps (skipped when --fresh replaces everything)
    let maps = {};
    if (!fresh) {
        maps = readAllMaps(mapsDir);
        if (Object.keys(maps).length > 0) {
            console.log(`\nLoaded ${Object.keys(maps).length} existing maps`);
        }
    } else {
        console.log('\nStarting fresh — all existing maps will be replaced');
    }

    // Auto-assign start date if not provided
    if (!startDate) {
        startDate = fresh ? new Date().toISOString().split('T')[0] : getNextAvailableDate(mapsDir);
        console.log(`No date provided, auto-assigned${count > 1 ? ' start' : ''}: ${startDate}`);
    } else if (weave) {
        console.warn('Warning: --date is ignored in --weave mode (dates are reassigned by insertion logic)');
    }

    // Reject malformed dates early
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        console.error('Error: Date must be in YYYY-MM-DD format');
        process.exit(1);
    }

    // When generating a single map in append mode, refuse to overwrite an existing date unless --fresh
    if (count === 1 && !fresh && !weave && maps[startDate]) {
        console.error(`Error: Map for ${startDate} already exists`);
        console.error(`Existing map: "${maps[startDate].mapName}" (Day ${maps[startDate].dayNumber})`);
        process.exit(1);
    }

    let nextDayNumber = fresh ? 1 : getNextDayNumber(mapsDir);
    let currentDate = startDate;

    // In weave mode, collect new maps separately before inserting
    const newMapsList = [];

    for (let i = 0; i < count; i++) {
        // When appending a batch, skip over dates that already have maps
        if (!fresh && !weave && count > 1) {
            while (maps[currentDate]) {
                console.log(`Map for ${currentDate} already exists, skipping...`);
                currentDate = incrementDate(currentDate);
            }
        }

        const size = getRandomSize(parsedSize);
        const mapData = await generateMap(currentDate, size);

        if (!mapData) {
            console.error('\n✗ Failed to generate valid map');
            process.exit(1);
        }

        if (weave) {
            newMapsList.push(mapData);
        } else {
            mapData.dayNumber = nextDayNumber++;
            maps[currentDate] = mapData;

            console.log(`\n${'='.repeat(60)}`);
            console.log('✓ Added to maps database');
            console.log(`  Day Number: ${mapData.dayNumber}`);
            console.log(`  Date:       ${currentDate}`);
            console.log(`  Name:       "${mapData.mapName}"`);
            console.log('='.repeat(60));
        }

        currentDate = incrementDate(currentDate);
    }

    // In weave mode, randomly insert new maps into the future portion of the list
    if (weave) {
        const today = new Date().toISOString().split('T')[0];
        const insertionStartDate = incrementDate(incrementDate(today));
        maps = weaveInsert(maps, newMapsList, today);

        console.log(`\n${'='.repeat(60)}`);
        console.log(`✓ Weave-inserted ${count} new map(s) into the schedule`);
        console.log(`  Insertion zone starts: ${insertionStartDate}`);
        console.log('='.repeat(60));
    }

    // Validate and auto-fix database consistency (sequential day numbers, unique names)
    console.log('\nValidating maps database...');
    let dbValidation = validateMapsDatabase(maps);

    if (!dbValidation.valid) {
        console.log(`⚠ Found ${dbValidation.issues.length} issue(s), auto-fixing...`);
        dbValidation.issues.forEach(issue => console.log(`  - ${issue.message}`));
        maps = fixMapsDatabase(maps);
        dbValidation = validateMapsDatabase(maps);
        if (dbValidation.valid) {
            console.log('✓ All issues fixed');
        } else {
            console.error('✗ Some issues could not be fixed automatically:');
            dbValidation.issues.forEach(issue => console.error(`  - ${issue.message}`));
        }
    } else {
        console.log('✓ Database validation passed');
    }

    // Save maps split by year to the maps/ directory
    saveMapsToDirectory(mapsDir, maps);

    const sortedDates = Object.keys(maps).sort();
    console.log(`\n✓ Saved ${sortedDates.length} maps to maps/ directory`);
    if (count > 1) {
        console.log(`✓ Generated ${count} new maps`);
    }

    // Print a summary of all maps now in the directory
    console.log('\nMap Summary:');
    sortedDates.forEach(date => {
        const m = maps[date];
        console.log(`  Day ${m.dayNumber}: ${date} - "${m.mapName}" (${m.size}x${m.size}, goal: ${m.goal}, walls: ${m.maxWalls})`);
    });
}

if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

// Export the generator function and utility pass-throughs for programmatic use and tests
module.exports = {
    generateMap,
    parseSizeInput,
    getRandomSize,
    incrementDate,
    getNextDayNumber,
    getNextAvailableDate,
    weaveInsert,
};
