import { calcFees, fmt } from './FormWizard';

const CATEGORIES = [
  {
    key: 'kotc_maennlich',
    waitlistKey: 'kotc_maennlich_waitlist',
    label: 'King of the Court männlich',
    desc: 'Team aus 2 Personen',
    price: 15,
    priceLabel: '15 € Startgebühren',
  },
  {
    key: 'kotc_weiblich',
    waitlistKey: 'kotc_weiblich_waitlist',
    label: 'King of the Court weiblich',
    desc: 'Team aus 2 Personen',
    price: 15,
    priceLabel: '15 € Startgebühren',
  },
  {
    key: 'kotc_mixed',
    waitlistKey: 'kotc_mixed_waitlist',
    label: 'King of the Court mixed',
    desc: 'Team aus 2 Personen',
    price: 15,
    priceLabel: '15 € Startgebühren',
  },
  {
    key: 'beach_fun_a',
    waitlistKey: 'beach_fun_a_waitlist',
    label: 'Beach-Fun A',
    desc: '',
    price: 95,
    priceLabel: '45 € Startgebühren + 50 € Kaution',
  },
  {
    key: 'beach_fun_b',
    waitlistKey: 'beach_fun_b_waitlist',
    label: 'Beach-Fun B',
    desc: '',
    price: 95,
    priceLabel: '45 € Startgebühren + 50 € Kaution',
  },
];

function SliderField({ label, desc, priceLabel, value, onChange, isWaitlist }) {
  return (
    <div className={`p-4 rounded-lg border ${isWaitlist ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-gray-50'}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="font-semibold text-sm">{label}</span>
          {desc && <span className="text-gray-500 text-xs ml-2">{desc}</span>}
          <div className="text-xs text-gray-500">{priceLabel}</div>
        </div>
        {isWaitlist && (
          <span className="text-xs bg-orange-100 text-orange-700 border border-orange-300 px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
            Warteliste
          </span>
        )}
      </div>
      <div className="flex items-center gap-4 mt-3">
        <input
          type="range"
          min={0}
          max={10}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="flex-1"
        />
        <span className={`text-2xl font-bold w-8 text-center ${value > 0 ? 'text-bcc-blue' : 'text-gray-400'}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

export default function Step2Teams({ data, update, next, prev, waitlistStatus }) {
  const fees = calcFees(data);
  const hasTeams = data.kotc_maennlich + data.kotc_weiblich + data.kotc_mixed + data.beach_fun_a + data.beach_fun_b > 0;

  return (
    <div>
      <h2 className="text-lg font-bold text-bcc-blue mb-2">Informationen zu den Teams</h2>
      <p className="text-sm text-gray-600 mb-5">
        Welche und wie viele der folgenden Mannschaften nehmen am Mahrenholz Beachvolleyball-Cup teil?
        (Sollte eine der angegebenen Mannschaftskategorien nicht gewählt werden, so schieben Sie den Regler bitte auf 0.)
      </p>

      <div className="space-y-3">
        {CATEGORIES.map((cat) => (
          <SliderField
            key={cat.key}
            label={cat.label}
            desc={cat.desc}
            priceLabel={cat.priceLabel}
            value={data[cat.key]}
            onChange={(v) => update({ [cat.key]: v })}
            isWaitlist={waitlistStatus[cat.waitlistKey]}
          />
        ))}
      </div>

      {fees.mannschaft > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm">
          <span className="font-semibold">Gesamte Mannschaftsgebühren: </span>
          <span className="text-bcc-blue font-bold text-lg">{fmt(fees.mannschaft)}</span>
          {(data.beach_fun_a > 0 || data.beach_fun_b > 0) && (
            <p className="text-xs text-gray-500 mt-1">
              Inkl. Kaution (50 € pro Beach-Fun-Team, wird am Ende des Turniers unter Einhaltung der Bedingungen zurückgezahlt)
            </p>
          )}
        </div>
      )}

      {!hasTeams && (
        <p className="text-amber-600 text-sm mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
          Bitte wählen Sie mindestens eine Mannschaft aus.
        </p>
      )}

      <div className="mt-6 flex justify-between">
        <button className="btn-secondary" onClick={prev}>« Vorheriger Schritt</button>
        <button className="btn-primary" onClick={next} disabled={!hasTeams}>
          Nächster Schritt »
        </button>
      </div>
    </div>
  );
}
