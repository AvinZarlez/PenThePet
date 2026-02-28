# scripts/solver/

This folder contains the MILP solver pipeline used during map generation to find the provably optimal wall placement and maximum pennable area for each map.

## What belongs here

- The Node.js solver wrapper and Python MILP solver
- Python dependency specification (`requirements.txt`)

This code runs offline only (locally or in GitHub Actions). It is never loaded in the browser.

## Documentation

For a full explanation of the algorithm, solver constraints, file descriptions, and how to run map generation, see **[../../docs/MAP_GENERATION.md](../../docs/MAP_GENERATION.md)**.
