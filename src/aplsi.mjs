// APL-SI core, v0.
//
// A tiny array-notation language meant to be read and written by both a person
// and a model. This file is the whole core: tokenizer, evaluator, formatter.
// The tests in ../test/aplsi.test.mjs are the spec. A symbol means exactly what
// the passing test says it means, nothing more.

// ---------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------
// A value is either a JS number (scalar) or an array of numbers (vector).

import { readSync } from 'node:fs';

const isVec = (v) => Array.isArray(v);
const toVec = (v) => (isVec(v) ? v : [v]);

// The ear is the first thing that reaches outside the program. Where the mouth
// writes, the ear reads. In real APL, input and output are both the quad; here
// we split them so a reader can tell speaking from listening at a glance.
function readLineFromStdin() {
  const buf = Buffer.alloc(1);
  let line = '';
  try {
    for (;;) {
      const n = readSync(0, buf, 0, 1, null);
      if (n === 0) break; // EOF
      const ch = buf.toString('utf8');
      if (ch === '\n') break;
      if (ch !== '\r') line += ch;
    }
  } catch {
    // no stdin available: the ear hears nothing
  }
  return line;
}

const defaultIO = {
  input: readLineFromStdin,
  output: (s) => console.log(s),
};

// ---------------------------------------------------------------------------
// Frozen core
// ---------------------------------------------------------------------------
// Ten glyphs. Do not grow this list casually: the core is what both sides
// agree on. Everything else is built on top and proven by tests.

export const GLYPHS = ['+', '-', '×', '÷', '⌈', '⌊', '|', '*', '⍳', '≢', '◆', '⎕', '⍞'];

// Glyphs that take no argument: they are complete on their own. The ear listens.
const NILADIC = ['⍞'];

// glyph -> [monadic meaning, dyadic meaning]
export const CORE = {
  '+': ['identity', 'add'],
  '-': ['negate', 'subtract'],
  '×': ['signum', 'multiply'],
  '÷': ['reciprocal', 'divide'],
  '⌈': ['ceiling', 'max'],
  '⌊': ['floor', 'min'],
  '|': ['magnitude', 'residue'],
  '*': ['exponential', 'power'],
  '⍳': ['index generator (1..n)', null],
  '≢': ['tally (count)', null],
  '◆': ['prefix sums (running total)', null], // not standard APL: this one is ours
  '⎕': ['print (the mouth)', null], // our first effect: it writes to the screen
  '⍞': ['read a line (the ear)', null], // our second effect: it takes one in from outside
};

// The `/` operator reduces a vector with the function on its left: +/ ×/ -/ ÷/ ⌈/ ⌊/
const REDUCE_ALLOWED = ['+', '-', '×', '÷', '⌈', '⌊'];

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

export function tokenize(src) {
  const chars = Array.from(src);
  const tokens = [];
  let i = 0;
  const isDigit = (c) => c >= '0' && c <= '9';

  while (i < chars.length) {
    const c = chars[i];

    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      i++;
      continue;
    }

    // High minus: the APL negative literal, so ¯7 is the number -7.
    if (c === '¯') {
      i++;
      let num = '';
      while (i < chars.length && (isDigit(chars[i]) || chars[i] === '.')) {
        num += chars[i];
        i++;
      }
      if (num === '') throw new Error('APL-SI: ¯ must be followed by a number');
      tokens.push({ type: 'num', value: -parseFloat(num), raw: '¯' + num });
      continue;
    }

    if (isDigit(c) || c === '.') {
      let num = '';
      while (i < chars.length && (isDigit(chars[i]) || chars[i] === '.')) {
        num += chars[i];
        i++;
      }
      tokens.push({ type: 'num', value: parseFloat(num), raw: num });
      continue;
    }

    if (GLYPHS.includes(c)) {
      tokens.push({ type: 'fn', sym: c });
      i++;
      continue;
    }

    if (c === '/') {
      tokens.push({ type: 'op', sym: '/' });
      i++;
      continue;
    }

    if (c === '←') {
      tokens.push({ type: 'assign' });
      i++;
      continue;
    }

    if (c === '(') {
      tokens.push({ type: 'lparen' });
      i++;
      continue;
    }

    if (c === ')') {
      tokens.push({ type: 'rparen' });
      i++;
      continue;
    }

    // A word is a block: { ... }. What is inside becomes a function you can name.
    if (c === '{') {
      tokens.push({ type: 'lbrace' });
      i++;
      continue;
    }

    if (c === '}') {
      tokens.push({ type: 'rbrace' });
      i++;
      continue;
    }

    // The two argument names inside a word: ⍺ is the left argument, ⍵ the right.
    if (c === '⍺' || c === '⍵') {
      tokens.push({ type: 'name', value: c });
      i++;
      continue;
    }

    if (/[A-Za-z]/.test(c)) {
      let name = '';
      while (i < chars.length && /[A-Za-z0-9_]/.test(chars[i])) {
        name += chars[i];
        i++;
      }
      tokens.push({ type: 'name', value: name });
      continue;
    }

    // A string literal: 'hello world'. Text is a value, the first one that is not a number.
    if (c === "'") {
      i++;
      let str = '';
      while (i < chars.length && chars[i] !== "'") {
        str += chars[i];
        i++;
      }
      if (i >= chars.length) throw new Error('APL-SI: unterminated string');
      i++; // closing quote
      tokens.push({ type: 'str', value: str });
      continue;
    }

    throw new Error(`APL-SI: unexpected character "${c}"`);
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Evaluator (right to left, the way APL reads)
// ---------------------------------------------------------------------------

export function evaluate(src, env = {}, io = {}) {
  const tokens = typeof src === 'string' ? tokenize(src) : src;
  return evalTokens(tokens, env, { ...defaultIO, ...io });
}

function evalTokens(tokens, env, io) {
  if (tokens.length === 0) return undefined;

  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  // A name is a word (function) if what it holds is a dfn block.
  const isDfnName = (t) => t && t.type === 'name' && isDfn(env[t.value]);

  function parseExpr() {
    const left = parseArray();
    const t = peek();
    if (t && t.type === 'fn') {
      const fn = next().sym;
      const right = parseExpr();
      return applyDyad(fn, left, right);
    }
    if (isDfnName(t)) {
      const name = next().value;
      const right = parseExpr();
      return applyDfn(env[name], left, right, env, io);
    }
    return left;
  }

  function parseArray() {
    const t = peek();
    if (!t) throw new Error('APL-SI: expected a value');

    if (t.type === 'fn') {
      const fn = next().sym;

      // Niladic: the ear takes no argument. It is a value all by itself.
      if (NILADIC.includes(fn)) return applyMonad(fn, undefined, io);

      if (peek() && peek().type === 'op' && peek().sym === '/') {
        next(); // consume the reduce operator
        const arg = parseExpr();
        return reduce(fn, toVec(arg));
      }

      const arg = parseExpr();
      return applyMonad(fn, arg, io);
    }

    // A word used with one argument: square 5
    if (isDfnName(t)) {
      const name = next().value;
      const arg = parseExpr();
      return applyDfn(env[name], undefined, arg, env, io);
    }

    // A word defined in place: { ⍵ × ⍵ } is a function value, ready to be named.
    if (t.type === 'lbrace') {
      next();
      const body = [];
      let depth = 1;
      for (;;) {
        const tk = next();
        if (!tk) throw new Error('APL-SI: missing }');
        if (tk.type === 'lbrace') { depth++; body.push(tk); continue; }
        if (tk.type === 'rbrace') {
          depth--;
          if (depth === 0) break;
          body.push(tk);
          continue;
        }
        body.push(tk);
      }
      return { __dfn: true, body };
    }

    if (t.type === 'lparen') {
      next();
      const v = parseExpr();
      if (!peek() || peek().type !== 'rparen') throw new Error('APL-SI: missing )');
      next();
      return v;
    }

    return parseStrand();
  }

  function parseStrand() {
    const items = [];
    for (;;) {
      const t = peek();
      if (!t) break;
      if (t.type === 'num') {
        items.push(next().value);
        continue;
      }
      if (t.type === 'str') {
        items.push(next().value);
        continue;
      }
      if (t.type === 'name') {
        const name = t.value;
        if (isDfn(env[name])) break; // a word ends the strand: the parser will call it
        next();
        if (name === '⍺' && !('⍺' in env)) {
          throw new Error('APL-SI: ⍺ used but this word was called with one argument');
        }
        if (!(name in env)) throw new Error(`APL-SI: unknown name "${name}"`);
        items.push(env[name]);
        continue;
      }
      break;
    }
    if (items.length === 0) throw new Error('APL-SI: expected a value');
    if (items.length === 1) return items[0];
    const out = [];
    for (const it of items) {
      if (isVec(it)) out.push(...it);
      else out.push(it);
    }
    return out;
  }

  // Assignment: name ← expr
  if (
    tokens[0] &&
    tokens[0].type === 'name' &&
    tokens[1] &&
    tokens[1].type === 'assign'
  ) {
    const name = tokens[0].value;
    pos = 2;
    const value = parseExpr();
    if (pos !== tokens.length) throw new Error('APL-SI: trailing tokens after assignment');
    env[name] = value;
    return value;
  }

  const value = parseExpr();
  if (pos !== tokens.length) {
    throw new Error(`APL-SI: unexpected token "${JSON.stringify(tokens[pos])}"`);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

// A word (dfn) is a block of tokens plus nothing else. Calling it binds ⍺ and ⍵,
// runs the body, and hands back whatever the body evaluated to.
const isDfn = (v) => !!(v && typeof v === 'object' && v.__dfn);

function applyDfn(def, a, b, env, io) {
  const child = { ...env };
  child['⍵'] = b;
  if (a !== undefined) child['⍺'] = a;
  const value = evalTokens(def.body, child, io);
  if (value === undefined) throw new Error('APL-SI: word produced no value');
  return value;
}

function applyDyad(fn, a, b) {
  if (typeof a === 'string' || typeof b === 'string') {
    throw new Error('APL-SI: arithmetic on text is not defined yet');
  }
  if (isVec(a) || isVec(b)) {
    const av = toVec(a);
    const bv = toVec(b);
    if (av.length === bv.length) return av.map((x, i) => scalarDyad(fn, x, bv[i]));
    if (av.length === 1) return bv.map((y) => scalarDyad(fn, av[0], y));
    if (bv.length === 1) return av.map((x) => scalarDyad(fn, x, bv[0]));
    throw new Error(`APL-SI: length mismatch in "${fn}" (${av.length} vs ${bv.length})`);
  }
  return scalarDyad(fn, a, b);
}

function scalarDyad(fn, x, y) {
  switch (fn) {
    case '+': return x + y;
    case '-': return x - y;
    case '×': return x * y;
    case '÷': return x / y;
    case '⌈': return Math.max(x, y);
    case '⌊': return Math.min(x, y);
    case '*': return Math.pow(x, y);
    case '|': return ((y % x) + x) % x; // APL residue: a|b is b mod a
    default: throw new Error(`APL-SI: "${fn}" is not a dyadic function`);
  }
}

function applyMonad(fn, v, io) {
  if (fn === '⎕') {
    io.output(format(v)); // the mouth: writes out, then hands the value back
    return v;
  }
  if (fn === '⍞') {
    return io.input(); // the ear: takes one line in from outside, as text
  }
  if (fn === '⍳') {
    if (isVec(v)) throw new Error('APL-SI: ⍳ expects a scalar');
    const n = Math.trunc(v);
    if (n < 0) throw new Error('APL-SI: ⍳ expects a non-negative count');
    return Array.from({ length: n }, (_, i) => i + 1);
  }
  if (fn === '≢') return typeof v === 'string' ? [...v].length : toVec(v).length;
  if (fn === '◆') {
    if (!isVec(v)) return v;
    let acc = 0;
    return v.map((x) => (acc += x));
  }
  if (isVec(v)) return v.map((x) => scalarMonad(fn, x));
  return scalarMonad(fn, v);
}

function scalarMonad(fn, x) {
  switch (fn) {
    case '+': return x;
    case '-': return -x;
    case '×': return Math.sign(x);
    case '÷': return 1 / x;
    case '⌈': return Math.ceil(x);
    case '⌊': return Math.floor(x);
    case '*': return Math.exp(x);
    case '|': return Math.abs(x);
    default: throw new Error(`APL-SI: "${fn}" is not a monadic function`);
  }
}

function reduce(fn, vec) {
  if (!isVec(vec)) return vec;
  if (vec.length === 0) throw new Error('APL-SI: cannot reduce an empty vector');
  if (!REDUCE_ALLOWED.includes(fn)) {
    throw new Error(`APL-SI: "${fn}/" reduce is not defined`);
  }
  let acc = vec[vec.length - 1];
  for (let i = vec.length - 2; i >= 0; i--) acc = scalarDyad(fn, vec[i], acc);
  return acc;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function fmtNum(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return String(n);
  return String(n);
}

export function format(v) {
  if (isDfn(v)) return '<word>';
  if (typeof v === 'string') return v;
  if (isVec(v)) return v.map(fmtNum).join(' ');
  return fmtNum(v);
}

// Convenience alias
export const run = evaluate;
