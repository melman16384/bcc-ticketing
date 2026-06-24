require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { seedUsers } = require('./db');
const routes = require('./routes');
const hesseRoutes = require('./routes-hesse');
require('./backup');

seedUsers();

const app = express();
const PORT = process.env.PORT || 3000;

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://ticketing.cux-beach.de';
app.use(cors({ origin: ALLOWED_ORIGIN, credentials: true }));
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Rate limiting: Login — max 10 Versuche / 15 Minuten pro IP
app.use('/api/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Zu viele Anmeldeversuche. Bitte in 15 Minuten erneut versuchen.' } }));

// Rate limiting: Check-in (GET + POST) — max 60 Anfragen / 5 Minuten pro IP
const checkinLimit = rateLimit({ windowMs: 5 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Zu viele Anfragen. Bitte kurz warten.' } });
app.use('/api/checkin', checkinLimit);
app.use('/api/hesse/checkin', checkinLimit);

app.use('/api', routes);
app.use('/api/hesse', hesseRoutes);

const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));

app.listen(PORT, () => {
  console.log(`BCC-Ticketing läuft auf http://localhost:${PORT}`);
  console.log(`Admin-Panel: http://localhost:${PORT}/login`);
});
