# Debugging and Testing Branches

How to run tests locally, use VSCode launch configurations, and check GitHub Actions results.

## Running Tests Locally

```bash
# Install dependencies (first time only)
npm install

# Run all tests with coverage
npm test

# Run only browser-side (webapp) tests
npm run test:webapp

# Run only generation tests
npm run test:generation

# Watch mode — re-runs on file changes
npm run test:watch

# Run a specific test file
npx jest test/webapp/Grid.test.js

# Lint JavaScript / Python / Markdown
npm run lint:fix
npm run lint:python:fix
npm run lint:markdown:fix
```

## Starting the Game Locally

```bash
python3 -m http.server 8080
# Then open http://localhost:8080
```

## VSCode Launch Configurations

Open the **Run and Debug** panel (`Ctrl+Shift+D` / `Cmd+Shift+D`) and pick from the dropdown:

| Configuration | What it does |
|---|---|
| **Start in web browser** | Starts the HTTP server and opens your default browser at `http://localhost:8080` |
| **Jest: Run All Tests** | Runs all tests with coverage |
| **Jest: Run Webapp Tests** | Runs only `test/webapp/` tests |
| **Jest: Run Generation Tests** | Runs only `test/generation/` tests |
| **Jest: Run Current Test File** | Runs the currently open test file |
| **Run Map Generation Script** | Generates 5 maps at sizes 7 and 9 |

> **Tip:** "Start in web browser" starts the HTTP server automatically via the `Start HTTP Server` task, then opens `http://localhost:8080` in your default browser using `open` (macOS/Safari) or `xdg-open` (Linux).

VSCode tasks (via `Ctrl+Shift+P` → "Run Task") mirror most of these for test and lint workflows.

## GitHub Actions (CI)

Tests and linting run automatically on every push and pull request. To check results:

1. Go to the **Actions** tab of the repository
2. Click the **Test** or **Lint** workflow run
3. Expand job steps to see pass/fail details and coverage output

Relevant workflows:

- `.github/workflows/test.yml` — Jest tests + Codecov coverage
- `.github/workflows/lint.yml` — ESLint, ruff, markdownlint

To trigger a run manually: **Actions** → select workflow → **Run workflow**.

## Debugging in the Browser

```javascript
// Open browser console (F12) while game is running
window.game              // Main game instance
window.game.grid         // Grid object
window.game.grid.tiles   // Current tile layout
window.game.render()     // Force re-render
```

---

**Related:** [TESTING.md](TESTING.md) · [DEVELOPMENT.md](DEVELOPMENT.md)
