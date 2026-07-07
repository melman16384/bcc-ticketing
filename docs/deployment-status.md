# Deployment-Status — BCC-Ticketing

> Stand: 5. Juli 2026 · Server: luwilab-VPS (Ubuntu 24.04)

---

## Übersicht

| Punkt              | Wert                                                            |
|---------------------|------------------------------------------------------------------|
| Status              | **Live**, produktiv erreichbar                                    |
| URL                 | https://ticketing.cux-beach.de                                   |
| Verzeichnis         | `/opt/bcc-ticketing`                                              |
| Prozessverwaltung   | PM2, App-Name `bcc-ticketing`, Port `3003` (intern)               |
| Reverse Proxy       | Nginx (`/etc/nginx/sites-available/ticketing.cux-beach.de`)       |
| TLS-Zertifikat      | Let's Encrypt, gültig bis **3. Oktober 2026**, Auto-Renewal aktiv (`certbot.timer`) |
| Datenbank           | SQLite, `/opt/bcc-ticketing/data/registrations.db`                |
| Backups             | Täglich 02:00 Uhr nach `/opt/bcc-ticketing/data/backups/` (max. 10 Dateien) |

---

## Was funktioniert

- Anmeldeformulare (Mahrenholz + Heße Firmencup), Buchungsübersicht, Admin-Panel, Check-in erreichbar unter obiger URL
- HTTP → HTTPS Redirect aktiv
- PM2 persistiert Prozessliste (`pm2 save`) — übersteht Server-Neustart
- Tägliche DB-Backups laufen automatisch

## Was noch offen ist

| Punkt | Status | Nächster Schritt |
|-------|--------|-------------------|
| SMTP / E-Mail-Versand | ⚠️ Platzhalter-Zugangsdaten in `.env`, Mailversand schlägt aktuell fehl | Echte SMTP-Zugangsdaten im Admin-Panel unter **Einstellungen → SMTP** eintragen und Testmail senden |
| Zahlungsdaten | ⚠️ nicht konfiguriert | IBAN, BIC, Bank, Zahlungsfrist unter **Einstellungen → Zahlungsdaten** |
| Check-in-PIN | ⚠️ nicht gesetzt | Unter **Einstellungen → Check-in-PIN** vergeben |
| Wartelisten-Limits | ⚠️ nicht gesetzt (0 = unbegrenzt) | Pro Kategorie maximale Teamanzahl festlegen, falls gewünscht |
| Seed-Passwörter | ⚠️ noch die generierten Zufallspasswörter aktiv | Im Admin-Panel unter **Benutzer** ändern (nur Superadmin) |

## Zugangsdaten

Liegen (chmod 600) in `/root/.bcc-ticketing-credentials.txt` auf dem Server. Accounts:

- Superadmin: `superadmin@cux-beach.de`
- Admin: `admin@cux-beach.de`

## Konfiguration

- `.env` liegt in `/opt/bcc-ticketing/.env` (chmod 600, nicht in Git)
- `JWT_SECRET` wurde zufällig generiert (48 Byte, hex)
- `ALLOWED_ORIGIN=https://ticketing.cux-beach.de`

## Nützliche Befehle

```bash
pm2 status
pm2 logs bcc-ticketing
pm2 restart bcc-ticketing --update-env   # nach .env-Änderungen

# Update einspielen
cd /opt/bcc-ticketing
git pull origin main
npm run install:all
npm run build
pm2 restart bcc-ticketing --update-env

# Manuelles DB-Backup
node -e "require('./server/backup').runBackup()"

# Zertifikatsstatus prüfen
certbot certificates
```

## Port-Belegung auf diesem Server (Kontext)

| Port | App           |
|------|----------------|
| 3001 | visitor-mgmt   |
| 3002 | placard (room-booking) |
| 3003 | bcc-ticketing  |
