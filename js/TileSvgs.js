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
    base:    '#5a9a2a',
    /** Dark forest green — primary blade / stroke color. */
    stroke1: '#2d5a1b',
    /** Slightly deeper green — secondary blade color. */
    stroke2: '#235015',
    /** Darkest accent green — tertiary stroke color. */
    stroke3: '#1a3d0f',
    /** Seed-dot fill color. */
    dot:     '#2d5a1b',
};

/**
 * Penned grass palette — golden / amber tones that match the penned-state
 * visual theme used throughout the game.
 */
const GRASS_PENNED_PALETTE = {
    base:    '#e8c840',
    stroke1: '#b8960c',
    stroke2: '#c8a820',
    stroke3: '#a07808',
    dot:     '#b8960c',
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
    /** Near-white foam — dot / ellipse fill color. */
    foam:    '#b0d8ec',
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
  <path d="M3 48 Q3 44 2 41" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M6 48 Q7 43 5 40" stroke="${p.stroke1}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M10 48 Q10 44 9 41" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M14 48 Q15 43 13 40" stroke="${p.stroke2}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M18 48 Q18 44 17 41" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M22 48 Q23 43 21 40" stroke="${p.stroke3}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M26 48 Q26 44 25 41" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M30 48 Q31 43 29 40" stroke="${p.stroke1}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M34 48 Q34 44 33 41" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M38 48 Q39 43 37 40" stroke="${p.stroke2}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M42 48 Q42 44 41 41" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M46 48 Q47 43 45 40" stroke="${p.stroke3}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M1 35 Q1 31 0 28" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M5 35 Q6 30 4 27" stroke="${p.stroke2}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M9 35 Q9 31 8 28" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M13 35 Q14 30 12 27" stroke="${p.stroke3}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M17 35 Q17 31 16 28" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M21 35 Q22 30 20 27" stroke="${p.stroke1}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M25 35 Q25 31 24 28" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M29 35 Q30 30 28 27" stroke="${p.stroke2}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M33 35 Q33 31 32 28" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M37 35 Q38 30 36 27" stroke="${p.stroke3}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M41 35 Q41 31 40 28" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M45 35 Q46 30 44 27" stroke="${p.stroke1}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M49 35 Q49 31 48 28" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M3 22 Q3 18 2 15" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M7 22 Q8 17 6 14" stroke="${p.stroke2}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M12 22 Q12 18 11 15" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M17 22 Q18 17 16 14" stroke="${p.stroke1}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M22 22 Q22 18 21 15" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M27 22 Q28 17 26 14" stroke="${p.stroke3}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M32 22 Q32 18 31 15" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M37 22 Q38 17 36 14" stroke="${p.stroke2}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M42 22 Q42 18 41 15" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M47 22 Q48 17 46 14" stroke="${p.stroke1}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M1 10 Q1 6 0 3" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M6 10 Q7 5 5 2" stroke="${p.stroke3}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M12 10 Q12 6 11 3" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M18 10 Q19 5 17 2" stroke="${p.stroke2}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M24 10 Q24 6 23 3" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M30 10 Q31 5 29 2" stroke="${p.stroke1}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M36 10 Q36 6 35 3" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M42 10 Q43 5 41 2" stroke="${p.stroke3}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M48 10 Q48 6 47 3" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <circle cx="8" cy="44" r="1.5" fill="${p.dot}"/>
  <circle cx="20" cy="43" r="1.5" fill="${p.dot}"/>
  <circle cx="32" cy="44" r="1.5" fill="${p.dot}"/>
  <circle cx="44" cy="43" r="1.5" fill="${p.dot}"/>
  <circle cx="3" cy="31" r="1.5" fill="${p.dot}"/>
  <circle cx="15" cy="32" r="1.5" fill="${p.dot}"/>
  <circle cx="27" cy="31" r="1.5" fill="${p.dot}"/>
  <circle cx="39" cy="32" r="1.5" fill="${p.dot}"/>
  <circle cx="49" cy="30" r="1.5" fill="${p.dot}"/>
  <circle cx="9" cy="19" r="1.5" fill="${p.dot}"/>
  <circle cx="21" cy="18" r="1.5" fill="${p.dot}"/>
  <circle cx="33" cy="19" r="1.5" fill="${p.dot}"/>
  <circle cx="45" cy="18" r="1.5" fill="${p.dot}"/>
  <circle cx="4" cy="7" r="1.5" fill="${p.dot}"/>
  <circle cx="16" cy="6" r="1.5" fill="${p.dot}"/>
  <circle cx="28" cy="7" r="1.5" fill="${p.dot}"/>
  <circle cx="40" cy="6" r="1.5" fill="${p.dot}"/>
  </g>
</svg>`;
}

// ─── Grass variant 2 — mixed-height scattered blades ─────────────────────────

function _getGrassVariant2Svg(p) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
  <g opacity="0.5">
  <path d="M2 50 Q2 46 1 43" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M8 50 Q9 44 7 40" stroke="${p.stroke1}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M26 50 Q27 46 25 42" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M44 50 Q45 46 43 42" stroke="${p.stroke3}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M14 50 Q14 40 13 30" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M32 50 Q32 38 31 26" stroke="${p.stroke2}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M20 50 Q20 43 19 36" stroke="${p.stroke2}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M38 50 Q38 43 37 36" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M48 50 Q49 45 47 40" stroke="${p.stroke3}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M5 40 Q5 32 4 24" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M11 36 Q12 28 10 20" stroke="${p.stroke2}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M17 42 Q17 34 16 26" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M23 38 Q24 28 22 18" stroke="${p.stroke3}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M29 44 Q29 36 28 28" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M35 40 Q36 30 34 20" stroke="${p.stroke1}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M41 36 Q41 26 40 16" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M47 44 Q48 34 46 24" stroke="${p.stroke2}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M3 24 Q3 16 2 8" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M9 20 Q10 12 8 4" stroke="${p.stroke3}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M15 28 Q15 18 14 8" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M21 24 Q22 14 20 4" stroke="${p.stroke1}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M27 20 Q27 11 26 2" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M33 26 Q34 16 32 6" stroke="${p.stroke2}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M39 22 Q39 12 38 2" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M45 26 Q46 16 44 6" stroke="${p.stroke3}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <circle cx="6" cy="46" r="2" fill="${p.dot}"/>
  <circle cx="18" cy="46" r="1.5" fill="${p.dot}"/>
  <circle cx="30" cy="47" r="2" fill="${p.dot}"/>
  <circle cx="43" cy="46" r="1.5" fill="${p.dot}"/>
  <circle cx="12" cy="34" r="2" fill="${p.dot}"/>
  <circle cx="25" cy="32" r="1.5" fill="${p.dot}"/>
  <circle cx="38" cy="34" r="2" fill="${p.dot}"/>
  <circle cx="48" cy="33" r="1.5" fill="${p.dot}"/>
  <circle cx="7" cy="18" r="2" fill="${p.dot}"/>
  <circle cx="18" cy="16" r="1.5" fill="${p.dot}"/>
  <circle cx="30" cy="18" r="2" fill="${p.dot}"/>
  <circle cx="42" cy="16" r="1.5" fill="${p.dot}"/>
  <circle cx="13" cy="4" r="2" fill="${p.dot}"/>
  <circle cx="25" cy="3" r="1.5" fill="${p.dot}"/>
  <circle cx="37" cy="4" r="2" fill="${p.dot}"/>
  <circle cx="49" cy="3" r="1.5" fill="${p.dot}"/>
  </g>
</svg>`;
}

// ─── Grass variant 3 — V-shaped leaf fronds ──────────────────────────────────

function _getGrassVariant3Svg(p) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
  <g opacity="0.5">
  <path d="M5 46 L2 40" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M5 46 L8 40" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M13 46 L10 40" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M13 46 L16 40" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M21 46 L18 40" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M21 46 L24 40" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M29 46 L26 40" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M29 46 L32 40" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M37 46 L34 40" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M37 46 L40 40" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M45 46 L42 40" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M45 46 L48 40" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M9 34 L6 28" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M9 34 L12 28" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M17 34 L14 28" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M17 34 L20 28" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M25 34 L22 28" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M25 34 L28 28" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M33 34 L30 28" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M33 34 L36 28" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M41 34 L38 28" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M41 34 L44 28" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M49 34 L46 28" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M5 22 L2 16" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M5 22 L8 16" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M13 22 L10 16" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M13 22 L16 16" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M21 22 L18 16" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M21 22 L24 16" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M29 22 L26 16" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M29 22 L32 16" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M37 22 L34 16" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M37 22 L40 16" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M45 22 L42 16" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M45 22 L48 16" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M9 10 L6 4" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M9 10 L12 4" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M17 10 L14 4" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M17 10 L20 4" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M25 10 L22 4" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M25 10 L28 4" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M33 10 L30 4" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M33 10 L36 4" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M41 10 L38 4" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M41 10 L44 4" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M49 10 L46 4" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <circle cx="5" cy="37" r="2" fill="${p.dot}"/>
  <circle cx="17" cy="38" r="1.5" fill="${p.dot}"/>
  <circle cx="29" cy="37" r="2" fill="${p.dot}"/>
  <circle cx="41" cy="38" r="1.5" fill="${p.dot}"/>
  <circle cx="11" cy="25" r="2" fill="${p.dot}"/>
  <circle cx="23" cy="24" r="1.5" fill="${p.dot}"/>
  <circle cx="35" cy="25" r="2" fill="${p.dot}"/>
  <circle cx="47" cy="24" r="1.5" fill="${p.dot}"/>
  <circle cx="3" cy="13" r="2" fill="${p.dot}"/>
  <circle cx="15" cy="12" r="1.5" fill="${p.dot}"/>
  <circle cx="27" cy="13" r="2" fill="${p.dot}"/>
  <circle cx="39" cy="12" r="1.5" fill="${p.dot}"/>
  </g>
</svg>`;
}

// ─── Grass variant 4 — horizontal arcing blades ───────────────────────────────

function _getGrassVariant4Svg(p) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
  <g opacity="0.5">
  <path d="M0 47 Q8 43 16 47" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M10 44 Q18 40 26 44" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M20 47 Q28 43 36 47" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M30 44 Q38 40 46 44" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M38 47 Q44 43 50 47" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M0 36 Q8 32 16 36" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M12 33 Q20 29 28 33" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M24 36 Q32 32 40 36" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M36 33 Q44 29 52 33" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M0 24 Q8 20 16 24" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M10 21 Q18 17 26 21" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M20 24 Q28 20 36 24" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M30 21 Q38 17 46 21" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M38 24 Q44 20 50 24" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M0 12 Q8 8 16 12" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M14 9 Q22 5 30 9" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M26 12 Q34 8 42 12" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M38 9 Q44 5 50 9" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <circle cx="6" cy="40" r="2.5" fill="${p.dot}"/>
  <circle cx="18" cy="39" r="2" fill="${p.dot}"/>
  <circle cx="32" cy="40" r="2.5" fill="${p.dot}"/>
  <circle cx="44" cy="39" r="2" fill="${p.dot}"/>
  <circle cx="10" cy="28" r="2.5" fill="${p.dot}"/>
  <circle cx="22" cy="27" r="2" fill="${p.dot}"/>
  <circle cx="34" cy="28" r="2.5" fill="${p.dot}"/>
  <circle cx="46" cy="27" r="2" fill="${p.dot}"/>
  <circle cx="4" cy="16" r="2.5" fill="${p.dot}"/>
  <circle cx="16" cy="15" r="2" fill="${p.dot}"/>
  <circle cx="30" cy="16" r="2.5" fill="${p.dot}"/>
  <circle cx="43" cy="15" r="2" fill="${p.dot}"/>
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
  <ellipse cx="8" cy="3" rx="3" ry="1.5" fill="${p.foam}" opacity="0.85"/>
  <ellipse cx="26" cy="3" rx="3" ry="1.5" fill="${p.foam}" opacity="0.75"/>
  <ellipse cx="44" cy="3" rx="3" ry="1.5" fill="${p.foam}" opacity="0.85"/>
  <ellipse cx="16" cy="17" rx="3" ry="1.5" fill="${p.foam}" opacity="0.75"/>
  <ellipse cx="34" cy="17" rx="3" ry="1.5" fill="${p.foam}" opacity="0.85"/>
  <ellipse cx="8" cy="31" rx="3" ry="1.5" fill="${p.foam}" opacity="0.75"/>
  <ellipse cx="26" cy="31" rx="3" ry="1.5" fill="${p.foam}" opacity="0.85"/>
  <ellipse cx="44" cy="31" rx="3" ry="1.5" fill="${p.foam}" opacity="0.75"/>
  <ellipse cx="16" cy="45" rx="3" ry="1.5" fill="${p.foam}" opacity="0.85"/>
  <ellipse cx="36" cy="45" rx="3" ry="1.5" fill="${p.foam}" opacity="0.75"/>
  </g>
</svg>`;
}

// ─── Water variant 2 — zigzag lines ──────────────────────────────────────────

function _getWaterVariant2Svg(p) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
  <g opacity="0.5">
  <path d="M0 7 L5 3 L10 7 L15 3 L20 7 L25 3 L30 7 L35 3 L40 7 L45 3 L50 7" stroke="${p.stroke1}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M0 14 L5 10 L10 14 L15 10 L20 14 L25 10 L30 14 L35 10 L40 14 L45 10 L50 14" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M0 21 L5 17 L10 21 L15 17 L20 21 L25 17 L30 21 L35 17 L40 21 L45 17 L50 21" stroke="${p.stroke3}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M0 28 L5 24 L10 28 L15 24 L20 28 L25 24 L30 28 L35 24 L40 28 L45 24 L50 28" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M0 35 L5 31 L10 35 L15 31 L20 35 L25 31 L30 35 L35 31 L40 35 L45 31 L50 35" stroke="${p.stroke2}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M0 42 L5 38 L10 42 L15 38 L20 42 L25 38 L30 42 L35 38 L40 42 L45 38 L50 42" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M0 49 L5 45 L10 49 L15 45 L20 49 L25 45 L30 49 L35 45 L40 49 L45 45 L50 49" stroke="${p.stroke1}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="5" cy="3" r="2" fill="${p.foam}" opacity="0.9"/>
  <circle cx="15" cy="3" r="2" fill="${p.foam}" opacity="0.85"/>
  <circle cx="25" cy="3" r="2" fill="${p.foam}" opacity="0.9"/>
  <circle cx="35" cy="3" r="2" fill="${p.foam}" opacity="0.85"/>
  <circle cx="45" cy="3" r="2" fill="${p.foam}" opacity="0.9"/>
  <circle cx="5" cy="17" r="2" fill="${p.foam}" opacity="0.85"/>
  <circle cx="15" cy="17" r="2" fill="${p.foam}" opacity="0.9"/>
  <circle cx="25" cy="17" r="2" fill="${p.foam}" opacity="0.85"/>
  <circle cx="35" cy="17" r="2" fill="${p.foam}" opacity="0.9"/>
  <circle cx="45" cy="17" r="2" fill="${p.foam}" opacity="0.85"/>
  <circle cx="5" cy="31" r="2" fill="${p.foam}" opacity="0.9"/>
  <circle cx="15" cy="31" r="2" fill="${p.foam}" opacity="0.85"/>
  <circle cx="25" cy="31" r="2" fill="${p.foam}" opacity="0.9"/>
  <circle cx="35" cy="31" r="2" fill="${p.foam}" opacity="0.85"/>
  <circle cx="45" cy="31" r="2" fill="${p.foam}" opacity="0.9"/>
  <circle cx="5" cy="45" r="2" fill="${p.foam}" opacity="0.85"/>
  <circle cx="25" cy="45" r="2" fill="${p.foam}" opacity="0.9"/>
  <circle cx="45" cy="45" r="2" fill="${p.foam}" opacity="0.85"/>
  </g>
</svg>`;
}

// ─── Water variant 3 — sweeping arc waves with foam circles ──────────────────

function _getWaterVariant3Svg(p) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
  <g opacity="0.5">
  <path d="M0 8 Q12 2 25 8 Q38 14 50 8" stroke="${p.stroke1}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M0 18 Q12 12 25 18 Q38 24 50 18" stroke="${p.stroke2}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M0 28 Q12 22 25 28 Q38 34 50 28" stroke="${p.stroke3}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M0 38 Q12 32 25 38 Q38 44 50 38" stroke="${p.stroke1}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M0 48 Q12 42 25 48 Q38 54 50 48" stroke="${p.stroke2}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="8" cy="5" r="3" fill="${p.foam}" opacity="0.85"/>
  <circle cx="22" cy="4" r="2.5" fill="${p.foam}" opacity="0.75"/>
  <circle cx="38" cy="5" r="3" fill="${p.foam}" opacity="0.85"/>
  <circle cx="13" cy="15" r="2.5" fill="${p.foam}" opacity="0.75"/>
  <circle cx="31" cy="14" r="3" fill="${p.foam}" opacity="0.85"/>
  <circle cx="47" cy="15" r="2.5" fill="${p.foam}" opacity="0.75"/>
  <circle cx="5" cy="25" r="3" fill="${p.foam}" opacity="0.85"/>
  <circle cx="21" cy="24" r="2.5" fill="${p.foam}" opacity="0.75"/>
  <circle cx="39" cy="25" r="3" fill="${p.foam}" opacity="0.85"/>
  <circle cx="13" cy="35" r="2.5" fill="${p.foam}" opacity="0.75"/>
  <circle cx="28" cy="34" r="3" fill="${p.foam}" opacity="0.85"/>
  <circle cx="44" cy="35" r="2.5" fill="${p.foam}" opacity="0.75"/>
  <circle cx="7" cy="45" r="3" fill="${p.foam}" opacity="0.85"/>
  <circle cx="24" cy="44" r="2.5" fill="${p.foam}" opacity="0.75"/>
  <circle cx="40" cy="45" r="3" fill="${p.foam}" opacity="0.85"/>
  </g>
</svg>`;
}

// ─── Water variant 4 — V-crest waves ─────────────────────────────────────────

function _getWaterVariant4Svg(p) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
  <g opacity="0.5">
  <path d="M0 8 L8 3 L16 8 L24 3 L32 8 L40 3 L50 8" stroke="${p.stroke3}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M0 17 L10 11 L20 17 L30 11 L40 17 L50 11" stroke="${p.stroke1}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M0 26 L8 20 L16 26 L24 20 L32 26 L40 20 L50 26" stroke="${p.stroke2}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M0 35 L10 29 L20 35 L30 29 L40 35 L50 29" stroke="${p.stroke3}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M0 44 L8 38 L16 44 L24 38 L32 44 L40 38 L50 44" stroke="${p.stroke1}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M0 50 L10 45 L20 50 L30 45 L40 50 L50 45" stroke="${p.stroke2}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="8" cy="3" r="2.5" fill="${p.foam}" opacity="0.9"/>
  <circle cx="24" cy="3" r="2.5" fill="${p.foam}" opacity="0.85"/>
  <circle cx="40" cy="3" r="2.5" fill="${p.foam}" opacity="0.9"/>
  <circle cx="10" cy="11" r="2" fill="${p.foam}" opacity="0.85"/>
  <circle cx="30" cy="11" r="2" fill="${p.foam}" opacity="0.9"/>
  <circle cx="50" cy="11" r="2" fill="${p.foam}" opacity="0.85"/>
  <circle cx="8" cy="20" r="2.5" fill="${p.foam}" opacity="0.9"/>
  <circle cx="24" cy="20" r="2.5" fill="${p.foam}" opacity="0.85"/>
  <circle cx="40" cy="20" r="2.5" fill="${p.foam}" opacity="0.9"/>
  <circle cx="10" cy="29" r="2" fill="${p.foam}" opacity="0.85"/>
  <circle cx="30" cy="29" r="2" fill="${p.foam}" opacity="0.9"/>
  <circle cx="8" cy="38" r="2.5" fill="${p.foam}" opacity="0.85"/>
  <circle cx="24" cy="38" r="2.5" fill="${p.foam}" opacity="0.9"/>
  <circle cx="40" cy="38" r="2.5" fill="${p.foam}" opacity="0.85"/>
  <circle cx="10" cy="45" r="2" fill="${p.foam}" opacity="0.9"/>
  <circle cx="30" cy="45" r="2" fill="${p.foam}" opacity="0.85"/>
  </g>
</svg>`;
}

// ─── Grass variant lookup ─────────────────────────────────────────────────────

const _GRASS_VARIANT_FNS = [
    _getGrassVariant1Svg,
    _getGrassVariant2Svg,
    _getGrassVariant3Svg,
    _getGrassVariant4Svg,
];

const _WATER_VARIANT_FNS = [
    _getWaterVariant1Svg,
    _getWaterVariant2Svg,
    _getWaterVariant3Svg,
    _getWaterVariant4Svg,
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Set of tile names whose base layer is generated by TileSvgs.
 * Includes grass, water, and all tiles that render on a grass background.
 */
const TILE_SVGS_TILES = new Set(['grass', 'water', 'home', 'star', 'bee']);

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
    };
}
