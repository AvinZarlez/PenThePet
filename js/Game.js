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
        this.boundHandleResize = this.handleResize.bind(this);
        this.lastFocusedCell = null;
        this.petEmoji = '🐶';
        this.hintMode = CONFIG.hints.mode;
        this.goalAreaSize = CONFIG.gameplay.goalAreaSize;
        
        // Grid sizing constants
        this.CELL_GAP = 3;
        this.GRID_PADDING = 6;
        this.MIN_CELL_SIZE = 6; // Allow very small cells for 21x21 on mobile portrait
        this.MAX_CELL_SIZE = 50;
        this.AVAILABLE_HEIGHT_RATIO = 0.7; // Use 70% of viewport height to leave space for UI controls
        
        this.attachEventListeners();
        this.init();
    }

    /**
     * Initialize a new game
     */
    init() {
        // Use today's date for consistent daily maps
        const today = new Date().toISOString().split('T')[0];
        this.grid.generate(today);
        this.grid.saveInitialState();
        this.wallCount = 0;
        this.render();
        this.updateWallCounter();
        this.updateAreaSizeDisplay();
    }

    /**
     * Render the grid to the DOM
     */
    render() {
        this.gridElement.innerHTML = '';
        this.gridElement.style.gridTemplateColumns = `repeat(${this.grid.size}, 1fr)`;
        
        // Set dynamic cell size based on grid size to ensure it always fits
        this.updateCellSizes();

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
        this.updateAreaSizeDisplay();
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
            cell.textContent = `🏠${this.petEmoji}`;
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
            const yellowTileCount = isPenned ? this.getAccessibleTiles().size : 0;
            
            if (isPenned) {
                statusElement.innerHTML = `<span class="submit-label">Submit</span><span class="submit-check">✓</span>`;
                statusElement.className = 'penned-status penned';
                statusElement.title = `Pet is penned! Click to view area (${yellowTileCount} tiles)`;
                statusElement.disabled = false;
                statusElement.dataset.interactive = 'true';
                statusElement.dataset.areaSize = yellowTileCount;
            } else {
                statusElement.textContent = '✗';
                statusElement.className = 'penned-status not-penned';
                statusElement.title = 'Path exists - pet can escape! ✗';
                statusElement.disabled = true;
                statusElement.dataset.interactive = 'false';
                statusElement.dataset.areaSize = '0';
            }
        }
    }

    /**
     * Update the area size display with current area size and goal coloring
     */
    updateAreaSizeDisplay() {
        const areaSizeElement = document.getElementById('areaSize');
        const areaSizeDisplay = areaSizeElement ? areaSizeElement.parentElement : null;
        
        if (areaSizeElement && areaSizeDisplay) {
            const pathInfo = this.calculatePath();
            const isPenned = !pathInfo.hasPath;
            
            if (isPenned) {
                const areaSize = this.getAccessibleTiles().size;
                areaSizeElement.textContent = areaSize.toString();
                
                // Apply color based on goal comparison
                areaSizeDisplay.classList.remove('penned-yellow', 'penned-green');
                if (areaSize < this.goalAreaSize) {
                    areaSizeDisplay.classList.add('penned-yellow');
                } else {
                    areaSizeDisplay.classList.add('penned-green');
                }
            } else {
                areaSizeElement.textContent = '∞';
                areaSizeDisplay.classList.remove('penned-yellow', 'penned-green');
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
        this.updateAreaSizeDisplay();
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
        this.updateAreaSizeDisplay();
    }

    /**
     * Change the grid size
     * @param {number} newSize - The new grid size
     */
    changeGridSize(newSize) {
        if (newSize >= CONFIG.grid.minSize && newSize <= CONFIG.grid.maxSize) {
            this.grid = new Grid(newSize);
            this.newGame();
        }
    }

    /**
     * Attach event listeners to UI controls
     */
    attachEventListeners() {
        const newGameBtn = document.getElementById('newGameBtn');
        const resetBtn = document.getElementById('resetBtn');
        const statusBtn = document.getElementById('pennedStatus');
        const exitViewerBtn = document.getElementById('exitViewer');
        const gridSizeInput = document.getElementById('gridSize');
        const petTypeSelect = document.getElementById('petType');
        const hintModeSelect = document.getElementById('hintMode');
        
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => this.newGame());
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }

        if (statusBtn) {
            statusBtn.addEventListener('click', () => this.displayRoamingArea());
        }

        if (exitViewerBtn) {
            exitViewerBtn.addEventListener('click', () => this.hideRoamingArea());
        }

        if (gridSizeInput) {
            gridSizeInput.addEventListener('change', (e) => {
                const newSize = parseInt(e.target.value);
                this.changeGridSize(newSize);
                // Update input to reflect actual grid size (in case validation failed)
                e.target.value = this.grid.size;
            });
        }

        if (petTypeSelect) {
            petTypeSelect.addEventListener('change', (e) => {
                this.petEmoji = e.target.value;
                this.render();
                this.updateLegend();
            });
        }

        if (hintModeSelect) {
            hintModeSelect.addEventListener('change', (e) => {
                this.hintMode = e.target.value;
                // TODO: Implement hint functionality based on selected mode
                // - checkOptimal: Show if current solution meets optimal criteria
                // - revealTarget: Show the target/optimal area size or solution
                this.render();
            });
        }

        // Add arrow key navigation (using bound function for potential cleanup)
        document.addEventListener('keydown', this.boundHandleArrowKeys);
        
        // Add window resize handler to recalculate cell sizes
        window.addEventListener('resize', this.boundHandleResize);
    }

    /**
     * Handle window resize events
     */
    handleResize() {
        // Use a debounce to avoid excessive recalculations
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(() => {
            this.updateCellSizes();
        }, 100);
    }

    /**
     * Calculate optimal cell size based on viewport and grid size
     * @returns {number} The calculated cell size in pixels
     */
    calculateCellSize() {
        // Calculate available width
        const availableWidth = window.innerWidth * 0.90;
        
        // Calculate available height by measuring actual space
        // Get grid container position to determine how much vertical space is left
        const gridContainer = this.gridElement.parentElement;
        let availableHeight;
        
        if (gridContainer) {
            const containerRect = gridContainer.getBoundingClientRect();
            // Space from container top to bottom of viewport, minus some margin
            availableHeight = window.innerHeight - containerRect.top - 20;
        } else {
            // Fallback to percentage-based calculation
            availableHeight = window.innerHeight * this.AVAILABLE_HEIGHT_RATIO;
        }
        
        // Ensure minimum available height
        availableHeight = Math.max(availableHeight, 200);
        
        // Calculate total space needed for gaps and padding
        const totalGap = this.CELL_GAP * (this.grid.size - 1);
        const totalPadding = this.GRID_PADDING * 2; // padding on both sides
        
        // Calculate max cell size that fits in each dimension
        const maxCellWidth = Math.floor((availableWidth - totalPadding - totalGap) / this.grid.size);
        const maxCellHeight = Math.floor((availableHeight - totalPadding - totalGap) / this.grid.size);
        
        // Use the smaller of the two to ensure it fits in both dimensions
        const maxCellSize = Math.min(maxCellWidth, maxCellHeight);
        
        return Math.max(this.MIN_CELL_SIZE, Math.min(this.MAX_CELL_SIZE, maxCellSize));
    }

    /**
     * Update cell sizes based on current viewport and grid size
     */
    updateCellSizes() {
        const cellSize = this.calculateCellSize();
        this.gridElement.style.setProperty('--cell-size', `${cellSize}px`);
        this.gridElement.style.gap = `${this.CELL_GAP}px`;
    }

    /**
     * Display the roaming area viewer with the current area size
     */
    displayRoamingArea() {
        const statusBtn = document.getElementById('pennedStatus');
        if (statusBtn && statusBtn.dataset.interactive === 'true') {
            const areaCount = parseInt(statusBtn.dataset.areaSize || '0');
            const viewerPanel = document.getElementById('roamSpaceViewer');
            const metricOutput = document.getElementById('roamAreaMetric');
            
            if (metricOutput) {
                metricOutput.textContent = areaCount;
            }
            
            if (viewerPanel) {
                viewerPanel.classList.add('active');
            }
        }
    }

    /**
     * Hide the roaming area viewer
     */
    hideRoamingArea() {
        const viewerPanel = document.getElementById('roamSpaceViewer');
        if (viewerPanel) {
            viewerPanel.classList.remove('active');
        }
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
     * Update the legend to show the current pet emoji
     */
    updateLegend() {
        const homeLegend = document.getElementById('homeLegend');
        if (homeLegend) {
            homeLegend.textContent = `Home 🏠${this.petEmoji}`;
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
