# Development Guide

## Getting Started

**Prerequisites:** Node.js 20+, Python 3, Git, web browser, text editor

```bash
git clone https://github.com/AvinZarlez/PenThePet.git
cd PenThePet
npm install                    # dev dependencies (testing/linting)
python3 -m http.server 8080   # start local server
# open http://localhost:8080
```

## Development Workflow

1. Start local server (`python3 -m http.server 8080`)
2. Edit files → hard refresh browser (`Cmd/Ctrl+Shift+R`) — no build step
3. Run `npm test` before committing
4. Commit small, focused changes

## Coding Standards

**JavaScript:** ES6+ — `const`/`let`, arrow functions, template literals, destructuring, classes. Naming: `UPPER_SNAKE_CASE` for constants, `PascalCase` for classes, `camelCase` for functions/variables, `_camelCase` for private methods.

**Code order:** imports → constants → class (public methods first, private last) → exports.

**CSS:** BEM-like naming, CSS variables for theming, responsive queries at end of file. Global styles first, then layout, then components, then states, then responsive.

**HTML:** Semantic tags (`<header>`, `<main>`, `<footer>`), ARIA labels on interactive elements, `alt` text on images. Structure only — no inline styles or scripts.

## Common Tasks

### Add a New Tile Type

See [TILE_SYSTEM.md](TILE_SYSTEM.md). In short: add one entry to `js/tiles/tileData.js` and an SVG asset — everything else is automatic.

### Add or Edit a User-Facing String

All strings live in `js/common/i18n.js` under `LANGUAGES.en`. To change visible text:

1. Find or add the key in `LANGUAGES.en`.
2. In HTML, reference it via `data-i18n="key"` (leave the element content empty).
3. In JavaScript, call `I18N.t('key', { param: value })`.

To add a new language, copy the `en` block, translate the values, and add an entry to `LANGUAGE_OPTIONS`. Missing keys fall back to English automatically.

> **Rule:** No English text should ever appear as HTML text content or as a JavaScript string literal in the game code. If you can read it in the source, it must come from `i18n.js`.

### Generate New Daily Maps

```bash
pip install -r scripts/solver/requirements.txt
node scripts/generate-map.js --size 9               # single map
node scripts/generate-map.js --size 7-17 --count 5  # 5 maps, random sizes
node scripts/generate-map.js --fresh --count 10 --date 2026-03-01 --size 9
```

### Keyboard Controls

| Key | Action |
| ----------- | ----------------------------------------- |
| Arrow keys | Navigate between grid cells |
| Enter | Place or remove a wall on the focused cell |
| Spacebar | Pause or resume the game timer |

Spacebar has no effect when a menu modal is open.

### Load a Specific Level via URL Parameters

You can deep-link directly to any puzzle by appending a query string to the page URL.

**By date:** `<game-url>/?date=2026-03-15`

**By level number (day number):** `<game-url>/?level=42`

**To always load today's level (ignores saved level cookies):** `<game-url>/?level=latest`

- If both `date` and `level` are provided in the same URL, `date` takes priority and `level` is ignored.
- `?level=latest` always loads today's puzzle, overriding any saved level in cookies.
- Loading via URL parameter does **not** update the "first visit of the day" cookie, so the next normal visit will still open today's puzzle as usual.
- If the requested level is in the future, does not exist, or is malformed, a red error banner explains the problem and the latest available level loads instead.

### Change a Config Value

Edit `js/config/constants.js`, regenerate maps if needed (`--fresh`), run `npm test`.

## Debugging

**Browser console:**

```javascript
window.game; // Game instance
window.game.grid.tiles; // Current tile layout
window.game.render(); // Force re-render
```

Use DevTools (F12) → Sources to set breakpoints. Check Network tab for 404s on map files.

**Debug Mode (game testers only):** Controlled by Firebase UID list in `game-testers.json`. UIDs are assigned by Firebase, cannot be changed by users, and are safe to commit publicly. To add a tester: get their UID from Firebase Console → Authentication → Users, add to `game-testers.json`, commit and push.

## CI/CD and Automation

### GitHub Actions Workflows

**`lint.yml`** — Runs ESLint (JS), ruff (Python), markdownlint (Markdown), yamllint (YAML). A `Lint` gate job always reports a result so the required status check never stalls.

**`test.yml`** — Runs Jest webapp and generation tests in parallel, then a full coverage run with Codecov upload. A `Test` gate job always reports a result.

**`generate-daily-map.yml`** — Triggered manually via `workflow_dispatch`. Generates maps with the Python MILP solver, validates quality, and opens a PR against `main`.

**`static.yml`** — Deploys to GitHub Pages on push to `main`.

> Gate jobs prevent "Expected — Waiting for status to be reported" blocks: they always fire on every PR, while sub-jobs are conditional on which files changed.

### Branch Protection (main)

`main` requires a PR with 1 approval (Code Owner @AvinZarlez), passing `Lint` and `Test` status checks, and no force-pushes. See repository Settings → Branches for details.

### Dependabot

Monitors npm packages weekly. GitHub Actions monitoring is intentionally disabled — it causes network errors and ~2-minute delays in Copilot agent environments.

## Deployment

Push to `main` → `static.yml` deploys automatically to [avinzarlez.github.io/penthepet](https://avinzarlez.github.io/penthepet/).

Use **relative paths** in HTML (`js/main.js` not `/js/main.js`) — absolute paths break on GitHub Pages subpaths.

## Troubleshooting

| Problem                             | Fix                                                                     |
| ----------------------------------- | ----------------------------------------------------------------------- |
| Module not found in tests           | `rm -rf node_modules && npm install`                                    |
| Game loads locally but not on Pages | Check for absolute paths, case-sensitive filenames, committed map files |
| Tests timeout                       | Use smaller maps in tests (`size = 5`); set `jest.setTimeout(30000)`    |
| Coverage below threshold            | Run `npm test -- --coverage`, find uncovered lines, add tests           |
| ESLint errors                       | `npm run lint:fix`                                                      |
| Map generation fails                | Check Python/PuLP install; verify tile distribution sums to ~1.0        |

## VS Code Setup

Pre-configured in `.vscode/` — launch configs for running/debugging tests, tasks for lint workflows, and recommended extensions (ESLint, Ruff, markdownlint, Jest). Press F5 to debug tests; right-click HTML → Open with Live Server.

### JavaScript Linting in VS Code

When you open the project, VS Code will prompt you to install the recommended extensions. Accept the prompt, or install them manually via the Extensions panel (`Ctrl+Shift+X` / `Cmd+Shift+X`) and search for:

- **ESLint** (`dbaeumer.vscode-eslint`) — shows ESLint errors and warnings inline as you type and fixes them on save.

Once installed, ESLint runs automatically. Errors appear as red underlines and warnings as yellow underlines directly in the editor. The Problems panel (`Ctrl+Shift+M` / `Cmd+Shift+M`) lists all issues in the workspace.

**To lint or auto-fix from the terminal:**

```bash
npm run lint        # check all JS files for errors
npm run lint:fix    # auto-fix all fixable issues
```

**To lint from within VS Code**, use the built-in tasks (`Terminal → Run Task`):

- **Lint JavaScript** — runs `npm run lint` and shows output in the terminal panel.
- **Fix JavaScript Lint Issues** — runs `npm run lint:fix` and applies all auto-fixable changes.

---

**See also:** [docs/README.md](README.md) · [TESTING.md](TESTING.md) · [DEBUGGING_BRANCHES.md](DEBUGGING_BRANCHES.md) · [MAP_GENERATION.md](MAP_GENERATION.md) · [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
