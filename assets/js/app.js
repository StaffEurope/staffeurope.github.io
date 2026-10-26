/* Terravia – gemeinsame Logik für alle Seiten */

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

/* ---------- Bewerberseite und Jobbörse: Sprachen ---------- */

let currentLang = "de";
const langListeners = [];

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
  if (["ro", "bg", "hr"].includes(browser)) return browser;
  return "de";
}

function setLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.title = `${t(document.body.dataset.titleKey || "meta.title")} | ${SITE_CONFIG.companyName}`;
  document.querySelectorAll("[data-i18n]").forEach((el) => (el.innerHTML = t(el.dataset.i18n)));
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
  document.querySelectorAll("[data-lang-href]").forEach((el) => {
    const url = new URL(el.getAttribute("data-lang-href"), location.href);
    url.searchParams.set("lang", lang);
    el.href = url.pathname.split("/").pop() + url.search + url.hash;
  });
  document.querySelectorAll(".lang-switch button").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.lang === lang))
  );
  try {
    localStorage.setItem("plata_lang", lang);
  } catch {}
  const url = new URL(location.href);
  url.searchParams.set("lang", lang);
  history.replaceState(null, "", url);
  langListeners.forEach((fn) => fn());
}

function initLangSwitch() {
  if (typeof I18N === "undefined" || !document.querySelector(".lang-switch")) return;
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
}

/* ---------- Jobbörse ---------- */

const SECTORS = ["bau", "logistik", "produktion", "transport", "pflege", "gastro", "landwirtschaft", "reinigung"];

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// Text einer Stelle in der aktuellen Sprache, sonst Deutsch
function loc(obj) {
  if (!obj) return "";
  return obj[currentLang] ?? obj.de ?? "";
}

function activeJobs() {
  return typeof JOBS === "undefined" ? [] : JOBS.filter((j) => j.aktiv !== false);
}

function findJob(id) {
  return activeJobs().find((j) => j.id === id);
}

function formatDate(value) {
  if (!value || value === "sofort") return t("jobs.start.sofort");
  const [y, m, d] = value.split("-").map(Number);
  const opts = d ? { day: "numeric", month: "long", year: "numeric" } : { month: "long", year: "numeric" };
  return new Intl.DateTimeFormat(currentLang, opts).format(new Date(y, (m || 1) - 1, d || 1));
}

function jobPeriod(job) {
  return job.ende ? `${formatDate(job.start)} – ${formatDate(job.ende)}` : formatDate(job.start);
}

function countText(n) {
  const rule = new Intl.PluralRules(currentLang).select(n);
  const key = I18N[currentLang][`jobs.count.${rule}`] ? `jobs.count.${rule}` : "jobs.count.other";
  return t(key).replace("{n}", n);
}

function jobCard(job) {
  const list = (items) => (items && items.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "");
  const tasks = list(loc(job.aufgaben));
  const req = list(loc(job.anforderungen));
  const german = !job.deutsch || job.deutsch === "keine" ? t("jobs.german.none") : job.deutsch;
  const apply = `bewerber.html?lang=${currentLang}&job=${encodeURIComponent(job.id)}#bewerbung`;
  return `
    <article class="job" id="job-${esc(job.id)}">
      <div class="job-tags">
        <span class="job-tag">${esc(t(`sec.${job.branche}`))}</span>
        <span class="job-tag job-tag-type">${esc(t(`jobs.type.${job.art}`))}</span>
      </div>
      <h3>${esc(loc(job.titel))}</h3>
      <dl class="job-facts">
        <div><dt>${t("jobs.place")}</dt><dd>${esc(job.ort)}</dd></div>
        <div><dt>${t("jobs.start")}</dt><dd>${esc(jobPeriod(job))}</dd></div>
        ${job.anzahl ? `<div><dt>${t("jobs.positions")}</dt><dd>${esc(job.anzahl)}</dd></div>` : ""}
        <div><dt>${t("jobs.german")}</dt><dd>${esc(german)}</dd></div>
      </dl>
      ${tasks || req ? `<details>
        <summary>${t("jobs.details")}</summary>
        ${tasks ? `<h4>${t("jobs.tasks")}</h4>${tasks}` : ""}
        ${req ? `<h4>${t("jobs.req")}</h4>${req}` : ""}
      </details>` : ""}
      <div class="job-actions">
        <a class="btn btn-green btn-small" href="${apply}">${t("jobs.apply")}</a>
        <button type="button" class="btn btn-whatsapp btn-small" data-wa-job="${esc(job.id)}">${t("jobs.whatsapp")}</button>
      </div>
      <p class="job-ref">${t("jobs.ref")} ${esc(job.id)}${job.datum ? ` · ${t("jobs.posted")} ${esc(formatDate(job.datum))}` : ""}</p>
    </article>`;
}

// Strukturierte Daten, damit Suchmaschinen (z. B. Google Jobs) die Stellen erkennen
function jobPostingData(jobs) {
  const base = `${location.origin}${location.pathname}`;
  return jobs.map((job) => {
    const de = (o) => (o && o.de) || [];
    const items = [...de(job.aufgaben), ...de(job.anforderungen)];
    return {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: job.titel.de,
      description: `<p>${esc(job.titel.de)} – ${esc(job.ort)}</p>${items.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : ""}`,
      identifier: { "@type": "PropertyValue", name: SITE_CONFIG.companyName, value: job.id },
      datePosted: job.datum,
      employmentType: job.art === "saison" ? "TEMPORARY" : "FULL_TIME",
      hiringOrganization: { "@type": "Organization", name: SITE_CONFIG.companyName, sameAs: location.origin },
      jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.ort, addressCountry: "DE" } },
      ...(job.anzahl ? { totalJobOpenings: job.anzahl } : {}),
      url: `${base}#job-${job.id}`,
    };
  });
}

function initJobBoard() {
  const listEl = document.getElementById("job-list");
  if (!listEl) return;
  const search = document.getElementById("job-search");
  const sector = document.getElementById("job-sector");
  const type = document.getElementById("job-type");
  const countEl = document.getElementById("job-count");
  const emptyEl = document.getElementById("job-empty");
  const toolbar = document.querySelector(".job-toolbar");
  const jobs = activeJobs().sort((a, b) => String(b.datum || "").localeCompare(String(a.datum || "")));

  if (jobs.length) {
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify(jobPostingData(jobs));
    document.head.appendChild(ld);
  } else {
    toolbar.hidden = true;
  }

  function fillSelects() {
    const usedSectors = SECTORS.filter((s) => jobs.some((j) => j.branche === s));
    const keep = [sector.value, type.value];
    sector.innerHTML = `<option value="">${t("jobs.all")}</option>` +
      usedSectors.map((s) => `<option value="${s}">${esc(t(`sec.${s}`))}</option>`).join("");
    type.innerHTML = `<option value="">${t("jobs.all")}</option>` +
      ["voll", "saison"].map((a) => `<option value="${a}">${esc(t(`jobs.type.${a}`))}</option>`).join("");
    [sector.value, type.value] = keep;
  }

  function render() {
    const q = search.value.trim().toLowerCase();
    const shown = jobs.filter((j) => {
      if (sector.value && j.branche !== sector.value) return false;
      if (type.value && j.art !== type.value) return false;
      if (!q) return true;
      const text = [loc(j.titel), j.titel.de, j.ort, t(`sec.${j.branche}`), ...(loc(j.aufgaben) || [])].join(" ").toLowerCase();
      return text.includes(q);
    });
    listEl.innerHTML = shown.map(jobCard).join("");
    countEl.textContent = jobs.length ? countText(shown.length) : "";
    emptyEl.hidden = shown.length > 0;
    emptyEl.querySelector(".job-reset").hidden = !(q || sector.value || type.value);
  }

  function openFromHash() {
    const el = location.hash.startsWith("#job-") && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!el) return;
    el.querySelector("details")?.setAttribute("open", "");
    el.classList.add("job-highlight");
    el.scrollIntoView({ block: "center" });
  }

  langListeners.push(() => {
    fillSelects();
    render();
  });
  fillSelects();
  render();
  openFromHash();

  [search, sector, type].forEach((el) => el.addEventListener("input", render));
  emptyEl.querySelector(".job-reset").addEventListener("click", () => {
    search.value = sector.value = type.value = "";
    render();
  });
  listEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-wa-job]");
    if (!btn) return;
    const job = findJob(btn.dataset.waJob);
    const link = `${location.origin}${location.pathname}#job-${job.id}`;
    const text = `${t("jobs.wa.text")} „${loc(job.titel)}“ (${t("jobs.ref")} ${job.id}).\n${link}`;
    window.open(`https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  });
}

/* ---------- Bewerberseite: Formular ---------- */

function initWorkerPage() {
  const form = document.getElementById("worker-form");
  if (!form) return;

  // Bewerbung auf eine bestimmte Stelle (Link aus der Jobbörse: bewerber.html?job=ID)
  const job = findJob(new URLSearchParams(location.search).get("job"));
  if (job) {
    const hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.name = "stelle";
    hidden.value = `${job.id} – ${job.titel.de} (${job.ort})`;
    form.appendChild(hidden);
    const banner = document.getElementById("job-applying");
    const showJob = () => {
      banner.hidden = false;
      banner.innerHTML = `${t("jobs.applying")} <strong>${esc(loc(job.titel))}</strong> · ${esc(job.ort)} · ${t("jobs.ref")} ${esc(job.id)}`;
      form.elements.job.value = loc(job.titel);
    };
    langListeners.push(showJob);
    showJob();
  }

  const messages = () => ({ mail: t("status.mail"), ok: t("status.ok"), err: t("status.err") });
  const subject = () => `Bewerbung – ${form.elements.name.value.trim()}${job ? ` – Stelle ${job.id}` : ""}`;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate(form)) return;
    sendForm(form, { subject: subject(), messages: messages() });
  });

  document.getElementById("worker-whatsapp").addEventListener("click", () => {
    if (!validate(form)) return;
    sendWhatsApp(form, job ? `${t("form.title")} – ${t("jobs.ref")} ${job.id}` : t("form.title"));
  });
}

/* ---------- Einflug-Animation der Branchen ---------- */

function initFlyIn() {
  const grid = document.querySelector(".sectors");
  if (!grid || !("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cards = [...grid.querySelectorAll(".sector")];
  const cols = () => getComputedStyle(grid).gridTemplateColumns.split(" ").length;
  grid.classList.add("fly");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const i = cards.indexOf(e.target);
      e.target.style.setProperty("--delay", `${(i % cols()) * 0.12}s`);
      e.target.classList.add("in");
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  cards.forEach((c) => io.observe(c));
}

/* ---------- Start ---------- */

document.addEventListener("DOMContentLoaded", () => {
  applyConfig();
  initNav();
  initEmployerForm();
  initLangSwitch();
  initJobBoard();
  initWorkerPage();
  initFlyIn();
});
