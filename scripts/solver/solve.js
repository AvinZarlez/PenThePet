/**
 * MILP Solver for Pen the Pet
 *
 * Uses Mixed Integer Linear Programming (GLPK via glpk.js) to find the optimal
 * wall placement that maximises the enclosed area around the pet's home tile.
 *
 * The problem is formulated as a vertex-cut problem with flow-based connectivity:
 * - Binary variables for wall placement (w) and pen membership (s)
 * - Network flow ensures the pen is a connected region containing home
 * - Vertex-cut constraints ensure the pen boundary is entirely walls/water
 * - Boundary tiles are excluded from the pen (pet would escape)
 *
 * Usage (CLI):
 *   echo '{"map": [...], "maxWalls": 7}' | node solve.js
 *   node solve.js --file input.json
 *
 * Input JSON:
 *   map: 2D array of tile type strings ("grass", "water", "home", ...)
 *   maxWalls: Maximum number of walls that can be placed
 *
 * Output JSON:
 *   goalArea: Maximum enclosed area achievable
 *   optimalWallCount: Number of walls used in optimal solution
 *   optimalSolution: Array of [row, col] wall positions
 *   feasible: Whether a valid penning solution exists
 */

'use strict';

const GLPK = require('glpk.js');
const { TILE_DATA } = require('../../js/tiles/tileData.js');

// ---------------------------------------------------------------------------
// Tile data helpers
// ---------------------------------------------------------------------------

function getTileScores() {
    const scores = {};
    for (const [name, data] of Object.entries(TILE_DATA)) {
        scores[name] = data.score;
    }
    return scores;
}

function getTileProperties() {
    const props = {};
    for (const [name, data] of Object.entries(TILE_DATA)) {
        props[name] = {
            blocksMovement: data.blocksMovement,
            wallPlaceable:  data.wallPlaceable,
            wallTransformsTo: data.wallTransformsTo,
        };
    }
    return props;
}

// ---------------------------------------------------------------------------
// Main solver
// ---------------------------------------------------------------------------

/**
 * Solve for optimal wall placement using MILP.
 *
 * Supports fillable tiles (blocksMovement=true AND wallPlaceable=true, e.g. holes).
 * When a wall is placed on a fillable tile, it becomes passable and scores like
 * its wallTransformsTo tile (e.g. hole → filledHole with score=1).
 *
 * @param {string[][]} mapData - 2D array of tile type strings
 * @param {number} maxWalls - Maximum number of walls allowed
 * @returns {{ goalArea, optimalWallCount, optimalSolution, feasible, error? }}
 */
function solveMap(mapData, maxWalls) {
    const glpk = GLPK();
    const tileScores = getTileScores();
    const tileProps  = getTileProperties();

    const rows = mapData.length;
    const cols = mapData[0].length;

    // -----------------------------------------------------------------------
    // Classify tile positions
    // "graphTiles" includes all non-blocking tiles PLUS fillable tiles.
    // -----------------------------------------------------------------------
    const graphTiles    = [];   // All tiles that participate in the MILP graph
    const wallPlaceable = [];   // Tiles where walls can be placed
    const fillableSet   = new Set(); // fillable = blocksMovement AND wallPlaceable
    const tileSet       = new Set(); // fast membership test for adjacency checks
    const tileScoreMap  = {};        // key → score when tile is in pen
    const boundary      = new Set();
    let   home          = null;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const tileName = mapData[r][c];
            const props    = tileProps[tileName] || {};
            const blocks   = props.blocksMovement  || false;
            const placeable = props.wallPlaceable  || false;
            const isFillable = blocks && placeable;

            // Skip purely blocking tiles (water/wall) that cannot be filled
            if (blocks && !placeable) continue;

            const key = `${r},${c}`;
            graphTiles.push([r, c]);
            tileSet.add(key);

            if (isFillable) {
                fillableSet.add(key);
                // Score when filled: use wallTransformsTo tile's score
                const transformed = props.wallTransformsTo;
                tileScoreMap[key] = transformed
                    ? (tileScores[transformed] ?? 1)
                    : 1;
            } else {
                tileScoreMap[key] = tileScores[tileName] ?? 1;
            }

            if (placeable) wallPlaceable.push([r, c]);
            if (tileName === 'home') home = [r, c];
            if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
                boundary.add(key);
            }
        }
    }

    if (!home) {
        return {
            goalArea: 0, optimalWallCount: 0, optimalSolution: [], feasible: false,
            error: 'No home tile found',
        };
    }

    const homeKey = `${home[0]},${home[1]}`;
    if (boundary.has(homeKey)) {
        return {
            goalArea: 0, optimalWallCount: 0, optimalSolution: [], feasible: false,
            error: 'Home is on boundary - cannot pen',
        };
    }

    // -----------------------------------------------------------------------
    // Build directed edges between adjacent graph tiles
    // -----------------------------------------------------------------------
    const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const edges     = [];
    const outEdges  = {};
    const inEdges   = {};

    for (const [r, c] of graphTiles) {
        outEdges[`${r},${c}`] = [];
        inEdges[`${r},${c}`]  = [];
    }
    for (const [r, c] of graphTiles) {
        for (const [dr, dc] of DIRS) {
            const nr = r + dr, nc = c + dc;
            const nk = `${nr},${nc}`;
            if (tileSet.has(nk)) {
                edges.push([[r, c], [nr, nc]]);
                outEdges[`${r},${c}`].push([nr, nc]);
                inEdges[nk].push([r, c]);
            }
        }
    }

    const n            = graphTiles.length;
    const placeableSet = new Set(wallPlaceable.map(([r, c]) => `${r},${c}`));

    // Variable name helpers
    const sVar = ([r, c])                       => `s_${r}_${c}`;
    const wVar = ([r, c])                       => `w_${r}_${c}`;
    const fVar = ([r1, c1], [r2, c2])           => `f_${r1}_${c1}_${r2}_${c2}`;

    // -----------------------------------------------------------------------
    // Build GLPK problem
    // -----------------------------------------------------------------------
    const subjectTo = [];
    const binaries  = [];

    // Declare binary variables
    for (const tile of graphTiles)    binaries.push(sVar(tile));
    for (const tile of wallPlaceable) binaries.push(wVar(tile));

    // --- Constraint 1: home is in the pen -----------------------------------
    subjectTo.push({
        name: 'home_in_pen',
        vars: [{ name: sVar(home), coef: 1 }],
        bnds: { type: glpk.GLP_FX, lb: 1, ub: 1 },
    });

    // --- Constraint 2: boundary tiles are NOT in the pen -------------------
    for (const [r, c] of graphTiles) {
        const key = `${r},${c}`;
        if (boundary.has(key)) {
            subjectTo.push({
                name: `bound_${r}_${c}`,
                vars: [{ name: sVar([r, c]), coef: 1 }],
                bnds: { type: glpk.GLP_FX, lb: 0, ub: 0 },
            });
        }
    }

    // --- Constraint 3a: normal wall-placeable tiles — wall excludes from pen
    // s[tile] + w[tile] <= 1
    for (const tile of wallPlaceable) {
        const key = `${tile[0]},${tile[1]}`;
        if (!fillableSet.has(key)) {
            subjectTo.push({
                name: `wall_excl_${tile[0]}_${tile[1]}`,
                vars: [
                    { name: sVar(tile), coef: 1 },
                    { name: wVar(tile), coef: 1 },
                ],
                bnds: { type: glpk.GLP_UP, lb: 0, ub: 1 },
            });
        }
    }

    // --- Constraint 3b: fillable tiles — only in pen when filled (wall placed)
    // s[tile] <= w[tile]  →  s[tile] - w[tile] <= 0
    for (const [r, c] of graphTiles) {
        const key = `${r},${c}`;
        if (fillableSet.has(key)) {
            subjectTo.push({
                name: `fill_${r}_${c}`,
                vars: [
                    { name: sVar([r, c]), coef:  1 },
                    { name: wVar([r, c]), coef: -1 },
                ],
                bnds: { type: glpk.GLP_UP, lb: 0, ub: 0 },
            });
        }
    }

    // --- Constraint 4: wall budget -----------------------------------------
    if (wallPlaceable.length > 0) {
        subjectTo.push({
            name: 'wall_budget',
            vars: wallPlaceable.map(t => ({ name: wVar(t), coef: 1 })),
            bnds: { type: glpk.GLP_UP, lb: 0, ub: maxWalls },
        });
    }

    // --- Constraint 5: vertex cut ------------------------------------------
    // s[i] - s[j] <= barrier_i + barrier_j
    // where:
    //   barrier_x = w[x]     for normal placeable  (coef -1 on left, RHS +0)
    //   barrier_x = 1 - w[x] for fillable           (coef +1 on left, RHS +1)
    //   barrier_x = 0        for non-placeable
    for (const [[ri, ci], [rj, cj]] of edges) {
        const ki = `${ri},${ci}`;
        const kj = `${rj},${cj}`;
        const vars = [
            { name: sVar([ri, ci]), coef:  1 },
            { name: sVar([rj, cj]), coef: -1 },
        ];
        let ub = 0;

        if (placeableSet.has(ki)) {
            if (fillableSet.has(ki)) {
                vars.push({ name: wVar([ri, ci]), coef: 1 });
                ub += 1;
            } else {
                vars.push({ name: wVar([ri, ci]), coef: -1 });
            }
        }
        if (placeableSet.has(kj)) {
            if (fillableSet.has(kj)) {
                vars.push({ name: wVar([rj, cj]), coef: 1 });
                ub += 1;
            } else {
                vars.push({ name: wVar([rj, cj]), coef: -1 });
            }
        }

        subjectTo.push({
            name: `vcut_${ri}_${ci}_${rj}_${cj}`,
            vars,
            bnds: { type: glpk.GLP_UP, lb: 0, ub },
        });
    }

    // --- Constraint 6: flow conservation (pen connectivity via home) --------
    // Home (source): out_flow - in_flow == sum(s[t] for t != home)
    {
        const vars = [];
        for (const [nr, nc] of outEdges[homeKey]) {
            vars.push({ name: fVar(home, [nr, nc]), coef: 1 });
        }
        for (const [nr, nc] of inEdges[homeKey]) {
            vars.push({ name: fVar([nr, nc], home), coef: -1 });
        }
        for (const [r, c] of graphTiles) {
            if (r !== home[0] || c !== home[1]) {
                vars.push({ name: sVar([r, c]), coef: -1 });
            }
        }
        subjectTo.push({
            name: 'flow_home',
            vars,
            bnds: { type: glpk.GLP_FX, lb: 0, ub: 0 },
        });
    }

    // Non-home tiles: in_flow - out_flow == s[tile]
    for (const [r, c] of graphTiles) {
        if (r === home[0] && c === home[1]) continue;
        const key  = `${r},${c}`;
        const vars = [];
        for (const [nr, nc] of inEdges[key]) {
            vars.push({ name: fVar([nr, nc], [r, c]), coef: 1 });
        }
        for (const [nr, nc] of outEdges[key]) {
            vars.push({ name: fVar([r, c], [nr, nc]), coef: -1 });
        }
        vars.push({ name: sVar([r, c]), coef: -1 });
        subjectTo.push({
            name: `flow_${r}_${c}`,
            vars,
            bnds: { type: glpk.GLP_FX, lb: 0, ub: 0 },
        });
    }

    // --- Constraint 7: flow capacity — flow only through pen tiles ----------
    // f[(i,j)] <= n * s[i]  and  f[(i,j)] <= n * s[j]
    for (const [[ri, ci], [rj, cj]] of edges) {
        const fv = fVar([ri, ci], [rj, cj]);
        subjectTo.push({
            name: `fcap_i_${ri}_${ci}_${rj}_${cj}`,
            vars: [
                { name: fv,                coef:  1 },
                { name: sVar([ri, ci]),    coef: -n },
            ],
            bnds: { type: glpk.GLP_UP, lb: 0, ub: 0 },
        });
        subjectTo.push({
            name: `fcap_j_${ri}_${ci}_${rj}_${cj}`,
            vars: [
                { name: fv,                coef:  1 },
                { name: sVar([rj, cj]),    coef: -n },
            ],
            bnds: { type: glpk.GLP_UP, lb: 0, ub: 0 },
        });
    }

    // -----------------------------------------------------------------------
    // Objective: maximise enclosed area with tiny wall penalty as tiebreaker
    // -----------------------------------------------------------------------
    const objVars = [];
    for (const [r, c] of graphTiles) {
        const key = `${r},${c}`;
        objVars.push({ name: sVar([r, c]), coef: tileScoreMap[key] ?? 1 });
    }
    for (const tile of wallPlaceable) {
        objVars.push({ name: wVar(tile), coef: -0.0001 });
    }

    const lp = {
        name: 'PenThePet',
        objective: {
            direction: glpk.GLP_MAX,
            name: 'obj',
            vars: objVars,
        },
        subjectTo,
        binaries,
    };

    // -----------------------------------------------------------------------
    // Solve (120 s time limit, silent output)
    // -----------------------------------------------------------------------
    const opts = { msglev: glpk.GLP_MSG_OFF, tmlim: 120 };
    const result = glpk.solve(lp, opts);

    if (result.result.status !== glpk.GLP_OPT) {
        return {
            goalArea: 0, optimalWallCount: 0, optimalSolution: [], feasible: false,
            error: `Solver status: ${result.result.status}`,
        };
    }

    const goalArea = Math.round(result.result.z);
    const wallPositions = [];
    for (const tile of wallPlaceable) {
        const val = result.result.vars[wVar(tile)];
        if (val !== undefined && val > 0.5) {
            wallPositions.push([tile[0], tile[1]]);
        }
    }

    return {
        goalArea,
        optimalWallCount: wallPositions.length,
        optimalSolution: wallPositions,
        feasible: true,
    };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function main() {
    const fs   = require('fs');
    const args = process.argv.slice(2);

    let fileArg = null;
    for (let i = 0; i < args.length; i++) {
        if ((args[i] === '--file' || args[i] === '-f') && i + 1 < args.length) {
            fileArg = args[++i];
        }
    }

    let inputData;
    try {
        const raw = fileArg
            ? fs.readFileSync(fileArg, 'utf-8')
            : fs.readFileSync('/dev/stdin', 'utf-8');
        inputData = JSON.parse(raw);
    } catch (err) {
        process.stderr.write(`Failed to read input: ${err.message}\n`);
        process.exit(1);
    }

    const result = solveMap(inputData.map, inputData.maxWalls);
    process.stdout.write(JSON.stringify(result) + '\n');
}

module.exports = { solveMap };

if (require.main === module) {
    main();
}
