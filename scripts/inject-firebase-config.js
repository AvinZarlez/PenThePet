/**
 * Inject Firebase configuration into js/cloud/firebase-config.js.
 *
 * Reads Firebase field values from environment variables and replaces the
 * empty-string placeholders in firebase-config.js with the real values.
 * Used by the GitHub Actions deploy workflow (static.yml).
 *
 * Environment variables (all optional — skipped when empty):
 *   FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID,
 *   FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID,
 *   FIREBASE_APP_ID, FIREBASE_MEASUREMENT_ID
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const FIELDS = [
    ['apiKey',             'FIREBASE_API_KEY'],
    ['authDomain',         'FIREBASE_AUTH_DOMAIN'],
    ['projectId',          'FIREBASE_PROJECT_ID'],
    ['storageBucket',      'FIREBASE_STORAGE_BUCKET'],
    ['messagingSenderId',  'FIREBASE_MESSAGING_SENDER_ID'],
    ['appId',              'FIREBASE_APP_ID'],
    ['measurementId',      'FIREBASE_MEASUREMENT_ID'],
];

const configPath = path.join(__dirname, '..', 'js', 'cloud', 'firebase-config.js');
let content = fs.readFileSync(configPath, 'utf8');

for (const [jsKey, envVar] of FIELDS) {
    const value = (process.env[envVar] || '').trim();
    if (!value) continue;
    if (value.includes("'") || value.includes('\\')) {
        process.stderr.write(`Error: ${envVar} contains invalid characters\n`);
        process.exit(1);
    }
    content = content.replace(`${jsKey}: ''`, `${jsKey}: '${value}'`);
}

fs.writeFileSync(configPath, content);
