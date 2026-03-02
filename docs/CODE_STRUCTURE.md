# Pen the Pet - Code Structure

## 📁 Project Structure

```text
PenThePet/
├── index.html              # Main HTML (structure only — no inline styles/scripts)
├── assets/                 # SVG tile images and paw icon
├── css/
│   ├── base.css            # Global reset, container, typography, buttons, footer, responsive
│   ├── game.css            # Game board, controls, grid, cells, sidebar, debug section
│   ├── modals.css          # Modal overlay, animations, shared modal content styles
│   └── menu.css            # Menu modal, calendar/level selector, cloud sync UI
├── js/
│   ├── constants.js        # Centralized constants (MAX_WALLS, MAX_GRID_SIZE, tile distribution)
│   ├── config.js           # Derived game configuration (references constants)
│   ├── tileData.js         # Tile definitions — single source of truth for all tile properties
│   ├── tileTypes.js        # Compatibility wrapper: builds TILE_TYPES from TILE_DATA
│   ├── wordList.js         # ~150 random words for map naming; exports getRandomWord()
│   ├── CookieUtils.js      # getCookie(name) / setCookie(name, value, days)
│   ├── DateUtils.js        # getTodayDate() / formatDate(dateStr)
│   ├── PathfindingUtils.js # BFS pathfinding: isPenned, calculatePennedArea, hasPathToEdge
│   ├── MapGenerator.js     # Map generation (Node.js only — NOT loaded in browser)
│   ├── MapValidator.js     # Map quality validation (Node.js only — NOT loaded in browser)
│   ├── Grid.js             # Grid state management; parseCompactMap / parseCompactSolution
│   ├── Game.js             # Game controller: rendering, clicks, wall placement, penning detection
│   ├── Menu.js             # Menu system: modals, level selector, options, cookie persistence
│   ├── firebase-config.js  # Firebase config (empty = cloud sync disabled)
│   ├── CloudSync.js        # Optional cloud sync (Firebase Auth + Firestore)
│   └── main.js             # Entry point: loads map, initializes Game and Menu
├── scripts/
│   ├── generate-map.js     # CLI entry point: single, batch, or fresh map generation
│   ├── audit-maps.js       # Validates all maps in maps/ against MapValidator
│   ├── lib/
│   │   └── mapUtils.js     # Shared utilities: dates, size parsing, DB validation/fix
│   └── solver/
│       ├── MILPSolver.js   # Node.js wrapper calling Python solver
│       ├── solve.py        # Python MILP solver (PuLP + CBC)
│       └── requirements.txt
├── test/                   # Jest test suite (webapp/ and generation/)
├── docs/                   # Documentation (see docs/README.md)
└── maps/                   # Pre-generated maps: maps/YYYY.json (one file per year)
```

**Script loading order** in `index.html` (must not change):
`constants.js → config.js → tileTypes.js → CookieUtils.js → DateUtils.js → PathfindingUtils.js → Grid.js → Game.js → Menu.js → main.js`

## 🎯 Key File Notes

**`js/tileData.js`** — The single source of truth for all tile types. All rendering, generation, scoring, pathfinding, solver, and player instructions derive from it. To add a tile: add one entry here plus an SVG asset. See [TILE_SYSTEM.md](TILE_SYSTEM.md).

**`js/Grid.js`** — Loads maps from `maps/YYYY.json` only. Exports `parseCompactMap()` and `parseCompactSolution()` for decoding the compact map format.

**`js/Game.js`** — Pure checker/renderer. Does NOT generate maps. Access via `window.game` in console.

**`js/MapGenerator.js` / `js/MapValidator.js`** — Node.js only, not loaded in browser.

**`scripts/generate-map.js`** — Supports `--date YYYY-MM-DD`, `--size N` or `--size N-M`, `--count N`, `--fresh`.

## 🍪 Cookies

All cookie operations go through `CookieUtils`. Currently stored:

| Cookie | Purpose | Set By |
|--------|---------|--------|
| `selectedPet` | Chosen animal emoji | Menu.js / Game.js |
| `hintMode` | Hint mode setting | Menu.js |
| `currentLevel` | Selected puzzle date | Menu.js |
| `debugMode` | Debug tools visibility | Menu.js |
| `submission_YYYY-MM-DD` | Submitted score | Game.js |

All cookies expire after 1 year, path `/`, SameSite `Lax`.

## 🔧 How to Extend

- **New tile type:** See [TILE_SYSTEM.md](TILE_SYSTEM.md) — add one entry to `js/tileData.js`
- **New menu option:** Extend the `Menu` class with new modal type + cookie storage
- **New game mode:** Extend the `Game` class
- **New preference:** `CookieUtils.setCookie('key', value, 365)` / `CookieUtils.getCookie('key')`
- **New CSS:** tile cursor/hover → `css/game.css`; new modal → `css/modals.css` or `css/menu.css`
- **Configuration changes:** Edit `js/constants.js` first, then `js/config.js` if needed

## 📦 Deployment

No build step — push to `main` and GitHub Pages deploys automatically. Use relative paths only (`js/main.js` not `/js/main.js`).

---

**See also:** [docs/README.md](README.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [TILE_SYSTEM.md](TILE_SYSTEM.md) · [MAP_GENERATION.md](MAP_GENERATION.md) · [TESTING.md](TESTING.md)
