// Inlines sim.js into index.src.html, producing a single self-contained index.html.
import { readFileSync, writeFileSync } from "node:fs";

const sim = readFileSync(new URL("./sim.js", import.meta.url), "utf8").replace(/^export /gm, "");
const html = readFileSync(new URL("./index.src.html", import.meta.url), "utf8").replace("/*SIM*/", () => sim);
writeFileSync(new URL("./index.html", import.meta.url), html);
console.log(`index.html ${(html.length / 1024).toFixed(1)} KiB`);
