/* Plata – gemeinsame Logik für alle Seiten */

/* ---------- Konfiguration in die Seite übernehmen ---------- */

function applyConfig() {
  const c = SITE_CONFIG;
  document.querySelectorAll("[data-cfg='companyName']").forEach((el) => (el.textContent = c.companyName));
  document.querySelectorAll("[data-cfg='email']").forEach((el) => {
    el.textContent = c.email;
    if (el.tagName === "A") el.href = `mailto:${c.email}`;
  });
  document.querySelectorAll("[data-cfg='phone']").forEach((el) => {
    el.textContent = c.phone;
    if (el.tagName === "A") el.href = `tel:${c.phone.replace(/[^\d+]/g, "")}`;
  });
  document.querySelectorAll("[data-cfg-href='phone']").forEach((el) => (el.href = `tel:${c.phone.replace(/[^\d+]/g, "")}`));
  document.querySelectorAll("[data-cfg-href='email']").forEach((el) => (el.href = `mailto:${c.email}`));
  document.querySelectorAll("[data-cfg-href='whatsapp']").forEach((el) => (el.href = `https://wa.me/${c.whatsapp}`));
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
}

/* ---------- Mobiles Menü ---------- */

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

/* ---------- Formulare ---------- */

function validate(form) {
  let ok = true;
  form.querySelectorAll(".field").forEach((field) => {
    const input = field.querySelector("input, select, textarea");
    if (!input) return;
    const valid = input.checkValidity();
    field.classList.toggle("invalid", !valid);
    if (!valid) ok = false;
  });
  const consent = form.querySelector("input[name='consent']");
  if (consent) {
    consent.closest(".consent").classList.toggle("invalid", !consent.checked);
    if (!consent.checked) ok = false;
  }
  if (!ok) form.querySelector(".invalid input, .invalid select, .invalid textarea, .consent.invalid input")?.focus();
  return ok;
}

// Liefert die ausgefüllten Felder als "Beschriftung: Wert"-Zeilen (in der aktuell angezeigten Sprache).
function summarize(form) {
  const lines = [];
  form.querySelectorAll(".field").forEach((field) => {
    const input = field.querySelector("input, select, textarea");
    const label = field.querySelector("label");
    if (!input || !label || input.type === "checkbox") return;
    let value = input.value.trim();
    if (input.tagName === "SELECT") value = input.value ? input.selectedOptions[0].textContent.trim() : "";
    if (value) lines.push(`${label.textContent.trim()}: ${value}`);
  });
  return lines.join("\n");
}

function showStatus(form, type, text) {
  const box = form.parentElement.querySelector(".form-status");
  box.className = `form-status show ${type}`;
  box.textContent = text;
  box.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function sendForm(form, { subject, messages }) {
  const body = summarize(form);

  if (SITE_CONFIG.formEndpoint) {
    const data = new FormData(form);
    data.append("_subject", subject);
    try {
      const res = await fetch(SITE_CONFIG.formEndpoint, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(res.statusText);
      form.reset();
      showStatus(form, "ok", messages.ok);
    } catch {
      showStatus(form, "err", messages.err);
    }
    return;
  }

  window.location.href =
    `mailto:${SITE_CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  showStatus(form, "ok", messages.mail);
}

function sendWhatsApp(form, intro) {
  const text = `${intro}\n\n${summarize(form)}`;
  window.open(`https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}

function initEmployerForm() {
  const form = document.getElementById("employer-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate(form)) return;
    const company = form.elements.company.value.trim();
    sendForm(form, {
      subject: `Personalanfrage – ${company}`,
      messages: {
        mail: "Ihr E-Mail-Programm wurde geöffnet. Bitte senden Sie die vorbereitete E-Mail dort ab.",
        ok: "Vielen Dank für Ihre Anfrage! Wir melden uns zeitnah bei Ihnen.",
        err: "Das Senden hat leider nicht geklappt. Bitte rufen Sie uns an oder schreiben Sie uns eine E-Mail.",
      },
    });
  });
}

/* ---------- Bewerberseite: Sprachen ---------- */

let currentLang = "de";

function t(key) {
  return I18N[currentLang][key] ?? I18N.de[key] ?? key;
}

function detectLang() {
  const param = new URLSearchParams(location.search).get("lang");
  if (param && I18N[param]) return param;
  try {
    const saved = localStorage.getItem("plata_lang");
    if (saved && I18N[saved]) return saved;
  } catch {}
  const browser = (navigator.language || "de").slice(0, 2).toLowerCase();
  if (browser === "ro" || browser === "bg") return browser;
  if (["sr", "hr", "bs", "sh", "cnr"].includes(browser)) return "sr";
  return "de";
}

function setLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.title = `${t("meta.title")} | ${SITE_CONFIG.companyName}`;
  document.querySelectorAll("[data-i18n]").forEach((el) => (el.innerHTML = t(el.dataset.i18n)));
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
  document.querySelectorAll(".lang-switch button").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.lang === lang))
  );
  try {
    localStorage.setItem("plata_lang", lang);
  } catch {}
  const url = new URL(location.href);
  url.searchParams.set("lang", lang);
  history.replaceState(null, "", url);
}

function initWorkerPage() {
  const form = document.getElementById("worker-form");
  if (!form) return;

  document.querySelectorAll(".lang-switch").forEach((sw) => {
    const big = sw.classList.contains("lang-switch-big");
    // Große Auswahl: Sprachen der Bewerber zuerst, Deutsch zuletzt
    const langs = big ? [...LANGUAGES.filter((l) => l.code !== "de"), LANGUAGES[0]] : LANGUAGES;
    sw.innerHTML = langs.map(
      (l) => `<button type="button" data-lang="${l.code}" title="${l.name}" aria-pressed="false">${big ? l.name : l.label}</button>`
    ).join("");
    sw.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-lang]");
      if (btn) setLang(btn.dataset.lang);
    });
  });
  setLang(detectLang());

  const messages = () => ({ mail: t("status.mail"), ok: t("status.ok"), err: t("status.err") });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate(form)) return;
    sendForm(form, { subject: `Bewerbung – ${form.elements.name.value.trim()}`, messages: messages() });
  });

  document.getElementById("worker-whatsapp").addEventListener("click", () => {
    if (!validate(form)) return;
    sendWhatsApp(form, t("form.title"));
  });
}

/* ---------- Start ---------- */

document.addEventListener("DOMContentLoaded", () => {
  applyConfig();
  initNav();
  initEmployerForm();
  initWorkerPage();
});
