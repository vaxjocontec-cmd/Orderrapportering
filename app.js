// ===================================================================
// KONFIGURATION — hier deine eigene Apps-Script-URL & Token eintragen
// ===================================================================
const CONFIG = {
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyA3bHuno1L0R_Xj5kkbFb5W-tXOnPJ8vRYzhEE3RQxVOVEMeujAcPh2clzbnYVXz0Sfg/exec",
  SECRET_TOKEN: "kjabgahlvbalhv0285!#%ol478bhejf",
};

const TEKNIKER = [
  "Agim Gara",
  "Sadegh Rahimi",
  "Ludvig Andersson",
  "Norris Andersson",
  "Owen Holst",
  "Melvin Mähler",
  "Tomas Nordvall",
  "Patrick Lange",
];

const ENHETER = ["st", "mm", "m", "m2", "kg", "l", "pak"];

// -------------------------------------------------------------
// Techniker-Checkboxen rendern (inkl. "Övrigt" Freitext-Option)
// -------------------------------------------------------------
function renderTeknikerCheckboxes(container) {
  container.innerHTML = "";
  TEKNIKER.forEach((name, i) => {
    const row = document.createElement("div");
    row.className = "check-row";
    row.innerHTML = `
      <input type="checkbox" id="tek_${i}" value="${name}">
      <label for="tek_${i}">${name}</label>
    `;
    container.appendChild(row);
  });
  const ovrRow = document.createElement("div");
  ovrRow.className = "check-row";
  ovrRow.innerHTML = `
    <input type="checkbox" id="tek_ovrigt_check">
    <label for="tek_ovrigt_check">Övrigt:</label>
    <input type="text" class="inline-text" id="tek_ovrigt_text" placeholder="Namn">
  `;
  container.appendChild(ovrRow);
}

function getTeknikerValue(container) {
  const checked = [...container.querySelectorAll('input[type="checkbox"]:checked')]
    .map((cb) => cb.value)
    .filter(Boolean);
  const ovrCheck = container.querySelector("#tek_ovrigt_check");
  const ovrText = container.querySelector("#tek_ovrigt_text");
  if (ovrCheck && ovrCheck.checked && ovrText && ovrText.value.trim()) {
    checked.push("Övrigt: " + ovrText.value.trim());
  }
  return checked.join(", ");
}

// -------------------------------------------------------------
// Material-Liste — beliebig viele Zeilen, "+ Material" Button
// -------------------------------------------------------------
function initMaterialList(container, addBtn) {
  function addRow() {
    const card = document.createElement("div");
    card.className = "material-card";
    card.innerHTML = `
      <button type="button" class="remove" aria-label="Ta bort">✕</button>
      <div class="row">
        <div>
          <span class="label-small">Benämning</span>
          <input type="text" class="mat-benamning" placeholder="Artikelnamn">
        </div>
      </div>
      <div class="row2" style="margin-top:10px;">
        <div>
          <span class="label-small">Antal</span>
          <input type="number" class="mat-antal" inputmode="decimal" placeholder="0">
        </div>
        <div>
          <span class="label-small">Mängdenhet</span>
          <select class="mat-enhet">
            <option value="">Välj</option>
            ${ENHETER.map((e) => `<option value="${e}">${e}</option>`).join("")}
          </select>
        </div>
      </div>
    `;
    card.querySelector(".remove").addEventListener("click", () => card.remove());
    container.appendChild(card);
  }
  addBtn.addEventListener("click", addRow);
  addRow(); // erste Zeile direkt anzeigen
  return { addRow };
}

function getMaterialsData(container) {
  const cards = [...container.querySelectorAll(".material-card")];
  return cards
    .map((card) => ({
      benamning: card.querySelector(".mat-benamning").value.trim(),
      antal: card.querySelector(".mat-antal").value,
      enhet: card.querySelector(".mat-enhet").value,
    }))
    .filter((m) => m.benamning); // leere Zeilen ignorieren
}

// -------------------------------------------------------------
// Datei-Upload (nur Kund i Verkstan) — Base64 fürs Backend
// -------------------------------------------------------------
function initFileUpload(inputEl, listEl) {
  const files = [];
  inputEl.addEventListener("change", async () => {
    for (const file of inputEl.files) {
      if (files.length >= 5) break;
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} är större än 10 MB och hoppas över.`);
        continue;
      }
      const base64 = await fileToBase64(file);
      files.push({ filename: file.name, mimeType: file.type, base64 });
      renderFileList();
    }
    inputEl.value = "";
  });

  function renderFileList() {
    listEl.innerHTML = "";
    files.forEach((f, i) => {
      const item = document.createElement("div");
      item.className = "file-item";
      item.innerHTML = `<span>${f.filename}</span>`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "✕";
      btn.addEventListener("click", () => {
        files.splice(i, 1);
        renderFileList();
      });
      item.appendChild(btn);
      listEl.appendChild(item);
    });
  }

  return { getFiles: () => files };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// -------------------------------------------------------------
// Sterne-Bewertung (Nöjdhet med jobbet)
// -------------------------------------------------------------
function initStars(container) {
  let value = 0;
  const buttons = [...container.querySelectorAll("button")];
  buttons.forEach((btn, i) => {
    btn.addEventListener("click", () => {
      value = i + 1;
      buttons.forEach((b, j) => b.classList.toggle("on", j < value));
    });
  });
  return { getValue: () => value };
}

// -------------------------------------------------------------
// Schritt-Navigation (mehrseitiges Formular)
// -------------------------------------------------------------
function initSteps(formEl) {
  const steps = [...formEl.querySelectorAll(".step")];
  const progressWrap = document.querySelector(".progress");
  const stepLabel = document.querySelector(".step-label");
  let current = 0;

  function renderProgress() {
    if (!progressWrap) return;
    progressWrap.innerHTML = steps
      .map((_, i) => {
        const cls = i < current ? "done" : i === current ? "current" : "";
        return `<div class="seg ${cls}"></div>`;
      })
      .join("");
    if (stepLabel) {
      const label = steps[current].dataset.label || "";
      stepLabel.textContent = `Steg ${current + 1} av ${steps.length} — ${label}`;
    }
  }

  function show(i) {
    steps.forEach((s, idx) => s.classList.toggle("active", idx === i));
    current = i;
    renderProgress();
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function validateCurrent() {
    const required = steps[current].querySelectorAll("[required]");
    for (const el of required) {
      if (el.type === "checkbox") continue; // Checkbox-Gruppen prüfen wir separat
      if (!el.value || !el.value.trim()) {
        el.focus();
        return false;
      }
    }
    return true;
  }

  function next() {
    if (!validateCurrent()) return;
    if (current < steps.length - 1) show(current + 1);
  }
  function back() {
    if (current > 0) show(current - 1);
  }

  show(0);
  return { next, back, get current() { return current; }, get total() { return steps.length; } };
}

// -------------------------------------------------------------
// Formular absenden
// -------------------------------------------------------------
async function submitForm({ formType, fields, materials, files, submitBtn, statusEl }) {
  submitBtn.disabled = true;
  submitBtn.textContent = "Skickar…";
  hideStatus(statusEl);

  const payload = {
    token: CONFIG.SECRET_TOKEN,
    formType,
    fields,
  };
  if (materials && materials.length) payload.materials = materials;
  if (files && files.length) payload.files = files;

  try {
    const res = await fetch(CONFIG.SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.status === "success") {
      showSuccessScreen();
    } else {
      showStatus(statusEl, data.message || "Något gick fel.", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Skicka";
    }
  } catch (err) {
    showStatus(statusEl, "Kunde inte skicka. Kontrollera internetuppkopplingen.", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Skicka";
  }
}

function showStatus(el, msg, type) {
  if (!el) return;
  el.textContent = msg;
  el.className = "msg show " + type;
}
function hideStatus(el) {
  if (!el) return;
  el.className = "msg";
}

function showSuccessScreen() {
  document.querySelector("main").innerHTML = `
    <div class="success-screen">
      <div class="check">✓</div>
      <h2>Skickat</h2>
      <p>Formuläret har sparats och skickats.</p>
      <a class="btn primary" href="index.html" style="text-decoration:none;">Till startsidan</a>
    </div>
  `;
  const nav = document.querySelector(".bottom-nav");
  if (nav) nav.remove();
  const progress = document.querySelector(".progress");
  if (progress) progress.remove();
  const label = document.querySelector(".step-label");
  if (label) label.remove();
}
