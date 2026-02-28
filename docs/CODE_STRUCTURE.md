# Pen the Pet - Code Structure Guide

**For comprehensive documentation, see the [docs/](.) directory:**

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Design decisions and philosophy
- **[TESTING.md](TESTING.md)** - Testing guide and coverage
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Developer workflow and setup
- **[MAP_GENERATION.md](MAP_GENERATION.md)** - Algorithm details
- **[AGENT_GUIDELINES.md](AGENT_GUIDELINES.md)** - Requirements for AI agents

---

## 📁 Project Structure

```text
PenThePet/
├── index.html              # Main HTML file (minimal, references external files)
├── css/
│   └── styles.css          # All game styling
├── js/
│   ├── constants.js        # Centralized constants for game parameters
│   ├── config.js           # Game configuration (references constants)
│   ├── tileTypes.js        # Tile type definitions and properties
│   ├── wordList.js         # Random English words for map naming
│   ├── CookieUtils.js      # Shared cookie get/set helpers
│   ├── DateUtils.js        # Shared date formatting helpers
│   ├── PathfindingUtils.js # Shared pathfinding utilities (BFS, penning, path-to-edge)
│   ├── MapGenerator.js     # Map generation logic (used by generation scripts only)
│   ├── MapValidator.js     # Map quality validation (used by generation scripts only)
│   ├── Grid.js             # Grid state management (load, get/set, reset)
│   ├── Game.js             # Game controller and checker (checks if pet is penned)
│   ├── Menu.js             # Menu system (level selector, options, etc.)
│   └── main.js             # Application entry point and initialization
├── scripts/
│   ├── generate-map.js # Map generation entry point (GitHub Actions + local)
│   ├── audit-maps.js          # Validate all existing maps in maps.json
│   ├── lib/
│   │   └── mapUtils.js        # Shared pure utilities (dates, size parsing, DB validation)
│   └── solver/                # MILP solver pipeline (Node.js + Python)
│       ├── MILPSolver.js      # Node.js wrapper that calls Python solver
│       ├── solve.py           # Python MILP solver using PuLP + CBC
│       └── requirements.txt   # Python dependencies (PuLP)
├── test/                   # Test suite
│   └── *.test.js              # Unit tests for each module
├── docs/                   # 📚 Comprehensive documentation
│   ├── CODE_STRUCTURE.md   # This file
│   ├── ARCHITECTURE.md     # Design decisions
│   ├── TESTING.md          # Testing guide
│   ├── DEVELOPMENT.md      # Developer guide
│   ├── MAP_GENERATION.md   # Algorithm details
│   └── AGENT_GUIDELINES.md # AI agent requirements
└── maps.json               # Generated maps with metadata (dayNumber, mapName, etc.)
```

## 🎯 File Purposes

### `index.html`

The main entry point for the game. Contains the HTML structure:

- **Header**: Title, subtitle, and menu button (top-right corner)
- **Map Info Display**: Shows Day number, map name, and date
- **Legend**: Explains tile types
- **Controls**: Reset button, wall counter, area size, penned status
- **Grid**: Main game area
- **Options**: Pet type and hint mode selectors
- **Modals**: Menu, level selector, instructions, about, and options popups

**Keep this minimal** - structure only, no inline styles or scripts.

### `css/styles.css`

Contains all visual styling for the game:

- Global styles (body, container)
- Typography (headings, text)
- Map info display (Day, name, date)
- Menu button (top-right circular button)
- Modal system (overlay, content, animations)
- Level list (selectable level items)
- Info panel and legend
- Button styles
- Grid and cell styles
- Responsive media queries

**To customize the look:** Modify colors, sizes, or add new CSS classes here.

### `js/constants.js`

Centralized constants for all game parameters:

- **MAX_WALLS**: Maximum walls allowed (15)
- **MAX_GRID_SIZE**: Maximum grid size (21)
- **Tile distribution**: Probability ratios for tile generation
- **Cell sizing**: Min/max cell sizes
- **Grid configuration**: Default sizes, padding, etc.

**IMPORTANT**: Always reference these constants instead of hardcoding values!

### `js/config.js`

Game configuration that references constants from constants.js:

- **Grid settings**: Default size, min/max size limits
- **Tile distribution**: Uses CONSTANTS.TILE_DISTRIBUTION
- **Cell visuals**: Size in pixels, gap between cells
- **Gameplay options**: Toggle features like wall removal
- **Hint modes**: Configuration for hint system

**To change game parameters:** Check constants.js first, then modify CONFIG if needed.

### `js/wordList.js`

Collection of random English words used for map naming:

- Contains ~150 nature, color, and concept words
- Used by map generation script to give each map a memorable name
- Exported function `getRandomWord()` for easy access

### `js/CookieUtils.js`

Shared cookie utility functions:

- `getCookie(name)` - Read a cookie value by name
- `setCookie(name, value, days)` - Set a cookie with expiration
- Used by Game.js, Menu.js, and main.js
- Single source of truth for all cookie operations

### `js/DateUtils.js`

Shared date utility functions:

- `getTodayDate()` - Get today's date in YYYY-MM-DD format
- `formatDate(dateStr)` - Format date string for display (e.g., "Feb 6, 2026")
- Used by Menu.js and main.js
- Single source of truth for all date operations

### `js/PathfindingUtils.js`

Shared pathfinding utilities used by game logic, generation scripts, and validation:

- BFS pathfinding algorithms
- `isPenned(map, homeRow, homeCol)` - Check if pet is penned (numeric map format)
- `calculatePennedArea(map, homeRow, homeCol)` - Count reachable tiles (numeric map format)
- `hasPathToEdge(map)` - Check if home can reach edge (string map format)
- Used by Game.js, MILPSolver.js, MapGenerator.js, and MapValidator.js

### `js/tileTypes.js`

Defines all tile types and their properties:

- Name, display name, and description
- Whether the tile is clickable
- CSS class and gradient colors
- ARIA labels for accessibility

**To add new tile types:** Add a new entry to the TILE_TYPES object with all required properties.

### `js/MapGenerator.js`

Handles map generation and validation (used by generation scripts, not browser):

- Generates random maps with tile distribution based on constants
- Validates maps to ensure there's a path from home to edge
- Uses MILP solver pipeline to calculate optimal goal and wall count
- Returns map with metadata (goal, maxWalls)

**Important**: This file is NOT loaded in the browser. It is used only by Node.js generation scripts.
See MAP_GENERATION.md for complete documentation.

### `js/Grid.js`

Pure state management for the grid:

- Grid initialization and tile storage
- Loads maps from pre-generated map data (maps.json)
- Grid state management (current state, initial state)
- Tile getter/setter methods (getTile, setTile, getAllTiles)
- Save/reset functionality (saveInitialState, reset)
- Home position tracking (getHomePosition)

**Note**: Grid no longer generates maps. Maps are loaded from maps.json only.

### `js/Game.js`

Game controller that checks if the pet is penned:

- Game rendering and UI updates
- User interaction handling (clicks, keyboard)
- DOM manipulation and dynamic cell sizing
- Penning detection (checks if pet can reach edge)
- Wall placement and removal
- Score submission and optimal solution viewing
- Delegates cookie operations to CookieUtils

**Note**: Game no longer generates maps or has debug tools. Maps are loaded from maps.json via main.js.

**To add gameplay features:** Extend this class with new methods for character movement, scoring, etc.

### `js/Menu.js`

Menu system for navigation and settings:

- **Modal Management**: Opens/closes menu, level selector, instructions, about, and options modals
- **Level Selector**: Displays available maps from maps.json, allows switching between different day's puzzles
- **Level Loading**: Dynamically loads selected map into the game, fully resets game state (grid size, submission, optimal solution)
- **Options Management**: Syncs pet type and hint mode settings
- **Cookie Persistence**: Delegates to CookieUtils for all cookie operations
  - `selectedPet`: User's chosen animal emoji
  - `hintMode`: Selected hint mode (disabled, checkOptimal, revealTarget)
  - `currentLevel`: Currently selected level date
  - `debugMode`: Whether debug tools are visible

**To add new menu options:** Extend the Menu class with new modal types and cookie storage via CookieUtils.

### `js/main.js`

Application entry point:

- Initializes the game when the page loads
- Loads maps from maps.json
- Checks for saved level selection in cookies
- Displays map information (day, name, date)
- Initializes Menu system
- Applies saved settings (hint mode, debug mode)
- Sets up global event handlers
- Exports game and menu to window for console debugging

**To customize initialization:** Modify the `initGame()` function.

## Scripts (`scripts/` directory)

### `scripts/generate-map.js`

The single map generation entry point for both GitHub Actions and local use:

- Generates one or more maps and appends them to maps.json
- Supports `--count N` for batch generation (sequential dates)
- Supports `--size N` or `--size N-M` (exact size or random range per map)
- Supports `--fresh` to replace all existing maps
- Validates each map against MapValidator quality standards
- Runs database consistency checks (sequential day numbers, unique names) after generation

**Usage:**

```bash
node scripts/generate-map.js --date 2026-02-15 --size 9
node scripts/generate-map.js --size 7-13 --count 5
node scripts/generate-map.js --fresh --count 10 --date 2026-03-01 --size 9
```

### `scripts/lib/mapUtils.js`

Shared pure utility functions used by generation and audit scripts:

- `parseSizeInput(str)` / `getRandomSize(parsed)` — parse and sample size ranges
- `incrementDate(str)` / `getNextAvailableDate(path)` — date helpers
- `getNextDayNumber(path)` — sequential day numbering
- `validateMapsDatabase(maps)` / `fixMapsDatabase(maps)` — database integrity checks

### `scripts/audit-maps.js`

Validates all maps in maps.json against MapValidator:

- Checks path-to-edge, goal area ≥ 5, wall budget, and strategic wall placement
- Uses the stored `optimalSolution` for each map (full validation)
- Useful after changing MapValidator rules, manually editing maps.json, or importing maps
- Exits with code 1 if any map fails

**Usage:**

```bash
node scripts/audit-maps.js
```

### `maps.json`

Generated maps with complete metadata:

- Key: Date string (YYYY-MM-DD)
- Value: Map object with dayNumber, mapName, size, goal, maxWalls, map, optimalSolution
- Generated by `scripts/generate-map.js`
- See MAP_GENERATION.md for metadata structure

### `MAP_GENERATION.md`

Comprehensive documentation for map generation:

- Algorithm explanation and pseudocode
- Metadata structure and field descriptions
- Generation process and requirements
- Instructions for future agents
- Testing and validation procedures

**Read this file before modifying map generation!**

## 🔧 How to Extend the Game

### Adding a New Tile Type

1. **Define the tile type** in `js/tileTypes.js`:

```javascript
sand: {
    name: 'sand',
    displayName: 'Sand',
    description: 'Sand tile - special properties',
    clickable: true,
    cssClass: 'sand',
    gradient: 'linear-gradient(135deg, #ffd54f 0%, #ffb300 100%)',
    ariaLabel: (row, col) => `Sand tile at row ${row + 1}, column ${col + 1}.`,
}
```

1. **Add the CSS styling** in `css/styles.css`:

```css
.cell.sand {
    background: linear-gradient(135deg, #ffd54f 0%, #ffb300 100%);
}
```

1. **Update tile generation** in map generation scripts if needed (tiles are generated during map creation, not at runtime):

```javascript
// In MapGenerator.js (used by generation scripts only)
// Update TILE_DISTRIBUTION in constants.js
```

1. **Add legend entry** in `index.html` (optional):

```html
<div class="legend-item">
    <div class="legend-box sand"></div>
    <span>Sand (special)</span>
</div>
```

### Adding a Character

1. **Create a new Character class** in `js/Character.js`:

```javascript
class Character {
    constructor(row, col) {
        this.row = row;
        this.col = col;
    }
    
    move(direction, grid) {
        // Implement movement logic
    }
    
    render(gridElement) {
        // Add character to DOM
    }
}
```

1. **Update Game.js** to include the character:

```javascript
constructor(size) {
    this.grid = new Grid(size);
    this.character = new Character(0, 0);  // Start position
    // ... rest of initialization
}
```

1. **Add keyboard controls** in `js/Game.js`:

```javascript
document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        this.character.move(e.key, this.grid);
        this.render();
    }
});
```

## 🚀 Development Tips

- **Test locally:** Run a simple HTTP server: `python3 -m http.server 8080`
- **Browser console:** Access the game object via `window.game` for debugging
- **Configuration first:** Always check `config.js` before hardcoding values
- **Keep separation:** HTML for structure, CSS for style, JS for behavior
- **Comment your code:** Especially when adding new features

## 🍪 User Preferences and Cookies

The game uses browser cookies to remember user preferences across sessions. All cookie operations go through `CookieUtils` in `js/CookieUtils.js`.

### Currently Stored Preferences

| Cookie Name | Purpose | Set By | Format |
|------------|---------|--------|--------|
| `selectedPet` | Chosen animal emoji | Menu.js / Game.js | URL-encoded emoji |
| `hintMode` | Hint mode setting | Menu.js | `disabled`, `checkOptimal`, `revealTarget` |
| `currentLevel` | Selected puzzle date | Menu.js | `YYYY-MM-DD` |
| `debugMode` | Debug tools visibility | Menu.js | `true` / `false` |
| `submission_YYYY-MM-DD` | Submitted score per puzzle | Game.js | JSON `{score, walls, timestamp}` |

All cookies:

- Expire after 1 year
- Path: `/` (accessible across entire site)
- SameSite: `Lax` (secure against CSRF)
- Values are URL-encoded for safety

### How It Works

1. **On Selection**: When user changes a setting, the relevant module calls `CookieUtils.setCookie()`
2. **On Load**: When game initializes, modules call `CookieUtils.getCookie()` to retrieve saved preferences
3. **Fallback**: If no cookie exists, defaults are used (e.g., 🐶 Dog for pet)

### Adding New Preferences

To store a new setting, use the shared `CookieUtils`:

```javascript
// Save a preference
CookieUtils.setCookie('myPreference', 'value', 365);

// Load a preference
const saved = CookieUtils.getCookie('myPreference');
```

### Cookie Compatibility with GitHub Pages

Cookies work seamlessly with GitHub Pages because:

- They are stored in the user's browser (client-side)
- No server-side processing required
- Compatible with static hosting
- Persist across page reloads and browser sessions (until expiration)

## 📦 Deployment

The game is ready for GitHub Pages! Just push to your repository and enable GitHub Pages in Settings → Pages.

No build step required - everything runs in the browser.

---

## 📚 Related Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Design philosophy and decisions
- **[TESTING.md](TESTING.md)** - Complete testing guide
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development workflow and setup
- **[MAP_GENERATION.md](MAP_GENERATION.md)** - Algorithm and map generation details
- **[AGENT_GUIDELINES.md](AGENT_GUIDELINES.md)** - Requirements for AI coding agents
- **[../README.md](../README.md)** - Project overview and quick start
