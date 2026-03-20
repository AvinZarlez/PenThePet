# Art Assets

All game art assets are stored in the `assets/` folder at the project root. These are SVG files used as tile backgrounds and overlays in the game grid.

## Asset Inventory

### Base Tile Backgrounds

These SVGs are applied as the CSS `background-image` of each grid cell (first entry in a tile's `assets` list).

| Asset               | File                              | Size     | Usage                                                                                                                                       |
| ------------------- | --------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Grass               | `assets/grass.svg`                | 50×50 px | Default ground tile. Repeating green grass texture with blade details. Displayed for all walkable grass cells.                              |
| Penned              | `assets/penned.svg`               | 50×50 px | Penned area base. Yellow-tinted grass texture indicating tiles the pet can access when enclosed. Replaces `grass.svg` inside the penned area. |
| Water               | `assets/water.svg`                | 50×50 px | Water obstacle tile. Blue lake water texture with wave highlights. Cannot be clicked or traversed.                                          |
| Wall                | `assets/wall.svg`                 | 50×50 px | Player-placed wall tile. Wooden fence texture with plank and post details. Shown when a player clicks a grass tile.                         |
| Hole (empty)        | `assets/hole-empty.svg`           | 50×50 px | Unfilled hole tile. Dark circular pit that blocks movement. Player can fill it by clicking (costs one wall).                                |
| Hole (filled)       | `assets/hole-filled.svg`          | 50×50 px | Filled hole tile. Brown earth patch shown after a player fills a hole. Acts like grass — walkable and scoreable.                            |
| Hole (filled+penned)| `assets/hole-filled-penned.svg`   | 50×50 px | Filled hole tile inside the penned area. Yellow-tinted variant of the filled hole shown when enclosed.                                      |

### Tile Overlays

These SVGs are rendered as `<img>` elements stacked on top of the base background (subsequent entries in a tile's `assets` list).

| Asset               | File                              | Size     | Usage                                                                                                                                       |
| ------------------- | --------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Home                | `assets/home.svg`                 | 50×50 px | Pet's home tile overlay. Dog house artwork rendered on top of grass or penned base. The chosen pet emoji is displayed centered on top.      |
| Star                | `assets/star.svg`                 | 50×50 px | Star tile overlay. Gold star icon rendered on top of grass. Star tiles score 3 points instead of 1 when inside the penned area.             |
| Star outline        | `assets/star-outline.svg`         | 50×50 px | Dark silhouette behind the star. Rendered between the grass base and `star.svg` to make the star stand out against the background.          |
| Bee                 | `assets/bee.svg`                  | 50×50 px | Bee tile overlay. Bee icon rendered on top of grass. Bee tiles subtract 3 points when inside the penned area.                               |
| Bee outline         | `assets/bee-outline.svg`          | 50×50 px | Dark silhouette behind the bee. Rendered between the grass base and `bee.svg` to make the bee stand out against the background.             |
| Shore               | `assets/shore.svg`                | 50×50 px | Water-edge overlay. Sandy shore strip (top ~16 px, fading to transparent) added to water tiles whose top neighbor is not water. Rotated to face each non-water neighbor. |

### Directional Overlay

| Asset | File              | Size     | Usage                                                                                                                                                                      |
| ----- | ----------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Paw   | `assets/paw.svg`  | 30×30 px | Escape path indicator. Paw print icon overlaid on each tile along the pet's escape route. Rotated in code to face the direction the pet walks toward the grid edge.        |

### App Icons

These are not rendered in the game grid. They are used for the browser tab and web-app icon.

| Asset   | File                  | Size       | Usage                                         |
| ------- | --------------------- | ---------- | --------------------------------------------- |
| Icon    | `assets/icon.svg`     | 100×100 px | Web-app icon (`<link rel="apple-touch-icon">`)|
| Favicon | `assets/favicon.svg`  | 32×32 px   | Browser tab icon (`<link rel="icon">`)        |

## Design Guidelines

- **Style**: Cartoony, hand-drawn look fitting an indie puzzle game aesthetic.
- **Format**: SVG for crisp rendering at any display size. Tiles scale via CSS `background-size: cover`.
- **Palette**: Natural tones — greens for grass, blues for water, browns for wood/walls, yellows for penned highlights.
- **Repeating**: Grass, water, and penned textures are designed to tile seamlessly when placed in adjacent grid cells.
- **Home tile**: The home SVG is mostly a dark interior with a thin doghouse frame and small roof peak. The pet emoji is displayed large and centered on top, dominating the tile.
- **Hole files**: All three hole-related assets are prefixed `hole-` so they sort together in the `assets/` directory.

## How Assets Are Used

### Tile Backgrounds

Each tile type defined in `js/tiles/tileData.js` has an `assets` property — an ordered list of SVG filenames. The first entry is the base background; subsequent entries are overlays rendered as `<img>` elements. Cell backgrounds are set inline from `TILE_DATA` assets in `Game._createCellElement()` (via `GameAnimationsMixin`) — no CSS background rules are needed per tile type.

When a tile is inside the penned area, the `enclosedAssets` list (if defined) is used instead of `assets`. For example:

| Tile        | Normal assets                                      | Enclosed assets (`enclosedAssets`)                    |
| ----------- | -------------------------------------------------- | ----------------------------------------------------- |
| Grass       | `['grass.svg']`                                    | `['penned.svg']`                                      |
| Home        | `['grass.svg', 'home.svg']`                        | `['penned.svg', 'home.svg']`                          |
| Star        | `['grass.svg', 'star-outline.svg', 'star.svg']`    | `['penned.svg', 'star-outline.svg', 'star.svg']`      |
| Bee         | `['grass.svg', 'bee-outline.svg', 'bee.svg']`      | `['penned.svg', 'bee-outline.svg', 'bee.svg']`        |
| Hole (filled)| `['hole-filled.svg']`                             | `['hole-filled-penned.svg']`                          |

### Paw Overlay

The paw icon is rendered as an `<img>` element (class `paw-overlay`) absolutely positioned inside each path cell. The `Game._createCellElement()` method calculates a rotation angle based on the direction the pet needs to walk:

- **0°** — facing up
- **90°** — facing right
- **180°** — facing down
- **270°** — facing left

Custom paw overlays can be defined per tile via the `pawOverlay` property in `TILE_DATA`. Tiles with `pawOverlay: []` suppress the paw (e.g. water, wall, home, hole).

### Shore Overlay

Water tiles that have a non-water neighbor receive a `shore.svg` overlay rotated to face that neighbor (one `<img>` per edge). This creates a sandy border effect at the water's edge.

### Home Tile

The home cell uses layered assets: `['grass.svg', 'home.svg']` — grass as the base and the dog house on top. When enclosed, it switches to `['penned.svg', 'home.svg']` so the grass base turns yellow. The user's selected pet emoji is rendered as text content centered on the cell, appearing inside the doorway of the dog house.

### Hole Tiles

The hole tile (`hole-empty.svg`) blocks movement and can be filled by the player (costs one wall). When filled, it switches to `hole-filled.svg` (or `hole-filled-penned.svg` when inside the penned area). Clicking a filled hole removes the fill and returns the wall budget.

## Replacing Assets

To replace any asset with custom artwork:

1. Create a new SVG (or PNG/JPEG) at the sizes listed above.
2. Place it in the `assets/` folder with the same filename.
3. No code changes needed — the JS references files by path from `TILE_DATA` assets lists.
4. For non-SVG formats, update the file extension in `js/tiles/tileData.js`.

---

**See also:** [docs/README.md](README.md) · [TILE_SYSTEM.md](TILE_SYSTEM.md) · [CODE_STRUCTURE.md](CODE_STRUCTURE.md)
