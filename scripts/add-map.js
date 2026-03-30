#!/usr/bin/env node

const path = require('path');

const { decodeEditorMapCode, solveAndValidateEditorMap } = require('./lib/levelEditorMap.js');
const { getNextAvailableDate, getNextDayNumber, readAllMaps, saveMapsToDirectory, validateMapsDatabase, fixMapsDatabase } = require('./lib/mapUtils.js');

async function main() {
    const args = process.argv.slice(2);
    let mapCode = '';
    let date = '';
    let mapName = '';

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--map-code' && i + 1 < args.length) {
            mapCode = args[i + 1];
        } else if (args[i] === '--date' && i + 1 < args.length) {
            date = args[i + 1];
        } else if (args[i] === '--map-name' && i + 1 < args.length) {
            mapName = args[i + 1];
        }
    }

    if (!mapCode) {
        throw new Error('Missing required --map-code');
    }

    const decoded = decodeEditorMapCode(mapCode);
    const solved = solveAndValidateEditorMap({
        size: decoded.size,
        levelName: mapName || decoded.mapName,
        map: decoded.map,
        maxWalls: decoded.maxWalls,
    });
    if (!solved.ok) {
        const details = solved.validationErrors && solved.validationErrors.length
            ? solved.validationErrors.join('; ')
            : solved.error;
        throw new Error(`Map failed solver/validation: ${details}`);
    }

    const mapsDir = path.join(__dirname, '../maps');
    const maps = readAllMaps(mapsDir);
    const nextDate = date || getNextAvailableDate(mapsDir);
    if (maps[nextDate]) {
        throw new Error(`Map already exists for date ${nextDate}`);
    }
    const dayNumber = getNextDayNumber(mapsDir);
    maps[nextDate] = {
        date: nextDate,
        mapName: solved.mapData.mapName,
        dayNumber,
        size: solved.mapData.size,
        goal: solved.mapData.goal,
        maxWalls: solved.mapData.maxWalls,
        map: solved.mapData.map,
        optimalSolution: solved.mapData.optimalSolution,
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
        throw new Error(`Maps database invalid after insert: ${validation.issues.map((i) => i.message).join('; ')}`);
    }
    saveMapsToDirectory(mapsDir, outputMaps);
    console.log(`Added map for ${nextDate}: "${solved.mapData.mapName}"`);
}

main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
});
