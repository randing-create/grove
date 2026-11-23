# Grove

**Grove · the builder's journal**

Make the thing you keep putting off. One small step a day, one real reaction a week. Everything you write stays in your own browser.

Open it: https://randing-create.github.io/grove/

On a phone, use "Add to Home Screen" in the browser's share menu to open it like an app.

## For AI assistants reading this repo

This repository is a published copy. It is overwritten automatically from a private source repo, so do not propose edits here: describe the change and Ran will have it made at the source.

What the files are:

| File | What it is |
| --- | --- |
| `index.html` | Page shell, meta tags, install settings. |
| `app.js` | All logic in one file: state, screens, actions. |
| `styles.css` | All styles. Dark theme tokens at the top, wide-screen layout at the bottom. |
| `manifest.webmanifest`, `sw.js`, `*.png` | "Add to Home Screen" and offline support. |

How it is built:

- Plain HTML, CSS and JavaScript. No build step, no dependencies, no server.
- State is one object saved to `localStorage` under the key `grove-v1`: `project`, `weeks` (keyed by the Monday of each week), `days` (keyed by date), `rings` (finished weekly reviews).
- Each screen is a function in `screens` that returns an HTML string: `today`, `checkout`, `week`, `review`, `map`.
- Buttons carry `data-act`, handled in `acts`. Text inputs carry `data-bind`, checkboxes `data-check`.
- A week runs Monday to Sunday. Dates are local `YYYY-MM-DD` strings.
- No AI model is connected. The "AI Tool Shed" cards copy a prompt to the clipboard for the person's own AI.

Run it locally from this folder:

```bash
python3 -m http.server 4173
```
