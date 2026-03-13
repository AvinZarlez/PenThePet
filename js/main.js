/**
 * Main Application Entry Point
 * 
 * Initializes the game when the page loads.
 * Modify this file to change initialization behavior or add global event handlers.
 */

/* global parseCompactMap, parseCompactSolution */

let game;
let menu;

/** Regex matching a valid YYYY-MM-DD date string. */
const DATE_PARAM_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Module-level holder for the URL parameter error message produced during
 * the last loadTodayMap() call. Reset to null at the start of each call.
 * Read by initGame() to show the persistent error banner.
 */
let _urlParamError = null;

/**
 * Read the `date` and `level` query-string parameters from the current URL.
 * `date` takes priority: when both are present the caller should ignore `level`.
 * Returns null fields when the parameters are absent.
 *
 * @param {string} [_searchOverride] - Optional search string for testing (e.g. '?date=2026-01-01')
 * @returns {{ urlDate: string|null, urlLevel: string|null }}
 */
function getUrlParams(_searchOverride) {
    const search = _searchOverride !== undefined
        ? _searchOverride
        : (typeof window !== 'undefined' && window.location ? window.location.search : '');
    const params = new URLSearchParams(search);
    return {
        urlDate: params.get('date'),
        urlLevel: params.get('level'),
    };
}

/**
 * Resolve the intended map entry and any error message from URL parameters.
 * When resolution succeeds, `error` is null. On failure, `map` is null and the
 * caller should fall back to the default (latest) level.
 *
 * @param {{ urlDate: string|null, urlLevel: string|null }} urlParams
 * @param {Object} mapsDb - Full maps database keyed by date string
 * @param {string} today  - Today's date in YYYY-MM-DD format
 * @returns {{ map: Object|null, error: string|null }}
 */
function resolveMapFromUrlParams(urlParams, mapsDb, today) {
    const { urlDate, urlLevel } = urlParams;

    // Date takes priority over level when both are supplied.
    if (urlDate !== null) {
        return _resolveByDate(urlDate, mapsDb, today);
    }
    if (urlLevel !== null) {
        return _resolveByLevel(urlLevel, mapsDb, today);
    }
    return { map: null, error: null };
}

/**
 * @param {string} urlDate
 * @param {Object} mapsDb
 * @param {string} today
 * @returns {{ map: Object|null, error: string|null }}
 */
function _resolveByDate(urlDate, mapsDb, today) {
    try {
        if (!DATE_PARAM_REGEX.test(urlDate)) {
            return {
                map: null,
                error: I18N.t('url_param_invalid', { value: urlDate, param: 'date' }),
            };
        }
        if (urlDate > today) {
            return {
                map: null,
                error: I18N.t('url_param_future_date', { value: urlDate }),
            };
        }
        if (!mapsDb[urlDate]) {
            return {
                map: null,
                error: I18N.t('url_param_not_found', { value: urlDate }),
            };
        }
        return { map: mapsDb[urlDate], error: null };
    } catch (err) {
        console.error('URL param: error resolving date', err);
        return {
            map: null,
            error: I18N.t('url_param_error', { param: 'date' }),
        };
    }
}

/**
 * @param {string} urlLevel
 * @param {Object} mapsDb
 * @param {string} today
 * @returns {{ map: Object|null, error: string|null }}
 */
function _resolveByLevel(urlLevel, mapsDb, today) {
    try {
        // Special value: "latest" loads today's map, bypassing any saved cookie.
        if (urlLevel === 'latest') {
            if (mapsDb[today]) {
                return { map: mapsDb[today], error: null };
            }
            // Fall back to the most recent past date if today is not in the DB.
            const pastDates = Object.keys(mapsDb).filter(d => d <= today).sort();
            if (pastDates.length > 0) {
                return { map: mapsDb[pastDates[pastDates.length - 1]], error: null };
            }
            return {
                map: null,
                error: I18N.t('url_param_not_found', { value: urlLevel }),
            };
        }

        const levelNum = parseInt(urlLevel, 10);
        if (!/^\d+$/.test(urlLevel) || levelNum < 1) {
            return {
                map: null,
                error: I18N.t('url_param_invalid', { value: urlLevel, param: 'level' }),
            };
        }
        // Find the map with a matching dayNumber that is at or before today.
        const match = Object.values(mapsDb).find(
            m => m.dayNumber === levelNum && m.date <= today
        );
        if (!match) {
            return {
                map: null,
                error: I18N.t('url_param_not_found', { value: urlLevel }),
            };
        }
        return { map: match, error: null };
    } catch (err) {
        console.error('URL param: error resolving level', err);
        return {
            map: null,
            error: I18N.t('url_param_error', { param: 'level' }),
        };
    }
}

/**
 * Load today's map from the database or from cookie selection.
 * Falls back to the latest available level if today's map doesn't exist.
 *
 * When URL parameters are present the function resolves the requested level
 * without updating the lastVisitDate cookie (so the next regular visit still
 * counts as the first visit of the day). Any error (future date, missing
 * level, malformed param) is stored in the module-level _urlParamError
 * variable and a fallback map is returned.
 *
 * @param {{ urlDate?: string|null, urlLevel?: string|null }} [_testUrlParams]
 *   Optional URL params override used only in unit tests.
 * @returns {Promise<Object|null>} Map data or null if not found
 */
async function loadTodayMap(_testUrlParams) {
    _urlParamError = null;
    try {
        // Determine today's date using the user's saved timezone preference.
        const timezone = CookieUtils.getCookie('timezone') || CONSTANTS.DEFAULT_TIMEZONE;
        const today = DateUtils.getTodayDate(timezone);
        const currentYear = parseInt(today.substring(0, 4), 10);

        // Read URL params (use test override when supplied).
        const urlParams = _testUrlParams !== undefined
            ? _testUrlParams
            : getUrlParams();
        const hasUrlParams = urlParams.urlDate !== null || urlParams.urlLevel !== null;

        // Collect which year files to fetch.
        const yearsToLoad = new Set([currentYear]);

        // savedLevel is only used when there are no URL params.
        let savedLevel = null;

        if (hasUrlParams) {
            // Do NOT update lastVisitDate when loading via URL param so that
            // the next normal visit still treats it as the first visit of the day.
            if (urlParams.urlDate && DATE_PARAM_REGEX.test(urlParams.urlDate)) {
                // We know the year from the date string.
                yearsToLoad.add(parseInt(urlParams.urlDate.substring(0, 4), 10));
            } else if (urlParams.urlLevel) {
                // We don't know the year, so load all years with map data.
                for (let y = CONSTANTS.FIRST_MAP_YEAR; y <= currentYear; y++) {
                    yearsToLoad.add(y);
                }
            }
        } else {
            // Normal flow: update the last-visit cookie and honour the cookie
            // selection (unless it is the first visit of the day).
            const lastVisitDate = CookieUtils.getCookie('lastVisitDate');
            const isFirstVisitToday = lastVisitDate !== today;
            CookieUtils.setCookie('lastVisitDate', today, 2);

            savedLevel = isFirstVisitToday ? null : CookieUtils.getCookie('currentLevel');
            if (savedLevel) {
                yearsToLoad.add(parseInt(savedLevel.substring(0, 4), 10));
            }
        }

        // Load and merge maps from the required year files.
        const mapsDb = {};
        for (const year of yearsToLoad) {
            try {
                const response = await fetch(`maps/${year}.json`);
                if (response.ok) {
                    Object.assign(mapsDb, await response.json());
                }
            } catch { /* year file not found — skip */ }
        }

        // ── URL parameter resolution ──────────────────────────────────────
        if (hasUrlParams) {
            const { map, error } = resolveMapFromUrlParams(urlParams, mapsDb, today);
            if (map) return map;
            // Param was invalid/not found — record the error and fall through to
            // the default resolution so the game still loads something playable.
            _urlParamError = error;
        }

        // ── Default resolution (cookie → today → latest past) ─────────────
        // Check cookie-selected level (set above when !hasUrlParams).
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
 * Show a persistent error banner for URL parameter problems.
 * Uses the #urlParamError element (already in the DOM) so the game still loads.
 * @param {string} message - The error message to display
 */
function showUrlParamError(message) {
    const banner = document.getElementById('urlParamError');
    if (banner) {
        banner.textContent = message;
        banner.style.display = 'block';
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
    // Load today's map from database (may set _urlParamError as a side-effect).
    const mapData = await loadTodayMap();
    
    if (!mapData) {
        showNoMapError();
        return;
    }

    // Show the URL param error banner if one was generated during map resolution.
    if (_urlParamError) {
        showUrlParamError(_urlParamError);
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
    module.exports = { loadTodayMap, resolveMapFromUrlParams };
}

