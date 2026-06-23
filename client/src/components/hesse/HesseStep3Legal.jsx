export default function HesseStep3Legal({ data, update, prev, onSubmit, submitting }) {
  const gebuehr = (data.mannschaften || 0) * 35;
  const canSubmit = data.ort_datum_name && data.datenschutz_consent;

  return (
    <div className="space-y-5">
      {/* Hinweise */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-shore-700 leading-relaxed space-y-2">
        <p className="font-bold text-amber-800">⚠️ Wichtige Hinweise – bitte vollständig lesen</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Die angemeldete/n Mannschaft/en erklärt/en sich damit einverstanden, dass Name/n, Bilder und Ergebnisse veröffentlicht wird/werden.</li>
          <li>Bei Abmeldung nach dem 15.06.2026 erfolgt keine Erstattung des gezahlten Betrages.</li>
          <li>Die Mannschaften verpflichten sich, eine Teilnehmerliste bei der Anmeldung abzugeben.</li>
          <li>Spielberechtigung nur mit Teilnehmerbändchen.</li>
          <li>Die Ausschreibung für das Turnier haben wir zur Kenntnis genommen.</li>
          <li>Die Informationen und Regeln für Turnierteilnehmer erkennen wir an und werden die Regeln beachten.</li>
          <li>Bei Zuwiderhandlungen können wir vom Turnier ausgeschlossen werden.</li>
          <li>Bei Abbruch oder Absage des Turniers durch den Ausrichter/Veranstalter/Behörden/Verwaltungen entsteht kein Erstattungsanspruch von gezahlten Gebühren und Kosten.</li>
          <li><strong>Es stehen nur eingeschränkte gebührenpflichtige Parkmöglichkeiten in der Nähe des Turniergeländes zur Verfügung.</strong></li>
        </ul>
      </div>

      {/* Zusammenfassung */}
      <div className="rounded-xl bg-white border border-shore-200 p-4 space-y-2">
        <p className="font-bold text-shore-700 text-sm mb-3">📋 Zusammenfassung</p>
        <div className="text-sm space-y-1 text-shore-600">
          <div className="flex justify-between"><span>Firma</span><span className="font-semibold text-shore-800">{data.firma}</span></div>
          <div className="flex justify-between"><span>Ansprechpartner</span><span className="font-semibold text-shore-800">{data.vorname} {data.nachname}</span></div>
          <div className="flex justify-between"><span>Mannschaften</span><span className="font-semibold text-shore-800">{data.mannschaften}× 4er-Mixed</span></div>
          <div className="flex justify-between border-t border-shore-100 pt-2 mt-2">
            <span className="font-bold">Gesamtgebühr</span>
            <span className="font-extrabold text-red-700 text-lg">{gebuehr.toFixed(2).replace('.', ',')} €</span>
          </div>
        </div>
      </div>

      {/* Unterschrift */}
      <div>
        <label className="form-label">
          Ort, Datum, Vollständiger Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className="form-input"
          placeholder="Cuxhaven, 01.06.2026, Max Mustermann"
          value={data.ort_datum_name}
          onChange={(e) => update({ ort_datum_name: e.target.value })}
        />
      </div>

      {/* Datenschutz */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-shore-300 accent-red-600 shrink-0"
          checked={data.datenschutz_consent}
          onChange={(e) => update({ datenschutz_consent: e.target.checked })}
        />
        <span className="text-sm text-shore-600 leading-relaxed">
          Ich stimme der{' '}
          <a href="https://cux-beach.de/datenschutzerklaerung/" target="_blank" rel="noreferrer" className="text-red-600 hover:underline">
            Datenschutzerklärung
          </a>{' '}
          und der Verarbeitung meiner persönlichen Daten zu. <span className="text-red-500">*</span>
        </span>
      </label>

      <div className="flex justify-between pt-2">
        <button className="btn-secondary" onClick={prev}>← Zurück</button>
        <button
          className="px-6 py-2.5 rounded-xl font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: canSubmit ? 'linear-gradient(135deg,#e8a0a0,#c0392b)' : undefined, backgroundColor: canSubmit ? undefined : '#ccc' }}
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? 'Wird gesendet…' : 'Jetzt anmelden ✓'}
        </button>
      </div>
    </div>
  );
}
