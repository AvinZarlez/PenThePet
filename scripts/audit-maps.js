#!/usr/bin/env node

/**
 * Audit existing maps in maps/ — validates every map against MapValidator.
 * Exits with code 1 if any map fails validation.
 */

const path = require('path');
const MapValidator = require('../js/MapValidator.js');
const { readAllMaps } = require('./lib/mapUtils.js');

function auditMaps() {
    const mapsDir = path.join(__dirname, '../maps');

    const maps = readAllMaps(mapsDir);

    if (Object.keys(maps).length === 0) {
        console.error('No maps found in maps/ directory');
        process.exit(1);
    }

    console.log('='.repeat(60));
    console.log('Auditing Maps in maps/ directory');
    console.log('='.repeat(60));
    
    const dates = Object.keys(maps).sort();
    const issues = [];
    
    for (const date of dates) {
        const mapData = maps[date];
        console.log(`\nChecking ${date} - "${mapData.mapName}" (Day ${mapData.dayNumber})`);
        console.log(`  Size: ${mapData.size}x${mapData.size}, Goal: ${mapData.goal}, Walls: ${mapData.maxWalls}`);
        
        const validation = MapValidator.validate(mapData.map, {
            goalArea: mapData.goal,
            optimalWallCount: mapData.maxWalls,
            optimalSolution: mapData.optimalSolution || []
        });
        
        if (!validation.valid) {
            console.log('  ✗ FAILED VALIDATION:');
            validation.errors.forEach(err => {
                console.log(`    - ${err}`);
                issues.push({ date, mapName: mapData.mapName, error: err });
            });
        } else {
            console.log('  ✓ Passed validation');
        }
    }
    
    console.log('\n' + '='.repeat(60));
    if (issues.length === 0) {
        console.log('✓ All maps passed validation!');
    } else {
        console.log(`✗ Found ${issues.length} issues:`);
        issues.forEach(issue => {
            console.log(`  ${issue.date} - "${issue.mapName}": ${issue.error}`);
        });
        console.log('\nRecommendation: Regenerate maps that failed validation');
    }
    console.log('='.repeat(60));
    
    return issues.length === 0;
}

if (require.main === module) {
    const success = auditMaps();
    process.exit(success ? 0 : 1);
}

module.exports = { auditMaps };
