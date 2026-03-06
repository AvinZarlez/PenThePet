#!/usr/bin/env node

/**
 * Generate 200 new maps and interleave them with existing levels.
 *
 * Starting March 8th, 2026, inserts new levels every other day:
 *   March 8 = existing, March 9 = new, March 10 = existing, March 11 = new, ...
 *
 * All existing levels are preserved. New levels are shuffled between them.
 * After all 200 new levels are inserted, remaining existing levels continue.
 */

const path = require('path');
const MapGenerator = require('../js/MapGenerator.js');
const MapValidator = require('../js/MapValidator.js');
const { getRandomWord } = require('../js/wordList.js');
const { TILE_TO_COMPACT_CHAR } = require('../js/tileData.js');
const {
    parseSizeInput,
    getRandomSize,
    readAllMaps,
    saveMapsToDirectory,
    validateMapsDatabase,
    fixMapsDatabase,
} = require('./lib/mapUtils.js');

const INTERLEAVE_START = '2026-03-08';
const NEW_MAP_COUNT = 200;
const SIZE_RANGE = '7-13';

function encodeCompactMap(map2d) {
    return map2d.map(row => row.map(t => TILE_TO_COMPACT_CHAR[t] || 'g').join('')).join('');
}

function encodeCompactSolution(solution) {
    return solution.reduce((acc, pair) => { acc.push(pair[0], pair[1]); return acc; }, []);
}

function incrementDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().split('T')[0];
}

/**
 * Generate a single map.
 */
async function generateSingleMap(size) {
    const generator = new MapGenerator(size);
    let result;
    try {
        result = generator.generate(null);
    } catch (error) {
        return null;
    }
    if (!result) return null;

    const validation = MapValidator.validate(result.map, {
        goalArea: result.goal,
        optimalWallCount: result.maxWalls,
        optimalSolution: result.optimalSolution
    });
    if (!validation.valid) return null;

    return {
        mapName: getRandomWord(),
        size: size,
        goal: result.goal,
        maxWalls: result.maxWalls,
        map: encodeCompactMap(result.map),
        optimalSolution: encodeCompactSolution(result.optimalSolution)
    };
}

async function main() {
    const mapsDir = path.join(__dirname, '../maps');
    const parsedSize = parseSizeInput(SIZE_RANGE);

    console.log('='.repeat(60));
    console.log('Generate and Interleave 200 New Maps');
    console.log('='.repeat(60));

    // Step 1: Read existing maps
    const existingMaps = readAllMaps(mapsDir);
    const allDates = Object.keys(existingMaps).sort();
    console.log(`Loaded ${allDates.length} existing maps`);
    console.log(`First: ${allDates[0]}, Last: ${allDates[allDates.length - 1]}`);

    // Step 2: Split into before and after the interleave start date
    const beforeMaps = {};  // dates < INTERLEAVE_START
    const afterMaps = [];   // dates >= INTERLEAVE_START (ordered array)
    for (const date of allDates) {
        if (date < INTERLEAVE_START) {
            beforeMaps[date] = existingMaps[date];
        } else {
            afterMaps.push(existingMaps[date]);
        }
    }
    console.log(`Before ${INTERLEAVE_START}: ${Object.keys(beforeMaps).length} maps`);
    console.log(`From ${INTERLEAVE_START}: ${afterMaps.length} existing maps to interleave`);

    // Step 3: Generate 200 new maps
    console.log(`\nGenerating ${NEW_MAP_COUNT} new maps (size ${SIZE_RANGE})...`);
    const newMaps = [];
    let failures = 0;
    for (let i = 0; i < NEW_MAP_COUNT; i++) {
        const size = getRandomSize(parsedSize);
        let mapData = null;
        for (let attempt = 0; attempt < 5; attempt++) {
            const trySize = attempt > 2 ? getRandomSize(parsedSize) : size;
            mapData = await generateSingleMap(trySize);
            if (mapData) break;
        }
        if (!mapData) {
            failures++;
            console.error(`  ✗ Failed to generate map ${i + 1}`);
            // Use a fallback size (smaller is more likely to succeed)
            for (let fallbackSize = 7; fallbackSize <= 9; fallbackSize++) {
                mapData = await generateSingleMap(fallbackSize);
                if (mapData) break;
            }
            if (!mapData) {
                console.error(`  ✗ All fallback attempts failed for map ${i + 1}, skipping`);
                continue;
            }
        }
        newMaps.push(mapData);
        if ((i + 1) % 10 === 0) {
            console.log(`  Generated ${i + 1}/${NEW_MAP_COUNT} maps (${newMaps.length} successful)`);
        }
    }
    console.log(`\n✓ Generated ${newMaps.length} new maps (${failures} failures)`);

    // Step 4: Interleave — alternate existing and new maps starting from INTERLEAVE_START
    // Pattern: existing, new, existing, new, ...
    const interleaved = {};

    // Copy all maps before the interleave start date
    Object.assign(interleaved, beforeMaps);

    let currentDate = INTERLEAVE_START;
    let existIdx = 0;
    let newIdx = 0;
    let isExistingTurn = true;

    // Interleave while we have both existing and new maps
    while (existIdx < afterMaps.length || newIdx < newMaps.length) {
        if (isExistingTurn && existIdx < afterMaps.length) {
            const entry = { ...afterMaps[existIdx] };
            entry.date = currentDate;
            interleaved[currentDate] = entry;
            existIdx++;
        } else if (!isExistingTurn && newIdx < newMaps.length) {
            const entry = { ...newMaps[newIdx] };
            entry.date = currentDate;
            interleaved[currentDate] = entry;
            newIdx++;
        } else if (existIdx < afterMaps.length) {
            // Only existing maps left
            const entry = { ...afterMaps[existIdx] };
            entry.date = currentDate;
            interleaved[currentDate] = entry;
            existIdx++;
        } else if (newIdx < newMaps.length) {
            // Only new maps left
            const entry = { ...newMaps[newIdx] };
            entry.date = currentDate;
            interleaved[currentDate] = entry;
            newIdx++;
        }
        currentDate = incrementDate(currentDate);
        isExistingTurn = !isExistingTurn;
    }

    // Step 5: Reassign day numbers sequentially
    const sortedDates = Object.keys(interleaved).sort();
    for (let i = 0; i < sortedDates.length; i++) {
        interleaved[sortedDates[i]].dayNumber = i + 1;
    }

    console.log(`\nTotal maps after interleaving: ${sortedDates.length}`);
    console.log(`Date range: ${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}`);

    // Step 6: Validate and fix database
    console.log('\nValidating maps database...');
    let dbValidation = validateMapsDatabase(interleaved);
    if (!dbValidation.valid) {
        console.log(`⚠ Found ${dbValidation.issues.length} issue(s), auto-fixing...`);
        const fixed = fixMapsDatabase(interleaved);
        dbValidation = validateMapsDatabase(fixed);
        if (dbValidation.valid) {
            console.log('✓ All issues fixed');
        }
        saveMapsToDirectory(mapsDir, fixed);
    } else {
        console.log('✓ Database validation passed');
        saveMapsToDirectory(mapsDir, interleaved);
    }

    console.log(`\n✓ Saved maps to maps/ directory`);
    console.log(`  Existing maps preserved: ${afterMaps.length}`);
    console.log(`  New maps added: ${newMaps.length}`);
}

if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
