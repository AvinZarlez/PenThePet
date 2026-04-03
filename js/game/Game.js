/**
 * Game Class
 *
 * Main game controller that manages the game state, user interactions,
 * and rendering. This is the primary interface for game logic.
 *
 * Rendering/animation methods are provided by GameAnimationsMixin (js/game/GameAnimations.js),
 * also applied via Object.assign at the bottom of this file.
 *
 * Timer behaviour is provided by GameTimerMixin (js/game/GameTimer.js), applied
 * via Object.assign at the bottom of this file.
 *
 * Score calculation is delegated to ScoreCalculator (js/game/ScoreCalculator.js)
 * so the scoring rules can be swapped for different game variants.
 */

class Game {
    /**
     * Create a new Game instance
     * @param {number} size - Initial grid size
     */
    constructor(size = CONFIG.grid.defaultSize) {
        this.grid = new Grid(size);
        this.gridElement = document.getElementById('grid');
        this.wallCount = 0;
        this.maxWalls = 9;
        this.boundHandleArrowKeys = this.handleArrowKeys.bind(this);
        this.boundHandleResize = this.handleResize.bind(this);
        this.lastFocusedCell = null;

        // Load pet emoji from cookie, or default to dog
        this.petEmoji = CookieUtils.getCookie('selectedPet') || '🐶';

        this.hintsDisabled = CONFIG.hints.disabled;
        this.neverShowTarget = CONFIG.hints.neverShowTarget;
        this.goalAreaSize = CONFIG.gameplay.goalAreaSize;
        this.hintsUsed = [];

        // Grid sizing constants
        this.CELL_GAP = CONSTANTS.CELL.GAP;
        this.CELL_GAP_SMALL = CONSTANTS.CELL.GAP_SMALL;
        this.CELL_GAP_BREAKPOINT = CONSTANTS.CELL.GAP_BREAKPOINT;
        this.GRID_PADDING = CONSTANTS.GRID_PADDING;
        this.MIN_CELL_SIZE = CONSTANTS.CELL.MIN_SIZE;
        this.MAX_CELL_SIZE = CONSTANTS.CELL.MAX_SIZE;

        // Submission state
        this.currentDate = null;
        this.isSubmitted = false;
        this.submittedScore = null;
        this.submittedWalls = null;
        this.optimalSolution = null;
        this.viewingOptimal = false;  // Track if user is viewing optimal solution

        // Best state (best penned score achieved before submission)
        this.bestScore = null;
        this.bestWalls = null;

        // Animation state
        this._pennedAnimationTimeouts = [];
        this._pawAnimationTimeouts = [];

        // Pet wander/return state
        this._petPos = null;          // {row, col} when pet is away from home, null when at home
        this._petWanderTimeouts = [];
        this._petReturnTimeouts = [];

        // Timer state
        this.elapsedSeconds = 0;
        this._timerInterval = null;
        this.isTimerLocked = false;
        this.isPaused = false;
        this.isReadyPending = false;

        this.attachEventListeners();
        // main.js loads the map from maps/YYYY.json and calls render() directly
    }

    /**
     * Render the grid to the DOM
     */
    render() {
        this._cancelPennedAnimation();
        this._cancelPawAnimation();
        this._cancelPetWander();
        this._cancelPetReturn();
        this.gridElement.innerHTML = '';
        this.gridElement.style.gridTemplateColumns = `repeat(${this.grid.size}, 1fr)`;

        // Set dynamic cell size based on grid size to ensure it always fits
        this.updateCellSizes();

        const allTiles = this.grid.getAllTiles();

        // Calculate path and penned status
        const pathInfo = this.calculatePath();
        const isPenned = !pathInfo.hasPath;
        const accessibleTiles = isPenned ? this.getAccessibleTiles() : new Set();

        for (let i = 0; i < this.grid.size; i++) {
            for (let j = 0; j < this.grid.size; j++) {
                // Render cells without penned/paw state; animations apply them progressively
                const cellElement = this._createCellElement(i, j, allTiles[i][j], new Set(), new Set(), pathInfo.directions);
                this.gridElement.appendChild(cellElement);
            }
        }

        // Create the pet walker overlay at the correct position.
        // The walker is a single element positioned over the whole grid so it
        // can smoothly transition between tiles using a CSS transform.
        const homePos = this.grid.getHomePosition();
        if (homePos) {
            const displayPos = this._petPos !== null ? this._petPos : homePos;
            this._createPetWalker(displayPos.row, displayPos.col);
        }

        // Update penned status indicator (logic is immediate, regardless of animation)
        this.updatePennedStatus(isPenned);
        this.updateAreaSizeDisplay();

        if (isPenned) {
            // Animate the penned area spreading out from home
            this._animatePennedArea(accessibleTiles, () => {
                if (this._petPos !== null) {
                    // Pet is away from home; return home first, then start wandering
                    this._startPetReturn(() => this._startPetWander(accessibleTiles));
                } else {
                    this._startPetWander(accessibleTiles);
                }
            });
        } else if (pathInfo.hasPath) {
            // Animate paws walking one tile at a time from home to the edge
            this._animatePawPath(pathInfo.orderedPath, pathInfo.directions);
            if (this._petPos !== null) {
                // Pet was wandering; walk it back home
                this._startPetReturn();
            }
        }
    }

    /**
     * Check if a position is valid on the grid
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {boolean} True if position is valid
     */
    isValidPosition(row, col) {
        return this.grid.tiles[row] !== undefined &&
               this.grid.tiles[row][col] !== undefined;
    }

    /**
     * Handle click events on cells
     * @param {MouseEvent|KeyboardEvent|null} event - The triggering event (not used by the game, but
     *   accepted so the signature matches the mixin's calling convention and the level editor)
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    handleCellClick(event, row, col) {
        // Prevent changes if already submitted or viewing optimal solution
        if (this.isSubmitted || this.viewingOptimal) {
            return;
        }

        const currentTileType = this.grid.getTile(row, col);

        // Allow clicking on wall-placeable tiles (convert to wall or transformed tile)
        if (isWallPlaceable(currentTileType)) {
            // Check if wall limit reached
            if (this.wallCount >= this.maxWalls) {
                this.showNotification(`All ${this.maxWalls} walls have been placed!`);
                return;
            }
            this.grid.setTile(row, col, getWallTransform(currentTileType));
            this.wallCount++;
            this.render();
            this.updateWallCounter();
        }
        // Allow clicking on wall-state tiles to remove them (revert to original tile type)
        else if (isWallState(currentTileType)) {
            const originalTile = this.grid.initialTiles[row] && this.grid.initialTiles[row][col];
            this.grid.setTile(row, col, originalTile || 'grass');
            this.wallCount = Math.max(0, this.wallCount - 1);
            this.render();
            this.updateWallCounter();
        } else {
            // Non-clickable tile — show an informational tooltip thought bubble
            const cell = this.gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                this._showTileTooltip(cell, currentTileType);
            }
            return;
        }

        // Re-focus the clicked cell after render() to prevent the view from snapping to the
        // top on mobile browsers (e.g. Waterfox/Firefox on Android). render() clears
        // gridElement.innerHTML, which removes the focused element from the DOM; some browsers
        // then scroll to y=0 searching for a focus target. Restoring focus with
        // preventScroll:true keeps the viewport in place.
        const restoredCell = this.gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (restoredCell) {
            restoredCell.focus({ preventScroll: true });
        }
    }

    /**
     * Handle keyboard events on cells
     * @param {KeyboardEvent} event - The keyboard event
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    handleCellKeydown(event, row, col) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.handleCellClick(event, row, col);
            // Restore focus to the same cell after click
            setTimeout(() => {
                const cell = this.gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    cell.focus({ preventScroll: true });
                }
            }, 10);
        }
    }

    /**
     * Check if a tile type blocks pathfinding.
     * Uses the blocksMovement property from TILE_DATA.
     * @param {string} tileType - The tile type to check
     * @returns {boolean} True if the tile blocks paths
     */
    isBlockingTile(tileType) {
        return isBlockingTile(tileType);
    }

    /**
     * Clear all pending timeouts and return a fresh empty array.
     * Used by every animation-cancel method to avoid repeated boilerplate.
     * @private
     * @param {number[]} timeoutsArray - Array of setTimeout IDs to cancel
     * @returns {number[]} Empty array to reassign to the cleared property
     */
    _clearTimeouts(timeoutsArray) {
        timeoutsArray.forEach(id => clearTimeout(id));
        return [];
    }

    /**
     * Calculate the path from home to the nearest edge using BFS
     * @returns {Object} Object with hasPath (boolean), path (Set of coordinates), and directions (Map of coordinate to rotation angle)
     */
    calculatePath() {
        const homePos = this.grid.getHomePosition();
        if (!homePos) {
            return { hasPath: false, path: new Set(), directions: new Map(), orderedPath: [] };
        }

        const { row: startRow, col: startCol } = homePos;
        const visited = new Set();
        const queue = [[startRow, startCol, []]]; // [row, col, path]
        visited.add(`${startRow},${startCol}`);

        const directions = [
            [-1, 0], // up
            [1, 0],  // down
            [0, -1], // left
            [0, 1]   // right
        ];

        while (queue.length > 0) {
            const [row, col, path] = queue.shift();

            // Check if we reached an edge
            if (row === 0 || row === this.grid.size - 1 || col === 0 || col === this.grid.size - 1) {
                // Build path set including current position
                const pathSet = new Set(path);
                pathSet.add(`${row},${col}`);

                // Build ordered path array for direction calculation
                // Note: path already includes the edge position as its last element
                const orderedPath = [`${startRow},${startCol}`, ...path];
                const directionMap = this._calculatePathDirections(orderedPath);

                return { hasPath: true, path: pathSet, directions: directionMap, orderedPath };
            }

            // Explore neighbors
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                const coordKey = `${newRow},${newCol}`;

                // Check bounds
                if (newRow < 0 || newRow >= this.grid.size || newCol < 0 || newCol >= this.grid.size) {
                    continue;
                }

                // Check if already visited
                if (visited.has(coordKey)) {
                    continue;
                }

                const tileType = this.grid.getTile(newRow, newCol);

                // Check if tile blocks path
                if (this.isBlockingTile(tileType)) {
                    continue;
                }

                visited.add(coordKey);
                const newPath = [...path, coordKey];
                queue.push([newRow, newCol, newPath]);
            }
        }

        // No path found
        return { hasPath: false, path: new Set(), directions: new Map(), orderedPath: [] };
    }

    /**
     * Calculate rotation angles for each step in an ordered path.
     * Each paw faces the direction toward the next step (the direction the pet walks).
     * @private
     * @param {Array<string>} orderedPath - Array of "row,col" strings in walk order
     * @returns {Map<string, number>} Map of coordinate string to rotation angle in degrees
     */
    _calculatePathDirections(orderedPath) {
        const directionMap = new Map();

        for (let i = 0; i < orderedPath.length; i++) {
            const current = orderedPath[i];
            // Use direction toward the next step; for the last step, continue
            // in the same direction as the previous step (forward, not backward)
            let dr, dc;

            if (i < orderedPath.length - 1) {
                // Normal case: face toward next step
                const [curRow, curCol] = current.split(',').map(Number);
                const [nextRow, nextCol] = orderedPath[i + 1].split(',').map(Number);
                dr = nextRow - curRow;
                dc = nextCol - curCol;
            } else if (i > 0) {
                // Last step: continue in the same direction as the previous step
                const [prevRow, prevCol] = orderedPath[i - 1].split(',').map(Number);
                const [curRow, curCol] = current.split(',').map(Number);
                dr = curRow - prevRow;
                dc = curCol - prevCol;
            } else {
                directionMap.set(current, 0);
                continue;
            }

            // Map direction deltas to rotation angles
            // Default paw points up (0°), right=90°, down=180°, left=270°
            let angle = 0;
            if (dr === -1 && dc === 0) angle = 0;         // up
            else if (dr === 0 && dc === 1) angle = 90;    // right
            else if (dr === 1 && dc === 0) angle = 180;   // down
            else if (dr === 0 && dc === -1) angle = 270;  // left

            directionMap.set(current, angle);
        }

        return directionMap;
    }

    /**
     * Get all tiles accessible from home (flood fill for penned area)
     * @returns {Set} Set of coordinate strings of accessible tiles
     */
    getAccessibleTiles() {
        const homePos = this.grid.getHomePosition();
        if (!homePos) {
            return new Set();
        }

        const { row: startRow, col: startCol } = homePos;
        const accessible = new Set();
        const queue = [[startRow, startCol]];
        accessible.add(`${startRow},${startCol}`);

        const directions = [
            [-1, 0], // up
            [1, 0],  // down
            [0, -1], // left
            [0, 1]   // right
        ];

        while (queue.length > 0) {
            const [row, col] = queue.shift();

            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                const coordKey = `${newRow},${newCol}`;

                // Check bounds
                if (newRow < 0 || newRow >= this.grid.size || newCol < 0 || newCol >= this.grid.size) {
                    continue;
                }

                // Check if already visited
                if (accessible.has(coordKey)) {
                    continue;
                }

                const tileType = this.grid.getTile(newRow, newCol);

                // Check if tile blocks access (same as path blocking)
                if (this.isBlockingTile(tileType)) {
                    continue;
                }

                accessible.add(coordKey);
                queue.push([newRow, newCol]);
            }
        }

        return accessible;
    }

    /**
     * Cancel any in-progress penned-area animation.
     * Clears all pending timeouts so stale DOM updates are dropped.
     */
    _cancelPennedAnimation() {
        this._pennedAnimationTimeouts = this._clearTimeouts(this._pennedAnimationTimeouts);
    }

    /**
     * Cancel any in-progress paw-path animation.
     * Clears all pending timeouts so stale DOM updates are dropped.
     */
    _cancelPawAnimation() {
        this._pawAnimationTimeouts = this._clearTimeouts(this._pawAnimationTimeouts);
    }

    /**
     * Cancel any in-progress pet-wander animation.
     * Clears all pending timeouts; _petPos is preserved so the pet stays
     * at its current position until explicitly moved or reset.
     */
    _cancelPetWander() {
        this._petWanderTimeouts = this._clearTimeouts(this._petWanderTimeouts);
    }

    /**
     * Cancel any in-progress pet-return animation.
     * Clears all pending timeouts; _petPos is preserved.
     */
    _cancelPetReturn() {
        this._petReturnTimeouts = this._clearTimeouts(this._petReturnTimeouts);
    }

    /**
     * Calculate the score from accessible tiles.
     * Delegates to ScoreCalculator so the scoring rules can be swapped for
     * different game variants without touching the game controller.
     * @returns {number} Weighted score of the penned area
     */
    calculateScore() {
        const accessible = this.getAccessibleTiles();
        return ScoreCalculator.calculateAreaScore(
            accessible,
            (row, col) => this.grid.getTile(row, col),
            getTileScore
        );
    }

    /**
     * Update the penned status indicator
     * @param {boolean} isPenned - Whether the pet is penned
     */
    updatePennedStatus(isPenned) {
        const statusElement = document.getElementById('pennedStatus');
        if (statusElement) {
            const yellowTileCount = isPenned ? this.calculateScore() : 0;

            if (isPenned) {
                // Check and update best state when penned and not yet submitted
                if (!this.isSubmitted) {
                    this._checkAndUpdateBestState(yellowTileCount);
                }

                // Change button text based on submission state
                if (this.isSubmitted) {
                    statusElement.innerHTML = `<span class="submit-label">${I18N.t('status_view_result')}</span>`;
                    statusElement.title = I18N.t('status_view_submitted', { count: yellowTileCount });
                } else {
                    statusElement.innerHTML = `<span class="submit-label">${I18N.t('status_submit')}</span><span class="submit-check">✓</span>`;
                    statusElement.title = I18N.t('status_penned_submit', { count: yellowTileCount });
                }
                statusElement.className = 'penned-status penned';
                statusElement.disabled = false;
                statusElement.dataset.interactive = 'true';
                statusElement.dataset.score = yellowTileCount;
            } else {
                // If submitted, still allow viewing result even if not currently penned
                if (this.isSubmitted && this.submittedScore) {
                    statusElement.innerHTML = `<span class="submit-label">${I18N.t('status_view_result')}</span>`;
                    statusElement.className = 'penned-status submitted';
                    statusElement.title = I18N.t('status_view_submitted_simple');
                    statusElement.disabled = false;
                    statusElement.dataset.interactive = 'true';
                    statusElement.dataset.score = this.submittedScore;
                } else {
                    statusElement.innerHTML = `<span class="submit-label">${I18N.t('status_unsolved')}</span><span class="submit-check">✗</span>`;
                    statusElement.className = 'penned-status not-penned';
                    statusElement.title = I18N.t('status_cant_escape');
                    statusElement.disabled = true;
                    statusElement.dataset.interactive = 'false';
                    statusElement.dataset.score = '0';
                }
            }
        }
    }

    /**
     * Update the score display with current score and goal coloring
     */
    updateAreaSizeDisplay() {
        const scoreEl = document.getElementById('scoreValue');
        const scoreDisplay = scoreEl ? scoreEl.parentElement : null;

        if (scoreEl && scoreDisplay) {
            const pathInfo = this.calculatePath();
            const isPenned = !pathInfo.hasPath;

            if (isPenned) {
                const score = this.calculateScore();
                const hasChecked = this.hintsUsed.includes(CONSTANTS.HINT_CHECKED);
                const hasTarget = this.hintsUsed.includes(CONSTANTS.HINT_TARGET);

                // Display score based on hints used
                if (hasTarget) {
                    // Target revealed: show "score / goal"
                    scoreEl.textContent = I18N.t('score_with_goal', { score, goalScore: this.goalAreaSize });
                } else {
                    if (hasChecked) {
                        // Checked: show score with "<" if not optimal
                        scoreEl.textContent = score < this.goalAreaSize
                            ? I18N.t('score_below_goal', { score })
                            : I18N.t('score_at_goal', { score });
                    }
                    else {
                        scoreEl.textContent = score.toString();
                    }
                }

                // Apply color if user has checked or revealed target
                scoreDisplay.classList.remove('penned-yellow', 'penned-green');

                if (hasChecked || hasTarget) {
                    if (score < this.goalAreaSize) {
                        scoreDisplay.classList.add('penned-yellow');
                    } else {
                        scoreDisplay.classList.add('penned-green');
                    }
                }
            } else {
                scoreEl.textContent = I18N.t('score_infinity');
                scoreDisplay.classList.remove('penned-yellow', 'penned-green');
            }
        }
        this.updateHintButton();
    }

    // =====================================================================
    // Best State Methods
    // =====================================================================

    /**
     * Check if the current penned score beats the stored best state, and
     * if so, save the new best state (walls + score) to cookie and cloud.
     * @param {number} currentScore - Pre-calculated score for the current penned area
     * @private
     */
    _checkAndUpdateBestState(currentScore) {
        if (!this.currentDate) return;
        if (this.bestScore !== null && currentScore <= this.bestScore) return;

        // Collect current wall positions
        const walls = [];
        for (let i = 0; i < this.grid.size; i++) {
            for (let j = 0; j < this.grid.size; j++) {
                if (isWallState(this.grid.getTile(i, j))) {
                    walls.push([i, j]);
                }
            }
        }

        this.bestScore = currentScore;
        this.bestWalls = walls;
        this.saveBestState(this.currentDate, currentScore, walls);
        this.updateBestStateBanner();
    }

    /**
     * Save the best state (score + walls) to cookie and sync to cloud.
     * Stored separately from the submission cookie so it is never confused
     * with a formally submitted result.
     * Cookie name format: progress_YYYY-MM-DD
     * @param {string} dateString - Puzzle date
     * @param {number} score - Best penned area score
     * @param {Array} walls - Wall positions [[row, col], ...]
     */
    saveBestState(dateString, score, walls) {
        const data = { bestScore: score, bestWalls: walls, mapVersion: this._getCurrentMapVersion() };
        CookieUtils.setCookie(`progress_${dateString}`, JSON.stringify(data), 365);

        if (typeof CloudSync !== 'undefined' && CloudSync.isConfigured() && CloudSync.isLoggedIn()) {
            CloudSync.saveProgressState(dateString, data);
        }
    }

    /**
     * Load the best state from cookie into this.bestScore / this.bestWalls.
     * Clears the progress state if the saved map version no longer matches
     * the current map version (the map layout or goal has changed).
     * @param {string} dateString - Puzzle date
     */
    loadBestState(dateString) {
        const value = CookieUtils.getCookie(`progress_${dateString}`);
        if (value) {
            try {
                const data = JSON.parse(value);
                if (typeof data.bestScore === 'number' && Array.isArray(data.bestWalls)) {
                    const savedVersion = typeof data.mapVersion === 'number' ? data.mapVersion : 0;
                    if (savedVersion !== this._getCurrentMapVersion()) {
                        this.resetLevelData(dateString);
                        return;
                    }
                    this.bestScore = data.bestScore;
                    this.bestWalls = data.bestWalls;
                    return;
                }
            } catch { /* ignore malformed cookie */ }
        }
        this.bestScore = null;
        this.bestWalls = null;
    }

    /**
     * Return the version number of the currently loaded map.
     * Maps that pre-date the version field are treated as version 0.
     * @returns {number}
     */
    _getCurrentMapVersion() {
        return (this.currentMapData && typeof this.currentMapData.version === 'number')
            ? this.currentMapData.version
            : 0;
    }

    /**
     * Delete stale progress and timer cookies/cloud docs for a puzzle date.
     * Called when a map version mismatch is detected so that in-progress state
     * from an older version of the map does not linger.
     * @param {string} dateString - Puzzle date
     */
    _clearStaleProgress(dateString) {
        CookieUtils.deleteCookie(`progress_${dateString}`);
        CookieUtils.deleteCookie(`timer_${dateString}`);

        if (typeof CloudSync !== 'undefined' && CloudSync.isConfigured() && CloudSync.isLoggedIn()) {
            CloudSync.deleteSubmission(`progress_${dateString}`);
            CloudSync.deleteSubmission(`timer_${dateString}`);
        }
    }

    /**
     * Fully reset all saved data for a puzzle and clear in-memory state.
     * Deletes the submission, hints, progress, and timer cookies/cloud docs,
     * then resets all submission-related fields on this game object.
     *
     * Used as the shared implementation for:
     *   - The debug "Reset Level" tool (via Menu.resetCurrentLevel)
     *   - Map version mismatch when the user did not achieve a perfect score
     *
     * Callers are responsible for any visual / grid / timer resets that follow.
     * @param {string} dateString - Puzzle date / save key
     */
    resetLevelData(dateString) {
        this.deleteSubmission(dateString);
        this._clearStaleProgress(dateString);

        this.isSubmitted = false;
        this.submittedScore = null;
        this.submittedWalls = null;
        this.viewingOptimal = false;
        this.hintsUsed = [];
        this.bestScore = null;
        this.bestWalls = null;
    }

    /**
     * Update the "Best Placement So Far" banner with the current best score.
     * Hidden after submission (best state is only meaningful before submitting).
     */
    updateBestStateBanner() {
        const banner = document.getElementById('bestStateBanner');
        if (!banner) return;

        if (this.isSubmitted) {
            banner.style.display = 'none';
            // Wrapper intentionally kept visible to maintain layout symmetry in the
            // bottom controls row — the grid column must stay filled even after submit.
            return;
        }

        banner.style.display = '';
        const label = banner.querySelector('.best-state-label');
        if (this.bestScore === null) {
            if (label) label.textContent = I18N.t('best_so_far_none');
            banner.disabled = true;
            banner.title = I18N.t('best_so_far_title_none');
        } else {
            if (label) label.textContent = I18N.t('best_so_far', { score: this.bestScore });
            banner.disabled = false;
            banner.title = I18N.t('best_so_far_title');
        }
    }

    /**
     * Restore the wall placement from the best saved state.
     * Has no effect if no best state exists or the puzzle is already submitted.
     */
    loadBestStateWalls() {
        if (!this.bestWalls || this.isSubmitted) return;
        this.loadWallPositions(this.bestWalls);
        this.render();
    }

    /**
     * Reset the game to initial state.
     * Blocked when the player has already submitted.
     */
    reset() {
        if (this.isSubmitted) return;
        this.grid.reset();
        this.wallCount = 0;
        this.render();
        this.updateWallCounter();
        this.updateAreaSizeDisplay();
    }

    /**
     * Update the Reset button's enabled/disabled state based on submission
     */
    updateResetButton() {
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            // Hide the button entirely after submission so the left column stays
            // tidy; the grid column still occupies space via the wrapper/layout.
            resetBtn.style.visibility = this.isSubmitted ? 'hidden' : '';
            resetBtn.disabled = this.isSubmitted;
        }
    }

    /**
     * Attach event listeners to UI controls
     */
    attachEventListeners() {
        const resetBtn = document.getElementById('resetBtn');
        const statusBtn = document.getElementById('pennedStatus');
        const exitViewerBtn = document.getElementById('exitViewer');
        const solutionToggleBtn = document.getElementById('solutionToggleBtn');

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }

        if (statusBtn) {
            statusBtn.addEventListener('click', () => this.displayRoamingArea());
        }

        if (exitViewerBtn) {
            exitViewerBtn.addEventListener('click', () => this.hideRoamingArea());
        }

        if (solutionToggleBtn) {
            solutionToggleBtn.addEventListener('click', () => this.toggleSolution());
        }

        // Share score button
        const shareScoreBtn = document.getElementById('shareScoreBtn');
        if (shareScoreBtn) {
            shareScoreBtn.addEventListener('click', () => this._handleShareScore());
        }

        // Share level button (in the map-info banner)
        const shareLevelBtn = document.getElementById('shareLevelBtn');
        if (shareLevelBtn) {
            shareLevelBtn.addEventListener('click', () => this._handleShareLevel());
        }

        // Hint check button
        const hintCheckBtn = document.getElementById('hintCheckBtn');
        if (hintCheckBtn) {
            hintCheckBtn.addEventListener('click', () => this.handleHintCheck());
        }

        // Best state banner — load best wall configuration when clicked
        const bestStateBanner = document.getElementById('bestStateBanner');
        if (bestStateBanner) {
            bestStateBanner.addEventListener('click', () => this.loadBestStateWalls());
        }

        // Timer button
        const timerBtn = document.getElementById('timerBtn');
        if (timerBtn) {
            timerBtn.addEventListener('click', () => this.pauseTimer());
        }

        // Resume button in pause overlay
        const resumeBtn = document.getElementById('resumeBtn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => this.resumeTimer());
        }

        // Pause when tab is hidden, resume when it becomes visible again
        this._boundHandleVisibilityChange = this._handleVisibilityChange.bind(this);
        document.addEventListener('visibilitychange', this._boundHandleVisibilityChange);

        // Add arrow key navigation (using bound function for potential cleanup)
        document.addEventListener('keydown', this.boundHandleArrowKeys);

        // Add window resize handler to recalculate cell sizes
        window.addEventListener('resize', this.boundHandleResize);
    }

    /**
     * Handle window resize events
     */
    handleResize() {
        // Use a debounce to avoid excessive recalculations
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(() => {
            this.updateCellSizes();
        }, 100);
    }

    /**
     * Calculate optimal cell gap based on viewport width.
     * On small screens the gap is reduced to avoid visually thick grid lines.
     * @returns {number} The gap size in pixels
     */
    calculateCellGap() {
        return window.innerWidth <= this.CELL_GAP_BREAKPOINT
            ? this.CELL_GAP_SMALL
            : this.CELL_GAP;
    }

    /**
     * Calculate optimal cell size based on viewport and grid size
     * @returns {number} The calculated cell size in pixels
     */
    calculateCellSize() {
        // Calculate available width (width-only sizing allows vertical scrolling)
        const availableWidth = window.innerWidth * 0.90;

        // Calculate total space needed for gaps and padding
        const totalGap = this.calculateCellGap() * (this.grid.size - 1);
        const totalPadding = this.GRID_PADDING * 2; // padding on both sides

        // Calculate max cell size that fits the available width
        const maxCellSize = Math.floor((availableWidth - totalPadding - totalGap) / this.grid.size);

        return Math.max(this.MIN_CELL_SIZE, Math.min(this.MAX_CELL_SIZE, maxCellSize));
    }

    /**
     * Update cell sizes based on current viewport and grid size
     */
    updateCellSizes() {
        const cellSize = this.calculateCellSize();
        const cellGap = this.calculateCellGap();
        this.gridElement.style.setProperty('--cell-size', `${cellSize}px`);
        this.gridElement.style.setProperty('--grid-gap', `${cellGap}px`);
        this.gridElement.style.setProperty('--grid-padding', '3px');
        this.gridElement.style.gap = `${cellGap}px`;
    }

    /**
     * Display the roaming area viewer with the current score
     */
    displayRoamingArea() {
        const statusBtn = document.getElementById('pennedStatus');
        if (statusBtn && statusBtn.dataset.interactive === 'true') {
            const areaCount = parseInt(statusBtn.dataset.score || '0');
            const viewerPanel = document.getElementById('roamSpaceViewer');

            // If not yet submitted, save the submission
            if (!this.isSubmitted) {
                this.handleSubmission(areaCount);
            }

            // Always show the player's submitted score, never the optimal score
            const scoreToDisplay = this.isSubmitted ? this.submittedScore : areaCount;

            // Update the score screen display
            this.updateScoreScreen(scoreToDisplay);

            if (viewerPanel) {
                viewerPanel.classList.add('active');
            }
        }
    }

    /**
     * Handle score submission (first time only)
     * @param {number} score - The user's score
     */
    handleSubmission(score) {
        if (this.isSubmitted || !this.currentDate) {
            return;
        }

        // Lock the timer before saving (so the locked time is included in submission)
        this.lockTimer();

        // Get current wall positions (includes walls and wall-state tiles like filled holes)
        const wallPositions = [];
        for (let i = 0; i < this.grid.size; i++) {
            for (let j = 0; j < this.grid.size; j++) {
                if (isWallState(this.grid.getTile(i, j))) {
                    wallPositions.push([i, j]);
                }
            }
        }

        // Save to cookie
        this.saveSubmission(this.currentDate, score, wallPositions);
        this.isSubmitted = true;
        this.submittedScore = score;
        this.submittedWalls = wallPositions;

        // Track analytics event
        if (typeof Analytics !== 'undefined') {
            const isPerfect = score >= this.goalAreaSize;
            Analytics.trackLevelCompleted(
                this.currentDate,
                score,
                this.goalAreaSize,
                wallPositions.length,
                this.elapsedSeconds,
                isPerfect,
                this.hintsUsed.includes(CONSTANTS.HINT_CHECKED),
                this.hintsUsed.includes(CONSTANTS.HINT_TARGET)
            );
        }

        // Update the submit button text
        this.updatePennedStatus(true);
        // Hide the reset and hint buttons after submission
        this.updateResetButton();
        this.updateHintButton();

        // Show solution toggle bar if optimal solution is available
        this.updateSolutionToggleBar();

        // Hide the best state banner now that the puzzle is submitted
        this.updateBestStateBanner();
    }

    /**
     * Update the score screen with user's score and optimal comparison
     * @param {number} userScore - The user's score
     */
    updateScoreScreen(userScore) {
        const metricOutput = document.getElementById('roamAreaMetric');
        if (!metricOutput) return;

        // Ensure both values are numbers for comparison
        const userScoreNum = Number(userScore);
        const goalScoreNum = Number(this.goalAreaSize);

        // Check if perfect score
        const isPerfect = userScoreNum === goalScoreNum;

        // Build the display text
        const displayText = isPerfect
            ? `🎉 ${userScoreNum} 🎉`
            : userScoreNum.toString();

        metricOutput.innerHTML = displayText;

        // Display score as a percentage of the goal
        const percentageElement = document.getElementById('roamAreaPercentage');
        if (percentageElement && goalScoreNum > 0) {
            const pct = Math.round((userScoreNum / goalScoreNum) * 100);
            percentageElement.textContent = I18N.t('pct_of_goal', { pct, userScore: userScoreNum, goalScore: goalScoreNum });
        }

        // Update the helper text to show optimal score
        const helperElement = document.querySelector('.metric-helper');
        if (helperElement) {
            const timeStr = this._formatTime(this.elapsedSeconds);
            if (isPerfect) {
                helperElement.innerHTML = I18N.t('perfect_score', { goalScore: goalScoreNum, time: timeStr });
            } else {
                helperElement.innerHTML = I18N.t('your_score_info', { goalScore: goalScoreNum, time: timeStr });
            }
        }

        // Add/update toggle button for optimal solution
        this.addOptimalSolutionToggle();
    }

    /**
     * Build shareable text with configurable content.
     *
     * @param {object} [options]
     * @param {boolean} [options.includeLevel=true]  Whether to include the day/map/date
     *     line and a level-specific URL (?date=…). When false, omits the level line and
     *     uses a generic "latest" URL (?level=latest) instead.
     * @param {boolean} [options.includeScore=false] Whether to include the score and
     *     hints lines (requires the puzzle to have been submitted).
     * @returns {string} Formatted share text
     */
    buildShareText({ includeLevel = true, includeScore = false } = {}) {
        const lines = [I18N.t('share_title', { emoji: this.petEmoji })];

        if (includeLevel) {
            const date = this.currentDate || '';
            const displayDate = date ? DateUtils.formatDate(date) : '';

            // Day number and level name from the DOM (set by updateMapInfo)
            const dayNumEl = document.getElementById('mapDay');
            const dayNum = dayNumEl ? dayNumEl.textContent : '?';
            const mapNameEl = document.getElementById('mapName');
            const mapName = mapNameEl ? mapNameEl.textContent : '';

            const dateLine = mapName
                ? I18N.t('share_day_map_date', { day: dayNum, mapName, date: displayDate })
                : I18N.t('share_day_date', { day: dayNum, date: displayDate });
            lines.push(dateLine);

            if (includeScore) {
                const score = this.submittedScore ?? 0;
                const goal = Number(this.goalAreaSize);
                const pct = goal > 0 ? Math.round((score / goal) * 100) : 0;
                const timeStr = this._formatTime(this.elapsedSeconds);
                lines.push(I18N.t('share_score_line', { pct, time: timeStr }));

                // Add hints used line if any hints were used
                if (this.hintsUsed.length > 0) {
                    const hintLabels = {
                        [CONSTANTS.HINT_CHECKED]: I18N.t('share_hint_checked'),
                        [CONSTANTS.HINT_TARGET]: I18N.t('share_hint_target'),
                    };
                    const hintsStr = this.hintsUsed.map(h => hintLabels[h] || h).join(', ');
                    lines.push(I18N.t('share_hints_line', { hints: hintsStr }));
                }
            }

            // Add the URL so recipients can jump directly to this puzzle.
            // Use window.location.origin + pathname so it works on any deployment.
            // For custom maps loaded via ?map=, encode the full map data so the
            // recipient can load the same puzzle without a maps database entry.
            if (typeof window !== 'undefined' && window.location) {
                const base = window.location.origin + window.location.pathname;
                if (this.isCustomMapLevel) {
                    if (this.currentMapData && typeof MapURLCodec !== 'undefined') {
                        const encoded = MapURLCodec.encodeMapData(this.currentMapData);
                        lines.push(I18N.t('share_url_line', { url: `${base}?map=${encoded}` }));
                    }
                    // If MapURLCodec or currentMapData is unavailable, omit the URL
                    // rather than exposing the internal save key as a ?date= param.
                } else if (date) {
                    lines.push(I18N.t('share_url_line', { url: `${base}?date=${date}` }));
                }
            }
        } else {
            // No specific level — use a generic "play latest" URL.
            if (typeof window !== 'undefined' && window.location) {
                const base = window.location.origin + window.location.pathname;
                lines.push(I18N.t('share_url_line', { url: `${base}?level=latest` }));
            }
        }

        return lines.join('\n');
    }

    /**
     * Copy text to the clipboard and show a neutral toast notification.
     * Falls back to execCommand for environments without the Clipboard API.
     * @param {string} text - The text to copy
     */
    _copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                this.showNotification(I18N.t('copied_success'), 'neutral');
            }).catch(() => {
                this.showNotification(I18N.t('copied_failed'));
            });
        } else {
            // Fallback for environments without Clipboard API
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                this.showNotification(I18N.t('copied_success'), 'neutral');
            } catch {
                this.showNotification(I18N.t('copied_failed'));
            }
            document.body.removeChild(ta);
        }
    }

    /**
     * Handle the "Copy Score" button click: build share text with score, copy to
     * clipboard, and show a neutral toast notification as feedback.
     */
    _handleShareScore() {
        if (!this.isSubmitted) return;
        this._copyToClipboard(this.buildShareText({ includeLevel: true, includeScore: true }));
    }

    /**
     * Handle the share level button click (in the map-info banner): builds
     * level share text without score and copies it to the clipboard.
     * Shows a neutral toast notification as feedback.
     */
    _handleShareLevel() {
        this._copyToClipboard(this.buildShareText({ includeLevel: true, includeScore: false }));
    }

    /**
     * Handle the "Tell your friends" button click: builds a generic game share
     * text (no specific level, no score) and copies it to the clipboard.
     * Shows a neutral toast notification as feedback.
     */
    handleTellFriends() {
        this._copyToClipboard(this.buildShareText({ includeLevel: false }));
    }

    /**
     * Add toggle button to switch between user and optimal solutions
     */
    addOptimalSolutionToggle() {
        if (!this.optimalSolution || !this.isSubmitted) {
            return;
        }

        const footer = document.querySelector('#roamSpaceViewer .viewer-footer');
        if (!footer) return;

        // If the submitted solution matches the optimal, show a text message instead of a toggle button
        if (this.isSolutionOptimal()) {
            // Remove toggle button if it was previously created
            const existingBtn = document.getElementById('toggleSolutionBtn');
            if (existingBtn) {
                existingBtn.remove();
            }

            // Add optimal message if not already present
            if (!document.getElementById('optimalSolutionMsg')) {
                const msg = document.createElement('span');
                msg.id = 'optimalSolutionMsg';
                msg.className = 'optimal-solution-msg';
                msg.textContent = I18N.t('solution_is_optimal_star');
                const exitBtn = document.getElementById('exitViewer');
                if (exitBtn) {
                    footer.insertBefore(msg, exitBtn);
                } else {
                    footer.appendChild(msg);
                }
            }

            return;
        }

        // Check if toggle button already exists
        let toggleBtn = document.getElementById('toggleSolutionBtn');

        // Remove stale optimal message if present
        const existingMsg = document.getElementById('optimalSolutionMsg');
        if (existingMsg) {
            existingMsg.remove();
        }

        if (!toggleBtn) {
            toggleBtn = document.createElement('button');
            toggleBtn.id = 'toggleSolutionBtn';
            toggleBtn.className = 'toggle-solution-btn';

            // Insert before the exit button
            const exitBtn = document.getElementById('exitViewer');
            if (exitBtn) {
                footer.insertBefore(toggleBtn, exitBtn);
            } else {
                footer.appendChild(toggleBtn);
            }

            // Add event listener - toggle solution and close sidebar so the board is visible
            toggleBtn.addEventListener('click', () => {
                this.toggleSolution();
                const viewerPanel = document.getElementById('roamSpaceViewer');
                if (viewerPanel) {
                    viewerPanel.classList.remove('active');
                }
            });
        }

        // Update button text based on current state
        toggleBtn.textContent = this.viewingOptimal ? I18N.t('solution_toggle_view_yours') : I18N.t('solution_toggle_view_optimal');
    }

    /**
     * Check if the user's submitted solution matches the optimal solution exactly
     * @returns {boolean} True if submitted walls match optimal solution
     */
    isSolutionOptimal() {
        if (!this.submittedWalls || !this.optimalSolution) {
            return false;
        }
        if (this.submittedWalls.length !== this.optimalSolution.length) {
            return false;
        }
        const submittedSet = new Set(this.submittedWalls.map(([r, c]) => `${r},${c}`));
        return this.optimalSolution.every(([r, c]) => submittedSet.has(`${r},${c}`));
    }

    /**
     * Toggle between user's solution and optimal solution
     */
    toggleSolution() {
        if (!this.optimalSolution || !this.submittedWalls) {
            return;
        }

        if (this.viewingOptimal) {
            // Switch to user's solution
            this.loadWallPositions(this.submittedWalls);
            this.viewingOptimal = false;
        } else {
            // Switch to optimal solution
            this.loadWallPositions(this.optimalSolution);
            this.viewingOptimal = true;
        }

        // Update sidebar button text
        this.addOptimalSolutionToggle();

        // Update main toggle bar
        this.updateSolutionToggleBar();

        // Re-render
        this.render();
    }

    /**
     * Update the solution toggle bar on the main screen
     * Shows after submission when optimal solution is available
     */
    updateSolutionToggleBar() {
        const toggleBar = document.getElementById('solutionToggleBar');
        const viewLabel = document.getElementById('solutionViewLabel');
        const toggleBtn = document.getElementById('solutionToggleBtn');

        if (!toggleBar || !viewLabel || !toggleBtn) return;

        // Only show if submitted and optimal solution exists
        if (!this.isSubmitted || !this.optimalSolution) {
            toggleBar.style.display = 'none';
            return;
        }

        toggleBar.style.display = 'flex';

        // If the submitted solution matches the optimal, just show a confirmation message
        if (this.isSolutionOptimal()) {
            viewLabel.textContent = I18N.t('solution_is_optimal_star');
            toggleBtn.style.display = 'none';
            toggleBar.classList.remove('viewing-optimal');
            return;
        }

        toggleBtn.style.display = 'inline-block';
        if (this.viewingOptimal) {
            viewLabel.textContent = I18N.t('solution_viewing_optimal');
            toggleBtn.textContent = I18N.t('solution_toggle_view_yours');
            toggleBar.classList.add('viewing-optimal');
        } else {
            viewLabel.textContent = I18N.t('solution_viewing_yours');
            toggleBtn.textContent = I18N.t('solution_toggle_view_optimal');
            toggleBar.classList.remove('viewing-optimal');
        }
    }

    /**
     * Load wall positions onto the grid
     * Note: Uses clear-and-rebuild approach for simplicity and clarity.
     * Performance impact is minimal given typical grid sizes (7x7 to 11x11).
     * @param {Array} wallPositions - Array of [row, col] positions
     */
    loadWallPositions(wallPositions) {
        // Clear all existing walls first (revert to original tile type)
        for (let i = 0; i < this.grid.size; i++) {
            for (let j = 0; j < this.grid.size; j++) {
                if (isWallState(this.grid.getTile(i, j))) {
                    const originalTile = this.grid.initialTiles[i] && this.grid.initialTiles[i][j];
                    this.grid.setTile(i, j, originalTile || 'grass');
                }
            }
        }

        // Place new walls (on wall-placeable tiles, using wallTransformsTo if defined)
        this.wallCount = 0;
        for (const [row, col] of wallPositions) {
            const tile = this.isValidPosition(row, col) ? this.grid.getTile(row, col) : null;
            if (tile && isWallPlaceable(tile)) {
                this.grid.setTile(row, col, getWallTransform(tile));
                this.wallCount++;
            }
        }

        this.updateWallCounter();
    }

    /**
     * Hide the roaming area viewer
     */
    hideRoamingArea() {
        const viewerPanel = document.getElementById('roamSpaceViewer');
        if (viewerPanel) {
            viewerPanel.classList.remove('active');
        }

        // If viewing optimal, switch back to user's solution
        if (this.viewingOptimal && this.submittedWalls) {
            this.loadWallPositions(this.submittedWalls);
            this.viewingOptimal = false;
            this.updateSolutionToggleBar();
            this.render();
        }
    }

    /**
     * Handle arrow key navigation
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleArrowKeys(event) {
        // Handle spacebar to toggle pause/resume (skip if a menu modal is open)
        if (event.key === ' ') {
            const modalOpen = document.querySelector('.modal.show');
            if (!modalOpen) {
                event.preventDefault();
                if (this.isPaused) {
                    this.resumeTimer();
                } else {
                    this.pauseTimer();
                }
            }
            return;
        }

        // Only handle arrow keys
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            return;
        }

        const activeElement = document.activeElement;

        // Check if the focused element is a grid cell
        if (!activeElement || !activeElement.classList.contains('cell')) {
            // Nothing is highlighted, highlight an edge piece based on arrow key
            event.preventDefault();
            this.highlightEdgePiece(event.key);
            return;
        }

        event.preventDefault();

        const currentRow = parseInt(activeElement.dataset.row);
        const currentCol = parseInt(activeElement.dataset.col);
        let newRow = currentRow;
        let newCol = currentCol;

        // Calculate new position based on arrow key
        switch (event.key) {
        case 'ArrowUp':
            newRow = Math.max(0, currentRow - 1);
            break;
        case 'ArrowDown':
            newRow = Math.min(this.grid.size - 1, currentRow + 1);
            break;
        case 'ArrowLeft':
            newCol = Math.max(0, currentCol - 1);
            break;
        case 'ArrowRight':
            newCol = Math.min(this.grid.size - 1, currentCol + 1);
            break;
        }

        // Focus the new cell
        const newCell = this.gridElement.querySelector(`[data-row="${newRow}"][data-col="${newCol}"]`);
        if (newCell) {
            newCell.focus();
        }
    }

    /**
     * Highlight an edge piece based on arrow key direction
     * @param {string} arrowKey - The arrow key pressed
     */
    highlightEdgePiece(arrowKey) {
        let row, col;
        const size = this.grid.size;
        const mid = Math.floor(size / 2);

        switch (arrowKey) {
        case 'ArrowUp':
            // Highlight top edge, middle column
            row = 0;
            col = mid;
            break;
        case 'ArrowDown':
            // Highlight bottom edge, middle column
            row = size - 1;
            col = mid;
            break;
        case 'ArrowLeft':
            // Highlight left edge, middle row
            row = mid;
            col = 0;
            break;
        case 'ArrowRight':
            // Highlight right edge, middle row
            row = mid;
            col = size - 1;
            break;
        default:
            return;
        }

        const cell = this.gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.focus();
        }
    }

    /**
     * Update the legend to show the current pet emoji
     */
    updateLegend() {
        const homeLegend = document.getElementById('homeLegend');
        if (homeLegend) {
            homeLegend.textContent = I18N.t('home_label', { emoji: this.petEmoji });
        }
    }

    /**
     * Update the wall counter display
     */
    updateWallCounter() {
        const counterElement = document.getElementById('wallCounter');
        if (counterElement) {
            counterElement.textContent = I18N.t('walls_counter', { wallCount: this.wallCount, maxWalls: this.maxWalls });
        }
    }

    /**
     * Show a notification message to the user.
     * @param {string} message - The message to display
     * @param {string} [type=''] - Optional modifier: 'neutral' for accent-colored
     *   toast (used for copy feedback), '' for the default error-style toast.
     * @param {number} [durationMs=2000] - How long the notification stays visible.
     *   Hint messages use a longer duration (3500 ms) than action toasts (2000 ms).
     */
    showNotification(message, type = '', durationMs = 2000) {
        const el = document.getElementById('notification');
        if (!el) return;
        el.textContent = message;
        // Reset to base class then apply optional modifier
        el.className = 'notification';
        if (type) el.classList.add(`notification-${type}`);
        el.classList.add('show');

        // Hide notification after the specified duration
        setTimeout(() => {
            el.classList.remove('show');
        }, durationMs);
    }

    /**
     * Save submitted score and wall positions to cookie
     * Cookie name format: submission_YYYY-MM-DD
     * @param {string} dateString - Date of the puzzle
     * @param {number} score - The user's score
     * @param {Array} wallPositions - Array of [row, col] wall positions
     */
    saveSubmission(dateString, score, wallPositions) {
        const cookieName = `submission_${dateString}`;
        const submissionData = {
            __version: CloudMigration.CURRENT_VERSION,
            mapVersion: this._getCurrentMapVersion(),
            score: score,
            walls: wallPositions,
            timestamp: new Date().toISOString(),
            time: this.elapsedSeconds,
            hintsUsed: [...this.hintsUsed],
        };
        CookieUtils.setCookie(cookieName, JSON.stringify(submissionData), 365);

        // Sync to cloud if available
        if (typeof CloudSync !== 'undefined' && CloudSync.isConfigured() && CloudSync.isLoggedIn()) {
            CloudSync.saveSubmission(dateString, submissionData);
        }
    }

    /**
     * Load submitted score data from cookie
     * @param {string} dateString - Date of the puzzle
     * @returns {Object|null} Object with {score, walls, timestamp} or null
     */
    loadSubmission(dateString) {
        const cookieName = `submission_${dateString}`;
        const value = CookieUtils.getCookie(cookieName);
        if (value) {
            try {
                const data = CloudMigration.migrateSubmission(JSON.parse(value));
                // Return null for pre-submission data (hints stored before formal submission)
                if (typeof data.score !== 'number') return null;
                return this._handleMapVersionCheck(dateString, data);
            } catch (e) {
                console.error('Failed to parse submission cookie:', e);
                return null;
            }
        }
        return null;
    }

    /**
     * Check whether saved submission data is compatible with the current map version.
     * If versions match, returns data unchanged.
     * If the user previously achieved a perfect score, migrates the submission to use
     * the current map's optimal solution and goal, keeping the original timestamp.
     * Otherwise, deletes all save data for this date so the user starts fresh.
     * @param {string} dateString - Puzzle date
     * @param {Object} data - Submission data object (already schema-migrated)
     * @returns {Object|null} Migrated data, or null if data was cleared
     */
    _handleMapVersionCheck(dateString, data) {
        const currentVersion = this._getCurrentMapVersion();
        const savedVersion = typeof data.mapVersion === 'number' ? data.mapVersion : 0;

        if (savedVersion === currentVersion) {
            return data;
        }

        // Version mismatch — check if the user previously achieved a perfect score.
        // `>=` is intentional: the issue spec defines perfect as "value greater than or
        // equal to the goal".  A score above the goal can legitimately occur if the map
        // was revised to have a lower goal after the user achieved the previous goal.
        const isPerfect = typeof data.score === 'number' && data.score >= this.goalAreaSize;

        if (isPerfect && this.optimalSolution && this.optimalSolution.length > 0) {
            // Migrate: update walls and score to the current optimal solution.
            // Keep the original submission timestamp so the user's completion time is preserved.
            const migrated = Object.assign({}, data, {
                mapVersion: currentVersion,
                score: this.goalAreaSize,
                walls: this.optimalSolution,
            });
            CookieUtils.setCookie(`submission_${dateString}`, JSON.stringify(migrated), 365);
            if (typeof CloudSync !== 'undefined' && CloudSync.isConfigured() && CloudSync.isLoggedIn()) {
                CloudSync.saveSubmission(dateString, migrated);
            }
            this._clearStaleProgress(dateString);
            return migrated;
        }

        // Not a perfect score (or no optimal solution available) — delete all save data
        // so the user can tackle the updated map fresh.
        this.resetLevelData(dateString);
        return null;
    }

    /**
     * Check if user has submitted score for this puzzle
     * @param {string} dateString - Date of the puzzle
     * @returns {boolean} True if submitted
     */
    hasSubmission(dateString) {
        return this.loadSubmission(dateString) !== null;
    }

    /**
     * Delete saved submission for a specific puzzle
     * @param {string} dateString - Date of the puzzle
     */
    deleteSubmission(dateString) {
        const cookieName = `submission_${dateString}`;
        CookieUtils.deleteCookie(cookieName);
        // Also delete per-level hints data
        CookieUtils.deleteCookie(`hints_${dateString}`);

        // Delete from cloud if available
        if (typeof CloudSync !== 'undefined' && CloudSync.isConfigured() && CloudSync.isLoggedIn()) {
            CloudSync.deleteSubmission(dateString);
        }
    }

    // =====================================================================
    // Hints Methods
    // =====================================================================

    /**
     * Save hints used for a specific puzzle.
     * Stores hints in the submission cookie alongside all other level data.
     * If the level has been formally submitted, also triggers a cloud sync.
     * @param {string} dateString - Date of the puzzle
     */
    saveHintsUsed(dateString) {
        // All level data lives in the submission cookie — read existing data
        const cookieName = `submission_${dateString}`;
        let data = {};
        const existing = CookieUtils.getCookie(cookieName);
        if (existing) {
            try {
                data = CloudMigration.migrateSubmission(JSON.parse(existing));
            } catch { /* ignore malformed cookie */ }
        }

        // Merge hints into the cookie (hints are add-only)
        data.hintsUsed = [...this.hintsUsed];
        if (!data.__version) data.__version = CloudMigration.CURRENT_VERSION;
        CookieUtils.setCookie(cookieName, JSON.stringify(data), 365);

        // Cloud sync if this level is formally submitted (has a score)
        if (typeof data.score === 'number' &&
            typeof CloudSync !== 'undefined' && CloudSync.isConfigured() && CloudSync.isLoggedIn()) {
            CloudSync.saveSubmission(dateString, data);
        }
    }

    /**
     * Load hints used for a specific puzzle.
     * Reads from the submission cookie (primary source).
     * Also merges from the legacy hints_ cookie if present (backward compat).
     * @param {string} dateString - Date of the puzzle
     * @returns {string[]} Array of hint strings used
     */
    loadHintsUsed(dateString) {
        const hintsSet = new Set();

        // Primary source: submission cookie's hintsUsed
        const subCookie = CookieUtils.getCookie(`submission_${dateString}`);
        if (subCookie) {
            try {
                const sub = JSON.parse(subCookie);
                if (Array.isArray(sub.hintsUsed)) {
                    sub.hintsUsed.forEach(h => hintsSet.add(h));
                }
            } catch { /* ignore malformed cookie */ }
        }

        // Backward compat: merge from old hints_ cookie if it still exists
        const legacyHintsCookie = CookieUtils.getCookie(`hints_${dateString}`);
        if (legacyHintsCookie) {
            try {
                JSON.parse(legacyHintsCookie).forEach(h => hintsSet.add(h));
            } catch { /* ignore malformed cookie */ }
        }

        return Array.from(hintsSet);
    }

    /**
     * Update the hint check button visibility and state based on the
     * current level's hints used data, penned status, and hint settings.
     */
    updateHintButton() {
        const hintBtn = document.getElementById('hintCheckBtn');
        if (!hintBtn) return;

        // Hide entirely if hints are disabled or puzzle is submitted
        if (this.hintsDisabled || this.isSubmitted) {
            hintBtn.style.display = 'none';
            this._updateHintUsedDisplay();
            return;
        }

        hintBtn.style.display = '';

        const pathInfo = this.calculatePath();
        const isPenned = !pathInfo.hasPath;
        const hasChecked = this.hintsUsed.includes(CONSTANTS.HINT_CHECKED);
        const hasTarget = this.hintsUsed.includes(CONSTANTS.HINT_TARGET);

        if (hasTarget) {
            // Target already revealed — show disabled button with target score
            hintBtn.disabled = true;
            hintBtn.title = I18N.t('hint_target_revealed_title');
            hintBtn.querySelector('.hint-check-label').textContent = I18N.t('hint_optimal_label', { score: this.goalAreaSize });
        } else if (hasChecked) {
            // Already checked — offer to reveal target (if allowed) or show disabled label
            if (this.neverShowTarget) {
                // Cannot reveal target — show disabled button with optimal/not-optimal text
                hintBtn.disabled = true;
                hintBtn.title = I18N.t('hint_target_disabled_title');
                const areaSize = isPenned ? this.calculateScore() : null;
                const isOptimal = areaSize !== null && areaSize >= this.goalAreaSize;
                hintBtn.querySelector('.hint-check-label').textContent = isOptimal ? I18N.t('hint_optimal') : I18N.t('hint_not_optimal');
            } else {
                // Can reveal target
                hintBtn.disabled = !isPenned;
                hintBtn.title = isPenned ? I18N.t('hint_reveal_title_penned') : I18N.t('hint_reveal_title_not_penned');
                hintBtn.querySelector('.hint-check-label').textContent = I18N.t('hint_reveal_target');
            }
        } else {
            // First time — show "Check if Optimal"
            hintBtn.disabled = !isPenned;
            hintBtn.title = isPenned ? I18N.t('hint_check_title_penned') : I18N.t('hint_check_title_not_penned');
            hintBtn.querySelector('.hint-check-label').textContent = I18N.t('hint_check_label');
        }

        this._updateHintUsedDisplay();
    }

    /**
     * Update the "Hint used" display below the grid.
     * Renders one bullet-point line per hint used.
     */
    _updateHintUsedDisplay() {
        const display = document.getElementById('hintUsedDisplay');
        if (!display) return;

        if (this.hintsUsed.length === 0) {
            display.style.display = 'none';
            display.innerHTML = '';
            return;
        }

        const parts = [];
        if (this.hintsUsed.includes(CONSTANTS.HINT_CHECKED)) parts.push(I18N.t('share_hint_checked'));
        if (this.hintsUsed.includes(CONSTANTS.HINT_TARGET)) parts.push(I18N.t('share_hint_target'));

        const label = document.createElement('span');
        label.className = 'hint-used-label';
        label.textContent = I18N.t('hint_used_heading');

        const list = document.createElement('ul');
        list.className = 'hint-used-list';
        parts.forEach(text => {
            const li = document.createElement('li');
            li.textContent = text;
            list.appendChild(li);
        });

        display.innerHTML = '';
        display.appendChild(label);
        display.appendChild(list);
        display.style.display = '';
    }

    /**
     * Handle the hint check button click.
     * First press: checks if optimal and optionally transitions to reveal state.
     * Second press (if neverShowTarget is false): reveals target score.
     */
    handleHintCheck() {
        const pathInfo = this.calculatePath();
        const isPenned = !pathInfo.hasPath;
        if (!isPenned) return;

        const areaSize = this.calculateScore();
        const isOptimal = areaSize >= this.goalAreaSize;
        const hasChecked = this.hintsUsed.includes(CONSTANTS.HINT_CHECKED);
        const hasTarget = this.hintsUsed.includes(CONSTANTS.HINT_TARGET);

        if (hasTarget) return; // Already at final state

        if (!hasChecked) {
            // First press: check if optimal
            this.hintsUsed.push(CONSTANTS.HINT_CHECKED);
            if (this.currentDate) {
                this.saveHintsUsed(this.currentDate);
            }
            this.updateAreaSizeDisplay();

            const msg = isOptimal
                ? I18N.t('hint_optimal_notification')
                : I18N.t('hint_not_optimal_notification');
            this.showNotification(msg, '', 3500);
        } else if (!this.neverShowTarget) {
            // Second press: reveal target
            this.hintsUsed.push(CONSTANTS.HINT_TARGET);
            if (this.currentDate) {
                this.saveHintsUsed(this.currentDate);
            }
            this.updateAreaSizeDisplay();

            this.showNotification(I18N.t('hint_reveal_notification', { score: this.goalAreaSize }), '', 3500);
        }

        this.updateHintButton();
    }

    // =====================================================================
    // Timer Methods — provided by GameTimerMixin (js/game/GameTimer.js)
    // =====================================================================
    // initTimerForDate, pauseTimer, resumeTimer, lockTimer, resetTimer,
    // updateTimerDisplay, updateTimerButton, _formatTime, _showPauseOverlay,
    // _hidePauseOverlay, _startTimerInterval, _stopTimerInterval,
    // _saveTimerState, _handleVisibilityChange
}

// Apply the GameTimer mixin so all timer methods live on the Game prototype.
// In the browser GameTimer.js is loaded first (see index.html script order).
// In Node.js tests, test/setup.js requires GameTimer.js as global.GameTimerMixin.
if (typeof GameTimerMixin !== 'undefined') {
    Object.assign(Game.prototype, GameTimerMixin);
}
if (typeof GameAnimationsMixin !== 'undefined') {
    Object.assign(Game.prototype, GameAnimationsMixin);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}
