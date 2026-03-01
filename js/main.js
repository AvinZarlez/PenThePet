/**
 * Main Application Entry Point
 * 
 * Initializes the game when the page loads.
 * Modify this file to change initialization behavior or add global event handlers.
 */

/* global parseCompactMap, parseCompactSolution */

let game;
let menu;

/**
 * Load today's map from the database or from cookie selection.
 * Falls back to the latest available level if today's map doesn't exist.
 * @returns {Promise<Object|null>} Map data or null if not found
 */
async function loadTodayMap() {
    try {
        const today = DateUtils.getTodayDate();
        const currentYear = parseInt(today.substring(0, 4));

        // Always load this year's map file; also load the saved level's year if different
        const savedLevel = CookieUtils.getCookie('currentLevel');
        const yearsToLoad = new Set([currentYear]);
        if (savedLevel) {
            yearsToLoad.add(parseInt(savedLevel.substring(0, 4)));
        }

        // Load and merge maps from those years
        const mapsDb = {};
        for (const year of yearsToLoad) {
            try {
                const response = await fetch(`maps/${year}.json`);
                if (response.ok) {
                    Object.assign(mapsDb, await response.json());
                }
            } catch { /* year file not found — skip */ }
        }

        // Check if user has a selected level in cookie
        if (savedLevel && mapsDb[savedLevel]) {
            return mapsDb[savedLevel];
        }

        // Try today's map first
        if (mapsDb[today]) {
            return mapsDb[today];
        }

        // Fall back to the latest available level at or before today
        const pastDates = Object.keys(mapsDb).filter(date => date <= today).sort();
        if (pastDates.length > 0) {
            return mapsDb[pastDates[pastDates.length - 1]];
        }

        return null;
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
    
    // Load the map into the grid (parse compact string format)
    game.grid.loadMap(parseCompactMap(mapData.map, mapData.size));
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
    
    // Store current date and optimal solution (parse compact flat array into pairs)
    game.currentDate = mapData.date;
    game.optimalSolution = mapData.optimalSolution ?
        parseCompactSolution(mapData.optimalSolution) : null;
    
    // Check if user has already submitted for this puzzle
    const submission = game.loadSubmission(mapData.date);
    if (submission) {
        game.isSubmitted = true;
        game.submittedScore = submission.score;
        game.submittedWalls = submission.walls;
        
        // Restore submitted wall positions
        for (const [row, col] of submission.walls) {
            const tile = game.isValidPosition(row, col) ? game.grid.getTile(row, col) : null;
            if (tile && isWallPlaceable(tile)) {
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
    game.updateSolutionToggleBar();  // Show toggle bar if already submitted
    game.initTimerForDate(mapData.date);  // Start/restore the puzzle timer
    
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

    // Initialise cloud sync (no-ops if Firebase is not configured)
    if (typeof CloudSync !== 'undefined') {
        CloudSync.init();
    }
}

// Start the game when the DOM is fully loaded
window.addEventListener('DOMContentLoaded', initGame);

// Export for use in Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadTodayMap };
}

