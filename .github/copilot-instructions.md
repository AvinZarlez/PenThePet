# Copilot Instructions for PenThePet

## 📚 Documentation Structure

**IMPORTANT: Before making ANY changes, read the relevant documentation:**

**Full Documentation Index:** See [docs/README.md](../docs/README.md) for complete documentation guide with all topics and navigation.

### Required Reading for ALL Changes
- **[docs/AGENT_GUIDELINES.md](../docs/AGENT_GUIDELINES.md)** - ⚠️ START HERE - Critical requirements for AI agents
- **[docs/CODE_STRUCTURE.md](../docs/CODE_STRUCTURE.md)** - How the code is organized
- **[docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)** - Why design decisions were made

### Read for Specific Changes
- **Map generation** → [docs/MAP_GENERATION.md](../docs/MAP_GENERATION.md)
- **Level editor** → [docs/LEVEL_EDITOR.md](../docs/LEVEL_EDITOR.md)
- **Adding tests** → [docs/TESTING.md](../docs/TESTING.md)  
- **Development setup** → [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md)

### Historical Context (if needed)
- **Change summaries** → [docs/summaries/](../docs/summaries/) - PR and implementation summaries

### Post-Change Requirements
✅ Run tests: `npm test`  
✅ Update documentation in sync with code changes  
✅ Follow patterns in [docs/AGENT_GUIDELINES.md](../docs/AGENT_GUIDELINES.md)

---

## Project Overview

PenThePet is a browser-based logic puzzle game about fencing in your pet. The game is built with vanilla HTML, CSS, and JavaScript without any frameworks or build tools. It's designed to run directly in the browser and can be hosted on GitHub Pages.

## Project Structure

```
PenThePet/
├── index.html              # Main HTML file (minimal, references external files)
├── css/
│   └── styles.css          # All game styling
├── js/
│   ├── constants.js        # Configuration constants
│   ├── config.js           # Game configuration and settings
│   ├── tileTypes.js        # Tile type definitions and properties
│   ├── wordList.js         # Random words for map naming
│   ├── PathfindingUtils.js # Shared pathfinding algorithms
│   ├── MapGenerator.js     # Map generation (used by generation scripts only)
│   ├── MapValidator.js     # Map quality validation (used by generation scripts only)
│   ├── Grid.js             # Grid state management (load, get/set, reset)
│   ├── Game.js             # Game controller and checker (penning detection)
│   ├── Menu.js             # Menu system (level selector, options, etc.)
│   └── main.js             # Application entry point and initialization
├── scripts/
│   ├── generate-maps.js       # CLI for batch map generation
│   ├── generate-single-map.js # Single map generator (GitHub Actions)
│   ├── audit-maps.js          # Validate existing maps
│   └── solver/                # MILP solver pipeline
│       ├── MILPSolver.js      # Node.js wrapper for Python solver
│       ├── solve.py           # Python MILP solver (PuLP + CBC)
│       └── requirements.txt   # Python dependencies
├── docs/                   # 📚 Comprehensive documentation
│   ├── AGENT_GUIDELINES.md # ⚠️ CRITICAL - Read this first!
│   ├── CODE_STRUCTURE.md   # Code organization
│   ├── ARCHITECTURE.md     # Design decisions
│   ├── MAP_GENERATION.md   # Algorithm details
│   ├── TESTING.md          # Testing guide
│   └── DEVELOPMENT.md      # Developer guide
└── test/                   # Test suite (222 tests)
```

**See [docs/CODE_STRUCTURE.md](../docs/CODE_STRUCTURE.md) for detailed architecture.**

## Code Architecture

### File Responsibilities

- **index.html**: HTML structure with map info display, menu button, modals (level selector, instructions, about, options)
- **css/styles.css**: All visual styling including menu system, modals, and map info display
- **js/config.js**: Centralized configuration for easy customization (grid settings, tile distribution, cell visuals, gameplay options)
- **js/tileTypes.js**: Defines tile types with properties (name, displayName, description, clickable, cssClass, gradient, ariaLabel)
- **js/Grid.js**: Grid class managing state: load maps, get/set tiles, save/reset state
- **js/Game.js**: Game class controlling rendering, user interactions, UI updates, and penning checks (no map generation)
- **js/Menu.js**: Menu system managing modals, level selection, options, and cookie-based settings persistence
- **js/main.js**: Application entry point that initializes game and menu, loads maps from maps.json

### Script Loading Order

Scripts must be loaded in this specific order (already configured in index.html):
1. constants.js
2. config.js
3. tileTypes.js
4. PathfindingUtils.js
5. Grid.js
6. Game.js
7. Menu.js
8. main.js

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
   - Calculates goal using MILP solver pipeline
   - **NO FALLBACKS**: Throws error if generation fails after 1000 attempts
   - Used by generation scripts only (not loaded in browser)

2. **Python MILP Solver** (`scripts/solver/solve.py`) - **PRODUCTION SOLVER**
   - ✅ ONLY solver used in production
   - Finds optimal wall placements to **MAXIMIZE** penned area
   - Uses PuLP + CBC for provably optimal solutions
   - Called via Node.js wrapper (`scripts/solver/MILPSolver.js`)
   - **CRITICAL**: Goal is MAXIMUM area, not minimum!

3. **Browser JS** - **CHECKER ONLY**
   - No solver code in the browser
   - Game.js checks if pet is penned using PathfindingUtils
   - Maps loaded from maps.json only

### How Goal Calculation Works

The goal represents the largest area the player can achieve by placing walls optimally:

1. **Map Generation**: MapGenerator creates a random map with home at center
2. **Validation**: BFS verifies pet can reach edge from home (no walls yet)
3. **Goal Calculation**: Python MILP solver finds optimal wall placement:
   - Formulates as Mixed Integer Linear Program
   - Maximizes enclosed area subject to wall budget
   - Returns provably optimal solution
4. **Return**: Map and goal are saved together

### Generating Maps for maps.json (Daily Levels)

To generate a new daily map for the game, use the production scripts:

**Recommended: Use the generation script**
```bash
# Install Python dependencies first
pip install -r scripts/solver/requirements.txt

node scripts/generate-single-map.js --date 2026-02-15 --size 9
```

### Critical Learnings

1. **MAXIMIZE, not minimize**: The goal is the LARGEST penned area, not smallest
   - Game objective: Create biggest pen possible with limited walls

2. **maxWalls formula**: `floor(size × 0.75)` per grid size

3. **Reasonable goals**:
   - 5x5 map: typically 3-10 tiles
   - 7x7 map: typically 5-16 tiles  
   - 9x9 map: typically 8-25 tiles

### Future Agent Instructions

When asked to work on map generation:

1. **Generate production maps**: Use `scripts/generate-single-map.js` or `scripts/generate-maps.js`
2. **Update maps.json**: Use generation scripts that include validation
3. **Verify in browser**: Always test in actual game to ensure goals work correctly
4. **Python required**: Generation requires Python 3 + PuLP (`pip install -r scripts/solver/requirements.txt`)

Remember: The goal should be a challenging but achievable target, representing the MAXIMUM area the player can create with optimal wall placement.

---

## 📋 Documentation Maintenance Requirements

**CRITICAL: All agents MUST maintain documentation in sync with code changes.**

### Documentation Update Checklist

After making ANY code changes, you MUST verify and update:

#### Always Update
- [ ] **JSDoc comments** - In any modified .js files
- [ ] **Inline comments** - For any complex logic added/changed

#### Update When Applicable

| If You Changed... | Update These Docs... |
|------------------|---------------------|
| Architecture/file organization | `docs/CODE_STRUCTURE.md` |
| Design decisions/approach | `docs/ARCHITECTURE.md` |
| Map generation logic | `docs/MAP_GENERATION.md` |
| Test structure/coverage | `docs/TESTING.md` |
| Development workflow | `docs/DEVELOPMENT.md` |
| User-facing features | `README.md` |
| Agent requirements | `docs/AGENT_GUIDELINES.md` |
| Critical patterns | This file (`.github/copilot-instructions.md`) |

### How to Verify Documentation Is Current

Before committing:
```bash
# 1. Review what documentation might be affected
git status  # Check which files changed

# 2. For each changed file, ask:
#    - Does this change affect how the code works?
#    - Is this change documented in relevant docs?
#    - Would a new developer understand this change?

# 3. Update documentation accordingly

# 4. Review the diff to ensure docs are accurate
git diff docs/
```

### Documentation Quality Standards

✅ **Good documentation:**
- Matches current code behavior
- Includes examples where helpful
- Explains WHY, not just WHAT
- Uses consistent formatting
- Links to related documentation

❌ **Bad documentation:**
- Describes old/removed features
- Missing for new features
- No examples for complex features
- Inconsistent with code
- Broken links

### Special Documentation Rules

1. **Never delete documentation without replacing it**
   - If removing a feature, document WHY it was removed
   - Update architecture docs to reflect new design

2. **Always update version numbers**
   - Update README.md test counts if tests added/removed
   - Update coverage numbers if significant change

3. **Keep copilot-instructions.md in sync**
   - This file should reflect current critical patterns
   - Update if fundamental architecture changes
   - Add new sections for new major features

4. **Test documentation changes**
   - Read through updated docs
   - Follow any instructions to verify they work
   - Check all links are valid

### Documentation as First-Class Code

Treat documentation with the same care as code:
- Review it like you review code
- Test that instructions work
- Keep it DRY (Don't Repeat Yourself)
- Refactor when it gets messy
- Version control it properly

**Remember:** Documentation is how future you, future developers, and future AI agents will understand your changes. Keep it excellent!

