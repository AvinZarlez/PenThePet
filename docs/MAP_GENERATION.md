# Map Generation Documentation

## Overview

This document explains the map generation system for PenThePet, including the algorithms, validation rules, metadata structure, and requirements for future development.

## Map Generation Process

### Goal: Maximum Achievable Area

The map generation system finds the **MAXIMUM** achievable penned area for each map. This means:

1. The solver searches for the largest area that can be enclosed by optimally placing walls
2. The goal represents the best possible score a player can achieve
3. The wall budget is determined by the grid size: `floor(size × 0.75)`

### Algorithm: Python MILP Solver

**Key Requirement:** Provably optimal results using Mixed Integer Linear Programming.

The map generation uses a Python MILP solver (`scripts/solver/solve.py`) powered by PuLP + CBC that:

1. **Formulates the problem as a Mixed Integer Linear Program** with binary variables for wall placement and pen membership
2. **Uses network flow constraints** to ensure the pen is a connected region containing home
3. **Uses vertex-cut constraints** to ensure the pen boundary is entirely walls/water
4. **Maximizes the enclosed area** subject to wall budget constraints
5. **Returns provably optimal solutions** (not approximations)

The solver runs in Node.js via subprocess call to Python, making it suitable for the level generation pipeline (not browser).

#### Why MILP?

- **Provably optimal**: CBC solver guarantees the solution is optimal (not a heuristic approximation)
- **Fast**: Solves 21×21 maps in under 2 seconds
- **Scalable**: Handles any map size efficiently
- **Reliable**: No combinatorial explosion as with brute-force search

### Wall Budget Formula

The number of walls a player gets is determined by the grid size:

```text
maxWalls = floor(size × 0.75)
```

| Grid Size | maxWalls |
|-----------|----------|
| 7×7       | 5        |
| 9×9       | 6        |
| 11×11     | 8        |
| 13×13     | 9        |
| 15×15     | 11       |
| 21×21     | 15       |

### Map Quality Validation

**All generated maps must pass these validation rules:**

1. **Path to edge exists**: Pet can reach edge from home when no walls are placed
2. **Goal area >= 5**: Maps with smaller goals are too easy and rejected
3. **Walls within budget**: Optimal wall count must be ≤ maxWalls for the grid size
4. **Not all walls on edges**: At least one optimal wall must be placed on a non-edge tile (prevents trivial solutions)

Maps that fail any validation rule are discarded and regeneration is attempted.

### Retry Logic

If a map cannot meet quality standards, the generation:

1. **Does NOT return an error immediately**
2. **Discards the current map**
3. **Generates a new random map**
4. **Repeats until a valid map is found** (up to 1000 attempts)

This ensures all maps in the game meet quality standards.

## Map Metadata Structure

Each map in `maps.json` contains the following fields:

```json
{
  "dayNumber": 1,          // Sequential ordering (1, 2, 3, ...)
  "mapName": "Coral",      // Random English word for personality
  "date": "2026-02-06",    // Date in YYYY-MM-DD format
  "size": 7,               // Grid size (7x7, 9x9, 11x11, etc.)
  "goal": 13,              // Maximum achievable penned area
  "maxWalls": 5,           // Wall budget: floor(size * 0.75)
  "map": [                 // 2D array of tile types
    ["grass", "water", ...],
    ...
  ]
}
```

### Field Descriptions

- **dayNumber**: Sequential number for ordering maps. First map is 1, second is 2, etc.
- **mapName**: Random English word from `js/wordList.js` for memorable map identification
- **date**: Date string used as the map key in maps.json
- **size**: Grid dimensions (always square: size x size)
- **goal**: The maximum area achievable with optimal wall placement within the wall budget
- **maxWalls**: The wall budget for the player, computed as `floor(size * 0.75)`
- **map**: 2D array where each cell is "grass", "water", or "home"

## Constants Configuration

All configurable values are centralized in `js/constants.js`:

```javascript
const CONSTANTS = {
    MAX_WALLS: 15,              // Absolute maximum walls (for largest grid sizes)
    maxWallsForSize: function(size) {
        return Math.floor(size * 0.75);
    },
    MAX_GRID_SIZE: 21,          // Maximum grid size
    MIN_GRID_SIZE: 7,           // Minimum grid size
    DEFAULT_GRID_SIZE: 9,       // Default grid size
    
    TILE_DISTRIBUTION: {
        grass: 0.7,             // 70% grass tiles
        water: 0.3,             // 30% water tiles
    },
    
    // ... other constants
};
```

**Important:** Never hardcode these values in game logic. Always reference `CONSTANTS`.

## Map Quality Standards

### Validation Rules

Every generated map must pass these quality checks (implemented in `js/MapValidator.js`):

#### 1. Path to Edge (Required)

- Pet must be able to reach at least one edge tile from home
- Checked using BFS pathfinding
- Maps without a valid path are discarded

#### 2. Minimum Goal Area (goalArea >= 5)

- Goal area must be at least 5 tiles
- Prevents maps that are too easy or trivial
- Example: A 3x3 pen would fail (only 1-2 tiles achievable)

#### 3. Maximum Walls (within budget)

- Solution must use at most `maxWallsForSize(size)` walls
- Ensures maps are solvable within the player's wall budget
- Maps requiring more walls are discarded

#### 4. Strategic Wall Placement (Not All on Edges)

- At least one optimal wall must be placed on a non-edge tile
- Prevents trivial solutions (just blocking edge exits)
- Encourages strategic thinking about interior placement

### Validation in Practice

```javascript
const MapValidator = require('./js/MapValidator.js');

const validation = MapValidator.validate(map, {
    goalArea: result.goal,
    optimalWallCount: result.maxWalls,
    optimalSolution: result.optimalSolution
});

if (!validation.valid) {
    console.log('Map failed validation:', validation.errors);
    // Discard map and generate a new one
}
```

## Generating New Maps

### Method 1: GitHub Actions (Recommended for Production)

Use the GitHub Actions workflow to generate and commit a single daily map:

1. Go to the **Actions** tab in the GitHub repository
2. Select **"Generate Daily Map"** workflow
3. Click **"Run workflow"**
4. Fill in parameters:
   - **date**: Date in YYYY-MM-DD format (e.g., `2026-02-15`)
   - **size**: Map size (7, 9, 11, etc.)
5. Click **"Run workflow"**

The workflow will:

- Set up Python and install PuLP (MILP solver dependency)
- Generate a map using the Python MILP solver for optimal results
- Validate it meets quality standards
- Automatically commit the new map to `maps.json`
- Assign next day number and random name

### Method 2: Local Script for Single Map

Generate a single map locally and add it to maps.json:

```bash
# Install Python dependencies first
pip install -r scripts/solver/requirements.txt

# Generate a map (maxWalls is computed automatically from size)
node scripts/generate-single-map.js --date 2026-02-15 --size 9
```

### Method 3: Batch Generation

The `scripts/generate-maps.js` script generates multiple maps:

```bash
# Generate 10 fresh maps (replace existing)
node scripts/generate-maps.js --fresh --count 10 --start-date 2026-02-06 --sizes 7,9,11

# Add 5 new maps (append to existing)
node scripts/generate-maps.js --count 5 --start-date 2026-02-16 --sizes 9,11
```

### Auditing Existing Maps

Check if all maps in maps.json meet validation standards:

```bash
node scripts/audit-maps.js
```

This will report any maps that fail validation rules.

### Script Options

- `--fresh`: Replace all existing maps (default: append)
- `--count N`: Generate N maps (default: 10)
- `--start-date YYYY-MM-DD`: Starting date (default: today)
- `--sizes N,M,K`: Grid sizes to cycle through (default: 7,9,11)

### Script Behavior

1. Loads existing maps (unless `--fresh` is used)
2. Generates new maps starting from next day number
3. Assigns random English words as map names
4. Saves all maps to `maps.json` with proper formatting
5. Displays summary of generated maps

## Map Validation

Each generated map is validated to ensure:

1. **Path exists**: Pet can reach an edge from home (when no walls placed)
2. **Solvable**: Can be penned within the wall budget (`floor(size * 0.75)`)
3. **Optimal**: Goal represents maximum achievable area
4. **Strategic**: Not all walls on edges (prevents trivial solutions)

## Code Architecture

### Key Files

1. **js/constants.js**: All configurable constants including `maxWallsForSize()`
2. **js/MapValidator.js**: Quality validation rules
3. **js/MapGenerator.js**: Main map generation logic (NO FALLBACKS)
4. **scripts/solver/MILPSolver.js**: Node.js wrapper that calls Python MILP solver
5. **js/PathfindingUtils.js**: BFS pathfinding for penning checks
6. **js/wordList.js**: Random English words for map names
7. **scripts/solver/solve.py**: Python MILP solver using PuLP + CBC
8. **scripts/solver/requirements.txt**: Python dependencies
9. **scripts/generate-single-map.js**: Generate one map (used by GitHub Actions)
10. **scripts/generate-maps.js**: CLI script for batch map generation

### Generation Flow

```text
MapGenerator.generate()
  → _generateRandomMap()
  → _validateMap() [BFS pathfinding]
  → calculateGoal()
      → MILPSolver.solveMap() [Node.js wrapper]
          → _solvePython() [calls scripts/solver/solve.py]
              → PuLP MILP solver (CBC)
  → MapValidator.validate() [quality checks]
  → Return { map, goal, maxWalls } or RETRY (up to 1000 attempts)
  → If all attempts fail: THROW ERROR (no fallback!)
```

**IMPORTANT**: No fallback to guaranteed valid maps. If generation fails after 1000 attempts, it throws an error. This ensures consistency and prevents degraded map quality.

### MILP Solver Architecture

The Python MILP solver (`scripts/solver/solve.py`) formulates the problem as:

**Variables:**

- `s[i]` ∈ {0,1}: Whether tile `i` is in the pen
- `w[i]` ∈ {0,1}: Whether a wall is placed on grass tile `i`
- `f[i,j]` ≥ 0: Network flow between adjacent tiles

**Objective:** Maximize Σ s[i] (total enclosed area)

**Constraints:**

1. Home is in the pen
2. Boundary tiles are NOT in the pen
3. Walled tiles are NOT in the pen
4. Total walls ≤ maxWalls budget
5. Vertex cut: adjacent tiles on different sides need a wall
6. Flow conservation: ensures pen connectivity to home
7. Flow capacity: flow only through pen tiles

### Validation Flow

```text
MapValidator.validate(map, solution)
  → _hasPathToEdge() [BFS check]
  → Check goalArea >= 5
  → Check optimalWallCount <= maxWallsForSize(map.length)
  → _allWallsOnEdge() [strategic placement check]
  → Return {valid, errors}
```

## Dependencies

### Python Dependencies (Level Generation)

The MILP solver requires Python 3 and PuLP. Install with:

```bash
pip install -r scripts/solver/requirements.txt
```

PuLP includes the CBC solver, which is used for the MILP optimization.

### Node.js Dependencies (Testing)

Standard Jest testing framework. Install with:

```bash
npm install
```

## Future Considerations

### Seeded Random Generation

Currently, maps vary randomly even with the same date string. To implement deterministic seeded generation:

1. Add a seeded random number generator (e.g., seedrandom.js)
2. Use date string as seed in `MapGenerator._generateRandomMap()`
3. This would ensure the same map is generated for the same date

### Performance Optimization

If generation becomes too slow for larger grids:

1. Increase the 100k limit per wall count (tradeoff: memory usage)
2. Add parallel processing for checking combinations
3. Implement smarter early stopping based on area thresholds

### Alternative Tile Types

To add new tile types beyond grass/water:

1. Update `CONSTANTS.TILE_DISTRIBUTION` in constants.js
2. Define new tile in `js/tileTypes.js`
3. Update solver's blocking logic in `js/PathfindingUtils.js`

## Testing Map Generation

To test map generation:

```bash
# Generate a single map
node -e "
const MapGenerator = require('./js/MapGenerator.js');
const gen = new MapGenerator(7);
const result = gen.generate('2026-01-01');
console.log('Goal:', result.goal);
console.log('Walls:', result.maxWalls);
"

# Run the generation script with test data
node scripts/generate-maps.js --count 3 --sizes 7
```

## Summary for Future Agents

**When generating maps:**

1. Use GitHub Actions workflow for production daily maps (preferred)
2. Use `scripts/generate-single-map.js` for local testing
3. Use `scripts/generate-maps.js` for batch generation
4. Run `scripts/audit-maps.js` to validate existing maps
5. Ensure CONSTANTS.MAX_WALLS = 15 (never change without regenerating all maps)
6. All maps MUST pass MapValidator checks (goal >= 5, not all walls on edges, etc.)
7. Verify maps.json has correct JSON format after generation
8. Test at least one generated map in the game to ensure it works

**When modifying generation:**

1. Changes to the solver algorithm require regenerating all existing maps
2. Always prioritize accuracy over speed (user requirement)
3. Update MapValidator.js if adding new quality rules
4. Update this documentation when making significant changes
5. Test thoroughly with maps of different sizes (7x7, 9x9, 11x11, 21x21)
6. Run full test suite to ensure no regressions

**Key Invariants:**

- maxWalls = floor(size × 0.75) per grid size
- Goal = maximum achievable area
- goalArea >= 5 (minimum difficulty)
- At least one wall not on edge (strategic placement)
- Maps validated to have path to edge initially
- **NO FALLBACKS**: Generation throws error if it fails (never falls back to simplified maps)

**Solver Usage Policy:**

1. **Production**: Python MILP solver (scripts/solver/solve.py)
   - Used for all map generation (scripts, GitHub Actions)
   - Provably optimal using PuLP + CBC
   - Called via Node.js wrapper (scripts/solver/MILPSolver.js)
   - No solver code in the browser

2. **Browser**: Checker only
   - Game.js checks if pet is penned using PathfindingUtils
   - No solver or map generation in the browser
   - Maps are loaded from maps.json only

3. **No Fallback Logic**:
   - Map generation uses single consistent method
   - If generation fails, throw error (no fallback to simplified maps)
   - This ensures all maps meet same quality standards

All production paths use the MILP solver and validation rules.
Time-limited generation has been removed to ensure consistent quality.
