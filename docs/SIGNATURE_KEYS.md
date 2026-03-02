# 🔑 Score Signature Keys

This document explains how score sharing and verification works in Pen the Pet,
and how to generate and configure an ECDSA key pair to enable cryptographic
signature verification.

## Overview

When a player shares their score, the game generates a **self-contained token**
that encodes all the game data AND a tamper-detection value in a single string:

```text
<base64url(payload)>.<hexsig>
```

where `payload = "username|date|score|goal|timeSeconds"`.

The token is appended to the share message as:

```text
Pen The Pet 🐶
Day 42 - March 1, 2026
Player: Alice
Score: 80% (8/10) Time: 01:33
Signature: QWxpY2V8MjAyNi0wMy0wMXw4fDEwfDkz.1a2b3c4d
```

Any recipient can paste either the full message **or just the token** into the
**🔍 Verify Score** screen. All details (player name, date, score, time) are read
exclusively from the decoded token — no other text in the message is trusted.

---

## Security Model

### Default mode (no keys configured)

Without a key pair, the `hexsig` part is a deterministic
[FNV-1a](https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function)
hash of the payload.  This makes accidental corruption detectable but does **not**
prevent a motivated user from forging a token, because the hash function has no
secret.

### ⚠️ Why the private key must never be in the browser

Because Pen the Pet is a static GitHub Pages site, all JavaScript is publicly
visible in the page source.  If a private key were injected into the browser
bundle, anyone could extract it and sign arbitrary payloads.

For this reason **only the public key is deployed to the browser** (for
verification).  True forgery-proof signatures for client-generated scores would
require a server-side signing endpoint, which is outside the scope of a
fully-static site.

### ECDSA upgrade path

The `SignatureUtils.verify()` function already supports ECDSA-P256-SHA256
verification using the public key stored in `SITE_CONFIG.signaturePublicKey`.
If a server-side signing endpoint is added in future (e.g. a Firebase Cloud
Function), it can produce ECDSA-signed tokens and the verify UI will accept them
immediately without any front-end changes.

---

## Generating a Key Pair

### Prerequisites

Any modern environment with `openssl` or Node.js ≥ 20 will work.

### Option A — Node.js (recommended)

```bash
node scripts/generate-signature-keys.js
```

The script prints the public key (to add as `SIGNATURE_PUBLIC_KEY` in GitHub Secrets) and the
private key (for safekeeping — **never commit or share it**).

### Option B — openssl + manual JWK conversion

```bash
openssl ecparam -name prime256v1 -genkey -noout -out ec-priv.pem
openssl ec -in ec-priv.pem -pubout -out ec-pub.pem
```

Convert the PEM files to JWK format using a tool such as
[`pem-jwk`](https://github.com/dannycoates/pem-jwk) or an online converter.

---

## Configuring GitHub Secrets

Only the **public key** needs to be in a GitHub secret (it is deployed to the
browser for verification).  The private key is for a future server-side signer
and should be stored securely — **not** as a repository secret that ends up in
the browser bundle.

1. In your fork on GitHub, go to **Settings → Secrets and variables → Actions**.
2. Click **New repository secret** and add:

   | Secret name            | Value                                     |
   | ---------------------- | ----------------------------------------- |
   | `SIGNATURE_PUBLIC_KEY` | The full JWK JSON string of the public key |

3. Push any change to `main` (or trigger the **Deploy static content to Pages**
   workflow manually).  The workflow will substitute the public key into
   `js/site-config.js` at deploy time.

After deployment, the **🔍 Verify Score** screen will use ECDSA to verify any
token that was signed with the corresponding private key.

---

## Verifying a Score

Players who receive a share message can verify it in two ways:

1. **Paste the full message** — the Verify screen extracts the Signature line
   automatically.
2. **Paste just the token** — copy only the value after `Signature:` and paste
   that alone.

In both cases, all displayed details (player name, date, score, time) come
exclusively from the decoded token, not from any other text in the message.

---

## Token Format Reference

```
<base64url(payload)>.<hexsig>
```

| Part              | Description                                      |
| ----------------- | ------------------------------------------------ |
| `base64url(...)` | URL-safe base64 encoding of the payload (no `=`) |
| `payload`         | `username\|date\|score\|goal\|timeSeconds`        |
| `hexsig`          | FNV-1a hash (fallback) or ECDSA-P256 hex bytes   |

Example payload: `Anonymous|2026-03-01|8|10|93`
