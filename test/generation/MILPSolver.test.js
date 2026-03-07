/**
 * Integration tests for MILPSolver — hole (fillable tile) handling.
 *
 * These tests call the real Python solver (not mocked) to verify that the MILP
 * correctly models holes as fill-or-not choices rather than treating them as
 * permanent walls or fixed passable tiles.
 *
 * Key behaviours verified:
 *
 *   A. When a hole is completely surrounded by pen-member tiles, the solver
 *      fills it (places a wall on it), includes the filledHole tile in the
 *      penned area (+1 score), and counts the fill against the wall budget.
 *
 *   B. When filling a hole would require including a penalty tile (bee) or
 *      would create an escape route, the solver leaves the hole unfilled.
 *      The hole then acts as a free barrier — identical to water — and
 *      neither the goal area nor the wall count differs from the water version.
 */

const MILPSolver = require('../../scripts/solver/MILPSolver.js');

// Numeric tile IDs (from tileData.js)
const G = 1; // grass
const W = 0; // water (blocking, not fillable)
const H = 2; // home
const S = 3; // star  (score +3)
const B = 4; // bee   (score -3)
const O = 6; // hole  (blocking, fillable — becomes filledHole when filled, score +1)

// Each test calls the Python solver, so a generous timeout is needed.
const SOLVER_TIMEOUT_MS = 60000;

/**
 * Extract the set of "row,col" strings for every wall placed by the solver.
 * @param {Object} result - Return value from MILPSolver.solveMap
 * @returns {Set<string>}
 */
function getWallPositions(result) {
    if (!result || !result.walls) return new Set();
    const positions = new Set();
    result.walls.forEach((row, r) => {
        row.forEach((v, c) => { if (v === 1) positions.add(`${r},${c}`); });
    });
    return positions;
}

describe('MILPSolver — hole fill-or-not choice', () => {

    /**
     * Map layout (7x7) used for Scenario A:
     *
     *   Row 0:  G  G  G  G  G  G  G   (edge row — escape blocked by walls)
     *   Row 1:  G  W  G  G  G  W  G   (water sentinels)
     *   Row 2:  G  W  G  S  G  W  G   (star at col 3)
     *   Row 3:  G  W  G  H  G  W  G   (home at col 3)
     *   Row 4:  G  W  G  o  G  W  G   (hole at col 3)
     *   Row 5:  G  W  W  W  W  W  G   (water barrier — south boundary)
     *   Row 6:  G  G  G  G  G  G  G
     *
     * The hole at (4,3) is directly south of home.  Once the solver closes
     * the northern escape routes with 3 walls, (4,3) is completely enclosed
     * by pen-member tiles on all non-water sides: home(3,3), grass(4,2),
     * grass(4,4).  Filling it gains +1 score for +1 wall — the solver must
     * choose to fill it.
     *
     * Verified against the Python solver manually (see solve.py):
     *   hole map  → goalArea 14, walls 4, solution includes (4,3)
     *   water map → goalArea 13, walls 3, solution does NOT include (4,3)
     */
    const MAP_A_HOLE = [
        [G, G, G, G, G, G, G],
        [G, W, G, G, G, W, G],
        [G, W, G, S, G, W, G],
        [G, W, G, H, G, W, G],
        [G, W, G, O, G, W, G],  // hole at (4,3)
        [G, W, W, W, W, W, G],
        [G, G, G, G, G, G, G],
    ];

    // Same map but with permanent water at (4,3) — no fill option.
    const MAP_A_WATER = [
        [G, G, G, G, G, G, G],
        [G, W, G, G, G, W, G],
        [G, W, G, S, G, W, G],
        [G, W, G, H, G, W, G],
        [G, W, G, W, G, W, G],  // water at (4,3)
        [G, W, W, W, W, W, G],
        [G, G, G, G, G, G, G],
    ];

    /**
     * Map layout (7x7) used for Scenario B:
     *
     *   Row 0:  G  G  G  G  G  G  G
     *   Row 1:  G  W  G  G  G  W  G
     *   Row 2:  G  W  G  S  G  W  G
     *   Row 3:  G  W  G  H  G  W  G   (home at col 3)
     *   Row 4:  G  W  G  o  G  W  G   (hole at col 3)
     *   Row 5:  G  W  G  B  G  W  G   (bee at col 3)
     *   Row 6:  G  G  G  G  G  G  G
     *
     * The hole at (4,3) is on the pen boundary.  Below it is a bee (score -3).
     * Filling the hole to include the bee would HURT the score (-3 + 1 = -2).
     * The solver must leave the hole unfilled — using it as a free barrier
     * just like water.  Both the hole map and the equivalent water map should
     * produce identical results.
     *
     * Verified against the Python solver:
     *   hole map  → goalArea 13, walls 5, solution does NOT include (4,3)
     *   water map → goalArea 13, walls 5, same solution
     */
    const MAP_B_HOLE = [
        [G, G, G, G, G, G, G],
        [G, W, G, G, G, W, G],
        [G, W, G, S, G, W, G],
        [G, W, G, H, G, W, G],
        [G, W, G, O, G, W, G],  // hole at (4,3)
        [G, W, G, B, G, W, G],  // bee at (5,3)
        [G, G, G, G, G, G, G],
    ];

    const MAP_B_WATER = [
        [G, G, G, G, G, G, G],
        [G, W, G, G, G, W, G],
        [G, W, G, S, G, W, G],
        [G, W, G, H, G, W, G],
        [G, W, G, W, G, W, G],  // water at (4,3)
        [G, W, G, B, G, W, G],  // bee at (5,3)
        [G, G, G, G, G, G, G],
    ];

    // -----------------------------------------------------------------------
    // Scenario A — hole inside pen region: solver fills the hole
    // -----------------------------------------------------------------------

    describe('Scenario A: hole surrounded by pen tiles — solver fills it', () => {
        let holeResult, waterResult;

        beforeAll(() => {
            holeResult  = MILPSolver.solveMap(MAP_A_HOLE,  4);
            waterResult = MILPSolver.solveMap(MAP_A_WATER, 4);
        }, SOLVER_TIMEOUT_MS);

        test('filling hole gives higher goalArea than equivalent water tile', () => {
            expect(holeResult).not.toBeNull();
            expect(waterResult).not.toBeNull();

            // Filling the hole adds exactly the filledHole score (+1)
            expect(holeResult.goalArea).toBe(waterResult.goalArea + 1);
        });

        test('filling hole costs exactly 1 extra wall compared to water baseline', () => {
            expect(holeResult).not.toBeNull();
            expect(waterResult).not.toBeNull();

            // The fill consumes 1 wall from the budget
            expect(holeResult.optimalWallCount).toBe(waterResult.optimalWallCount + 1);
        });

        test('hole position (4,3) is included in the optimal solution when filled', () => {
            expect(holeResult).not.toBeNull();

            // The solver must report the hole's position as a wall placement
            expect(getWallPositions(holeResult).has('4,3')).toBe(true);
        });

        test('water at same position is NOT in the solution (confirming hole-specific behaviour)', () => {
            expect(waterResult).not.toBeNull();

            // Water cannot be filled, so (4,3) must not appear in the solution
            expect(getWallPositions(waterResult).has('4,3')).toBe(false);
        });
    });

    // -----------------------------------------------------------------------
    // Scenario B — hole on pen boundary: solver leaves it unfilled (free barrier)
    // -----------------------------------------------------------------------

    describe('Scenario B: hole at pen boundary (bee below) — solver leaves it unfilled', () => {
        let holeResult, waterResult;

        beforeAll(() => {
            holeResult  = MILPSolver.solveMap(MAP_B_HOLE,  6);
            waterResult = MILPSolver.solveMap(MAP_B_WATER, 6);
        }, SOLVER_TIMEOUT_MS);

        test('goalArea is identical whether hole or water blocks the bee column', () => {
            expect(holeResult).not.toBeNull();
            expect(waterResult).not.toBeNull();

            // Hole acts as free barrier — no score difference vs water
            expect(holeResult.goalArea).toBe(waterResult.goalArea);
        });

        test('wall count is identical whether hole or water blocks the bee column', () => {
            expect(holeResult).not.toBeNull();
            expect(waterResult).not.toBeNull();

            // No extra wall needed — the hole is used as a free barrier
            expect(holeResult.optimalWallCount).toBe(waterResult.optimalWallCount);
        });

        test('hole position (4,3) is NOT in the solution when used as barrier', () => {
            expect(holeResult).not.toBeNull();

            // Hole must NOT be filled — it is the boundary barrier, not a pen tile
            expect(getWallPositions(holeResult).has('4,3')).toBe(false);
        });
    });
});
