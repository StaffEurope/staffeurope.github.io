# Plata – Arbeitsvermittlung

Statische Website für eine Arbeitsvermittlung (HTML, CSS, JavaScript – ohne Build-Schritt).

## Seiten

| Datei | Inhalt |
| --- | --- |
| `index.html` | Startseite mit Jobsuche, aktuellen Stellen, Branchen und Ablauf |
| `jobs.html` | Stellenübersicht mit Filtern (Stichwort, Ort, Branche, Anstellungsart, Homeoffice) und Sortierung |
| `job.html?id=…` | Stellendetails mit Bewerbungsformular |
| `arbeitgeber.html` | Leistungen für Arbeitgeber und Formular zum Inserieren einer Stelle |
| `kontakt.html` | Kontakt- und Beratungsformular |
| `impressum.html`, `datenschutz.html` | Rechtliche Seiten (Platzhalter – vor Veröffentlichung ersetzen!) |

## Starten

Einfach `index.html` im Browser öffnen oder einen lokalen Server starten:

```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

## Aufbau

- `assets/css/style.css` – Gestaltung (responsiv, mobiles Menü)
- `assets/js/data.js` – Branchen, Anstellungsarten und Beispiel-Stellen (fiktive Firmen)
- `assets/js/app.js` – Header/Footer, Suche & Filter, Formulare

## Hinweis zu den Daten

Es gibt noch kein Backend: Neu inserierte Stellen, Bewerbungen und Kontaktanfragen werden nur
im `localStorage` des jeweiligen Browsers gespeichert (Schlüssel `plata_jobs`,
`plata_applications`, `plata_messages`). Für den echten Betrieb müssen die Formulare an einen
Server bzw. E-Mail-Dienst angebunden werden.
