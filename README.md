# APL-SI

### A readable array notation that people and machines both write.

`status: pre-alpha` · `v0.0.1` · `license: MIT` · `built on: Iverson's idea that notation shapes thought`

---

**APL-SI is a thin layer where ideas are traded in compact array notation instead of paragraphs.**
You write a task in a small, dense, array-shaped line. You can read that line, correct it, and send it back. Fewer tokens in, fewer tokens out, and the human stays in the loop instead of being buried by prose.

It is named after APL, Ken Iverson's 1962 "notation as a tool of thought," because that is the oldest serious attempt at exactly this problem: saying a page of meaning in a line.

## Why this exists

1. Models do their thinking in a shape closer to arrays than to sentences.
2. When they hand the result back, they hand it back as paragraphs, you pay for every word, and you read every word.

So the exchange is wasteful on both ends. APL-SI asks: what if the currency between you and the machine were shape, not prose?

## Before and after

**Today, prose in, prose out:**

> "Take the list of health values, keep only the ones over 500, and total them." Then it answers with a sentence restating all of that.

**APL-SI, shape in, shape out:**

```
hp ← 120 480 900 250
+/ hp
```

Read it as: *store the healths, then sum them.*

## The frozen core (v0)

The frozen core: the glyphs you get, each with a monadic (one-argument) and/or dyadic (two-argument) meaning. The tests in `test/` are the spec: a symbol means exactly what the passing test says it means.

| Glyph | Monadic | Dyadic | Example |
| --- | --- | --- | --- |
| `+` | identity | add | `3 + 4` -> `7` |
| `-` | negate | subtract | `- 5` -> `¯5` |
| `×` | signum | multiply | `2 × 3 + 4` -> `14` |
| `÷` | reciprocal | divide | `12 ÷ 4` -> `3` |
| `⌈` | ceiling | max | `⌈ 2.2` -> `3` |
| `⌊` | floor | min | `⌊ 2.8` -> `2` |
| `|` | magnitude | residue | `3 | 10` -> `1` |
| `*` | exponential | power | `2 * 10` -> `1024` |
| `⍳` | index generator | - | `⍳ 5` -> `1 2 3 4 5` |
| `≢` | tally (count) | - | `≢ 1 2 3` -> `3` |
| `⍴` | shape | reshape | `⍴ 1 2 3` -> `3` · `5 ⍴ 1 2 3` -> `1 2 3 1 2` |
| `,` | ravel | catenate | `1 2 , 3 4` -> `1 2 3 4` · `⍴ , 5` -> `1` |
| `⌷` | - | index (pick) | `2 ⌷ 10 20 30` -> `20` · `¯1 ⌷ 10 20 30` -> `30` |
| `◆` | prefix sums | - | `◆ 1 2 3 4` -> `1 3 6 10` |
| `⎕` | print (the mouth) | - | `⎕ 'hello world'` -> prints it |
| `⍞` | read a line (the ear) | - | `name ← ⍞` -> reads one line as text |

`◆` is the first glyph that is **not** a standard APL primitive. It is ours, which is the point: an example teaches it, a test freezes it. See `docs/adding-a-glyph.md` for the template every new glyph follows.

Plus the `/` operator, which folds a vector with the function on its left: `+/` (sum), `×/` (product), `⌈/` (max), `⌊/` (min), `-/`, `÷/`.

Rules:
- Evaluation is **right to left**: `2 × 3 + 4` is `2 × (3 + 4)`.
- A monadic function takes the **whole expression** on its right.
- Adjacent values strand into a vector: `1 2 3` is a 3-element vector.
- Dyadic scalar functions extend across vectors and broadcast a scalar: `1 2 3 + 10` -> `11 12 13`.
- `¯` marks a negative literal: `¯7` is minus seven.
- `'text'` in single quotes is a string. A string is just an array of characters, so `≢ 'hello world'` counts `11`.
- `⍴` is the shape. Alone it gives a value's shape as an array: `⍴ 1 2 3` is `3`, the one-element array holding the length, and `⍴ 5` is the empty array, because a scalar has rank 0. That is why `≢ ⍴ x` is the rank. With a left argument it **reshapes**, reusing the data cyclically: `5 ⍴ 1 2 3` is `1 2 3 1 2`. Text reshapes as characters. v0 is one-dimensional, so a shape naming two or more axes is refused rather than guessed: that needs the nested arrays the language does not have yet.
- `,` is the join. Alone (ravel) it turns a value into a vector, which is what lets a lone number be joined: `5 , 6` is `5 6`, and `≢ , 5` is `1`. With a left argument (catenate) it joins two values end to end: `1 2 , 3 4` is `1 2 3 4`, and `'ab' , 'cd'` is `abcd`. It pairs with `⍴`: build a pair with `,`, shape it with `⍴`. v0 will not put text and numbers in one array, so a mixed join is refused rather than guessed at.
- `⌷` is the index. It reaches one element back out of an array: `2 ⌷ 10 20 30` is `20`. Positions count from one, the way APL does, so `1 ⌷ v` is the first element; a negative index counts back from the end, so `¯1 ⌷ v` is the last. A string is an array of characters, so `2 ⌷ 'abc'` is `b`. An index outside the array is refused, not wrapped. This is what makes `¯1 ⌷ ◆ 3 1 4 1 5` (the final running total) a single line.
- Evaluating an expression **returns** a value; it does **not** print. Only `⎕` prints. (The REPL echoes values so you can see them. That is the REPL being friendly, not the language speaking.)

## The first words: hello world

To *print* anything, a language needs two things APL-SI did not have: a way to hold **text**, and a way to **speak**. One type and one glyph just added both.

- **Text:** `'hello world'` is a string. In the array spirit, a string is an array of characters, so `≢ 'hello world'` gives `11`.
- **Speaking:** `⎕` (the mouth) prints its argument to the screen and hands it back.

```
⎕ 'hello world'
```

That one line is hello world, APL-SI style. Everything before it was the language *thinking*; this is the first time it *speaks*.

## Words of your own

The glyphs are letters. A **word** is your own function, written in a block and given a name.

```
square ← {⍵×⍵}
square 5          → 25
square 1 2 3 4    → 1 4 9 16
```

Inside the braces, `⍵` is the argument. If you want two arguments, `⍺` is the one on the left:

```
add ← {⍺+⍵}
3 add 4           → 7
1 2 3 add 10      → 11 12 13
```

The point of a word is that words can call words, so simple rules stack into anything:

```
hyp ← {⌈/ ◆ ⍵}
hyp 3 4 6 2       → 15
```

Read that last one as: *prefix-sum the argument, then take the max.* Two ideas from the core, run in a row, wrapped in one new word. That is how a language grows from a handful of letters into a vocabulary.

## The ear: reaching outside

Everything so far happened inside the program. `⎕` was the first effect: it *speaks out*. `⍞` is the second, and it faces the other way: it *listens in*.

```
name ← ⍞
```

`⍞` reads one line from outside and hands it back as text. It takes no argument; it is a value all by itself. That makes it the first thing in APL-SI that is not computable from what is already in front of it, the first point where the program touches the world.

Put the mouth and the ear together and you get a program that can hold a conversation:

```
⎕ 'what is your name?'
name ← ⍞
⎕ 'hello' name
```

Run `npm run echo` with a line typed or piped in, and it answers. That is the whole circle: ask, listen, answer.

The ear returns **text**, so it cannot yet be summed or averaged. Turning heard text into numbers is its own future layer, and it is exactly where the next work goes.

## Reaching in: getting one element

`⍴` and `,` build arrays, but for a while there was no way to pull a single value back *out* of one. A cold-read test found exactly that gap: asked for the last element of a list, a model answered that the notation had no way to reach it.

`⌷` is the index. It takes a position on the left and an array on the right:

```
2 ⌷ 10 20 30      → 20
¯1 ⌷ 10 20 30     → 30
2 ⌷ 'abc'         → b
```

Positions count from one, so `1 ⌷ v` is the first; `¯1 ⌷ v` is the last, counting back from the end. An index outside the array is refused, not wrapped, so an off-by-one is loud instead of silent. With it, "prefix-sum a list and keep the final total" is one line:

```
¯1 ⌷ ◆ 3 1 4 1 5   → 14
```

That is the shape of a language filling itself in: a glyph whose absence a reader can point at, added with one example and one test.

## Run it

No dependencies. Node only.

```bash
npm test     # the spec: every symbol pinned to a behavior
npm run demo # a quick look at the language in action
npm run repl # talk to it: type a line, get a value back
```

## What this is NOT

- **Not** a claim that models secretly speak APL to each other. They do not.
- **Not** a replacement for Dyalog, J, or K. It is a bridge, not a cathedral.
- **Not** finished. v0 proves one thing: a person and a machine can trade a real task in dense shape without the person losing the thread.

## Roadmap

- **v0.1** a glyph guide and a token-savings benchmark against plain prose
- **v0.2** round-trip editing: you fix the line and it re-runs
- **v0.3** an adapter so a memory store (TheWarden) can hold its entries as APL-SI lines
- **later** shared human/model memory expressed as arrays

## License

MIT.
