# css/

This folder contains all CSS styling for the game, split into focused files by logical area.

## Files

- `base.css` — global reset, body, container, typography, generic buttons, footer, error message, and responsive media queries
- `game.css` — game board controls (map info, wall counter, area size, penned status), solution toggle bar, notification toast, grid and cell styles, roaming area viewer sidebar, and debug section
- `modals.css` — modal overlay backdrop, fade/slide animations, shared modal content container, close button, and section typography
- `menu.css` — menu modal option buttons, level selector and calendar view, cloud sync status bar, and auth form

All four files are linked individually in `index.html` for parallel loading. No build tools or preprocessors are used — the CSS is loaded directly in the browser.

## Documentation

For an overview of what each CSS file controls and how styling fits into the overall code structure, see **[../docs/CODE_STRUCTURE.md](../docs/CODE_STRUCTURE.md)**.
