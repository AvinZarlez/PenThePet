/**
 * Level Editor
 * 
 * A standalone tool for creating custom levels for Pen the Pet.
 * Allows users to paint tiles on a grid and export level data.
 */

class LevelEditor {
    constructor() {
        // Grid settings
        this.gridSize = 9;
        this.grid = [];
        this.selectedTileType = 'grass';
        
        // Level settings
        this.levelName = '';
        this.maxWalls = 10;
        
        // Home tile tracking
        this.homePosition = null; // {row, col} or null
        
        // Cell size for rendering
        this.cellSize = 40;
        this.cellGap = 3;
        
        // Initialize
        this.initializeGrid();
        this.attachEventListeners();
        this.render();
    }
    
    /**
     * Initialize the grid with empty tiles
     */
    initializeGrid() {
        this.grid = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col] = 'grass'; // Default to grass
            }
        }
        this.homePosition = null;
    }
    
    /**
     * Attach event listeners to UI elements
     */
    attachEventListeners() {
        // Grid size slider
        const slider = document.getElementById('gridSizeSlider');
        const sizeValue = document.getElementById('gridSizeValue');
        const sizeValue2 = document.getElementById('gridSizeValue2');
        
        slider.addEventListener('input', (e) => {
            const newSize = parseInt(e.target.value);
            sizeValue.textContent = newSize;
            sizeValue2.textContent = newSize;
        });
        
        slider.addEventListener('change', (e) => {
            const newSize = parseInt(e.target.value);
            this.changeGridSize(newSize);
        });
        
        // Tile selection
        const tileSelect = document.getElementById('tileSelect');
        tileSelect.addEventListener('change', (e) => {
            this.selectedTileType = e.target.value;
        });
        
        // Clear button
        const clearBtn = document.getElementById('clearBtn');
        clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the grid?')) {
                this.initializeGrid();
                this.render();
            }
        });
        
        // Save button
        const saveBtn = document.getElementById('saveBtn');
        saveBtn.addEventListener('click', () => {
            this.exportLevel();
        });
        
        // Copy button
        const copyBtn = document.getElementById('copyBtn');
        copyBtn.addEventListener('click', () => {
            this.copyToClipboard();
        });
    }
    
    /**
     * Change grid size
     */
    changeGridSize(newSize) {
        this.gridSize = newSize;
        this.initializeGrid();
        this.render();
    }
    
    /**
     * Handle cell click
     */
    handleCellClick(row, col) {
        const currentTile = this.grid[row][col];
        
        // If placing home tile
        if (this.selectedTileType === 'home') {
            // Check if on edge
            if (row === 0 || row === this.gridSize - 1 || col === 0 || col === this.gridSize - 1) {
                alert('Home tile cannot be placed on an edge!');
                return;
            }
            
            // If there's already a home, remove it first
            if (this.homePosition) {
                this.grid[this.homePosition.row][this.homePosition.col] = 'grass';
            }
            
            // Place the new home
            this.grid[row][col] = 'home';
            this.homePosition = { row, col };
        } 
        // If clicking on home tile with non-home type selected
        else if (currentTile === 'home') {
            // Remove home
            this.grid[row][col] = this.selectedTileType;
            this.homePosition = null;
        }
        // Toggle tile (place or remove)
        else {
            if (currentTile === this.selectedTileType) {
                // Unplace - revert to grass
                this.grid[row][col] = 'grass';
            } else {
                // Place the selected tile
                this.grid[row][col] = this.selectedTileType;
            }
        }
        
        this.render();
    }
    
    /**
     * Calculate cell size based on grid size
     */
    calculateCellSize() {
        const container = document.querySelector('.container');
        const maxWidth = Math.min(600, container.clientWidth - 60);
        const maxHeight = 600;
        const availableSize = Math.min(maxWidth, maxHeight);
        
        // Account for gaps
        const totalGapSize = (this.gridSize + 1) * this.cellGap;
        const availableCellSpace = availableSize - totalGapSize;
        
        // Calculate cell size
        let cellSize = Math.floor(availableCellSpace / this.gridSize);
        
        // Constrain between min and max
        cellSize = Math.max(20, Math.min(50, cellSize));
        
        return cellSize;
    }
    
    /**
     * Render the grid
     */
    render() {
        const container = document.getElementById('gridContainer');
        container.innerHTML = '';
        
        // Calculate cell size
        this.cellSize = this.calculateCellSize();
        
        // Set CSS variables
        container.style.setProperty('--cell-size', `${this.cellSize}px`);
        container.style.setProperty('--cell-gap', `${this.cellGap}px`);
        
        // Set grid template
        container.style.gridTemplateColumns = `repeat(${this.gridSize}, ${this.cellSize}px)`;
        container.style.gridTemplateRows = `repeat(${this.gridSize}, ${this.cellSize}px)`;
        
        // Create cells
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = `cell ${this.grid[row][col]}`;
                
                // Add home emoji if home tile
                if (this.grid[row][col] === 'home') {
                    cell.textContent = '🏠';
                }
                
                // Add click handler
                cell.addEventListener('click', () => {
                    this.handleCellClick(row, col);
                });
                
                // Add aria label
                cell.setAttribute('aria-label', `Cell at row ${row + 1}, column ${col + 1}. Type: ${this.grid[row][col]}`);
                cell.setAttribute('role', 'button');
                
                container.appendChild(cell);
            }
        }
    }
    
    /**
     * Export level data
     */
    exportLevel() {
        // Get level settings
        this.levelName = document.getElementById('levelName').value.trim() || 'Unnamed Level';
        this.maxWalls = parseInt(document.getElementById('maxWalls').value) || 10;
        
        // Validate: Must have exactly one home tile
        if (!this.homePosition) {
            alert('Please place a home tile before saving!');
            return;
        }
        
        // Create export data
        const exportData = {
            name: this.levelName,
            size: this.gridSize,
            maxWalls: this.maxWalls,
            map: this.grid.map(row => [...row]) // Deep copy
        };
        
        // Format as JSON
        const jsonString = JSON.stringify(exportData, null, 2);
        
        // Show export section
        const exportSection = document.getElementById('exportSection');
        const exportTextarea = document.getElementById('exportData');
        
        exportSection.style.display = 'block';
        exportTextarea.value = jsonString;
        
        // Scroll to export section
        exportSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    /**
     * Copy export data to clipboard
     */
    copyToClipboard() {
        const exportTextarea = document.getElementById('exportData');
        const feedback = document.getElementById('copyFeedback');
        
        // Select and copy
        exportTextarea.select();
        exportTextarea.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            document.execCommand('copy');
            feedback.textContent = '✓ Copied to clipboard!';
            
            // Clear feedback after 3 seconds
            setTimeout(() => {
                feedback.textContent = '';
            }, 3000);
        } catch {
            feedback.textContent = '✗ Failed to copy. Please select and copy manually.';
            feedback.style.color = '#f44336';
            
            setTimeout(() => {
                feedback.textContent = '';
                feedback.style.color = '#4caf50';
            }, 3000);
        }
        
        // Deselect
        window.getSelection().removeAllRanges();
    }
}

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.editor = new LevelEditor();
});
