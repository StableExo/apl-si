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

