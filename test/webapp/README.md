# test/webapp/

This folder contains Jest tests for the browser-side JavaScript modules.

## What belongs here

- Tests for modules in `js/` that can be exercised in a Node.js/jsdom environment
- Any new test files for browser utilities, game logic, or UI components

## Test files

| File | What it tests |
|------|---------------|
| `constants.test.js` | `CONSTANTS` validation (32 tests) |
| `wordList.test.js` | Word list and `getRandomWord()` (30 tests) |
| `PathfindingUtils.test.js` | BFS pathfinding algorithms (30 tests) |
| `Grid.test.js` | Grid state management (34 tests) |
| `Menu.test.js` | Menu system (44 tests) |
| `CookieUtils.test.js` | Cookie utilities (13 tests) |
| `DateUtils.test.js` | Date utilities (6 tests) |

Run these tests with:

```bash
npm run test:webapp
```

## Documentation

For the full testing guide, see **[../../docs/TESTING.md](../../docs/TESTING.md)**.
