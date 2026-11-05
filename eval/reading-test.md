# Reading test: can a model cold-read APL-SI?

This is a small, self-contained test given to a model with no other context, to
ask how readable the notation is to something that has never seen it.

Run it as a **cold read**: paste the prompt below, send nothing else, do not hint
at the glyphs, and keep the model's answers verbatim.

The point is not the score. It is whether the answers come from *reading this
notation* or from *recalling real APL* — see "What the answers do and do not
measure", which matters more than the number at the bottom.

## The prompt

> Reading test: a small array-notation language called APL-SI.
>
> It is pre-alpha. I want to know how readable it is cold, so please do not look
> anything up. Everything you need is here.
>
> The whole core of glyphs:  `+  -  ×  ÷  ⌈  ⌊  |  *  ⍳  ≢  ◆  ⎕  ⍞  ⍴`
>
> Two rules that are easy to get wrong:
> - Evaluation is right to left.
> - A monadic (one-argument) function takes the whole expression on its right.
>
> One worked example, of a glyph that is not standard APL:
> ```
> ◆ 1 2 3 4   ->   1 3 6 10
> ```
>
> Task 1. For each line, give exactly what it evaluates to. Just the value, no
> commentary. If you are guessing what a glyph means, say "guessing" next to that
> line.
>
> ```
> 1.  2 × 3 + 4
> 2.  +/ 1 2 3 4
> 3.  ⌈/ ◆ 3 1 4 1 5
> 4.  ⍴ 1 2 3
> 5.  5 ⍴ 1 2 3
> 6.  ≢ 'hello world'
> 7.  hyp ← {⌈/ ◆ ⍵}    then    hyp 3 4 6 2
> ```
>
> Task 2. Which single glyph in the list is NOT a standard APL primitive?
>
> Task 3. Write this as one APL-SI line: "take the values 2 7 1 8 2, turn them
> into a running total, then take the largest."

## Answer key

| Item | Expected | Note |
|------|----------|------|
| 1. `2 × 3 + 4` | `14` | Right to left: `2 × (3 + 4)`. Ordinary maths says `20`. |
| 2. `+/ 1 2 3 4` | `10` | Sum by reduction. |
| 3. `⌈/ ◆ 3 1 4 1 5` | `14` | `◆` gives `3 4 8 9 14`, `⌈/` takes the max. |
| 4. `⍴ 1 2 3` | `3` | Shape: a one-element array holding the length. |
| 5. `5 ⍴ 1 2 3` | `1 2 3 1 2` | Reshape, data reused cyclically. |
| 6. `≢ 'hello world'` | `11` | Tally: length. |
| 7. `hyp 3 4 6 2` | `15` | `◆ 3 4 6 2` is `3 7 13 15`, `⌈/` is `15`. |
| Task 2 | `◆` | The only glyph that is not a standard APL primitive. |
| Task 3 | `⌈/ ◆ 2 7 1 8 2` | Running total then max. |

Nine scoreable items in total (seven lines, plus Tasks 2 and 3).

## What the answers do and do not measure

- **The `◆` items are the real signal.** `◆` (prefix sums) is the only glyph in
  the core with no prior in any model's training. A right answer there comes from
  the single worked example and nothing else, so those items measure whether this
  notation teaches itself from an example.
- **The `⍴`, `+/`, `⌈/`, `≢` items do not measure that.** They are standard APL,
  so a model can answer them from memory. A correct `5 ⍴ 1 2 3` is not evidence
  that APL-SI reads well; it is evidence that our spec matches APL. Useful, but a
  different thing.
- **Task 2 is the tell.** A model that can name `◆` as the non-standard glyph
  knows real APL, which means its other answers are probably recalled rather than
  read. That is the confound in one question.
- **Watch for bluffing.** `docs/adding-a-glyph.md` warns that a model will snap a
  new glyph to the nearest familiar operation and stay confident. The prompt asks
  the model to say when it is guessing. A wrong answer with no "guessing" flag is
  the failure mode worth catching.
- **Item 1 catches habit.** Ordinary left-to-right maths gives `20`; APL-SI gives
  `14`. A model that answers `20` is not reading the stated rule.

## Round 1 results (2026-11-05)

Two models, cold, same prompt.

| Item | Key | Grok | Sonnet 4.6 |
|------|-----|------|------------|
| 1 | `14` | 14 ✅ | 14 ✅ |
| 2 | `10` | 10 ✅ | 10 ✅ |
| 3 | `14` | 14 ✅ | 14 ✅ |
| 4 | `3` | 3 ✅ | 3 ✅ |
| 5 | `1 2 3 1 2` | `1 2 3 1 2` ✅ | `1 2 3 1 2` ✅ |
| 6 | `11` | 11 ✅ | 11 ✅ |
| 7 | `15` | 15 ✅ | 15 ✅ |
| Task 2 | `◆` | ◆ ✅ | ◆ ✅ |
| Task 3 | `⌈/ ◆ 2 7 1 8 2` | same ✅ | same ✅ |

Both 9/9. Two honest readings:

1. Both models know standard APL cold, so most of this sheet is recall. The
   `◆` items are the only clean signal, and both read `◆` correctly from one
   worked example. This backs the "a worked example teaches a glyph" rule in
   `docs/adding-a-glyph.md`.
2. Neither model flagged anything as a guess, so a 9/9 with no hedging cannot be
   told apart from recall-by-luck. This version of the test cannot separate
   "reads APL-SI" from "remembers APL". A test that makes a model *write* code
   and run it would separate them, since the code either runs or it does not.
