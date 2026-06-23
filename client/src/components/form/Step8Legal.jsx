export default function Step8Legal({ next, prev }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-bcc-blue mb-5">Teilnahmehinweise</h2>

      <div className="prose prose-sm text-gray-700 space-y-3 text-sm leading-relaxed">
        <p>
          Die angemeldete/n Mannschaft/en erklärt/en sich damit einverstanden, dass Name/n, Bilder und Ergebnisse veröffentlicht
          wird/werden. Die entsprechenden Hinweise zum Datenschutz wurden zur Kenntnis genommen.
        </p>
        <p>
          Bei Abmeldung nach dem <strong>15.06.2026</strong> erfolgt keine Erstattung des gezahlten Betrages. Die Mannschaften
          verpflichten sich, eine Teilnehmerliste bei der Anmeldung abzugeben. Spielberechtigung nur mit Teilnehmerbändchen. Die
          Ausschreibung für das Turnier haben wir zur Kenntnis genommen.
        </p>
        <p>
          Die Informationen und Regeln für Turnierteilnehmer erkennen wir an und werden die Regeln beachten. Bei Zuwiderhandlungen
          können wir vom Turnier ausgeschlossen werden. Bei Abbruch oder Absage des Turnier durch den
          Ausrichter/Veranstalter/Behörden/Verwaltungen entsteht kein Erstattungsanspruch von gezahlten Gebühren und Kosten.
        </p>
        <p className="font-semibold">
          Es stehen nur eingeschränkte gebührenpflichtige Parkmöglichkeiten in der Nähe des Turniergeländes zur Verfügung.
        </p>
        <p className="font-semibold">
          Änderungen in der Gruppeneinteilung vorbehalten. Die Zeltplatzeinteilung erfolgt durch die Turnierleitung.
        </p>
      </div>

      <div className="mt-6 flex justify-between">
        <button className="btn-secondary" onClick={prev}>« Vorheriger Schritt</button>
        <button className="btn-primary" onClick={next}>Nächster Schritt »</button>
      </div>
    </div>
  );
}
