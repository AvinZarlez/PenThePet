# 🐕 PenThePet

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://avinzarlez.github.io/penthepet)
[![CI/CD Pipeline](https://github.com/AvinZarlez/penthepet/actions/workflows/test.yml/badge.svg)](https://github.com/AvinZarlez/penthepet/actions/workflows/test.yml)
[![Deploy to GitHub Pages](https://github.com/AvinZarlez/penthepet/actions/workflows/static.yml/badge.svg)](https://github.com/AvinZarlez/penthepet/actions/workflows/static.yml)
[![Generate Daily Map](https://github.com/AvinZarlez/penthepet/actions/workflows/generate-daily-map.yml/badge.svg)](https://github.com/AvinZarlez/penthepet/actions/workflows/generate-daily-map.yml)
[![Add map](https://github.com/AvinZarlez/penthepet/actions/workflows/add-map.yml/badge.svg)](https://github.com/AvinZarlez/penthepet/actions/workflows/add-map.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**A daily logic puzzle — fence in your pet!** PenThePet is a free, browser-based puzzle game where you strategically place walls to create the largest enclosed area for your pet. A new puzzle every day, no install required.

---

## ⚡ Quick Start

1. Open the [live game](https://avinzarlez.github.io/penthepet/) — no install, no sign-in required.
2. Click on grass tiles to place walls and pen in your pet.
3. Try to match or beat the optimal enclosed area!

---

## 🎮 How to Play

- **Objective:** Build walls to pen in your pet. The goal is to create the largest enclosed area possible.
- **Click grass tiles** (green) to place walls. Click walls to remove them.
- **Water tiles** (blue) are impassable and cannot be clicked.
- Your pet starts at the **home tile** (🏠) and you have a limited number of walls.
- When your pet is penned (can't reach the edge), your area size is shown — try to maximize it!
- **You can only submit once per puzzle** — plan carefully!

## ✨ Features

- **Daily Puzzles** — A new unique map every day
- **Level Selector** — Play any previous day's puzzle
- **Emoji Pets** — Choose your favorite animal emoji
- **Hint System** — Three modes: disabled, check optimal, or reveal target
- **Mobile-Friendly** — Responsive design for any screen size
- **Keyboard Navigation** — Full accessibility support
- **Settings Persistence** — Preferences saved automatically in cookies

## ⚙️ Options

Access these from the **☰ Menu → Options**:

| Option           | Description                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Pet Type**     | Choose from list of animal emojis                                                                                                                     |
| **Hint Mode**    | _Disabled_ — no hints. _Check Optimal_ — area turns yellow/green based on goal. _Reveal Target_ — shows your area vs. the goal (e.g., "8 / 11"). |
| **Timezone**     | Select your local timezone so the daily puzzle resets at midnight your time                                                                      |
| **Language**     | Switch between supported UI languages (English, Español)                                                                                         |
| **Account**      | Sign in with Google or email to sync your puzzle history across devices (optional, requires Firebase setup)                                      |
| **Debug Mode**   | Shows developer tools at the bottom of the page                                                                                                  |

## 🧱 Local Level Editor

Create and validate custom maps locally using the same solver + validator logic:

```bash
npm install
python3 -m venv .venv
source .venv/bin/activate
pip install -r scripts/solver/requirements.txt
npm run level-editor
# open http://localhost:8787/
```

The editor auto-saves draft state every 30 seconds in a cookie and returns a map code plus playable live-game URL once solved.

---

## 📚 Documentation

For developers, contributors, and AI agents — see the **[docs/](docs/README.md)** folder for all project documentation.

## 🤝 Contributing

Found a bug or have a feature idea? [Open an issue](https://github.com/AvinZarlez/penthepet/issues) — all feedback is welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to report bugs, request features, or contribute code.

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.

## 🙏 Credits

Made by [Avin Zarlez](https://www.AvinZarlez.com).

Additional art assets by Zafira Zarlez.
