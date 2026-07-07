# Installationsanleitung – BCC-Ticketing

Diese Anleitung beschreibt die vollständige Installation des BCC-Ticketing-Systems auf einem Linux-Server (Ubuntu/Debian) inklusive aller Abhängigkeiten, Konfiguration und Produktiv-Deployment mit PM2 und Nginx.

---

## Inhaltsverzeichnis

1. [Systemvoraussetzungen](#1-systemvoraussetzungen)
2. [Node.js installieren](#2-nodejs-installieren)
3. [Projekt klonen](#3-projekt-klonen)
4. [Abhängigkeiten installieren](#4-abhängigkeiten-installieren)
5. [Umgebungsvariablen konfigurieren](#5-umgebungsvariablen-konfigurieren)
6. [Frontend bauen](#6-frontend-bauen)
7. [Erster Start & Seed-Benutzer](#7-erster-start--seed-benutzer)
8. [PM2 – Prozessverwaltung](#8-pm2--prozessverwaltung)
9. [Nginx – Reverse Proxy](#9-nginx--reverse-proxy)
10. [Firewall einrichten](#10-firewall-einrichten)
11. [Cloudflare (optional)](#11-cloudflare-optional)
12. [Admin-Panel einrichten](#12-admin-panel-einrichten)
13. [Updates einspielen](#13-updates-einspielen)
14. [Fehlerbehebung](#14-fehlerbehebung)

---

## 1. Systemvoraussetzungen

### Betriebssystem

Empfohlen: **Ubuntu 22.04 LTS** oder **Debian 12**. Alle Befehle sind für diese Systeme getestet.

### Mindestanforderungen

| Ressource | Minimum      | Empfohlen    |
|-----------|--------------|--------------|
| CPU       | 1 vCore      | 2 vCores     |
| RAM       | 512 MB       | 1 GB         |
| Disk      | 2 GB         | 5 GB         |
| Node.js   | ≥ 18.x       | 22.x (LTS)   |
| npm       | ≥ 9.x        | 10.x         |

### Systemabhängigkeiten

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential python3
```

> `build-essential` und `python3` werden benötigt, um das native Modul `better-sqlite3` zu kompilieren.

---

## 2. Node.js installieren

Über den offiziellen NodeSource-Installer (empfohlen für Node.js 22 LTS):

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Version prüfen:

```bash
node --version   # sollte v22.x.x ausgeben
npm --version    # sollte 10.x.x ausgeben
```

---

## 3. Projekt klonen

```bash
git clone https://github.com/melman16384/bcc-ticketing.git /opt/bcc-ticketing
cd /opt/bcc-ticketing
```

Verzeichnisstruktur nach dem Klonen:

```
/opt/bcc-ticketing/
├── server/          # Backend (Node.js + Express)
├── client/          # Frontend (React + Vite)
├── data/            # SQLite-Datenbank + Backups (wird automatisch erstellt)
├── .env.example     # Vorlage für Umgebungsvariablen
├── package.json     # Root-Skripte
└── start.sh         # Einfaches Startskript
```

---

## 4. Abhängigkeiten installieren

### Alle auf einmal (empfohlen)

```bash
cd /opt/bcc-ticketing
npm run install:all
```

Dies führt `npm install` für Backend und Frontend gleichzeitig aus.

### Alternativ: manuell

**Backend:**

```bash
cd /opt/bcc-ticketing/server
npm install
```

Installierte Backend-Pakete:

| Paket                | Version  | Zweck                                      |
|----------------------|----------|--------------------------------------------|
| `express`            | ^4.18     | HTTP-Server / REST-API                     |
| `better-sqlite3`     | ^9.4      | SQLite-Datenbank (synchron, schnell)       |
| `bcryptjs`           | ^3.0      | Passwort-Hashing                           |
| `jsonwebtoken`       | ^9.0      | JWT-Authentifizierung                      |
| `nodemailer`         | ^6.9      | E-Mail-Versand (SMTP)                      |
| `qrcode`             | ^1.5      | QR-Code-Generierung für Check-in-Mails     |
| `cors`               | ^2.8      | CORS-Middleware                            |
| `dotenv`             | ^16.4     | Laden von `.env`-Dateien                   |
| `express-rate-limit` | ^8.5      | Rate Limiting (Login, Check-in)            |
| `node-cron`          | ^4.5      | Geplante Aufgaben (tägliche DB-Backups)    |

**Frontend:**

```bash
cd /opt/bcc-ticketing/client
npm install
```

Installierte Frontend-Pakete:

| Paket                | Version  | Zweck                                      |
|----------------------|----------|--------------------------------------------|
| `react`              | ^18.3     | UI-Framework                               |
| `react-dom`          | ^18.3     | React DOM-Renderer                         |
| `react-router-dom`   | ^6.23     | Client-seitiges Routing                    |
| `jsqr`               | ^1.4      | QR-Code-Scanner (Webcam / Bild-Datei)      |
| `vite`               | ^5.2      | Build-Tool / Dev-Server                    |
| `@vitejs/plugin-react`| ^4.3     | React-Unterstützung für Vite               |
| `tailwindcss`        | ^3.4      | Utility-first CSS-Framework                |
| `postcss`            | ^8.4      | CSS-Prozessor (Tailwind-Abhängigkeit)      |
| `autoprefixer`       | ^10.4     | Vendor-Präfixe für CSS                     |

---

## 5. Umgebungsvariablen konfigurieren

```bash
cd /opt/bcc-ticketing
cp .env.example .env
nano .env
```

### Vollständige `.env` mit Erklärungen

```env
# Server-Port (Standard: 3000 – bei Nginx-Betrieb nicht ändern)
PORT=3000

# JWT-Secret — PFLICHT. Mindestens 32 zufällige Zeichen.
# Generieren: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# oder: openssl rand -hex 64
JWT_SECRET=hier-einen-sehr-langen-zufaelligen-string-eintragen

# Erlaubte CORS-Herkunft — muss exakt der Frontend-Domain entsprechen (kein Trailing-Slash)
ALLOWED_ORIGIN=https://meine-domain.de

# Seed-Benutzer — werden NUR beim ersten Start angelegt (wenn noch kein Benutzer existiert)
# Nach dem ersten Start können diese Werte geändert werden – sie haben dann keinen Effekt mehr
# PFLICHT bei einer frischen/leeren Datenbank: Fehlen diese Werte, bricht der Serverstart mit
# einer Fehlermeldung ab. Es gibt seit der letzten Sicherheitshärtung keinen Default-Fallback
# (z. B. "changeme") mehr für diese Passwörter.
SEED_SUPERADMIN_EMAIL=superadmin@meine-domain.de
SEED_SUPERADMIN_PASSWORD=sicheres-passwort-1
SEED_ADMIN_EMAIL=admin@meine-domain.de
SEED_ADMIN_PASSWORD=sicheres-passwort-2

# SMTP-Einstellungen für E-Mail-Versand
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false           # true = Port 465 (SSL), false = Port 587 (STARTTLS)
SMTP_USER=noreply@meine-domain.de
SMTP_PASS=smtp-passwort     # In Produktion: echtes SMTP-Passwort eintragen, keinen Platzhalter stehen lassen!
SMTP_FROM=BCC Ticketing <noreply@meine-domain.de>

# Empfänger der Admin-Benachrichtigungen (neue Anmeldungen)
ADMIN_EMAIL=veranstaltung@meine-domain.de
```

### JWT-Secret generieren

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# alternativ:
openssl rand -hex 64
```

Den ausgegebenen String als `JWT_SECRET` in die `.env` eintragen. Es empfiehlt sich, das Secret als Routinemaßnahme in regelmäßigen Abständen zu rotieren – dadurch werden alle zuvor ausgestellten JWTs ungültig und alle Admin-Nutzer müssen sich neu anmelden.

> **Wichtig:** Die `.env`-Datei niemals in Git einchecken. Sie ist über `.gitignore` bereits ausgeschlossen.

> **Wichtig – SMTP_PASS:** Dieser Wert muss in Produktion ein echtes, gültiges SMTP-Passwort sein. Ein Platzhalter wie `changeme` darf nicht im Produktivbetrieb stehen bleiben, da sonst kein E-Mail-Versand funktioniert.

---

## 6. Frontend bauen

```bash
cd /opt/bcc-ticketing/client
npm run build
```

Der Build-Output landet in `client/dist/` und wird vom Express-Server automatisch als statische Dateien ausgeliefert.

Oder vom Root-Verzeichnis aus:

```bash
cd /opt/bcc-ticketing
npm run build
```

---

## 7. Erster Start & Seed-Benutzer

```bash
cd /opt/bcc-ticketing
node server/index.js
```

Beim ersten Start:
- Wird die SQLite-Datenbank unter `data/registrations.db` automatisch erstellt
- Werden alle Tabellen und Standardeinstellungen angelegt
- Werden die Seed-Benutzer aus der `.env` angelegt (nur wenn noch keine Benutzer existieren)

> **Wichtig:** Sind bei einer frischen/leeren Datenbank `SEED_SUPERADMIN_PASSWORD` oder `SEED_ADMIN_PASSWORD` nicht in der `.env` gesetzt, bricht `seedUsers()` (`server/db.js`) den Serverstart mit einer Fehlermeldung ab. Es gibt keinen stillschweigenden Rückfall mehr auf ein Standardpasswort wie `changeme` – die Variablen müssen vor dem ersten Start explizit gesetzt werden.

**Ausgabe sollte in etwa so aussehen:**

```
[DB] Seed-Benutzer angelegt: superadmin@meine-domain.de (superadmin), admin@meine-domain.de (admin)
[Backup] Tägliches Backup geplant (02:00 Uhr, max. 10 Dateien)
BCC-Ticketing läuft auf http://localhost:3000
Admin-Panel: http://localhost:3000/login
```

Mit `Ctrl+C` beenden und mit PM2 fortfahren.

---

## 8. PM2 – Prozessverwaltung

PM2 sorgt dafür, dass der Server nach einem Absturz oder Neustart automatisch wieder startet.

> **Produktivbetrieb – non-root:** Auf dem gehärteten Produktivserver läuft der bcc-ticketing-Prozess **nicht als root**. Dafür wurde ein dedizierter, unprivilegierter Systembenutzer angelegt:
> ```bash
> sudo useradd --system --no-create-home --shell /usr/sbin/nologin svc-bccticket
> sudo chown -R svc-bccticket:svc-bccticket /opt/bcc-ticketing
> ```
> PM2 selbst läuft weiterhin als root (bzw. unter dem PM2-Systembenutzer), gibt die Rechte für diesen einen Prozess aber über die Optionen `uid`/`gid` in `/opt/ecosystem.config.js` an `svc-bccticket` ab:
> ```js
> // Auszug aus /opt/ecosystem.config.js
> {
>   name: 'bcc-ticketing',
>   script: '/opt/bcc-ticketing/server/index.js',
>   uid: 'svc-bccticket',
>   gid: 'svc-bccticket',
>   // ...weitere Optionen
> }
> ```
> Zusätzlich bindet der Express-Server ausschließlich an `127.0.0.1` (`app.listen(PORT, '127.0.0.1', ...)` in `server/index.js`) statt an `0.0.0.0` – der Prozess ist also selbst ohne Firewall nicht direkt aus dem Internet erreichbar, sondern nur über den Nginx-Reverse-Proxy (siehe Abschnitt 9).

### PM2 installieren

```bash
sudo npm install -g pm2
```

### Server starten

```bash
cd /opt/bcc-ticketing
pm2 start server/index.js --name bcc-ticketing
```

Im Produktivbetrieb erfolgt der Start stattdessen über die zentrale `/opt/ecosystem.config.js` (siehe Hinweis oben), damit `uid`/`gid` gesetzt werden:

```bash
pm2 start /opt/ecosystem.config.js --only bcc-ticketing
```

### Autostart beim Systemstart einrichten

```bash
pm2 startup
# Den ausgegebenen Befehl (sudo env PATH=...) kopieren und ausführen
pm2 save
```

### Nützliche PM2-Befehle

```bash
pm2 status                        # Alle laufenden Prozesse anzeigen
pm2 logs bcc-ticketing            # Live-Log anzeigen
pm2 logs bcc-ticketing --lines 100 # Letzte 100 Zeilen anzeigen
pm2 restart bcc-ticketing         # Server neu starten
pm2 restart bcc-ticketing --update-env  # Nach .env-Änderungen neu starten
pm2 stop bcc-ticketing            # Server stoppen
pm2 delete bcc-ticketing          # Prozess aus PM2 entfernen
```

---

## 9. Nginx – Reverse Proxy

Nginx nimmt HTTPS-Anfragen entgegen und leitet sie an den Node.js-Server (Port 3000) weiter.

### Nginx installieren

```bash
sudo apt install -y nginx
```

### Selbstsigniertes SSL-Zertifikat erstellen

> Wenn Cloudflare vorgeschaltet ist (empfohlen), reicht ein selbstsigniertes Zertifikat – Cloudflare übernimmt das öffentliche HTTPS.

```bash
sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/ssl/private/bcc-ticketing.key \
  -out /etc/ssl/certs/bcc-ticketing.crt \
  -subj "/CN=bcc-ticketing"
```

### Nginx-Konfiguration erstellen

```bash
sudo nano /etc/nginx/sites-available/bcc-ticketing
```

Inhalt:

```nginx
server {
    listen 80;
    server_name meine-domain.de;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name meine-domain.de;

    ssl_certificate     /etc/ssl/certs/bcc-ticketing.crt;
    ssl_certificate_key /etc/ssl/private/bcc-ticketing.key;

    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    client_max_body_size 1M;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Konfiguration aktivieren

```bash
sudo ln -s /etc/nginx/sites-available/bcc-ticketing /etc/nginx/sites-enabled/
sudo nginx -t          # Konfiguration prüfen
sudo systemctl reload nginx
```

---

## 10. Firewall einrichten

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'   # Ports 80 und 443
sudo ufw enable
sudo ufw status
```

> Port 3000 (Node.js) muss **nicht** geöffnet werden – der Zugriff erfolgt ausschließlich über Nginx.

---

## 11. Cloudflare (optional)

Cloudflare wird als vorgelagerter Proxy empfohlen – er übernimmt öffentliches SSL und schützt die Server-IP.

### Setup

1. Domain bei Cloudflare hinzufügen und Nameserver umstellen
2. DNS-Eintrag setzen: `A meine-domain.de → Server-IP` (Proxy-Status: **Proxied**/orange Wolke)
3. SSL/TLS-Modus in Cloudflare auf **Full** setzen (nicht „Full (strict)", da das Zertifikat selbstsigniert ist)

### Ergebnis

```
Nutzer → Cloudflare (öffentliches HTTPS) → Nginx (selbstsigniertes Zertifikat) → Node.js (Port 3000)
```

---

## 12. Admin-Panel einrichten

Nach dem ersten Start unter `https://meine-domain.de/login` anmelden.

### Empfohlene Erstkonfiguration (als Superadmin)

1. **Einstellungen → SMTP** – E-Mail-Server eintragen und Testmail senden
2. **Einstellungen → Zahlungsdaten** – IBAN, BIC, Bank, Zahlungsfrist, Stornohinweis eintragen
3. **Einstellungen → Check-in-PIN** – PIN für das Check-in-Personal setzen
4. **Einstellungen → Warteliste** – Kategorien nach Bedarf manuell auf Warteliste schalten und/oder maximale Teamanzahl pro Kategorie setzen (0 = unbegrenzt)
5. **Benutzer** – Passwörter der Seed-Benutzer ändern

### Passwort nach dem ersten Start ändern

Im Admin-Panel unter **Benutzer** (nur Superadmin) können die Passwörter beider Accounts geändert werden.

---

## 13. Updates einspielen

```bash
cd /opt/bcc-ticketing

# 1. Neuen Code holen
git pull origin main

# 2. Abhängigkeiten aktualisieren (falls package.json geändert)
npm run install:all

# 3. Frontend neu bauen
npm run build

# 4. Server neu starten
pm2 restart bcc-ticketing --update-env
```

> Die Datenbank bleibt bei Updates vollständig erhalten. Es gibt kein Migrations-Risiko, da neue Spalten über `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`-Blöcke in `db.js` nachgezogen werden.

---

## 14. Fehlerbehebung

### Server startet nicht

```bash
pm2 logs bcc-ticketing --lines 50
```

Häufige Ursachen:

| Fehlermeldung | Lösung |
|---|---|
| `JWT_SECRET nicht konfiguriert` | `.env` prüfen, `JWT_SECRET` setzen |
| `Cannot find module 'better-sqlite3'` | `npm install` im `server/`-Verzeichnis erneut ausführen |
| `EACCES: permission denied` auf `data/` | `sudo chown -R $USER /opt/bcc-ticketing/data` |
| `Port 3000 already in use` | `sudo lsof -i :3000` und den Prozess beenden |

### Frontend lädt nicht (404 auf allen Routen)

Das `client/dist/`-Verzeichnis fehlt oder ist leer. Frontend neu bauen:

```bash
cd /opt/bcc-ticketing/client && npm run build
pm2 restart bcc-ticketing
```

### E-Mails werden nicht gesendet

1. SMTP-Einstellungen im Admin-Panel prüfen (**Einstellungen → SMTP**)
2. Server-Log auf Mailer-Fehler prüfen: `pm2 logs bcc-ticketing | grep Mailer`
3. Testmail über den Admin-Panel-Button senden
4. Firewall: Port 587 (STARTTLS) oder 465 (SSL) muss ausgehend erlaubt sein

```bash
sudo ufw allow out 587/tcp
sudo ufw allow out 465/tcp
```

### `better-sqlite3` lässt sich nicht kompilieren

```bash
sudo apt install -y build-essential python3
cd /opt/bcc-ticketing/server
npm rebuild better-sqlite3
```

### Nginx-Fehler 502 Bad Gateway

Der Node.js-Server läuft nicht. Status prüfen:

```bash
pm2 status
pm2 restart bcc-ticketing
```

### Datenbank-Backup manuell auslösen

```bash
node -e "require('./server/backup').runBackup()"
```

Die Backup-Datei liegt danach in `data/backups/`.

---

## Verzeichnisrechte (Produktion)

Auf dem gehärteten Produktivserver läuft der Prozess unter dem dedizierten User `svc-bccticket` (siehe Abschnitt 8), dem auch das gesamte Verzeichnis gehört:

```bash
sudo chown -R svc-bccticket:svc-bccticket /opt/bcc-ticketing
```

Empfohlene Dateiberechtigungen:

```bash
chmod 600 /opt/bcc-ticketing/.env
chmod 640 /opt/bcc-ticketing/data/*.db
chmod 640 /opt/bcc-ticketing/data/backups/*.db
```

Den PM2-Prozess unter dem eigenen User ausführen (empfohlen, siehe Abschnitt 8 für die Konfiguration über `uid`/`gid` in `/opt/ecosystem.config.js`):

```bash
pm2 start /opt/ecosystem.config.js --only bcc-ticketing
```

---

## Kurzübersicht: Befehle nach der Installation

```bash
# Status
pm2 status

# Logs (live)
pm2 logs bcc-ticketing

# Nach Code-Update
git pull && npm run install:all && npm run build && pm2 restart bcc-ticketing --update-env

# Nginx neu laden (nach Konfigurationsänderung)
sudo systemctl reload nginx

# Manuelles Backup
node -e "require('./server/backup').runBackup()"
```
