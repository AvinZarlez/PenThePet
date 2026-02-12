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
        
        // Complete map data (after solving)
        this.completeMapData = null;
        
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
        
        // Solve button
        const solveBtn = document.getElementById('solveBtn');
        solveBtn.addEventListener('click', () => {
            this.runSolver();
        });
        
        // Copy complete button
        const copyCompleteBtn = document.getElementById('copyCompleteBtn');
        copyCompleteBtn.addEventListener('click', () => {
            this.copyCompleteToClipboard();
        });
        
        // Insert map button
        const insertMapBtn = document.getElementById('insertMapBtn');
        insertMapBtn.addEventListener('click', () => {
            this.insertMapIntoLocalStorage();
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
            feedback.classList.remove('error');
            
            // Clear feedback after 3 seconds
            setTimeout(() => {
                feedback.textContent = '';
            }, 3000);
        } catch {
            feedback.textContent = '✗ Failed to copy. Please select and copy manually.';
            feedback.classList.add('error');
            
            setTimeout(() => {
                feedback.textContent = '';
                feedback.classList.remove('error');
            }, 3000);
        }
        
        // Deselect
        window.getSelection().removeAllRanges();
    }
    
    /**
     * Run the solver on the current map
     */
    runSolver() {
        // Validate: Must have exactly one home tile
        if (!this.homePosition) {
            alert('Please place a home tile before running the solver!');
            return;
        }
        
        // Get current maxWalls setting
        this.maxWalls = parseInt(document.getElementById('maxWalls').value) || 10;
        
        // Convert grid to numeric format for solver
        // 0 = water, 1 = grass, 2 = home
        const numericMap = this.grid.map(row => 
            row.map(tile => {
                if (tile === 'water') return 0;
                if (tile === 'grass') return 1;
                if (tile === 'home') return 2;
                return 1; // Default to grass
            })
        );
        
        // Show loading message
        const completeSection = document.getElementById('completeSection');
        completeSection.style.display = 'block';
        document.getElementById('completeFeedback').textContent = '⏳ Running solver... This may take a moment.';
        document.getElementById('completeFeedback').classList.remove('error');
        
        // Scroll to complete section
        completeSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Run solver asynchronously (using setTimeout to allow UI to update)
        setTimeout(() => {
            try {
                console.log('Running MILPSolver on map...');
                const solution = MILPSolver.solveMap(numericMap, this.maxWalls);
                
                if (!solution) {
                    document.getElementById('completeFeedback').textContent = '✗ Solver failed to find a solution. Try adjusting the map or max walls.';
                    document.getElementById('completeFeedback').classList.add('error');
                    return;
                }
                
                console.log('Solver result:', solution);
                
                // Convert solution to optimalSolution format (array of [row, col] positions)
                const optimalSolution = [];
                for (let row = 0; row < solution.walls.length; row++) {
                    for (let col = 0; col < solution.walls[row].length; col++) {
                        if (solution.walls[row][col] === 1) {
                            optimalSolution.push([row, col]);
                        }
                    }
                }
                
                // Create complete map data
                this.completeMapData = {
                    size: this.gridSize,
                    goal: solution.goalArea,
                    maxWalls: solution.optimalWallCount,
                    map: this.grid.map(row => [...row]), // Deep copy
                    optimalSolution: optimalSolution
                };
                
                // Display the complete map data
                this.displayCompleteMap();
                
            } catch (error) {
                console.error('Solver error:', error);
                document.getElementById('completeFeedback').textContent = `✗ Error running solver: ${error.message}`;
                document.getElementById('completeFeedback').classList.add('error');
            }
        }, 100);
    }
    
    /**
     * Display complete map with solution
     */
    displayCompleteMap() {
        const completeSection = document.getElementById('completeSection');
        const completeTextarea = document.getElementById('completeData');
        const feedback = document.getElementById('completeFeedback');
        
        // Update summary display
        document.getElementById('completeSizeDisplay').textContent = `${this.completeMapData.size}x${this.completeMapData.size}`;
        document.getElementById('completeGoalDisplay').textContent = this.completeMapData.goal;
        document.getElementById('completeWallsDisplay').textContent = this.completeMapData.maxWalls;
        
        // Format as JSON
        const jsonString = JSON.stringify(this.completeMapData, null, 2);
        
        completeSection.style.display = 'block';
        completeTextarea.value = jsonString;
        
        feedback.textContent = '✓ Solution calculated successfully!';
        feedback.classList.remove('error');
        
        setTimeout(() => {
            feedback.textContent = '';
        }, 3000);
    }
    
    /**
     * Copy complete map data to clipboard
     */
    copyCompleteToClipboard() {
        const completeTextarea = document.getElementById('completeData');
        const feedback = document.getElementById('completeFeedback');
        
        // Select and copy
        completeTextarea.select();
        completeTextarea.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            document.execCommand('copy');
            feedback.textContent = '✓ Copied complete map to clipboard!';
            feedback.classList.remove('error');
            
            // Clear feedback after 3 seconds
            setTimeout(() => {
                feedback.textContent = '';
            }, 3000);
        } catch {
            feedback.textContent = '✗ Failed to copy. Please select and copy manually.';
            feedback.classList.add('error');
            
            setTimeout(() => {
                feedback.textContent = '';
                feedback.classList.remove('error');
            }, 3000);
        }
        
        // Deselect
        window.getSelection().removeAllRanges();
    }
    
    /**
     * Insert complete map into localStorage maps data
     */
    insertMapIntoLocalStorage() {
        if (!this.completeMapData) {
            alert('Please run the solver first to generate a complete map!');
            return;
        }
        
        const feedback = document.getElementById('completeFeedback');
        
        try {
            // Get or initialize maps data from localStorage
            let mapsData = {};
            const storedMaps = localStorage.getItem('customMaps');
            if (storedMaps) {
                try {
                    mapsData = JSON.parse(storedMaps);
                } catch (_e) {
                    console.warn('Failed to parse existing maps data, starting fresh');
                }
            }
            
            // Also check if we need to load from maps.json for dayNumber calculation
            // For now, we'll calculate based on localStorage only
            let maxDayNumber = 0;
            Object.values(mapsData).forEach(map => {
                if (map.dayNumber && map.dayNumber > maxDayNumber) {
                    maxDayNumber = map.dayNumber;
                }
            });
            
            // Get date from input or use today
            let targetDate = document.getElementById('mapDateField').value;
            if (!targetDate) {
                targetDate = this._getTodayDateString();
            }
            
            // Find next available date if target is taken
            targetDate = this._findNextAvailableDate(mapsData, targetDate);
            
            // Generate random map name
            const mapName = this._getRandomMapName();
            
            // Create complete map entry
            const mapEntry = {
                dayNumber: maxDayNumber + 1,
                mapName: mapName,
                date: targetDate,
                size: this.completeMapData.size,
                goal: this.completeMapData.goal,
                maxWalls: this.completeMapData.maxWalls,
                map: this.completeMapData.map,
                optimalSolution: this.completeMapData.optimalSolution
            };
            
            // Add to maps data
            mapsData[targetDate] = mapEntry;
            
            // Save back to localStorage
            localStorage.setItem('customMaps', JSON.stringify(mapsData));
            
            feedback.textContent = `✓ Map inserted successfully for ${targetDate} (Day ${mapEntry.dayNumber}, "${mapName}")`;
            feedback.classList.remove('error');
            
            // Keep message visible longer
            setTimeout(() => {
                feedback.textContent = '';
            }, 5000);
            
        } catch (error) {
            console.error('Error inserting map:', error);
            feedback.textContent = `✗ Error inserting map: ${error.message}`;
            feedback.classList.add('error');
            
            setTimeout(() => {
                feedback.textContent = '';
                feedback.classList.remove('error');
            }, 5000);
        }
    }
    
    /**
     * Get today's date as YYYY-MM-DD string
     * @private
     */
    _getTodayDateString() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }
    
    /**
     * Find next available date starting from targetDate
     * @private
     */
    _findNextAvailableDate(mapsData, targetDate) {
        let date = new Date(targetDate + 'T00:00:00');
        let dateString = targetDate;
        
        // Keep incrementing until we find an available date
        while (mapsData[dateString]) {
            date.setDate(date.getDate() + 1);
            dateString = date.toISOString().split('T')[0];
        }
        
        return dateString;
    }
    
    /**
     * Get a random map name from wordList
     * @private
     */
    _getRandomMapName() {
        if (typeof WORD_LIST !== 'undefined' && WORD_LIST.length > 0) {
            const randomIndex = Math.floor(Math.random() * WORD_LIST.length);
            return WORD_LIST[randomIndex];
        }
        return 'Custom Map';
    }
}

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.editor = new LevelEditor();
});
