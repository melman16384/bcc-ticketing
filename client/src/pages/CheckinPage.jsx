import { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';

// ── PWA Setup ─────────────────────────────────────────────────────────────────
function usePwa() {
  useEffect(() => {
    // Manifest nur für diese Seite
    const link = Object.assign(document.createElement('link'), {
      rel: 'manifest', href: '/checkin-manifest.json',
    });
    document.head.appendChild(link);

    // Theme color
    const meta = Object.assign(document.createElement('meta'), {
      name: 'theme-color', content: '#1d4f70',
    });
    document.head.appendChild(meta);

    // Service Worker registrieren (scope /checkin)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/checkin-sw.js', { scope: '/checkin' }).catch(() => {});
    }

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(meta);
    };
  }, []);
}

// Screen Wake Lock — verhindert, dass das Display beim Scannen ausgeht
function useWakeLock(active) {
  const lockRef = useRef(null);
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    navigator.wakeLock.request('screen').then((l) => { lockRef.current = l; }).catch(() => {});
    return () => { lockRef.current?.release().catch(() => {}); };
  }, [active]);
}

const CATS = [
  { key: 'kotc_maennlich', nameKey: 'names_kotc_maennlich', label: 'King of the Court männlich' },
  { key: 'kotc_weiblich',  nameKey: 'names_kotc_weiblich',  label: 'King of the Court weiblich' },
  { key: 'kotc_mixed',     nameKey: 'names_kotc_mixed',      label: 'King of the Court mixed'    },
  { key: 'beach_fun_a',    nameKey: 'names_beach_fun_a',     label: 'Beach-Fun A'                },
  { key: 'beach_fun_b',    nameKey: 'names_beach_fun_b',     label: 'Beach-Fun B'                },
];

function extractScan(raw) {
  const s = raw.trim();
  try {
    const url = new URL(s);
    const code = url.searchParams.get('code');
    if (code) return { code: code.toUpperCase(), cup: url.searchParams.get('cup') || 'mahrenholz' };
  } catch { /* not a URL */ }
  if (/^[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(s)) return { code: s.toUpperCase(), cup: 'mahrenholz' };
  return null;
}

function apiPrefix(cup) {
  return cup === 'hesse' ? '/api/hesse' : '/api';
}

// ── QR Scanner ────────────────────────────────────────────────────────────────
function QrScanner({ onCode, active }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const [camErr, setCamErr] = useState(null);
  const [ready, setReady]   = useState(false);

  useWakeLock(active);

  useEffect(() => {
    if (!active) return;
    let stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
        tick();
      } catch (e) {
        setCamErr(e.message);
      }
    })();

    function tick() {
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
          const scan = extractScan(result.data);
          if (scan) { onCode(scan.code, scan.cup); return; }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((t) => t.stop());
      setReady(false);
    };
  }, [active, onCode]);

  return (
    <div className="relative w-full bg-black overflow-hidden" style={{ height: '62vmax', maxHeight: '72vh' }}>
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />

      {/* Viewfinder */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Dimmed corners */}
        <div className="absolute inset-0 bg-black/40" style={{
          clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%,0 35%,20% 35%,20% 65%,80% 65%,80% 35%,0 35%)',
        }} />
        <div className="relative w-2/3 aspect-square max-w-xs">
          {[['top-0 left-0 border-r-0 border-b-0 rounded-tl-2xl','tl'],
            ['top-0 right-0 border-l-0 border-b-0 rounded-tr-2xl','tr'],
            ['bottom-0 left-0 border-r-0 border-t-0 rounded-bl-2xl','bl'],
            ['bottom-0 right-0 border-l-0 border-t-0 rounded-br-2xl','br']
          ].map(([cls]) => (
            <div key={cls} className={`absolute w-8 h-8 border-white ${cls}`} style={{ borderWidth: 3 }} />
          ))}
          <div className="absolute inset-x-0 top-1/2 -translate-y-px h-0.5 bg-ocean-400/80 animate-pulse" />
        </div>
      </div>

      {!ready && !camErr && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-white/70 text-sm">Kamera wird gestartet…</p>
        </div>
      )}
      {camErr && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 p-6 text-center">
          <p className="text-3xl">📷</p>
          <p className="text-white font-semibold">Kein Kamerazugriff</p>
          <p className="text-white/60 text-sm">{camErr}</p>
          <p className="text-white/40 text-xs">Bitte Kamerazugriff im Browser erlauben</p>
        </div>
      )}
      {ready && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 rounded-full px-3 py-1">
          <p className="text-white/70 text-xs">QR-Code aus der E-Mail scannen</p>
        </div>
      )}
    </div>
  );
}

// ── PIN Dialog ────────────────────────────────────────────────────────────────
function PinDialog({ onSubmit, onCancel, error, checking }) {
  const [pin, setPin] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    // Kurze Verzögerung damit iOS Keyboard sauber öffnet
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin.trim()) onSubmit(pin.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-t-3xl shadow-2xl p-6 space-y-5">
        <div className="w-10 h-1 bg-shore-200 rounded-full mx-auto -mt-1 mb-2" />
        <div className="text-center space-y-1">
          <p className="text-3xl">🔐</p>
          <p className="font-bold text-shore-800 text-xl">PIN eingeben</p>
          <p className="text-shore-400 text-sm">Nur für Check-in-Personal</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-full border-2 border-shore-200 rounded-2xl px-4 py-4 text-center text-3xl tracking-[0.5em] font-mono focus:border-ocean-400 focus:outline-none transition"
            style={{ fontSize: '24px' }}
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            disabled={checking}
            autoComplete="off"
          />
          {error && (
            <div className="rounded-xl p-3 bg-red-50 border border-red-200 text-center">
              <p className="text-red-600 text-sm font-semibold">{error}</p>
            </div>
          )}
          <button
            type="submit"
            className="w-full py-4 rounded-2xl font-bold text-lg bg-emerald-500 text-white active:bg-emerald-700 transition disabled:opacity-40"
            disabled={!pin.trim() || checking}
            style={{ minHeight: 56 }}
          >
            {checking ? 'Wird eingecheckt…' : '✅ Einchecken bestätigen'}
          </button>
          <button
            type="button"
            className="w-full py-3 rounded-2xl font-semibold text-shore-500 bg-shore-100 active:bg-shore-200 transition"
            onClick={onCancel}
            style={{ minHeight: 48 }}
          >
            Abbrechen
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Buchungs-Ergebnis (Bottom Sheet) ─────────────────────────────────────────
function ResultSheet({ reg, onCheckinRequest, onReset, success, cup }) {
  const alreadyCheckedIn = !!reg.checked_in_at;
  const paymentOk        = !!reg.payment_received_at;
  const isConfirmed      = reg.status === 'confirmed';
  const canCheckin       = isConfirmed && paymentOk && !alreadyCheckedIn;
  const isHesse          = cup === 'hesse';
  const teams            = isHesse ? null : CATS.filter((c) => reg[c.key] > 0);

  let statusColor, statusIcon, statusText, statusSub;
  if (success || alreadyCheckedIn) {
    statusColor = 'bg-emerald-500'; statusIcon = '✅';
    statusText  = 'Eingecheckt';
    statusSub   = reg.checked_in_at?.slice(0, 16) + ' Uhr';
  } else if (!isConfirmed) {
    statusColor = 'bg-red-500'; statusIcon = '❌';
    statusText  = 'Nicht bestätigt';
    statusSub   = 'Anmeldung noch nicht vom Admin bestätigt';
  } else if (!paymentOk) {
    statusColor = 'bg-amber-500'; statusIcon = '⚠️';
    statusText  = 'Zahlung ausstehend';
    statusSub   = 'Zahlungseingang noch nicht vermerkt';
  } else {
    statusColor = 'bg-ocean-600'; statusIcon = '🎟️';
    statusText  = 'Bereit zum Check-in';
    statusSub   = 'Zahlung bestätigt';
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Farbiger Status-Header */}
      <div className={`${statusColor} text-white px-5 pt-5 pb-6`}>
        <button
          onClick={onReset}
          className="mb-3 flex items-center gap-2 bg-white/20 active:bg-white/30 rounded-xl px-4 py-2.5 text-white font-semibold text-sm transition"
          style={{ minHeight: 44 }}
        >
          ← Neuer Scan
        </button>
        <div className="flex items-center gap-4">
          <span className="text-4xl">{statusIcon}</span>
          <div>
            <p className="font-bold text-xl leading-tight">{statusText}</p>
            <p className="text-white/80 text-sm">{statusSub}</p>
          </div>
        </div>
      </div>

      {/* Scrollbarer Inhalt */}
      <div className="flex-1 overflow-y-auto">
        {/* Name / Code */}
        <div className="px-5 py-4 border-b border-shore-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-xl text-shore-800">{reg.vorname} {reg.nachname}</p>
              {isHesse && reg.firma && <p className="text-shore-600 text-sm font-semibold">{reg.firma}</p>}
              {!isHesse && reg.vereinsname && <p className="text-shore-500 text-sm">{reg.vereinsname}</p>}
              <p className="text-shore-400 text-xs mt-0.5">{reg.email}</p>
              <span className={`inline-block mt-1.5 text-xs font-bold px-2 py-0.5 rounded-full ${isHesse ? 'bg-red-100 text-red-700' : 'bg-ocean-50 text-ocean-700'}`}>
                {isHesse ? '🏢 Heße Cup' : '🌊 Mahrenholz Cup'}
              </span>
            </div>
            <span className={`font-mono text-xs font-bold rounded-xl px-3 py-1.5 tracking-widest shrink-0 border ${isHesse ? 'text-red-700 bg-red-50 border-red-200' : 'text-ocean-600 bg-ocean-50 border-ocean-200'}`}>
              {reg.booking_code}
            </span>
          </div>
        </div>

        {/* Teams — Mahrenholz */}
        {!isHesse && teams && teams.length > 0 && (
          <div className="px-5 py-4 border-b border-shore-100 space-y-2">
            <p className="text-xs font-bold text-shore-400 uppercase tracking-widest">🏐 Teams</p>
            {teams.map((c) => {
              const names = (reg[c.nameKey] || '').split('\n').filter(Boolean);
              return (
                <div key={c.key} className="bg-shore-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-shore-500 mb-1">{c.label} ({reg[c.key]}×)</p>
                  {names.map((n, i) => <p key={i} className="text-sm text-shore-700">{i + 1}. {n}</p>)}
                </div>
              );
            })}
          </div>
        )}

        {/* Teams — Heße Cup */}
        {isHesse && (
          <div className="px-5 py-4 border-b border-shore-100 space-y-2">
            <p className="text-xs font-bold text-shore-400 uppercase tracking-widest">🏐 Mannschaften</p>
            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-xs font-bold text-red-600 mb-1">4er-Mixed ({reg.mannschaften}× Teams · {reg.teilnehmer_anzahl} Teilnehmer)</p>
              {(reg.mannschaftsnamen || '').split('\n').filter(Boolean).map((n, i) =>
                <p key={i} className="text-sm text-shore-700">{i + 1}. {n}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Check-in Button — immer am unteren Rand (thumb zone) */}
      {canCheckin && (
        <div className="p-4 border-t border-shore-100 bg-white" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <button
            className="w-full py-5 rounded-2xl font-bold text-xl bg-emerald-500 text-white active:bg-emerald-700 transition shadow-lg"
            onClick={onCheckinRequest}
            style={{ minHeight: 64 }}
          >
            Einchecken →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CheckinPage() {
  usePwa();

  const [mode, setMode]           = useState('scan');
  const [manualInput, setManualInput] = useState('');
  const [reg, setReg]             = useState(null);
  const [cup, setCup]             = useState('mahrenholz');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(false);
  const [showPin, setShowPin]     = useState(false);
  const [pinError, setPinError]   = useState(null);
  const [checking, setChecking]   = useState(false);
  const lastCode = useRef(null);

  const lookupCode = useCallback(async (code, scanCup = 'mahrenholz') => {
    if (!code || code === lastCode.current) return;
    lastCode.current = code;
    setError(null);
    setSuccess(false);
    setReg(null);
    setCup(scanCup);
    setLoading(true);
    try {
      const r = await fetch(`${apiPrefix(scanCup)}/checkin/${encodeURIComponent(code)}`);
      const j = await r.json();
      r.ok ? setReg(j) : setError(j.error || 'Buchung nicht gefunden');
    } catch { setError('Verbindungsfehler'); }
    finally { setLoading(false); }
  }, []);

  const handleManual = (e) => {
    e.preventDefault();
    const scan = extractScan(manualInput.trim());
    if (scan) lookupCode(scan.code, scan.cup);
    else setError('Format ungültig – bitte XXXX-XXXX eingeben');
  };

  const submitPin = async (pin) => {
    if (!reg) return;
    setChecking(true);
    setPinError(null);
    try {
      const r = await fetch(`${apiPrefix(cup)}/checkin/${encodeURIComponent(reg.booking_code)}`, {
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
        navigator.vibrate?.([100, 50, 100]);
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
    setCup('mahrenholz');
    lastCode.current = null;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const scanCup = params.get('cup') || 'mahrenholz';
    if (code) lookupCode(code.toUpperCase(), scanCup);
  }, [lookupCode]);

  const showResult = reg || error || loading;

  return (
    <div
      className="flex flex-col bg-shore-50 overflow-hidden"
      style={{ height: '100dvh', paddingTop: 'env(safe-area-inset-top)' }}
    >
      {showPin && (
        <PinDialog
          onSubmit={submitPin}
          onCancel={() => { setShowPin(false); setPinError(null); }}
          error={pinError}
          checking={checking}
        />
      )}

      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #f0d9ad 0%, #e5c17a 50%, #aed5e8 100%)' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.png" alt="BCC" className="h-9 w-9 rounded-full shadow-sm" />
            <div>
              <p className="font-bold text-shore-800 text-sm leading-tight">Check-in</p>
              <p className="text-shore-600 text-xs">Beach-Cup 2026</p>
            </div>
          </div>
        </div>

        {/* Modus-Toggle im Header */}
        {!showResult && (
          <div className="flex px-4 pb-3 gap-1.5">
            {[['scan', '📷 QR-Scanner'], ['manual', '⌨️ Code']].map(([m, label]) => (
              <button
                key={m}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
                  mode === m ? 'bg-ocean-600 text-white shadow-sm' : 'bg-white/50 text-shore-600 active:bg-white/70'
                }`}
                onClick={() => setMode(m)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      {showResult ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          {loading && (
            <div className="flex flex-col flex-1 items-center justify-center gap-4">
              <div className="w-10 h-10 border-2 border-shore-200 border-t-ocean-500 rounded-full animate-spin" />
              <p className="text-shore-400">Suche Buchung…</p>
            </div>
          )}
          {error && (
            <div className="p-5 space-y-4">
              <button
                onClick={reset}
                className="flex items-center gap-2 bg-shore-100 active:bg-shore-200 rounded-xl px-4 py-3 text-shore-600 font-semibold text-sm transition"
                style={{ minHeight: 44 }}
              >
                ← Neuer Scan
              </button>
              <div className="rounded-2xl p-5 bg-red-50 border border-red-200 text-center space-y-2">
                <p className="text-3xl">❌</p>
                <p className="font-bold text-red-700 text-lg">Nicht gefunden</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}
          {reg && (
            <ResultSheet
              reg={reg}
              cup={cup}
              success={success}
              onCheckinRequest={() => { setPinError(null); setShowPin(true); }}
              onReset={reset}
            />
          )}
        </div>
      ) : mode === 'scan' ? (
        <div className="flex flex-col flex-1">
          <QrScanner onCode={lookupCode} active={!showResult && mode === 'scan'} />
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-shore-400 text-sm text-center">
              QR-Code aus der Check-in-E-Mail vor die Kamera halten
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleManual} className="space-y-4 pt-2">
            <p className="text-shore-500 text-sm text-center">Buchungscode manuell eingeben</p>
            <input
              type="text"
              className="w-full border-2 border-shore-200 rounded-2xl px-4 py-4 text-center font-mono text-2xl tracking-widest uppercase focus:border-ocean-400 focus:outline-none transition bg-white"
              style={{ fontSize: '22px' }}
              placeholder="XXXX-XXXX"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value.toUpperCase())}
              autoFocus
              autoCapitalize="characters"
              autoCorrect="off"
              maxLength={9}
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              type="submit"
              className="w-full py-4 rounded-2xl font-bold text-lg bg-ocean-600 text-white active:bg-ocean-800 transition disabled:opacity-40"
              disabled={!manualInput.trim()}
              style={{ minHeight: 56 }}
            >
              Buchung suchen →
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
