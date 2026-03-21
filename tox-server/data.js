const fs = require('fs');
const path = require('path');

const DRUGS_FILE = path.join(__dirname, '../data/drugs.json');

let drugsCache = [];

const loadDrugs = () => {
  try {
    const data = fs.readFileSync(DRUGS_FILE, 'utf8');
    drugsCache = JSON.parse(data);
  } catch (err) {
    drugsCache = [];
  }
};

const searchDrugs = (q) => {
  if (drugsCache.length === 0) loadDrugs();
  const lowerQ = q.toLowerCase();
  return drugsCache.filter(drug => 
    drug.name.toLowerCase().includes(lowerQ) ||
    drug.effects.toLowerCase().includes(lowerQ) ||
    drug.category.toLowerCase().includes(lowerQ) ||
    drug.findings?.toLowerCase().includes(lowerQ) ||
    drug.emsNotes?.toLowerCase().includes(lowerQ)
  );
};

const panels = require('../data/panels.json');

const getPanel = (category, toxType) => {
  const categoryMap = {
    'Opioid': 'fentanyl_panel',
    'Stimulant': 'standard_panel',
    'Injection Site': 'standard_panel',
    'Cannabinoid': 'cannabinoid_panel',
    'Urine': 'urine_panel',
    'Blood': 'blood_panel',
    'Hair': 'hair_panel',
    'Postmortem': 'postmortem_panel',
    'Fentanyl': 'fentanyl_panel',
    'Standard': 'standard_panel'
  };
  // Keyword detection
  const keywords = toxType.toLowerCase() + ' ' + (category || '').toLowerCase();
  if (keywords.includes('urine')) return panels.urine_panel;
  if (keywords.includes('blood')) return panels.blood_panel;
  if (keywords.includes('hair')) return panels.hair_panel;
  if (keywords.includes('postmortem') || keywords.includes('post mortem')) return panels.postmortem_panel;
  if (keywords.includes('fentanyl')) return panels.fentanyl_panel;
  if (keywords.includes('standard')) return panels.standard_panel;
  
  const panelKey = categoryMap[category] || 'standard_panel';
  return panels[panelKey] || panels.generic_panel;
};


module.exports = { loadDrugs, searchDrugs, getPanel };


