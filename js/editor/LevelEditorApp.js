/* global LevelEditorCore, parseCompactSolution */

class LevelEditorApp {
    constructor() {
        this.gridElement = document.getElementById('grid');
        this.statusElement = document.getElementById('editorStatus');
        this.solutionVisible = false;
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
    }

    _wireUI() {
        const nameInput = document.getElementById('editorLevelName');
        const sizeSelect = document.getElementById('editorMapSize');
        const tileSelect = document.getElementById('editorTileSelector');
        const resetBtn = document.getElementById('editorResetBtn');
        const solveBtn = document.getElementById('editorSolveBtn');
        const toggleSolutionBtn = document.getElementById('editorToggleSolutionBtn');

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
            this.solutionVisible = !this.solutionVisible;
            toggleSolutionBtn.dataset.i18n = this.solutionVisible
                ? 'editor_btn_hide_solution'
                : 'editor_btn_toggle_solution';
            I18N.applyTranslations();
            this.render();
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

        const tileOptions = [
            ...CONSTANTS.LEVEL_EDITOR.TILE_OPTIONS.map((value) => ({
                value,
                key: `editor_tile_${value}`,
            })),
        ];
        tileSelect.innerHTML = '';
        for (const opt of tileOptions) {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = I18N.t(opt.key);
            if (opt.value === this.core.selectedTile) option.selected = true;
            tileSelect.appendChild(option);
        }
    }

    _reloadGridFromCore() {
        this.solutionVisible = false;
        this.grid = new Grid(this.core.size);
        this.grid.loadMap(this.core.map);
        this.grid.saveInitialState();
        this._syncControlsFromState();
        this.render();
        this._renderStatus();
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
        if (this.core.getHomeCount() !== 1) {
            window.alert(`${I18N.t('editor_error_popup_title')}\n\n- ${I18N.t('editor_error_no_home')}`);
            return;
        }

        const payload = this.core.toSolverPayload();
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
            this._renderStatus();
            this._saveDraft();
            return;
        }

        this.core.setSolvedResult(data);
        this._renderStatus();
        this._saveDraft();
    }

    _renderStatus() {
        const toggleSolutionBtn = document.getElementById('editorToggleSolutionBtn');
        if (!this.core.solvedResult) {
            this.statusElement.textContent = I18N.t('editor_status_unsolved');
            toggleSolutionBtn.style.display = 'none';
            return;
        }
        const solved = this.core.solvedResult;
        this.statusElement.innerHTML = `
            <div>${I18N.t('editor_status_ready', { goal: solved.mapData.goal, maxWalls: solved.mapData.maxWalls })}</div>
            <div>${I18N.t('editor_status_code')}</div>
            <pre>${solved.encoded}</pre>
            <div>${I18N.t('editor_status_url')}</div>
            <pre>${solved.playableUrl}</pre>
        `;
        toggleSolutionBtn.style.display = '';
    }

    render() {
        this.gridElement.innerHTML = '';
        this.gridElement.style.gridTemplateColumns = `repeat(${this.grid.size}, 1fr)`;
        const solutionSet = this._getSolutionSet();
        for (let r = 0; r < this.grid.size; r++) {
            for (let c = 0; c < this.grid.size; c++) {
                const tileType = this.grid.getTile(r, c);
                const hasSolutionWall = solutionSet.has(`${r},${c}`);
                const displayTile = hasSolutionWall ? getWallTransform(tileType) : tileType;
                const cell = this._createCellElement(r, c, displayTile, new Set(), new Set(), null);
                this.gridElement.appendChild(cell);
            }
        }
    }

    _getSolutionSet() {
        if (!this.solutionVisible || !this.core.solvedResult || !Array.isArray(this.core.solvedResult.mapData.optimalSolution)) {
            return new Set();
        }
        const pairs = parseCompactSolution(this.core.solvedResult.mapData.optimalSolution);
        return new Set(pairs.map(([r, c]) => `${r},${c}`));
    }

    handleCellClick(row, col) {
        this.core.placeTile(row, col);
        this.grid.setTile(row, col, this.core.selectedTile);
        this.solutionVisible = false;
        this.render();
        this._renderStatus();
        this._saveDraft();
    }

    handleCellKeydown(event, row, col) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.handleCellClick(row, col);
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
