/* ------------------------------------------------------------------ *
 * Stone Ridge Policy Cancellation Form Filler
 *
 * Designed for the new Stone Ridge cancellation request PDF.
 *
 * The Stone Ridge PDF is flat, so values are stamped onto the PDF
 * at the coordinates defined in FIELD_LAYOUT.
 *
 * Signature and Date Signed are intentionally left blank for DocuSign.
 * ------------------------------------------------------------------ */

const FIELDS = [
  { id: "name",            label: "Name" },
  { id: "email",           label: "Email Address" },
  { id: "phone",           label: "Phone Number" },
  { id: "previousCompany", label: "Insurance Carrier(s)" },

  { id: "homePolicy",      label: "Home Policy Number" },
  { id: "autoPolicy",      label: "Auto Policy Number" },
  { id: "umbrellaPolicy",  label: "Umbrella Policy Number" },

  // Enter these exactly as desired, for example:
  // Boat# ABC123
  // RV# XYZ456
  { id: "wildcard1",       label: "Other Policy" },
  { id: "wildcard2",       label: "Other Policy" },

  { id: "cancelDate",      label: "Cancellation Date" },
];

const OUTPUT_FILENAME = "cancellation-form-filled1.pdf";

const { PDFDocument, StandardFonts, rgb } = PDFLib;

let bundledPdfBytes = null;
let pickedPdfBytes = null;

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

function getInputValue(id) {
  const el = document.getElementById(id);
  return el ? (el.value || "").trim() : "";
}

function getFormValues() {
  const values = {};

  for (const f of FIELDS) {
    values[f.id] = getInputValue(f.id);
  }

  return values;
}

/* ------------------------------------------------------------------ *
 * POLICY NUMBER / LINE OF BUSINESS GENERATION
 * ------------------------------------------------------------------ */

function buildPolicies(values) {
  const policies = [];

  if (values.homePolicy) {
    policies.push({
      line: "Home",
      text: `Home# ${values.homePolicy}`,
    });
  }

  if (values.autoPolicy) {
    policies.push({
      line: "Auto",
      text: `Auto# ${values.autoPolicy}`,
    });
  }

  if (values.umbrellaPolicy) {
    policies.push({
      line: "Umbrella",
      text: `Umbrella# ${values.umbrellaPolicy}`,
    });
  }

  /*
   * Wildcards are printed exactly as entered.
   *
   * Examples:
   *   Boat# 123456
   *   RV# 998877
   *
   * For Line(s) of Business, everything before the # is used.
   */
  for (const id of ["wildcard1", "wildcard2"]) {
    const value = values[id];

    if (!value) continue;

    let line = "Other";

    if (value.includes("#")) {
      const possibleLine = value.split("#")[0].trim();
      if (possibleLine) line = possibleLine;
    }

    policies.push({
      line,
      text: value,
    });
  }

  return policies;
}

/* ------------------------------------------------------------------ *
 * STONE RIDGE PDF COORDINATES
 *
 * PDF coordinates start at the BOTTOM LEFT.
 *
 * These positions correspond to the boxes on the new one-page
 * Stone Ridge Policy lation Request.
 * ------------------------------------------------------------------ */

const FIELD_LAYOUT = {
  name: {
    page: 0,
    x: 26,
    y: 635,
    size: 11,
  },

  email: {
    page: 0,
    x: 304,
    y: 635,
    size: 11,
  },

  phone: {
    page: 0,
    x: 26,
    y: 590,
    size: 11,
  },

  previousCompany: {
    page: 0,
    x: 304,
    y: 590,
    size: 11,
  },

  policies: {
    page: 0,
    x: 26,
    y: 535,
    size: 11,
    lineHeight: 16,
  },

  Date: {
    page: 0,
    x: 26,
    y: 423,
    size: 11,
  },

  linesOfBusiness: {
    page: 0,
    x: 304,
    y: 423,
    size: 11,
    lineHeight: 16,
  },

  // Bottom authorization section.
  // Signature and Date Signed intentionally NOT included.
  printedName: {
    page: 0,
    x: 445,
    y: 264,
    size: 11,
  },
};

/* ------------------------------------------------------------------ *
 * DRAWING HELPERS
 * ------------------------------------------------------------------ */

function drawValue(page, text, layout, font) {
  if (!text || !layout) return;

  page.drawText(text, {
    x: layout.x,
    y: layout.y,
    size: layout.size || 11,
    font,
    color: rgb(0, 0, 0),
  });
}

function drawLines(page, lines, layout, font) {
  if (!lines || !lines.length || !layout) return;

  const lineHeight =
    layout.lineHeight || (layout.size || 11) * 1.3;

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

/* ------------------------------------------------------------------ *
 * LOAD PDF
 * ------------------------------------------------------------------ */

async function loadBundledPdf() {
  try {
    const res = await fetch("cancelation form1.pdf");

    if (!res.ok) throw new Error("not found");

    bundledPdfBytes = await res.arrayBuffer();

    els.templateStatus.innerHTML =
      'Using bundled <code>form.pdf</code>. ' +
      "(Choosing a file below overrides it.)";
  } catch {
    els.templateStatus.innerHTML =
      'No bundled <code>form.pdf</code> yet &mdash; ' +
      "choose the Stone Ridge PDF below.";
  }
}

function activePdfBytes() {
  return pickedPdfBytes || bundledPdfBytes;
}

/* ------------------------------------------------------------------ *
 * FILL STONE RIDGE PDF
 * ------------------------------------------------------------------ */

async function fillPdf(srcBytes, values) {
  const pdfDoc = await PDFDocument.load(srcBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();
  const page = pages[0];

  // ------------------------------------------------------------
  // Client and policy information
  // ------------------------------------------------------------

  drawValue(
    page,
    values.name,
    FIELD_LAYOUT.name,
    font
  );

  drawValue(
    page,
    values.email,
    FIELD_LAYOUT.email,
    font
  );

  drawValue(
    page,
    values.phone,
    FIELD_LAYOUT.phone,
    font
  );

  drawValue(
    page,
    values.previousCompany,
    FIELD_LAYOUT.previousCompany,
    font
  );

  // ------------------------------------------------------------
  // Combine individual policy inputs into the big policy box.
  // ------------------------------------------------------------

  const policies = buildPolicies(values);

  const policyText = policies.map((p) => p.text);

  drawLines(
    page,
    policyText,
    FIELD_LAYOUT.policies,
    font
  );

  // ------------------------------------------------------------
  // lation details
  // ------------------------------------------------------------

  drawValue(
    page,
    values.Date,
    FIELD_LAYOUT.Date,
    font
  );

  const linesOfBusiness = policies.map((p) => p.line);

  drawLines(
    page,
    linesOfBusiness,
    FIELD_LAYOUT.linesOfBusiness,
    font
  );

  // ------------------------------------------------------------
  // Client authorization
  //
  // Named Insured Signature = BLANK
  // Date Signed             = BLANK
  //
  // Those are completed through DocuSign.
  //
  // Printed Name is automatically copied from Name.
  // ------------------------------------------------------------

  drawValue(
    page,
    values.name,
    FIELD_LAYOUT.printedName,
    font
  );

  return pdfDoc.save();
}

/* ------------------------------------------------------------------ *
 * COORDINATE GRID
 * ------------------------------------------------------------------ */

async function makeGrid(srcBytes) {
  const pdfDoc = await PDFDocument.load(srcBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const STEP = 50;
  const lineColor = rgb(0.8, 0.1, 0.1);

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();

    for (let x = 0; x <= width; x += STEP) {
      page.drawLine({
        start: { x, y: 0 },
        end: { x, y: height },
        thickness: 0.5,
        color: lineColor,
        opacity: 0.4,
      });

      page.drawText(String(x), {
        x: x + 2,
        y: 4,
        size: 6,
        font,
        color: lineColor,
      });
    }

    for (let y = 0; y <= height; y += STEP) {
      page.drawLine({
        start: { x: 0, y },
        end: { x: width, y },
        thickness: 0.5,
        color: lineColor,
        opacity: 0.4,
      });

      page.drawText(String(y), {
        x: 2,
        y: y + 2,
        size: 6,
        font,
        color: lineColor,
      });
    }
  }

  return pdfDoc.save();
}

/* ------------------------------------------------------------------ *
 * DOWNLOAD
 * ------------------------------------------------------------------ */

function downloadBytes(bytes, filename) {
  const blob = new Blob([bytes], {
    type: "application/pdf",
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = filename;

  document.body.appendChild(a);

  a.click();

  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ------------------------------------------------------------------ *
 * EVENTS
 * ------------------------------------------------------------------ */

els.fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];

  if (!file) {
    pickedPdfBytes = null;
    return;
  }

  pickedPdfBytes = await file.arrayBuffer();

  setMessage(`Loaded "${file.name}".`, "success");
});

els.fillBtn.addEventListener("click", async () => {
  const src = activePdfBytes();

  if (!src) {
    setMessage(
      "Please choose the Stone Ridge cancellation PDF first.",
      "error"
    );
    return;
  }

  try {
    setMessage("Filling Stone Ridge cancellation form…");

    const values = getFormValues();

    const out = await fillPdf(
      src.slice(0),
      values
    );

    downloadBytes(
      out,
      OUTPUT_FILENAME
    );

    setMessage(
      "Done — your cancellation form has been downloaded.",
      "success"
    );
  } catch (err) {
    console.error(err);

    setMessage(
      "Something went wrong: " + err.message,
      "error"
    );
  }
});

els.gridBtn.addEventListener("click", async () => {
  const src = activePdfBytes();

  if (!src) {
    setMessage(
      "Please choose the Stone Ridge cancellation PDF first.",
      "error"
    );
    return;
  }

  try {
    setMessage("Building coordinate grid…");

    const out = await makeGrid(
      src.slice(0)
    );

    downloadBytes(
      out,
      "coordinate-grid.pdf"
    );

    setMessage(
      "Grid downloaded.",
      "success"
    );
  } catch (err) {
    console.error(err);

    setMessage(
      "Something went wrong: " + err.message,
      "error"
    );
  }
});

loadBundledPdf();
