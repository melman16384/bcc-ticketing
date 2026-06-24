const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const { getSettings } = require('./db');

function buildTransporter() {
  const s = getSettings();
  const host = s.smtp_host || process.env.SMTP_HOST || '';
  const pass = s.smtp_pass || process.env.SMTP_PASS || '';
  const user = s.smtp_user || process.env.SMTP_USER || '';
  const port = parseInt(s.smtp_port || process.env.SMTP_PORT || '587');
  const secure = (s.smtp_secure || process.env.SMTP_SECURE || 'false') === 'true';
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
}

function getFrom() {
  const s = getSettings();
  return s.smtp_from || process.env.SMTP_FROM || '';
}

function getAdminEmail() {
  const s = getSettings();
  return s.admin_email || process.env.ADMIN_EMAIL || '';
}

function getPayment() {
  const s = getSettings();
  return {
    empfaenger:     s.payment_empfaenger     || 'Beachsportclub Cuxhaven e.V.',
    iban:           s.payment_iban           || '(IBAN nicht hinterlegt)',
    bic:            s.payment_bic            || '(BIC nicht hinterlegt)',
    bank:           s.payment_bank           || '',
    frist:          s.payment_frist          || '4 Wochen vor Turnierbeginn',
    storno_hinweis: s.payment_storno_hinweis || '',
  };
}


const fmt = (n) => Number(n || 0).toFixed(2).replace('.', ',') + ' €';

// ── HTML building blocks ──────────────────────────────────────────────────────

const COLORS = {
  bg:      '#f4f1e8',
  card:    '#ffffff',
  border:  '#e8e2d2',
  header:  '#e5c17a',
  ocean:   '#24638a',
  ocean2:  '#1d4f70',
  text:    '#3d3728',
  muted:   '#96896e',
  label:   '#7a6e54',
  light:   '#fafaf5',
  row_alt: '#f8f5ee',
};

function wrap(content) {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${COLORS.text}">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};padding:32px 16px">
  <tr><td align="center">
    <table width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;width:100%">

      <!-- Card -->
      <tr><td style="background:${COLORS.card};border-radius:16px;border:1px solid ${COLORS.border};overflow:hidden">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">

          <!-- Header bar -->
          <tr>
            <td style="background:${COLORS.header};padding:24px 32px;border-radius:16px 16px 0 0">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td><img src="https://cux-beach.de/wp-content/uploads/2023/10/BC-Banner-no-bg-600-200-1.png" alt="Beachsportclub Cuxhaven" height="44" style="display:block"></td>
              </tr></table>
            </td>
          </tr>

          <!-- Body -->
          <tr><td style="padding:32px">${content}</td></tr>

          <!-- Footer -->
          <tr>
            <td style="background:${COLORS.light};border-top:1px solid ${COLORS.border};padding:16px 32px;border-radius:0 0 16px 16px">
              <p style="margin:0;font-size:12px;color:${COLORS.muted};line-height:1.6">
                Beachsportclub Cuxhaven e.V. &nbsp;·&nbsp;
                <a href="https://cux-beach.de" style="color:${COLORS.ocean};text-decoration:none">cux-beach.de</a>
                &nbsp;·&nbsp; <a href="https://whatsapp.com/channel/0029VahAnnyFy72Hr1IMDU3V" style="color:${COLORS.ocean};text-decoration:none">WhatsApp-Kanal</a>
              </p>
            </td>
          </tr>

        </table>
      </td></tr>
      <!-- /Card -->

    </table>
  </td></tr>
</table>
</body></html>`;
}

const BASE_URL = process.env.BASE_URL || 'https://ticketing.cux-beach.de';

function stornoBox(bookingCode) {
  const url = `${BASE_URL}/buchung/${bookingCode}`;
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0">
      <tr><td style="background:#fef9f0;border:1px solid #fde68a;border-radius:8px;padding:14px 16px">
        <p style="margin:0 0 6px;font-size:13px;color:#92400e;font-weight:bold">Buchungsübersicht & Stornierung</p>
        <p style="margin:0 0 10px;font-size:13px;color:#a16207">Über folgenden Link können Sie Ihre Buchung einsehen oder stornieren (solange noch nicht bestätigt):</p>
        <a href="${url}" style="display:inline-block;background:#24638a;color:#fff;text-decoration:none;font-size:13px;font-weight:bold;padding:8px 18px;border-radius:6px">${url}</a>
      </td></tr>
    </table>`;
}

// Section heading
function sectionHead(text) {
  return `<p style="margin:24px 0 8px;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:.08em;color:${COLORS.muted};border-bottom:1px solid ${COLORS.border};padding-bottom:6px">${text}</p>`;
}

// Two-column key/value table rows
function kv(rows) {
  const trs = rows
    .filter(([, v]) => v != null && v !== '' && v !== 0 && v !== '0')
    .map(([label, value], i) =>
      `<tr style="background:${i % 2 === 0 ? COLORS.card : COLORS.row_alt}">
        <td style="padding:8px 12px 8px 0;width:180px;vertical-align:top;font-size:13px;color:${COLORS.label};font-weight:bold;white-space:nowrap">${label}</td>
        <td style="padding:8px 0;vertical-align:top;font-size:13px;color:${COLORS.text}">${value}</td>
      </tr>`
    ).join('');
  return trs ? `<table width="100%" cellpadding="0" cellspacing="0" border="0">${trs}</table>` : '';
}

// Booking code badge
function bookingBadge(code) {
  if (!code) return '';
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:16px 0">
    <tr>
      <td style="background:${COLORS.light};border:1px solid ${COLORS.border};border-radius:8px;padding:10px 20px">
        <span style="font-size:12px;color:${COLORS.muted};font-weight:bold;text-transform:uppercase;letter-spacing:.06em">Buchungscode&nbsp;&nbsp;</span>
        <span style="font-size:18px;font-weight:bold;color:${COLORS.ocean2};letter-spacing:.15em;font-family:Courier New,monospace">${code}</span>
      </td>
    </tr>
  </table>`;
}

// Team names per category
function teamsBlock(reg) {
  const cats = [
    { label: 'King of the Court – Männlich', count: reg.kotc_maennlich,  names: reg.names_kotc_maennlich },
    { label: 'King of the Court – Weiblich', count: reg.kotc_weiblich,   names: reg.names_kotc_weiblich  },
    { label: 'King of the Court – Mixed',    count: reg.kotc_mixed,      names: reg.names_kotc_mixed     },
    { label: 'Beach-Fun A',                  count: reg.beach_fun_a,     names: reg.names_beach_fun_a    },
    { label: 'Beach-Fun B',                  count: reg.beach_fun_b,     names: reg.names_beach_fun_b    },
  ].filter((c) => c.count > 0);

  if (!cats.length) return '';

  const blocks = cats.map((c) => {
    const lines = (c.names || '').split('\n').filter(Boolean);
    const rows = Array.from({ length: c.count }, (_, i) => {
      const name = lines[i] || '—';
      return `<tr>
        <td style="padding:6px 12px;vertical-align:top;width:28px;font-size:13px;color:${COLORS.muted};font-weight:bold">${i + 1}.</td>
        <td style="padding:6px 0;font-size:13px;color:${COLORS.text}">${name}</td>
      </tr>`;
    }).join('');

    return `<p style="margin:16px 0 6px;font-size:13px;font-weight:bold;color:${COLORS.ocean2}">${c.label} <span style="font-weight:normal;color:${COLORS.muted}">(${c.count} ${c.count === 1 ? 'Team' : 'Teams'})</span></p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.light};border:1px solid ${COLORS.border};border-radius:8px">${rows}</table>`;
  });

  return sectionHead('Angemeldete Teams') + blocks.join('');
}

// Fee summary box
function feesBox(reg) {
  const rows = [
    ['Mannschaftsgebühren', fmt(reg.gebuehr_mannschaft)],
    ['Teilnehmergebühren',  fmt(reg.gebuehr_teilnehmer)],
    ['PKW-Stellplätze',     fmt(reg.gebuehr_pkw)],
    ['Frühstücksgebühren',  fmt(reg.gebuehr_fruehstueck)],
  ].filter(([, v]) => v !== '0,00 €');

  const feeRows = rows.map(([l, v]) =>
    `<tr>
      <td style="padding:6px 0;font-size:13px;color:${COLORS.label}">${l}</td>
      <td style="padding:6px 0;font-size:13px;color:${COLORS.text};text-align:right">${v}</td>
    </tr>`
  ).join('');

  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.light};border:1px solid ${COLORS.border};border-radius:8px;padding:0">
    <tr><td style="padding:12px 16px">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${feeRows}
        <tr><td colspan="2" style="border-top:1px solid ${COLORS.border};padding-top:8px;margin-top:4px"></td></tr>
        <tr>
          <td style="padding:6px 0;font-size:15px;font-weight:bold;color:${COLORS.ocean2}">Gesamtbetrag</td>
          <td style="padding:6px 0;font-size:15px;font-weight:bold;color:${COLORS.ocean2};text-align:right">${fmt(reg.gebuehr_gesamt)}</td>
        </tr>
      </table>
    </td></tr>
  </table>`;
}

async function send(to, subject, html) {
  const t = buildTransporter();
  if (!t) {
    console.log(`[Mailer] SMTP nicht konfiguriert — ${subject} → ${to} (nicht gesendet)`);
    return;
  }
  await t.sendMail({ from: getFrom(), to, subject, html });
  console.log(`[Mailer] ✓ ${subject} → ${to}`);
}

// ── E-Mail 1: Eingangsbestätigung an Anmelder ─────────────────────────────────
async function sendRegistrationConfirmation(reg) {
  const waitlistNote = reg.auf_warteliste
    ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0">
        <tr><td style="background:#fff7ed;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;font-size:13px;color:#92400e">
          <strong>Warteliste:</strong> Eine oder mehrere Ihrer Kategorien sind derzeit ausgebucht. Sie wurden auf die Warteliste gesetzt und werden benachrichtigt, sobald ein Platz frei wird.
        </td></tr>
      </table>`
    : `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0">
        <tr><td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;font-size:13px;color:#166534">
          Ihre Anmeldung ist eingegangen und wird geprüft. Nach der Bestätigung erhalten Sie die Zahlungsinformationen per E-Mail.
        </td></tr>
      </table>`;

  const subject = `Anmeldebestätigung – Mahrenholz Beach-Cup 2026 [${reg.booking_code || reg.id}]`;

  await send(reg.email, subject, wrap(`
    <h2 style="margin:0 0 4px;font-size:22px;color:${COLORS.ocean2}">Anmeldebestätigung</h2>
    <p style="margin:0 0 20px;font-size:14px;color:${COLORS.muted}">34. Mahrenholz Beach-Cup 2026 · Beachsportclub Cuxhaven e.V.</p>

    <p style="margin:0 0 8px">Guten Tag ${reg.vorname} ${reg.nachname},</p>
    <p style="margin:0 0 16px">vielen Dank für Ihre Anmeldung zum Mahrenholz Beach-Cup 2026. Bitte bewahren Sie Ihren Buchungscode auf.</p>

    ${bookingBadge(reg.booking_code)}
    ${waitlistNote}

    ${sectionHead('Ihre Angaben')}
    ${kv([
      ['Verein',    reg.vereinsname],
      ['Name',      `${reg.vorname} ${reg.nachname}`],
      ['Adresse',   `${reg.strasse}, ${reg.plz} ${reg.ort}`],
      ['E-Mail',    reg.email],
      ['Telefon',   reg.telefon],
    ])}

    ${teamsBlock(reg)}

    ${sectionHead('Gebühren')}
    ${feesBox(reg)}

    ${stornoBox(reg.booking_code)}

    <p style="margin:24px 0 0;font-size:14px">Mit sportlichen Grüßen<br><strong>Rüdiger Sauer</strong><br><span style="color:${COLORS.muted}">Turnierleitung · Mahrenholz Beach-Cup</span></p>
  `));
}

// ── E-Mail 2: Admin-Benachrichtigung ──────────────────────────────────────────
async function sendAdminNotification(reg) {
  const subject = `Neue Anmeldung #${reg.id} – ${reg.nachname}, ${reg.vorname}${reg.vereinsname ? ' / ' + reg.vereinsname : ''}`;

  await send(getAdminEmail(), subject, wrap(`
    <h2 style="margin:0 0 4px;font-size:22px;color:${COLORS.ocean2}">Neue Anmeldung #${reg.id}</h2>
    <p style="margin:0 0 20px;font-size:14px;color:${COLORS.muted}">Eingegangen am ${new Date().toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' })}</p>

    ${reg.booking_code ? bookingBadge(reg.booking_code) : ''}
    ${reg.auf_warteliste ? `<p style="margin:0 0 16px;font-size:13px;font-weight:bold;color:#92400e">⚠ Warteliste</p>` : ''}

    ${sectionHead('Kontaktdaten')}
    ${kv([
      ['Verein',    reg.vereinsname],
      ['Name',      `${reg.vorname} ${reg.nachname}`],
      ['Adresse',   `${reg.strasse}, ${reg.plz} ${reg.ort}`],
      ['E-Mail',    reg.email],
      ['Telefon',   reg.telefon],
      ['Kunden-Nr.', reg.kunden_nr],
    ])}

    ${teamsBlock(reg)}

    ${sectionHead('Gebühren')}
    ${feesBox(reg)}
  `));
}

// ── E-Mail 3: Zahlungsinformationen nach Admin-Bestätigung ────────────────────
async function sendPaymentInfo(reg) {
  const p = getPayment();
  const subject = `Zahlungsinformationen – Mahrenholz Beach-Cup 2026 [${reg.booking_code || reg.id}]`;

  const payRows = [
    ['Empfänger',       p.empfaenger],
    ['IBAN',            `<span style="font-family:Courier New,monospace;letter-spacing:.05em">${p.iban}</span>`],
    ['BIC',             `<span style="font-family:Courier New,monospace">${p.bic}</span>`],
    p.bank ? ['Bank', p.bank] : null,
    ['Betrag',          `<strong style="font-size:15px;color:${COLORS.ocean2}">${fmt(reg.gebuehr_gesamt)}</strong>`],
    ['Verwendungszweck', `<strong style="font-family:Courier New,monospace;letter-spacing:.08em;color:${COLORS.ocean2}">${reg.booking_code || reg.id}</strong>`],
    ['Zahlungsfrist',   p.frist],
  ].filter(Boolean);

  const stornoNote = p.storno_hinweis
    ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0">
        <tr><td style="background:#fff7ed;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;font-size:13px;color:#92400e">
          ${p.storno_hinweis}
        </td></tr>
      </table>`
    : '';

  await send(reg.email, subject, wrap(`
    <h2 style="margin:0 0 4px;font-size:22px;color:${COLORS.ocean2}">Anmeldung bestätigt</h2>
    <p style="margin:0 0 20px;font-size:14px;color:${COLORS.muted}">34. Mahrenholz Beach-Cup 2026 · Beachsportclub Cuxhaven e.V.</p>

    <p style="margin:0 0 8px">Guten Tag ${reg.vorname} ${reg.nachname},</p>
    <p style="margin:0 0 16px">wir haben Ihre Anmeldung geprüft und bestätigt. Bitte überweisen Sie die Startgebühr bis zur angegebenen Frist.</p>

    ${bookingBadge(reg.booking_code)}

    ${sectionHead('Zahlungsinformationen')}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.light};border:1px solid ${COLORS.border};border-radius:8px">
      <tr><td style="padding:16px">
        ${kv(payRows)}
      </td></tr>
    </table>

    ${stornoNote}

    ${teamsBlock(reg)}

    <p style="margin:24px 0 0;font-size:14px">Mit sportlichen Grüßen<br><strong>Rüdiger Sauer</strong><br><span style="color:${COLORS.muted}">Turnierleitung · Mahrenholz Beach-Cup</span></p>
  `));
}

// ── E-Mail 3b: Zahlungserinnerung ────────────────────────────────────────────
async function sendPaymentReminder(reg) {
  const p = getPayment();
  const subject = `Erinnerung: Zahlung ausstehend – Mahrenholz Beach-Cup 2026 [${reg.booking_code || reg.id}]`;

  const payRows = [
    ['Empfänger',       p.empfaenger],
    ['IBAN',            `<span style="font-family:Courier New,monospace;letter-spacing:.05em">${p.iban}</span>`],
    ['BIC',             `<span style="font-family:Courier New,monospace">${p.bic}</span>`],
    p.bank ? ['Bank', p.bank] : null,
    ['Betrag',          `<strong style="font-size:15px;color:${COLORS.ocean2}">${fmt(reg.gebuehr_gesamt)}</strong>`],
    ['Verwendungszweck', `<strong style="font-family:Courier New,monospace;letter-spacing:.08em;color:${COLORS.ocean2}">${reg.booking_code || reg.id}</strong>`],
    ['Zahlungsfrist',   p.frist],
  ].filter(Boolean);

  const stornoNote = p.storno_hinweis
    ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0">
        <tr><td style="background:#fff7ed;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;font-size:13px;color:#92400e">
          ${p.storno_hinweis}
        </td></tr>
      </table>`
    : '';

  await send(reg.email, subject, wrap(`
    <h2 style="margin:0 0 4px;font-size:22px;color:${COLORS.ocean2}">Zahlungserinnerung</h2>
    <p style="margin:0 0 20px;font-size:14px;color:${COLORS.muted}">34. Mahrenholz Beach-Cup 2026 · Beachsportclub Cuxhaven e.V.</p>

    <p style="margin:0 0 8px">Guten Tag ${reg.vorname} ${reg.nachname},</p>
    <p style="margin:0 0 16px">wir möchten Sie freundlich daran erinnern, dass die Startgebühr für Ihre bestätigte Anmeldung noch aussteht. Bitte überweisen Sie den Betrag bis zur angegebenen Frist.</p>

    ${bookingBadge(reg.booking_code)}

    ${sectionHead('Zahlungsinformationen')}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.light};border:1px solid ${COLORS.border};border-radius:8px">
      <tr><td style="padding:16px">
        ${kv(payRows)}
      </td></tr>
    </table>

    ${stornoNote}

    <p style="margin:24px 0 0;font-size:14px">Mit sportlichen Grüßen<br><strong>Rüdiger Sauer</strong><br><span style="color:${COLORS.muted}">Turnierleitung · Mahrenholz Beach-Cup</span></p>
  `));
}

// ── E-Mail 4: Stornierungsbestätigung ─────────────────────────────────────────
async function sendCancellationEmail(reg) {
  const subject = `Stornierungsbestätigung – Mahrenholz Beach-Cup 2026 [${reg.booking_code || reg.id}]`;

  await send(reg.email, subject, wrap(`
    <h2 style="margin:0 0 4px;font-size:22px;color:#b91c1c">Anmeldung storniert</h2>
    <p style="margin:0 0 20px;font-size:14px;color:${COLORS.muted}">34. Mahrenholz Beach-Cup 2026 · Beachsportclub Cuxhaven e.V.</p>

    <p style="margin:0 0 8px">Guten Tag ${reg.vorname} ${reg.nachname},</p>
    <p style="margin:0 0 16px">Ihre Anmeldung zum Mahrenholz Beach-Cup 2026 wurde storniert.</p>

    ${bookingBadge(reg.booking_code)}

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0">
      <tr><td style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;font-size:13px;color:#991b1b">
        Sollten Sie Fragen zu Ihrer Stornierung haben, wenden Sie sich bitte per E-Mail oder Telefon an uns.
      </td></tr>
    </table>

    ${sectionHead('Stornierte Anmeldung')}
    ${kv([
      ['Buchungscode', reg.booking_code],
      ['Verein',       reg.vereinsname],
      ['Name',         `${reg.vorname} ${reg.nachname}`],
      ['E-Mail',       reg.email],
    ])}

    ${teamsBlock(reg)}

    <p style="margin:24px 0 0;font-size:14px">Mit sportlichen Grüßen<br><strong>Rüdiger Sauer</strong><br><span style="color:${COLORS.muted}">Turnierleitung · Mahrenholz Beach-Cup</span></p>
  `));
}

// ── E-Mail 5: QR-Code nach Zahlungseingang ────────────────────────────────────
async function sendQrCodeEmail(reg) {
  const checkinUrl = `${BASE_URL}/checkin?code=${reg.booking_code}`;
  const qrBuffer = await QRCode.toBuffer(checkinUrl, {
    width: 300,
    margin: 2,
    color: { dark: '#1d4f70', light: '#ffffff' },
  });

  const subject = `Ihr QR-Code für den Check-in – Mahrenholz Beach-Cup 2026 [${reg.booking_code}]`;
  const html = wrap(`
    <h2 style="margin:0 0 4px;font-size:22px;color:${COLORS.ocean2}">Zahlung bestätigt – Ihr Check-in QR-Code</h2>
    <p style="margin:0 0 20px;font-size:14px;color:${COLORS.muted}">34. Mahrenholz Beach-Cup 2026 · Beachsportclub Cuxhaven e.V.</p>

    <p style="margin:0 0 8px">Guten Tag ${reg.vorname} ${reg.nachname},</p>
    <p style="margin:0 0 16px">Ihre Zahlung ist eingegangen – vielen Dank! Bitte zeigen Sie beim Check-in vor Ort diesen QR-Code oder nennen Sie Ihren Buchungscode.</p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" border="0" style="background:white;border:2px solid ${COLORS.border};border-radius:12px;padding:20px;display:inline-block">
            <tr><td align="center">
              <img src="cid:qrcode" width="240" height="240" alt="Check-in QR-Code" style="display:block">
            </td></tr>
            <tr><td align="center" style="padding-top:12px">
              <span style="font-family:Courier New,monospace;font-size:20px;font-weight:bold;color:${COLORS.ocean2};letter-spacing:.2em">${reg.booking_code}</span>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px">
      <tr><td style="background:${COLORS.light};border:1px solid ${COLORS.border};border-radius:8px;padding:12px 16px;font-size:13px;color:${COLORS.label}">
        <strong>Hinweis:</strong> Falls der QR-Code nicht scanbar ist, reicht Ihr Buchungscode <strong style="color:${COLORS.ocean2};font-family:Courier New,monospace">${reg.booking_code}</strong> zur Identifikation aus.
      </td></tr>
    </table>

    ${sectionHead('Ihre Anmeldung')}
    ${kv([
      ['Verein', reg.vereinsname],
      ['Name',   `${reg.vorname} ${reg.nachname}`],
    ])}
    ${teamsBlock(reg)}

    <p style="margin:24px 0 0;font-size:14px">Wir freuen uns auf Sie!<br><strong>Rüdiger Sauer</strong><br><span style="color:${COLORS.muted}">Turnierleitung · Mahrenholz Beach-Cup</span></p>
  `);

  const t = buildTransporter();
  if (!t) {
    console.log(`[Mailer] SMTP nicht konfiguriert — QR-Code-Mail → ${reg.email} (nicht gesendet)`);
    return;
  }
  await t.sendMail({
    from: getFrom(),
    to: reg.email,
    subject,
    html,
    attachments: [{ filename: 'checkin-qrcode.png', content: qrBuffer, cid: 'qrcode' }],
  });
  console.log(`[Mailer] ✓ QR-Code-Mail → ${reg.email}`);
}

module.exports = { sendRegistrationConfirmation, sendAdminNotification, sendPaymentInfo, sendPaymentReminder, sendCancellationEmail, sendQrCodeEmail,
  sendHesseConfirmation, sendHesseAdminNotification, sendHessePaymentInfo, sendHessePaymentReminder, sendHesseCancellation, sendHesseQrCode };

// ══════════════════════════════════════════════════════════════════════════════
// Heße Immobilien Cup E-Mails
// ══════════════════════════════════════════════════════════════════════════════

const HESSE_COLOR = '#c0392b'; // Rot als Akzentfarbe für Heße Cup

function hesseWrap(content) {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${COLORS.text}">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};padding:32px 16px">
  <tr><td align="center">
    <table width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;width:100%">
      <tr><td style="background:${COLORS.card};border-radius:16px;border:1px solid ${COLORS.border};overflow:hidden">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background:linear-gradient(135deg,#2c2c2c 0%,${HESSE_COLOR} 100%);padding:24px 32px;border-radius:16px 16px 0 0">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td><img src="https://cux-beach.de/wp-content/uploads/2023/10/BC-Banner-no-bg-600-200-1.png" alt="Beachsportclub Cuxhaven" height="44" style="display:block;filter:brightness(0) invert(1)"></td>
                <td style="padding-left:16px;color:#fff;font-size:13px;font-weight:bold;white-space:nowrap">Heße Immobilien Cup</td>
              </tr></table>
            </td>
          </tr>
          <tr><td style="padding:32px">${content}</td></tr>
          <tr>
            <td style="background:${COLORS.light};border-top:1px solid ${COLORS.border};padding:16px 32px;border-radius:0 0 16px 16px">
              <p style="margin:0;font-size:12px;color:${COLORS.muted};line-height:1.6">
                Beachsportclub Cuxhaven e.V. &nbsp;·&nbsp;
                <a href="https://cux-beach.de" style="color:${HESSE_COLOR};text-decoration:none">cux-beach.de</a>
                &nbsp;·&nbsp; <a href="https://whatsapp.com/channel/0029VahAnnyFy72Hr1IMDU3V" style="color:${HESSE_COLOR};text-decoration:none">WhatsApp-Kanal</a>
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function hesseKv(rows) {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0">
    ${rows.map(([k, v], i) => `
    <tr style="background:${i % 2 === 0 ? COLORS.light : COLORS.card}">
      <td style="padding:8px 12px;color:${COLORS.label};font-size:13px;width:42%;vertical-align:top">${k}</td>
      <td style="padding:8px 12px;color:${COLORS.text};font-size:13px;font-weight:600;vertical-align:top">${v || '–'}</td>
    </tr>`).join('')}
  </table>`;
}

function hesseBookingBadge(code) {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0">
    <tr><td align="center" style="background:#fff0f0;border:2px dashed ${HESSE_COLOR};border-radius:12px;padding:16px">
      <p style="margin:0 0 4px;font-size:11px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:2px">Buchungscode</p>
      <p style="margin:0;font-size:28px;font-weight:bold;letter-spacing:6px;color:${HESSE_COLOR};font-family:monospace">${code}</p>
      <p style="margin:6px 0 0;font-size:11px;color:${COLORS.muted}">Verwendungszweck bei der Zahlung</p>
    </td></tr>
  </table>`;
}

function hesseTeamsBlock(reg) {
  const names = (reg.mannschaftsnamen || '').split('\n').filter(Boolean);
  if (!names.length) return '';
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0">
    ${names.map((n, i) => `
    <tr style="background:${i % 2 === 0 ? COLORS.light : COLORS.card}">
      <td style="padding:8px 12px;color:${COLORS.muted};font-size:13px;width:40px">${i + 1}.</td>
      <td style="padding:8px 12px;color:${COLORS.text};font-size:13px;font-weight:600">${n}</td>
    </tr>`).join('')}
  </table>`;
}

async function sendHesseConfirmation(reg) {
  const subject = `Anmeldebestätigung – Heße Immobilien Cup 2026 [${reg.booking_code}]`;
  const html = hesseWrap(`
    <h2 style="margin:0 0 8px;color:${HESSE_COLOR}">Anmeldung eingegangen</h2>
    <p style="margin:0 0 20px;color:${COLORS.muted}">Vielen Dank für Ihre Anmeldung, ${reg.vorname} ${reg.nachname}. Wir melden uns nach Prüfung Ihrer Daten mit den Zahlungsinformationen.</p>
    ${hesseBookingBadge(reg.booking_code)}
    <p style="font-size:13px;font-weight:700;color:${COLORS.label};text-transform:uppercase;letter-spacing:1px;margin:20px 0 6px">Ihre Daten</p>
    ${hesseKv([
      ['Firma', reg.firma],
      ['Kunden-Nr.', reg.kunden_nr],
      ['Ansprechpartner', `${reg.vorname} ${reg.nachname}`],
      ['Adresse', `${reg.strasse}, ${reg.plz} ${reg.ort}`],
      ['E-Mail', reg.email],
      ['Telefon', reg.telefon],
    ])}
    <p style="font-size:13px;font-weight:700;color:${COLORS.label};text-transform:uppercase;letter-spacing:1px;margin:20px 0 6px">🏐 Mannschaften (${reg.mannschaften}× 4er-Mixed)</p>
    ${hesseTeamsBlock(reg)}
    ${hesseKv([
      ['Teilnehmer gesamt', reg.teilnehmer_anzahl],
      ['Startgebühr gesamt', `${String(reg.gebuehr_gesamt).replace('.', ',')} €`],
    ])}
    ${stornoBox(reg.booking_code)}
    <p style="margin:24px 0 0;font-size:14px">Mit sportlichen Grüßen<br><strong>Rüdiger Sauer</strong><br><span style="color:${COLORS.muted}">Turnierleitung · Heße Immobilien Cup 2026</span></p>
  `);
  const t = buildTransporter();
  if (!t) { console.log(`[Mailer/Hesse] SMTP nicht konfiguriert — Bestätigung → ${reg.email}`); return; }
  await t.sendMail({ from: getFrom(), to: reg.email, subject, html });
  console.log(`[Mailer/Hesse] ✓ Bestätigung → ${reg.email}`);
}

async function sendHesseAdminNotification(reg) {
  const adminEmail = getAdminEmail();
  if (!adminEmail) return;
  const subject = `Neue Anmeldung Heße Cup #${reg.id} – ${reg.nachname}, ${reg.vorname} / ${reg.firma}`;
  const html = hesseWrap(`
    <h2 style="margin:0 0 20px;color:${HESSE_COLOR}">Neue Anmeldung Heße Immobilien Cup</h2>
    ${hesseKv([
      ['ID', `#${reg.id}`],
      ['Buchungscode', reg.booking_code],
      ['Firma', reg.firma],
      ['Kunden-Nr.', reg.kunden_nr],
      ['Name', `${reg.vorname} ${reg.nachname}`],
      ['E-Mail', reg.email],
      ['Telefon', reg.telefon],
      ['Mannschaften', `${reg.mannschaften}× 4er-Mixed`],
      ['Teilnehmer', reg.teilnehmer_anzahl],
      ['Gebühr', `${String(reg.gebuehr_gesamt).replace('.', ',')} €`],
    ])}
    <p style="font-size:13px;font-weight:700;color:${COLORS.label};margin:16px 0 6px">Mannschaftsnamen</p>
    ${hesseTeamsBlock(reg)}
  `);
  const t = buildTransporter();
  if (!t) { console.log(`[Mailer/Hesse] SMTP nicht konfiguriert — Admin-Mail`); return; }
  await t.sendMail({ from: getFrom(), to: adminEmail, subject, html });
  console.log(`[Mailer/Hesse] ✓ Admin-Benachrichtigung → ${adminEmail}`);
}

async function sendHessePaymentInfo(reg) {
  const p = getPayment();
  const subject = `Zahlungsinformationen – Heße Immobilien Cup 2026 [${reg.booking_code}]`;
  const html = hesseWrap(`
    <h2 style="margin:0 0 8px;color:${HESSE_COLOR}">Zahlungsinformationen</h2>
    <p style="margin:0 0 20px;color:${COLORS.muted}">Ihre Anmeldung wurde bestätigt. Bitte überweisen Sie die Startgebühr bis zur genannten Frist.</p>
    ${hesseBookingBadge(reg.booking_code)}
    ${hesseKv([
      ['Empfänger', p.empfaenger],
      ['IBAN', p.iban],
      ['BIC', p.bic],
      ['Bank', p.bank],
      ['Betrag', `${String(reg.gebuehr_gesamt).replace('.', ',')} €`],
      ['Verwendungszweck', reg.booking_code],
      ['Zahlungsfrist', p.frist],
    ])}
    ${p.storno_hinweis ? `<p style="margin:16px 0 0;font-size:13px;color:${COLORS.muted}">${p.storno_hinweis}</p>` : ''}
  `);
  const t = buildTransporter();
  if (!t) { console.log(`[Mailer/Hesse] SMTP nicht konfiguriert — Zahlungsinfo → ${reg.email}`); return; }
  await t.sendMail({ from: getFrom(), to: reg.email, subject, html });
  console.log(`[Mailer/Hesse] ✓ Zahlungsinfo → ${reg.email}`);
}

async function sendHessePaymentReminder(reg) {
  const p = getPayment();
  const subject = `Erinnerung: Zahlung ausstehend – Heße Immobilien Cup 2026 [${reg.booking_code}]`;
  const html = hesseWrap(`
    <h2 style="margin:0 0 8px;color:${HESSE_COLOR}">Zahlungserinnerung</h2>
    <p style="margin:0 0 20px;color:${COLORS.muted}">Ihre Anmeldung ist bestätigt. Bitte überweisen Sie die Startgebühr bis zur genannten Frist.</p>
    ${hesseBookingBadge(reg.booking_code)}
    ${hesseKv([
      ['Empfänger', p.empfaenger],
      ['IBAN', p.iban],
      ['BIC', p.bic],
      ['Bank', p.bank],
      ['Betrag', `${String(reg.gebuehr_gesamt).replace('.', ',')} €`],
      ['Verwendungszweck', reg.booking_code],
      ['Zahlungsfrist', p.frist],
    ])}
    ${p.storno_hinweis ? `<p style="margin:16px 0 0;font-size:13px;color:${COLORS.muted}">${p.storno_hinweis}</p>` : ''}
    <p style="margin:16px 0 0;font-size:13px">Falls Sie bereits überwiesen haben, bitten wir Sie, diese Erinnerung zu ignorieren.</p>
    <p style="margin:16px 0 0;font-size:14px">Mit sportlichen Grüßen<br><strong>Rüdiger Sauer</strong><br><span style="color:${COLORS.muted}">Turnierleitung · Heße Immobilien Cup 2026</span></p>
  `);
  const t = buildTransporter();
  if (!t) { console.log(`[Mailer/Hesse] SMTP nicht konfiguriert — Zahlungserinnerung → ${reg.email}`); return; }
  await t.sendMail({ from: getFrom(), to: reg.email, subject, html });
  console.log(`[Mailer/Hesse] ✓ Zahlungserinnerung → ${reg.email}`);
}

async function sendHesseCancellation(reg) {
  const subject = `Stornierungsbestätigung – Heße Immobilien Cup 2026 [${reg.booking_code}]`;
  const html = hesseWrap(`
    <h2 style="margin:0 0 8px;color:${HESSE_COLOR}">Anmeldung storniert</h2>
    <p style="margin:0 0 20px;color:${COLORS.muted}">Ihre Anmeldung für den Heße Immobilien Cup 2026 wurde storniert.</p>
    ${hesseKv([['Buchungscode', reg.booking_code], ['Firma', reg.firma], ['Name', `${reg.vorname} ${reg.nachname}`]])}
    <p style="margin:16px 0 0;font-size:13px">Bei Fragen wenden Sie sich bitte an die Turnierleitung.</p>
  `);
  const t = buildTransporter();
  if (!t) { console.log(`[Mailer/Hesse] SMTP nicht konfiguriert — Storno → ${reg.email}`); return; }
  await t.sendMail({ from: getFrom(), to: reg.email, subject, html });
  console.log(`[Mailer/Hesse] ✓ Storno → ${reg.email}`);
}

async function sendHesseQrCode(reg) {
  const subject = `Ihr QR-Code für den Check-in – Heße Immobilien Cup 2026 [${reg.booking_code}]`;
  const checkinUrl = `${BASE_URL}/checkin?code=${reg.booking_code}&cup=hesse`;
  const qrBuffer = await QRCode.toBuffer(checkinUrl, { width: 300, margin: 2, color: { dark: HESSE_COLOR, light: '#ffffff' } });
  const html = hesseWrap(`
    <h2 style="margin:0 0 8px;color:${HESSE_COLOR}">Ihr Check-in QR-Code</h2>
    <p style="margin:0 0 20px;color:${COLORS.muted}">Zahlung eingegangen – vielen Dank! Zeigen Sie diesen QR-Code beim Check-in vor Ort.</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0">
      <tr><td align="center"><img src="cid:qrcode" width="220" alt="QR-Code" style="display:block"></td></tr>
    </table>
    ${hesseBookingBadge(reg.booking_code)}
    ${hesseKv([['Firma', reg.firma], ['Name', `${reg.vorname} ${reg.nachname}`], ['Mannschaften', `${reg.mannschaften}× 4er-Mixed`]])}
    <p style="margin:24px 0 0;font-size:14px">Wir freuen uns auf Sie!<br><strong>Rüdiger Sauer</strong><br><span style="color:${COLORS.muted}">Turnierleitung · Heße Immobilien Cup 2026</span></p>
  `);
  const t = buildTransporter();
  if (!t) { console.log(`[Mailer/Hesse] SMTP nicht konfiguriert — QR-Mail → ${reg.email}`); return; }
  await t.sendMail({ from: getFrom(), to: reg.email, subject, html, attachments: [{ filename: 'checkin-qrcode.png', content: qrBuffer, cid: 'qrcode' }] });
  console.log(`[Mailer/Hesse] ✓ QR-Mail → ${reg.email}`);
}
