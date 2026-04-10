# Changelog

All notable changes to PenThePet are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Version numbers follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
(`MAJOR.MINOR.PATCH`): bump **MAJOR** for breaking changes, **MINOR** for new
features or content, **PATCH** for routine map additions.

---

## [1.1.0] — 2026-04-10 — First Official Release

This is the first official release of PenThePet.

### Added

- Daily logic puzzle: fence in your pet by placing walls around the grid.
- Tile system with grass, water, shore, rocks, trees, flowers, and more.
- BFS-based penning detection (`PathfindingUtils`).
- Score calculator with time and hint bonuses.
- Hint system with animated paw indicators.
- Game timer with pause/resume support.
- Level selector and day-number navigation.
- Share / copy result to clipboard.
- Optional Firebase Cloud Sync (persist progress across devices).
- Optional Firebase Analytics (anonymous, opt-in).
- Offline map generation pipeline: Node.js + Python MILP solver (PuLP + CBC).
- Level editor for authoring and submitting custom maps.
- GitHub Actions workflows for automated map generation, addition, and editing.
- Full Jest test suite with coverage enforcement.
- ESLint, markdownlint, and yamllint CI checks.
- GitHub Pages deployment via static workflow.

[1.1.0]: https://github.com/AvinZarlez/penthepet/releases/tag/v1.1.0
