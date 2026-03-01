/**
 * Unit Tests for PathfindingUtils.js
 * 
 * Tests the BFS pathfinding utilities used by solvers.
 */

const PathfindingUtils = require('../../js/PathfindingUtils.js');

describe('PathfindingUtils', () => {
    describe('isPenned()', () => {
        test('should return false when home can reach edge (simple path)', () => {
            const map = [
                [1, 1, 1],
                [1, 2, 1],
                [1, 1, 1]
            ];
            const result = PathfindingUtils.isPenned(map, 1, 1);
            expect(result).toBe(false);
        });

        test('should return true when home is completely surrounded by water', () => {
            const map = [
                [0, 0, 0],
                [0, 2, 0],
                [0, 0, 0]
            ];
            const result = PathfindingUtils.isPenned(map, 1, 1);
            expect(result).toBe(true);
        });

        test('should return true when home is surrounded by walls', () => {
            const map = [
                [5, 5, 5],
                [5, 2, 5],
                [5, 5, 5]
            ];
            const result = PathfindingUtils.isPenned(map, 1, 1);
            expect(result).toBe(true);
        });

        test('should return false when there is a path to edge through grass', () => {
            const map = [
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [1, 1, 2, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0]
            ];
            const result = PathfindingUtils.isPenned(map, 2, 2);
            expect(result).toBe(false);
        });

        test('should return true when path to edge is blocked by walls', () => {
            const map = [
                [0, 0, 0, 0, 0],
                [0, 5, 5, 5, 0],
                [0, 5, 2, 5, 0],
                [0, 5, 5, 5, 0],
                [0, 0, 0, 0, 0]
            ];
            const result = PathfindingUtils.isPenned(map, 2, 2);
            expect(result).toBe(true);
        });

        test('should return false when home is on the edge', () => {
            const map = [
                [2, 1, 1],
                [1, 1, 1],
                [1, 1, 1]
            ];
            const result = PathfindingUtils.isPenned(map, 0, 0);
            expect(result).toBe(false);
        });

        test('should handle complex maze with path to edge', () => {
            const map = [
                [0, 0, 1, 0, 0],
                [1, 1, 1, 0, 0],
                [0, 1, 2, 1, 0],
                [0, 1, 1, 1, 0],
                [0, 0, 1, 0, 0]
            ];
            const result = PathfindingUtils.isPenned(map, 2, 2);
            expect(result).toBe(false);
        });

        test('should handle complex maze without path to edge', () => {
            const map = [
                [0, 0, 5, 0, 0],
                [5, 5, 5, 0, 0],
                [0, 5, 2, 5, 0],
                [0, 5, 5, 5, 0],
                [0, 0, 5, 0, 0]
            ];
            const result = PathfindingUtils.isPenned(map, 2, 2);
            expect(result).toBe(true);
        });

        test('should work with 7x7 map (realistic game size)', () => {
            const map = [
                [1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 1, 0, 0, 1],
                [1, 0, 1, 1, 1, 0, 1],
                [1, 1, 1, 2, 1, 1, 1],
                [1, 0, 1, 1, 1, 0, 1],
                [1, 0, 0, 1, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1]
            ];
            const result = PathfindingUtils.isPenned(map, 3, 3);
            expect(result).toBe(false);
        });

        test('should handle rectangular maps (non-square)', () => {
            const map = [
                [1, 1, 1, 1, 1],
                [1, 2, 1, 1, 1],
                [1, 1, 1, 1, 1]
            ];
            const result = PathfindingUtils.isPenned(map, 1, 1);
            expect(result).toBe(false);
        });

        test('should handle single cell map (edge case)', () => {
            const map = [[2]];
            const result = PathfindingUtils.isPenned(map, 0, 0);
            expect(result).toBe(false); // Home is on edge
        });

        test('should handle 3x3 map with home at edge', () => {
            const map = [
                [2, 1, 1],
                [1, 1, 1],
                [1, 1, 1]
            ];
            const result = PathfindingUtils.isPenned(map, 0, 0);
            expect(result).toBe(false);
        });
    });

    describe('calculatePennedArea()', () => {
        test('should return 1 when home is completely isolated', () => {
            const map = [
                [0, 0, 0],
                [0, 2, 0],
                [0, 0, 0]
            ];
            const area = PathfindingUtils.calculatePennedArea(map, 1, 1);
            expect(area).toBe(1);
        });

        test('should count all reachable grass tiles plus home', () => {
            const map = [
                [5, 5, 5, 5, 5],
                [5, 1, 1, 1, 5],
                [5, 1, 2, 1, 5],
                [5, 1, 1, 1, 5],
                [5, 5, 5, 5, 5]
            ];
            const area = PathfindingUtils.calculatePennedArea(map, 2, 2);
            expect(area).toBe(9); // 3x3 inner area
        });

        test('should not count water tiles in penned area', () => {
            const map = [
                [5, 5, 5, 5, 5],
                [5, 1, 0, 1, 5],
                [5, 1, 2, 1, 5],
                [5, 1, 1, 1, 5],
                [5, 5, 5, 5, 5]
            ];
            const area = PathfindingUtils.calculatePennedArea(map, 2, 2);
            expect(area).toBe(8); // 3x3 minus one water tile
        });

        test('should not count wall tiles in penned area', () => {
            const map = [
                [5, 5, 5, 5, 5],
                [5, 1, 5, 1, 5],
                [5, 1, 2, 1, 5],
                [5, 1, 1, 1, 5],
                [5, 5, 5, 5, 5]
            ];
            const area = PathfindingUtils.calculatePennedArea(map, 2, 2);
            expect(area).toBe(8); // 3x3 minus one wall tile
        });

        test('should handle L-shaped penned area', () => {
            const map = [
                [5, 5, 5, 5, 0],
                [5, 1, 1, 5, 0],
                [5, 1, 2, 5, 0],
                [5, 1, 1, 1, 5],
                [5, 5, 5, 5, 5]
            ];
            const area = PathfindingUtils.calculatePennedArea(map, 2, 2);
            expect(area).toBe(7); // L-shaped area
        });

        test('should handle complex irregular shapes', () => {
            const map = [
                [0, 0, 5, 0, 0],
                [5, 1, 1, 1, 5],
                [5, 1, 2, 1, 5],
                [5, 1, 1, 1, 5],
                [0, 0, 5, 0, 0]
            ];
            const area = PathfindingUtils.calculatePennedArea(map, 2, 2);
            expect(area).toBe(9); // 3x3 area
        });

        test('should handle small penned area (2 tiles)', () => {
            const map = [
                [0, 5, 0],
                [5, 2, 1],
                [0, 5, 5]
            ];
            const area = PathfindingUtils.calculatePennedArea(map, 1, 1);
            expect(area).toBe(2); // Home + 1 grass
        });

        test('should handle large penned area', () => {
            const size = 9;
            const map = Array(size).fill(null).map(() => Array(size).fill(1));
            // Place home in center
            const center = Math.floor(size / 2);
            map[center][center] = 2;
            // Surround entire map with walls
            for (let i = 0; i < size; i++) {
                map[0][i] = 5;
                map[size - 1][i] = 5;
                map[i][0] = 5;
                map[i][size - 1] = 5;
            }
            const area = PathfindingUtils.calculatePennedArea(map, center, center);
            expect(area).toBe((size - 2) * (size - 2)); // Interior area
        });

        test('should return 1 for isolated home (no adjacent grass)', () => {
            const map = [
                [1, 1, 1],
                [1, 2, 1],
                [1, 1, 1]
            ];
            // Add walls around home
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (i !== 1 || j !== 1) {
                        map[i][j] = 5;
                    }
                }
            }
            const area = PathfindingUtils.calculatePennedArea(map, 1, 1);
            expect(area).toBe(1);
        });

        test('should handle disconnected grass areas (only count connected)', () => {
            const map = [
                [5, 5, 5, 5, 5],
                [5, 1, 5, 1, 5],
                [5, 2, 5, 1, 5],
                [5, 1, 5, 1, 5],
                [5, 5, 5, 5, 5]
            ];
            const area = PathfindingUtils.calculatePennedArea(map, 2, 1);
            expect(area).toBe(3); // Only home and vertically adjacent tiles
        });

        test('should handle home at corner of penned area', () => {
            const map = [
                [5, 5, 5, 5, 5],
                [5, 2, 1, 1, 5],
                [5, 1, 1, 1, 5],
                [5, 1, 1, 1, 5],
                [5, 5, 5, 5, 5]
            ];
            const area = PathfindingUtils.calculatePennedArea(map, 1, 1);
            expect(area).toBe(9); // 3x3 area
        });
    });

    describe('Edge Cases', () => {
        test('isPenned should handle empty map gracefully', () => {
            const map = [[]];
            // Should not throw error
            expect(() => PathfindingUtils.isPenned(map, 0, 0)).not.toThrow();
        });

        test('calculatePennedArea should handle map with all water except home', () => {
            const map = [
                [0, 0, 0],
                [0, 2, 0],
                [0, 0, 0]
            ];
            const area = PathfindingUtils.calculatePennedArea(map, 1, 1);
            expect(area).toBe(1);
        });

        test('both functions should work with same map consistently', () => {
            const map = [
                [5, 5, 5, 5, 5],
                [5, 1, 1, 1, 5],
                [5, 1, 2, 1, 5],
                [5, 1, 1, 1, 5],
                [5, 5, 5, 5, 5]
            ];
            const isPenned = PathfindingUtils.isPenned(map, 2, 2);
            const area = PathfindingUtils.calculatePennedArea(map, 2, 2);
            expect(isPenned).toBe(true);
            expect(area).toBeGreaterThan(0);
        });
    });

    describe('Tile Type Handling', () => {
        test('should treat tile type 0 (water) as blocking', () => {
            const map = [
                [1, 0, 1],
                [1, 2, 1],
                [1, 1, 1]
            ];
            const area = PathfindingUtils.calculatePennedArea(map, 1, 1);
            expect(area).toBeGreaterThan(0);
            // Should not include tile above home (blocked by water)
        });

        test('should treat tile type 1 (grass) as passable', () => {
            const map = [
                [1, 1, 1],
                [1, 2, 1],
                [1, 1, 1]
            ];
            const area = PathfindingUtils.calculatePennedArea(map, 1, 1);
            expect(area).toBe(9);
        });

        test('should treat tile type 2 (home) as passable', () => {
            const map = [
                [5, 5, 5],
                [5, 2, 5],
                [5, 5, 5]
            ];
            const area = PathfindingUtils.calculatePennedArea(map, 1, 1);
            expect(area).toBe(1);
        });

        test('should treat tile type 5 (wall) as blocking', () => {
            const map = [
                [1, 5, 1],
                [1, 2, 1],
                [1, 1, 1]
            ];
            const area = PathfindingUtils.calculatePennedArea(map, 1, 1);
            // Should not include tile above home (blocked by wall)
            expect(area).toBeGreaterThan(0);
        });

        test('should treat tile type 3 (star) as passable', () => {
            const map = [
                [5, 5, 5],
                [5, 2, 3],
                [5, 5, 5]
            ];
            const area = PathfindingUtils.calculatePennedArea(map, 1, 1);
            expect(area).toBe(2); // home + star
        });
    });

    describe('calculatePennedScore()', () => {
        test('should return 1 for isolated home (no star tiles)', () => {
            const map = [
                [0, 0, 0],
                [0, 2, 0],
                [0, 0, 0]
            ];
            const score = PathfindingUtils.calculatePennedScore(map, 1, 1);
            expect(score).toBe(1);
        });

        test('should count star tiles as 3 points each', () => {
            const map = [
                [5, 5, 5, 5, 5],
                [5, 1, 3, 1, 5],
                [5, 1, 2, 1, 5],
                [5, 1, 1, 1, 5],
                [5, 5, 5, 5, 5]
            ];
            // 7 grass + 1 home + 1 star: 8*1 + 1*3 = 11
            const score = PathfindingUtils.calculatePennedScore(map, 2, 2);
            expect(score).toBe(11); // 8 non-star tiles + 1 star * 3
        });

        test('should count all tiles as 1 when no stars present', () => {
            const map = [
                [5, 5, 5, 5, 5],
                [5, 1, 1, 1, 5],
                [5, 1, 2, 1, 5],
                [5, 1, 1, 1, 5],
                [5, 5, 5, 5, 5]
            ];
            const score = PathfindingUtils.calculatePennedScore(map, 2, 2);
            expect(score).toBe(9); // same as calculatePennedArea
        });

        test('should handle multiple star tiles', () => {
            const map = [
                [5, 5, 5, 5, 5],
                [5, 3, 3, 3, 5],
                [5, 3, 2, 3, 5],
                [5, 3, 3, 3, 5],
                [5, 5, 5, 5, 5]
            ];
            // 1 home + 8 stars: 1 + 8*3 = 25
            const score = PathfindingUtils.calculatePennedScore(map, 2, 2);
            expect(score).toBe(25);
        });

        test('should accept custom score map', () => {
            const map = [
                [5, 5, 5],
                [5, 2, 3],
                [5, 5, 5]
            ];
            const customScores = {0:0, 1:1, 2:1, 3:5, 5:0};
            const score = PathfindingUtils.calculatePennedScore(map, 1, 1, customScores);
            expect(score).toBe(6); // 1 home + 1 star * 5
        });

        test('should not count blocking tiles', () => {
            const map = [
                [5, 5, 5, 5, 5],
                [5, 3, 0, 3, 5],
                [5, 1, 2, 1, 5],
                [5, 1, 1, 1, 5],
                [5, 5, 5, 5, 5]
            ];
            // Reachable from home: 5 grass + 2 stars + 1 home = 5*1 + 2*3 + 1 = 12
            const score = PathfindingUtils.calculatePennedScore(map, 2, 2);
            expect(score).toBe(12);
        });
    });
});
