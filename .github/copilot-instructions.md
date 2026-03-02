# Copilot Instructions for PenThePet

PenThePet is a browser-based daily logic puzzle. Vanilla HTML, CSS, and JavaScript — no frameworks, no build tools, deployed on GitHub Pages.

## Rules

- **No frameworks/libraries** (no React, Vue, jQuery, lodash, etc.)
- **No build tools** (no webpack, rollup, vite)
- **No new runtime dependencies** (dev dependencies like Jest/ESLint are fine)
- **Use `CONSTANTS`/`CONFIG`** — never hardcode values
- **Follow existing patterns** — look at similar code before writing new code
- **Run `npm test` after changes** — all tests must pass, coverage must stay above thresholds

## Validation

```bash
npm test                    # Jest tests with coverage
npm run lint:fix            # ESLint auto-fix
npm run lint:python:fix     # Ruff auto-fix for Python
npm run lint:markdown:fix   # markdownlint auto-fix
```

Tests: `test/webapp/` (browser components), `test/generation/` (map generation). Run subsets with `npm run test:webapp` or `npm run test:generation`.

## Architecture

**Browser** (`js/`): Loads maps from `maps/YYYY.json`, renders the game, checks if pet is penned. No generation or solving in the browser.

**Generation** (`scripts/`): Offline Node.js + Python MILP solver (PuLP + CBC). Goal = **MAXIMUM** penned area.

**Script loading order** in `index.html` (must not change):
`constants.js → config.js → tileTypes.js → CookieUtils.js → DateUtils.js → PathfindingUtils.js → Grid.js → Game.js → Menu.js → main.js`

**Tile system:** All tile properties in `js/tileData.js` (single source of truth). Add a tile → add one entry there + SVG asset.

## Map Generation

Maps are pre-generated offline in `maps/YYYY.json`. Wall budget = `floor(size × 0.75)`. All maps validated by `MapValidator`. No fallbacks — generation throws on failure.

```bash
node scripts/generate-map.js --size 9              # single map
node scripts/generate-map.js --size 7-13 --count 5 # batch
node scripts/generate-map.js --fresh --count 10     # replace all
node scripts/audit-maps.js                          # validate all
```

## Documentation

- [docs/CODE_STRUCTURE.md](../docs/CODE_STRUCTURE.md) — file purposes and structure
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — design decisions
- [docs/TESTING.md](../docs/TESTING.md) — testing guide
- [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md) — dev setup, workflow, CI/CD
- [docs/MAP_GENERATION.md](../docs/MAP_GENERATION.md) — generation algorithm and agent quick reference
- [docs/TILE_SYSTEM.md](../docs/TILE_SYSTEM.md) — tile properties and how to add tile types
- [docs/CLOUD_SYNC_SETUP.md](../docs/CLOUD_SYNC_SETUP.md) — Firebase cloud sync setup

Keep docs in sync when making code changes.
