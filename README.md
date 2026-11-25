# Sizzle Station

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/dap204/cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/dap204/cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A cozy diner rush: read the tickets on the order board, chop lettuce and
tomato on the board, grill patties until golden (never burnt), fry the fries,
stack every dish on the assembly plate and ring the bell to serve before
patience runs out. Survive the 2:30 shift — quick serves and combos pay
extra, wrong plates and walk-outs cost you.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: `game/index.html` and its ES modules only.

## Play

- **Mouse:** click an ingredient bin (or press `1`–`6`), click the grill,
  fryer and chopping board to work them, click the bell to serve.
- **Keyboard:** `1`–`6` ingredients · `Space` serve · `T` trash the plate ·
  `P` pause · `M` mute · `R` restart after the shift.
- **Recipes:** Classic Burger, Cheesy Melt, Garden Salad, Fries Basket and
  the Deluxe Stack — each ticket shows exactly what it needs.
- **Watch out:** patties and fries burn if you leave them on the heat, and
  tickets walk out when their patience bar empties.

Screenshots are real renders of the game (`?shot=start|play|assemble|serve`,
seeded, see `shots.json`). All art is drawn in code and all sounds are
synthesized with WebAudio — nothing is copied from another game.

---

<sub>Entered on [make.fun](https://make.fun/?ref=3554s5p5&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
