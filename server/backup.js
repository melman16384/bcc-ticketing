const fs   = require('fs');
const path = require('path');
const cron = require('node-cron');

const DB_PATH     = path.join(__dirname, '..', 'data', 'registrations.db');
const BACKUP_DIR  = path.join(__dirname, '..', 'data', 'backups');
const MAX_BACKUPS = 10;

function runBackup() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

    const ts   = new Date().toISOString().replace('T', '_').slice(0, 16).replace(':', '-');
    const dest = path.join(BACKUP_DIR, `registrations-${ts}.db`);
    fs.copyFileSync(DB_PATH, dest);
    console.log(`[Backup] ✓ ${path.basename(dest)}`);

    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith('registrations-') && f.endsWith('.db'))
      .sort()
      .reverse();

    files.slice(MAX_BACKUPS).forEach((f) => {
      fs.unlinkSync(path.join(BACKUP_DIR, f));
      console.log(`[Backup] Altes Backup gelöscht: ${f}`);
    });
  } catch (e) {
    console.error('[Backup] Fehler:', e.message);
  }
}

// Täglich um 02:00 Uhr
cron.schedule('0 2 * * *', runBackup);

console.log('[Backup] Tägliches Backup geplant (02:00 Uhr, max. 10 Dateien)');

module.exports = { runBackup };
