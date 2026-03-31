describe('LevelEditorApp', () => {
    let originalSetInterval;
    let app;
    let LevelEditorApp;

    beforeEach(() => {
        document.body.innerHTML = `
            <input id="editorLevelName" />
            <select id="editorMapSize"></select>
            <select id="editorTileSelector"></select>
            <button id="editorResetBtn"></button>
            <button id="editorSolveBtn"></button>
            <button id="editorToggleSolutionBtn"></button>
            <div id="editorGoalPanel"></div>
            <div id="editorStatus"></div>
            <div id="grid"></div>
        `;

        jest.spyOn(CookieUtils, 'getCookie').mockReturnValue('');
        originalSetInterval = global.setInterval;
        global.setInterval = jest.fn(() => 1);
        window.alert = jest.fn();
        window.open = jest.fn();
        global.fetch = jest.fn();
        global.navigator.clipboard = { writeText: jest.fn().mockResolvedValue(undefined) };
        global.LevelEditorCore = require('../../../js/editor/LevelEditorCore.js');
        LevelEditorApp = require('../../../js/editor/LevelEditorApp.js');
        app = new LevelEditorApp();
    });

    afterEach(() => {
        global.setInterval = originalSetInterval;
        jest.restoreAllMocks();
    });

    test('locks editing while viewing solution', () => {
        app.core.setSolvedResult({
            mapData: { goal: 12, maxWalls: 6, optimalSolution: [0, 0] },
            encoded: 'abc',
            playableUrl: 'https://example.com',
        });
        app.solveState = CONSTANTS.LEVEL_EDITOR.STATE_SOLVED;
        app.mode = CONSTANTS.LEVEL_EDITOR.MODE_VIEWING_SOLUTION;
        app._syncActionControls();
        app.handleCellClick({ shiftKey: false, ctrlKey: false, metaKey: false }, 0, 0);
        expect(window.alert).toHaveBeenCalledWith(I18N.t('editor_status_edit_locked'));
    });

    test('shift/ctrl/meta click erases tile to grass', () => {
        app.core.setSelectedTile('water');
        app.handleCellClick({ shiftKey: false, ctrlKey: false, metaKey: false }, 0, 0);
        expect(app.core.map[0][0]).toBe('water');
        app.handleCellClick({ shiftKey: true, ctrlKey: false, metaKey: false }, 0, 0);
        expect(app.core.map[0][0]).toBe('grass');
    });

    test('solve button disables during solve and re-enables on failure', async () => {
        app.core.setSelectedTile('home');
        app.handleCellClick({ shiftKey: false, ctrlKey: false, metaKey: false }, 0, 0);
        global.fetch.mockResolvedValue({
            ok: false,
            json: async () => ({ ok: false, error: 'bad map', validationErrors: [] }),
        });

        await app._solveCurrentMap();

        expect(app.solveBtn.disabled).toBe(false);
        expect(app.solveState).toBe(CONSTANTS.LEVEL_EDITOR.STATE_UNSOLVED);
    });

    test('copy url only changes copy button text', async () => {
        app.core.setSolvedResult({
            mapData: { goal: 12, maxWalls: 6, optimalSolution: [0, 0] },
            encoded: 'abc',
            playableUrl: 'https://example.com',
        });
        app.solveState = CONSTANTS.LEVEL_EDITOR.STATE_SOLVED;
        app._renderStatus();

        const beforeStatusText = app.statusElement.textContent;
        await app._copyPlayableUrl('https://example.com');
        const copyBtn = document.getElementById('editorCopyUrlBtn');
        expect(copyBtn.textContent).toBe(I18N.t('copied_success'));
        expect(app.statusMessageKey).toBe('');
        expect(beforeStatusText).toContain(I18N.t('editor_status_code'));
        expect(app.statusElement.textContent).toContain(I18N.t('editor_status_code'));
    });

    test('viewing solution keeps board visible with wall overlays', () => {
        app.core.setSolvedResult({
            mapData: { goal: 12, maxWalls: 6, optimalSolution: [0, 0, 0, 1] },
            encoded: 'abc',
            playableUrl: 'https://example.com',
        });
        app.solveState = CONSTANTS.LEVEL_EDITOR.STATE_SOLVED;
        app.mode = CONSTANTS.LEVEL_EDITOR.MODE_VIEWING_SOLUTION;
        app.render();
        expect(app.gridElement.children.length).toBe(app.grid.size * app.grid.size);
    });

    test('toggle solution button switches between editing and viewing solution modes', () => {
        app.core.setSolvedResult({
            mapData: { goal: 12, maxWalls: 6, optimalSolution: [0, 0] },
            encoded: 'abc',
            playableUrl: 'https://example.com',
        });
        app.solveState = CONSTANTS.LEVEL_EDITOR.STATE_SOLVED;
        app._syncActionControls();

        app.toggleSolutionBtn.click();
        expect(app.mode).toBe(CONSTANTS.LEVEL_EDITOR.MODE_VIEWING_SOLUTION);
        expect(app.toggleSolutionBtn.dataset.i18n).toBe('editor_btn_hide_solution');

        app.toggleSolutionBtn.click();
        expect(app.mode).toBe(CONSTANTS.LEVEL_EDITOR.MODE_EDITING);
        expect(app.toggleSolutionBtn.dataset.i18n).toBe('editor_btn_toggle_solution');
    });

    test('goal panel renders with solved map metadata and hides when unsolved', () => {
        app.core.setSolvedResult({
            mapData: { goal: 22, maxWalls: 6, optimalSolution: [0, 0] },
            encoded: 'abc',
            playableUrl: 'https://example.com',
        });
        app.solveState = CONSTANTS.LEVEL_EDITOR.STATE_SOLVED;
        app._syncActionControls();
        expect(app.goalPanelElement.style.display).toBe('');
        expect(app.goalPanelElement.textContent).toContain('22');
        expect(app.goalPanelElement.textContent).toContain('6');

        app.solveState = CONSTANTS.LEVEL_EDITOR.STATE_UNSOLVED;
        app._syncActionControls();
        expect(app.goalPanelElement.style.display).toBe('none');
    });

    test('play button opens playable URL in a new tab with noopener,noreferrer', () => {
        app.core.setSolvedResult({
            mapData: { goal: 12, maxWalls: 6, optimalSolution: [0, 0] },
            encoded: 'abc',
            playableUrl: 'https://example.com/map',
        });
        app.solveState = CONSTANTS.LEVEL_EDITOR.STATE_SOLVED;
        app._renderStatus();

        document.getElementById('editorPlayMapBtn').click();
        expect(window.open).toHaveBeenCalledWith('https://example.com/map', '_blank', 'noopener,noreferrer');
    });

    test('solve button remains disabled while solve is in progress', async () => {
        app.core.setSelectedTile('home');
        app.handleCellClick({ shiftKey: false, ctrlKey: false, metaKey: false }, 0, 0);
        let releaseFetch;
        global.fetch.mockImplementation(() => new Promise((resolve) => {
            releaseFetch = resolve;
        }));

        const solvePromise = app._solveCurrentMap();
        expect(app.solveBtn.disabled).toBe(true);

        releaseFetch({
            ok: true,
            json: async () => ({
                ok: true,
                mapData: { goal: 10, maxWalls: 5, optimalSolution: [0, 0] },
                encoded: 'abc',
                playableUrl: 'https://example.com',
            }),
        });
        await solvePromise;
        expect(app.solveBtn.disabled).toBe(false);
    });

    test('constructor loads a valid draft from cookie', () => {
        const LevelEditorCore = require('../../../js/editor/LevelEditorCore.js');
        const core = new LevelEditorCore({ size: 9 });
        core.setLevelName('Draft Level');
        core.setSelectedTile('star');
        const draft = core.toDraft();
        jest.spyOn(CookieUtils, 'getCookie').mockReturnValue(JSON.stringify(draft));
        const appWithDraft = new LevelEditorApp();
        expect(appWithDraft.core.levelName).toBe('Draft Level');
        expect(appWithDraft.core.selectedTile).toBe('star');
    });

    test('constructor handles invalid draft JSON in cookie gracefully', () => {
        jest.spyOn(CookieUtils, 'getCookie').mockReturnValue('{{invalid json}}');
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        expect(() => new LevelEditorApp()).not.toThrow();
        warnSpy.mockRestore();
    });

    test('name input change updates level name', () => {
        const nameInput = document.getElementById('editorLevelName');
        nameInput.value = 'My Test Level';
        nameInput.dispatchEvent(new Event('input'));
        expect(app.core.levelName).toBe('My Test Level');
    });

    test('size select change triggers confirmed resize', () => {
        window.confirm = jest.fn().mockReturnValue(true);
        const sizeSelect = document.getElementById('editorMapSize');
        const newSize = app.core.size === CONSTANTS.MIN_GRID_SIZE
            ? CONSTANTS.MIN_GRID_SIZE + 2
            : CONSTANTS.MIN_GRID_SIZE;
        sizeSelect.value = String(newSize);
        sizeSelect.dispatchEvent(new Event('change'));
        expect(window.confirm).toHaveBeenCalled();
        expect(app.core.size).toBe(newSize);
    });

    test('size select change cancelled leaves size unchanged', () => {
        window.confirm = jest.fn().mockReturnValue(false);
        const originalSize = app.core.size;
        const sizeSelect = document.getElementById('editorMapSize');
        sizeSelect.value = String(originalSize + 2);
        sizeSelect.dispatchEvent(new Event('change'));
        expect(window.confirm).toHaveBeenCalled();
        expect(app.core.size).toBe(originalSize);
        expect(sizeSelect.value).toBe(String(originalSize));
    });

    test('tile select change updates selected tile', () => {
        const tileSelect = document.getElementById('editorTileSelector');
        tileSelect.value = 'star';
        tileSelect.dispatchEvent(new Event('change'));
        expect(app.core.selectedTile).toBe('star');
    });

    test('reset button confirmed resets map', () => {
        window.confirm = jest.fn().mockReturnValue(true);
        app.core.setSelectedTile('water');
        app.handleCellClick({ shiftKey: false, ctrlKey: false, metaKey: false }, 0, 0);
        expect(app.core.map[0][0]).toBe('water');
        document.getElementById('editorResetBtn').click();
        expect(window.confirm).toHaveBeenCalled();
        expect(app.core.map[0][0]).toBe('grass');
    });

    test('reset button cancelled leaves map unchanged', () => {
        window.confirm = jest.fn().mockReturnValue(false);
        app.core.setSelectedTile('water');
        app.handleCellClick({ shiftKey: false, ctrlKey: false, metaKey: false }, 0, 0);
        expect(app.core.map[0][0]).toBe('water');
        document.getElementById('editorResetBtn').click();
        expect(window.confirm).toHaveBeenCalled();
        expect(app.core.map[0][0]).toBe('water');
    });

    test('_solveCurrentMap alerts when no home tile placed', async () => {
        await app._solveCurrentMap();
        expect(window.alert).toHaveBeenCalledWith(
            expect.stringContaining(I18N.t('editor_error_no_home'))
        );
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('_solveCurrentMap shows validation errors from server response', async () => {
        app.core.setSelectedTile('home');
        app.handleCellClick({ shiftKey: false, ctrlKey: false, metaKey: false }, 0, 0);
        global.fetch.mockResolvedValue({
            ok: false,
            json: async () => ({
                ok: false,
                error: 'validation failed',
                validationErrors: ['Map has no star tiles', 'Map has no bee tiles'],
            }),
        });

        await app._solveCurrentMap();

        expect(window.alert).toHaveBeenCalledWith(
            expect.stringContaining('Map has no star tiles')
        );
        expect(app.solveState).toBe(CONSTANTS.LEVEL_EDITOR.STATE_UNSOLVED);
    });

    test('_solveCurrentMap handles network error (fetch throws)', async () => {
        app.core.setSelectedTile('home');
        app.handleCellClick({ shiftKey: false, ctrlKey: false, metaKey: false }, 0, 0);
        global.fetch.mockRejectedValue(new Error('Network error'));

        await app._solveCurrentMap();

        expect(app.solveState).toBe(CONSTANTS.LEVEL_EDITOR.STATE_UNSOLVED);
        expect(app.statusMessageKey).toBe('');
    });

    test('_solveCurrentMap skips when already solving', async () => {
        app.core.setSelectedTile('home');
        app.handleCellClick({ shiftKey: false, ctrlKey: false, metaKey: false }, 0, 0);
        app.solveState = CONSTANTS.LEVEL_EDITOR.STATE_SOLVING;
        await app._solveCurrentMap();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('handleCellContextMenu erases tile in edit mode', () => {
        app.core.setSelectedTile('water');
        app.handleCellClick({ shiftKey: false, ctrlKey: false, metaKey: false }, 1, 1);
        expect(app.core.map[1][1]).toBe('water');
        const event = { preventDefault: jest.fn() };
        app.handleCellContextMenu(event, 1, 1);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(app.core.map[1][1]).toBe('grass');
    });

    test('handleCellContextMenu alerts when in view solution mode', () => {
        app.core.setSolvedResult({
            mapData: { goal: 12, maxWalls: 6, optimalSolution: [0, 0] },
            encoded: 'abc',
            playableUrl: 'https://example.com',
        });
        app.solveState = CONSTANTS.LEVEL_EDITOR.STATE_SOLVED;
        app.mode = CONSTANTS.LEVEL_EDITOR.MODE_VIEWING_SOLUTION;
        const event = { preventDefault: jest.fn() };
        app.handleCellContextMenu(event, 0, 0);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith(I18N.t('editor_status_edit_locked'));
    });

    test('handleCellKeydown Enter triggers cell click', () => {
        const clickSpy = jest.spyOn(app, 'handleCellClick');
        app.handleCellKeydown({ key: 'Enter', preventDefault: jest.fn() }, 2, 3);
        expect(clickSpy).toHaveBeenCalledWith(expect.objectContaining({ key: 'Enter' }), 2, 3);
    });

    test('handleCellKeydown non-Enter key does nothing', () => {
        const clickSpy = jest.spyOn(app, 'handleCellClick');
        app.handleCellKeydown({ key: 'Tab', preventDefault: jest.fn() }, 2, 3);
        expect(clickSpy).not.toHaveBeenCalled();
    });

    test('handleCellErase resets tile to grass and invalidates solve state', () => {
        app.core.setSelectedTile('star');
        app.handleCellClick({ shiftKey: false, ctrlKey: false, metaKey: false }, 3, 3);
        expect(app.core.map[3][3]).toBe('star');
        app.handleCellErase(3, 3);
        expect(app.core.map[3][3]).toBe('grass');
        expect(app.solveState).toBe(CONSTANTS.LEVEL_EDITOR.STATE_UNSOLVED);
    });

    test('_syncActionControls disables solve button when solving', () => {
        app.core.setSelectedTile('home');
        app.handleCellClick({ shiftKey: false, ctrlKey: false, metaKey: false }, 0, 0);
        app.solveState = CONSTANTS.LEVEL_EDITOR.STATE_SOLVING;
        app._syncActionControls();
        expect(app.solveBtn.disabled).toBe(true);
    });

    test('_syncActionControls hides toggle button when unsolved', () => {
        app.solveState = CONSTANTS.LEVEL_EDITOR.STATE_UNSOLVED;
        app._syncActionControls();
        expect(app.toggleSolutionBtn.style.display).toBe('none');
    });

    test('_renderStatus shows solving status message when solving', () => {
        app.statusMessageKey = 'editor_status_solving';
        app._renderStatus();
        expect(app.statusElement.textContent).toBe(I18N.t('editor_status_solving'));
    });

    test('_renderStatus shows unsolved text when no solved result', () => {
        app.statusMessageKey = '';
        app.core.invalidateSolvedState();
        app._renderStatus();
        expect(app.statusElement.textContent).toBe(I18N.t('editor_status_unsolved'));
    });

    test('_renderStatus shows copied state on copy button when copyButtonCopied is true', () => {
        app.core.setSolvedResult({
            mapData: { goal: 12, maxWalls: 6, optimalSolution: [0, 0] },
            encoded: 'abc',
            playableUrl: 'https://example.com',
        });
        app.solveState = CONSTANTS.LEVEL_EDITOR.STATE_SOLVED;
        app.copyButtonCopied = true;
        app._renderStatus();
        const copyBtn = document.getElementById('editorCopyUrlBtn');
        expect(copyBtn.textContent).toBe(I18N.t('copied_success'));
        expect(copyBtn.classList.contains('copied')).toBe(true);
    });

    test('_copyPlayableUrl resets copy state after timeout', async () => {
        jest.useFakeTimers();
        app.core.setSolvedResult({
            mapData: { goal: 12, maxWalls: 6, optimalSolution: [0, 0] },
            encoded: 'abc',
            playableUrl: 'https://example.com',
        });
        app.solveState = CONSTANTS.LEVEL_EDITOR.STATE_SOLVED;
        app._renderStatus();

        await app._copyPlayableUrl('https://example.com');
        expect(app.copyButtonCopied).toBe(true);

        jest.advanceTimersByTime(2100);
        expect(app.copyButtonCopied).toBe(false);

        jest.useRealTimers();
    });

    test('_copyPlayableUrl handles clipboard error gracefully', async () => {
        global.navigator.clipboard = { writeText: jest.fn().mockRejectedValue(new Error('denied')) };
        await app._copyPlayableUrl('https://example.com');
        expect(app.copyButtonCopied).toBe(false);
        expect(window.alert).toHaveBeenCalledWith(I18N.t('editor_status_copy_failed'));
    });

    test('_reloadGridFromCore sets solving state from existing solvedResult', () => {
        app.core.setSolvedResult({
            mapData: { goal: 10, maxWalls: 5, optimalSolution: [0, 0] },
            encoded: 'x',
            playableUrl: 'https://example.com',
        });
        app._reloadGridFromCore();
        expect(app.solveState).toBe(CONSTANTS.LEVEL_EDITOR.STATE_SOLVED);
        expect(app.mode).toBe(CONSTANTS.LEVEL_EDITOR.MODE_EDITING);
    });

    test('_reloadGridFromCore sets unsolved state when no solvedResult', () => {
        app.core.invalidateSolvedState();
        app._reloadGridFromCore();
        expect(app.solveState).toBe(CONSTANTS.LEVEL_EDITOR.STATE_UNSOLVED);
    });

    test('_getSolutionSet returns empty sets when not in viewing solution mode', () => {
        app.mode = CONSTANTS.LEVEL_EDITOR.MODE_EDITING;
        const result = app._getSolutionSet();
        expect(result.walls.size).toBe(0);
        expect(result.penned.size).toBe(0);
    });

    test('_getSolutionSet returns empty sets when solvedResult is null', () => {
        app.mode = CONSTANTS.LEVEL_EDITOR.MODE_VIEWING_SOLUTION;
        app.core.invalidateSolvedState();
        const result = app._getSolutionSet();
        expect(result.walls.size).toBe(0);
        expect(result.penned.size).toBe(0);
    });

    test('_getSolutionSet returns wall and penned sets when viewing solution with home on map', () => {
        // Place home on the map
        app.core.setSelectedTile('home');
        app.handleCellClick({ shiftKey: false, ctrlKey: false, metaKey: false }, 4, 4);
        // Set a solved result with a real wall position
        app.core.setSolvedResult({
            mapData: { goal: 5, maxWalls: 3, optimalSolution: [3, 4, 3, 5] },
            encoded: 'abc',
            playableUrl: 'https://example.com',
        });
        app.mode = CONSTANTS.LEVEL_EDITOR.MODE_VIEWING_SOLUTION;
        const result = app._getSolutionSet();
        expect(result.walls.size).toBeGreaterThan(0);
        expect(result.penned.size).toBeGreaterThan(0);
    });

});

// ===========================================================================
// DOM click event regression tests for the level editor
// Verifies that real click events dispatched to rendered cell elements reach
// handleCellClick correctly (event object must be first arg, not row).
// ===========================================================================

describe('LevelEditorApp — DOM click event regression', () => {
    let originalSetInterval;
    let app;
    let LevelEditorApp;

    beforeEach(() => {
        document.body.innerHTML = `
            <input id="editorLevelName" />
            <select id="editorMapSize"></select>
            <select id="editorTileSelector"></select>
            <button id="editorResetBtn"></button>
            <button id="editorSolveBtn"></button>
            <button id="editorToggleSolutionBtn"></button>
            <div id="editorGoalPanel"></div>
            <div id="editorStatus"></div>
            <div id="grid"></div>
        `;

        jest.spyOn(CookieUtils, 'getCookie').mockReturnValue('');
        originalSetInterval = global.setInterval;
        global.setInterval = jest.fn(() => 1);
        window.alert = jest.fn();
        window.open = jest.fn();
        global.fetch = jest.fn();
        global.navigator.clipboard = { writeText: jest.fn().mockResolvedValue(undefined) };
        global.LevelEditorCore = require('../../../js/editor/LevelEditorCore.js');
        LevelEditorApp = require('../../../js/editor/LevelEditorApp.js');
        app = new LevelEditorApp();
        app.core.setSelectedTile('water');
        app.render();
    });

    afterEach(() => {
        global.setInterval = originalSetInterval;
        jest.restoreAllMocks();
    });

    test('clicking a cell via DOM event places the selected tile', () => {
        const grid = document.getElementById('grid');
        const cell = grid.querySelector('[data-row="0"][data-col="0"]');
        expect(cell).not.toBeNull();

        cell.click();

        expect(app.core.map[0][0]).toBe('water');
    });

    test('shift-click via DOM event erases a tile to grass', () => {
        // Place a tile first via direct API
        app.core.setSelectedTile('water');
        app.core.placeTile(1, 1);
        app.grid.loadMap(app.core.map);
        app.render();
        expect(app.core.map[1][1]).toBe('water');

        const grid = document.getElementById('grid');
        const cell = grid.querySelector('[data-row="1"][data-col="1"]');
        const shiftClick = new MouseEvent('click', { bubbles: true, shiftKey: true });
        cell.dispatchEvent(shiftClick);

        expect(app.core.map[1][1]).toBe('grass');
    });

    test('right-click (contextmenu) via DOM event erases a tile', () => {
        // Place a tile first
        app.core.setSelectedTile('star');
        app.core.placeTile(2, 2);
        app.grid.loadMap(app.core.map);
        app.render();
        expect(app.core.map[2][2]).toBe('star');

        const grid = document.getElementById('grid');
        const cell = grid.querySelector('[data-row="2"][data-col="2"]');
        const contextEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
        cell.dispatchEvent(contextEvent);

        expect(app.core.map[2][2]).toBe('grass');
    });

    test('Enter keydown on a cell via DOM event places the selected tile', () => {
        const grid = document.getElementById('grid');
        const cell = grid.querySelector('[data-row="3"][data-col="3"]');
        const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
        cell.dispatchEvent(event);

        expect(app.core.map[3][3]).toBe('water');
    });
});
