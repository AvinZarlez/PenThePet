# Development Guide

Complete guide for developing PenThePet.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Testing Branches](#testing-branches)
- [Coding Standards](#coding-standards)
- [Common Tasks](#common-tasks)
- [Debugging](#debugging)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- **Node.js 20+** (for development tools only)
- **Python 3** (for map generation with MILP solver)
- **Git** (for version control)
- **Web Browser** (Chrome, Firefox, Safari)
- **Text Editor** (VS Code recommended)

### Initial Setup

```bash
# Clone repository
git clone https://github.com/AvinZarlez/PenThePet.git
cd PenThePet

# Install development dependencies (optional, for testing/linting)
npm install

# Start local server for testing
python3 -m http.server 8080
# OR
npx http-server -p 8080
# OR
php -S localhost:8080

# Open in browser
open http://localhost:8080
```

### Project Structure

```text
PenThePet/
├── index.html           # Entry point - open this in browser
├── css/
│   └── styles.css       # All styling
├── js/
│   ├── constants.js     # Configuration constants
│   ├── config.js        # Game config (uses constants)
│   ├── tileTypes.js     # Tile definitions
│   ├── wordList.js      # Map naming words
│   ├── CookieUtils.js   # Shared cookie helpers
│   ├── DateUtils.js     # Shared date helpers
│   ├── PathfindingUtils.js  # BFS pathfinding
│   ├── Grid.js          # Grid state management
│   ├── Game.js          # Game controller (checker)
│   ├── Menu.js          # Menu system
│   └── main.js          # Entry point
├── scripts/
│   ├── generate-maps.js # Generate daily maps
│   ├── generate-single-map.js # Single map generator
│   ├── audit-maps.js    # Validate maps
│   └── solver/          # MILP solver pipeline
│       ├── MILPSolver.js    # Node.js wrapper
│       ├── solve.py         # Python MILP solver
│       └── requirements.txt # Python deps (PuLP)
├── test/                # Test suite
├── docs/                # Documentation
└── maps.json            # Daily puzzles
```

## Development Workflow

### Typical Development Cycle

1. **Start local server**

   ```bash
   python3 -m http.server 8080
   ```

2. **Open in browser**
   - Navigate to `http://localhost:8080`
   - Open DevTools (F12)

3. **Make changes**
   - Edit files in text editor
   - Save changes

4. **Refresh browser**
   - Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
   - See changes immediately (no build step!)

5. **Test changes**
   - Play the game
   - Check console for errors
   - Verify functionality

6. **Run automated tests**

   ```bash
   npm test
   ```

7. **Commit changes**

   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```

### Development Best Practices

1. **Test in browser first** - Manual testing catches most issues
2. **Check console** - Look for JavaScript errors
3. **Use debugger** - Set breakpoints in DevTools
4. **Run tests frequently** - Catch regressions early
5. **Commit often** - Small commits are easier to review
6. **Update docs** - Keep documentation in sync with code

## Testing Branches

Before merging changes to main, you should test your branch thoroughly. There are multiple ways to test:

### Quick Testing Options

**Option 1: Test Locally (Recommended for Development)**

- Fastest feedback loop
- Full debugging capabilities  
- No impact on production

**Option 2: Test on GitHub Pages (Visual Testing)**

- See changes live without local setup
- Temporarily replaces main branch
- Good for visual verification

**Option 3: GitHub Codespaces (Cloud Testing)**

- No local setup needed
- Full development environment
- Limited free hours

**📖 Complete Guide:** See [DEBUGGING_BRANCHES.md](DEBUGGING_BRANCHES.md) for:

- Detailed setup instructions for each method
- Testing multiple branches simultaneously
- Best practices and troubleshooting
- Step-by-step workflows

### Quick Local Testing

For quick local testing during development:

```bash
# Start local server (choose one)
python3 -m http.server 8080
# OR
npx http-server -p 8080
# OR  
php -S localhost:8080

# Open http://localhost:8080
# Make changes → Save → Hard refresh browser (Cmd/Ctrl+Shift+R)
```

See [DEBUGGING_BRANCHES.md](DEBUGGING_BRANCHES.md) for more advanced workflows.

## Coding Standards

### JavaScript Style

**ES6+ Features:**

```javascript
// Use const/let (not var)
const MAX_SIZE = 21;
let currentSize = 9;

// Use arrow functions
const double = x => x * 2;

// Use template literals
console.log(`Size: ${currentSize}`);

// Use destructuring
const { size, goal } = grid;

// Use default parameters
function init(size = 9) { ... }

// Use classes
class Grid {
    constructor(size) { ... }
}
```

**Naming Conventions:**

```javascript
// Constants: UPPER_SNAKE_CASE
const MAX_WALLS = 15;

// Classes: PascalCase
class MapGenerator { ... }

// Functions/variables: camelCase
function generateMap() { ... }
let currentWalls = 0;

// Private methods: _camelCase
_validateMap() { ... }
```

**Code Organization:**

```javascript
// 1. Imports/requires (if using modules)
const Grid = require('./Grid.js');

// 2. Constants
const DEFAULT_SIZE = 9;

// 3. Class definition
class Game {
    constructor() { ... }
    
    // Public methods first
    newGame() { ... }
    reset() { ... }
    
    // Private methods last
    _render() { ... }
    _updateUI() { ... }
}

// 4. Exports
module.exports = Game;
```

**Comments:**

```javascript
/**
 * Generate a random map with given size.
 * 
 * @param {number} size - Grid size (7-21)
 * @param {number} maxWalls - Maximum walls allowed
 * @returns {Object} Map data with goal and wall count
 */
function generateMap(size, maxWalls) {
    // Implementation
}

// Single-line comments for quick notes
let penned = false; // Track if pet is penned
```

### CSS Style

**Organization:**

```css
/* Global styles first */
:root {
    --cell-size: 50px;
}

body, html { ... }

/* Layout components */
.container { ... }
.grid-wrapper { ... }

/* UI components (BEM-like) */
.legend-item { ... }
.legend-box { ... }

/* Tile styles */
.cell { ... }
.cell.grass { ... }
.cell.water { ... }

/* States and modifiers */
.cell:hover { ... }
.cell.disabled { ... }

/* Responsive last */
@media (max-width: 768px) { ... }
```

**Modern CSS:**

```css
/* Use CSS Grid for layout */
.grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

/* Use Flexbox for centering */
.centered {
    display: flex;
    justify-content: center;
    align-items: center;
}

/* Use CSS variables for theming */
:root {
    --primary-color: #4CAF50;
    --cell-size: 50px;
}

/* Use clamp() for responsive sizing */
font-size: clamp(12px, 2vw, 16px);
```

### HTML Style

**Semantic HTML:**

```html
<!-- Use semantic tags -->
<header>...</header>
<main>...</main>
<footer>...</footer>
<article>...</article>
<section>...</section>

<!-- Not generic divs everywhere -->
<div class="header">...</div> <!-- Bad -->
<header>...</header>          <!-- Good -->
```

**Accessibility:**

```html
<!-- ARIA labels for screen readers -->
<button aria-label="Start new game">New Game</button>

<!-- Alt text for images -->
<img src="pet.png" alt="Pet emoji">

<!-- Semantic button (not div with click handler) -->
<button onclick="reset()">Reset</button>
```

## Common Tasks

### Adding a New Feature

**Example: Add undo functionality**

1. **Design the feature**
   - What data needs to be saved?
   - What should undo restore?

2. **Update data structures**

   ```javascript
   // Grid.js
   class Grid {
       constructor(size) {
           this.history = []; // Add history stack
       }
       
       saveState() {
           this.history.push(JSON.parse(JSON.stringify(this.tiles)));
       }
       
       undo() {
           if (this.history.length > 0) {
               this.tiles = this.history.pop();
           }
       }
   }
   ```

3. **Update UI**

   ```html
   <!-- index.html -->
   <button id="undoBtn">Undo</button>
   ```

4. **Wire up interaction**

   ```javascript
   // Game.js
   document.getElementById('undoBtn').addEventListener('click', () => {
       this.grid.undo();
       this.render();
   });
   ```

5. **Test**
   - Manual: Click undo and verify it works
   - Automated: Add unit tests

6. **Document**
   - Update README with new feature
   - Add comments to code

### Modifying Game Configuration

**Example: Change max walls from 15 to 20**

1. **Update constants**

   ```javascript
   // js/constants.js
   const CONSTANTS = {
       MAX_WALLS: 20, // Changed from 15
       // ...
   };
   ```

2. **Regenerate maps** (if needed)

   ```bash
   node scripts/generate-maps.js --fresh --count 10
   ```

3. **Test**

   ```bash
   npm test
   ```

4. **Update documentation**
   - Update references to 15 walls
   - Note the change in commit message

### Adding a New Tile Type

**Example: Add "ice" tile**

1. **Define tile type**

   ```javascript
   // js/tileTypes.js
   ice: {
       name: 'ice',
       displayName: 'Ice',
       description: 'Slippery ice tile',
       clickable: false,
       cssClass: 'ice',
       gradient: 'linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 100%)',
       ariaLabel: (row, col) => `Ice tile at row ${row + 1}, column ${col + 1}`
   }
   ```

2. **Add CSS styling**

   ```css
   /* css/styles.css */
   .cell.ice {
       background: linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 100%);
   }
   ```

3. **Update tile distribution**

   ```javascript
   // js/constants.js
   TILE_DISTRIBUTION: {
       grass: 0.6,  // Reduced from 0.7
       water: 0.3,
       ice: 0.1     // New tile
   }
   ```

4. **Update legend** (optional)

   ```html
   <!-- index.html -->
   <div class="legend-item">
       <div class="legend-box ice"></div>
       <span>Ice (slippery)</span>
   </div>
   ```

5. **Test**
   - Generate new maps with ice tiles
   - Verify rendering
   - Add unit tests if tile has special behavior

### Generating New Daily Maps

```bash
# Install Python dependencies first
pip install -r scripts/solver/requirements.txt

# Generate 10 fresh maps
node scripts/generate-maps.js --fresh --count 10 --sizes 7,9,11

# Append 5 more maps
node scripts/generate-maps.js --count 5 --start-date 2026-02-16

# Test generated maps
npm test
```

## Debugging

### Browser DevTools

**Console:**

```javascript
// Access game instance
window.game // Game object

// Inspect grid
window.game.grid.tiles
window.game.grid.goal

// Debug tile clicks
console.log('Clicked:', row, col, tileType);
```

**Breakpoints:**

1. Open DevTools (F12)
2. Go to Sources tab
3. Find file (e.g., `Game.js`)
4. Click line number to set breakpoint
5. Trigger the code path
6. Inspect variables in Scope panel

**Network Tab:**

- Check if maps.json loads correctly
- Verify no 404 errors

### Common Issues

**Game doesn't load:**

- Check console for errors
- Verify script loading order in index.html
- Check if local server is running

**Map generation fails:**

- Check console for "Failed to find solution" messages
- Reduce maxWalls if generation takes too long
- Check tile distribution sums to ~1.0

**Tests fail:**

- Run `npm install` to ensure dependencies installed
- Check Node.js version (need 20+)
- Look at specific test failure message

**Linting errors:**

- Run `npm run lint:fix` to auto-fix
- Manually fix remaining issues
- Check ESLint configuration

### Debug Logging

Add temporary logging:

```javascript
// Game.js
handleCellClick(row, col) {
    console.log('Click:', { row, col, tile: this.grid.getTile(row, col) });
    // ... rest of code
}
```

Remove before committing or wrap in debug flag:

```javascript
const DEBUG = false;

if (DEBUG) {
    console.log('Debug info:', data);
}
```

## CI/CD and Automation

### GitHub Actions Workflows

The project uses GitHub Actions for automated testing and deployment:

**test.yml** - Runs on every push and PR (parallel jobs):

- **Lint JavaScript** - ESLint checks
- **Lint Python** - ruff checks on solver scripts
- **Lint Markdown** - markdownlint checks on documentation
- **Test Webapp** - Jest tests for browser-side components
- **Test Level Generation** - Jest tests for generation scripts
- **Full Test Suite & Coverage** - Combined test run with coverage reporting, Codecov upload, and PR comments

**generate-daily-map.yml** - Manual workflow for adding new maps:

- Triggered via workflow_dispatch
- Date is optional (auto-assigns next available date if omitted)
- Generates map using Python MILP solver
- Validates map quality
- Commits new map to maps.json

**static.yml** - Deploys to GitHub Pages on main branch:

- Uploads entire repository as artifact
- Deploys to GitHub Pages automatically

### Dependabot Configuration

**Purpose:** Dependabot is configured to monitor dependencies and create PRs for updates.

**Configuration** (`.github/dependabot.yml`):

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

**Important Notes:**

- ⚠️ **GitHub Actions monitoring is intentionally disabled**
- Monitoring GitHub Actions in Copilot agent environments causes network/permission errors
- This leads to ~2 minute delays when agents complete their work
- Error: "snapshots_unavailable_graph_error" and SSL handshake failures
- Solution: Only monitor npm packages (which we actually need)

**If you need to update Actions manually:**

- actions/checkout@v4
- actions/setup-node@v4
- codecov/codecov-action@v3
- actions/github-script@v7
- actions/configure-pages@v5
- actions/upload-pages-artifact@v3
- actions/deploy-pages@v4

## Deployment

### GitHub Pages

PenThePet deploys automatically to GitHub Pages.

**Setup (one-time):**

1. Go to repository Settings
2. Navigate to Pages section
3. Set Source: Deploy from a branch
4. Set Branch: `main` / `root`
5. Save

**Deploy process:**

```bash
# Make changes
git add .
git commit -m "Update game"
git push origin main

# GitHub Actions automatically deploys to:
# https://avinzarlez.github.io/penthepet/
```

**Verify deployment:**

1. Go to Actions tab
2. Check "pages build and deployment" workflow
3. Wait for green checkmark
4. Visit the deployed site

### Testing Production Build

Before deploying, test locally:

```bash
# Serve from root like GitHub Pages
python3 -m http.server 8080

# Test all features work
# - New game
# - Reset
# - Wall placement
# - Goal achievement
```

## Troubleshooting

### "Module not found" error in tests

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Game works locally but not on GitHub Pages

**Check:**

- Are all paths relative (not absolute)?
- Are filenames case-correct?
- Is maps.json committed?
- Check browser console for 404 errors

**Fix:**

```html
<!-- Bad: Absolute path -->
<script src="/js/main.js"></script>

<!-- Good: Relative path -->
<script src="js/main.js"></script>
```

### Tests timeout

**Cause:** Map generation takes too long

**Fix:**

```javascript
// In test file
jest.setTimeout(30000); // 30 seconds

// Or use smaller test maps
const testSize = 5; // Instead of 21
```

### Coverage drops below threshold

**Cause:** New code added without tests

**Fix:**

1. Check coverage report: `npm test -- --coverage`
2. Look at uncovered lines
3. Add tests for those code paths
4. Re-run tests until coverage above 70%

### ESLint errors after update

**Quick fix:**

```bash
npm run lint:fix
```

**Manual fix:**

1. Read error message
2. Fix the code
3. Re-run `npm run lint`

## Best Practices Summary

✅ **DO:**

- Test in browser before committing
- Run `npm test` before push
- Write tests for new features
- Use constants instead of magic numbers
- Comment complex logic
- Update documentation
- Commit small, focused changes

❌ **DON'T:**

- Commit without testing
- Add frameworks/libraries without discussion
- Hardcode configuration values
- Leave console.log statements
- Break existing tests
- Commit node_modules or build artifacts
- Make large, unfocused changes

## VS Code Setup (Optional)

**Recommended Extensions:**

- ESLint
- Prettier
- Live Server
- HTML CSS Support
- JavaScript (ES6) code snippets

**Workspace Settings** (already configured in `.vscode/`):

- Auto-format on save
- ESLint integration
- Jest test runner
- Debug configurations

**Usage:**

- Press F5 to debug tests
- Right-click HTML file → Open with Live Server
- Use test task to run Jest

## Getting Help

**Resources:**

- [CODE_STRUCTURE.md](CODE_STRUCTURE.md) - Architecture
- [MAP_GENERATION.md](MAP_GENERATION.md) - Algorithm details
- [TESTING.md](TESTING.md) - Testing guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - Design decisions

**When stuck:**

1. Check documentation
2. Look at existing code for patterns
3. Check browser console for errors
4. Run tests to see what's breaking
5. Use debugger to step through code
6. Search issues on GitHub

Happy coding! 🚀
