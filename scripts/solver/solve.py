#!/usr/bin/env python3
"""
MILP Solver for Pen the Pet

Uses Mixed Integer Linear Programming (PuLP + CBC) to find the optimal
wall placement that maximizes the enclosed area around the pet's home tile.

The problem is formulated as a vertex-cut problem with flow-based connectivity:
- Binary variables for wall placement and pen membership
- Network flow ensures the pen is a connected region containing home
- Vertex-cut constraints ensure the pen boundary is entirely walls/water
- Boundary tiles are excluded from the pen (pet would escape)

Usage:
    echo '{"map": [...], "maxWalls": 7}' | python3 solve.py
    python3 solve.py --file input.json

Input JSON:
    map: 2D array of tile types ("grass", "water", "home")
    maxWalls: Maximum number of walls that can be placed

Output JSON:
    goalArea: Maximum enclosed area achievable
    optimalWallCount: Number of walls used in optimal solution
    optimalSolution: Array of [row, col] wall positions
    feasible: Whether a valid penning solution exists
"""

import sys
import json
import os
import argparse
from pulp import LpProblem, LpMaximize, LpVariable, lpSum, value, PULP_CBC_CMD


def load_tile_data():
    """
    Load tile data from the shared tileData.json (single source of truth).

    Returns:
        dict mapping tile name (str) → dict of all tile properties
    """
    json_path = os.path.join(os.path.dirname(__file__), '..', '..', 'tileData.json')
    with open(json_path, 'r') as fh:
        return json.load(fh)


def load_tile_scores():
    """
    Load tile score values from the shared tileData.json.

    Returns:
        dict mapping tile name (str) → score (int)
    """
    tile_data = load_tile_data()
    return {name: data['score'] for name, data in tile_data.items()}


def load_tile_properties():
    """
    Load tile properties from the shared tileData.json.

    Returns:
        dict mapping tile name (str) → dict with blocksMovement, wallPlaceable
    """
    tile_data = load_tile_data()
    return {
        name: {
            'blocksMovement': data['blocksMovement'],
            'wallPlaceable': data['wallPlaceable'],
        }
        for name, data in tile_data.items()
    }


def solve_map(map_data, max_walls):
    """
    Solve for optimal wall placement using MILP.

    Args:
        map_data: 2D list of tile type strings ("grass", "water", "home", "star", etc.)
        max_walls: Maximum number of walls allowed

    Returns:
        dict with goalArea, optimalWallCount, optimalSolution, feasible
    """
    tile_scores = load_tile_scores()
    tile_props = load_tile_properties()
    rows = len(map_data)
    cols = len(map_data[0])

    # Identify tile positions by iterating all tiles programmatically
    non_water = []         # All passable tile positions (r, c)
    wall_placeable = []    # Tiles where walls can be placed
    home = None
    boundary = set()       # Boundary tile positions
    tile_score_map = {}    # Map (r,c) → score value for objective

    tile_set = set()
    for r in range(rows):
        for c in range(cols):
            tile = map_data[r][c]
            # Skip tiles that block movement (e.g. water)
            props = tile_props.get(tile, {})
            if props.get('blocksMovement', False):
                continue
            non_water.append((r, c))
            tile_set.add((r, c))
            tile_score_map[(r, c)] = tile_scores.get(tile, 1)
            # Wall-placeable tiles from tile data
            if props.get('wallPlaceable', False):
                wall_placeable.append((r, c))
            if tile == 'home':
                home = (r, c)
            # Boundary = edge of grid
            if r == 0 or r == rows - 1 or c == 0 or c == cols - 1:
                boundary.add((r, c))

    if home is None:
        return {"goalArea": 0, "optimalWallCount": 0, "optimalSolution": [], "feasible": False,
                "error": "No home tile found"}

    # Check if home is on boundary (unsolvable)
    if home in boundary:
        return {"goalArea": 0, "optimalWallCount": 0, "optimalSolution": [], "feasible": False,
                "error": "Home is on boundary - cannot pen"}

    # Build directed edges between adjacent non-water tiles
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    edges = []
    out_edges = {t: [] for t in non_water}
    in_edges = {t: [] for t in non_water}

    for (r, c) in non_water:
        for dr, dc in directions:
            nr, nc = r + dr, c + dc
            if (nr, nc) in tile_set:
                edges.append(((r, c), (nr, nc)))
                out_edges[(r, c)].append((nr, nc))
                in_edges[(nr, nc)].append((r, c))

    n = len(non_water)
    placeable_set = set(wall_placeable)

    # Create MILP problem
    prob = LpProblem("PenThePet", LpMaximize)

    # Variables: s[i] = 1 if tile i is in the pen (home-side)
    s = {}
    for tile in non_water:
        s[tile] = LpVariable(f"s_{tile[0]}_{tile[1]}", cat='Binary')

    # Variables: w[i] = 1 if wall placed on a wall-placeable tile i
    w = {}
    for tile in wall_placeable:
        w[tile] = LpVariable(f"w_{tile[0]}_{tile[1]}", cat='Binary')

    # Variables: f[(i,j)] = flow from tile i to tile j
    f = {}
    for (i, j) in edges:
        f[(i, j)] = LpVariable(f"f_{i[0]}_{i[1]}_{j[0]}_{j[1]}", lowBound=0)

    # Objective: maximize enclosed area using per-tile score values from tileData
    prob += lpSum(
        tile_score_map.get(tile, 1) * s[tile]
        for tile in non_water
    )

    # Constraint 1: home is in the pen
    prob += s[home] == 1

    # Constraint 2: boundary tiles are NOT in the pen
    for tile in non_water:
        if tile in boundary:
            prob += s[tile] == 0

    # Constraint 3: walled tiles are NOT in the pen
    for tile in wall_placeable:
        prob += s[tile] <= 1 - w[tile]

    # Constraint 4: wall budget
    prob += lpSum(w[tile] for tile in wall_placeable) <= max_walls

    # Constraint 5: vertex cut - adjacent tiles on different sides need a wall
    # For each edge (i,j): s[i] - s[j] <= w_i + w_j
    for (i, j) in edges:
        w_i = w[i] if i in placeable_set else 0  # home has no wall variable
        w_j = w[j] if j in placeable_set else 0
        prob += s[i] - s[j] <= w_i + w_j

    # Constraint 6: flow conservation (ensures connectivity of pen to home)
    # At home: net outflow = total pen tiles minus home
    prob += (
        lpSum(f[(home, j)] for j in out_edges[home] if (home, j) in f) -
        lpSum(f[(j, home)] for j in in_edges[home] if (j, home) in f)
    ) == lpSum(s[tile] for tile in non_water if tile != home)

    # At other tiles: net inflow = s[tile]
    for tile in non_water:
        if tile == home:
            continue
        inflow = lpSum(f[(j, tile)] for j in in_edges[tile] if (j, tile) in f)
        outflow = lpSum(f[(tile, j)] for j in out_edges[tile] if (tile, j) in f)
        prob += inflow - outflow == s[tile]

    # Constraint 7: flow capacity - flow only through pen tiles
    for (i, j) in edges:
        prob += f[(i, j)] <= n * s[i]
        prob += f[(i, j)] <= n * s[j]

    # Solve with CBC (bundled with PuLP)
    solver = PULP_CBC_CMD(msg=0, timeLimit=120)
    prob.solve(solver)

    # Check solution status
    if prob.status != 1:
        return {"goalArea": 0, "optimalWallCount": 0, "optimalSolution": [], "feasible": False,
                "error": f"Solver status: {prob.status}"}

    # Extract solution
    goal_area = int(round(value(prob.objective)))
    wall_positions = []
    for tile in wall_placeable:
        if value(w[tile]) is not None and value(w[tile]) > 0.5:
            wall_positions.append(list(tile))

    return {
        "goalArea": goal_area,
        "optimalWallCount": len(wall_positions),
        "optimalSolution": wall_positions,
        "feasible": True
    }


def main():
    parser = argparse.ArgumentParser(description='MILP Solver for Pen the Pet')
    parser.add_argument('--file', '-f', help='Input JSON file (default: read from stdin)')
    args = parser.parse_args()

    # Read input
    if args.file:
        with open(args.file, 'r') as fh:
            input_data = json.load(fh)
    else:
        input_data = json.load(sys.stdin)

    map_data = input_data['map']
    max_walls = input_data['maxWalls']

    # Solve
    result = solve_map(map_data, max_walls)

    # Output
    print(json.dumps(result))


if __name__ == '__main__':
    main()
