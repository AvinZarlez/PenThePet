# Pen the Pet: How I Built My Own Daily Puzzle Game

*A personal project, a kid's artwork, and way too much time thinking about optimal wall placement.*

---

## The Game That Pushed Me Over the Edge

A while back I came across a browser-based puzzle game that was, conceptually, exactly the kind of thing I enjoy. A little spatial logic challenge, a new puzzle every day, nothing you needed to install. The core idea was great. But the execution left me wanting, and honestly, the person behind the project wasn't someone I was particularly interested in supporting. So instead of complaining about it, I did what any reasonable developer would do: I built my own version.

That decision turned into [Pen the Pet](https://avinzarlez.github.io/penthepet/) — a free, browser-based daily logic puzzle where you build walls to pen in your pet. New puzzle every day. No app to install. No account required (though there is an optional sync feature if you want to carry your progress across devices). Just open it and play.

---

## How It Works

The rules are simple enough to explain in a minute, but the puzzle itself takes a bit more thought.

You're given a grid — somewhere between 7×7 and 17×17 tiles — and your pet starts in the middle at a little house tile. The grid has grass, water, some stars, maybe a beehive or two, and the occasional hole. You have a limited number of walls to place.

Your job is to use those walls (and the terrain itself) to completely enclose your pet — to build a pen that blocks every path to the edge of the map. When you succeed, the enclosed area lights up, and your score is the total area you managed to fence in.

The tricky part: you want the *biggest* possible pen, not just any pen. Stars inside your enclosure give bonus points. Beehives subtract. Holes block movement but can be filled with one of your wall placements if it helps. Water can't be crossed or built on, so it acts as a natural barrier — which can work for you or against you.

You only get one submission per puzzle, so you have to commit. Plan it out, click submit, and see how you stack up against the optimal solution.

That optimal solution, by the way, is mathematically *proven* optimal — not an approximation, not a heuristic. More on that later.

---

## Making a Game Again

I haven't made a proper game in a while. I've done plenty of software projects, web apps, tools, the usual professional stuff. But games have a different feel to them. There's something satisfying about a system where all the rules interact in interesting ways and you get to watch someone figure it out.

Getting back to game development felt good.

I'll be upfront: I used AI coding agents to do the majority of the actual coding on this project. It's 2026, and I'd be leaving performance on the table if I didn't. But here's the thing — working with AI agents is not "describe what you want and receive finished code." Anyone who tells you it is has either never tried it, or they're working on something much simpler than a complete interactive game.

The real workflow was more like pair programming with a collaborator who is extremely fast, occasionally brilliant, and periodically very confidently wrong. I'd describe what I needed. The agent would produce something. I'd review it line by line, catch the misunderstandings and the subtle bugs, correct the architecture when it went sideways, and push forward. Then repeat.

My background in game programming was essential here. Knowing *how* to structure a game — the separation between data, logic, and rendering; how pathfinding should work; what a clean tile system looks like — meant I could recognize when the AI was heading somewhere reasonable versus when it was building a mess that would fall apart in three weeks. I knew the right questions to ask and when to push back.

And the AI did get things wrong. Plenty of times. A function that looked right but had an off-by-one. An architecture decision that would have made adding new tile types a nightmare. Edge cases in the pathfinding that would have silently produced wrong answers. The kind of bugs that wouldn't show up until you were several steps deeper into the project.

What this whole experience taught me is that working with AI agents effectively is genuinely a skill. Knowing how to write a prompt that's specific enough to get something useful, but not so rigid that the agent stops thinking — that takes practice. Knowing how much context to give. Knowing when to break a problem into smaller pieces versus when to describe the whole thing. The gap between a bad AI collaboration and a good one is real, and it's mostly on the human side.

---

## My Kid Made the Art

One of my favorite parts of this project has nothing to do with the code.

My daughter Zafira made the art assets. The little wooden fence texture for the wall tiles. The doghouse for the home tile. The beehive. The hole sprites. All of it.

That ended up making the whole thing feel more personal than I expected. The game looks exactly like something a parent and kid built together, which is precisely what it is. It gives it a character you don't get from asset store downloads.

If you've played the game, you've seen her work. I think it holds up.

---

## Now We Play It Every Day

Here's the thing I didn't entirely predict: the game actually works. Like, as a habit, as a daily ritual thing.

I'm playing it every day with friends now. We share our scores, compare approaches, complain when we miss the optimal by one tile. It's become a little morning routine, the same way some people do Wordle or their word-of-the-day crossword. That's all I wanted out of it, honestly — a small, satisfying thing you can do in five minutes before the day starts.

The wall budget is tight enough that you can't just brute-force it. You have to actually think about which routes the pet might escape through, how to use the water as a natural wall, whether it's worth spending a wall to fill a hole versus blocking an open corridor. But it's not so hard that you feel stuck. Most puzzles have a satisfying "oh, I see it" moment.

---

## How the Levels Are Made

Every level in Pen the Pet is pre-generated offline using a Python-based math solver. This is the part I find genuinely interesting to talk about.

The solver uses a technique called Mixed Integer Linear Programming — essentially, it formulates the puzzle as a math problem with constraints and objectives, and then proves what the maximum achievable score actually is. Not "probably close to optimal." Actually optimal, with a mathematical guarantee. That's what the game shows you as the target.

All the maps are stored in JSON files in the repository. When you open the game, it fetches the right day's map, renders it in the browser, and you play. No server needed.

The generation itself is constrained: the water and terrain layout is randomized, then the solver figures out the best possible wall placement given that terrain. Maps get validated against a bunch of quality checks — things like "is there actually a meaningful challenge here" and "are the tiles balanced" — before they're considered usable. Maps that don't pass don't make it into the game.

As for the level editor: I have the start of one. You can load custom maps via URL parameters, which means you can technically share hand-crafted puzzles with someone. The visual drag-and-drop editor is something I want to build properly at some point. It's on the list.

---

## It Lives on GitHub Pages (Static, Simple, Free)

The game is entirely a static website. There's no server, no database, no backend to maintain. You open a URL and the JavaScript in your browser does everything — loads the map, runs the puzzle logic, checks if your pet is penned, calculates your score. All of it, client-side.

It's hosted on GitHub Pages, which means the hosting is free and the source code is right there in the same repository. Every map, every line of JavaScript, every asset — publicly visible at [github.com/AvinZarlez/penthepet](https://github.com/AvinZarlez/penthepet).

There's no framework involved either. No React, no Vue, no build step. Just HTML, CSS, and vanilla JavaScript. I wanted something I could hand to someone and have them read from top to bottom without needing to understand a build toolchain first. That constraint also made the AI collaboration more straightforward — the code is what it is, no magic generated files to wade through.

There is an optional Firebase integration if you want cross-device sync or analytics, but it's entirely opt-in and works on the free tier. The game works perfectly without it.

---

## It's Open Source — Fork It, Build On It

The MIT license means you can take everything here and do whatever you want with it.

If you want to run your own daily puzzle game, the architecture is set up to be reusable. The tile system is designed so that adding new tile types takes one entry in a data file — everything else derives from that automatically. The scoring logic is cleanly separated so you can swap it out entirely for a different ruleset. The map generation runs offline and could be adapted for completely different grid games.

I'm genuinely hoping this project becomes a starting point for other things. Someone could swap in a different theme — a maze, a garden, a castle defense — and have a working daily puzzle game without reinventing much of the underlying infrastructure.

Beyond forks, the project has proper docs, a contribution guide, and a working test suite, so if you find a bug or want to add a feature, there's a real path to doing that. Open an issue, submit a pull request, see what happens.

---

## What's Next

I'll keep adding maps. The solver is good at its job and generating new puzzles is mostly automated at this point. I want to expand the level diversity — more unusual terrain shapes, more varied tile combinations — and keep refining the difficulty curve.

The visual level editor is the thing I'm most interested in building next. I want to be able to hand-craft a map, tweak it until it feels right, and share it with a URL. The pieces are mostly there; it needs to be wrapped in something that doesn't require editing JSON by hand.

And longer term, yeah — I'll probably use this as a template for future GitHub Pages games. The static site setup, the daily puzzle loop, the offline generation pipeline: these patterns work, and I'd rather build on something proven than start from scratch every time.

---

## Play It

[avinzarlez.github.io/penthepet](https://avinzarlez.github.io/penthepet/)

New puzzle every day. Free, no install, no account needed.

If you're curious about how it's built or want to make your own version: [github.com/AvinZarlez/penthepet](https://github.com/AvinZarlez/penthepet)

---

*Made by Avin Zarlez. Art by Zafira Zarlez.*
