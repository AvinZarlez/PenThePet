# Privacy Policy

_Last updated: March 2026_

## Who We Are

Pen the Pet is a free, browser-based daily logic puzzle game created and operated by
[Avin Zarlez](https://www.AvinZarlez.com). The game is hosted on GitHub Pages at
[avinzarlez.github.io/penthepet](https://avinzarlez.github.io/penthepet/).

## What Data We Collect

### Analytics (Anonymous, No PII)

If you play the game on the official deployment, we use **Firebase Analytics** to
collect a small set of anonymous, aggregated usage statistics. These events contain:

| What we record                                       | Why                                       |
| ---------------------------------------------------- | ----------------------------------------- |
| Which puzzle date was opened                         | Know which puzzles are being played       |
| Whether the puzzle was already completed when opened | Understand return-visit behaviour         |
| Submitted score and optimal score                    | Measure difficulty and score distribution |
| Number of walls placed                               | Understand player strategy                |
| Time taken to submit (seconds)                       | Understand how long puzzles take          |
| Whether the solution was perfect                     | Track perfect-completion rate             |
| Whether the "check if optimal" hint was used         | Signal puzzle difficulty                  |
| Whether the "reveal target score" hint was used      | Signal puzzle difficulty                  |
| Unhandled JavaScript error message and source file   | Detect bugs in production                 |

**No personally-identifiable information (PII) is ever logged.** There are no user
IDs, email addresses, IP addresses, names, or device fingerprints in any analytics
event.

Analytics events are stored in Google's Firebase servers in accordance with
[Google's Privacy Policy](https://policies.google.com/privacy).

Because analytics data is fully anonymous (no user ID is attached), it does not qualify as personal data and cannot be attributed to or deleted for a specific individual.

### Cloud Sync (Optional, Logged-In Users Only)

Cloud sync is an **opt-in feature**. If you choose to sign in:

- We store your puzzle submissions (score, walls, time, hints used) and settings
  (pet choice, hint preferences, language) in **Firebase Firestore**.
- Data is stored under your Firebase user account and is **private — only you can
  read or write it**.
- Your email address is used by Firebase for authentication only and is not visible
  to us in any analytics or log data.
- You can delete all your cloud data at any time from the Options menu
  (Options → ☁️ Account → Delete all cloud data).

### Cookies (Local Storage Only)

The game uses browser **cookies** to save your progress locally — puzzle
submissions, timer state, settings — without any server communication. These
cookies:

- Never leave your browser unless you opt in to cloud sync.
- Are scoped to the game's origin (they cannot be read by other websites).
- Are not advertising or tracking cookies.
- Expire after 1 year or when you clear your browser data.

## What We Do Not Collect

- We do **not** collect your name, email (outside of optional sign-in), location,
  or any other personal details.
- We do **not** sell, rent, or share any data with third parties for commercial
  purposes.
- We do **not** use advertising networks or cross-site tracking.
- We do **not** use third-party analytics beyond Firebase (a Google product).

## Third-Party Services

We use the following third-party services:

| Service                          | Purpose                    | Privacy Policy                                                                                                                              |
| -------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Firebase Analytics (Google)      | Anonymous usage statistics | [policies.google.com/privacy](https://policies.google.com/privacy)                                                                          |
| Firebase Authentication (Google) | Optional account sign-in   | [policies.google.com/privacy](https://policies.google.com/privacy)                                                                          |
| Firebase Firestore (Google)      | Optional cross-device sync | [policies.google.com/privacy](https://policies.google.com/privacy)                                                                          |
| GitHub Pages                     | Hosting                    | [docs.github.com/en/site-policy/privacy-policies](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement) |

## Changes to This Policy

If we make significant changes to how we collect or use data, we will update this
file and the "Last updated" date at the top.

## Contact

Questions about this privacy policy? Open an issue on
[GitHub](https://github.com/AvinZarlez/penthepet/issues) or contact us via
[AvinZarlez.com](https://www.AvinZarlez.com).
