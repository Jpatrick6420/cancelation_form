/* ------------------------------------------------------------------ *
 * Policy Cancellation Form Filler
 *
 * Runs entirely in the browser using pdf-lib. No data leaves the page.
 *
 * Two ways of filling are supported automatically:
 *   1. If the PDF has real (AcroForm) form fields, we fill them by name.
 *   2. If the PDF is flat (no fields), we STAMP text at x/y positions,
 *      like dropping a text box on the page. Edit FIELD_LAYOUT below to
 *      position each value. Use the "Download coordinate grid" button to
 *      figure out the right x/y numbers for your PDF.
 * ------------------------------------------------------------------ */

// ---- The form fields shown on the page -----------------------------
// `id` matches the <input> id in index.html.
// `acroName` is the PDF form-field name to try when the PDF has real
//   fields (we also try the id and the label as fallbacks).
const FIELDS = [
  { id: "name",            label: "Name",                   acroName: "Name" },
  { id: "address",         label: "Address",                acroName: "Address" },
  { id: "previousCompany", label: "Previous Company",       acroName: "PreviousCompany" },
  { id: "homePolicy",      label: "Home Policy Number",     acroName: "HomePolicy" },
  { id: "autoPolicy",      label: "Auto Policy Number",     acroName: "AutoPolicy" },
  { id: "umbrellaPolicy",  label: "Umbrella Policy Number", acroName: "UmbrellaPolicy" },
  { id: "cancelDate",      label: "Cancellation Date",      acroName: "CancelDate" },
];

// ---- Coordinate layout for FLAT PDFs -------------------------------
// Used only when the PDF has no real form fields.
//   page: 0-based page index
//   x, y: position in PDF points, measured from the BOTTOM-LEFT corner
//   size: font size
//
// These are placeholder positions. Tomorrow, once we have the real PDF,
// click "Download coordinate grid" to see the ruler, then update the
// x/y numbers here so each value lands in the right spot.
const FIELD_LAYOUT = {
  name:            { page: 0, x: 150, y: 700, size: 11 },
  address:         { page: 0, x: 150, y: 670, size: 11 },
  previousCompany: { page: 0, x: 150, y: 640, size: 11 },
  homePolicy:      { page: 0, x: 150, y: 610, size: 11 },
  autoPolicy:      { page: 0, x: 150, y: 580, size: 11 },
  umbrellaPolicy:  { page: 0, x: 150, y: 550, size: 11 },
  cancelDate:      { page: 0, x: 150, y: 520, size: 11 },
};

const OUTPUT_FILENAME = "cancellation-form-filled.pdf";

// --------------------------------------------------------------------
const { PDFDocument, StandardFonts, rgb } = PDFLib;

let bundledPdfBytes = null;  // bytes of form.pdf if it exists
let pickedPdfBytes = null;   // bytes of a user-chosen file

const els = {
  message: document.getElementById("message"),
  templateStatus: document.getElementById("template-status"),
  fileInput: document.getElementById("pdf-file"),
  fillBtn: document.getElementById("fill-btn"),
  gridBtn: document.getElementById("grid-btn"),
};

function setMessage(text, kind) {
  els.message.textContent = text;
  els.message.className = "message" + (kind ? " " + kind : "");
}

function getFormValues() {
  const values = {};
  for (const f of FIELDS) {
    values[f.id] = (document.getElementById(f.id).value || "").trim();
  }
  return values;
}

// Try to load a PDF that's bundled next to the page (form.pdf).
async function loadBundledPdf() {
  try {
    const res = await fetch("form.pdf");
    if (!res.ok) throw new Error("not found");
    bundledPdfBytes = await res.arrayBuffer();
    els.templateStatus.innerHTML =
      'Using bundled <code>form.pdf</code>. (Choosing a file below overrides it.)';
  } catch {
    els.templateStatus.innerHTML =
      'No bundled <code>form.pdf</code> yet &mdash; choose a PDF file below to test.';
  }
}

// Returns the active PDF bytes (picked file wins over bundled).
function activePdfBytes() {
  return pickedPdfBytes || bundledPdfBytes;
}

// Fill the PDF and return the saved bytes.
async function fillPdf(srcBytes, values) {
  const pdfDoc = await PDFDocument.load(srcBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let form = null;
  try { form = pdfDoc.getForm(); } catch { /* no form */ }
  const acroFields = form ? form.getFields() : [];

  if (acroFields.length > 0) {
    // Mode 1: real form fields. Match by acroName, id, or label.
    const byName = new Map(acroFields.map((f) => [f.getName(), f]));
    for (const f of FIELDS) {
      const value = values[f.id];
      if (!value) continue;
      const field =
        byName.get(f.acroName) || byName.get(f.id) || byName.get(f.label);
      if (field && typeof field.setText === "function") {
        try { field.setText(value); } catch { /* not a text field */ }
      }
    }
    try { form.updateFieldAppearances(font); } catch { /* ignore */ }
  } else {
    // Mode 2: flat PDF. Stamp text at configured coordinates.
    const pages = pdfDoc.getPages();
    for (const f of FIELDS) {
      const value = values[f.id];
      const layout = FIELD_LAYOUT[f.id];
      if (!value || !layout) continue;
      const page = pages[layout.page] || pages[0];
      // Support multi-line text (e.g. address) by splitting on newlines.
      const lines = value.split(/\r?\n/);
      const lineHeight = (layout.size || 11) * 1.3;
      lines.forEach((line, i) => {
        page.drawText(line, {
          x: layout.x,
          y: layout.y - i * lineHeight,
          size: layout.size || 11,
          font,
          color: rgb(0, 0, 0),
        });
      });
    }
  }

  return pdfDoc.save();
}

// Stamp a coordinate grid on the PDF to help find x/y positions.
async function makeGrid(srcBytes) {
  const pdfDoc = await PDFDocument.load(srcBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const STEP = 50;
  const lineColor = rgb(0.8, 0.1, 0.1);

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();
    for (let x = 0; x <= width; x += STEP) {
      page.drawLine({
        start: { x, y: 0 }, end: { x, y: height },
        thickness: 0.5, color: lineColor, opacity: 0.4,
      });
      page.drawText(String(x), { x: x + 2, y: 4, size: 6, font, color: lineColor });
    }
    for (let y = 0; y <= height; y += STEP) {
      page.drawLine({
        start: { x: 0, y }, end: { x: width, y },
        thickness: 0.5, color: lineColor, opacity: 0.4,
      });
      page.drawText(String(y), { x: 2, y: y + 2, size: 6, font, color: lineColor });
    }
  }
  return pdfDoc.save();
}

function downloadBytes(bytes, filename) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---- Event wiring --------------------------------------------------
els.fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) { pickedPdfBytes = null; return; }
  pickedPdfBytes = await file.arrayBuffer();
  setMessage(`Loaded "${file.name}".`, "success");
});

els.fillBtn.addEventListener("click", async () => {
  const src = activePdfBytes();
  if (!src) {
    setMessage("Please choose a PDF file first (or add a bundled form.pdf).", "error");
    return;
  }
  try {
    setMessage("Filling PDF…");
    const out = await fillPdf(src.slice(0), getFormValues());
    downloadBytes(out, OUTPUT_FILENAME);
    setMessage("Done — your filled PDF has been downloaded.", "success");
  } catch (err) {
    console.error(err);
    setMessage("Something went wrong: " + err.message, "error");
  }
});

els.gridBtn.addEventListener("click", async () => {
  const src = activePdfBytes();
  if (!src) {
    setMessage("Please choose a PDF file first.", "error");
    return;
  }
  try {
    setMessage("Building coordinate grid…");
    const out = await makeGrid(src.slice(0));
    downloadBytes(out, "coordinate-grid.pdf");
    setMessage("Grid downloaded — use it to read x/y positions.", "success");
  } catch (err) {
    console.error(err);
    setMessage("Something went wrong: " + err.message, "error");
  }
});

loadBundledPdf();
