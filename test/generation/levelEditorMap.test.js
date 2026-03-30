const {
    solveAndValidateEditorMap,
    decodeEditorMapCode,
    buildPlayableUrl,
    ensureSingleHome,
    getEditorTileOptions,
} = require('../../scripts/lib/levelEditorMap.js');

describe('levelEditorMap helpers', () => {
    test('buildPlayableUrl uses live game URL', () => {
        expect(buildPlayableUrl('abc123')).toBe('https://avinzarlez.com/penthepet?map=abc123');
    });

    test('ensureSingleHome throws when no home exists', () => {
        const map = Array.from({ length: 9 }, () => Array(9).fill('grass'));
        expect(() => ensureSingleHome(map)).toThrow(/exactly one home/);
    });

    test('decodeEditorMapCode throws on invalid code', () => {
        expect(() => decodeEditorMapCode('bad!!')).toThrow(/Invalid map code/);
    });

    test('editor tile options exclude grass and wall-state tiles', () => {
        const options = getEditorTileOptions();
        expect(options).toContain('home');
        expect(options).toContain('water');
        expect(options).not.toContain('grass');
        expect(options).not.toContain('wall');
        expect(options).not.toContain('filledHole');
    });
});

describe('solveAndValidateEditorMap', () => {
    test('returns validation error for map without exactly one home', () => {
        const map = Array.from({ length: 9 }, () => Array(9).fill('grass'));
        const run = () => solveAndValidateEditorMap({ size: 9, map, levelName: 'No Home' });
        expect(run).toThrow(/exactly one home/);
    });
});
