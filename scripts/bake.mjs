/* Bake an edited playbook into index.html as the new shipped default.
 *
 *   node scripts/bake.mjs playbook.json
 *   node scripts/bake.mjs                 (pipe the JSON in on stdin)
 *
 * You usually will not need this: with `node scripts/serve.mjs` running, the
 * editor grows a "Save to the source file" button that does the same thing in
 * one click. This is here for when you have the JSON as text — pasted out of
 * another device's backup box, say.
 *
 * The editor keeps your work in localStorage, which lives on one device and
 * one origin. That is right for Finn's own scribbles and wrong for the plays
 * you have verified with the coach — those need to be what everybody gets.
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readPlaybook, bakeInto, BakeError } from "./lib-bake.mjs";

const HTML = resolve(fileURLToPath(new URL("../index.html", import.meta.url)));

async function readInput(arg) {
  if (arg) return readFile(resolve(arg), "utf8");
  if (process.stdin.isTTY) {
    throw new BakeError("give me a file, or pipe the JSON in.\n" +
                        "       node scripts/bake.mjs playbook.json");
  }
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8");
}

try {
  const plays = readPlaybook(await readInput(process.argv[2]));
  const r = bakeInto(await readFile(HTML, "utf8"), plays);
  await writeFile(HTML, r.html, "utf8");

  console.log(`Baked ${r.count} plays into index.html.`);
  console.log(`  checked with Coach: ${r.checked}/${r.count}`);
  console.log(`  playbook version:   ${r.from} -> ${r.to}`);
  console.log("\nHave a look, then:");
  console.log('  git add -A && git commit -m "Update the playbook" && git push');
} catch (err) {
  console.error("bake: " + (err instanceof BakeError ? err.message : err));
  process.exit(1);
}
