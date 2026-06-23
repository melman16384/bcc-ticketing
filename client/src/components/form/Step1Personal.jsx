import { useState } from 'react';

// Defined outside component so React never recreates it between renders
function Field({ label, name, type = 'text', placeholder = '', required, value, error, onChange }) {
  return (
    <div>
      <label className="form-label">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type={type}
        className={`form-input ${error ? 'border-red-300 ring-1 ring-red-200' : ''}`}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function Step1Personal({ data, update, next }) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!data.vorname.trim())  e.vorname  = 'Vorname ist erforderlich';
    if (!data.nachname.trim()) e.nachname = 'Nachname ist erforderlich';
    if (!data.strasse.trim())  e.strasse  = 'Straße und Hausnummer ist erforderlich';
    if (!data.ort.trim())      e.ort      = 'Ort ist erforderlich';
    if (!data.plz.trim())      e.plz      = 'Postleitzahl ist erforderlich';
    if (!data.email.trim() || !data.email.includes('@')) e.email = 'Gültige E-Mail-Adresse erforderlich';
    if (!data.telefon.trim())  e.telefon  = 'Telefonnummer ist erforderlich';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (name) => (e) => {
    update({ [name]: e.target.value });
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  return (
    <div className="space-y-4">
      <Field
        label="Vereinsname (NICHT NAME DER MANNSCHAFT)"
        name="vereinsname" value={data.vereinsname}
        onChange={handleChange('vereinsname')}
      />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Vorname" name="vorname" placeholder="Max" required
          value={data.vorname} error={errors.vorname} onChange={handleChange('vorname')} />
        <Field label="Nachname" name="nachname" placeholder="Mustermann" required
          value={data.nachname} error={errors.nachname} onChange={handleChange('nachname')} />
      </div>

      <Field label="Straße und Hausnummer" name="strasse" required
        value={data.strasse} error={errors.strasse} onChange={handleChange('strasse')} />

      <div className="grid grid-cols-3 gap-4">
        <Field label="Postleitzahl" name="plz" required
          value={data.plz} error={errors.plz} onChange={handleChange('plz')} />
        <div className="col-span-2">
          <Field label="Ort" name="ort" required
            value={data.ort} error={errors.ort} onChange={handleChange('ort')} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <Field label="E-Mail" name="email" type="email" required
            value={data.email} error={errors.email} onChange={handleChange('email')} />
        </div>
        <div className="col-span-1">
          <Field label="Telefon" name="telefon" type="tel" required
            value={data.telefon} error={errors.telefon} onChange={handleChange('telefon')} />
        </div>
        <div className="col-span-1">
          <Field label="Kunden-Nr." name="kunden_nr" type="number"
            value={data.kunden_nr} onChange={handleChange('kunden_nr')} />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button className="btn-primary" onClick={() => { if (validate()) next(); }}>
          Nächster Schritt →
        </button>
      </div>
    </div>
  );
}
