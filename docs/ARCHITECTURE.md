# Architecture and Design Decisions

This document explains the architectural choices and design philosophy behind PenThePet.

## Table of Contents

- [Design Philosophy](#design-philosophy)
- [Technology Choices](#technology-choices)
- [Code Organization](#code-organization)
- [Algorithm Design](#algorithm-design)
- [Performance Considerations](#performance-considerations)
- [Future Extensibility](#future-extensibility)

## Design Philosophy

### Simplicity Over Complexity

PenThePet is intentionally built with minimal dependencies and simple architecture:

**Core Principle:** If it can be done in vanilla JavaScript, do it in vanilla JavaScript.

This philosophy drives several key decisions:

- No React, Vue, or Angular
- No build tools (webpack, rollup, vite)
- No TypeScript compilation
- No CSS preprocessors (SASS, LESS)
- No utility libraries (lodash, jQuery)

### Why This Matters

1. **Lower Barrier to Entry**: Anyone with basic JavaScript knowledge can contribute
2. **No Breaking Changes**: No framework updates that break the app
3. **Faster Development**: No build step means instant refresh during development
4. **Better Learning**: Pure JavaScript skills are transferable everywhere
5. **Longevity**: Code will work in browsers for years without updates
6. **Zero Config Deployment**: Push to GitHub Pages and it just works

## Technology Choices

### Vanilla JavaScript (ES6+)

**Decision:** Use modern JavaScript without transpilation

**Why:**

- Modern browsers support ES6+ natively
- Class syntax provides clean object-oriented patterns
- Arrow functions and destructuring improve readability
- No Babel or TypeScript compilation needed
- Faster development iteration (no build step)

**Tradeoff:** Lose type safety (TypeScript) and JSX convenience (React)

**Justification:** Type safety isn't critical for a small game, and vanilla JS is sufficient for DOM manipulation.

### No Build Tools

**Decision:** No webpack, rollup, vite, or other bundlers

**Why:**

- The game is small enough (<10 JS files) that bundling provides minimal benefit
- Script loading order can be managed manually in HTML
- Developer can test by opening index.html in browser
- Deployment is just pushing static files to GitHub Pages
- No package.json needed for production (only dev dependencies)

**Tradeoff:** No tree-shaking, code splitting, or advanced optimizations

**Justification:** Game loads in milliseconds already; optimization not needed.

### Module Pattern

**Decision:** Use CommonJS-style modules with `module.exports` and `require()`

**Why:**

- Works in both browser (via manual script loading) and Node.js (for testing)
- Simple and well-understood pattern
- No need for ES modules or dynamic imports
- Compatible with Jest testing framework

**Implementation:**

- Production (browser): Scripts loaded in order, exports to global scope
- Development (testing): CommonJS modules loaded by Jest/Node.js
- Dual-mode files check for `module.exports` existence

### CSS Architecture

**Decision:** Split stylesheet with BEM-like naming, organized by logical view

**Why:**

- Each file has a single responsibility (base, game, modals, menu)
- Easier to find and modify styles for a specific feature
- BEM naming prevents class collisions
- Modern CSS (grid, flexbox, clamp) handles responsive design
- CSS variables enable theming

**File breakdown:**

```text
css/
├── base.css     — global reset, body, container, typography, buttons, footer, responsive
├── game.css     — game board, controls, grid, cells, sidebar, debug section
├── modals.css   — modal overlay, animations, shared modal content styles
└── menu.css     — menu modal, calendar/level selector, cloud sync UI
```

**Structure within each file:**

```css
/* Component styles (BEM-like) */
.map-info { ... }
.map-info-item { ... }

/* State modifiers */
.cell.grass { ... }
.cell.water { ... }

/* Responsive (at end of file) */
@media (max-width: 768px) { ... }
```

**To add a new tile CSS class:** Add it to `css/game.css`.  
**To style a new modal:** Add it to `css/modals.css` (base) or `css/menu.css` (menu content).

### Configuration Management

**Decision:** Centralized constants and configuration objects

**Why:**

- All tweakable values in one place (`js/constants.js`)
- Game configuration derived from constants (`js/config.js`)
- Easy to adjust game parameters without hunting through code
- Prevents magic numbers scattered throughout codebase

**Pattern:**

```javascript
// constants.js - source of truth
const CONSTANTS = {
    MAX_WALLS: 15,
    MAX_GRID_SIZE: 21,
    // ...
};

// config.js - derived configuration
const CONFIG = {
    grid: {
        maxSize: CONSTANTS.MAX_GRID_SIZE,
        // ...
    }
};

// Usage in code
if (size > CONSTANTS.MAX_GRID_SIZE) { ... }
```

## Code Organization

### Class-Based Architecture

**Decision:** Use ES6 classes for core objects (Grid, Game, MapGenerator)

**Why:**

- Natural model for stateful objects
- Constructor pattern is familiar and clear
- Instance methods keep related functionality together
- Easy to test and mock

**Pattern:**

```javascript
class Grid {
    constructor(size) {
        this.size = size;
        this.tiles = [];
    }
    
    getTile(row, col) { ... }
    setTile(row, col, type) { ... }
}
```

### Separation of Concerns

**Decision:** Clear separation between data, logic, and presentation

**Layers:**

1. **Data Layer** (`Grid.js`) - Grid state and tile management
2. **Logic Layer** (`PathfindingUtils.js`) - Pathfinding and penning checks
3. **Controller Layer** (`Game.js`) - Coordinates data and UI, checks win condition
4. **View Layer** (`index.html`, `css/`) - User interface
5. **Generation Pipeline** (`scripts/`, `MapGenerator.js`, `MapValidator.js`) - Offline map generation (not loaded in browser)

**Why:**

- Each layer has single responsibility
- Easy to test each layer independently
- Changes in UI don't affect algorithms
- Game logic is reusable (could be CLI, different UI, etc.)

### File Organization

**Decision:** Flat structure with clear naming

```text
js/
├── constants.js          # Configuration
├── config.js             # Derived config
├── tileTypes.js          # Data definitions
├── wordList.js           # Static data
├── CookieUtils.js        # Cookie helpers
├── DateUtils.js          # Date helpers
├── PathfindingUtils.js   # Shared utilities
├── Grid.js               # Data structure
├── Game.js               # Controller (checker)
├── Menu.js               # Menu system
└── main.js               # Entry point

scripts/
├── solver/
│   ├── MILPSolver.js     # Node.js wrapper
│   ├── solve.py          # Python MILP solver
│   └── requirements.txt  # Python deps
├── generate-map.js       # Map generation entry point (single, batch, or fresh)
├── lib/
│   └── mapUtils.js       # Shared utilities (dates, size parsing, DB validation)
└── audit-maps.js         # Map validation
```

**Why:**

- No deep nesting to navigate
- File purpose clear from name
- Related files grouped by function (not type)
- Easy to find what you need

## Algorithm Design

### Map Generation Strategy

**Decision:** MILP solver for provably optimal wall placement

**Why:**

- **User Requirement**: "Accuracy is far more important than speed"
- Provably optimal solutions using PuLP + CBC
- Handles all map sizes efficiently (7x7 to 21x21)
- No combinatorial explosion as with brute-force approaches

**Algorithm:**

1. Generate random map with grass/water distribution
2. Validate pet can reach edge (BFS pathfinding)
3. Formulate as Mixed Integer Linear Program:
   - Maximize enclosed area subject to wall budget
   - Ensure pen connectivity via network flow constraints
   - Ensure boundary completeness via vertex-cut constraints
4. Solve with PuLP + CBC for provably optimal solution
5. Return map with optimal goal and wall count

**Tradeoff:** Requires Python + PuLP dependency for generation vs. guaranteed optimal solution

**Justification:** Maps are generated once and reused; accuracy more important than speed.

### Pathfinding Choice

**Decision:** Breadth-First Search (BFS) for pet reachability

**Why:**

- BFS finds shortest path and checks reachability
- Simple to implement and understand
- Efficient for small grids (7x7 to 21x21)
- No need for A* or Dijkstra (we don't need weighted paths)

**Performance:**

- BFS on 21x21 grid: ~400 cells to check
- JavaScript can check millions of operations per second
- Negligible performance impact

## Performance Considerations

### Grid Size Limits

**Decision:** Maximum 21x21 grid

**Why:**

- BFS pathfinding is O(n^2) for n×n grid
- 21x21 = 441 cells, well within performance budget
- Responsive design keeps grid visible on any screen
- Larger grids would be hard to solve mentally

**Dynamic Cell Sizing:**

- Cells scale from 20px (min) to 50px (max)
- Grid always fits viewport (phone to desktop)
- Window resize recalculates cell size

### Test Performance

**Decision:** Tests should run in <10 seconds

**Why:**

- Fast tests encourage running them frequently
- CI pipeline stays responsive
- Developer productivity maintained

**Strategies:**

- Mock expensive operations in unit tests
- Use small test maps (5x5, 7x7)
- Limit exhaustive search in tests (fewer combinations)
- Skip slow tests in watch mode

### Production Performance

**Metrics:**

- Page load: <100ms
- New game generation: <50ms (using pre-generated maps)
- Map validation: <10ms (BFS on 11x11)
- UI interactions: <16ms (60 FPS)

All targets met without optimization needed.

## Future Extensibility

### Adding New Tile Types

**Design:** Tile types are data-driven in `tileData.json`. See [TILE_SYSTEM.md](TILE_SYSTEM.md) for full documentation.

**To Add:** Define a single entry in `tileData.json`, then run `npm run generate-tile-data` — all game logic, rendering, generation, scoring, the Python solver, and player instructions are built automatically.

**Example:**

```json
"ice": {
    "score": 0,
    "wallPlaceable": false,
    "clickable": false,
    "blocksMovement": false,
    "chance": 0.10,
    "compactChar": "i",
    "numericId": 6,
    "cssClass": "ice",
    "description": "Ice tiles are slippery and cannot have walls placed on them.",
    "assets": ["ice.svg"],
    "ariaLabel": "Ice at row {row}, column {col}."
}
```

### Adding New Game Modes

**Design:** Game class is modular and extensible

**Possible Extensions:**

- Time trial mode (add timer in `Game.js`)
- Hint system (already infrastructure in place)
- Undo/redo (state management already exists)
- Multiplayer (sync state via WebSocket)

**Pattern:**

```javascript
class Game {
    constructor(size, mode = 'classic') {
        this.mode = mode;
        // ...
    }
    
    startGame() {
        if (this.mode === 'timed') {
            this.startTimer();
        }
        // ...
    }
}
```

### Adding Persistence

**Design:** Cookie-based preferences via shared CookieUtils

**Current:**

- Selected pet emoji, hint mode, current level, debug mode, and submissions stored in cookies
- All cookie operations use `CookieUtils.getCookie()` and `CookieUtils.setCookie()`
- Date formatting uses `DateUtils.formatDate()`
- Expires after 1 year

**Easy to Add:**

- Statistics (games played, win rate)
- Theme preferences
- Additional game modes

**Pattern:**

```javascript
// Save a preference
CookieUtils.setCookie('myKey', 'myValue', 365);

// Load a preference
const saved = CookieUtils.getCookie('myKey');
```

### Internationalization (i18n)

**Design:** Text content is separated from logic

**To Add:**

1. Create `js/i18n.js` with translations
2. Replace hardcoded strings with `i18n.t('key')`
3. Add language selector to UI
4. Store preference in cookie

**Not Yet Implemented:** Text is currently hardcoded, but refactoring would be straightforward.

## Conclusion

PenThePet's architecture prioritizes:

1. **Simplicity** - Vanilla JavaScript, no frameworks
2. **Maintainability** - Clear structure, well-documented
3. **Performance** - Fast enough without optimization
4. **Extensibility** - Easy to add features
5. **Accessibility** - ARIA labels, semantic HTML
6. **Portability** - Works anywhere, no dependencies

These choices make the codebase:

- Easy for new developers to understand
- Simple for AI agents to modify
- Stable over time (no breaking updates)
- Fun to work with

The architecture serves the project's goals: a simple, elegant puzzle game that anyone can play, understand, and contribute to.
