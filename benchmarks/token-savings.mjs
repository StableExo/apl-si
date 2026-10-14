// The same task written three ways, measured honestly.
//
// This does NOT use a real tokenizer. It cannot: a tokenizer is a learned
// vocabulary, and there is none on this machine and no network to fetch one.
// So this reports things that ARE exact:
//
//   chars  - how many characters the human sees
//   bytes  - how many UTF-8 bytes the machine stores (this is the one that matters)
//   words  - whitespace-separated words
//
// Why bytes matter more than characters: modern tokenizers (GPT, Claude) are
// BYTE-level. They are trained on common bytes and byte-pairs. Plain ASCII text
// runs about 4 bytes per token. A rare Unicode glyph is 2 to 4 bytes and is
// usually NOT one token, so each glyph can cost two or three tokens on its own.
// That is the "glyph tax": the exact thing that can erase APL-SI's advantage.
//
// So: fewer characters is real. Fewer TOKENS is unproven, and the byte column is
// where the risk lives. Run a real tokenizer (tiktoken) to settle it.

const task = {
  prose: `Take the numbers 3, 1, 4, 1 and 5. Turn them into a running total, so each number becomes the sum of itself and everything before it. Then add up all the running totals.`,
  code: `v = [3, 1, 4, 1, 5]
running = []
total = 0
for x in v:
    total += x
    running.append(total)
print(sum(running))`,
  aplsi: `+/ ◆ 3 1 4 1 5`,
};

function measure(s) {
  const chars = [...s].length;
  const bytes = Buffer.byteLength(s, 'utf8');
  const nonSpace = [...s].filter((c) => !/\s/.test(c)).length;
  const words = s.trim().split(/\s+/).length;
  return { chars, bytes, nonSpace, words };
}

const rows = Object.entries(task).map(([name, text]) => [name, measure(text)]);
const base = rows.find(([name]) => name === 'aplsi')[1];

console.log('task: running total, then sum   (input 3 1 4 1 5)');
console.log('');
console.log('form      chars   bytes   nonspace   words   bytes vs APL-SI');
for (const [name, m] of rows) {
  const ratio = (m.bytes / base.bytes).toFixed(1);
  console.log(
    name.padEnd(10) +
      String(m.chars).padStart(5) +
      String(m.bytes).padStart(8) +
      String(m.nonSpace).padStart(11) +
      String(m.words).padStart(8) +
      ('1 : ' + ratio + 'x').padStart(18)
  );
}

// The glyph tax, per symbol. ASCII glyphs are 1 byte; the exotic ones are more.
console.log('\nbyte size of each APL-SI glyph (ASCII = 1):');
const glyphs = ['+', '-', '×', '÷', '⌈', '⌊', '|', '*', '⍳', '≢', '◆', '⎕', '⍞'];
for (const g of glyphs) {
  const b = Buffer.byteLength(g, 'utf8');
  console.log('  ' + g + '  ' + b + ' byte' + (b === 1 ? '' : 's'));
}
console.log(
  '\nASCII glyphs cost 1 byte and are cheap to tokenize. The exotic glyphs cost 2 to 4 bytes,\n' +
    'and a byte-level tokenizer usually spends 2 or 3 tokens on each. That is the tax.\n'
);
