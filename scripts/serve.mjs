/* A local Chalk, for editing and checking plays before they ship.
 *
 *   node scripts/serve.mjs        then open http://localhost:5173
 *
 * No dependencies and nothing to install. It exists because file:// gives the
 * page an opaque origin, where localStorage is unreliable and a service worker
 * will not register — so edits would vanish and nothing would behave the way
 * it does on the real site.
 *
 * Nothing is cached, so a save plus a refresh is the whole edit loop.
 */

import { createServer } from "node:http";
import { readFile, stat, writeFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readPlaybook, bakeInto, BakeError } from "./lib-bake.mjs";

const ROOT = resolve(fileURLToPath(new URL("../", import.meta.url)));
const HTML = resolve(ROOT, "index.html");
const PORT = Number(process.env.PORT) || 5173;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".mjs":  "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png":  "image/png",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".md":   "text/markdown; charset=utf-8"
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");

    // The editor posts its playbook here to bake it into index.html. Local
    // only, and only ever reachable while this script is running.
    if (url.pathname === "/__save" && req.method === "PUT") {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      try {
        const plays = readPlaybook(Buffer.concat(chunks).toString("utf8"));
        const r = bakeInto(await readFile(HTML, "utf8"), plays);
        await writeFile(HTML, r.html, "utf8");
        console.log(`saved ${r.count} plays (${r.checked} checked) — version ${r.from} -> ${r.to}`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, ...r, html: undefined }));
      } catch (err) {
        const msg = err instanceof BakeError ? err.message : String(err && err.message);
        console.error("save refused: " + msg);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: msg }));
      }
      return;
    }

    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith("/")) rel += "index.html";

    // never serve anything above the project root
    const path = join(ROOT, normalize(rel).replace(/^(\.\.[/\\])+/, ""));
    if (!path.startsWith(ROOT)) { res.writeHead(403).end("Forbidden"); return; }

    const info = await stat(path).catch(() => null);
    if (!info || !info.isFile()) { res.writeHead(404).end("Not found: " + rel); return; }

    const body = await readFile(path);
    res.writeHead(200, {
      "Content-Type": TYPES[extname(path).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
      "Service-Worker-Allowed": "/"
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500).end(String(err && err.message));
  }
}).listen(PORT, () => {
  console.log("Chalk is running at http://localhost:" + PORT);
  console.log("Edit plays in the browser, then: node scripts/bake.mjs <exported.json>");
});
