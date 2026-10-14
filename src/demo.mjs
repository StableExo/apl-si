// A quick look at the language. Run: npm run demo
import { evaluate, format } from './aplsi.mjs';

const env = {};

function run(src) {
  const value = evaluate(src, env);
  console.log(`${src}\n  => ${format(value)}\n`);
}

run('2 × 3 + 4');
run('2 - 3 - 4');
run('- 5 + 3');
run('⍳ 5');
run('+/ ⍳ 10');
run('×/ ⍳ 5');
run('hp ← 120 480 900 250');
run('+/ hp');
run('⌈/ hp');
run('hp ÷ 10');
run('≢ hp');
run('3 | 10');
run("⎕ 'hello world'");
run("≢ 'hello world'");
