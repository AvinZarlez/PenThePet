/**
 * Ground Truth Generator for Test Maps
 * 
 * PURPOSE:
 * This utility generates verified test maps with ground truth optimal solutions
 * using the BruteForceSolver. It is used to:
 * 1. Generate test-maps-db.json with verified optimal solutions
 * 2. Validate MILPSolver accuracy by comparing against brute force
 * 3. Provide ground truth data for unit tests
 * 
 * IMPORTANT:
 * - This is a TEST UTILITY, not production code
 * - Only works for small maps (≤7x7) due to brute force computational limits
 * - BruteForceSolver is the ground truth reference
 * - Run this to regenerate test-maps-db.json when needed
 * 
 * USAGE:
 *   node test/test-map-generation.js
 * 
 * OUTPUT FILES:
 *   - test-maps-db.json: Verified test maps with ground truth solutions
 *   - test-results.json: Detailed comparison results
 *   - test-summary.txt: Human-readable summary
 */

// Import required modules
const CONFIG = require('../js/config.js');
const MapGenerator = require('../js/MapGenerator.js');
const MILPSolver = require('../js/MILPSolver.js');
const BruteForceSolver = require('./BruteForceSolver.js');
const fs = require('fs');
const path = require('path');

class MapGenerationTester {
    constructor() {
        this.testResults = [];
        this.testMapsDB = [];
    }
    
    /**
     * Convert string-based map to numeric format for solvers
     */
    mapToNumeric(stringMap) {
        return stringMap.map(row => row.map(tile => {
            if (tile === 'water') return 0;
            if (tile === 'grass') return 1;
            if (tile === 'home') return 2;
            if (tile === 'wall') return 5;
            return 1;
        }));
    }
    
    /**
     * Test a single map
     */
    testMap(stringMap, mapSize, maxWalls) {
        console.log('\n' + '='.repeat(80));
        console.log(`Testing ${mapSize}x${mapSize} map with max ${maxWalls} walls`);
        console.log('='.repeat(80));
        
        const numericMap = this.mapToNumeric(stringMap);
        
        // Find solution with brute force
        console.log('\n--- Running Brute Force Solver ---');
        const startBrute = Date.now();
        const bruteSolution = BruteForceSolver.solveMap(numericMap, maxWalls);
        const bruteDuration = Date.now() - startBrute;
        
        if (!bruteSolution) {
            console.error('Brute force solver could not find a solution!');
            return null;
        }
        
        console.log(`Brute force result: Area = ${bruteSolution.goalArea}, Time = ${bruteDuration}ms`);
        
        // Find solution with MILP solver
        console.log('\n--- Running MILP Solver ---');
        const startMILP = Date.now();
        const milpSolution = MILPSolver.solveMap(numericMap, maxWalls);
        const milpDuration = Date.now() - startMILP;
        
        if (!milpSolution) {
            console.error('MILP solver could not find a solution!');
            return null;
        }
        
        console.log(`MILP result: Area = ${milpSolution.goalArea}, Time = ${milpDuration}ms`);
        
        // Compare results
        const isCorrect = milpSolution.goalArea === bruteSolution.goalArea;
        const difference = milpSolution.goalArea - bruteSolution.goalArea;
        
        console.log('\n--- Comparison ---');
        console.log(`Correct: ${isCorrect ? 'YES ✓' : 'NO ✗'}`);
        console.log(`Brute Force Area: ${bruteSolution.goalArea}`);
        console.log(`MILP Area: ${milpSolution.goalArea}`);
        if (!isCorrect) {
            console.log(`Difference: ${difference} (MILP is ${difference > 0 ? 'larger' : 'smaller'})`);
        }
        console.log(`Speed: Brute force took ${bruteDuration}ms, MILP took ${milpDuration}ms`);
        
        const result = {
            mapSize,
            maxWalls,
            bruteForceArea: bruteSolution.goalArea,
            bruteForceWalls: bruteSolution.wallPositions.length,
            bruteForceCombinations: bruteSolution.combinations,
            bruteForceDuration: bruteDuration,
            milpArea: milpSolution.goalArea,
            milpDuration: milpDuration,
            isCorrect,
            difference
        };
        
        this.testResults.push(result);
        
        // Save to test map database
        this.testMapsDB.push({
            size: mapSize,
            maxWalls,
            goal: bruteSolution.goalArea,
            optimalWallCount: bruteSolution.wallPositions.length,
            map: stringMap
        });
        
        return result;
    }
    
    /**
     * Generate and test multiple maps
     */
    async runTests(mapSizes = [5, 6, 7], wallCounts = [5, 7, 9], mapsPerConfig = 1) {
        console.log('Starting Map Generation Tests');
        console.log(`Configurations: ${mapSizes.length} sizes x ${wallCounts.length} wall counts x ${mapsPerConfig} maps`);
        console.log(`Total maps to test: ${mapSizes.length * wallCounts.length * mapsPerConfig}`);
        
        for (const size of mapSizes) {
            for (const maxWalls of wallCounts) {
                for (let i = 0; i < mapsPerConfig; i++) {
                    const generator = new MapGenerator(size, CONFIG.tileDistribution);
                    const result = generator.generate(null, maxWalls);
                    
                    if (result) {
                        this.testMap(result.map, size, maxWalls);
                    } else {
                        console.error(`Failed to generate map for size=${size}, maxWalls=${maxWalls}`);
                    }
                }
            }
        }
        
        this.printSummary();
        this.saveResults();
    }
    
    /**
     * Test a specific map from maps.json
     */
    testExistingMap(mapData) {
        console.log('\n' + '='.repeat(80));
        console.log('Testing existing map from maps.json');
        console.log('='.repeat(80));
        
        return this.testMap(mapData.map, mapData.size, 9); // Assume 9 walls for existing maps
    }
    
    /**
     * Print summary of all tests
     */
    printSummary() {
        console.log('\n' + '='.repeat(80));
        console.log('TEST SUMMARY');
        console.log('='.repeat(80));
        
        const correct = this.testResults.filter(r => r.isCorrect).length;
        const total = this.testResults.length;
        const accuracy = (correct / total * 100).toFixed(1);
        
        console.log(`Total tests: ${total}`);
        console.log(`Correct: ${correct} (${accuracy}%)`);
        console.log(`Incorrect: ${total - correct}`);
        
        if (total - correct > 0) {
            console.log('\nIncorrect results:');
            this.testResults.filter(r => !r.isCorrect).forEach((r, i) => {
                console.log(`  ${i + 1}. Size ${r.mapSize}x${r.mapSize}, ${r.maxWalls} walls: `
                    + `Brute=${r.bruteForceArea}, MILP=${r.milpArea}, Diff=${r.difference}`);
            });
        }
        
        const avgBruteDuration = this.testResults.reduce((sum, r) => sum + r.bruteForceDuration, 0) / total;
        const avgMilpDuration = this.testResults.reduce((sum, r) => sum + r.milpDuration, 0) / total;
        
        console.log('\nAverage durations:');
        console.log(`  Brute Force: ${avgBruteDuration.toFixed(0)}ms`);
        console.log(`  MILP: ${avgMilpDuration.toFixed(0)}ms`);
        console.log(`  Speed up: ${(avgBruteDuration / avgMilpDuration).toFixed(1)}x`);
    }
    
    /**
     * Save results to files
     */
    saveResults() {
        const testDir = path.join(__dirname);
        
        // Save detailed results
        const resultsPath = path.join(testDir, 'test-results.json');
        fs.writeFileSync(resultsPath, JSON.stringify(this.testResults, null, 2));
        console.log(`\nTest results saved to: ${resultsPath}`);
        
        // Save test map database
        const dbPath = path.join(testDir, 'test-maps-db.json');
        fs.writeFileSync(dbPath, JSON.stringify(this.testMapsDB, null, 2));
        console.log(`Test map database saved to: ${dbPath}`);
        
        // Create a summary report
        const summaryPath = path.join(testDir, 'test-summary.txt');
        const correct = this.testResults.filter(r => r.isCorrect).length;
        const total = this.testResults.length;
        const accuracy = (correct / total * 100).toFixed(1);
        
        let summary = 'Map Generation Test Summary\n';
        summary += '='.repeat(80) + '\n\n';
        summary += `Total tests: ${total}\n`;
        summary += `Correct: ${correct} (${accuracy}%)\n`;
        summary += `Incorrect: ${total - correct}\n\n`;
        
        if (total - correct > 0) {
            summary += 'Incorrect results:\n';
            this.testResults.filter(r => !r.isCorrect).forEach((r, i) => {
                summary += `  ${i + 1}. Size ${r.mapSize}x${r.mapSize}, ${r.maxWalls} walls: `;
                summary += `Brute=${r.bruteForceArea}, MILP=${r.milpArea}, Diff=${r.difference}\n`;
            });
        }
        
        fs.writeFileSync(summaryPath, summary);
        console.log(`Test summary saved to: ${summaryPath}`);
    }
}

// Run tests if executed directly
if (require.main === module) {
    const tester = new MapGenerationTester();
    
    // Test with small grids to keep brute force feasible
    // For larger grids, brute force becomes computationally prohibitive
    tester.runTests(
        [5, 6, 7],  // Map sizes
        [5, 7],     // Wall counts (fewer to reduce combinations)
        2           // Maps per configuration
    );
}

module.exports = MapGenerationTester;
