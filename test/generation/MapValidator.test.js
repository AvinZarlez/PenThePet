/**
 * Tests for MapValidator
 */

const MapValidator = require('../../js/MapValidator.js');

describe('MapValidator', () => {
    describe('validate', () => {
        test('should pass validation for valid map with good solution', () => {
            // 7x7 map with path to edge (maxWalls = floor(7*0.75) = 5)
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'home', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];
            
            const solution = {
                goalArea: 8,
                optimalWallCount: 4,
                optimalSolution: [[1, 2], [2, 1], [3, 2], [4, 1]] // Not all on edges
            };
            
            const result = MapValidator.validate(map, solution);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        
        test('should fail validation when goal area is too small', () => {
            const map = [
                ['grass', 'water', 'grass'],
                ['water', 'home', 'water'],
                ['grass', 'water', 'grass']
            ];
            
            const solution = {
                goalArea: 2, // Too small (< 5)
                optimalWallCount: 2,
                optimalSolution: [[0, 0], [2, 0]]
            };
            
            const result = MapValidator.validate(map, solution);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Goal area too small (2 < 5) - map is too easy');
        });
        
        test('should fail validation when all walls are on edge', () => {
            // 7x7 map: maxWallsForSize(7) = 5
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'home', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];
            
            const solution = {
                goalArea: 10,
                optimalWallCount: 4,
                optimalSolution: [[0, 0], [0, 6], [6, 0], [6, 6]] // All on edges
            };
            
            const result = MapValidator.validate(map, solution);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('All optimal walls are on edge tiles - map is too easy');
        });
        
        test('should fail validation when too many walls needed', () => {
            // 7x7 map: maxWallsForSize(7) = 5
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass', 'home', 'grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];
            
            const solution = {
                goalArea: 8,
                optimalWallCount: 16, // More than maxWallsForSize(7) = 5
                optimalSolution: []
            };
            
            const result = MapValidator.validate(map, solution);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Too many walls needed (16 > 5 for size 7)');
        });
        
        test('should pass validation when at least one wall is not on edge', () => {
            // 7x7 map: maxWallsForSize(7) = 5
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'home', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];
            
            const solution = {
                goalArea: 10,
                optimalWallCount: 4,
                optimalSolution: [[0, 0], [0, 6], [6, 0], [1, 2]] // One not on edge
            };
            
            const result = MapValidator.validate(map, solution);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        
        test('should fail validation when no path to edge exists', () => {
            const map = [
                ['water', 'water', 'water'],
                ['water', 'home', 'water'],
                ['water', 'water', 'water']
            ];
            
            const solution = {
                goalArea: 8,
                optimalWallCount: 0,
                optimalSolution: []
            };
            
            const result = MapValidator.validate(map, solution);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Map does not have a valid path from home to edge');
        });
        
        test('should fail validation when walkable tiles are unreachable from home', () => {
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'water', 'water', 'grass', 'water', 'grass'],
                ['grass', 'water', 'star', 'water', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'water', 'water', 'home', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];
            
            const solution = {
                goalArea: 8,
                optimalWallCount: 4,
                optimalSolution: [[1, 4], [2, 4], [3, 2], [4, 1]]
            };
            
            const result = MapValidator.validate(map, solution);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Not all walkable tiles are reachable from home');
        });
        
        test('should accumulate multiple validation errors', () => {
            const map = [
                ['water', 'water', 'water'],
                ['water', 'home', 'water'],
                ['water', 'water', 'water']
            ];
            
            const solution = {
                goalArea: 2, // Too small
                optimalWallCount: 20, // Too many walls
                optimalSolution: []
            };
            
            const result = MapValidator.validate(map, solution);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
        });
        
        test('should fail when not all walls are needed (rule 1)', () => {
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'home', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];
            
            const solution = {
                goalArea: 10,
                optimalWallCount: 3, // Solver only uses 3
                maxWalls: 5,         // But level gives 5
                optimalSolution: [[1, 2], [2, 1], [3, 2]]
            };
            
            const result = MapValidator.validate(map, solution);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Not all walls needed for optimal score (uses 3 of 5 walls)');
        });
        
        test('should pass when all walls are needed (rule 1)', () => {
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'home', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];
            
            const solution = {
                goalArea: 10,
                optimalWallCount: 4,
                maxWalls: 4, // Matches optimalWallCount
                optimalSolution: [[1, 2], [2, 1], [3, 2], [4, 1]]
            };
            
            const result = MapValidator.validate(map, solution);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        
        test('should skip rule 1 when maxWalls not provided in solution', () => {
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'home', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];
            
            // No maxWalls provided — rule 1 should be skipped
            const solution = {
                goalArea: 10,
                optimalWallCount: 3,
                optimalSolution: [[1, 2], [2, 1], [3, 2]]
            };
            
            const result = MapValidator.validate(map, solution);
            expect(result.valid).toBe(true);
        });
    });
});
