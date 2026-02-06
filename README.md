# 🐕 PenThePet

A browser-based logic puzzle game where you fence in your pet! Built with vanilla JavaScript, HTML, and CSS - no frameworks or build tools required.

[![Tests](https://github.com/AvinZarlez/PenThePet/actions/workflows/test.yml/badge.svg)](https://github.com/AvinZarlez/PenThePet/actions/workflows/test.yml)

## 🎮 Play the Game

The game is deployed on GitHub Pages: [Play PenThePet](https://avinzarlez.github.io/PenThePet/)

## 📖 About

PenThePet is a daily logic puzzle game where you place walls to create the largest possible fenced area for your pet. Each day features a new puzzle with:
- Unique randomly-generated maps with grass and water tiles
- A home tile where your pet starts
- A goal to achieve the maximum penned area with optimal wall placement

## 🚀 Quick Start

### Playing Locally

No build tools or dependencies needed for playing:

```bash
# Clone the repository
git clone https://github.com/AvinZarlez/PenThePet.git
cd PenThePet

# Start a local server
python3 -m http.server 8080

# Open http://localhost:8080 in your browser
```

### Development Setup

For development with testing and linting:

```bash
# Install development dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Generate new maps
npm run generate-maps
```

## 📚 Documentation

This project has comprehensive documentation for both human developers and AI coding agents.

### Core Documentation

- **[Architecture & Code Structure](docs/CODE_STRUCTURE.md)** - How the code is organized and why
- **[Map Generation](docs/MAP_GENERATION.md)** - Algorithm details and map generation process
- **[Testing Guide](docs/TESTING.md)** - Testing infrastructure and how to add tests
- **[Development Guide](docs/DEVELOPMENT.md)** - Setup, workflows, and best practices
- **[Design Decisions](docs/ARCHITECTURE.md)** - Why the project is built this way

### Project History

- **[Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md)** - Changes made during initial development
- **[Map Generation Fix](docs/MAPGEN_FIX_SUMMARY.md)** - Critical bug fix in goal calculation

### For AI Coding Agents

- **[Agent Guidelines](docs/AGENT_GUIDELINES.md)** - Requirements for maintaining this codebase
- **[Copilot Instructions](.github/copilot-instructions.md)** - Full context for GitHub Copilot

## 🏗️ Project Structure

```
PenThePet/
├── index.html              # Game entry point
├── css/
│   └── styles.css          # All visual styling
├── js/
│   ├── constants.js        # Configuration constants
│   ├── config.js           # Game configuration
│   ├── tileTypes.js        # Tile definitions
│   ├── wordList.js         # Random words for map names
│   ├── PathfindingUtils.js # Shared pathfinding algorithms
│   ├── MILPSolver.js       # Optimal wall placement solver
│   ├── MapGenerator.js     # Map generation and validation
│   ├── Grid.js             # Grid data structure
│   ├── Game.js             # Game controller
│   └── main.js             # Application entry point
├── scripts/
│   └── generate-maps.js    # CLI for generating daily maps
├── test/                   # Test suite (240 tests, 77% coverage)
├── docs/                   # Documentation
└── maps.json               # Daily puzzle maps

See [CODE_STRUCTURE.md](docs/CODE_STRUCTURE.md) for detailed architecture.
```

## 🧪 Testing

The project has comprehensive test coverage with Jest:

- **240 tests** across 7 test suites (3 slow tests skipped by default)
- **77% code coverage** (statements, branches, functions)
- Unit tests for all core modules
- Integration tests for map generation
- **Fast test suite**: <6 seconds for full run

Run tests with `npm test`. See [TESTING.md](docs/TESTING.md) for details.

## 🎨 Tech Stack

- **Pure Vanilla JavaScript** (ES6+) - No frameworks
- **HTML5 & CSS3** - Semantic markup and modern styling
- **No Build Tools** - Runs directly in browser
- **GitHub Pages** - Zero-configuration deployment
- **Jest** - Testing framework (dev only)
- **ESLint** - Code quality (dev only)

### Why No Frameworks?

This project intentionally uses vanilla JavaScript for:
- **Simplicity** - No complex build pipelines or tooling
- **Learning** - Pure JavaScript skills without framework magic
- **Performance** - No framework overhead
- **Portability** - Works anywhere with a browser
- **Maintenance** - No dependency updates or breaking changes

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for design philosophy.

## 🤝 Contributing

Contributions are welcome! Please:

1. Read the [Development Guide](docs/DEVELOPMENT.md)
2. Follow the coding standards in [CODE_STRUCTURE.md](docs/CODE_STRUCTURE.md)
3. Add tests for new features
4. Update documentation for any changes
5. Ensure tests pass and linting is clean

**For AI Coding Agents:** Please read [AGENT_GUIDELINES.md](docs/AGENT_GUIDELINES.md) before making changes.

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- Inspired by daily logic puzzle games
- Built with GitHub Copilot assistance
- Map generation uses exhaustive search for optimal solutions

---

**Current Version:** 1.0.0  
**Test Coverage:** 77% (240 tests passing)  
**Daily Maps:** 10+ unique puzzles
