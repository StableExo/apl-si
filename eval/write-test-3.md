# Write test 3: the three doors

Part 5 of the eval set, after `reading-test.md`, `write-test.md` and
`write-test-2.md`.

This one tests `⍎` (parse: text to numbers) and how it closes the loop with the
two I/O glyphs, `⎕` (write) and `⍞` (read). The point of the round is whether a
model can connect *something a person typed* to *something the language can do
arithmetic on*. That is the whole reason `⍎` exists.

Run it the same way: paste the prompt cold, keep the lines verbatim, then run
every line through `src/aplsi.mjs`. Two of the items need stdin, so drive them
with a fixed input.

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
> +  -  ×  ÷  ⌈  ⌊  |  *  ⍳  ≢  ◆  ⎕  ⍞  ⍎  ⍴  ,  ⌷  <  ≤  =  ≥  >  ≠
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
> dyadic  ⌷           index (pick): 2 ⌷ 10 20 30 is 20; ¯1 ⌷ v is the last element
> dyadic  < ≤ = ≥ > ≠ compare, and give a mask of 0s and 1s: 500 < 120 480 900 250 is 0 0 1 0
> monadic ◆           prefix sums (running total): ◆ 1 2 3 4 is 1 3 6 10
> monadic ⎕           write: print its argument
> monadic ⍞           read: gives the line a person types as text, e.g. '7 8 9' if they type 7 8 9
> monadic ⍎           parse: turns text that looks like numbers into actual numbers, ⍎ '7 8 9' is 7 8 9
> ```
>
> Rules:
> - Evaluation is right to left: 2 × 3 + 4 is 14, not 20.
> - A monadic function takes the whole expression on its right.
> - / after a function folds a vector: +/ 1 2 3 4 is 10, ⌈/ is the max.
> - / after a value filters: mask / vector keeps the elements where the mask is
>   non-zero, e.g. 1 0 1 0 / 10 20 30 40 is 10 30.
> - ⍞ gives text. To do arithmetic on it, parse it first with ⍎.
>
> Write one line for each:
>
> 1. Add 1 to each of the numbers in the text '7 8 9'.
> 2. The number written in the text '42'.
> 3. Read a line someone types, and total the numbers in it.
> 4. Read a line someone types, keep only the numbers over 10, and total those.
> 5. Take the text '120 480 900 250', and total the values in it over 500.
> 6. Count the numbers in the text '5 6 2'.
> 7. The largest number in the text '3 9 4'.
> 8. Read a line someone types and print the total, with a label before it.
> 9. Something that is already a number, like 42, given to ⍎ — what happens?

## Answer key

| # | Task | Expected line | Value |
|---|------|---------------|-------|
| 1 | add 1 to each of '7 8 9' | `1 + ⍎ '7 8 9'` | `8 9 10` |
| 2 | the number in '42' | `⍎ '42'` | `42` |
| 3 | read a line, total it | `+/ ⍎ ⍞` | sum of stdin (e.g. `7 8 9 10` → `34`) |
| 4 | read a line, keep >10, total | `+/ (10 < ⍎ ⍞) / ⍎ ⍞` | sum of stdin over 10 |
| 5 | total values over 500 in '120 480 900 250' | `+/ (500 < ⍎ '120 480 900 250') / ⍎ '120 480 900 250'` | `900` |
| 6 | count numbers in '5 6 2' | `≢ ⍎ '5 6 2'` | `3` |
| 7 | largest in '3 9 4' | `⌈/ ⍎ '3 9 4'` | `9` |
| 8 | read a line, print total with a label | `⎕ 'the total is' +/ ⍎ ⍞` | prints `the total is <n>` |
| 9 | 42 given to ⍎ | refused: `⍎ expects text` | error |

Item 6 has a second correct form: `≢` and `+/ mask` are different questions, but
for counting the *elements* of a parsed vector `≢ ⍎ '5 6 2'` is the direct one.
Item 5 has the by-now-familiar second form: multiply by the mask (`v × mask`)
instead of filtering. Item 9 is the misread: `⍎` refuses a value that is already a
number, because it is for text.

## What the answers do and do not measure

- **Items 1, 2, 5, 6, 7 test `⍎` on a literal.** The text is in the line, so the
  model has to turn it into numbers to do anything at all. Clean signal.
- **Items 3, 4, 8 test the loop.** They need `⍞` (read) *and* `⍎` (parse) *and*
  then arithmetic, in one line. This is where a model that has only memorised
  glyph meanings, without seeing how they compose, breaks down.
- **Item 4 is the hardest.** It reads a line once, but the line is used twice
  (once for the mask, once for the values). A model has to notice `⍞` consumes a
  line and cannot be called twice, so the read has to be bound once. Whether it
  spots that is the real test of the round.
- **Item 9 tests reading, not writing.** It asks the model to know what `⍎`
  refuses, which is a rule the prompt states.

## Round 1 results (2026-11-05)

One model, cold. Every line run through `src/aplsi.mjs`.

| # | Key | Sonnet 5.5 |
|---|-----|------------|
| 1 | `8 9 10` | `1 + ⍎ '7 8 9'` ✅ |
| 2 | `42` | `⍎ '42'` ✅ |
| 3 | sum of stdin | `+/ ⍎ ⍞` ✅ |
| 4 | sum of stdin over 10 | unsure ⚠️ |
| 5 | `900` | unsure ❌ |
| 6 | `3` | `≢ ⍎ '5 6 2'` ✅ |
| 7 | `9` | `⌈/ ⍎ '3 9 4'` ✅ |
| 8 | label + total | unsure ⚠️ |
| 9 | refused | unsure ❌ |

**5 clean, 1 solvable miss, and two "unsure" answers that are right about the
language.** This round turned out to say more about the test than the model.

### What round 1 exposed

The prompt's "glyphs you have" list is just `GLYPHS`. That set omits two things
the language actually has, and the reading test already uses:

- **`←` assignment** — `n ← ⍎ ⍞` works.
- **named dfns** — `f ← {+/ ⍵}` then `f v` works (a bare `{...}` applied to an
  expression does not; the dfn has to be bound to a name first).

With those left out, **items 4 and 8 have no single-line answer**, which is
exactly what the model said:

- **Item 4** uses the typed line twice. With `←` it is two lines (`n ← ⍎ ⍞`, then
  `+/ (10 < n) / n`), not one. There is no one-line form: `{+/ (10<⍵)/⍵} ⍎ ⍞`
  errors with `arithmetic on text is not defined yet`, and `+/ (10 < ⍎ ⍞) / ⍎ ⍞`
  reads *two* lines — a different first line from the second, so it is wrong.
- **Item 8** wants a label with a computed total. `⎕ 'Total:' 108` prints fine,
  but the second thing on the line has to be a plain value; `⎕ 'Total: ' +/ ⍎ ⍞`
  errors with `expected a value`.

So the model's two reasoned "unsure" answers are correct diagnoses of a hole in
*this test*, not failures. Item 5, by contrast, is solvable (it just needs
parentheses, `(500 < ⍎ '...') / ⍎ '...'` → `900`) and item 9 is answerable by
reasoning from "⍎ is for text" (`⍎ 42` is refused), so those two misses are the
model's.

### The language gaps this found

The round did its job: it surfaced two things wishful thinking had hidden.

1. **You cannot reuse a read inline.** `⍞` consumes a line and there is no way to
   hold it without a separate `←` statement. Reading a line and asking two
   questions of it is awkward.
2. **You cannot hand a computed value to a dfn or to `⎕`.** Only a name or a
   literal goes in those positions, so a dfn that summarises an expression, or a
   labelled print of a computed total, cannot be written in one line.

Both are worth fixing, and both are more interesting than the glyphs the round
was meant to test.
