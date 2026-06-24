const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'data', 'registrations.db');
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    name TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    confirmed_at TEXT,
    status TEXT DEFAULT 'pending',

    vereinsname TEXT,
    vorname TEXT NOT NULL,
    nachname TEXT NOT NULL,
    strasse TEXT NOT NULL,
    ort TEXT NOT NULL,
    plz TEXT NOT NULL,
    email TEXT NOT NULL,
    telefon TEXT NOT NULL,
    kunden_nr TEXT,

    kotc_maennlich INTEGER DEFAULT 0,
    kotc_weiblich INTEGER DEFAULT 0,
    kotc_mixed INTEGER DEFAULT 0,
    beach_fun_a INTEGER DEFAULT 0,
    beach_fun_b INTEGER DEFAULT 0,

    names_kotc_maennlich TEXT,
    names_kotc_weiblich TEXT,
    names_kotc_mixed TEXT,
    names_beach_fun_a TEXT,
    names_beach_fun_b TEXT,

    begleitpersonen INTEGER DEFAULT 0,
    kinder_jugendliche INTEGER DEFAULT 0,
    pkw_stellplaetze INTEGER DEFAULT 0,

    fruehstueck_samstag INTEGER DEFAULT 0,
    fruehstueck_sonntag INTEGER DEFAULT 0,

    ankunftstag TEXT,
    transport_bahn_bus TEXT DEFAULT 'Nein',
    transport_pkw INTEGER DEFAULT 0,
    transport_motorrad INTEGER DEFAULT 0,
    transport_wohnmobil INTEGER DEFAULT 0,
    zelte_turnier INTEGER DEFAULT 0,
    fremder_camping INTEGER DEFAULT 0,
    ferienwohnung INTEGER DEFAULT 0,
    hotel INTEGER DEFAULT 0,
    teilnehmer_anzahl INTEGER DEFAULT 0,
    zuschauer_anzahl INTEGER DEFAULT 0,

    ort_datum_name TEXT,
    datenschutz_consent INTEGER DEFAULT 0,

    gebuehr_mannschaft REAL DEFAULT 0,
    gebuehr_teilnehmer REAL DEFAULT 0,
    gebuehr_pkw REAL DEFAULT 0,
    gebuehr_fruehstueck REAL DEFAULT 0,
    gebuehr_gesamt REAL DEFAULT 0,

    auf_warteliste INTEGER DEFAULT 0,
    booking_code TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS hesse_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    confirmed_at TEXT,
    status TEXT DEFAULT 'pending',

    firma TEXT NOT NULL,
    kunden_nr TEXT,
    vorname TEXT NOT NULL,
    nachname TEXT NOT NULL,
    strasse TEXT NOT NULL,
    ort TEXT NOT NULL,
    plz TEXT NOT NULL,
    telefon TEXT,
    email TEXT NOT NULL,

    mannschaften INTEGER DEFAULT 0,
    mannschaftsnamen TEXT,
    teilnehmer_anzahl INTEGER DEFAULT 0,

    ort_datum_name TEXT,
    datenschutz_consent INTEGER DEFAULT 0,

    gebuehr_gesamt REAL DEFAULT 0,

    booking_code TEXT UNIQUE,
    payment_received_at TEXT,
    checked_in_at TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  INSERT OR IGNORE INTO settings (key, value) VALUES
    ('kotc_maennlich_waitlist', '1'),
    ('beach_fun_a_waitlist', '1'),
    ('beach_fun_b_waitlist', '1'),
    ('kotc_weiblich_waitlist', '0'),
    ('kotc_mixed_waitlist', '0'),
    ('smtp_host', ''),
    ('smtp_port', '587'),
    ('smtp_secure', 'false'),
    ('smtp_user', ''),
    ('smtp_pass', ''),
    ('smtp_from', ''),
    ('admin_email', ''),
    ('payment_empfaenger', 'Beachsportclub Cuxhaven e.V.'),
    ('payment_iban', ''),
    ('payment_bic', ''),
    ('payment_bank', ''),
    ('payment_frist', '4 Wochen vor Turnierbeginn'),
    ('payment_storno_hinweis', 'Bei Abmeldung nach dem 15.06.2026 wird die Startgebühr nicht erstattet.'),
    ('checkin_pin', ''),
    ('registration_open', '1'),
    ('hesse_registration_open', '1');
`);

// Migrate older settings keys
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('registration_open', '1')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('hesse_registration_open', '1')").run();

// Migrate older databases that may be missing columns
[
  `ALTER TABLE registrations ADD COLUMN confirmed_at TEXT`,
  `ALTER TABLE registrations ADD COLUMN booking_code TEXT`,
  `ALTER TABLE registrations ADD COLUMN payment_received_at TEXT`,
  `ALTER TABLE registrations ADD COLUMN checked_in_at TEXT`,
  `ALTER TABLE registrations ADD COLUMN checkin_token TEXT`,
].forEach((sql) => { try { db.exec(sql); } catch { /* already exists */ } });
try { db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_code ON registrations(booking_code)`); } catch { /* ok */ }
try { db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_checkin_token ON registrations(checkin_token)`); } catch { /* ok */ }
try { db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_hesse_booking_code ON hesse_registrations(booking_code)`); } catch { /* ok */ }

function getSettings() {
  return Object.fromEntries(db.prepare('SELECT key, value FROM settings').all().map((r) => [r.key, r.value]));
}

function seedUsers() {
  const superEmail = process.env.SEED_SUPERADMIN_EMAIL || 'superadmin@bcc-ticketing.de';
  const superPw   = process.env.SEED_SUPERADMIN_PASSWORD || 'changeme';
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@bcc-ticketing.de';
  const adminPw   = process.env.SEED_ADMIN_PASSWORD || 'changeme';

  const existing = db.prepare('SELECT COUNT(*) as n FROM users').get().n;
  if (existing > 0) return;

  const insert = db.prepare('INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)');
  insert.run(superEmail, bcrypt.hashSync(superPw, 10), 'superadmin', 'Super Admin');
  insert.run(adminEmail, bcrypt.hashSync(adminPw, 10), 'admin', 'Admin');
  console.log(`[DB] Seed-Benutzer angelegt: ${superEmail} (superadmin), ${adminEmail} (admin)`);
}

module.exports = { db, seedUsers, getSettings };
