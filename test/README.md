# PenThePet Test Suite

This directory contains tests and utilities for the PenThePet game.

## 📚 Full Testing Documentation

**For comprehensive testing information, see [../docs/TESTING.md](../docs/TESTING.md)**

That document includes:
- Complete testing guide
- Test coverage details
- How to write tests
- Debugging strategies
- CI/CD information

## Quick Reference

### Running Tests

```bash
# Run all tests with coverage
npm test

# Run in watch mode
npm run test:watch

# Run specific test file
npx jest test/Grid.test.js

# Check linting
npm run lint
```

### Test Files

**Unit Tests** (`.test.js`):
- `constants.test.js` - CONSTANTS validation (38 tests)
- `wordList.test.js` - Word list testing (24 tests)
- `PathfindingUtils.test.js` - Pathfinding algorithms (35 tests)
- `Grid.test.js` - Grid class functionality (45 tests)
- `MILPSolver.test.js` - Wall placement solver (40 tests)
- `MapGenerator.test.js` - Map generation (27 tests)
- `generate-maps.test.js` - Map generation script (31 tests)

**Total: 240 tests, 77% coverage**

### Utility Files

**Test Utilities:**
- `setup.js` - Jest configuration and global mocks
- `BruteForceSolver.js` - Exhaustive solver for test verification (TEST ONLY)

**Ground Truth Generator:**
- `test-map-generation.js` - Generates verified test maps using brute force, compares solver accuracy

**Test Data:**
- `test-maps-db.json` - Verified test maps with ground truth optimal solutions

## Test Coverage

Current coverage (77% overall):

| File | Coverage | Status |
|------|----------|--------|
| Grid.js | 100% | ✅ Excellent |
| PathfindingUtils.js | 97.82% | ✅ Excellent |
| MapGenerator.js | 95.53% | ✅ Excellent |
| constants.js | 100% | ✅ Excellent |
| wordList.js | 100% | ✅ Excellent |
| MILPSolver.js | 60.71% | ⚠️ Complex algorithm |

**Note:** Some files (Game.js, main.js, config.js, tileTypes.js) are tested manually in browser and excluded from coverage.

## Adding Tests

When adding tests:

1. Create or open appropriate `.test.js` file
2. Use describe/test pattern with clear names
3. Follow Arrange-Act-Assert pattern
4. Test edge cases and error conditions
5. Keep tests independent and fast
6. Document test purpose with comments

Example:
```javascript
describe('MyFunction', () => {
    test('should handle basic case', () => {
        // Arrange
        const input = { ... };
        
        // Act
        const result = myFunction(input);
        
        // Assert
        expect(result).toBe(expected);
    });
});
```

## Ground Truth Test Data Generation

### Generate Verified Test Maps

```bash
# Generate test maps with verified optimal solutions
# Uses BruteForceSolver to establish ground truth
node test/test-map-generation.js
```

This utility:
- Generates small test maps (≤7x7)
- Finds true optimal solutions using exhaustive search
- Compares MILPSolver accuracy against brute force
- Saves verified maps to `test-maps-db.json`
- Generates detailed comparison reports

**Purpose:** Establish ground truth data for unit tests and verify solver accuracy.

## More Information

- **Full testing guide**: [../docs/TESTING.md](../docs/TESTING.md)
- **Code structure**: [../docs/CODE_STRUCTURE.md](../docs/CODE_STRUCTURE.md)
- **Map generation algorithm**: [../docs/MAP_GENERATION.md](../docs/MAP_GENERATION.md)
- **Development workflow**: [../docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md)
