# Copilot Instructions for PenThePet

## Project Overview

PenThePet is a browser-based logic puzzle game about fencing in your pet. The game is built with vanilla HTML, CSS, and JavaScript without any frameworks or build tools. It's designed to run directly in the browser and can be hosted on GitHub Pages.

## Project Structure

```
PenThePet/
├── index.html          # Main HTML file (minimal, references external files)
├── css/
│   └── styles.css      # All game styling
├── js/
│   ├── config.js       # Game configuration and settings
│   ├── tileTypes.js    # Tile type definitions and properties
│   ├── Grid.js         # Grid data structure and generation logic
│   ├── Game.js         # Main game controller and interaction logic
│   └── main.js         # Application entry point and initialization
└── CODE_STRUCTURE.md   # Developer documentation
```

## Code Architecture

### File Responsibilities

- **index.html**: Keep minimal with only HTML structure and script/stylesheet references
- **css/styles.css**: Contains all visual styling, organized by component
- **js/config.js**: Centralized configuration for easy customization (grid settings, tile distribution, cell visuals, gameplay options)
- **js/tileTypes.js**: Defines tile types with properties (name, displayName, description, clickable, cssClass, gradient, ariaLabel)
- **js/Grid.js**: Grid class managing data structure, generation, state management, and tile operations
- **js/Game.js**: Game class controlling initialization, rendering, user interactions, UI updates, and state transitions
- **js/main.js**: Application entry point that initializes the game on page load

### Script Loading Order

Scripts must be loaded in this specific order (already configured in index.html):
1. config.js
2. tileTypes.js
3. Grid.js
4. Game.js
5. main.js

## Coding Standards

### JavaScript

- **ES6 Classes**: Use modern JavaScript class syntax for objects (Grid, Game)
- **No Frameworks**: This is a vanilla JavaScript project - do not add React, Vue, jQuery, or other frameworks
- **No Build Tools**: No webpack, rollup, or other bundlers - code runs directly in browser
- **Configuration-Driven**: Always use CONFIG object from config.js instead of hardcoding values
- **Separation of Concerns**: Keep HTML for structure, CSS for styling, JavaScript for behavior
- **Accessibility**: Include ARIA labels and semantic HTML for screen reader support
- **Comments**: Add JSDoc-style comments for classes and complex methods

### CSS

- **Modern CSS**: Use flexbox, grid, CSS variables, and modern properties
- **No Preprocessors**: Write plain CSS without SASS/LESS
- **BEM-like Naming**: Use clear, descriptive class names (e.g., `.legend-item`, `.viewer-card`)
- **Responsive**: Include media queries for mobile/tablet support
- **Gradients**: Use linear gradients for visual depth on tiles

### HTML

- **Semantic Elements**: Use appropriate semantic tags (`<header>`, `<footer>`, `<article>`, etc.)
- **Accessibility**: Include ARIA attributes where needed
- **Minimal**: Keep index.html focused on structure, not behavior or style

## Development Practices

### Testing

- **Manual Testing**: Test in browser with `python3 -m http.server 8080` or similar
- **Browser Console**: Game instance is accessible via `window.game` for debugging
- **Cross-Browser**: Test in Chrome, Firefox, Safari when possible
- **Mobile Testing**: Always test functionality on mobile screen sizes (phone viewports) using browser developer tools. Ensure:
  - All interactive elements are easily tappable on touch screens
  - Text is readable at small screen sizes
  - Grid scales appropriately for phone screens (dynamic sizing ensures this)
  - Controls stack vertically and remain accessible
  - Test at common phone widths: 375px (iPhone), 360px (Android), 414px (iPhone Plus)
- **Grid Scaling**: The grid uses dynamic scaling to fit any viewport size:
  - Maximum grid size (21x21) is always fully visible on any screen
  - Cell sizes automatically adjust from 20px (minimum) to 50px (maximum)
  - Window resize events trigger recalculation for responsive behavior

### Adding New Features

1. **New Tile Types**: Define in tileTypes.js, add CSS, update Grid generation logic
2. **New Game Mechanics**: Extend Game.js with new methods
3. **Configuration Changes**: Update CONFIG object in config.js
4. **UI Changes**: Update index.html (structure) and styles.css (appearance)

### Code Modification Guidelines

- **Check CONFIG first**: Before hardcoding values, check if they should be in config.js
- **Maintain script order**: Never change the loading order of scripts
- **Preserve accessibility**: Keep ARIA labels and semantic HTML when modifying UI
- **Test incrementally**: After each change, test in browser immediately
- **Document behavior**: Update CODE_STRUCTURE.md if adding major features

## Key Constraints

1. **No Dependencies**: This project has zero npm packages or external libraries
2. **Browser-Only**: All code runs client-side in the browser
3. **No Build Step**: Deploy by simply pushing to GitHub Pages
4. **Vanilla JavaScript**: Do not introduce any frameworks or libraries

## Common Tasks

### Changing Grid Size
- Modify `CONFIG.grid.defaultSize` in config.js
- Update min/max constraints if needed (current max is 21)
- Always test on mobile viewports after grid size changes

### Adjusting Tile Distribution
- Modify `CONFIG.TILE_RATIOS` in config.js to change probability weights

### Adding New Tile Type
1. Add entry to TILE_TYPES object in tileTypes.js
2. Add corresponding CSS class in styles.css
3. Update tile generation logic in Grid.js if needed
4. Optionally add legend entry in index.html

### Modifying Visual Appearance
- Cell size: Dynamically calculated by `Game.calculateCellSize()` based on viewport and grid size
  - Min: 20px (for usability on small screens)
  - Max: 50px (for aesthetics on large screens)
  - Automatically adjusts to ensure any grid size fits in any viewport
- Cell gap: `Game.CELL_GAP` constant (default: 3px)
- Colors/gradients: styles.css or TILE_TYPES in tileTypes.js
- Font sizes: Use `clamp()` for responsive scaling relative to `--cell-size` CSS variable

## Deployment

This project is GitHub Pages ready. No build process required - just enable GitHub Pages in repository settings pointing to the main branch root directory.

## Accessibility Considerations

- All interactive elements have appropriate ARIA labels
- Tile types include ariaLabel functions for screen readers
- Keyboard navigation should be considered for future enhancements
- Color contrast meets WCAG standards

## Performance Notes

- Grid generation is synchronous and may be slow for very large grids (>20x20)
- DOM manipulation is direct (no virtual DOM) - keep grid sizes reasonable
- No lazy loading or optimization needed for current grid sizes (6-12)

## Map Generation and Goal Calculation

### Overview

PenThePet uses an algorithm to generate valid game maps and calculate the optimal goal (maximum achievable penned area). The system ensures that:
1. Every generated map has a valid path from home to edge (when no walls are placed)
2. The goal represents the **MAXIMUM** penned area achievable with available walls
3. Maps are challenging but solvable

### Map Format

Maps are represented as 2D arrays where each cell contains a tile type:

**String Format** (used in maps.json and display):
- `"grass"` - Walkable grass tile
- `"water"` - Blocking water tile (pet cannot pass)
- `"home"` - The pet's starting position (center of map)
- `"wall"` - Player-placed wall (blocking)

**Numeric Format** (used internally by solvers):
- `0` = water
- `1` = grass
- `2` = home
- `5` = wall

Example 5x5 map in maps.json:
```json
{
  "2026-02-06": {
    "size": 5,
    "goal": 8,
    "map": [
      ["grass", "water", "grass", "grass", "grass"],
      ["water", "grass", "grass", "grass", "water"],
      ["grass", "grass", "home", "grass", "grass"],
      ["grass", "grass", "grass", "grass", "water"],
      ["water", "water", "grass", "grass", "water"]
    ]
  }
}
```

### Architecture

The map generation system consists of:

1. **MapGenerator.js** (`js/MapGenerator.js`)
   - Generates random maps with guaranteed path to edge
   - Validates map connectivity using BFS pathfinding
   - Calculates goal using MILPSolver

2. **MILPSolver.js** (`js/MILPSolver.js`)
   - Finds optimal wall placements to **MAXIMIZE** penned area
   - Uses exhaustive search for small maps (<200k combinations)
   - Uses heuristic search for larger maps
   - **CRITICAL**: Goal is MAXIMUM area, not minimum!

3. **BruteForceSolver.js** (`test/BruteForceSolver.js`)
   - Testing-only exhaustive search solver
   - Checks ALL possible wall combinations
   - Used to validate MILPSolver accuracy
   - Provides ground truth for test maps

### How Goal Calculation Works

The goal represents the largest area the player can achieve by placing walls optimally:

1. **Map Generation**: MapGenerator creates a random map with home at center
2. **Validation**: BFS verifies pet can reach edge from home (no walls yet)
3. **Goal Calculation**: MILPSolver finds optimal wall placement:
   - Try different combinations of wall placements
   - For each combination, check if pet is penned (cannot reach edge)
   - Calculate penned area size (reachable tiles from home)
   - Keep track of the **LARGEST** penned area found
4. **Return**: Map and goal are saved together

### Testing Infrastructure

Located in `test/` directory:

**BruteForceSolver.js**
- Exhaustively checks all wall combinations up to maxWalls
- Always finds the true optimal solution (ground truth)
- Slow but 100% accurate
- Used only for generating and validating test data

**test-map-generation.js**
- Generates random maps
- Runs both BruteForceSolver and MILPSolver
- Compares results to verify MILPSolver accuracy
- Saves maps with verified optimal goals to `test-maps-db.json`

**validate-generation.js**
- Quick validation that map generation produces reasonable goals
- Checks goals are not ultra-small (like 1) or unreasonably large
- Verifies generation completes in reasonable time

### Test Map Database Format

`test/test-maps-db.json` contains maps with verified optimal solutions:

```json
[
  {
    "size": 5,
    "maxWalls": 5,
    "goal": 8,
    "optimalWallCount": 4,
    "map": [
      ["grass", "water", "grass", ...],
      ...
    ]
  }
]
```

- `goal`: Maximum penned area (verified by brute force)
- `optimalWallCount`: Number of walls needed to achieve goal
- `map`: The complete map layout

### Generating New Test Maps

To create new test maps with verified optimal solutions:

```bash
cd test
node test-map-generation.js
```

This will:
1. Generate random maps of various sizes
2. Run brute force solver to find TRUE optimal solution
3. Run MILP solver to compare
4. Save verified maps to `test-maps-db.json`
5. Report accuracy statistics

**Important**: Only save maps where brute force found a solution. These are ground truth.

### Generating Maps for maps.json (Daily Levels)

To generate a new daily map for the game:

```javascript
const MapGenerator = require('./js/MapGenerator.js');
const BruteForceSolver = require('./test/BruteForceSolver.js');

// Generate map
const size = 9; // or 7, 11, etc.
const maxWalls = 9;
const generator = new MapGenerator(size, { grass: 0.7, water: 0.3 });
const result = generator.generate(null, maxWalls);

// For small maps, verify with brute force
if (size <= 7) {
  const numericMap = result.map.map(row => row.map(tile => {
    if (tile === 'water') return 0;
    if (tile === 'grass') return 1;
    if (tile === 'home') return 2;
    return 1;
  }));
  
  const bruteResult = BruteForceSolver.solveMap(numericMap, maxWalls);
  console.log(`MILP goal: ${result.goal}, Brute force goal: ${bruteResult.goalArea}`);
  
  // Use brute force result if available for accuracy
  if (bruteResult) {
    result.goal = bruteResult.goalArea;
  }
}

// Save to maps.json with today's date
const date = new Date().toISOString().split('T')[0];
const mapEntry = {
  [date]: {
    size: result.map.length,
    goal: result.goal,
    map: result.map
  }
};
```

### Critical Learnings

1. **MAXIMIZE, not minimize**: The goal is the LARGEST penned area, not smallest
   - Game objective: Create biggest pen possible with limited walls
   - Bug was: solvers were minimizing instead of maximizing
   - Fixed by changing `bestArea = Infinity; if (area < bestArea)` to `bestArea = 0; if (area > bestArea)`

2. **Two solver strategies**:
   - Exhaustive search for small maps: 100% accurate but slow
   - Heuristic search for large maps: Fast but may not find true optimal
   - Threshold: ~200k combinations (~500ms runtime)

3. **Test generation process**:
   - Generate map → Run brute force → Get TRUE optimal → Save as ground truth
   - Later: Generate map → Run MILP → Compare to ground truth → Measure accuracy

4. **Reasonable goals**:
   - 5x5 map: typically 3-10 tiles
   - 7x7 map: typically 5-16 tiles  
   - 9x9 map: typically 8-25 tiles
   - NOT 1 or ultra-small (that was the bug!)

### Future Agent Instructions

When asked to work on map generation:

1. **Generate test maps**: Run `test-map-generation.js` to create verified test data
2. **Generate daily maps**: Use MapGenerator + optionally BruteForceSolver for verification
3. **Validate changes**: Run `validate-generation.js` to check goals are reasonable
4. **Update maps.json**: Replace old maps with newly generated ones using corrected system
5. **Verify in browser**: Always test in actual game to ensure goals work correctly

Remember: The goal should be a challenging but achievable target, representing the MAXIMUM area the player can create with optimal wall placement.
