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
 * Populate animal options in the pet type selector
 */
function populateAnimalOptions() {
    const petTypeSelect = document.getElementById('petType');
    if (!petTypeSelect) return;
    
    // Clear existing options
    petTypeSelect.innerHTML = '';
    
    // Add options from CONSTANTS.ANIMAL_OPTIONS
    CONSTANTS.ANIMAL_OPTIONS.forEach(animal => {
        const option = document.createElement('option');
        option.value = animal.emoji;
        option.textContent = `${animal.emoji} ${animal.name}`;
        petTypeSelect.appendChild(option);
    });
    
    // Load saved pet selection from cookie if available
    const savedPet = getCookie('selectedPet');
    if (savedPet) {
        petTypeSelect.value = savedPet;
    }
}

/**
 * Get a cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return decodeURIComponent(parts.pop().split(';').shift());
    }
    return null;
}

/**
 * Set a cookie
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Expiration in days (default: 365)
 */
function setCookie(name, value, days = 365) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Lax`;
}

/**
 * Initialize the game application
 */
async function initGame() {
    // Populate animal options from constants
    populateAnimalOptions();
    // Load today's map from database
    const mapData = await loadTodayMap();
    
    if (!mapData) {
        showNoMapError();
        return;
    }
    
    // Create game with the map size from database
    game = new Game(mapData.size);
    
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

