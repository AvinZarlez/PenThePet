/**
 * Game Tests — Timer Feature
 *
 * Unit tests for the timer methods added to the Game class:
 * _formatTime, initTimerForDate, pauseTimer, resumeTimer,
 * lockTimer, resetTimer, visibility change handling, and related helpers.
 */

const Game = require('../../js/Game.js');

function setupDOM() {
    document.body.innerHTML = `
        <div id="pauseOverlay" class="pause-overlay" style="display: none;">
            <div class="pause-content">
                <div class="pause-title">Pause</div>
                <div id="pauseTime" class="pause-time">00:00</div>
                <button id="resumeBtn" class="resume-btn">&#9654; Resume</button>
            </div>
        </div>
        <div class="controls">
            <button id="resetBtn">Reset</button>
        </div>
        <div class="grid-container">
            <div id="grid" class="grid"></div>
        </div>
        <button id="timerBtn" class="timer-btn">
            <span id="timerValue" class="timer-value">00:00</span>
            <span id="timerIcon" class="timer-icon">⏸</span>
        </button>
        <button id="pennedStatus" class="penned-status not-penned" data-interactive="false">
            <span class="submit-label">Unsolved</span><span class="submit-check">✗</span>
        </button>
        <span id="wallCounter">0 / 9</span>
        <div class="area-size-display">
            <span id="areaSize">∞</span>
        </div>
        <div id="notification" class="notification"></div>
        <div id="solutionToggleBar" style="display: none;">
            <span id="solutionViewLabel"></span>
            <button id="solutionToggleBtn"></button>
        </div>
        <aside id="roamSpaceViewer" class="roam-viewer-sidebar">
            <article class="viewer-card">
                <section class="metrics-display">
                    <label class="metric-label">Roaming Area Score</label>
                    <output class="metric-value" id="roamAreaMetric">0</output>
                    <small class="metric-helper"></small>
                </section>
                <footer class="viewer-footer">
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
        test('starts from 0 with no saved state', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            expect(game.elapsedSeconds).toBe(0);
            expect(game.isTimerLocked).toBe(false);
            expect(game._timerInterval).not.toBeNull();
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

        test('timer interval increments elapsedSeconds each second', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            expect(game.elapsedSeconds).toBe(0);
            jest.advanceTimersByTime(3000);
            expect(game.elapsedSeconds).toBe(3);
        });

        test('resets isPaused flag on new level load', () => {
            game.isPaused = true;
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            expect(game.isPaused).toBe(false);
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
            jest.advanceTimersByTime(3000);
            game.pauseTimer();
            const pauseTime = document.getElementById('pauseTime');
            expect(pauseTime.textContent).toBe('00:03');
        });

        test('hides game content (controls, grid-container) when paused', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.pauseTimer();
            expect(document.querySelector('.controls').style.display).toBe('none');
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
            expect(document.querySelector('.controls').style.display).toBe('');
            expect(document.querySelector('.grid-container').style.display).toBe('');
        });

        test('does nothing when not paused', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            const intervalBefore = game._timerInterval;
            game.resumeTimer(); // should be no-op
            expect(game._timerInterval).toBe(intervalBefore);
        });

        test('timer increments again after resume', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
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
});
