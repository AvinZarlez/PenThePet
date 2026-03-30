const http = require('http');
const fs = require('fs');
const path = require('path');

const { solveAndValidateEditorMap } = require('../scripts/lib/levelEditorMap.js');
const CONSTANTS = require('../js/config/constants.js');

const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : CONSTANTS.LEVEL_EDITOR.DEFAULT_PORT;

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
}

function sendFile(res, requestPath) {
    const sanitizedRequestPath = requestPath.replace(/^\/+/, '');
    const joinedPath = path.resolve(ROOT_DIR, sanitizedRequestPath);
    fs.realpath(joinedPath, (realErr, realPath) => {
        if (realErr) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        if (!realPath.startsWith(ROOT_DIR + path.sep) && realPath !== ROOT_DIR) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }
        fs.readFile(realPath, (err, data) => {
            if (err) {
                res.writeHead(404);
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
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });
}

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api/solve-level') {
        let body = '';
        let rejected = false;
        req.on('data', (chunk) => {
            if (rejected) return;
            body += chunk;
            if (body.length > CONSTANTS.LEVEL_EDITOR.MAX_REQUEST_BODY_BYTES) {
                rejected = true;
                sendJson(res, 413, {
                    ok: false,
                    error: 'Request body too large',
                    validationErrors: [],
                });
                req.destroy();
            }
        });
        req.on('end', () => {
            if (rejected) return;
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
        return;
    }

    let requestPath = req.url.split('?')[0];
    if (requestPath === '/') requestPath = '/level-editor/index.html';
    sendFile(res, requestPath);
});

server.listen(PORT, () => {
    console.log(`Level editor server running at http://localhost:${PORT}/`);
});
