# Copilot Instructions for PenThePet

## Project Overview

PenThePet is a browser-based logic puzzle game about fencing in your pet. The game is built with vanilla HTML, CSS, and JavaScript without any frameworks or build tools. It's designed to run directly in the browser and can be hosted on GitHub Pages.

## Project Structure

```
PenThePet/
├── index.html          # Main HTML file (minimal, references external files)
├── css/
│   └── styles.css      # All game styling
├── js/
│   ├── config.js       # Game configuration and settings
│   ├── tileTypes.js    # Tile type definitions and properties
│   ├── Grid.js         # Grid data structure and generation logic
│   ├── Game.js         # Main game controller and interaction logic
│   └── main.js         # Application entry point and initialization
└── CODE_STRUCTURE.md   # Developer documentation
```

## Code Architecture

### File Responsibilities

- **index.html**: Keep minimal with only HTML structure and script/stylesheet references
- **css/styles.css**: Contains all visual styling, organized by component
- **js/config.js**: Centralized configuration for easy customization (grid settings, tile distribution, cell visuals, gameplay options)
- **js/tileTypes.js**: Defines tile types with properties (name, displayName, description, clickable, cssClass, gradient, ariaLabel)
- **js/Grid.js**: Grid class managing data structure, generation, state management, and tile operations
- **js/Game.js**: Game class controlling initialization, rendering, user interactions, UI updates, and state transitions
- **js/main.js**: Application entry point that initializes the game on page load

### Script Loading Order

Scripts must be loaded in this specific order (already configured in index.html):
1. config.js
2. tileTypes.js
3. Grid.js
4. Game.js
5. main.js

## Coding Standards

### JavaScript

- **ES6 Classes**: Use modern JavaScript class syntax for objects (Grid, Game)
- **No Frameworks**: This is a vanilla JavaScript project - do not add React, Vue, jQuery, or other frameworks
- **No Build Tools**: No webpack, rollup, or other bundlers - code runs directly in browser
- **Configuration-Driven**: Always use CONFIG object from config.js instead of hardcoding values
- **Separation of Concerns**: Keep HTML for structure, CSS for styling, JavaScript for behavior
- **Accessibility**: Include ARIA labels and semantic HTML for screen reader support
- **Comments**: Add JSDoc-style comments for classes and complex methods

### CSS

- **Modern CSS**: Use flexbox, grid, CSS variables, and modern properties
- **No Preprocessors**: Write plain CSS without SASS/LESS
- **BEM-like Naming**: Use clear, descriptive class names (e.g., `.legend-item`, `.viewer-card`)
- **Responsive**: Include media queries for mobile/tablet support
- **Gradients**: Use linear gradients for visual depth on tiles

### HTML

- **Semantic Elements**: Use appropriate semantic tags (`<header>`, `<footer>`, `<article>`, etc.)
- **Accessibility**: Include ARIA attributes where needed
- **Minimal**: Keep index.html focused on structure, not behavior or style

## Development Practices

### Testing

- **Manual Testing**: Test in browser with `python3 -m http.server 8080` or similar
- **Browser Console**: Game instance is accessible via `window.game` for debugging
- **Cross-Browser**: Test in Chrome, Firefox, Safari when possible
- **Mobile Testing**: Always test functionality on mobile screen sizes (phone viewports) using browser developer tools. Ensure:
  - All interactive elements are easily tappable on touch screens
  - Text is readable at small screen sizes
  - Grid scales appropriately for phone screens
  - Controls stack vertically and remain accessible
  - Test at common phone widths: 375px (iPhone), 360px (Android), 414px (iPhone Plus)

### Adding New Features

1. **New Tile Types**: Define in tileTypes.js, add CSS, update Grid generation logic
2. **New Game Mechanics**: Extend Game.js with new methods
3. **Configuration Changes**: Update CONFIG object in config.js
4. **UI Changes**: Update index.html (structure) and styles.css (appearance)

### Code Modification Guidelines

- **Check CONFIG first**: Before hardcoding values, check if they should be in config.js
- **Maintain script order**: Never change the loading order of scripts
- **Preserve accessibility**: Keep ARIA labels and semantic HTML when modifying UI
- **Test incrementally**: After each change, test in browser immediately
- **Document behavior**: Update CODE_STRUCTURE.md if adding major features

## Key Constraints

1. **No Dependencies**: This project has zero npm packages or external libraries
2. **Browser-Only**: All code runs client-side in the browser
3. **No Build Step**: Deploy by simply pushing to GitHub Pages
4. **Vanilla JavaScript**: Do not introduce any frameworks or libraries

## Common Tasks

### Changing Grid Size
- Modify `CONFIG.grid.defaultSize` in config.js
- Update min/max constraints if needed (current max is 21)
- Always test on mobile viewports after grid size changes

### Adjusting Tile Distribution
- Modify `CONFIG.TILE_RATIOS` in config.js to change probability weights

### Adding New Tile Type
1. Add entry to TILE_TYPES object in tileTypes.js
2. Add corresponding CSS class in styles.css
3. Update tile generation logic in Grid.js if needed
4. Optionally add legend entry in index.html

### Modifying Visual Appearance
- Cell size: `CONFIG.CELL_SIZE` in config.js
- Cell gap: `CONFIG.CELL_GAP` in config.js
- Colors/gradients: styles.css or TILE_TYPES in tileTypes.js

## Deployment

This project is GitHub Pages ready. No build process required - just enable GitHub Pages in repository settings pointing to the main branch root directory.

## Accessibility Considerations

- All interactive elements have appropriate ARIA labels
- Tile types include ariaLabel functions for screen readers
- Keyboard navigation should be considered for future enhancements
- Color contrast meets WCAG standards

## Performance Notes

- Grid generation is synchronous and may be slow for very large grids (>20x20)
- DOM manipulation is direct (no virtual DOM) - keep grid sizes reasonable
- No lazy loading or optimization needed for current grid sizes (6-12)
