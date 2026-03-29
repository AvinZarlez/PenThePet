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
        this._loadedYears = new Set(); // Track which years have been fetched
        this._isSyncing = false; // Whether a cloud sync is currently in progress
        this._pendingLevelSelection = null; // Level queued to load once sync finishes
        this.currentMapData = null; // Full map data for the currently loaded level

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

        // Instructions shortcut button (direct access without opening menu first)
        const instrShortcutBtn = document.getElementById('instrShortcutBtn');
        if (instrShortcutBtn) {
            instrShortcutBtn.addEventListener('click', () => this.openInstructions());
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

        // Tell Your Friends buttons (About modal and Options modal)
        const tellFriendsAboutBtn = document.getElementById('tellFriendsAboutBtn');
        if (tellFriendsAboutBtn) {
            tellFriendsAboutBtn.addEventListener('click', () => this.game.handleTellFriends());
        }
        const tellFriendsOptionsBtn = document.getElementById('tellFriendsOptionsBtn');
        if (tellFriendsOptionsBtn) {
            tellFriendsOptionsBtn.addEventListener('click', () => this.game.handleTellFriends());
        }
    }

    /**
     * Attach listeners for options modal controls
     */
    attachOptionsListeners() {
        const modalPetType = document.getElementById('modalPetType');
        const modalHintsDisabled = document.getElementById('modalHintsDisabled');
        const modalNeverShowTarget = document.getElementById('modalNeverShowTarget');
        const modalTimezone = document.getElementById('modalTimezone');
        const modalLanguage = document.getElementById('modalLanguage');

        if (modalPetType) {
            modalPetType.addEventListener('change', (e) => {
                this.game.petEmoji = e.target.value;
                this._savePetToCookie(this.game.petEmoji);
                this.game.render();
                this.game.updateLegend();
            });
        }

        if (modalHintsDisabled) {
            modalHintsDisabled.addEventListener('change', (e) => {
                this.game.hintsDisabled = e.target.checked;
                this._saveHintsDisabledToCookie(this.game.hintsDisabled);
                // When hints are disabled, neverShowTarget checkbox is forced on (visual only)
                // When hints are re-enabled, restore the actual game preference
                if (modalNeverShowTarget) {
                    if (this.game.hintsDisabled) {
                        modalNeverShowTarget.checked = true;
                        modalNeverShowTarget.disabled = true;
                    } else {
                        modalNeverShowTarget.checked = this.game.neverShowTarget;
                        modalNeverShowTarget.disabled = false;
                    }
                }
                this.game.updateHintButton();
            });
        }

        if (modalNeverShowTarget) {
            modalNeverShowTarget.addEventListener('change', (e) => {
                this.game.neverShowTarget = e.target.checked;
                this._saveNeverShowTargetToCookie(this.game.neverShowTarget);
                this.game.updateHintButton();
            });
        }

        if (modalTimezone) {
            modalTimezone.addEventListener('change', (e) => {
                this._saveTimezoneToCookie(e.target.value);
            });
        }

        if (modalLanguage) {
            modalLanguage.addEventListener('change', (e) => {
                I18N.setLanguage(e.target.value);
                if (typeof CloudSync !== 'undefined' && CloudSync.isConfigured() && CloudSync.isLoggedIn()) {
                    CloudSync.saveSettings({ lang: e.target.value });
                }
                window.location.reload();
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
        const shareMapUrlBtn = document.getElementById('debugShareMapUrl');

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
        if (shareMapUrlBtn) {
            shareMapUrlBtn.addEventListener('click', () => this.shareMapUrl());
        }
    }

    /**
     * Generate a shareable URL containing the current level's full map data
     * encoded as a base64url string in the `?map=` parameter, then copy it
     * to the clipboard.  Recipients can paste the URL directly into a browser
     * to play the exact same puzzle, and their progress is saved independently
     * under a stable content-based key.
     */
    shareMapUrl() {
        if (typeof MapURLCodec === 'undefined') {
            if (this.game && typeof this.game.showNotification === 'function') {
                this.game.showNotification(I18N.t('copied_failed'));
            }
            return;
        }
        if (!this.currentMapData) return;
        const encoded = MapURLCodec.encodeMapData(this.currentMapData);
        const base = window.location.origin + window.location.pathname;
        const url = `${base}?map=${encoded}`;
        if (this.game && typeof this.game._copyToClipboard === 'function') {
            this.game._copyToClipboard(url);
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
        this.game.hintsUsed = [];

        // Reset the grid to its initial state
        this.game.grid.reset();
        this.game.wallCount = 0;
        this.game.render();
        this.game.updateWallCounter();
        this.game.updateAreaSizeDisplay();
        this.game.updateResetButton();
        this.game.updateSolutionToggleBar();

        // Reset the timer to zero for this puzzle
        if (typeof this.game.resetTimer === 'function') {
            this.game.resetTimer();
        }
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
        if (this.game && typeof this.game.pauseTimer === 'function') {
            this.game.pauseTimer();
        }
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
        if (this.game && typeof this.game.pauseTimer === 'function') {
            this.game.pauseTimer();
        }

        // Open the modal immediately so the UI feels responsive
        const levelSelectorModal = document.getElementById('levelSelectorModal');
        if (levelSelectorModal) {
            levelSelectorModal.classList.add('show');
        }

        // Load maps database if not already loaded (show loading state while waiting)
        if (!this.mapsDatabase) {
            this._showLevelListLoading();
            await this.loadMapsDatabase();
        }

        // Kick off cloud sync in the background without blocking the UI.
        // While syncing, the calendar renders with unknown (???) completion badges.
        if (!this._isSyncing &&
            typeof CloudSync !== 'undefined' &&
            CloudSync.isConfigured() &&
            CloudSync.isLoggedIn()) {
            this._isSyncing = true;
            this.populateLevelList();
            CloudSync.syncNow().then(() => {
                this._isSyncing = false;
                this.populateLevelList();
                const levelSelectorModal = document.getElementById('levelSelectorModal');
                const isModalOpen = levelSelectorModal && levelSelectorModal.classList.contains('show');
                if (this._pendingLevelSelection && isModalOpen) {
                    const date = this._pendingLevelSelection;
                    this._pendingLevelSelection = null;
                    this._loadPendingLevel(date);
                }
            }).catch(() => {
                this._isSyncing = false;
                this.populateLevelList();
            });
        } else {
            this.populateLevelList();
        }
    }

    /**
     * Load maps database from per-year files in the maps/ directory.
     * Initially loads the current year and the previous year; additional years
     * are loaded lazily via _loadYearIfNeeded() as the user navigates.
     */
    async loadMapsDatabase() {
        try {
            this.mapsDatabase = {};
            const currentYear = new Date().getFullYear();
            await this._loadYearIfNeeded(currentYear);
            await this._loadYearIfNeeded(currentYear - 1);
        } catch (error) {
            console.error('Error loading maps database:', error);
            this.mapsDatabase = {};
        }
    }

    /**
     * Fetch a year's map file and merge it into mapsDatabase if not already loaded.
     * Silently skips years that have no file yet.
     * @param {number} year - The four-digit year to load
     * @returns {Promise<void>}
     */
    async _loadYearIfNeeded(year) {
        if (this._loadedYears.has(year)) return;
        this._loadedYears.add(year); // mark as attempted even on failure
        try {
            const response = await fetch(`maps/${year}.json`);
            if (response.ok) {
                Object.assign(this.mapsDatabase, await response.json());
            }
        } catch { /* year file not found — skip */ }
    }

    /**
     * Display a loading indicator inside the level list.
     * Called while maps are being fetched before the calendar can render.
     * @private
     */
    _showLevelListLoading() {
        const levelList = document.getElementById('levelList');
        if (!levelList) return;
        levelList.innerHTML = `<p class="level-list-loading">${I18N.t('level_selector_loading')}</p>`;
    }

    /**
     * Populate the level list as a calendar view, grouped by month.
     * Only shows levels dated today or before, unless showAllLevels debug flag is set.
     * When the user reaches the first or last loaded month, adjacent years are
     * fetched on demand from maps/YYYY.json.
     */
    populateLevelList() {
        const levelList = document.getElementById('levelList');
        if (!levelList || !this.mapsDatabase) return;

        levelList.innerHTML = '';

        // Get current level from cookie or today's date
        const currentDate = this._getCurrentLevelDate();
        const today = DateUtils.getTodayDate(this._loadTimezoneFromCookie());

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

        // Default to the most recent month; fall back if the current month has no maps
        if (!this.currentCalendarMonth || !monthGroups[this.currentCalendarMonth]) {
            this.currentCalendarMonth = sortedMonths[sortedMonths.length - 1];
        }

        // "Go To Today" button
        const todayBtn = document.createElement('button');
        todayBtn.className = 'calendar-today-btn';
        todayBtn.textContent = I18N.t('calendar_go_to_today');
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
        prevBtn.textContent = I18N.t('calendar_prev');
        prevBtn.setAttribute('aria-label', I18N.t('calendar_prev_aria'));

        const monthLabel = document.createElement('span');
        monthLabel.className = 'calendar-month-label';

        const nextBtn = document.createElement('button');
        nextBtn.className = 'calendar-nav-btn';
        nextBtn.textContent = I18N.t('calendar_next');
        nextBtn.setAttribute('aria-label', I18N.t('calendar_next_aria'));

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

        prevBtn.addEventListener('click', async () => {
            const idx = sortedMonths.indexOf(this.currentCalendarMonth);
            if (idx > 0) {
                renderMonth(sortedMonths[idx - 1]);
            } else {
                // At the earliest loaded month — try to fetch the previous year
                const prevYear = parseInt(sortedMonths[0].substring(0, 4)) - 1;
                if (prevYear >= CONSTANTS.FIRST_MAP_YEAR) {
                    const before = Object.keys(this.mapsDatabase).length;
                    await this._loadYearIfNeeded(prevYear);
                    if (Object.keys(this.mapsDatabase).length > before) {
                        // New data loaded: navigate to December of that year then rebuild
                        this.currentCalendarMonth = `${prevYear}-12`;
                        this.populateLevelList();
                    }
                }
            }
        });

        nextBtn.addEventListener('click', async () => {
            const idx = sortedMonths.indexOf(this.currentCalendarMonth);
            if (idx < sortedMonths.length - 1) {
                renderMonth(sortedMonths[idx + 1]);
            } else {
                // At the latest loaded month — try to fetch the next year
                const nextYear = parseInt(sortedMonths[sortedMonths.length - 1].substring(0, 4)) + 1;
                const maxLoadYear = parseInt(today.substring(0, 4)) + 1;
                if (nextYear <= maxLoadYear) {
                    const before = Object.keys(this.mapsDatabase).length;
                    await this._loadYearIfNeeded(nextYear);
                    if (Object.keys(this.mapsDatabase).length > before) {
                        // New data loaded: navigate to January of that year then rebuild
                        this.currentCalendarMonth = `${nextYear}-01`;
                        this.populateLevelList();
                    }
                }
            }
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
                if (this._isSyncing) {
                    // Show unknown badge while cloud sync is in progress
                    statusHtml = `<span class="calendar-status calendar-status-syncing">${I18N.t('level_selector_sync_unknown')}</span>`;
                } else if (submission) {
                    const metGoal = submission.score >= mapData.goal;
                    statusHtml = `<span class="calendar-status">${metGoal ? '🏆' : '✓'}</span>`;
                }

                cell.innerHTML = `
                    <span class="calendar-day-num">${day}</span>
                    <span class="calendar-level-num">${I18N.t('calendar_day_label', { dayNumber: mapData.dayNumber })}</span>
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
     * Select and load a specific level.
     * If a cloud sync is currently in progress, the level load is queued
     * and executed automatically once the sync completes.
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

        // If cloud sync is still in progress, queue the level load.
        // The calendar re-renders to highlight the pending selection so the
        // user can see their choice, and the level will load once sync finishes.
        if (this._isSyncing) {
            this._pendingLevelSelection = date;
            this.populateLevelList();
            return;
        }

        // Close modal and load the selected level
        this.closeAllModals();
        const mapData = this.mapsDatabase[date];
        await this.loadLevel(mapData);
    }

    /**
     * Load a level that was queued while a cloud sync was in progress.
     * Called automatically after sync resolves.
     * @param {string} date - Date string of the level to load
     * @private
     */
    async _loadPendingLevel(date) {
        if (!this.mapsDatabase || !this.mapsDatabase[date]) return;
        this.closeAllModals();
        const mapData = this.mapsDatabase[date];
        await this.loadLevel(mapData);
    }

    /**
     * Load a specific level into the game.
     * Fully resets game state to match the new level, including grid size,
     * submission state, and optimal solution data.
     * @param {Object} mapData - Map data object from maps/YYYY.json or decoded from ?map=
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

        // Determine the save key.  Custom maps loaded from ?map= carry a
        // content-based _saveKey; regular levels use their YYYY-MM-DD date.
        const saveKey = mapData._saveKey || mapData.date || null;

        // Update current date/save-key, custom-map flag, and optimal solution.
        this.game.currentDate = saveKey;
        this.game.isCustomMapLevel = !!(mapData._saveKey);
        this.game.optimalSolution = mapData.optimalSolution ?
            parseCompactSolution(mapData.optimalSolution) : null;

        // Keep currentMapData in sync so the "Share Map URL" button always
        // encodes whichever level is currently loaded.
        this.currentMapData = mapData;

        // Reset submission state for the new level
        this.game.isSubmitted = false;
        this.game.submittedScore = null;
        this.game.submittedWalls = null;
        this.game.viewingOptimal = false;

        // Check if user has already submitted for this puzzle
        if (saveKey) {
            const submission = this.game.loadSubmission(saveKey);
            if (submission) {
                this.game.isSubmitted = true;
                this.game.submittedScore = submission.score;
                this.game.submittedWalls = submission.walls;

                // Restore submitted wall positions
                for (const [row, col] of submission.walls) {
                    if (this.game.isValidPosition(row, col) && isWallPlaceable(this.game.grid.getTile(row, col))) {
                        this.game.grid.setTile(row, col, getWallTransform(this.game.grid.getTile(row, col)));
                        this.game.wallCount++;
                    }
                }
            }
        }

        // Load hints AFTER submission so the merge includes any hintsUsed
        // that arrived via cloud sync as part of the submission document.
        this.game.hintsUsed = saveKey ? this.game.loadHintsUsed(saveKey) : [];

        // Render the game
        this.game.render();
        this.game.updateWallCounter();
        this.game.updateAreaSizeDisplay();
        this.game.updateResetButton();
        this.game.updateSolutionToggleBar();
        this.game.updateLegend();

        // Initialise the timer for the new level
        if (typeof this.game.initTimerForDate === 'function' && saveKey) {
            this.game.initTimerForDate(saveKey);
        }
    }

    /**
     * Open the instructions modal
     */
    openInstructions() {
        this.closeAllModals();
        if (this.game && typeof this.game.pauseTimer === 'function') {
            this.game.pauseTimer();
        }
        this._populateTileDescriptions();
        const instructionsModal = document.getElementById('instructionsModal');
        if (instructionsModal) {
            instructionsModal.classList.add('show');
        }
    }

    /**
     * Populate the tile descriptions list from TILE_DATA.
     * Each tile with a description is rendered as a row with its
     * first asset icon and description text.
     * @private
     */
    _populateTileDescriptions() {
        const container = document.getElementById('tileDescriptions');
        if (!container || container.children.length > 0) return;

        for (const [tileName, data] of Object.entries(TILE_DATA)) {
            if (!data.descriptionKey) continue;

            const row = document.createElement('div');
            row.className = 'tile-desc-row';

            const icon = document.createElement('div');
            icon.className = 'tile-desc-icon';

            if (TileSvgs.TILE_SVGS_TILES.has(tileName)) {
                // Tiles managed by TileSvgs use dynamically-generated SVG layers
                const baseUri = TileSvgs.getTileBaseUri(tileName, false);
                if (baseUri) {
                    const img = document.createElement('img');
                    img.src = baseUri;
                    img.alt = '';
                    img.setAttribute('aria-hidden', 'true');
                    icon.appendChild(img);
                }
                const variantUri = TileSvgs.getTileVariantUri(tileName, 0, false);
                if (variantUri) {
                    const img = document.createElement('img');
                    img.src = variantUri;
                    img.alt = '';
                    img.setAttribute('aria-hidden', 'true');
                    icon.appendChild(img);
                }
                // Icon tiles (home, star, bee) also have a static overlay icon
                if (data.backgroundGroup && data.assets && data.assets.length > 0) {
                    for (const asset of data.assets) {
                        if (asset.endsWith('.svg')) {
                            const img = document.createElement('img');
                            img.src = `assets/${asset}`;
                            img.alt = '';
                            img.setAttribute('aria-hidden', 'true');
                            icon.appendChild(img);
                        }
                    }
                }
            } else if (data.assets && data.assets.length > 0) {
                for (const asset of data.assets) {
                    if (asset.endsWith('.svg')) {
                        const img = document.createElement('img');
                        img.src = `assets/${asset}`;
                        img.alt = '';
                        img.setAttribute('aria-hidden', 'true');
                        icon.appendChild(img);
                    }
                }
            }

            const text = document.createElement('span');
            text.className = 'tile-desc-text';
            text.textContent = I18N.t(data.descriptionKey);

            row.appendChild(icon);
            row.appendChild(text);
            container.appendChild(row);
        }
    }

    /**
     * Open the about modal
     */
    openAbout() {
        this.closeAllModals();
        if (this.game && typeof this.game.pauseTimer === 'function') {
            this.game.pauseTimer();
        }
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
        if (this.game && typeof this.game.pauseTimer === 'function') {
            this.game.pauseTimer();
        }

        // Populate pet type options
        this.populateModalPetOptions();

        // Populate timezone options
        this.populateModalTimezoneOptions();

        // Populate language options
        this.populateModalLanguageOptions();

        // Set current values
        const modalPetType = document.getElementById('modalPetType');
        const modalHintsDisabled = document.getElementById('modalHintsDisabled');
        const modalNeverShowTarget = document.getElementById('modalNeverShowTarget');
        const modalTimezone = document.getElementById('modalTimezone');
        const modalLanguage = document.getElementById('modalLanguage');

        if (modalPetType) {
            modalPetType.value = this.game.petEmoji;
        }
        if (modalHintsDisabled) {
            modalHintsDisabled.checked = this.game.hintsDisabled;
        }
        if (modalNeverShowTarget) {
            modalNeverShowTarget.checked = this.game.neverShowTarget;
            // Gray out if hints are disabled
            modalNeverShowTarget.disabled = this.game.hintsDisabled;
        }
        if (modalTimezone) {
            modalTimezone.value = this._loadTimezoneFromCookie();
        }
        if (modalLanguage) {
            modalLanguage.value = (typeof I18N !== 'undefined') ? I18N.getLanguage() : 'en';
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
     * Populate timezone options in the modal timezone selector
     */
    populateModalTimezoneOptions() {
        const modalTimezone = document.getElementById('modalTimezone');
        if (!modalTimezone) return;

        modalTimezone.innerHTML = '';

        CONSTANTS.TIMEZONE_OPTIONS.forEach(tz => {
            const option = document.createElement('option');
            option.value = tz.value;
            option.textContent = tz.label;
            modalTimezone.appendChild(option);
        });
    }

    /**
     * Populate language options in the modal language selector
     */
    populateModalLanguageOptions() {
        const modalLanguage = document.getElementById('modalLanguage');
        if (!modalLanguage) return;

        modalLanguage.innerHTML = '';

        const languageOptions = (typeof LANGUAGE_OPTIONS !== 'undefined') ? LANGUAGE_OPTIONS : [];
        languageOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            modalLanguage.appendChild(option);
        });
    }

    /**
     * Close a specific modal.
     * If the level selector is closed while a sync is pending, any queued
     * level selection is cancelled so it does not load unexpectedly later.
     * @param {HTMLElement} modal - Modal element to close
     */
    closeModal(modal) {
        if (modal) {
            modal.classList.remove('show');
            if (modal.id === 'levelSelectorModal') {
                this._pendingLevelSelection = null;
            }
        }
    }

    /**
     * Close all modals.
     * Also cancels any queued level selection (same reasoning as closeModal).
     */
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.classList.remove('show'));
        this._pendingLevelSelection = null;
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
        return DateUtils.getTodayDate(this._loadTimezoneFromCookie());
    }

    /**
     * Returns true when CloudSync is configured and the user is signed in.
     * Use this guard before any cloud upload call in Menu methods.
     * @returns {boolean}
     */
    _shouldSyncToCloud() {
        return typeof CloudSync !== 'undefined' &&
            CloudSync.isConfigured() &&
            CloudSync.isLoggedIn();
    }

    /**
     * Save current level to cookie.
     * NOTE: currentLevel is intentionally NOT synced to cloud — it is a
     * transient UI preference (which puzzle is open) that is device-local.
     * @param {string} date - Date string to save
     */
    _saveCurrentLevelToCookie(date) {
        CookieUtils.setCookie('currentLevel', date, 365);
    }

    /**
     * Save pet emoji to cookie and sync to cloud.
     * To add a new synced setting: follow this pattern — write the cookie,
     * then call CloudSync.saveSettings() with the new key/value pair.
     * @param {string} petEmoji - Pet emoji to save
     */
    _savePetToCookie(petEmoji) {
        CookieUtils.setCookie('selectedPet', petEmoji, 365);
        // Sync to cloud so the preference is available on other devices.
        if (this._shouldSyncToCloud()) {
            CloudSync.saveSettings({ selectedPet: petEmoji });
        }
    }

    /**
     * Save hints disabled setting to cookie and sync to cloud.
     * @param {boolean} disabled - Whether hints are disabled
     */
    _saveHintsDisabledToCookie(disabled) {
        CookieUtils.setCookie('hintsDisabled', disabled ? 'true' : 'false', 365);
        // Sync to cloud so the preference is available on other devices.
        if (this._shouldSyncToCloud()) {
            CloudSync.saveSettings({ hintsDisabled: disabled ? 'true' : 'false' });
        }
    }

    /**
     * Save neverShowTarget setting to cookie and sync to cloud.
     * @param {boolean} neverShowTarget - Whether target is never shown
     */
    _saveNeverShowTargetToCookie(neverShowTarget) {
        CookieUtils.setCookie('neverShowTarget', neverShowTarget ? 'true' : 'false', 365);
        // Sync to cloud so the preference is available on other devices.
        if (this._shouldSyncToCloud()) {
            CloudSync.saveSettings({ neverShowTarget: neverShowTarget ? 'true' : 'false' });
        }
    }

    /**
     * Save timezone preference to cookie.
     * NOTE: timezone is intentionally NOT synced to cloud — it is a
     * device-local preference tied to the user's physical location.
     * @param {string} timezone - IANA timezone string to save
     */
    _saveTimezoneToCookie(timezone) {
        CookieUtils.setCookie('timezone', timezone, 365);
    }

    /**
     * Load timezone preference from cookie.
     * Falls back to CONSTANTS.DEFAULT_TIMEZONE if not set.
     * @returns {string} IANA timezone string
     */
    _loadTimezoneFromCookie() {
        return CookieUtils.getCookie('timezone') || CONSTANTS.DEFAULT_TIMEZONE;
    }

    /**
     * Save debug mode to cookie.
     * NOTE: debugMode is intentionally NOT synced to cloud — it is a
     * developer tool that is per-device by design.
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
