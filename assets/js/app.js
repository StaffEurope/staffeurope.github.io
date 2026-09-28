/* Plata – Arbeitsvermittlung
 * Gemeinsame Logik für alle Seiten. Die Seite wird über <body data-page="..."> erkannt.
 */

const STORAGE_JOBS = "plata_jobs";
const STORAGE_APPLICATIONS = "plata_applications";
const STORAGE_MESSAGES = "plata_messages";

/* ---------- Hilfsfunktionen ---------- */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function readStore(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function writeStore(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

function getAllJobs() {
  return [...readStore(STORAGE_JOBS), ...SAMPLE_JOBS].sort((a, b) =>
    b.posted.localeCompare(a.posted)
  );
}

function getJob(id) {
  return getAllJobs().find((job) => job.id === id);
}

function categoryName(id) {
  return CATEGORIES.find((c) => c.id === id)?.name ?? "Sonstiges";
}

function formatDate(iso) {
  const date = new Date(iso + "T00:00:00");
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function daysAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso + "T00:00:00")) / 86400000);
  if (diff <= 0) return "Heute";
  if (diff === 1) return "Gestern";
  return `vor ${diff} Tagen`;
}

function isNew(iso) {
  return (Date.now() - new Date(iso + "T00:00:00")) / 86400000 < 4;
}

const LOGO_COLORS = ["#1f5eff", "#12b886", "#f76707", "#7048e8", "#e64980", "#1098ad", "#f59f00", "#2b8a3e"];

function companyLogo(company) {
  const initials = company
    .split(/\s+/)
    .filter((w) => /^[A-Za-zÄÖÜäöü]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  let hash = 0;
  for (const ch of company) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const color = LOGO_COLORS[hash % LOGO_COLORS.length];
  return `<div class="company-logo" style="background:${color}" aria-hidden="true">${escapeHtml(initials)}</div>`;
}

/* ---------- Layout (Header & Footer) ---------- */

function renderLayout() {
  const page = document.body.dataset.page;
  const links = [
    { href: "index.html", label: "Start", page: "home" },
    { href: "jobs.html", label: "Stellenangebote", page: "jobs" },
    { href: "arbeitgeber.html", label: "Für Arbeitgeber", page: "employer" },
    { href: "kontakt.html", label: "Kontakt", page: "contact" },
  ];

  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <div class="container">
      <a href="index.html" class="logo"><span class="logo-mark">P</span>Plata</a>
      <button class="nav-toggle" aria-label="Menü öffnen" aria-expanded="false">☰</button>
      <nav class="nav">
        ${links
          .map(
            (l) =>
              `<a href="${l.href}" class="${l.page === page ? "active" : ""}">${l.label}</a>`
          )
          .join("")}
        <a href="arbeitgeber.html#formular" class="btn btn-primary btn-small" style="color:#fff">Stelle inserieren</a>
      </nav>
    </div>`;
  document.body.prepend(header);

  const toggle = header.querySelector(".nav-toggle");
  const nav = header.querySelector(".nav");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="logo"><span class="logo-mark">P</span>Plata</div>
          <p>Ihre persönliche Arbeitsvermittlung – wir bringen Menschen und Unternehmen zusammen. Kostenlos für Bewerber:innen.</p>
        </div>
        <div>
          <h4>Bewerber:innen</h4>
          <a href="jobs.html">Stellen suchen</a>
          <a href="index.html#so-gehts">So funktioniert's</a>
          <a href="kontakt.html">Beratung anfragen</a>
        </div>
        <div>
          <h4>Arbeitgeber</h4>
          <a href="arbeitgeber.html">Leistungen</a>
          <a href="arbeitgeber.html#formular">Stelle inserieren</a>
        </div>
        <div>
          <h4>Rechtliches</h4>
          <a href="impressum.html">Impressum</a>
          <a href="datenschutz.html">Datenschutz</a>
        </div>
      </div>
      <div class="footer-bottom">© ${new Date().getFullYear()} Plata Arbeitsvermittlung</div>
    </div>`;
  document.body.append(footer);
}

/* ---------- Stellen-Karte ---------- */

function jobCard(job) {
  return `
    <a class="job-card" href="job.html?id=${encodeURIComponent(job.id)}">
      ${companyLogo(job.company)}
      <div>
        <h3>${escapeHtml(job.title)}</h3>
        <div class="company">${escapeHtml(job.company)} · ${escapeHtml(job.location)}</div>
        <div class="job-meta">
          ${isNew(job.posted) ? '<span class="tag tag-new">Neu</span>' : ""}
          <span class="tag">${escapeHtml(job.type)}</span>
          <span class="tag">${escapeHtml(categoryName(job.category))}</span>
          ${job.remote ? '<span class="tag">Homeoffice möglich</span>' : ""}
        </div>
      </div>
      <div class="job-side">
        ${job.salary ? `<span class="salary">${escapeHtml(job.salary)}</span>` : ""}
        ${daysAgo(job.posted)}
      </div>
    </a>`;
}

/* ---------- Formular-Validierung ---------- */

function validateForm(form) {
  let valid = true;
  form.querySelectorAll(".field").forEach((field) => {
    const input = field.querySelector("input, select, textarea");
    if (!input) return;
    const ok = input.checkValidity();
    field.classList.toggle("invalid", !ok);
    if (!ok) valid = false;
  });
  const consent = form.querySelector('input[name="consent"]');
  if (consent && !consent.checked) {
    consent.closest(".consent").style.color = "var(--danger)";
    valid = false;
  } else if (consent) {
    consent.closest(".consent").style.color = "";
  }
  if (!valid) {
    form.querySelector(".invalid input, .invalid select, .invalid textarea")?.focus();
  }
  return valid;
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function showSuccess(alertEl, html) {
  alertEl.innerHTML = html;
  alertEl.classList.add("show");
  alertEl.scrollIntoView({ behavior: "smooth", block: "center" });
}

function fillCategorySelect(select, withAll) {
  select.innerHTML =
    (withAll ? '<option value="">Alle Branchen</option>' : '<option value="">Bitte wählen</option>') +
    CATEGORIES.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
}

/* ---------- Seite: Start ---------- */

function initHome() {
  const jobs = getAllJobs();

  document.getElementById("stat-jobs").textContent = jobs.length;
  document.getElementById("stat-companies").textContent = new Set(jobs.map((j) => j.company)).size;

  document.getElementById("latest-jobs").innerHTML = jobs.slice(0, 4).map(jobCard).join("");

  document.getElementById("category-grid").innerHTML = CATEGORIES.map((c) => {
    const count = jobs.filter((j) => j.category === c.id).length;
    return `
      <a class="category" href="jobs.html?kategorie=${c.id}">
        <div class="icon">${c.icon}</div>
        <strong>${escapeHtml(c.name)}</strong>
        <span>${count} ${count === 1 ? "Stelle" : "Stellen"}</span>
      </a>`;
  }).join("");
}

/* ---------- Seite: Stellenangebote ---------- */

function initJobs() {
  const params = new URLSearchParams(location.search);
  const form = document.getElementById("filter-form");
  const q = form.elements.q;
  const ort = form.elements.ort;
  const kategorie = form.elements.kategorie;
  const remote = form.elements.remote;
  const sort = document.getElementById("sort");

  fillCategorySelect(kategorie, true);

  document.getElementById("type-filters").innerHTML = EMPLOYMENT_TYPES.map(
    (t) => `<label class="check"><input type="checkbox" name="typ" value="${t}"> ${t}</label>`
  ).join("");

  q.value = params.get("q") || "";
  ort.value = params.get("ort") || "";
  kategorie.value = params.get("kategorie") || "";
  const typeParam = params.get("typ");
  if (typeParam) {
    form.querySelectorAll('input[name="typ"]').forEach((cb) => (cb.checked = cb.value === typeParam));
  }

  const list = document.getElementById("job-list");
  const count = document.getElementById("result-count");

  function render() {
    const term = q.value.trim().toLowerCase();
    const place = ort.value.trim().toLowerCase();
    const types = [...form.querySelectorAll('input[name="typ"]:checked')].map((cb) => cb.value);

    let jobs = getAllJobs().filter((job) => {
      const haystack = [job.title, job.company, job.description, ...(job.tasks || []), ...(job.requirements || [])]
        .join(" ")
        .toLowerCase();
      if (term && !haystack.includes(term)) return false;
      if (place && !job.location.toLowerCase().includes(place)) return false;
      if (kategorie.value && job.category !== kategorie.value) return false;
      if (types.length && !types.includes(job.type)) return false;
      if (remote.checked && !job.remote) return false;
      return true;
    });

    if (sort.value === "title") jobs.sort((a, b) => a.title.localeCompare(b.title, "de"));
    if (sort.value === "location") jobs.sort((a, b) => a.location.localeCompare(b.location, "de"));

    count.textContent = `${jobs.length} ${jobs.length === 1 ? "Stelle" : "Stellen"} gefunden`;
    list.innerHTML = jobs.length
      ? jobs.map(jobCard).join("")
      : `<div class="empty"><strong>Keine passenden Stellen gefunden.</strong><br>Passen Sie Ihre Filter an oder <a href="kontakt.html">lassen Sie sich persönlich beraten</a>.</div>`;

    const url = new URL(location.href);
    url.search = "";
    if (q.value.trim()) url.searchParams.set("q", q.value.trim());
    if (ort.value.trim()) url.searchParams.set("ort", ort.value.trim());
    if (kategorie.value) url.searchParams.set("kategorie", kategorie.value);
    history.replaceState(null, "", url);
  }

  form.addEventListener("input", render);
  form.addEventListener("change", render);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    render();
  });
  form.addEventListener("reset", () => setTimeout(render));
  sort.addEventListener("change", render);

  render();
}

/* ---------- Seite: Stellendetail ---------- */

function initJobDetail() {
  const id = new URLSearchParams(location.search).get("id");
  const job = id && getJob(id);
  const container = document.getElementById("job-detail");

  if (!job) {
    container.innerHTML = `
      <div class="empty" style="margin:40px 0">
        <strong>Diese Stelle wurde nicht gefunden.</strong><br>
        Möglicherweise ist sie bereits besetzt. <a href="jobs.html">Zu allen Stellenangeboten</a>
      </div>`;
    return;
  }

  document.title = `${job.title} – ${job.company} | Plata`;

  const list = (items) =>
    items && items.length ? `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>` : "";

  container.innerHTML = `
    <div class="detail-layout">
      <article class="card detail-body">
        <a class="back-link" href="jobs.html">← Zurück zur Übersicht</a>
        <div class="detail-head">
          ${companyLogo(job.company)}
          <div>
            <h1>${escapeHtml(job.title)}</h1>
            <div style="color:var(--muted)">${escapeHtml(job.company)} · ${escapeHtml(job.location)}</div>
          </div>
        </div>
        <div class="job-meta">
          <span class="tag">${escapeHtml(job.type)}</span>
          <span class="tag">${escapeHtml(categoryName(job.category))}</span>
          ${job.remote ? '<span class="tag">Homeoffice möglich</span>' : ""}
        </div>
        <h2>Über die Stelle</h2>
        <p>${escapeHtml(job.description)}</p>
        ${job.tasks?.length ? `<h2>Ihre Aufgaben</h2>${list(job.tasks)}` : ""}
        ${job.requirements?.length ? `<h2>Ihr Profil</h2>${list(job.requirements)}` : ""}
        ${job.benefits?.length ? `<h2>Wir bieten</h2>${list(job.benefits)}` : ""}
      </article>

      <aside>
        <div class="card" style="margin-bottom:20px">
          <ul class="facts">
            <li><span>Arbeitsort</span><span>${escapeHtml(job.location)}</span></li>
            <li><span>Anstellung</span><span>${escapeHtml(job.type)}</span></li>
            <li><span>Gehalt</span><span>${escapeHtml(job.salary || "k. A.")}</span></li>
            <li><span>Veröffentlicht</span><span>${formatDate(job.posted)}</span></li>
          </ul>
          <a href="#bewerbung" class="btn btn-primary btn-block">Jetzt bewerben</a>
        </div>

        <div class="card" id="bewerbung">
          <h2 style="margin-top:0;font-size:1.2rem">Bewerbung senden</h2>
          <div class="alert alert-success" id="apply-success" role="status"></div>
          <form id="apply-form" novalidate>
            <div class="field" style="margin-bottom:12px">
              <label for="a-name">Vor- und Nachname *</label>
              <input type="text" id="a-name" name="name" required autocomplete="name">
              <div class="error-msg">Bitte geben Sie Ihren Namen an.</div>
            </div>
            <div class="field" style="margin-bottom:12px">
              <label for="a-email">E-Mail *</label>
              <input type="email" id="a-email" name="email" required autocomplete="email">
              <div class="error-msg">Bitte geben Sie eine gültige E-Mail-Adresse an.</div>
            </div>
            <div class="field" style="margin-bottom:12px">
              <label for="a-phone">Telefon</label>
              <input type="tel" id="a-phone" name="phone" autocomplete="tel">
            </div>
            <div class="field" style="margin-bottom:12px">
              <label for="a-message">Kurze Nachricht</label>
              <textarea id="a-message" name="message" placeholder="Warum passen Sie zu dieser Stelle?"></textarea>
            </div>
            <div class="field" style="margin-bottom:14px">
              <label for="a-cv">Lebenslauf <span class="hint">(PDF, optional)</span></label>
              <input type="file" id="a-cv" name="cv" accept=".pdf,.doc,.docx">
            </div>
            <label class="consent" style="margin-bottom:16px">
              <input type="checkbox" name="consent">
              <span>Ich stimme der Verarbeitung meiner Daten zur Bearbeitung der Bewerbung gemäß der <a href="datenschutz.html">Datenschutzerklärung</a> zu. *</span>
            </label>
            <button type="submit" class="btn btn-primary btn-block">Bewerbung absenden</button>
          </form>
        </div>
      </aside>
    </div>`;

  const form = document.getElementById("apply-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;
    const data = formData(form);
    const applications = readStore(STORAGE_APPLICATIONS);
    applications.push({
      jobId: job.id,
      jobTitle: job.title,
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
      cv: data.cv && data.cv.name ? data.cv.name : "",
      createdAt: new Date().toISOString(),
    });
    writeStore(STORAGE_APPLICATIONS, applications);
    form.reset();
    form.style.display = "none";
    showSuccess(
      document.getElementById("apply-success"),
      `<strong>Vielen Dank, ${escapeHtml(data.name)}!</strong><br>Ihre Bewerbung für „${escapeHtml(
        job.title
      )}“ ist eingegangen. Unser Vermittlungsteam meldet sich innerhalb von 48 Stunden bei Ihnen.`
    );
  });
}

/* ---------- Seite: Arbeitgeber ---------- */

function initEmployer() {
  const form = document.getElementById("employer-form");
  fillCategorySelect(form.elements.category, false);
  form.elements.type.innerHTML =
    '<option value="">Bitte wählen</option>' +
    EMPLOYMENT_TYPES.map((t) => `<option>${t}</option>`).join("");

  const splitLines = (text) =>
    (text || "")
      .split("\n")
      .map((l) => l.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;
    const data = formData(form);
    const job = {
      id: "u" + Date.now().toString(36),
      title: data.title.trim(),
      company: data.company.trim(),
      location: data.location.trim(),
      category: data.category,
      type: data.type,
      remote: data.remote === "on",
      salary: data.salary.trim(),
      posted: new Date().toISOString().slice(0, 10),
      description: data.description.trim(),
      tasks: splitLines(data.tasks),
      requirements: splitLines(data.requirements),
      benefits: splitLines(data.benefits),
      contact: { name: data.contactName, email: data.contactEmail, phone: data.contactPhone },
    };
    const jobs = readStore(STORAGE_JOBS);
    jobs.push(job);
    const saved = writeStore(STORAGE_JOBS, jobs);
    form.reset();
    showSuccess(
      document.getElementById("employer-success"),
      saved
        ? `<strong>Ihre Stelle wurde veröffentlicht!</strong><br><a href="job.html?id=${encodeURIComponent(
            job.id
          )}">Anzeige „${escapeHtml(job.title)}“ ansehen</a> – unser Team meldet sich zusätzlich mit passenden Kandidat:innen.`
        : `<strong>Vielen Dank!</strong> Ihre Anfrage ist eingegangen. Wir melden uns in Kürze bei Ihnen.`
    );
  });
}

/* ---------- Seite: Kontakt ---------- */

function initContact() {
  const form = document.getElementById("contact-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;
    const data = formData(form);
    const messages = readStore(STORAGE_MESSAGES);
    messages.push({ ...data, createdAt: new Date().toISOString() });
    writeStore(STORAGE_MESSAGES, messages);
    form.reset();
    showSuccess(
      document.getElementById("contact-success"),
      `<strong>Danke für Ihre Nachricht!</strong><br>Wir melden uns so schnell wie möglich – in der Regel innerhalb eines Werktags.`
    );
  });
}

/* ---------- Start ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderLayout();
  const pages = {
    home: initHome,
    jobs: initJobs,
    job: initJobDetail,
    employer: initEmployer,
    contact: initContact,
  };
  pages[document.body.dataset.page]?.();
});
