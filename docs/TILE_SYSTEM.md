# Tile System

The tile system is the foundation of PenThePet's game mechanics. All tile types are defined in `js/tileData.js` — the **single source of truth** for game logic, rendering, map generation, solving, and player-facing instructions.

## Adding a New Tile Type

To add a new tile, add a single entry to `js/tileData.js`:

1. Edit `js/tileData.js` (the single source of truth):

```javascript
myTile: {
    score: 2,
    wallPlaceable: false,
    clickable: false,
    blocksMovement: false,
    chance: 0.10,
    compactChar: 'm',
    numericId: 6,
    cssClass: 'my-tile',
    descriptionKey: 'my_tile_description',
    assets: ['my-tile.svg'],
    ariaLabel: (row, col) => `My tile at row ${row + 1}, column ${col + 1}.`,
},
```

1. Add a `my_tile_description` key to `js/i18n.js` under `LANGUAGES.en` with the player-facing description text.
1. Add the SVG asset to `assets/` and a CSS rule for cursor/hover behavior.

That's it — all derived lookup tables, rendering, generation, pathfinding, scoring,
player instructions, and the Python solver read from `js/tileData.js` automatically.

## Tile Properties Reference

| Property         | Type     | Required | Description                                                                  |
| ---------------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `score`          | number   | ✅       | Points when inside penned area (grass=1, star=3, water=0)                    |
| `wallPlaceable`  | boolean  | ✅       | Whether player can place/remove walls on this tile                           |
| `clickable`      | boolean  | ✅       | Whether clicking the tile does anything                                      |
| `blocksMovement` | boolean  | ✅       | Whether tile blocks pet pathfinding                                          |
| `chance`         | number   | ✅       | Probability (0.00–1.00) for map generation. 0 = not randomly placed          |
| `compactChar`    | string   | ✅       | Single character for compact map format                                      |
| `numericId`      | number   | ✅       | Numeric value for solver map format                                          |
| `cssClass`       | string   | ✅       | CSS class applied to the cell element                                        |
| `descriptionKey` | string   | ❌       | `i18n.js` key for player-facing description shown in the instructions modal  |
| `assets`         | string[] | ✅       | Ordered list of visual layers (SVGs as `<img>`, text/emoji as `<span>`)      |
| `ariaLabel`      | function | ✅       | Function `(row, col) => string` for screen reader labels                     |
| `enclosedAssets` | string[] | ❌       | Alternate asset list when tile is inside penned area. Falls back to `assets` |
| `pawOverlay`     | string[] | ❌       | Escape-path overlay. Undefined = default `['paw.svg']`, `[]` = none          |
| `emoji`          | boolean  | ❌       | Pet Emoji shown on tile                                                      |

## Current Tile Types

| Tile        | Score | Wall Placeable | Blocks Movement | Generation Chance  |
| ----------- | ----- | -------------- | --------------- | ------------------ |
| Grass       | 1     | ✅             | ❌              | 65%                |
| Water       | 0     | ❌             | ✅              | 30%                |
| Star        | 3     | ❌             | ❌              | 5%                 |
| Bee         | -3    | ❌             | ❌              | 3%                 |
| Hole        | 0     | ✅             | ✅              | 3%                 |
| Filled Hole | 1     | ❌             | ❌              | Wall-placed only   |
| Home        | 1     | ❌             | ❌              | Placed at center   |
| Wall        | 0     | ❌             | ✅              | Player-placed only |

### Fillable Tiles

Fillable tiles are tiles with both `blocksMovement: true` and `wallPlaceable: true`. When a wall is placed on a fillable tile, it transforms into the tile specified by `wallTransformsTo` (e.g. hole → filledHole). The transformed tile has `wallState: true`, allowing the player to click it again to revert it to its original tile type.

This mechanic is generic — new fillable tile types can be added by setting `blocksMovement`, `wallPlaceable`, and `wallTransformsTo` in `TILE_DATA`. The game logic (`handleCellClick`) and utility functions (`isFillableTile`, `isWallState`, `getWallTransform`) handle the rest automatically.

## Architecture

### Data Flow

```text
js/tileData.js (single source of truth)
    ├── Game.js         — scoring (getTileScore), click handling (isWallPlaceable),
    │                     rendering (_createCellElement reads assets/enclosedAssets/pawOverlay)
    ├── PathfindingUtils — scoring (NUMERIC_ID_TO_SCORE), movement (BLOCKING_NUMERIC_IDS)
    ├── Grid.js         — compact map parsing (COMPACT_CHAR_TO_TILE)
    ├── MapGenerator.js — tile distribution (chance), numeric conversion (TILE_TO_NUMERIC)
    ├── MILPSolver.js   — numeric↔string conversion (NUMERIC_TO_TILE)
    ├── Menu.js         — wall placement checks (isWallPlaceable),
    │                     instructions rendering (descriptionKey → I18N.t())
    ├── main.js         — wall placement checks (isWallPlaceable)
    ├── tileTypes.js    — compatibility wrapper (builds TILE_TYPES from TILE_DATA)
    └── solve.py        — reads tileData.js via Node.js subprocess
```

### Derived Lookup Tables

Built once at load time from `TILE_DATA`:

- `COMPACT_CHAR_TO_TILE` — compact character → tile name
- `TILE_TO_COMPACT_CHAR` — tile name → compact character
- `NUMERIC_ID_TO_SCORE` — numericId → score
- `TILE_TO_NUMERIC` — tile name → numericId
- `NUMERIC_TO_TILE` — numericId → tile name
- `BLOCKING_NUMERIC_IDS` — Set of numericIds that block movement
- `BLOCKING_TILES` — Set of tile names that block movement

### Utility Functions

- `isWallPlaceable(tileName)` — can a wall be placed on this tile?
- `getTileScore(tileName)` — score for a tile by name
- `getNumericTileScore(numericId)` — score for a tile by numeric ID
- `isBlockingTile(tileName)` — does this tile block movement?
- `isBlockingNumericId(numericId)` — does this numeric ID block movement?
- `getEligibleTileTypes()` — tile names with `chance > 0`
- `getTileType(typeName)` — get full tile data by name (falls back to grass)
- `isTileClickable(typeName)` — is this tile clickable?
- `getTileAssets(tileName, isEnclosed)` — get asset list (uses `enclosedAssets` when penned)
- `getPawOverlay(tileName)` — get paw overlay asset list

## Player Instructions

The instructions modal's Gameplay section is **automatically generated** from `TILE_DATA`. Each tile with a `descriptionKey` property is rendered as a row showing the tile's icon (from `assets`) and its description text (looked up from `i18n.js`). Adding a `descriptionKey` to a new tile (and a matching entry in `i18n.js`) automatically includes it in the player instructions — no HTML changes needed.

---

**See also:** [docs/README.md](README.md) · [ART_ASSETS.md](ART_ASSETS.md) · [MAP_GENERATION.md](MAP_GENERATION.md) · [CODE_STRUCTURE.md](CODE_STRUCTURE.md)
