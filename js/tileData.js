/**
 * Tile Data Definitions
 * 
 * Single source of truth for ALL tile properties used by the game engine,
 * generation pipeline, solver, and rendering. A designer can add a new tile
 * type by adding a single entry here — no other file needs custom logic.
 *
 * Each tile type defines:
 *   name          - Internal identifier (string key)
 *   displayName   - Human-readable label for UI
 *   description   - Short description shown in tooltips / legend
 *   score         - Points contributed when inside the penned area
 *   wallPlaceable - Whether the player can place/remove a wall on this tile
 *   clickable     - Whether clicking this tile does something (place or remove wall)
 *   blocksMovement - Whether this tile blocks pet movement / pathfinding
 *   chance        - Probability (0.00–1.00) this tile appears during generation
 *                   (only tiles with chance > 0 participate; home is placed separately)
 *   compactChar   - Single character used in the compact map string format
 *   numericId     - Numeric value used in the solver's numeric map format
 *   cssClass      - CSS class applied to the cell element
 *   gradient      - CSS gradient for fallback background styling
 *   assets        - Ordered list of visual layers rendered on the cell.
 *                   Strings ending in ".svg" are loaded as <img>; others are
 *                   rendered as text/emoji overlays.
 *   emoji         - Optional emoji shown inside the tile (e.g. home pet)
 *   ariaLabel     - Function (row, col) => string for screen reader label
 */

const TILE_DATA = {
    grass: {
        name: 'grass',
        displayName: 'Grass',
        description: 'Grass tile - click to build a wall',
        score: 1,
        wallPlaceable: true,
        clickable: true,
        blocksMovement: false,
        chance: 0.65,
        compactChar: 'g',
        numericId: 1,
        cssClass: 'grass',
        gradient: 'linear-gradient(135deg, #7ed957 0%, #4caf50 100%)',
        assets: ['grass.svg'],
        ariaLabel: (row, col) => `Grass tile at row ${row + 1}, column ${col + 1}. Click to build a wall.`,
    },
    water: {
        name: 'water',
        displayName: 'Water',
        description: 'Water tile - cannot be clicked',
        score: 0,
        wallPlaceable: false,
        clickable: false,
        blocksMovement: true,
        chance: 0.30,
        compactChar: 'w',
        numericId: 0,
        cssClass: 'water',
        gradient: 'linear-gradient(135deg, #4fc3f7 0%, #2196f3 100%)',
        assets: ['water.svg'],
        ariaLabel: (row, col) => `Water tile at row ${row + 1}, column ${col + 1}. Cannot be clicked.`,
    },
    wall: {
        name: 'wall',
        displayName: 'Wall',
        description: 'Wall - placed by player',
        score: 0,
        wallPlaceable: false,
        clickable: true,
        blocksMovement: true,
        chance: 0,
        compactChar: 'W',
        numericId: 5,
        cssClass: 'wall',
        gradient: 'linear-gradient(135deg, #8d6e63 0%, #5d4037 100%)',
        assets: ['wall.svg'],
        ariaLabel: (row, col) => `Wall at row ${row + 1}, column ${col + 1}. Click to remove.`,
    },
    home: {
        name: 'home',
        displayName: 'Home',
        description: 'Home - pet starting location',
        score: 1,
        wallPlaceable: false,
        clickable: false,
        blocksMovement: false,
        chance: 0,
        compactChar: 'h',
        numericId: 2,
        cssClass: 'home',
        gradient: 'linear-gradient(135deg, #ffeb3b 0%, #ffc107 100%)',
        assets: ['home.svg'],
        emoji: '🏠🐾',
        ariaLabel: (row, col) => `Home tile at row ${row + 1}, column ${col + 1}. Pet starting location.`,
    },
    star: {
        name: 'star',
        displayName: 'Star',
        description: 'Star tile - worth 3 points, click to build a wall',
        score: 3,
        wallPlaceable: true,
        clickable: true,
        blocksMovement: false,
        chance: 0.05,
        compactChar: 's',
        numericId: 3,
        cssClass: 'grass',
        gradient: 'linear-gradient(135deg, #7ed957 0%, #4caf50 100%)',
        assets: ['grass.svg', 'star.svg'],
        ariaLabel: (row, col) => `Star tile at row ${row + 1}, column ${col + 1}. Worth 3 points. Click to build a wall.`,
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
 * Derived from the blocksMovement property in TILE_DATA.
 * @type {Set<number>}
 */
const BLOCKING_NUMERIC_IDS = new Set();
for (const data of Object.values(TILE_DATA)) {
    if (data.blocksMovement) {
        BLOCKING_NUMERIC_IDS.add(data.numericId);
    }
}

/**
 * Set of tile name strings that block movement.
 * Used by PathfindingUtils.hasPathToEdge() and Game.isBlockingTile()
 * to avoid hardcoding tile names like 'water' or 'wall'.
 * @type {Set<string>}
 */
const BLOCKING_TILES = new Set();
for (const [name, data] of Object.entries(TILE_DATA)) {
    if (data.blocksMovement) {
        BLOCKING_TILES.add(name);
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
 * Check if a tile name blocks movement (string map format).
 * @param {string} tileName - Tile type name
 * @returns {boolean}
 */
function isBlockingTile(tileName) {
    return BLOCKING_TILES.has(tileName);
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

/**
 * Get a tile type's rendering/display info by name.
 * Returns the TILE_DATA entry which includes cssClass, gradient, assets, ariaLabel, etc.
 * Falls back to grass if the name is not found.
 * @param {string} typeName - The name of the tile type
 * @returns {Object} The tile data object
 */
function getTileType(typeName) {
    return TILE_DATA[typeName] || TILE_DATA.grass;
}

/**
 * Check if a tile type is clickable.
 * Uses the clickable property from TILE_DATA.
 * @param {string} typeName - The name of the tile type
 * @returns {boolean} True if the tile can be clicked
 */
function isTileClickable(typeName) {
    const data = TILE_DATA[typeName];
    return data ? data.clickable : false;
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
        BLOCKING_TILES,
        isWallPlaceable,
        getTileScore,
        getNumericTileScore,
        isBlockingNumericId,
        isBlockingTile,
        getEligibleTileTypes,
        getTileType,
        isTileClickable,
    };
}
