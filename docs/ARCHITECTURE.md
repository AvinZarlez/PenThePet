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

**Decision:** Single stylesheet with BEM-like naming

**Why:**
- Game UI is simple enough for one CSS file
- No CSS-in-JS or component-scoped styles needed
- BEM naming prevents class collisions
- Modern CSS (grid, flexbox, clamp) handles responsive design
- CSS variables enable theming

**Structure:**
```css
/* Global styles */
body, html { ... }

/* Component styles (BEM-like) */
.legend-item { ... }
.legend-box { ... }

/* State modifiers */
.cell.grass { ... }
.cell.water { ... }

/* Responsive */
@media (max-width: 768px) { ... }
```

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
2. **Logic Layer** (`MapGenerator.js`, `MILPSolver.js`) - Algorithms and game rules
3. **Controller Layer** (`Game.js`) - Coordinates data and UI
4. **View Layer** (`index.html`, `styles.css`) - User interface

**Why:**
- Each layer has single responsibility
- Easy to test each layer independently
- Changes in UI don't affect algorithms
- Game logic is reusable (could be CLI, different UI, etc.)

### File Organization

**Decision:** Flat structure with clear naming

```
js/
├── constants.js          # Configuration
├── config.js             # Derived config
├── tileTypes.js          # Data definitions
├── wordList.js           # Static data
├── PathfindingUtils.js   # Shared utilities
├── MILPSolver.js         # Algorithm
├── MapGenerator.js       # Algorithm
├── Grid.js               # Data structure
├── Game.js               # Controller
└── main.js               # Entry point
```

**Why:**
- No deep nesting to navigate
- File purpose clear from name
- Related files grouped by function (not type)
- Easy to find what you need

## Algorithm Design

### Map Generation Strategy

**Decision:** Exhaustive search for optimal wall placement

**Why:**
- **User Requirement**: "Accuracy is far more important than speed"
- Maps are small enough (7x7 to 11x11) for exhaustive search
- Guarantees finding true optimal solution
- Heuristics might miss best solution

**Algorithm:**
1. Generate random map with grass/water distribution
2. Validate pet can reach edge (BFS pathfinding)
3. For each wall count from 1 to MAX_WALLS:
   - Try all combinations of wall placements (up to 100k)
   - Check if pet is penned for each combination
   - Track maximum achievable penned area
4. Return map with optimal goal and wall count

**Tradeoff:** Slower generation (~1-2 seconds per map) vs. guaranteed optimal solution

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

### Memory-Efficient Combination Generation

**Decision:** Generate combinations on-the-fly instead of storing all

**Why:**
- Original implementation caused heap overflow for large maps
- Storing all combinations uses O(n^k) memory
- Generating on-the-fly uses O(k) memory
- Trade CPU for memory (acceptable for our use case)

**Pattern:**
```javascript
// Instead of:
const allCombinations = generateAll(); // Huge array in memory
for (const combo of allCombinations) { ... }

// Do:
for (let i = 0; i < combinationCount; i++) {
    const combo = generateNthCombination(i); // Generate one
    // Process immediately
}
```

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

**Decision:** 240 tests should run in <10 seconds

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

**Design:** Tile types are data-driven in `tileTypes.js`

**To Add:**
1. Define tile in `tileTypes.js` with properties
2. Add CSS class in `styles.css`
3. Update tile distribution in `constants.js`
4. No changes needed to core logic

**Example:**
```javascript
// tileTypes.js
ice: {
    name: 'ice',
    displayName: 'Ice',
    description: 'Slippery ice tile',
    clickable: false,
    cssClass: 'ice',
    gradient: 'linear-gradient(135deg, #e0f7ff, #b3e5fc)',
    ariaLabel: (row, col) => `Ice at ${row}, ${col}`
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

**Design:** Cookie-based preferences already implemented

**Current:**
- Selected pet emoji stored in cookie
- Expires after 1 year

**Easy to Add:**
- Hint mode preference
- Grid size preference
- Daily puzzle completion tracking
- Statistics (games played, win rate)

**Pattern:**
```javascript
_savePrefToCookie(key, value) {
    const date = new Date();
    date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
    document.cookie = `${key}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax`;
}
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
