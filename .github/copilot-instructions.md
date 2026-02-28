# Copilot Instructions for PenThePet

PenThePet is a browser-based daily logic puzzle game where players place walls to pen in their pet. Built with vanilla HTML, CSS, and JavaScript — no frameworks, no build tools, deployed on GitHub Pages.

## Hard Rules

- **No frameworks or libraries** (no React, Vue, jQuery, lodash, etc.)
- **No build tools** (no webpack, rollup, vite — code runs directly in browser)
- **No new runtime dependencies** (dev dependencies like Jest/ESLint are fine)
- **Use `CONSTANTS`/`CONFIG`** from `constants.js`/`config.js` — never hardcode values
- **Follow existing patterns** — look at similar code before writing new code
- **Run `npm test` after changes** — all tests must pass, coverage must stay above thresholds

## Validation Commands

```bash
npm test                    # Jest tests with coverage (must pass)
npm run lint:fix            # ESLint auto-fix
npm run lint:python:fix     # Ruff auto-fix for Python
npm run lint:markdown:fix   # markdownlint auto-fix
npm run lint:all            # Run all linters
```

## Test Structure

Tests use Jest with jsdom and live in `test/`:

- **`test/webapp/`** — Browser-side components (Grid, PathfindingUtils, Menu, constants, CookieUtils, DateUtils, wordList)
- **`test/generation/`** — Map generation scripts (MapGenerator, MapValidator, generate-maps)

Run subsets with `npm run test:webapp` or `npm run test:generation`.

Coverage thresholds: 70% branches/lines/statements, 75% functions. Files excluded from coverage: `main.js`, `config.js`, `Game.js`, `tileTypes.js` (UI/config, tested manually).

## Key Architecture

**Browser code** (`js/`): Loads maps from `maps.json`, renders the game, checks if pet is penned. No map generation or solving in the browser.

**Generation scripts** (`scripts/`): Offline Node.js scripts that generate maps using a Python MILP solver (PuLP + CBC). The goal for each map is the **MAXIMUM** penned area achievable — not minimum.

**Script loading order** in `index.html` matters and must not change:
constants.js → config.js → tileTypes.js → CookieUtils.js → DateUtils.js → PathfindingUtils.js → Grid.js → Game.js → Menu.js → main.js

## Map Generation

Maps are pre-generated offline and stored in `maps.json`. Generation requires Python 3 + PuLP:

```bash
pip install -r scripts/solver/requirements.txt
node scripts/generate-map.js --date 2026-02-15 --size 9
```

Key points:

- Goal = **MAXIMUM** achievable penned area (not minimum)
- Wall budget = `floor(size × 0.75)`
- All maps validated by `MapValidator` (path to edge, goal ≥ 5, strategic wall placement)
- No fallbacks — generation throws on failure after 1000 retries
- See [docs/MAP_GENERATION.md](../docs/MAP_GENERATION.md) for full details

## Detailed Documentation

For deeper context beyond this file, see:

- [docs/CODE_STRUCTURE.md](../docs/CODE_STRUCTURE.md) — File purposes and code organization
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — Design decisions and philosophy
- [docs/TESTING.md](../docs/TESTING.md) — Testing guide with file-by-file breakdown
- [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md) — Dev setup, workflow, CI/CD
- [docs/MAP_GENERATION.md](../docs/MAP_GENERATION.md) — Generation algorithm and solver details
- [docs/AGENT_GUIDELINES.md](../docs/AGENT_GUIDELINES.md) — Coding standards and examples

Keep documentation in sync when making code changes — update the relevant docs above if your changes affect their content.
