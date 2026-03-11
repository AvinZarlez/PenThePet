# Raster Asset Migration Analysis

**Date:** 2026-03-11
**Author:** Copilot
**Status:** Recommendation + Code Changes Applied

---

## Overview

This report evaluates replacing the current SVG art assets with raster (pixel-based) images. It covers format selection, tile-size math, asset-dimension recommendations, required code changes, and the centering behavior of differently-sized overlay images.

---

## 1. File Format: PNG vs JPG

**Recommendation: PNG for all assets.**

| Criterion | PNG | JPG |
|-----------|-----|-----|
| Transparency / alpha channel | ✅ Full support | ❌ Not supported |
| Lossless quality | ✅ Yes | ❌ No (lossy artefacts) |
| Small flat-art compression | ✅ Very efficient | ⚠️ Depends on content |
| Browser support | ✅ Universal | ✅ Universal |

JPG is ruled out by a single hard constraint: **transparency is required by the overlay layer system.** Every overlay image (star, bee, paw, home, star-outline, bee-outline, shore, hole-empty) must have transparent areas so the background tile beneath it shows through. JPG cannot encode an alpha channel.

PNG with a limited colour palette (the cartoony, flat-art style used here) compresses very well via `DEFLATE` — expected sizes are roughly comparable to or smaller than the equivalent quality-adjusted JPG for the same artwork.

**Use PNG for every asset, including the fully-opaque base tiles**, to keep a single consistent format and avoid format-switching logic in the codebase.

> **WebP note:** WebP supports lossless + alpha and compresses better than PNG, but requires updating the asset-detection regex in Game.js (which is done as part of this report — see §4). WebP is a valid future option for asset authors who want smaller file sizes.

---

## 2. Maximum Tile Size — 4K Monitor, 7×7 Grid

Cell size is calculated dynamically in `Game.calculateCellSize()`:

```javascript
// Game.js
calculateCellSize() {
    const availableWidth = window.innerWidth * 0.90;
    const totalGap = this.calculateCellGap() * (this.grid.size - 1);
    const totalPadding = this.GRID_PADDING * 2;
    const maxCellSize = Math.floor(
        (availableWidth - totalPadding - totalGap) / this.grid.size
    );
    return Math.max(this.MIN_CELL_SIZE, Math.min(this.MAX_CELL_SIZE, maxCellSize));
}
```

Constants in play (`js/constants.js`):

| Constant | Value | Meaning |
|----------|-------|---------|
| `CONSTANTS.CELL.MAX_SIZE` | **50 px** | Hard cap on cell size |
| `CONSTANTS.CELL.MIN_SIZE` | 6 px | Minimum cell size |
| `CONSTANTS.CELL.GAP` | 3 px | Gap between cells |
| `CONSTANTS.GRID_PADDING` | 6 px | Outer grid padding (each side) |

### Calculation for a 7×7 grid on a 4K monitor (3840 px wide, DPR = 1)

```
availableWidth  = 3840 × 0.90         = 3456 px
totalGap        = 3 × (7 − 1)         = 18 px
totalPadding    = 6 × 2               = 12 px
rawCellSize     = ⌊(3456 − 12 − 18) / 7⌋ = ⌊489.4⌋ = 489 px
appliedCellSize = min(489, MAX_SIZE=50) = 50 px  ← cap is hit
```

**On every screen size that can be considered "full screen" — including 4K — the cell size is capped at 50 CSS pixels.** The 4K viewport is more than large enough to hit this cap; the ceiling is not the screen but the `MAX_CELL_SIZE` constant.

### Total grid dimensions (7×7 at max cell size)

```
gridWidth  = 7 × 50 + 6 × 3 + 2 × 6 = 350 + 18 + 12 = 380 CSS px
gridHeight = 380 CSS px  (square grid)
```

The 380 × 380 px grid occupies **9.9% of the 3840 px screen width** and **17.6% of the 2160 px height** — a small fraction of the available 4K real estate, purely because of the `MAX_CELL_SIZE` cap.

### Physical pixel dimensions by device pixel ratio (DPR)

Browsers report `window.innerWidth` in CSS pixels. The actual physical pixels rendered are `CSS pixels × DPR`.

| DPR | Typical device | Cell (physical) | Grid (physical) | Grid area |
|-----|---------------|-----------------|-----------------|-----------|
| 1× | Standard 1080p/4K desktop | 50 × 50 px | 380 × 380 px | 144 400 px² |
| 2× | Retina Mac, most 4K displays at 200% scaling | 100 × 100 px | 760 × 760 px | 577 600 px² |
| 3× | High-end Android phones | 150 × 150 px | 1 140 × 1 140 px | 1 299 600 px² |

### Overlay and paw sizes (from CSS)

The two overlay classes define the rendered size as a percentage of the cell:

| CSS class | `width` / `height` | Physical (DPR 1×) | Physical (DPR 2×) |
|-----------|--------------------|-------------------|-------------------|
| `.tile-overlay` | 70% of cell | 35 × 35 px | 70 × 70 px |
| `.paw-overlay` | 60% of cell | 30 × 30 px | 60 × 60 px |

---

## 3. Recommended Asset Dimensions

### Single-resolution recommendation: **128 × 128 px PNG**

| Scenario | Physical pixels rendered | Source → display ratio |
|----------|--------------------------|------------------------|
| DPR 1×, cell 50 px | 50 × 50 px | 128 → 50 (downscale × 2.56) |
| DPR 2×, cell 50 px CSS | 100 × 100 px | 128 → 100 (downscale × 1.28) |
| DPR 3×, cell 50 px CSS | 150 × 150 px | 128 → 150 (~17% upscale, acceptable) |

128 px sits at a standard power-of-2 texture size, downscales sharply on 1× displays, is near-perfect on Retina 2× displays, and only has minor upscaling on 3× devices.

### Future-proofing consideration

If `CONSTANTS.CELL.MAX_SIZE` is ever raised (e.g., to 150 px), the table changes:

| DPR | Physical cell | Source → display ratio (128 px) | Source → display ratio (256 px) |
|-----|--------------|--------------------------------|--------------------------------|
| 2× | 300 × 300 px | **128 → 300 (2.3× upscale — noticeably blurry)** | 256 → 300 (~17% upscale) |

**Recommendation for future-proofing: use 256 × 256 px PNG** if there is any expectation that `MAX_CELL_SIZE` will grow beyond 100 px.

### Should you maintain multiple resolution versions?

**No, for the current constraint (≤50 px cells) this is unnecessary overhead.** Responsive image loading (e.g., `<img srcset>`) adds build complexity for zero visible benefit when the cell is always ≤50 CSS pixels.

If the game ever moves toward a zoomed/expanded board view, revisit with a 2-size strategy (e.g., `tile@1x.png` at 128 px and `tile@2x.png` at 256 px) paired with `srcset` in the `<img>` creation code.

### Paw overlay exception

The paw image is rendered at 60% of the cell (30 CSS px / 60 physical px at 2×). **64 × 64 px PNG** is sufficient for the paw specifically. 128 px is also fine if you prefer a single standard size.

### File-size estimate

| Source format | ~Expected size |
|---------------|---------------|
| Current SVG (grass, water, wall) | 1–4 KB |
| 128 × 128 PNG (flat art, 8-bit palette) | 4–15 KB |
| 256 × 256 PNG (flat art) | 12–50 KB |

Gzip compression (used by GitHub Pages) will further reduce transfer sizes. For 16 assets at 128 × 128, total uncompressed payload is roughly 100–200 KB — well within acceptable web budgets.

---

## 4. Code Changes Required to Use Raster Images

### Change A — `js/Game.js`: extend image-file-type detection

The rendering code in `_createCellElement()` and `_addPawOverlays()` uses `asset.endsWith('.svg')` to decide whether to create an `<img>` element or treat the value as an emoji/text string:

```javascript
// BEFORE (only SVG is treated as an image)
if (asset.endsWith('.svg')) {
    const overlay = document.createElement('img');
    …
} else {
    // Treated as emoji text — PNG/JPG/WebP would land here incorrectly
}
```

This check must be broadened to cover all common image-file extensions. **This change has been applied:**

```javascript
// AFTER (any image extension is treated as an image)
if (/\.(svg|png|jpe?g|webp|gif)$/i.test(asset)) {
    const overlay = document.createElement('img');
    …
} else {
    // Only non-file-extension values (emoji, plain text) reach here
}
```

The same fix was applied in both `_createCellElement()` (tile overlays) and `_addPawOverlays()` (paw indicator).

**Without this fix**, placing a PNG filename like `star.png` in `tileData.js` would cause the string `"star.png"` to be rendered as visible text inside the cell rather than as an image.

### Change B — `css/game.css`: add `object-fit: contain` to overlay classes

With raster images, setting both `width` and `height` to a percentage forces the image to stretch to that exact box, which **distorts non-square source images**. SVGs avoid this because they are inherently scalable vector graphics that don't have a fixed pixel aspect ratio.

Adding `object-fit: contain` makes the image scale proportionally within its box (no stretching) while staying centered. **This change has been applied to two selectors:**

```css
/* BEFORE */
.cell .tile-overlay {
    …
    width: 70%;
    height: 70%;
    transform: translate(-50%, -50%);
}

/* AFTER */
.cell .tile-overlay {
    …
    width: 70%;
    height: 70%;
    transform: translate(-50%, -50%);
    object-fit: contain;   /* ← added */
}
```

```css
/* BEFORE */
.cell .paw-overlay {
    …
    width: 60%;
    height: 60%;
}

/* AFTER */
.cell .paw-overlay {
    …
    width: 60%;
    height: 60%;
    object-fit: contain;   /* ← added */
}
```

### Change C — `js/tileData.js`: update file extensions (asset author's responsibility)

When replacing an SVG with a PNG, **only the file extension in the `assets` / `enclosedAssets` arrays needs to change**. Example:

```javascript
// BEFORE
grass: {
    assets: ['grass.svg'],
    enclosedAssets: ['penned.svg'],
    …
}

// AFTER
grass: {
    assets: ['grass.png'],
    enclosedAssets: ['penned.png'],
    …
}
```

No other logic changes are needed in `tileData.js`.

### Change D — Shore overlay hardcode in `Game._addShoreOverlays()`

The shore overlay is hardcoded in Game.js and does **not** flow through `tileData.js`:

```javascript
// Game.js line ~167 — hardcoded SVG path
shore.src = 'assets/shore.svg';
```

To switch the shore to a PNG, this one line must be updated manually:

```javascript
shore.src = 'assets/shore.png';
```

Alternatively, a `shoreAsset` property could be added to `TILE_DATA.water` to make this data-driven, but that refactor is optional.

### Summary of changes

| Location | Change | Status |
|----------|--------|--------|
| `js/Game.js` — `_createCellElement()` | Extend `.svg`-only check to regex covering PNG/JPG/WebP/GIF | ✅ Applied |
| `js/Game.js` — `_addPawOverlays()` | Same regex fix | ✅ Applied |
| `css/game.css` — `.tile-overlay` | Add `object-fit: contain` | ✅ Applied |
| `css/game.css` — `.paw-overlay` | Add `object-fit: contain` | ✅ Applied |
| `js/tileData.js` — asset arrays | Change `.svg` extensions to `.png` | ⏳ Asset-author step |
| `js/Game.js` — `_addShoreOverlays()` | Update hardcoded `shore.svg` path | ⏳ Asset-author step |
| `assets/` folder | Place PNG files alongside or replacing SVGs | ⏳ Asset-author step |

---

## 5. Centering Behavior with Different-Sized Images

### Question

If the bee-outline image is a larger PNG than the bee image, will they render correctly centered on top of each other? Is it a requirement that all overlay images be the same pixel dimensions?

### Answer: No, same pixel dimensions are NOT required.

Both overlay images are positioned using the same CSS:

```css
.cell .tile-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 70%;
    height: 70%;
    transform: translate(-50%, -50%);
    object-fit: contain;
}
```

The key is `top: 50%; left: 50%; transform: translate(-50%, -50%)`. This sequence:

1. Places the **top-left corner** of the element at the cell's exact center (50% / 50%).
2. Shifts the element **back by half its own rendered size** (`-50%` of its own width and height).

The result: **every element using `.tile-overlay` has its visual center pinned to the cell center**, regardless of the element's rendered dimensions or the source image's natural pixel size.

When `bee-outline.png` (say, 100 × 100 px source) and `bee.png` (say, 50 × 50 px source) are both rendered in the same 70% × 70% CSS box with `object-fit: contain`:
- Both boxes are the same CSS size (70% × 70% of cell).
- Both boxes are centered at the same point (the cell center).
- `object-fit: contain` ensures neither is stretched or distorted.
- The two images are visually centered on each other.

### What was needed

Before the `object-fit: contain` fix (Change B above), a non-square raster image would have been **stretched** to fill the 70% × 70% box, appearing distorted. Centering still worked, but the shape of the image would be wrong.

With `object-fit: contain` applied, images of **any pixel dimensions and any aspect ratio** will:
- Remain undistorted (scale proportionally within the box).
- Be centered at the cell center relative to every other overlay.

The only practical constraint: all overlay images should have approximately the same intended subject size relative to the cell. An outline that is visually 10× larger than the filled icon would look wrong even if centered perfectly — but that is an art direction concern, not a code one.

---

## See Also

- [ART_ASSETS.md](../ART_ASSETS.md) — Asset inventory, sizes, design guidelines, and replacement instructions
- [TILE_SYSTEM.md](../TILE_SYSTEM.md) — Tile data system and how `assets` arrays are consumed
- [CODE_STRUCTURE.md](../CODE_STRUCTURE.md) — Full code file reference
