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
                ['grass', 'water', 'star',  'home',  'bee',   'water', 'grass'],
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
                ['grass', 'water', 'star',  'home',  'bee',   'water', 'grass'],
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
                ['grass', 'water', 'star',  'home',  'bee',   'water', 'grass'],
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
                ['grass', 'water', 'star',  'home',  'bee',   'water', 'grass'],
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

        test('should fail validation when map has no star tiles', () => {
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'home',  'bee',   'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];

            const solution = {
                goalArea: 8,
                optimalWallCount: 4,
                optimalSolution: [[1, 2], [2, 1], [3, 2], [4, 1]]
            };

            const result = MapValidator.validate(map, solution);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Map has no star tiles - at least one star is required');
        });

        test('should fail validation when map has no bee tiles', () => {
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'star',  'home',  'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];

            const solution = {
                goalArea: 8,
                optimalWallCount: 4,
                optimalSolution: [[1, 2], [2, 1], [3, 2], [4, 1]]
            };

            const result = MapValidator.validate(map, solution);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Map has no bee tiles - at least one bee is required');
        });

        test('should fail validation when map has neither stars nor bees', () => {
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'home',  'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];

            const solution = {
                goalArea: 8,
                optimalWallCount: 4,
                optimalSolution: [[1, 2], [2, 1], [3, 2], [4, 1]]
            };

            const result = MapValidator.validate(map, solution);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Map has no star tiles - at least one star is required');
            expect(result.errors).toContain('Map has no bee tiles - at least one bee is required');
        });

        test('should fail validation when map has adjacent hole tiles', () => {
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'star',  'home',  'bee',   'water', 'grass'],
                ['grass', 'hole',  'hole',  'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];

            const solution = {
                goalArea: 8,
                optimalWallCount: 4,
                optimalSolution: [[1, 2], [2, 1], [3, 2], [4, 3]]
            };

            const result = MapValidator.validate(map, solution);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Map has adjacent hole tiles - holes must not be next to each other');
        });

        test('should fail validation when map has vertically adjacent hole tiles', () => {
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'hole',  'grass', 'grass'],
                ['grass', 'water', 'star',  'home',  'hole',  'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'bee',   'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];

            const solution = {
                goalArea: 8,
                optimalWallCount: 4,
                optimalSolution: [[1, 2], [2, 1], [3, 2], [4, 3]]
            };

            const result = MapValidator.validate(map, solution);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Map has adjacent hole tiles - holes must not be next to each other');
        });

        test('should pass validation when holes are not adjacent', () => {
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'hole',  'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'star',  'home',  'bee',   'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'hole',  'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];

            const solution = {
                goalArea: 8,
                optimalWallCount: 4,
                optimalSolution: [[1, 2], [2, 3], [3, 2], [4, 1]]
            };

            const result = MapValidator.validate(map, solution);
            expect(result.errors).not.toContain('Map has adjacent hole tiles - holes must not be next to each other');
        });

        test('should fail validation when hole can be bypassed with zero extra steps', () => {
            // Hole at (0,3) — on the edge, pet never crosses it (exits south equally fast)
            // Baseline: 3 steps south from home. Filled: same 3 steps south. Extra=0.
            const map = [
                ['grass', 'grass', 'grass', 'hole',  'grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'grass', 'star',  'home',  'bee',   'grass', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];

            const solution = {
                goalArea: 8,
                optimalWallCount: 4,
                optimalSolution: [[2, 2], [2, 4], [4, 2], [4, 4]]
            };

            const result = MapValidator.validate(map, solution);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('hole(s) that can be bypassed'))).toBe(true);
        });

        test('should pass validation when hole requires more than 0 extra steps to bypass', () => {
            // Hole at (6,3) — only alternative path winds through a long corridor
            // Baseline (hole blocking): 8 steps via col 6 and row 0
            // Filled (hole passable): 1 step south to edge row 6
            // Extra steps: 7 > 0 threshold
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'grass', 'water', 'water', 'water', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'water', 'grass'],
                ['water', 'water', 'water', 'water', 'grass', 'water', 'grass'],
                ['water', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['water', 'water', 'star',  'home',  'bee',   'water', 'grass'],
                ['water', 'water', 'water', 'hole',  'water', 'water', 'grass']
            ];

            const solution = {
                goalArea: 8,
                optimalWallCount: 4,
                optimalSolution: [[2, 3], [3, 4], [4, 4], [5, 4]]
            };

            const result = MapValidator.validate(map, solution);
            expect(result.errors.some(e => e.includes('hole(s) that can be bypassed'))).toBe(false);
        });

        test('should fail validation when too many holes (maxPerLevel exceeded)', () => {
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'hole',  'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'hole',  'star',  'home',  'bee',   'hole',  'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'hole',  'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];
            const solution = {
                goalArea: 8,
                optimalWallCount: 4,
                optimalSolution: [[2, 1], [2, 5], [4, 1], [4, 5]]
            };
            const result = MapValidator.validate(map, solution);
            expect(result.errors.some(e => e.includes('Too many hole tiles'))).toBe(true);
        });

        test('should pass validation when holes are within maxPerLevel limit', () => {
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'star',  'home',  'bee',   'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];
            const solution = {
                goalArea: 8,
                optimalWallCount: 4,
                optimalSolution: [[2, 1], [2, 5], [4, 1], [4, 5]]
            };
            const result = MapValidator.validate(map, solution);
            expect(result.errors.some(e => e.includes('Too many'))).toBe(false);
        });
    });
});
