/**
 * Game Tests — Timer Feature
 *
 * Unit tests for the timer methods added to the Game class:
 * _formatTime, initTimerForDate, pauseTimer, resumeTimer, toggleTimer,
 * pauseForMenu, resumeFromMenu, lockTimer, resetTimer, and related helpers.
 */

const Game = require('../../js/Game.js');

function setupDOM() {
    document.body.innerHTML = `
        <div id="grid" class="grid"></div>
        <div class="grid-container">
            <div id="pauseOverlay" class="pause-overlay" style="display: none;"></div>
        </div>
        <button id="timerBtn" class="timer-btn">
            <span id="timerValue" class="timer-value">00:00</span>
            <span id="timerIcon" class="timer-icon">⏸</span>
        </button>
        <button id="resumeBtn" class="resume-btn"></button>
        <button id="resetBtn"></button>
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

        test('resets manual pause flag on new level load', () => {
            game._pauseFromManual = true;
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            expect(game._pauseFromManual).toBe(false);
        });
    });

    // ------------------------------------------------------------------
    // pauseTimer / resumeTimer / toggleTimer
    // ------------------------------------------------------------------
    describe('pauseTimer()', () => {
        test('stops the interval and shows the pause overlay', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.pauseTimer();

            expect(game._pauseFromManual).toBe(true);
            expect(game._timerInterval).toBeNull();
            const overlay = document.getElementById('pauseOverlay');
            expect(overlay.style.display).toBe('flex');
        });

        test('does nothing when timer is locked', () => {
            game.isTimerLocked = true;
            game.pauseTimer();
            expect(game._pauseFromManual).toBe(false);
        });

        test('does nothing when already manually paused', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.pauseTimer();
            const firstInterval = game._timerInterval;
            game.pauseTimer(); // second call — should be no-op
            expect(game._timerInterval).toBe(firstInterval);
        });

        test('timer does not increment while paused', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.pauseTimer();
            jest.advanceTimersByTime(5000);
            expect(game.elapsedSeconds).toBe(0);
        });
    });

    describe('resumeTimer()', () => {
        test('restarts the interval and hides the overlay', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.pauseTimer();
            game.resumeTimer();

            expect(game._pauseFromManual).toBe(false);
            expect(game._timerInterval).not.toBeNull();
            const overlay = document.getElementById('pauseOverlay');
            expect(overlay.style.display).toBe('none');
        });

        test('does nothing when not manually paused', () => {
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
    });

    describe('toggleTimer()', () => {
        test('pauses when running', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.toggleTimer();
            expect(game._pauseFromManual).toBe(true);
        });

        test('resumes when paused', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.pauseTimer();
            game.toggleTimer();
            expect(game._pauseFromManual).toBe(false);
        });
    });

    // ------------------------------------------------------------------
    // pauseForMenu / resumeFromMenu
    // ------------------------------------------------------------------
    describe('pauseForMenu() / resumeFromMenu()', () => {
        test('pauseForMenu stops interval without showing overlay', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.pauseForMenu();

            expect(game._pauseFromMenu).toBe(true);
            expect(game._timerInterval).toBeNull();
            const overlay = document.getElementById('pauseOverlay');
            expect(overlay.style.display).toBe('none');
        });

        test('resumeFromMenu restarts interval', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.pauseForMenu();
            game.resumeFromMenu();

            expect(game._pauseFromMenu).toBe(false);
            expect(game._timerInterval).not.toBeNull();
        });

        test('resumeFromMenu does not start if manually paused', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.pauseTimer();     // manual pause
            game.pauseForMenu();   // menu also pauses
            game.resumeFromMenu(); // menu closes, but manual pause still active
            expect(game._timerInterval).toBeNull();
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

        test('clears manual pause and hides overlay', () => {
            game.isSubmitted = false;
            game.initTimerForDate('2026-01-01');
            game.pauseTimer();
            game.lockTimer();

            expect(game._pauseFromManual).toBe(false);
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
        test('shows pause icon when running', () => {
            game.isTimerLocked = false;
            game._pauseFromManual = false;
            game.updateTimerButton();
            const icon = document.getElementById('timerIcon');
            expect(icon.textContent).toBe('⏸');
            expect(document.getElementById('timerBtn').disabled).toBe(false);
        });

        test('shows play icon when manually paused', () => {
            game._pauseFromManual = true;
            game.updateTimerButton();
            const icon = document.getElementById('timerIcon');
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
});
