/**
 * Game Class
 * 
 * Main game controller that manages the game state, user interactions,
 * and rendering. This is the primary interface for game logic.
 */

class Game {
    /**
     * Create a new Game instance
     * @param {number} size - Initial grid size
     */
    constructor(size = CONFIG.grid.defaultSize) {
        this.grid = new Grid(size);
        this.gridElement = document.getElementById('grid');
        this.wallCount = 0;
        this.maxWalls = 9;
        this.boundHandleArrowKeys = this.handleArrowKeys.bind(this);
        this.lastFocusedCell = null; // Track last focused cell for keyboard persistence
        this.attachEventListeners();
        this.init();
    }

    /**
     * Initialize a new game
     */
    init() {
        this.grid.generate();
        this.grid.saveInitialState();
        this.wallCount = 0;
        this.render();
        this.updateWallCounter();
    }

    /**
     * Render the grid to the DOM
     */
    render() {
        this.gridElement.innerHTML = '';
        this.gridElement.style.gridTemplateColumns = `repeat(${this.grid.size}, 1fr)`;

        const allTiles = this.grid.getAllTiles();
        
        // Calculate path and penned status
        const pathInfo = this.calculatePath();
        const isPenned = !pathInfo.hasPath;
        const accessibleTiles = isPenned ? this.getAccessibleTiles() : new Set();
        
        for (let i = 0; i < this.grid.size; i++) {
            for (let j = 0; j < this.grid.size; j++) {
                const cellElement = this._createCellElement(i, j, allTiles[i][j], pathInfo.path, accessibleTiles);
                this.gridElement.appendChild(cellElement);
            }
        }
        
        // Update penned status indicator
        this.updatePennedStatus(isPenned);
    }

    /**
     * Create a DOM element for a single cell
     * @private
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {string} tileType - The tile type name
     * @param {Set} pathSet - Set of coordinates that are part of the path
     * @param {Set} accessibleTiles - Set of coordinates accessible when penned
     * @returns {HTMLElement} The created cell element
     */
    _createCellElement(row, col, tileType, pathSet, accessibleTiles) {
        const cell = document.createElement('div');
        const tileInfo = getTileType(tileType);
        
        cell.className = `cell ${tileInfo.cssClass}`;
        
        // Add penned class if this tile is accessible when pet is penned
        const coordKey = `${row},${col}`;
        if (accessibleTiles.has(coordKey)) {
            cell.classList.add('penned');
        }
        
        cell.dataset.row = row;
        cell.dataset.col = col;
        
        // Add home emoji if this is the home tile
        if (tileType === 'home') {
            cell.textContent = tileInfo.emoji || '🏠🐾';
        }
        
        // Add path overlay (paw emoji) if this cell is on the path
        if (pathSet && pathSet.has(coordKey) && tileType !== 'home') {
            cell.dataset.overlay = '🐾';
        }
        
        // Add accessibility attributes
        if (tileInfo.clickable) {
            cell.setAttribute('role', 'button');
        }
        // Make all cells focusable for keyboard navigation
        cell.setAttribute('tabindex', '0');
        cell.setAttribute('aria-label', tileInfo.ariaLabel(row, col));
        
        // Add event listeners
        cell.addEventListener('click', () => this.handleCellClick(row, col));
        cell.addEventListener('keydown', (e) => this.handleCellKeydown(e, row, col));
        cell.addEventListener('focus', () => this.lastFocusedCell = { row, col });
        
        return cell;
    }

    /**
     * Handle click events on cells
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    handleCellClick(row, col) {
        const currentTileType = this.grid.getTile(row, col);
        
        // Allow clicking on grass tiles (convert to wall)
        if (currentTileType === 'grass') {
            // Check if wall limit reached
            if (this.wallCount >= this.maxWalls) {
                this.showNotification(`All ${this.maxWalls} walls have been placed!`);
                return;
            }
            this.grid.setTile(row, col, 'wall');
            this.wallCount++;
            this.render();
            this.updateWallCounter();
        }
        // Allow clicking on walls to remove them
        else if (currentTileType === 'wall') {
            this.grid.setTile(row, col, 'grass');
            this.wallCount = Math.max(0, this.wallCount - 1);
            this.render();
            this.updateWallCounter();
        }
    }

    /**
     * Handle keyboard events on cells
     * @param {KeyboardEvent} event - The keyboard event
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    handleCellKeydown(event, row, col) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.handleCellClick(row, col);
            // Restore focus to the same cell after click
            setTimeout(() => {
                const cell = this.gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    cell.focus();
                }
            }, 10);
        }
    }

    /**
     * Check if a tile type blocks pathfinding
     * @param {string} tileType - The tile type to check
     * @returns {boolean} True if the tile blocks paths
     */
    isBlockingTile(tileType) {
        // List of tile types that block pathfinding
        const blockingTiles = ['wall', 'water'];
        return blockingTiles.includes(tileType);
    }

    /**
     * Calculate the path from home to the nearest edge using BFS
     * @returns {Object} Object with hasPath (boolean) and path (Set of coordinates)
     */
    calculatePath() {
        const homePos = this.grid.getHomePosition();
        if (!homePos) {
            return { hasPath: false, path: new Set() };
        }

        const { row: startRow, col: startCol } = homePos;
        const visited = new Set();
        const queue = [[startRow, startCol, []]]; // [row, col, path]
        visited.add(`${startRow},${startCol}`);

        const directions = [
            [-1, 0], // up
            [1, 0],  // down
            [0, -1], // left
            [0, 1]   // right
        ];

        while (queue.length > 0) {
            const [row, col, path] = queue.shift();

            // Check if we reached an edge
            if (row === 0 || row === this.grid.size - 1 || col === 0 || col === this.grid.size - 1) {
                // Build path set including current position
                const pathSet = new Set(path);
                pathSet.add(`${row},${col}`);
                return { hasPath: true, path: pathSet };
            }

            // Explore neighbors
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                const coordKey = `${newRow},${newCol}`;

                // Check bounds
                if (newRow < 0 || newRow >= this.grid.size || newCol < 0 || newCol >= this.grid.size) {
                    continue;
                }

                // Check if already visited
                if (visited.has(coordKey)) {
                    continue;
                }

                const tileType = this.grid.getTile(newRow, newCol);
                
                // Check if tile blocks path
                if (this.isBlockingTile(tileType)) {
                    continue;
                }

                visited.add(coordKey);
                const newPath = [...path, coordKey];
                queue.push([newRow, newCol, newPath]);
            }
        }

        // No path found
        return { hasPath: false, path: new Set() };
    }

    /**
     * Get all tiles accessible from home (flood fill for penned area)
     * @returns {Set} Set of coordinate strings of accessible tiles
     */
    getAccessibleTiles() {
        const homePos = this.grid.getHomePosition();
        if (!homePos) {
            return new Set();
        }

        const { row: startRow, col: startCol } = homePos;
        const accessible = new Set();
        const queue = [[startRow, startCol]];
        accessible.add(`${startRow},${startCol}`);

        const directions = [
            [-1, 0], // up
            [1, 0],  // down
            [0, -1], // left
            [0, 1]   // right
        ];

        while (queue.length > 0) {
            const [row, col] = queue.shift();

            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                const coordKey = `${newRow},${newCol}`;

                // Check bounds
                if (newRow < 0 || newRow >= this.grid.size || newCol < 0 || newCol >= this.grid.size) {
                    continue;
                }

                // Check if already visited
                if (accessible.has(coordKey)) {
                    continue;
                }

                const tileType = this.grid.getTile(newRow, newCol);
                
                // Check if tile blocks access (same as path blocking)
                if (this.isBlockingTile(tileType)) {
                    continue;
                }

                accessible.add(coordKey);
                queue.push([newRow, newCol]);
            }
        }

        return accessible;
    }

    /**
     * Update the penned status indicator
     * @param {boolean} isPenned - Whether the pet is penned
     */
    updatePennedStatus(isPenned) {
        const statusElement = document.getElementById('pennedStatus');
        if (statusElement) {
            if (isPenned) {
                statusElement.textContent = '✓';
                statusElement.className = 'penned-status penned';
                statusElement.title = 'Pet is penned! ✓';
            } else {
                statusElement.textContent = '✗';
                statusElement.className = 'penned-status not-penned';
                statusElement.title = 'Path exists - pet can escape! ✗';
            }
        }
    }

    /**
     * Reset the game to initial state
     */
    reset() {
        this.grid.reset();
        this.wallCount = 0;
        this.render();
        this.updateWallCounter();
    }

    /**
     * Start a new game with a fresh grid
     */
    newGame() {
        this.grid.generate();
        this.grid.saveInitialState();
        this.wallCount = 0;
        this.render();
        this.updateWallCounter();
    }

    /**
     * Change the grid size
     * @param {number} newSize - The new grid size
     */
    changeSize(newSize) {
        this.grid.resize(newSize);
        this.render();
    }

    /**
     * Attach event listeners to UI controls
     */
    attachEventListeners() {
        const newGameBtn = document.getElementById('newGameBtn');
        const resetBtn = document.getElementById('resetBtn');
        
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => this.newGame());
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }

        // Add arrow key navigation (using bound function for potential cleanup)
        document.addEventListener('keydown', this.boundHandleArrowKeys);
    }

    /**
     * Handle arrow key navigation
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleArrowKeys(event) {
        // Only handle arrow keys
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            return;
        }

        const activeElement = document.activeElement;
        
        // Check if the focused element is a grid cell
        if (!activeElement || !activeElement.classList.contains('cell')) {
            // Nothing is highlighted, highlight an edge piece based on arrow key
            event.preventDefault();
            this.highlightEdgePiece(event.key);
            return;
        }

        event.preventDefault();

        const currentRow = parseInt(activeElement.dataset.row);
        const currentCol = parseInt(activeElement.dataset.col);
        let newRow = currentRow;
        let newCol = currentCol;

        // Calculate new position based on arrow key
        switch (event.key) {
            case 'ArrowUp':
                newRow = Math.max(0, currentRow - 1);
                break;
            case 'ArrowDown':
                newRow = Math.min(this.grid.size - 1, currentRow + 1);
                break;
            case 'ArrowLeft':
                newCol = Math.max(0, currentCol - 1);
                break;
            case 'ArrowRight':
                newCol = Math.min(this.grid.size - 1, currentCol + 1);
                break;
        }

        // Focus the new cell
        const newCell = this.gridElement.querySelector(`[data-row="${newRow}"][data-col="${newCol}"]`);
        if (newCell) {
            newCell.focus();
        }
    }

    /**
     * Highlight an edge piece based on arrow key direction
     * @param {string} arrowKey - The arrow key pressed
     */
    highlightEdgePiece(arrowKey) {
        let row, col;
        const size = this.grid.size;
        const mid = Math.floor(size / 2);

        switch (arrowKey) {
            case 'ArrowUp':
                // Highlight top edge, middle column
                row = 0;
                col = mid;
                break;
            case 'ArrowDown':
                // Highlight bottom edge, middle column
                row = size - 1;
                col = mid;
                break;
            case 'ArrowLeft':
                // Highlight left edge, middle row
                row = mid;
                col = 0;
                break;
            case 'ArrowRight':
                // Highlight right edge, middle row
                row = mid;
                col = size - 1;
                break;
            default:
                return;
        }

        const cell = this.gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.focus();
        }
    }

    /**
     * Update the wall counter display
     */
    updateWallCounter() {
        const counterElement = document.getElementById('wallCounter');
        if (counterElement) {
            counterElement.textContent = `${this.wallCount} / ${this.maxWalls}`;
        }
    }

    /**
     * Show a notification message to the user
     * @param {string} message - The message to display
     */
    showNotification(message) {
        const notificationElement = document.getElementById('notification');
        if (notificationElement) {
            notificationElement.textContent = message;
            notificationElement.classList.add('show');
            
            // Hide notification after 2 seconds
            setTimeout(() => {
                notificationElement.classList.remove('show');
            }, 2000);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}
