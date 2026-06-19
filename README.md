# Policy Cancellation Form Filler

A tiny browser app that takes a few details, writes them onto a PDF, and
downloads the filled copy. Everything runs **locally in your browser** —
no server, no install, and the PDF never leaves your computer.

## Security: nothing leaves the machine

This app makes **zero network requests**. There is no form submission, no
upload, no analytics, and no third-party scripts:

- The PDF library (`pdf-lib`) is **bundled locally** in `vendor/` — it is
  *not* loaded from a CDN.
- Your input is read in-memory, written onto the PDF in the browser, and
  handed back to you as a download. None of it is transmitted anywhere.

You can verify this yourself:

- Open the browser's **DevTools → Network** tab and use the app — you'll
  see no outbound requests for your data.
- Or **disconnect from the internet entirely** and confirm it still works.

The whole app is plain static files (`index.html`, `styles.css`,
`app.js`, `vendor/pdf-lib.min.js`) — readable, with no build step and no
hidden dependencies.

## Fields

- Name
- Address
- Previous Company
- Home Policy Number
- Auto Policy Number
- Umbrella Policy Number
- Cancellation Date
- Generated Date *(auto-filled with today's date as "Month Day, Year", e.g. June 19, 2026 — no input needed)*

## How to use it

1. Open `index.html` in any modern browser (double-click it, or host it —
   see below).
2. Fill in the form.
3. Pick your PDF with **Choose a PDF file**, or bundle it as `form.pdf`
   (see below) so it loads automatically.
4. Click **Fill PDF & Download**.

> Works **fully offline** — no internet connection is ever needed.
>
> Note: when you open the file directly with `file://` (double-click),
> some browsers block auto-loading a bundled `form.pdf` for local-file
> security reasons. The **Choose a PDF file** picker always works in that
> case. If you want the bundled `form.pdf` to auto-load, serve the folder
> locally (e.g. `python3 -m http.server` and open `http://localhost:8000`)
> — that server runs only on your machine and still sends nothing out.

## Bundling your PDF

Drop your PDF into this folder and name it `form.pdf`. The app will load
it automatically; the file picker then becomes optional (and overrides it).

## Two filling modes (handled automatically)

- **If your PDF has real fillable fields** (an AcroForm), the app fills
  them by name. Adjust the `acroName` values in `app.js` (in `FIELDS`) to
  match your PDF's field names.
- **If your PDF is flat** (no fields — most common), the app stamps text
  at x/y coordinates, like placing text boxes. Set those positions in the
  `FIELD_LAYOUT` object in `app.js`.

### Finding coordinates for a flat PDF

1. Load your PDF and click **Download coordinate grid**.
2. Open the grid PDF — it has a ruler in PDF points, measured from the
   **bottom-left** corner.
3. Read off the x/y where each value should go and update `FIELD_LAYOUT`
   in `app.js`.

## Hosting (optional)

To give it a URL instead of a local file, enable **GitHub Pages** on this
repo (Settings → Pages → deploy from branch). The app is plain static
files, so it works as-is.

## Files

| File | Purpose |
|------|---------|
| `index.html` | The form and buttons |
| `styles.css` | Styling |
| `app.js` | Form-reading and PDF-filling logic (edit field names / coordinates here) |
| `vendor/pdf-lib.min.js` | The bundled PDF library (so there are no external/CDN requests) |
| `form.pdf` | *(you add this)* the PDF template |
