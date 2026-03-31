/* global LevelEditorCore, parseCompactSolution */

class LevelEditorApp {
    constructor() {
        this.gridElement = document.getElementById('grid');
        this.statusElement = document.getElementById('editorStatus');
        this.goalPanelElement = document.getElementById('editorGoalPanel');
        this.solveBtn = null;
        this.toggleSolutionBtn = null;
        this.mode = CONSTANTS.LEVEL_EDITOR.MODE_EDITING;
        this.solveState = CONSTANTS.LEVEL_EDITOR.STATE_UNSOLVED;
        this.statusMessageKey = '';
        this.copyButtonCopied = false;
        this.lastFocusedCell = null;

        const draftRaw = CookieUtils.getCookie(CONSTANTS.LEVEL_EDITOR.AUTOSAVE_COOKIE_KEY);
        this.core = new LevelEditorCore();
        if (draftRaw) {
            try {
                this.core.loadDraft(JSON.parse(draftRaw));
            } catch (error) {
                if (typeof console !== 'undefined' && console.warn) {
                    console.warn('Failed to load level editor draft cookie:', error);
                }
            }
        }

        this.grid = new Grid(this.core.size);
        this.grid.loadMap(this.core.map);
        this.grid.saveInitialState();

        this._wireUI();
        this._syncControlsFromState();
        this.render();
        this._startAutosave();
        this._renderStatus();
        this._syncActionControls();
    }

    _wireUI() {
        const nameInput = document.getElementById('editorLevelName');
        const sizeSelect = document.getElementById('editorMapSize');
        const tileSelect = document.getElementById('editorTileSelector');
        const resetBtn = document.getElementById('editorResetBtn');
        const solveBtn = document.getElementById('editorSolveBtn');
        const toggleSolutionBtn = document.getElementById('editorToggleSolutionBtn');
        this.solveBtn = solveBtn;
        this.toggleSolutionBtn = toggleSolutionBtn;

        nameInput.addEventListener('input', () => {
            this.core.setLevelName(nameInput.value);
            this._renderStatus();
            this._saveDraft();
        });

        sizeSelect.addEventListener('change', () => {
            const confirmed = window.confirm(I18N.t('editor_confirm_resize'));
            if (!confirmed) {
                sizeSelect.value = String(this.core.size);
                return;
            }
            this.core.setMapSize(parseInt(sizeSelect.value, 10));
            this._reloadGridFromCore();
        });

        tileSelect.addEventListener('change', () => {
            this.core.setSelectedTile(tileSelect.value);
            this._saveDraft();
        });

        resetBtn.addEventListener('click', () => {
            const confirmed = window.confirm(I18N.t('editor_confirm_reset'));
            if (!confirmed) return;
            this.core.reset(this.core.size);
            this._reloadGridFromCore();
        });

        solveBtn.addEventListener('click', () => this._solveCurrentMap());

        toggleSolutionBtn.addEventListener('click', () => {
            if (!this.core.solvedResult) return;
            this.mode = this.mode === CONSTANTS.LEVEL_EDITOR.MODE_VIEWING_SOLUTION
                ? CONSTANTS.LEVEL_EDITOR.MODE_EDITING
                : CONSTANTS.LEVEL_EDITOR.MODE_VIEWING_SOLUTION;
            toggleSolutionBtn.dataset.i18n = this.mode === CONSTANTS.LEVEL_EDITOR.MODE_VIEWING_SOLUTION
                ? 'editor_btn_hide_solution'
                : 'editor_btn_toggle_solution';
            I18N.applyTranslations();
            this.render();
            this._syncActionControls();
        });
    }

    _syncControlsFromState() {
        const nameInput = document.getElementById('editorLevelName');
        const sizeSelect = document.getElementById('editorMapSize');
        const tileSelect = document.getElementById('editorTileSelector');

        nameInput.value = this.core.levelName || '';

        sizeSelect.innerHTML = '';
        for (let size = CONSTANTS.MIN_GRID_SIZE; size <= CONSTANTS.MAX_GRID_SIZE; size++) {
            const option = document.createElement('option');
            option.value = String(size);
            option.textContent = `${size}×${size}`;
            if (size === this.core.size) option.selected = true;
            sizeSelect.appendChild(option);
        }

        tileSelect.innerHTML = '';
        for (const value of LevelEditorCore.EDITABLE_TILE_OPTIONS) {
            const tileData = TILE_DATA[value];
            if (!tileData || !tileData.nameKey) continue;
            const option = document.createElement('option');
            option.value = value;
            option.textContent = I18N.t(tileData.nameKey);
            if (value === this.core.selectedTile) option.selected = true;
            tileSelect.appendChild(option);
        }
    }

    _reloadGridFromCore() {
        this.mode = CONSTANTS.LEVEL_EDITOR.MODE_EDITING;
        this.solveState = this.core.solvedResult
            ? CONSTANTS.LEVEL_EDITOR.STATE_SOLVED
            : CONSTANTS.LEVEL_EDITOR.STATE_UNSOLVED;
        this.grid = new Grid(this.core.size);
        this.grid.loadMap(this.core.map);
        this.grid.saveInitialState();
        this._syncControlsFromState();
        this.render();
        this._renderStatus();
        this._syncActionControls();
        this._saveDraft();
    }

    _saveDraft() {
        CookieUtils.setCookie(
            CONSTANTS.LEVEL_EDITOR.AUTOSAVE_COOKIE_KEY,
            JSON.stringify(this.core.toDraft()),
            CONSTANTS.LEVEL_EDITOR.AUTOSAVE_COOKIE_DAYS
        );
    }

    _startAutosave() {
        this._autosaveTimer = setInterval(() => this._saveDraft(), CONSTANTS.LEVEL_EDITOR.AUTOSAVE_INTERVAL_MS);
    }

    async _solveCurrentMap() {
        if (this.solveState === CONSTANTS.LEVEL_EDITOR.STATE_SOLVING) return;
        if (this.core.getHomeCount() !== 1) {
            window.alert(`${I18N.t('editor_error_popup_title')}\n\n- ${I18N.t('editor_error_no_home')}`);
            return;
        }
        this.mode = CONSTANTS.LEVEL_EDITOR.MODE_EDITING;
        this.solveState = CONSTANTS.LEVEL_EDITOR.STATE_SOLVING;
        this.statusMessageKey = 'editor_status_solving';
        this.copyButtonCopied = false;
        this._syncActionControls();
        this._renderStatus();

        const payload = this.core.toSolverPayload();
        try {
            const res = await fetch('/api/solve-level', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                const errors = (data.validationErrors && data.validationErrors.length > 0)
                    ? data.validationErrors
                    : [data.error || I18N.t('url_param_error', { param: 'map' })];
                window.alert(`${I18N.t('editor_error_popup_title')}\n\n${errors.map((e) => `- ${e}`).join('\n')}`);
                this.core.invalidateSolvedState();
                this.solveState = CONSTANTS.LEVEL_EDITOR.STATE_UNSOLVED;
                this.statusMessageKey = '';
                this._renderStatus();
                this._syncActionControls();
                this._saveDraft();
                return;
            }

            this.core.setSolvedResult(data);
            this.solveState = CONSTANTS.LEVEL_EDITOR.STATE_SOLVED;
            this.statusMessageKey = '';
            this.copyButtonCopied = false;
            this._renderStatus();
            this._syncActionControls();
            this._saveDraft();
        } catch {
            this.core.invalidateSolvedState();
            this.solveState = CONSTANTS.LEVEL_EDITOR.STATE_UNSOLVED;
            this.statusMessageKey = '';
            this._renderStatus();
            this._syncActionControls();
            this._saveDraft();
        }
    }

    _renderStatus() {
        if (this.statusMessageKey) {
            this.statusElement.textContent = I18N.t(this.statusMessageKey);
            return;
        }
        if (!this.core.solvedResult) {
            this.statusElement.textContent = I18N.t('editor_status_unsolved');
            return;
        }
        const solved = this.core.solvedResult;
        this.statusElement.innerHTML = `
            <div>${I18N.t('editor_status_code')}</div>
            <pre>${solved.encoded}</pre>
            <div class="editor-status-actions">
                <button type="button" id="editorCopyUrlBtn" data-i18n="editor_btn_copy_url"></button>
                <button type="button" id="editorPlayMapBtn" data-i18n="editor_btn_play_map"></button>
            </div>
        `;
        I18N.applyTranslations();
        const copyBtn = document.getElementById('editorCopyUrlBtn');
        const playBtn = document.getElementById('editorPlayMapBtn');
        if (copyBtn) {
            if (this.copyButtonCopied) {
                copyBtn.textContent = I18N.t('editor_btn_copied');
                copyBtn.classList.add('copied');
            }
            copyBtn.addEventListener('click', () => this._copyPlayableUrl(solved.playableUrl));
        }
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                window.open(solved.playableUrl, '_blank', 'noopener,noreferrer');
            });
        }
    }

    render() {
        this.gridElement.innerHTML = '';
        this.gridElement.style.gridTemplateColumns = `repeat(${this.grid.size}, 1fr)`;
        const solution = this._getSolutionSet();
        const solutionSet = solution.walls;
        const pennedSet = solution.penned;
        for (let r = 0; r < this.grid.size; r++) {
            for (let c = 0; c < this.grid.size; c++) {
                const tileType = this.grid.getTile(r, c);
                const hasSolutionWall = solutionSet.has(`${r},${c}`);
                const displayTile = hasSolutionWall ? getWallTransform(tileType) : tileType;
                const cell = this._createCellElement(r, c, displayTile, new Set(), pennedSet, null);
                this.gridElement.appendChild(cell);
            }
        }
    }

    _getSolutionSet() {
        if (this.mode !== CONSTANTS.LEVEL_EDITOR.MODE_VIEWING_SOLUTION
            || !this.core.solvedResult
            || !Array.isArray(this.core.solvedResult.mapData.optimalSolution)) {
            return { walls: new Set(), penned: new Set() };
        }
        const pairs = parseCompactSolution(this.core.solvedResult.mapData.optimalSolution);
        const walls = new Set(pairs.map(([r, c]) => `${r},${c}`));
        const pennedPairs = PathfindingUtils.getPennedTiles(this.core.map, walls);
        return {
            walls,
            penned: new Set(pennedPairs.map(([r, c]) => `${r},${c}`)),
        };
    }

    handleCellClick(event, row, col) {
        if (this.mode === CONSTANTS.LEVEL_EDITOR.MODE_VIEWING_SOLUTION) {
            window.alert(I18N.t('editor_status_edit_locked'));
            return;
        }
        if (event && (event.shiftKey || event.ctrlKey || event.metaKey)) {
            this.handleCellErase(row, col);
            return;
        }
        this.core.placeTile(row, col);
        this.grid.loadMap(this.core.map);
        this.solveState = CONSTANTS.LEVEL_EDITOR.STATE_UNSOLVED;
        this.statusMessageKey = '';
        this.copyButtonCopied = false;
        this.render();
        this._renderStatus();
        this._syncActionControls();
        this._saveDraft();
    }

    handleCellContextMenu(event, row, col) {
        event.preventDefault();
        if (this.mode === CONSTANTS.LEVEL_EDITOR.MODE_VIEWING_SOLUTION) {
            window.alert(I18N.t('editor_status_edit_locked'));
            return;
        }
        this.handleCellErase(row, col);
    }

    handleCellErase(row, col) {
        this.core.eraseTile(row, col);
        this.grid.loadMap(this.core.map);
        this.solveState = CONSTANTS.LEVEL_EDITOR.STATE_UNSOLVED;
        this.statusMessageKey = '';
        this.copyButtonCopied = false;
        this.render();
        this._renderStatus();
        this._syncActionControls();
        this._saveDraft();
    }

    handleCellKeydown(event, row, col) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.handleCellClick(event, row, col);
        }
    }

    _syncActionControls() {
        const solving = this.solveState === CONSTANTS.LEVEL_EDITOR.STATE_SOLVING;
        this.solveBtn.disabled = solving;
        this.toggleSolutionBtn.style.display = this.solveState === CONSTANTS.LEVEL_EDITOR.STATE_SOLVED ? '' : 'none';
        this.toggleSolutionBtn.dataset.i18n = this.mode === CONSTANTS.LEVEL_EDITOR.MODE_VIEWING_SOLUTION
            ? 'editor_btn_hide_solution'
            : 'editor_btn_toggle_solution';
        if (this.solveState === CONSTANTS.LEVEL_EDITOR.STATE_SOLVED && this.core.solvedResult) {
            this.goalPanelElement.style.display = '';
            this.goalPanelElement.textContent = I18N.t('editor_goal_panel', {
                goal: this.core.solvedResult.mapData.goal,
                maxWalls: this.core.solvedResult.mapData.maxWalls,
            });
        } else {
            this.goalPanelElement.style.display = 'none';
            this.goalPanelElement.textContent = '';
        }
        I18N.applyTranslations();
    }

    async _copyPlayableUrl(url) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(url);
                this.copyButtonCopied = true;
                this._renderStatus();
                setTimeout(() => {
                    if (this.copyButtonCopied) {
                        this.copyButtonCopied = false;
                        this._renderStatus();
                    }
                }, 2000);
            }
        } catch {
            this.copyButtonCopied = false;
            window.alert(I18N.t('editor_status_copy_failed'));
        }
    }
}

Object.assign(LevelEditorApp.prototype, GameAnimationsMixin);

window.addEventListener('DOMContentLoaded', () => {
    I18N.loadFromCookie();
    I18N.applyTranslations();
    document.title = I18N.t('editor_page_title');
    window.levelEditorApp = new LevelEditorApp();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LevelEditorApp;
}
