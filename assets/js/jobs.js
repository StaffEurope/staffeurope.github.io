/* Terravia – Stellenangebote für die Jobbörse (jobs.html)
 *
 * Neue Stelle = neuen Block in JOBS einfügen (Vorlage unten). Stellen mit aktiv: false werden nicht angezeigt.
 * Keine Angaben zu Lohn, Unterkunft oder Kosten – nur Tätigkeit, Ort, Start und Anforderungen.
 *
 *  id            eindeutige Referenz, z. B. "2026-001" (steht in der Bewerbung)
 *  aktiv         true = sichtbar, false = ausgeblendet
 *  datum         Veröffentlichung "JJJJ-MM-TT"
 *  branche       bau | logistik | produktion | transport | pflege | gastro | landwirtschaft | reinigung
 *  art           voll (Vollzeit) | saison (Saisonarbeit)
 *  ort           Einsatzort, z. B. "Raum Stuttgart" (ohne Firmennamen)
 *  start         "sofort" oder "JJJJ-MM" bzw. "JJJJ-MM-TT"
 *  ende          optional, bei Saisonarbeit, Format wie start
 *  anzahl        gesuchte Personen
 *  deutsch       keine | A1 | A2 | B1 | B2
 *  titel, aufgaben, anforderungen: je Sprache (de, ro, bg, hr). Fehlt eine Sprache, wird Deutsch angezeigt.
 *
 * Vorlage:
 *  {
 *    id: "2026-001",
 *    aktiv: true,
 *    datum: "2026-10-12",
 *    branche: "landwirtschaft",
 *    art: "saison",
 *    ort: "Raum Heilbronn",
 *    start: "2027-04",
 *    ende: "2027-06",
 *    anzahl: 10,
 *    deutsch: "keine",
 *    titel: { de: "Erntehelfer Spargel", ro: "Lucrător la recoltat sparanghel", bg: "Работник за прибиране на аспержи", hr: "Berač šparoga" },
 *    aufgaben: { de: ["Stechen und Sortieren von Spargel"] },
 *    anforderungen: { de: ["Körperliche Belastbarkeit", "Gültiger EU-Ausweis"] },
 *  },
 */
const JOBS = [];
