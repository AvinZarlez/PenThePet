/**
 * Analytics Module
 *
 * Optional Firebase Analytics wrapper. All methods are no-ops when
 * FIREBASE_CONFIG.measurementId is not configured, so the rest of the
 * codebase can call Analytics.trackXxx() unconditionally without guarding.
 *
 * Only anonymous, privacy-preserving events are logged — no user IDs, email
 * addresses, or personally-identifiable information.
 *
 * Events tracked (useful for development):
 *   level_loaded     — player opened a puzzle (daily active-user proxy)
 *   level_completed  — player submitted their solution (completion rate,
 *                      score distribution, perfect-score rate, time-to-solve)
 *   hint_used        — player used a hint (difficulty signal)
 *   js_error         — an unhandled JavaScript error occurred
 *
 * To enable analytics on your fork see docs/FIREBASE_SETUP.md.
 */

const Analytics = (() => {
    let _instance = null;

    // ------------------------------------------------------------------
    // Internal helpers
    // ------------------------------------------------------------------

    /** @returns {boolean} True when a Firebase Measurement ID is present. */
    function isConfigured() {
        return typeof FIREBASE_CONFIG !== 'undefined' && !!FIREBASE_CONFIG.measurementId;
    }

    /**
     * Forward an event to firebase.analytics().  Silently no-ops when
     * Analytics is not initialised or when the SDK is unavailable.
     * @param {string} name - Firebase event name
     * @param {Object} [params] - Optional event parameters
     */
    function _logEvent(name, params) {
        if (!_instance) return;
        try {
            _instance.logEvent(name, params || {});
        } catch (e) {
            console.warn('Analytics: logEvent failed:', e);
        }
    }

    // ------------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------------

    /**
     * Initialise Firebase Analytics.
     * Must be called after firebase.initializeApp() has already been
     * invoked (e.g. after CloudSync.init()).  Safe to call multiple times.
     */
    function init() {
        if (!isConfigured()) return;
        if (typeof firebase === 'undefined') {
            console.warn('Analytics: Firebase SDK not loaded');
            return;
        }
        try {
            // Ensure the Firebase app is initialised (CloudSync may have done
            // this already; initializeApp is idempotent with the same config).
            if (!firebase.apps.length) {
                firebase.initializeApp(FIREBASE_CONFIG);
            }
            _instance = firebase.analytics();
        } catch (e) {
            console.warn('Analytics: Initialisation failed:', e);
        }
    }

    /**
     * Track when a puzzle level is loaded / opened.
     * Used as a daily active-user proxy: one event per level load.
     * @param {string} date - Puzzle date string (YYYY-MM-DD)
     * @param {boolean} alreadyCompleted - Whether the user had already submitted this level
     */
    function trackLevelLoaded(date, alreadyCompleted) {
        _logEvent('level_loaded', {
            puzzle_date: date,
            already_completed: !!alreadyCompleted,
        });
    }

    /**
     * Track when a player submits their solution.
     * @param {string} date - Puzzle date string (YYYY-MM-DD)
     * @param {number} score - Player's submitted score
     * @param {number} goalScore - Optimal / target score for this puzzle
     * @param {number} wallsUsed - Number of walls the player placed
     * @param {number} elapsedSeconds - Time taken (in seconds) to solve
     * @param {boolean} isPerfect - Whether the player achieved the optimal score
     * @param {number} hintsUsedCount - Number of hints used during this attempt
     */
    function trackLevelCompleted(date, score, goalScore, wallsUsed, elapsedSeconds, isPerfect, hintsUsedCount) {
        _logEvent('level_completed', {
            puzzle_date: date,
            score: score,
            goal_score: goalScore,
            walls_used: wallsUsed,
            elapsed_seconds: elapsedSeconds,
            is_perfect: !!isPerfect,
            hints_used_count: hintsUsedCount,
        });
    }

    /**
     * Track when a player uses a hint.
     * @param {string} date - Puzzle date string (YYYY-MM-DD)
     * @param {string} hintType - Hint type identifier (e.g. CONSTANTS.HINT_CHECKED)
     */
    function trackHintUsed(date, hintType) {
        _logEvent('hint_used', {
            puzzle_date: date,
            hint_type: hintType,
        });
    }

    /**
     * Track an unhandled JavaScript error.
     * Useful for detecting regressions in production without a dedicated
     * error-monitoring service.
     * @param {string} message - Error message (truncated to 150 characters)
     * @param {string} source - Where the error originated (e.g. file name or module)
     */
    function trackError(message, source) {
        _logEvent('js_error', {
            error_message: String(message).substring(0, 150),
            error_source: String(source).substring(0, 100),
        });
    }

    return {
        isConfigured,
        init,
        trackLevelLoaded,
        trackLevelCompleted,
        trackHintUsed,
        trackError,
    };
})();

// Export for Node.js / Jest test environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Analytics;
}
