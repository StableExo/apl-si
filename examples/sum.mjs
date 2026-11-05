// The ear hears numbers, ⍎ reads them into values, and the mouth says the total.
// This is the first program that computes with something it heard.
//
//   printf '4 8 15 16 23 42\n' | node examples/sum.mjs
//
import { evaluate } from '../src/aplsi.mjs';

const env = {};

evaluate("⎕ 'give me numbers, separated by spaces'", env); // the mouth asks
evaluate('nums ← ⍎ ⍞', env);   // the ear listens, and ⍎ turns the text into numbers
evaluate('total ← +/ nums', env); // fold the numbers into one
evaluate("⎕ 'the total is' total", env); // the mouth answers with a computed value
