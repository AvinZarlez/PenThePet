# Copilot Instructions for PenThePet

PenThePet is a browser-based daily logic puzzle. Vanilla HTML, CSS, and JavaScript — no frameworks, no build tools, deployed on GitHub Pages.

## Rules

- **No frameworks/libraries** (no React, Vue, jQuery, lodash, etc.)
- **No build tools** (no webpack, rollup, vite)
- **No new runtime dependencies** (dev dependencies like Jest/ESLint are fine)
- **Use `CONSTANTS`/`CONFIG`** — never hardcode values
- **Follow existing patterns** — look at similar code before writing new code
- **Run `npm test` after changes** — all tests must pass, coverage must stay above thresholds
- **Keep docs in sync** — update relevant docs when changing code

## Validation

```bash
npm test                    # Jest tests with coverage
npm run test:webapp         # Browser-side tests only
npm run test:generation     # Map generation tests only
npm run lint:fix            # ESLint auto-fix
npm run lint:python:fix     # Ruff auto-fix for Python
npm run lint:markdown:fix   # markdownlint auto-fix
```

## Architecture

**Browser** (`js/`): Loads maps from `maps/YYYY.json`, renders the game, checks if pet is penned. No generation or solving in the browser.

**Generation** (`scripts/`): Offline Node.js + Python MILP solver (PuLP + CBC). Goal = **MAXIMUM** penned area.

**Script loading order** in `index.html` (must not change):
`constants.js → config.js → tileData.js → tileTypes.js → CookieUtils.js → i18n.js → DateUtils.js → PathfindingUtils.js → Grid.js → firebase-config.js → CloudMigration.js → CloudSync.js → Analytics.js → Game.js → Menu.js → main.js`

## Key Files

| File | Role |
|------|------|
| `js/constants.js` | All game constants (`CONSTANTS`). Edit here first. |
| `js/config.js` | Derived config referencing `CONSTANTS`. |
| `js/tileData.js` | **Single source of truth** for all tile types. All rendering, generation, scoring, pathfinding, solver, and player instructions derive from it. |
| `js/tileTypes.js` | Compatibility wrapper — builds `TILE_TYPES` from `TILE_DATA`. |
| `js/i18n.js` | **Single source of truth** for all user-facing text. Use `I18N.t('key')` in JS; `data-i18n="key"` in HTML. |
| `js/Grid.js` | Grid state management + `parseCompactMap` / `parseCompactSolution`. |
| `js/PathfindingUtils.js` | BFS pathfinding: `isPenned`, `calculatePennedArea`, `hasPathToEdge`. |
| `js/Game.js` | Main game controller — rendering, clicks, wall placement, penning detection. |
| `js/Menu.js` | Modal system — level selector, instructions, options, cloud sync UI. |
| `js/CloudSync.js` | Optional Firebase Auth + Firestore sync (dormant when `firebase-config.js` is empty). |
| `js/Analytics.js` | Optional Firebase Analytics (no-op when unconfigured; anonymous events only). |
| `js/main.js` | Entry point — loads map, initializes `Game` and `Menu`. |
| `js/MapGenerator.js` | Map generation logic (Node.js only, not loaded in browser). |
| `js/MapValidator.js` | Map quality validation (Node.js only, not loaded in browser). |

## Tile System

All tile properties live in `js/tileData.js`. To add a tile:

1. Add one entry to `TILE_DATA` in `js/tileData.js`.
2. Add a `descriptionKey` pointing to a new key in `js/i18n.js` (under `LANGUAGES.en`).
3. Add the SVG asset to `assets/`.

Everything else (rendering, generation, scoring, pathfinding, player instructions) updates automatically. See [docs/TILE_SYSTEM.md](../docs/TILE_SYSTEM.md).

## Localization

All user-facing strings live in `js/i18n.js`. **Never hardcode visible text** in HTML or JS.

- In HTML: `<element data-i18n="key"></element>` (leave content empty)
- In JS: `I18N.t('key', { param: value })`

## Map Generation

Maps are pre-generated offline and stored in `maps/YYYY.json`. Wall budget = `floor(size × 0.75)`. Generation throws on failure — no fallbacks.

```bash
pip install -r scripts/solver/requirements.txt
node scripts/generate-map.js --date 2026-02-15 --size 9
node scripts/generate-map.js --size 7-17 --count 5
node scripts/audit-maps.js   # validate all maps
```

See [docs/MAP_GENERATION.md](../docs/MAP_GENERATION.md).

## Documentation

- [docs/CODE_STRUCTURE.md](../docs/CODE_STRUCTURE.md) — every file's purpose and connections
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — design decisions and tech choices
- [docs/TESTING.md](../docs/TESTING.md) — test files, running tests, writing tests
- [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md) — dev setup, workflow, CI/CD, debugging
- [docs/MAP_GENERATION.md](../docs/MAP_GENERATION.md) — generation algorithm and commands
- [docs/TILE_SYSTEM.md](../docs/TILE_SYSTEM.md) — tile properties and how to add new tiles
- [docs/FIREBASE_SETUP.md](../docs/FIREBASE_SETUP.md) — optional cloud sync and analytics setup
- [docs/ART_ASSETS.md](../docs/ART_ASSETS.md) — asset inventory and replacement guide
