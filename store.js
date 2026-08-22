const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

function load() {
  if (!fs.existsSync(DATA_FILE)) {
    return { leads: [], sessions: {} };
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return { leads: [], sessions: {} };
  }
}

let data = load();
let writeQueue = Promise.resolve();

function persist() {
  writeQueue = writeQueue.then(() => new Promise((resolve) => {
    fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), () => resolve());
  }));
  return writeQueue;
}

function getSession(channel, contactId) {
  const key = channel + ':' + contactId;
  return data.sessions[key] || null;
}

function setSession(channel, contactId, session) {
  const key = channel + ':' + contactId;
  data.sessions[key] = session;
  return persist();
}

function clearSession(channel, contactId) {
  const key = channel + ':' + contactId;
  delete data.sessions[key];
  return persist();
}

function addLead(lead) {
  data.leads.push(lead);
  return persist();
}

function getLeadsSince(isoTimestamp) {
  if (!isoTimestamp) return data.leads;
  return data.leads.filter(l => l.createdAt > isoTimestamp);
}

module.exports = { getSession, setSession, clearSession, addLead, getLeadsSince };
