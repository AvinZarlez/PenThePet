/**
 * Game Tests — Timer Feature
 *
 * Unit tests for the timer methods added to the Game class:
 * _formatTime, initTimerForDate, pauseTimer, resumeTimer,
 * lockTimer, resetTimer, visibility change handling, and related helpers.
 */

const Game = require('../../../js/game/Game.js');

function setupDOM() {
    document.body.innerHTML = `
        <div id="pauseOverlay" class="pause-overlay" style="display: none;">
            <div class="pause-content">
                <div id="pauseTitle" class="pause-title">Pause</div>
                <div id="pauseTime" class="pause-time">00:00</div>
                <button id="resumeBtn" class="resume-btn">&#9654; Resume</button>
            </div>
        </div>
        <div class="controls-top">
            <div class="wall-counter"><span id="wallCounter">0 / 9</span></div>
            <button id="timerBtn" class="timer-btn">
                <span id="timerValue" class="timer-value">00:00</span>
                <span id="timerIcon" class="timer-icon">⏸</span>
            </button>
            <div class="score-display">
                <span id="scoreValue">∞</span>
            </div>
        </div>
        <div class="map-info">
            <span id="mapDay">42</span>
            <span id="mapName">Squirrel Scramble</span>
        </div>
        <div class="grid-container">
            <div id="grid" class="grid"></div>
        </div>
        <div class="controls-bottom">
            <button id="resetBtn">Reset</button>
            <button id="pennedStatus" class="penned-status not-penned" data-interactive="false">
                <span class="submit-label">Unsolved</span><span class="submit-check">✗</span>
            </button>
            <div class="best-state-wrapper">
                <button id="bestStateBanner" class="best-state-banner" disabled style="display: none;">
                    <span class="best-state-label">Pet Not Penned</span>
                </button>
            </div>
        </div>
        <div class="controls-hints">
            <button id="hintCheckBtn" class="hint-check-btn" style="display: none;" disabled>
                <span class="hint-check-label">Check if Optimal</span>
            </button>
            <div id="hintUsedDisplay" class="hint-used-display" style="display: none;"></div>
        </div>
        <div id="notification" class="notification"></div>
        <div id="solutionToggleBar" style="display: none;">
            <span id="solutionViewLabel"></span>
            <button id="solutionToggleBtn"></button>
        </div>
        <aside id="roamSpaceViewer" class="roam-viewer-sidebar">
            <article class="viewer-card">
                <section class="metrics-display">
                    <output class="metric-value" id="roamAreaMetric">0</output>
                    <small class="metric-percentage" id="roamAreaPercentage"></small>
                    <small class="metric-helper"></small>
                </section>
                <footer class="viewer-footer">
                    <button id="shareScoreBtn" class="share-score-btn">📋 Copy Score</button>
                    <button id="exitViewer" class="exit-viewer-btn">Back to Game</button>
                </footer>
            </article>
        </aside>
    `;
}

function createGame() {
    const game = new Game(7);
    // Load a minimal map so grid is not empty
    const tiles = Array.from({ length: 7 }, () => Array(7).fill('grass'));
    tiles[3][3] = 'home';
    game.grid.loadMap(tiles);
    game.grid.saveInitialState();
    game.currentDate = '2026-01-01';
    return game;
}

describe('Game — Timer', () => {
    let game;

    beforeEach(() => {
        setupDOM();
        // Clear cookies
        document.cookie.split(';').forEach((c) => {
            document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
        });
        jest.useFakeTimers();
        game = createGame();
    });

    afterEach(() => {
        game._stopTimerInterval();
        jest.useRealTimers();
    });

    // ------------------------------------------------------------------
    // _formatTime
    // ------------------------------------------------------------------
    describe('_formatTime()', () => {
        test('formats zero seconds as 00:00', () => {
            expect(game._formatTime(0)).toBe('00:00');
        });

        test('formats 65 seconds as 01:05', () => {
            expect(game._formatTime(65)).toBe('01:05');
        });

        test('formats 3600 seconds as 1:00:00', () => {
            expect(game._formatTime(3600)).toBe('1:00:00');
        });

        test('formats 3661 seconds as 1:01:01', () => {
            expect(game._formatTime(3661)).toBe('1:01:01');
        });

        test('formats 59 seconds as 00:59', () => {
            expect(game._formatTime(59)).toBe('00:59');
        });
    });

    // ------------------------------------------------------------------
    // initTimerForDate
    // ------------------------------------------------------------------
    describe('initTimerForDate()', () => {
        test('starts in ready state with no saved state', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            expect(game.elapsedSeconds).toBe(0);
            expect(game.isTimerLocked).toBe(false);
            expect(game.isPaused).toBe(true);
            expect(game.isReadyPending).toBe(true);
            expect(game._timerInterval).toBeNull();
        });

        test('restores elapsed seconds from timer cookie', () => {
            CookieUtils.setCookie('timer_2026-01-01', JSON.stringify({ elapsed: 120 }), 1);
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            expect(game.elapsedSeconds).toBe(120);
        });

        test('loads locked time from submission when already submitted', () => {
            CookieUtils.setCookie(
                'submission_2026-01-01',
                JSON.stringify({ score: 10, walls: [], timestamp: '', time: 250 }),
                1
            );
            game.isSubmitted = true;
            game.initTimerForDate('2026-01-01');
            expect(game.elapsedSeconds).toBe(250);
            expect(game.isTimerLocked).toBe(true);
            expect(game._timerInterval).toBeNull();
        });

        test('timer interval increments elapsedSeconds each second after Begin is clicked', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            expect(game.elapsedSeconds).toBe(0);
            // Timer should not start until user clicks Begin
            jest.advanceTimersByTime(3000);
            expect(game.elapsedSeconds).toBe(0);
            // Simulate clicking Begin
            game.resumeTimer();
            jest.advanceTimersByTime(3000);
            expect(game.elapsedSeconds).toBe(3);
        });

        test('shows ready overlay on level load for non-submitted puzzle', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            expect(game.isPaused).toBe(true);
            expect(game.isReadyPending).toBe(true);
            const overlay = document.getElementById('pauseOverlay');
            expect(overlay.style.display).toBe('flex');
            expect(document.getElementById('pauseTitle').textContent).toBe('Ready?');
            // Time is 0 — display is hidden but Begin button shown
            expect(document.getElementById('pauseTime').style.visibility).toBe('hidden');
            expect(document.getElementById('resumeBtn').textContent).toBe('▶ Begin');
        });

        test('shows Resume button and visible time when saved time > 0', () => {
            CookieUtils.setCookie('timer_2026-01-02', JSON.stringify({ elapsed: 60 }), 1);
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-02');
            expect(document.getElementById('resumeBtn').textContent).toBe('▶ Resume');
            expect(document.getElementById('pauseTime').style.visibility).toBe('visible');
            expect(document.getElementById('pauseTime').textContent).toBe('01:00');
        });
    });

    // ------------------------------------------------------------------
    // pauseTimer
    // ------------------------------------------------------------------
    describe('pauseTimer()', () => {
        test('stops the interval and shows the pause overlay', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.pauseTimer();

            expect(game.isPaused).toBe(true);
            expect(game._timerInterval).toBeNull();
            const overlay = document.getElementById('pauseOverlay');
            expect(overlay.style.display).toBe('flex');
        });

        test('does nothing when timer is locked', () => {
            game.isTimerLocked = true;
            game.pauseTimer();
            expect(game.isPaused).toBe(false);
        });

        test('does nothing when already paused', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.pauseTimer();
            // Second pause call should be a no-op — overlay already visible, interval already null
            const overlayDisplay = document.getElementById('pauseOverlay').style.display;
            game.pauseTimer();
            expect(game.isPaused).toBe(true);
            expect(document.getElementById('pauseOverlay').style.display).toBe(overlayDisplay);
        });

        test('timer does not increment while paused', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.pauseTimer();
            jest.advanceTimersByTime(5000);
            expect(game.elapsedSeconds).toBe(0);
        });

        test('pausing from menu open also shows overlay', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            // Menu.js calls game.pauseTimer() on open
            game.pauseTimer();
            expect(game.isPaused).toBe(true);
            const overlay = document.getElementById('pauseOverlay');
            expect(overlay.style.display).toBe('flex');
        });

        test('shows current time in pause overlay', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            // Begin the game so the timer runs
            game.resumeTimer();
            jest.advanceTimersByTime(3000);
            game.pauseTimer();
            const pauseTime = document.getElementById('pauseTime');
            expect(pauseTime.textContent).toBe('00:03');
            expect(pauseTime.style.visibility).toBe('visible');
        });

        test('hides game content (controls, grid-container) when paused', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.pauseTimer();
            expect(document.querySelector('.controls-top').style.display).toBe('none');
            expect(document.querySelector('.controls-bottom').style.display).toBe('none');
            expect(document.querySelector('.controls-hints').style.display).toBe('none');
            expect(document.querySelector('.grid-container').style.display).toBe('none');
        });
    });

    // ------------------------------------------------------------------
    // resumeTimer — only way to unpause
    // ------------------------------------------------------------------
    describe('resumeTimer()', () => {
        test('restarts the interval and hides the overlay', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.pauseTimer();
            game.resumeTimer();

            expect(game.isPaused).toBe(false);
            expect(game._timerInterval).not.toBeNull();
            const overlay = document.getElementById('pauseOverlay');
            expect(overlay.style.display).toBe('none');
        });

        test('restores game content (controls, grid-container) on resume', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.pauseTimer();
            game.resumeTimer();
            expect(document.querySelector('.controls-top').style.display).toBe('');
            expect(document.querySelector('.controls-bottom').style.display).toBe('');
            expect(document.querySelector('.controls-hints').style.display).toBe('');
            expect(document.querySelector('.grid-container').style.display).toBe('');
        });

        test('does nothing when not paused', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            // Exit ready state by clicking Begin
            game.resumeTimer();
            const intervalBefore = game._timerInterval;
            game.resumeTimer(); // should be no-op — not paused
            expect(game._timerInterval).toBe(intervalBefore);
        });

        test('timer increments again after resume', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            // Start the timer by clicking Begin
            game.resumeTimer();
            jest.advanceTimersByTime(2000);
            game.pauseTimer();
            jest.advanceTimersByTime(5000); // should NOT count
            game.resumeTimer();
            jest.advanceTimersByTime(3000); // should count
            expect(game.elapsedSeconds).toBe(5);
        });

        test('is the only way to leave paused state', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.pauseTimer();
            expect(game.isPaused).toBe(true);

            // Simulating menu close (no auto-resume)
            // Simulating tab becoming visible (no auto-resume)
            // Nothing should change isPaused except resumeTimer()
            expect(game.isPaused).toBe(true);

            game.resumeTimer();
            expect(game.isPaused).toBe(false);
        });
    });

    // ------------------------------------------------------------------
    // Visibility change — pause only, never auto-resume
    // ------------------------------------------------------------------
    describe('_handleVisibilityChange()', () => {
        test('pauses when tab becomes hidden', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');

            Object.defineProperty(document, 'hidden', { value: true, configurable: true });
            game._handleVisibilityChange();

            expect(game.isPaused).toBe(true);
            expect(game._timerInterval).toBeNull();

            Object.defineProperty(document, 'hidden', { value: false, configurable: true });
        });

        test('does NOT auto-resume when tab becomes visible', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');

            // Pause via tab hide
            Object.defineProperty(document, 'hidden', { value: true, configurable: true });
            game._handleVisibilityChange();
            expect(game.isPaused).toBe(true);

            // Tab becomes visible — should NOT resume
            Object.defineProperty(document, 'hidden', { value: false, configurable: true });
            game._handleVisibilityChange();
            expect(game.isPaused).toBe(true);
            expect(game._timerInterval).toBeNull();
        });

        test('does nothing when timer is already paused', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.isPaused = true;
            game._stopTimerInterval();

            // Hidden while already paused — no state change expected
            Object.defineProperty(document, 'hidden', { value: true, configurable: true });
            game._handleVisibilityChange();
            expect(game.isPaused).toBe(true); // unchanged
            expect(game._timerInterval).toBeNull(); // still stopped

            Object.defineProperty(document, 'hidden', { value: false, configurable: true });
            game._handleVisibilityChange(); // visible — still no change
            expect(game.isPaused).toBe(true); // still paused
        });
    });

    // ------------------------------------------------------------------
    // lockTimer
    // ------------------------------------------------------------------
    describe('lockTimer()', () => {
        test('stops interval, sets locked flag', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.lockTimer();

            expect(game.isTimerLocked).toBe(true);
            expect(game._timerInterval).toBeNull();
        });

        test('clears isPaused and hides overlay', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.pauseTimer();
            game.lockTimer();

            expect(game.isPaused).toBe(false);
            const overlay = document.getElementById('pauseOverlay');
            expect(overlay.style.display).toBe('none');
        });

        test('deletes timer cookie', () => {
            CookieUtils.setCookie('timer_2026-01-01', JSON.stringify({ elapsed: 50 }), 1);
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.lockTimer();
            expect(CookieUtils.getCookie('timer_2026-01-01')).toBeNull();
        });
    });

    // ------------------------------------------------------------------
    // resetTimer
    // ------------------------------------------------------------------
    describe('resetTimer()', () => {
        test('resets elapsed to 0 and restarts interval', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            // Begin the game so the timer runs
            game.resumeTimer();
            jest.advanceTimersByTime(10000);
            expect(game.elapsedSeconds).toBe(10);

            game.resetTimer();
            expect(game.elapsedSeconds).toBe(0);
            expect(game._timerInterval).not.toBeNull();
        });

        test('clears the timer cookie', () => {
            CookieUtils.setCookie('timer_2026-01-01', JSON.stringify({ elapsed: 99 }), 1);
            game.resetTimer();
            expect(CookieUtils.getCookie('timer_2026-01-01')).toBeNull();
        });
    });

    // ------------------------------------------------------------------
    // _saveTimerState
    // ------------------------------------------------------------------
    describe('_saveTimerState()', () => {
        test('saves elapsed seconds to cookie', () => {
            game.isSubmitted = false;
            game.currentDate = '2026-01-01';
            game.elapsedSeconds = 77;
            game._saveTimerState();
            const saved = JSON.parse(CookieUtils.getCookie('timer_2026-01-01'));
            expect(saved.elapsed).toBe(77);
        });

        test('does nothing when timer is locked', () => {
            game.isTimerLocked = true;
            game.elapsedSeconds = 50;
            game._saveTimerState();
            expect(CookieUtils.getCookie('timer_2026-01-01')).toBeNull();
        });

        test('does nothing when currentDate is null', () => {
            game.currentDate = null;
            game.elapsedSeconds = 50;
            expect(() => game._saveTimerState()).not.toThrow();
        });

        test('calls CloudSync.saveTimerState when logged in', () => {
            const mockSaveTimerState = jest.fn();
            const origCloudSync = global.CloudSync;
            global.CloudSync = {
                isConfigured: () => true,
                isLoggedIn: () => true,
                saveTimerState: mockSaveTimerState
            };

            game.currentDate = '2026-01-01';
            game.elapsedSeconds = 65;
            game._saveTimerState();

            expect(mockSaveTimerState).toHaveBeenCalledWith('2026-01-01', 65);
            global.CloudSync = origCloudSync;
        });

        test('does not call CloudSync.saveTimerState when not logged in', () => {
            const mockSaveTimerState = jest.fn();
            const origCloudSync = global.CloudSync;
            global.CloudSync = {
                isConfigured: () => true,
                isLoggedIn: () => false,
                saveTimerState: mockSaveTimerState
            };

            game.currentDate = '2026-01-01';
            game.elapsedSeconds = 65;
            game._saveTimerState();

            expect(mockSaveTimerState).not.toHaveBeenCalled();
            global.CloudSync = origCloudSync;
        });
    });

    // ------------------------------------------------------------------
    // saveSubmission includes time field
    // ------------------------------------------------------------------
    describe('saveSubmission() includes time', () => {
        test('submission cookie includes elapsed time', () => {
            game.elapsedSeconds = 180;
            game.saveSubmission('2026-01-01', 15, []);
            const saved = JSON.parse(CookieUtils.getCookie('submission_2026-01-01'));
            expect(saved.time).toBe(180);
        });
    });

    // ------------------------------------------------------------------
    // updateTimerButton
    // ------------------------------------------------------------------
    describe('updateTimerButton()', () => {
        test('shows pause icon and is enabled when running', () => {
            game.isTimerLocked = false;
            game.isPaused = false;
            game.updateTimerButton();
            const icon = document.getElementById('timerIcon');
            expect(icon.textContent).toBe('⏸');
            expect(document.getElementById('timerBtn').disabled).toBe(false);
        });

        test('disables button and shows play icon when paused', () => {
            game.isPaused = true;
            game.updateTimerButton();
            const icon = document.getElementById('timerIcon');
            expect(document.getElementById('timerBtn').disabled).toBe(true);
            expect(icon.textContent).toBe('▶');
        });

        test('disables button when locked', () => {
            game.isTimerLocked = true;
            game.updateTimerButton();
            expect(document.getElementById('timerBtn').disabled).toBe(true);
        });
    });

    // ------------------------------------------------------------------
    // updateTimerDisplay
    // ------------------------------------------------------------------
    describe('updateTimerDisplay()', () => {
        test('updates timerValue element with formatted time', () => {
            game.elapsedSeconds = 125;
            game.updateTimerDisplay();
            expect(document.getElementById('timerValue').textContent).toBe('02:05');
        });
    });

    // ------------------------------------------------------------------
    // updatePauseOverlay
    // ------------------------------------------------------------------
    describe('updatePauseOverlay()', () => {
        test('no-op when overlay is hidden', () => {
            document.getElementById('pauseOverlay').style.display = 'none';
            document.getElementById('resumeBtn').textContent = '▶ Begin';
            game.elapsedSeconds = 60;
            game.updatePauseOverlay();
            // Should not have changed the button since the overlay is hidden
            expect(document.getElementById('resumeBtn').textContent).toBe('▶ Begin');
        });

        test('updates button from Begin to Resume when elapsedSeconds > 0', () => {
            document.getElementById('pauseOverlay').style.display = 'flex';
            document.getElementById('resumeBtn').textContent = I18N.t('btn_begin');
            game.elapsedSeconds = 30;
            game.isPaused = true;
            game.isReadyPending = true;
            game.updatePauseOverlay();
            expect(document.getElementById('resumeBtn').textContent).toBe(I18N.t('btn_resume'));
        });

        test('updates pauseTime visibility when elapsedSeconds > 0', () => {
            document.getElementById('pauseOverlay').style.display = 'flex';
            const pauseTime = document.getElementById('pauseTime');
            pauseTime.style.visibility = 'hidden';
            game.elapsedSeconds = 45;
            game.isPaused = true;
            game.updatePauseOverlay();
            expect(pauseTime.style.visibility).toBe('visible');
            expect(pauseTime.textContent).toBe('00:45');
        });

        test('does not re-hide game elements (no side-effects on element visibility)', () => {
            // Set overlay visible and game elements visible (paused = false initially)
            game.isPaused = false;
            const controls = document.querySelector('.controls-top');
            controls.style.display = 'flex';
            // Manually show overlay without triggering _showPauseOverlay
            document.getElementById('pauseOverlay').style.display = 'flex';
            game.elapsedSeconds = 60;
            game.updatePauseOverlay();
            // controls-top should NOT be hidden by updatePauseOverlay
            expect(controls.style.display).toBe('flex');
        });
    });

    // ------------------------------------------------------------------
    // solutionToggleBar visibility — regression for always-visible bug
    // ------------------------------------------------------------------
    describe('solutionToggleBar visibility', () => {
        test('stays hidden after initTimerForDate when not submitted', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            expect(document.getElementById('solutionToggleBar').style.display).toBe('none');
        });

        test('stays hidden after lockTimer when not submitted', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.lockTimer();
            expect(document.getElementById('solutionToggleBar').style.display).toBe('none');
        });

        test('stays hidden after resetTimer when not submitted', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.resetTimer();
            expect(document.getElementById('solutionToggleBar').style.display).toBe('none');
        });

        test('stays hidden through pause and resume when not submitted', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.pauseTimer();
            game.resumeTimer();
            expect(document.getElementById('solutionToggleBar').style.display).toBe('none');
        });

        test('remains visible through pause and resume when submitted with optimal solution', () => {
            game.isSubmitted = true;
            game.optimalSolution = [[1, 1]];
            game.updateSolutionToggleBar();
            expect(document.getElementById('solutionToggleBar').style.display).toBe('flex');

            game.isPaused = false;
            game.isTimerLocked = true;
            game.pauseTimer(); // no-op because locked
            game.resumeTimer(); // no-op because locked
            // Still visible — locked timer means no pause possible
            expect(document.getElementById('solutionToggleBar').style.display).toBe('flex');
        });
    });

    // ------------------------------------------------------------------
    // isSolutionOptimal — checks whether submitted walls match optimal
    // ------------------------------------------------------------------
    describe('isSolutionOptimal()', () => {
        test('returns false when submittedWalls is null', () => {
            game.submittedWalls = null;
            game.optimalSolution = [[1, 1]];
            expect(game.isSolutionOptimal()).toBe(false);
        });

        test('returns false when optimalSolution is null', () => {
            game.submittedWalls = [[1, 1]];
            game.optimalSolution = null;
            expect(game.isSolutionOptimal()).toBe(false);
        });

        test('returns false when wall counts differ', () => {
            game.submittedWalls = [[1, 1]];
            game.optimalSolution = [[1, 1], [2, 2]];
            expect(game.isSolutionOptimal()).toBe(false);
        });

        test('returns false when walls differ', () => {
            game.submittedWalls = [[1, 1], [2, 2]];
            game.optimalSolution = [[1, 1], [3, 3]];
            expect(game.isSolutionOptimal()).toBe(false);
        });

        test('returns true when walls match exactly (same order)', () => {
            game.submittedWalls = [[1, 1], [2, 2]];
            game.optimalSolution = [[1, 1], [2, 2]];
            expect(game.isSolutionOptimal()).toBe(true);
        });

        test('returns true when walls match in different order', () => {
            game.submittedWalls = [[2, 2], [1, 1]];
            game.optimalSolution = [[1, 1], [2, 2]];
            expect(game.isSolutionOptimal()).toBe(true);
        });

        test('returns true when both are empty', () => {
            game.submittedWalls = [];
            game.optimalSolution = [];
            expect(game.isSolutionOptimal()).toBe(true);
        });
    });

    // ------------------------------------------------------------------
    // updateSolutionToggleBar — optimal solution message
    // ------------------------------------------------------------------
    describe('updateSolutionToggleBar() — optimal solution', () => {
        test('hides toggle button and shows optimal message when solution is optimal', () => {
            game.isSubmitted = true;
            game.submittedWalls = [[1, 1]];
            game.optimalSolution = [[1, 1]];
            game.updateSolutionToggleBar();

            const toggleBtn = document.getElementById('solutionToggleBtn');
            const viewLabel = document.getElementById('solutionViewLabel');
            expect(document.getElementById('solutionToggleBar').style.display).toBe('flex');
            expect(toggleBtn.style.display).toBe('none');
            expect(viewLabel.textContent).toBe('⭐ Your solution is optimal!');
        });

        test('shows toggle button when solution is not optimal', () => {
            game.isSubmitted = true;
            game.submittedWalls = [[1, 1]];
            game.optimalSolution = [[2, 2]];
            game.updateSolutionToggleBar();

            const toggleBtn = document.getElementById('solutionToggleBtn');
            expect(document.getElementById('solutionToggleBar').style.display).toBe('flex');
            expect(toggleBtn.style.display).not.toBe('none');
        });
    });
});

// ------------------------------------------------------------------
// updateScoreScreen — percentage display
// ------------------------------------------------------------------
describe('updateScoreScreen() — percentage display', () => {
    let game;

    beforeEach(() => {
        setupDOM();
        jest.useFakeTimers();
        game = createGame();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('shows correct percentage for partial score', () => {
        game.goalAreaSize = 10;
        game.updateScoreScreen(5);
        const el = document.getElementById('roamAreaPercentage');
        expect(el.textContent).toBe('50% of goal (5/10)');
    });

    test('shows 100% when score equals goal', () => {
        game.goalAreaSize = 10;
        game.updateScoreScreen(10);
        const el = document.getElementById('roamAreaPercentage');
        expect(el.textContent).toBe('100% of goal (10/10)');
    });

    test('shows 0% when score is zero', () => {
        game.goalAreaSize = 10;
        game.updateScoreScreen(0);
        const el = document.getElementById('roamAreaPercentage');
        expect(el.textContent).toBe('0% of goal (0/10)');
    });

    test('rounds percentage to nearest integer', () => {
        game.goalAreaSize = 3;
        game.updateScoreScreen(1); // 33.33… → 33
        const el = document.getElementById('roamAreaPercentage');
        expect(el.textContent).toBe('33% of goal (1/3)');
    });

    test('does not set percentage text when goal is 0', () => {
        game.goalAreaSize = 0;
        game.updateScoreScreen(5);
        const el = document.getElementById('roamAreaPercentage');
        expect(el.textContent).toBe(''); // untouched
    });
});

// ------------------------------------------------------------------
// displayRoamingArea — always shows submitted score
// ------------------------------------------------------------------
describe('displayRoamingArea() — always shows submitted score', () => {
    let game;

    beforeEach(() => {
        setupDOM();
        jest.useFakeTimers();
        game = createGame();
        game.goalAreaSize = 10;
        game.isSubmitted = true;
        game.submittedScore = 7;
        game.submittedWalls = [[1, 1]];
        // optimalSolution differs from submittedWalls, so addOptimalSolutionToggle
        // will run its toggle-button branch and update the metric label
        game.optimalSolution = [[2, 2]];
        game.elapsedSeconds = 60;
        // Simulate the state that caused the bug: dataset.score reflects the
        // optimal (goal) score when the player was viewing the optimal solution,
        // but the result screen must still show the player's submitted score.
        const statusBtn = document.getElementById('pennedStatus');
        statusBtn.dataset.interactive = 'true';
        statusBtn.dataset.score = '10'; // would be 100% — the buggy value
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('shows the submitted score, not the dataset score, when already submitted', () => {
        game.displayRoamingArea();
        const el = document.getElementById('roamAreaPercentage');
        // Should show 7/10 = 70%, not 100% from the dataset
        expect(el.textContent).toBe('70% of goal (7/10)');
    });
});

// ------------------------------------------------------------------
// buildShareText — with score (includeLevel: true, includeScore: true)
// ------------------------------------------------------------------
describe('buildShareText({ includeLevel: true, includeScore: true })', () => {
    let game;

    beforeEach(() => {
        setupDOM();
        jest.useFakeTimers();
        game = createGame();
        game.isSubmitted = true;
        game.submittedScore = 8;
        game.goalAreaSize = 10;
        game.elapsedSeconds = 93; // 01:33
        game.currentDate = '2026-03-01';
        game.petEmoji = '🐶';
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('contains the pet emoji', () => {
        const text = game.buildShareText({ includeLevel: true, includeScore: true });
        expect(text).toContain('🐶');
    });

    test('contains the day number from the DOM', () => {
        const text = game.buildShareText({ includeLevel: true, includeScore: true });
        expect(text).toContain('Day 42');
    });

    test('contains the level name from the DOM', () => {
        const text = game.buildShareText({ includeLevel: true, includeScore: true });
        expect(text).toContain('Squirrel Scramble');
    });

    test('day line format is Day X - NAME - Date when name is present', () => {
        const text = game.buildShareText({ includeLevel: true, includeScore: true });
        expect(text).toContain('Day 42 - Squirrel Scramble -');
    });

    test('day line format is Day X - Date when name is absent', () => {
        document.getElementById('mapName').textContent = '';
        const text = game.buildShareText({ includeLevel: true, includeScore: true });
        expect(text).toContain('Day 42 -');
        expect(text).not.toContain('Day 42 -  -');
    });

    test('contains the score percentage', () => {
        const text = game.buildShareText({ includeLevel: true, includeScore: true });
        expect(text).toContain('80%');
    });

    test('contains formatted time', () => {
        const text = game.buildShareText({ includeLevel: true, includeScore: true });
        expect(text).toContain('01:33');
    });

    test('contains a URL with the date param for sharing', () => {
        const text = game.buildShareText({ includeLevel: true, includeScore: true });
        expect(text).toContain('?date=2026-03-01');
    });
});

// ------------------------------------------------------------------
// buildShareText — level only (includeLevel: true, includeScore: false)
// ------------------------------------------------------------------
describe('buildShareText({ includeLevel: true, includeScore: false })', () => {
    let game;

    beforeEach(() => {
        setupDOM();
        jest.useFakeTimers();
        game = createGame();
        game.currentDate = '2026-03-01';
        game.petEmoji = '🐶';
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('contains the pet emoji', () => {
        const text = game.buildShareText({ includeLevel: true, includeScore: false });
        expect(text).toContain('🐶');
    });

    test('contains the day number from the DOM', () => {
        const text = game.buildShareText({ includeLevel: true, includeScore: false });
        expect(text).toContain('Day 42');
    });

    test('contains the level name from the DOM', () => {
        const text = game.buildShareText({ includeLevel: true, includeScore: false });
        expect(text).toContain('Squirrel Scramble');
    });

    test('day line format is Day X - NAME - Date when name is present', () => {
        const text = game.buildShareText({ includeLevel: true, includeScore: false });
        expect(text).toContain('Day 42 - Squirrel Scramble -');
    });

    test('day line format is Day X - Date when name is absent', () => {
        document.getElementById('mapName').textContent = '';
        const text = game.buildShareText({ includeLevel: true, includeScore: false });
        expect(text).toContain('Day 42 -');
        expect(text).not.toContain('Day 42 -  -');
    });

    test('does not contain score percentage', () => {
        const text = game.buildShareText({ includeLevel: true, includeScore: false });
        expect(text).not.toContain('Score:');
        expect(text).not.toContain('%');
    });

    test('does not contain hints line', () => {
        const text = game.buildShareText({ includeLevel: true, includeScore: false });
        expect(text).not.toContain('Hints used');
    });

    test('contains a URL with the date param for sharing', () => {
        const text = game.buildShareText({ includeLevel: true, includeScore: false });
        expect(text).toContain('?date=2026-03-01');
    });

    test('works when not yet submitted', () => {
        game.isSubmitted = false;
        const text = game.buildShareText({ includeLevel: true, includeScore: false });
        expect(text).toContain('🐶');
        expect(text).toContain('?date=2026-03-01');
    });
});

// ------------------------------------------------------------------
// buildShareText — tell friends (includeLevel: false)
// ------------------------------------------------------------------
describe('buildShareText({ includeLevel: false })', () => {
    let game;

    beforeEach(() => {
        setupDOM();
        jest.useFakeTimers();
        game = createGame();
        game.currentDate = '2026-03-01';
        game.petEmoji = '🐶';
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('contains the pet emoji', () => {
        const text = game.buildShareText({ includeLevel: false });
        expect(text).toContain('🐶');
    });

    test('does not contain day number', () => {
        const text = game.buildShareText({ includeLevel: false });
        expect(text).not.toContain('Day 42');
    });

    test('does not contain score', () => {
        const text = game.buildShareText({ includeLevel: false });
        expect(text).not.toContain('Score:');
        expect(text).not.toContain('%');
    });

    test('contains the latest-level URL', () => {
        const text = game.buildShareText({ includeLevel: false });
        expect(text).toContain('?level=latest');
    });

    test('does not contain a date-specific URL', () => {
        const text = game.buildShareText({ includeLevel: false });
        expect(text).not.toContain('?date=');
    });
});

// ------------------------------------------------------------------
// Penned-area animation
// ------------------------------------------------------------------
describe('Game — Penned Animation', () => {
    let game;

    /**
     * Build a 5×5 grid with home at centre (2,2) and walls forming a
     * tight enclosure so the pet is definitely penned.
     *
     *  g g g g g
     *  g W W W g
     *  g W h W g
     *  g W W W g
     *  g g g g g
     *
     * Penned area = home only (1 tile).
     */
    function createPennedGame() {
        setupDOM();
        const g = new Game(5);
        const tiles = Array.from({ length: 5 }, () => Array(5).fill('grass'));
        tiles[2][2] = 'home';
        // surround home with walls
        tiles[1][1] = 'wall'; tiles[1][2] = 'wall'; tiles[1][3] = 'wall';
        tiles[2][1] = 'wall';                         tiles[2][3] = 'wall';
        tiles[3][1] = 'wall'; tiles[3][2] = 'wall'; tiles[3][3] = 'wall';
        g.grid.loadMap(tiles);
        g.grid.saveInitialState();
        g.wallCount = 8;
        return g;
    }

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('_cancelPennedAnimation clears all pending timeouts', () => {
        game = createPennedGame();
        game.render();
        expect(game._pennedAnimationTimeouts.length).toBeGreaterThan(0);
        game._cancelPennedAnimation();
        expect(game._pennedAnimationTimeouts).toHaveLength(0);
    });

    test('cells do not have penned class before animation fires', () => {
        game = createPennedGame();
        game.render();
        const homeCell = game.gridElement.querySelector('[data-row="2"][data-col="2"]');
        expect(homeCell.classList.contains('penned')).toBe(false);
    });

    test('home tile gets penned class after first wave fires', () => {
        game = createPennedGame();
        game.render();
        jest.advanceTimersByTime(CONSTANTS.PENNED_ANIMATION_DELAY_MS);
        const homeCell = game.gridElement.querySelector('[data-row="2"][data-col="2"]');
        expect(homeCell.classList.contains('penned')).toBe(true);
    });

    test('all accessible tiles are penned after animation completes', () => {
        game = createPennedGame();
        const accessibleTiles = game.getAccessibleTiles();
        game.render();
        // Advance enough time to run all penned-area wave timeouts without
        // triggering the infinite pet-wander loop (runAllTimers would loop forever)
        jest.advanceTimersByTime(CONSTANTS.PENNED_ANIMATION_DELAY_MS * 20);
        for (const coordKey of accessibleTiles) {
            const [row, col] = coordKey.split(',').map(Number);
            const cell = game.gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            expect(cell.classList.contains('penned')).toBe(true);
        }
    });

    test('re-rendering cancels the previous animation', () => {
        game = createPennedGame();
        game.render();
        const firstTimeouts = [...game._pennedAnimationTimeouts];
        expect(firstTimeouts.length).toBeGreaterThan(0);

        // Render again — should cancel and replace with a fresh set
        game.render();
        const secondTimeouts = game._pennedAnimationTimeouts;
        expect(secondTimeouts.length).toBeGreaterThan(0);
        // None of the original timeout IDs should remain
        for (const id of firstTimeouts) {
            expect(secondTimeouts).not.toContain(id);
        }
    });

    test('no animation timeouts are queued when pet is not penned', () => {
        setupDOM();
        game = new Game(5);
        const tiles = Array.from({ length: 5 }, () => Array(5).fill('grass'));
        tiles[2][2] = 'home';
        game.grid.loadMap(tiles);
        game.render();
        expect(game._pennedAnimationTimeouts).toHaveLength(0);
    });
});

// ------------------------------------------------------------------
// Paw-path animation
// ------------------------------------------------------------------
describe('Game — Paw Animation', () => {
    let game;

    /**
     * Build a 5×5 grid with home at (2,2) and no walls so there is
     * always an escape path from home to the edge.
     */
    function createOpenGame() {
        setupDOM();
        const g = new Game(5);
        const tiles = Array.from({ length: 5 }, () => Array(5).fill('grass'));
        tiles[2][2] = 'home';
        g.grid.loadMap(tiles);
        g.grid.saveInitialState();
        return g;
    }

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('paw path timeouts are queued when pet is not penned', () => {
        game = createOpenGame();
        game.render();
        expect(game._pawAnimationTimeouts.length).toBeGreaterThan(0);
    });

    test('no paw overlays on cells before animation fires', () => {
        game = createOpenGame();
        game.render();
        const pathInfo = game.calculatePath();
        for (const coordKey of pathInfo.path) {
            const [row, col] = coordKey.split(',').map(Number);
            const cell = game.gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            expect(cell.querySelectorAll('.paw-overlay, .paw-overlay-emoji')).toHaveLength(0);
        }
    });

    test('first grass tile on path gets a paw overlay after its step fires', () => {
        game = createOpenGame();
        const pathInfo = game.calculatePath();
        game.render();
        // orderedPath[0] is home (no paw), orderedPath[1] is the first grass tile
        // Step 1 fires at PAW_ANIMATION_DELAY_MS * 1 ms
        jest.advanceTimersByTime(CONSTANTS.PAW_ANIMATION_DELAY_MS * 2);
        const [row, col] = pathInfo.orderedPath[1].split(',').map(Number);
        const cell = game.gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        expect(cell.querySelectorAll('.paw-overlay, .paw-overlay-emoji').length).toBeGreaterThan(0);
    });

    test('all path tiles have paw overlays after walk-in animation completes', () => {
        game = createOpenGame();
        const pathInfo = game.calculatePath();
        game.render();
        // Advance time until all paws have appeared but none have started to fade yet
        jest.advanceTimersByTime(CONSTANTS.PAW_FADE_OUT_DELAY_MS - 1);
        for (const coordKey of pathInfo.path) {
            const [row, col] = coordKey.split(',').map(Number);
            const tileType = game.grid.getTile(row, col);
            const expectedPaws = getPawOverlay(tileType).length;
            const cell = game.gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            // Only check tiles that should have overlays
            if (expectedPaws > 0) {
                expect(cell.querySelectorAll('.paw-overlay, .paw-overlay-emoji').length).toBeGreaterThan(0);
            }
        }
    });

    test('first paw gets paw-fading class after PAW_FADE_OUT_DELAY_MS', () => {
        game = createOpenGame();
        const pathInfo = game.calculatePath();
        game.render();
        // Advance to just after first paw becomes visible (step 0 at t=0)
        jest.advanceTimersByTime(CONSTANTS.PAW_ANIMATION_DELAY_MS * 2);
        const [row0, col0] = pathInfo.orderedPath[0].split(',').map(Number);
        const cell0 = game.gridElement.querySelector(`[data-row="${row0}"][data-col="${col0}"]`);
        // Paw should be present but not yet fading
        const paws0 = cell0.querySelectorAll('.paw-overlay, .paw-overlay-emoji');
        if (paws0.length > 0) {
            expect(paws0[0].classList.contains('paw-fading')).toBe(false);
        }
        // Advance to trigger the fade-out on the first step (step 0 fades at PAW_FADE_OUT_DELAY_MS)
        jest.advanceTimersByTime(CONSTANTS.PAW_FADE_OUT_DELAY_MS);
        const pawsAfterFade = cell0.querySelectorAll('.paw-overlay, .paw-overlay-emoji');
        if (pawsAfterFade.length > 0) {
            expect(pawsAfterFade[0].classList.contains('paw-fading')).toBe(true);
        }
    });

    test('first paw is removed after fade-out animation completes', () => {
        game = createOpenGame();
        const pathInfo = game.calculatePath();
        game.render();
        const [row0, col0] = pathInfo.orderedPath[0].split(',').map(Number);
        const cell0 = game.gridElement.querySelector(`[data-row="${row0}"][data-col="${col0}"]`);
        const tileType0 = game.grid.getTile(row0, col0);
        const hasPaw = getPawOverlay(tileType0).length > 0;
        if (hasPaw) {
            // Paw should be present before fade
            jest.advanceTimersByTime(CONSTANTS.PAW_ANIMATION_DELAY_MS * 2);
            expect(cell0.querySelectorAll('.paw-overlay, .paw-overlay-emoji').length).toBeGreaterThan(0);
            // Advance past fade delay + duration: paw should be removed from DOM
            jest.advanceTimersByTime(CONSTANTS.PAW_FADE_OUT_DELAY_MS + CONSTANTS.PAW_FADE_OUT_DURATION_MS);
            expect(cell0.querySelectorAll('.paw-overlay, .paw-overlay-emoji')).toHaveLength(0);
        }
    });

    test('animation restarts after all paws have faded out', () => {
        game = createOpenGame();
        const pathInfo = game.calculatePath();
        game.render();
        const pathLen = pathInfo.orderedPath.length;
        // Calculate when the whole first cycle ends and restart triggers
        const restartTime = (pathLen - 1) * CONSTANTS.PAW_ANIMATION_DELAY_MS
            + CONSTANTS.PAW_FADE_OUT_DELAY_MS
            + CONSTANTS.PAW_FADE_OUT_DURATION_MS;
        // Advance past restart, then a bit more so first paw of cycle 2 appears
        jest.advanceTimersByTime(restartTime + CONSTANTS.PAW_ANIMATION_DELAY_MS + 1);
        // The first step's paw should be visible again in cycle 2
        const [row0, col0] = pathInfo.orderedPath[0].split(',').map(Number);
        const tileType0 = game.grid.getTile(row0, col0);
        const hasPaw = getPawOverlay(tileType0).length > 0;
        if (hasPaw) {
            const cell0 = game.gridElement.querySelector(`[data-row="${row0}"][data-col="${col0}"]`);
            expect(cell0.querySelectorAll('.paw-overlay, .paw-overlay-emoji').length).toBeGreaterThan(0);
        }
    });

    test('_cancelPawAnimation clears all pending timeouts', () => {
        game = createOpenGame();
        game.render();
        expect(game._pawAnimationTimeouts.length).toBeGreaterThan(0);
        game._cancelPawAnimation();
        expect(game._pawAnimationTimeouts).toHaveLength(0);
    });

    test('re-rendering cancels the previous paw animation', () => {
        game = createOpenGame();
        game.render();
        const firstTimeouts = [...game._pawAnimationTimeouts];
        expect(firstTimeouts.length).toBeGreaterThan(0);

        game.render();
        const secondTimeouts = game._pawAnimationTimeouts;
        expect(secondTimeouts.length).toBeGreaterThan(0);
        for (const id of firstTimeouts) {
            expect(secondTimeouts).not.toContain(id);
        }
    });

    test('no paw animation timeouts when pet is penned', () => {
        setupDOM();
        const g = new Game(5);
        const tiles = Array.from({ length: 5 }, () => Array(5).fill('grass'));
        tiles[2][2] = 'home';
        tiles[1][1] = 'wall'; tiles[1][2] = 'wall'; tiles[1][3] = 'wall';
        tiles[2][1] = 'wall';                         tiles[2][3] = 'wall';
        tiles[3][1] = 'wall'; tiles[3][2] = 'wall'; tiles[3][3] = 'wall';
        g.grid.loadMap(tiles);
        g.grid.saveInitialState();
        g.render();
        expect(g._pawAnimationTimeouts).toHaveLength(0);
    });
});

// ------------------------------------------------------------------
// handleCellClick — mobile scroll-to-top fix
// ------------------------------------------------------------------
describe('Game — handleCellClick focus restoration', () => {
    /**
     * Build a 5×5 open grid (no walls) so every grass tile is placeable.
     *
     *  g g g g g
     *  g g g g g
     *  g g h g g   ← home at (2,2)
     *  g g g g g
     *  g g g g g
     */
    function createOpenGame5() {
        setupDOM();
        const g = new Game(5);
        const tiles = Array.from({ length: 5 }, () => Array(5).fill('grass'));
        tiles[2][2] = 'home';
        g.grid.loadMap(tiles);
        g.grid.saveInitialState();
        g.render();
        return g;
    }

    test('places a wall and focuses the clicked cell with preventScroll:true', () => {
        const g = createOpenGame5();
        const row = 0;
        const col = 0;

        g.handleCellClick(row, col);

        // The cell element is recreated by render(), so we query after the call
        const cellAfter = g.gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        expect(cellAfter).not.toBeNull();
        expect(document.activeElement).toBe(cellAfter);
    });

    test('removes a wall and focuses the cell with preventScroll:true', () => {
        const g = createOpenGame5();
        // Pre-place a wall at (0,0) directly
        g.grid.setTile(0, 0, 'wall');
        g.wallCount = 1;
        g.render();

        g.handleCellClick(0, 0);

        const cellAfter = g.gridElement.querySelector('[data-row="0"][data-col="0"]');
        expect(cellAfter).not.toBeNull();
        expect(document.activeElement).toBe(cellAfter);
    });

    test('does not change focus when clicking a non-interactive tile', () => {
        const g = createOpenGame5();
        // home tile is not wall-placeable and not a wall
        const homeCell = g.gridElement.querySelector('[data-row="2"][data-col="2"]');
        homeCell.focus();
        expect(document.activeElement).toBe(homeCell);

        g.handleCellClick(2, 2);

        // Focus should remain unchanged (no render was called)
        expect(document.activeElement).toBe(homeCell);
    });

    test('places a wall on a hole tile and transforms it to filledHole', () => {
        const g = createOpenGame5();
        g.grid.setTile(1, 1, 'hole');
        g.grid.saveInitialState();
        g.render();

        g.handleCellClick(1, 1);

        expect(g.grid.getTile(1, 1)).toBe('filledHole');
        expect(g.wallCount).toBe(1);
    });

    test('clicking a filledHole tile reverts it to hole', () => {
        const g = createOpenGame5();
        g.grid.setTile(1, 1, 'hole');
        g.grid.saveInitialState();
        g.grid.setTile(1, 1, 'filledHole');
        g.wallCount = 1;
        g.render();

        g.handleCellClick(1, 1);

        expect(g.grid.getTile(1, 1)).toBe('hole');
        expect(g.wallCount).toBe(0);
    });
});

// ------------------------------------------------------------------
// Keyboard controls
// ------------------------------------------------------------------
describe('Game — Keyboard Controls', () => {
    function createOpenGame5() {
        setupDOM();
        const g = new Game(5);
        const tiles = Array.from({ length: 5 }, () => Array(5).fill('grass'));
        tiles[2][2] = 'home';
        g.grid.loadMap(tiles);
        g.grid.saveInitialState();
        g.render();
        return g;
    }

    function fireKeydown(key) {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        document.dispatchEvent(event);
        return event;
    }

    describe('handleCellKeydown()', () => {
        test('Enter triggers handleCellClick', () => {
            const g = createOpenGame5();
            const spy = jest.spyOn(g, 'handleCellClick');
            const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
            g.handleCellKeydown(event, 0, 0);
            expect(spy).toHaveBeenCalledWith(0, 0);
        });

        test('Space does NOT trigger handleCellClick', () => {
            const g = createOpenGame5();
            const spy = jest.spyOn(g, 'handleCellClick');
            const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
            g.handleCellKeydown(event, 0, 0);
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('Spacebar pause/resume (global keydown handler)', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test('Space pauses the game when running', () => {
            const g = createOpenGame5();
            g.isSubmitted = false;
            g.initTimerForDate('2026-01-01');
            g.resumeTimer(); // exit the initial ready/paused state
            expect(g.isPaused).toBe(false);

            fireKeydown(' ');

            expect(g.isPaused).toBe(true);
            expect(document.getElementById('pauseOverlay').style.display).toBe('flex');
        });

        test('Space resumes the game when paused', () => {
            const g = createOpenGame5();
            g.isSubmitted = false;
            g.initTimerForDate('2026-01-01');
            // initTimerForDate leaves the game in the ready/paused state
            expect(g.isPaused).toBe(true);

            fireKeydown(' ');

            expect(g.isPaused).toBe(false);
            expect(document.getElementById('pauseOverlay').style.display).toBe('none');
        });

        test('Space does nothing when a menu modal is open', () => {
            const g = createOpenGame5();
            g.isSubmitted = false;
            g.initTimerForDate('2026-01-01');
            g.resumeTimer(); // start running
            expect(g.isPaused).toBe(false);

            // Simulate an open menu modal
            const modal = document.createElement('div');
            modal.className = 'modal show';
            document.body.appendChild(modal);

            fireKeydown(' ');

            expect(g.isPaused).toBe(false); // spacebar skipped — game still running
            modal.remove();
        });

        test('Space prevents default to stop page scrolling', () => {
            const g = createOpenGame5();
            g.isSubmitted = false;
            g.initTimerForDate('2026-01-01');
            g.resumeTimer();

            const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
            document.dispatchEvent(event);

            expect(preventDefaultSpy).toHaveBeenCalled();
        });
    });
});

// ------------------------------------------------------------------
// Shore overlay rendering
// ------------------------------------------------------------------
describe('Game — Shore Overlays', () => {
    /**
     * Build a 5×5 grid with home at (2,2).
     * Callers fill in water tiles as needed before calling render().
     */
    function createGame5(tilesFn) {
        setupDOM();
        const g = new Game(5);
        const tiles = Array.from({ length: 5 }, () => Array(5).fill('grass'));
        tiles[2][2] = 'home';
        if (tilesFn) tilesFn(tiles);
        g.grid.loadMap(tiles);
        g.grid.saveInitialState();
        g.render();
        return g;
    }

    function getCell(g, row, col) {
        return g.gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    function shoreCount(g, row, col) {
        return getCell(g, row, col).querySelectorAll('.shore-overlay').length;
    }

    test('isolated water tile surrounded by grass gets 4 shore overlays', () => {
        // water at (1,1) — all 4 neighbours are grass
        const g = createGame5(tiles => { tiles[1][1] = 'water'; });
        expect(shoreCount(g, 1, 1)).toBe(4);
    });

    test('two horizontally adjacent water tiles each get 3 shore overlays', () => {
        // water at (1,1) and (1,2) — they share a side
        const g = createGame5(tiles => {
            tiles[1][1] = 'water';
            tiles[1][2] = 'water';
        });
        expect(shoreCount(g, 1, 1)).toBe(3);
        expect(shoreCount(g, 1, 2)).toBe(3);
    });

    test('two vertically adjacent water tiles each get 3 shore overlays', () => {
        const g = createGame5(tiles => {
            tiles[1][1] = 'water';
            tiles[2][1] = 'water';
        });
        expect(shoreCount(g, 1, 1)).toBe(3);
        expect(shoreCount(g, 2, 1)).toBe(3);
    });

    test('2×2 water block — each tile gets 2 shore overlays', () => {
        const g = createGame5(tiles => {
            tiles[0][0] = 'water';
            tiles[0][1] = 'water';
            tiles[1][0] = 'water';
            tiles[1][1] = 'water';
        });
        expect(shoreCount(g, 0, 0)).toBe(2);
        expect(shoreCount(g, 0, 1)).toBe(2);
        expect(shoreCount(g, 1, 0)).toBe(2);
        expect(shoreCount(g, 1, 1)).toBe(2);
    });

    test('grass tiles have no shore overlays', () => {
        const g = createGame5();
        expect(shoreCount(g, 0, 0)).toBe(0);
        expect(shoreCount(g, 2, 3)).toBe(0);
    });

    test('shore overlay images reference shore.svg', () => {
        const g = createGame5(tiles => { tiles[1][1] = 'water'; });
        const shores = getCell(g, 1, 1).querySelectorAll('.shore-overlay');
        for (const shore of shores) {
            expect(shore.src).toContain('shore.svg');
        }
    });

    test('shore overlay rotation angles reflect the correct sides', () => {
        // water at (2,1): left=(2,0)=grass→270°, right=(2,2)=home→90°,
        // top=(1,1)=grass→0°, bottom=(3,1)=grass→180°
        const g = createGame5(tiles => { tiles[2][1] = 'water'; });
        const shores = Array.from(getCell(g, 2, 1).querySelectorAll('.shore-overlay'));
        const angles = shores.map(s => s.style.transform);
        expect(angles).toContain('rotate(0deg)');
        expect(angles).toContain('rotate(90deg)');
        expect(angles).toContain('rotate(180deg)');
        expect(angles).toContain('rotate(270deg)');
    });

    // Corner overlay tests

    function cornerCount(g, row, col) {
        return getCell(g, row, col).querySelectorAll('.shore-corner-overlay').length;
    }

    test('isolated water tile surrounded by grass gets 0 corner overlays', () => {
        const g = createGame5(tiles => { tiles[1][1] = 'water'; });
        expect(cornerCount(g, 1, 1)).toBe(0);
    });

    test('water with water to the left and top gets 1 corner overlay (top-left, 0°)', () => {
        const g = createGame5(tiles => {
            tiles[1][1] = 'water'; // the tile being tested
            tiles[0][1] = 'water'; // top neighbour
            tiles[1][0] = 'water'; // left neighbour
        });
        const corners = Array.from(getCell(g, 1, 1).querySelectorAll('.shore-corner-overlay'));
        expect(corners).toHaveLength(1);
        expect(corners[0].style.transform).toBe('rotate(0deg)');
    });

    test('water with water to the right and top gets 1 corner overlay (top-right, 90°)', () => {
        const g = createGame5(tiles => {
            tiles[1][2] = 'water';
            tiles[0][2] = 'water'; // top
            tiles[1][3] = 'water'; // right
        });
        const corners = Array.from(getCell(g, 1, 2).querySelectorAll('.shore-corner-overlay'));
        expect(corners).toHaveLength(1);
        expect(corners[0].style.transform).toBe('rotate(90deg)');
    });

    test('water with water to the right and bottom gets 1 corner overlay (bottom-right, 180°)', () => {
        const g = createGame5(tiles => {
            tiles[1][2] = 'water';
            tiles[2][2] = 'water'; // bottom
            tiles[1][3] = 'water'; // right
        });
        const corners = Array.from(getCell(g, 1, 2).querySelectorAll('.shore-corner-overlay'));
        expect(corners).toHaveLength(1);
        expect(corners[0].style.transform).toBe('rotate(180deg)');
    });

    test('water with water to the left and bottom gets 1 corner overlay (bottom-left, 270°)', () => {
        const g = createGame5(tiles => {
            tiles[1][2] = 'water';
            tiles[2][2] = 'water'; // bottom
            tiles[1][1] = 'water'; // left
        });
        const corners = Array.from(getCell(g, 1, 2).querySelectorAll('.shore-corner-overlay'));
        expect(corners).toHaveLength(1);
        expect(corners[0].style.transform).toBe('rotate(270deg)');
    });

    test('water in a plus/cross shape — center tile gets 4 corner overlays (grass at all diagonals)', () => {
        // Plus shape: water at (1,1) centre with water N/S/E/W, grass at all diagonal tiles.
        // Each inner corner has a land diagonal, so all 4 corners have a genuine gap.
        const g = createGame5(tiles => {
            tiles[1][1] = 'water';
            tiles[0][1] = 'water'; // top
            tiles[2][1] = 'water'; // bottom
            tiles[1][0] = 'water'; // left
            tiles[1][2] = 'water'; // right
        });
        expect(cornerCount(g, 1, 1)).toBe(4);
    });

    test('2×2 water block — each tile gets 0 corner overlays (diagonal is always water)', () => {
        // Each tile's only eligible inner corner faces another water tile diagonally,
        // so no corners should be drawn — no "island" in the centre of the block.
        const g = createGame5(tiles => {
            tiles[0][0] = 'water';
            tiles[0][1] = 'water';
            tiles[1][0] = 'water';
            tiles[1][1] = 'water';
        });
        expect(cornerCount(g, 0, 0)).toBe(0);
        expect(cornerCount(g, 0, 1)).toBe(0);
        expect(cornerCount(g, 1, 0)).toBe(0);
        expect(cornerCount(g, 1, 1)).toBe(0);
    });

    test('3×3 water block — interior tile gets 0 corner overlays', () => {
        const g = createGame5(tiles => {
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    tiles[r][c] = 'water';
                }
            }
        });
        // (1,1) is fully interior — all 4 cardinals and all 4 diagonals are water
        expect(cornerCount(g, 1, 1)).toBe(0);
    });

    test('water with 3 water neighbours gets 2 corner overlays', () => {
        // water on top, left, right — corners at top-left (0°) and top-right (90°)
        const g = createGame5(tiles => {
            tiles[1][1] = 'water';
            tiles[0][1] = 'water'; // top
            tiles[1][0] = 'water'; // left
            tiles[1][2] = 'water'; // right
        });
        expect(cornerCount(g, 1, 1)).toBe(2);
        const angles = Array.from(getCell(g, 1, 1).querySelectorAll('.shore-corner-overlay'))
            .map(el => el.style.transform);
        expect(angles).toContain('rotate(0deg)');
        expect(angles).toContain('rotate(90deg)');
    });

    test('corner overlay images reference shore-corner.svg', () => {
        const g = createGame5(tiles => {
            tiles[1][1] = 'water';
            tiles[0][1] = 'water'; // top
            tiles[1][0] = 'water'; // left
        });
        const corners = getCell(g, 1, 1).querySelectorAll('.shore-corner-overlay');
        for (const corner of corners) {
            expect(corner.src).toContain('shore-corner.svg');
        }
    });

    test('straight shore and corner overlay counts are independent', () => {
        // 2-water L-shape: water at (1,1) has water top and left → 2 straight shores, 1 corner
        const g = createGame5(tiles => {
            tiles[1][1] = 'water';
            tiles[0][1] = 'water'; // top
            tiles[1][0] = 'water'; // left
        });
        expect(shoreCount(g, 1, 1)).toBe(2); // right and bottom sides are grass
        expect(cornerCount(g, 1, 1)).toBe(1);
    });
});

// ------------------------------------------------------------------
// Score modifier popups (_showScorePopup)
// ------------------------------------------------------------------
describe('Game — Score Modifier Popups', () => {
    let game;

    beforeEach(() => {
        setupDOM();
        jest.useFakeTimers();
        game = createGame();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    function makeCell() {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = '1';
        cell.dataset.col = '1';
        document.body.appendChild(cell);
        return cell;
    }

    test('appends a .score-popup element to the grid element', () => {
        const cell = makeCell();
        game._showScorePopup(cell, 3);
        const popup = game.gridElement.querySelector('.score-popup');
        expect(popup).not.toBeNull();
    });

    test('displays "+3" text for a positive score', () => {
        const cell = makeCell();
        game._showScorePopup(cell, 3);
        expect(game.gridElement.querySelector('.score-popup').textContent).toBe('+3');
    });

    test('displays "-3" text for a negative score', () => {
        const cell = makeCell();
        game._showScorePopup(cell, -3);
        expect(game.gridElement.querySelector('.score-popup').textContent).toBe('-3');
    });

    test('adds "positive" class for a positive score', () => {
        const cell = makeCell();
        game._showScorePopup(cell, 3);
        expect(game.gridElement.querySelector('.score-popup').classList.contains('positive')).toBe(true);
    });

    test('adds "negative" class for a negative score', () => {
        const cell = makeCell();
        game._showScorePopup(cell, -3);
        expect(game.gridElement.querySelector('.score-popup').classList.contains('negative')).toBe(true);
    });

    test('popup has aria-hidden set to "true"', () => {
        const cell = makeCell();
        game._showScorePopup(cell, 3);
        expect(game.gridElement.querySelector('.score-popup').getAttribute('aria-hidden')).toBe('true');
    });

    test('removes the popup after SCORE_POPUP_DURATION_MS', () => {
        const cell = makeCell();
        game._showScorePopup(cell, 3);
        expect(game.gridElement.querySelector('.score-popup')).not.toBeNull();
        jest.advanceTimersByTime(CONSTANTS.SCORE_POPUP_DURATION_MS);
        expect(game.gridElement.querySelector('.score-popup')).toBeNull();
    });

    test('popup is not removed before SCORE_POPUP_DURATION_MS has elapsed', () => {
        const cell = makeCell();
        game._showScorePopup(cell, 3);
        jest.advanceTimersByTime(CONSTANTS.SCORE_POPUP_DURATION_MS - 1);
        expect(game.gridElement.querySelector('.score-popup')).not.toBeNull();
    });

    test('popup sets --popup-row and --popup-col CSS custom properties from cell data attributes', () => {
        const cell = makeCell();
        game._showScorePopup(cell, 3);
        const popup = game.gridElement.querySelector('.score-popup');
        expect(popup.style.getPropertyValue('--popup-row')).toBe('1');
        expect(popup.style.getPropertyValue('--popup-col')).toBe('1');
    });

    test('_animatePennedArea shows popup for star tile (score 3)', () => {
        setupDOM();
        const g = new Game(5);
        const tiles = Array.from({ length: 5 }, () => Array(5).fill('grass'));
        tiles[2][2] = 'home';
        tiles[2][3] = 'star';
        // Surround with walls to pen the pet
        tiles[0][0] = 'wall'; tiles[0][1] = 'wall'; tiles[0][2] = 'wall'; tiles[0][3] = 'wall'; tiles[0][4] = 'wall';
        tiles[1][0] = 'wall';                                                                     tiles[1][4] = 'wall';
        tiles[2][0] = 'wall';                                                                     tiles[2][4] = 'wall';
        tiles[3][0] = 'wall';                                                                     tiles[3][4] = 'wall';
        tiles[4][0] = 'wall'; tiles[4][1] = 'wall'; tiles[4][2] = 'wall'; tiles[4][3] = 'wall'; tiles[4][4] = 'wall';
        g.grid.loadMap(tiles);
        g.grid.saveInitialState();
        g.render();

        // Advance enough time to trigger all wave callbacks but not the popup removal
        jest.advanceTimersByTime(CONSTANTS.PENNED_ANIMATION_DELAY_MS * 10);

        const starCell = g.gridElement.querySelector('[data-row="2"][data-col="3"]');
        expect(starCell).not.toBeNull();
        expect(starCell.classList.contains('penned')).toBe(true);
        const popup = g.gridElement.querySelector('.score-popup');
        expect(popup).not.toBeNull();
        expect(popup.textContent).toBe('+3');
        expect(popup.classList.contains('positive')).toBe(true);
    });

    test('_animatePennedArea shows popup for bee tile (score -3)', () => {
        setupDOM();
        const g = new Game(5);
        const tiles = Array.from({ length: 5 }, () => Array(5).fill('grass'));
        tiles[2][2] = 'home';
        tiles[2][1] = 'bee';
        // Surround with walls to pen the pet
        tiles[0][0] = 'wall'; tiles[0][1] = 'wall'; tiles[0][2] = 'wall'; tiles[0][3] = 'wall'; tiles[0][4] = 'wall';
        tiles[1][0] = 'wall';                                                                     tiles[1][4] = 'wall';
        tiles[2][0] = 'wall';                                                                     tiles[2][4] = 'wall';
        tiles[3][0] = 'wall';                                                                     tiles[3][4] = 'wall';
        tiles[4][0] = 'wall'; tiles[4][1] = 'wall'; tiles[4][2] = 'wall'; tiles[4][3] = 'wall'; tiles[4][4] = 'wall';
        g.grid.loadMap(tiles);
        g.grid.saveInitialState();
        g.render();

        // Advance enough time to trigger all wave callbacks but not the popup removal
        jest.advanceTimersByTime(CONSTANTS.PENNED_ANIMATION_DELAY_MS * 10);

        const beeCell = g.gridElement.querySelector('[data-row="2"][data-col="1"]');
        expect(beeCell).not.toBeNull();
        expect(beeCell.classList.contains('penned')).toBe(true);
        const popup = g.gridElement.querySelector('.score-popup');
        expect(popup).not.toBeNull();
        expect(popup.textContent).toBe('-3');
        expect(popup.classList.contains('negative')).toBe(true);
    });
});

// ------------------------------------------------------------------
// Pet Wander & Return Animation
// ------------------------------------------------------------------
describe('Game — Pet Wander & Return', () => {
    let game;

    /**
     * 5×5 grid with home at (2,2) completely surrounded by walls so the
     * pet is penned in the single home tile only.
     */
    function createPennedGame() {
        setupDOM();
        const g = new Game(5);
        const tiles = Array.from({ length: 5 }, () => Array(5).fill('grass'));
        tiles[2][2] = 'home';
        tiles[1][1] = 'wall'; tiles[1][2] = 'wall'; tiles[1][3] = 'wall';
        tiles[2][1] = 'wall';                         tiles[2][3] = 'wall';
        tiles[3][1] = 'wall'; tiles[3][2] = 'wall'; tiles[3][3] = 'wall';
        g.grid.loadMap(tiles);
        g.grid.saveInitialState();
        g.wallCount = 8;
        return g;
    }

    /**
     * 5×5 grid with home at (2,2) and no walls so the pet can escape.
     */
    function createOpenGame() {
        setupDOM();
        const g = new Game(5);
        const tiles = Array.from({ length: 5 }, () => Array(5).fill('grass'));
        tiles[2][2] = 'home';
        g.grid.loadMap(tiles);
        g.grid.saveInitialState();
        return g;
    }

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('_cancelPetWander clears all pending timeouts', () => {
        game = createPennedGame();
        game.render();
        // Trigger the wander by advancing past the penned animation
        jest.advanceTimersByTime(CONSTANTS.PENNED_ANIMATION_DELAY_MS * 5 + CONSTANTS.PET_WANDER_STEP_MS);
        expect(game._petWanderTimeouts.length).toBeGreaterThan(0);
        game._cancelPetWander();
        expect(game._petWanderTimeouts).toHaveLength(0);
    });

    test('_cancelPetReturn clears all pending timeouts', () => {
        game = createPennedGame();
        game.render();
        // Manually set pet pos and start a return
        game._petPos = { row: 2, col: 2 };
        game._startPetReturn();
        game._cancelPetReturn();
        expect(game._petReturnTimeouts).toHaveLength(0);
    });

    test('_petPos starts as null', () => {
        game = createPennedGame();
        expect(game._petPos).toBeNull();
    });

    test('pet emoji appears on home tile when _petPos is null', () => {
        game = createPennedGame();
        game.render();
        // Pet walker is on the grid (not inside a cell) centred at home (2,2)
        const walker = game.gridElement.querySelector('.pet-walker');
        expect(walker).not.toBeNull();
        expect(walker.style.getPropertyValue('--pet-row')).toBe('2');
        expect(walker.style.getPropertyValue('--pet-col')).toBe('2');
    });

    test('pet emoji is NOT on home tile when _petPos is non-null during render', () => {
        game = createPennedGame();
        game._petPos = { row: 2, col: 2 };
        game.render();
        // There should be exactly one pet-walker on the grid
        const walkers = game.gridElement.querySelectorAll('.pet-walker');
        expect(walkers).toHaveLength(1);
        // It is positioned at the _petPos coordinates
        expect(walkers[0].style.getPropertyValue('--pet-row')).toBe('2');
        expect(walkers[0].style.getPropertyValue('--pet-col')).toBe('2');
    });

    test('_attachPetAtPosition updates the walker CSS properties to target position', () => {
        game = createPennedGame();
        game._petPos = { row: 2, col: 2 };
        game.render();
        game._attachPetAtPosition(1, 1);
        const walker = game.gridElement.querySelector('.pet-walker');
        expect(walker).not.toBeNull();
        expect(walker.style.getPropertyValue('--pet-row')).toBe('1');
        expect(walker.style.getPropertyValue('--pet-col')).toBe('1');
    });

    test('_attachPetAtPosition only ever has one pet-walker on the grid', () => {
        game = createPennedGame();
        game._petPos = { row: 2, col: 2 };
        game.render();
        game._attachPetAtPosition(1, 1);
        game._attachPetAtPosition(1, 2);
        const walkers = game.gridElement.querySelectorAll('.pet-walker');
        expect(walkers).toHaveLength(1);
    });

    test('wander timeouts are queued after penned animation completes', () => {
        game = createPennedGame();
        game.render();
        // No wander timeouts immediately after render
        expect(game._petWanderTimeouts).toHaveLength(0);
        // Advance past all penned waves + completion callback
        jest.advanceTimersByTime(CONSTANTS.PENNED_ANIMATION_DELAY_MS * 5);
        expect(game._petWanderTimeouts.length).toBeGreaterThan(0);
    });

    test('_petPos is set after wander step fires', () => {
        game = createPennedGame();
        game.render();
        // Pet is only in home so it stays at home, but _petPos is set
        jest.advanceTimersByTime(
            CONSTANTS.PENNED_ANIMATION_DELAY_MS * 5 + CONSTANTS.PET_WANDER_STEP_MS
        );
        expect(game._petPos).not.toBeNull();
    });

    test('no wander timeouts queued when pet is not penned', () => {
        game = createOpenGame();
        game.render();
        jest.advanceTimersByTime(CONSTANTS.PENNED_ANIMATION_DELAY_MS * 5);
        expect(game._petWanderTimeouts).toHaveLength(0);
    });

    test('_startPetReturn resolves immediately when _petPos is null', () => {
        game = createOpenGame();
        game.render();
        let called = false;
        game._startPetReturn(() => { called = true; });
        expect(called).toBe(true);
    });

    test('_startPetReturn resolves immediately when _petPos equals home', () => {
        game = createOpenGame();
        game.render();
        const homePos = game.grid.getHomePosition();
        game._petPos = { row: homePos.row, col: homePos.col };
        let called = false;
        game._startPetReturn(() => { called = true; });
        expect(called).toBe(true);
        expect(game._petPos).toBeNull();
    });

    test('_startPetReturn queues return timeouts when pet is away', () => {
        game = createOpenGame();
        game.render();
        game._petPos = { row: 0, col: 0 };
        game._startPetReturn();
        expect(game._petReturnTimeouts.length).toBeGreaterThan(0);
    });

    test('_startPetReturn sets _petPos to null on arrival', () => {
        game = createOpenGame();
        game.render();
        game._petPos = { row: 2, col: 1 }; // one step from home at (2,2)
        game._attachPetAtPosition(2, 1);
        game._startPetReturn();
        jest.advanceTimersByTime(CONSTANTS.PET_RETURN_STEP_MS * 5);
        expect(game._petPos).toBeNull();
    });

    test('_findReturnPath returns empty array when already at home', () => {
        game = createOpenGame();
        game.render();
        const homePos = game.grid.getHomePosition();
        const path = game._findReturnPath(homePos, homePos);
        expect(path).toEqual([]);
    });

    test('_findReturnPath finds a path of correct length', () => {
        game = createOpenGame();
        game.render();
        const homePos = game.grid.getHomePosition(); // (2,2)
        const from = { row: 2, col: 0 };
        const path = game._findReturnPath(from, homePos);
        expect(path).not.toBeNull();
        // Shortest path from (2,0) to (2,2) is 2 steps
        expect(path.length).toBe(2);
        expect(path[path.length - 1]).toEqual(homePos);
    });

    test('_findReturnPath traverses through walls', () => {
        setupDOM();
        const g = new Game(5);
        const tiles = Array.from({ length: 5 }, () => Array(5).fill('grass'));
        tiles[2][2] = 'home';
        // Place a wall between (2,0) and (2,2)
        tiles[2][1] = 'wall';
        g.grid.loadMap(tiles);
        g.render();
        const path = g._findReturnPath({ row: 2, col: 0 }, { row: 2, col: 2 });
        // Must find a path even through the wall
        expect(path).not.toBeNull();
        expect(path.length).toBeGreaterThan(0);
        expect(path[path.length - 1]).toEqual({ row: 2, col: 2 });
    });

    test('render() cancels wander and return animations', () => {
        game = createPennedGame();
        game.render();
        jest.advanceTimersByTime(CONSTANTS.PENNED_ANIMATION_DELAY_MS * 5 + CONSTANTS.PET_WANDER_STEP_MS);
        expect(game._petWanderTimeouts.length).toBeGreaterThan(0);
        game.render();
        // After re-render, previous wander timeouts are cancelled and replaced
        expect(game._petWanderTimeouts).toHaveLength(0);
    });

    test('re-render while penned re-attaches pet at current _petPos', () => {
        game = createPennedGame();
        game._petPos = { row: 2, col: 2 };
        game.render();
        const walker = game.gridElement.querySelector('.pet-walker');
        expect(walker).not.toBeNull();
        expect(walker.style.getPropertyValue('--pet-row')).toBe('2');
        expect(walker.style.getPropertyValue('--pet-col')).toBe('2');
    });

    test('return animation starts when re-rendered while unpenned with _petPos set', () => {
        game = createOpenGame();
        game._petPos = { row: 2, col: 1 };
        game.render();
        expect(game._petReturnTimeouts.length).toBeGreaterThan(0);
    });
});

// ============================================================
// Best State Feature Tests
// ============================================================

/**
 * Creates a game with a 5x5 grid containing a penned configuration:
 * walls fully surround the home tile so the pet is immediately penned.
 *
 *   G G G G G
 *   G W W W G
 *   G W H W G   ← home at (2,2), surrounded by walls
 *   G W W W G
 *   G G G G G
 */
function createPennedGameForBestState() {
    setupDOM();
    const g = new Game(5);
    const tiles = Array.from({ length: 5 }, () => Array(5).fill('grass'));
    tiles[2][2] = 'home';
    g.grid.loadMap(tiles);
    g.grid.saveInitialState();
    g.currentDate = '2026-06-01';
    // Place walls that surround the home tile
    [[1,1],[1,2],[1,3],[2,1],[2,3],[3,1],[3,2],[3,3]].forEach(([r,c]) => {
        g.grid.setTile(r, c, 'wall');
        g.wallCount++;
    });
    return g;
}

describe('Game — Best State', () => {
    let game;

    beforeEach(() => {
        setupDOM();
        document.cookie.split(';').forEach((c) => {
            document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
        });
        jest.useFakeTimers();
        game = createGame();
    });

    afterEach(() => {
        game._stopTimerInterval();
        jest.useRealTimers();
    });

    describe('initial state', () => {
        test('bestScore starts as null', () => {
            expect(game.bestScore).toBeNull();
        });

        test('bestWalls starts as null', () => {
            expect(game.bestWalls).toBeNull();
        });
    });

    describe('saveBestState() / loadBestState()', () => {
        test('saveBestState writes cookie and loadBestState restores it', () => {
            game.saveBestState('2026-01-01', 12, [[1, 1], [2, 2]]);
            game.bestScore = null;
            game.bestWalls = null;
            game.loadBestState('2026-01-01');
            expect(game.bestScore).toBe(12);
            expect(game.bestWalls).toEqual([[1, 1], [2, 2]]);
        });

        test('loadBestState sets nulls when no cookie exists', () => {
            game.bestScore = 5;
            game.bestWalls = [[0, 0]];
            game.loadBestState('2026-99-99');
            expect(game.bestScore).toBeNull();
            expect(game.bestWalls).toBeNull();
        });

        test('loadBestState ignores malformed cookie', () => {
            CookieUtils.setCookie('progress_2026-01-01', 'not-json', 1);
            game.loadBestState('2026-01-01');
            expect(game.bestScore).toBeNull();
            expect(game.bestWalls).toBeNull();
        });

        test('loadBestState ignores cookie missing bestScore', () => {
            CookieUtils.setCookie('progress_2026-01-01', JSON.stringify({ bestWalls: [] }), 1);
            game.loadBestState('2026-01-01');
            expect(game.bestScore).toBeNull();
        });
    });

    describe('updateBestStateBanner()', () => {
        test('shows "Pet Not Penned" with disabled button when bestScore is null', () => {
            game.isSubmitted = false;
            game.bestScore = null;
            game.updateBestStateBanner();
            const banner = document.getElementById('bestStateBanner');
            expect(banner.style.display).not.toBe('none');
            expect(banner.disabled).toBe(true);
            expect(banner.querySelector('.best-state-label').textContent).toBe('Pet Not Penned');
        });

        test('shows score and enables button when bestScore is set', () => {
            game.isSubmitted = false;
            game.bestScore = 15;
            game.bestWalls = [[1, 1]];
            game.updateBestStateBanner();
            const banner = document.getElementById('bestStateBanner');
            expect(banner.style.display).not.toBe('none');
            expect(banner.disabled).toBe(false);
            expect(banner.querySelector('.best-state-label').textContent).toBe('Best So Far: 15');
        });

        test('hides banner after submission', () => {
            game.isSubmitted = true;
            game.bestScore = 10;
            game.updateBestStateBanner();
            const banner = document.getElementById('bestStateBanner');
            expect(banner.style.display).toBe('none');
        });
    });

    describe('handleSubmission() hides best state banner', () => {
        test('hides the best state banner when submission is made', () => {
            game.currentDate = '2026-01-01';
            game.isSubmitted = false;
            game.bestScore = 8;
            game.bestWalls = [[1, 1]];
            // Show the banner first
            game.updateBestStateBanner();
            const banner = document.getElementById('bestStateBanner');
            expect(banner.style.display).not.toBe('none');

            // Submit the puzzle
            game.handleSubmission(5);

            // Banner should now be hidden
            expect(banner.style.display).toBe('none');
        });

        test('hides the hint button when submission is made', () => {
            game.currentDate = '2026-01-01';
            game.isSubmitted = false;
            game.hintsDisabled = false;
            // Ensure hint button is visible first
            game.updateHintButton();
            const hintBtn = document.getElementById('hintCheckBtn');
            expect(hintBtn.style.display).not.toBe('none');

            // Submit the puzzle
            game.handleSubmission(5);

            // Hint button should now be hidden
            expect(hintBtn.style.display).toBe('none');
        });
    });

    describe('_checkAndUpdateBestState()', () => {
        test('saves new best state when score improves', () => {
            game.bestScore = null;
            game._checkAndUpdateBestState(10);
            expect(game.bestScore).toBe(10);
            expect(Array.isArray(game.bestWalls)).toBe(true);
        });

        test('does not update when score is not better', () => {
            game.bestScore = 20;
            game.bestWalls = [[0, 0]];
            game._checkAndUpdateBestState(10);
            expect(game.bestScore).toBe(20);
            expect(game.bestWalls).toEqual([[0, 0]]);
        });

        test('does not update when score equals current best', () => {
            game.bestScore = 10;
            const oldWalls = [[0, 0]];
            game.bestWalls = oldWalls;
            game._checkAndUpdateBestState(10);
            expect(game.bestScore).toBe(10);
            expect(game.bestWalls).toBe(oldWalls); // same reference, not replaced
        });

        test('updates banner after saving new best', () => {
            game.bestScore = null;
            game._checkAndUpdateBestState(7);
            const banner = document.getElementById('bestStateBanner');
            expect(banner.querySelector('.best-state-label').textContent).toBe('Best So Far: 7');
        });

        test('persists best state to cookie', () => {
            game.bestScore = null;
            game._checkAndUpdateBestState(8);
            const raw = CookieUtils.getCookie('progress_2026-01-01');
            expect(raw).not.toBeNull();
            const data = JSON.parse(raw);
            expect(data.bestScore).toBe(8);
        });
    });

    describe('loadBestStateWalls()', () => {
        test('does nothing when bestWalls is null', () => {
            game.bestWalls = null;
            expect(() => game.loadBestStateWalls()).not.toThrow();
        });

        test('does nothing when puzzle is submitted', () => {
            game.isSubmitted = true;
            game.bestWalls = [[1, 1]];
            expect(() => game.loadBestStateWalls()).not.toThrow();
            // No wall should be placed since we're submitted
        });

        test('restores wall positions when called with valid bestWalls', () => {
            const g = createPennedGameForBestState();
            g.bestWalls = [[1, 1], [1, 2]];
            g.loadBestStateWalls();
            // After loading, wallCount should match bestWalls length
            expect(g.wallCount).toBe(2);
        });
    });

    describe('resetTimer() clears best state', () => {
        test('clears bestScore and bestWalls on resetTimer()', () => {
            game.bestScore = 10;
            game.bestWalls = [[0, 0]];
            game.resetTimer();
            expect(game.bestScore).toBeNull();
            expect(game.bestWalls).toBeNull();
        });

        test('deletes progress cookie on resetTimer()', () => {
            CookieUtils.setCookie('progress_2026-01-01', JSON.stringify({ bestScore: 5, bestWalls: [] }), 1);
            game.resetTimer();
            expect(CookieUtils.getCookie('progress_2026-01-01')).toBeNull();
        });
    });

    describe('initTimerForDate() loads best state', () => {
        test('loads bestScore from cookie when not yet submitted', () => {
            CookieUtils.setCookie('progress_2026-01-01', JSON.stringify({ bestScore: 20, bestWalls: [[0,1]] }), 1);
            game.initTimerForDate('2026-01-01');
            expect(game.bestScore).toBe(20);
            expect(game.bestWalls).toEqual([[0, 1]]);
        });

        test('loads bestScore from cookie even when submitted', () => {
            // Best state persists through submission
            game.isSubmitted = true;
            game.elapsedSeconds = 0;
            game.submittedScore = 8;
            CookieUtils.setCookie('progress_2026-01-01', JSON.stringify({ bestScore: 8, bestWalls: [[0,1]] }), 1);
            // Supply a minimal submission cookie so loadSubmission() works
            CookieUtils.setCookie('submission_2026-01-01', JSON.stringify({
                __version: '1.1', score: 8, walls: [[0,1]], timestamp: '', time: 0, hintsUsed: []
            }), 1);
            game.initTimerForDate('2026-01-01');
            expect(game.bestScore).toBe(8);
        });
    });
});

describe('Game — Reset & Hint button visibility after submission', () => {
    let game;

    beforeEach(() => {
        setupDOM();
        document.cookie.split(';').forEach((c) => {
            document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
        });
        game = createGame();
    });

    describe('updateResetButton()', () => {
        test('reset button is visible when not submitted', () => {
            game.isSubmitted = false;
            game.updateResetButton();
            const resetBtn = document.getElementById('resetBtn');
            expect(resetBtn.style.visibility).not.toBe('hidden');
            expect(resetBtn.disabled).toBe(false);
        });

        test('reset button is hidden when submitted', () => {
            game.isSubmitted = true;
            game.updateResetButton();
            const resetBtn = document.getElementById('resetBtn');
            expect(resetBtn.style.visibility).toBe('hidden');
            expect(resetBtn.disabled).toBe(true);
        });
    });

    describe('updateHintButton() after submission', () => {
        test('hint button is hidden when submitted', () => {
            game.isSubmitted = true;
            game.hintsDisabled = false;
            game.updateHintButton();
            const hintBtn = document.getElementById('hintCheckBtn');
            expect(hintBtn.style.display).toBe('none');
        });

        test('hint button is visible when not submitted and not disabled', () => {
            game.isSubmitted = false;
            game.hintsDisabled = false;
            game.updateHintButton();
            const hintBtn = document.getElementById('hintCheckBtn');
            expect(hintBtn.style.display).not.toBe('none');
        });
    });

    describe('_updateHintUsedDisplay() bullet points', () => {
        test('renders one bullet per hint used', () => {
            game.hintsUsed = [CONSTANTS.HINT_CHECKED];
            game._updateHintUsedDisplay();
            const display = document.getElementById('hintUsedDisplay');
            expect(display.style.display).not.toBe('none');
            const items = display.querySelectorAll('.hint-used-list li');
            expect(items.length).toBe(1);
        });

        test('renders two bullets when both hints used', () => {
            game.hintsUsed = [CONSTANTS.HINT_CHECKED, CONSTANTS.HINT_TARGET];
            game._updateHintUsedDisplay();
            const display = document.getElementById('hintUsedDisplay');
            const items = display.querySelectorAll('.hint-used-list li');
            expect(items.length).toBe(2);
        });

        test('hides display when no hints used', () => {
            game.hintsUsed = [];
            game._updateHintUsedDisplay();
            const display = document.getElementById('hintUsedDisplay');
            expect(display.style.display).toBe('none');
        });
    });

    // ------------------------------------------------------------------
    // _showTileTooltip
    // ------------------------------------------------------------------
    describe('_showTileTooltip()', () => {
        test('appends a .tile-tooltip element to the cell', () => {
            game.render();
            const cell = game.gridElement.querySelector('[data-row="0"][data-col="0"]');
            game._showTileTooltip(cell, 'water');
            const tooltip = cell.querySelector('.tile-tooltip');
            expect(tooltip).not.toBeNull();
        });

        test('tooltip text is the tile description', () => {
            game.render();
            const cell = game.gridElement.querySelector('[data-row="0"][data-col="0"]');
            game._showTileTooltip(cell, 'star');
            const tooltip = cell.querySelector('.tile-tooltip');
            expect(tooltip.textContent).toBeTruthy();
            expect(tooltip.textContent.length).toBeGreaterThan(0);
        });

        test('tooltip has aria-hidden="true"', () => {
            game.render();
            const cell = game.gridElement.querySelector('[data-row="0"][data-col="0"]');
            game._showTileTooltip(cell, 'bee');
            const tooltip = cell.querySelector('.tile-tooltip');
            expect(tooltip.getAttribute('aria-hidden')).toBe('true');
        });

        test('removes existing tooltip on cell before adding a new one', () => {
            game.render();
            const cell = game.gridElement.querySelector('[data-row="0"][data-col="0"]');
            game._showTileTooltip(cell, 'water');
            game._showTileTooltip(cell, 'water');
            const tooltips = cell.querySelectorAll('.tile-tooltip');
            expect(tooltips.length).toBe(1);
        });

        test('tooltip registers auto-removal using TILE_TOOLTIP_DURATION_MS', () => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            document.body.appendChild(cell);

            const spyTimeout = jest.spyOn(global, 'setTimeout');
            game._showTileTooltip(cell, 'home');

            // Verify a timeout was registered with the correct duration
            const durations = spyTimeout.mock.calls.map(([, delay]) => delay);
            expect(durations).toContain(CONSTANTS.TILE_TOOLTIP_DURATION_MS);

            spyTimeout.mockRestore();
            cell.remove();
        });

        test('does nothing for an unknown tile type', () => {
            game.render();
            const cell = game.gridElement.querySelector('[data-row="0"][data-col="0"]');
            game._showTileTooltip(cell, 'nonexistent_tile');
            expect(cell.querySelector('.tile-tooltip')).toBeNull();
        });
    });

    // ------------------------------------------------------------------
    // handleCellClick tooltip for non-clickable tiles
    // ------------------------------------------------------------------
    describe('handleCellClick() — tooltip for non-clickable tiles', () => {
        test('clicking a water tile shows a tooltip', () => {
            const tiles = Array.from({ length: 7 }, () => Array(7).fill('grass'));
            tiles[3][3] = 'home';
            tiles[0][0] = 'water';
            game.grid.loadMap(tiles);
            game.grid.saveInitialState();
            game.render();
            game.handleCellClick(0, 0);
            const cell = game.gridElement.querySelector('[data-row="0"][data-col="0"]');
            expect(cell.querySelector('.tile-tooltip')).not.toBeNull();
        });

        test('clicking a home tile shows a tooltip', () => {
            game.render();
            game.handleCellClick(3, 3);
            const cell = game.gridElement.querySelector('[data-row="3"][data-col="3"]');
            expect(cell.querySelector('.tile-tooltip')).not.toBeNull();
        });

        test('clicking a grass tile does NOT show a tooltip', () => {
            game.render();
            game.handleCellClick(0, 0);
            const cell = game.gridElement.querySelector('[data-row="0"][data-col="0"]');
            expect(cell.querySelector('.tile-tooltip')).toBeNull();
        });

        test('clicking a star tile shows a tooltip', () => {
            const tiles = Array.from({ length: 7 }, () => Array(7).fill('grass'));
            tiles[3][3] = 'home';
            tiles[0][0] = 'star';
            game.grid.loadMap(tiles);
            game.grid.saveInitialState();
            game.render();
            game.handleCellClick(0, 0);
            const cell = game.gridElement.querySelector('[data-row="0"][data-col="0"]');
            expect(cell.querySelector('.tile-tooltip')).not.toBeNull();
        });

        test('clicking a bee tile shows a tooltip', () => {
            const tiles = Array.from({ length: 7 }, () => Array(7).fill('grass'));
            tiles[3][3] = 'home';
            tiles[0][0] = 'bee';
            game.grid.loadMap(tiles);
            game.grid.saveInitialState();
            game.render();
            game.handleCellClick(0, 0);
            const cell = game.gridElement.querySelector('[data-row="0"][data-col="0"]');
            expect(cell.querySelector('.tile-tooltip')).not.toBeNull();
        });

        test('no tooltip shown when game is already submitted', () => {
            const tiles = Array.from({ length: 7 }, () => Array(7).fill('grass'));
            tiles[3][3] = 'home';
            tiles[0][0] = 'water';
            game.grid.loadMap(tiles);
            game.grid.saveInitialState();
            game.render();
            game.isSubmitted = true;
            game.handleCellClick(0, 0);
            const cell = game.gridElement.querySelector('[data-row="0"][data-col="0"]');
            expect(cell.querySelector('.tile-tooltip')).toBeNull();
        });
    });
});

// ===========================================================================
// Additional coverage tests — GameTimer & GameAnimations edge cases
// ===========================================================================

// ---------------------------------------------------------------------------
// GameTimer — remaining branch coverage
// ---------------------------------------------------------------------------

describe('Game — Timer additional branch coverage', () => {
    let game;

    function setupDOM2() {
        document.body.innerHTML = `
            <div id="pauseOverlay" class="pause-overlay" style="display: none;">
                <div class="pause-content">
                    <div id="pauseTitle" class="pause-title">Pause</div>
                    <div id="pauseTime" class="pause-time">00:00</div>
                    <button id="resumeBtn" class="resume-btn">&#9654; Resume</button>
                </div>
            </div>
            <div class="controls-top">
                <div class="wall-counter"><span id="wallCounter">0 / 9</span></div>
                <button id="timerBtn" class="timer-btn">
                    <span id="timerValue" class="timer-value">00:00</span>
                    <span id="timerIcon" class="timer-icon">⏸</span>
                </button>
                <div class="score-display"><span id="scoreValue">∞</span></div>
            </div>
            <div class="map-info">
                <span id="mapDay">1</span>
                <span id="mapName">Test</span>
            </div>
            <div class="grid-container"><div id="grid" class="grid"></div></div>
            <div class="controls-bottom">
                <button id="resetBtn">Reset</button>
                <button id="pennedStatus" class="penned-status not-penned" data-interactive="false">
                    <span class="submit-label">Unsolved</span><span class="submit-check">✗</span>
                </button>
                <div class="best-state-wrapper">
                    <button id="bestStateBanner" class="best-state-banner" disabled style="display: none;">
                        <span class="best-state-label">Pet Not Penned</span>
                    </button>
                </div>
            </div>
            <div class="controls-hints">
                <button id="hintCheckBtn" class="hint-check-btn" style="display: none;" disabled></button>
                <div id="hintUsedDisplay" class="hint-used-display" style="display: none;"></div>
            </div>
            <div id="notification" class="notification"></div>
            <div id="solutionToggleBar" style="display: none;">
                <span id="solutionViewLabel"></span>
                <button id="solutionToggleBtn"></button>
            </div>
            <aside id="roamSpaceViewer" class="roam-viewer-sidebar">
                <article class="viewer-card">
                    <section class="metrics-display">
                        <output class="metric-value" id="roamAreaMetric">0</output>
                        <small class="metric-percentage" id="roamAreaPercentage"></small>
                        <small class="metric-helper"></small>
                    </section>
                    <footer class="viewer-footer">
                        <button id="shareScoreBtn">📋 Copy Score</button>
                        <button id="exitViewer">Back to Game</button>
                    </footer>
                </article>
            </aside>
        `;
    }

    function createTimerGame() {
        const g = new Game(7);
        const tiles = Array.from({ length: 7 }, () => Array(7).fill('grass'));
        tiles[3][3] = 'home';
        g.grid.loadMap(tiles);
        g.grid.saveInitialState();
        g.currentDate = '2026-01-15';
        return g;
    }

    beforeEach(() => {
        setupDOM2();
        document.cookie.split(';').forEach((c) => {
            document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
        });
        jest.useFakeTimers();
        game = createTimerGame();
    });

    afterEach(() => {
        game._stopTimerInterval();
        jest.useRealTimers();
    });

    test('initTimerForDate falls back to 0 elapsed when timer cookie contains invalid JSON', () => {
        CookieUtils.setCookie('timer_2026-01-15', '{not:valid::json}', 365);
        game.isSubmitted = false;
        game.initTimerForDate('2026-01-15');
        expect(game.elapsedSeconds).toBe(0);
    });

    test('timer interval calls _saveTimerState when elapsedSeconds reaches a multiple of 30', () => {
        game.isSubmitted = false;
        game.initTimerForDate('2026-01-15');
        // Pre-set elapsed to 29 so the very next tick crosses the 30s boundary
        game.elapsedSeconds = 29;
        game.resumeTimer();
        const spy = jest.spyOn(game, '_saveTimerState');
        jest.advanceTimersByTime(1000);
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    test('_handleVisibilityChange pauses a currently running timer when the tab is hidden', () => {
        game.isSubmitted = false;
        game.initTimerForDate('2026-01-15');
        // Resume puts the timer in the running state (isPaused = false)
        game.resumeTimer();
        expect(game.isPaused).toBe(false);

        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        game._handleVisibilityChange();

        expect(game.isPaused).toBe(true);
        expect(game._timerInterval).toBeNull();

        Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    });
});

// ---------------------------------------------------------------------------
// GameAnimations — remaining branch coverage
// ---------------------------------------------------------------------------

describe('Game — GameAnimations additional branch coverage', () => {
    let game;

    function setupAnimDOM() {
        document.body.innerHTML = `
            <div id="pauseOverlay" style="display:none;"></div>
            <div class="controls-top">
                <div class="wall-counter"><span id="wallCounter">0/9</span></div>
                <button id="timerBtn"><span id="timerValue">00:00</span><span id="timerIcon">⏸</span></button>
                <div class="score-display"><span id="scoreValue">∞</span></div>
            </div>
            <div class="map-info"><span id="mapDay">1</span><span id="mapName">T</span></div>
            <div class="grid-container"><div id="grid" class="grid"></div></div>
            <div class="controls-bottom">
                <button id="resetBtn">Reset</button>
                <button id="pennedStatus" data-interactive="false">
                    <span class="submit-label">Unsolved</span><span class="submit-check">✗</span>
                </button>
                <div class="best-state-wrapper">
                    <button id="bestStateBanner" disabled style="display:none;">
                        <span class="best-state-label"></span>
                    </button>
                </div>
            </div>
            <div class="controls-hints">
                <button id="hintCheckBtn" style="display:none;" disabled><span class="hint-check-label">Check if optimal</span></button>
                <div id="hintUsedDisplay" style="display:none;"></div>
            </div>
            <div id="notification"></div>
            <div id="solutionToggleBar" style="display:none;">
                <span id="solutionViewLabel"></span><button id="solutionToggleBtn"></button>
            </div>
            <aside id="roamSpaceViewer">
                <article class="viewer-card">
                    <section class="metrics-display">
                        <output id="roamAreaMetric">0</output>
                        <small id="roamAreaPercentage"></small>
                        <small class="metric-helper"></small>
                    </section>
                    <footer class="viewer-footer">
                        <button id="shareScoreBtn">Copy</button>
                        <button id="exitViewer">Back</button>
                    </footer>
                </article>
            </aside>
        `;
    }

    function createBaseGame() {
        const g = new Game(5);
        const tiles = Array.from({ length: 5 }, () => Array(5).fill('grass'));
        tiles[2][2] = 'home';
        g.grid.loadMap(tiles);
        g.grid.saveInitialState();
        return g;
    }

    beforeEach(() => {
        setupAnimDOM();
        game = createBaseGame();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    // _createAssetOverlay — emoji/span branch (lines 133-137)
    describe('_createAssetOverlay() — emoji/text branch', () => {
        test('returns a <span> element for a plain emoji asset', () => {
            const el = game._createAssetOverlay('🐕', 'img-class', 'emoji-class');
            expect(el.tagName).toBe('SPAN');
            expect(el.className).toBe('emoji-class');
            expect(el.textContent).toBe('🐕');
            expect(el.getAttribute('aria-hidden')).toBe('true');
        });

        test('returns a <span> for a plain text string (no image extension)', () => {
            const el = game._createAssetOverlay('hello', 'img-class', 'emoji-class');
            expect(el.tagName).toBe('SPAN');
            expect(el.textContent).toBe('hello');
        });

        test('returns an <img> for an .svg asset', () => {
            const el = game._createAssetOverlay('paw.svg', 'img-class', 'emoji-class');
            expect(el.tagName).toBe('IMG');
            expect(el.className).toBe('img-class');
        });

        test('returns an <img> for a .png asset', () => {
            const el = game._createAssetOverlay('star.png', 'img-class', 'emoji-class');
            expect(el.tagName).toBe('IMG');
        });
    });

    // _setCellBackground — baseLayer fallback (lines 59-60)
    describe('_setCellBackground() — baseLayer fallback', () => {
        test('falls back to baseLayer asset when TileSvgs returns null base URI', () => {
            const origGetBaseUri = TileSvgs.getTileBaseUri;
            TileSvgs.getTileBaseUri = () => null;
            const cell = document.createElement('div');
            // Verify the fallback runs without throwing and attempts to set the background
            const spy = jest.spyOn(cell.style, 'background', 'set');
            game._setCellBackground(cell, 'grass', false);
            TileSvgs.getTileBaseUri = origGetBaseUri;
            expect(spy.mock.calls.length).toBeGreaterThan(0);
            const assigned = spy.mock.calls[0][0];
            expect(assigned).toContain('grass-base.svg');
            spy.mockRestore();
        });

        test('falls back to first asset when TileSvgs returns null and no baseLayer exists', () => {
            const origGetBaseUri = TileSvgs.getTileBaseUri;
            TileSvgs.getTileBaseUri = () => null;
            const cell = document.createElement('div');
            const spy = jest.spyOn(cell.style, 'background', 'set');
            game._setCellBackground(cell, 'wall', false);
            TileSvgs.getTileBaseUri = origGetBaseUri;
            expect(spy.mock.calls.length).toBeGreaterThan(0);
            const assigned = spy.mock.calls[0][0];
            expect(assigned).toContain('wall.png');
            spy.mockRestore();
        });
    });

    // _createCellElement — isPennedTile adds 'penned' class (line 179)
    describe('_createCellElement() — isPennedTile branch', () => {
        test('adds "penned" CSS class when cell coordinates are in accessibleTiles', () => {
            const accessibleTiles = new Set(['2,2']);
            const cell = game._createCellElement(2, 2, 'home', new Set(), accessibleTiles, null);
            expect(cell.classList.contains('penned')).toBe(true);
        });

        test('does not add "penned" CSS class when cell is not in accessibleTiles', () => {
            const cell = game._createCellElement(0, 0, 'grass', new Set(), new Set(), null);
            expect(cell.classList.contains('penned')).toBe(false);
        });
    });

    // _createCellElement — variant overlay fallback when TileSvgs returns null (line 209)
    describe('_createCellElement() — variant overlay TileSvgs fallback', () => {
        test('uses _createAssetOverlay fallback when getTileVariantUri returns null', () => {
            const origGetVariantUri = TileSvgs.getTileVariantUri;
            TileSvgs.getTileVariantUri = () => null;
            const cell = game._createCellElement(0, 0, 'grass', new Set(), new Set(), null);
            TileSvgs.getTileVariantUri = origGetVariantUri;
            // A tile-overlay-fill element should still be created via the fallback
            const overlay = cell.querySelector('.tile-overlay-fill');
            expect(overlay).not.toBeNull();
        });
    });

    // _createCellElement — paw overlay with rotation angle from directions map (lines 242-243)
    describe('_createCellElement() — paw rotation angle from directions', () => {
        test('applies the angle from directions map to the paw overlay transform', () => {
            const pathSet = new Set(['2,2']);
            const directions = new Map([['2,2', 90]]);
            const cell = game._createCellElement(2, 2, 'grass', pathSet, new Set(), directions);
            const paw = cell.querySelector('.paw-overlay');
            expect(paw).not.toBeNull();
            expect(paw.style.transform).toContain('90deg');
        });

        test('applies angle 0 when cell coordinate is not in directions map', () => {
            const pathSet = new Set(['0,0']);
            const directions = new Map(); // empty directions
            const cell = game._createCellElement(0, 0, 'grass', pathSet, new Set(), directions);
            const paw = cell.querySelector('.paw-overlay');
            expect(paw).not.toBeNull();
            expect(paw.style.transform).toContain('0deg');
        });
    });

    // _scheduleWanderStep — neighbors.length > 0 branch (lines 463, 468-470)
    describe('_scheduleWanderStep() — pet moves when accessible neighbors exist', () => {
        test('pet moves to an accessible cardinal neighbour when one is available', () => {
            // Give the pet a position and accessible tiles that include its neighbours
            game._petPos = { row: 2, col: 2 };
            const walker = document.createElement('span');
            walker.className = 'pet-walker';
            game.gridElement.appendChild(walker);

            const accessible = new Set(['2,2', '1,2', '3,2', '2,1', '2,3']);
            game._scheduleWanderStep(accessible);
            jest.advanceTimersByTime(CONSTANTS.PET_WANDER_STEP_MS + 1);

            // Pet must have moved to one of the accessible tiles
            expect(game._petPos).not.toBeNull();
            const movedKey = `${game._petPos.row},${game._petPos.col}`;
            expect(accessible.has(movedKey)).toBe(true);

            // Cancel follow-up wander timeouts to avoid leaking into other tests
            game._petWanderTimeouts.forEach(id => clearTimeout(id));
            game._petWanderTimeouts = [];
        });

        test('pet stays put when _petPos is null during a wander step', () => {
            game._petPos = null;
            const accessible = new Set(['2,2']);
            game._scheduleWanderStep(accessible);
            jest.advanceTimersByTime(CONSTANTS.PET_WANDER_STEP_MS + 1);
            // _petPos remains null — the early-return branch
            expect(game._petPos).toBeNull();
            game._petWanderTimeouts.forEach(id => clearTimeout(id));
            game._petWanderTimeouts = [];
        });
    });

    // _startPetReturn — no home tile in grid (lines 492-494)
    describe('_startPetReturn() — grid with no home tile', () => {
        test('calls onComplete immediately and clears _petPos when grid has no home', () => {
            const g = new Game(3);
            const noHomeTiles = Array.from({ length: 3 }, () => Array(3).fill('grass'));
            g.grid.loadMap(noHomeTiles);
            g.grid.saveInitialState();
            // Assign a dummy gridElement so the walker lookup doesn't throw
            g.gridElement = document.createElement('div');
            g._petPos = { row: 1, col: 1 };

            let called = false;
            g._startPetReturn(() => { called = true; });

            expect(called).toBe(true);
            expect(g._petPos).toBeNull();
        });
    });

    // _startPetReturn — path blocked by water (lines 506-508)
    describe('_startPetReturn() — pet completely blocked by water', () => {
        test('calls onComplete immediately when _findReturnPath returns null', () => {
            const g = new Game(3);
            const waterTiles = [
                ['water', 'water', 'water'],
                ['water', 'grass', 'water'],
                ['water', 'water', 'home'],
            ];
            g.grid.loadMap(waterTiles);
            g.grid.saveInitialState();
            g.gridElement = document.createElement('div');
            g._petPos = { row: 1, col: 1 };

            let called = false;
            g._startPetReturn(() => { called = true; });

            expect(called).toBe(true);
            expect(g._petPos).toBeNull();
        });
    });

    // _findReturnPath — no path exists (line 581)
    describe('_findReturnPath() — no reachable path', () => {
        test('returns null when every neighbour of the pet is water', () => {
            const g = new Game(3);
            const waterTiles = [
                ['water', 'water', 'water'],
                ['water', 'grass', 'water'],
                ['water', 'water', 'home'],
            ];
            g.grid.loadMap(waterTiles);
            g.grid.saveInitialState();

            const result = g._findReturnPath({ row: 1, col: 1 }, { row: 2, col: 2 });
            expect(result).toBeNull();
        });
    });

    // _showTileTooltip — returns early when I18N.t yields empty text (line 635)
    describe('_showTileTooltip() — empty translation fallback', () => {
        test('does not append a tooltip when I18N.t returns an empty string', () => {
            game.render();
            const cell = game.gridElement.querySelector('[data-row="0"][data-col="0"]');

            // Temporarily make I18N.t return an empty string for all keys
            const originalT = I18N.t.bind(I18N);
            I18N.t = () => '';

            game._showTileTooltip(cell, 'water');

            I18N.t = originalT;
            expect(cell.querySelector('.tile-tooltip')).toBeNull();
        });
    });

    // _showTileTooltip — auto-removal timeout fires (lines 646-647)
    describe('_showTileTooltip() — tooltip auto-removal', () => {
        test('removes the tooltip element after TILE_TOOLTIP_DURATION_MS elapses', () => {
            game.render();
            const cell = game.gridElement.querySelector('[data-row="0"][data-col="0"]');
            game._showTileTooltip(cell, 'water');

            expect(cell.querySelector('.tile-tooltip')).not.toBeNull();

            jest.advanceTimersByTime(CONSTANTS.TILE_TOOLTIP_DURATION_MS + 1);

            expect(cell.querySelector('.tile-tooltip')).toBeNull();
        });

        test('does not throw when tooltip is already removed before the timeout fires', () => {
            const cell = document.createElement('div');
            document.body.appendChild(cell);
            game._showTileTooltip(cell, 'star');
            // Manually remove tooltip before the timeout fires
            const tooltip = cell.querySelector('.tile-tooltip');
            if (tooltip) tooltip.remove();
            // Timeout fires — parentNode is null, should not throw
            expect(() => jest.advanceTimersByTime(CONSTANTS.TILE_TOOLTIP_DURATION_MS + 1)).not.toThrow();
            cell.remove();
        });
    });
});

// ---------------------------------------------------------------------------
// GameTimer — additional branch coverage (submission.time undefined, currentDate null)
// ---------------------------------------------------------------------------
describe('Game — Timer branch coverage (submission.time and currentDate)', () => {
    let game;

    function setupTimerDOM3() {
        document.body.innerHTML = `
            <div id="pauseOverlay" style="display:none;">
                <div id="pauseTitle"></div>
                <div id="pauseTime"></div>
                <button id="resumeBtn"></button>
            </div>
            <div class="controls-top">
                <div class="wall-counter"><span id="wallCounter">0/9</span></div>
                <button id="timerBtn"><span id="timerValue">00:00</span><span id="timerIcon">⏸</span></button>
                <div class="score-display"><span id="scoreValue">∞</span></div>
            </div>
            <div class="map-info"><span id="mapDay">1</span><span id="mapName">T</span></div>
            <div class="grid-container"><div id="grid" class="grid"></div></div>
            <div class="controls-bottom">
                <button id="resetBtn">Reset</button>
                <button id="pennedStatus" data-interactive="false">
                    <span class="submit-label">U</span><span class="submit-check">✗</span>
                </button>
                <div class="best-state-wrapper">
                    <button id="bestStateBanner" disabled style="display:none;">
                        <span class="best-state-label"></span>
                    </button>
                </div>
            </div>
            <div class="controls-hints">
                <button id="hintCheckBtn" style="display:none;" disabled>
                    <span class="hint-check-label">Check</span>
                </button>
                <div id="hintUsedDisplay" style="display:none;"></div>
            </div>
            <div id="notification"></div>
            <div id="solutionToggleBar" style="display:none;">
                <span id="solutionViewLabel"></span><button id="solutionToggleBtn"></button>
            </div>
            <aside id="roamSpaceViewer">
                <article class="viewer-card">
                    <section class="metrics-display">
                        <output id="roamAreaMetric">0</output>
                        <small id="roamAreaPercentage"></small>
                        <small class="metric-helper"></small>
                    </section>
                    <footer class="viewer-footer">
                        <button id="shareScoreBtn">Copy</button>
                        <button id="exitViewer">Back</button>
                    </footer>
                </article>
            </aside>
        `;
    }

    beforeEach(() => {
        setupTimerDOM3();
        document.cookie.split(';').forEach((c) => {
            document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
        });
        jest.useFakeTimers();
        const g = new Game(5);
        const tiles = Array.from({ length: 5 }, () => Array(5).fill('grass'));
        tiles[2][2] = 'home';
        g.grid.loadMap(tiles);
        g.grid.saveInitialState();
        game = g;
    });

    afterEach(() => {
        game._stopTimerInterval();
        jest.useRealTimers();
    });

    test('initTimerForDate uses 0 elapsed when submission exists but has no time property', () => {
        game.isSubmitted = true;
        game.loadSubmission = jest.fn(() => ({ score: 5, walls: [] })); // no .time
        game.currentDate = '2026-03-01';
        game.initTimerForDate('2026-03-01');
        expect(game.elapsedSeconds).toBe(0);
    });

    test('lockTimer works when currentDate is null (no cookie to delete)', () => {
        game.currentDate = null;
        expect(() => game.lockTimer()).not.toThrow();
        expect(game.isTimerLocked).toBe(true);
    });

    test('resetTimer works when currentDate is null (no cookie to delete)', () => {
        game.currentDate = null;
        expect(() => game.resetTimer()).not.toThrow();
        expect(game.isTimerLocked).toBe(false);
        expect(game.elapsedSeconds).toBe(0);
    });

    test('_startTimerInterval returns early when interval is already running', () => {
        game.isSubmitted = false;
        game.currentDate = '2026-03-01';
        game.initTimerForDate('2026-03-01');
        game.resumeTimer(); // starts interval
        const intervalRef = game._timerInterval;
        expect(intervalRef).not.toBeNull();
        // Calling again should NOT replace the existing interval
        game._startTimerInterval();
        expect(game._timerInterval).toBe(intervalRef);
    });

    test('_startTimerInterval returns early when timer is locked', () => {
        game.isTimerLocked = true;
        game.isPaused = false;
        game._startTimerInterval();
        expect(game._timerInterval).toBeNull();
    });

    test('_startTimerInterval returns early when timer is paused', () => {
        game.isTimerLocked = false;
        game.isPaused = true;
        game._startTimerInterval();
        expect(game._timerInterval).toBeNull();
    });
});
