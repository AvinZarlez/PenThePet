const { parseRequestPath } = require('../../level-editor/server.js');

describe('level-editor server path parsing', () => {
    test('maps root to editor index', () => {
        const parsed = parseRequestPath('/');
        expect(parsed).toEqual({ ok: true, relativePath: 'level-editor/index.html' });
    });

    test('rejects disallowed top-level path', () => {
        const parsed = parseRequestPath('/private/secret.txt');
        expect(parsed.ok).toBe(false);
        expect(parsed.statusCode).toBe(403);
    });

    test('rejects traversal attempt', () => {
        const parsed = parseRequestPath('/level-editor/../package.json');
        expect(parsed.ok).toBe(false);
    });

    test('allows static app assets', () => {
        const parsed = parseRequestPath('/js/editor/LevelEditorApp.js');
        expect(parsed).toEqual({ ok: true, relativePath: 'js/editor/LevelEditorApp.js' });
    });

    test('rejects malformed percent-encoding', () => {
        const parsed = parseRequestPath('/%E0%A4%A');
        expect(parsed.ok).toBe(false);
        expect(parsed.statusCode).toBe(400);
    });
});
