const store = require('./store');

const WELCOME = "Bonjour 👋 Merci de nous contacter ! Je vais vous poser quelques questions rapides pour mieux vous orienter.";

const QUESTIONS = [
  { key: 'besoin', text: "Quel est votre besoin ou ce qui vous intéresse ?" },
  { key: 'ville', text: "Dans quelle ville êtes-vous basé(e) ?" },
  { key: 'budget', text: "Avez-vous une idée de budget pour ce projet ?" },
];

const CLOSING = "Merci ! Un membre de notre équipe va vous recontacter très bientôt. 🙏";

async function handleMessage({ channel, contactId, contactName, text }) {
  let session = store.getSession(channel, contactId);

  if (!session) {
    session = { step: 0, answers: {} };
    await store.setSession(channel, contactId, session);
    return { reply: WELCOME + '\n\n' + QUESTIONS[0].text, done: false };
  }

  if (session.step < QUESTIONS.length) {
    const q = QUESTIONS[session.step];
    session.answers[q.key] = (text || '').trim();
    session.step += 1;
  }

  if (session.step < QUESTIONS.length) {
    await store.setSession(channel, contactId, session);
    return { reply: QUESTIONS[session.step].text, done: false };
  }

  const now = new Date().toISOString();
  await store.addLead({
    id: channel + '_' + contactId + '_' + Date.now(),
    channel,
    contactId,
    contactName: contactName || '',
    answers: session.answers,
    createdAt: now,
  });
  await store.clearSession(channel, contactId);
  return { reply: CLOSING, done: true };
}

module.exports = { handleMessage, QUESTIONS };
