const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({
  origin: 'http://localhost:3001'
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'MedTox API Ready' });
});

// Users
let registeredUsers = {
  'ems_lab': { username: 'ems_lab', email: 'lab@ems.com', hashedPassword: 'PASS123', role: 'EMS' }
};

// Auth
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = registeredUsers[username];
  if (user && user.hashedPassword === password) {
    if (user.role !== 'EMS') {
      return res.status(403).json({ success: false, message: 'PD access not permitted. EMS only.' });
    }
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
    res.json({ success: true, user: { username: user.username, role: user.role }, token });
  } else {
    res.status(401).json({ success: false, message: 'Try ems_lab/PASS123' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false });
  try {
    const [username] = Buffer.from(token, 'base64').toString().split(':');
    const user = registeredUsers[username];
    if (user) res.json({ success: true, user: { username: user.username, role: user.role } });
    else res.status(401).json({ success: false });
  } catch {
    res.status(401).json({ success: false });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { username, email, password, role } = req.body;
  if (role !== 'EMS' || registeredUsers[username]) {
    return res.status(400).json({ success: false, message: 'EMS only, username taken' });
  }
  registeredUsers[username] = { username, email, password, role: 'EMS' };
  res.json({ success: true, message: 'EMS created. Login now.' });
});

// Tox search
const { searchDrugs } = require('./data.js');
app.get('/api/tox/search', (req, res) => {
  const q = req.query.q || '';
  res.json({ results: searchDrugs(q) });
});

// PANEL DETECTION - KEYWORD DRIVEN
const panelsFile = path.join(__dirname, '../data/panels.json');
const panels = JSON.parse(fs.readFileSync(panelsFile, 'utf8'));
const keywordsFile = path.join(__dirname, '../data/panel_keywords.json');
const panelKeywords = JSON.parse(fs.readFileSync(keywordsFile, 'utf8'));

app.get('/api/tox/panel', (req, res) => {
  const { keywords = '' } = req.query;
  const lowerKeywords = keywords.toLowerCase();
  const triggeredPanels = [];

  // Match keywords to panels
  for (const [panelName, triggers] of Object.entries(panelKeywords)) {
    for (const trigger of triggers) {
      if (lowerKeywords.includes(trigger.toLowerCase())) {
        triggeredPanels.push(panelName);
        break;
      }
    }
  }

  // Fallback
  if (triggeredPanels.length === 0) triggeredPanels.push('standard_panel');

  // Primary panel (first match)
  const primaryPanel = triggeredPanels[0];
  const analytes = panels[primaryPanel] || panels.standard_panel || [];

  res.json({
    panels: [...new Set(triggeredPanels)].map(p => p.replace(/_panel$/, '')),
    analytes,
    summary: `Auto-selected ${primaryPanel.replace(/_panel$/, '')} (${triggeredPanels.length} panels). Keywords: ${keywords}`
  });
});

app.listen(PORT, () => console.log(`MedTox API v2.0 on port ${PORT} - Ready!`));

