const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, getSettings } = require('./db');
const { sendRegistrationConfirmation, sendAdminNotification, sendPaymentInfo } = require('./mailer');

const JWT_SECRET = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET nicht konfiguriert');
  return s;
};

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous I/1/O/0
function genBookingCode() {
  let code;
  do {
    const part = (n) => Array.from({ length: n }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
    code = `${part(4)}-${part(4)}`;
  } while (db.prepare('SELECT 1 FROM registrations WHERE booking_code = ?').get(code));
  return code;
}

// ── Auth-Middleware ───────────────────────────────────────────────────────────
function auth(requiredRole) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Nicht angemeldet' });
    }
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET());
      if (requiredRole === 'superadmin' && payload.role !== 'superadmin') {
        return res.status(403).json({ error: 'Nur Superadmin erlaubt' });
      }
      if (requiredRole === 'admin' && payload.role !== 'admin' && payload.role !== 'superadmin') {
        return res.status(403).json({ error: 'Keine Berechtigung' });
      }
      req.user = payload;
      next();
    } catch {
      res.status(401).json({ error: 'Token ungültig oder abgelaufen' });
    }
  };
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────
function calcFees(d) {
  const mannschaft =
    (d.kotc_maennlich || 0) * 15 + (d.kotc_weiblich || 0) * 15 + (d.kotc_mixed || 0) * 15 +
    (d.beach_fun_a || 0) * 95 + (d.beach_fun_b || 0) * 95;
  const teilnehmer = (d.begleitpersonen || 0) * 20 + (d.kinder_jugendliche || 0) * 13;
  const pkw = (d.pkw_stellplaetze || 0) * 15;
  const fruehstueck = ((d.fruehstueck_samstag || 0) + (d.fruehstueck_sonntag || 0)) * 9.5;
  return {
    gebuehr_mannschaft: mannschaft,
    gebuehr_teilnehmer: teilnehmer,
    gebuehr_pkw: pkw,
    gebuehr_fruehstueck: fruehstueck,
    gebuehr_gesamt: mannschaft + teilnehmer + pkw + fruehstueck,
  };
}

function isWaitlist(data) {
  const map = Object.fromEntries(db.prepare('SELECT key, value FROM settings').all().map((s) => [s.key, s.value]));
  if (map.kotc_maennlich_waitlist === '1' && (data.kotc_maennlich || 0) > 0) return true;
  if (map.beach_fun_a_waitlist === '1' && (data.beach_fun_a || 0) > 0) return true;
  if (map.beach_fun_b_waitlist === '1' && (data.beach_fun_b || 0) > 0) return true;
  return false;
}

// ── PUBLIC: Login ─────────────────────────────────────────────────────────────
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'E-Mail und Passwort erforderlich' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'E-Mail oder Passwort falsch' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET(), { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
});

router.get('/auth/me', auth('admin'), (req, res) => res.json(req.user));

// ── PUBLIC: Wartelisten-Status ────────────────────────────────────────────────
router.get('/waitlist-status', (req, res) => {
  const map = Object.fromEntries(db.prepare('SELECT key, value FROM settings').all().map((s) => [s.key, s.value === '1']));
  res.json(map);
});

// ── PUBLIC: Anmeldung einreichen ──────────────────────────────────────────────
router.post('/registrations', async (req, res) => {
  try {
    const d = req.body;
    if (!d.vorname || !d.nachname || !d.email || !d.strasse || !d.ort || !d.plz || !d.telefon) {
      return res.status(400).json({ error: 'Pflichtfelder fehlen' });
    }
    const { getSettings } = require('./db');
    if (getSettings().registration_open !== '1') {
      return res.status(409).json({ error: 'Die Anmeldung ist aktuell geschlossen.' });
    }

    const fees = calcFees(d);
    const waitlist = isWaitlist(d) ? 1 : 0;
    const booking_code = genBookingCode();

    const result = db.prepare(`
      INSERT INTO registrations (
        vereinsname, vorname, nachname, strasse, ort, plz, email, telefon, kunden_nr,
        kotc_maennlich, kotc_weiblich, kotc_mixed, beach_fun_a, beach_fun_b,
        names_kotc_maennlich, names_kotc_weiblich, names_kotc_mixed, names_beach_fun_a, names_beach_fun_b,
        begleitpersonen, kinder_jugendliche, pkw_stellplaetze,
        fruehstueck_samstag, fruehstueck_sonntag,
        ankunftstag, transport_bahn_bus, transport_pkw, transport_motorrad, transport_wohnmobil,
        zelte_turnier, fremder_camping, ferienwohnung, hotel, teilnehmer_anzahl, zuschauer_anzahl,
        ort_datum_name, datenschutz_consent,
        gebuehr_mannschaft, gebuehr_teilnehmer, gebuehr_pkw, gebuehr_fruehstueck, gebuehr_gesamt,
        auf_warteliste, status, booking_code
      ) VALUES (
        @vereinsname, @vorname, @nachname, @strasse, @ort, @plz, @email, @telefon, @kunden_nr,
        @kotc_maennlich, @kotc_weiblich, @kotc_mixed, @beach_fun_a, @beach_fun_b,
        @names_kotc_maennlich, @names_kotc_weiblich, @names_kotc_mixed, @names_beach_fun_a, @names_beach_fun_b,
        @begleitpersonen, @kinder_jugendliche, @pkw_stellplaetze,
        @fruehstueck_samstag, @fruehstueck_sonntag,
        @ankunftstag, @transport_bahn_bus, @transport_pkw, @transport_motorrad, @transport_wohnmobil,
        @zelte_turnier, @fremder_camping, @ferienwohnung, @hotel, @teilnehmer_anzahl, @zuschauer_anzahl,
        @ort_datum_name, @datenschutz_consent,
        @gebuehr_mannschaft, @gebuehr_teilnehmer, @gebuehr_pkw, @gebuehr_fruehstueck, @gebuehr_gesamt,
        @auf_warteliste, @status, @booking_code
      )
    `).run({
      vereinsname: d.vereinsname || null, vorname: d.vorname, nachname: d.nachname,
      strasse: d.strasse, ort: d.ort, plz: d.plz, email: d.email, telefon: d.telefon, kunden_nr: d.kunden_nr || null,
      kotc_maennlich: d.kotc_maennlich || 0, kotc_weiblich: d.kotc_weiblich || 0, kotc_mixed: d.kotc_mixed || 0,
      beach_fun_a: d.beach_fun_a || 0, beach_fun_b: d.beach_fun_b || 0,
      names_kotc_maennlich: d.names_kotc_maennlich || null, names_kotc_weiblich: d.names_kotc_weiblich || null,
      names_kotc_mixed: d.names_kotc_mixed || null, names_beach_fun_a: d.names_beach_fun_a || null,
      names_beach_fun_b: d.names_beach_fun_b || null,
      begleitpersonen: d.begleitpersonen || 0, kinder_jugendliche: d.kinder_jugendliche || 0,
      pkw_stellplaetze: d.pkw_stellplaetze || 0, fruehstueck_samstag: d.fruehstueck_samstag || 0,
      fruehstueck_sonntag: d.fruehstueck_sonntag || 0,
      ankunftstag: d.ankunftstag || null, transport_bahn_bus: d.transport_bahn_bus || 'Nein',
      transport_pkw: d.transport_pkw || 0, transport_motorrad: d.transport_motorrad || 0,
      transport_wohnmobil: d.transport_wohnmobil || 0, zelte_turnier: d.zelte_turnier || 0,
      fremder_camping: d.fremder_camping || 0, ferienwohnung: d.ferienwohnung || 0,
      hotel: d.hotel || 0, teilnehmer_anzahl: d.teilnehmer_anzahl || 0, zuschauer_anzahl: d.zuschauer_anzahl || 0,
      ort_datum_name: d.ort_datum_name || null, datenschutz_consent: d.datenschutz_consent ? 1 : 0,
      ...fees, auf_warteliste: waitlist, status: waitlist ? 'waitlist' : 'pending', booking_code,
    });

    const reg = db.prepare('SELECT * FROM registrations WHERE id = ?').get(result.lastInsertRowid);

    sendRegistrationConfirmation(reg).catch((e) => console.error('[Mailer]', e.message));
    sendAdminNotification(reg).catch((e) => console.error('[Mailer]', e.message));

    res.json({ id: reg.id, booking_code: reg.booking_code, waitlist: !!waitlist, fees });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ── ADMIN: Registrierungen ────────────────────────────────────────────────────
router.get('/admin/registrations', auth('admin'), (req, res) => {
  const { status, search, checked_in } = req.query;
  let query = 'SELECT * FROM registrations';
  const params = [];
  const where = [];
  if (status) { where.push('status = ?'); params.push(status); }
  if (checked_in === 'true') { where.push('checked_in_at IS NOT NULL'); }
  if (search) {
    where.push('(vorname LIKE ? OR nachname LIKE ? OR email LIKE ? OR vereinsname LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (where.length) query += ' WHERE ' + where.join(' AND ');
  query += ' ORDER BY created_at DESC';
  res.json(db.prepare(query).all(...params));
});

router.get('/admin/registrations/:id', auth('admin'), (req, res) => {
  const reg = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id);
  if (!reg) return res.status(404).json({ error: 'Nicht gefunden' });
  res.json(reg);
});

router.delete('/admin/registrations/:id', auth('superadmin'), (req, res) => {
  const reg = db.prepare('SELECT id FROM registrations WHERE id = ?').get(req.params.id);
  if (!reg) return res.status(404).json({ error: 'Nicht gefunden' });
  db.prepare('DELETE FROM registrations WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.patch('/admin/registrations/:id/status', auth('admin'), (req, res) => {
  const { status } = req.body;
  if (!['pending', 'confirmed', 'waitlist', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Ungültiger Status' });
  }
  const reg = db.prepare('SELECT status FROM registrations WHERE id = ?').get(req.params.id);
  if (!reg) return res.status(404).json({ error: 'Nicht gefunden' });
  if (reg.status === 'confirmed' || reg.status === 'cancelled') {
    return res.status(409).json({ error: 'Bestätigte oder stornierte Anmeldungen können nicht mehr geändert werden' });
  }
  db.prepare('UPDATE registrations SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

// Bestätigen + Zahlungsinfo-Mail senden (zweifache Bestätigung erforderlich, danach gesperrt)
router.post('/admin/registrations/:id/confirm', auth('admin'), async (req, res) => {
  const reg = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id);
  if (!reg) return res.status(404).json({ error: 'Nicht gefunden' });
  if (reg.status === 'confirmed') {
    return res.status(409).json({ error: 'Bereits bestätigt' });
  }
  if (!req.body.confirmed) {
    return res.status(400).json({ error: 'Bestätigung fehlt' });
  }

  db.prepare("UPDATE registrations SET status = 'confirmed', confirmed_at = datetime('now','localtime') WHERE id = ?").run(req.params.id);

  const updated = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id);
  sendPaymentInfo(updated).catch((e) => console.error('[Mailer]', e.message));
  res.json({ ok: true });
});

// Zahlungseingang bestätigen → Check-in-Token generieren + QR-Code-Mail senden
router.post('/admin/registrations/:id/payment', auth('admin'), async (req, res) => {
  const reg = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id);
  if (!reg) return res.status(404).json({ error: 'Nicht gefunden' });
  if (reg.status !== 'confirmed') return res.status(409).json({ error: 'Nur bestätigte Anmeldungen können als bezahlt markiert werden' });
  if (reg.payment_received_at) return res.status(409).json({ error: 'Zahlung bereits bestätigt' });
  if (!req.body.confirmed) return res.status(400).json({ error: 'Bestätigung fehlt' });

  db.prepare("UPDATE registrations SET payment_received_at = datetime('now','localtime') WHERE id = ?").run(reg.id);
  const updated = db.prepare('SELECT * FROM registrations WHERE id = ?').get(reg.id);
  const { sendQrCodeEmail } = require('./mailer');
  sendQrCodeEmail(updated).catch((e) => console.error('[Mailer]', e.message));
  res.json({ ok: true });
});

// ── CHECKIN: Buchung per Buchungscode nachschlagen (öffentlich) ───────────────
router.get('/checkin/:code', (req, res) => {
  const reg = db.prepare(`
    SELECT id, booking_code, status, auf_warteliste, payment_received_at, checked_in_at,
           vorname, nachname, vereinsname,
           kotc_maennlich, kotc_weiblich, kotc_mixed, beach_fun_a, beach_fun_b,
           names_kotc_maennlich, names_kotc_weiblich, names_kotc_mixed, names_beach_fun_a, names_beach_fun_b
    FROM registrations WHERE booking_code = ?
  `).get(req.params.code.toUpperCase());
  if (!reg) return res.status(404).json({ error: 'Buchung nicht gefunden' });
  res.json(reg);
});

// ── CHECKIN: Einchecken mit PIN-Bestätigung (kein Login nötig) ───────────────
router.post('/checkin/:code', (req, res) => {
  const { getSettings } = require('./db');
  const correctPin = getSettings().checkin_pin;
  if (!correctPin) return res.status(503).json({ error: 'Kein Check-in PIN konfiguriert. Bitte Superadmin kontaktieren.' });
  if (!req.body.pin || req.body.pin !== correctPin) {
    return res.status(401).json({ error: 'Falscher PIN' });
  }
  const reg = db.prepare('SELECT * FROM registrations WHERE booking_code = ?').get(req.params.code.toUpperCase());
  if (!reg) return res.status(404).json({ error: 'Buchung nicht gefunden' });
  if (reg.status !== 'confirmed') return res.status(400).json({ error: 'Anmeldung ist nicht bestätigt' });
  if (!reg.payment_received_at) return res.status(400).json({ error: 'Zahlung noch nicht bestätigt' });
  if (reg.checked_in_at) return res.status(409).json({ error: 'Bereits eingecheckt', checked_in_at: reg.checked_in_at });
  db.prepare("UPDATE registrations SET checked_in_at = datetime('now','localtime') WHERE booking_code = ?").run(req.params.code.toUpperCase());
  res.json({ ok: true });
});

// Stornieren + Stornierungsmail senden (zweifache Bestätigung, danach gesperrt)
router.post('/admin/registrations/:id/cancel', auth('admin'), async (req, res) => {
  const reg = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id);
  if (!reg) return res.status(404).json({ error: 'Nicht gefunden' });
  if (reg.status === 'confirmed') return res.status(409).json({ error: 'Bestätigte Anmeldungen können nicht storniert werden' });
  if (reg.status === 'cancelled') return res.status(409).json({ error: 'Bereits storniert' });
  if (!req.body.confirmed) return res.status(400).json({ error: 'Bestätigung fehlt' });

  db.prepare("UPDATE registrations SET status = 'cancelled' WHERE id = ?").run(req.params.id);

  const updated = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id);
  const { sendCancellationEmail } = require('./mailer');
  sendCancellationEmail(updated).catch((e) => console.error('[Mailer]', e.message));
  res.json({ ok: true });
});

// ── ADMIN: Statistiken ────────────────────────────────────────────────────────
router.get('/admin/stats', auth('admin'), (req, res) => {
  const total      = db.prepare("SELECT COUNT(*) as n FROM registrations WHERE status != 'cancelled'").get().n;
  const confirmed  = db.prepare("SELECT COUNT(*) as n FROM registrations WHERE status = 'confirmed'").get().n;
  const pending    = db.prepare("SELECT COUNT(*) as n FROM registrations WHERE status = 'pending'").get().n;
  const waitlist   = db.prepare("SELECT COUNT(*) as n FROM registrations WHERE status = 'waitlist'").get().n;
  const cancelled  = db.prepare("SELECT COUNT(*) as n FROM registrations WHERE status = 'cancelled'").get().n;
  const checked_in = db.prepare("SELECT COUNT(*) as n FROM registrations WHERE checked_in_at IS NOT NULL").get().n;
  const revenue    = db.prepare("SELECT COALESCE(SUM(gebuehr_gesamt),0) as s FROM registrations WHERE status = 'confirmed'").get().s;
  const teams      = db.prepare(`
    SELECT SUM(kotc_maennlich) as kotc_m, SUM(kotc_weiblich) as kotc_w, SUM(kotc_mixed) as kotc_x,
           SUM(beach_fun_a) as bfa, SUM(beach_fun_b) as bfb
    FROM registrations WHERE status != 'cancelled'`).get();
  res.json({ total, confirmed, pending, waitlist, cancelled, checked_in, revenue, teams });
});

// ── ADMIN: Einstellungen ──────────────────────────────────────────────────────
router.get('/admin/settings', auth('admin'), (req, res) => {
  res.json(Object.fromEntries(db.prepare('SELECT key, value FROM settings').all().map((s) => [s.key, s.value])));
});

router.patch('/admin/settings', auth('admin'), (req, res) => {
  const allowed = ['kotc_maennlich_waitlist','kotc_weiblich_waitlist','kotc_mixed_waitlist','beach_fun_a_waitlist','beach_fun_b_waitlist','registration_open','hesse_registration_open'];
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  for (const key of allowed) {
    if (key in req.body) stmt.run(key, req.body[key] ? '1' : '0');
  }
  res.json({ ok: true });
});

// ── SUPERADMIN: SMTP-Einstellungen ────────────────────────────────────────────
router.get('/superadmin/smtp', auth('superadmin'), (req, res) => {
  const s = getSettings();
  res.json({
    smtp_host:   s.smtp_host   || process.env.SMTP_HOST   || '',
    smtp_port:   s.smtp_port   || process.env.SMTP_PORT   || '587',
    smtp_secure: s.smtp_secure || process.env.SMTP_SECURE || 'false',
    smtp_user:   s.smtp_user   || process.env.SMTP_USER   || '',
    smtp_from:   s.smtp_from   || process.env.SMTP_FROM   || '',
    admin_email: s.admin_email || process.env.ADMIN_EMAIL || '',
    smtp_pass_set: !!(s.smtp_pass || process.env.SMTP_PASS),
    payment_empfaenger:     s.payment_empfaenger     || 'Beachsportclub Cuxhaven e.V.',
    payment_iban:           s.payment_iban           || '',
    payment_bic:            s.payment_bic            || '',
    payment_bank:           s.payment_bank           || '',
    payment_frist:          s.payment_frist          || '4 Wochen vor Turnierbeginn',
    payment_storno_hinweis: s.payment_storno_hinweis || '',
  });
});

router.patch('/superadmin/smtp', auth('superadmin'), (req, res) => {
  const allowed = [
    'smtp_host','smtp_port','smtp_secure','smtp_user','smtp_pass','smtp_from','admin_email',
    'payment_empfaenger','payment_iban','payment_bic','payment_bank','payment_frist','payment_storno_hinweis',
  ];
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  for (const key of allowed) {
    if (key in req.body) stmt.run(key, String(req.body[key]));
  }
  res.json({ ok: true });
});

router.post('/superadmin/smtp/test', auth('superadmin'), async (req, res) => {
  try {
    const { sendAdminNotification } = require('./mailer');
    const testReg = {
      id: 0, vorname: 'Test', nachname: 'Mail', vereinsname: 'BCC Test',
      strasse: '-', plz: '-', ort: '-', email: req.user.email, telefon: '-',
      kotc_weiblich: 1, gebuehr_gesamt: 0, gebuehr_mannschaft: 0, gebuehr_teilnehmer: 0,
      gebuehr_pkw: 0, gebuehr_fruehstueck: 0, auf_warteliste: 0,
    };
    await sendAdminNotification(testReg);
    res.json({ ok: true, message: `Test-Mail an ${req.user.email} gesendet` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ADMIN: CSV-Export ─────────────────────────────────────────────────────────
router.get('/admin/export/csv', auth('admin'), (req, res) => {
  const rows = db.prepare('SELECT * FROM registrations ORDER BY created_at DESC').all();
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headers = ['ID','Buchungscode','Status','Warteliste','Verein','Vorname','Nachname','Straße','PLZ','Ort','E-Mail','Telefon',
    'KotC männl.','KotC weibl.','KotC Mixed','Beach-Fun A','Beach-Fun B',
    'Begleitpers.','Kinder','PKW-Plätze','Frühst. Sa','Frühst. So',
    'Teilnehmer','Zuschauer','Gebühr gesamt','Erstellt','Bestätigt','Zahlung','Eingecheckt'];
  const lines = [headers.join(';'), ...rows.map((r) => [
    r.id, r.booking_code, r.status, r.auf_warteliste ? 'Ja' : 'Nein',
    r.vereinsname, r.vorname, r.nachname, r.strasse, r.plz, r.ort, r.email, r.telefon,
    r.kotc_maennlich, r.kotc_weiblich, r.kotc_mixed, r.beach_fun_a, r.beach_fun_b,
    r.begleitpersonen, r.kinder_jugendliche, r.pkw_stellplaetze,
    r.fruehstueck_samstag, r.fruehstueck_sonntag,
    r.teilnehmer_anzahl, r.zuschauer_anzahl,
    String(r.gebuehr_gesamt || 0).replace('.', ','),
    r.created_at, r.confirmed_at, r.payment_received_at, r.checked_in_at,
  ].map(escape).join(';'))];
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="mahrenholz-anmeldungen-${new Date().toISOString().slice(0,10)}.csv"`);
  res.send('﻿' + lines.join('\r\n'));
});

// ── SUPERADMIN: Benutzerverwaltung ────────────────────────────────────────────
router.get('/superadmin/users', auth('superadmin'), (req, res) => {
  res.json(db.prepare('SELECT id, email, role, name, created_at FROM users ORDER BY created_at').all());
});

router.post('/superadmin/users', auth('superadmin'), (req, res) => {
  const { email, password, role, name } = req.body;
  if (!email || !password || !['admin', 'superadmin'].includes(role)) {
    return res.status(400).json({ error: 'E-Mail, Passwort und gültige Rolle erforderlich' });
  }
  try {
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)').run(email.toLowerCase().trim(), hash, role, name || null);
    res.json({ id: result.lastInsertRowid, email, role, name });
  } catch {
    res.status(409).json({ error: 'E-Mail bereits vergeben' });
  }
});

router.patch('/superadmin/users/:id', auth('superadmin'), (req, res) => {
  const { password, role, name } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden' });

  if (password) {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), req.params.id);
  }
  if (role && ['admin', 'superadmin'].includes(role)) {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  }
  if (name !== undefined) {
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name || null, req.params.id);
  }
  res.json({ ok: true });
});

router.delete('/superadmin/users/:id', auth('superadmin'), (req, res) => {
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Sie können sich nicht selbst löschen' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ── SUPERADMIN: Check-in PIN ──────────────────────────────────────────────────
router.get('/superadmin/pin', auth('superadmin'), (req, res) => {
  const s = getSettings();
  res.json({ checkin_pin: s.checkin_pin || '' });
});

router.patch('/superadmin/pin', auth('superadmin'), (req, res) => {
  const pin = String(req.body.checkin_pin || '').trim();
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('checkin_pin', pin);
  res.json({ ok: true });
});

// ── PUBLIC: Buchungsübersicht ─────────────────────────────────────────────────
router.get('/buchung/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const m = db.prepare(`SELECT id, booking_code, status, auf_warteliste, confirmed_at, payment_received_at, checked_in_at,
    vorname, nachname, vereinsname,
    kotc_maennlich, kotc_weiblich, kotc_mixed, beach_fun_a, beach_fun_b,
    names_kotc_maennlich, names_kotc_weiblich, names_kotc_mixed, names_beach_fun_a, names_beach_fun_b,
    gebuehr_gesamt FROM registrations WHERE booking_code = ?`).get(code);
  if (m) return res.json({ ...m, cup: 'mahrenholz' });
  const h = db.prepare(`SELECT id, booking_code, status, confirmed_at, payment_received_at, checked_in_at,
    vorname, nachname, firma, mannschaften, mannschaftsnamen, teilnehmer_anzahl,
    gebuehr_gesamt FROM hesse_registrations WHERE booking_code = ?`).get(code);
  if (h) return res.json({ ...h, cup: 'hesse' });
  res.status(404).json({ error: 'Buchung nicht gefunden' });
});

router.post('/buchung/:code/cancel', async (req, res) => {
  const code = req.params.code.toUpperCase();
  if (!req.body.confirmed) return res.status(400).json({ error: 'Bestätigung fehlt' });

  let reg = db.prepare('SELECT * FROM registrations WHERE booking_code = ?').get(code);
  let cup = 'mahrenholz';
  if (!reg) { reg = db.prepare('SELECT * FROM hesse_registrations WHERE booking_code = ?').get(code); cup = 'hesse'; }
  if (!reg) return res.status(404).json({ error: 'Buchung nicht gefunden' });
  if (reg.status === 'cancelled') return res.status(409).json({ error: 'Bereits storniert' });
  if (reg.status === 'confirmed') return res.status(409).json({ error: 'Bestätigte Anmeldungen können nur durch den Veranstalter storniert werden. Bitte per E-Mail melden.' });

  const table = cup === 'hesse' ? 'hesse_registrations' : 'registrations';
  db.prepare(`UPDATE ${table} SET status = 'cancelled' WHERE booking_code = ?`).run(code);
  const updated = db.prepare(`SELECT * FROM ${table} WHERE booking_code = ?`).get(code);

  try {
    if (cup === 'hesse') {
      const { sendHesseCancellation } = require('./mailer');
      await sendHesseCancellation(updated);
    } else {
      const { sendCancellationEmail } = require('./mailer');
      await sendCancellationEmail(updated);
    }
  } catch (e) { console.error('[Mailer] Storno-Mail Fehler:', e.message); }

  res.json({ ok: true });
});

module.exports = router;
