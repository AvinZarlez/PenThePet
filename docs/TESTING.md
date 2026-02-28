# Testing Guide

Comprehensive guide to testing in PenThePet.

## Table of Contents

- [Overview](#overview)
- [Test Infrastructure](#test-infrastructure)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Test Files](#test-files)
- [Writing Tests](#writing-tests)
- [Testing Strategies](#testing-strategies)
- [Debugging Tests](#debugging-tests)

## Overview

PenThePet has a comprehensive test suite with:
- **Jest** testing framework
- **ESLint** for code quality
- **GitHub Actions** CI/CD pipeline
- Test results and coverage are available in the [CI pipeline](https://github.com/AvinZarlez/penthepet/actions/workflows/test.yml)

### Test Philosophy

1. **Test core logic thoroughly** - Algorithms and data structures
2. **Test edge cases** - Boundary conditions and error handling
3. **Test integration points** - Where components interact
4. **Skip UI testing** - Manual browser testing for UI
5. **Keep tests fast** - <10 seconds for full suite

## Test Infrastructure

### Tools

- **Jest 30.x** - Testing framework
- **jest-environment-jsdom** - DOM simulation for browser code
- **ESLint 10.x** - Code linting
- **GitHub Actions** - Automated testing on push/PR

### Configuration

**package.json:**
```json
{
  "scripts": {
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "lint": "eslint js/**/*.js test/**/*.js scripts/**/*.js",
    "lint:fix": "eslint --fix"
  },
  "jest": {
    "testEnvironment": "jsdom",
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 75,
        "lines": 70,
        "statements": 70
      }
    }
  }
}
```

**Coverage Targets:**
- Branches: 70%
- Functions: 75%
- Lines: 70%
- Statements: 70%

### File Structure

```
test/
├── setup.js                    # Jest setup and global mocks
└── *.test.js                   # Unit test files
```

## Running Tests

### All Tests

```bash
# Run all tests with coverage
npm test
```

### Watch Mode

```bash
# Run tests in watch mode (re-runs on file changes)
npm run test:watch
```

### Individual Test Files

```bash
# Run a specific test file
npx jest test/Grid.test.js

# Run tests matching a pattern
npx jest --testNamePattern="Grid constructor"
```

### Linting

```bash
# Check code style
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Coverage Report

```bash
# Generate HTML coverage report
npm test -- --coverage --coverageDirectory=coverage

# Open coverage/index.html in browser
```

## Test Coverage

### Current Coverage (as of last update)

```
---------------------|---------|----------|---------|---------|
File                 | % Stmts | % Branch | % Funcs | % Lines |
---------------------|---------|----------|---------|---------|
All files            |   90.07 |    76.57 |   88.15 |   91.39 |
 CookieUtils.js      |     100 |    83.33 |     100 |     100 |
 DateUtils.js        |     100 |       75 |     100 |     100 |
 Grid.js             |     100 |    95.65 |     100 |     100 |
 MapGenerator.js     |   90.66 |       75 |     100 |   89.39 |
 MapValidator.js     |    93.1 |    81.25 |     100 |    93.1 |
 Menu.js             |   83.33 |    58.13 |   76.92 |   87.05 |
 PathfindingUtils.js |   96.38 |    93.54 |     100 |    96.2 |
 constants.js        |     100 |       75 |     100 |     100 |
 wordList.js         |     100 |       75 |     100 |     100 |
---------------------|---------|----------|---------|---------|
```

### Excluded from Coverage

These files are excluded because they're UI/config and tested manually:
- `js/main.js` - Entry point (tested via browser)
- `js/Game.js` - UI controller (manual testing)
- `js/config.js` - Configuration (no logic)
- `js/tileTypes.js` - Data definitions (no logic)

### Coverage Goals

- **Core algorithms**: 95%+ (PathfindingUtils, MapGenerator)
- **Data structures**: 95%+ (Grid)
- **Utilities**: 100% (constants, wordList)
- **Validation**: 85%+ (MapValidator)

## Test Files

### Unit Tests

#### 1. constants.test.js (41 tests)

**Purpose:** Validate all CONSTANTS values are properly defined

**Tests:**
- CONSTANTS object exists and is exported
- All required fields present (MAX_WALLS, MAX_GRID_SIZE, etc.)
- Values are correct types (numbers, objects)
- Values are in reasonable ranges
- Tile distribution sums to ~1.0

**Example:**
```javascript
test('should have MAX_WALLS constant', () => {
    expect(CONSTANTS.MAX_WALLS).toBeDefined();
    expect(typeof CONSTANTS.MAX_WALLS).toBe('number');
    expect(CONSTANTS.MAX_WALLS).toBe(15);
});
```

#### 2. wordList.test.js (52 tests)

**Purpose:** Test word list for map naming

**Tests:**
- Word list exists and is non-empty
- All words are strings
- No duplicate words
- Helper functions work correctly (getRandomWord, getWordCount)
- Exported functions return expected types

**Example:**
```javascript
test('should not have duplicate words', () => {
    const wordSet = new Set(WORDS);
    expect(wordSet.size).toBe(WORDS.length);
});
```

#### 3. PathfindingUtils.test.js (35 tests)

**Purpose:** Test pathfinding and pet penning algorithms

**Tests:**
- `isPenned()` correctly detects if pet can reach edge
- `calculatePennedArea()` correctly counts reachable tiles
- Edge cases: all grass, all water, single path
- Various map configurations and sizes

**Example:**
```javascript
test('should detect pet is penned when surrounded by walls', () => {
    const map = [
        [1, 1, 1, 1, 1],
        [1, 5, 5, 5, 1],
        [1, 5, 2, 5, 1], // 2 = home, 5 = wall
        [1, 5, 5, 5, 1],
        [1, 1, 1, 1, 1]
    ];
    expect(isPenned(map)).toBe(true);
});
```

#### 4. Grid.test.js (45 tests)

**Purpose:** Test Grid class functionality

**Test Groups:**
- Constructor: Size validation, initialization
- Map Loading: Load from map data, validate structure
- State Management: Reset, save/restore state
- Tile Operations: Get/set tiles, bounds checking

#### 5. MapGenerator.test.js (72 tests)

**Purpose:** Test map generation and validation

**Test Groups:**
- Basic generation: Correct size, has home tile
- Validation: Path to edge exists
- Goal calculation: Uses solver correctly
- Retry logic: Handles unsolvable maps
- Metadata: Includes goal, maxWalls

#### 6. Menu.test.js (46 tests)

**Purpose:** Test menu system and level loading

**Test Groups:**
- Modal management: Open/close modals
- Cookie persistence: Save/load preferences via CookieUtils
- Level selector: Load maps database, populate list
- Level loading: Full game state reset on level switch
- Options: Pet type and hint mode syncing
- Error handling: Network failures, missing elements

#### 7. MapValidator.test.js (6 tests)

**Purpose:** Test map quality validation rules

#### 8. CookieUtils.test.js (11 tests)

**Purpose:** Test shared cookie get/set helpers

**Tests:**
- Read existing and non-existent cookies
- Set and overwrite cookies
- Handle emoji and JSON values
- Distinguish similar cookie names

#### 9. DateUtils.test.js (6 tests)

**Purpose:** Test shared date formatting helpers

**Tests:**
- Get today's date in ISO format
- Format dates for display
- Handle various months and single-digit days

#### 10. generate-maps.test.js (31 tests)

**Purpose:** Test map generation script functionality

**Tests:**
- Script loads and runs without errors
- Generates correct number of maps
- Metadata fields present and valid
- Date handling works correctly
- Fresh vs append modes work

## Writing Tests

### Test Structure

Use Jest's describe/test pattern:

```javascript
/**
 * Unit Tests for MyModule
 * 
 * Tests the MyModule functionality including:
 * - Basic operations
 * - Edge cases
 * - Error handling
 */

const MyModule = require('../js/MyModule.js');

describe('MyModule', () => {
    describe('MyFunction', () => {
        test('should do basic thing', () => {
            const result = MyModule.myFunction(input);
            expect(result).toBe(expected);
        });
        
        test('should handle edge case', () => {
            const result = MyModule.myFunction(edgeInput);
            expect(result).toBe(edgeExpected);
        });
    });
});
```

### Best Practices

1. **One concept per test** - Each test should test one thing
2. **Descriptive names** - Test name should explain what it tests
3. **Arrange-Act-Assert** - Setup, execute, verify pattern
4. **Test edge cases** - Null, empty, boundary values
5. **Keep tests independent** - No shared state between tests
6. **Use beforeEach/afterEach** - For common setup/teardown
7. **Mock external dependencies** - Isolate unit under test

### Example: Good Test

```javascript
test('should calculate penned area for simple enclosed region', () => {
    // Arrange
    const map = [
        [1, 1, 1],
        [1, 2, 1],  // 2 = home
        [0, 0, 0]   // 0 = water (blocks path)
    ];
    
    // Act
    const area = calculatePennedArea(map);
    
    // Assert
    expect(area).toBe(5); // Top 5 tiles reachable
});
```

### Adding New Tests

**When to add tests:**
- Adding new feature
- Fixing a bug (add test that would have caught it)
- Code has low coverage (<70%)

**Steps:**
1. Create or open appropriate `.test.js` file
2. Add describe block for feature
3. Add test cases for normal and edge cases
4. Run tests: `npm test`
5. Check coverage: Look at uncovered lines
6. Add more tests until coverage target met

## Testing Strategies

### Algorithm Testing

For complex algorithms (MapGenerator, PathfindingUtils):

1. **Test with known inputs/outputs** - Simple cases where you know answer
2. **Test properties** - Result should have certain properties
3. **Test invariants** - Things that should always be true

Example:
```javascript
test('solver should find solution that pens the pet', () => {
    const result = solveMap(map, maxWalls);
    
    // Place walls from solution
    const testMap = placeWalls(map, result.walls);
    
    // Verify pet is penned
    expect(isPenned(testMap)).toBe(true);
});
```

### Data Structure Testing

For classes (Grid):

1. **Test constructor** - Initialization works
2. **Test getters/setters** - Basic operations work
3. **Test state changes** - Mutations work correctly
4. **Test invariants** - Internal consistency maintained

### Utility Function Testing

For pure functions (PathfindingUtils):

1. **Test happy path** - Normal inputs
2. **Test edge cases** - Empty, null, boundary values
3. **Test error cases** - Invalid inputs
4. **Test performance** - Completes in reasonable time

### Integration Testing

Test how components work together:

```javascript
test('Grid should load map and track state correctly', () => {
    const grid = new Grid(7);
    grid.loadMap(testMapData);
    
    // Verify map structure
    expect(grid.tiles.length).toBe(7);
    
    // Verify state management
    grid.setTile(0, 0, 'wall');
    grid.reset();
    expect(grid.getTile(0, 0)).not.toBe('wall');
});
```

## Debugging Tests

### Common Issues

**Test fails intermittently:**
- Check for race conditions
- Check for shared state between tests
- Ensure test is deterministic (no random values)

**Test hangs/times out:**
- Check for infinite loops
- Check for missing async/await
- Reduce test complexity (smaller maps)

**Coverage not increasing:**
- Check which lines are uncovered
- Add tests specifically for those paths
- Some paths may be unreachable (dead code)

### Debugging Tools

**Run single test:**
```bash
npx jest -t "test name"
```

**Debug with Node:**
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

**Add console.log:**
```javascript
test('debug this', () => {
    console.log('value:', myValue);
    expect(myValue).toBe(expected);
});
```

**Use debugger:**
```javascript
test('debug this', () => {
    debugger; // Pause here
    const result = myFunction();
    expect(result).toBe(expected);
});
```

## Continuous Integration

### GitHub Actions

Tests run automatically on:
- Every push to main branch
- Every pull request
- Workflow: `.github/workflows/test.yml`

**CI runs:**
1. Install dependencies
2. Run ESLint
3. Run tests with coverage
4. Upload coverage to Codecov
5. Fail if tests fail or coverage drops

### Local Pre-commit

Before committing:
```bash
# Run tests
npm test

# Fix linting
npm run lint:fix

# Check all passes
npm test && npm run lint
```

## Maintaining Tests

### When Code Changes

**Always:**
1. Run tests after any code change
2. Add tests for new features
3. Update tests if behavior changes
4. Maintain coverage above 70%
5. Keep tests passing and fast

**Red-Green-Refactor:**
1. **Red**: Write failing test for new feature
2. **Green**: Write minimal code to pass
3. **Refactor**: Improve code while keeping tests green

### Updating Documentation

When tests change:
1. Update coverage numbers in this file if significant change
2. Add new test files to this documentation
3. Explain new testing strategies

## Conclusion

Good tests:
- Give confidence to make changes
- Document expected behavior
- Catch bugs early
- Enable refactoring safely

Keep tests:
- Fast (<10 seconds)
- Focused (one thing per test)
- Independent (no shared state)
- Readable (clear what's being tested)

The test suite is a living document of how PenThePet works. Keep it healthy!
