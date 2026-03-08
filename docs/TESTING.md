# Testing Guide

## Overview

- **Jest 30.x** — testing framework with jsdom for DOM simulation
- **ESLint 10.x** — JavaScript linting
- **ruff** — Python linting
- **markdownlint-cli2** — Markdown linting
- **GitHub Actions** — CI on every push/PR

Tests live in `test/webapp/` (browser components) and `test/generation/` (map generation).

**Coverage targets:** Branches 70%, Functions 75%, Lines/Statements 70%.

## Running Tests

```bash
npm test                              # all tests with coverage
npm run test:webapp                   # browser-side tests only
npm run test:generation               # generation tests only
npm run test:watch                    # watch mode
npx jest test/webapp/Grid.test.js     # single file
npx jest -t "test name"              # tests matching pattern

npm run lint:fix                      # JS linting
npm run lint:python:fix               # Python linting
npm run lint:markdown:fix             # Markdown linting
```

## Test Files

### Webapp Tests (`test/webapp/`)

| File                       | What it tests                                                |
| -------------------------- | ------------------------------------------------------------ |
| `constants.test.js`        | CONSTANTS values, types, tile distribution sums              |
| `wordList.test.js`         | Word list non-empty, no duplicates, helper functions         |
| `PathfindingUtils.test.js` | `isPenned()`, `calculatePennedArea()`, edge cases            |
| `Grid.test.js`             | Constructor, map loading, state management, tile get/set     |
| `Menu.test.js`             | Modal open/close, cookie persistence, level loading, options |
| `CookieUtils.test.js`      | Read/write cookies, emoji/JSON values, name collisions       |
| `DateUtils.test.js`        | ISO date formatting, display formatting                      |

### Generation Tests (`test/generation/`)

| File                    | What it tests                                                              |
| ----------------------- | -------------------------------------------------------------------------- |
| `MapGenerator.test.js`  | Map size/structure, path validation, solver, retry logic                   |
| `MapValidator.test.js`  | Quality validation rules                                                   |
| `generate-maps.test.js` | `validateMapsDatabase`, `fixMapsDatabase`, `getNextDayNumber`              |
| `generate-map.test.js`  | `parseSizeInput`, `getRandomSize`, `incrementDate`, `getNextAvailableDate` |

### Excluded from Coverage

`js/main.js`, `js/Game.js`, `js/config.js`, `js/tileTypes.js` — UI/config files tested manually in browser.

## Writing Tests

Use Jest's `describe`/`test` pattern with Arrange-Act-Assert:

```javascript
describe("MyFunction", () => {
  test("should handle basic case", () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

**Best practices:** One concept per test, descriptive names, no shared state between tests, `beforeEach`/`afterEach` for setup/teardown, mock external dependencies.

**When to add tests:** new features, bug fixes (add a test that would have caught it), coverage below 70%.

## CI/CD

Tests and linting run automatically on every push and PR via two GitHub Actions workflows:

- **`lint.yml`** — ESLint, ruff, markdownlint, yamllint; gate job always reports `Lint` status
- **`test.yml`** — Jest webapp + generation tests in parallel, then full coverage with Codecov upload; gate job always reports `Test` status

Sub-jobs are conditional on which files changed; gate jobs always run to prevent "Expected — Waiting" PR blocks.

## Debugging Tests

```bash
node --inspect-brk node_modules/.bin/jest --runInBand   # debug with Node
```

Common issues:

- **Intermittent failures:** check for shared state or non-determinism
- **Timeouts:** check for infinite loops, missing async/await, or use smaller maps (`size = 5`)
- **Coverage not increasing:** run `npm test -- --coverage`, add tests for uncovered paths

---

**See also:** [docs/README.md](README.md) · [DEVELOPMENT.md](DEVELOPMENT.md) · [DEBUGGING_BRANCHES.md](DEBUGGING_BRANCHES.md)
