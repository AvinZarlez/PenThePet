# ☁️ Cloud Sync Setup Guide

This guide explains how to enable cross-device cloud sync so that your
puzzle progress is automatically available on every browser and device you use.

## Overview

By default the app stores all data **locally in your browser** (cookies).
Cloud sync is an **opt-in feature** that is disabled until you configure it.
Once enabled:

- Submissions you make on one device automatically appear on all your
  other signed-in devices.
- Settings (pet type, hint mode) are synced when you sign in on a new device.
- Each user's data is stored privately; no one else can read or write it.

Cloud sync is powered by **Firebase** — Google's free serverless backend.
You need to create your own Firebase project and connect it to your fork of
this repository. Firebase's free tier (Spark plan) is more than sufficient
for normal use.

## Prerequisites

- A Google account (for Firebase)
- Admin access to your fork of this repository

## Step-by-step Setup

### Step 1 — Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com).
2. Click **Add project** (or **Create a project**).
3. Enter a project name (e.g. `penthepet`).
4. You can disable Google Analytics — it is not needed.
5. Click **Create project**, then **Continue**.

### Step 2 — Register a Web App

1. On the project overview page, click the **Web** icon (`</>`) under
   "Add an app to get started".
2. Enter an app nickname (e.g. `penthepet-web`).
3. Leave "Also set up Firebase Hosting" **unchecked** — the app is hosted
   on GitHub Pages.
4. Click **Register app**.
5. Firebase shows you a `firebaseConfig` object — copy the values.
6. Click **Continue to console**.

> **Note:** Firebase API keys are **not secret** in a technical sense — they
> identify your project but all access is controlled by Authentication and
> Security Rules. However, committing them can trigger automated security
> scanners, so this repository uses GitHub repository secrets instead
> (see Step 8).

### Step 3 — Enable Authentication Sign-In Methods

#### 3a — Email Link (Passwordless)

1. In the Firebase console left sidebar, click **Build → Authentication**.
2. Click **Get started**.
3. Under the **Sign-in method** tab, click **Email/Password**.
4. Toggle **Enable** to on.
5. Toggle **Email link (passwordless sign-in)** to on. This allows Firebase
   to send sign-in link emails and email-change verification emails.
6. Click **Save**.

#### 3b — Google Sign-In

1. Under the **Sign-in method** tab, click **Google**.
2. Toggle **Enable** to on.
3. Select a **Project support email** from the dropdown (required by Google).
4. Click **Save**.

When you enable Google Sign-In, Firebase automatically creates an **OAuth 2.0
Client ID** in the Google Cloud Console. This Client ID has an **Authorized
JavaScript origins** list, and the Google popup will be blocked unless every
domain the app is served from is in that list.

1. Go to the
   [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Under **OAuth 2.0 Client IDs**, click the entry that Firebase created
   (it is typically named **Web client (auto created by Google Service)**).
3. Under **Authorized JavaScript origins**, add every domain the app is served
   from. Examples:
   - **GitHub Pages (default domain):**

     ```text
     https://YOUR_USERNAME.github.io
     ```

   - **Custom domain** (e.g. `www.your-domain.com`):

     ```text
     https://www.your-domain.com
     ```

   - **Local development:**

     ```text
     http://localhost:8080
     ```

   Click **+ Add URI** for each domain. Origins do not use wildcards — list
   each domain exactly, without a trailing slash or path.

4. Click **Save**.

> **Note:** This OAuth Client ID is separate from the API key you restrict in
> Step 6. Both must be configured. If you add a domain to the API key
> referrers (Step 6) but forget the OAuth Client ID here, the Google popup
> will show a `redirect_uri_mismatch` or `origin_mismatch` error.

### Step 4 — Create a Firestore Database

1. In the left sidebar, click **Build → Firestore Database**.
2. Click **Create database**.
3. Choose **Start in production mode** (you will set the correct rules next).
4. Select a Cloud Firestore location closest to your users (e.g. `us-east1`).
5. Click **Enable**.

### Step 5 — Set Firestore Security Rules

The default production rules deny all access. Replace them with rules that
allow each authenticated user to read and write only their own data.

1. In **Build → Firestore Database**, click the **Rules** tab.
1. Replace the entire contents with the following and click **Publish**:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

> **What this rule does:** A signed-in user can only read and write
> documents stored under their own user ID. No user can access another
> user's data.

### Step 6 — Restrict Your API Key

To ensure that **only your website** can use your Firebase project (not a
fork running on a different domain):

1. Go to the
   [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Select the project you just created.
3. Click the **Browser key** that Firebase created automatically.
4. Under **Application restrictions**, select **HTTP referrers (web sites)**.
5. Add every domain the app is served from **plus Firebase's own domain**
   (required for passwordless email link sign-in). Examples:
   - **Firebase's sign-in handler (required for email link sign-in):**

     ```text
     https://YOUR_PROJECT_ID.firebaseapp.com/*
     ```

   - **GitHub Pages (default domain):**

     ```text
     https://YOUR_USERNAME.github.io/penthepet/*
     ```

   - **Custom domain** (e.g. `www.your-domain.com`):

     ```text
     https://www.your-domain.com/*
     ```

   - **Local development** — include the port your dev server uses:

     ```text
     http://localhost:8080/*
     ```

   Add one referrer per line. Replace the examples with your actual values.

6. Click **Save**.

This means even if someone forks the repo and deploys it, their site will
be on a different domain and Firebase will reject their requests.

> ⚠️ **`firebaseapp.com` must be in the referrers list.**
> When a user clicks a passwordless sign-in link, their browser first visits
> `https://YOUR_PROJECT_ID.firebaseapp.com/__/auth/action?…` — Firebase's
> own sign-in handler — before being redirected back to your app. That
> handler calls the Firebase API using your API key, so
> `https://YOUR_PROJECT_ID.firebaseapp.com/*` **must** appear in the
> referrers list or the request will be rejected with an "API key expired /
> invalid" error. Replace `YOUR_PROJECT_ID` with your actual Firebase project
> ID (e.g. `penthepet-12345`).
>
> **Important:** After adding or changing referrers, wait up to five minutes
> for the changes to propagate before testing.
>
> ⚠️ **Three separate settings — all are required.**
> Step 3b (OAuth 2.0 Client ID authorized origins), Step 6 (Google Cloud
> Console API key referrers), and Step 7 (Firebase Authentication authorized
> domains) are completely separate settings in different places. **Updating
> one does NOT update the others.** Every domain the app is served from must
> be registered in **all three** places:
>
> - **OAuth 2.0 Client ID** (Step 3b) — controls which origins can open the
>   Google sign-in popup.
> - **API key HTTP referrers** (Step 6) — controls which sites can call
>   Firebase APIs at all.
> - **Firebase Authentication authorized domains** (Step 7) — controls which
>   domains Firebase will redirect sign-in flows back to.

### Step 7 — Authorise Your Domain in Firebase Authentication

Firebase Authentication maintains its own list of allowed domains, separate
from the API key restrictions above. Any domain the app is served from must
appear in this list or sign-in will be blocked.

1. In the Firebase console left sidebar, click **Build → Authentication**.
2. Click the **Settings** tab.
3. Under **Authorised domains**, click **Add domain**.
4. Add every domain the app is served from, for example:
   - `YOUR_USERNAME.github.io`
   - `YOUR_CUSTOM_DOMAIN` _(e.g. `www.your-domain.com`, if applicable)_
   - `localhost` _(for local development)_
5. Click **Add** after each domain.

> **Note:** `firebaseapp.com` and `localhost` are pre-authorised by default.
> You only need to add domains that are not already in the list.

### Step 8 — Add Your Config as GitHub Secrets

Instead of editing `js/site-config.js` directly, add the Firebase values as
**repository secrets** so that the deploy workflow injects them automatically.
This keeps credentials out of the committed codebase.

1. In your fork on GitHub, go to **Settings → Secrets and variables → Actions**.
2. Click **New repository secret** and add each of the following secrets with
   the corresponding value from the `firebaseConfig` object you copied in Step 2:

   | Repository Secret              | Example value                      |
   | ------------------------------ | ---------------------------------- |
   | `FIREBASE_API_KEY`             | `AIzaSy…`                          |
   | `FIREBASE_AUTH_DOMAIN`         | `your-project.firebaseapp.com`     |
   | `FIREBASE_PROJECT_ID`          | `your-project`                     |
   | `FIREBASE_APP_ID`              | `1:1234567890:web:abcdef`          |

3. Push any change to `main` (or trigger the **Deploy static content to Pages**
   workflow manually). The workflow will substitute the secrets into
   `js/site-config.js` at deploy time.

The app detects that `apiKey` is non-empty and automatically enables the
cloud sync UI. The committed file always contains empty strings, so no
credentials are stored in the repository.

### Step 9 — Test the Setup

1. Open the app (your GitHub Pages URL).
2. A **"☁️ Sign In to Sync"** button should appear below the menu button.
3. Click it. The sign-in modal shows two options:
   - **Sign in with Google** — opens a Google OAuth popup; sign in with any
     Google account.
   - **Email link** — enter your email and click **Send Sign-In Link**;
     Firebase emails a one-time magic link; clicking it signs you in
     automatically — no password required.
4. After signing in, you should see your email (or username) and a **☁️ Synced** badge.
5. Submit a puzzle — it should upload to Firestore automatically.
6. Open the same URL in a different browser or device, sign in with the
   same account, and verify that the submission appears.

## Sign-In Methods

### Email Link (Magic Links)

Once **Email link (passwordless sign-in)** is enabled in Step 3a, users can
sign in without a password:

1. Click **"☁️ Sign In to Sync"** in the app.
2. Enter your email and click **Send Sign-In Link**.
3. Check your inbox for an email from Firebase — click the link inside.
4. The app opens and you are signed in automatically.

| Step                 | What happens                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| User requests a link | `sendSignInLinkToEmail()` is called; Firebase emails a one-time magic link; the email is saved in `localStorage` |
| User clicks the link | Browser opens the app URL with a sign-in token in the query string                                               |
| App loads            | `init()` detects the token, reads the saved email, calls `signInWithEmailLink()`, then cleans the URL            |
| Different device     | If the link is opened on a different device, the app prompts for the email before completing sign-in             |

### Google Sign-In

Users click **Sign in with Google** in the auth modal. Firebase opens a
Google OAuth popup, the user selects their Google account, and they are
signed in. Requires Step 3b to be enabled.

### Linking Multiple Sign-In Methods

A single Firebase account (and thus a single set of puzzle data) can be
signed in to using multiple methods. For example, a user can sign in via
email link AND Google — both will map to the same Firebase UID and the
same Firestore data.

To connect additional sign-in methods to an existing account:

1. Sign in with your existing method.
2. Go to **Options → ☁️ Account → ✏️ Edit Username / Email**.
3. Under **Connected accounts**, click **Connect** next to Google.
4. Complete the OAuth flow.

Once connected, the user can sign in with either method and always access
the same data.

> **What if I try to sign in with Google but I already have an email link
> account with the same email?**
> Firebase's default "one account per email address" setting will return an
> error: _"An account already exists with this email using a different
> sign-in method."_ Sign in with your email link first, then connect Google
> from your profile settings.

## How Data Is Stored

Submissions are stored in Firestore at:

```text
users/{userId}/submissions/{YYYY-MM-DD}
```

Each document contains `score`, `walls`, `timestamp`, and `time` — the same data
that is stored in the local cookie.

In-progress timer state is stored at:

```text
users/{userId}/submissions/timer_{YYYY-MM-DD}
```

User settings (pet type, hint mode) are stored at:

```text
users/{userId}/submissions/settings
```

## How Sync Works

| Event                       | What happens                                                                                                                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sign in**                 | Cloud submissions are downloaded and merged into local cookies (cloud wins on conflict). Cloud settings overwrite local settings. Cloud timer states are merged by taking the highest elapsed time. Local-only data is then uploaded. |
| **Submit a puzzle**         | Saved to cookie AND uploaded to Firestore immediately.                                                                                                                                                                                |
| **Timer auto-save**         | Elapsed seconds saved to cookie AND Firestore every 30 s and on every pause (including tab hide / window close).                                                                                                                      |
| **Change pet or hint mode** | Saved to cookie AND uploaded to Firestore immediately.                                                                                                                                                                                |
| **Realtime update**         | Changes from other signed-in devices are pushed to cookies automatically.                                                                                                                                                             |
| **Sign out**                | Realtime listener stops. Local cookies remain untouched.                                                                                                                                                                              |

## Conflict Resolution

When local cookie data and Firestore hold different values for the same key,
the following rules apply:

| Data type                                | Rule                     | Rationale                                                                                                                              |
| ---------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Submissions** (`YYYY-MM-DD`)           | **Cloud wins**           | The cloud is the authoritative record of completed puzzles. If you solved a puzzle offline and then log in, the cloud version is kept. |
| **Settings** (`selectedPet`, `hintMode`) | **Cloud wins**           | The cloud holds the user's most recently saved preference from any signed-in device.                                                   |
| **Timer** (`timer_YYYY-MM-DD`)           | **Highest elapsed wins** | The timer should never go backwards. Whichever device has made the most progress keeps that value so no elapsed time is ever lost.     |

> **Offline play then sign-in example:** You solve three puzzles while offline.
> When you sign in, the cloud's submissions for those dates are applied first
> (cloud wins on conflict). Any of your offline puzzles for dates that are
> **not** already in the cloud are then uploaded. If the cloud already had a
> submission for the same date, the cloud version is kept and your local offline
> solve for that date is replaced with the cloud version.

## Running Without Cloud Sync

If you fork this repository and do **not** want cloud sync, simply skip Step 8
(do not add the secrets). The `apiKey` in `js/site-config.js` will remain
empty after deployment and the app will behave exactly as before — all data
stays in local cookies and the cloud sync UI is hidden.

## Firebase Free Tier Limits

Firebase's Spark (free) plan is sufficient for normal use:

| Resource             | Free quota   |
| -------------------- | ------------ |
| Firestore reads      | 50,000 / day |
| Firestore writes     | 20,000 / day |
| Firestore storage    | 1 GiB        |
| Authentication users | Unlimited    |

A typical user saving a few submissions per day will use a handful of
reads and writes — far below the free limits.

## Troubleshooting

### "☁️ Sign In to Sync" button does not appear

The `apiKey` was not injected at deploy time. Verify that all four
`FIREBASE_*` repository secrets are set (Step 8) and that the
**Deploy static content to Pages** workflow ran after you added them.

### "This sign-in method is not enabled in the Firebase console"

Return to Step 3 and enable the relevant provider:

- **Email link** — toggle on both **Email/Password** and **Email link
  (passwordless sign-in)** and click **Save** (Step 3a).
- **Google** — toggle on **Google** and click **Save** (Step 3b).

### "Sign-in cancelled" (popup closed immediately)

The user closed the popup before completing sign-in. This is not an error.

### "The sign-in popup was blocked"

The browser blocked the OAuth popup. Ask the user to allow popups for the
site and try again, or use the email link method instead.

### "An account already exists with this email using a different sign-in method"

The user tried to sign in with Google but a Firebase account with the
same email already exists via email link (or vice versa). Fix:

1. Sign in with the original method (e.g. email link).
2. Go to **Options → ☁️ Account → ✏️ Edit Username / Email**.
3. Connect Google under **Connected accounts**.

### "Firestore permission denied" or "⚠️ Sync error"

Your security rules are still set to deny all access. Return to Step 5.

### "Firestore database not found or not ready"

You skipped Step 4. Go to **Build → Firestore Database** and create a
database.

### "This domain is not authorised to use Firebase" or "requests-from-referer-…-are-blocked"

Three separate settings must all include the domain you are signing in from:

1. **OAuth 2.0 Client ID authorized origins** (Step 3b) — add the bare
   origin, e.g. `https://www.your-domain.com` and `http://localhost:8080`.
2. **Google Cloud Console API key referrers** (Step 6) — add the URL pattern
   with a trailing slash and wildcard, e.g. `https://www.your-domain.com/*`
   and `http://localhost:8080/*`.
3. **Firebase Authentication → Settings → Authorised Domains** (Step 7) —
   add the bare domain, e.g. `www.your-domain.com` and `localhost`.

> **Why the `/*` pattern matters:** Modern browsers send only the bare
> origin (`https://www.your-domain.com`) as the `Referer` header for
> cross-origin requests by default. Google Cloud Console's `/*` wildcard
> requires a `/` after the domain, so `https://www.your-domain.com/*` does
> **not** match the bare origin `https://www.your-domain.com`. The
> `<meta name="referrer" content="no-referrer-when-downgrade">` tag in
> `index.html` overrides this and ensures the full URL (including the
> trailing `/`) is sent, so the `/*` patterns work correctly. If you fork
> this repository, do not remove that meta tag.

After saving all settings, wait up to five minutes for changes to
propagate, then try again.

### Google sign-in popup shows "Error 400: redirect_uri_mismatch" or "origin_mismatch"

The OAuth 2.0 Client ID that Firebase created does not have your domain in
its **Authorized JavaScript origins** list. Return to Step 3b and add the
exact origin (e.g. `https://YOUR_USERNAME.github.io`) to the Client ID in
the Google Cloud Console.

### Firebase works locally but not on GitHub Pages (or custom domain)

Check all three settings — OAuth 2.0 Client ID origins (Step 3b), API key
referrers (Step 6), and Firebase Authentication authorised domains (Step 7)
— all must list every domain the app is served from, including your custom
domain if you use one.

## Additional Resources

- [Firebase Console](https://console.firebase.google.com)
- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Pricing (Spark plan)](https://firebase.google.com/pricing)
