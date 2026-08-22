const fetch = require('node-fetch');
const qualify = require('./qualify');

const GRAPH_URL = 'https://graph.facebook.com/v20.0';

function verify(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === process.env.MESSENGER_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
}

async function sendMessage(recipientId, text) {
  const url = `${GRAPH_URL}/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });
}

async function receive(req, res) {
  res.sendStatus(200);
  const entry = req.body.entry?.[0];
  const messaging = entry?.messaging?.[0];
  const text = messaging?.message?.text;
  const senderId = messaging?.sender?.id;
  if (!text || !senderId) return;

  try {
    const { reply } = await qualify.handleMessage({ channel: 'messenger', contactId: senderId, contactName: '', text });
    if (reply) await sendMessage(senderId, reply);
  } catch (e) {
    console.error('messenger handling error', e);
  }
}

module.exports = { verify, receive, sendMessage };
