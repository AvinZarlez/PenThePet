# PenThePet Test Suite

This directory contains test infrastructure for validating map generation and goal calculation.

## Overview

PenThePet generates puzzle maps where the goal is to achieve the **MAXIMUM** penned area by placing walls optimally. The test suite ensures this calculation is correct.

## Files

### Solvers

**BruteForceSolver.js**
- Exhaustively checks ALL possible wall placements
- Always finds the true optimal solution (ground truth)
- Slow but 100% accurate
- Used only for testing and verification

**MILPSolver.js** (in `js/`)
- Production solver used in the game
- Uses exhaustive search for small maps (<200k combinations)
- Uses heuristic search for larger maps
- Goal: Find MAXIMUM penned area

### Test Scripts

**test-map-generation.js**
- Comprehensive testing of map generation
- Compares MILPSolver vs BruteForceSolver
- Generates test maps and saves to `test-maps-db.json`
- Reports accuracy statistics

Usage:
```bash
node test-map-generation.js
```

Output:
- `test-maps-db.json` - Maps with verified optimal solutions
- `test-results.json` - Detailed comparison results
- `test-summary.txt` - Human-readable summary

**validate-generation.js**
- Quick validation of map generation
- Checks goals are reasonable (not ultra-small)
- Verifies generation completes in reasonable time
- Exit code 0 = pass, 1 = fail

Usage:
```bash
node validate-generation.js
```

**generate-daily-maps.js**
- Generates maps for `maps.json` (daily levels)
- Uses brute force verification for small maps (≤7x7)
- Creates production-ready maps with verified goals

Usage:
```bash
node generate-daily-maps.js
```

### Debug Scripts

**debug-solver.js**, **debug-candidates.js**, **debug-solver-detailed.js**, **debug-direct-comparison.js**
- Various debugging utilities
- Used during development to trace solver behavior
- Can be deleted or kept for future debugging

## Map Format

### String Format (display/storage)
```javascript
{
  "2026-02-06": {
    "size": 7,
    "goal": 12,  // Maximum achievable penned area
    "map": [
      ["grass", "water", "grass", ...],
      ["water", "grass", "home", ...],
      ...
    ]
  }
}
```

### Numeric Format (internal)
- `0` = water (blocking)
- `1` = grass (walkable)
- `2` = home (pet starting position)
- `5` = wall (player-placed, blocking)

## Understanding Goals

The **goal** is the MAXIMUM penned area achievable with optimal wall placement:

- **Penned**: Pet cannot reach any edge of the map
- **Area**: Number of tiles the pet can access (flood fill from home)
- **Optimal**: Best possible result with available walls

Example: If goal is 10, the player should be able to pen the pet in an area of 10 tiles by placing walls strategically.

### Reasonable Goal Ranges

- 5x5 map: 3-10 tiles
- 7x7 map: 5-16 tiles
- 9x9 map: 8-25 tiles

Goals of 1-2 are suspicious (likely a bug).

## Test Map Database

**test-maps-db.json**
- Contains maps with **verified** optimal solutions
- Each map has been solved by brute force
- Used as ground truth for testing

Format:
```json
[
  {
    "size": 5,
    "maxWalls": 5,
    "goal": 8,  // Verified by brute force
    "optimalWallCount": 4,  // Walls needed to achieve goal
    "map": [...]
  }
]
```

## Common Tasks

### Verify MILP Solver Accuracy

```bash
node test-map-generation.js
```

Check the summary at the end:
- `Correct: X (Y%)` - Percentage of maps where MILP matched brute force
- Goal: 100% for small maps, >90% for larger maps

### Generate New Test Maps

```bash
# Edit test-map-generation.js to configure:
# - mapSizes: [5, 6, 7]
# - wallCounts: [5, 7, 9]
# - mapsPerConfig: 2

node test-map-generation.js
```

### Create Daily Levels

```bash
# Edit generate-daily-maps.js dates array:
# { date: '2026-02-07', size: 9, walls: 9 }

node generate-daily-maps.js
```

This updates `maps.json` with new verified maps.

### Quick Validation

```bash
node validate-generation.js
```

Returns exit code 0 if all tests pass.

## Troubleshooting

### "Failed to find solution" messages

Normal during map generation. The generator tries multiple random maps until it finds one that can be penned with available walls.

### MILP solver accuracy < 100%

For small maps (≤7x7), MILP should match brute force exactly.
For larger maps, some variance is expected due to heuristic search.

If accuracy is very low (<50%), check:
1. Is the solver maximizing instead of minimizing?
2. Is the threshold for exhaustive search set correctly?
3. Are the heuristics working properly?

### Map generation takes too long

- Reduce map size
- Reduce maxWalls
- Check if MILPSolver is using heuristic search for large maps
- Exhaustive search threshold should be ~200k combinations

### Goals are always 1 or very small

This was the original bug! Goals should be MAXIMIZED, not minimized.

Check:
- `bestArea` starts at 0 (not Infinity)
- Comparison is `area > bestArea` (not `area < bestArea`)

## Development Notes

### Critical Learnings

1. **Goal = MAXIMUM area**, not minimum
   - Game objective: Create largest possible pen
   - Fixed by changing minimize logic to maximize

2. **Two solver modes**:
   - Exhaustive: <200k combinations, 100% accurate
   - Heuristic: >200k combinations, fast but may miss optimal

3. **Test process**:
   - Generate → Brute force (ground truth) → Save
   - Later: Generate → MILP → Compare to ground truth

4. **Brute force verification**:
   - Only feasible for maps ≤7x7 with ≤7 walls
   - Larger maps use MILP without verification

### Future Improvements

- Implement better heuristics for large maps
- Add more diverse test cases
- Create visual diff tool for comparing solutions
- Add performance benchmarks

## References

- Main game code: `js/Grid.js`, `js/MapGenerator.js`, `js/MILPSolver.js`
- Agent instructions: `.github/copilot-instructions.md`
- Game documentation: `CODE_STRUCTURE.md`
