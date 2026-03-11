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
        // Determine today's date using the user's saved timezone preference.
        const timezone = CookieUtils.getCookie('timezone') || CONSTANTS.DEFAULT_TIMEZONE;
        const today = DateUtils.getTodayDate(timezone);
        const currentYear = parseInt(today.substring(0, 4));

        // On the first visit of a new calendar day, bypass the saved level cookie so
        // the user always opens today's puzzle rather than whatever they last played.
        const lastVisitDate = CookieUtils.getCookie('lastVisitDate');
        const isFirstVisitToday = lastVisitDate !== today;
        CookieUtils.setCookie('lastVisitDate', today, 2);

        // Always load this year's map file; also load the saved level's year if different.
        // Skip the saved level on the first visit of the day (load today instead).
        const savedLevel = isFirstVisitToday ? null : CookieUtils.getCookie('currentLevel');
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
            <p class="subtitle">${I18N.t('subtitle')}</p>
            
            <div class="error-message">
                <h2>${I18N.t('no_map_title')}</h2>
                <p>${I18N.t('no_map_text', { date: DateUtils.getTodayDate() })}</p>
                <p>${I18N.t('no_map_check_back')}</p>
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
    
    // Load hint settings from cookies if available
    const savedHintsDisabled = CookieUtils.getCookie('hintsDisabled');
    if (savedHintsDisabled !== null) {
        game.hintsDisabled = savedHintsDisabled === 'true';
    }
    const savedNeverShowTarget = CookieUtils.getCookie('neverShowTarget');
    if (savedNeverShowTarget !== null) {
        game.neverShowTarget = savedNeverShowTarget === 'true';
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
                game.grid.setTile(row, col, getWallTransform(tile));
                game.wallCount++;
            }
        }
    }

    // Load hints AFTER submission so the merge includes any hintsUsed
    // that arrived via cloud sync as part of the submission document.
    game.hintsUsed = game.loadHintsUsed(mapData.date);
    
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
    
    // Debug tools are hidden by default; CloudSync will enable them for game testers after auth
    menu.updateDebugToolsVisibility(false);
    
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

    // Update all GitHub links in the page from the canonical REPO_URL constant
    // so there is a single place to change the URL if the repo ever moves.
    const repoUrl = (typeof CONSTANTS !== 'undefined' && CONSTANTS.REPO_URL) || '';
    if (repoUrl) {
        const footerLink = document.getElementById('githubFooterLink');
        if (footerLink) footerLink.href = repoUrl;
        const projectLink = document.getElementById('githubProjectLink');
        if (projectLink) projectLink.href = repoUrl;
        const issuesLink = document.getElementById('githubIssuesLink');
        if (issuesLink) issuesLink.href = repoUrl + '/issues';
        const syncErrorIssueLink = document.getElementById('syncErrorIssueLink');
        if (syncErrorIssueLink) syncErrorIssueLink.href = repoUrl + '/issues';
    }

    // Initialise cloud sync (no-ops if Firebase is not configured)
    if (typeof CloudSync !== 'undefined') {
        CloudSync.init();

        // After any sync completes, refresh the displayed level state.
        // Full reload: submission appeared, disappeared, or data changed.
        // Timer-only refresh: update the timer display in-place without interrupting
        //   an in-progress game (avoids wiping wall placements or resetting the overlay).
        // See docs/FIREBASE_SETUP.md for the full sync trigger table.
        document.addEventListener('cloudsync:synced', async function () {
            if (!menu || !game || !game.currentDate) return;

            // Collect dates overwritten by cloud data so we can notify the user.
            const cloudOverwrites = typeof CloudSync !== 'undefined'
                ? CloudSync.getAndClearCloudOverwrites()
                : new Set();

            const currentSubmission = game.loadSubmission(game.currentDate);
            const hasSubmissionNow = currentSubmission !== null;
            const submissionStateChanged = game.isSubmitted !== hasSubmissionNow;
            // Reload if score or time differs — catches score-wins merges changing either field.
            const submissionDataChanged = game.isSubmitted && currentSubmission && (
                currentSubmission.score !== game.submittedScore ||
                (typeof currentSubmission.time === 'number' && typeof game.elapsedSeconds === 'number' &&
                    currentSubmission.time !== game.elapsedSeconds));

            if (submissionStateChanged || submissionDataChanged) {
                if (menu.mapsDatabase && menu.mapsDatabase[game.currentDate]) {
                    await menu.loadLevel(menu.mapsDatabase[game.currentDate]);
                    // Only notify when existing submission data changed (score/time).
                    // Going from non-submitted → submitted is visually obvious from the
                    // board reload — no notification needed for that transition.
                    if (submissionDataChanged && cloudOverwrites.has(game.currentDate) &&
                        game && typeof game.showNotification === 'function') {
                        game.showNotification(I18N.t('cloud_data_loaded'));
                    }
                } else {
                    // mapsDatabase not yet loaded (level selector never opened).
                    // The submission cookie has already been updated by the sync;
                    // reload the page so the level re-renders with the correct state.
                    window.location.reload();
                }
                return;
            }

            // No submission change — update the timer display if the synced
            // timer value is higher than the current in-memory value.
            // (applyCloudTimerState already max-merged the cookie; this syncs the game object.)
            if (!game.isTimerLocked) {
                const saved = CookieUtils.getCookie(`timer_${game.currentDate}`);
                if (saved) {
                    try {
                        const syncedElapsed = JSON.parse(saved).elapsed || 0;
                        if (syncedElapsed > game.elapsedSeconds) {
                            game.elapsedSeconds = syncedElapsed;
                            game.updateTimerDisplay();
                        }
                    } catch (e) { console.warn('CloudSync: Failed to parse timer cookie:', e); }
                }
            }
        });

        // Pause the game when the auth modal opens (same behaviour as opening the menu).
        // Does NOT trigger a sync — the timer's cookie save is ignored by the isSyncing guard.
        document.addEventListener('cloudsync:openmodal', function () {
            if (game && typeof game.pauseTimer === 'function') {
                game.pauseTimer();
            }
        });
    }

    // Initialise analytics (no-ops if measurementId is not configured).
    // Must run after CloudSync.init() which calls firebase.initializeApp().
    if (typeof Analytics !== 'undefined') {
        Analytics.init();
        Analytics.trackLevelLoaded(mapData.date, game.isSubmitted);
    }
}

// Start the game when the DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
    // Register a global error handler to track unexpected JS errors via analytics.
    // Errors from cross-origin scripts are intentionally excluded (message is "Script error.").
    window.addEventListener('error', function (event) {
        if (typeof Analytics !== 'undefined' && event.message !== 'Script error.') {
            Analytics.trackError(event.message, event.filename || 'unknown');
        }
    });

    // Load saved language preference and apply translated strings to the DOM
    I18N.loadFromCookie();

    // Populate language selector options from LANGUAGE_OPTIONS
    const langSelector = document.getElementById('languageSelector');
    if (langSelector) {
        langSelector.innerHTML = '';
        LANGUAGE_OPTIONS.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            langSelector.appendChild(option);
        });
        langSelector.value = I18N.getLanguage();
        langSelector.addEventListener('change', () => {
            // Persist the chosen language to cookie (and cloud), then reload so
            // every piece of text — tile descriptions, overlays, etc. — is
            // re-rendered from scratch in the selected language without needing
            // individual update hooks.
            I18N.setLanguage(langSelector.value);
            if (typeof CloudSync !== 'undefined' && CloudSync.isConfigured() && CloudSync.isLoggedIn()) {
                CloudSync.saveSettings({ lang: langSelector.value });
            }
            window.location.reload();
        });
    }

    // Apply translated strings to static HTML elements
    I18N.applyTranslations();

    initGame();
});

// Export for use in Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadTodayMap };
}

