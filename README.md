# 34. Mahrenholz Beach-Cup 2026 – Ticketing & Anmeldesystem

Vollständiges Anmelde- und Check-in-System für den Mahrenholz Beach-Cup 2026 des Beachsportclub Cuxhaven e.V.

## Features

- **Mehrstufiges Anmeldeformular** (5 Schritte) für Turnierteams
- **Kategorien**: King of the Court (männlich / weiblich / mixed), Beach-Fun A & B
- **Wartelisten-Verwaltung** pro Kategorie (über Admin-Panel steuerbar)
- **Buchungscode** (`XXXX-XXXX`) pro Anmeldung zur eindeutigen Identifikation
- **Admin-Panel** mit Dashboard, Filterlisten, Detailansicht
- **Zweistufige Bestätigungen** für alle kritischen Aktionen (bestätigen, stornieren, zahlung, löschen)
- **5 automatische E-Mails**: Anmeldebestätigung, Admin-Benachrichtigung, Zahlungsinformationen, QR-Code-Mail, Stornierungsbestätigung
- **QR-Code Check-in** mit PIN-Schutz vor Ort
- **CSV-Export** aller Anmeldungen
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
| Deployment | PM2 + Nginx Reverse Proxy + Cloudflare       |

## Projektstruktur

```
bcc-ticketing/
├── server/
│   ├── index.js          # Express-Server, CORS, statische Dateien
│   ├── routes.js         # Alle API-Routen
│   ├── db.js             # SQLite-Setup, Migrationen, Seed-User
│   └── mailer.js         # E-Mail-Templates (5 Typen)
├── client/
│   ├── src/
│   │   ├── App.jsx                    # React Router Setup
│   │   ├── pages/
│   │   │   ├── RegistrationPage.jsx   # Öffentliches Anmeldeformular
│   │   │   ├── AdminPage.jsx          # Admin-Panel (Dashboard, Liste, Detail, Einstellungen)
│   │   │   ├── LoginPage.jsx          # Login
│   │   │   └── CheckinPage.jsx        # Check-in-Scanner (öffentlich, PIN-geschützt)
│   │   └── components/form/           # Formular-Schritte 1–5
│   └── public/
│       └── favicon.png               # BCC-Logo (rund)
└── data/
    └── registrations.db              # SQLite-Datenbank (nicht im Repo)
```

## Installation & Setup

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

### Starten

```bash
cd server
node index.js
# oder mit PM2:
pm2 start index.js --name bcc-ticketing
```

Der Server läuft auf Port 3000. Im Produktionsbetrieb wird er über Nginx (Port 443) und Cloudflare (Full SSL) betrieben.

## Umgebungsvariablen

Alle Einstellungen können alternativ als Umgebungsvariablen gesetzt werden (werden durch DB-Einstellungen überschrieben):

| Variable              | Bedeutung                        | Standard                              |
|-----------------------|----------------------------------|---------------------------------------|
| `SEED_SUPERADMIN_EMAIL` | E-Mail des Superadmins          | `superadmin@bcc-ticketing.de`         |
| `SEED_SUPERADMIN_PASSWORD` | Passwort des Superadmins   | `SuperAdmin2026!`                     |
| `SEED_ADMIN_EMAIL`    | E-Mail des Admins                | `admin@bcc-ticketing.de`              |
| `SEED_ADMIN_PASSWORD` | Passwort des Admins              | `Admin2026!`                          |
| `SMTP_HOST`           | SMTP-Server                      | –                                     |
| `SMTP_PORT`           | SMTP-Port                        | `587`                                 |
| `SMTP_USER`           | SMTP-Benutzername                | –                                     |
| `SMTP_PASS`           | SMTP-Passwort                    | –                                     |
| `SMTP_FROM`           | Absender-Adresse                 | `Beachsportclub Cuxhaven e.V. <...>`  |
| `ADMIN_EMAIL`         | Empfänger der Admin-Benachrichtigungen | `ruediger.sauer@cux-beach.de`  |

> Die meisten Einstellungen können auch direkt im Admin-Panel unter **Einstellungen → SMTP** und **Zahlungsinformationen** gepflegt werden und werden in der Datenbank gespeichert.

## Benutzer & Rollen

Das System kennt zwei Rollen:

| Rolle        | Rechte                                                                 |
|--------------|------------------------------------------------------------------------|
| `admin`      | Anmeldungen einsehen, bestätigen, stornieren, Zahlung bestätigen       |
| `superadmin` | Zusätzlich: Anmeldungen löschen, Passwörter ändern, alle Einstellungen |

Beim ersten Start werden automatisch Seed-Benutzer angelegt (sofern noch keine Benutzer vorhanden sind).

## Anmeldeprozess & Status-Flow

```
pending → confirmed → [payment_received] → [checked_in]
        ↘ waitlist
        ↘ cancelled  (jederzeit außer nach Bestätigung)
```

1. **Anmeldung** einreichen → Status: `pending`, Buchungscode generiert, Bestätigungsmail + Admin-Benachrichtigung
2. **Admin bestätigt** (zweifach) → Status: `confirmed`, Datum gesperrt
3. **Zahlungsinformationen** werden auf Wunsch per Mail verschickt
4. **Admin bestätigt Zahlungseingang** (zweifach) → QR-Code-Mail an Teilnehmer
5. **Check-in vor Ort**: QR-Code scannen oder Buchungscode eingeben → PIN eingeben → eingecheckt ✅

## Check-in-System

Die Check-in-Seite ist unter `/checkin` öffentlich erreichbar (kein Login erforderlich).

**Flow:**
1. QR-Code aus der E-Mail scannen **oder** Buchungscode manuell eingeben (`XXXX-XXXX`)
2. Buchungsdetails werden angezeigt (Name, Verein, Teams, Zahlungsstatus)
3. Klick auf „Einchecken →" öffnet PIN-Eingabe
4. PIN eingeben → Eincheck-Vorgang abgeschlossen

**PIN:** Wird in den Admin-Einstellungen unter dem Key `checkin_pin` in der Datenbank gespeichert. Standard: `2005`.

Sicherheitshinweise:
- Der QR-Code kodiert die URL `https://[domain]/checkin?code=XXXX-XXXX`
- Der PIN ist nur dem Check-in-Personal bekannt
- Bereits eingecheckte Teilnehmer werden beim erneuten Scan als „bereits eingecheckt" markiert
- Einchecken ist nur möglich bei Status `confirmed` + bestätigtem Zahlungseingang

## Admin-Panel

Erreichbar unter `/admin`. Bereiche:

| Bereich             | Beschreibung                                                   |
|---------------------|----------------------------------------------------------------|
| Dashboard           | Statistiken (Gesamt, Ausstehend, Bestätigt, Eingecheckt, etc.) |
| Anmeldungen         | Vollständige Liste mit Suche, Statusfilter, Check-in-Filter    |
| Detailansicht       | Alle Felder, Aktionsblöcke, Check-in-Status                    |
| Einstellungen       | Wartelisten, SMTP, Zahlungsinformationen                       |
| Benutzer (Superadmin) | Passwörter ändern                                            |

## E-Mail-Templates

| Typ                     | Auslöser                          | Empfänger          |
|-------------------------|-----------------------------------|--------------------|
| Anmeldebestätigung      | Anmeldung eingereicht             | Teilnehmer         |
| Admin-Benachrichtigung  | Anmeldung eingereicht             | Admin-E-Mail       |
| Zahlungsinformationen   | Manuell (Button im Admin)         | Teilnehmer         |
| QR-Code-Mail            | Zahlungseingang bestätigt         | Teilnehmer         |
| Stornierungsbestätigung | Anmeldung storniert               | Teilnehmer         |

## Deployment (Produktion)

```
Internet → Cloudflare (Proxy, Full SSL)
         → Nginx (Port 443, self-signed cert)
         → Node.js / PM2 (Port 3000)
```

PM2-Prozessname: `bcc-ticketing` (ID: 6)

```bash
# Build & Restart
cd /opt/bcc-ticketing/client && npm run build
pm2 restart bcc-ticketing --update-env
```

## Lizenz

Privates Projekt – Beachsportclub Cuxhaven e.V. Alle Rechte vorbehalten.
