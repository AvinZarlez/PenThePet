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
        
        for (let i = 0; i < this.grid.size; i++) {
            for (let j = 0; j < this.grid.size; j++) {
                const cellElement = this._createCellElement(i, j, allTiles[i][j]);
                this.gridElement.appendChild(cellElement);
            }
        }
    }

    /**
     * Create a DOM element for a single cell
     * @private
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {string} tileType - The tile type name
     * @returns {HTMLElement} The created cell element
     */
    _createCellElement(row, col, tileType) {
        const cell = document.createElement('div');
        const tileInfo = getTileType(tileType);
        
        cell.className = `cell ${tileInfo.cssClass}`;
        cell.dataset.row = row;
        cell.dataset.col = col;
        
        // Add accessibility attributes
        if (tileInfo.clickable) {
            cell.setAttribute('role', 'button');
            cell.setAttribute('tabindex', '0');
        }
        cell.setAttribute('aria-label', tileInfo.ariaLabel(row, col));
        
        // Add event listeners
        cell.addEventListener('click', () => this.handleCellClick(row, col));
        cell.addEventListener('keydown', (e) => this.handleCellKeydown(e, row, col));
        
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
