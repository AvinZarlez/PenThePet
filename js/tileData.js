/**
 * Tile Data Definitions
 * 
 * Single source of truth for all tile properties used by the game engine,
 * generation pipeline, solver, and rendering. A designer can tweak these
 * values to adjust gameplay without touching game logic.
 *
 * Each tile type defines:
 *   name         - Internal identifier (string key)
 *   score        - Points contributed when inside the penned area
 *   wallPlaceable - Whether the player can place/remove a wall on this tile
 *   chance       - Probability (0.00–1.00) this tile appears during generation
 *                  (only tiles with chance > 0 participate; home is placed separately)
 *   compactChar  - Single character used in the compact map string format
 *   numericId    - Numeric value used in the solver's numeric map format
 *   assets       - Ordered list of visual layers rendered on the cell.
 *                  Strings ending in ".svg" are loaded as <img>; others are
 *                  rendered as text/emoji overlays.
 */

const TILE_DATA = {
    grass: {
        name: 'grass',
        score: 1,
        wallPlaceable: true,
        chance: 0.65,
        compactChar: 'g',
        numericId: 1,
        assets: ['grass.svg'],
    },
    water: {
        name: 'water',
        score: 0,
        wallPlaceable: false,
        chance: 0.30,
        compactChar: 'w',
        numericId: 0,
        assets: ['water.svg'],
    },
    wall: {
        name: 'wall',
        score: 0,
        wallPlaceable: false,
        chance: 0,
        compactChar: 'W',
        numericId: 5,
        assets: ['wall.svg'],
    },
    home: {
        name: 'home',
        score: 1,
        wallPlaceable: false,
        chance: 0,
        compactChar: 'h',
        numericId: 2,
        assets: ['home.svg'],
    },
    star: {
        name: 'star',
        score: 3,
        wallPlaceable: true,
        chance: 0.05,
        compactChar: 's',
        numericId: 3,
        assets: ['grass.svg', 'star.svg'],
    },
};

// ─── Derived lookup tables (built once, used everywhere) ──────────────

/**
 * Map from compact character → tile name.
 * Used by parseCompactMap() in Grid.js.
 * @type {Object<string, string>}
 */
const COMPACT_CHAR_TO_TILE = {};
for (const [name, data] of Object.entries(TILE_DATA)) {
    COMPACT_CHAR_TO_TILE[data.compactChar] = name;
}

/**
 * Map from tile name → compact character.
 * Used by encodeCompactMap() in generate-map.js.
 * @type {Object<string, string>}
 */
const TILE_TO_COMPACT_CHAR = {};
for (const [name, data] of Object.entries(TILE_DATA)) {
    TILE_TO_COMPACT_CHAR[name] = data.compactChar;
}

/**
 * Map from numericId → score.
 * Used by PathfindingUtils.calculatePennedScore() to compute weighted scores
 * from numeric map arrays without needing tile name lookups.
 * @type {Object<number, number>}
 */
const NUMERIC_ID_TO_SCORE = {};
for (const data of Object.values(TILE_DATA)) {
    NUMERIC_ID_TO_SCORE[data.numericId] = data.score;
}

/**
 * Map from tile name → numericId.
 * Used by MapGenerator._mapToNumeric().
 * @type {Object<string, number>}
 */
const TILE_TO_NUMERIC = {};
for (const [name, data] of Object.entries(TILE_DATA)) {
    TILE_TO_NUMERIC[name] = data.numericId;
}

/**
 * Map from numericId → tile name.
 * Used by MILPSolver for converting numeric maps to string maps.
 * @type {Object<number, string>}
 */
const NUMERIC_TO_TILE = {};
for (const [name, data] of Object.entries(TILE_DATA)) {
    NUMERIC_TO_TILE[data.numericId] = name;
}

/**
 * Set of numericIds that block movement.
 * Tiles block movement if they are not wall-placeable and are not 'home'.
 * @type {Set<number>}
 */
const BLOCKING_NUMERIC_IDS = new Set();
for (const data of Object.values(TILE_DATA)) {
    if (!data.wallPlaceable && data.name !== 'home') {
        BLOCKING_NUMERIC_IDS.add(data.numericId);
    }
}

/**
 * Check if a tile name represents a wall-placeable tile.
 * @param {string} tileName - Tile type name
 * @returns {boolean}
 */
function isWallPlaceable(tileName) {
    const data = TILE_DATA[tileName];
    return data ? data.wallPlaceable : false;
}

/**
 * Get the score value for a tile by name.
 * @param {string} tileName - Tile type name
 * @returns {number}
 */
function getTileScore(tileName) {
    const data = TILE_DATA[tileName];
    return data ? data.score : 0;
}

/**
 * Get the score value for a numeric tile ID.
 * @param {number} numericId - Numeric tile ID
 * @returns {number}
 */
function getNumericTileScore(numericId) {
    return NUMERIC_ID_TO_SCORE[numericId] !== undefined ? NUMERIC_ID_TO_SCORE[numericId] : 0;
}

/**
 * Check if a numeric tile ID blocks movement.
 * @param {number} numericId - Numeric tile ID
 * @returns {boolean}
 */
function isBlockingNumericId(numericId) {
    return BLOCKING_NUMERIC_IDS.has(numericId);
}

/**
 * Get eligible tile type names (those with chance > 0) for map generation.
 * @returns {string[]} Array of tile type names
 */
function getEligibleTileTypes() {
    return Object.entries(TILE_DATA)
        .filter(([, data]) => data.chance > 0)
        .map(([name]) => name);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TILE_DATA,
        COMPACT_CHAR_TO_TILE,
        TILE_TO_COMPACT_CHAR,
        NUMERIC_ID_TO_SCORE,
        TILE_TO_NUMERIC,
        NUMERIC_TO_TILE,
        BLOCKING_NUMERIC_IDS,
        isWallPlaceable,
        getTileScore,
        getNumericTileScore,
        isBlockingNumericId,
        getEligibleTileTypes,
    };
}
