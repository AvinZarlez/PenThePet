/**
 * generate-signature-keys.js
 *
 * Generates an ECDSA P-256 key pair for score signature verification.
 *
 * Usage:
 *   node scripts/generate-signature-keys.js
 *
 * Output:
 *   PUBLIC KEY  — add as the SIGNATURE_PUBLIC_KEY GitHub secret.
 *   PRIVATE KEY — keep safe; never commit or share this value.
 *
 * See docs/SIGNATURE_KEYS.md for full setup instructions.
 */

'use strict';

const { webcrypto } = require('crypto');
const { subtle } = webcrypto;

async function main() {
    const pair = await subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['sign', 'verify']
    );

    const pub  = await subtle.exportKey('jwk', pair.publicKey);
    const priv = await subtle.exportKey('jwk', pair.privateKey);

    console.log('PUBLIC KEY (add as SIGNATURE_PUBLIC_KEY GitHub secret):');
    console.log(JSON.stringify(pub));
    console.log();
    console.log('PRIVATE KEY (keep safe — NEVER commit or share this):');
    console.log(JSON.stringify(priv));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
