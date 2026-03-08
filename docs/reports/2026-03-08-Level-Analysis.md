# Level Analysis Report

**Date:** 2026-03-08
**Latest commit at time of writing:** `cb5b914` — *Update tester ID in game-testers.json*
**Maps analysed:** `maps/2026.json` (307 levels) + `maps/2027.json` (58 levels) = **365 levels total**

> Statistics may change as new maps are added or existing maps are regenerated.

---

## 1. Holes

### Percentage of levels that contain at least one hole

| Metric | Count | Percentage |
|--------|------:|----------:|
| Levels with no holes | 250 | 68.5% |
| **Levels with at least one hole** | **115** | **31.5%** |
| Total levels | 365 | 100% |

### Of levels with holes — how many require filling at least one hole in the optimal solution?

| Metric | Count | Percentage of hole levels |
|--------|------:|--------------------------:|
| Optimal solution does **not** fill any hole | 95 | 82.6% |
| **Optimal solution fills at least one hole** | **20** | **17.4%** |
| Total levels with holes | 115 | 100% |

---

## 2. Size Distribution

How many levels exist at each grid size (size = one side of the square grid):

| Grid Size | Level Count | Bar |
|----------:|------------:|-----|
| 7  | 37 | ████████████████████████████████████ |
| 8  | 31 | ███████████████████████████████ |
| 9  | 22 | ██████████████████████ |
| 10 | 31 | ███████████████████████████████ |
| 11 | 49 | █████████████████████████████████████████████████ |
| 12 | 41 | █████████████████████████████████████████ |
| 13 | 41 | █████████████████████████████████████████ |
| 14 | 36 | ████████████████████████████████████ |
| 15 | 30 | ██████████████████████████████ |
| 16 | 27 | ███████████████████████████ |
| 17 | 20 | ████████████████████ |

*Each █ represents 1 level.*

---

## 3. Average Number of Bees

**Average bees per level: 2.01**

(Bees are `-3` point tiles. Penning a bee subtracts 3 from your score.)

---

## 4. Average Number of Stars

**Average stars per level: 4.32**

(Stars are `+3` point tiles. Penning a star adds 3 to your score.)

---

## 5. Average Goal by Map Size

| Grid Size | Avg Goal | Level Count |
|----------:|---------:|------------:|
| 7  |  8.3 | 37 |
| 8  | 13.4 | 31 |
| 9  | 14.8 | 22 |
| 10 | 23.8 | 31 |
| 11 | 30.0 | 49 |
| 12 | 40.0 | 41 |
| 13 | 43.4 | 41 |
| 14 | 56.9 | 36 |
| 15 | 70.3 | 30 |
| 16 | 81.9 | 27 |
| 17 | 96.5 | 20 |

Goal scales non-linearly with grid size — larger grids offer exponentially more area to pen.

---

## 6. Extremes

### Level with the Largest Goal

| Field | Value |
|-------|-------|
| **Date** | 2026-08-25 |
| **Map Name** | Winter |
| **Grid Size** | 16 |
| **Goal** | **124** |

### Level with the Smallest Goal

| Field | Value |
|-------|-------|
| **Date** | 2026-03-30 |
| **Map Name** | Dolphin |
| **Grid Size** | 7 |
| **Goal** | **5** |

---

## Methodology

- All map data read directly from `maps/2026.json` and `maps/2027.json`.
- **Hole detection:** a level "has holes" if its compact map string contains the character `o`.
- **Hole filled in optimal solution:** the `optimalSolution` array encodes wall placements as `[row, col, row, col, ...]` pairs. A hole is considered filled if any `(row, col)` pair in the solution corresponds to an `o` tile in the decoded map grid.
- **Bees / Stars:** counted by occurrences of characters `b` / `s` in the compact map string.
- **Goal:** taken directly from each map's `goal` field (the target score produced by the MILP solver for the optimal pen).
