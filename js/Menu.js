/**
 * Menu System
 * 
 * Manages the menu modal system including level selector, instructions, about, and options.
 */

/* global parseCompactMap, parseCompactSolution */

class Menu {
    /**
     * Create a new Menu system
     * @param {Game} game - Reference to the game instance
     */
    constructor(game) {
        this.game = game;
        this.currentLevel = null; // Track current level date
        this.mapsDatabase = null; // Store loaded maps
        this.showAllLevels = false; // Debug: show future levels in selector
        this.currentCalendarMonth = null; // Track which month is shown in the calendar

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

        // Debug tool buttons
        this.attachDebugListeners();
    }

    /**
     * Attach listeners for debug tool buttons
     */
    attachDebugListeners() {
        const resetLevelBtn = document.getElementById('debugResetLevel');
        const resetAllBtn = document.getElementById('debugResetAll');
        const showAllLevelsCheckbox = document.getElementById('debugShowAllLevels');

        if (resetLevelBtn) {
            resetLevelBtn.addEventListener('click', () => this.resetCurrentLevel());
        }
        if (resetAllBtn) {
            resetAllBtn.addEventListener('click', () => this.resetAllData());
        }
        if (showAllLevelsCheckbox) {
            showAllLevelsCheckbox.addEventListener('change', (e) => {
                this.showAllLevels = e.target.checked;
                this.populateLevelList();
            });
        }
    }

    /**
     * Reset the current level by deleting the player's saved submission
     * and reloading the level to its initial state
     */
    resetCurrentLevel() {
        const currentDate = this.game.currentDate;
        if (!currentDate) return;

        this.game.deleteSubmission(currentDate);

        // Reset submission state on the game object
        this.game.isSubmitted = false;
        this.game.submittedScore = null;
        this.game.submittedWalls = null;
        this.game.viewingOptimal = false;

        // Reset the grid to its initial state
        this.game.grid.reset();
        this.game.wallCount = 0;
        this.game.render();
        this.game.updateWallCounter();
        this.game.updateAreaSizeDisplay();
        this.game.updateResetButton();
        this.game.updateSolutionToggleBar();
    }

    /**
     * Reset all local data by deleting all cookies and reloading the page
     */
    resetAllData() {
        // Delete all cloud data if available
        if (typeof CloudSync !== 'undefined' && CloudSync.isConfigured() && CloudSync.isLoggedIn()) {
            CloudSync.deleteAllSubmissions();
        }
        CookieUtils.deleteAllCookies();
        window.location.reload();
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
     * Populate the level list as a calendar view, grouped by month.
     * Only shows levels dated today or before, unless showAllLevels debug flag is set.
     */
    populateLevelList() {
        const levelList = document.getElementById('levelList');
        if (!levelList || !this.mapsDatabase) return;

        levelList.innerHTML = '';

        // Get current level from cookie or today's date
        const currentDate = this._getCurrentLevelDate();
        const today = DateUtils.getTodayDate();

        // Filter out future dates unless debug showAllLevels is enabled
        let dates = Object.keys(this.mapsDatabase).sort();
        if (!this.showAllLevels) {
            dates = dates.filter(date => date <= today);
        }

        if (dates.length === 0) return;

        // Group dates by YYYY-MM
        const monthGroups = {};
        dates.forEach(date => {
            const month = date.substring(0, 7);
            if (!monthGroups[month]) monthGroups[month] = [];
            monthGroups[month].push(date);
        });

        const sortedMonths = Object.keys(monthGroups).sort();

        // Default to the most recent month, or reset if current month no longer valid
        if (!this.currentCalendarMonth || !monthGroups[this.currentCalendarMonth]) {
            this.currentCalendarMonth = sortedMonths[sortedMonths.length - 1];
        }

        // "Go To Today" button
        const todayBtn = document.createElement('button');
        todayBtn.className = 'calendar-today-btn';
        todayBtn.textContent = 'Go To Today';
        todayBtn.addEventListener('click', () => {
            const todayMonth = today.substring(0, 7);
            if (monthGroups[todayMonth]) {
                renderMonth(todayMonth);
            }
            if (this.mapsDatabase[today]) {
                this.selectLevel(today);
            }
        });
        levelList.appendChild(todayBtn);

        // Build navigation bar
        const nav = document.createElement('div');
        nav.className = 'calendar-nav';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'calendar-nav-btn';
        prevBtn.textContent = '‹';
        prevBtn.setAttribute('aria-label', 'Previous month');

        const monthLabel = document.createElement('span');
        monthLabel.className = 'calendar-month-label';

        const nextBtn = document.createElement('button');
        nextBtn.className = 'calendar-nav-btn';
        nextBtn.textContent = '›';
        nextBtn.setAttribute('aria-label', 'Next month');

        nav.appendChild(prevBtn);
        nav.appendChild(monthLabel);
        nav.appendChild(nextBtn);
        levelList.appendChild(nav);

        const calendarContainer = document.createElement('div');
        calendarContainer.className = 'calendar-container';
        levelList.appendChild(calendarContainer);

        const renderMonth = (yearMonth) => {
            this.currentCalendarMonth = yearMonth;
            const currentMonthIdx = sortedMonths.indexOf(yearMonth);

            const [year, month] = yearMonth.split('-');
            const labelDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            monthLabel.textContent = labelDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

            prevBtn.disabled = currentMonthIdx === 0;
            nextBtn.disabled = currentMonthIdx === sortedMonths.length - 1;

            calendarContainer.innerHTML = '';
            this._renderCalendarGrid(calendarContainer, yearMonth, monthGroups[yearMonth] || [], currentDate);
        };

        prevBtn.addEventListener('click', () => {
            const idx = sortedMonths.indexOf(this.currentCalendarMonth);
            if (idx > 0) renderMonth(sortedMonths[idx - 1]);
        });

        nextBtn.addEventListener('click', () => {
            const idx = sortedMonths.indexOf(this.currentCalendarMonth);
            if (idx < sortedMonths.length - 1) renderMonth(sortedMonths[idx + 1]);
        });

        renderMonth(this.currentCalendarMonth);
    }

    /**
     * Render a calendar grid for a given month into the provided container.
     * @param {HTMLElement} container - Container element to render into
     * @param {string} yearMonth - Month string in "YYYY-MM" format
     * @param {string[]} datesInMonth - Array of date strings with levels in this month
     * @param {string} currentDate - Currently active level date
     */
    _renderCalendarGrid(container, yearMonth, datesInMonth, currentDate) {
        const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const [year, month] = yearMonth.split('-').map(Number);
        const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
        const daysInMonth = new Date(year, month, 0).getDate();

        // Build a lookup: day-of-month → full date string
        const dateLookup = {};
        datesInMonth.forEach(date => {
            const day = parseInt(date.split('-')[2]);
            dateLookup[day] = date;
        });

        const grid = document.createElement('div');
        grid.className = 'calendar-grid';

        // Day-of-week headers
        DAY_HEADERS.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = day;
            grid.appendChild(header);
        });

        // Empty cells before the first day
        for (let i = 0; i < firstDayOfWeek; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day calendar-day-empty';
            grid.appendChild(empty);
        }

        // Day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            const date = dateLookup[day];

            if (date) {
                const mapData = this.mapsDatabase[date];
                cell.className = 'calendar-day calendar-day-level';
                if (date === currentDate) {
                    cell.classList.add('active');
                }

                const submission = this.game.loadSubmission(date);
                let statusHtml = '';
                if (submission) {
                    const metGoal = submission.score >= mapData.goal;
                    statusHtml = `<span class="calendar-status">${metGoal ? '🏆' : '✓'}</span>`;
                }

                cell.innerHTML = `
                    <span class="calendar-day-num">${day}</span>
                    <span class="calendar-level-num">Day ${mapData.dayNumber}</span>
                    <span class="calendar-level-name">${mapData.mapName}</span>
                    ${statusHtml}
                `;
                cell.addEventListener('click', () => this.selectLevel(date));
            } else {
                cell.className = 'calendar-day';
                cell.innerHTML = `<span class="calendar-day-num">${day}</span>`;
            }

            grid.appendChild(cell);
        }

        container.appendChild(grid);
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
     * Load a specific level into the game.
     * Fully resets game state to match the new level, including grid size,
     * submission state, and optimal solution data.
     * @param {Object} mapData - Map data object from maps.json
     */
    async loadLevel(mapData) {
        // Update map info display
        if (typeof updateMapInfo === 'function') {
            updateMapInfo(mapData);
        }

        // Load the map (parse compact string format, then load 2D array)
        this.game.grid.loadMap(parseCompactMap(mapData.map, mapData.size));
        this.game.grid.saveInitialState();
        this.game.wallCount = 0;

        // Set goal and maxWalls
        if (mapData.goal !== undefined) {
            this.game.goalAreaSize = mapData.goal;
        }
        if (mapData.maxWalls !== undefined) {
            this.game.maxWalls = mapData.maxWalls;
        }

        // Update current date and optimal solution (parse compact flat array into pairs)
        this.game.currentDate = mapData.date || null;
        this.game.optimalSolution = mapData.optimalSolution ?
            parseCompactSolution(mapData.optimalSolution) : null;

        // Reset submission state for the new level
        this.game.isSubmitted = false;
        this.game.submittedScore = null;
        this.game.submittedWalls = null;
        this.game.viewingOptimal = false;

        // Check if user has already submitted for this puzzle
        if (mapData.date) {
            const submission = this.game.loadSubmission(mapData.date);
            if (submission) {
                this.game.isSubmitted = true;
                this.game.submittedScore = submission.score;
                this.game.submittedWalls = submission.walls;

                // Restore submitted wall positions
                for (const [row, col] of submission.walls) {
                    if (this.game.isValidPosition(row, col) && this.game.grid.getTile(row, col) === 'grass') {
                        this.game.grid.setTile(row, col, 'wall');
                        this.game.wallCount++;
                    }
                }
            }
        }

        // Render the game
        this.game.render();
        this.game.updateWallCounter();
        this.game.updateAreaSizeDisplay();
        this.game.updateResetButton();
        this.game.updateSolutionToggleBar();
        this.game.updateLegend();
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
     * Format date string for display.
     * Delegates to DateUtils for shared implementation.
     * @param {string} dateStr - ISO date string
     * @returns {string} Formatted date
     */
    _formatDate(dateStr) {
        return DateUtils.formatDate(dateStr);
    }

    /**
     * Get current level date from cookie or default to today
     * @returns {string} Date string
     */
    _getCurrentLevelDate() {
        const saved = CookieUtils.getCookie('currentLevel');
        if (saved) return saved;
        return DateUtils.getTodayDate();
    }

    /**
     * Save current level to cookie
     * @param {string} date - Date string to save
     */
    _saveCurrentLevelToCookie(date) {
        CookieUtils.setCookie('currentLevel', date, 365);
    }

    /**
     * Save pet emoji to cookie
     * @param {string} petEmoji - Pet emoji to save
     */
    _savePetToCookie(petEmoji) {
        CookieUtils.setCookie('selectedPet', petEmoji, 365);
    }

    /**
     * Save hint mode to cookie
     * @param {string} hintMode - Hint mode to save
     */
    _saveHintModeToCookie(hintMode) {
        CookieUtils.setCookie('hintMode', hintMode, 365);
    }

    /**
     * Save debug mode to cookie
     * @param {boolean} enabled - Debug mode state
     */
    _saveDebugModeToCookie(enabled) {
        CookieUtils.setCookie('debugMode', enabled ? 'true' : 'false', 365);
    }

    /**
     * Load debug mode from cookie
     * @returns {boolean} Debug mode state
     */
    _loadDebugModeFromCookie() {
        const value = CookieUtils.getCookie('debugMode');
        return value === 'true';
    }

}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Menu;
}
