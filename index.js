require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const whatsapp = require('./whatsapp-channel');
const messenger = require('./messenger-channel');
const store = require('./store');

const app = express();
app.use(express.json());

const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use(limiter);

app.get('/', (req, res) => res.send('ProspectPath bot is running.'));

app.get('/webhooks/whatsapp', whatsapp.verify);
app.post('/webhooks/whatsapp', whatsapp.receive);

app.get('/webhooks/messenger', messenger.verify);
app.post('/webhooks/messenger', messenger.receive);

app.get('/api/leads', (req, res) => {
  const auth = req.headers.authorization || '';
  const key = auth.replace('Bearer ', '');
  if (key !== process.env.SYNC_API_KEY) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const leads = store.getLeadsSince(req.query.since);
  res.json({ leads, serverTime: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ProspectPath bot listening on port ${PORT}`));
