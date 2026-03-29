# Art Assets

SVG files in `assets/` are used as tile backgrounds and overlays. Grass and water visuals are **generated programmatically** by `js/tiles/TileSvgs.js` — no static SVG files exist for those tile types.

## Programmatic SVGs (Grass and Water)

`js/tiles/TileSvgs.js` generates SVG data URIs at runtime for grass and water tiles. There are no `grass.svg`, `penned.svg`, or `water.svg` files in `assets/`.

- **Grass** — a solid-color base layer plus one of three blade-pattern variant overlays. Palette: `GRASS_PALETTE` (green) or `GRASS_PENNED_PALETTE` (amber) when inside the penned area.
- **Water** — a solid-color base layer plus one of two wave-pattern variant overlays. Palette: `WATER_PALETTE` (navy/blue).
- Tiles that sit on a grass background (home, star, bee) use the same grass base layer via `backgroundGroup: 'grass'` in their tile data.

To retheme grass or water, edit the palette constants at the top of `TileSvgs.js`. Every tile using those palettes updates automatically.

## Static Asset Inventory

### Tile Backgrounds

| File                     | Size     | Usage                                                       |
| ------------------------ | -------- | ----------------------------------------------------------- |
| `wall.png`               | 50×50 px | Player-placed wall. Wooden fence texture.                   |
| `hole-empty.png`         | 50×50 px | Unfilled hole. Dark pit that blocks movement.               |
| `hole-filled.png`        | 50×50 px | Filled hole. Brown earth patch; walkable and scoreable.     |
| `hole-filled-penned.png` | 50×50 px | Filled hole inside the penned area. Amber-tinted variant.   |

### Tile Overlays

These are rendered as `<img>` elements stacked on top of the base background.

| File               | Size     | Usage                                                                                               |
| ------------------ | -------- | --------------------------------------------------------------------------------------------------- |
| `home.png`         | 50×50 px | Dog house rendered on top of the grass base. Pet emoji centered on top.                             |
| `star-outline.svg` | 50×50 px | Dark silhouette behind the star, for contrast.                                                      |
| `star.svg`         | 50×50 px | Star icon. Scores +3 points when penned.                                                            |
| `beehive.png`  | 50×50 px | Dark silhouette behind the bee, for contrast.                                                       |
| `bee.png`          | 50×50 px | Bee icon. Scores −3 points when penned.                                                             |
| `shore.svg`        | 50×50 px | Sandy shore strip added to each water-edge side that faces a non-water tile. Rotated per direction. |
| `shore-corner.svg` | 50×50 px | Quarter-circle shore piece for inner corners where two adjacent sides of a water tile face land.    |

### Directional Overlay

| File      | Size     | Usage                                                                                              |
| --------- | -------- | -------------------------------------------------------------------------------------------------- |
| `paw.svg` | 30×30 px | Escape path indicator. Overlaid on each tile along the pet's escape route, rotated toward the edge. |

### App Icons

| File          | Size       | Usage                                          |
| ------------- | ---------- | ---------------------------------------------- |
| `icon.svg`    | 100×100 px | Web-app icon (`<link rel="apple-touch-icon">`) |
| `favicon.svg` | 32×32 px   | Browser tab icon (`<link rel="icon">`)         |

## How Rendering Works

`GameAnimationsMixin._createCellElement()` in `js/game/GameAnimations.js` builds each grid cell:

1. **Base layer** — `TileSvgs.getTileBaseUri(tileName, isPenned)` returns a data URI for grass/water/grass-background tiles. For other tiles (wall, hole), the `baseLayer` asset file in `TILE_DATA` is used directly.
2. **Variant overlay** — For grass and water, one variant SVG from `TileSvgs.getTileVariantUri` is overlaid on top. The variant index is deterministic (`(row × 13 + col × 7) % numVariants`) so cells render consistently.
3. **Extra overlays** — Static `<img>` elements from the `assets` list in `TILE_DATA` (e.g. `home.png`, `star.svg`).
4. **Shore overlays** — Water tiles receive `shore.svg` (one per land-facing side) and `shore-corner.svg` (one per inner corner where two adjacent sides face land).
5. **Penned state** — For grass/water/grass-background tiles, the base and variant SVGs are regenerated with the penned palette. For other tiles, `enclosedAssets` in `TILE_DATA` provides an alternate asset list.

### Tile Rendering Summary

| Tile          | Rendering                                                                         |
| ------------- | --------------------------------------------------------------------------------- |
| Grass         | TileSvgs base (green/amber) + TileSvgs variant overlay                            |
| Water         | TileSvgs base (navy) + TileSvgs variant overlay + shore/corner overlays per edge  |
| Home          | TileSvgs grass base + `home.png` overlay + pet emoji                              |
| Star          | TileSvgs grass base + `star-outline.svg` + `star.svg`                             |
| Bee           | TileSvgs grass base + `beehive.png` + `bee.png`                               |
| Wall          | `wall.png` background                                                             |
| Hole (empty)  | `hole-empty.png` background                                                       |
| Hole (filled) | `hole-filled.png` (or `hole-filled-penned.png` when penned)                       |

## Replacing Assets

1. Create a replacement SVG at the same size listed above.
2. Place it in `assets/` with the same filename — no code changes needed.

To replace grass or water visuals, edit the palette constants or SVG generator functions in `js/tiles/TileSvgs.js`.

---

**See also:** [docs/README.md](README.md) · [TILE_SYSTEM.md](TILE_SYSTEM.md) · [CODE_STRUCTURE.md](CODE_STRUCTURE.md)
