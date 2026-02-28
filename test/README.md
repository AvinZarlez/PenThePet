# PenThePet Test Suite

This directory contains tests for the PenThePet game.

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

- `constants.test.js` - CONSTANTS validation (41 tests)
- `wordList.test.js` - Word list testing (52 tests)
- `PathfindingUtils.test.js` - Pathfinding algorithms (35 tests)
- `Grid.test.js` - Grid class functionality (45 tests)
- `MapGenerator.test.js` - Map generation (72 tests)
- `MapValidator.test.js` - Map validation (6 tests)
- `Menu.test.js` - Menu system (46 tests)
- `CookieUtils.test.js` - Cookie utilities (11 tests)
- `DateUtils.test.js` - Date utilities (6 tests)
- `generate-maps.test.js` - Map generation script (31 tests)

**Total: 237 tests (2 skipped), ~90% coverage**

### Setup File

- `setup.js` - Jest configuration, global mocks, and module loading

## Test Coverage

Current coverage (~90% overall):

| File | Coverage | Status |
|------|----------|--------|
| Grid.js | 100% | ✅ Excellent |
| CookieUtils.js | 100% | ✅ Excellent |
| DateUtils.js | 100% | ✅ Excellent |
| constants.js | 100% | ✅ Excellent |
| wordList.js | 100% | ✅ Excellent |
| PathfindingUtils.js | 96.38% | ✅ Excellent |
| MapValidator.js | 93.1% | ✅ Excellent |
| MapGenerator.js | 90.66% | ✅ Good |
| Menu.js | 83.33% | ✅ Good |

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

## More Information

- **Full testing guide**: [../docs/TESTING.md](../docs/TESTING.md)
- **Code structure**: [../docs/CODE_STRUCTURE.md](../docs/CODE_STRUCTURE.md)
- **Map generation algorithm**: [../docs/MAP_GENERATION.md](../docs/MAP_GENERATION.md)
- **Development workflow**: [../docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md)
