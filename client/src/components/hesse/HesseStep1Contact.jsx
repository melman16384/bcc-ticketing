function Field({ label, name, type = 'text', placeholder = '', required, value, error, onChange, hint }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="form-label">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-shore-400 -mt-0.5 mb-0.5">{hint}</p>}
      <input
        type={type}
        className={`form-input ${error ? 'border-red-300 focus:border-red-400' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        required={required}
      />
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

export default function HesseStep1Contact({ data, update, next }) {
  const onChange = (name, val) => update({ [name]: val });

  const handleNext = () => {
    if (!data.firma || !data.vorname || !data.nachname || !data.email || !data.strasse || !data.ort || !data.plz) return;
    next();
  };

  const missing = !data.firma || !data.vorname || !data.nachname || !data.email || !data.strasse || !data.ort || !data.plz;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Firma" name="firma" required value={data.firma} onChange={onChange} placeholder="Muster GmbH" />
        <Field label="Kunden-Nr. (falls vorhanden)" name="kunden_nr" value={data.kunden_nr} onChange={onChange} placeholder="12345" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Vorname" name="vorname" required value={data.vorname} onChange={onChange} />
        <Field label="Nachname" name="nachname" required value={data.nachname} onChange={onChange} />
      </div>

      <Field label="Straße und Hausnummer" name="strasse" required value={data.strasse} onChange={onChange} placeholder="Musterstraße 1" />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Field label="PLZ" name="plz" required value={data.plz} onChange={onChange} placeholder="27472" />
        <div className="sm:col-span-2">
          <Field label="Stadt" name="ort" required value={data.ort} onChange={onChange} placeholder="Cuxhaven" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Telefon" name="telefon" type="tel" value={data.telefon} onChange={onChange} placeholder="0151 12345678" />
        <Field label="E-Mail-Adresse" name="email" type="email" required value={data.email} onChange={onChange} placeholder="kontakt@firma.de" />
      </div>

      <div className="flex justify-end pt-2">
        <button className="btn-primary" onClick={handleNext} disabled={missing}>
          Nächster Schritt →
        </button>
      </div>
    </div>
  );
}
