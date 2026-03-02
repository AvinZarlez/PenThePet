# History of Pen the Pet Project

So there was this daily puzzle game I really liked playing. Wouldn't say I was a fan of who made it though. And at some point I just thought, why not make my own version? Not a throwaway demo — something I'd actually want to use and share with friends. I had ideas for features the original didn't have, and I figured this was my chance to just build exactly what I wanted.

I went with the simplest possible tech stack: plain HTML5 and JavaScript, hosted on GitHub Pages. No frameworks, no build tools, nothing fancy. It needed to work on phones and desktops, and it needed a fresh puzzle every day. The game is [PenThePet](https://avinzarlez.github.io/PenThePet/) — you get a grid of grass and water tiles with a pet in the middle, and you place walls to fence the pet in. Maximize the enclosed area with a limited number of walls. Simple concept, fun to play.

The twist was that I wanted to build most of it using GitHub Copilot. I was curious how far AI-assisted development could actually go on something real, not just a tutorial project.

## What went well

The early stuff came together surprisingly fast. I'd describe what I wanted — "make a grid class with these methods" or "build a menu with level selection" — and get back clean, working code. Concrete requests with clear specs just worked. The initial architecture, the game mechanics, score tracking, the emoji picker, all of that was generated from pretty straightforward descriptions.

Standard algorithms were a total sweet spot. I asked for a breadth-first search to check whether the pet could escape the grid and it was correct on the first try. Makes sense — BFS has been implemented a million times, the AI knows exactly what that looks like.

Test generation was probably the single most useful thing. I'd point it at a class and say "write comprehensive tests" and get back dozens of tests covering edge cases I wouldn't have thought of myself. Empty grids, impossible configurations, weird boundary conditions. Those tests ended up catching bugs that absolutely would have shipped otherwise, so I'm really glad I had them.

Once the codebase had some established patterns — how modals worked, how settings got stored, how rendering happened — adding new features got easier and easier. The AI could just follow existing conventions. Each feature built on the last.

## Where it struggled

Then came puzzle generation, and that's where things got rough.

For the daily puzzles to work, I needed to pre-generate maps with calculated optimal scores. That's a combinatorial optimization problem — given a wall budget, find the placement that maximizes enclosed area. There are billions of possible placements even on modest grids.

I asked Copilot to build a solver. First attempt was a greedy algorithm, which is just the wrong approach for this kind of problem. Then it tried an exhaustive search that stored all the combinations in memory and crashed the browser. Then it gave me a version that *minimized* the area instead of *maximizing* it. Literally one comparison operator pointing the wrong way — `<` instead of `>`. That bug took days to find because the code looked completely fine. It ran, it produced output, it just... produced the wrong output.

That's the kind of mistake that's really hard to catch. No error, no crash. I only found it because I played the puzzles and thought "these feel too easy." That gut feeling — does this match what I intended? — is something AI just doesn't have.

The AI also never once suggested that maybe JavaScript wasn't the right tool for optimization problems. I eventually moved puzzle generation to Python with a proper optimization library, and it solved everything in milliseconds. That architectural call was entirely mine.

The other recurring issue was code cleanliness. Every few features, I'd find the same utility function copy-pasted into three files, or multiple slightly different implementations of the same logic. AI solves whatever's right in front of it without thinking about whether there's already something that does this elsewhere. Left alone, the codebase drifts toward working-but-messy pretty fast. I had to do periodic rounds of cleanup and refactoring just to keep things manageable.

## How I'd sum it up

The game works! Friends play it daily, it runs on everything, I'm happy with it. Building it was genuinely fun. But "built with AI" definitely doesn't mean "built without effort."

I made every architectural decision. I caught every subtle bug. I did every round of refactoring and cleanup. The AI made executing those decisions faster — sometimes really dramatically faster — but it wasn't the one making them.

If I had advice for someone trying something like this: be specific with your prompts, write down your project constraints somewhere the AI can reference them, test everything because AI-generated code absolutely needs a safety net, plan for regular refactoring because AI adds code but doesn't simplify it, and know when to just take over yourself. Some problems — algorithm design, technology choices, "does this feel right" — those aren't things to outsource.

It was a fun experiment. AI is a genuinely useful coding tool. But the interesting parts of building software are still the parts you have to do yourself.

[Play the game](https://avinzarlez.github.io/PenThePet/) · [View the source](https://github.com/AvinZarlez/PenThePet)

---

**See also:** [docs/README.md](README.md) · [ARCHITECTURE.md](ARCHITECTURE.md)
