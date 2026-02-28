# I Tried Building a Game Almost Entirely with AI. Here's How It Went.

I like daily puzzle games. I didn't like who made the one I was playing. So I decided to build my own — not a quick prototype, but a real game I'd actually use. The catch: I wanted to see how much of it an AI coding assistant could handle.

The result is [PenThePet](https://avinzarlez.github.io/PenThePet/), a daily logic puzzle where you fence in a pet on a grid. It's hosted on GitHub Pages, written in vanilla JavaScript, and works on phones and desktops. I built it in under a month using GitHub Copilot for most of the coding, and the experience taught me a lot about what kinds of instructions get good results from AI — and what kinds don't.

## The Prompts That Worked

**"Build me a thing with these specs."** Concrete, well-defined requests produced the best code. "Create a grid class with a size parameter, a 2D tile array, and methods to get and set tiles" — that kind of prompt came back clean and correct almost every time. The initial game architecture, the menu system, score tracking, emoji picker — all generated from straightforward descriptions of what I wanted.

**"Implement [standard algorithm]."** Asking for a breadth-first search to check if the pet could reach the grid's edge? Perfect on the first try. Well-known algorithms with clear inputs and outputs are AI's sweet spot. There's nothing creative about BFS — it's been implemented a million times, and the AI knows exactly what to produce.

**"Write tests for this."** Honestly, this might be where AI was most useful. I'd point it at a class and say "write comprehensive unit tests," and it would generate dozens of tests covering edge cases I hadn't considered — empty grids, impossible configurations, boundary conditions. The test suite ended up catching several bugs that would have shipped otherwise.

**"Add a feature that follows existing patterns."** Once the codebase had established conventions — how modals worked, how settings were stored, how the grid rendered — Copilot could follow those patterns to build similar features. Each new feature was easier than the last because there were more examples to learn from.

## The Prompts That Didn't

**"Solve this optimization problem."** This is where things fell apart. The game needs pre-generated puzzles with optimal scores, which means solving a combinatorial optimization problem: given a wall budget, find the placement that maximizes the enclosed area. I asked AI to build a solver. It gave me a greedy algorithm (wrong approach for this problem). Then an exhaustive search that stored billions of combinations in memory (crashed the browser). Then a version that *minimized* the area instead of *maximizing* it — a single `<` instead of `>` that took days to find because the code looked completely correct.

The AI never pushed back on the approach or suggested that JavaScript was the wrong tool for this. I eventually had to move puzzle generation to Python using a proper optimization library, which solved it in milliseconds. That decision — "we're using the wrong language for this part" — was entirely mine.

**"Fix the thing that doesn't feel right."** AI can't play-test. The minimize/maximize bug only surfaced because I played the puzzles and thought, "these feel too easy." There was no error, no crash, no failing test at that point — just a vague sense that the output didn't match the intent. That kind of judgment call is entirely human.

**"Keep the codebase clean as you go."** Every few features, I'd find the same utility function copy-pasted into three files, or multiple slightly different implementations of the same logic. AI solves the problem directly in front of it. It doesn't think about whether there's already a function that does this somewhere else. Left unchecked, the codebase slowly drifts toward a mess of working-but-redundant code.

## What I Took Away

The game works. Friends play it daily. I'm happy with how it turned out, and building it was genuinely fun. But "built with AI" doesn't mean "built without effort." I made every architectural decision, caught every subtle bug, and did every round of cleanup and refactoring. The AI made executing those decisions faster — sometimes dramatically so — but it wasn't the one making them.

If you're thinking about trying something like this, my practical advice is:

- **Be specific.** Vague prompts get vague code. The more precisely you describe what you want, the better the result.
- **Write instructions for the AI.** I created a file listing project constraints (no frameworks, use the config object, follow this file structure). It noticeably improved output quality.
- **Test everything.** AI-generated code needs a safety net. The test suite was the single most valuable part of the project.
- **Plan to refactor.** AI adds code, it doesn't simplify it. Budget time for periodic cleanup or the codebase will get unwieldy.
- **Know when to take over.** Some problems need a human. Algorithm design, technology choices, and "does this feel right?" are not things to outsource.

It was a fun experiment. AI is a genuinely useful tool — fast at boilerplate, great at tests, solid on well-known patterns. But the interesting parts of building software are still the parts you have to do yourself.

[Play the game](https://avinzarlez.github.io/PenThePet/) · [View the source](https://github.com/AvinZarlez/PenThePet)
