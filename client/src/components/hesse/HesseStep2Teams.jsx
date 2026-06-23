function TeamNameInput({ index, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-shore-400 w-6 text-right shrink-0">{index + 1}.</span>
      <input
        type="text"
        className="form-input"
        placeholder={`Mannschaftsname ${index + 1}`}
        value={value}
        onChange={(e) => onChange(index, e.target.value)}
      />
    </div>
  );
}

function toLines(str, n) {
  const parts = (str || '').split('\n');
  return Array.from({ length: n }, (_, i) => parts[i] ?? '');
}

export default function HesseStep2Teams({ data, update, next, prev }) {
  const count = data.mannschaften || 0;
  const lines = toLines(data.mannschaftsnamen, count);
  const gebuehr = count * 35;

  const setLine = (i, val) => {
    const next = [...lines];
    next[i] = val;
    update({ mannschaftsnamen: next.join('\n') });
  };

  const setCount = (n) => {
    update({ mannschaften: n });
  };

  const canNext = count >= 1 && Number(data.teilnehmer_anzahl) >= 1;

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-800 leading-relaxed">
        <p className="font-bold mb-1">🏐 4er-Mixed Mannschaften</p>
        <p>Es muss <strong>immer mindestens eine Dame</strong> auf dem Feld sein. Pro Mannschaft berechnen wir eine Teilnahmegebühr von <strong>35 €</strong>. Maximal 8 Spieler pro Team.</p>
      </div>

      {/* Slider */}
      <div>
        <label className="form-label">Wie viele Mannschaften nehmen am Turnier teil?</label>
        <div className="flex items-center gap-4 mt-2">
          <input
            type="range" min="0" max="9" step="1"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="flex-1 accent-red-600"
          />
          <span className="text-2xl font-bold text-red-700 w-8 text-center">{count}</span>
        </div>
        <div className="flex justify-between text-xs text-shore-400 mt-1 px-0.5">
          <span>0</span><span>9</span>
        </div>
      </div>

      {/* Gebühr */}
      {count > 0 && (
        <div className="rounded-xl bg-white border-2 border-red-200 p-4 text-center">
          <p className="text-shore-500 text-sm">Teilnahmegebühr gesamt</p>
          <p className="text-3xl font-extrabold text-red-700 mt-1">
            {gebuehr.toFixed(2).replace('.', ',')} €
          </p>
          <p className="text-shore-400 text-xs mt-1">{count} × 35,00 €</p>
        </div>
      )}

      {/* Teamnamen */}
      {count > 0 && (
        <div>
          <label className="form-label">Mannschaftsnamen <span className="text-red-500">*</span></label>
          <div className="space-y-2 mt-2">
            {Array.from({ length: count }, (_, i) => (
              <TeamNameInput key={i} index={i} value={lines[i] || ''} onChange={setLine} />
            ))}
          </div>
        </div>
      )}

      {/* Teilnehmerzahl */}
      <div>
        <label className="form-label">
          Wir kommen voraussichtlich mit … Teilnehmern <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-shore-400 mb-1">Maximal 8 Spieler pro Team</p>
        <input
          type="number"
          min="1"
          className="form-input w-32"
          value={data.teilnehmer_anzahl}
          onChange={(e) => update({ teilnehmer_anzahl: e.target.value })}
          placeholder="z. B. 8"
        />
      </div>

      <div className="flex justify-between pt-2">
        <button className="btn-secondary" onClick={prev}>← Zurück</button>
        <button className="btn-primary" onClick={next} disabled={!canNext}
          style={canNext ? { background: 'linear-gradient(135deg,#e8a0a0,#c0392b)', border: 'none' } : {}}>
          Nächster Schritt →
        </button>
      </div>
    </div>
  );
}
