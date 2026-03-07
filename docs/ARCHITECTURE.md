# Architecture and Design Decisions

## Design Philosophy

**Core principle:** Vanilla JavaScript only — no frameworks, no build tools, no transpilation.

- No React/Vue/Angular, no webpack/rollup/vite, no TypeScript, no SASS, no lodash/jQuery
- Anyone with basic JS knowledge can contribute; no build step means instant browser refresh; push to GitHub Pages and it deploys

## Technology Choices

**Vanilla JS (ES6+):** Modern browsers support ES6+ natively. Classes, arrow functions, and destructuring provide clean patterns without compilation.

**No Build Tools:** Game is small (<10 JS files); script loading order managed in HTML; deployment is static file hosting.

**Module Pattern:** CommonJS (`module.exports` / `require()`) works in both browser (global scope via script order) and Node.js (Jest tests). Dual-mode files check for `module.exports` existence.

**CSS Architecture:** Four files with single responsibility — `base.css` (reset/layout/typography), `game.css` (grid/cells/controls), `modals.css` (shared modal system), `menu.css` (menu/level selector/cloud sync). BEM-like naming, CSS variables for theming, responsive queries at end of each file.

**Configuration:** All constants in `js/constants.js`; derived config in `js/config.js`. Never hardcode values.

## Code Organization

**Layers:**

1. **Data** (`Grid.js`) — grid state and tile management
2. **Logic** (`PathfindingUtils.js`) — BFS pathfinding and penning checks
3. **Controller** (`Game.js`) — coordinates data and UI, checks win condition
4. **View** (`index.html`, `css/`) — user interface
5. **Generation** (`scripts/`) — offline map generation, not loaded in browser

See [CODE_STRUCTURE.md](CODE_STRUCTURE.md) for the full file listing.

## Algorithm Design

**Map Generation (MILP):** Maps are pre-generated offline using a Python MILP solver (PuLP + CBC). The solver maximizes enclosed area subject to the wall budget. Result is provably optimal — not a heuristic. See [MAP_GENERATION.md](MAP_GENERATION.md).

**Pathfinding (BFS):** Pet reachability uses BFS — simple, correct, and fast on grids up to 17×17.

## Performance

| Metric | Target | Status |
|---|---|---|
| Page load | <100ms | ✅ |
| Map load (pre-generated) | <50ms | ✅ |
| BFS on max grid (17×17) | <10ms | ✅ |
| Tests (full suite) | <10s | ✅ |

## Extensibility

**New tile types:** Add one entry to `js/tileData.js` — all rendering, generation, scoring, pathfinding, solver, and player instructions update automatically. See [TILE_SYSTEM.md](TILE_SYSTEM.md).

**New game modes:** Extend the `Game` class. Timer, undo/redo, and hint infrastructure already exists.

---

**See also:** [docs/README.md](README.md) · [CODE_STRUCTURE.md](CODE_STRUCTURE.md) · [MAP_GENERATION.md](MAP_GENERATION.md) · [TILE_SYSTEM.md](TILE_SYSTEM.md)
