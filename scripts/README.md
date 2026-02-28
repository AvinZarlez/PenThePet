# scripts/

This folder contains the offline Node.js scripts used to generate and audit maps. These scripts run outside the browser (locally or via GitHub Actions) and write to `maps.json`.

## What belongs here

- `generate-map.js` — entry point for generating one or more maps and appending them to `maps.json`
- `audit-maps.js` — validates every map in `maps.json` against `MapValidator` rules
- `lib/` — shared pure utility functions used by the scripts above
- `solver/` — the MILP solver pipeline (Node.js wrapper + Python solver)

Do **not** add browser-loaded code here. Browser code lives in `js/`.

## Documentation

- Map generation algorithm, CLI usage, and metadata structure: **[../docs/MAP_GENERATION.md](../docs/MAP_GENERATION.md)**
- File-by-file descriptions: **[../docs/CODE_STRUCTURE.md](../docs/CODE_STRUCTURE.md)**
