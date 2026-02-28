# Building PenThePet: A Daily Puzzle Game with AI as Co-Pilot

*A technical journey through 48 pull requests, exploring what works—and what doesn't—when building software with AI coding assistants.*

---

## The Origin: Building Something Better

I decided to experiment with "vibe coding" a game because there was another puzzle game I enjoyed, but I wasn't thrilled with the person who made it. I could try making it myself—not just a quick demo, but something I might actually want to use and share with friends. I also wanted to add features that weren't in the original, so this was my opportunity to build something custom to my preferences.

I chose GitHub Pages for hosting and decided to build it in pure HTML5 and JavaScript—no frameworks, no build tools, just code that runs directly in the browser. The game needed to work across devices, from phones to desktops. Most importantly, it needed to generate a fresh puzzle to play once a day, making it a daily ritual like Wordle or the New York Times crossword.

The twist: I wanted to use GitHub Copilot extensively as my primary development tool. Could AI build most of the game structure without me touching code directly? The hypothesis was intriguing—let the AI handle the boilerplate, the repetitive patterns, the scaffolding, while I focused on design decisions and verification. Some areas would prove this hypothesis brilliantly correct. Others, particularly the puzzle generation algorithms, would require far more human intervention than expected.

This article chronicles that journey through 48 merged pull requests, examining what AI coding assistants excel at, where they struggle, and the lessons learned about effective human-AI collaboration in software development. Whether you're a developer curious about AI-assisted coding or skeptical about its practical value, this real-world example offers concrete insights into both the promise and limitations of this emerging development paradigm.

---

## Phase 1: Foundation - Building the Core Game

### Day One: The Grid System

The first pull request set the foundation: a grid-based puzzle game with a modular architecture. I gave Copilot a simple prompt: "Create a grid-based game where each square is either grass or water, and you can click grass tiles to build walls." Within minutes, Copilot had generated a complete scaffolding with separate files for configuration (`config.js`), tile definitions (`tileTypes.js`), grid logic (`Grid.js`), and game controller (`Game.js`).

The architecture was surprisingly clean. The `Grid` class handled data structure and generation, randomizing an 8×8 grid with 70% grass and 30% water tiles. The `Game` class managed rendering and user interactions, painting the grid to the DOM with CSS classes for styling. Everything was built with ES6 classes, proper separation of concerns, and a configuration-driven design that made customization easy.

```javascript
class Grid {
    constructor(size = 8) {
        this.size = size;
        this.tiles = [];
        this.generate();
    }
    
    generate() {
        for (let i = 0; i < this.size; i++) {
            this.tiles[i] = [];
            for (let j = 0; j < this.size; j++) {
                const isWater = Math.random() < 0.3;
                this.tiles[i][j] = isWater ? 'water' : 'grass';
            }
        }
    }
}
```

Copilot excelled at this scaffolding work. Given a clear description of the desired structure, it generated working code that followed modern JavaScript practices. The AI understood ES6 classes, modular file organization, and even suggested a `CONFIG` object for centralized settings. This was AI at its best: rapid prototyping of well-defined, straightforward functionality.

### Adding Game Mechanics

Pull request #4 added the core mechanic: wall placement. Players could click grass tiles to build walls, with a limit of 9 walls. Once the limit was reached, a notification would appear. Clicking an existing wall would remove it, allowing players to reuse their limited walls strategically.

The implementation required state management—tracking how many walls were placed, enforcing the limit, handling wall removal. Copilot generated the `handleCellClick()` method with proper state updates:

```javascript
handleCellClick(row, col) {
    const currentTileType = this.grid.tiles[row][col];
    
    if (currentTileType === 'grass') {
        if (this.wallCount >= this.maxWalls) {
            this.showNotification(`All ${this.maxWalls} walls placed!`);
            return;
        }
        this.grid.tiles[row][col] = 'wall';
        this.wallCount++;
    } else if (currentTileType === 'wall') {
        this.grid.tiles[row][col] = 'grass';
        this.wallCount = Math.max(0, this.wallCount - 1);
    }
    
    this.render();
    this.updateWallCounter();
}
```

Pull request #5 added keyboard navigation—tab key to move between cells, arrow keys for grid navigation, Enter or Space to toggle walls. This required accessibility attributes (ARIA labels, `role="button"`, proper tabindex) and keyboard event handling. Copilot generated most of this correctly, though it needed explicit direction on accessibility requirements. The AI understood the mechanics of event listeners but didn't automatically prioritize accessibility without prompting.

### The Pet Logic

Pull request #6 added the game's central feature: the pet. A "home" tile (represented by an emoji—initially 🐾, later customizable) always appeared at the grid's center. The objective was to fence in the pet by placing walls so it couldn't reach the edge of the grid.

This required implementing a pathfinding algorithm. I asked Copilot to implement breadth-first search (BFS) to find a path from the home tile to any edge tile. If no path existed, the pet was successfully penned. The AI generated a correct BFS implementation on the first try:

```javascript
isPenned(grid, homeRow, homeCol) {
    const queue = [[homeRow, homeCol]];
    const visited = new Set([`${homeRow},${homeCol}`]);
    
    while (queue.length > 0) {
        const [row, col] = queue.shift();
        
        // If we reached an edge, pet can escape
        if (row === 0 || row === grid.length - 1 || 
            col === 0 || col === grid[row].length - 1) {
            return false;
        }
        
        // Explore adjacent tiles
        for (const [dr, dc] of [[0,1], [1,0], [0,-1], [-1,0]]) {
            const newRow = row + dr;
            const newCol = col + dc;
            const key = `${newRow},${newCol}`;
            
            if (this.isWalkable(grid[newRow][newCol]) && 
                !visited.has(key)) {
                visited.add(key);
                queue.push([newRow, newCol]);
            }
        }
    }
    
    return true; // No path to edge found
}
```

This was a key observation: **AI coding assistants excel at standard algorithms**. BFS is a textbook algorithm with clear specifications, termination conditions, and countless implementations in Copilot's training data. The AI reproduced it correctly without hesitation. It even added visual feedback—paw print emojis (🐾) along the path when the pet could escape, and yellow highlighting for the accessible area when penned.

### UI Polish and Responsiveness

Pull requests #7-8 added polish: an interactive score display showing the size of the penned area, an options panel for customizing the pet emoji (25 choices from 🐶 to 🐢 to 🪨), and UI reorganization for better usability. Copilot was effective at generating HTML structure and CSS styling, though animations required iteration to get right.

The bigger challenge came with responsive design. Pull request #11 implemented dynamic grid scaling so the game would work on any screen size—from small phones (360px width) to large desktop monitors (1920px+). The initial implementation worked well for desktops but clipped the grid edges on mobile devices.

Pull request #12 fixed multiple edge cases: calculating cell size based on both viewport width *and* height (not just width), accounting for padding on both sides (not just one), and reducing the minimum cell size from 13px to 6px to fit even a 21×21 grid on portrait phone screens. The algorithm was eventually tuned to:

```javascript
calculateCellSize() {
    const availableWidth = window.innerWidth * 0.9;
    const availableHeight = this.calculateAvailableHeight();
    const maxGridSize = Math.min(availableWidth, availableHeight);
    
    const totalGap = this.CELL_GAP * (this.grid.size - 1);
    const cellSize = Math.floor(
        (maxGridSize - this.GRID_PADDING * 2 - totalGap) / this.grid.size
    );
    
    return Math.max(this.MIN_CELL_SIZE, 
                    Math.min(this.MAX_CELL_SIZE, cellSize));
}
```

This required multiple iterations. AI-generated responsive designs often work for common viewport sizes but miss edge cases. The lesson: **thorough testing on real devices is essential**—AI can't visually validate its output.

By the end of Phase 1, the game was playable: an interactive grid, wall placement mechanics, pet penning logic with pathfinding, and a responsive UI that worked on any device. Most of this code was AI-generated, with human intervention primarily for bug fixes and edge cases. The foundation was solid. Then came the hard part.

---

## Phase 2: The Puzzle Generation Challenge

### The Daily Puzzle Requirement

For the game to be a daily puzzle, it needed a database of pre-generated puzzles. Pull request #12 added a `maps.json` file storing puzzles by date, each with a map layout and a "goal"—the target score players should aim for. But where would these puzzles come from? They couldn't be hand-crafted; there were too many. They needed to be algorithmically generated.

This meant solving two hard problems: First, generate valid map layouts where the pet can reach the edge when no walls are placed (ensuring the puzzle is solvable). Second, calculate the optimal goal—the *maximum* area the pet can be penned with the available walls. This second problem was combinatorial optimization: with 15 available walls and potentially hundreds of grass tiles, there are billions of possible wall placements. Finding the optimal one isn't trivial.

### First Attempt: The Greedy Algorithm

Pull request #15 was titled "Add goal calculation for map generation." I described the problem to Copilot: "Calculate the minimum achievable penned area (goal) and reject maps where the pet cannot be penned with available walls." The AI generated a `MapGenerator` class with a `calculateGoal()` method.

The approach was greedy: place walls one at a time, always choosing the wall placement that immediately reduces the escape area the most. Stop when the pet is penned, and record the area size as the goal. Simple, fast, and completely wrong.

Greedy algorithms work for some optimization problems (like Huffman coding or Dijkstra's shortest path). But for this problem, the locally-optimal choice at each step doesn't guarantee a globally-optimal solution. You might need to place a wall that temporarily doesn't reduce the escape area much, but enables a better configuration later. The greedy approach produced goals that were inconsistent and often incorrect.

Pull request #16 attempted to fix this by implementing an "optimal solver." But instead of replacing the greedy approach, it added a second approach alongside it, using exhaustive search for small maps and the greedy heuristic for large ones. Now there were two solvers with different logic, and it wasn't clear which was authoritative.

### The Maximize vs Minimize Bug

Pull request #17 exposed a critical bug. Puzzles were generating with goals of 1 or 2 tiles—absurdly small, making them trivially easy. Manual testing revealed the problem: the algorithm was *minimizing* the penned area instead of *maximizing* it.

The bug was simple but subtle:

```javascript
// WRONG: Finding the smallest area (worst for player)
let bestArea = Infinity;
for (const wallPlacement of combinations) {
    const area = calculatePennedArea(wallPlacement);
    if (area < bestArea) {
        bestArea = area;
    }
}

// CORRECT: Finding the largest area (best for player)
let bestArea = 0;
for (const wallPlacement of combinations) {
    const area = calculatePennedArea(wallPlacement);
    if (area > bestArea) {
        bestArea = area;
    }
}
```

The AI had correctly implemented an optimization algorithm, but it optimized for the wrong objective. This is a category of error that's particularly insidious: the code runs without crashing, the logic is coherent, but the fundamental goal is inverted. AI can implement algorithms correctly but misunderstand what "correct" means in context.

The fix was a one-line change (`<` to `>`), but identifying the bug took days. It required generating puzzles, playing them manually, noticing they felt wrong, inspecting the generated goals, tracing through the code, and finally spotting the inversion. The lesson: **trust but verify**—always validate AI-generated algorithmic logic with real-world testing.

### The Proliferation of Solvers

After fixing the maximize/minimize bug, things got messier. Pull request #18 "deduplicated pathfinding code" but also introduced a `BruteForceSolver` for verification. Now there were three different approaches to solving the same problem:

1. **MILPSolver**: Exhaustive search checking all wall combinations up to some limit
2. **BruteForceSolver**: Truly exhaustive search for ground truth on small maps
3. **Greedy heuristics**: Fast approximations for large maps

Different parts of the codebase used different solvers. The map generation script used MILPSolver with a time limit. The test suite used BruteForceSolver for validation. The debug mode used a time-limited version that produced low-quality maps to stay fast. There was no single source of truth.

This pattern is common with AI-assisted development: **AI solves point problems without maintaining architectural coherence**. Each pull request added a solution to the immediate problem without consolidating or refactoring existing solutions. The AI was adding, not simplifying.

### Memory Overflow

The exhaustive search approach was correct in theory: check every possible combination of wall placements, calculate the resulting penned area for each, and return the maximum. But the initial implementation tried to generate all combinations upfront and store them in memory:

```javascript
// BAD: Pre-generate all combinations (memory overflow)
function getAllCombinations(tiles, wallCount) {
    const combinations = [];
    generateCombinationsRecursive(tiles, wallCount, 0, [], combinations);
    return combinations; // Could be millions of entries!
}
```

For larger grids, the number of combinations grows exponentially. A 9×9 grid with 15 walls? That's C(81, 15) ≈ 25 trillion combinations. Even checking fewer walls, you easily hit millions of combinations, overflowing the JavaScript heap.

The solution was on-the-fly generation using a generator pattern:

```javascript
// GOOD: Generate combinations on-demand (no storage)
function* generateCombinations(tiles, wallCount) {
    if (wallCount === 0) {
        yield [];
        return;
    }
    for (let i = 0; i < tiles.length; i++) {
        for (const rest of generateCombinations(tiles.slice(i+1), wallCount-1)) {
            yield [tiles[i], ...rest];
        }
    }
}
```

This yields one combination at a time without storing them all. Check each as it's generated, keep track of the best seen so far, and discard the rest. The AI's initial implementation was naive; a human had to refactor it to be memory-efficient.

### The Consolidation

By pull request #48, the situation had become untenable. Six PRs (#15-18, plus several bug fixes) had iterated on puzzle generation, each adding new approaches or variations. The codebase had:

- Multiple solver implementations with overlapping functionality
- Time-limited solvers that traded accuracy for speed
- Test utilities mixed into production code
- No clear architectural boundaries

Pull request #48, titled "Consolidate map generation to unified exhaustive search with quality validation," was a manual clean-up. The design decision: **use one solver, prioritize accuracy over speed, separate production from test code**. Specifically:

- **MILPSolver**: The *only* solver used in production, using exhaustive search
- **BruteForceSolver**: Kept in `test/` directory for verification only (never used in production)
- **MapValidator**: Centralized validation enforcing quality rules (goal area ≥ 5, walls not just on edges)

This consolidation removed time limits, heuristics, and fallbacks. Maps might take a few seconds to generate, but they'd be correct. The code became dramatically simpler—one clear path instead of six intertwined ones.

Pull request #51 reinforced this by removing fallback logic and clarifying the architecture in documentation. The principle was established: **one authoritative implementation, verified by testing, no compromises**.

This consolidation was significant, but it wasn't the end of the solver story. The JavaScript exhaustive search worked for small grids but hit fundamental scalability limits on larger maps. The real resolution would come later, in the project's most dramatic architectural change—a complete rethinking of where computation should happen (covered in Phase 6).

### Lessons from the Puzzle Generation Saga

Six pull requests and multiple iterations to get puzzle generation right. What went wrong, and what can we learn?

**What AI struggled with:**
- **Optimization problems**: Choosing the right algorithm (greedy vs exhaustive) and objective (maximize vs minimize) requires deep problem understanding
- **Architectural consistency**: AI added solutions without recognizing when to consolidate or refactor
- **Subtle correctness**: Logic bugs like inverted objectives are invisible to AI without execution

**What worked:**
- **Standard algorithms**: BFS pathfinding was implemented correctly on first try
- **Test generation**: Copilot wrote comprehensive tests that caught the maximize/minimize bug
- **Iterative refinement**: Each PR got closer, even if the path was winding

**The human role:**
- Identifying that goals "felt wrong" through manual play-testing
- Tracing through code to find the maximize/minimize inversion
- Recognizing architectural drift and forcing consolidation
- Making design decisions: accuracy over speed, one solver not many

The takeaway: **Complex algorithmic work requires significant human oversight**. AI can implement algorithms when given clear specifications, but it struggles with problem formulation, objective definition, and architectural coherence. For puzzle generation—the hardest part of this project—the AI wrote maybe 40% of the final code, with 60% being human refinement, debugging, and consolidation.

---

## Phase 3: Testing and Quality

### The Testing Infrastructure

After six pull requests to get puzzle generation working, it became clear that comprehensive testing was essential. Pull request #19, titled "Centralize constants, improve map generation accuracy, and add comprehensive testing," added 209 unit tests in one swoop, achieving 72% code coverage.

The test files covered:
- `constants.test.js`: Validated all configuration constants (38 tests)
- `wordList.test.js`: Tested random word generation for map names (24 tests)
- `PathfindingUtils.test.js`: Tested BFS and area calculation (35 tests)
- `Grid.test.js`: Tested grid operations and state management (45 tests)
- `MILPSolver.test.js`: Tested optimal wall placement solver (40 tests)
- `MapGenerator.test.js`: Tested map generation and validation (27 tests)

Here's where AI truly shined. I provided Copilot with the structure "write comprehensive tests for MILPSolver covering optimal wall placement, exhaustive search, and edge cases," and it generated:

```javascript
describe('MILPSolver', () => {
    describe('findOptimalWallPlacement', () => {
        test('finds optimal solution for simple 5x5 map', () => {
            const map = [
                ['grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'grass', 'home',  'grass', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass'],
                ['grass', 'grass', 'grass', 'grass', 'grass']
            ];
            const result = MILPSolver.solve(map, 5);
            
            expect(result.penned).toBe(true);
            expect(result.goal).toBeGreaterThan(0);
            expect(result.optimalWallCount).toBeLessThanOrEqual(5);
        });
        
        test('handles maps with water obstacles', () => {
            // AI generated realistic test case with water
        });
        
        test('returns null for impossible maps', () => {
            // AI tested error conditions
        });
    });
});
```

The tests followed good patterns: arrange-act-assert structure, descriptive names, edge case coverage. Copilot generated realistic test data, checked both happy paths and error conditions, and even added performance assertions. This was **AI at its absolute best**—writing tests is formulaic work that requires thoroughness over creativity, perfect for current AI capabilities.

The tests immediately caught bugs. The maximize/minimize inversion was caught by tests expecting reasonable goal values (8-15 tiles) but getting 1-2. Memory overflow issues were caught by tests with larger grids. The test suite became a safety net that caught AI mistakes before they reached production.

### DOM Testing Challenges

Testing browser-based code required mocking the DOM. Pull requests #20-21 expanded test coverage to 274 tests (91% coverage) by adding tests for `Game.js` and `Menu.js`, which interact heavily with the browser.

This was trickier. The AI understood the mechanics of JSDOM (a JavaScript implementation of the DOM) but needed guidance on mocking strategy:

```javascript
// Test setup required careful mocking
beforeEach(() => {
    document.body.innerHTML = `
        <div id="game-container"></div>
        <button id="reset-button"></button>
        <div id="wall-counter">0 / 9</div>
    `;
    
    // Mock localStorage
    const localStorageMock = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        clear: jest.fn()
    };
    global.localStorage = localStorageMock;
    
    // Mock cookie API
    Object.defineProperty(document, 'cookie', {
        writable: true,
        value: ''
    });
});
```

Once the infrastructure was set up (mostly by human), Copilot could generate test cases effectively. The AI understood event simulation, state verification, and async testing for pathfinding operations. The human role was architectural: deciding *how* to mock, then letting AI fill in the *what* of each test case.

### Performance Optimization

Pull request #31, "Skip slow performance tests to achieve <10s test suite target," addressed a practical problem: the exhaustive solver tests were taking 30+ seconds, slowing the development feedback loop. Every time you ran `npm test`, you'd wait half a minute—too slow for rapid iteration.

The solution was pragmatic: mark expensive tests with `.skip`:

```javascript
describe.skip('Performance tests', () => {
    test('solves 7x7 map in under 5 seconds', () => {
        // Exhaustive search for ground truth
        // Takes ~10 seconds, skip in dev mode
    });
});
```

These tests still ran in CI (continuous integration), ensuring thorough validation before merging. But local development runs only the fast tests (~5 seconds), preserving rapid feedback. This is a practical compromise: **test coverage matters, but so does developer experience**.

### Documentation as AI Guide

Pull request #21 added comprehensive documentation: `MAP_GENERATION.md`, `TESTING.md`, `ARCHITECTURE.md`, `AGENT_GUIDELINES.md`. These docs explained design decisions, documented algorithms, and crucially, told future AI interactions (and developers) what *not* to do:

```markdown
## Map Generation Guidelines

### DO NOT:
- Use BruteForceSolver in production code (test-only)
- Add time limits to solver (accuracy over speed)
- Mix test utilities with production scripts
- Skip validation rules for "faster" generation
```

After PR #21, the quality of AI-generated pull requests improved noticeably. With context about architectural principles, the AI made fewer mistakes that violated those principles. This is a key insight: **AI needs context to make good decisions**. Without documentation, it solves problems in isolation. With documentation, it can maintain consistency with established patterns.

The investment in documentation paid off immediately. Subsequent PRs aligned better with the architecture, required fewer iterations, and introduced fewer bugs. Documentation acts as "guardrails" for AI-assisted development.

---

## Phase 4: Advanced Features

### Menu System

Once the foundation was solid and well-tested, adding features became dramatically easier. Pull request #32, "Add menu system with level selector and map info display," added a comprehensive menu in a single PR: a main menu button, level selector showing all puzzles, instructions modal, about page, and consolidated options panel.

This was ~500 lines of new code (HTML structure, CSS styling, JavaScript logic) added in one shot. Copilot generated:

- Modal HTML structure with proper accessibility attributes
- CSS animations (fade-in backdrop, slide-in modals) 
- Event handling for all menu interactions
- Cookie-based settings persistence
- Level loading without page refresh

The code quality was good. CSS followed established patterns (flexbox for layout, CSS variables for theming). JavaScript used proper event delegation and state management. The AI even generated 22 unit tests for the new `Menu` class, achieving 83% coverage.

What changed? The architecture was now clear and well-documented. The AI had examples to follow: how other modals were structured, how cookies were used elsewhere, how the `Game` class interfaced with UI elements. With those patterns established, Copilot could compose similar functionality effectively.

This is **composability**: once you have working examples of patterns, AI can recombine and adapt them for new features. The marginal cost of each new feature drops as the codebase grows more coherent.

### Score Tracking and Persistence

Pull request #37 added score persistence: saving the player's best score for each level, comparing it with the optimal solution, and displaying completion history. This required localStorage integration, data serialization, and UI updates.

Copilot handled it smoothly:

```javascript
saveScore(date, score) {
    const scores = this.loadScores();
    if (!scores[date] || score > scores[date]) {
        scores[date] = score;
        localStorage.setItem('penthepet-scores', JSON.stringify(scores));
    }
}

displayScoreComparison(playerScore, optimalScore) {
    const percentage = (playerScore / optimalScore * 100).toFixed(1);
    const message = playerScore === optimalScore
        ? '🎉 Perfect! You found the optimal solution!'
        : `You scored ${percentage}% of optimal (${playerScore}/${optimalScore})`;
    this.updateScoreDisplay(message);
}
```

The implementation was straightforward and correct. This is the payoff: once architecture is established, AI can add features with minimal human intervention. The human role shifted from writing code to specifying *what* features to add and validating they work correctly.

### Level Editor

Pull requests #54-55 added a standalone level editor: a separate HTML page where players could create custom puzzles, calculate their goals automatically, and save/load them via localStorage. This demonstrated the modular architecture's value—the solver logic from the main game was reused directly:

```javascript
// Level editor reuses production solver
import { MILPSolver } from './js/MILPSolver.js';
import { MapValidator } from './js/MapValidator.js';

class LevelEditor {
    calculateGoal() {
        const map = this.grid.tiles;
        const result = MILPSolver.solve(map, this.maxWalls);
        
        if (MapValidator.validate(map, result)) {
            this.goalArea = result.goal;
            this.displayOptimalSolution(result);
        } else {
            this.showError('Map does not meet quality standards');
        }
    }
}
```

Copilot generated the editor UI, grid manipulation tools, and export/import functionality. It correctly integrated the existing solver without duplicating code. The architecture—well-documented, thoroughly tested, cleanly separated—enabled AI to build on it effectively.

However, the level editor would later be removed as part of a larger architectural shift (PR #63). When the solver was moved from browser JavaScript to a Python pipeline, the editor lost its ability to compute goals client-side. Rather than maintain a feature that could no longer function independently, it was cut entirely—an example of how architectural decisions cascade through a codebase.

---

## Phase 5: Maintenance and Refinement

### Dependency Updates

Pull requests #38-41 handled dependency updates: migrating from ESLint 8 to ESLint 9 (which required a new config format), updating Jest from v29 to v30, and bumping various other packages. Dependabot, GitHub's automated dependency updater, created the initial PRs. Copilot helped with the migration:

```javascript
// ESLint 8 config (.eslintrc.json)
{
    "env": { "browser": true, "es2021": true },
    "extends": "eslint:recommended",
    "rules": { "indent": ["error", 4] }
}

// ESLint 9 flat config (eslint.config.mjs)
export default [
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: "module"
        },
        rules: { indent: ["error", 4] }
    }
];
```

The AI understood the new format and migrated the config automatically. However, it needed human oversight to verify no regressions. Running the full test suite after each update was essential—AI can perform migrations, but humans must validate correctness.

The lesson: **automated updates are valuable, but test thoroughly**. AI can help with tedious migration work, but breaking changes in major version updates require careful verification.

### Bug Fixes

Several bugs emerged during feature development and required fixes:

- **PR #43**: Infinite loading bug—the `Game` constructor was calling `generate()` which triggered async map loading, but the constructor returned before it completed, leaving the UI in a broken state. Fix: remove auto-generation from constructor, call explicitly after initialization.

- **PR #46**: Screenshot workflow failures—GitHub Actions workflow for generating game screenshots was failing due to outdated dependencies. Fix: update workflow, resolve all linting warnings that were breaking CI.

- **PR #47**: Deprecated UI cleanup—old debug controls were still visible but non-functional. Fix: remove deprecated sections, ensure debug map generation used proper validation.

For each bug, the process was similar: identify the problem through testing or user reports, describe it to Copilot, review the suggested fix, test it, merge. AI was a good debugging partner—it could suggest potential causes and generate fixes—but humans were better at *finding* bugs through systematic testing.

### Code Organization

Pull requests #50-53 were periodic cleanup:

- **PR #50**: Organize documentation into main docs and summaries subfolder
- **PR #51**: Remove fallback logic from map generation (enforcing single-solver principle)
- **PR #53**: Remove redundant generation scripts, enforce production/test separation

These PRs addressed **architecture drift**—the gradual accumulation of inconsistencies as new features are added. Without periodic refactoring, codebases become increasingly tangled. AI tends to add rather than consolidate, so human-driven reviews are essential for maintaining coherence.

The pattern: every 5-10 PRs, pause and review the overall structure. Are there redundant files? Inconsistent patterns? Code in the wrong place? Then consolidate. This rhythm—build features, consolidate, build more features—keeps the codebase maintainable. The most dramatic consolidation was still to come.

---

## Phase 6: The Great Refactor — Rethinking the Architecture

### When JavaScript Isn't Enough

By PR #55, the game worked. But a fundamental tension had been building: the JavaScript solver running in the browser was adequate for small grids (5×5, 7×7) but struggled with larger puzzles. The exhaustive combinatorial search that made the solver *correct* also made it *slow*. A 9×9 grid with a reasonable wall budget could take seconds to solve in the browser; anything larger was impractical.

The AI-generated JavaScript solver had gone through six iterations to become correct (PRs #15-18, #48, #51). Each iteration improved accuracy but didn't address the core scalability problem: JavaScript in a browser isn't the right tool for solving Mixed Integer Linear Programs. The problem wasn't the code quality—it was the choice of language and runtime for this particular task.

This realization led to the project's most significant architectural change.

### The Python MILP Solver (PR #63)

Pull request #63, titled "Remove all JS solver code, level editor; browser is checker-only with Python MILP generation pipeline," was a sweeping refactor that deleted over 4,200 lines of code and touched 35 files. The core insight: **separate what the browser needs to do (check if the pet is penned) from what a build pipeline should do (generate optimal puzzles).**

The new architecture was clean:

- **Browser**: Pure checker. Loads a pre-generated map from `maps.json`, lets the player place walls, and uses BFS to determine if the pet is penned. No solver, no generator, no debug tools. Eight JavaScript files, each with a focused responsibility.

- **Build pipeline**: A Python solver using PuLP (a linear programming library) and the CBC solver. Formulates wall placement as a proper Mixed Integer Linear Program with binary decision variables, network flow constraints, and vertex-cut boundaries. Runs server-side via Node.js wrapper scripts that call Python.

```python
# Python MILP formulation (scripts/solver/solve.py)
# Binary variables: is this cell a wall? Is this cell in the pen?
wall_vars = {(r, c): LpVariable(f'wall_{r}_{c}', cat='Binary')
             for r, c in grass_cells}
pen_vars  = {(r, c): LpVariable(f'pen_{r}_{c}', cat='Binary')
             for r, c in walkable_cells}

# Objective: maximize pen area
prob += lpSum(pen_vars.values())

# Constraint: wall count within budget
prob += lpSum(wall_vars.values()) <= max_walls

# Constraint: pen boundary must be walls or map edges
# (network flow constraints ensure connectivity)
```

This was a fundamentally better approach. PuLP + CBC is a mature optimization toolkit designed specifically for this class of problem. What took seconds (or failed entirely) in JavaScript completed in milliseconds in Python. The solver could now handle any grid size the game supported, producing provably optimal solutions.

### The Wall Budget Formula

PR #63 also replaced the fixed wall count (previously a hardcoded constant of 15) with a formula that scales with grid size:

```
maxWalls = floor(size × 0.75)
```

This produced intuitive budgets: 5 walls for a 7×7 grid, 6 for 9×9, 8 for 11×11, 15 for 21×21. The wall count was now a player *budget*—the number of walls available to place—rather than the optimal wall count from the solver. This distinction mattered: players should have walls to spare, making the puzzle about placement strategy rather than using every wall.

### What Got Removed

The refactor was as much about deletion as addition:

- **`js/MILPSolver.js`**: Deleted from the browser entirely. The JavaScript solver that took six PRs to build was replaced by a Python solver that was correct from the start (because PuLP handles the optimization mathematics).
- **`editor.html`, `js/LevelEditor.js`, `css/editor.css`**: The level editor was removed. Without a client-side solver, it couldn't calculate goals.
- **`Grid.js` generation methods**: `generate()`, `resize()`, `_generateRandomTile()`, `_placeHomeTile()` were all stripped. The browser `Grid` class became pure state management—it loaded maps, it didn't create them.
- **`Game.js` initialization methods**: `init()`, `newGame()`, `changeGridSize()`, `generateDebugMap()` were removed. Maps came only from `maps.json`.
- **Debug tools UI**: The entire debug section in `index.html` was deleted.
- **Test files**: `MILPSolver.test.js`, `BruteForceSolver.js`, and `test-map-generation.js` were removed since the code they tested no longer existed in the browser.

The browser JavaScript went from roughly 3,000 lines to under 2,000. Fewer lines meant fewer bugs, faster loading, and a simpler mental model.

### The Code Audit (PR #64)

Immediately after the refactor, PR #64 performed a full code audit. With the solver gone from the browser, several patterns that had been justified by solver integration now stuck out as redundant:

- **Cookie utilities** were duplicated across `Game.js`, `Menu.js`, and `main.js`. Extracted into `js/CookieUtils.js`.
- **Date formatting** was duplicated in `Menu.js` and `main.js`. Extracted into `js/DateUtils.js`.
- **BFS pathfinding** had three separate implementations: `MapGenerator._validateMap()`, `MapValidator._hasPathToEdge()`, and `PathfindingUtils`. Consolidated into a single `PathfindingUtils.hasPathToEdge()` method.

PR #64 also fixed a real bug: the level selector crashed when switching between maps of different sizes (e.g., 7×7 → 9×9) because `Grid.loadMap()` didn't adapt to the new dimensions. The fix: make `loadMap()` auto-detect and adapt to the incoming map's size.

### Lessons from the Refactor

The solver saga—from PR #15's greedy algorithm through PR #63's Python MILP—illustrates a pattern that recurs in software development: **the first solution to a hard problem is rarely the final one.**

The JavaScript solver wasn't wrong to build. It validated the concept, proved the game was fun, and shipped playable puzzles. But it was always a compromise—using a general-purpose browser language for a specialized optimization problem. The Python MILP solver was the right tool for the job, and it took building the wrong tool first to understand *why*.

For AI-assisted development, this has a specific implication: **AI can build working solutions quickly, but it can't evaluate whether the technology choice is right.** Copilot generated correct JavaScript solver code (eventually), but it never suggested, "This problem would be better solved with a dedicated optimization library in Python." That architectural judgment—choosing the right tool, not just writing correct code—remains firmly human.

The refactor also demonstrated something positive about the project's architecture: the modular design meant the solver could be extracted cleanly. The browser code didn't break when the solver was removed because the concerns were already separated. Good architecture makes refactoring possible; bad architecture makes it terrifying.

---

## What AI Does Well

### Rapid Prototyping

AI coding assistants excel at generating initial implementations quickly. Give Copilot a description like "create a modal system with open/close animations and backdrop blur," and within seconds you have working HTML, CSS, and JavaScript:

```html
<div class="modal-backdrop" id="menuBackdrop">
    <div class="modal-content">
        <button class="modal-close" aria-label="Close menu">&times;</button>
        <h2>Menu</h2>
        <!-- Content generated automatically -->
    </div>
</div>
```

```css
.modal-backdrop {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    animation: fadeIn 0.2s;
}
```

This saves enormous time. What might take 30 minutes to write manually takes 30 seconds with AI. The code follows modern practices, includes accessibility attributes, and often handles edge cases (like preventing backdrop clicks from closing modals unintentionally).

For boilerplate-heavy work—HTML structure, CSS layout, event listener setup—AI is transformative. The 10x productivity claims aren't hyperbole for this category of work.

### Test Generation

Writing comprehensive test suites is tedious but essential. AI excels here because tests are formulaic: set up state, call function, assert result. Copilot generated hundreds of tests for this project over its development lifecycle. Even after the major refactor (which removed solver-related tests), 237 tests remained, covering:

```javascript
// Example: AI-generated test covering edge case
test('handles map with no valid wall placements', () => {
    const map = [
        ['water', 'water', 'water'],
        ['water', 'home',  'water'],
        ['water', 'water', 'water']
    ];
    const result = MILPSolver.solve(map, 5);
    expect(result).toBeNull();
});
```

The AI identified edge cases (all water except home, maps with odd dimensions, maps with no solution) without prompting. It followed testing best practices: isolated tests, descriptive names, no shared state. For test generation, AI is genuinely excellent—near-complete coverage with minimal human effort.

### Documentation

Generating documentation from code is another AI strength. Given code with good variable names and structure, Copilot can produce accurate API docs, usage examples, and explanatory comments:

```javascript
/**
 * Calculate optimal wall placements to maximize penned area.
 * 
 * @param {Array<Array<string>>} map - 2D array of tile types
 * @param {number} maxWalls - Maximum walls available to place
 * @returns {{goal: number, optimalWallCount: number, penned: boolean}}
 */
function solve(map, maxWalls) { /* ... */ }
```

It can also generate developer guides explaining file structure, architecture decisions, and common tasks. While these docs need human review for accuracy, having AI generate the initial draft saves substantial time.

### Standard Algorithms

For well-known algorithms (BFS, DFS, binary search, sorting), AI implementations are typically correct. These algorithms are in countless textbooks and codebases, so Copilot has seen them thousands of times. It reproduces them accurately, with proper termination conditions and edge case handling.

The key insight: **AI works best on well-trod ground**. For problems that have been solved many times before, AI can synthesize correct solutions quickly. The challenge is recognizing *which* problems fit this category.

---

## What AI Struggles With

### Optimization Problems

Puzzle generation required combinatorial optimization: finding the optimal wall placement from billions of possibilities. This is where AI struggled most, requiring six iterations and significant human intervention just to get a correct JavaScript solver—and ultimately, recognition that JavaScript was the wrong tool entirely. The eventual solution used a Python MILP solver (PuLP + CBC), a specialized optimization toolkit that AI never suggested. The problems:

- **Choosing algorithms**: AI suggested greedy approaches when exhaustive search was needed
- **Understanding objectives**: Minimizing vs maximizing—AI got it backwards
- **Verifying correctness**: Without execution, AI couldn't validate its logic

Optimization problems often require:
1. Defining the objective function correctly
2. Choosing an appropriate algorithm (greedy, dynamic programming, exhaustive search)
3. Proving or validating the solution's optimality

AI can implement algorithms but struggles with steps 1 and 3. It doesn't deeply understand the problem domain or inherently validate correctness.

### Architectural Consistency

AI solves problems in isolation. When asked to add feature X, it adds X without considering how X relates to features Y and Z implemented in previous PRs. This leads to:

- **Duplication**: Multiple implementations of similar functionality
- **Inconsistency**: Different coding patterns in different files
- **Drift**: Gradual divergence from architectural principles

Example: The multiple solver implementations (MILPSolver, BruteForceSolver, greedy heuristics) all did similar things but weren't consolidated. Each PR added a new approach rather than refactoring existing ones into a unified solution.

The human role is architectural oversight: recognizing when to consolidate, enforcing consistency, maintaining the big picture. AI sees the PR; humans see the codebase.

### Subtle Logic Bugs

The maximize/minimize inversion is emblematic. The code was syntactically correct, logically coherent, and ran without errors. But the objective was inverted. These bugs are invisible to AI because they require understanding *intent*, not just *syntax*.

Other subtle bugs that required human intervention:
- **Off-by-one errors** in grid boundary checking
- **Edge clipping** in responsive scaling (forgetting to account for padding on both sides)
- **Memory overflow** from storing all combinations (needing generator pattern)

AI doesn't execute code mentally. It predicts tokens that are likely to follow previous tokens, but it doesn't trace through execution or validate correctness. Testing catches these bugs, but humans must write tests that target the right edge cases.

### Responsive Design Edge Cases

Making the game work on every screen size—from 360px phones to 1920px desktops, both landscape and portrait—required multiple iterations. The AI-generated responsive CSS worked for common cases (desktop and landscape phone) but missed:

- **Portrait phones** (tall and narrow)
- **Small tablets** (768px, in-between size)
- **Very small phones** (320px, rare but real)

These required manual testing on actual devices and simulators, identifying the bugs visually, then iterating with Copilot to fix them. AI can't visually validate its output—it can generate CSS, but humans must confirm it looks right across devices.

---

## Best Practices for AI-Assisted Development

### Start with Strong Architecture

Define clear separation of concerns early. Establish coding standards, file organization, and naming conventions. Document these principles explicitly. AI will follow existing patterns—give it good patterns to follow.

For PenThePet:
- Modular JS architecture (Grid, Game, Menu, MapGenerator as separate classes)
- Configuration-driven design (CONFIG object for all tunable parameters)
- Clear file responsibilities (documented in CODE_STRUCTURE.md)

Once this foundation was solid, new features were straightforward. The architecture channeled AI efforts productively.

### Write Copilot Instructions

PR #10 added `.github/copilot-instructions.md` documenting project constraints:

```markdown
## Key Constraints

1. **No Frameworks**: This is vanilla JavaScript—do not add React, Vue, jQuery
2. **No Build Tools**: Code must run directly in browser
3. **Configuration-Driven**: Use CONFIG object, not hardcoded values
4. **Script Loading Order**: Must load in specific order (constants → config → tileTypes → ...)
```

After adding this, AI-generated PRs aligned better with project principles. Copilot used CONFIG instead of hardcoded values, didn't suggest npm packages, and maintained the established architecture.

**Actionable advice**: Create copilot-instructions.md early, documenting your project's unique constraints, patterns, and anti-patterns. Update it as principles emerge. AI needs this context to make good decisions.

### Test Everything

Comprehensive testing catches AI mistakes before they reach production. For this project:
- 237 tests, ~90% coverage
- Tests caught maximize/minimize bug, memory overflow, grid clipping issues
- CI runs tests on every PR, preventing regressions

Without testing, AI mistakes accumulate. With testing, they're caught immediately. The investment in test infrastructure (PR #19) paid for itself many times over.

**Actionable advice**: Write tests as features are built (or let AI generate them). Aim for high coverage (>80%) on critical code. Trust AI-generated code more when it's tested.

### Iterate and Refactor

Accept that first implementations won't be perfect. Build features incrementally, then periodically consolidate. For puzzle generation, it took eight PRs across two languages to get right:

1. PR #15: Initial attempt (greedy, incorrect)
2. PR #16: Add exhaustive solver (alongside greedy)
3. PR #17: Fix maximize/minimize bug
4. PR #18: Deduplicate pathfinding
5. PR #48: Consolidate to single approach
6. PR #51: Remove last fallback logic
7. PR #63: Replace JS solver with Python MILP (the correct tool)
8. PR #64: Clean up residual duplication

This iterative process—build, test, identify issues, refine, and eventually rethink the entire approach—is natural for AI-assisted development. Don't expect perfection immediately; expect rapid iteration toward correctness. Sometimes that iteration includes recognizing the initial technology choice was wrong.

**Actionable advice**: Build features in small PRs. Review regularly for duplication or inconsistency. Periodically refactor to consolidate. The rhythm is: build, consolidate, build more.

### Define "Done" Explicitly

AI will implement what you ask for, but it won't know if the result is *right* unless you tell it what "right" means. For puzzle generation, "done" meant:

- Valid path from home to edge when no walls placed
- Goal area ≥ 5 tiles (not trivially small)
- Walls placed strategically (not all on edges)
- Solution found within the wall budget (floor(size × 0.75))

These criteria weren't obvious to AI. They emerged through iteration and were eventually codified in `MapValidator`. Once formalized, AI could generate maps that met them consistently.

**Actionable advice**: Define acceptance criteria explicitly. For algorithms, specify correctness conditions. For UI, specify expected behavior across devices. The clearer you are about "done," the more likely AI produces it.

---

## The Results

### By the Numbers

After roughly three weeks of active development:
- **48 merged pull requests**
- **~2,000 lines of browser JavaScript** (down from ~3,000 after the refactor)
- **~1,500 lines of test code** (237 tests, ~90% coverage)
- **Python MILP solver** for optimal puzzle generation
- **Zero browser framework dependencies**
- **Works on all devices** (320px to 1920px+)

Features shipped:
- Daily puzzle system with date-based maps
- Menu with level selector (browse all puzzles)
- Score tracking and persistence (localStorage)
- 25 customizable pet emojis
- Three hint modes for different difficulties
- Comprehensive accessibility (ARIA labels, keyboard nav)
- Python-based puzzle generation pipeline with provably optimal solutions

The game is deployed at [avinzarlez.github.io/PenThePet](https://avinzarlez.github.io/PenThePet), playable on any device with a browser. It works. Friends actually use it. The experiment succeeded.

### The AI Contribution

Estimating the human/AI split:

- **~70% of code written by AI**: Boilerplate, UI scaffolding, tests, standard algorithms
- **~30% written or heavily modified by human**: Complex algorithms, architecture decisions, bug fixes, consolidation, Python solver

Time saved by AI:
- **40+ hours on test writing** (237 tests generated rapidly)
- **20+ hours on HTML/CSS scaffolding** (modals, menus, layout)
- **10+ hours on documentation** (API docs, usage guides)

Where humans were essential:
- **Puzzle generation algorithm**: Design, debugging, consolidation (8 PRs spanning JS and Python)
- **Architectural decisions**: Modular structure, solver choice, checker/solver separation, production/test boundaries
- **Technology choices**: Recognizing JavaScript wasn't the right tool for MILP; choosing Python + PuLP
- **Bug identification**: Finding maximize/minimize inversion, memory overflow, responsive issues
- **Validation**: Testing on real devices, verifying correctness, ensuring quality

The net result: built a complete game much faster than solo coding. But not hands-off—significant oversight required, especially for complex algorithmic work.

### Would I Do It Again?

Yes, with the same approach:
- Use AI for well-defined tasks with clear specifications
- Define strong architecture upfront, document it thoroughly
- Write comprehensive tests to catch AI mistakes
- Regular human reviews for architectural coherence
- Iterate and refactor rather than expecting perfection

No, I wouldn't:
- Trust AI with novel algorithms without verification
- Skip testing because "AI wrote it"
- Let architectural drift accumulate without periodic cleanup
- Assume AI understands objectives without explicit validation

The key insight: **AI is a powerful accelerator, not a replacement**. It makes good developers much more productive, but it doesn't eliminate the need for human judgment, testing, and oversight.

Future expectations: As AI improves (GPT-5, Claude 4, specialized code models), the percentage of code that AI can write independently will increase. But the human role—architecture, validation, problem formulation—will remain essential. We're not heading toward "AI writes all code." We're heading toward "AI handles routine tasks, humans handle judgment."

---

## Conclusion

### The Experiment's Success

The original goal was to build a usable daily puzzle game using AI as the primary development tool, adding features the original lacked, and deploying it for actual use. That goal was achieved. PenThePet is a complete, functional game: daily puzzles, customizable pets, score tracking, menu system. It's deployed on GitHub Pages, works across all devices, and friends use it regularly.

Most of the browser code was AI-generated. The modular architecture, UI components, test suite, and documentation—roughly 70% of the codebase—came from Copilot with minimal human modification. For well-defined tasks, AI was transformative. Build a menu system? Done in minutes. Add 237 tests? Done in an hour. Implement BFS pathfinding? Correct on first try.

The validation is simple: the game exists, it works, people play it. AI can build real, production-ready software when properly directed.

### The Human-AI Partnership

But "properly directed" is doing heavy lifting. The puzzle generation saga—eight PRs, multiple bugs, an entire language migration—illustrates that AI needs significant human oversight for complex work. The maximize/minimize bug went undetected by AI for multiple iterations; only human play-testing found it. The memory overflow required human recognition that generator patterns were needed. The architectural consolidation required human recognition that multiple solvers were causing confusion. And the ultimate resolution—replacing JavaScript with a Python MILP solver—required human recognition that the *technology choice* was wrong, not just the implementation.

The analogy that fits: **AI is like a very fast junior developer**. It produces working code quickly, follows existing patterns effectively, and handles well-defined tasks with minimal supervision. But it needs clear direction, makes mistakes that require review, and doesn't inherently maintain big-picture coherence.

This partnership model works. Humans set direction, make architectural decisions, validate correctness. AI executes rapidly, handles tedious work, generates comprehensive tests and documentation. Each does what it's good at. The result is faster development than either could achieve alone.

As AI improves, the balance will shift—AI will handle more complex tasks independently. But the fundamental division likely persists: AI for execution, humans for judgment. The programmers of the future won't write less code; they'll write *higher-level* code, focusing on architecture, algorithms, and validation while AI handles implementation details.

### For the Reader

If you're a developer curious about AI-assisted development: try it. Start with a small project, establish clear architecture, document your principles, and iterate. You'll quickly discover what AI is good at (boilerplate, tests, standard patterns) and where it struggles (optimization, architecture, subtle bugs). The learning curve is short—a few weeks of experimentation will teach you effective collaboration patterns.

PenThePet is open source: [github.com/AvinZarlez/PenThePet](https://github.com/AvinZarlez/PenThePet). Explore the code, read the comprehensive documentation in `docs/`, review the 48 pull requests to see the development journey. Play the game at [avinzarlez.github.io/PenThePet](https://avinzarlez.github.io/PenThePet) to see the result.

The final thought: AI won't replace programmers. But programmers using AI will replace those who don't. The productivity gains are real, the tools are available now, and the learning curve is manageable. The question isn't whether to learn AI-assisted development—it's how quickly you can master it.

The future of software development is human-AI collaboration. PenThePet is one small example of what that looks like in practice: faster development, higher quality, and more fun. Start experimenting. Build something. Let AI be your co-pilot.
