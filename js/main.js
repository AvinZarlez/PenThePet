/**
 * Main Application Entry Point
 * 
 * Initializes the game when the page loads.
 * Modify this file to change initialization behavior or add global event handlers.
 */

let game;
let menu;

/**
 * Load today's map from the database or from cookie selection
 * @returns {Promise<Object|null>} Map data or null if not found
 */
async function loadTodayMap() {
    try {
        const response = await fetch('maps.json');
        if (!response.ok) {
            throw new Error('Failed to load maps database');
        }
        
        const mapsDb = await response.json();
        
        // Check if user has a selected level in cookie
        const savedLevel = CookieUtils.getCookie('currentLevel');
        if (savedLevel && mapsDb[savedLevel]) {
            return mapsDb[savedLevel];
        }
        
        // Otherwise use today's map
        const today = DateUtils.getTodayDate();
        return mapsDb[today] || null;
    } catch (error) {
        console.error('Error loading maps database:', error);
        return null;
    }
}

/**
 * Display error message when no map is available for today
 */
function showNoMapError() {
    const container = document.querySelector('.container');
    if (container) {
        container.innerHTML = `
            <h1><span aria-hidden="true">🐾</span> Pen the Pet</h1>
            <p class="subtitle">A Logic Puzzle Game About Fencing</p>
            
            <div class="error-message">
                <h2>No Map Available</h2>
                <p>Sorry, there is no puzzle available for today (${DateUtils.getTodayDate()}).</p>
                <p>Please check back tomorrow for a new puzzle!</p>
            </div>
            
            <footer>
                <p>Built with HTML, CSS, and JavaScript</p>
            </footer>
        `;
    }
}

/**
 * Update the map info display with day number, map name, and date
 * @param {Object} mapData - The map data object
 */
function updateMapInfo(mapData) {
    const mapDayElement = document.getElementById('mapDay');
    const mapNameElement = document.getElementById('mapName');
    const mapDateElement = document.getElementById('mapDate');
    
    if (mapDayElement && mapData.dayNumber !== undefined) {
        mapDayElement.textContent = mapData.dayNumber;
    }
    
    if (mapNameElement && mapData.mapName) {
        mapNameElement.textContent = mapData.mapName;
    }
    
    if (mapDateElement && mapData.date) {
        mapDateElement.textContent = DateUtils.formatDate(mapData.date);
    }
}

/**
 * Initialize the game application
 */
async function initGame() {
    // Load today's map from database
    const mapData = await loadTodayMap();
    
    if (!mapData) {
        showNoMapError();
        return;
    }
    
    // Create game with the map size from database
    game = new Game(mapData.size);
    
    // Load hint mode from cookie if available
    const savedHintMode = CookieUtils.getCookie('hintMode');
    if (savedHintMode) {
        game.hintMode = savedHintMode;
    }
    
    // Update map info display
    updateMapInfo(mapData);
    
    // Load the map into the grid using proper encapsulation
    game.grid.loadMap(mapData.map);
    game.grid.saveInitialState();
    game.wallCount = 0;
    
    // Set goal from database (or use default if not present)
    if (mapData.goal !== undefined) {
        game.goalAreaSize = mapData.goal;
    } else {
        console.warn('Map does not have a goal value, using default');
    }
    
    // Set maxWalls from database (or use default if not present)
    if (mapData.maxWalls !== undefined) {
        game.maxWalls = mapData.maxWalls;
    } else {
        console.warn('Map does not have a maxWalls value, using default');
    }
    
    // Store current date and optimal solution
    game.currentDate = mapData.date;
    game.optimalSolution = mapData.optimalSolution || null;
    
    // Check if user has already submitted for this puzzle
    const submission = game.loadSubmission(mapData.date);
    if (submission) {
        game.isSubmitted = true;
        game.submittedScore = submission.score;
        game.submittedWalls = submission.walls;
        
        // Restore submitted wall positions
        for (const [row, col] of submission.walls) {
            if (game.isValidPosition(row, col) && game.grid.getTile(row, col) === 'grass') {
                game.grid.setTile(row, col, 'wall');
                game.wallCount++;
            }
        }
    }
    
    game.render();
    game.updateWallCounter();
    game.updateAreaSizeDisplay();
    game.updateResetButton();
    game.updateLegend();  // Update legend to show loaded pet emoji
    
    // Initialize menu system
    // eslint-disable-next-line no-undef
    menu = new Menu(game);
    
    // Load debug mode setting and apply visibility
    const debugMode = CookieUtils.getCookie('debugMode') === 'true';
    menu.updateDebugToolsVisibility(debugMode);
    
    // Set grid size input attributes from config
    const gridSizeInput = document.getElementById('gridSize');
    if (gridSizeInput) {
        gridSizeInput.min = CONFIG.grid.minSize;
        gridSizeInput.max = CONFIG.grid.maxSize;
        gridSizeInput.value = mapData.size;
        // Disable grid size input since we're using daily maps
        gridSizeInput.disabled = true;
    }
    
    // Disable New Game button since we're using daily maps
    const newGameBtn = document.getElementById('newGameBtn');
    if (newGameBtn) {
        newGameBtn.style.display = 'none';
    }
    
    // Export for potential use in console or testing
    if (typeof window !== 'undefined') {
        window.game = game;
        window.menu = menu;
    }
}

// Start the game when the DOM is fully loaded
window.addEventListener('DOMContentLoaded', initGame);

