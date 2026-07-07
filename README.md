# BCC-Ticketing – Anmelde- & Check-in-System

Vollständiges Anmelde- und Check-in-System für den **34. Mahrenholz Beach-Cup 2026** und den **Heße Immobilien Firmencup** des Beachsportclub Cuxhaven e.V.

## Features

- **Zwei Turniere parallel** mit getrennten Anmeldeformularen, Routen und Datentabellen
- **Mehrstufiges Anmeldeformular** (9 Schritte) für Mahrenholz – Kategorien: King of the Court (männlich / weiblich / mixed), Beach-Fun A & B
- **Vereinfachtes Anmeldeformular** (3 Schritte) für den Heße Firmencup – Firmen-/Vereinsanmeldung für 4er-Mixed-Teams
- **Wartelisten-Verwaltung** pro Kategorie (manuell schaltbar oder automatisch per Teamkapazität)
- **Teamkapazitäten** pro Kategorie – maximale Teamanzahl konfigurierbar; Warteliste schaltet automatisch bei Erreichen der Grenze
- **Buchungscode** (`XXXX-XXXX`) pro Anmeldung zur eindeutigen Identifikation
- **Buchungsübersicht** unter `/buchung/:code` – öffentlich zugänglich, zeigt Status, Teams, Gebühren
- **Selbst-Stornierung** über die Buchungsübersicht (nur bei `pending` / `waitlist`)
- **Admin-Panel** mit Dashboard, Filterlisten, Detailansicht für beide Turniere
- **Zweistufige Bestätigungen** für alle kritischen Aktionen (bestätigen, stornieren, Zahlung, löschen)
- **E-Mail-Benachrichtigungen**: Anmeldebestätigung, Admin-Benachrichtigung, Zahlungsinfo, Zahlungserinnerung, QR-Code-Mail, Stornierungsbestätigung
- **Zahlungserinnerung** per E-Mail – Button in der Admin-Detailansicht für bestätigte Anmeldungen ohne Zahlungseingang
- **Admin-Notizfeld** pro Anmeldung – internes Freitextfeld, nie für Teilnehmer sichtbar
- **QR-Code Check-in** mit PIN-Schutz vor Ort
- **CSV-Export** aller Anmeldungen (je Turnier)
- **Tägliche automatische Backups** der SQLite-Datenbank (02:00 Uhr, max. 10 Dateien)
- **Superadmin**-Rolle mit erweiterten Rechten (Löschen, Passwörter ändern)

## Tech Stack

| Bereich    | Technologie                                  |
|------------|----------------------------------------------|
| Backend    | Node.js + Express (CommonJS), Port 3000      |
| Datenbank  | SQLite via `better-sqlite3`                  |
| Frontend   | React 18 + Vite + Tailwind CSS v3            |
| Auth       | JWT (`jsonwebtoken`) + bcryptjs              |
| E-Mail     | Nodemailer (SMTP konfigurierbar)             |
| QR-Code    | `qrcode` (Server) + `jsqr` (Client-Scanner) |
| Backups    | `node-cron` + `fs.copyFileSync`             |
| Sicherheit | `helmet` (HTTP-Header) + `express-rate-limit` + Nginx Rate Limiting |
| Deployment | PM2 (non-root) + Nginx Reverse Proxy + Cloudflare |

## Projektstruktur

```
bcc-ticketing/
├── server/
│   ├── index.js          # Express-Server, CORS, Rate Limiting, statische Dateien
│   ├── routes.js         # API-Routen Mahrenholz Beach-Cup
│   ├── routes-hesse.js   # API-Routen Heße Firmencup
│   ├── db.js             # SQLite-Setup, Migrationen, Seed-User
│   ├── mailer.js         # E-Mail-Templates (je 5 Typen pro Turnier)
│   └── backup.js         # Tägliche DB-Backups (02:00, max. 10 Dateien)
├── client/
│   ├── src/
│   │   ├── App.jsx                          # React Router Setup
│   │   ├── pages/
│   │   │   ├── TournamentSelectorPage.jsx   # Startseite – Turnierauswahl
│   │   │   ├── RegistrationPage.jsx         # Mahrenholz-Anmeldeformular
│   │   │   ├── HesseRegistrationPage.jsx    # Heße-Anmeldeformular
│   │   │   ├── AdminPage.jsx                # Admin-Panel (beide Turniere)
│   │   │   ├── LoginPage.jsx                # Login
│   │   │   ├── CheckinPage.jsx              # Check-in-Scanner (PIN-geschützt)
│   │   │   └── BuchungPage.jsx              # Buchungsübersicht + Selbst-Stornierung
│   │   └── components/
│   │       ├── form/                        # Mahrenholz Formular-Schritte 1–9
│   │       └── hesse/                       # Heße Formular-Schritte 1–3
│   └── public/
│       └── favicon.png                      # BCC-Logo
└── data/
    ├── registrations.db                     # SQLite-Datenbank (nicht im Repo)
    └── backups/                             # Automatische tägliche Backups
```

## Routen-Übersicht

| Pfad                  | Beschreibung                                    |
|-----------------------|-------------------------------------------------|
| `/`                   | Startseite – Turnierauswahl                     |
| `/mahrenholz`         | Mahrenholz-Anmeldeformular                      |
| `/hesse`              | Heße Firmencup-Anmeldeformular                  |
| `/buchung/:code`      | Buchungsübersicht + Selbst-Stornierung          |
| `/checkin`            | QR-Code Check-in (PIN-geschützt, kein Login)   |
| `/login`              | Admin-Login                                     |
| `/admin/*`            | Admin-Panel (Login erforderlich)                |

## Installation & Setup

> Detaillierte Schritt-für-Schritt-Anleitung: **[INSTALLATION.md](INSTALLATION.md)**

### Voraussetzungen

- Node.js ≥ 18
- npm

### Backend

```bash
cd server
npm install
```

### Frontend

```bash
cd client
npm install
npm run build
```

### Umgebungsvariablen

Kopiere `.env.example` nach `.env` und befülle die Werte:

```bash
cp .env.example .env
```

| Variable                   | Bedeutung                              | Standard                       |
|----------------------------|----------------------------------------|--------------------------------|
| `JWT_SECRET`               | Geheimer Schlüssel für JWT-Token       | –  (Pflicht)                   |
| `ALLOWED_ORIGIN`           | Erlaubte CORS-Herkunft                 | `https://ticketing.cux-beach.de` |
| `SEED_SUPERADMIN_EMAIL`    | E-Mail des Superadmins                 | `superadmin@bcc-ticketing.de`  |
| `SEED_SUPERADMIN_PASSWORD` | Passwort des Superadmins               | – (Pflicht, kein Default)      |
| `SEED_ADMIN_EMAIL`         | E-Mail des Admins                      | `admin@bcc-ticketing.de`       |
| `SEED_ADMIN_PASSWORD`      | Passwort des Admins                    | – (Pflicht, kein Default)      |
| `SMTP_HOST`                | SMTP-Server                            | –                              |
| `SMTP_PORT`                | SMTP-Port                              | `587`                          |
| `SMTP_USER`                | SMTP-Benutzername                      | –                              |
| `SMTP_PASS`                | SMTP-Passwort                          | –                              |
| `SMTP_FROM`                | Absender-Adresse                       | –                              |
| `ADMIN_EMAIL`              | Empfänger der Admin-Benachrichtigungen | –                              |

> Die SMTP- und Zahlungseinstellungen können auch direkt im Admin-Panel unter **Einstellungen** gepflegt und in der Datenbank gespeichert werden.

> **Wichtig:** `SEED_SUPERADMIN_PASSWORD` und `SEED_ADMIN_PASSWORD` haben seit der letzten Sicherheitshärtung **keinen** Default-Wert mehr. Sind sie bei einer frischen (leeren) Datenbank nicht gesetzt, bricht der Serverstart mit einer Fehlermeldung ab, statt stillschweigend ein unsicheres Standardpasswort zu verwenden.

### Starten

```bash
cd server
node index.js
# oder mit PM2:
pm2 start index.js --name bcc-ticketing
```

Der Server läuft auf Port 3000. Im Produktionsbetrieb über Nginx (Port 443) und Cloudflare (Full SSL).

## Benutzer & Rollen

| Rolle        | Rechte                                                                       |
|--------------|------------------------------------------------------------------------------|
| `admin`      | Anmeldungen einsehen, bestätigen, stornieren, Zahlung bestätigen, CSV-Export |
| `superadmin` | Zusätzlich: Anmeldungen löschen, Passwörter ändern, alle Einstellungen       |

Beim ersten Start werden automatisch Seed-Benutzer angelegt (sofern noch keine Benutzer vorhanden sind).

## Anmeldeprozess & Status-Flow

```
pending → confirmed → payment_received → checked_in
        ↘ waitlist
        ↘ cancelled  (möglich bei pending / waitlist; durch Teilnehmer oder Admin)
```

1. **Anmeldung** einreichen → Status: `pending`, Buchungscode generiert, Bestätigungsmail + Admin-Benachrichtigung
2. **Admin bestätigt** (zweifach) → Status: `confirmed`; bei Heße: Zahlungsinfo-Mail direkt beim Bestätigen
3. **Zahlungsinfo** bei Mahrenholz: manuell über Button im Admin versendbar
4. **Admin bestätigt Zahlungseingang** (zweifach) → QR-Code-Mail an Teilnehmer
5. **Check-in vor Ort**: QR-Code scannen oder Buchungscode eingeben → PIN eingeben → eingecheckt ✅

## Buchungsübersicht (Selbst-Service)

Unter `/buchung/:code` kann jeder Teilnehmer seine Buchung einsehen:
- Status, Teams, Teamnamen, Gebühren, Zahlungs- und Check-in-Zeitpunkt
- **Selbst-Stornierung** möglich, solange Status `pending` oder `waitlist`
- Funktioniert für beide Turniere (Mahrenholz + Heße)

## Check-in-System

Die Check-in-Seite unter `/checkin` ist öffentlich erreichbar (kein Login erforderlich).

**Flow:**
1. QR-Code aus der E-Mail scannen **oder** Buchungscode manuell eingeben (`XXXX-XXXX`)
2. Buchungsdetails werden angezeigt (Name, Verein/Firma, Teams, Zahlungsstatus)
3. Klick auf „Einchecken →" öffnet PIN-Eingabe
4. PIN eingeben → Eincheck-Vorgang abgeschlossen

**Voraussetzungen für Check-in:** Status `confirmed` + Zahlungseingang bestätigt

**PIN:** Wird in der Datenbank unter dem Key `checkin_pin` gespeichert und im Admin-Panel unter **Einstellungen** gepflegt. Der PIN gilt für beide Turniere.

## Backup-System

Die Datenbank wird täglich um **02:00 Uhr** automatisch gesichert:
- Speicherort: `data/backups/registrations-YYYY-MM-DD_HH-MM.db`
- Maximal **10 Backups** werden vorgehalten, ältere werden automatisch gelöscht

## Admin-Panel

Erreichbar unter `/admin`. Bereiche:

| Bereich               | Beschreibung                                                     |
|-----------------------|------------------------------------------------------------------|
| Dashboard             | Statistiken für beide Turniere (Gesamt, Status, Umsatz)         |
| Anmeldungen           | Liste mit Suche, Statusfilter, Check-in-Filter, CSV-Export      |
| Detailansicht         | Alle Felder, Aktionsblöcke, Statusverlauf, Zahlungserinnerung, interne Notiz |
| Einstellungen         | Wartelisten + Teamkapazitäten (Mahrenholz), SMTP, Zahlungsdaten, Check-in-PIN |
| Benutzer (Superadmin) | Passwörter ändern                                               |

## E-Mail-Templates

### Mahrenholz Beach-Cup

| Typ                    | Auslöser                                   | Empfänger   |
|------------------------|--------------------------------------------|-------------|
| Anmeldebestätigung     | Anmeldung eingereicht                      | Teilnehmer  |
| Admin-Benachrichtigung | Anmeldung eingereicht                      | Admin       |
| Zahlungsinformationen  | Manuell (Button im Admin)                  | Teilnehmer  |
| Zahlungserinnerung     | Manuell (Button im Admin, bestätigt + unbezahlt) | Teilnehmer |
| QR-Code-Mail           | Zahlungseingang bestätigt                  | Teilnehmer  |
| Stornierungsbestätigung| Anmeldung storniert                        | Teilnehmer  |

### Heße Immobilien Firmencup

| Typ                    | Auslöser                                   | Empfänger   |
|------------------------|--------------------------------------------|-------------|
| Anmeldebestätigung     | Anmeldung eingereicht                      | Teilnehmer  |
| Admin-Benachrichtigung | Anmeldung eingereicht                      | Admin       |
| Zahlungsinformationen  | Admin bestätigt Anmeldung                  | Teilnehmer  |
| Zahlungserinnerung     | Manuell (Button im Admin, bestätigt + unbezahlt) | Teilnehmer |
| QR-Code-Mail           | Zahlungseingang bestätigt                  | Teilnehmer  |
| Stornierungsbestätigung| Anmeldung storniert                        | Teilnehmer  |

## Deployment (Produktion)

```
Internet → Cloudflare (Proxy, Full SSL)
         → Nginx (Port 443, self-signed cert)
         → Node.js / PM2 (nur 127.0.0.1:3000, Prozess läuft als svc-bccticket)
```

PM2-Prozessname: `bcc-ticketing`

```bash
# Build & Restart
cd /opt/bcc-ticketing/client && npm run build
pm2 restart bcc-ticketing --update-env
```

## Sicherheit

Der Produktivserver wurde im Rahmen einer Sicherheitshärtung angepasst. Zusammenfassung des aktuellen Stands:

### Infrastruktur / Host

- **Firewall (UFW):** aktiv, Default-Deny für eingehenden Traffic. Nur Port 22 (SSH), 80 und 443 sind offen. Port 3000 (Node) ist von außen nicht erreichbar.
- **Backend-Bindung:** Der Express-Server bindet ausschließlich an `127.0.0.1` (`app.listen(PORT, '127.0.0.1', ...)` in `server/index.js`) statt an `0.0.0.0` – zusätzliche Absicherung neben der Firewall.
- **Eigener Systembenutzer:** Der PM2-Prozess läuft nicht mehr als root, sondern als dedizierter, unprivilegierter Benutzer `svc-bccticket` (kein Login-Shell, kein Home-Verzeichnis). Konfiguriert über `uid`/`gid` in `/opt/ecosystem.config.js`. Das gesamte Verzeichnis `/opt/bcc-ticketing` gehört `svc-bccticket`.
- **Dateiberechtigungen:** `.env` ist `600`. Die SQLite-Datenbank und Backup-Dateien (`data/*.db`, `data/backups/*.db`) sind `640` und gehören `svc-bccticket`.
- **fail2ban:** systemweit aktiv mit einem `sshd`-Jail (Bantime 1h, Findtime 10min, maxretry 5) gegen Brute-Force-Angriffe auf SSH.
- **SSH:** `X11Forwarding` ist serverweit deaktiviert.

### Nginx

- `ssl_protocols` global auf `TLSv1.2` und `TLSv1.3` beschränkt (TLSv1/1.1 entfernt).
- `server_tokens off` global gesetzt – Nginx gibt seine Version nicht mehr preis.
- Rate Limiting: Zone `login_limit` (5 Req/min pro IP) auf `/api/login`, Zone `api_limit` (60 Req/min pro IP) auf die übrigen `/api/`-Routen.
- `location ~ /\.git { deny all; }` als zusätzliche Absicherung.
- Content-Security-Policy-Header ist gesetzt (fehlte zuvor auf dieser Site).

### Anwendungsebene

- **helmet:** `server/index.js` nutzt `helmet({ contentSecurityPolicy: false })` für Standard-Security-Header (u. a. `X-Content-Type-Options`, `X-Frame-Options`). Die CSP selbst wird bewusst auf Nginx-Ebene gesetzt, um doppelte/widersprüchliche Policies zu vermeiden.
- **Rate Limiting erweitert:** Zusätzlich zu den bestehenden spezifischen Limits (`/api/login`: 10 Req/15min, `/api/checkin` + `/api/hesse/checkin`: 60 Req/5min) gibt es nun ein globales Basis-Limit von 300 Req/15min pro IP auf `/api`. Die spezifischen Limits gelten weiterhin zusätzlich.
- **JWT_SECRET rotiert:** Der Wert in `.env` wurde durch einen neuen, zufällig generierten 128-stelligen Hex-String (`openssl rand -hex 64`) ersetzt. Alle zuvor ausgestellten Tokens sind damit ungültig geworden; alle Admin-Nutzer mussten sich neu anmelden. Eine Rotation in regelmäßigen Abständen wird empfohlen.
- **Kein unsicherer Passwort-Fallback mehr:** `seedUsers()` in `server/db.js` verwendet bei fehlenden `SEED_SUPERADMIN_PASSWORD`/`SEED_ADMIN_PASSWORD` nicht mehr das frühere Default-Passwort `changeme`. Stattdessen bricht der Serverstart bei einer frischen/leeren Datenbank mit einer Fehlermeldung ab, wenn diese Variablen nicht gesetzt sind.

### Offener Punkt

- **`SMTP_PASS` ist in der Produktiv-`.env` aktuell noch ein Platzhalter (`changeme`)** und muss vom Betreiber durch ein echtes SMTP-Passwort ersetzt werden. Da es sich um ein externes Zugangsdatum handelt, konnte es bei der Härtung nicht automatisch generiert werden.

## Lizenz

Privates Projekt – Beachsportclub Cuxhaven e.V. Alle Rechte vorbehalten.
