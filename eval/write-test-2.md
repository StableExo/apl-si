# Write test 2: comparisons and the filter

Part 4 of the eval set, after `reading-test.md` and `write-test.md`.

This one tests the glyphs added after the first two rounds: `⌷` (index), the
comparison glyphs `< ≤ = ≥ > ≠`, and the filter form of `/` (`mask / v`). Run it
the same way: paste the prompt cold, keep the lines verbatim, then run every line
through `src/aplsi.mjs`.

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
> +  -  ×  ÷  ⌈  ⌊  |  *  ⍳  ≢  ◆  ⍴  ,  ⌷  <  ≤  =  ≥  >  ≠
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
> ```
>
> Rules:
> - Evaluation is right to left: 2 × 3 + 4 is 14, not 20.
> - A monadic function takes the whole expression on its right.
> - / after a function folds a vector: +/ 1 2 3 4 is 10, ⌈/ is the max.
> - / after a value filters: mask / vector keeps the elements where the mask is
>   non-zero, e.g. 1 0 1 0 / 10 20 30 40 is 10 30.
>
> Write one line for each:
>
> 1. The 3rd element of 10 20 30 40.
> 2. The last element of 10 20 30 40.
> 3. A mask of which values in 120 480 900 250 are greater than 500.
> 4. Keep only the values over 500 from 120 480 900 250, then total them.
> 5. How many of 120 480 900 250 are over 500.
> 6. The running total of 2 5 1, then just the last value of that total.
> 7. Which of 3 3 4 equal 3.
> 8. Keep the values in 5 12 7 20 that are 10 or more, then total them.

## Answer key

| # | Task | Expected line | Value |
|---|------|---------------|-------|
| 1 | 3rd element of 10 20 30 40 | `3 ⌷ 10 20 30 40` | `30` |
| 2 | last element | `¯1 ⌷ 10 20 30 40` | `40` |
| 3 | mask over 500 | `500 < 120 480 900 250` | `0 0 1 0` |
| 4 | keep >500, total | `+/ (500 < 120 480 900 250) / 120 480 900 250` | `900` |
| 5 | count over 500 | `+/ 500 < 120 480 900 250` | `1` |
| 6 | running total of 2 5 1, last value | `¯1 ⌷ ◆ 2 5 1` | `8` |
| 7 | which of 3 3 4 equal 3 | `3 = 3 3 4` | `1 1 0` |
| 8 | keep >=10, total | `+/ (10 ≤ 5 12 7 20) / 5 12 7 20` | `32` |

Items 4 and 8 have a second correct form: multiply by the mask instead of
filtering with it, `v × mask`, then sum. Both give the same value. Item 5 is the
quiet one: counting by summing a mask (`+/ mask`) is an idiom the prompt never
shows.

## What the answers do and do not measure

- **Items 1, 2, 6 test `⌷`.** There is no substitute for indexing, so these are
  clean: to answer at all the model has to use the glyph.
- **Items 4 and 8 test the filter, but only a choice.** `mask / v` and `v × mask`
  both work, so a right answer does not prove the filter was read. Which of the
  two a model reaches for is the signal.
- **Item 3 and 7 test the comparisons directly.** Standard notation, so a right
  answer is also partly recall.
- **Item 5 tests an idiom, not a glyph.** Summing a mask to count is standard APL
  and is shown nowhere in the prompt.

## Round 1 results (2026-11-05)

Two models, cold, same prompt. Every line run through `src/aplsi.mjs`.

| # | Key | Grok | Claude |
|---|-----|------|--------|
| 1 | `30` | `3 ⌷ 10 20 30 40` ✅ | ✅ |
| 2 | `40` | `¯1 ⌷ 10 20 30 40` ✅ | ✅ |
| 3 | `0 0 1 0` | ✅ | ✅ |
| 4 | `900` | `+/(500<120 480 900 250)/120 480 900 250` ✅ | `+/ 120 480 900 250 × 500 < ...` ✅ |
| 5 | `1` | ✅ | ✅ |
| 6 | `8` | `¯1 ⌷ ◆ 2 5 1` ✅ | ✅ |
| 7 | `1 1 0` | ✅ | ✅ |
| 8 | `32` | `+/(10≤5 12 7 20)/5 12 7 20` ✅ | `+/ 5 12 7 20 × 10 ≤ ...` ✅ |

**Both 8/8.** Every line ran; every value was right. Both also produced the
`+/ mask` count for item 5, which the prompt never showed.

The one real difference is items 4 and 8: **Grok used the filter (`mask / v`);
Claude multiplied by the mask (`v × mask`) and never touched it.**

What that says about the glyphs:

- **`⌷` earned its place.** Every model used it, and nothing else does the job.
  That was a true gap.
- **The `/` filter is optional.** It has a substitute, so a model that already
  thinks in masks reaches for `×` and never misses it. The filter is a
  convenience, not a necessity. That is the first time a glyph we added was
  avoidable rather than needed, which is worth knowing before the core hardens.
- **The comparisons were read cold with no trouble**, as expected: they are
  standard notation.
