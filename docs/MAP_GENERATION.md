# Map Generation Documentation

## Overview

This document explains the map generation system for PenThePet, including the algorithms, validation rules, metadata structure, and requirements for future development.

## Map Generation Process

### Goal: Maximum Achievable Area

The map generation system finds the **MAXIMUM** achievable penned area for each map. This means:

1. The solver searches for the largest area that can be enclosed by optimally placing walls
2. The goal represents the best possible score a player can achieve
3. The system determines the minimum number of walls needed to achieve this maximum area

### Algorithm: Memory-Efficient Exhaustive Search

**Key Requirement:** Accuracy is prioritized over speed.

The map generation uses a memory-efficient exhaustive search algorithm that:

1. **Generates combinations on-the-fly** instead of storing all combinations in memory
2. **Checks up to 50 million combinations per wall count** (safety limit for performance)
3. **Tries wall counts from 1 to 15** (CONSTANTS.MAX_WALLS)
4. **Finds the maximum penned area** by testing each combination
5. **Uses MapValidator to ensure quality standards**

#### Why Exhaustive Search?

User requirement: *"Accuracy is far more important than speed, levels can take as long as they need to generate."*

The exhaustive search ensures we find the true optimal solution (within the 50M combination limit per wall count) rather than using heuristics that might miss the best solution.

### Map Quality Validation

**All generated maps must pass these validation rules:**

1. **Path to edge exists**: Pet can reach edge from home when no walls are placed
2. **Goal area >= 5**: Maps with smaller goals are too easy and rejected
3. **Walls <= 15**: Maximum walls that can be used is CONSTANTS.MAX_WALLS (15)
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
  "maxWalls": 8,           // Minimum walls needed to achieve goal
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
- **goal**: The maximum area achievable with optimal wall placement
- **maxWalls**: The minimum number of walls needed to achieve the goal area
- **map**: 2D array where each cell is "grass", "water", or "home"

## Constants Configuration

All configurable values are centralized in `js/constants.js`:

```javascript
const CONSTANTS = {
    MAX_WALLS: 15,              // Maximum walls allowed in any level
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

#### 3. Maximum Walls (optimalWallCount <= 15)
- Solution must use at most CONSTANTS.MAX_WALLS (15) walls
- Ensures maps are solvable within player constraints
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
   - **max_walls**: Maximum walls to try (default: 15)
5. Click **"Run workflow"**

The workflow will:
- Generate a map using exhaustive search
- Validate it meets quality standards
- For small maps (≤7x7), verify with brute force
- Automatically commit the new map to `maps.json`
- Assign next day number and random name

### Method 2: Local Script for Single Map

Generate a single map locally and add it to maps.json:

```bash
node scripts/generate-single-map.js --date 2026-02-15 --size 9

# With custom max walls
node scripts/generate-single-map.js --date 2026-02-15 --size 11 --max-walls 12
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
2. **Solvable**: Can be penned with ≤ MAX_WALLS (15) walls
3. **Optimal**: Goal represents maximum achievable area
4. **Minimal walls**: maxWalls is the minimum needed to achieve goal

## Code Architecture

### Key Files

1. **js/constants.js**: All configurable constants
2. **js/MapValidator.js**: Quality validation rules (NEW)
3. **js/MapGenerator.js**: Main map generation logic
4. **js/MILPSolver.js**: Exhaustive search solver for finding optimal wall placements
5. **js/wordList.js**: Random English words for map names
6. **test/BruteForceSolver.js**: Ground truth verification for small maps
7. **scripts/generate-single-map.js**: Generate one map (used by GitHub Actions)
8. **scripts/generate-maps.js**: CLI script for batch map generation
9. **scripts/audit-maps.js**: Validate existing maps

### Generation Flow

```
MapGenerator.generate()
  → _generateRandomMap()
  → _validateMap() [BFS pathfinding]
  → calculateGoal()
      → MILPSolver.solveMap()
          → _exhaustiveSearch() [memory-efficient]
              → _checkCombinationsIteratively()
  → MapValidator.validate() [NEW - quality checks]
  → Return { map, goal, maxWalls } or retry
```

### Validation Flow (NEW)

```
MapValidator.validate(map, solution)
  → _hasPathToEdge() [BFS check]
  → Check goalArea >= 5
  → Check optimalWallCount <= MAX_WALLS
  → _allWallsOnEdge() [strategic placement check]
  → Return {valid, errors}
```

### Solver Algorithm Pseudocode

```
For numWalls = 1 to MAX_WALLS:
    combinations_checked = 0
    best_area = 0
    
    For each combination of numWalls walls:
        if combinations_checked >= 100,000:
            break  // Safety limit
        
        Place walls on map
        if pet is penned:
            area = calculate_penned_area()
            if area > best_area:
                best_area = area
                best_solution = current_walls
        
        combinations_checked++
    
    if found_solution and numWalls >= 8:
        break  // Early exit
    
Return best_solution
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

- MAX_WALLS = 15 (constant across all maps)
- Goal = maximum achievable area
- maxWalls = minimum walls needed for goal
- goalArea >= 5 (minimum difficulty)
- At least one wall not on edge (strategic placement)
- All maps solvable with ≤ 15 walls
- Maps validated to have path to edge initially

**Three Generation Paths (All Use Same Method):**

1. **Test Setup**: Uses BruteForceSolver for ground truth verification (≤7x7 only)
2. **Production Maps**: Uses MILPSolver exhaustive search + MapValidator
3. **Debug Maps**: Uses MILPSolver exhaustive search + MapValidator (same as production)

All three paths now use the same exhaustive search algorithm and validation rules.
Time-limited generation has been removed to ensure consistent quality.
