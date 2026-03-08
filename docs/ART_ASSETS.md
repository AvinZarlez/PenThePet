# Art Assets

All game art assets are stored in the `assets/` folder at the project root. These are SVG files used as tile backgrounds and overlays in the game grid.

## Asset Inventory

| Asset  | File                | Size     | Usage                                                                                                                                                                      |
| ------ | ------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Grass  | `assets/grass.svg`  | 50×50 px | Default ground tile. Repeating green grass texture with blade details. Displayed for all walkable grass cells.                                                             |
| Water  | `assets/water.svg`  | 50×50 px | Water obstacle tile. Blue lake water texture with wave highlights. Cannot be clicked or traversed. Works as both a repeating and standalone texture.                       |
| Wall   | `assets/wall.svg`   | 50×50 px | Player-placed wall tile. Wooden fence texture with plank and post details. Shown when player clicks a grass tile.                                                          |
| Home   | `assets/home.svg`   | 50×50 px | Pet's home tile overlay. Dog house artwork rendered on top of grass. Has a dark doorway area in the center sized for the user's chosen pet emoji to be displayed on top.   |
| Penned | `assets/penned.svg` | 50×50 px | Penned area tile. Yellow-tinted grass texture indicating tiles the pet can access when enclosed. Applied to grass tiles within the penned area.                            |
| Star   | `assets/star.svg`   | 50×50 px | Star tile overlay. Gold star icon rendered on top of grass. Star tiles score 3 points instead of 1 when inside the penned area.                                            |
| Bee    | `assets/bee.svg`    | 50×50 px | Bee tile overlay. Bee icon rendered on top of grass. Bee tiles subtract 3 points when inside the penned area.                                                              |
| Paw    | `assets/paw.svg`    | 30×30 px | Escape path indicator. Custom paw print icon overlaid on each tile along the pet's escape route. Rotated in code to face the direction the pet walks toward the grid edge. |

## Design Guidelines

- **Style**: Cartoony, hand-drawn look fitting an indie puzzle game aesthetic.
- **Format**: SVG for crisp rendering at any display size. Tiles scale via CSS `background-size: cover`.
- **Palette**: Natural tones — greens for grass, blues for water, browns for wood/walls, yellows for penned highlights.
- **Repeating**: Grass, water, and penned textures are designed to tile seamlessly when placed in adjacent grid cells.
- **Home tile**: The home SVG is mostly a dark interior with a thin doghouse frame and small roof peak. The pet emoji is displayed large and centered on top, dominating the tile.

## How Assets Are Used

### Tile Backgrounds

Each tile type defined in `js/tileData.js` has an `assets` property — an ordered list of SVG filenames. The first entry is the base background; subsequent entries are overlays. Cell backgrounds are set inline from `TILE_DATA` assets in `Game._createCellElement()` — no CSS background rules are needed per tile type.

When a tile is inside the penned area, the `enclosedAssets` list (if defined) is used instead of `assets`. For example, grass uses `['penned.svg']` when enclosed, while star uses `['penned.svg', 'star.svg']`.

### Paw Overlay

The paw icon is rendered as an `<img>` element (class `paw-overlay`) absolutely positioned inside each path cell. The `Game._createCellElement()` method calculates a rotation angle based on the direction the pet needs to walk:

- **0°** — facing up
- **90°** — facing right
- **180°** — facing down
- **270°** — facing left

Custom paw overlays can be defined per tile via the `pawOverlay` property in `TILE_DATA`.

### Home Tile

The home cell uses layered assets: `['grass.svg', 'home.svg']` — grass as the base and the dog house on top. When enclosed, it switches to `['penned.svg', 'home.svg']` so the grass base turns yellow. The user's selected pet emoji is rendered as text content centered on the cell, appearing inside the doorway of the dog house.

## Replacing Assets

To replace any asset with custom artwork:

1. Create a new SVG (or PNG/JPEG) at the sizes listed above.
2. Place it in the `assets/` folder with the same filename.
3. No code changes needed — the JS references files by path from `TILE_DATA` assets lists.
4. For non-SVG formats, update the file extension in `js/tileData.js`.

---

**See also:** [docs/README.md](README.md) · [TILE_SYSTEM.md](TILE_SYSTEM.md) · [CODE_STRUCTURE.md](CODE_STRUCTURE.md)
