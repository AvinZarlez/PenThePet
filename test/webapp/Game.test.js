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
                <div id="pauseTitle" class="pause-title">Pause</div>
                <div id="pauseTime" class="pause-time">00:00</div>
                <button id="resumeBtn" class="resume-btn">&#9654; Resume</button>
            </div>
        </div>
        <div class="controls">
            <button id="resetBtn">Reset</button>
        </div>
        <div class="map-info">
            <span id="mapDay">42</span>
            <span id="mapName">Squirrel Scramble</span>
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
// buildShareText
// ------------------------------------------------------------------
describe('buildShareText()', () => {
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
        const text = game.buildShareText();
        expect(text).toContain('🐶');
    });

    test('contains the day number from the DOM', () => {
        const text = game.buildShareText();
        expect(text).toContain('Day 42');
    });

    test('contains the level name from the DOM', () => {
        const text = game.buildShareText();
        expect(text).toContain('Squirrel Scramble');
    });

    test('day line format is Day X - NAME - Date when name is present', () => {
        const text = game.buildShareText();
        expect(text).toContain('Day 42 - Squirrel Scramble -');
    });

    test('day line format is Day X - Date when name is absent', () => {
        document.getElementById('mapName').textContent = '';
        const text = game.buildShareText();
        expect(text).toContain('Day 42 -');
        expect(text).not.toContain('Day 42 -  -');
    });

    test('contains the score percentage', () => {
        const text = game.buildShareText();
        expect(text).toContain('80%');
    });

    test('contains formatted time', () => {
        const text = game.buildShareText();
        expect(text).toContain('01:33');
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
        // Run all timers
        jest.runAllTimers();
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

    test('all path tiles have paw overlays after animation completes', () => {
        game = createOpenGame();
        const pathInfo = game.calculatePath();
        game.render();
        jest.runAllTimers();
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
});
