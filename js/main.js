/**
 * Main Application Entry Point
 * 
 * Initializes the game when the page loads.
 * Modify this file to change initialization behavior or add global event handlers.
 */

let game;

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 * @returns {string} Today's date
 */
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

/**
 * Load today's map from the database
 * @returns {Promise<Object|null>} Map data or null if not found
 */
async function loadTodayMap() {
    try {
        const response = await fetch('maps.json');
        if (!response.ok) {
            throw new Error('Failed to load maps database');
        }
        
        const mapsDb = await response.json();
        const today = getTodayDate();
        
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
                <p>Sorry, there is no puzzle available for today (${getTodayDate()}).</p>
                <p>Please check back tomorrow for a new puzzle!</p>
            </div>
            
            <footer>
                <p>Built with HTML, CSS, and JavaScript</p>
            </footer>
        `;
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
    
    // Load the map into the grid
    game.grid.tiles = mapData.map;
    game.grid.saveInitialState();
    game.wallCount = 0;
    game.render();
    game.updateWallCounter();
    game.updateAreaSizeDisplay();
    
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
    }
}

// Start the game when the DOM is fully loaded
window.addEventListener('DOMContentLoaded', initGame);

