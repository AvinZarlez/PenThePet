# Building a Daily Puzzle Game: An Experiment in AI-Assisted Development

*What I learned building a browser game with GitHub Copilot — the good, the bad, and the parts where I had to step in myself.*

---

## Why Build a Game?

There was a daily puzzle game I enjoyed playing, but I wasn't thrilled with the person who made it. I figured: how hard could it be to make my own version? Not just a throwaway demo, but something I'd actually want to use and share with friends. I also had ideas for features the original lacked, so this was my chance to build something custom.

I decided on a simple tech stack: pure HTML5 and JavaScript, hosted on GitHub Pages. No frameworks, no build tools — just code that runs directly in the browser. The game needed to work on phones and desktops alike, and it needed to generate a fresh puzzle every day.

The game, PenThePet, is a grid-based logic puzzle. You're given a grid of grass and water tiles with a pet sitting at the center. Your goal is to place a limited number of walls to fence the pet in — to "pen" it — maximizing the enclosed area. Think of it as a spatial optimization puzzle with a cute twist.

I decided to try building most of it using GitHub Copilot as my primary coding tool. I wanted to see how far AI-assisted development could actually go on a real project — not a tutorial exercise, but something that needed to work reliably for real users.

---

## What Went Smoothly

The initial scaffolding came together fast. I described the game structure to Copilot and it generated a clean modular architecture: separate files for configuration, tile definitions, grid logic, and the game controller. ES6 classes, proper separation of concerns, a centralized config object. The kind of boilerplate that's tedious to write by hand but well within what AI handles comfortably.

Game mechanics followed quickly. Wall placement with a counter, click-to-remove for repositioning walls, keyboard navigation with arrow keys and tab support, accessibility attributes. Copilot produced working implementations for all of these with relatively little back-and-forth. The core pathfinding — a breadth-first search to determine whether the pet can reach the edge of the grid — was correct on the first try. Standard algorithms are squarely in AI's wheelhouse.

The UI features stacked up nicely too. A menu system with level selection, score tracking with localStorage persistence, customizable pet emojis, hint modes. Once the architecture was established and documented, Copilot could follow existing patterns to add new features without much trouble. Each feature built on the last, and the codebase stayed coherent — for a while.

Test generation was another bright spot. Copilot produced hundreds of unit tests covering edge cases I might not have thought to write myself: maps that are all water, grids with odd dimensions, impossible configurations. The tests followed good practices — isolated, descriptive, no shared state. Having thorough test coverage turned out to be critical later, for reasons I didn't anticipate.

---

## Where Things Went Wrong

Then came puzzle generation, and everything got harder.

For the game to work as a daily puzzle, I needed pre-generated maps with calculated goals — the optimal score a player should aim for. This meant solving a combinatorial optimization problem: given a grid and a wall budget, find the wall placement that maximizes the penned area. With even modest grid sizes, there are billions of possible placements.

I asked Copilot to generate a solver. Its first attempt used a greedy algorithm — place walls one at a time, always picking the locally best option. Simple, fast, and wrong. Greedy doesn't work for this class of problem; you sometimes need to make a move that looks suboptimal now to enable a better configuration later.

The second attempt added an exhaustive search alongside the greedy one, so now there were two solvers with different logic and no clear authority. Then came the most frustrating bug of the project: puzzles were generating with goals of 1 or 2 tiles, making them trivially easy. After days of manual play-testing and code-tracing, I found the problem. The algorithm was *minimizing* the penned area instead of *maximizing* it. A single comparison operator pointed the wrong way — `<` instead of `>`. The code was syntactically perfect, logically coherent, and fundamentally backwards.

This is the kind of mistake AI makes that's genuinely hard to catch. The code runs, it doesn't crash, it produces output that looks plausible at a glance. You only notice something's off when you actually play the game and think, "this doesn't feel right." That intuition — that sense of whether the output matches the intent — is something AI simply doesn't have.

Over the course of the project, puzzle generation went through eight pull requests across two programming languages before it was right. The AI introduced multiple solver implementations that overlapped and conflicted. It tried to store billions of combinations in memory, crashing the browser. It never once suggested that JavaScript might be the wrong language for this kind of optimization problem.

The eventual solution was to move puzzle generation out of the browser entirely. A Python script using PuLP, a proper linear programming library, formulates wall placement as a Mixed Integer Linear Program and solves it optimally in milliseconds. The browser just loads pre-solved puzzles and checks whether the player's walls pen the pet. This was the project's most significant architectural decision, and it was entirely a human call — the AI never hinted that the approach needed rethinking.

---

## The Recurring Pattern

A pattern emerged throughout the project. AI was good at executing well-defined tasks — "build a modal with these fields," "write tests for this class," "implement BFS pathfinding." It struggled with anything that required judgment about how pieces fit together.

Every few PRs, I'd notice the codebase drifting: duplicated utility functions across files, inconsistent patterns, redundant code paths that had accumulated from successive AI-generated changes. Copilot solves the problem in front of it without considering whether the solution conflicts with something three files away. It adds; it doesn't consolidate.

This meant periodic human-driven refactoring was essential. I'd pause feature work, audit the codebase, extract shared utilities, consolidate duplicate logic, and update the documentation. After the big solver refactor (PR #63), a code audit (PR #64) found cookie helpers duplicated in three files, date formatting written twice, and three separate BFS implementations doing the same thing. None of these were bugs exactly — everything worked — but the accumulation of redundancy made the code harder to reason about.

Responsive design was another weak spot. AI-generated CSS worked for standard desktop and landscape phone layouts but missed portrait phones, small tablets, and edge cases around grid sizing. Getting the game to render correctly on a 360px phone screen in portrait mode required multiple rounds of manual testing and iteration that AI couldn't shortcut.

---

## What I Actually Learned

This project was a genuinely fun experiment, and the game works — friends play it, the daily puzzles generate correctly, and it runs on everything from phones to desktops. But the experience left me with a very specific takeaway about AI-assisted development: **it's not a replacement for knowing how to build software.**

The places where AI shined — scaffolding, boilerplate, tests, standard algorithms — are all well-defined tasks with clear specifications and abundant prior examples. The places where it struggled — algorithm design, optimization, architectural coherence, technology selection — are exactly the things that require a software engineer's judgment.

I didn't write most of the code in this project directly. But I made every significant decision: the architecture, the file organization, the choice to use vanilla JavaScript, the decision to move the solver to Python, the consolidation of redundant code, the identification of bugs that only showed up through play-testing. The AI was a tool that made executing those decisions faster. It wasn't the one making them.

A few practical observations:

- **Documentation matters more, not less.** Writing a `copilot-instructions.md` file with project constraints noticeably improved the quality of AI-generated code. AI follows patterns — give it good ones to follow.

- **Testing is non-negotiable.** The test suite caught bugs that would have shipped otherwise, including the maximize/minimize inversion. Without tests, AI mistakes accumulate silently.

- **Expect iteration, not perfection.** First implementations will have issues. The workflow is: generate, review, test, fix, refactor. It's faster than writing from scratch, but it's not hands-off.

- **AI doesn't know when to stop adding.** It will happily generate a new approach to a problem without consolidating the three approaches that already exist. Periodic human review of the overall codebase structure is essential.

---

## The Bottom Line

PenThePet exists because AI-assisted development made it practical for one person to build a complete browser game in under a month. Without Copilot, I probably wouldn't have started the project — the boilerplate alone would have been discouraging.

But the interesting parts of building the game — the parts that made it actually work well — were the parts where I had to step in. Choosing the right algorithm. Catching a bug by noticing the puzzles felt too easy. Deciding to throw away the JavaScript solver and rewrite it in Python. Keeping the codebase clean as it grew.

AI is an interesting tool for software development. With guidance, it can accomplish a surprising amount. Without it, it produces code that works in isolation but doesn't hold together as a system. It's a fun experiment, and I'd do it again — but with clear eyes about what it can and can't do.

The game is open source at [github.com/AvinZarlez/PenThePet](https://github.com/AvinZarlez/PenThePet), and you can play it at [avinzarlez.github.io/PenThePet](https://avinzarlez.github.io/PenThePet).
