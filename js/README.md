# js/

This folder contains all browser-side JavaScript for the game. Files are loaded directly in `index.html` — no build step required.

## What belongs here

- Browser JavaScript modules (constants, config, utilities, game logic, UI)
- Files must be plain ES5/ES6 compatible with no imports/exports (globals only)

## Script loading order

The order in `index.html` is fixed and must not change:

```text
constants.js → config.js → tileTypes.js → CookieUtils.js → DateUtils.js →
PathfindingUtils.js → Grid.js → Game.js → Menu.js → main.js
```

`MapGenerator.js` and `MapValidator.js` also live here but are **only** used by the offline Node.js generation scripts — they are not loaded in the browser.

## Documentation

For a description of every file and how they connect, see **[../docs/CODE_STRUCTURE.md](../docs/CODE_STRUCTURE.md)**.
