const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({ origin: ['http://localhost:3001', 'https://haven118.github.io'] }));
app.use(express.json());

// Start server immediately so Render doesn't time out
app.listen(PORT, () => console.log(`MedTox API on port ${PORT}`));

// Connect to MongoDB in background
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB error:', err));
}

const ReportSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);

const useDB = () => mongoose.connection.readyState === 1;
let memReports = [];

// Auth
let registeredUsers = {
  'ems_lab': { username: 'ems_lab', email: 'lab@ems.com', hashedPassword: 'PASS123', role: 'EMS' }
};

app.get('/', (req, res) => res.json({ message: 'MedTox API Ready' }));

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = registeredUsers[username];
  if (user && user.hashedPassword === password) {
    if (user.role !== 'EMS') return res.status(403).json({ success: false, message: 'PD access not permitted. EMS only.' });
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
  } catch { res.status(401).json({ success: false }); }
});

app.post('/api/auth/register', (req, res) => {
  const { username, email, password, role } = req.body;
  if (role !== 'EMS' || registeredUsers[username]) return res.status(400).json({ success: false, message: 'EMS only, username taken' });
  registeredUsers[username] = { username, email, password, role: 'EMS' };
  res.json({ success: true, message: 'EMS created. Login now.' });
});

// Reports
app.get('/api/reports', async (req, res) => {
  if (useDB()) {
    const docs = await Report.find().sort({ createdAt: -1 }).lean();
    return res.json(docs.map(d => ({ ...d, id: d._id })));
  }
  res.json(memReports);
});

app.post('/api/reports', async (req, res) => {
  if (useDB()) {
    const doc = await Report.create(req.body);
    return res.json({ success: true, report: { ...doc.toObject(), id: doc._id } });
  }
  const report = { id: Date.now(), ...req.body };
  memReports.unshift(report);
  res.json({ success: true, report });
});

app.delete('/api/reports/:id', async (req, res) => {
  if (useDB()) {
    await Report.findByIdAndDelete(req.params.id).catch(() => {});
    return res.json({ success: true });
  }
  memReports = memReports.filter(r => r.id !== Number(req.params.id));
  res.json({ success: true });
});

// Tox search
const { searchDrugs } = require('./data.js');
app.get('/api/tox/search', (req, res) => {
  res.json({ results: searchDrugs(req.query.q || '') });
});

// Panel detection
const panels = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/panels.json'), 'utf8'));
const panelKeywords = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/panel_keywords.json'), 'utf8'));

const randomInRange = (min, max, decimals = 0) => {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
};

// Trace substances that can randomly appear as incidental findings
const TRACE_ANALYTES = [
  { analyte: 'Cotinine (Nicotine metabolite)', cutoff: '200 ng/mL', range: [8, 45], unit: 'ng/mL', positiveThreshold: 200 },
  { analyte: 'Caffeine', cutoff: '10 µg/mL', range: [0.4, 3.2], unit: 'µg/mL', positiveThreshold: 10 },
  { analyte: 'Acetaminophen', cutoff: '10 µg/mL', range: [0.3, 2.8], unit: 'µg/mL', positiveThreshold: 10 },
  { analyte: 'Ibuprofen', cutoff: '5 µg/mL', range: [0.2, 1.8], unit: 'µg/mL', positiveThreshold: 5 },
  { analyte: 'Diphenhydramine', cutoff: '50 ng/mL', range: [4, 28], unit: 'ng/mL', positiveThreshold: 50 },
  { analyte: 'Pseudoephedrine', cutoff: '500 ng/mL', range: [12, 85], unit: 'ng/mL', positiveThreshold: 500 },
  { analyte: 'Dextromethorphan', cutoff: '100 ng/mL', range: [5, 40], unit: 'ng/mL', positiveThreshold: 100 },
];

const resolveAnalytes = (panelNames) => {
  const seen = new Set();
  const analytes = [];

  for (let p = 0; p < panelNames.length; p++) {
    const panel = panels[panelNames[p]] || [];
    for (const a of panel) {
      if (seen.has(a.analyte)) continue;
      seen.add(a.analyte);
      const [min, max] = a.range;
      const decimals = max < 5 ? 2 : max < 50 ? 1 : 0;
      // All keyword-triggered panels always positive with realistic amounts (1.2x-3x cutoff)
      const posMin = Math.min(a.positiveThreshold * 1.2, max * 0.6);
      const posMax = Math.min(a.positiveThreshold * 3, max);
      const observed = randomInRange(posMin, posMax, decimals);
      analytes.push({
        analyte: a.analyte,
        screening: 'POSITIVE',
        confirmatory: 'POSITIVE',
        cutoff: a.cutoff,
        observed: `${observed} ${a.unit}`
      });
    }
  }

  // 1 in 5 chance of a random trace finding (always below cutoff — incidental)
  if (Math.random() < 0.2) {
    const candidates = TRACE_ANALYTES.filter(t => !seen.has(t.analyte));
    if (candidates.length > 0) {
      const t = candidates[Math.floor(Math.random() * candidates.length)];
      const decimals = t.range[1] < 5 ? 2 : t.range[1] < 50 ? 1 : 0;
      const observed = randomInRange(t.range[0], t.range[1], decimals);
      analytes.push({
        analyte: t.analyte,
        screening: 'NEGATIVE',
        confirmatory: 'N/A',
        cutoff: t.cutoff,
        observed: `${observed} ${t.unit} (trace)`
      });
    }
  }

  return analytes;
};

app.get('/api/tox/panel', (req, res) => {
  const specimenType = (req.query.specimen || '').toLowerCase();
  const triggeredPanels = [];

  // Add base panel from specimen type
  if (specimenType.includes('urine')) triggeredPanels.push('urine_panel');
  else if (specimenType.includes('blood')) triggeredPanels.push('blood_panel');
  else if (specimenType.includes('hair')) triggeredPanels.push('hair_panel');

  // Add directly selected panels from frontend
  const selectedPanels = (req.query.panels || '').split(',').map(p => p.trim()).filter(Boolean);
  for (const p of selectedPanels) {
    if (!triggeredPanels.includes(p)) triggeredPanels.push(p);
  }

  // Fallback
  if (triggeredPanels.length === 0) triggeredPanels.push('standard_uds');
  const uniquePanels = [...new Set(triggeredPanels)];
  console.log(`ToxPanel - keywords:"${req.query.keywords || ''}", triggered:[${uniquePanels.join(', ')}]`);
  res.json({
    panels: uniquePanels.map(p => p.replace(/_panel$/, '').replace(/_/g, ' ')),
    analytes: resolveAnalytes(uniquePanels),
    summary: `Auto-selected ${uniquePanels.length} panel(s): ${uniquePanels.join(', ')}.`
  });
});
