// Drive index.html in headless Chromium over CDP: run a script, wait, screenshot, print console output.
// Usage: node shot.mjs <out.png> [width=728] [waitMs=3000] [js to evaluate after load]
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [out, width = "728", wait = "3000", js = ""] = process.argv.slice(2);
const port = 9300 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(join(process.env.TMPDIR ?? tmpdir(), "lake-chromium-"));
const browser = spawn("chromium", ["--headless=new", "--no-sandbox", "--hide-scrollbars", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, `--window-size=${width},1400`, "about:blank"], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  target = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json()).then((ts) => ts.find((t) => t.type === "page")).catch(() => null);
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0;
const pending = new Map();
ws.addEventListener("message", ({ data }) => {
  const m = JSON.parse(data);
  if (m.id) pending.get(m.id)?.(m);
  if (m.method === "Runtime.consoleAPICalled") console.log("console:", m.params.args.map((a) => a.value ?? a.description).join(" "));
  if (m.method === "Runtime.exceptionThrown") console.log("EXCEPTION:", m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

await send("Runtime.enable");
await send("Page.enable");
await send("Emulation.setFocusEmulationEnabled", { enabled: true });
await send("Emulation.setDeviceMetricsOverride", { width: +width, height: 1400, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: `file://${process.cwd()}/${process.env.PAGE ?? "index.html"}` });
await sleep(800);
if (js) {
  const r = await send("Runtime.evaluate", { expression: js, awaitPromise: true, returnByValue: true });
  if (r.result?.result?.value !== undefined) console.log("eval:", JSON.stringify(r.result.result.value));
}
await sleep(+wait);
const { result } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
writeFileSync(out, Buffer.from(result.data, "base64"));
console.log("wrote", out);
ws.close();
browser.kill();
