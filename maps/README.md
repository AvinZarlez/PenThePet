# maps/

This folder contains the pre-generated daily map data, split into one JSON file per year.

## File Format

Each file is named `YYYY.json` (e.g. `2026.json`) and contains a JSON object keyed by date (`YYYY-MM-DD`), with one entry per daily puzzle.

## Documentation

- Map data format, generation algorithm, and metadata structure: **[../docs/MAP_GENERATION.md](../docs/MAP_GENERATION.md)**
- Generation scripts and how to add new maps: **[../scripts/README.md](../scripts/README.md)**
