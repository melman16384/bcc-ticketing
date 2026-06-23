// Each category gets one input field per team slot, stored as newline-joined string
const CATEGORIES = [
  { key: 'names_kotc_maennlich', sliderKey: 'kotc_maennlich', label: 'King of the Court männlich' },
  { key: 'names_kotc_weiblich',  sliderKey: 'kotc_weiblich',  label: 'King of the Court weiblich' },
  { key: 'names_kotc_mixed',     sliderKey: 'kotc_mixed',     label: 'King of the Court mixed' },
  { key: 'names_beach_fun_a',    sliderKey: 'beach_fun_a',    label: 'Beach-Fun A', hint: 'Kaution wird am Turnierend zurückgezahlt' },
  { key: 'names_beach_fun_b',    sliderKey: 'beach_fun_b',    label: 'Beach-Fun B', hint: 'Kaution wird am Turnierend zurückgezahlt' },
];

// Splits stored newline-string into array of n slots
function toLines(str, n) {
  const parts = (str || '').split('\n');
  const result = [];
  for (let i = 0; i < n; i++) result.push(parts[i] ?? '');
  return result;
}

// Merges array back into newline-string
function fromLines(lines) {
  return lines.join('\n');
}

// TeamNameInputs defined at module level — avoids focus-loss bug
function TeamNameInputs({ catKey, count, value, onChange }) {
  const lines = toLines(value, count);
  return (
    <div className="space-y-2">
      {lines.map((line, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs font-semibold text-shore-400 w-6 text-right shrink-0">{i + 1}.</span>
          <input
            type="text"
            className="form-input"
            placeholder={`Teamname ${i + 1}`}
            value={line}
            onChange={(e) => {
              const next = [...lines];
              next[i] = e.target.value;
              onChange(fromLines(next));
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default function Step3TeamNames({ data, update, next, prev }) {
  const visible = CATEGORIES.filter((c) => data[c.sliderKey] > 0);

  return (
    <div className="space-y-6">
      {visible.length === 0 && (
        <p className="text-shore-400 text-sm text-center py-6">Keine Teams ausgewählt.</p>
      )}

      {visible.map((cat) => (
        <div key={cat.key}>
          <label className="form-label">
            🏐 {cat.label}
            <span className="ml-2 text-shore-400 font-normal text-xs">
              {data[cat.sliderKey]} Team{data[cat.sliderKey] > 1 ? 's' : ''}
            </span>
          </label>
          {cat.hint && <p className="text-xs text-shore-400 mb-2">{cat.hint}</p>}
          <TeamNameInputs
            catKey={cat.key}
            count={data[cat.sliderKey]}
            value={data[cat.key]}
            onChange={(val) => update({ [cat.key]: val })}
          />
        </div>
      ))}

      <div className="flex justify-between pt-2">
        <button className="btn-secondary" onClick={prev}>← Zurück</button>
        <button className="btn-primary" onClick={next}>Nächster Schritt →</button>
      </div>
    </div>
  );
}
