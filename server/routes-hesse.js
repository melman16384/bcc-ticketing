const express = require('express');
const router = express.Router();
const { db } = require('./db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'bcc-secret-2026';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function genBookingCode() {
  let code;
  do {
    const part = (n) => Array.from({ length: n }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
    code = `${part(4)}-${part(4)}`;
  } while (db.prepare('SELECT 1 FROM hesse_registrations WHERE booking_code = ?').get(code));
  return code;
}

function auth(role) {
  return (req, res, next) => {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (role === 'superadmin' && payload.role !== 'superadmin') return res.status(403).json({ error: 'Keine Berechtigung' });
      if (role === 'admin' && payload.role !== 'admin' && payload.role !== 'superadmin') return res.status(403).json({ error: 'Keine Berechtigung' });
      req.user = payload;
      next();
    } catch { res.status(401).json({ error: 'Nicht authentifiziert' }); }
  };
}

// ── Öffentliche Anmeldung ─────────────────────────────────────────────────────
router.post('/registrations', async (req, res) => {
  try {
    const d = req.body;
    if (!d.firma || !d.vorname || !d.nachname || !d.email || !d.strasse || !d.ort || !d.plz) {
      return res.status(400).json({ error: 'Pflichtfelder fehlen' });
    }
    const { getSettings } = require('./db');
    if (getSettings().hesse_registration_open !== '1') {
      return res.status(409).json({ error: 'Die Anmeldung ist aktuell geschlossen.' });
    }
    if (!d.mannschaften || d.mannschaften < 1) {
      return res.status(400).json({ error: 'Bitte mindestens eine Mannschaft angeben' });
    }

    const gebuehr_gesamt = Number(d.mannschaften) * 35;
    const booking_code   = genBookingCode();

    const result = db.prepare(`
      INSERT INTO hesse_registrations (
        firma, kunden_nr, vorname, nachname, strasse, ort, plz, telefon, email,
        mannschaften, mannschaftsnamen, teilnehmer_anzahl,
        ort_datum_name, datenschutz_consent, gebuehr_gesamt, booking_code, status
      ) VALUES (
        @firma, @kunden_nr, @vorname, @nachname, @strasse, @ort, @plz, @telefon, @email,
        @mannschaften, @mannschaftsnamen, @teilnehmer_anzahl,
        @ort_datum_name, @datenschutz_consent, @gebuehr_gesamt, @booking_code, 'pending'
      )
    `).run({
      firma: d.firma, kunden_nr: d.kunden_nr || null,
      vorname: d.vorname, nachname: d.nachname,
      strasse: d.strasse, ort: d.ort, plz: d.plz,
      telefon: d.telefon || null, email: d.email,
      mannschaften: Number(d.mannschaften) || 0,
      mannschaftsnamen: d.mannschaftsnamen || null,
      teilnehmer_anzahl: Number(d.teilnehmer_anzahl) || 0,
      ort_datum_name: d.ort_datum_name || null,
      datenschutz_consent: d.datenschutz_consent ? 1 : 0,
      gebuehr_gesamt, booking_code,
    });

    const reg = db.prepare('SELECT * FROM hesse_registrations WHERE id = ?').get(result.lastInsertRowid);
    const { sendHesseConfirmation, sendHesseAdminNotification } = require('./mailer');
    sendHesseConfirmation(reg).catch((e) => console.error('[Mailer/Hesse]', e.message));
    sendHesseAdminNotification(reg).catch((e) => console.error('[Mailer/Hesse]', e.message));

    res.json({ id: reg.id, booking_code: reg.booking_code, gebuehr_gesamt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ── Admin: Liste ──────────────────────────────────────────────────────────────
router.get('/admin/registrations', auth('admin'), (req, res) => {
  const { status, search, checked_in } = req.query;
  let query = 'SELECT * FROM hesse_registrations';
  const params = [], where = [];
  if (status) { where.push('status = ?'); params.push(status); }
  if (checked_in === 'true') { where.push('checked_in_at IS NOT NULL'); }
  if (search) {
    where.push('(vorname LIKE ? OR nachname LIKE ? OR email LIKE ? OR firma LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (where.length) query += ' WHERE ' + where.join(' AND ');
  query += ' ORDER BY created_at DESC';
  res.json(db.prepare(query).all(...params));
});

// ── Admin: Statistiken ────────────────────────────────────────────────────────
router.get('/admin/stats', auth('admin'), (req, res) => {
  const total      = db.prepare("SELECT COUNT(*) as n FROM hesse_registrations WHERE status != 'cancelled'").get().n;
  const confirmed  = db.prepare("SELECT COUNT(*) as n FROM hesse_registrations WHERE status = 'confirmed'").get().n;
  const pending    = db.prepare("SELECT COUNT(*) as n FROM hesse_registrations WHERE status = 'pending'").get().n;
  const cancelled  = db.prepare("SELECT COUNT(*) as n FROM hesse_registrations WHERE status = 'cancelled'").get().n;
  const checked_in = db.prepare("SELECT COUNT(*) as n FROM hesse_registrations WHERE checked_in_at IS NOT NULL").get().n;
  const mannschaften = db.prepare("SELECT COALESCE(SUM(mannschaften),0) as n FROM hesse_registrations WHERE status != 'cancelled'").get().n;
  const revenue    = db.prepare("SELECT COALESCE(SUM(gebuehr_gesamt),0) as s FROM hesse_registrations WHERE status = 'confirmed'").get().s;
  res.json({ total, confirmed, pending, cancelled, checked_in, mannschaften, revenue });
});

// ── Admin: Detail ─────────────────────────────────────────────────────────────
router.get('/admin/registrations/:id', auth('admin'), (req, res) => {
  const reg = db.prepare('SELECT * FROM hesse_registrations WHERE id = ?').get(req.params.id);
  if (!reg) return res.status(404).json({ error: 'Nicht gefunden' });
  res.json(reg);
});

// ── Admin: Bestätigen ─────────────────────────────────────────────────────────
router.post('/admin/registrations/:id/confirm', auth('admin'), async (req, res) => {
  const reg = db.prepare('SELECT * FROM hesse_registrations WHERE id = ?').get(req.params.id);
  if (!reg) return res.status(404).json({ error: 'Nicht gefunden' });
  if (reg.status === 'confirmed' || reg.status === 'cancelled') return res.status(409).json({ error: 'Bereits abgeschlossen' });
  if (!req.body.confirmed) return res.status(400).json({ error: 'Bestätigung fehlt' });
  db.prepare("UPDATE hesse_registrations SET status = 'confirmed', confirmed_at = datetime('now','localtime') WHERE id = ?").run(reg.id);
  const updated = db.prepare('SELECT * FROM hesse_registrations WHERE id = ?').get(reg.id);
  const { sendHessePaymentInfo } = require('./mailer');
  sendHessePaymentInfo(updated).catch((e) => console.error('[Mailer/Hesse]', e.message));
  res.json({ ok: true });
});

// ── Admin: Stornieren ─────────────────────────────────────────────────────────
router.post('/admin/registrations/:id/cancel', auth('admin'), async (req, res) => {
  const reg = db.prepare('SELECT * FROM hesse_registrations WHERE id = ?').get(req.params.id);
  if (!reg) return res.status(404).json({ error: 'Nicht gefunden' });
  if (reg.status === 'confirmed') return res.status(409).json({ error: 'Bestätigte Anmeldungen können nicht storniert werden' });
  if (!req.body.confirmed) return res.status(400).json({ error: 'Bestätigung fehlt' });
  db.prepare("UPDATE hesse_registrations SET status = 'cancelled' WHERE id = ?").run(reg.id);
  const updated = db.prepare('SELECT * FROM hesse_registrations WHERE id = ?').get(reg.id);
  const { sendHesseCancellation } = require('./mailer');
  sendHesseCancellation(updated).catch((e) => console.error('[Mailer/Hesse]', e.message));
  res.json({ ok: true });
});

// ── Admin: Zahlungseingang ────────────────────────────────────────────────────
router.post('/admin/registrations/:id/payment', auth('admin'), async (req, res) => {
  const reg = db.prepare('SELECT * FROM hesse_registrations WHERE id = ?').get(req.params.id);
  if (!reg) return res.status(404).json({ error: 'Nicht gefunden' });
  if (reg.status !== 'confirmed') return res.status(409).json({ error: 'Nur bestätigte Anmeldungen' });
  if (reg.payment_received_at) return res.status(409).json({ error: 'Zahlung bereits bestätigt' });
  if (!req.body.confirmed) return res.status(400).json({ error: 'Bestätigung fehlt' });
  db.prepare("UPDATE hesse_registrations SET payment_received_at = datetime('now','localtime') WHERE id = ?").run(reg.id);
  const updated = db.prepare('SELECT * FROM hesse_registrations WHERE id = ?').get(reg.id);
  const { sendHesseQrCode } = require('./mailer');
  sendHesseQrCode(updated).catch((e) => console.error('[Mailer/Hesse]', e.message));
  res.json({ ok: true });
});

// ── Admin: Löschen (Superadmin) ───────────────────────────────────────────────
router.delete('/admin/registrations/:id', auth('superadmin'), (req, res) => {
  const reg = db.prepare('SELECT id FROM hesse_registrations WHERE id = ?').get(req.params.id);
  if (!reg) return res.status(404).json({ error: 'Nicht gefunden' });
  db.prepare('DELETE FROM hesse_registrations WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ── Admin: CSV-Export ─────────────────────────────────────────────────────────
router.get('/admin/export/csv', auth('admin'), (req, res) => {
  const rows = db.prepare("SELECT * FROM hesse_registrations ORDER BY created_at DESC").all();
  const headers = ['ID','Buchungscode','Status','Firma','Kunden-Nr.','Vorname','Nachname','Straße','PLZ','Ort','Telefon','E-Mail','Mannschaften','Teamnamen','Teilnehmer','Gebühr gesamt','Erstellt','Bestätigt','Zahlung','Eingecheckt'];
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.join(';'), ...rows.map((r) => [
    r.id, r.booking_code, r.status, r.firma, r.kunden_nr,
    r.vorname, r.nachname, r.strasse, r.plz, r.ort,
    r.telefon, r.email, r.mannschaften,
    (r.mannschaftsnamen || '').replace(/\n/g, ' | '),
    r.teilnehmer_anzahl,
    String(r.gebuehr_gesamt || 0).replace('.', ','),
    r.created_at, r.confirmed_at, r.payment_received_at, r.checked_in_at,
  ].map(escape).join(';'))];
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="hesse-anmeldungen-${new Date().toISOString().slice(0,10)}.csv"`);
  res.send('﻿' + lines.join('\r\n'));
});

// ── Check-in ──────────────────────────────────────────────────────────────────
router.get('/checkin/:code', (req, res) => {
  const reg = db.prepare(`
    SELECT id, booking_code, status, payment_received_at, checked_in_at,
           firma, vorname, nachname, email, mannschaften, mannschaftsnamen, teilnehmer_anzahl
    FROM hesse_registrations WHERE booking_code = ?
  `).get(req.params.code.toUpperCase());
  if (!reg) return res.status(404).json({ error: 'Buchung nicht gefunden' });
  res.json(reg);
});

router.post('/checkin/:code', (req, res) => {
  const { getSettings } = require('./db');
  const correctPin = getSettings().checkin_pin;
  if (!correctPin) return res.status(503).json({ error: 'Kein Check-in PIN konfiguriert. Bitte Superadmin kontaktieren.' });
  if (!req.body.pin || req.body.pin !== correctPin) return res.status(401).json({ error: 'Falscher PIN' });
  const reg = db.prepare('SELECT * FROM hesse_registrations WHERE booking_code = ?').get(req.params.code.toUpperCase());
  if (!reg) return res.status(404).json({ error: 'Buchung nicht gefunden' });
  if (reg.status !== 'confirmed') return res.status(400).json({ error: 'Anmeldung nicht bestätigt' });
  if (!reg.payment_received_at) return res.status(400).json({ error: 'Zahlung nicht bestätigt' });
  if (reg.checked_in_at) return res.status(409).json({ error: 'Bereits eingecheckt', checked_in_at: reg.checked_in_at });
  db.prepare("UPDATE hesse_registrations SET checked_in_at = datetime('now','localtime') WHERE booking_code = ?").run(req.params.code.toUpperCase());
  res.json({ ok: true });
});

module.exports = router;
