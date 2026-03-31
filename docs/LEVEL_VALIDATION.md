# Level Validation

## Overview

Both daily map generation and level-editor ingestion use the same `MapValidator` rules (`js/generation/MapValidator.js`).

The level editor (`scripts/lib/levelEditorMap.js`) re-solves the map with the Python MILP solver, then validates it with the same validator used in generation.

## Core Rule Behavior

- Solver objective is to maximize penned score within a wall budget.
- Solver tie-break minimizes wall count among equally optimal score solutions.
- Effective `maxWalls` stored with a solved map is aligned to `optimalWallCount`.

This matches generation behavior in `js/generation/MapGenerator.js` where accepted maps are stored with:

- `goal = optimal goal area`
- `maxWalls = optimalWallCount`

So the playable map budget reflects the exact wall count needed for the optimal score.

## Validation Rules (MapValidator)

1. Home must have a valid path to an edge in the un-walled map.
2. Goal area must be at least 9.
3. Optimal wall count must not exceed size-based wall budget (`floor(size * 0.75)`).
4. Optimal walls cannot all be edge-only.
5. All walkable tiles must be reachable from home.
6. All non-edge walkable tiles must be reachable without traversing edge tiles.
7. No score-modifying tiles adjacent to home.
8. At least one star exists.
9. At least one bee exists.
10. No adjacent fillable holes.
11. No weak holes (area cutoff must exceed threshold).
12. Per-tile `maxPerLevel` limits must not be exceeded.

## Notes for Future Changes

- Do not reintroduce a validator rule that invalidates maps simply because `optimalWallCount < maxWalls`.
- If generation/editor wall-budget behavior changes, update:
  - `js/generation/MapGenerator.js`
  - `scripts/lib/levelEditorMap.js`
  - this document
  - `docs/MAP_GENERATION.md`
