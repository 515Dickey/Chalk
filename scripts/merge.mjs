/* Merge a change-set into index.html.
 *
 *   node scripts/merge.mjs changes.json
 *   node scripts/merge.mjs                 (pipe it in on stdin)
 *
 * This is the away-from-home half of the loop. Edit plays anywhere the site is
 * open — the office, a phone — then "Copy just my changes" in the editor and
 * paste the result here. Only the plays you touched travel, so it stays small
 * enough to send in a message.
 *
 * Takes { changed: [play, ...], deleted: [id, ...] }. A changed play with a
 * known id replaces that play; an unknown id is added to the end.
 * Also accepts a whole playbook ({ plays: [...] }) and replaces everything.
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readPlaybook, bakeInto, BakeError } from "./lib-bake.mjs";

const HTML = resolve(fileURLToPath(new URL("../index.html", import.meta.url)));

async function readInput(arg) {
  if (arg) return readFile(resolve(arg), "utf8");
  if (process.stdin.isTTY) throw new BakeError("give me a file, or pipe the JSON in.");
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8");
}

try {
  const raw = await readInput(process.argv[2]);
  let data;
  try { data = JSON.parse(raw); }
  catch (e) { throw new BakeError("that is not JSON. Copy the whole box, braces included."); }

  const html = await readFile(HTML, "utf8");
  const start = html.indexOf("const BUILTIN = [");
  const end = html.indexOf("\n];", start);
  let book = JSON.parse(html.slice(start + "const BUILTIN = ".length, end + 2));

  let summary;
  if (Array.isArray(data.plays)) {
    book = readPlaybook(raw);                       // a whole playbook: replace
    summary = [`replaced the whole book with ${book.length} plays`];
  } else {
    const changed = Array.isArray(data.changed) ? data.changed : [];
    const deleted = Array.isArray(data.deleted) ? data.deleted : [];
    if (!changed.length && !deleted.length) throw new BakeError("no changes in there.");

    summary = [];
    for (const p of changed) {
      const i = book.findIndex(b => b.id === p.id);
      if (i >= 0) { book[i] = p; summary.push(`updated  ${p.name}`); }
      else        { book.push(p); summary.push(`ADDED    ${p.name}`); }
    }
    for (const id of deleted) {
      const i = book.findIndex(b => b.id === id);
      if (i >= 0) { summary.push(`DELETED  ${book[i].name}`); book.splice(i, 1); }
    }
    book.forEach((p, i) => { p.n = i + 1; });
    // run the finished book through the same checks a full save gets
    readPlaybook(JSON.stringify({ plays: book }));
  }

  const r = bakeInto(html, book);
  await writeFile(HTML, r.html, "utf8");

  summary.forEach(line => console.log("  " + line));
  console.log(`\n${r.count} plays · ${r.checked} checked with Coach · version ${r.from} -> ${r.to}`);
  console.log('\n  git add -A && git commit -m "Update the playbook" && git push');
} catch (err) {
  console.error("merge: " + (err instanceof BakeError ? err.message : err));
  process.exit(1);
}
