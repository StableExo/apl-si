# Write test: can a model *write* APL-SI, not just read it?

Part 3 of the eval set, after the two reading tests in `reading-test.md`.

The reading test asked a model to interpret lines we wrote. It could not tell
"reads APL-SI" from "remembers real APL", because a model can answer standard
glyphs from memory. This test closes that hole: the model is asked to *write*
`APL-SI` lines for a task, and every answer is then run through the interpreter.
Code either runs, or it does not. There is nothing to bluff.

Run it the same way: paste the prompt below as a cold read, send nothing else,
keep the model's lines verbatim, then feed each line to `src/aplsi.mjs`.

## The prompt

> Write test: a small array-notation language called APL-SI.
>
> It is pre-alpha. Please do not look anything up. Write one line of APL-SI for
> each task below. Just the line, no commentary. If you are unsure, write
> "unsure" instead of a line and say why.
>
> The glyphs you have:
>
> ```
> +  -  ×  ÷  ⌈  ⌊  |  *  ⍳  ≢  ◆  ⍴  ,  ⌷
> ```
>
> Each with a monadic (right-argument) and/or dyadic (left-and-right) meaning:
>
> ```
> dyadic  +  -  ×  ÷   add, subtract, multiply, divide
> dyadic  ⌈  ⌊        max, min
> monadic ⌈  ⌊        ceiling, floor
> dyadic  *  |        power, residue (a|b is b mod a)
> monadic ⍳           index generator: ⍳ 5 is 1 2 3 4 5
> monadic ≢           tally (count)
> monadic ⍴ / dyadic  shape / reshape: 5 ⍴ 1 2 3 is 1 2 3 1 2
> monadic , / dyadic  ravel / catenate: 1 2 , 3 4 is 1 2 3 4
> dyadic  ⌷           index (pick): 2 ⌷ 10 20 30 is 20
> monadic ◆           prefix sums (running total): ◆ 1 2 3 4 is 1 3 6 10
> ```
>
> Three rules:
> - Evaluation is right to left: `2 × 3 + 4` is `14`, not `20`.
> - A monadic function takes the whole expression on its right.
> - `/` after a function folds a vector: `+/ 1 2 3 4` is `10`, `⌈/` is the max.
>
> Write one line for each:
>
> 1. The sum of `4 8 15 16 23 42`.
> 2. The running total of `3 1 4 1 5`, then the largest of those totals.
> 3. The first 6 counting numbers.
> 4. The values `1 2 3` reshaped to 7 items.
> 5. Join `1 2` with `3 4 5`.
> 6. Count `9 8 7 6`.
> 7. Double every value in `1 2 3 4`.
> 8. Subtract 2 from 10, then double the result.
> 9. Join `1 2` with the text `'ab'`.

## Answer key

| # | Task | Expected line | Value |
|---|------|---------------|-------|
| 1 | sum of 4 8 15 16 23 42 | `+/ 4 8 15 16 23 42` | `108` |
| 2 | running total of 3 1 4 1 5, then largest | `⌈/ ◆ 3 1 4 1 5` | `14` |
| 3 | first 6 counting numbers | `⍳ 6` | `1 2 3 4 5 6` |
| 4 | reshape 1 2 3 to 7 items | `7 ⍴ 1 2 3` | `1 2 3 1 2 3 1` |
| 5 | join 1 2 with 3 4 5 | `1 2 , 3 4 5` | `1 2 3 4 5` |
| 6 | count 9 8 7 6 | `≢ 9 8 7 6` | `4` |
| 7 | double every value in 1 2 3 4 | `2 × 1 2 3 4` | `2 4 6 8` |
| 8 | subtract 2 from 10, then double | `2 × 10 - 2` | `16` |
| 9 | join 1 2 with the text 'ab' | (nothing valid) | refused: `, cannot join text and numbers` |

Item 8 is the right-to-left trap: `2 × 10 - 2` is `16`, but the left-to-right
habit gives `2 × 10 - 2` = `20 - 2` = `18` (or, written `10 - 2 × 2`, `6`).
Item 9 is the type trap: v0 refuses to put text and numbers in one array, so the
correct answer is that the line is an error, not a value.

## What the answers do and do not measure

- **Items 1, 2 and 9 are the real signal.** They are the ones a model cannot get
  from recalling real APL:
  - Item 1 wants an *idiom* (`+/`), not just a right answer.
  - Item 2 wants `◆` (ours, non-standard) *and* `/` reduce composed.
  - Item 9 wants the model to notice that mixing text and numbers is refused,
    which is stated nowhere except in the type rule.
- **Items 3, 4, 5, 6, 7 are mostly recall.** They are standard APL, so a correct
  line mostly shows our spec matches APL, not that the notation taught itself.
- **Running the lines is the point.** Unlike a reading test, a written line can be
  executed: a plausible-looking wrong line fails, and a correct-looking wrong line
  gives a wrong value. There is no hedge and no partial credit for confidence.

## Round 1 results (2026-11-05)

Two models, cold, same prompt. Every line was run through `src/aplsi.mjs`.

| # | Key | Grok | Sonnet 4.6 |
|---|-----|------|------------|
| 1 | `108` | `108` via `4 + 8 + 15 + 16 + 23 + 42` ✅ | unsure ❌ |
| 2 | `14` | `14` via `3 + 1 + 4 + 1 + 5` ⚠️ | unsure ❌ |
| 3 | `⍳ 6` | ✅ | ✅ |
| 4 | `7 ⍴ 1 2 3` | ✅ | ✅ |
| 5 | `1 2 , 3 4 5` | ✅ | ✅ |
| 6 | `≢ 9 8 7 6` | ✅ | ✅ |
| 7 | `2 × 1 2 3 4` | ✅ | ✅ |
| 8 | `16` | `2 × 10 - 2` ✅ | `2 × 10 - 2` ✅ |
| 9 | refused | `1 2 , 'ab'` → refused ✅ | unsure (correct instinct) ✅ |

**Grok: 9/9 values, one flagged. Sonnet: 7/9.**

The split lands entirely on our two non-training-set features, `/` and `◆`:

- **Grok** reached for a running total but substituted a plain sum (`3 + 1 + 4 + 1
  + 5`) when the task wanted `◆` then `⌈/`. On this input the largest prefix sum
  happens to equal the total, so the answer is right for the wrong reason; change
  the input to `3 ¯5 2` (sum `0`, largest running total `3`) and it breaks. Right
  value, wrong tool.
- **Sonnet** said outright there was "no fold/reduce" and "no way to extract the
  final element", so it declined items 1 and 2 before reaching `◆`. But `/` *is*
  reduce in v0, and it answers both (`+/ 4 8 15 16 23 42`, `⌈/ ◆ 3 1 4 1 5`). It
  read past a documented glyph.

Two lessons, and the second one is why `⌷` exists:

1. `/` reduce is documented and still read past. That is a placement/naming
   problem, not a capability gap, and it is worth its own note in the README.
2. Sonnet's "no way to extract the final element" was a real gap, not a
   misreading: v0 could build arrays but not pull one element back out. `⌷`
   (index) closes it, and `¯1 ⌷ ◆ 3 1 4 1 5` is now a one-line answer to item 2.
