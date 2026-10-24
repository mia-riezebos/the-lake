// Monte Carlo sweep: collapse rate, mean stock and catch per switch set.
// Usage: node bench.mjs [seeds=200] [seasons=150]
import { ALL_OFF, ALL_ON, PRINCIPLES, createState, step } from "./sim.js";

const [seeds = 200, seasons = 150] = process.argv.slice(2).map(Number);

function run(sw) {
  let collapses = 0, stock = 0, haul = 0, cheat = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    let s = createState(seed);
    let ever = false;
    for (let t = 0; t < seasons; t++) {
      s = step(s, sw);
      ever ||= s.collapsed;
    }
    collapses += ever;
    const tail = s.history.slice(-50);
    stock += tail.reduce((a, h) => a + h.S, 0) / tail.length;
    haul += tail.reduce((a, h) => a + h.catch, 0) / tail.length;
    cheat += tail.reduce((a, h) => a + h.cheaters, 0) / tail.length;
  }
  return { collapse: `${((100 * collapses) / seeds).toFixed(0)}%`, stock: Math.round(stock / seeds), catch: Math.round(haul / seeds), cheaters: +(cheat / seeds).toFixed(1) };
}

const rows = { "all on": run(ALL_ON), "all off": run(ALL_OFF) };
for (const k of PRINCIPLES) rows[`on − ${k}`] = run({ ...ALL_ON, [k]: false });
for (const k of PRINCIPLES) rows[`off + ${k}`] = run({ ...ALL_OFF, [k]: true });
console.table(rows);
