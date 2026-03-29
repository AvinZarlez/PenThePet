# scripts/solver/

This folder contains the MILP solver pipeline used during map generation to find the provably optimal wall placement and maximum pennable area for each map.

## What belongs here

- The Node.js solver wrapper (`MILPSolver.js`) and the JavaScript MILP solver (`solve.js`, powered by glpk.js)

This code runs offline only (locally or in GitHub Actions). It is never loaded in the browser.

## Documentation

For a full explanation of the algorithm, solver constraints, file descriptions, and how to run map generation, see **[../../docs/MAP_GENERATION.md](../../docs/MAP_GENERATION.md)**.
