const http = require('http');
const { parseRequestPath, server } = require('../../level-editor/server.js');

// ---------------------------------------------------------------------------
// Helpers for HTTP integration tests
// ---------------------------------------------------------------------------

/** Start the server on a random available port and return it. */
function startServer() {
    return new Promise((resolve, reject) => {
        server.listen(0, '127.0.0.1', () => resolve(server));
        server.once('error', reject);
    });
}

/** Stop the server. */
function stopServer() {
    return new Promise((resolve) => server.close(resolve));
}

/** Make an HTTP request against the running server. Returns { statusCode, headers, body }. */
function httpRequest({ method = 'GET', path = '/', body = null, extraHeaders = {} } = {}) {
    const port = server.address().port;
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port,
            path,
            method,
            headers: { ...extraHeaders },
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
        });
        req.on('error', reject);
        if (body !== null) {
            req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        req.end();
    });
}

// ---------------------------------------------------------------------------
// Path-parsing unit tests (existing)
// ---------------------------------------------------------------------------

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

    test('maps / to level-editor/index.html (root)', () => {
        expect(parseRequestPath('/').relativePath).toBe('level-editor/index.html');
    });

    test('allows css directory', () => {
        const parsed = parseRequestPath('/css/main.css');
        expect(parsed.ok).toBe(true);
        expect(parsed.relativePath).toBe('css/main.css');
    });

    test('allows assets directory', () => {
        const parsed = parseRequestPath('/assets/icon.png');
        expect(parsed.ok).toBe(true);
        expect(parsed.relativePath).toBe('assets/icon.png');
    });

    test('allows maps directory', () => {
        const parsed = parseRequestPath('/maps/2026.json');
        expect(parsed.ok).toBe(true);
        expect(parsed.relativePath).toBe('maps/2026.json');
    });

    test('allows site.webmanifest as exact allowed file', () => {
        const parsed = parseRequestPath('/site.webmanifest');
        expect(parsed.ok).toBe(true);
        expect(parsed.relativePath).toBe('site.webmanifest');
    });

    test('rejects paths with null byte', () => {
        const parsed = parseRequestPath('/js/file\0.js');
        expect(parsed.ok).toBe(false);
        expect(parsed.statusCode).toBe(400);
    });

    test('rejects dot-file segment', () => {
        const parsed = parseRequestPath('/js/.env');
        expect(parsed.ok).toBe(false);
        expect(parsed.statusCode).toBe(403);
    });

    test('rejects hidden directory traversal with encoded dots', () => {
        const parsed = parseRequestPath('/js/%2E%2E/private.txt');
        expect(parsed.ok).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// HTTP integration tests — actual server behaviour
// ---------------------------------------------------------------------------

describe('level-editor HTTP server integration', () => {
    beforeAll(() => startServer());
    afterAll(() => stopServer());

    // ── Static file serving ────────────────────────────────────────────────

    test('GET / returns 200 with HTML content', async () => {
        const res = await httpRequest({ path: '/' });
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toMatch(/text\/html/);
    });

    test('GET an existing JS file returns 200 with JavaScript content-type', async () => {
        const res = await httpRequest({ path: '/js/config/constants.js' });
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toMatch(/application\/javascript/);
    });

    test('GET a disallowed path returns 403', async () => {
        const res = await httpRequest({ path: '/package.json' });
        expect(res.statusCode).toBe(403);
    });

    test('GET a non-existent allowed file returns 404', async () => {
        const res = await httpRequest({ path: '/js/nonexistent-file-xyz.js' });
        expect(res.statusCode).toBe(404);
    });

    test('GET a path traversal attempt returns 403', async () => {
        const res = await httpRequest({ path: '/js/../package.json' });
        expect(res.statusCode).toBe(403);
    });

    // ── Security headers ───────────────────────────────────────────────────

    test('all responses include X-Content-Type-Options: nosniff', async () => {
        const res = await httpRequest({ path: '/' });
        expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    test('all responses include X-Frame-Options: DENY', async () => {
        const res = await httpRequest({ path: '/' });
        expect(res.headers['x-frame-options']).toBe('DENY');
    });

    test('all responses include a Content-Security-Policy header', async () => {
        const res = await httpRequest({ path: '/' });
        expect(res.headers['content-security-policy']).toBeDefined();
    });

    test('error responses also include security headers', async () => {
        const res = await httpRequest({ path: '/package.json' });
        expect(res.statusCode).toBe(403);
        expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    // ── POST /api/solve-level ──────────────────────────────────────────────

    test('POST /api/solve-level returns 400 for invalid JSON body', async () => {
        const res = await httpRequest({
            method: 'POST',
            path: '/api/solve-level',
            body: 'not-valid-json{{{',
            extraHeaders: { 'Content-Type': 'application/json' },
        });
        expect(res.statusCode).toBe(400);
        const json = JSON.parse(res.body);
        expect(json.ok).toBe(false);
        expect(json.error).toBeDefined();
    });

    test('POST /api/solve-level returns 413 when body exceeds limit', async () => {
        const CONSTANTS = require('../../js/config/constants.js');
        const limit = CONSTANTS.LEVEL_EDITOR.MAX_REQUEST_BODY_BYTES;
        // Build a body 1 byte larger than the limit
        const oversizedBody = 'x'.repeat(limit + 1);
        const res = await httpRequest({
            method: 'POST',
            path: '/api/solve-level',
            body: oversizedBody,
            extraHeaders: { 'Content-Type': 'application/json' },
        });
        expect(res.statusCode).toBe(413);
        const json = JSON.parse(res.body);
        expect(json.ok).toBe(false);
    });

    test('POST /api/solve-level returns 400 for missing required fields', async () => {
        const res = await httpRequest({
            method: 'POST',
            path: '/api/solve-level',
            body: JSON.stringify({ size: 9 }), // missing map field
            extraHeaders: { 'Content-Type': 'application/json' },
        });
        expect(res.statusCode).toBe(400);
        const json = JSON.parse(res.body);
        expect(json.ok).toBe(false);
    });

    test('POST /api/solve-level response has JSON content-type', async () => {
        const res = await httpRequest({
            method: 'POST',
            path: '/api/solve-level',
            body: JSON.stringify({}),
            extraHeaders: { 'Content-Type': 'application/json' },
        });
        expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    test('POST /api/solve-level response includes security headers', async () => {
        const res = await httpRequest({
            method: 'POST',
            path: '/api/solve-level',
            body: JSON.stringify({}),
            extraHeaders: { 'Content-Type': 'application/json' },
        });
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['x-frame-options']).toBe('DENY');
    });
});

