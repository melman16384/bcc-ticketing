import { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';

const CATS = [
  { key: 'kotc_maennlich', nameKey: 'names_kotc_maennlich', label: 'King of the Court männlich' },
  { key: 'kotc_weiblich',  nameKey: 'names_kotc_weiblich',  label: 'King of the Court weiblich' },
  { key: 'kotc_mixed',     nameKey: 'names_kotc_mixed',      label: 'King of the Court mixed'    },
  { key: 'beach_fun_a',    nameKey: 'names_beach_fun_a',     label: 'Beach-Fun A'                },
  { key: 'beach_fun_b',    nameKey: 'names_beach_fun_b',     label: 'Beach-Fun B'                },
];

function extractCode(raw) {
  const s = raw.trim();
  try {
    const url = new URL(s);
    const param = url.searchParams.get('code');
    if (param) return param.toUpperCase();
  } catch { /* not a URL */ }
  if (/^[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(s)) return s.toUpperCase();
  return null;
}

// ── QR Scanner ────────────────────────────────────────────────────────────────
function QrScanner({ onCode }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const [err, setErr]       = useState(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    let stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setActive(true);
        scan();
      } catch (e) {
        setErr('Kamera nicht verfügbar: ' + e.message);
      }
    })();

    function scan() {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img    = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
        if (result?.data) {
          const code = extractCode(result.data);
          if (code) { onCode(code); return; }
        }
      }
      rafRef.current = requestAnimationFrame(scan);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onCode]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-56 h-56">
          <div className="absolute inset-0 border-2 border-white/30 rounded-xl" />
          {['tl','tr','bl','br'].map((pos) => (
            <div key={pos} className={`absolute w-8 h-8 border-white ${
              pos === 'tl' ? 'top-0 left-0 border-r-0 border-b-0 rounded-tl-lg' :
              pos === 'tr' ? 'top-0 right-0 border-l-0 border-b-0 rounded-tr-lg' :
              pos === 'bl' ? 'bottom-0 left-0 border-r-0 border-t-0 rounded-bl-lg' :
                              'bottom-0 right-0 border-l-0 border-t-0 rounded-br-lg'
            }`} style={{ borderWidth: 3 }} />
          ))}
          <div className="absolute inset-x-0 top-1/2 -translate-y-px h-0.5 bg-ocean-400/70 animate-pulse" />
        </div>
      </div>
      {!active && !err && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <p className="text-white text-sm">Kamera wird gestartet…</p>
        </div>
      )}
      {err && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
          <p className="text-red-300 text-sm text-center">{err}</p>
        </div>
      )}
    </div>
  );
}

// ── PIN Dialog ────────────────────────────────────────────────────────────────
function PinDialog({ onSubmit, onCancel, error, checking }) {
  const [pin, setPin] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin.trim()) onSubmit(pin.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="text-center">
          <p className="text-2xl mb-1">🔐</p>
          <p className="font-bold text-shore-800 text-lg">PIN eingeben</p>
          <p className="text-shore-500 text-sm mt-0.5">Nur für autorisiertes Check-in-Personal</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            className="form-input text-center text-2xl tracking-widest font-mono"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            disabled={checking}
          />
          {error && (
            <p className="text-red-600 text-sm text-center font-medium">{error}</p>
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition"
            disabled={!pin.trim() || checking}
          >
            {checking ? 'Wird eingecheckt…' : '✅ Jetzt einchecken'}
          </button>
          <button type="button" className="w-full btn-secondary justify-center" onClick={onCancel}>
            Abbrechen
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Booking Card ──────────────────────────────────────────────────────────────
function BookingCard({ reg, onCheckinRequest }) {
  const alreadyCheckedIn = !!reg.checked_in_at;
  const paymentOk        = !!reg.payment_received_at;
  const isConfirmed      = reg.status === 'confirmed';
  const teams            = CATS.filter((c) => reg[c.key] > 0);

  let statusBanner;
  if (alreadyCheckedIn) {
    statusBanner = (
      <div className="rounded-xl p-4 bg-emerald-50 border border-emerald-200 text-emerald-800">
        <p className="font-bold text-lg">✅ Bereits eingecheckt</p>
        <p className="text-sm mt-0.5">{reg.checked_in_at?.slice(0, 16)} Uhr</p>
      </div>
    );
  } else if (!isConfirmed) {
    statusBanner = (
      <div className="rounded-xl p-4 bg-red-50 border border-red-200 text-red-700">
        <p className="font-bold">❌ Anmeldung nicht bestätigt</p>
        <p className="text-sm mt-0.5">Diese Buchung wurde noch nicht vom Admin bestätigt.</p>
      </div>
    );
  } else if (!paymentOk) {
    statusBanner = (
      <div className="rounded-xl p-4 bg-amber-50 border border-amber-200 text-amber-800">
        <p className="font-bold">⚠️ Zahlung nicht bestätigt</p>
        <p className="text-sm mt-0.5">Der Zahlungseingang wurde noch nicht im System vermerkt.</p>
      </div>
    );
  } else {
    statusBanner = (
      <div className="rounded-xl p-4 bg-ocean-50 border border-ocean-200 text-ocean-800">
        <p className="font-bold">🎟️ Buchung gültig – bereit zum Check-in</p>
        <p className="text-sm mt-0.5">Zahlung bestätigt am {reg.payment_received_at?.slice(0, 10)}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-shore-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-shore-100 bg-shore-50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-shore-800">{reg.vorname} {reg.nachname}</p>
            {reg.vereinsname && <p className="text-sm text-shore-500">{reg.vereinsname}</p>}
          </div>
          <span className="font-mono text-xs font-bold text-ocean-600 bg-ocean-50 border border-ocean-200 rounded-lg px-2 py-1 tracking-widest shrink-0">
            {reg.booking_code}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {statusBanner}

        {teams.length > 0 && (
          <div>
            <p className="text-xs font-bold text-shore-400 uppercase tracking-widest mb-2">🏐 Angemeldete Teams</p>
            <div className="space-y-2">
              {teams.map((c) => {
                const names = (reg[c.nameKey] || '').split('\n').filter(Boolean);
                return (
                  <div key={c.key} className="bg-shore-50 rounded-xl p-3 border border-shore-100">
                    <p className="text-xs font-bold text-shore-500 mb-1">{c.label} ({reg[c.key]}×)</p>
                    {names.map((n, i) => <p key={i} className="text-sm text-shore-700">{i + 1}. {n}</p>)}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-xs text-shore-400 space-y-0.5">
          <p>{reg.email}</p>
          <p>{reg.telefon}</p>
        </div>

        {!alreadyCheckedIn && isConfirmed && paymentOk && (
          <button
            className="w-full py-4 rounded-xl font-bold text-lg bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 transition shadow"
            onClick={onCheckinRequest}
          >
            Einchecken →
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CheckinPage() {
  const [mode, setMode]           = useState('scan');
  const [manualInput, setManualInput] = useState('');
  const [reg, setReg]             = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(false);
  const [showPin, setShowPin]     = useState(false);
  const [pinError, setPinError]   = useState(null);
  const [checking, setChecking]   = useState(false);
  const lastCode = useRef(null);

  const lookupCode = useCallback(async (code) => {
    if (!code || code === lastCode.current) return;
    lastCode.current = code;
    setError(null);
    setSuccess(false);
    setReg(null);
    setLoading(true);
    try {
      const r = await fetch(`/api/checkin/${encodeURIComponent(code)}`);
      const j = await r.json();
      r.ok ? setReg(j) : setError(j.error || 'Buchung nicht gefunden');
    } catch { setError('Verbindungsfehler'); }
    finally { setLoading(false); }
  }, []);

  const handleManual = (e) => {
    e.preventDefault();
    const code = extractCode(manualInput.trim());
    if (code) lookupCode(code);
    else setError('Ungültiges Format – bitte XXXX-XXXX eingeben');
  };

  const submitPin = async (pin) => {
    if (!reg) return;
    setChecking(true);
    setPinError(null);
    try {
      const r = await fetch(`/api/checkin/${encodeURIComponent(reg.booking_code)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const j = await r.json();
      if (!r.ok) {
        setPinError(j.error || 'Fehler');
      } else {
        setShowPin(false);
        setSuccess(true);
        setReg((prev) => ({ ...prev, checked_in_at: new Date().toLocaleString('de-DE') }));
      }
    } catch { setPinError('Verbindungsfehler'); }
    finally { setChecking(false); }
  };

  const reset = () => {
    setReg(null);
    setError(null);
    setSuccess(false);
    setManualInput('');
    setShowPin(false);
    setPinError(null);
    lastCode.current = null;
  };

  // Auto-lookup from ?code= in URL
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) lookupCode(code.toUpperCase());
  }, [lookupCode]);

  return (
    <div className="min-h-screen bg-shore-50">
      {showPin && (
        <PinDialog
          onSubmit={submitPin}
          onCancel={() => { setShowPin(false); setPinError(null); }}
          error={pinError}
          checking={checking}
        />
      )}

      <header style={{ background: 'linear-gradient(135deg, #f0d9ad 0%, #e5c17a 50%, #aed5e8 100%)' }}>
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="BCC" className="h-10 w-10 rounded-full" />
            <div>
              <p className="font-bold text-shore-800 text-sm leading-tight">Check-in</p>
              <p className="text-shore-600 text-xs">Mahrenholz Beach-Cup 2026</p>
            </div>
          </div>
          <a href="/admin" className="text-xs text-shore-600 bg-white/60 rounded-lg px-2 py-1 hover:bg-white/80">Admin →</a>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {(reg || error || loading) ? (
          <div className="space-y-4">
            <button onClick={reset} className="btn-secondary text-sm">← Neuer Scan</button>
            {loading && <div className="text-center py-10 text-shore-400">Suche Buchung…</div>}
            {error && (
              <div className="rounded-xl p-4 bg-red-50 border border-red-200 text-red-700">
                <p className="font-bold">Nicht gefunden</p>
                <p className="text-sm mt-0.5">{error}</p>
              </div>
            )}
            {reg && (
              <BookingCard
                reg={reg}
                onCheckinRequest={() => { setPinError(null); setShowPin(true); }}
              />
            )}
            {success && (
              <div className="rounded-xl p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-center">
                <p className="text-2xl mb-1">🎉</p>
                <p className="font-bold">Erfolgreich eingecheckt!</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex bg-white rounded-xl border border-shore-200 p-1 gap-1">
              <button
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === 'scan' ? 'bg-ocean-600 text-white shadow-sm' : 'text-shore-500 hover:bg-shore-50'}`}
                onClick={() => setMode('scan')}
              >
                📷 QR-Scanner
              </button>
              <button
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === 'manual' ? 'bg-ocean-600 text-white shadow-sm' : 'text-shore-500 hover:bg-shore-50'}`}
                onClick={() => setMode('manual')}
              >
                ⌨️ Code eingeben
              </button>
            </div>

            {mode === 'scan' && (
              <div className="space-y-3">
                <QrScanner onCode={lookupCode} />
                <p className="text-xs text-shore-400 text-center">QR-Code aus der Check-in-E-Mail vor die Kamera halten</p>
              </div>
            )}

            {mode === 'manual' && (
              <form onSubmit={handleManual} className="card space-y-3">
                <p className="text-sm font-semibold text-shore-700">Buchungscode eingeben</p>
                <input
                  type="text"
                  className="form-input font-mono text-center text-lg tracking-widest uppercase"
                  placeholder="XXXX-XXXX"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                  autoFocus
                  maxLength={9}
                />
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button type="submit" className="btn-primary w-full justify-center" disabled={!manualInput.trim()}>
                  Buchung suchen →
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
