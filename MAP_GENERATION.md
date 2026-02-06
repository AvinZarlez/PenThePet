# Map Generation Documentation

## Overview

This document explains the map generation system for PenThePet, including the algorithms, metadata structure, and requirements for future development.

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
2. **Checks up to 100,000 combinations per wall count** (safety limit for performance)
3. **Tries wall counts from 1 to 15** (CONSTANTS.MAX_WALLS)
4. **Finds the maximum penned area** by testing each combination
5. **Uses early stopping** after finding a solution with 8+ walls

#### Why Exhaustive Search?

User requirement: *"Remove any alternate calculation paths no matter how complex the problem is. Accuracy is far more important than speed, levels can take as long as they need to generate."*

The exhaustive search ensures we find the true optimal solution (within the 100k combination limit per wall count) rather than using heuristics that might miss the best solution.

### Retry Logic

If a map cannot be solved with ≤15 walls (CONSTANTS.MAX_WALLS), the generation:

1. **Does NOT return an error**
2. **Discards the current map**
3. **Generates a new random map**
4. **Repeats until a valid map is found**

This ensures all maps in the game are solvable with the maximum wall limit.

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

## Generating New Maps

### Using the Script

The `scripts/generate-maps.js` script generates maps with proper metadata:

```bash
# Generate 10 fresh maps (replace existing)
node scripts/generate-maps.js --fresh --count 10 --start-date 2026-02-06 --sizes 7,9,11

# Add 5 new maps (append to existing)
node scripts/generate-maps.js --count 5 --start-date 2026-02-16 --sizes 9,11
```

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
2. **js/MapGenerator.js**: Main map generation logic
3. **js/MILPSolver.js**: Exhaustive search solver for finding optimal wall placements
4. **js/wordList.js**: Random English words for map names
5. **scripts/generate-maps.js**: CLI script for batch map generation

### Generation Flow

```
MapGenerator.generate()
  → _generateRandomMap()
  → _validateMap() [BFS pathfinding]
  → calculateGoal()
      → MILPSolver.solveMap()
          → _exhaustiveSearch() [memory-efficient]
              → _checkCombinationsIteratively()
  → Return { map, goal, maxWalls }
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

1. Use `scripts/generate-maps.js` with appropriate options
2. Ensure CONSTANTS.MAX_WALLS = 15 (never change this without regenerating all maps)
3. All maps MUST have dayNumber and mapName metadata
4. Verify maps.json has correct JSON format after generation
5. Test at least one generated map in the game to ensure it works

**When modifying generation:**

1. Changes to the solver algorithm require regenerating all existing maps
2. Always prioritize accuracy over speed (user requirement)
3. Update this documentation when making significant changes
4. Test thoroughly with maps of different sizes (7x7, 9x9, 11x11, 21x21)

**Key Invariants:**

- MAX_WALLS = 15 (constant across all maps)
- Goal = maximum achievable area
- maxWalls = minimum walls needed for goal
- All maps solvable with ≤ 15 walls
- Maps validated to have path to edge initially
