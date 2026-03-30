const LevelEditorCore = require('../../../js/editor/LevelEditorCore.js');

describe('LevelEditorCore', () => {
    test('initializes with defaults', () => {
        const core = new LevelEditorCore();
        expect(core.size).toBe(CONSTANTS.DEFAULT_GRID_SIZE);
        expect(core.selectedTile).toBe(LevelEditorCore.DEFAULT_SELECTED_TILE);
        expect(core.map.length).toBe(CONSTANTS.DEFAULT_GRID_SIZE);
    });

    test('keeps only one home tile when placing home repeatedly', () => {
        const core = new LevelEditorCore({ size: 9 });
        core.setSelectedTile('home');
        core.placeTile(0, 0);
        core.placeTile(1, 1);
        expect(core.getHomeCount()).toBe(1);
        expect(core.map[1][1]).toBe('home');
    });

    test('invalidates solved state on edits', () => {
        const core = new LevelEditorCore({ size: 9 });
        core.setSolvedResult({ ok: true });
        core.setSelectedTile('water');
        core.placeTile(0, 0);
        expect(core.solvedResult).toBeNull();
    });

    test('serializes and restores draft', () => {
        const core = new LevelEditorCore({ size: 9 });
        core.setLevelName('My Level');
        core.setSelectedTile('star');
        core.placeTile(2, 2);
        const draft = core.toDraft();

        const loaded = new LevelEditorCore({ size: 9 });
        loaded.loadDraft(draft);
        expect(loaded.levelName).toBe('My Level');
        expect(loaded.map[2][2]).toBe('star');
    });

    test('eraseTile resets tile to grass', () => {
        const core = new LevelEditorCore({ size: 9 });
        core.setSelectedTile('hole');
        core.placeTile(1, 1);
        core.eraseTile(1, 1);
        expect(core.map[1][1]).toBe('grass');
    });

    test('loadDraft enforces single-home constraint', () => {
        const core = new LevelEditorCore({ size: 9 });
        const map = Array.from({ length: 9 }, () => Array(9).fill('grass'));
        map[0][0] = 'home';
        map[2][2] = 'home';
        core.loadDraft({ size: 9, map });
        expect(core.getHomeCount()).toBe(1);
        expect(core.map[2][2]).toBe('home');
    });
});
