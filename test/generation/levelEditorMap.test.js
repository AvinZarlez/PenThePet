const {
    solveAndValidateEditorMap,
    decodeEditorMapCode,
    buildPlayableUrl,
    ensureSingleHome,
    getEditorTileOptions,
} = require('../../scripts/lib/levelEditorMap.js');
const MILPSolver = require('../../scripts/solver/MILPSolver.js');

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

    test('throws on map shape mismatch', () => {
        const map = Array.from({ length: 8 }, () => Array(8).fill('grass'));
        expect(() => solveAndValidateEditorMap({ size: 9, map, levelName: 'Bad Shape' })).toThrow(
            /Map shape does not match size/
        );
    });

    test('returns dependency guidance when solver dependency is missing', () => {
        const map = Array.from({ length: 9 }, () => Array(9).fill('grass'));
        map[4][4] = 'home';
        jest.spyOn(MILPSolver, 'solveMap').mockReturnValue(null);
        jest.spyOn(MILPSolver, 'getLastError').mockReturnValue("Traceback... No module named 'pulp'");
        const result = solveAndValidateEditorMap({ size: 9, map, levelName: 'Dependency Missing' });
        expect(result.ok).toBe(false);
        expect(result.error).toMatch(/Install Python requirements/);
    });
});
