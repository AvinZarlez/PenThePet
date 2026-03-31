const http = require('http');
const fs = require('fs');
const path = require('path');

const { solveAndValidateEditorMap } = require('../scripts/lib/levelEditorMap.js');
const CONSTANTS = require('../js/config/constants.js');

const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : CONSTANTS.LEVEL_EDITOR.DEFAULT_PORT;
const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
};
const ALLOWED_ROOT_SEGMENTS = new Set(['level-editor', 'js', 'css', 'assets', 'maps']);
const ALLOWED_EXACT_FILES = new Set(['site.webmanifest']);

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        ...SECURITY_HEADERS,
        'Content-Type': 'application/json; charset=utf-8',
    });
    res.end(JSON.stringify(payload));
}

function parseRequestPath(rawUrl) {
    let pathname;
    try {
        pathname = new URL(rawUrl, 'http://localhost').pathname;
    } catch {
        return { ok: false, statusCode: 400, message: 'Bad request URL' };
    }
    let decodedPath;
    try {
        decodedPath = decodeURIComponent(pathname);
    } catch {
        return { ok: false, statusCode: 400, message: 'Bad request path' };
    }
    if (decodedPath.includes('\0')) {
        return { ok: false, statusCode: 400, message: 'Bad request path' };
    }

    if (decodedPath === '/') {
        return { ok: true, relativePath: 'level-editor/index.html' };
    }

    const relativePath = decodedPath.replace(/^\/+/, '');
    const segments = relativePath.split('/').filter(Boolean);
    if (segments.length === 0) {
        return { ok: false, statusCode: 404, message: 'Not found' };
    }
    if (segments.some((segment) => segment === '.' || segment === '..' || segment.startsWith('.'))) {
        return { ok: false, statusCode: 403, message: 'Forbidden' };
    }
    const topLevel = segments[0];
    if (!ALLOWED_ROOT_SEGMENTS.has(topLevel) && !ALLOWED_EXACT_FILES.has(relativePath)) {
        return { ok: false, statusCode: 403, message: 'Forbidden' };
    }
    return { ok: true, relativePath };
}

function sendFile(res, requestPath) {
    const parsed = parseRequestPath(requestPath);
    if (!parsed.ok) {
        res.writeHead(parsed.statusCode, SECURITY_HEADERS);
        res.end(parsed.message);
        return;
    }

    const absolutePath = path.resolve(ROOT_DIR, parsed.relativePath);
    fs.realpath(absolutePath, (realErr, realPath) => {
        if (realErr) {
            res.writeHead(404, SECURITY_HEADERS);
            res.end('Not found');
            return;
        }
        if (!realPath.startsWith(ROOT_DIR + path.sep) && realPath !== ROOT_DIR) {
            res.writeHead(403, SECURITY_HEADERS);
            res.end('Forbidden');
            return;
        }
        fs.stat(realPath, (statErr, stats) => {
            if (statErr || !stats.isFile()) {
                res.writeHead(404, SECURITY_HEADERS);
                res.end('Not found');
                return;
            }
            fs.readFile(realPath, (err, data) => {
                if (err) {
                    res.writeHead(404, SECURITY_HEADERS);
                    res.end('Not found');
                    return;
                }
                const ext = path.extname(realPath).toLowerCase();
                const contentType = {
                    '.html': 'text/html; charset=utf-8',
                    '.css': 'text/css; charset=utf-8',
                    '.js': 'application/javascript; charset=utf-8',
                    '.json': 'application/json; charset=utf-8',
                    '.svg': 'image/svg+xml',
                    '.png': 'image/png',
                    '.webmanifest': 'application/manifest+json; charset=utf-8',
                }[ext] || 'application/octet-stream';
                res.writeHead(200, {
                    ...SECURITY_HEADERS,
                    'Content-Type': contentType,
                });
                res.end(data);
            });
        });
    });
}

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api/solve-level') {
        let body = '';
        let overLimit = false;
        req.on('data', (chunk) => {
            if (overLimit) return;
            body += chunk;
            if (body.length > CONSTANTS.LEVEL_EDITOR.MAX_REQUEST_BODY_BYTES) {
                overLimit = true;
                body = '';
            }
        });
        req.on('end', () => {
            if (overLimit) {
                sendJson(res, 413, {
                    ok: false,
                    error: 'Request body too large',
                    validationErrors: [],
                });
                return;
            }
            try {
                const payload = JSON.parse(body || '{}');
                const solved = solveAndValidateEditorMap(payload);
                if (!solved.ok) {
                    sendJson(res, 400, solved);
                    return;
                }
                sendJson(res, 200, solved);
            } catch (error) {
                sendJson(res, 400, {
                    ok: false,
                    error: error.message || 'Invalid request',
                    validationErrors: [],
                });
            }
        });
        req.on('error', (_error) => {
            if (res.writableEnded) return;
            sendJson(res, 400, {
                ok: false,
                error: 'Failed to read request body',
                validationErrors: [],
            });
        });
        return;
    }
    sendFile(res, req.url || '/');
});

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Level editor server running at http://localhost:${PORT}/`);
    });
}

module.exports = {
    parseRequestPath,
    server,
};
