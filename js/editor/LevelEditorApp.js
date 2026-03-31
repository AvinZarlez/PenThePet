/* global LevelEditorCore, parseCompactMap, parseCompactSolution */

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

        // Level loader state
        this._loaderMapsDatabase = null;
        this._loaderCalendarMonth = null;
        this._loaderLoadedYears = new Set();

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
        const loadBtn = document.getElementById('editorLoadBtn');
        const solveBtn = document.getElementById('editorSolveBtn');
        const toggleSolutionBtn = document.getElementById('editorToggleSolutionBtn');
        this.solveBtn = solveBtn;
        this.toggleSolutionBtn = toggleSolutionBtn;

        if (loadBtn) {
            loadBtn.addEventListener('click', () => this.openLoadModal());
        }

        // Level loader modal wiring
        const loadModal = document.getElementById('editorLoadModal');
        const loadModalClose = document.getElementById('editorLoadModalClose');
        const loadCodeBtn = document.getElementById('editorLoadCodeBtn');
        const loadCodeInput = document.getElementById('editorLoadCodeInput');

        if (loadModalClose) {
            loadModalClose.addEventListener('click', () => this.closeLoadModal());
        }
        if (loadModal) {
            loadModal.addEventListener('click', (e) => {
                if (e.target === loadModal) this.closeLoadModal();
            });
        }
        if (loadCodeBtn && loadCodeInput) {
            loadCodeBtn.addEventListener('click', () => this._loadLevelFromCode(loadCodeInput.value.trim()));
            loadCodeInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this._loadLevelFromCode(loadCodeInput.value.trim());
            });
        }

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
                copyBtn.textContent = I18N.t('copied_success');
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

    // ── Level Loader ──────────────────────────────────────────────────────────

    openLoadModal() {
        const modal = document.getElementById('editorLoadModal');
        if (!modal) return;
        const codeInput = document.getElementById('editorLoadCodeInput');
        if (codeInput) codeInput.value = '';
        modal.classList.add('show');
        I18N.applyTranslations();
        this._populateLevelList();
    }

    closeLoadModal() {
        const modal = document.getElementById('editorLoadModal');
        if (modal) modal.classList.remove('show');
    }

    _loadLevelFromCode(code) {
        if (!code) return;
        const mapData = MapURLCodec.decodeMapData(code);
        if (!mapData) {
            window.alert(I18N.t('editor_load_invalid_code'));
            return;
        }
        this._applyMapData(mapData);
    }

    _applyMapData(mapData) {
        const confirmed = window.confirm(I18N.t('editor_load_confirm'));
        if (!confirmed) return;
        const map2d = parseCompactMap(mapData.map, mapData.size);
        this.core.loadFromMapData({
            map: map2d,
            size: mapData.size,
            levelName: mapData.mapName || '',
        });
        this.closeLoadModal();
        this._reloadGridFromCore();
    }

    async _loadLoaderMapsDatabase() {
        if (this._loaderMapsDatabase) return;
        this._loaderMapsDatabase = {};
        const currentYear = new Date().getFullYear();
        await Promise.all([
            this._loadLoaderYearIfNeeded(currentYear),
            this._loadLoaderYearIfNeeded(currentYear - 1),
        ]);
    }

    async _loadLoaderYearIfNeeded(year) {
        if (this._loaderLoadedYears.has(year)) return;
        this._loaderLoadedYears.add(year);
        try {
            const res = await fetch(`../maps/${year}.json`);
            if (!res.ok) return;
            const data = await res.json();
            if (!this._loaderMapsDatabase) this._loaderMapsDatabase = {};
            Object.assign(this._loaderMapsDatabase, data);
        } catch {
            // Year file may not exist; silently ignore
        }
    }

    async _populateLevelList() {
        const levelList = document.getElementById('editorLoadLevelList');
        if (!levelList) return;

        levelList.innerHTML = `<div class="level-list-loading">${I18N.t('editor_load_browse_loading')}</div>`;

        if (!this._loaderMapsDatabase) {
            await this._loadLoaderMapsDatabase();
        }

        if (!this._loaderMapsDatabase || Object.keys(this._loaderMapsDatabase).length === 0) {
            levelList.innerHTML = '';
            return;
        }

        levelList.innerHTML = '';

        const allDates = Object.keys(this._loaderMapsDatabase).sort().reverse();
        const monthGroups = {};
        allDates.forEach(date => {
            const month = date.substring(0, 7);
            if (!monthGroups[month]) monthGroups[month] = [];
            monthGroups[month].push(date);
        });

        const sortedMonths = Object.keys(monthGroups).sort();

        if (!this._loaderCalendarMonth || !monthGroups[this._loaderCalendarMonth]) {
            this._loaderCalendarMonth = sortedMonths[sortedMonths.length - 1];
        }

        // Navigation bar
        const nav = document.createElement('div');
        nav.className = 'calendar-nav';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'calendar-nav-btn';
        prevBtn.textContent = I18N.t('calendar_prev');
        prevBtn.setAttribute('aria-label', I18N.t('calendar_prev_aria'));

        const monthLabel = document.createElement('span');
        monthLabel.className = 'calendar-month-label';

        const nextBtn = document.createElement('button');
        nextBtn.className = 'calendar-nav-btn';
        nextBtn.textContent = I18N.t('calendar_next');
        nextBtn.setAttribute('aria-label', I18N.t('calendar_next_aria'));

        nav.appendChild(prevBtn);
        nav.appendChild(monthLabel);
        nav.appendChild(nextBtn);
        levelList.appendChild(nav);

        const calendarContainer = document.createElement('div');
        calendarContainer.className = 'calendar-container';
        levelList.appendChild(calendarContainer);

        const renderMonth = (yearMonth) => {
            this._loaderCalendarMonth = yearMonth;
            const currentMonthIdx = sortedMonths.indexOf(yearMonth);
            const [year, month] = yearMonth.split('-');
            const labelDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            monthLabel.textContent = labelDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            prevBtn.disabled = currentMonthIdx === 0;
            nextBtn.disabled = currentMonthIdx === sortedMonths.length - 1;
            calendarContainer.innerHTML = '';
            this._renderLoaderCalendarGrid(calendarContainer, yearMonth, monthGroups[yearMonth] || []);
        };

        prevBtn.addEventListener('click', async () => {
            const idx = sortedMonths.indexOf(this._loaderCalendarMonth);
            if (idx > 0) {
                renderMonth(sortedMonths[idx - 1]);
            } else {
                const prevYear = parseInt(sortedMonths[0].substring(0, 4)) - 1;
                if (prevYear >= CONSTANTS.FIRST_MAP_YEAR) {
                    const before = Object.keys(this._loaderMapsDatabase).length;
                    await this._loadLoaderYearIfNeeded(prevYear);
                    if (Object.keys(this._loaderMapsDatabase).length > before) {
                        this._loaderCalendarMonth = `${prevYear}-12`;
                        this._populateLevelList();
                    }
                }
            }
        });

        nextBtn.addEventListener('click', async () => {
            const idx = sortedMonths.indexOf(this._loaderCalendarMonth);
            if (idx < sortedMonths.length - 1) {
                renderMonth(sortedMonths[idx + 1]);
            } else {
                const nextYear = parseInt(sortedMonths[sortedMonths.length - 1].substring(0, 4)) + 1;
                const maxYear = new Date().getFullYear() + 1;
                if (nextYear <= maxYear) {
                    const before = Object.keys(this._loaderMapsDatabase).length;
                    await this._loadLoaderYearIfNeeded(nextYear);
                    if (Object.keys(this._loaderMapsDatabase).length > before) {
                        this._loaderCalendarMonth = `${nextYear}-01`;
                        this._populateLevelList();
                    }
                }
            }
        });

        renderMonth(this._loaderCalendarMonth);
    }

    _renderLoaderCalendarGrid(container, yearMonth, datesInMonth) {
        const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const [year, month] = yearMonth.split('-').map(Number);
        const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
        const daysInMonth = new Date(year, month, 0).getDate();

        const dateLookup = {};
        datesInMonth.forEach(date => {
            const day = parseInt(date.split('-')[2]);
            dateLookup[day] = date;
        });

        const grid = document.createElement('div');
        grid.className = 'calendar-grid';

        DAY_HEADERS.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = day;
            grid.appendChild(header);
        });

        for (let i = 0; i < firstDayOfWeek; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day calendar-day-empty';
            grid.appendChild(empty);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            const date = dateLookup[day];

            if (date) {
                const mapData = this._loaderMapsDatabase[date];
                cell.className = 'calendar-day calendar-day-level';
                const sizeLabel = I18N.t('editor_load_level_size', { size: mapData.size });
                cell.innerHTML = `
                    <span class="calendar-day-num">${day}</span>
                    <span class="calendar-level-num">${I18N.t('calendar_day_label', { dayNumber: mapData.dayNumber })}</span>
                    <span class="calendar-level-name">${mapData.mapName}</span>
                    <span class="calendar-level-size">${sizeLabel}</span>
                `;
                cell.addEventListener('click', () => this._applyMapData(mapData));
            } else {
                cell.className = 'calendar-day';
                cell.innerHTML = `<span class="calendar-day-num">${day}</span>`;
            }

            grid.appendChild(cell);
        }

        container.appendChild(grid);
    }
}

Object.assign(LevelEditorApp.prototype, GameAnimationsMixin);

window.addEventListener('DOMContentLoaded', () => {
    I18N.loadFromCookie();
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
            I18N.setLanguage(langSelector.value);
            window.location.reload();
        });
    }
    const githubFooterLink = document.getElementById('githubFooterLink');
    if (githubFooterLink && typeof CONSTANTS !== 'undefined' && CONSTANTS.REPO_URL) {
        githubFooterLink.href = CONSTANTS.REPO_URL;
    }
    I18N.applyTranslations();
    document.title = I18N.t('editor_page_title');
    window.levelEditorApp = new LevelEditorApp();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LevelEditorApp;
}
