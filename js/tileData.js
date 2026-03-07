/**
 * Tile Data Definitions — Single Source of Truth
 *
 * All tile type properties are defined here. Both browser/Node.js code and
 * the Python solver read from this file. No other file duplicates these values.
 *
 * To add a new tile: add an entry to TILE_DATA below + an SVG asset.
 * All game logic, rendering, generation, scoring, solving, and player
 * instructions derive from this data automatically.
 *
 * See docs/TILE_SYSTEM.md for full property documentation.
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
        chance: 0,
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

/** compact character → tile name (used by parseCompactMap in Grid.js) */
const COMPACT_CHAR_TO_TILE = {};
for (const [name, data] of Object.entries(TILE_DATA)) {
    COMPACT_CHAR_TO_TILE[data.compactChar] = name;
}

/** tile name → compact character (used by encodeCompactMap in generate-map.js) */
const TILE_TO_COMPACT_CHAR = {};
for (const [name, data] of Object.entries(TILE_DATA)) {
    TILE_TO_COMPACT_CHAR[name] = data.compactChar;
}

/** numericId → score (used by PathfindingUtils.calculatePennedScore) */
const NUMERIC_ID_TO_SCORE = {};
for (const data of Object.values(TILE_DATA)) {
    NUMERIC_ID_TO_SCORE[data.numericId] = data.score;
}

/** tile name → numericId (used by MapGenerator._mapToNumeric) */
const TILE_TO_NUMERIC = {};
for (const [name, data] of Object.entries(TILE_DATA)) {
    TILE_TO_NUMERIC[name] = data.numericId;
}

/** numericId → tile name (used by MILPSolver) */
const NUMERIC_TO_TILE = {};
for (const [name, data] of Object.entries(TILE_DATA)) {
    NUMERIC_TO_TILE[data.numericId] = name;
}

/** Set of numericIds that block movement */
const BLOCKING_NUMERIC_IDS = new Set();
for (const data of Object.values(TILE_DATA)) {
    if (data.blocksMovement) {
        BLOCKING_NUMERIC_IDS.add(data.numericId);
    }
}

/** Set of tile names that block movement */
const BLOCKING_TILES = new Set();
for (const [name, data] of Object.entries(TILE_DATA)) {
    if (data.blocksMovement) {
        BLOCKING_TILES.add(name);
    }
}

/** Set of tile names that are fillable (blocksMovement AND wallPlaceable — become passable when filled) */
const FILLABLE_TILES = new Set();
for (const [name, data] of Object.entries(TILE_DATA)) {
    if (data.blocksMovement && data.wallPlaceable) {
        FILLABLE_TILES.add(name);
    }
}

/** Set of numericIds for fillable tiles */
const FILLABLE_NUMERIC_IDS = new Set();
for (const data of Object.values(TILE_DATA)) {
    if (data.blocksMovement && data.wallPlaceable) {
        FILLABLE_NUMERIC_IDS.add(data.numericId);
    }
}

/** numericId → filled score for fillable tiles (score of the wallTransformsTo tile) */
const FILLED_SCORE_MAP = {};
for (const data of Object.values(TILE_DATA)) {
    if (data.blocksMovement && data.wallPlaceable && data.wallTransformsTo) {
        const filledData = TILE_DATA[data.wallTransformsTo];
        FILLED_SCORE_MAP[data.numericId] = filledData ? filledData.score : 1;
    }
}

/** Returns true if a wall can be placed on this tile. @param {string} tileName @returns {boolean} */
function isWallPlaceable(tileName) {
    const data = TILE_DATA[tileName];
    return data ? data.wallPlaceable : false;
}

/** Returns the score value for a tile by name. @param {string} tileName @returns {number} */
function getTileScore(tileName) {
    const data = TILE_DATA[tileName];
    return data ? data.score : 0;
}

/** Returns the score value for a numeric tile ID. @param {number} numericId @returns {number} */
function getNumericTileScore(numericId) {
    return NUMERIC_ID_TO_SCORE[numericId] !== undefined ? NUMERIC_ID_TO_SCORE[numericId] : 0;
}

/** Returns true if the numeric tile ID blocks movement. @param {number} numericId @returns {boolean} */
function isBlockingNumericId(numericId) {
    return BLOCKING_NUMERIC_IDS.has(numericId);
}

/** Returns true if the tile name blocks movement. @param {string} tileName @returns {boolean} */
function isBlockingTile(tileName) {
    return BLOCKING_TILES.has(tileName);
}

/**
 * Returns true if the tile is fillable (blocksMovement + wallPlaceable — becomes passable when filled).
 * @param {string} tileName @returns {boolean}
 */
function isFillableTile(tileName) {
    return FILLABLE_TILES.has(tileName);
}

/** Returns true if the numeric tile ID is fillable. @param {number} numericId @returns {boolean} */
function isFillableNumericId(numericId) {
    return FILLABLE_NUMERIC_IDS.has(numericId);
}

/**
 * Returns true if this tile represents a "wall placed" state (wall or filled hole).
 * @param {string} tileName @returns {boolean}
 */
function isWallState(tileName) {
    const data = TILE_DATA[tileName];
    return data ? !!data.wallState : false;
}

/**
 * Returns the tile name a wall-placeable tile transforms into when filled.
 * Falls back to 'wall' if no wallTransformsTo is defined.
 * @param {string} tileName @returns {string}
 */
function getWallTransform(tileName) {
    const data = TILE_DATA[tileName];
    return (data && data.wallTransformsTo) ? data.wallTransformsTo : 'wall';
}

/** Returns tile names eligible for map generation (chance > 0). @returns {string[]} */
function getEligibleTileTypes() {
    return Object.entries(TILE_DATA)
        .filter(([, data]) => data.chance > 0)
        .map(([name]) => name);
}

/**
 * Returns tile data by name. Falls back to grass if not found.
 * @param {string} typeName @returns {Object}
 */
function getTileType(typeName) {
    return TILE_DATA[typeName] || TILE_DATA.grass;
}

/** Returns true if the tile type is clickable. @param {string} typeName @returns {boolean} */
function isTileClickable(typeName) {
    const data = TILE_DATA[typeName];
    return data ? data.clickable : false;
}

/**
 * Returns asset list for a tile, using enclosedAssets when the tile is penned.
 * @param {string} tileName @param {boolean} isEnclosed @returns {string[]}
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
 * Returns paw overlay assets for escape-path rendering.
 * undefined pawOverlay → ['paw.svg']; [] → no overlay; custom list → those assets.
 * @param {string} tileName @returns {string[]}
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
