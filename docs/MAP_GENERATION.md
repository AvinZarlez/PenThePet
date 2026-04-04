# Map Generation

## Overview

Maps are pre-generated offline and stored in `maps/YYYY.json` (one file per year). The goal is the **MAXIMUM** achievable penned area with optimal wall placement.

## Algorithm

The Python MILP solver (`scripts/solver/solve.py`, powered by PuLP + CBC):

1. Generates a random map (grass/water distribution per `CONSTANTS.TILE_DISTRIBUTION`)
2. Validates home can reach an edge (BFS)
3. Formulates a Mixed Integer Linear Program:
   - Variables: `s[i]` ∈ {0,1} (tile in pen), `w[i]` ∈ {0,1} (wall placed), `f[i,j]` ≥ 0 (network flow)
   - Objective: maximize Σ s[i]
   - Constraints: home in pen, boundary tiles not in pen, walls not in pen, wall budget, vertex-cut (adjacency), flow conservation (pen connectivity)
4. Returns provably optimal solution (not a heuristic)

**Why MILP?** Provably optimal, solves 17×17 maps in <2 seconds, scales to any grid size.

**Wall budget input to solver:** `maxWalls = floor(size × 0.75)`

| Size  | maxWalls |
| ----- | -------- |
| 9×9   | 6        |
| 11×11 | 8        |
| 13×13 | 9        |
| 15×15 | 11       |
| 17×17 | 12       |

**Retry logic:** Up to 1000 attempts per map. If all fail, throws an error (no fallbacks).

## Map Quality Validation

All maps must pass `MapValidator` checks:

1. **Path to edge** — home can reach an edge tile with no walls placed
2. **Goal area ≥ 9** — prevents trivially easy maps
3. **Wall budget** — optimal wall count ≤ `floor(size × 0.75)`
4. **Strategic placement** — at least one optimal wall is on a non-edge tile
5. **No adjacent holes** — fillable tiles (holes) cannot be orthogonally adjacent; one is replaced with grass
6. **Hole bypass check** — if the pet can get around an empty hole with ≤5 extra steps compared to walking through a filled hole, the hole is replaced with water. Uses BFS shortest-path comparison to ensure accuracy.
7. **No score-modifying tiles adjacent to home** — stars and bees directly next to home are always penned regardless of wall placement, so they offer no strategic choice. Such tiles are replaced with grass during generation.

## Map Data Format

Each entry in `maps/YYYY.json` is keyed by date (`YYYY-MM-DD`):

```json
{
  "dayNumber": 1,
  "mapName": "Coral",
  "date": "2026-02-06",
  "size": 9,
  "goal": 19,
  "maxWalls": 6,
  "map": "gwgwh...",
  "optimalSolution": [1, 0, 2, 3],
  "version": 1
}
```

**`map`** — compact string of `size²` characters, row-major: `g`=grass, `w`=water, `h`=home, `s`=star, `b`=bee, `o`=hole. Decode with `parseCompactMap(mapStr, size)` in `js/game/Grid.js`.

**`optimalSolution`** — flat array `[r0, c0, r1, c1, …]` of optimal wall coordinates. Decode with `parseCompactSolution(flatArr)` in `js/game/Grid.js`.

**`version`** — integer incremented each time the map layout or goal value changes. Starts at `1` for all generated maps. Maps without this field (or with no `version`) are treated as version `0`. When a user loads a puzzle and their saved data carries a different version number, the game automatically migrates or resets their progress — see [Save-data migration](#save-data-migration) below.

## Generating Maps

### Method 1: GitHub Actions (recommended)

1. **Actions** tab → **Generate Daily Map** → **Run workflow**
2. Parameters: `date` (optional, defaults to next available), `size` (exact or range like `9-17`), `count` (default 1)
3. The workflow generates maps, validates quality, and opens a PR against `main`

> **Setup:** Enable "Allow GitHub Actions to create and approve pull requests" in Settings → Actions → General, or add a `REPO_TOKEN` secret with `repo` scope.

### Method 2: Local Script

```bash
pip install -r scripts/solver/requirements.txt

node scripts/generate-map.js --date 2026-02-15 --size 9
node scripts/generate-map.js --size 9-17 --count 5
node scripts/generate-map.js --fresh --count 10 --date 2026-03-01 --size 9
```

**Arguments:** `--date YYYY-MM-DD` (optional), `--size N` or `--size N-M`, `--count N` (default 1), `--fresh` (replace all existing maps).

### Auditing Existing Maps

```bash
node scripts/audit-maps.js   # validates all maps in maps/ directory
```

## Key Files

| File                           | Role                                                  |
| ------------------------------ | ----------------------------------------------------- |
| `js/config/constants.js`       | `maxWallsForSize()`, `TILE_DISTRIBUTION`, size limits |
| `js/game/Grid.js`              | `parseCompactMap()`, `parseCompactSolution()`         |
| `js/generation/MapValidator.js`| Quality validation rules                              |
| `js/generation/MapGenerator.js`| Map generation logic (Node.js only, not browser)      |
| `js/game/PathfindingUtils.js`  | BFS pathfinding for penning/connectivity checks       |
| `js/generation/wordList.js`    | Random words for map names                            |
| `scripts/solver/MILPSolver.js` | Node.js wrapper calling Python solver                 |
| `scripts/solver/solve.py`      | Python MILP solver (PuLP + CBC)                       |
| `scripts/generate-map.js`      | CLI entry point (single, batch, or fresh)             |
| `scripts/lib/mapUtils.js`      | Date helpers, size parsing, DB validation/fix         |
| `scripts/audit-maps.js`        | Validates all maps in `maps/` against MapValidator    |

## Generation Flow

```text
MapGenerator.generate()
  → _generateRandomMap()
  → _fixAdjacentHoles()
  → _enforceMaxPerLevel()
  → _removeScoreModifyingTilesAdjacentToHome()   [NEW: replace adjacent stars/bees with grass]
  → _placeHoles()
  → _validateMap() [BFS]
  → calculateGoal()
      → MILPSolver.solveMap() [Node.js wrapper]
          → scripts/solver/solve.py [PuLP MILP]
  → MapValidator.validate() [quality checks]
  → Return { map, goal, maxWalls } or RETRY (up to 1000)
  → If all attempts fail: THROW ERROR (no fallback)
```

## Key Invariants

- Solver receives `floor(size × 0.75)` as the wall budget input.
- Stored map `maxWalls` is aligned to `optimalWallCount` so the published level budget matches the solved optimum.
- Goal = maximum achievable area; `goalArea ≥ 9`; at least one wall not on edge
- Home can reach edge initially; no fallbacks — generation throws on failure
- Compact format: tile string (`g`/`w`/`h`) + flat solution array `[r,c,r,c,…]`
- No map generation in the browser — browser is checker only
- Maps for today and the past are **frozen** — never regenerate or edit them; only fix future maps
- Every newly generated map carries `version: 1`; increment this integer by hand whenever the layout or goal is changed on an already-published map
- **Only increment `version` when map data actually changes** (goal score, maxWalls, or optimalSolution). If a re-solve produces the same goal, same wall count, and same optimal solution, leave `version` unchanged. Do not bump version just because you ran a solver — only bump it when the stored values differ from before.

## Save-data migration

Each map carries an integer `version` field (default `1` for new maps; maps without the field are treated as `0`). When the game loads a puzzle, it compares the map's `version` against the `mapVersion` stored in the user's saved data:

| Situation | Behaviour |
|-----------|-----------|
| Versions match | Load save data normally |
| Mismatch, user previously achieved a perfect score (`score ≥ goal at submission time`) | Migrate: keep the submission timestamp, update score and wall layout to the current optimal solution |
| Mismatch, score was below the goal at submission time | Delete all save data for that puzzle (submission, progress, timer) and reset progress |

**How "perfect at submission time" is determined:** each submission now stores the map's `goal` value at the moment the user submitted. Migration compares the user's saved score against this stored goal — not the new map's goal. This correctly handles both directions of goal change:

- **Goal decreased** (e.g. 75 → 70): user's score of 75 ≥ stored goal 75 → migrated ✓
- **Goal increased** (e.g. 36 → 37): user's score of 36 ≥ stored goal 36 → migrated ✓

Submissions written before this `goal` field was introduced (schema v1.1 and earlier) have `goal: null` after migration. For those legacy saves, the comparison falls back to the *new* map goal — matching the original behavior.

To update a live map, edit `maps/YYYY.json`, increment its `version` by 1, and commit. Users will be migrated automatically on their next visit.

---

**See also:** [docs/README.md](README.md) · [CODE_STRUCTURE.md](CODE_STRUCTURE.md) · [DEVELOPMENT.md](DEVELOPMENT.md)
