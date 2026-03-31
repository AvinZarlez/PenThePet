/**
 * Tests for MapValidator
 */

const MapValidator = require('../../js/generation/MapValidator.js');

describe('MapValidator', () => {
    describe('validate', () => {
        test('should pass validation for valid map with good solution', () => {
            // 7x7 map with path to edge (maxWalls = floor(7*0.75) = 5)
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'star',  'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'home',  'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'bee',   'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];
            
            const solution = {
                goalArea: 9,
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
                goalArea: 2, // Too small (< 9)
                optimalWallCount: 2,
                optimalSolution: [[0, 0], [2, 0]]
            };
            
            const result = MapValidator.validate(map, solution);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Goal area too small (2 < 9) - map is too easy');
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
                ['grass', 'water', 'star',  'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'home',  'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'bee',   'water', 'grass'],
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
        
        test('should not fail specifically due to unused maxWalls metadata', () => {
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
            expect(result.errors).not.toContain('Not all walls needed for optimal score (uses 3 of 5 walls)');
        });
        
        test('should pass when all walls are needed', () => {
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'star',  'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'home',  'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'bee',   'water', 'grass'],
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
        
        test('should pass when maxWalls is not provided in solution', () => {
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'star',  'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'home',  'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'bee',   'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];
            
            // No maxWalls provided — still valid when other checks pass
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

        test('should fail validation when hole cuts off too few tiles', () => {
            // Hole at (0,3) — on the edge, doesn't cut off any tiles from home
            // (pet can reach all non-blocking tiles without going through the hole)
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
            expect(result.errors.some(e => e.includes('hole(s) that cut off'))).toBe(true);
        });

        test('should pass validation when hole cuts off more than 4 tiles', () => {
            // Hole at (1,3) blocks access to all of row 0 (7 tiles)
            // Water barrier across row 1 with hole as only crossing
            // Area loss = 8 > 4 threshold
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['water', 'water', 'water', 'hole',  'water', 'water', 'water'],
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
            expect(result.errors.some(e => e.includes('hole(s) that cut off'))).toBe(false);
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

        test('should fail validation when non-edge tile is only reachable via edge tiles', () => {
            // star at (1,3) is a non-edge interior tile.
            // Row 2 has water at cols 1-5 and grass only at edge cols 0 and 6,
            // so the only path from home (row 3) to star (row 1) goes through
            // the edge column 0 or 6 — failing the interior-path check.
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass', 'star',  'grass', 'grass', 'grass'],
                ['grass', 'water', 'water', 'water', 'water', 'water', 'grass'],
                ['grass', 'water', 'bee',   'home',  'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];

            const solution = {
                goalArea: 6,
                optimalWallCount: 4,
                optimalSolution: [[3, 2], [4, 1], [4, 3], [5, 2]]
            };

            const result = MapValidator.validate(map, solution);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain(
                'Not all non-edge tiles are reachable from home without traversing edge tiles'
            );
        });

        test('should pass validation when hole enables non-edge interior access', () => {
            // Same barrier as above, but hole at (2,3) makes the star at (1,3)
            // reachable from home without traversing edge tiles:
            // home (3,3) → hole (2,3) [passable] → star (1,3).
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass', 'star',  'grass', 'grass', 'grass'],
                ['grass', 'water', 'water', 'hole',  'water', 'water', 'grass'],
                ['grass', 'water', 'bee',   'home',  'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];

            const solution = {
                goalArea: 6,
                optimalWallCount: 4,
                optimalSolution: [[3, 2], [4, 1], [4, 3], [5, 2]]
            };

            const result = MapValidator.validate(map, solution);
            expect(result.errors).not.toContain(
                'Not all non-edge tiles are reachable from home without traversing edge tiles'
            );
        });

        test('should pass validation when all non-edge tiles are reachable via interior path', () => {
            // Well-connected interior: every non-water interior tile is accessible
            // from home without needing to walk along the map perimeter.
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'grass', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'star',  'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'home',  'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'bee',   'grass', 'grass'],
                ['grass', 'water', 'grass', 'grass', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];

            const solution = {
                goalArea: 8,
                optimalWallCount: 4,
                optimalSolution: [[1, 2], [2, 1], [3, 2], [4, 1]]
            };

            const result = MapValidator.validate(map, solution);
            expect(result.errors).not.toContain(
                'Not all non-edge tiles are reachable from home without traversing edge tiles'
            );
        });

        test('should fail validation when a star is adjacent to home', () => {
            // Star at (3,2) is directly left of home at (3,3) — always penned, no strategic choice
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'star',  'home',  'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'bee',   'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];

            const solution = {
                goalArea: 8,
                optimalWallCount: 4,
                optimalSolution: [[1, 2], [2, 1], [3, 2], [4, 1]]
            };

            const result = MapValidator.validate(map, solution);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('Score-modifying tiles adjacent to home'))).toBe(true);
        });

        test('should fail validation when a bee is adjacent to home', () => {
            // Bee at (3,4) is directly right of home at (3,3) — always penned, no strategic choice
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'star',  'water', 'grass', 'water', 'grass'],
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
            expect(result.errors.some(e => e.includes('Score-modifying tiles adjacent to home'))).toBe(true);
        });

        test('should pass validation when score-modifying tiles are not adjacent to home', () => {
            // Star at (1,2) and bee at (5,4) — both far from home at (3,3)
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'star',  'water', 'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'home',  'grass', 'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'water', 'grass', 'water', 'bee',   'water', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass']
            ];

            const solution = {
                goalArea: 8,
                optimalWallCount: 4,
                optimalSolution: [[1, 2], [2, 1], [3, 2], [4, 1]]
            };

            const result = MapValidator.validate(map, solution);
            expect(result.errors.some(e => e.includes('Score-modifying tiles adjacent to home'))).toBe(false);
        });
    });

    describe('_findHomePosition()', () => {
        test('should return [-1, -1] when no home tile exists in the map', () => {
            const map = [
                ['grass', 'water', 'grass'],
                ['water', 'star',  'water'],
                ['grass', 'bee',   'grass'],
            ];
            expect(MapValidator._findHomePosition(map)).toEqual([-1, -1]);
        });

        test('should return correct position when home exists', () => {
            const map = [
                ['grass', 'water', 'grass'],
                ['water', 'home',  'water'],
                ['grass', 'grass', 'grass'],
            ];
            expect(MapValidator._findHomePosition(map)).toEqual([1, 1]);
        });
    });

    describe('_scoreModifyingTilesAdjacentToHome() — no home', () => {
        test('should return empty array when no home tile exists', () => {
            const map = [
                ['grass', 'star',  'grass'],
                ['bee',   'water', 'grass'],
                ['grass', 'grass', 'grass'],
            ];
            expect(MapValidator._scoreModifyingTilesAdjacentToHome(map)).toEqual([]);
        });
    });

    describe('_isScoreModifyingTile()', () => {
        test('should return true for star tile', () => {
            expect(MapValidator._isScoreModifyingTile('star')).toBe(true);
        });

        test('should return true for bee tile', () => {
            expect(MapValidator._isScoreModifyingTile('bee')).toBe(true);
        });

        test('should return false for grass tile', () => {
            expect(MapValidator._isScoreModifyingTile('grass')).toBe(false);
        });

        test('should return false for home tile', () => {
            expect(MapValidator._isScoreModifyingTile('home')).toBe(false);
        });

        test('should return false for water tile', () => {
            expect(MapValidator._isScoreModifyingTile('water')).toBe(false);
        });
    });

    describe('_hasAtLeastOneStar() and _hasAtLeastOneBee()', () => {
        test('_hasAtLeastOneStar returns false when no stars exist', () => {
            const map = [['grass', 'home'], ['bee', 'water']];
            expect(MapValidator._hasAtLeastOneStar(map)).toBe(false);
        });

        test('_hasAtLeastOneStar returns true when star exists', () => {
            const map = [['star', 'home'], ['bee', 'water']];
            expect(MapValidator._hasAtLeastOneStar(map)).toBe(true);
        });

        test('_hasAtLeastOneBee returns false when no bees exist', () => {
            const map = [['grass', 'home'], ['star', 'water']];
            expect(MapValidator._hasAtLeastOneBee(map)).toBe(false);
        });

        test('_hasAtLeastOneBee returns true when bee exists', () => {
            const map = [['grass', 'home'], ['bee', 'water']];
            expect(MapValidator._hasAtLeastOneBee(map)).toBe(true);
        });
    });
});
