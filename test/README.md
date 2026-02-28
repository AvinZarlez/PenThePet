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

# Run webapp tests only
npm run test:webapp

# Run generation tests only
npm run test:generation

# Run in watch mode
npm run test:watch

# Run specific test file
npx jest test/webapp/Grid.test.js

# Check linting (JS, Python, Markdown)
npm run lint:all
```

### Test Files

**Webapp Tests** (`test/webapp/`) - 189 tests:

- `constants.test.js` - CONSTANTS validation (32 tests)
- `wordList.test.js` - Word list testing (30 tests)
- `PathfindingUtils.test.js` - Pathfinding algorithms (30 tests)
- `Grid.test.js` - Grid class functionality (34 tests)
- `Menu.test.js` - Menu system (44 tests)
- `CookieUtils.test.js` - Cookie utilities (13 tests)
- `DateUtils.test.js` - Date utilities (6 tests)

**Generation Tests** (`test/generation/`) - 66 tests:

- `MapGenerator.test.js` - Map generation (39 tests)
- `MapValidator.test.js` - Map validation (7 tests)
- `generate-maps.test.js` - Map generation script (20 tests)

**Total: 255 tests, ~91% coverage**

### Setup File

- `setup.js` - Jest configuration, global mocks, and module loading

## Test Coverage

Current coverage (~91% overall):

| File | Coverage | Status |
| ---- | -------- | ------ |
| Grid.js | 100% | ✅ Excellent |
| CookieUtils.js | 100% | ✅ Excellent |
| DateUtils.js | 100% | ✅ Excellent |
| constants.js | 100% | ✅ Excellent |
| wordList.js | 100% | ✅ Excellent |
| PathfindingUtils.js | 96.38% | ✅ Excellent |
| MapValidator.js | 93.1% | ✅ Excellent |
| MapGenerator.js | 90.66% | ✅ Good |
| Menu.js | 86.51% | ✅ Good |

**Note:** Some files (Game.js, main.js, config.js, tileTypes.js) are tested manually in browser and excluded from coverage.

## Adding Tests

When adding tests:

1. Place test in appropriate directory (`webapp/` or `generation/`)
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
