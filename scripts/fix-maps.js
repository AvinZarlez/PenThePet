#!/usr/bin/env node

/**
 * Fix existing maps to comply with the new tile-pruning validation.
 *
 * For every map dated after 2026-03-10:
 *   1. Decode the compact map string to a 2D array.
 *   2. Re-solve the map to obtain the current optimal solution.
 *   3. Prune unnecessary special tiles:
 *      - Stars inside the penned area whose removal does not change wall positions.
 *      - Bees anywhere on the map whose removal does not change wall positions.
 *   4. Validate that the pruned map still has at least one star and one bee.
 *      Maps that fail this check are left unchanged and flagged.
 *   5. Save updated compact maps (and revised goal/solution) back to the JSON files.
 *
 * Requires the MILP solver (Python 3 + PuLP + CBC) to be available.
 * Run from the repository root:
 *   node scripts/fix-maps.js [--date YYYY-MM-DD]
 *
 * Options:
 *   --date YYYY-MM-DD   Only process maps on or after this date (default: 2026-03-11)
 *   --dry-run           Print what would change without writing files
 */

const path = require('path');
const MapGenerator = require('../js/MapGenerator.js');
const MapValidator = require('../js/MapValidator.js');
const { parseCompactMap, parseCompactSolution } = require('../js/Grid.js');
const { TILE_TO_COMPACT_CHAR } = require('../js/tileData.js');
const { readAllMaps, saveMapsToDirectory } = require('./lib/mapUtils.js');

const CUTOFF_DATE = '2026-03-10'; // Process maps strictly after this date

/**
 * Encode a 2D map array into a compact single-character-per-tile string.
 * @param {Array} map2d - 2D array of tile type strings
 * @returns {string} Compact map string (row-major)
 */
function encodeCompactMap(map2d) {
    return map2d.map(row => row.map(t => TILE_TO_COMPACT_CHAR[t] || 'g').join('')).join('');
}

/**
 * Encode an optimal solution (array of [row,col] pairs) into a flat array.
 * @param {Array} solution - Array of [row, col] coordinate pairs
 * @returns {Array<number>} Flat array [r0, c0, r1, c1, ...]
 */
function encodeCompactSolution(solution) {
    return solution.reduce((acc, pair) => { acc.push(pair[0], pair[1]); return acc; }, []);
}

/**
 * Process a single map entry: prune unnecessary special tiles and validate.
 * Returns the updated map entry, or null if the map could not be fixed.
 *
 * @param {string} date
 * @param {Object} mapData - Raw map entry from the JSON database
 * @param {boolean} dryRun - If true, do not write changes
 * @returns {{ changed: boolean, entry: Object }|null}
 */
function processMap(date, mapData) {
    const map2d = parseCompactMap(mapData.map, mapData.size);
    const generator = new MapGenerator(mapData.size);

    // Re-solve with existing wall budget to get current optimal solution
    const solution = generator.calculateGoal(map2d, mapData.maxWalls);
    if (solution === null) {
        console.error(`  ✗ Could not solve map — skipping`);
        return null;
    }

    const originalCompact = mapData.map;

    // Prune unnecessary special tiles
    const pruned = generator._pruneUnnecessarySpecialTiles(map2d, mapData.maxWalls, solution);
    if (pruned === null) {
        console.error(`  ✗ Pruning failed — skipping`);
        return null;
    }

    const newCompact = encodeCompactMap(pruned.map);
    const changed = newCompact !== originalCompact;

    if (!changed) {
        return { changed: false, entry: mapData };
    }

    // Validate the pruned map meets all requirements (including star/bee)
    const validation = MapValidator.validate(pruned.map, {
        ...pruned.solution,
        maxWalls: pruned.solution.optimalWallCount
    });

    if (!validation.valid) {
        console.warn(`  ⚠ Pruned map fails validation — leaving unchanged:`);
        validation.errors.forEach(e => console.warn(`    - ${e}`));
        return { changed: false, entry: mapData };
    }

    // Reconstruct the map entry with updated values
    const updatedEntry = {
        ...mapData,
        map: newCompact,
        goal: pruned.solution.goalArea,
        maxWalls: pruned.solution.optimalWallCount,
        optimalSolution: encodeCompactSolution(pruned.solution.optimalSolution)
    };

    return { changed: true, entry: updatedEntry };
}

async function main() {
    const args = process.argv.slice(2);
    let cutoffDate = CUTOFF_DATE;
    let dryRun = false;
    let maxSize = Infinity;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--date' && i + 1 < args.length) {
            cutoffDate = args[i + 1];
        } else if (args[i] === '--dry-run') {
            dryRun = true;
        } else if (args[i] === '--max-size' && i + 1 < args.length) {
            maxSize = parseInt(args[i + 1]);
        }
    }

    const mapsDir = path.join(__dirname, '../maps');
    const maps = readAllMaps(mapsDir);

    const dates = Object.keys(maps)
        .filter(d => d > cutoffDate && maps[d].size <= maxSize)
        .sort();

    console.log('='.repeat(60));
    console.log(`Fix Maps — pruning unnecessary special tiles`);
    console.log(`Processing ${dates.length} maps after ${cutoffDate}${maxSize < Infinity ? ` (size ≤ ${maxSize})` : ''}`);
    if (dryRun) console.log('DRY RUN — no files will be written');
    console.log('='.repeat(60));

    let changed = 0, skipped = 0, failed = 0;

    for (const date of dates) {
        const mapData = maps[date];
        process.stdout.write(`\n${date} "${mapData.mapName}" (${mapData.size}×${mapData.size})... `);

        const result = processMap(date, mapData);

        if (result === null) {
            process.stdout.write('FAILED\n');
            failed++;
            continue;
        }

        if (!result.changed) {
            process.stdout.write('unchanged\n');
            skipped++;
            continue;
        }

        process.stdout.write('updated\n');
        // Show what changed
        const oldMap = mapData.map;
        const newMap = result.entry.map;
        let starsRemoved = 0, beesRemoved = 0;
        for (let i = 0; i < oldMap.length; i++) {
            if (oldMap[i] === 's' && newMap[i] === 'g') starsRemoved++;
            if (oldMap[i] === 'b' && newMap[i] === 'g') beesRemoved++;
        }
        if (starsRemoved > 0) console.log(`  Removed ${starsRemoved} unnecessary star(s)`);
        if (beesRemoved > 0)  console.log(`  Removed ${beesRemoved} unnecessary bee(s)`);
        console.log(`  Goal: ${mapData.goal} → ${result.entry.goal}, Walls: ${mapData.maxWalls} → ${result.entry.maxWalls}`);

        maps[date] = result.entry;
        changed++;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`Summary: ${changed} updated, ${skipped} unchanged, ${failed} failed`);

    if (!dryRun && changed > 0) {
        saveMapsToDirectory(mapsDir, maps);
        console.log(`✓ Saved updated maps to ${mapsDir}`);
    } else if (changed > 0) {
        console.log('(dry-run: no files written)');
    }

    console.log('='.repeat(60));

    if (failed > 0) {
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { processMap, encodeCompactMap, encodeCompactSolution };
