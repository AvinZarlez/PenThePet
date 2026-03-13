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
import subprocess
import argparse
from pulp import LpProblem, LpMaximize, LpVariable, lpSum, value, PULP_CBC_CMD


def load_tile_data():
    """
    Load tile data from js/tileData.js (single source of truth).

    Uses Node.js to require() the JS module and output tile data as JSON.
    This avoids duplicating tile definitions — the JS file is the only place
    where score, wallPlaceable, blocksMovement, etc. are defined.

    Returns:
        dict mapping tile name (str) → dict of all tile properties
    """
    js_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), '..', '..', 'js', 'tileData.js')
    )
    # Use JSON to safely escape the path in the Node.js expression
    safe_path = json.dumps(js_path.replace('\\', '/'))
    node_script = (
        f'const t = require({safe_path}); '
        'const d = {}; '
        'for (const [k, v] of Object.entries(t.TILE_DATA)) { '
        '  const e = {...v}; delete e.ariaLabel; d[k] = e; '
        '} '
        'console.log(JSON.stringify(d));'
    )
    try:
        result = subprocess.run(
            ['node', '-e', node_script],
            capture_output=True, text=True, check=True,
        )
    except FileNotFoundError:
        raise RuntimeError(
            'Node.js is required to load tile data from js/tileData.js. '
            'Please install Node.js (v24+).'
        )
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(
            f'Failed to load tile data from {js_path}: {exc.stderr.strip()}'
        )
    return json.loads(result.stdout)


def load_tile_scores():
    """
    Load tile score values from js/tileData.js (single source of truth).

    Returns:
        dict mapping tile name (str) → score (int)
    """
    tile_data = load_tile_data()
    return {name: data['score'] for name, data in tile_data.items()}


def load_tile_properties():
    """
    Load tile properties from js/tileData.js (single source of truth).

    Returns:
        dict mapping tile name (str) → dict with blocksMovement, wallPlaceable,
        wallTransformsTo (optional)
    """
    tile_data = load_tile_data()
    return {
        name: {
            'blocksMovement': data['blocksMovement'],
            'wallPlaceable': data['wallPlaceable'],
            'wallTransformsTo': data.get('wallTransformsTo'),
        }
        for name, data in tile_data.items()
    }


def solve_map(map_data, max_walls):
    """
    Solve for optimal wall placement using MILP.

    Supports fillable tiles (blocksMovement=True AND wallPlaceable=True, e.g. holes).
    When a wall is placed on a fillable tile, it becomes passable and scores like
    its wallTransformsTo tile (e.g. hole → filledHole with score=1).

    Args:
        map_data: 2D list of tile type strings ("grass", "water", "home", "star", "hole", etc.)
        max_walls: Maximum number of walls allowed

    Returns:
        dict with goalArea, optimalWallCount, optimalSolution, feasible
    """
    tile_scores = load_tile_scores()
    tile_props = load_tile_properties()
    rows = len(map_data)
    cols = len(map_data[0])

    # Classify tile positions.
    # "graph_tiles" includes all non-blocking tiles PLUS fillable tiles (which
    # block when empty but become passable when filled).
    graph_tiles = []       # All tiles that participate in the MILP graph
    wall_placeable = []    # Tiles where walls can be placed (includes fillable)
    fillable_set = set()   # Fillable tile positions (blocksMovement AND wallPlaceable)
    home = None
    boundary = set()
    tile_score_map = {}    # (r,c) → score when in pen

    tile_set = set()
    for r in range(rows):
        for c in range(cols):
            tile = map_data[r][c]
            props = tile_props.get(tile, {})
            blocks = props.get('blocksMovement', False)
            placeable = props.get('wallPlaceable', False)
            is_fillable = blocks and placeable

            # Skip purely blocking tiles (water) that can't be filled
            if blocks and not placeable:
                continue

            graph_tiles.append((r, c))
            tile_set.add((r, c))

            if is_fillable:
                fillable_set.add((r, c))
                # Score when filled: use wallTransformsTo tile's score
                transformed = props.get('wallTransformsTo')
                tile_score_map[(r, c)] = tile_scores.get(transformed, 1) if transformed else 1
            else:
                tile_score_map[(r, c)] = tile_scores.get(tile, 1)

            if placeable:
                wall_placeable.append((r, c))
            if tile == 'home':
                home = (r, c)
            if r == 0 or r == rows - 1 or c == 0 or c == cols - 1:
                boundary.add((r, c))

    if home is None:
        return {"goalArea": 0, "optimalWallCount": 0, "optimalSolution": [], "feasible": False,
                "error": "No home tile found"}

    if home in boundary:
        return {"goalArea": 0, "optimalWallCount": 0, "optimalSolution": [], "feasible": False,
                "error": "Home is on boundary - cannot pen"}

    # Build directed edges between adjacent graph tiles
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    edges = []
    out_edges = {t: [] for t in graph_tiles}
    in_edges = {t: [] for t in graph_tiles}

    for (r, c) in graph_tiles:
        for dr, dc in directions:
            nr, nc = r + dr, c + dc
            if (nr, nc) in tile_set:
                edges.append(((r, c), (nr, nc)))
                out_edges[(r, c)].append((nr, nc))
                in_edges[(nr, nc)].append((r, c))

    n = len(graph_tiles)
    placeable_set = set(wall_placeable)

    # Create MILP problem
    prob = LpProblem("PenThePet", LpMaximize)

    # Variables: s[i] = 1 if tile i is in the pen
    s = {}
    for tile in graph_tiles:
        s[tile] = LpVariable(f"s_{tile[0]}_{tile[1]}", cat='Binary')

    # Variables: w[i] = 1 if wall placed on a wall-placeable tile i
    w = {}
    for tile in wall_placeable:
        w[tile] = LpVariable(f"w_{tile[0]}_{tile[1]}", cat='Binary')

    # Variables: f[(i,j)] = flow from tile i to tile j
    f = {}
    for (i, j) in edges:
        f[(i, j)] = LpVariable(f"f_{i[0]}_{i[1]}_{j[0]}_{j[1]}", lowBound=0)

    # Objective: maximize enclosed area using per-tile score values.
    # Tiny wall penalty as tiebreaker for minimum wall count.
    prob += lpSum(
        tile_score_map.get(tile, 1) * s[tile]
        for tile in graph_tiles
    ) - 0.0001 * lpSum(w[tile] for tile in wall_placeable)

    # Constraint 1: home is in the pen
    prob += s[home] == 1

    # Constraint 2: boundary tiles are NOT in the pen
    for tile in graph_tiles:
        if tile in boundary:
            prob += s[tile] == 0

    # Constraint 3a: Normal wall-placeable tiles — walled tiles are NOT in pen
    for tile in wall_placeable:
        if tile not in fillable_set:
            prob += s[tile] <= 1 - w[tile]

    # Constraint 3b: Fillable tiles — can only be in pen when filled (wall placed)
    # When w[tile]=0 (unfilled), s[tile]=0 (blocks movement, not in pen)
    # When w[tile]=1 (filled), s[tile] can be 0 or 1 (passable, may be in pen)
    for tile in fillable_set:
        prob += s[tile] <= w[tile]

    # Constraint 4: wall budget
    prob += lpSum(w[tile] for tile in wall_placeable) <= max_walls

    # Constraint 5: vertex cut — adjacent tiles on different sides need a barrier.
    # For normal tiles: barrier = w[tile] (wall placed = barrier)
    # For fillable tiles: barrier = 1 - w[tile] (unfilled = barrier, filled = passable)
    for (i, j) in edges:
        if i in placeable_set:
            barrier_i = (1 - w[i]) if i in fillable_set else w[i]
        else:
            barrier_i = 0
        if j in placeable_set:
            barrier_j = (1 - w[j]) if j in fillable_set else w[j]
        else:
            barrier_j = 0
        prob += s[i] - s[j] <= barrier_i + barrier_j

    # Constraint 6: flow conservation (pen connectivity via home)
    prob += (
        lpSum(f[(home, j)] for j in out_edges[home] if (home, j) in f) -
        lpSum(f[(j, home)] for j in in_edges[home] if (j, home) in f)
    ) == lpSum(s[tile] for tile in graph_tiles if tile != home)

    for tile in graph_tiles:
        if tile == home:
            continue
        inflow = lpSum(f[(j, tile)] for j in in_edges[tile] if (j, tile) in f)
        outflow = lpSum(f[(tile, j)] for j in out_edges[tile] if (tile, j) in f)
        prob += inflow - outflow == s[tile]

    # Constraint 7: flow capacity — flow only through pen tiles
    for (i, j) in edges:
        prob += f[(i, j)] <= n * s[i]
        prob += f[(i, j)] <= n * s[j]

    # Solve with CBC
    solver = PULP_CBC_CMD(msg=0, timeLimit=120)
    prob.solve(solver)

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
