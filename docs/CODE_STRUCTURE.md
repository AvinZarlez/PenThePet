# Pen the Pet - Code Structure

## 📁 Project Structure

```text
PenThePet/
├── index.html              # Main HTML (structure only — no inline styles/scripts)
├── assets/                 # SVG tile images and paw icon
├── css/
│   ├── base.css            # Design tokens (:root CSS variables), global reset, container, typography, buttons, footer, responsive
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
│   ├── i18n.js             # Localization — all user-facing strings; I18N.t(key, params)
│   ├── DateUtils.js        # getTodayDate() / formatDate(dateStr)
│   ├── PathfindingUtils.js # BFS pathfinding: isPenned, calculatePennedArea, hasPathToEdge
│   ├── MapGenerator.js     # Map generation (Node.js only — NOT loaded in browser)
│   ├── MapValidator.js     # Map quality validation (Node.js only — NOT loaded in browser)
│   ├── Grid.js             # Grid state management; parseCompactMap / parseCompactSolution
│   ├── ScoreCalculator.js  # Pure score-calculation functions; swap this to change scoring rules
│   ├── GameTimer.js        # Generic timer mixin: pause/resume/lock; applied to Game.prototype
│   ├── Game.js             # Game controller: rendering, clicks, wall placement, penning detection
│   ├── Menu.js             # Menu system: modals, level selector, options, cookie persistence
│   ├── firebase-config.js  # Firebase config (empty = cloud sync disabled)
│   ├── CloudMigration.js   # Versioned schema migration for cloud submission data
│   ├── CloudSync.js        # Optional cloud sync (Firebase Auth + Firestore)
│   ├── Analytics.js        # Optional Firebase Analytics (anonymous events, no PII)
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
`constants.js → config.js → tileData.js → tileTypes.js → CookieUtils.js → i18n.js → DateUtils.js → PathfindingUtils.js → Grid.js → firebase-config.js → CloudMigration.js → CloudSync.js → Analytics.js → ScoreCalculator.js → GameTimer.js → Game.js → Menu.js → main.js`

## 🎯 Key File Notes

**`js/tileData.js`** — The single source of truth for all tile types. All rendering, generation, scoring, pathfinding, solver, and player instructions derive from it. To add a tile: add one entry here plus an SVG asset. See [TILE_SYSTEM.md](TILE_SYSTEM.md).

**`js/i18n.js`** — The single source of truth for **all user-facing text**. Every string displayed to the user lives here under a language code key (e.g. `en`). No visible text should appear anywhere in `index.html` HTML attributes or content — it must come from `i18n.js` via `data-i18n` attributes or `I18N.t()` calls in JS. See the [Localization](#-localization) section below.

**`js/Grid.js`** — Loads maps from `maps/YYYY.json` only. Exports `parseCompactMap()` and `parseCompactSolution()` for decoding the compact map format.

**`js/ScoreCalculator.js`** — Pure `calculateAreaScore(tiles, getTile, scoreFn)` function. Replace or extend this file to implement custom scoring for different game types without touching `Game.js`.

**`js/GameTimer.js`** — Generic mixin (`GameTimerMixin`) for pause/resume/lock timer functionality. Applied to `Game.prototype` at load time. Reusable across any web game that needs the same timer behaviour.

**`js/Game.js`** — Game controller: rendering, clicks, wall placement, penning detection, hints, submission, and sharing. Timer methods come from `GameTimerMixin`; scoring delegates to `ScoreCalculator`. Does NOT generate maps. Access via `window.game` in console.

**`js/MapGenerator.js` / `js/MapValidator.js`** — Node.js only, not loaded in browser.

**`scripts/generate-map.js`** — Supports `--date YYYY-MM-DD`, `--size N` or `--size N-M`, `--count N`, `--fresh`.

## 🍪 Cookies

All cookie operations go through `CookieUtils`. Currently stored:

| Cookie                  | Purpose                                                                                                                     | Set By            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `selectedPet`           | Chosen animal emoji                                                                                                         | Menu.js           |
| `hintsDisabled`         | Whether hints are disabled                                                                                                  | Menu.js           |
| `neverShowTarget`       | Whether target score is never revealed                                                                                      | Menu.js           |
| `lang`                  | UI language preference (e.g. `en`)                                                                                          | i18n.js / main.js |
| `currentLevel`          | Selected puzzle date                                                                                                        | Menu.js           |
| `debugMode`             | Debug tools visibility                                                                                                      | Menu.js           |
| `submission_YYYY-MM-DD` | All level data: score, walls, time, and `hintsUsed` (v1.1+). May exist before formal submission with hints only (no score). | Game.js           |

All cookies expire after 1 year, path `/`, SameSite `Lax`.

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for the Firestore mapping and schema versioning details.

## 🌐 Localization

All user-facing strings live in **`js/i18n.js`** — the single source of truth for text. **No visible text should be hardcoded** in `index.html` or JS files.

### How strings are applied

**HTML elements** — add a `data-i18n="key"` attribute (or `data-i18n-html` for HTML content):

```html
<!-- Text content replaced by JS on load -->
<h2 data-i18n="menu_title"></h2>
<p data-i18n-html="about_description_1"></p>
```

**JavaScript** — call `I18N.t('key', params)`:

```js
// Simple key lookup
counterElement.textContent = I18N.t("walls_counter", {
  wallCount: 3,
  maxWalls: 9,
});
// → "3 / 9"
```

### Adding a new string

1. Open `js/i18n.js` and add your key to the `en` block in the relevant section.
2. Use `{paramName}` placeholders for dynamic values.
3. Reference it in HTML via `data-i18n="your_key"` or in JS via `I18N.t('your_key', params)`.

### Adding a new language

First, in `js/i18n.js`, copy the `en` object and add it under a new language code:

```js
const LANGUAGES = {
    en: { status_unsolved: 'Unsolved', ... },
    es: { status_unsolved: 'Sin resolver', ... }, // new language
};
```

Then add an entry to `LANGUAGE_OPTIONS`:

```js
const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" }, // new option
];
```

Strings missing from the new language automatically fall back to `en`.

### Tile descriptions

Tile descriptions use `descriptionKey` in `tileData.js` (e.g. `descriptionKey: 'tile_bee_description'`) which references a key in `i18n.js`. This keeps tile logic and user-visible text cleanly separated.

## 🔧 How to Extend

- **New tile type:** Add one entry to `js/tileData.js` + SVG asset. See [TILE_SYSTEM.md](TILE_SYSTEM.md).
- **New menu option / game mode:** Extend `Menu` or `Game` class.
- **New preference:** `CookieUtils.setCookie('key', value, 365)` / `CookieUtils.getCookie('key')`
- **New string / translation:** Add a key to `js/i18n.js` → `LANGUAGES.en`. To add a new language, copy the `en` block, translate, add to `LANGUAGE_OPTIONS`.
- **New CSS:** tile cursor/hover → `css/game.css`; new modal → `css/modals.css` or `css/menu.css`
- **Retheme colours:** All colour and sizing design tokens are CSS custom properties in the `:root` block at the top of `css/base.css`. Changing those variables updates the entire game UI.
- **Configuration changes:** Edit `js/constants.js` first, then `js/config.js` if needed

## 📦 Deployment

No build step — push to `main` and GitHub Pages deploys automatically. Use relative paths only (`js/main.js` not `/js/main.js`).

---

**See also:** [docs/README.md](README.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [TILE_SYSTEM.md](TILE_SYSTEM.md) · [MAP_GENERATION.md](MAP_GENERATION.md) · [TESTING.md](TESTING.md)
