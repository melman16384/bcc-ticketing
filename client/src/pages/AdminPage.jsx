import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation, NavLink, Navigate } from 'react-router-dom';

// ── Helpers ───────────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('bcc_token') || '';
const getUser  = () => { try { return JSON.parse(localStorage.getItem('bcc_user') || '{}'); } catch { return {}; } };

function authFetch(url, opts = {}) {
  return fetch(url, {
    ...opts,
    headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: opts.body,
  });
}

const fmt = (n) => Number(n || 0).toFixed(2).replace('.', ',') + ' €';

const STATUS = {
  pending:   { label: 'Ausstehend',  icon: '⏳', cls: 'bg-amber-50  text-amber-700  border-amber-200'  },
  confirmed: { label: 'Bestätigt',   icon: '✅', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  waitlist:  { label: 'Warteliste',  icon: '🏖️', cls: 'bg-sand-100  text-sand-600   border-sand-300'   },
  cancelled: { label: 'Storniert',   icon: '❌', cls: 'bg-red-50    text-red-600    border-red-200'    },
};

function Badge({ status }) {
  const s = STATUS[status] || { label: status, icon: '•', cls: 'bg-shore-100 text-shore-500 border-shore-200' };
  return <span className={`badge ${s.cls}`}>{s.icon} {s.label}</span>;
}

function useAdminData(url, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await authFetch(url);
      if (r.status === 401) { localStorage.clear(); navigate('/login'); return; }
      setData(await r.json());
    } catch {/* ignore */} finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, reload: load };
}

// ── Shared display components (defined at module level — no focus bug) ────────
function DetailField({ label, value }) {
  if (value == null || value === '' || value === 0) return null;
  return (
    <div className="flex gap-3 py-2 border-b border-shore-50 last:border-0">
      <dt className="w-48 shrink-0 text-xs font-semibold text-shore-400 pt-0.5">{label}</dt>
      <dd className="text-sm text-shore-700 flex-1">
        {String(value).includes('\n')
          ? <ol className="space-y-1 list-none m-0 p-0">
              {String(value).split('\n').filter(Boolean).map((line, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-shore-300 w-4 shrink-0">{i + 1}.</span>
                  <span className="bg-shore-50 border border-shore-200 rounded-md px-2 py-0.5 text-xs font-medium text-shore-700">{line}</span>
                </li>
              ))}
            </ol>
          : <span className="break-words">{String(value)}</span>
        }
      </dd>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <div className="mb-5">
      <p className="section-title">{title}</p>
      <dl>{children}</dl>
    </div>
  );
}

// Input helper for SMTP form — defined at module level to avoid focus loss
function SmtpField({ label, name, type = 'text', placeholder, value, onChange }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <input
        type={type}
        className="form-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

// Input helper for user form
function UserField({ label, name, type = 'text', placeholder, value, onChange, required }) {
  return (
    <div>
      <label className="form-label">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      <input type={type} className="form-input" placeholder={placeholder} value={value} onChange={onChange} required={required} />
    </div>
  );
}

// ── Sidebar (light theme) ─────────────────────────────────────────────────────
function Sidebar({ onLogout }) {
  const user = getUser();
  const mkNavCls = (activeColor) => ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
      isActive ? `${activeColor} text-white shadow-sm` : 'text-shore-600 hover:bg-shore-100 hover:text-shore-800'
    }`;

  return (
    <aside className="w-52 shrink-0 flex flex-col min-h-screen bg-white border-r border-shore-200">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-shore-100">
        <img
          src="https://cux-beach.de/wp-content/uploads/2023/10/BC-Banner-no-bg-600-200-1.png"
          alt="BCC"
          className="h-7"
        />
        <p className="text-shore-400 text-xs mt-1.5 font-medium">Admin-Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto">

        {/* ── Mahrenholz Cup ── */}
        <div className="mx-3 mt-3 mb-1 rounded-xl overflow-hidden border border-ocean-100">
          <div className="px-3 py-2 flex items-center gap-2" style={{ background: 'linear-gradient(135deg,#aed5e8,#1d4f70)' }}>
            <span className="text-base">🌊</span>
            <div>
              <p className="text-white font-bold text-xs leading-tight">Mahrenholz Cup</p>
              <p className="text-white/60 text-[10px] leading-tight">Beach-Volleyball 2026</p>
            </div>
          </div>
          <div className="p-1.5 space-y-0.5 bg-ocean-50/40">
            <NavLink to="/admin" end className={mkNavCls('bg-ocean-600')}>📊 Dashboard</NavLink>
            <NavLink to="/admin/registrations" className={mkNavCls('bg-ocean-600')}>📋 Anmeldungen</NavLink>
          </div>
        </div>

        {/* ── Heße Immobilien Cup ── */}
        <div className="mx-3 mt-2 rounded-xl overflow-hidden border border-red-100">
          <div className="px-3 py-2 flex items-center gap-2" style={{ background: 'linear-gradient(135deg,#e8a0a0,#c0392b)' }}>
            <span className="text-base">🏢</span>
            <div>
              <p className="text-white font-bold text-xs leading-tight">Heße Cup</p>
              <p className="text-white/60 text-[10px] leading-tight">Firmencup 2026</p>
            </div>
          </div>
          <div className="p-1.5 space-y-0.5 bg-red-50/40">
            <NavLink to="/admin/hesse" end className={mkNavCls('bg-red-600')}>📊 Dashboard</NavLink>
            <NavLink to="/admin/hesse/registrations" className={mkNavCls('bg-red-600')}>📋 Anmeldungen</NavLink>
          </div>
        </div>

        {/* ── Globale Einstellungen & Links ── */}
        <div className="px-2 pt-4 pb-1 mt-3 border-t border-shore-100 space-y-0.5">
          <p className="px-3 pb-1 text-xs font-bold text-shore-400 uppercase tracking-widest">System</p>
          <NavLink to="/admin/waitlist" className={mkNavCls('bg-ocean-600')}>⏳ Warteliste</NavLink>
          {user.role === 'superadmin' && <>
            <NavLink to="/admin/smtp" className={mkNavCls('bg-ocean-600')}>✉️ E-Mail / SMTP</NavLink>
            <NavLink to="/admin/payment" className={mkNavCls('bg-ocean-600')}>💶 Zahlungsdaten</NavLink>
            <NavLink to="/admin/users" className={mkNavCls('bg-ocean-600')}>👤 Benutzer</NavLink>
          </>}
          <p className="px-3 pt-3 pb-1 text-xs font-bold text-shore-400 uppercase tracking-widest">Links</p>
          <a href="/checkin" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-shore-600 hover:bg-shore-100 hover:text-shore-800 transition">
            🎟️ Check-in Scanner
          </a>
          <a href="/" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-shore-600 hover:bg-shore-100 hover:text-shore-800 transition">
            ← Turnierwahl
          </a>
        </div>
      </nav>

      {/* User */}
      <div className="px-2 py-3 border-t border-shore-100 bg-shore-50">
        <div className="px-3 py-2 mb-1">
          <p className="text-shore-700 text-xs font-semibold truncate">{user.name || user.email}</p>
          <p className="text-shore-400 text-xs truncate mt-0.5">{user.email}</p>
          <span className={`badge mt-1.5 text-xs ${user.role === 'superadmin' ? 'bg-sand-100 text-sand-600 border-sand-300' : 'bg-ocean-50 text-ocean-600 border-ocean-200'}`}>
            {user.role === 'superadmin' ? '⭐ Superadmin' : '🔑 Admin'}
          </span>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-50 hover:text-red-600 transition"
        >
          🚪 Abmelden
        </button>
      </div>
    </aside>
  );
}

function PageHeader({ title, icon, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
      <h1 className="text-xl font-bold text-shore-800 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h1>
      {children}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard() {
  const { data: stats } = useAdminData('/api/admin/stats');
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader title="Dashboard" icon="📊" />

      <div className="grid grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Gesamt',      value: stats?.total,      icon: '📋', color: 'text-shore-700' },
          { label: 'Ausstehend',  value: stats?.pending,    icon: '⏳', color: 'text-amber-600',   action: () => navigate('/admin/registrations?status=pending') },
          { label: 'Bestätigt',   value: stats?.confirmed,  icon: '✅', color: 'text-emerald-600', action: () => navigate('/admin/registrations?status=confirmed') },
          { label: 'Eingecheckt', value: stats?.checked_in, icon: '🎟️', color: 'text-ocean-600',   action: () => navigate('/admin/registrations?checked_in=true') },
          { label: 'Warteliste',  value: stats?.waitlist,   icon: '🏖️', color: 'text-sand-500',    action: () => navigate('/admin/registrations?status=waitlist') },
          { label: 'Storniert',   value: stats?.cancelled,  icon: '❌', color: 'text-red-400',     action: () => navigate('/admin/registrations?status=cancelled') },
        ].map((c) => (
          <div key={c.label} onClick={c.action}
            className={`stat-card ${c.action ? 'cursor-pointer hover:shadow-md transition hover:border-ocean-200' : ''}`}>
            <span className="text-lg">{c.icon}</span>
            <div className={`text-2xl font-bold ${c.color}`}>{c.value ?? '—'}</div>
            <div className="text-xs text-shore-400 font-medium">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <p className="text-xs font-bold text-shore-400 uppercase tracking-widest mb-3">🏐 Teams nach Kategorie</p>
        <div className="grid grid-cols-5 gap-3 text-center">
          {[
            { label: 'King of the Court ♂', value: stats?.teams?.kotc_m, waitlist: true },
            { label: 'King of the Court ♀', value: stats?.teams?.kotc_w },
            { label: 'King of the Court Mixed', value: stats?.teams?.kotc_x },
            { label: 'Beach-Fun A', value: stats?.teams?.bfa, waitlist: true },
            { label: 'Beach-Fun B', value: stats?.teams?.bfb, waitlist: true },
          ].map((t) => (
            <div key={t.label} className="bg-shore-50 rounded-xl p-3 border border-shore-100">
              <div className="text-2xl font-bold text-ocean-600">{t.value ?? 0}</div>
              <div className="text-xs text-shore-500 mt-1 leading-tight">{t.label}</div>
              {t.waitlist && <div className="text-xs text-sand-500 mt-0.5">⏳</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Registration List ─────────────────────────────────────────────────────────
function RegistrationList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get('checked_in') === 'true') setStatusFilter('checked_in');
    else setStatusFilter(p.get('status') || '');
  }, [location.search]);
  const url = `/api/admin/registrations?${new URLSearchParams({
    ...(statusFilter === 'checked_in' ? { checked_in: 'true' } : statusFilter ? { status: statusFilter } : {}),
    ...(search && { search }),
  })}`;
  const { data: regs, loading, reload } = useAdminData(url, [search, statusFilter]);

  return (
    <div>
      <PageHeader title="Anmeldungen" icon="📋">
        <button
          className="btn-secondary text-sm"
          onClick={async () => {
            const r = await authFetch('/api/admin/export/csv');
            if (!r.ok) return alert('Export fehlgeschlagen');
            const blob = await r.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `anmeldungen-${new Date().toISOString().slice(0,10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          ↓ CSV exportieren
        </button>
      </PageHeader>

      <div className="card mb-3 p-3 flex flex-wrap gap-2">
        <input
          type="search"
          className="form-input w-56"
          placeholder="🔍 Name, E-Mail, Verein…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="form-input w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Alle Status</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          <option value="checked_in">🎟️ Eingecheckt</option>
        </select>
        <button className="btn-secondary px-3" onClick={reload} title="Aktualisieren">↻</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-shore-50 border-b border-shore-200 text-xs font-bold text-shore-400 uppercase tracking-wide">
                <th className="px-4 py-2.5 text-left">#</th>
                <th className="px-4 py-2.5 text-left">Name / Verein</th>
                <th className="px-4 py-2.5 text-left">Kontakt</th>
                <th className="px-4 py-2.5 text-left">Teams</th>
                <th className="px-4 py-2.5 text-right">Summe</th>
                <th className="px-4 py-2.5 text-left">Status</th>
                <th className="px-4 py-2.5 text-left">Datum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-shore-50">
              {loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-shore-400">Lade…</td></tr>}
              {!loading && !regs?.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-shore-400">Keine Anmeldungen gefunden</td></tr>}
              {regs?.map((r) => (
                <tr key={r.id} className="hover:bg-sand-50 cursor-pointer transition" onClick={() => navigate(`/admin/registrations/${r.id}`)}>
                  <td className="px-4 py-2.5 text-shore-300 font-mono text-xs">{r.id}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-shore-800">{r.vorname} {r.nachname}</div>
                    {r.vereinsname && <div className="text-xs text-shore-400">{r.vereinsname}</div>}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="text-xs text-shore-600">{r.email}</div>
                    <div className="text-xs text-shore-400">{r.telefon}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {r.kotc_maennlich > 0 && <span className="badge bg-shore-100 text-shore-500 border-shore-200">King of the Court ♂ ×{r.kotc_maennlich}</span>}
                      {r.kotc_weiblich  > 0 && <span className="badge bg-shore-100 text-shore-500 border-shore-200">King of the Court ♀ ×{r.kotc_weiblich}</span>}
                      {r.kotc_mixed     > 0 && <span className="badge bg-shore-100 text-shore-500 border-shore-200">King of the Court Mixed ×{r.kotc_mixed}</span>}
                      {r.beach_fun_a    > 0 && <span className="badge bg-sand-100 text-sand-600 border-sand-200">Beach-Fun A ×{r.beach_fun_a}</span>}
                      {r.beach_fun_b    > 0 && <span className="badge bg-sand-100 text-sand-600 border-sand-200">Beach-Fun B ×{r.beach_fun_b}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-shore-700">{fmt(r.gebuehr_gesamt)}</td>
                  <td className="px-4 py-2.5">
                    <Badge status={r.status} />
                    {r.checked_in_at && <span className="ml-1 badge bg-emerald-50 text-emerald-700 border-emerald-200">🎟️ eingecheckt</span>}
                  </td>
                  <td className="px-4 py-2.5 text-shore-400 text-xs whitespace-nowrap">{r.created_at?.slice(0, 16)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Superadmin-only delete — two-step, module-level to avoid focus loss
function DeleteRegistration({ id, onDeleted, apiPrefix = '/api/admin' }) {
  const [step, setStep] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const doDelete = async () => {
    setDeleting(true);
    await authFetch(`${apiPrefix}/registrations/${id}`, { method: 'DELETE' });
    onDeleted();
  };

  if (step === 0) {
    return (
      <div className="card-sm border-red-200">
        <button className="text-red-400 hover:text-red-600 text-sm font-medium transition" onClick={() => setStep(1)}>
          Buchung unwiderruflich löschen
        </button>
      </div>
    );
  }

  return (
    <div className="card border-red-300 bg-red-50">
      <p className="font-bold text-red-700 text-sm mb-1">⚠️ Buchung wirklich löschen?</p>
      <p className="text-red-600 text-xs mb-3 leading-relaxed">
        Die Buchung wird vollständig und unwiderruflich aus der Datenbank entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
      </p>
      <div className="flex gap-2">
        <button className="btn-danger text-sm" onClick={doDelete} disabled={deleting}>
          {deleting ? 'Lösche…' : 'Ja, endgültig löschen'}
        </button>
        <button className="btn-secondary text-sm" onClick={() => setStep(0)}>Abbrechen</button>
      </div>
    </div>
  );
}

// ── Registration Detail ───────────────────────────────────────────────────────
function RegistrationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: reg, loading, reload } = useAdminData(`/api/admin/registrations/${id}`);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [confirmStep, setConfirmStep] = useState(0);
  const [cancelStep, setCancelStep] = useState(0);
  const [paymentStep, setPaymentStep] = useState(0);

  const flash = (text, type = 'ok') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 5000); };

  const setStatus = async (status) => {
    setSaving(true);
    const r = await authFetch(`/api/admin/registrations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    const j = await r.json();
    if (!r.ok) flash(j.error || 'Fehler', 'err');
    else flash(`Status auf „${STATUS[status]?.label}" gesetzt`);
    reload();
    setSaving(false);
  };

  const doPayment = async () => {
    if (paymentStep === 0) { setPaymentStep(1); return; }
    setSaving(true);
    setPaymentStep(0);
    const r = await authFetch(`/api/admin/registrations/${id}/payment`, {
      method: 'POST', body: JSON.stringify({ confirmed: true }),
    });
    const j = await r.json();
    r.ok ? flash('💰 Zahlungseingang bestätigt! QR-Code-Mail wurde gesendet.') : flash(j.error || 'Fehler', 'err');
    reload();
    setSaving(false);
  };

  const doCancel = async () => {
    if (cancelStep === 0) { setCancelStep(1); return; }
    setSaving(true);
    setCancelStep(0);
    const r = await authFetch(`/api/admin/registrations/${id}/cancel`, {
      method: 'POST', body: JSON.stringify({ confirmed: true }),
    });
    const j = await r.json();
    r.ok ? flash('❌ Storniert. Stornierungsmail wurde gesendet.') : flash(j.error || 'Fehler', 'err');
    reload();
    setSaving(false);
  };

  const confirm = async () => {
    if (confirmStep === 0) { setConfirmStep(1); return; }
    setSaving(true);
    setConfirmStep(0);
    const r = await authFetch(`/api/admin/registrations/${id}/confirm`, {
      method: 'POST', body: JSON.stringify({ confirmed: true }),
    });
    const j = await r.json();
    r.ok ? flash('✅ Bestätigt! Zahlungsinfo-E-Mail wurde gesendet.') : flash(j.error || 'Fehler beim Bestätigen', 'err');
    reload();
    setSaving(false);
  };

  if (loading) return <div className="text-shore-400 py-12 text-center">Lade…</div>;
  if (!reg || reg.error) return <div className="text-red-500 py-12 text-center">Nicht gefunden</div>;

  return (
    <div>
      <button className="btn-secondary mb-4 text-sm" onClick={() => navigate(-1)}>← Zurück</button>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-sm font-medium border ${msg.type === 'err' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {msg.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center mb-5">
        <h1 className="text-xl font-bold text-shore-800">Anmeldung #{reg.id}</h1>
        <Badge status={reg.status} />
        {reg.auf_warteliste ? <span className="badge bg-sand-100 text-sand-600 border-sand-200">🏖️ Warteliste</span> : null}
        {reg.booking_code && (
          <span className="ml-auto font-mono text-sm font-bold text-ocean-700 bg-ocean-50 border border-ocean-200 rounded-lg px-3 py-1 tracking-widest select-all">
            {reg.booking_code}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Aktionen */}
        <div className="space-y-3">
          {reg.status === 'confirmed' ? (
            <>
              <div className="card border-emerald-200 bg-emerald-50">
                <p className="font-bold text-emerald-800 text-sm mb-1">✅ Bestätigt & gesperrt</p>
                <p className="text-emerald-600 text-xs mt-1 font-medium">{reg.confirmed_at?.slice(0, 16)}</p>
              </div>

              {/* Zahlungseingang */}
              {reg.payment_received_at ? (
                <div className="card border-ocean-200 bg-ocean-50">
                  <p className="font-bold text-ocean-800 text-sm mb-1">💰 Zahlung eingegangen</p>
                  <p className="text-ocean-600 text-xs font-medium">{reg.payment_received_at?.slice(0, 16)}</p>
                  <p className="text-ocean-600 text-xs mt-1">QR-Code-Mail wurde gesendet.</p>
                </div>
              ) : (
                <div className={`card ${paymentStep === 1 ? 'border-orange-300 bg-orange-50' : 'border-ocean-200 bg-ocean-50'}`}>
                  {paymentStep === 0 ? (
                    <>
                      <p className="font-bold text-ocean-800 mb-1 text-sm">💰 Zahlung bestätigen</p>
                      <p className="text-ocean-600 text-xs mb-3 leading-relaxed">
                        Markiert den Zahlungseingang und sendet den QR-Code für den Check-in per E-Mail.
                      </p>
                      <button className="btn-primary w-full justify-center text-sm" onClick={doPayment} disabled={saving}>
                        Zahlung eingegangen bestätigen
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-orange-800 mb-1 text-sm">⚠️ Zahlung wirklich bestätigen?</p>
                      <p className="text-orange-700 text-xs mb-3 leading-relaxed">
                        Der QR-Code wird <strong>sofort per E-Mail</strong> an den Anmelder gesendet.
                      </p>
                      <div className="flex gap-2">
                        <button className="btn-primary flex-1 justify-center text-sm" onClick={doPayment} disabled={saving}>
                          Ja, bestätigen
                        </button>
                        <button className="btn-secondary text-sm" onClick={() => setPaymentStep(0)}>Abbrechen</button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Check-in Status */}
              {reg.checked_in_at && (
                <div className="card border-emerald-300 bg-emerald-50">
                  <p className="font-bold text-emerald-800 text-sm mb-1">🎟️ Eingecheckt</p>
                  <p className="text-emerald-600 text-xs font-medium">{reg.checked_in_at?.slice(0, 16)}</p>
                </div>
              )}
            </>
          ) : reg.status !== 'cancelled' && (
            <div className={`card ${confirmStep === 1 ? 'border-orange-300 bg-orange-50' : 'border-emerald-200 bg-emerald-50'}`}>
              {confirmStep === 0 ? (
                <>
                  <p className="font-bold text-emerald-800 mb-1 text-sm">Anmeldung bestätigen</p>
                  <p className="text-emerald-600 text-xs mb-3 leading-relaxed">
                    Bestätigt die Anmeldung und sendet Zahlungsinformationen per E-Mail. Danach nicht mehr änderbar.
                  </p>
                  <button className="btn-success w-full justify-center text-sm" onClick={confirm} disabled={saving}>
                    ✅ Bestätigen &amp; E-Mail senden
                  </button>
                </>
              ) : (
                <>
                  <p className="font-bold text-orange-800 mb-1 text-sm">⚠️ Sicher bestätigen?</p>
                  <p className="text-orange-700 text-xs mb-3 leading-relaxed">
                    Die Zahlungsinfo-E-Mail wird <strong>sofort gesendet</strong>. Der Status wird auf <em>Bestätigt</em> gesetzt und kann danach <strong>nicht mehr geändert</strong> werden.
                  </p>
                  <div className="flex gap-2">
                    <button className="btn-success flex-1 justify-center text-sm" onClick={confirm} disabled={saving}>
                      Ja, jetzt bestätigen
                    </button>
                    <button className="btn-secondary text-sm" onClick={() => setConfirmStep(0)}>Abbrechen</button>
                  </div>
                </>
              )}
            </div>
          )}
          <div className="card">
            <p className="section-title">Status ändern</p>
            {reg.status === 'confirmed' || reg.status === 'cancelled' ? (
              <p className="text-xs text-shore-400">
                Gesperrt — Anmeldung ist {reg.status === 'confirmed' ? 'bestätigt' : 'storniert'}.
              </p>
            ) : (
              <div className="space-y-1.5">
                {Object.entries(STATUS).filter(([s]) => s !== 'confirmed' && s !== 'cancelled').map(([s, { label, icon, cls }]) => (
                  <button key={s}
                    className={`w-full px-3 py-2 rounded-lg border text-sm font-semibold transition text-left ${cls} ${reg.status === s ? 'ring-2 ring-offset-1 ring-ocean-400' : 'hover:opacity-75'}`}
                    onClick={() => setStatus(s)} disabled={saving || reg.status === s}>
                    {icon} {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {reg.status !== 'confirmed' && reg.status !== 'cancelled' && (
            <div className={`card ${cancelStep === 1 ? 'border-red-300 bg-red-50' : 'border-shore-200'}`}>
              {cancelStep === 0 ? (
                <>
                  <p className="section-title">Stornierung</p>
                  <button className="w-full px-3 py-2 rounded-lg border text-sm font-semibold transition text-left bg-red-50 text-red-600 border-red-200 hover:opacity-75"
                    onClick={doCancel} disabled={saving}>
                    ❌ Anmeldung stornieren
                  </button>
                </>
              ) : (
                <>
                  <p className="font-bold text-red-700 text-sm mb-1">⚠️ Sicher stornieren?</p>
                  <p className="text-red-600 text-xs mb-3 leading-relaxed">
                    Eine Stornierungsmail wird <strong>sofort gesendet</strong>. Der Status kann danach <strong>nicht mehr geändert</strong> werden.
                  </p>
                  <div className="flex gap-2">
                    <button className="btn-danger flex-1 justify-center text-sm" onClick={doCancel} disabled={saving}>
                      Ja, jetzt stornieren
                    </button>
                    <button className="btn-secondary text-sm" onClick={() => setCancelStep(0)}>Abbrechen</button>
                  </div>
                </>
              )}
            </div>
          )}

          {reg.status === 'cancelled' && (
            <div className="card border-red-200 bg-red-50">
              <p className="font-bold text-red-700 text-sm mb-1">❌ Storniert & gesperrt</p>
              <p className="text-red-600 text-xs leading-relaxed">
                Diese Anmeldung wurde storniert. Der Status kann nicht mehr geändert werden.
              </p>
            </div>
          )}
          <div className="card-sm text-xs text-shore-400 space-y-1">
            <p>Eingegangen: <span className="text-shore-600 font-medium">{reg.created_at?.slice(0, 16)}</span></p>
            {reg.confirmed_at && <p>Bestätigt: <span className="text-shore-600 font-medium">{reg.confirmed_at?.slice(0, 16)}</span></p>}
          </div>
          {getUser().role === 'superadmin' && (
            <DeleteRegistration id={id} onDeleted={() => navigate('/admin/registrations')} />
          )}
        </div>

        {/* Daten — uses module-level DetailField / DetailSection */}
        <div className="xl:col-span-2 card">
          <DetailSection title="📝 Kontaktdaten">
            <DetailField label="Buchungscode" value={reg.booking_code} />
            <DetailField label="Vereinsname"  value={reg.vereinsname} />
            <DetailField label="Name"         value={`${reg.vorname} ${reg.nachname}`} />
            <DetailField label="Adresse"      value={`${reg.strasse}, ${reg.plz} ${reg.ort}`} />
            <DetailField label="E-Mail"       value={reg.email} />
            <DetailField label="Telefon"      value={reg.telefon} />
            <DetailField label="Kunden-Nr."   value={reg.kunden_nr} />
          </DetailSection>
          <DetailSection title="🏐 Teams">
            <DetailField label="King of the Court männlich" value={reg.kotc_maennlich || null} />
            <DetailField label="King of the Court weiblich" value={reg.kotc_weiblich || null} />
            <DetailField label="King of the Court mixed"    value={reg.kotc_mixed || null} />
            <DetailField label="Beach-Fun A"                value={reg.beach_fun_a || null} />
            <DetailField label="Beach-Fun B"                value={reg.beach_fun_b || null} />
            <DetailField label="Teamnamen KotC männlich"    value={reg.names_kotc_maennlich} />
            <DetailField label="Teamnamen KotC weiblich"    value={reg.names_kotc_weiblich} />
            <DetailField label="Teamnamen KotC mixed"       value={reg.names_kotc_mixed} />
            <DetailField label="Teamnamen Beach-Fun A"      value={reg.names_beach_fun_a} />
            <DetailField label="Teamnamen Beach-Fun B"      value={reg.names_beach_fun_b} />
          </DetailSection>
          <DetailSection title="👥 Teilnehmer &amp; Verpflegung">
            <DetailField label="Begleitpersonen (20 €)"     value={reg.begleitpersonen || null} />
            <DetailField label="Kinder/Jugendliche (13 €)"  value={reg.kinder_jugendliche || null} />
            <DetailField label="PKW-Stellplätze (15 €)"     value={reg.pkw_stellplaetze || null} />
            <DetailField label="Frühstück Samstag"          value={reg.fruehstueck_samstag || null} />
            <DetailField label="Frühstück Sonntag"          value={reg.fruehstueck_sonntag || null} />
          </DetailSection>
          <DetailSection title="🚗 Anreise &amp; Unterkunft">
            <DetailField label="Ankunftstag"    value={reg.ankunftstag} />
            <DetailField label="Bahn/Bus"       value={reg.transport_bahn_bus === 'Ja' ? 'Ja' : null} />
            <DetailField label="PKW"            value={reg.transport_pkw || null} />
            <DetailField label="Motorrad"       value={reg.transport_motorrad || null} />
            <DetailField label="Wohnmobil"      value={reg.transport_wohnmobil || null} />
            <DetailField label="Zelte"          value={reg.zelte_turnier || null} />
            <DetailField label="Fremdes Camping" value={reg.fremder_camping || null} />
            <DetailField label="Ferienwohnung"  value={reg.ferienwohnung || null} />
            <DetailField label="Hotel/JH"       value={reg.hotel || null} />
            <DetailField label="Teilnehmer"     value={reg.teilnehmer_anzahl || null} />
            <DetailField label="Zuschauer"      value={reg.zuschauer_anzahl || null} />
          </DetailSection>
          <DetailSection title="💰 Gebühren">
            <DetailField label="Mannschaftsgebühren" value={fmt(reg.gebuehr_mannschaft)} />
            <DetailField label="Teilnehmergebühren"  value={fmt(reg.gebuehr_teilnehmer)} />
            <DetailField label="PKW-Gebühren"        value={fmt(reg.gebuehr_pkw)} />
            <DetailField label="Frühstücksgebühren"  value={fmt(reg.gebuehr_fruehstueck)} />
            <div className="flex gap-3 py-2 mt-1 bg-ocean-50 rounded-xl px-3 border border-ocean-100">
              <dt className="w-48 shrink-0 text-sm font-bold text-ocean-700">Gesamtsumme</dt>
              <dd className="text-base font-bold text-ocean-700">{fmt(reg.gebuehr_gesamt)}</dd>
            </div>
          </DetailSection>
          <DetailSection title="✅ Abschluss">
            <DetailField label="Unterschrift / Datum" value={reg.ort_datum_name} />
            <DetailField label="Datenschutz" value={reg.datenschutz_consent ? 'Zugestimmt' : null} />
          </DetailSection>
          <DetailSection title="🎟️ Check-in Status">
            <DetailField label="Zahlung bestätigt" value={reg.payment_received_at?.slice(0, 16) || null} />
            <DetailField label="Eingecheckt" value={reg.checked_in_at?.slice(0, 16) || null} />
          </DetailSection>
        </div>
      </div>
    </div>
  );
}

// ── Waitlist Settings ─────────────────────────────────────────────────────────
function WaitlistSettings() {
  const { data, loading, reload } = useAdminData('/api/admin/settings');
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      const s = Object.fromEntries(
        Object.entries(data).filter(([k]) => k.endsWith('_waitlist')).map(([k, v]) => [k, v === '1'])
      );
      s.registration_open = data.registration_open !== '0';
      setSettings(s);
    }
  }, [data]);

  const save = async () => {
    const payload = { ...settings };
    payload.registration_open = settings.registration_open ? '1' : '0';
    await authFetch('/api/admin/settings', { method: 'PATCH', body: JSON.stringify(payload) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    reload();
  };

  const CATS = {
    kotc_maennlich_waitlist: { label: 'King of the Court männlich', icon: '🏐' },
    kotc_weiblich_waitlist:  { label: 'King of the Court weiblich', icon: '🏐' },
    kotc_mixed_waitlist:     { label: 'King of the Court mixed',    icon: '🏐' },
    beach_fun_a_waitlist:    { label: 'Beach-Fun A',                icon: '🏖️' },
    beach_fun_b_waitlist:    { label: 'Beach-Fun B',                icon: '🏖️' },
  };

  if (loading || !settings) return <div className="text-shore-400 py-10 text-center">Lade…</div>;

  const regOpen = settings.registration_open;

  return (
    <div className="max-w-lg">
      <PageHeader title="Anmeldung & Warteliste" icon="⏳" />

      <div className="card mb-4">
        <p className="text-xs font-bold text-shore-400 uppercase tracking-widest mb-3">🔒 Anmeldestatus (Mahrenholz)</p>
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer select-none
            ${regOpen ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'}`}
          onClick={() => setSettings((s) => ({ ...s, registration_open: !s.registration_open }))}
        >
          <div className="flex items-center gap-3">
            <span>{regOpen ? '✅' : '🔒'}</span>
            <div>
              <p className="text-sm font-semibold text-shore-700">Anmeldung {regOpen ? 'geöffnet' : 'geschlossen'}</p>
              <p className="text-xs text-shore-400 mt-0.5">{regOpen ? 'Neue Anmeldungen werden angenommen' : 'Keine neuen Anmeldungen möglich'}</p>
            </div>
          </div>
          <div className={`toggle ${regOpen ? 'bg-emerald-500' : 'bg-red-400'}`}>
            <div className={`toggle-thumb ${regOpen ? 'left-6' : 'left-1'}`} />
          </div>
        </div>
      </div>

      <div className="card">
        <p className="text-xs font-bold text-shore-400 uppercase tracking-widest mb-3">⏳ Warteliste nach Kategorie</p>
        <p className="text-sm text-shore-500 mb-4">
          Kategorien auf Warteliste — neue Anmeldungen werden automatisch als <em>Warteliste</em> markiert.
        </p>
        <div className="space-y-2">
          {Object.entries(CATS).map(([key, { label, icon }]) => {
            const active = settings[key] || false;
            return (
              <div key={key}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer select-none
                  ${active ? 'border-sand-300 bg-sand-50' : 'border-shore-200 hover:bg-shore-50'}`}
                onClick={() => setSettings((s) => ({ ...s, [key]: !s[key] }))}>
                <div className="flex items-center gap-3">
                  <span>{icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-shore-700">{label}</p>
                    {active && <p className="text-xs text-sand-600 mt-0.5">⏳ Warteliste aktiv</p>}
                  </div>
                </div>
                <div className={`toggle ${active ? 'bg-sand-400' : 'bg-shore-300'}`}>
                  <div className={`toggle-thumb ${active ? 'left-6' : 'left-1'}`} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-shore-100">
          <button className="btn-primary" onClick={save}>
            {saved ? '✓ Gespeichert' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SMTP Settings ─────────────────────────────────────────────────────────────
function SmtpSettings() {
  const { data, loading } = useAdminData('/api/superadmin/smtp');
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => { if (data) setForm({ ...data, smtp_pass: '' }); }, [data]);

  const handleChange = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const save = async () => {
    await authFetch('/api/superadmin/smtp', { method: 'PATCH', body: JSON.stringify(form) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const testMail = async () => {
    setTesting(true);
    setTestResult(null);
    const r = await authFetch('/api/superadmin/smtp/test', { method: 'POST' });
    const j = await r.json();
    setTestResult(r.ok ? { ok: true, msg: j.message } : { ok: false, msg: j.error });
    setTesting(false);
  };

  if (loading || !form) return <div className="text-shore-400 py-10 text-center">Lade…</div>;

  return (
    <div className="max-w-xl">
      <PageHeader title="E-Mail / SMTP" icon="✉️" />

      <div className="card space-y-4">
        <p className="text-xs font-bold text-shore-400 uppercase tracking-widest">SMTP-Zugangsdaten</p>
        <p className="text-sm text-shore-500 -mt-2">
          Überschreibt die <code className="bg-shore-100 px-1 rounded text-xs">.env</code>-Werte.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <SmtpField label="SMTP-Server" name="smtp_host" placeholder="smtp.gmail.com"
            value={form.smtp_host || ''} onChange={handleChange('smtp_host')} />
          <SmtpField label="Port" name="smtp_port" placeholder="587"
            value={form.smtp_port || ''} onChange={handleChange('smtp_port')} />
        </div>

        <div className="flex items-center gap-3 p-3 bg-shore-50 rounded-xl border border-shore-200 cursor-pointer select-none"
          onClick={() => setForm((f) => ({ ...f, smtp_secure: f.smtp_secure === 'true' ? 'false' : 'true' }))}>
          <div className={`toggle ${form.smtp_secure === 'true' ? 'bg-ocean-500' : 'bg-shore-300'}`}>
            <div className={`toggle-thumb ${form.smtp_secure === 'true' ? 'left-6' : 'left-1'}`} />
          </div>
          <span className="text-sm font-medium text-shore-700">SSL/TLS aktivieren (Port 465)</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SmtpField label="SMTP-Benutzername" name="smtp_user" placeholder="info@cux-beach.de"
            value={form.smtp_user || ''} onChange={handleChange('smtp_user')} />
          <div>
            <label className="form-label">
              SMTP-Passwort
              {data?.smtp_pass_set && <span className="ml-2 text-xs text-emerald-600 font-normal">✓ gesetzt</span>}
            </label>
            <input type="password" className="form-input"
              placeholder={data?.smtp_pass_set ? '(unverändert lassen)' : 'App-Passwort'}
              value={form.smtp_pass || ''} onChange={handleChange('smtp_pass')} />
          </div>
        </div>

        <SmtpField label="Absender (From)" name="smtp_from"
          placeholder="BCC Cuxhaven <info@cux-beach.de>"
          value={form.smtp_from || ''} onChange={handleChange('smtp_from')} />
        <SmtpField label="Admin-Benachrichtigungs-E-Mail" name="admin_email"
          placeholder="ruediger.sauer@cux-beach.de"
          value={form.admin_email || ''} onChange={handleChange('admin_email')} />

        {testResult && (
          <div className={`p-3 rounded-xl text-sm border ${testResult.ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
            {testResult.ok ? '✅' : '⚠️'} {testResult.msg}
          </div>
        )}

        <div className="flex gap-3 pt-2 border-t border-shore-100">
          <button className="btn-primary" onClick={save}>{saved ? '✓ Gespeichert' : 'Speichern'}</button>
          <button className="btn-secondary" onClick={testMail} disabled={testing}>
            {testing ? 'Sende…' : '📧 Test-Mail'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Payment Settings ──────────────────────────────────────────────────────────
function PaymentSettings() {
  const { data, loading } = useAdminData('/api/superadmin/smtp');
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (data) setForm({ ...data }); }, [data]);

  const handleChange = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const save = async () => {
    await authFetch('/api/superadmin/smtp', { method: 'PATCH', body: JSON.stringify(form) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading || !form) return <div className="text-shore-400 py-10 text-center">Lade…</div>;

  return (
    <div className="max-w-xl">
      <PageHeader title="Zahlungseinstellungen" icon="💶" />

      <div className="card space-y-4">
        <p className="text-sm text-shore-500">
          Diese Daten erscheinen in der Zahlungsbestätigungs-E-Mail für beide Turniere. Der Verwendungszweck wird automatisch auf den Buchungscode der Anmeldung gesetzt.
        </p>

        <SmtpField label="Kontoinhaber / Empfänger" name="payment_empfaenger"
          placeholder="Beachsportclub Cuxhaven e.V."
          value={form.payment_empfaenger || ''} onChange={handleChange('payment_empfaenger')} />

        <div className="grid grid-cols-2 gap-3">
          <SmtpField label="IBAN" name="payment_iban"
            placeholder="DE00 0000 0000 0000 0000 00"
            value={form.payment_iban || ''} onChange={handleChange('payment_iban')} />
          <SmtpField label="BIC" name="payment_bic"
            placeholder="XXXXXXXX"
            value={form.payment_bic || ''} onChange={handleChange('payment_bic')} />
        </div>

        <SmtpField label="Bank (optional)" name="payment_bank"
          placeholder="Sparkasse Cuxhaven"
          value={form.payment_bank || ''} onChange={handleChange('payment_bank')} />

        <SmtpField label="Zahlungsfrist" name="payment_frist"
          placeholder="4 Wochen vor Turnierbeginn"
          value={form.payment_frist || ''} onChange={handleChange('payment_frist')} />

        <div>
          <label className="form-label">Storno-Hinweis (optional)</label>
          <textarea className="form-input" rows={2}
            placeholder="Bei Abmeldung nach dem 15.06.2026 wird die Startgebühr nicht erstattet."
            value={form.payment_storno_hinweis || ''}
            onChange={handleChange('payment_storno_hinweis')} />
        </div>

        <div className="pt-2 border-t border-shore-100">
          <button className="btn-primary" onClick={save}>{saved ? '✓ Gespeichert' : 'Speichern'}</button>
        </div>
      </div>
    </div>
  );
}

// Password change row — module-level to avoid focus loss
function PasswordRow({ userId, onDone }) {
  const [pw, setPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const save = async () => {
    if (pw.length < 8) { setMsg({ ok: false, text: 'Mindestens 8 Zeichen' }); return; }
    setSaving(true);
    const r = await authFetch(`/api/superadmin/users/${userId}`, { method: 'PATCH', body: JSON.stringify({ password: pw }) });
    if (r.ok) { setMsg({ ok: true, text: 'Gespeichert' }); setPw(''); setTimeout(onDone, 1200); }
    else { setMsg({ ok: false, text: 'Fehler' }); }
    setSaving(false);
  };

  return (
    <tr className="bg-shore-50">
      <td colSpan={4} className="px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="password"
            className="form-input w-56"
            placeholder="Neues Passwort (min. 8 Zeichen)"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setMsg(null); }}
            autoFocus
          />
          <button className="btn-primary text-xs py-2" onClick={save} disabled={saving}>
            {saving ? 'Speichern…' : '✓ Setzen'}
          </button>
          <button className="btn-secondary text-xs py-2" onClick={onDone}>Abbrechen</button>
          {msg && <span className={`text-xs font-medium ${msg.ok ? 'text-emerald-600' : 'text-red-500'}`}>{msg.text}</span>}
        </div>
      </td>
    </tr>
  );
}

// ── User Management ───────────────────────────────────────────────────────────
function UserManagement() {
  const { data: users, loading, reload } = useAdminData('/api/superadmin/users');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', role: 'admin', name: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [changingPwFor, setChangingPwFor] = useState(null);
  const currentUser = getUser();

  const handleChange = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const createUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    const r = await authFetch('/api/superadmin/users', { method: 'POST', body: JSON.stringify(form) });
    const j = await r.json();
    if (!r.ok) { setErr(j.error); setSaving(false); return; }
    setShowForm(false);
    setForm({ email: '', password: '', role: 'admin', name: '' });
    reload();
    setSaving(false);
  };

  const deleteUser = async (id, email) => {
    if (!window.confirm(`Benutzer „${email}" wirklich löschen?`)) return;
    await authFetch(`/api/superadmin/users/${id}`, { method: 'DELETE' });
    reload();
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Benutzerverwaltung" icon="👤">
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? '✕ Abbrechen' : '+ Benutzer'}
        </button>
      </PageHeader>

      {showForm && (
        <div className="card mb-4 border-ocean-200 bg-ocean-50">
          <p className="font-bold text-ocean-800 mb-4 text-sm">Neuen Benutzer anlegen</p>
          <form onSubmit={createUser} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <UserField label="Name" name="name" placeholder="Max Mustermann"
                value={form.name} onChange={handleChange('name')} />
              <div>
                <label className="form-label">Rolle</label>
                <select className="form-input" value={form.role} onChange={handleChange('role')}>
                  <option value="admin">🔑 Admin</option>
                  <option value="superadmin">⭐ Superadmin</option>
                </select>
              </div>
            </div>
            <UserField label="E-Mail" name="email" type="email" required placeholder="admin@example.de"
              value={form.email} onChange={handleChange('email')} />
            <UserField label="Passwort" name="password" type="password" required placeholder="Mindestens 8 Zeichen"
              value={form.password} onChange={handleChange('password')} />
            {err && <p className="text-red-500 text-sm">⚠️ {err}</p>}
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Anlegen…' : 'Anlegen'}</button>
          </form>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-shore-50 border-b border-shore-200 text-xs font-bold text-shore-400 uppercase tracking-wide">
              <th className="px-4 py-2.5 text-left">Name / E-Mail</th>
              <th className="px-4 py-2.5 text-left">Rolle</th>
              <th className="px-4 py-2.5 text-left">Erstellt</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-shore-100">
            {loading && <tr><td colSpan={4} className="px-4 py-8 text-center text-shore-400">Lade…</td></tr>}
            {users?.map((u) => (
              <>
              <tr key={u.id} className="hover:bg-shore-50 transition">
                <td className="px-4 py-3">
                  <div className="font-semibold text-shore-700">{u.name || '—'}</div>
                  <div className="text-shore-400 text-xs">{u.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.role === 'superadmin' ? 'bg-sand-100 text-sand-600 border-sand-300' : 'bg-ocean-50 text-ocean-600 border-ocean-200'}`}>
                    {u.role === 'superadmin' ? '⭐ Superadmin' : '🔑 Admin'}
                  </span>
                </td>
                <td className="px-4 py-3 text-shore-400 text-xs">{u.created_at?.slice(0, 10)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      className="text-ocean-500 hover:text-ocean-700 text-xs font-medium transition"
                      onClick={() => setChangingPwFor(changingPwFor === u.id ? null : u.id)}
                    >
                      🔑 Passwort
                    </button>
                  {u.id !== currentUser.id
                    ? <button className="text-red-400 hover:text-red-600 text-xs font-medium" onClick={() => deleteUser(u.id, u.email)}>Löschen</button>
                    : <span className="text-xs text-shore-300">Sie</span>}
                  </div>
                </td>
              </tr>
              {changingPwFor === u.id && (
                <PasswordRow key={`pw-${u.id}`} userId={u.id} onDone={() => setChangingPwFor(null)} />
              )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Heße Immobilien Cup — Admin-Komponenten
// ══════════════════════════════════════════════════════════════════════════════

function HesseDashboard() {
  const navigate = useNavigate();
  const { data: stats } = useAdminData('/api/hesse/admin/stats');

  const csvExport = async () => {
    const r = await authFetch('/api/hesse/admin/export/csv');
    if (!r.ok) return alert('Export fehlgeschlagen');
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hesse-anmeldungen-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Heße Cup – Dashboard" icon="📊">
        <button className="btn-secondary text-sm" onClick={csvExport}>↓ CSV exportieren</button>
      </PageHeader>

      <div className="grid grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Gesamt',      value: stats?.total,      icon: '📋', color: 'text-shore-700' },
          { label: 'Ausstehend',  value: stats?.pending,    icon: '⏳', color: 'text-amber-600',   action: () => navigate('/admin/hesse/registrations?status=pending') },
          { label: 'Bestätigt',   value: stats?.confirmed,  icon: '✅', color: 'text-emerald-600', action: () => navigate('/admin/hesse/registrations?status=confirmed') },
          { label: 'Eingecheckt', value: stats?.checked_in, icon: '🎟️', color: 'text-ocean-600',   action: () => navigate('/admin/hesse/registrations?checked_in=true') },
          { label: 'Storniert',   value: stats?.cancelled,  icon: '❌', color: 'text-red-400',     action: () => navigate('/admin/hesse/registrations?status=cancelled') },
        ].map((c) => (
          <div key={c.label} onClick={c.action}
            className={`stat-card ${c.action ? 'cursor-pointer hover:shadow-md transition hover:border-ocean-200' : ''}`}>
            <span className="text-lg">{c.icon}</span>
            <div className={`text-2xl font-bold ${c.color}`}>{c.value ?? '—'}</div>
            <div className="text-xs text-shore-400 font-medium">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <p className="text-xs font-bold text-shore-400 uppercase tracking-widest mb-3">🏐 Firmencup Übersicht</p>
        <div className="grid grid-cols-1 gap-3 text-center max-w-xs">
          <div className="bg-shore-50 rounded-xl p-3 border border-shore-100">
            <div className="text-2xl font-bold text-ocean-600">{stats?.mannschaften ?? 0}</div>
            <div className="text-xs text-shore-500 mt-1 leading-tight">Mannschaften</div>
            <div className="text-xs text-shore-400 mt-0.5">4er-Mixed</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HesseList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get('checked_in') === 'true') setStatusFilter('checked_in');
    else setStatusFilter(p.get('status') || '');
  }, [location.search]);
  const url = `/api/hesse/admin/registrations?${new URLSearchParams({
    ...(statusFilter === 'checked_in' ? { checked_in: 'true' } : statusFilter ? { status: statusFilter } : {}),
    ...(search && { search }),
  })}`;
  const { data: regs, loading, reload } = useAdminData(url, [search, statusFilter]);

  return (
    <div>
      <PageHeader title="Heße Cup – Anmeldungen" icon="📋">
        <button
          className="btn-secondary text-sm"
          onClick={async () => {
            const r = await authFetch('/api/hesse/admin/export/csv');
            if (!r.ok) return alert('Export fehlgeschlagen');
            const blob = await r.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `hesse-anmeldungen-${new Date().toISOString().slice(0,10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          ↓ CSV exportieren
        </button>
      </PageHeader>

      <div className="card mb-3 p-3 flex flex-wrap gap-2">
        <input
          type="search"
          className="form-input w-56"
          placeholder="🔍 Name, Firma, E-Mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="form-input w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Alle Status</option>
          {Object.entries(STATUS).filter(([k]) => k !== 'waitlist').map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          <option value="checked_in">🎟️ Eingecheckt</option>
        </select>
        <button className="btn-secondary px-3" onClick={reload} title="Aktualisieren">↻</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-shore-50 border-b border-shore-200 text-xs font-bold text-shore-400 uppercase tracking-wide">
                <th className="px-4 py-2.5 text-left">#</th>
                <th className="px-4 py-2.5 text-left">Firma / Ansprechpartner</th>
                <th className="px-4 py-2.5 text-left">Kontakt</th>
                <th className="px-4 py-2.5 text-left">Teams</th>
                <th className="px-4 py-2.5 text-right">Summe</th>
                <th className="px-4 py-2.5 text-left">Status</th>
                <th className="px-4 py-2.5 text-left">Datum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-shore-50">
              {loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-shore-400">Lade…</td></tr>}
              {!loading && !regs?.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-shore-400">Keine Anmeldungen gefunden</td></tr>}
              {regs?.map((r) => (
                <tr key={r.id} className="hover:bg-sand-50 cursor-pointer transition" onClick={() => navigate(`/admin/hesse/registrations/${r.id}`)}>
                  <td className="px-4 py-2.5 text-shore-300 font-mono text-xs">{r.id}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-shore-800">{r.firma}</div>
                    <div className="text-xs text-shore-400">{r.vorname} {r.nachname}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="text-xs text-shore-600">{r.email}</div>
                    <div className="text-xs text-shore-400">{r.telefon}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="badge bg-shore-100 text-shore-500 border-shore-200">🏐 {r.mannschaften}× 4er-Mixed</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-shore-700">{fmt(r.gebuehr_gesamt)}</td>
                  <td className="px-4 py-2.5">
                    <Badge status={r.status} />
                    {r.checked_in_at && <span className="ml-1 badge bg-emerald-50 text-emerald-700 border-emerald-200">🎟️ eingecheckt</span>}
                  </td>
                  <td className="px-4 py-2.5 text-shore-400 text-xs whitespace-nowrap">{r.created_at?.slice(0, 16)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function HesseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: reg, loading, reload } = useAdminData(`/api/hesse/admin/registrations/${id}`);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState(null);
  const [confirmStep, setConfirmStep] = useState(0);
  const [cancelStep, setCancelStep]   = useState(0);
  const [paymentStep, setPaymentStep] = useState(0);

  const flash = (text, type = 'ok') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 5000); };

  const doPayment = async () => {
    if (paymentStep === 0) { setPaymentStep(1); return; }
    setSaving(true); setPaymentStep(0);
    const r = await authFetch(`/api/hesse/admin/registrations/${id}/payment`, { method: 'POST', body: JSON.stringify({ confirmed: true }) });
    const j = await r.json();
    r.ok ? flash('💰 Zahlungseingang bestätigt! QR-Code-Mail wurde gesendet.') : flash(j.error || 'Fehler', 'err');
    reload(); setSaving(false);
  };

  const doCancel = async () => {
    if (cancelStep === 0) { setCancelStep(1); return; }
    setSaving(true); setCancelStep(0);
    const r = await authFetch(`/api/hesse/admin/registrations/${id}/cancel`, { method: 'POST', body: JSON.stringify({ confirmed: true }) });
    const j = await r.json();
    r.ok ? flash('❌ Storniert. Stornierungsmail wurde gesendet.') : flash(j.error || 'Fehler', 'err');
    reload(); setSaving(false);
  };

  const doConfirm = async () => {
    if (confirmStep === 0) { setConfirmStep(1); return; }
    setSaving(true); setConfirmStep(0);
    const r = await authFetch(`/api/hesse/admin/registrations/${id}/confirm`, { method: 'POST', body: JSON.stringify({ confirmed: true }) });
    const j = await r.json();
    r.ok ? flash('✅ Bestätigt! Zahlungsinfo-E-Mail wurde gesendet.') : flash(j.error || 'Fehler beim Bestätigen', 'err');
    reload(); setSaving(false);
  };

  if (loading) return <div className="text-shore-400 py-12 text-center">Lade…</div>;
  if (!reg || reg.error) return <div className="text-red-500 py-12 text-center">Nicht gefunden</div>;

  return (
    <div>
      <button className="btn-secondary mb-4 text-sm" onClick={() => navigate(-1)}>← Zurück</button>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-sm font-medium border ${msg.type === 'err' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {msg.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center mb-5">
        <h1 className="text-xl font-bold text-shore-800">Heße Cup – Anmeldung #{reg.id}</h1>
        <Badge status={reg.status} />
        {reg.booking_code && (
          <span className="ml-auto font-mono text-sm font-bold text-ocean-700 bg-ocean-50 border border-ocean-200 rounded-lg px-3 py-1 tracking-widest select-all">
            {reg.booking_code}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Aktionen */}
        <div className="space-y-3">
          {reg.status === 'confirmed' ? (
            <>
              <div className="card border-emerald-200 bg-emerald-50">
                <p className="font-bold text-emerald-800 text-sm mb-1">✅ Bestätigt & gesperrt</p>
                <p className="text-emerald-600 text-xs mt-1 font-medium">{reg.confirmed_at?.slice(0, 16)}</p>
              </div>

              {reg.payment_received_at ? (
                <div className="card border-ocean-200 bg-ocean-50">
                  <p className="font-bold text-ocean-800 text-sm mb-1">💰 Zahlung eingegangen</p>
                  <p className="text-ocean-600 text-xs font-medium">{reg.payment_received_at?.slice(0, 16)}</p>
                  <p className="text-ocean-600 text-xs mt-1">QR-Code-Mail wurde gesendet.</p>
                </div>
              ) : (
                <div className={`card ${paymentStep === 1 ? 'border-orange-300 bg-orange-50' : 'border-ocean-200 bg-ocean-50'}`}>
                  {paymentStep === 0 ? (
                    <>
                      <p className="font-bold text-ocean-800 mb-1 text-sm">💰 Zahlung bestätigen</p>
                      <p className="text-ocean-600 text-xs mb-3 leading-relaxed">
                        Markiert den Zahlungseingang und sendet den QR-Code für den Check-in per E-Mail.
                      </p>
                      <button className="btn-primary w-full justify-center text-sm" onClick={doPayment} disabled={saving}>
                        Zahlung eingegangen bestätigen
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-orange-800 mb-1 text-sm">⚠️ Zahlung wirklich bestätigen?</p>
                      <p className="text-orange-700 text-xs mb-3 leading-relaxed">
                        Der QR-Code wird <strong>sofort per E-Mail</strong> an den Anmelder gesendet.
                      </p>
                      <div className="flex gap-2">
                        <button className="btn-primary flex-1 justify-center text-sm" onClick={doPayment} disabled={saving}>Ja, bestätigen</button>
                        <button className="btn-secondary text-sm" onClick={() => setPaymentStep(0)}>Abbrechen</button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {reg.checked_in_at && (
                <div className="card border-emerald-300 bg-emerald-50">
                  <p className="font-bold text-emerald-800 text-sm mb-1">🎟️ Eingecheckt</p>
                  <p className="text-emerald-600 text-xs font-medium">{reg.checked_in_at?.slice(0, 16)}</p>
                </div>
              )}
            </>
          ) : reg.status !== 'cancelled' && (
            <div className={`card ${confirmStep === 1 ? 'border-orange-300 bg-orange-50' : 'border-emerald-200 bg-emerald-50'}`}>
              {confirmStep === 0 ? (
                <>
                  <p className="font-bold text-emerald-800 mb-1 text-sm">Anmeldung bestätigen</p>
                  <p className="text-emerald-600 text-xs mb-3 leading-relaxed">
                    Bestätigt die Anmeldung und sendet Zahlungsinformationen per E-Mail. Danach nicht mehr änderbar.
                  </p>
                  <button className="btn-success w-full justify-center text-sm" onClick={doConfirm} disabled={saving}>
                    ✅ Bestätigen &amp; E-Mail senden
                  </button>
                </>
              ) : (
                <>
                  <p className="font-bold text-orange-800 mb-1 text-sm">⚠️ Sicher bestätigen?</p>
                  <p className="text-orange-700 text-xs mb-3 leading-relaxed">
                    Die Zahlungsinfo-E-Mail wird <strong>sofort gesendet</strong>. Der Status wird auf <em>Bestätigt</em> gesetzt und kann danach <strong>nicht mehr geändert</strong> werden.
                  </p>
                  <div className="flex gap-2">
                    <button className="btn-success flex-1 justify-center text-sm" onClick={doConfirm} disabled={saving}>Ja, jetzt bestätigen</button>
                    <button className="btn-secondary text-sm" onClick={() => setConfirmStep(0)}>Abbrechen</button>
                  </div>
                </>
              )}
            </div>
          )}

          {reg.status !== 'confirmed' && reg.status !== 'cancelled' && (
            <div className={`card ${cancelStep === 1 ? 'border-red-300 bg-red-50' : 'border-shore-200'}`}>
              {cancelStep === 0 ? (
                <>
                  <p className="section-title">Stornierung</p>
                  <button className="w-full px-3 py-2 rounded-lg border text-sm font-semibold transition text-left bg-red-50 text-red-600 border-red-200 hover:opacity-75"
                    onClick={doCancel} disabled={saving}>
                    ❌ Anmeldung stornieren
                  </button>
                </>
              ) : (
                <>
                  <p className="font-bold text-red-700 text-sm mb-1">⚠️ Sicher stornieren?</p>
                  <p className="text-red-600 text-xs mb-3 leading-relaxed">
                    Eine Stornierungsmail wird <strong>sofort gesendet</strong>. Der Status kann danach <strong>nicht mehr geändert</strong> werden.
                  </p>
                  <div className="flex gap-2">
                    <button className="btn-danger flex-1 justify-center text-sm" onClick={doCancel} disabled={saving}>Ja, jetzt stornieren</button>
                    <button className="btn-secondary text-sm" onClick={() => setCancelStep(0)}>Abbrechen</button>
                  </div>
                </>
              )}
            </div>
          )}

          {reg.status === 'cancelled' && (
            <div className="card border-red-200 bg-red-50">
              <p className="font-bold text-red-700 text-sm mb-1">❌ Storniert & gesperrt</p>
              <p className="text-red-600 text-xs leading-relaxed">
                Diese Anmeldung wurde storniert. Der Status kann nicht mehr geändert werden.
              </p>
            </div>
          )}

          <div className="card-sm text-xs text-shore-400 space-y-1">
            <p>Eingegangen: <span className="text-shore-600 font-medium">{reg.created_at?.slice(0, 16)}</span></p>
            {reg.confirmed_at && <p>Bestätigt: <span className="text-shore-600 font-medium">{reg.confirmed_at?.slice(0, 16)}</span></p>}
          </div>

          {getUser().role === 'superadmin' && (
            <DeleteRegistration id={id} apiPrefix="/api/hesse/admin" onDeleted={() => navigate('/admin/hesse/registrations')} />
          )}
        </div>

        {/* Daten */}
        <div className="xl:col-span-2 card">
          <DetailSection title="🏢 Firma & Kontakt">
            <DetailField label="Buchungscode" value={reg.booking_code} />
            <DetailField label="Firma"        value={reg.firma} />
            <DetailField label="Kunden-Nr."   value={reg.kunden_nr} />
            <DetailField label="Name"         value={`${reg.vorname} ${reg.nachname}`} />
            <DetailField label="Adresse"      value={`${reg.strasse}, ${reg.plz} ${reg.ort}`} />
            <DetailField label="E-Mail"       value={reg.email} />
            <DetailField label="Telefon"      value={reg.telefon} />
          </DetailSection>
          <DetailSection title="🏐 Mannschaften">
            <DetailField label="Anzahl Teams"  value={reg.mannschaften ? `${reg.mannschaften}× 4er-Mixed` : null} />
            <DetailField label="Teamnamen"     value={(reg.mannschaftsnamen || '').split('\n').filter(Boolean).join(', ') || null} />
            <DetailField label="Teilnehmer"    value={reg.teilnehmer_anzahl || null} />
          </DetailSection>
          <DetailSection title="💰 Gebühren">
            <div className="flex gap-3 py-2 mt-1 bg-ocean-50 rounded-xl px-3 border border-ocean-100">
              <dt className="w-48 shrink-0 text-sm font-bold text-ocean-700">Gesamtsumme</dt>
              <dd className="text-base font-bold text-ocean-700">{fmt(reg.gebuehr_gesamt)}</dd>
            </div>
          </DetailSection>
          <DetailSection title="✅ Abschluss">
            <DetailField label="Unterschrift / Datum" value={reg.ort_datum_name} />
            <DetailField label="Datenschutz"          value={reg.datenschutz_consent ? 'Zugestimmt' : null} />
          </DetailSection>
          <DetailSection title="🎟️ Check-in Status">
            <DetailField label="Zahlung bestätigt" value={reg.payment_received_at?.slice(0, 16) || null} />
            <DetailField label="Eingecheckt"       value={reg.checked_in_at?.slice(0, 16) || null} />
          </DetailSection>
        </div>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const navigate = useNavigate();
  const user = getUser();
  const logout = () => { localStorage.removeItem('bcc_token'); localStorage.removeItem('bcc_user'); navigate('/login'); };

  return (
    <div className="flex min-h-screen bg-shore-50">
      <Sidebar onLogout={logout} />
      <main className="flex-1 p-5 lg:p-7 overflow-auto min-w-0">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="registrations" element={<RegistrationList />} />
          <Route path="registrations/:id" element={<RegistrationDetail />} />
          <Route path="hesse" element={<HesseDashboard />} />
          <Route path="hesse/registrations" element={<HesseList />} />
          <Route path="hesse/registrations/:id" element={<HesseDetail />} />
          <Route path="waitlist" element={<WaitlistSettings />} />
          {user.role === 'superadmin' && <Route path="smtp" element={<SmtpSettings />} />}
          {user.role === 'superadmin' && <Route path="payment" element={<PaymentSettings />} />}
          {user.role === 'superadmin' && <Route path="users" element={<UserManagement />} />}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}
