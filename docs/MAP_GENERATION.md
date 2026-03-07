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

**Wall budget:** `maxWalls = floor(size × 0.75)`

| Size | maxWalls |
|------|----------|
| 7×7  | 5        |
| 9×9  | 6        |
| 11×11 | 8       |
| 13×13 | 9       |
| 15×15 | 11      |
| 17×17 | 12      |

**Retry logic:** Up to 1000 attempts per map. If all fail, throws an error (no fallbacks).

## Map Quality Validation

All maps must pass `MapValidator` checks:

1. **Path to edge** — home can reach an edge tile with no walls placed
2. **Goal area ≥ 5** — prevents trivially easy maps
3. **Wall budget** — optimal wall count ≤ `floor(size × 0.75)`
4. **Strategic placement** — at least one optimal wall is on a non-edge tile
5. **No adjacent holes** — fillable tiles (holes) cannot be orthogonally adjacent; one is replaced with grass
6. **Hole bypass check** — if the pet can get around an empty hole with ≤5 extra steps compared to walking through a filled hole, the hole is replaced with water. Uses BFS shortest-path comparison to ensure accuracy.

## Map Data Format

Each entry in `maps/YYYY.json` is keyed by date (`YYYY-MM-DD`):

```json
{
  "dayNumber": 1,
  "mapName": "Coral",
  "date": "2026-02-06",
  "size": 7,
  "goal": 13,
  "maxWalls": 5,
  "map": "gwgwh...",
  "optimalSolution": [1, 0, 2, 3]
}
```

**`map`** — compact string of `size²` characters, row-major: `g`=grass, `w`=water, `h`=home, `s`=star, `b`=bee, `o`=hole. Decode with `parseCompactMap(mapStr, size)` in `js/Grid.js`.

**`optimalSolution`** — flat array `[r0, c0, r1, c1, …]` of optimal wall coordinates. Decode with `parseCompactSolution(flatArr)` in `js/Grid.js`.

## Generating Maps

### Method 1: GitHub Actions (recommended)

1. **Actions** tab → **Generate Daily Map** → **Run workflow**
2. Parameters: `date` (optional, defaults to next available), `size` (exact or range like `7-17`), `count` (default 1)
3. The workflow generates maps, validates quality, and opens a PR against `main`

> **Setup:** Enable "Allow GitHub Actions to create and approve pull requests" in Settings → Actions → General, or add a `REPO_TOKEN` secret with `repo` scope.

### Method 2: Local Script

```bash
pip install -r scripts/solver/requirements.txt

node scripts/generate-map.js --date 2026-02-15 --size 9
node scripts/generate-map.js --size 7-17 --count 5
node scripts/generate-map.js --fresh --count 10 --date 2026-03-01 --size 9
```

**Arguments:** `--date YYYY-MM-DD` (optional), `--size N` or `--size N-M`, `--count N` (default 1), `--fresh` (replace all existing maps).

### Auditing Existing Maps

```bash
node scripts/audit-maps.js   # validates all maps in maps/ directory
```

## Key Files

| File | Role |
|---|---|
| `js/constants.js` | `maxWallsForSize()`, `TILE_DISTRIBUTION`, size limits |
| `js/Grid.js` | `parseCompactMap()`, `parseCompactSolution()` |
| `js/MapValidator.js` | Quality validation rules |
| `js/MapGenerator.js` | Map generation logic (Node.js only, not browser) |
| `js/PathfindingUtils.js` | BFS pathfinding for penning/connectivity checks |
| `js/wordList.js` | Random words for map names |
| `scripts/solver/MILPSolver.js` | Node.js wrapper calling Python solver |
| `scripts/solver/solve.py` | Python MILP solver (PuLP + CBC) |
| `scripts/generate-map.js` | CLI entry point (single, batch, or fresh) |
| `scripts/lib/mapUtils.js` | Date helpers, size parsing, DB validation/fix |
| `scripts/audit-maps.js` | Validates all maps in `maps/` against MapValidator |

## Generation Flow

```text
MapGenerator.generate()
  → _generateRandomMap()
  → _validateMap() [BFS]
  → calculateGoal()
      → MILPSolver.solveMap() [Node.js wrapper]
          → scripts/solver/solve.py [PuLP MILP]
  → MapValidator.validate() [quality checks]
  → Return { map, goal, maxWalls } or RETRY (up to 1000)
  → If all attempts fail: THROW ERROR (no fallback)
```

## Key Invariants

- `maxWalls = floor(size × 0.75)` — stored per-map; never change without regenerating all maps
- Goal = maximum achievable area; `goalArea ≥ 5`; at least one wall not on edge
- Home can reach edge initially; no fallbacks — generation throws on failure
- Compact format: tile string (`g`/`w`/`h`) + flat solution array `[r,c,r,c,…]`
- No map generation in the browser — browser is checker only

---

**See also:** [docs/README.md](README.md) · [CODE_STRUCTURE.md](CODE_STRUCTURE.md) · [DEVELOPMENT.md](DEVELOPMENT.md)
