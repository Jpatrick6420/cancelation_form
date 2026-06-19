# Policy Cancellation Form Filler

A tiny browser app that takes a few details, writes them onto a PDF, and
downloads the filled copy. Everything runs **locally in your browser** —
no server, no install, and the PDF never leaves your computer.

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

> Requires an internet connection the first time, because it loads the
> `pdf-lib` library from a CDN. To run fully offline, download
> [pdf-lib.min.js](https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js)
> into this folder and change the script tag in `index.html` to
> `<script src="pdf-lib.min.js"></script>`.

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
| `form.pdf` | *(you add this)* the PDF template |
