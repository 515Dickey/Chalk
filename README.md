# Chalk

Finn's 5th grade football playbook, as a tablet app. Sixteen plays drawn on a
field, with every player's job written out in plain English.

Built from a scanned copy of the coach's hand-drawn play sheet.

## What it does

**Study.** Pick a play and it draws itself on the field in the coach's own
notation. Tap a player — or pick your position in *which one are you?* — and
everything dims to just your job. **Run it** walks all eight players through
the play; motion happens first, then the snap.

**Edit.** Nothing about a hand-drawn sheet survives a transcription intact, and
league rules vary, so every play is editable on the device. Drag any player or
defender. Click open grass to add a node to a line, click and hold a node to
move it, right-click to delete it. Change assignments, rewrite the jobs, add or
remove players, add or delete plays.

## The notation

| Ink | Means |
| --- | --- |
| White line ending in a crossbar | Block that man |
| White line ending in an arrow | Run there |
| Thick amber arrow | Whoever has the football |
| Dotted amber arc | The throw |
| Blue dashed line | Move before the snap |
| ◯ | Us · ✕ | Them |

## Correcting plays and shipping them

Edits in the browser go to `localStorage`, which is one device and one origin.
That is right for scribbles on a tablet and wrong for plays you have actually
checked with the coach — those need to become what everybody gets. So there is
a loop for turning a verified playbook back into source:

```
node scripts/serve.mjs          # then open http://localhost:5173
```

Edit and check plays as normal. Because you are on localhost, the editor grows
one extra button under **Back up or move this playbook**:

**Save to the source file** — writes the whole playbook into `BUILTIN` in
`index.html` and bumps `BUILTIN_VERSION`. Then:

```
git add -A && git commit -m "Update the playbook" && git push
```

Vercel deploys, and the next time a device opens the app it offers *"There is a
newer playbook than the one saved on this device"* — **Use the new one** or
**Keep mine**. Nobody's own edits are ever overwritten silently, and a device
that has drifted is never stuck on an old copy.

If the JSON is somewhere else — pasted out of another device's backup box, say
— `node scripts/bake.mjs playbook.json` does the same thing from the terminal.

Both paths refuse a playbook with a missing id, name, player or coordinate, or
with two plays sharing an id, rather than shipping something broken.

Use the local server rather than opening the file directly: `file://` gives the
page an opaque origin where `localStorage` is unreliable and a service worker
will not register, so nothing behaves the way it does on the real site.

## How it is built

One static HTML file. No build step, no framework, no dependencies, no server.
Everything renders to inline SVG.

- `index.html` — the whole app
- `manifest.webmanifest`, `sw.js`, `icons/` — installs to a home screen and
  keeps working with no signal, which matters at a practice field
- `scripts/serve.mjs` — the local dev server, and its save endpoint
- `scripts/bake.mjs`, `scripts/lib-bake.mjs` — a playbook back into source

Blocks can be aimed at a named defender (`on: "S"`), so dragging a defender
drags every block assigned to him. Draw or nudge a line by hand and that link
drops — what you drew is what you get.

`BUILTIN` in `index.html` is the original reading of the coach's sheet. `PLAYS`
is the edited copy, kept in `localStorage` under `chalk.playbook.v2`. *Undo my
changes to this play* restores one from `BUILTIN`.

## Privacy

Everything stays on the device. No accounts, no server, nothing transmitted.
That also means each device keeps its own playbook — *Back up or move this
playbook* in the editor copies it out as text to paste into another one.

## Still to check with the coach

The scan we worked from was cut off along one edge and nothing on it was
labelled, so parts of this are a best reading rather than gospel:

- **The left edge of the four pass plays is missing.** Play 1's left end has no
  assignment at all; the app says so rather than inventing one.
- **The play names are ours.** Only two labels are actually on the sheet:
  *reverse* and *QR 2PO*.
- **Jet Sweep Left and Jet Sweep Left (Crack)** are near-identical on the sheet.

Plays carry a *Mark as checked with Coach* flag. Use it to clear the warning on
each play as it gets confirmed.
