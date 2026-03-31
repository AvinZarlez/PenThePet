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

    test('constructor throws for size below minimum', () => {
        expect(() => new LevelEditorCore({ size: CONSTANTS.MIN_GRID_SIZE - 1 }))
            .toThrow(/Invalid editor size/);
    });

    test('constructor throws for size above maximum', () => {
        expect(() => new LevelEditorCore({ size: CONSTANTS.MAX_GRID_SIZE + 1 }))
            .toThrow(/Invalid editor size/);
    });

    test('setSelectedTile throws for unsupported tile', () => {
        const core = new LevelEditorCore({ size: 9 });
        expect(() => core.setSelectedTile('wall')).toThrow(/Unsupported editor tile/);
        expect(() => core.setSelectedTile('invalid_tile')).toThrow(/Unsupported editor tile/);
    });

    test('setMapSize throws for invalid sizes', () => {
        const core = new LevelEditorCore({ size: 9 });
        expect(() => core.setMapSize(CONSTANTS.MIN_GRID_SIZE - 1)).toThrow(/Map size must be between/);
        expect(() => core.setMapSize(CONSTANTS.MAX_GRID_SIZE + 1)).toThrow(/Map size must be between/);
    });

    test('setMapSize within valid range resets the map', () => {
        const core = new LevelEditorCore({ size: 9 });
        core.setSelectedTile('water');
        core.placeTile(0, 0);
        expect(core.map[0][0]).toBe('water');
        core.setMapSize(11);
        expect(core.size).toBe(11);
        expect(core.map[0][0]).toBe('grass');
    });

    test('loadDraft ignores null and non-object values', () => {
        const core = new LevelEditorCore({ size: 9 });
        const originalSize = core.size;
        core.loadDraft(null);
        expect(core.size).toBe(originalSize);
        core.loadDraft('string');
        expect(core.size).toBe(originalSize);
        core.loadDraft(42);
        expect(core.size).toBe(originalSize);
    });

    test('loadDraft ignores draft with mismatched map size', () => {
        const core = new LevelEditorCore({ size: 9 });
        const originalSize = core.size;
        // map.length (5) !== draft.size (9)
        const badDraft = { size: 9, map: Array.from({ length: 5 }, () => Array(5).fill('grass')) };
        core.loadDraft(badDraft);
        expect(core.size).toBe(originalSize);
    });

    test('loadDraft ignores invalid selectedTile', () => {
        const core = new LevelEditorCore({ size: 9 });
        const originalTile = core.selectedTile;
        core.loadDraft({ selectedTile: 'wall' });
        expect(core.selectedTile).toBe(originalTile);
        core.loadDraft({ selectedTile: 'filledHole' });
        expect(core.selectedTile).toBe(originalTile);
    });

    test('loadDraft restores solvedResult from draft', () => {
        const core = new LevelEditorCore({ size: 9 });
        const solved = { mapData: { goal: 10, maxWalls: 5 }, encoded: 'abc', playableUrl: 'https://example.com' };
        core.loadDraft({ solvedResult: solved });
        expect(core.solvedResult).toEqual(solved);
    });

    test('toSolverPayload returns correct structure', () => {
        const core = new LevelEditorCore({ size: 9 });
        const payload = core.toSolverPayload();
        expect(payload.size).toBe(9);
        expect(payload.maxWalls).toBe(CONSTANTS.maxWallsForSize(9));
        expect(Array.isArray(payload.map)).toBe(true);
    });

    test('placeTile out-of-bounds does nothing', () => {
        const core = new LevelEditorCore({ size: 9 });
        core.placeTile(-1, 0);
        core.placeTile(0, -1);
        core.placeTile(9, 0);
        core.placeTile(0, 9);
        expect(core.map[0][0]).toBe('grass');
    });

    test('eraseTile out-of-bounds does nothing', () => {
        const core = new LevelEditorCore({ size: 9 });
        expect(() => core.eraseTile(-1, 0)).not.toThrow();
        expect(() => core.eraseTile(9, 9)).not.toThrow();
    });

    test('setLevelName trims whitespace', () => {
        const core = new LevelEditorCore({ size: 9 });
        core.setLevelName('  My Level  ');
        expect(core.levelName).toBe('My Level');
    });

    test('setLevelName with falsy value sets empty string', () => {
        const core = new LevelEditorCore({ size: 9 });
        core.setLevelName(null);
        expect(core.levelName).toBe('');
        core.setLevelName(undefined);
        expect(core.levelName).toBe('');
    });

    describe('loadFromMapData', () => {
        function makeMap(size, fill = 'grass') {
            return Array.from({ length: size }, () => Array(size).fill(fill));
        }

        test('loads valid map data and resets solved state', () => {
            const core = new LevelEditorCore({ size: 9 });
            core.setSolvedResult({ mapData: { goal: 10 } });
            const map = makeMap(11);
            core.loadFromMapData({ map, size: 11, levelName: 'Test Level' });
            expect(core.size).toBe(11);
            expect(core.map.length).toBe(11);
            expect(core.levelName).toBe('Test Level');
            expect(core.solvedResult).toBeNull();
            expect(core.selectedTile).toBe(LevelEditorCore.DEFAULT_SELECTED_TILE);
        });

        test('uses DEFAULT_LEVEL_NAME when levelName is empty', () => {
            const core = new LevelEditorCore({ size: 9 });
            const map = makeMap(9);
            core.loadFromMapData({ map, size: 9, levelName: '' });
            expect(core.levelName).toBe(CONSTANTS.LEVEL_EDITOR.DEFAULT_LEVEL_NAME);
        });

        test('uses DEFAULT_LEVEL_NAME when levelName is omitted', () => {
            const core = new LevelEditorCore({ size: 9 });
            const map = makeMap(9);
            core.loadFromMapData({ map, size: 9 });
            expect(core.levelName).toBe(CONSTANTS.LEVEL_EDITOR.DEFAULT_LEVEL_NAME);
        });

        test('throws on invalid size', () => {
            const core = new LevelEditorCore({ size: 9 });
            const map = makeMap(5);
            expect(() => core.loadFromMapData({ map, size: 5 })).toThrow();
        });

        test('throws when map array length does not match size', () => {
            const core = new LevelEditorCore({ size: 9 });
            const map = makeMap(9);
            expect(() => core.loadFromMapData({ map, size: 11 })).toThrow();
        });

        test('enforces single-home constraint after load', () => {
            const core = new LevelEditorCore({ size: 9 });
            const map = makeMap(9);
            map[0][0] = 'home';
            map[1][1] = 'home'; // two homes — should be reduced to one
            core.loadFromMapData({ map, size: 9, levelName: 'Two Homes' });
            expect(core.getHomeCount()).toBe(1);
        });

        test('deep-copies the provided map array', () => {
            const core = new LevelEditorCore({ size: 9 });
            const map = makeMap(9);
            core.loadFromMapData({ map, size: 9 });
            map[0][0] = 'water'; // mutate original
            expect(core.map[0][0]).toBe('grass'); // core is unaffected
        });
    });
});
