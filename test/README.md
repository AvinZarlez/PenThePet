# PenThePet Test Suite

For full documentation, see **[../docs/TESTING.md](../docs/TESTING.md)**.

## Quick Reference

```bash
npm test                              # all tests with coverage
npm run test:webapp                   # browser-side tests only
npm run test:generation               # generation tests only
npm run test:watch                    # watch mode
npx jest test/webapp/game/Grid.test.js     # single file
npm run lint:all                      # lint JS, Python, Markdown
```

## Test Files

**Webapp Tests** (`test/webapp/`):
`constants.test.js` · `wordList.test.js` · `PathfindingUtils.test.js` · `Grid.test.js` · `Menu.test.js` · `CookieUtils.test.js` · `DateUtils.test.js`

**Generation Tests** (`test/generation/`):
`MapGenerator.test.js` · `MapValidator.test.js` · `generate-maps.test.js` · `generate-map.test.js`

**Setup:** `setup.js` — Jest configuration, global mocks, and module loading
