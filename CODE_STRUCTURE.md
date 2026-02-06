# Pen the Pet - Code Structure Guide

## 📁 Project Structure

```
PenThePet/
├── index.html          # Main HTML file (minimal, references external files)
├── css/
│   └── styles.css      # All game styling
├── js/
│   ├── config.js       # Game configuration and settings
│   ├── tileTypes.js    # Tile type definitions and properties
│   ├── MapGenerator.js # Map generation and validation logic
│   ├── Grid.js         # Grid data structure and operations
│   ├── Game.js         # Main game controller and interaction logic
│   └── main.js         # Application entry point and initialization
└── CODE_STRUCTURE.md   # This file (developer documentation)
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

### `js/config.js`
Centralized configuration for easy game customization:
- **Grid settings:** Default size, min/max size limits
- **Tile distribution:** Probability ratios for tile generation
- **Cell visuals:** Size in pixels, gap between cells
- **Gameplay options:** Toggle features like wall removal

**To change game parameters:** Modify values in the CONFIG object.

### `js/tileTypes.js`
Defines all tile types and their properties:
- Name, display name, and description
- Whether the tile is clickable
- CSS class and gradient colors
- ARIA labels for accessibility

**To add new tile types:** Add a new entry to the TILE_TYPES object with all required properties.

### `js/MapGenerator.js`
Handles map generation and validation:
- Generates random maps with tile distribution based on config
- Validates maps to ensure there's a path from home to edge
- Uses BFS (Breadth-First Search) pathfinding for validation
- Creates guaranteed valid maps if random generation fails

**To modify map generation:** Edit the generation or validation logic in this class.

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

**To add gameplay features:** Extend this class with new methods for character movement, scoring, etc.

### `js/main.js`
Application entry point:
- Initializes the game when the page loads
- Sets up global event handlers (if needed)
- Future: Can add game state persistence, analytics, etc.

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

## 📦 Deployment

The game is ready for GitHub Pages! Just push to your repository and enable GitHub Pages in Settings → Pages.

No build step required - everything runs in the browser.
