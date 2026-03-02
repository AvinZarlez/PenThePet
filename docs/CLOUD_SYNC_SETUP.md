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

> **Note:** Firebase API keys are **not secret**. They identify your
> project but all access is controlled by Authentication and Security Rules.
> It is safe to commit `firebase-config.js` with your real values.

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

No additional configuration is needed for Google sign-in on the web. Users
click **Sign in with Google** and are taken through Google's standard OAuth
popup flow.

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
5. Add every domain the app is served from. Examples:

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

   Add one referrer per line. Replace the examples with your actual domains.

6. Click **Save**.

This means even if someone forks the repo and deploys it, their site will
be on a different domain and Firebase will reject their requests.

> **Important:** After adding or changing referrers, wait up to five minutes
> for the changes to propagate before testing.
>
> ⚠️ **Two separate settings — both are required.**
> Step 6 (Google Cloud Console) and Step 7 (Firebase console) are completely
> separate services. **Adding a domain in Firebase Authentication does NOT
> update Google Cloud Console, and vice versa.** If you only complete one of
> these steps you will still see the "requests-from-referer-…-are-blocked"
> error. Every domain the app is served from must be registered in **both**
> places.

### Step 7 — Authorise Your Domain in Firebase Authentication

Firebase Authentication maintains its own list of allowed domains, separate
from the API key restrictions above. Any domain the app is served from must
appear in this list or sign-in will be blocked.

1. In the Firebase console left sidebar, click **Build → Authentication**.
2. Click the **Settings** tab.
3. Under **Authorised domains**, click **Add domain**.
4. Add every domain the app is served from, for example:
   - `YOUR_USERNAME.github.io`
   - `YOUR_CUSTOM_DOMAIN` *(e.g. `www.your-domain.com`, if applicable)*
   - `localhost` *(for local development)*
5. Click **Add** after each domain.

> **Note:** `firebaseapp.com` and `localhost` are pre-authorised by default.
> You only need to add domains that are not already in the list.

### Step 8 — Add Your Config to the Repository

Open `js/firebase-config.js` in your fork and fill in the values from Step 2:

```js
const FIREBASE_CONFIG = {
    apiKey: 'AIzaSy...',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project',
    storageBucket: 'your-project.firebasestorage.app',
    messagingSenderId: '1234567890',
    appId: '1:1234567890:web:abcdef'
};
```

Commit and push. The app detects that `apiKey` is non-empty and
automatically enables the cloud sync UI.

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

| Step | What happens |
|---|---|
| User requests a link | `sendSignInLinkToEmail()` is called; Firebase emails a one-time magic link; the email is saved in `localStorage` |
| User clicks the link | Browser opens the app URL with a sign-in token in the query string |
| App loads | `init()` detects the token, reads the saved email, calls `signInWithEmailLink()`, then cleans the URL |
| Different device | If the link is opened on a different device, the app prompts for the email before completing sign-in |

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
> error: *"An account already exists with this email using a different
> sign-in method."* Sign in with your email link first, then connect Google
> from your profile settings.

## How Data Is Stored

Submissions are stored in Firestore at:

```text
users/{userId}/submissions/{YYYY-MM-DD}
```

Each document contains `score`, `walls`, and `timestamp` — the same data
that is stored in the local cookie.

User settings (pet type, hint mode) are stored at:

```text
users/{userId}/submissions/settings
```

## How Sync Works

| Event | What happens |
|---|---|
| **Sign in** | Cloud submissions are downloaded and merged into local cookies. Local-only submissions are uploaded to the cloud. |
| **Submit a puzzle** | Saved to cookie AND uploaded to Firestore. |
| **Realtime update** | Changes from other signed-in devices are pushed to cookies automatically. |
| **Sign out** | Realtime listener stops. Local cookies remain untouched. |

## Running Without Cloud Sync

If you fork this repository and do **not** want cloud sync, simply leave
`js/firebase-config.js` unchanged (with an empty `apiKey`). The app will
behave exactly as before — all data stays in local cookies and the cloud
sync UI is hidden.

## Firebase Free Tier Limits

Firebase's Spark (free) plan is sufficient for normal use:

| Resource | Free quota |
|---|---|
| Firestore reads | 50,000 / day |
| Firestore writes | 20,000 / day |
| Firestore storage | 1 GiB |
| Authentication users | Unlimited |

A typical user saving a few submissions per day will use a handful of
reads and writes — far below the free limits.

## Troubleshooting

### "☁️ Sign In to Sync" button does not appear

The `apiKey` in `js/firebase-config.js` is empty. Complete Step 8.

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

Two separate settings must both include the domain you are signing in from:

1. **Google Cloud Console API key referrers** (Step 6) — add the URL pattern
   with a trailing slash and wildcard, e.g. `https://www.your-domain.com/*`
   and `http://localhost:8080/*`.
2. **Firebase Authentication → Settings → Authorised Domains** (Step 7) —
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

After saving both settings, wait up to five minutes for changes to
propagate, then try again.

### Firebase works locally but not on GitHub Pages (or custom domain)

Check both the API key referrers (Step 6) and the Firebase Authentication
authorised domains (Step 7) — both must list every domain the app is served
from, including your custom domain if you use one.

## Additional Resources

- [Firebase Console](https://console.firebase.google.com)
- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Pricing (Spark plan)](https://firebase.google.com/pricing)
