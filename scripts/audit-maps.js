#!/usr/bin/env node

/**
 * Audit existing maps in maps.json — validates every map against MapValidator.
 * Exits with code 1 if any map fails validation.
 */

const fs = require('fs');
const path = require('path');
const MapValidator = require('../js/MapValidator.js');

function auditMaps() {
    const mapsPath = path.join(__dirname, '../maps.json');
    
    if (!fs.existsSync(mapsPath)) {
        console.error('maps.json not found');
        process.exit(1);
    }
    
    const data = fs.readFileSync(mapsPath, 'utf8');
    const maps = JSON.parse(data);
    
    console.log('='.repeat(60));
    console.log('Auditing Maps in maps.json');
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
