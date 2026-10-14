// The first program that reaches outside itself.
// The mouth asks, the ear listens, the mouth answers.
//
//   printf 'earth\n' | node examples/echo.mjs
//
import { evaluate } from '../src/aplsi.mjs';

const env = {};

evaluate("⎕ 'what is your name?'", env); // the mouth asks
evaluate('name ← ⍞', env);               // the ear listens
evaluate("⎕ 'hello' name", env);          // the mouth answers

// The ear hands back text, so you can count what it heard:
evaluate('n ← ≢ name', env);
evaluate("⎕ 'your name has' n 'letters'", env);
