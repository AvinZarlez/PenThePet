# Agent Guidelines

**Guidelines for AI Coding Agents working on PenThePet**

## 🤖 About This Document

This document provides clear requirements and expectations for AI coding agents (like GitHub Copilot, ChatGPT, Claude, etc.) when making changes to this codebase. Following these guidelines ensures consistency, quality, and proper documentation maintenance.

## 📋 Pre-Change Checklist

**BEFORE making ANY code changes, you MUST:**

1. ✅ **Read relevant documentation**
   - [ ] [CODE_STRUCTURE.md](CODE_STRUCTURE.md) - Understand architecture
   - [ ] [ARCHITECTURE.md](ARCHITECTURE.md) - Understand design decisions
   - [ ] [MAP_GENERATION.md](MAP_GENERATION.md) - If touching map generation
   - [ ] [TESTING.md](TESTING.md) - If adding/modifying tests

2. ✅ **Understand the constraint**
   - [ ] This is a vanilla JavaScript project - NO frameworks
   - [ ] No build tools - Code runs directly in browser
   - [ ] Changes must be minimal and surgical
   - [ ] All configuration uses CONSTANTS - no magic numbers
   - [ ] Map generation must use MapValidator for quality checks

3. ✅ **Check existing patterns**
   - [ ] Look at similar existing code
   - [ ] Follow the same style and structure
   - [ ] Use existing utilities instead of duplicating
   - [ ] Maintain consistency with codebase

4. ✅ **Plan your approach**
   - [ ] Identify minimal changes needed
   - [ ] List files that need modification
   - [ ] Consider impact on tests
   - [ ] Consider impact on documentation

## 🔧 Making Changes

### Code Changes

**When modifying JavaScript:**

```javascript
// ✅ DO: Use constants from constants.js
if (walls > CONSTANTS.MAX_WALLS) { ... }

// ❌ DON'T: Hardcode values
if (walls > 15) { ... }

// ✅ DO: Follow existing patterns
class NewFeature {
    constructor() { ... }
    publicMethod() { ... }
    _privateMethod() { ... }
}

// ❌ DON'T: Introduce new patterns
const NewFeature = () => { ... }

// ✅ DO: Add JSDoc comments for new functions
/**
 * Calculate the optimal wall placement.
 * @param {Array<Array<number>>} map - The game map
 * @param {number} maxWalls - Maximum walls allowed
 * @returns {Object} Solution with wall positions and goal
 */
function solve(map, maxWalls) { ... }

// ❌ DON'T: Leave functions undocumented
function solve(map, maxWalls) { ... }
```

**When modifying HTML:**

```html
<!-- ✅ DO: Use semantic HTML -->
<button id="newGameBtn">New Game</button>

<!-- ❌ DON'T: Use divs as buttons -->
<div onclick="newGame()">New Game</div>

<!-- ✅ DO: Include accessibility -->
<button aria-label="Start a new game">New Game</button>

<!-- ❌ DON'T: Ignore accessibility -->
<button>🎮</button>
```

**When modifying CSS:**

```css
/* ✅ DO: Use CSS variables */
.cell {
    width: var(--cell-size);
}

/* ❌ DON'T: Hardcode values */
.cell {
    width: 50px;
}

/* ✅ DO: Use BEM-like naming */
.legend-item { ... }
.legend-item__icon { ... }

/* ❌ DON'T: Use generic names */
.item { ... }
.icon { ... }
```

### Testing Changes

**REQUIRED: You MUST run tests after ANY code change**

```bash
# After making changes
npm test

# If tests fail, you MUST fix them before proceeding
# If coverage drops below 70%, you MUST add tests
```

**When to add tests:**
- ✅ Adding new feature → Add tests for it
- ✅ Fixing bug → Add test that would have caught it
- ✅ Coverage <70% → Add tests to reach 70%+
- ✅ Modifying algorithm → Add tests for edge cases

**Test quality requirements:**
- Tests must be documented with purpose
- Tests must be independent (no shared state)
- Tests must be deterministic (no random failures)
- Tests must be fast (<10 seconds for full suite)

### Documentation Changes

**CRITICAL: Documentation MUST stay in sync with code**

**You MUST update documentation when:**

| Change Type | Documentation to Update |
|------------|------------------------|
| New feature | README.md, CODE_STRUCTURE.md, relevant docs |
| Algorithm change | MAP_GENERATION.md, ARCHITECTURE.md |
| Configuration change | CODE_STRUCTURE.md, constants documented |
| API change | CODE_STRUCTURE.md, JSDoc comments |
| Test changes | TESTING.md |
| Build/deploy changes | DEVELOPMENT.md |
| Any code change | At least JSDoc comments |

**Documentation checklist after code changes:**

```markdown
- [ ] Updated JSDoc comments in modified files
- [ ] Updated CODE_STRUCTURE.md if architecture changed
- [ ] Updated MAP_GENERATION.md if generation changed
- [ ] Updated TESTING.md if tests changed
- [ ] Updated DEVELOPMENT.md if workflow changed
- [ ] Updated ARCHITECTURE.md if design changed
- [ ] Updated README.md if feature visible to users
- [ ] Reviewed .github/copilot-instructions.md for conflicts
```

## 📝 Documentation Standards

### JSDoc Comments

**Required for:**
- All exported functions
- All class methods (public and private)
- Complex algorithms
- Non-obvious logic

**Format:**
```javascript
/**
 * Brief description of what function does.
 * 
 * More detailed explanation if needed. Can be multiple lines.
 * Explain the algorithm, assumptions, edge cases.
 * 
 * @param {Type} paramName - Description of parameter
 * @param {Type} [optionalParam=default] - Optional parameter
 * @returns {Type} Description of return value
 * @throws {ErrorType} When this error occurs
 * 
 * @example
 * const result = myFunction(5, 'test');
 * console.log(result); // Expected output
 */
function myFunction(paramName, optionalParam = 10) { ... }
```

### Markdown Documentation

**Structure:**
```markdown
# Title

Brief introduction paragraph.

## Table of Contents

- [Section 1](#section-1)
- [Section 2](#section-2)

## Section 1

Content with examples...

### Subsection

More details...

## Section 2

More content...
```

**Style:**
- Use headers for structure (# ## ###)
- Use code blocks with language tags
- Use bullet points for lists
- Use tables for structured data
- Include examples for clarity
- Link to related documents

## 🚫 What NOT to Do

### Never Do These Things

❌ **Add frameworks or libraries**
```javascript
// DON'T add React, Vue, Angular, jQuery, lodash, etc.
import React from 'react';
```

❌ **Add build tools**
```json
// DON'T add webpack, rollup, vite, parcel
"scripts": {
    "build": "webpack ..."
}
```

❌ **Break the script loading order**
```html
<!-- DON'T change this order -->
<script src="js/constants.js"></script>
<script src="js/config.js"></script>
<!-- ... specific order matters ... -->
```

❌ **Commit without testing**
```bash
# DON'T do this:
git commit -m "changes" # without running npm test
```

❌ **Ignore linting errors**
```bash
# DON'T commit with linting errors
# Run: npm run lint:fix
```

❌ **Change CONSTANTS without regenerating maps**
```javascript
// If you change CONSTANTS.MAX_WALLS, you MUST:
// 1. Update the constant
// 2. Regenerate ALL maps with scripts/generate-maps.js --fresh
// 3. Run scripts/audit-maps.js to verify
// 4. Update tests
// 5. Update documentation
```

❌ **Skip map validation**
```javascript
// DON'T skip MapValidator checks
const result = generator.generate();
// DO validate before using
const validation = MapValidator.validate(map, result);
if (!validation.valid) { /* handle errors */ }
```

❌ **Leave debug code**
```javascript
// DON'T leave these in code:
console.log('debug:', value);
debugger;
// TODO: fix this later
```

❌ **Hardcode configuration values**
```javascript
// DON'T:
if (size > 21) { ... }

// DO:
if (size > CONSTANTS.MAX_GRID_SIZE) { ... }
```

## ✅ Post-Change Checklist

**AFTER making changes, you MUST:**

1. ✅ **Verify code quality**
   ```bash
   # Run linter
   npm run lint:fix
   
   # Run tests
   npm test
   
   # Verify tests pass and coverage is adequate
   ```

2. ✅ **Test functionality**
   ```bash
   # Start server
   python3 -m http.server 8080
   
   # Open browser and test:
   # - New game works
   # - Reset works
   # - Wall placement works
   # - Goal achievement works
   # - No console errors
   ```

3. ✅ **Update documentation**
   - [ ] Updated all relevant documentation
   - [ ] Added/updated JSDoc comments
   - [ ] Updated README.md if needed
   - [ ] Reviewed copilot-instructions.md

4. ✅ **Verify git status**
   ```bash
   # Check what's being committed
   git status
   git diff
   
   # Make sure:
   # - No node_modules
   # - No build artifacts
   # - No temporary files
   # - No debug code
   ```

5. ✅ **Write good commit message**
   ```bash
   # Format: Brief summary (50 chars max)
   # 
   # Detailed explanation (if needed)
   # - What changed
   # - Why it changed
   # - What was tested
   
   git commit -m "Add undo feature with keyboard shortcut
   
   - Added history stack to Grid class
   - Added undo button to UI
   - Added Ctrl+Z keyboard shortcut
   - Updated 45 tests, all passing
   - Updated CODE_STRUCTURE.md with new feature"
   ```

## 🎯 Quality Standards

### Code Quality

- ✅ **Consistent style** - Matches existing code
- ✅ **Properly commented** - JSDoc for all exports
- ✅ **No magic numbers** - Uses CONSTANTS
- ✅ **Error handling** - Graceful failures
- ✅ **Efficient** - No obvious performance issues
- ✅ **Tested** - Unit tests for new code
- ✅ **Linted** - No ESLint errors

### Test Quality

- ✅ **Coverage** - Maintains 70%+ coverage
- ✅ **Documented** - Test purpose clear
- ✅ **Fast** - Full suite <10 seconds
- ✅ **Reliable** - No flaky tests
- ✅ **Independent** - Tests don't affect each other

### Documentation Quality

- ✅ **Accurate** - Matches current code
- ✅ **Complete** - All public APIs documented
- ✅ **Clear** - Easy to understand
- ✅ **Examples** - Code samples provided
- ✅ **Up-to-date** - Reflects latest changes

## 🔍 Code Review Checklist

Before submitting changes, review:

**Functionality:**
- [ ] Feature works as intended
- [ ] Edge cases handled
- [ ] Error cases handled
- [ ] No regressions in existing features

**Code Quality:**
- [ ] Follows project conventions
- [ ] Uses constants not magic numbers
- [ ] Has appropriate comments
- [ ] No duplicate code
- [ ] Efficient implementation

**Testing:**
- [ ] All tests pass
- [ ] New tests added for new code
- [ ] Coverage maintained/improved
- [ ] Tests are documented

**Documentation:**
- [ ] JSDoc comments added/updated
- [ ] Relevant docs updated
- [ ] README updated if user-facing
- [ ] ARCHITECTURE.md updated if design changed

**Clean Up:**
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] No TODO comments
- [ ] No debug code

## 📚 Key Documents to Reference

**Before ANY change:**
1. [CODE_STRUCTURE.md](CODE_STRUCTURE.md) - How code is organized
2. [ARCHITECTURE.md](ARCHITECTURE.md) - Why it's organized this way

**For specific changes:**
- Map generation → [MAP_GENERATION.md](MAP_GENERATION.md)
- Adding tests → [TESTING.md](TESTING.md)
- Development setup → [DEVELOPMENT.md](DEVELOPMENT.md)
- Full context → [.github/copilot-instructions.md](../.github/copilot-instructions.md)

## 🤝 Working with Human Developers

**Communication:**
- Explain what you changed and why
- Highlight any decisions you made
- Note any potential issues or tradeoffs
- Ask for clarification if requirements unclear

**Transparency:**
- Document your reasoning in code comments
- Explain complex algorithms
- Note any limitations or assumptions
- Highlight areas that may need review

**Collaboration:**
- Follow human developer's preferences
- Ask before making major architectural changes
- Propose alternatives when appropriate
- Be ready to iterate on feedback

## 📈 Success Criteria

**Your changes are successful when:**

✅ All tests pass  
✅ Coverage is maintained (70%+)  
✅ Linting is clean  
✅ Documentation is updated  
✅ Code follows project patterns  
✅ Feature works in browser  
✅ No console errors  
✅ No regressions  
✅ Commit message is clear  
✅ Changes are minimal and focused  

## 🎓 Learning from the Codebase

**To understand how to write good code for this project:**

1. **Read existing code** - See how features are implemented
2. **Read tests** - Understand expected behavior
3. **Read documentation** - Understand design decisions
4. **Look at git history** - See how others made changes
5. **Run the game** - Experience it as a user

**Common patterns to follow:**
- Class-based components (Grid, Game, MapGenerator)
- Configuration-driven behavior (CONSTANTS, CONFIG)
- BFS for pathfinding
- Exhaustive search for optimization
- JSDoc for documentation
- Jest for testing

## ⚠️ Critical Rules

**These rules MUST NEVER be broken:**

1. ✋ **Never add frameworks** (React, Vue, Angular, etc.)
2. ✋ **Never add build tools** (webpack, rollup, etc.)
3. ✋ **Never break tests** (all must pass before commit)
4. ✋ **Never ignore linting** (must be clean)
5. ✋ **Never skip documentation** (must stay in sync)
6. ✋ **Never hardcode config** (use CONSTANTS)
7. ✋ **Never change script order** (breaks loading)
8. ✋ **Never commit without testing** (must verify)
9. ✋ **Never skip map validation** (use MapValidator for all generation)

Breaking these rules will cause issues and may require reverting changes.

## 🆘 When You're Stuck

**If you're unsure about something:**

1. Check if similar code exists - follow that pattern
2. Read the documentation - answer may be there
3. Check constants.js - value may be configured
4. Look at tests - they document expected behavior
5. Ask the human developer - better to ask than guess

**Don't:**
- Make assumptions about requirements
- Introduce new patterns without justification
- Skip documentation because you're unsure
- Leave code in a broken state

## 📊 Metrics to Track

**After your changes:**
- Test count: Should increase or stay same
- Coverage: Should be 70%+ (ideally increase)
- File size: Minimal increase (surgical changes)
- Lint errors: Must be zero
- Documentation updates: At least 1 file

## 🎉 Summary

**Remember:**
- Read documentation BEFORE coding
- Make MINIMAL, focused changes
- Follow EXISTING patterns
- Run TESTS before committing
- Update DOCUMENTATION always
- Keep it VANILLA (no frameworks)
- Be SURGICAL (no broad changes)

**Your goal:**
Make the smallest, highest-quality change that solves the problem while maintaining the project's principles of simplicity, vanilla JavaScript, and excellent documentation.

---

Thank you for helping maintain PenThePet! 🐕


## 🗺️ Map Generation Guidelines

**CRITICAL: Single consistent solver, no fallbacks.**

### Solver Usage Policy

**Python MILP Solver (scripts/solver/solve.py):**
- ✅ Production solver - used for ALL map generation
- ✅ Provably optimal using PuLP + CBC
- ✅ Called via Node.js wrapper (scripts/solver/MILPSolver.js)
- ✅ ONLY solver used in production code
- ✅ Requires Python 3 + PuLP

**Browser JS has NO solver:**
- ❌ No MILPSolver.js in js/ directory
- ❌ No solver code loaded in the browser
- ❌ Game only checks if pet is penned, does not solve

### Generation Flow (No Fallbacks)

1. **Production Maps** (GitHub Actions or local script)
   - Use: `scripts/generate-single-map.js` or GitHub Actions
   - Method: Python MILP solver via Node.js wrapper (ONLY method)
   - Validation: MapValidator (all quality rules)
   - **On failure**: Throw error (no fallback to simplified maps)

2. **Maps are pre-generated** (maps.json)
   - Browser loads maps from maps.json only
   - No map generation happens in the browser
   - Game.js is a checker, not a solver

### Map Quality Rules

**Every generated map MUST pass these checks:**

✅ **Path to edge exists** - Pet can reach edge when no walls placed  
✅ **Goal area >= 5** - Prevents maps that are too easy  
✅ **Walls <= 15** - Must be solvable with CONSTANTS.MAX_WALLS  
✅ **Strategic placement** - At least one optimal wall not on edge  

**If map fails quality checks:**
- Discard map
- Generate new random map
- Retry up to 1000 times
- If all attempts fail: **THROW ERROR** (no fallback!)

### Adding New Maps

**Option 1: GitHub Actions (Recommended)**
1. Go to Actions → "Generate Daily Map"
2. Fill in date, size, max_walls
3. Workflow auto-commits to maps.json

**Option 2: Local Script**
```bash
node scripts/generate-single-map.js --date 2026-02-15 --size 9
```

**Option 3: Batch Generation**
```bash
node scripts/generate-maps.js --count 10 --start-date 2026-02-15
```

### Auditing Maps

Check existing maps meet standards:
```bash
node scripts/audit-maps.js
```

### When Modifying Generation

- [ ] Update MapValidator.js if changing quality rules
- [ ] Run `node scripts/audit-maps.js` after changes
- [ ] Regenerate maps that fail new validation
- [ ] Update MAP_GENERATION.md documentation
- [ ] Run full test suite (`npm test`)

### DO NOT

❌ Fall back to simplified/guaranteed valid maps  
❌ Skip MapValidator checks  
❌ Generate maps without validation  
❌ Change CONSTANTS.MAX_WALLS without regenerating all maps  
❌ Allow goalArea < 5 (too easy)  
❌ Allow all walls on edges only (too easy)  
❌ Add solver code to browser JS (solver is scripts/ only)

