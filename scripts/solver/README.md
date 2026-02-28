# scripts/solver/

This folder contains the MILP solver pipeline used during map generation to find the provably optimal wall placement and maximum pennable area for each map.

## What belongs here

- `MILPSolver.js` — Node.js wrapper that spawns the Python solver as a subprocess
- `solve.py` — Python MILP solver using PuLP + CBC
- `requirements.txt` — Python dependencies (`pulp`)

This code runs offline only (locally or in GitHub Actions). It is never loaded in the browser.

## Documentation

For a full explanation of the algorithm, solver constraints, and how to run map generation, see **[../../docs/MAP_GENERATION.md](../../docs/MAP_GENERATION.md)**.
