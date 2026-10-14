# Adding a glyph to APL-SI

Every new glyph ships with **two** things: an example so any model can infer it, and a test so the meaning is frozen instead of guessed.

We learned this from a real experiment. Two models were shown one example of a made-up glyph and asked to apply it. Both generalized correctly, but one of them said it out loud: *"this isn't a standard primitive, so I'm inferring from your example, and if it does something else that matches, tell me."* That is the whole reason for tests. An example teaches; it does not pin.

## The rule

- **Example teaches.** Put one worked line in the README table so a model can infer the glyph cold.
- **Test decides.** Add one test. The passing test *is* the meaning.
- **Watch for collisions.** If a new glyph looks like a known operation, models will snap it to the nearest familiar one and stay confident while they do it. Sonnet flags that it is guessing; not every model will. The test is the only thing that stops the drift.

## The template

1. Add the glyph to `GLYPHS` and `CORE` in `src/aplsi.mjs`.
2. Implement it in `applyMonad` (one argument) or `scalarDyad` (two).
3. Add a row to the core table in `README.md` with a one-line example.
4. Add a test, using the `◆` case as the model:

```js
test('my glyph does what I say', () => {
  assert.deepEqual(run('myglyph 1 2 3'), [/* expected */]);
});
```

## Worked case: `◆`

`◆` (prefix sums) is the first APL-SI glyph that is not standard APL.

- Example: `◆ 1 2 3 4` -> `1 3 6 10`
- Test: `run('◆ 1 2 3 4')` -> `[1, 3, 6, 10]`, and `run('◆ 4 8 9 3 7')` -> `[4, 12, 21, 24, 31]`

That pair, one example and one test, is the entire unit of growth for this language. Copy it for every glyph after this one.
