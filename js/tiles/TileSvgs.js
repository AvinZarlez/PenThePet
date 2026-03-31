/**
 * TileSvgs.js — Dynamic SVG tile generators with swappable color palettes.
 *
 * Grass, water, and tiles that sit on a grass background (home, star, bee) have
 * their visuals defined here as JavaScript functions that accept a color palette
 * object.  Callers never load a static .svg file for these tiles; instead they
 * call getTileBaseUri / getTileVariantUri which return a ready-to-use data: URI.
 *
 * ─── HOW TO RETHEME ───────────────────────────────────────────────────────────
 * Edit ONE of the palette constants below.  One JS constant = one color.
 * No SVG files need to change; every tile that uses this palette will update
 * automatically.
 */

// ─── Grass color palettes ────────────────────────────────────────────────────

/**
 * Normal (unpenned) grass palette.
 * Base is the brightest tone; strokes are darker so blades read clearly
 * against the vivid green background.
 */
const GRASS_PALETTE = {
    /** Bright mid-green fill — always the base-layer background. */
    base:    '#00A300',
    /** Dark green — stroke color. */
    stroke: '#008000',
};

/**
 * Penned grass palette — golden / amber tones that match the penned-state
 * visual theme used throughout the game.
 */
const GRASS_PENNED_PALETTE = {
    base:    '#FFCC00',
    stroke: '#D1A700',
};

// ─── Water color palette ─────────────────────────────────────────────────────

/**
 * Water palette.  Dynamic recolouring is not yet implemented for water, but the
 * palette is defined here so it can be wired up in future with a single change.
 */
const WATER_PALETTE = {
    /** Deep navy fill — base-layer background. */
    base:    '#0d47a1',
    /** Medium blue — primary wave stroke. */
    stroke1: '#1e88c8',
    /** Lighter blue — secondary wave stroke. */
    stroke2: '#2a9fd4',
    /** Pale blue — accent wave stroke. */
    stroke3: '#4ab8e0',
};

// ─── SVG utility ──────────────────────────────────────────────────────────────

/**
 * Encode an SVG string as a data: URI usable in an <img src> or CSS
 * background-image value.
 * @param {string} svg
 * @returns {string}
 */
function svgToDataUri(svg) {
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

// ─── Grass base layer ─────────────────────────────────────────────────────────

function _getGrassBaseSvg(p) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"><rect width="50" height="50" fill="${p.base}"/></svg>`;
}

// ─── Grass variant 1 — dense rows of short tufts ─────────────────────────────

function _getGrassVariant1Svg(p) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
  <g opacity="0.5">
  <path d="M10 48 Q10 44 9 41" stroke="${p.stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M22 48 Q23 43 21 40" stroke="${p.stroke}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M34 48 Q34 44 33 41" stroke="${p.stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M46 48 Q47 43 45 40" stroke="${p.stroke}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M1 35 Q1 31 0 28" stroke="${p.stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M13 35 Q14 30 12 27" stroke="${p.stroke}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M25 35 Q25 31 24 28" stroke="${p.stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M37 35 Q38 30 36 27" stroke="${p.stroke}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M49 35 Q49 31 48 28" stroke="${p.stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M12 22 Q12 18 11 15" stroke="${p.stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M27 22 Q28 17 26 14" stroke="${p.stroke}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M42 22 Q42 18 41 15" stroke="${p.stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M6 10 Q7 5 5 2" stroke="${p.stroke}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M24 10 Q24 6 23 3" stroke="${p.stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M42 10 Q43 5 41 2" stroke="${p.stroke}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;
}

// ─── Grass variant 2 — mixed-height scattered blades ─────────────────────────

function _getGrassVariant2Svg(p) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
  <g opacity="0.5">
  <path d="M44 50 Q45 46 43 42" stroke="${p.stroke}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M14 50 Q14 40 13 30" stroke="${p.stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M48 50 Q49 45 47 40" stroke="${p.stroke}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M5 40 Q5 32 4 24" stroke="${p.stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M23 38 Q24 28 22 18" stroke="${p.stroke}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M41 36 Q41 26 40 16" stroke="${p.stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M9 20 Q10 12 8 4" stroke="${p.stroke}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M27 20 Q27 11 26 2" stroke="${p.stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M45 26 Q46 16 44 6" stroke="${p.stroke}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;
}

// ─── Grass variant 3 — horizontal arcing blades ───────────────────────────────

function _getGrassVariant3Svg(p) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
  <g opacity="0.5">
  <path d="M20 47 Q28 43 36 47" stroke="${p.stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M0 36 Q8 32 16 36" stroke="${p.stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M36 33 Q44 29 52 33" stroke="${p.stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M10 21 Q18 17 26 21" stroke="${p.stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M38 24 Q44 20 50 24" stroke="${p.stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M14 9 Q22 5 30 9" stroke="${p.stroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;
}

// ─── Water base layer ─────────────────────────────────────────────────────────

function _getWaterBaseSvg(p) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"><rect width="50" height="50" fill="${p.base}"/></svg>`;
}

// ─── Water variant 1 — dense sinusoidal waves ─────────────────────────────────

function _getWaterVariant1Svg(p) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
  <g opacity="0.5">
  <path d="M0 6 Q6 2 12 6 Q18 10 24 6 Q30 2 36 6 Q42 10 50 6" stroke="${p.stroke1}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M0 13 Q7 9 14 13 Q21 17 28 13 Q35 9 42 13 Q47 16 50 13" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M0 20 Q6 16 12 20 Q18 24 24 20 Q30 16 36 20 Q43 24 50 20" stroke="${p.stroke3}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M0 27 Q7 23 14 27 Q21 31 28 27 Q35 23 42 27 Q47 30 50 27" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M0 34 Q6 30 12 34 Q18 38 24 34 Q30 30 36 34 Q43 38 50 34" stroke="${p.stroke2}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M0 41 Q7 37 14 41 Q21 45 28 41 Q35 37 42 41 Q47 44 50 41" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M0 48 Q8 44 16 48 Q24 52 32 48 Q40 44 50 48" stroke="${p.stroke1}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;
}

// ─── Water variant 2 — sweeping arc waves ──────────────────

function _getWaterVariant2Svg(p) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
  <g opacity="0.5">
  <path d="M0 8 Q12 2 25 8 Q38 14 50 8" stroke="${p.stroke1}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M0 18 Q12 12 25 18 Q38 24 50 18" stroke="${p.stroke2}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M0 28 Q12 22 25 28 Q38 34 50 28" stroke="${p.stroke3}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M0 38 Q12 32 25 38 Q38 44 50 38" stroke="${p.stroke1}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M0 48 Q12 42 25 48 Q38 54 50 48" stroke="${p.stroke2}" stroke-width="3" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;
}

// ─── Grass variant lookup ─────────────────────────────────────────────────────

const _GRASS_VARIANT_FNS = [
    _getGrassVariant1Svg,
    _getGrassVariant2Svg,
    _getGrassVariant3Svg,
];

const _WATER_VARIANT_FNS = [
    _getWaterVariant1Svg,
    _getWaterVariant2Svg,
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Set of tile names whose base layer is generated by TileSvgs.
 * Includes grass, water, and all tiles that render on a grass background.
 */
const TILE_SVGS_TILES = new Set(['grass', 'water', 'home', 'star', 'bee']);

/**
 * Create a tile icon element with all visual layers applied — the same
 * background, variant-overlay, and asset-overlay logic used by the game
 * cell renderer (_createCellElement in GameAnimations.js). Shore overlays,
 * paw overlays, accessibility attributes, and event listeners are NOT added;
 * those are game-specific.
 *
 * This is the shared rendering function used by both the game and the
 * instructions panel. Updating tileData.js (assets, backgroundGroup, etc.)
 * automatically updates both contexts.
 *
 * Requires tileData.js to be loaded first (getTileBaseLayer, getTileBackgroundGroup,
 * getTileAssets must be available as globals).
 *
 * @param {string} tileName - Tile type name (key in TILE_DATA)
 * @param {boolean} [isPenned=false] - Whether to use the penned colour palette
 * @returns {HTMLElement} A <div> with all tile visual layers applied as
 *   inline background and child overlay elements.
 */
function createTileIconElement(tileName, isPenned) {
    isPenned = isPenned === true;
    const el = document.createElement('div');

    // Background — same logic as _setCellBackground in GameAnimations:
    // TileSvgs data: URI → static baseLayer asset → first asset
    const svgUri = getTileBaseUri(tileName, isPenned);
    if (svgUri) {
        el.style.background = `url("${svgUri}") center/cover no-repeat`;
    } else {
        const baseLayer = getTileBaseLayer(tileName);
        if (baseLayer) {
            el.style.background = `url('assets/${baseLayer}') center/cover no-repeat`;
        } else {
            const firstAssets = getTileAssets(tileName, isPenned);
            if (firstAssets && firstAssets.length > 0 && /\.(svg|png|jpe?g|webp|gif)$/i.test(firstAssets[0])) {
                el.style.background = `url('assets/${firstAssets[0]}') center/cover no-repeat`;
            }
        }
    }

    if (getTileBaseLayer(tileName)) {
        // Tiles with a base layer (grass, water): add a variant overlay at index 0
        const variantUri = getTileVariantUri(tileName, 0, isPenned);
        if (variantUri) {
            const img = document.createElement('img');
            img.src = variantUri;
            img.alt = '';
            img.className = 'tile-overlay-fill';
            img.setAttribute('aria-hidden', 'true');
            el.appendChild(img);
        }
    } else {
        // Standard tiles: add icon overlays for all asset types (images and emoji),
        // mirroring the startIndex logic in _createCellElement (GameAnimations.js).
        const hasBackgroundGroup = !!getTileBackgroundGroup(tileName);
        const assetList = getTileAssets(tileName, isPenned);
        // Tiles with backgroundGroup have TileSvgs managing their background, so ALL
        // assets are icon overlays (startIndex = 0). Other tiles skip index 0 which
        // was loaded as the CSS background.
        const startIndex = hasBackgroundGroup ? 0 : 1;
        if (assetList && assetList.length > startIndex) {
            for (let i = startIndex; i < assetList.length; i++) {
                const asset = assetList[i];
                if (/\.(svg|png|jpe?g|webp|gif)$/i.test(asset)) {
                    const img = document.createElement('img');
                    img.src = `assets/${asset}`;
                    img.alt = '';
                    img.className = 'tile-overlay';
                    img.setAttribute('aria-hidden', 'true');
                    el.appendChild(img);
                } else {
                    const span = document.createElement('span');
                    span.className = 'tile-overlay-emoji';
                    span.textContent = asset;
                    span.setAttribute('aria-hidden', 'true');
                    el.appendChild(span);
                }
            }
        }
    }

    return el;
}

/**
 * Returns a data: URI for the base-layer SVG of the given tile type.
 * Returns null for tile types not managed by TileSvgs.
 * @param {string} tileName
 * @param {boolean} isPenned
 * @returns {string|null}
 */
function getTileBaseUri(tileName, isPenned) {
    if (tileName === 'water') {
        return svgToDataUri(_getWaterBaseSvg(WATER_PALETTE));
    }
    if (TILE_SVGS_TILES.has(tileName)) {
        const palette = isPenned ? GRASS_PENNED_PALETTE : GRASS_PALETTE;
        return svgToDataUri(_getGrassBaseSvg(palette));
    }
    return null;
}

/**
 * Returns a data: URI for the variant-overlay SVG at the given index.
 * Only grass and water tiles have variant overlays.
 * Returns null for tile types not managed by TileSvgs or with no variants.
 * @param {string} tileName
 * @param {number} variantIndex  0-based index into the variant list
 * @param {boolean} isPenned
 * @returns {string|null}
 */
function getTileVariantUri(tileName, variantIndex, isPenned) {
    if (tileName === 'water') {
        const fn = _WATER_VARIANT_FNS[variantIndex % _WATER_VARIANT_FNS.length];
        return fn ? svgToDataUri(fn(WATER_PALETTE)) : null;
    }
    if (tileName === 'grass') {
        const palette = isPenned ? GRASS_PENNED_PALETTE : GRASS_PALETTE;
        const fn = _GRASS_VARIANT_FNS[variantIndex % _GRASS_VARIANT_FNS.length];
        return fn ? svgToDataUri(fn(palette)) : null;
    }
    return null;
}

// ─── Browser global (script-tag loading) ─────────────────────────────────────

/* istanbul ignore next */
if (typeof window !== 'undefined') {
    window.TileSvgs = {
        GRASS_PALETTE,
        GRASS_PENNED_PALETTE,
        WATER_PALETTE,
        TILE_SVGS_TILES,
        getTileBaseUri,
        getTileVariantUri,
        svgToDataUri,
        createTileIconElement,
    };
}

// ─── Module export (Node.js / Jest) ──────────────────────────────────────────

/* istanbul ignore next */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GRASS_PALETTE,
        GRASS_PENNED_PALETTE,
        WATER_PALETTE,
        TILE_SVGS_TILES,
        getTileBaseUri,
        getTileVariantUri,
        svgToDataUri,
        createTileIconElement,
    };
}
