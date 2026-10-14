// The APL-SI conversation. Run: npm run repl   (or: node src/repl.mjs)
//
// Read  the line you typed
// Eval  it with the same evaluator the tests use
// Print the result
// Loop  and wait for the next line
//
// This is exactly the loop the shell is NOT. The shell launches a program and
// walks away. A REPL stays with you, one APL-SI line at a time.

import { createInterface } from 'node:readline';
import { evaluate, format } from './aplsi.mjs';

const env = {}; // memory lives here while the loop runs: x ← 5, then x + 1

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '  ',
});

console.log('APL-SI REPL  v0.  Type a line. Blank line or ctrl-c to leave.');
console.log("Try:  hp ← 120 480 900 250   /   +/ hp   /   ⎕ 'hello world'\n");
rl.prompt();

rl.on('line', (line) => {
  const src = line.trim();
  if (src === '') {
    rl.close();
    return;
  }
  try {
    const value = evaluate(src, env);
    if (value !== undefined) console.log('=> ' + format(value));
  } catch (err) {
    console.log('!! ' + err.message);
  }
  rl.prompt();
});

rl.on('close', () => {
  console.log('\nsession ended. memory of this loop is gone (it lived in RAM, not on disk).');
  process.exit(0);
});
