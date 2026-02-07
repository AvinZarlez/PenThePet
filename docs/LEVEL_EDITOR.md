# Level Editor Documentation

## Overview

The Level Editor is a standalone tool for creating custom levels for Pen the Pet. It provides a visual interface for designing maps and uses the same solver algorithms as the main game to calculate optimal solutions.

**Access the editor:** Open `editor.html` in your web browser

## Features

- **Visual Grid Editing**: Click to paint tiles on a grid
- **Multiple Tile Types**: Grass, water, and home tiles
- **Flexible Grid Sizes**: 5x5 to 21x21 grids
- **Built-in Solver**: Calculate optimal wall placement and goal area
- **Export Functionality**: Copy map data as JSON
- **Local Storage Integration**: Save maps directly to browser storage

## How to Use the Level Editor

### 1. Create Your Map

#### Set Grid Size
Use the slider to select your desired grid size (5-21). The grid will automatically resize.

#### Paint Tiles
1. Select a tile type from the dropdown: Grass, Water, or Home
2. Click on grid cells to place the selected tile type
3. Click again on a placed tile to remove it (reverts to grass)
4. Click on different tile types to change them

#### Place Home Tile
- **Required**: Every map must have exactly one home tile
- **Restriction**: Home cannot be placed on edge tiles (first/last row or column)
- **Tip**: Placing a new home automatically removes the previous one

#### Level Settings
- **Level Name**: Optional name for your level (used in basic export)
- **Max Walls**: Set the maximum number of walls available (1-15)

### 2. Export Basic Level (Optional)

Click **"Save Level"** to export your map design:
- Creates a JSON representation of your map
- Includes size, maxWalls, and map layout
- Does NOT include the solution (goal area, optimal walls)
- Useful for sharing incomplete map designs

### 3. Run the Solver

Click **"Run Solver"** to calculate the optimal solution:

**What Happens:**
1. Validates that a home tile is placed
2. Converts your map to the solver's numeric format
3. Runs `MILPSolver.solveMap()` from the main codebase
4. Calculates the maximum achievable penned area (goal)
5. Determines the minimum walls needed to achieve that goal
6. Generates the exact wall positions for the optimal solution

**Processing Time:**
- Small maps (≤7x7): Almost instant
- Medium maps (9x9-11x11): A few seconds
- Large maps (≥13x13): May take longer (up to a minute or more)

**Output:**
A "Complete Map" section appears showing:
- Grid size
- Goal area (maximum achievable penned area)
- Optimal wall count (minimum walls needed)
- Full JSON with `optimalSolution` array

### 4. Insert Map into Storage

After running the solver, you can save the complete map to localStorage:

#### Date Selection (Optional)
- **Leave blank**: Uses today's date
- **Specify date**: Enter a date in YYYY-MM-DD format
- **Auto-increment**: If the date is taken, automatically uses the next available date

#### Click "Insert into Maps Data"

**What Happens:**
1. Retrieves existing maps from localStorage (`customMaps` key)
2. Calculates next day number (max existing + 1)
3. Generates random map name from wordList.js
4. Creates complete map entry with all metadata:
   - `dayNumber`: Sequential ordering
   - `mapName`: Random word for personality
   - `date`: Date string (YYYY-MM-DD)
   - `size`: Grid dimensions
   - `goal`: Maximum achievable area
   - `maxWalls`: Optimal wall count
   - `map`: 2D array of tile types
   - `optimalSolution`: Array of wall positions `[[row, col], ...]`
5. Saves to localStorage under the date key
6. Displays success message with date and map name

## Technical Details

### Code Architecture

#### Files Involved

**editor.html**
- Main HTML structure for the level editor
- Loads dependencies: PathfindingUtils.js, MILPSolver.js, wordList.js, LevelEditor.js
- Contains UI elements: grid container, buttons, export sections

**css/editor.css**
- All styling for the level editor interface
- Responsive design for mobile and desktop
- Special styling for complete map section (green background)

**js/LevelEditor.js**
- Main editor logic and UI interaction
- Grid rendering and tile painting
- Solver integration and data conversion
- localStorage management

### Solver Integration

#### Data Format Conversion

**String Format** (Editor Grid):
```javascript
[
  ["grass", "water", "grass"],
  ["water", "home", "grass"],
  ["grass", "grass", "water"]
]
```

**Numeric Format** (Solver Input):
```javascript
[
  [1, 0, 1],  // 0 = water
  [0, 2, 1],  // 1 = grass
  [1, 1, 0]   // 2 = home
]
```

#### Solver Method Called

```javascript
const solution = MILPSolver.solveMap(numericMap, maxWalls);
```

**Returns:**
```javascript
{
  walls: [[0, 1, 0], ...],     // 2D array: 1 = wall, 0 = no wall
  goalArea: 12,                 // Maximum penned area
  optimalWallCount: 5          // Minimum walls needed
}
```

#### Solution Processing

The editor converts the solver's wall array into an `optimalSolution` format:
```javascript
optimalSolution: [[1, 2], [3, 4], ...]  // Array of [row, col] positions
```

This matches the format used in `maps.json` for the main game.

### Dependencies

The level editor uses these core modules:

1. **PathfindingUtils.js**
   - BFS pathfinding algorithms
   - Checks if pet is penned
   - Calculates penned area size

2. **MILPSolver.js**
   - **THE PRODUCTION SOLVER** (single source of truth)
   - Exhaustive combinatorial search
   - Finds optimal wall placements to MAXIMIZE penned area
   - No heuristics or fallbacks

3. **wordList.js**
   - Array of English words: `WORD_LIST`
   - Used to generate random map names
   - Adds personality to maps

### localStorage Structure

Maps are stored under the `customMaps` key:

```javascript
{
  "2026-02-15": {
    "dayNumber": 5,
    "mapName": "Canyon",
    "date": "2026-02-15",
    "size": 9,
    "goal": 15,
    "maxWalls": 7,
    "map": [[...], ...],
    "optimalSolution": [[1, 2], [3, 4], ...]
  },
  "2026-02-16": { ... }
}
```

**Note:** This is separate from `maps.json` (the production maps file). To add maps to `maps.json` for permanent inclusion in the game, manually copy the data from localStorage to the file.

## Workflows

### Basic Workflow: Create and Export

1. Open `editor.html`
2. Adjust grid size if needed
3. Paint your map design (grass, water, home)
4. Click "Save Level" to export basic design
5. Copy JSON for sharing or documentation

### Complete Workflow: Create, Solve, and Store

1. Open `editor.html`
2. Create your map (adjust size, paint tiles, place home)
3. Set max walls (optional, defaults to 10)
4. Click "Run Solver" and wait for calculation
5. Review the solution (goal area, optimal walls)
6. Optionally enter a specific date
7. Click "Insert into Maps Data"
8. Map is saved to localStorage with all metadata

### Production Workflow: Add to maps.json

To add a level editor map to the official maps.json:

1. Follow "Complete Workflow" above to save to localStorage
2. Open browser DevTools → Console
3. Run: `JSON.parse(localStorage.getItem('customMaps'))`
4. Copy the map entry for your desired date
5. Manually add to `maps.json` file
6. Commit to repository

**Alternative:** Use the scripts in the `scripts/` directory for batch generation.

## Tips and Best Practices

### Map Design Tips

1. **Start with placement**: Place home first in a strategic location
2. **Consider water**: Water tiles block the pet, use them strategically
3. **Test complexity**: Larger maps with more water create more interesting puzzles
4. **Edge access**: Ensure the pet can reach edges initially (solver validates this)

### Performance Tips

1. **Small maps**: Use 7x7 or 9x9 for quick iteration
2. **Large maps**: Expect longer solve times for 13x13+ grids
3. **Water ratio**: More water = fewer grass tiles = faster solving
4. **Max walls**: Lower max walls = faster solving (fewer combinations to check)

### Quality Standards

Maps generated through the solver automatically meet these standards:
- **Path to edge exists**: Pet can reach edge when no walls placed
- **Goal area ≥ 5**: Maps with tiny goals are rejected
- **Walls ≤ 15**: Solution uses at most 15 walls
- **Strategic placement**: At least one wall not on edge (prevents trivial solutions)

These same validation rules are used in production map generation.

## Troubleshooting

### "Please place a home tile before saving/solving!"
- **Cause**: No home tile placed on the grid
- **Solution**: Select "Home" from tile dropdown and click a non-edge cell

### "Solver failed to find a solution"
- **Cause**: Map may be too complex or no valid solution exists
- **Solution**: Try reducing max walls, simplifying water placement, or using a smaller grid

### Solver takes too long
- **Cause**: Large grid with many grass tiles creates millions of combinations
- **Solution**: Use smaller grid size, add more water tiles, or reduce max walls

### Date field shows wrong format
- **Cause**: Browser doesn't support date input or wrong format entered
- **Solution**: Use YYYY-MM-DD format (e.g., 2026-02-15) or leave blank for today

### Can't see my stored maps in the game
- **Cause**: localStorage is separate from maps.json file
- **Solution**: Maps in localStorage are custom/local only. To add to game, manually copy to maps.json

## Developer Notes

### Extending the Editor

To add new features:

1. **Add UI elements** in `editor.html`
2. **Add styling** in `css/editor.css`
3. **Add logic** in `js/LevelEditor.js`
4. **Follow existing patterns**: event listeners, validation, feedback

### Testing Changes

```bash
# Start local server
python3 -m http.server 8080

# Open in browser
http://localhost:8080/editor.html
```

### Validation

The editor relies on the same validation as production:
- **PathfindingUtils**: For BFS pathfinding
- **MILPSolver**: For optimal solution calculation
- No additional validation is performed

If the solver returns a solution, it's guaranteed to be valid per production standards.

## Related Documentation

- **[MAP_GENERATION.md](MAP_GENERATION.md)**: Deep dive into map generation algorithms
- **[CODE_STRUCTURE.md](CODE_STRUCTURE.md)**: Overall codebase organization
- **[ARCHITECTURE.md](ARCHITECTURE.md)**: Design decisions and rationale
- **[TESTING.md](TESTING.md)**: Testing infrastructure and practices

## Version History

- **v1.0** (2026-02-07): Initial level editor
- **v2.0** (2026-02-07): Added solver integration, complete map export, localStorage insertion
