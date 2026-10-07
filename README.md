# Terravia – Personalvermittlung Südosteuropa → Deutschland

Website für die Vermittlung von Arbeitskräften aus Südosteuropa an Unternehmen in Deutschland. Reines HTML/CSS/JavaScript – kein Build-Schritt,
keine Cookies, keine externen Schriften oder Tracker.

## Seiten

| Datei | Zielgruppe | Inhalt |
| --- | --- | --- |
| `index.html` | Deutsche Arbeitgeber | Leistungen, Ablauf, Branchen, Herkunftsländer, Über uns, FAQ, Anfrageformular |
| `bewerber.html` | Arbeitskräfte | Vorteile, Ablauf, Bewerbungsformular + WhatsApp – umschaltbar: Deutsch, Rumänisch, Bulgarisch, Serbisch/Kroatisch/Bosnisch |
| `impressum.html`, `datenschutz.html` | – | **Platzhalter – vor Veröffentlichung ausfüllen und prüfen lassen** |

Direkte Links für Bewerber in ihrer Sprache: `bewerber.html?lang=ro`, `?lang=bg`, `?lang=sr`, `?lang=de`.

## Vor dem Online-Stellen anpassen

1. **`assets/js/config.js`** – Firmenname, E-Mail, Telefon, WhatsApp-Nummer eintragen.
2. **Formulare:** Ohne weitere Einstellung öffnen die Formulare das E-Mail-Programm mit einer
   vorausgefüllten Nachricht. Für echten Versand im Hintergrund bei einem Formular-Dienst
   (z. B. Formspree) ein Konto anlegen und die Adresse bei `formEndpoint` eintragen.
3. **Impressum und Datenschutz** mit den echten Firmendaten ausfüllen.

## Lokal ansehen

`index.html` im Browser öffnen oder:

```bash
python3 -m http.server 8000   # dann http://localhost:8000
```

## Aufbau

- `assets/css/style.css` – Design (Grün/Weiß/Dunkel, responsiv)
- `assets/js/config.js` – Ihre Kontaktdaten
- `assets/js/i18n.js` – Übersetzungen der Bewerberseite
- `assets/js/app.js` – Menü, Formulare, Sprachumschaltung
