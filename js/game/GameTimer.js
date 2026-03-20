/**
 * GameTimer Mixin
 *
 * Timer-related methods for any web game that needs pause, resume, and lock
 * functionality. Applied to a game class via:
 *   Object.assign(MyGame.prototype, GameTimerMixin);
 *
 * The host class must initialise these instance variables in its constructor:
 *   this.elapsedSeconds  = 0;
 *   this._timerInterval  = null;
 *   this.isTimerLocked   = false;
 *   this.isPaused        = false;
 *   this.isReadyPending  = false;
 *
 * Methods that deal with game-specific state (loadBestState, updateBestStateBanner,
 * updateSolutionToggleBar, loadSubmission) must be defined on the host class.
 */

// CSS selectors for game elements to hide when the pause overlay is shown.
const PAUSE_HIDDEN_SELECTORS = [
    '.controls-top',
    '.controls-bottom',
    '.controls-hints',
    '.grid-container',
    '#solutionToggleBar',
    '#roamSpaceViewer',
];

const GameTimerMixin = {

    // =====================================================================
    // Initialisation
    // =====================================================================

    /**
     * Initialise and start the timer for a specific puzzle date.
     * Loads any previously saved elapsed time from cookie or submission.
     * Call this after setting isSubmitted and currentDate for the level.
     * @param {string} dateString - Puzzle date (YYYY-MM-DD)
     */
    initTimerForDate(dateString) {
        this._stopTimerInterval();
        this.isTimerLocked = false;
        this.isPaused = false;
        this.isReadyPending = false;
        this._hidePauseOverlay();

        if (this.isSubmitted) {
            // Load locked time from submission data
            const submission = this.loadSubmission(dateString);
            this.elapsedSeconds = (submission && submission.time !== undefined) ? submission.time : 0;
            this.isTimerLocked = true;
        } else {
            // Load running elapsed time from timer cookie
            const saved = CookieUtils.getCookie(`timer_${dateString}`);
            if (saved) {
                try {
                    this.elapsedSeconds = JSON.parse(saved).elapsed || 0;
                } catch {
                    this.elapsedSeconds = 0;
                }
            } else {
                this.elapsedSeconds = 0;
            }
        }

        // Load best state before showing the pause overlay so game elements are
        // captured by PAUSE_HIDDEN_SELECTORS when the overlay appears.
        this.loadBestState(dateString);
        this.updateBestStateBanner();

        if (!this.isSubmitted) {
            // Show ready overlay — timer starts only when user clicks Begin
            this.isReadyPending = true;
            this.isPaused = true;
            this._showPauseOverlay();
        }

        this.updateTimerDisplay();
        this.updateTimerButton();
    },

    // =====================================================================
    // Interval Management
    // =====================================================================

    /**
     * Start the timer interval if conditions allow (not locked, not paused).
     * @private
     */
    _startTimerInterval() {
        if (this._timerInterval) return;
        if (this.isTimerLocked) return;
        if (this.isPaused) return;

        this._timerInterval = setInterval(() => {
            this.elapsedSeconds++;
            this.updateTimerDisplay();
            // Persist every 30 seconds to avoid excessive cookie writes
            if (this.elapsedSeconds % 30 === 0) {
                this._saveTimerState();
            }
        }, 1000);
    },

    /**
     * Stop the timer interval without changing pause/lock state.
     * @private
     */
    _stopTimerInterval() {
        if (this._timerInterval) {
            clearInterval(this._timerInterval);
            this._timerInterval = null;
        }
    },

    /**
     * Save the current elapsed time to a cookie and sync to cloud if logged in.
     * Does nothing if the timer is locked (time is stored in submission).
     * @private
     */
    _saveTimerState() {
        if (!this.currentDate || this.isTimerLocked) return;
        CookieUtils.setCookie(
            `timer_${this.currentDate}`,
            JSON.stringify({ elapsed: this.elapsedSeconds }),
            365
        );
        if (typeof CloudSync !== 'undefined' && CloudSync.isConfigured() && CloudSync.isLoggedIn()) {
            CloudSync.saveTimerState(this.currentDate, this.elapsedSeconds);
        }
    },

    // =====================================================================
    // Pause / Resume / Lock
    // =====================================================================

    /**
     * Pause the timer and show the pause overlay.
     * Has no effect if the timer is already locked or already paused.
     * Called by the timer button, menu open, and tab-hide events.
     */
    pauseTimer() {
        if (this.isTimerLocked || this.isPaused) return;
        this.isPaused = true;
        this._stopTimerInterval();
        this._saveTimerState();
        this._showPauseOverlay();
        this.updateTimerButton();
    },

    /**
     * Resume the timer and hide the pause overlay.
     * The only way to leave the paused state — called exclusively by the Resume button.
     * Has no effect if the timer is locked or not paused.
     */
    resumeTimer() {
        if (this.isTimerLocked || !this.isPaused) return;
        this.isReadyPending = false;
        this.isPaused = false;
        this._hidePauseOverlay();
        this._startTimerInterval();
        this.updateTimerButton();
    },

    /**
     * Handle document visibility changes (tab switching / minimising).
     * Pauses the timer when the tab is hidden; never auto-resumes.
     * @private
     */
    _handleVisibilityChange() {
        if (document.hidden && !this.isTimerLocked && !this.isPaused) {
            this.isPaused = true;
            this._stopTimerInterval();
            this._saveTimerState();
            this._showPauseOverlay();
            this.updateTimerButton();
        }
        // Becoming visible: stay paused — user must click Resume
    },

    /**
     * Lock the timer after submission.
     * Saves the final elapsed time and removes the running-timer cookie.
     */
    lockTimer() {
        this._stopTimerInterval();
        this.isTimerLocked = true;
        this.isPaused = false;
        this._hidePauseOverlay();
        // Remove the running timer cookie; final time is stored in the submission cookie
        if (this.currentDate) {
            CookieUtils.deleteCookie(`timer_${this.currentDate}`);
        }
        this.updateTimerDisplay();
        this.updateTimerButton();
    },

    /**
     * Reset the timer to zero for the current puzzle (used by debug reset).
     */
    resetTimer() {
        this._stopTimerInterval();
        this.elapsedSeconds = 0;
        this.isTimerLocked = false;
        this.isPaused = false;
        this._hidePauseOverlay();
        if (this.currentDate) {
            CookieUtils.deleteCookie(`timer_${this.currentDate}`);
            // Clear best state when fully resetting the level
            CookieUtils.deleteCookie(`progress_${this.currentDate}`);
        }
        this.bestScore = null;
        this.bestWalls = null;
        this.updateBestStateBanner();
        this._startTimerInterval();
        this.updateTimerDisplay();
        this.updateTimerButton();
    },

    // =====================================================================
    // Display Updates
    // =====================================================================

    /**
     * Update the timer value shown in the DOM.
     */
    updateTimerDisplay() {
        const timerValue = document.getElementById('timerValue');
        if (timerValue) {
            timerValue.textContent = this._formatTime(this.elapsedSeconds);
        }
    },

    /**
     * Update the timer button appearance based on current state.
     * When locked: disabled, shows stopwatch icon.
     * When paused: disabled (Resume button is the only way out), shows play icon.
     * When running: enabled, shows pause icon.
     */
    updateTimerButton() {
        const timerBtn = document.getElementById('timerBtn');
        const timerIcon = document.getElementById('timerIcon');
        if (!timerBtn) return;

        if (this.isTimerLocked) {
            timerBtn.disabled = true;
            timerBtn.classList.remove('paused');
            timerBtn.title = I18N.t('timer_locked_title');
            if (timerIcon) timerIcon.textContent = I18N.t('timer_locked_icon');
        } else if (this.isPaused) {
            timerBtn.disabled = true;
            timerBtn.classList.add('paused');
            timerBtn.title = I18N.t('timer_resume_title');
            if (timerIcon) timerIcon.textContent = I18N.t('timer_play_icon');
        } else {
            timerBtn.disabled = false;
            timerBtn.classList.remove('paused');
            timerBtn.title = I18N.t('timer_pause_title');
            if (timerIcon) timerIcon.textContent = I18N.t('timer_pause_icon');
        }
    },

    // =====================================================================
    // Helpers
    // =====================================================================

    /**
     * Format seconds into a MM:SS or H:MM:SS string.
     * @param {number} totalSeconds - Total elapsed seconds
     * @returns {string} Formatted time string
     */
    _formatTime(totalSeconds) {
        const s = Math.floor(totalSeconds);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        if (h > 0) {
            return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
        }
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    },

    // =====================================================================
    // Pause Overlay
    // =====================================================================

    /**
     * Show the pause overlay and hide the game controls and grid.
     * @private
     */
    _showPauseOverlay() {
        const overlay = document.getElementById('pauseOverlay');
        if (overlay) {
            const pauseTitle = document.getElementById('pauseTitle');
            if (pauseTitle) pauseTitle.textContent = this.isReadyPending ? I18N.t('ready_title') : I18N.t('pause_title');
            const pauseTime = document.getElementById('pauseTime');
            if (pauseTime) {
                pauseTime.textContent = this._formatTime(this.elapsedSeconds);
                pauseTime.style.visibility = this.elapsedSeconds > 0 ? 'visible' : 'hidden';
            }
            const resumeBtn = document.getElementById('resumeBtn');
            if (resumeBtn) resumeBtn.textContent = this.elapsedSeconds > 0 ? I18N.t('btn_resume') : I18N.t('btn_begin');
            overlay.style.display = 'flex';
        }
        for (const selector of PAUSE_HIDDEN_SELECTORS) {
            const el = document.querySelector(selector);
            if (el) {
                el.dataset.pauseHidden = el.style.display;
                el.style.display = 'none';
            }
        }
    },

    /**
     * Hide the pause overlay and restore the game controls and grid.
     * Only restores elements that were explicitly hidden by _showPauseOverlay.
     * @private
     */
    _hidePauseOverlay() {
        const overlay = document.getElementById('pauseOverlay');
        if (overlay) overlay.style.display = 'none';
        for (const selector of PAUSE_HIDDEN_SELECTORS) {
            const el = document.querySelector(selector);
            if (el && 'pauseHidden' in el.dataset) {
                el.style.display = el.dataset.pauseHidden;
                delete el.dataset.pauseHidden;
            }
        }
        // Re-sync the solution toggle bar visibility after restoring from pause,
        // ensuring it only shows when a solution has been submitted.
        this.updateSolutionToggleBar();
    },
};

// Export for Node.js (Jest tests); in the browser the object is a global.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameTimerMixin;
}
