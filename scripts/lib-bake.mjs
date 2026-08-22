/* Turning an edited playbook back into source. Shared by the bake script and
   the dev server's save endpoint, so both do exactly the same thing. */

export const ARRAY_MARK   = "const BUILTIN = [";
export const VERSION_MARK = "const BUILTIN_VERSION = ";

export class BakeError extends Error {}

/** Pull the plays out of whatever the editor's backup box produced. */
export function readPlaybook(raw) {
  let data;
  try { data = JSON.parse(raw); }
  catch (e) { throw new BakeError("that is not JSON. Copy the whole box, including the braces."); }

  const plays = Array.isArray(data) ? data : data && data.plays;
  if (!Array.isArray(plays) || !plays.length) throw new BakeError("no plays in there.");

  // This becomes what every device gets, so refuse anything obviously broken.
  plays.forEach((p, i) => {
    if (!p.id)   throw new BakeError(`play ${i + 1} has no id.`);
    if (!p.name) throw new BakeError(`play ${i + 1} (${p.id}) has no name.`);
    if (!Array.isArray(p.men) || !p.men.length) throw new BakeError(`play "${p.name}" has no players.`);
    p.men.forEach(m => {
      if (!m.p) throw new BakeError(`a player in "${p.name}" has no position label.`);
      if (typeof m.x !== "number" || typeof m.y !== "number")
        throw new BakeError(`${m.p} in "${p.name}" has no position on the field.`);
    });
  });
  const ids = plays.map(p => p.id);
  const dupe = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dupe) throw new BakeError(`two plays share the id "${dupe}".`);

  return plays;
}

/** Rewrite BUILTIN and bump BUILTIN_VERSION. Returns the new html and versions. */
export function bakeInto(html, plays) {
  const start = html.indexOf(ARRAY_MARK);
  if (start < 0) throw new BakeError("could not find BUILTIN in index.html.");
  // everything inside the array is indented, so the first line-initial "];"
  // after the opening is where it ends
  const end = html.indexOf("\n];", start);
  if (end < 0) throw new BakeError("could not find the end of BUILTIN in index.html.");

  const body = plays.map(p => JSON.stringify(p, null, 2)).join(",\n");
  let out = html.slice(0, start) + ARRAY_MARK + "\n" + body + html.slice(end);

  const vAt = out.indexOf(VERSION_MARK);
  if (vAt < 0) throw new BakeError("could not find BUILTIN_VERSION in index.html.");
  const vEnd = out.indexOf(";", vAt);
  const from = Number(out.slice(vAt + VERSION_MARK.length, vEnd).trim()) || 0;
  const to = from + 1;
  out = out.slice(0, vAt) + VERSION_MARK + to + out.slice(vEnd);

  return { html: out, from, to, count: plays.length,
           checked: plays.filter(p => p.verified).length };
}
