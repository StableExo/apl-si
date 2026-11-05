// The spec. Each test pins one symbol (or one rule) to a behavior.
// If a test passes, that meaning is frozen. If you want APL-SI to mean
// something else, you change the test and you say why.

import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, format } from '../src/aplsi.mjs';

const run = (src, env = {}, io = {}) => evaluate(src, env, io);

test('dyadic arithmetic', () => {
  assert.equal(run('3 + 4'), 7);
  assert.equal(run('10 - 4'), 6);
  assert.equal(run('6 × 7'), 42);
  assert.equal(run('12 ÷ 4'), 3);
});

test('evaluates right to left', () => {
  assert.equal(run('2 × 3 + 4'), 14); // 2 × (3 + 4)
  assert.equal(run('2 - 3 - 4'), 3); // 2 - (3 - 4)
});

test('monadic functions', () => {
  assert.equal(run('- 5'), -5);
  assert.equal(run('× ¯7'), -1);
  assert.equal(run('⌈ 2.2'), 3);
  assert.equal(run('⌊ 2.8'), 2);
  assert.equal(run('| ¯7'), 7);
  assert.equal(run('÷ 4'), 0.25);
});

test('a monadic function takes the whole right side', () => {
  assert.equal(run('- 5 + 3'), -8); // -(5 + 3)
});

test('iota makes a vector', () => {
  assert.deepEqual(run('⍳ 5'), [1, 2, 3, 4, 5]);
  assert.deepEqual(run('⍳ 1'), [1]);
});

test('tally counts', () => {
  assert.equal(run('≢ 1 2 3'), 3);
  assert.equal(run('≢ 9'), 1);
});

test('reduce folds a vector', () => {
  assert.equal(run('+/ 1 2 3 4'), 10);
  assert.equal(run('×/ 1 2 3 4'), 24);
  assert.equal(run('⌈/ 3 1 4 1 5'), 5);
  assert.equal(run('⌊/ 3 1 4 1 5'), 1);
  assert.equal(run('-/ 1 2 3'), 2); // 1 - (2 - 3)
});

test('vectors and scalar extension', () => {
  assert.deepEqual(run('1 2 3 + 10'), [11, 12, 13]);
  assert.deepEqual(run('10 + 1 2 3'), [11, 12, 13]);
  assert.deepEqual(run('1 2 3 + 4 5 6'), [5, 7, 9]);
});

test('residue and power', () => {
  assert.equal(run('3 | 10'), 1);
  assert.equal(run('2 * 10'), 1024);
});

test('assignment and recall', () => {
  const env = {};
  run('x ← 5', env);
  assert.equal(run('x + 1', env), 6);
  run('v ← 1 2 3', env);
  assert.deepEqual(run('v × 2', env), [2, 4, 6]);
});

test('a strand of values becomes a vector', () => {
  assert.deepEqual(run('1 2 3'), [1, 2, 3]);
  assert.equal(run('1'), 1);
});

test('missing close paren is an error', () => {
  assert.throws(() => run('(1 + 2'), /missing \)/);
});

test('length mismatch is an error', () => {
  assert.throws(() => run('1 2 3 + 1 2'), /length mismatch/);
});

test('unknown name is an error', () => {
  assert.throws(() => run('foo + 1'), /unknown name/);
});

test('◆ is prefix sums (the first glyph that is not standard APL)', () => {
  assert.deepEqual(run('◆ 1 2 3 4'), [1, 3, 6, 10]);
  assert.deepEqual(run('◆ 4 8 9 3 7'), [4, 12, 21, 24, 31]);
  assert.equal(run('◆ 5'), 5);
});

test('⎕ is the mouth: it prints and returns its value', () => {
  assert.equal(run("⎕ 'hello world'"), 'hello world');
});

test('a string is an array of characters', () => {
  assert.equal(run("≢ 'hello world'"), 11);
  assert.equal(format('hello world'), 'hello world');
});

test('arithmetic on text is not defined yet', () => {
  assert.throws(() => run("'a' + 1"), /arithmetic on text/);
});

test('format renders scalars and vectors', () => {
  assert.equal(format(7), '7');
  assert.equal(format([1, 2, 3]), '1 2 3');
});

// --- the word rule: you can name your own function ---

test('a word is a named function called with one argument', () => {
  const env = {};
  run('square ← {⍵×⍵}', env);
  assert.equal(run('square 5', env), 25);
  assert.deepEqual(run('square 1 2 3', env), [1, 4, 9]); // it maps over a vector
});

test('a word can take a left argument too', () => {
  const env = {};
  run('add ← {⍺+⍵}', env);
  assert.equal(run('3 add 4', env), 7);
  assert.deepEqual(run('1 2 3 add 10', env), [11, 12, 13]);
});

test('words stack: one word can call another', () => {
  const env = {};
  run('square ← {⍵×⍵}', env);
  run('twice ← {⍵+⍵}', env);
  assert.equal(run('twice square 3', env), 18); // twice(square(3))
});

test('a word body is right to left like everything else', () => {
  const env = {};
  run('f ← {⍵×2+3}', env);
  assert.equal(run('f 1', env), 5); // 2 + 3, then × 1
});

test('a word not called with a left argument refuses ⍺', () => {
  const env = {};
  run('bad ← {⍺+⍵}', env);
  assert.throws(() => run('bad 5', env), /called with one argument/);
});

test('a word used in the middle takes the value on its left', () => {
  const env = {};
  run('add ← {⍺+⍵}', env);
  assert.equal(run('1 add 2', env), 3);
});

// --- when does the language speak? Only ⎕ does. This was a real gap: two
// models read our spec and disagreed about whether a bare line prints. ---

const captureLog = (fn) => {
  const original = console.log;
  const calls = [];
  console.log = (...args) => calls.push(args.map(String).join(' '));
  try {
    return { value: fn(), calls };
  } finally {
    console.log = original;
  }
};

test('a bare expression returns its value and stays silent', () => {
  const { value, calls } = captureLog(() => run('1 + 2'));
  assert.equal(value, 3);
  assert.deepEqual(calls, []); // no print: the value is handed back, not spoken
});

test('only the mouth speaks: ⎕ prints and returns its value', () => {
  const { value, calls } = captureLog(() => run("⎕ 'hi'"));
  assert.equal(value, 'hi');
  assert.deepEqual(calls, ['hi']);
});

test('a word that does not call ⎕ does not print', () => {
  const env = {};
  run('square ← {⍵×⍵}', env);
  const { value, calls } = captureLog(() => run('square 5', env));
  assert.equal(value, 25);
  assert.deepEqual(calls, []);
});

// --- the ear: the first thing that reaches outside the program ---

test('the ear reads a line from outside', () => {
  const io = { input: () => 'world', output: () => {} };
  assert.equal(run('⍞', {}, io), 'world');
});

test('the ear returns text, so tally counts its characters', () => {
  const io = { input: () => 'hello', output: () => {} };
  assert.equal(run('≢ ⍞', {}, io), 5);
});

test('the ear takes no argument and does not eat what follows', () => {
  const io = { input: () => '3', output: () => {} };
  // ⍞ is 3 (text), then + 4 stays arithmetic: still not defined on text
  assert.throws(() => run('⍞ + 4', {}, io), /arithmetic on text/);
});

test('the ear feeds the mouth: read a line, say it back', () => {
  const lines = ['earth'];
  const out = [];
  const io = { input: () => lines.shift(), output: (s) => out.push(s) };
  const env = {};
  run('name ← ⍞', env, io);
  run("⎕ 'hello' name", env, io);
  assert.deepEqual(out, ['hello earth']);
});

test('a word can listen and speak', () => {
  const out = [];
  const io = { input: () => '42', output: (s) => out.push(s) };
  const env = {};
  run('greet ← {⎕ ⍵}', env);
  run('greet ⍞', env, io);
  assert.deepEqual(out, ['42']);
});

// --- the shape: ⍴ gives a value's shape and reshapes data ---
//
// Shape is deliberately an ARRAY, not a bare number: a vector's shape is a
// one-element array, a scalar's is the empty array. That is what makes ≢ ⍴ x
// the rank, and what lets a matrix have a two-element shape later without ⍴
// ever changing meaning.

test('⍴ monadic gives the shape as an array', () => {
  assert.deepEqual(run('⍴ 1 2 3'), [3]); // a vector's shape: a one-element array
  assert.deepEqual(run('⍴ 5'), []); // a scalar's shape: the empty array
});

test('⍴ counts the characters of text', () => {
  assert.deepEqual(run("⍴ 'hello world'"), [11]);
});

test('≢ ⍴ x is the rank', () => {
  assert.equal(run('≢ ⍴ 1 2 3'), 1); // a vector is rank 1
  assert.equal(run('≢ ⍴ 5'), 0); // a scalar is rank 0
});

test('⍴ dyadic reshapes, reusing the data cyclically', () => {
  assert.deepEqual(run('3 ⍴ 1 2 3'), [1, 2, 3]);
  assert.deepEqual(run('5 ⍴ 1 2 3'), [1, 2, 3, 1, 2]);
  assert.deepEqual(run('3 ⍴ 7'), [7, 7, 7]); // a scalar fills the whole shape
  assert.deepEqual(run('0 ⍴ 1 2 3'), []);
});

test('⍴ dyadic also takes a one-element shape array', () => {
  assert.deepEqual(run('(⍳ 1) ⍴ 1 2 3'), [1]); // ⍳ 1 is the one-element vector 1
});

test('⍴ reshapes text as characters', () => {
  assert.equal(run("5 ⍴ 'ab'"), 'ababa');
});

test('⍴ monadic takes the whole right side, like other monadic functions', () => {
  assert.deepEqual(run('⍴ 1 2 + 3 4'), [2]);
});

test('⍴ refuses a shape that would need nested arrays', () => {
  assert.throws(() => run('2 3 ⍴ ⍳ 6'), /higher rank/);
});

test('⍴ refuses a negative shape', () => {
  assert.throws(() => run('¯1 ⍴ 1 2 3'), /negative/);
});

test('⍴ refuses to reshape an empty array', () => {
  assert.throws(() => run('3 ⍴ ⍳ 0'), /empty array/);
});

// --- the join: , lifts a scalar into a vector and joins two values into one ---
//
// Monadic , is ravel: it turns a value into a vector. With no nesting in v0 its
// real work is lifting a scalar, so 5 , 6 can join. Dyadic , is catenate: two
// values end to end. Text joins to text; text and numbers are refused, not mixed.

test(', monadic ravels a value into a vector', () => {
  assert.deepEqual(run(', 5'), [5]); // a scalar lifted into a one-element vector
  assert.deepEqual(run(', 1 2 3'), [1, 2, 3]); // a vector is already flat
  assert.equal(run('≢ , 5'), 1); // ≢ , 5 is the rank made explicit
});

test(', monadic ravels text as text', () => {
  assert.equal(run(", 'ab'"), 'ab');
});

test(', dyadic catenates two values into one vector', () => {
  assert.deepEqual(run('1 , 2'), [1, 2]);
  assert.deepEqual(run('1 2 , 3 4'), [1, 2, 3, 4]);
  assert.deepEqual(run('1 2 , 3'), [1, 2, 3]); // a scalar joins on the right
  assert.deepEqual(run(', 5 , 6'), [5, 6]); // ravel makes each side joinable
});

test(', catenates text as text', () => {
  assert.equal(run("'ab' , 'cd'"), 'abcd');
});

test(', refuses to mix text and numbers', () => {
  assert.throws(() => run("'ab' , 1 2"), /cannot join text and numbers/);
});

test(', and ⍴ fit together', () => {
  assert.deepEqual(run('⍴ , 5'), [1]); // the shape of a raveled scalar
  assert.deepEqual(run('3 ⍴ 1 , 2'), [1, 2, 1]); // build a pair, then reshape it
});

// --- the index: ⌷ reaches one element back out of an array ---
//
// , and ⍴ build arrays; ⌷ is the way to pull a single value back out. Positions
// count from one (APL's origin), a negative index counts from the end, and an
// index outside the array is refused rather than wrapped.

test('⌷ picks one element by position, counting from one', () => {
  assert.equal(run('1 ⌷ 10 20 30'), 10);
  assert.equal(run('2 ⌷ 10 20 30'), 20);
  assert.equal(run('3 ⌷ 10 20 30'), 30);
});

test('⌷ counts back from the end with a negative index', () => {
  assert.equal(run('¯1 ⌷ 10 20 30'), 30); // the last element
  assert.equal(run('¯2 ⌷ 10 20 30'), 20);
});

test('⌷ picks a character out of text', () => {
  assert.equal(run("2 ⌷ 'abc'"), 'b');
});

test('⌷ on a lone value gives that value at position 1', () => {
  assert.equal(run('1 ⌷ 5'), 5);
  assert.equal(run('¯1 ⌷ 5'), 5);
});

test('⌷ refuses an index outside the array', () => {
  assert.throws(() => run('4 ⌷ 1 2 3'), /out of range/);
  assert.throws(() => run('0 ⌷ 1 2 3'), /out of range/);
});

test('⌷ composes with ≢ and ◆', () => {
  assert.equal(run('¯1 ⌷ ◆ 3 1 4 1 5'), 14); // the final running total, directly
  assert.equal(run('(≢ 7 8 9) ⌷ 7 8 9'), 9); // the last element, counted
});

// --- the tests: < ≤ = ≥ > ≠ compare and give a 0/1 mask ---
//
// Each comparison is a dyadic scalar function like +, so it broadcasts over a
// vector and gives 1 where true, 0 where false. The result is a mask, which is
// what the compress form of / consumes.

test('comparisons give 1 or 0, one to each element', () => {
  assert.equal(run('3 < 5'), 1);
  assert.equal(run('5 < 3'), 0);
  assert.equal(run('2 ≤ 2'), 1);
  assert.equal(run('3 = 3'), 1);
  assert.equal(run('3 = 4'), 0);
  assert.equal(run('4 ≥ 2'), 1);
  assert.equal(run('2 > 3'), 0);
  assert.equal(run('3 ≠ 4'), 1);
});

test('comparisons broadcast a scalar over a vector', () => {
  assert.deepEqual(run('500 < 120 480 900 250'), [0, 0, 1, 0]);
  assert.deepEqual(run('2 = 1 2 3'), [0, 1, 0]);
});

test('comparisons are not monadic', () => {
  assert.throws(() => run('< 5'), /not a monadic function/);
});

// --- the filter: mask / vector keeps the elements the mask picks ---

test('/ with a value on its left filters', () => {
  assert.deepEqual(run('1 0 1 0 / 10 20 30 40'), [10, 30]);
  assert.deepEqual(run('1 1 1 / 7 8 9'), [7, 8, 9]); // an all-1 mask keeps everything
  assert.deepEqual(run('0 0 0 / 7 8 9'), []); // an all-0 mask keeps nothing
});

test('/ filters text as text', () => {
  assert.equal(run("1 0 1 / 'abc'"), 'ac');
});

test('/ refuses a mask that is the wrong length', () => {
  assert.throws(() => run('1 0 / 10 20 30'), /mask as long as its array/);
});

test('/ still reduces when a function is on its left', () => {
  assert.equal(run('+/ 1 2 3 4'), 10); // the two readings of / do not collide
  assert.equal(run('⌈/ ◆ 3 1 4 1 5'), 14);
});

test('comparison and filter together answer the README example', () => {
  // "keep only the ones over 500, and total them"
  assert.equal(run('+/ (500 < 120 480 900 250) / 120 480 900 250'), 900);
});

