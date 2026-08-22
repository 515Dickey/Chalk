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

## How it is built

One static HTML file. No build step, no framework, no dependencies, no server.
Everything renders to inline SVG.

- `index.html` — the whole app
- `manifest.webmanifest`, `sw.js`, `icons/` — installs to a home screen and
  keeps working with no signal, which matters at a practice field

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
