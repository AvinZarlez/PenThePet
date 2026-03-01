# Copilot Instructions for PenThePet

PenThePet is a browser-based daily logic puzzle game. Vanilla HTML, CSS, and JavaScript — no frameworks, no build tools, deployed on GitHub Pages.

## Hard Rules

- **No frameworks or libraries** (no React, Vue, jQuery, lodash, etc.)
- **No build tools** (no webpack, rollup, vite — code runs directly in browser)
- **No new runtime dependencies** (dev dependencies like Jest/ESLint are fine)
- **Use `CONSTANTS`/`CONFIG`** from `constants.js`/`config.js` — never hardcode values
- **Follow existing patterns** — look at similar code before writing new code
- **Run `npm test` after changes** — all tests must pass, coverage must stay above thresholds

## Validation

```bash
npm test                    # Jest tests with coverage (must pass)
npm run lint:fix            # ESLint auto-fix
npm run lint:python:fix     # Ruff auto-fix for Python
npm run lint:markdown:fix   # markdownlint auto-fix
```

Tests live in `test/webapp/` (browser components) and `test/generation/` (map generation). Run subsets with `npm run test:webapp` or `npm run test:generation`.

## Architecture

**Browser code** (`js/`): Loads maps from `maps/YYYY.json`, renders the game, checks if pet is penned. No map generation or solving in the browser.

**Generation scripts** (`scripts/`): Offline Node.js scripts that generate maps using a Python MILP solver (PuLP + CBC). Goal = **MAXIMUM** penned area — not minimum.

**Script loading order** in `index.html` must not change:
constants.js → config.js → tileTypes.js → CookieUtils.js → DateUtils.js → PathfindingUtils.js → Grid.js → Game.js → Menu.js → main.js

## Map Generation

Maps are pre-generated offline in `maps/YYYY.json`. Wall budget = `floor(size × 0.75)`. All maps validated by `MapValidator`. No fallbacks — generation throws on failure. See [docs/MAP_GENERATION.md](../docs/MAP_GENERATION.md) for full details.

## Documentation

- [docs/CODE_STRUCTURE.md](../docs/CODE_STRUCTURE.md) — File purposes and code organization
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — Design decisions and philosophy
- [docs/TESTING.md](../docs/TESTING.md) — Testing guide
- [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md) — Dev setup, workflow, CI/CD
- [docs/MAP_GENERATION.md](../docs/MAP_GENERATION.md) — Generation algorithm and solver details

Keep docs in sync when making code changes.
