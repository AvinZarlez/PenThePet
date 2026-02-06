/**
 * Menu System
 * 
 * Manages the menu modal system including level selector, instructions, about, and options.
 */

class Menu {
    /**
     * Create a new Menu system
     * @param {Game} game - Reference to the game instance
     */
    constructor(game) {
        this.game = game;
        this.currentLevel = null; // Track current level date
        this.mapsDatabase = null; // Store loaded maps
        
        this.attachEventListeners();
    }

    /**
     * Attach event listeners for all menu functionality
     */
    attachEventListeners() {
        // Main menu button
        const menuBtn = document.getElementById('menuBtn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => this.openMenu());
        }

        // Menu option buttons
        const levelSelectorBtn = document.getElementById('levelSelectorBtn');
        const instructionsBtn = document.getElementById('instructionsBtn');
        const aboutBtn = document.getElementById('aboutBtn');
        const optionsBtn = document.getElementById('optionsBtn');

        if (levelSelectorBtn) {
            levelSelectorBtn.addEventListener('click', () => this.openLevelSelector());
        }
        if (instructionsBtn) {
            instructionsBtn.addEventListener('click', () => this.openInstructions());
        }
        if (aboutBtn) {
            aboutBtn.addEventListener('click', () => this.openAbout());
        }
        if (optionsBtn) {
            optionsBtn.addEventListener('click', () => this.openOptions());
        }

        // Close buttons for all modals
        const closeButtons = document.querySelectorAll('.modal-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal);
                }
            });
        });

        // Close modals when clicking outside
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });

        // Options modal controls
        this.attachOptionsListeners();
    }

    /**
     * Attach listeners for options modal controls
     */
    attachOptionsListeners() {
        const modalPetType = document.getElementById('modalPetType');
        const modalHintMode = document.getElementById('modalHintMode');
        const debugModeCheckbox = document.getElementById('debugModeCheckbox');

        if (modalPetType) {
            modalPetType.addEventListener('change', (e) => {
                this.game.petEmoji = e.target.value;
                this._savePetToCookie(this.game.petEmoji);
                this.game.render();
                this.game.updateLegend();
            });
        }

        if (modalHintMode) {
            modalHintMode.addEventListener('change', (e) => {
                this.game.hintMode = e.target.value;
                this._saveHintModeToCookie(this.game.hintMode);
                this.game.render();
            });
        }

        if (debugModeCheckbox) {
            debugModeCheckbox.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                this._saveDebugModeToCookie(enabled);
                this.updateDebugToolsVisibility(enabled);
            });
        }
    }

    /**
     * Open the main menu modal
     */
    openMenu() {
        const menuModal = document.getElementById('menuModal');
        if (menuModal) {
            menuModal.classList.add('show');
        }
    }

    /**
     * Open the level selector modal
     */
    async openLevelSelector() {
        this.closeAllModals();
        
        // Load maps database if not already loaded
        if (!this.mapsDatabase) {
            await this.loadMapsDatabase();
        }

        // Populate level list
        this.populateLevelList();

        const levelSelectorModal = document.getElementById('levelSelectorModal');
        if (levelSelectorModal) {
            levelSelectorModal.classList.add('show');
        }
    }

    /**
     * Load maps database from maps.json
     */
    async loadMapsDatabase() {
        try {
            const response = await fetch('maps.json');
            if (!response.ok) {
                throw new Error('Failed to load maps database');
            }
            this.mapsDatabase = await response.json();
        } catch (error) {
            console.error('Error loading maps database:', error);
            this.mapsDatabase = {};
        }
    }

    /**
     * Populate the level list with available maps
     */
    populateLevelList() {
        const levelList = document.getElementById('levelList');
        if (!levelList || !this.mapsDatabase) return;

        levelList.innerHTML = '';

        // Get current level from cookie or today's date
        const currentDate = this._getCurrentLevelDate();

        // Sort dates in reverse chronological order
        const dates = Object.keys(this.mapsDatabase).sort().reverse();

        dates.forEach(date => {
            const mapData = this.mapsDatabase[date];
            const levelItem = document.createElement('div');
            levelItem.className = 'level-item';
            
            if (date === currentDate) {
                levelItem.classList.add('active');
            }

            levelItem.innerHTML = `
                <div class="level-item-info">
                    <div class="level-item-day">Day ${mapData.dayNumber}</div>
                    <div class="level-item-name">${mapData.mapName}</div>
                    <div class="level-item-date">${this._formatDate(date)}</div>
                </div>
            `;

            levelItem.addEventListener('click', () => this.selectLevel(date));
            levelList.appendChild(levelItem);
        });
    }

    /**
     * Select and load a specific level
     * @param {string} date - Date string of the level to load
     */
    async selectLevel(date) {
        if (!this.mapsDatabase || !this.mapsDatabase[date]) {
            console.error('Level not found:', date);
            return;
        }

        // Save selected level to cookie
        this._saveCurrentLevelToCookie(date);
        this.currentLevel = date;

        // Close modal and reload game with selected level
        this.closeAllModals();

        // Load the selected level
        const mapData = this.mapsDatabase[date];
        await this.loadLevel(mapData);
    }

    /**
     * Load a specific level into the game
     * @param {Object} mapData - Map data object
     */
    async loadLevel(mapData) {
        // Update map info display
        if (typeof updateMapInfo === 'function') {
            updateMapInfo(mapData);
        }

        // Load the map
        this.game.grid.loadMap(mapData.map);
        this.game.grid.saveInitialState();
        this.game.wallCount = 0;

        // Set goal and maxWalls
        if (mapData.goal !== undefined) {
            this.game.goalAreaSize = mapData.goal;
        }
        if (mapData.maxWalls !== undefined) {
            this.game.maxWalls = mapData.maxWalls;
        }

        // Render the game
        this.game.render();
        this.game.updateWallCounter();
        this.game.updateAreaSizeDisplay();
    }

    /**
     * Open the instructions modal
     */
    openInstructions() {
        this.closeAllModals();
        const instructionsModal = document.getElementById('instructionsModal');
        if (instructionsModal) {
            instructionsModal.classList.add('show');
        }
    }

    /**
     * Open the about modal
     */
    openAbout() {
        this.closeAllModals();
        const aboutModal = document.getElementById('aboutModal');
        if (aboutModal) {
            aboutModal.classList.add('show');
        }
    }

    /**
     * Open the options modal
     */
    openOptions() {
        this.closeAllModals();

        // Populate pet type options
        this.populateModalPetOptions();

        // Set current values
        const modalPetType = document.getElementById('modalPetType');
        const modalHintMode = document.getElementById('modalHintMode');
        const debugModeCheckbox = document.getElementById('debugModeCheckbox');

        if (modalPetType) {
            modalPetType.value = this.game.petEmoji;
        }
        if (modalHintMode) {
            modalHintMode.value = this.game.hintMode;
        }
        if (debugModeCheckbox) {
            debugModeCheckbox.checked = this._loadDebugModeFromCookie();
        }

        const optionsModal = document.getElementById('optionsModal');
        if (optionsModal) {
            optionsModal.classList.add('show');
        }
    }

    /**
     * Populate animal options in the modal pet type selector
     */
    populateModalPetOptions() {
        const modalPetType = document.getElementById('modalPetType');
        if (!modalPetType) return;

        modalPetType.innerHTML = '';

        CONSTANTS.ANIMAL_OPTIONS.forEach(animal => {
            const option = document.createElement('option');
            option.value = animal.emoji;
            option.textContent = `${animal.emoji} ${animal.name}`;
            modalPetType.appendChild(option);
        });
    }

    /**
     * Close a specific modal
     * @param {HTMLElement} modal - Modal element to close
     */
    closeModal(modal) {
        if (modal) {
            modal.classList.remove('show');
        }
    }

    /**
     * Close all modals
     */
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.classList.remove('show'));
    }

    /**
     * Update debug tools visibility based on setting
     * @param {boolean} enabled - Whether debug mode is enabled
     */
    updateDebugToolsVisibility(enabled) {
        const debugSection = document.querySelector('.debug-section');
        if (debugSection) {
            debugSection.style.display = enabled ? 'block' : 'none';
        }
    }

    /**
     * Format date string for display
     * Uses formatDate from main.js if available, otherwise formats locally
     * @param {string} dateStr - ISO date string
     * @returns {string} Formatted date
     */
    _formatDate(dateStr) {
        // Try to use global formatDate function from main.js
        if (typeof formatDate === 'function') {
            return formatDate(dateStr);
        }
        
        // Fallback to local formatting
        const date = new Date(dateStr + 'T00:00:00');
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    /**
     * Get current level date from cookie or default to today
     * @returns {string} Date string
     */
    _getCurrentLevelDate() {
        const saved = this._getCookie('currentLevel');
        if (saved) return saved;

        // Default to today
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    /**
     * Save current level to cookie
     * @param {string} date - Date string to save
     */
    _saveCurrentLevelToCookie(date) {
        this._setCookie('currentLevel', date, 365);
    }

    /**
     * Save pet emoji to cookie
     * @param {string} petEmoji - Pet emoji to save
     */
    _savePetToCookie(petEmoji) {
        this._setCookie('selectedPet', petEmoji, 365);
    }

    /**
     * Save hint mode to cookie
     * @param {string} hintMode - Hint mode to save
     */
    _saveHintModeToCookie(hintMode) {
        this._setCookie('hintMode', hintMode, 365);
    }

    /**
     * Save debug mode to cookie
     * @param {boolean} enabled - Debug mode state
     */
    _saveDebugModeToCookie(enabled) {
        this._setCookie('debugMode', enabled ? 'true' : 'false', 365);
    }

    /**
     * Load debug mode from cookie
     * @returns {boolean} Debug mode state
     */
    _loadDebugModeFromCookie() {
        const value = this._getCookie('debugMode');
        return value === 'true';
    }

    /**
     * Get a cookie value
     * @param {string} name - Cookie name
     * @returns {string|null} Cookie value or null
     */
    _getCookie(name) {
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
     * @param {number} days - Expiration in days
     */
    _setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Lax`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Menu;
}
