# Pen the Pet - Code Structure Guide

## 📁 Project Structure

```
PenThePet/
├── index.html          # Main HTML file (minimal, references external files)
├── css/
│   └── styles.css      # All game styling
├── js/
│   ├── constants.js    # Centralized constants for game parameters
│   ├── config.js       # Game configuration (references constants)
│   ├── tileTypes.js    # Tile type definitions and properties
│   ├── wordList.js     # Random English words for map naming
│   ├── PathfindingUtils.js  # Shared pathfinding utilities
│   ├── MILPSolver.js   # Exhaustive search solver for optimal wall placement
│   ├── MapGenerator.js # Map generation and validation logic
│   ├── Grid.js         # Grid data structure and operations
│   ├── Game.js         # Main game controller and interaction logic
│   └── main.js         # Application entry point and initialization
├── scripts/
│   └── generate-maps.js  # CLI script for batch map generation with metadata
├── maps.json           # Generated maps with metadata (dayNumber, mapName, etc.)
├── CODE_STRUCTURE.md   # This file (developer documentation)
└── MAP_GENERATION.md   # Detailed map generation documentation
```

## 🎯 File Purposes

### `index.html`
The main entry point for the game. Contains only the HTML structure and references to external CSS and JavaScript files. Keep this minimal.

### `css/styles.css`
Contains all visual styling for the game:
- Global styles (body, container)
- Typography (headings, text)
- Info panel and legend
- Button styles
- Grid and cell styles
- Responsive media queries

**To customize the look:** Modify colors, sizes, or add new CSS classes here.

### `js/constants.js`
**NEW**: Centralized constants for all game parameters:
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

### `js/PathfindingUtils.js`
Shared pathfinding utilities used by solvers and game logic:
- BFS pathfinding algorithms
- Pet penning detection
- Penned area calculation
- Used by both MILPSolver and MapGenerator

### `js/MILPSolver.js`
Exhaustive search solver for finding optimal wall placements:
- **Goal**: Find MAXIMUM achievable penned area
- **Algorithm**: Memory-efficient exhaustive search
- **Accuracy over speed**: Checks up to 100k combinations per wall count
- **Returns**: Optimal wall positions and goal area
- See MAP_GENERATION.md for detailed algorithm explanation

### `js/tileTypes.js`
Defines all tile types and their properties:
- Name, display name, and description
- Whether the tile is clickable
- CSS class and gradient colors
- ARIA labels for accessibility

**To add new tile types:** Add a new entry to the TILE_TYPES object with all required properties.

### `js/MapGenerator.js`
Handles map generation and validation:
- Generates random maps with tile distribution based on constants
- Validates maps to ensure there's a path from home to edge
- Uses MILPSolver to calculate optimal goal and wall count
- Retries generation if map can't be solved with ≤15 walls
- Returns map with metadata (goal, maxWalls)

**Important**: Uses ONLY exhaustive search for accuracy (user requirement).
See MAP_GENERATION.md for complete documentation.

### `js/Grid.js`
Manages the grid data structure:
- Grid initialization and tile storage
- Uses MapGenerator for creating valid maps
- Grid state management (current state, initial state)
- Tile getter/setter methods
- Grid resizing functionality

**To modify grid behavior:** Edit methods in this class to change how the grid stores or manages tiles.

### `js/Game.js`
Main game controller that ties everything together:
- Game initialization and rendering
- User interaction handling (clicks, keyboard)
- UI updates and DOM manipulation
- Game state transitions (new game, reset)
- Dynamic cell sizing for responsive layout
- **Cookie Management**: Stores and retrieves user preferences (selected pet animal)

**Cookie Storage:**
- `selectedPet`: Stores the user's selected animal emoji
- Expires after 1 year
- Path: `/` (accessible across the entire site)
- SameSite: `Lax` (secure against CSRF)
- Future settings can be added (e.g., `hintMode`, `gridSize`)

**To add gameplay features:** Extend this class with new methods for character movement, scoring, etc.

### `js/main.js`
Application entry point:
- Initializes the game when the page loads
- Sets up global event handlers (if needed)
- Future: Can add game state persistence, analytics, etc.

### `scripts/generate-maps.js`
CLI script for batch map generation:
- Generates maps with metadata (dayNumber, mapName, date)
- Supports fresh generation or appending to existing maps
- Configurable sizes, dates, and count
- Saves to maps.json with proper formatting

**Usage:**
```bash
node scripts/generate-maps.js --fresh --count 10 --sizes 7,9,11
```

### `maps.json`
Generated maps with complete metadata:
- Key: Date string (YYYY-MM-DD)
- Value: Map object with dayNumber, mapName, size, goal, maxWalls, map
- Generated by scripts/generate-maps.js
- See MAP_GENERATION.md for metadata structure

### `MAP_GENERATION.md`
**NEW**: Comprehensive documentation for map generation:
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

2. **Add the CSS styling** in `css/styles.css`:
```css
.cell.sand {
    background: linear-gradient(135deg, #ffd54f 0%, #ffb300 100%);
}
```

3. **Update tile generation** in `js/Grid.js` to include the new tile in random generation:
```javascript
_generateRandomTile() {
    const rand = Math.random();
    if (rand < 0.5) return 'grass';
    if (rand < 0.8) return 'water';
    return 'sand';  // 20% chance
}
```

4. **Add legend entry** in `index.html` (optional):
```html
<div class="legend-item">
    <div class="legend-box sand"></div>
    <span>Sand (special)</span>
</div>
```

### Changing Grid Size Dynamically

The infrastructure is already in place! To add a size selector:

1. **Add UI controls** in `index.html`:
```html
<div class="controls">
    <button id="newGameBtn">New Game</button>
    <button id="resetBtn">Reset</button>
    <select id="gridSize">
        <option value="6">6x6</option>
        <option value="8" selected>8x8</option>
        <option value="10">10x10</option>
        <option value="12">12x12</option>
    </select>
</div>
```

2. **Add event listener** in `js/Game.js` attachEventListeners method:
```javascript
const gridSizeSelect = document.getElementById('gridSize');
if (gridSizeSelect) {
    gridSizeSelect.addEventListener('change', (e) => {
        this.changeSize(parseInt(e.target.value));
    });
}
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

2. **Update Game.js** to include the character:
```javascript
constructor(size) {
    this.grid = new Grid(size);
    this.character = new Character(0, 0);  // Start position
    // ... rest of initialization
}
```

3. **Add keyboard controls** in `js/Game.js`:
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

The game uses browser cookies to remember user preferences across sessions. This works perfectly with GitHub Pages hosting.

### Currently Stored Preferences

- **selectedPet**: The user's chosen animal emoji (expires after 1 year)
  - Cookie name: `selectedPet`
  - Format: URL-encoded emoji string
  - Path: `/` (accessible across entire site)
  - SameSite: `Lax` (secure against CSRF attacks)

### How It Works

1. **On Selection**: When user selects an animal from the dropdown, `Game._savePetToCookie()` stores it
2. **On Load**: When game initializes, `Game._loadPetFromCookie()` retrieves the saved preference
3. **Fallback**: If no cookie exists, defaults to 🐶 (Dog)

### Adding New Preferences

To store additional settings (e.g., hint mode, grid size):

1. **Add cookie save function** in `Game.js`:
```javascript
_saveHintModeToCookie(mode) {
    const date = new Date();
    date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `hintMode=${encodeURIComponent(mode)};${expires};path=/;SameSite=Lax`;
}
```

2. **Add cookie load function** in `Game.js`:
```javascript
_loadHintModeFromCookie() {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; hintMode=`);
    if (parts.length === 2) {
        return decodeURIComponent(parts.pop().split(';').shift());
    }
    return null;
}
```

3. **Call in constructor** and **event handlers** appropriately

### Cookie Compatibility with GitHub Pages

Cookies work seamlessly with GitHub Pages because:
- They are stored in the user's browser (client-side)
- No server-side processing required
- Compatible with static hosting
- Persist across page reloads and browser sessions (until expiration)

## 📦 Deployment

The game is ready for GitHub Pages! Just push to your repository and enable GitHub Pages in Settings → Pages.

No build step required - everything runs in the browser.
