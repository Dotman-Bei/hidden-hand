// The closing footer's overlap check (part of `pnpm --filter @hidden-hand/web verify`).
//
// Builds the production site into dist (sync-kit + vite build; `--no-build` reuses dist), serves it on
// 127.0.0.1, and in one headless Chrome or Edge (raw DevTools protocol, no extra dependency) loads
// /, /app/ (wallet mode) and /app/?mode=express at nine widths. At each it scrolls the footer into view and
// reads the boxes of the footer's text: the h2, the lead, the button, the giant word, the brand, the lede,
// every link list item and the legal lines. It fails on any two boxes that intersect (0px allowed), on the
// word overflowing its row or the .wrap (a clipped glyph), on the rows out of order (head, word, links,
// legal) and on anything outside the footer's own box. Every violation is printed; the exit code is 1 then
// (2 when the build or the browser cannot run).
// Flags: --no-build (reuse dist), --height <px> (the wide runs at another screen height), --shots <dir>
// (a screenshot of every run), --dump (every box as JSON).
import { spawn, spawnSync } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(WEB, "dist");
const PAGES = ["/", "/app/", "/app/?mode=express"];
const WIDTHS = [390, 768, 820, 1024, 1280, 1440, 1731, 1920, 2560];
const args = process.argv.slice(2);
// --height <px> reads the wide runs at another screen height (a shorter laptop window); --dump prints every box
const hArg = args.indexOf("--height");
const heightFor = (w) => (w === 390 ? 844 : hArg >= 0 ? Number(args[hArg + 1]) : 900);
// --shots <dir> writes a screenshot of the whole footer for every run
const sArg = args.indexOf("--shots");
const shotsDir = sArg >= 0 ? resolve(args[sArg + 1]) : null;
if (shotsDir) mkdirSync(shotsDir, { recursive: true });

function fail(msg) {
  console.error(`footer-overlap: ${msg}`);
  process.exit(2);
}

// ---------------------------------------------------------------- build
if (!args.includes("--no-build")) {
  const steps = [
    [join(WEB, "scripts", "sync-kit.mjs")],
    [join(WEB, "node_modules", "vite", "bin", "vite.js"), "build", "--logLevel", "error"],
  ];
  for (const s of steps) {
    const r = spawnSync(process.execPath, s, { cwd: WEB, encoding: "utf8" });
    if (r.status !== 0) {
      process.stdout.write(r.stdout ?? "");
      process.stderr.write(r.stderr ?? "");
      fail(`build step failed: node ${s.join(" ")}`);
    }
  }
}
if (!existsSync(join(DIST, "index.html")) || !existsSync(join(DIST, "app", "index.html"))) fail("dist/index.html or dist/app/index.html is missing");

// ---------------------------------------------------------------- serve dist
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".woff2": "font/woff2", ".wasm": "application/wasm" };
const server = http.createServer((req, res) => {
  try {
    let f = resolve(join(DIST, decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname)));
    if (f !== DIST && !f.startsWith(DIST + sep)) { res.writeHead(403); res.end(); return; }
    if (statSync(f).isDirectory()) f = join(f, "index.html");
    statSync(f);
    res.writeHead(200, { "content-type": MIME[extname(f).toLowerCase()] ?? "application/octet-stream", "cache-control": "no-store" });
    createReadStream(f).pipe(res);
  } catch {
    res.writeHead(404); res.end("not found");
  }
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const addr = server.address();
const BASE = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}`;

// ---------------------------------------------------------------- one headless browser
function findBrowser() {
  const local = process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe") : null;
  const list = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe", local,
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
  for (const c of list) if (c && existsSync(c)) return c;
  return null;
}
const exe = findBrowser();
if (!exe) { server.close(); fail("no Chrome, Edge or Chromium found (set CHROME_PATH)"); }
const profile = mkdtempSync(join(tmpdir(), "hh-footer-overlap-"));
const chrome = spawn(exe, ["--headless=new", `--user-data-dir=${profile}`, "--remote-debugging-port=0", "--no-first-run", "--no-default-browser-check",
  "--disable-extensions", "--disable-background-networking", "--disable-gpu", "--mute-audio", "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });

function cleanup() {
  try { server.close(); } catch { /* closed */ }
  try { chrome.kill(); } catch { /* gone */ }
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* a locked profile file stays in the OS temp folder */ }
}

const wsUrl = await new Promise((ok, no) => {
  let buf = "";
  const t = setTimeout(() => no(new Error("browser did not open its DevTools port in 30 s")), 30_000);
  chrome.stderr.on("data", (d) => {
    buf += String(d);
    const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) { clearTimeout(t); ok(m[1]); }
  });
  chrome.on("exit", () => { clearTimeout(t); no(new Error("browser exited before its DevTools port opened")); });
}).catch((e) => { cleanup(); fail(e.message); });

const ws = new WebSocket(wsUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = () => no(new Error("DevTools socket error")); }).catch((e) => { cleanup(); fail(e.message); });
let nextId = 1;
const pending = new Map();
const listeners = new Set();
ws.onmessage = (ev) => {
  const msg = JSON.parse(String(ev.data));
  if (msg.id && pending.has(msg.id)) {
    const { ok, no } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) no(new Error(msg.error.message)); else ok(msg.result);
  } else if (msg.method) {
    for (const l of listeners) l(msg);
  }
};
function send(method, params = {}, sessionId) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  return new Promise((ok, no) => pending.set(id, { ok, no }));
}
function once(method, sessionId, ms) {
  return new Promise((ok, no) => {
    const t = setTimeout(() => { listeners.delete(l); no(new Error(`timed out waiting for ${method}`)); }, ms);
    const l = (m) => { if (m.method === method && m.sessionId === sessionId) { clearTimeout(t); listeners.delete(l); ok(m.params); } };
    listeners.add(l);
  });
}
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));

// ---------------------------------------------------------------- the measurement, run inside the page
function measure() {
  const footer = document.querySelector("footer.closing");
  if (!footer) return { error: "no footer.closing on the page" };
  const shown = (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0;
  };
  const box = (r) => ({ x: Math.round(r.left * 10) / 10, y: Math.round(r.top * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, r: r.right, b: r.bottom, l: r.left, t: r.top });
  const groups = [
    ["head", ".closing__cta h2", "h2"],
    ["head", ".closing__cta .section-head--split p", "lead"],
    ["head", ".closing__cta .btn", "button"],
    ["links", ".closing__links .nav__logo", "brand"],
    ["links", ".closing__links .footer__lede", "lede"],
    ["links", ".closing__links .footer__col h3", "column heading"],
    ["links", ".closing__links .footer__col li", "link"],
    ["legal", ".closing__links .footer__legal > *", "legal"],
  ];
  const items = [];
  for (const [row, sel, name] of groups) {
    footer.querySelectorAll(sel).forEach((el, i) => {
      if (!shown(el)) return;
      const label = `${name}${el.textContent ? ` "${el.textContent.trim().replace(/\s+/g, " ").slice(0, 32)}"` : ""}`;
      items.push({ row, sel: `${sel}:nth(${i})`, label, box: box(el.getBoundingClientRect()) });
    });
  }
  const word = footer.querySelector(".close__word");
  let wordItem = null;
  const wordFacts = {};
  if (word && shown(word)) {
    // the word's box is its element box joined with its text's own box (the font's ascent and descent),
    // so glyphs drawn past a tight line-height count as the word
    const er = word.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(word);
    const tr = range.getBoundingClientRect();
    const u = { left: Math.min(er.left, tr.left), top: Math.min(er.top, tr.top), right: Math.max(er.right, tr.right), bottom: Math.max(er.bottom, tr.bottom) };
    u.width = u.right - u.left; u.height = u.bottom - u.top;
    wordItem = { row: "word", sel: ".close__word", label: 'word "Hidden Hand"', box: box(u) };
    wordFacts.textWidth = tr.width;
    wordFacts.scrollWidth = word.scrollWidth;
    wordFacts.clientWidth = word.clientWidth;
    wordFacts.fontSize = getComputedStyle(word.firstElementChild ?? word).fontSize;
  }
  const wrap = footer.querySelector(":scope > .wrap");
  return {
    footer: box(footer.getBoundingClientRect()),
    wrap: wrap ? box(wrap.getBoundingClientRect()) : null,
    items,
    word: wordItem,
    wordFacts,
    fonts: [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family.replace(/"/g, "")),
    vw: innerWidth,
  };
}

function hit(a, b) {
  const w = Math.min(a.r, b.r) - Math.max(a.l, b.l);
  const h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
  return w > 0.01 && h > 0.01;
}
const fmt = (b) => `[x ${b.x} y ${b.y} w ${b.w} h ${b.h}]`;

function judge(page, width, m) {
  const out = [];
  const tag = `${page} @${width}`;
  if (m.error) return [`${tag}: ${m.error}`];
  if (!m.word) out.push(`${tag}: .close__word is missing or hidden`);
  const all = m.word ? [...m.items, m.word] : [...m.items];
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      if (hit(all[i].box, all[j].box)) out.push(`${tag}: ${all[i].sel} (${all[i].label}) ${fmt(all[i].box)} overlaps ${all[j].sel} (${all[j].label}) ${fmt(all[j].box)}`);
    }
  }
  const f = m.footer;
  for (const it of all) {
    const b = it.box;
    if (b.l < f.l - 0.5 || b.r > f.r + 0.5 || b.t < f.t - 0.5 || b.b > f.b + 0.5) out.push(`${tag}: ${it.sel} (${it.label}) ${fmt(b)} lies outside footer.closing ${fmt(f)}`);
  }
  if (m.word && m.wrap) {
    const b = m.word.box;
    if (b.l < m.wrap.l - 0.5 || b.r > m.wrap.r + 0.5) out.push(`${tag}: .close__word ${fmt(b)} runs past the .wrap ${fmt(m.wrap)} (text ${Math.round(m.wordFacts.textWidth)}px at ${m.wordFacts.fontSize})`);
    if (m.wordFacts.scrollWidth > m.wordFacts.clientWidth + 1) out.push(`${tag}: .close__word is clipped: scrollWidth ${m.wordFacts.scrollWidth} > clientWidth ${m.wordFacts.clientWidth} at ${m.wordFacts.fontSize}`);
  }
  // the rows in order, top to bottom: head, word, links, legal
  const rows = ["head", "word", "links", "legal"];
  const span = (row) => {
    const xs = all.filter((it) => it.row === row);
    return xs.length ? { top: Math.min(...xs.map((x) => x.box.t)), bottom: Math.max(...xs.map((x) => x.box.b)), n: xs.length } : null;
  };
  for (let i = 0; i < rows.length - 1; i++) {
    const a = span(rows[i]);
    const b = span(rows[i + 1]);
    if (!a || !b) { out.push(`${tag}: row "${!a ? rows[i] : rows[i + 1]}" has no visible element`); continue; }
    if (a.bottom > b.top + 0.01) out.push(`${tag}: row "${rows[i]}" ends at y ${Math.round(a.bottom * 10) / 10}, under the top of row "${rows[i + 1]}" at y ${Math.round(b.top * 10) / 10}`);
  }
  return out;
}

// ---------------------------------------------------------------- run every page at every width
const violations = [];
const runs = [];
const fontNotes = new Set();
try {
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId);
  for (const page of PAGES) {
    for (const width of WIDTHS) {
      const height = heightFor(width);
      await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 640 }, sessionId);
      const loaded = once("Page.loadEventFired", sessionId, 30_000);
      await send("Page.navigate", { url: BASE + page }, sessionId);
      await loaded;
      await send("Runtime.evaluate", { expression: "document.fonts.ready.then(() => true)", awaitPromise: true }, sessionId);
      await sleep(400);
      await send("Runtime.evaluate", { expression: "document.querySelector('footer.closing')?.scrollIntoView({ block: 'start' }); new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))", awaitPromise: true }, sessionId);
      await sleep(250);
      const res = await send("Runtime.evaluate", { expression: `(${measure.toString()})()`, returnByValue: true }, sessionId);
      const m = res.result.value;
      if (!m.fonts?.includes("Chivo")) fontNotes.add(`${page} @${width}`);
      if (shotsDir) {
        // the screen as a visitor sees it with the footer at its top; a footer taller than the screen gets a
        // second shot of its foot (never a resized capture: that changes 100svh and so the layout)
        const name = `${page === "/" ? "index" : page.includes("express") ? "app-express" : "app-wallet"}-${width}`;
        const shot = await send("Page.captureScreenshot", { format: "png" }, sessionId);
        writeFileSync(join(shotsDir, `${name}.png`), Buffer.from(shot.data, "base64"));
        if (m.footer.h > height + 1) {
          await send("Runtime.evaluate", { expression: "scrollTo(0, document.documentElement.scrollHeight); new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))", awaitPromise: true }, sessionId);
          const foot = await send("Page.captureScreenshot", { format: "png" }, sessionId);
          writeFileSync(join(shotsDir, `${name}-foot.png`), Buffer.from(foot.data, "base64"));
        }
      }
      if (args.includes("--dump")) console.log(JSON.stringify({ page, width, height, footer: m.footer, wrap: m.wrap, word: m.word?.box, wordFacts: m.wordFacts, items: m.items?.map((i) => [i.label, i.box.y, i.box.h, i.box.x, i.box.w]) }));
      const v = judge(page, width, m);
      violations.push(...v);
      runs.push(`${page}@${width}`);
      console.log(`footer-overlap: ${v.length ? "FAIL" : "ok  "} ${page} @${width}x${height} (${m.items?.length ?? 0} text boxes + the word at ${m.wordFacts?.fontSize ?? "?"})`);
    }
  }
} catch (e) {
  cleanup();
  fail(`browser run failed: ${e instanceof Error ? e.message : String(e)}`);
}
try { ws.close(); } catch { /* closed */ }
cleanup();

if (fontNotes.size) console.log(`footer-overlap: note: the Chivo face did not load in ${fontNotes.size} run(s) (offline?); boxes were read in the fallback face`);
if (violations.length) {
  for (const v of violations) console.error(`footer-overlap: VIOLATION ${v}`);
  console.error(`FOOTER-OVERLAP: FAIL ${violations.length} violation(s) in ${runs.length} runs`);
  process.exit(1);
}
console.log(`FOOTER-OVERLAP: PASS ${runs.length}/${PAGES.length * WIDTHS.length} runs: ${runs.join(" ")}`);
process.exit(0);
