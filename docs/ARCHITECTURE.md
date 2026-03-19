# Architecture and Design Decisions

## Design Philosophy

**Core principle:** Vanilla JavaScript only — no frameworks, no build tools, no transpilation.

- No React/Vue/Angular, no webpack/rollup/vite, no TypeScript, no SASS, no lodash/jQuery
- Anyone with basic JS knowledge can contribute; no build step means instant browser refresh; push to GitHub Pages and it deploys

## Technology Choices

**Vanilla JS (ES6+):** Modern browsers support ES6+ natively. Classes, arrow functions, and destructuring provide clean patterns without compilation.

**No Build Tools:** Script loading order managed in HTML; deployment is static file hosting.

**Module Pattern:** CommonJS (`module.exports` / `require()`) works in both browser (global scope via script order) and Node.js (Jest tests). Dual-mode files check for `module.exports` existence.

**CSS Architecture:** Four files with single responsibility — `base.css` (reset/layout/typography), `game.css` (grid/cells/controls), `modals.css` (shared modal system), `menu.css` (menu/level selector/cloud sync). BEM-like naming, CSS variables for theming, responsive queries at end of each file.

**Configuration:** All constants in `js/constants.js`; derived config in `js/config.js`. Never hardcode values.

## Code Organization

**Layers:**

1. **Data** (`Grid.js`) — grid state and tile management
2. **Logic** (`PathfindingUtils.js`, `ScoreCalculator.js`) — BFS pathfinding, penning checks, and score calculation
3. **Controller** (`Game.js` + mixins) — coordinates data and UI, checks win condition
   - `GameTimer.js` — generic pause/resume/lock timer mixin applied to `Game.prototype`
   - `ScoreCalculator.js` — pure scoring function; replace to change scoring rules for a different game variant
4. **View** (`index.html`, `css/`) — user interface
5. **Generation** (`scripts/`) — offline map generation, not loaded in browser

See [CODE_STRUCTURE.md](CODE_STRUCTURE.md) for the full file listing.

## Algorithm Design

**Map Generation (MILP):** Maps are pre-generated offline using a Python MILP solver (PuLP + CBC). The solver maximizes enclosed area subject to the wall budget. Result is provably optimal — not a heuristic. See [MAP_GENERATION.md](MAP_GENERATION.md).

**Pathfinding (BFS):** Pet reachability uses BFS — simple, correct, and fast on grids up to 17×17.

## Performance

| Metric                   | Target | Status |
| ------------------------ | ------ | ------ |
| Page load                | <100ms | ✅     |
| Map load (pre-generated) | <50ms  | ✅     |
| BFS on max grid (17×17)  | <10ms  | ✅     |
| Tests (full suite)       | <10s   | ✅     |

## Extensibility

**New tile types:** Add one entry to `js/tileData.js` — all rendering, generation, scoring, pathfinding, solver, and player instructions update automatically. See [TILE_SYSTEM.md](TILE_SYSTEM.md).

**New game modes / scoring variants:** Extend or fork `Game.js`. Replace `js/ScoreCalculator.js` to implement different scoring rules without touching the game controller. The generic timer (pause/resume/lock) in `js/GameTimer.js` can be reused unchanged.

## Localization (i18n)

All user-facing strings live in **`js/i18n.js`**. No visible text is hardcoded in `index.html` or JS.

- **HTML** elements that contain text use `data-i18n="key"` attributes (or `data-i18n-html` for HTML content, `data-i18n-title` for tooltips, `data-i18n-aria` for aria-labels, `data-i18n-placeholder` for inputs). Their content is initially empty and filled by `I18N._applyToDOM()` on startup.
- **JS** code calls `I18N.t('key', { param: value })` everywhere a string is needed.
- Language preference is stored in the `lang` cookie and synced to cloud (with other settings) so it follows the user across devices.
- To add a new language: add a language code block to `LANGUAGES` in `i18n.js` (keys missing from the new language fall back to `en`) and add an entry to `LANGUAGE_OPTIONS`.

See [CODE_STRUCTURE.md — Localization](CODE_STRUCTURE.md#-localization) for details.

---

**See also:** [docs/README.md](README.md) · [CODE_STRUCTURE.md](CODE_STRUCTURE.md) · [MAP_GENERATION.md](MAP_GENERATION.md) · [TILE_SYSTEM.md](TILE_SYSTEM.md)
