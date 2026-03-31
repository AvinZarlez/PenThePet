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

});
