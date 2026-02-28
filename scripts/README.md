# scripts/

This folder contains the offline Node.js scripts used to generate and audit maps. These scripts run outside the browser (locally or via GitHub Actions) and write to `maps.json`.

## What belongs here

- Offline map generation and audit scripts (Node.js)
- Subdirectories for shared utilities (`lib/`) and the MILP solver pipeline (`solver/`)

Do **not** add browser-loaded code here. Browser code lives in `js/`.

## Documentation

- File-by-file descriptions and CLI usage: **[../docs/CODE_STRUCTURE.md#scripts-scripts-directory](../docs/CODE_STRUCTURE.md#scripts-scripts-directory)**
- Map generation algorithm and metadata structure: **[../docs/MAP_GENERATION.md](../docs/MAP_GENERATION.md)**
