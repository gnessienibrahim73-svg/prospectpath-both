const fetch = require('node-fetch');
const qualify = require('./qualify');

const GRAPH_URL = 'https://graph.facebook.com/v20.0';

function verify(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
}

async function sendMessage(to, text) {
  const url = `${GRAPH_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });
}

async function receive(req, res) {
  res.sendStatus(200);
  const entry = req.body.entry?.[0];
  const change = entry?.changes?.[0];
  const message = change?.value?.messages?.[0];
  if (!message || message.type !== 'text') return;

  const from = message.from;
  const contactName = change.value.contacts?.[0]?.profile?.name || '';
  const text = message.text.body;

  try {
    const { reply } = await qualify.handleMessage({ channel: 'whatsapp', contactId: from, contactName, text });
    if (reply) await sendMessage(from, reply);
  } catch (e) {
    console.error('whatsapp handling error', e);
  }
}

module.exports = { verify, receive, sendMessage };
