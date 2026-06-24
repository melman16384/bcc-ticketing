require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { seedUsers } = require('./db');
const routes = require('./routes');
const hesseRoutes = require('./routes-hesse');

seedUsers();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting: Login — max 10 Versuche / 15 Minuten pro IP
app.use('/api/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Zu viele Anmeldeversuche. Bitte in 15 Minuten erneut versuchen.' } }));

// Rate limiting: Check-in PIN — max 20 Versuche / 5 Minuten pro IP
const checkinLimit = rateLimit({ windowMs: 5 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Zu viele PIN-Versuche. Bitte kurz warten.' } });
app.use('/api/checkin/:code', checkinLimit);
app.use('/api/hesse/checkin/:code', checkinLimit);

app.use('/api', routes);
app.use('/api/hesse', hesseRoutes);

const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));

app.listen(PORT, () => {
  console.log(`BCC-Ticketing läuft auf http://localhost:${PORT}`);
  console.log(`Admin-Panel: http://localhost:${PORT}/login`);
});
