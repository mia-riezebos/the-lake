// Monte Carlo sweep per switch set: how often the lake empties (ever, and after the opening
// boom has passed), and mean stock, catch and cheaters over the final seasons.
// Usage: node bench.mjs [seeds=200] [seasons=300]
import { ALL_OFF, ALL_ON, PRINCIPLES, createState, step } from "./sim.js";

const [seeds = 200, seasons = 300] = process.argv.slice(2).map(Number);
const TAIL = 50; // seasons averaged at the end of each run
const SETTLED = 100; // seasons after which a collapse counts as "late"

const pct = (n) => `${((100 * n) / seeds).toFixed(0)}%`;
function run(sw) {
  let ever = 0, late = 0, stock = 0, haul = 0, cheat = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    let s = createState(seed);
    let e = false, l = false;
    for (let t = 0; t < seasons; t++) {
      s = step(s, sw);
      e ||= s.collapsed;
      l ||= t >= SETTLED && s.collapsed;
      if (t < seasons - TAIL) continue;
      stock += s.last.S / TAIL;
      haul += s.last.catch / TAIL;
      cheat += s.last.cheaters / TAIL;
    }
    ever += e;
    late += l;
  }
  return { emptied: pct(ever), [`after ${SETTLED}`]: pct(late), stock: Math.round(stock / seeds), catch: Math.round(haul / seeds), cheaters: +(cheat / seeds).toFixed(1) };
}

const rows = { "all on": run(ALL_ON), "all off": run(ALL_OFF) };
for (const k of PRINCIPLES) rows[`on − ${k}`] = run({ ...ALL_ON, [k]: false });
for (const k of PRINCIPLES) rows[`off + ${k}`] = run({ ...ALL_OFF, [k]: true });
// Principles work as a set: these two help together and hurt without a catch limit.
rows["off + boundaries + nested"] = run({ ...ALL_OFF, boundaries: true, nested: true });
console.table(rows);
