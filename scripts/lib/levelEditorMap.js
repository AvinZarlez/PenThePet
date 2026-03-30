const CONSTANTS = require('../../js/config/constants.js');
const MapValidator = require('../../js/generation/MapValidator.js');
const MILPSolver = require('../solver/MILPSolver.js');
const MapURLCodec = require('../../js/common/MapURLCodec.js');
const { encodeCompactMap, encodeCompactSolution, parseCompactMap } = require('../../js/game/Grid.js');
const { TILE_TO_NUMERIC } = require('../../js/tiles/tileData.js');

function toNumericMap(stringMap) {
    return stringMap.map((row) => row.map((tile) => TILE_TO_NUMERIC[tile] !== undefined ? TILE_TO_NUMERIC[tile] : TILE_TO_NUMERIC.grass));
}

function ensureSingleHome(map) {
    let homes = 0;
    for (const row of map) {
        for (const tile of row) {
            if (tile === 'home') homes++;
        }
    }
    if (homes !== 1) {
        throw new Error(`Map must contain exactly one home tile (found ${homes})`);
    }
}

function buildPlayableUrl(encoded) {
    return `${CONSTANTS.LIVE_GAME_URL}?map=${encoded}`;
}

function solveAndValidateEditorMap(input) {
    if (!input || !Array.isArray(input.map) || input.map.length === 0) {
        throw new Error('Invalid map payload');
    }
    const size = input.size || input.map.length;
    if (input.map.length !== size || input.map.some((row) => !Array.isArray(row) || row.length !== size)) {
        throw new Error('Map shape does not match size');
    }
    ensureSingleHome(input.map);

    const maxWalls = input.maxWalls !== undefined ? input.maxWalls : CONSTANTS.maxWallsForSize(size);
    const numericMap = toNumericMap(input.map);
    const solution = MILPSolver.solveMap(numericMap, maxWalls);
    if (!solution) {
        return {
            ok: false,
            error: 'Solver could not find a feasible solution for this map.',
            validationErrors: [],
        };
    }

    const validation = MapValidator.validate(input.map, {
        goalArea: solution.goalArea,
        optimalWallCount: solution.optimalWallCount,
        optimalSolution: solution.walls
            .flatMap((row, r) => row.map((v, c) => (v ? [r, c] : null)).filter(Boolean)),
        maxWalls,
    });

    if (!validation.valid) {
        return {
            ok: false,
            error: 'Map failed validation.',
            validationErrors: validation.errors,
        };
    }

    const optimalPairs = [];
    for (let r = 0; r < solution.walls.length; r++) {
        for (let c = 0; c < solution.walls[r].length; c++) {
            if (solution.walls[r][c]) optimalPairs.push([r, c]);
        }
    }
    const compactMap = encodeCompactMap(input.map);
    const compactSolution = encodeCompactSolution(optimalPairs);
    const mapName = input.levelName || CONSTANTS.LEVEL_EDITOR.DEFAULT_LEVEL_NAME;
    const mapData = {
        v: MapURLCodec.CODEC_VERSION,
        date: '',
        mapName,
        size,
        goal: solution.goalArea,
        maxWalls,
        map: compactMap,
        optimalSolution: compactSolution,
        dayNumber: null,
    };
    const encoded = MapURLCodec.encodeMapData(mapData);
    return {
        ok: true,
        mapData,
        encoded,
        playableUrl: buildPlayableUrl(encoded),
        validationErrors: [],
    };
}

function decodeEditorMapCode(encoded) {
    const decoded = MapURLCodec.decodeMapData(encoded);
    if (!decoded) {
        throw new Error('Invalid map code');
    }
    const map = parseCompactMap(decoded.map, decoded.size);
    return {
        ...decoded,
        map,
    };
}

module.exports = {
    solveAndValidateEditorMap,
    decodeEditorMapCode,
    buildPlayableUrl,
    ensureSingleHome,
};
