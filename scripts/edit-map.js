#!/usr/bin/env node

const path = require('path');

const { decodeEditorMapCode, solveAndValidateEditorMap } = require('./lib/levelEditorMap.js');
const { readAllMaps, saveMapsToDirectory, validateMapsDatabase, fixMapsDatabase } = require('./lib/mapUtils.js');

async function main() {
    const args = process.argv.slice(2);
    let mapCode = '';
    let date = '';
    let dayNumber = null;
    let mapName = '';

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--map-code' && i + 1 < args.length) {
            mapCode = args[i + 1];
        } else if (args[i] === '--date' && i + 1 < args.length) {
            date = args[i + 1];
        } else if (args[i] === '--day-number' && i + 1 < args.length) {
            dayNumber = parseInt(args[i + 1], 10);
        } else if (args[i] === '--map-name' && i + 1 < args.length) {
            mapName = args[i + 1];
        }
    }

    if (!mapCode) {
        throw new Error('Missing required --map-code');
    }
    if (!date && dayNumber === null) {
        throw new Error('Must specify either --date (YYYY-MM-DD) or --day-number');
    }
    if (date && dayNumber !== null) {
        throw new Error('Specify only one of --date or --day-number, not both');
    }

    const mapsDir = path.join(__dirname, '../maps');
    const maps = readAllMaps(mapsDir);

    // Resolve the target date
    let targetDate = date;
    if (dayNumber !== null) {
        targetDate = Object.keys(maps).find((d) => maps[d].dayNumber === dayNumber) || null;
        if (!targetDate) {
            throw new Error(`No map found with day number ${dayNumber}`);
        }
    }

    if (!maps[targetDate]) {
        throw new Error(`No map found for date ${targetDate}`);
    }

    const existingMap = maps[targetDate];

    const decoded = decodeEditorMapCode(mapCode);
    const solved = solveAndValidateEditorMap({
        size: decoded.size,
        levelName: mapName || decoded.mapName || existingMap.mapName,
        map: decoded.map,
        maxWalls: decoded.maxWalls,
    });
    if (!solved.ok) {
        const details = solved.validationErrors && solved.validationErrors.length
            ? solved.validationErrors.join('; ')
            : solved.error;
        throw new Error(`Map failed solver/validation: ${details}`);
    }

    maps[targetDate] = {
        date: targetDate,
        mapName: solved.mapData.mapName,
        dayNumber: existingMap.dayNumber,
        size: solved.mapData.size,
        goal: solved.mapData.goal,
        maxWalls: solved.mapData.maxWalls,
        map: solved.mapData.map,
        optimalSolution: solved.mapData.optimalSolution,
        version: (existingMap.version || 0) + 1,
    };

    let validation = validateMapsDatabase(maps);
    let outputMaps = maps;
    if (!validation.valid) {
        console.log(`Fixing ${validation.issues.length} map database issue(s) before save...`);
        validation.issues.forEach((issue) => console.log(`  - ${issue.message}`));
        outputMaps = fixMapsDatabase(maps);
        validation = validateMapsDatabase(outputMaps);
    }
    if (!validation.valid) {
        throw new Error(`Maps database invalid after edit: ${validation.issues.map((i) => i.message).join('; ')}`);
    }
    saveMapsToDirectory(mapsDir, outputMaps);
    console.log(`Updated map for ${targetDate} (day ${existingMap.dayNumber}): "${solved.mapData.mapName}"`);
}

main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
});
