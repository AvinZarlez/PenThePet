# Art Assets

All game art assets are stored in the `assets/` folder at the project root. These are SVG files used as tile backgrounds and overlays in the game grid.

## Asset Inventory

| Asset | File | Size | Usage |
|-------|------|------|-------|
| Grass | `assets/grass.svg` | 50×50 px | Default ground tile. Repeating green grass texture with blade details. Displayed for all walkable grass cells. |
| Water | `assets/water.svg` | 50×50 px | Water obstacle tile. Blue lake water texture with wave highlights. Cannot be clicked or traversed. Works as both a repeating and standalone texture. |
| Wall | `assets/wall.svg` | 50×50 px | Player-placed wall tile. Wooden fence texture with plank and post details. Shown when player clicks a grass tile. |
| Home | `assets/home.svg` | 50×50 px | Pet's home tile. Dog house artwork on a grass background. Has a dark doorway area in the center sized for the user's chosen pet emoji to be displayed on top. |
| Penned | `assets/penned.svg` | 50×50 px | Penned area tile. Yellow-tinted grass texture indicating tiles the pet can access when enclosed. Applied to grass tiles within the penned area. |
| Paw | `assets/paw.svg` | 30×30 px | Escape path indicator. Custom paw print icon overlaid on each tile along the pet's escape route. Rotated in code to face the direction the pet walks toward the grid edge. |

## Design Guidelines

- **Style**: Cartoony, hand-drawn look fitting an indie puzzle game aesthetic.
- **Format**: SVG for crisp rendering at any display size. Tiles scale via CSS `background-size: cover`.
- **Palette**: Natural tones — greens for grass, blues for water, browns for wood/walls, yellows for penned highlights.
- **Repeating**: Grass, water, and penned textures are designed to tile seamlessly when placed in adjacent grid cells.
- **Home tile**: The home SVG is mostly a dark interior with a thin doghouse frame and small roof peak. The pet emoji is displayed large and centered on top, dominating the tile.

## How Assets Are Used

### Tile Backgrounds

Each tile type defined in `js/tileTypes.js` has an `image` property pointing to its SVG file. The CSS in `css/game.css` applies these as `background-image` using `center/cover` sizing:

```css
.cell.grass {
    background: url('../assets/grass.svg') center/cover no-repeat;
}
```

A CSS gradient fallback is retained in `tileTypes.js` via the `gradient` property for contexts where images may not load.

### Paw Overlay

The paw icon is rendered as an `<img>` element (class `paw-overlay`) absolutely positioned inside each path cell. The `Game._createCellElement()` method calculates a rotation angle based on the direction the pet needs to walk:

- **0°** — facing up
- **90°** — facing right
- **180°** — facing down
- **270°** — facing left

### Home Tile

The home cell uses `assets/home.svg` as its background image (a dog house). The user's selected pet emoji is rendered as text content centered on the cell, appearing inside the doorway of the dog house.

## Replacing Assets

To replace any asset with custom artwork:

1. Create a new SVG (or PNG/JPEG) at the sizes listed above.
2. Place it in the `assets/` folder with the same filename.
3. No code changes needed — the CSS and JS reference files by path.
4. For non-SVG formats, update the file extension in `css/game.css` and `js/tileTypes.js`.
