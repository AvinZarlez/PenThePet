/**
 * Tile Data Definitions — Single Source of Truth
 *
 * This file is the canonical definition for every tile type. Both the
 * browser/Node.js code and the Python solver (via Node.js subprocess)
 * read tile properties from this file. No other file duplicates these values.
 *
 * To add a new tile type, add an entry to TILE_DATA below. All game logic,
 * rendering, generation, scoring, the Python solver, and player instructions
 * are built automatically from this data.
 *
 * Each tile type defines:
 *   score         - Points contributed when inside the penned area
 *   wallPlaceable - Whether the player can place/remove a wall on this tile
 *   clickable     - Whether clicking this tile does something (place or remove wall)
 *   blocksMovement - Whether this tile blocks pet movement / pathfinding
 *   chance        - Probability (0.00–1.00) this tile appears during generation
 *                   (only tiles with chance > 0 participate; home is placed separately)
 *   compactChar   - Single character used in the compact map string format
 *   numericId     - Numeric value used in the solver's numeric map format
 *   cssClass      - CSS class applied to the cell element
 *   assets        - Ordered list of visual layers rendered on the cell.
 *                   The first entry is the base background; subsequent entries
 *                   are overlays. Strings ending in ".svg" are loaded as <img>;
 *                   others are rendered as text/emoji overlays.
 *   enclosedAssets - Optional. When defined and the tile is inside the penned
 *                   (enclosed) area, these assets are used instead of `assets`.
 *                   Falls back to `assets` if not defined.
 *   floatAnimation - Optional boolean. When true, the last overlay layer renders
 *                   with a gentle floating/wiggle CSS animation (top layer only).
 *                   The outline layer beneath it stays still to ground the tile.
 *   pawOverlay    - Optional list of assets to render as escape-path overlay.
 *                   If undefined, uses default ['paw.svg'].
 *                   If [] (empty), no overlay is rendered.
 *                   If ['custom.svg'] or ['emoji'], those are rendered instead.
 *   description   - Human-readable description for player instructions.
 *                   Rendered in the instructions modal so designers can
 *                   document a tile in one place and have it show to players.
 *   ariaLabel     - Function (row, col) => string for screen reader label
 */

const TILE_DATA = {
    grass: {
        score: 1,
        wallPlaceable: true,
        clickable: true,
        blocksMovement: false,
        chance: 0.65,
        compactChar: 'g',
        numericId: 1,
        cssClass: 'grass',
        description: 'Click on grass tiles to place walls. Each grass tile in your penned area scores 1 point.',
        assets: ['grass.svg'],
        enclosedAssets: ['penned.svg'],
        ariaLabel: (row, col) => `Grass tile at row ${row + 1}, column ${col + 1}. Click to build a wall.`,
    },
    water: {
        score: 0,
        wallPlaceable: false,
        clickable: false,
        blocksMovement: true,
        chance: 0.3,
        compactChar: 'w',
        numericId: 0,
        cssClass: 'water',
        description: 'Water tiles block movement and cannot be clicked. Walls cannot be placed on water.',
        assets: ['water.svg'],
        pawOverlay: [],
        ariaLabel: (row, col) => `Water tile at row ${row + 1}, column ${col + 1}. Cannot be clicked.`,
    },
    wall: {
        score: 0,
        wallPlaceable: false,
        clickable: true,
        blocksMovement: true,
        chance: 0,
        compactChar: 'W',
        numericId: 5,
        cssClass: 'wall',
        wallState: true,
        description: 'Walls block pet movement. Click on a wall to remove it. You have a limited number of walls to place.',
        assets: ['wall.svg'],
        pawOverlay: [],
        ariaLabel: (row, col) => `Wall at row ${row + 1}, column ${col + 1}. Click to remove.`,
    },
    home: {
        score: 1,
        wallPlaceable: false,
        clickable: false,
        blocksMovement: false,
        chance: 0,
        maxPerLevel: 1,
        compactChar: 'h',
        numericId: 2,
        cssClass: 'home',
        description: 'Your pet starts at the home tile. The penned area is measured from here.',
        assets: ['grass.svg', 'home.svg'],
        enclosedAssets: ['penned.svg', 'home.svg'],
        pawOverlay: [],
        ariaLabel: (row, col) => `Home tile at row ${row + 1}, column ${col + 1}. Pet starting location.`,
    },
    star: {
        score: 3,
        wallPlaceable: false,
        clickable: false,
        blocksMovement: false,
        chance: 0.05,
        compactChar: 's',
        numericId: 3,
        cssClass: 'grass',
        floatAnimation: true,
        description: 'Star tiles act like grass but score 3 points instead of 1 when inside your penned area. Walls cannot be placed on stars.',
        assets: ['grass.svg', 'star-outline.svg', 'star.svg'],
        enclosedAssets: ['penned.svg', 'star-outline.svg', 'star.svg'],
        ariaLabel: (row, col) => `Star tile at row ${row + 1}, column ${col + 1}. Worth 3 points. Cannot place a wall here.`,
    },
    bee: {
        score: -3,
        wallPlaceable: false,
        clickable: false,
        blocksMovement: false,
        chance: 0.03,
        compactChar: 'b',
        numericId: 4,
        cssClass: 'grass',
        floatAnimation: true,
        description: 'Bee tiles act like grass but subtract 3 points when inside your penned area. Try to keep bees outside! Walls cannot be placed on bees.',
        assets: ['grass.svg', 'bee-outline.svg', 'bee.svg'],
        enclosedAssets: ['penned.svg', 'bee-outline.svg', 'bee.svg'],
        ariaLabel: (row, col) => `Bee tile at row ${row + 1}, column ${col + 1}. Costs 3 points. Cannot place a wall here.`,
    },
    hole: {
        score: 0,
        wallPlaceable: true,
        clickable: true,
        blocksMovement: true,
        chance: 0.15,
        maxPerLevel: 3,
        compactChar: 'o',
        numericId: 6,
        cssClass: 'hole',
        wallTransformsTo: 'filledHole',
        description: 'Holes block movement like water, but you can fill them by placing a wall. A filled hole acts as grass and scores 1 point.',
        assets: ['hole.svg'],
        pawOverlay: [],
        ariaLabel: (row, col) => `Hole at row ${row + 1}, column ${col + 1}. Click to fill with a wall.`,
    },
    filledHole: {
        score: 1,
        wallPlaceable: false,
        clickable: true,
        blocksMovement: false,
        chance: 0,
        compactChar: 'O',
        numericId: 7,
        cssClass: 'filled-hole',
        wallState: true,
        description: 'A filled hole acts as grass, scoring 1 point when inside your penned area. Click to remove the fill.',
        assets: ['filled-hole.svg'],
        enclosedAssets: ['filled-hole-penned.svg'],
        ariaLabel: (row, col) => `Filled hole at row ${row + 1}, column ${col + 1}. Acts as grass. Click to remove fill.`,
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
 * Set of tile name strings that are fillable (blocksMovement AND wallPlaceable).
 * These tiles become passable when a wall is placed on them.
 * Used by PathfindingUtils and the solver to handle tiles that transform
 * from blocking to passable when a wall is placed.
 * @type {Set<string>}
 */
const FILLABLE_TILES = new Set();
for (const [name, data] of Object.entries(TILE_DATA)) {
    if (data.blocksMovement && data.wallPlaceable) {
        FILLABLE_TILES.add(name);
    }
}

/**
 * Set of numericIds for fillable tiles.
 * @type {Set<number>}
 */
const FILLABLE_NUMERIC_IDS = new Set();
for (const data of Object.values(TILE_DATA)) {
    if (data.blocksMovement && data.wallPlaceable) {
        FILLABLE_NUMERIC_IDS.add(data.numericId);
    }
}

/**
 * Map from numericId → filled score for fillable tiles.
 * When a fillable tile is filled (wall placed), it uses the wallTransformsTo tile's score.
 * @type {Object<number, number>}
 */
const FILLED_SCORE_MAP = {};
for (const data of Object.values(TILE_DATA)) {
    if (data.blocksMovement && data.wallPlaceable && data.wallTransformsTo) {
        const filledData = TILE_DATA[data.wallTransformsTo];
        FILLED_SCORE_MAP[data.numericId] = filledData ? filledData.score : 1;
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
 * Check if a tile name is fillable (blocks movement but can have wall placed).
 * Fillable tiles become passable when a wall is placed on them.
 * @param {string} tileName - Tile type name
 * @returns {boolean}
 */
function isFillableTile(tileName) {
    return FILLABLE_TILES.has(tileName);
}

/**
 * Check if a numeric tile ID is fillable.
 * @param {number} numericId - Numeric tile ID
 * @returns {boolean}
 */
function isFillableNumericId(numericId) {
    return FILLABLE_NUMERIC_IDS.has(numericId);
}

/**
 * Check if a tile represents a "wall placed" state (wall or filled hole).
 * Used to determine if clicking should remove a wall.
 * @param {string} tileName - Tile type name
 * @returns {boolean}
 */
function isWallState(tileName) {
    const data = TILE_DATA[tileName];
    return data ? !!data.wallState : false;
}

/**
 * Get the tile name that a wall-placeable tile transforms into when a wall is placed.
 * Returns 'wall' if no wallTransformsTo is defined.
 * @param {string} tileName - Tile type name
 * @returns {string} The transformed tile name
 */
function getWallTransform(tileName) {
    const data = TILE_DATA[tileName];
    return (data && data.wallTransformsTo) ? data.wallTransformsTo : 'wall';
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
 * Returns the TILE_DATA entry which includes cssClass, assets, ariaLabel, etc.
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

/**
 * Get the asset list for a tile, using enclosedAssets when enclosed.
 * @param {string} tileName - Tile type name
 * @param {boolean} isEnclosed - Whether the tile is inside the penned area
 * @returns {string[]} Ordered list of asset filenames to render
 */
function getTileAssets(tileName, isEnclosed) {
    const data = TILE_DATA[tileName];
    if (!data) return ['grass.svg'];
    if (isEnclosed && data.enclosedAssets) {
        return data.enclosedAssets;
    }
    return data.assets || ['grass.svg'];
}

/**
 * Get the paw overlay asset list for a tile on the escape path.
 * If pawOverlay is undefined, returns default ['paw.svg'].
 * If pawOverlay is [] (empty), returns [] (no overlay).
 * If pawOverlay has items, returns those items.
 * @param {string} tileName - Tile type name
 * @returns {string[]} Asset list to render as paw overlay
 */
function getPawOverlay(tileName) {
    const data = TILE_DATA[tileName];
    if (!data) return ['paw.svg'];
    if (data.pawOverlay !== undefined) {
        return data.pawOverlay;
    }
    return ['paw.svg'];
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
        FILLABLE_TILES,
        FILLABLE_NUMERIC_IDS,
        FILLED_SCORE_MAP,
        isWallPlaceable,
        getTileScore,
        getNumericTileScore,
        isBlockingNumericId,
        isBlockingTile,
        isFillableTile,
        isFillableNumericId,
        isWallState,
        getWallTransform,
        getEligibleTileTypes,
        getTileType,
        isTileClickable,
        getTileAssets,
        getPawOverlay,
    };
}
