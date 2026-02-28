# test/generation/

This folder contains Jest tests for the offline map generation pipeline.

## What belongs here

- Tests for `MapGenerator`, `MapValidator`, and the `generate-map` / `generate-maps` scripts
- Any new test files for generation-related modules in `js/` or `scripts/`

## Test files

| File | What it tests |
|------|---------------|
| `MapGenerator.test.js` | Map generation logic (39 tests) |
| `MapValidator.test.js` | Map validation rules (7 tests) |
| `generate-map.test.js` | Single-map generation script |
| `generate-maps.test.js` | Batch generation script (20 tests) |

Run these tests with:

```bash
npm run test:generation
```

## Documentation

For the full testing guide, see **[../../docs/TESTING.md](../../docs/TESTING.md)**.
