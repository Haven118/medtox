import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import API_URL from '../config';

const S = {
  input: { width: '100%', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'white', fontSize: '0.95rem' },
  label: { display: 'block', marginBottom: '0.4rem', color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },
  section: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' },
  sectionTitle: { color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(0,255,255,0.2)' },
};

const generateNarrative = (form, analytes) => {
  const { pdName, objectDesc, usageDesc, location, isScene, subjectName, specimenType } = form;
  const positives = analytes.filter(a => a.screening === 'POSITIVE');
  const negatives = analytes.filter(a => a.screening !== 'POSITIVE');

  const sceneText = isScene === 'yes'
    ? `at the scene of ${location}`
    : `at ${location}`;

  const specimenLabel = specimenType || 'biological specimen';

  let intro = `On ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}, ${pdName} submitted a ${objectDesc} to the Rage EMS Forensic Laboratory ${sceneText} and requested a comprehensive toxicological analysis. The officer indicated that the item ${usageDesc}.`;

  let subjectLine = subjectName ? ` The specimen was collected from subject: ${subjectName}.` : '';

  let methodText = `The submitted ${specimenLabel} was processed in accordance with standard forensic protocols. Initial screening was conducted via immunoassay, followed by confirmatory analysis using Gas Chromatography-Mass Spectrometry (GC-MS) and Liquid Chromatography-Mass Spectrometry (LC-MS) where applicable.`;

  let findingsText = '';
  if (positives.length > 0) {
    const posList = positives.map(a => `${a.analyte} (${a.observed}, cutoff: ${a.cutoff})`).join('; ');
    findingsText = `Analysis returned POSITIVE results for the following controlled substances: ${posList}. `;
  }
  if (negatives.length > 0) {
    const negList = negatives.map(a => a.analyte).join(', ');
    findingsText += `No detectable levels were found for: ${negList}.`;
  }

  let conclusion = '';
  if (positives.length > 0) {
    const primary = positives[0];
    conclusion = `The concentration of ${primary.analyte} at ${primary.observed} significantly exceeds the established forensic cutoff threshold of ${primary.cutoff}, confirming recent exposure. These findings are consistent with the circumstances described by the requesting officer and are suitable for evidentiary purposes subject to chain of custody verification.`;
  } else {
    conclusion = `No controlled substances were detected above established cutoff thresholds. The specimen is negative for all tested analytes. These findings are consistent with no recent exposure to the substances included in the requested panel.`;
  }

  return { intro, subjectLine, methodText, findingsText, conclusion };
};

const ReportWizard = () => {
  const [formData, setFormData] = useState({
    selectedPanels: [],
    pdName: '',
    pdCaseNumber: '',
    subjectName: '',
    objectDesc: '',
    usageDesc: '',
    location: '',
    isScene: 'no',
    specimenType: 'Urine',
    analyst: 'EMS Lab Technician',
  });
  const [results, setResults] = useState({ analytes: [], panels: [], summary: '' });
  const [loading, setLoading] = useState(false);
  const reportRef = useRef();
  const { isAuthenticated } = useAuth();
  const [emsCaseNumber] = useState(`EMS-TOX-${Date.now() % 10000}`);

  const analyze = async () => {
    if (formData.selectedPanels.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/tox/panel?panels=${encodeURIComponent(formData.selectedPanels.join(','))}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        if (data.analytes?.length > 0) {
          const narr = generateNarrative({ ...formData }, data.analytes);
          saveReport(data.analytes, narr);
        }
      } else setResults({ analytes: [], panels: [], summary: 'API error' });
    } catch { setResults({ analytes: [], panels: [], summary: 'Network error' }); }
    setLoading(false);
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const saveReport = (analytes, narrative) => {
    const report = {
      emsCaseNumber,
      date: new Date().toLocaleString(),
      analytes,
      narrative,
      ...formData,
      keywords: formData.selectedPanels.join(', '),
    };
    fetch(`${API_URL}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    }).catch(() => {});
  };

  const generatePDF = () => {
    const el = reportRef.current;
    if (!el) return;
    html2pdf().set({
      filename: `FORENSIC-TOX-${formData.pdCaseNumber || emsCaseNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      margin: [0.6, 0.6, 0.6, 0.6],
    }).from(el).save();
  };

  if (!isAuthenticated) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-dim)' }}>EMS Login required</div>;

  const narrative = results.analytes.length > 0 ? generateNarrative(formData, results.analytes) : null;
  const positives = results.analytes.filter(a => a.screening === 'POSITIVE');

  return (
    <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '1000px', margin: '2rem auto' }}>
      <h2 style={{ color: 'var(--accent-cyan)', marginBottom: '0.5rem', textAlign: 'center' }}>🔬 Rage EMS Forensic Toxicology</h2>
      <p style={{ color: 'var(--text-dim)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>Complete all sections — the system will generate a full professional forensic report</p>

      {/* SECTION 1: Panel Selection */}
      <div style={S.section}>
        <div style={S.sectionTitle}>1. Substance / Panel Selection</div>
        <label style={S.label}>Select all substances detected</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
          {[
            { label: '🧪 Fentanyl / Xylazine', value: 'fentanyl_panel' },
            { label: '💊 Opioids (Heroin / Oxy)', value: 'opioid_panel' },
            { label: '⚡ Stimulants (Cocaine / Meth)', value: 'stimulant_panel' },
            { label: '🌿 Cannabis / THC', value: 'cannabinoid_panel' },
            { label: '😴 Sedatives / Benzos', value: 'sedative_panel' },
            { label: '🍺 Alcohol / Ethanol', value: 'alcohol_panel' },
            { label: '🍄 Hallucinogens / PCP', value: 'hallucinogen_panel' },
            { label: '☠️ Poison / Overdose', value: 'poison_panel' },
            { label: '🚗 DUI Panel', value: 'dui_panel' },
            { label: '🦷 Heavy Metals', value: 'heavy_metals_panel' },
            { label: '💀 Post-Mortem', value: 'postmortem_panel' },
            { label: '📋 Prescription Abuse', value: 'prescription_panel' },
            { label: '🔬 Expanded Opioid Panel', value: 'expanded_panel' },
          ].map(({ label, value }) => {
            const selected = formData.selectedPanels.includes(value);
            return (
              <button key={value} type="button" onClick={() => setFormData(f => ({
                ...f,
                selectedPanels: selected ? f.selectedPanels.filter(p => p !== value) : [...f.selectedPanels, value]
              }))} style={{
                padding: '0.6rem 0.9rem', borderRadius: '10px', border: `1px solid ${selected ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}`,
                background: selected ? 'rgba(0,242,255,0.15)' : 'rgba(255,255,255,0.04)',
                color: selected ? 'var(--accent-cyan)' : 'var(--text-dim)', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: selected ? '700' : '400', textAlign: 'left', transition: 'all 0.15s'
              }}>
                {label}
              </button>
            );
          })}
        </div>
        {formData.selectedPanels.length > 0 && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
            ✓ {formData.selectedPanels.length} panel{formData.selectedPanels.length > 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      {/* SECTION 2: Case Identifiers */}
      <div style={S.section}>
        <div style={S.sectionTitle}>2. Case Identifiers</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={S.label}>PD Case #</label>
            <input name="pdCaseNumber" value={formData.pdCaseNumber} onChange={handleInput} placeholder="PD-2024-1234" style={S.input} />
          </div>
          <div style={{ background: 'rgba(0,255,128,0.1)', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid rgba(0,255,128,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#059669', fontWeight: '600', fontSize: '0.9rem' }}>EMS Case: {emsCaseNumber}</span>
          </div>
          <div>
            <label style={S.label}>Requesting Officer (Full Name / Badge #)</label>
            <input name="pdName" value={formData.pdName} onChange={handleInput} placeholder="Det. Jane Doe / Badge #4421" style={S.input} />
          </div>
          <div>
            <label style={S.label}>Subject Name / ID (optional)</label>
            <input name="subjectName" value={formData.subjectName} onChange={handleInput} placeholder="John Doe / Unknown" style={S.input} />
          </div>
        </div>
      </div>

      {/* SECTION 3: Submission Narrative */}
      <div style={S.section}>
        <div style={S.sectionTitle}>3. Submission Narrative</div>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={S.label}>Object / Specimen Submitted</label>
              <input name="objectDesc" value={formData.objectDesc} onChange={handleInput} placeholder="e.g. a clear plastic bag, a urine sample, a syringe" style={S.input} />
            </div>
            <div>
              <label style={S.label}>Specimen Type</label>
              <select name="specimenType" value={formData.specimenType} onChange={handleInput} style={{ ...S.input, cursor: 'pointer' }}>
                <option value="Urine">Urine</option>
                <option value="Blood">Blood</option>
                <option value="Hair">Hair</option>
                <option value="Saliva">Saliva</option>
                <option value="Unknown substance">Unknown Substance</option>
                <option value="Seized evidence">Seized Evidence</option>
              </select>
            </div>
          </div>
          <div>
            <label style={S.label}>Usage / Context Description</label>
            <input name="usageDesc" value={formData.usageDesc} onChange={handleInput}
              placeholder="e.g. was found on the suspect and believed to be narcotics, was used by the subject prior to arrest"
              style={S.input} />
            <small style={{ color: 'var(--text-dim)', marginTop: '0.4rem', display: 'block' }}>
              This becomes: "Officer [name] gave me [object] and asked me to run a test — it was [usage]"
            </small>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div>
              <label style={S.label}>Location</label>
              <input name="location" value={formData.location} onChange={handleInput} placeholder="e.g. Vinewood Blvd, Mirror Park, LSPD HQ" style={S.input} />
            </div>
            <div>
              <label style={S.label}>Scene of Incident?</label>
              <select name="isScene" value={formData.isScene} onChange={handleInput} style={{ ...S.input, cursor: 'pointer' }}>
                <option value="yes">Yes — Active Scene</option>
                <option value="no">No — Standard Submission</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ANALYZE BUTTON */}
      <button onClick={analyze} disabled={loading || formData.selectedPanels.length === 0} style={{
        padding: '1.25rem 3rem', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
        border: 'none', borderRadius: '16px', color: 'black', fontWeight: 'bold', fontSize: '1.05rem',
        cursor: 'pointer', display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 2rem', boxShadow: '0 8px 20px rgba(0,242,255,0.3)', width: '100%', maxWidth: '400px'
      }}>
        <Zap size={22} /> {loading ? '🔬 Analyzing...' : '⚗️ Generate Forensic Report'}
      </button>

      {/* RESULTS PREVIEW */}
      {results.panels && results.panels.length > 0 && (
        <div>
          {results.panels.length > 1 && (
            <div style={{ background: 'rgba(255,215,0,0.15)', padding: '1rem 1.5rem', borderRadius: '12px', borderLeft: '4px solid gold', marginBottom: '1.5rem' }}>
              <strong style={{ color: '#b45309' }}>🎯 {results.panels.length} Panels Auto-Selected: </strong>
              {results.panels.map((p, i) => <span key={i} style={{ background: 'rgba(255,215,0,0.3)', padding: '2px 10px', borderRadius: '20px', fontSize: '0.85rem', marginLeft: '6px' }}>{p}</span>)}
            </div>
          )}

          <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '1rem' }}>📈 Quantitative Results Preview</h3>
          <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: 'rgba(0,242,255,0.15)' }}>
                  {['Analyte', 'Screen', 'Confirm', 'Cutoff', 'Observed'].map(h => (
                    <th key={h} style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--accent-cyan)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.analytes.map((a, i) => (
                  <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: a.screening === 'POSITIVE' ? 'rgba(239,68,68,0.08)' : 'transparent' }}>
                    <td style={{ padding: '0.8rem 1rem', fontWeight: '600' }}>{a.analyte}</td>
                    <td style={{ padding: '0.8rem 1rem', color: a.screening === 'POSITIVE' ? '#f87171' : '#4ade80', fontWeight: '600' }}>{a.screening}</td>
                    <td style={{ padding: '0.8rem 1rem' }}>{a.confirmatory}</td>
                    <td style={{ padding: '0.8rem 1rem', color: 'var(--text-dim)' }}>{a.cutoff}</td>
                    <td style={{ padding: '0.8rem 1rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{a.observed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PDF REPORT TEMPLATE */}
          <div ref={reportRef} style={{ background: 'white', color: '#111', padding: '1.5rem', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '10pt', lineHeight: '1.5' }}>

            {/* HEADER */}
            <div style={{ borderBottom: '4px solid #1e3a8a', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '7pt', color: '#64748b', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>Rage Emergency Medical Services</div>
                  <h1 style={{ fontSize: '18pt', color: '#1e3a8a', margin: '0 0 2px 0', fontWeight: '900', lineHeight: 1.1 }}>FORENSIC TOXICOLOGY REPORT</h1>
                  <div style={{ fontSize: '11pt', color: '#1e40af', fontWeight: '600' }}>CASE #{formData.pdCaseNumber || 'PENDING'}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '8pt', color: '#475569' }}>
                  <div style={{ fontWeight: '700', color: '#1e3a8a', fontSize: '9pt' }}>EMS Lab Case: {emsCaseNumber}</div>
                  <div>Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  <div>Time: {new Date().toLocaleTimeString()}</div>
                  <div style={{ marginTop: '4px', padding: '2px 8px', background: positives.length > 0 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${positives.length > 0 ? '#fca5a5' : '#86efac'}`, color: positives.length > 0 ? '#dc2626' : '#16a34a', fontWeight: '700', fontSize: '8pt' }}>
                    {positives.length > 0 ? `⚠ ${positives.length} POSITIVE RESULT(S)` : '✓ ALL NEGATIVE'}
                  </div>
                </div>
              </div>
            </div>

            {/* CASE METADATA */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
              {[
                ['PREPARED FOR', 'Los Santos Police Department (Narcotics Division)'],
                ['REQUESTING OFFICER', formData.pdName || 'N/A'],
                ['SUBJECT', formData.subjectName || 'Not Provided'],
                ['SPECIMEN TYPE', formData.specimenType],
                ['LOCATION', formData.location || 'Not Specified'],
                ['SCENE OF INCIDENT', formData.isScene === 'yes' ? 'YES — Active Scene' : 'No — Standard Submission'],
              ].map(([k, v], i) => (
                <div key={i} style={{ padding: '6px 10px', borderBottom: '1px solid #e2e8f0', borderRight: i % 2 === 0 ? '1px solid #e2e8f0' : 'none', background: i % 4 < 2 ? '#f8fafc' : 'white' }}>
                  <div style={{ fontSize: '7pt', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k}</div>
                  <div style={{ fontSize: '9.5pt', color: '#1e293b', fontWeight: '500' }}>{v}</div>
                </div>
              ))}
            </div>

            {/* SECTION 1: ANALYTICAL SUMMARY */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ background: '#1e3a8a', color: 'white', padding: '5px 10px', fontSize: '9pt', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '8px' }}>
                1. ANALYTICAL SUMMARY
              </div>
              {narrative && (
                <div style={{ fontSize: '9.5pt', color: '#1e293b', lineHeight: '1.6' }}>
                  <p style={{ margin: '0 0 6px 0' }}>{narrative.intro}{narrative.subjectLine}</p>
                  <p style={{ margin: '0 0 6px 0' }}>{narrative.methodText}</p>
                  <p style={{ margin: '0' }}>{narrative.findingsText}</p>
                </div>
              )}
            </div>

            {/* SECTION 2: QUANTITATIVE RESULTS TABLE */}
            <div style={{ marginBottom: '1rem', pageBreakInside: 'avoid' }}>
              <div style={{ background: '#1e3a8a', color: 'white', padding: '5px 10px', fontSize: '9pt', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '8px' }}>
                2. QUANTITATIVE RESULTS
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                <thead>
                  <tr style={{ backgroundColor: '#dbeafe' }}>
                    {['Analyte', 'Screening Result', 'Confirmatory Result', 'Cutoff Level', 'Observed Concentration'].map(h => (
                      <th key={h} style={{ border: '1px solid #93c5fd', padding: '6px 8px', textAlign: 'left', fontWeight: '700', color: '#1e3a8a' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.analytes.map((a, i) => (
                    <tr key={i} style={{ backgroundColor: a.screening === 'POSITIVE' ? '#fef3c7' : (i % 2 === 0 ? 'white' : '#f8fafc') }}>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', fontWeight: '600' }}>{a.analyte}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', fontWeight: '700', color: a.screening === 'POSITIVE' ? '#dc2626' : '#16a34a' }}>{a.screening}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px' }}>{a.confirmatory}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', color: '#475569' }}>{a.cutoff}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', fontWeight: '700' }}>{a.observed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SECTION 3: LABORATORY INTERPRETATION */}
            <div style={{ marginBottom: '1rem', pageBreakInside: 'avoid' }}>
              <div style={{ background: '#1e3a8a', color: 'white', padding: '5px 10px', fontSize: '9pt', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '8px' }}>
                3. LABORATORY INTERPRETATION
              </div>
              {narrative && (
                <div style={{ fontSize: '9.5pt', color: '#1e293b', lineHeight: '1.6' }}>
                  <p style={{ margin: '0 0 8px 0' }}>{narrative.conclusion}</p>
                  {positives.length > 0 && (
                    <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', padding: '8px 12px', marginTop: '8px' }}>
                      <strong style={{ color: '#92400e' }}>⚠ POSITIVE FINDINGS SUMMARY: </strong>
                      <span style={{ color: '#78350f' }}>
                        {positives.map(a => `${a.analyte} at ${a.observed} (${((parseFloat(a.observed) / parseFloat(a.cutoff)) || 0).toFixed(1)}x above cutoff)`).join(' | ')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 4: CHAIN OF CUSTODY */}
            <div style={{ pageBreakInside: 'avoid' }}>
              <div style={{ background: '#1e3a8a', color: 'white', padding: '5px 10px', fontSize: '9pt', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '8px' }}>
                4. CHAIN OF CUSTODY &amp; AUTHENTICATION
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', border: '1px solid #e2e8f0', fontSize: '9pt', marginBottom: '10px' }}>
                {[
                  ['Submitted By', formData.pdName || 'N/A'],
                  ['Received By', formData.analyst],
                  ['Object Submitted', formData.objectDesc || 'N/A'],
                  ['Specimen Type', formData.specimenType],
                  ['Submission Location', formData.location || 'N/A'],
                  ['Seal Status', 'Intact — Chain of Custody Verified'],
                ].map(([k, v], i) => (
                  <div key={i} style={{ padding: '5px 10px', borderBottom: '1px solid #e2e8f0', borderRight: i % 2 === 0 ? '1px solid #e2e8f0' : 'none', background: i % 4 < 2 ? '#f8fafc' : 'white' }}>
                    <div style={{ fontSize: '7pt', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>{k}</div>
                    <div style={{ color: '#1e293b', fontWeight: '500' }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* SIGNATURE BLOCK */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '2px solid #1e3a8a' }}>
                <div style={{ textAlign: 'center', width: '45%' }}>
                  <div style={{ borderBottom: '1px solid #334155', marginBottom: '4px', height: '28px' }}></div>
                  <div style={{ fontSize: '8pt', color: '#475569', fontWeight: '600' }}>Lead Forensic Toxicologist</div>
                  <div style={{ fontSize: '8pt', color: '#475569' }}>Rage EMS Forensic Laboratory</div>
                </div>
                <div style={{ textAlign: 'center', width: '45%' }}>
                  <div style={{ borderBottom: '1px solid #334155', marginBottom: '4px', height: '28px' }}></div>
                  <div style={{ fontSize: '8pt', color: '#475569', fontWeight: '600' }}>Requesting Officer Acknowledgement</div>
                  <div style={{ fontSize: '8pt', color: '#475569' }}>{formData.pdName || 'LSPD Officer'}</div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '10px', padding: '6px', background: '#f0fdf4', border: '1px solid #86efac', fontSize: '8pt' }}>
                <strong style={{ color: '#15803d' }}>✓ CHAIN OF CUSTODY VERIFIED — DIGITAL CERTIFICATE &amp; AUDIT TRAIL COMPLETE</strong>
                <div style={{ color: '#475569', marginTop: '2px' }}>Report ID: {emsCaseNumber} | Generated: {new Date().toLocaleString()} | Rage EMS Forensic Lab</div>
              </div>
            </div>
          </div>

          {/* DOWNLOAD BUTTON */}
          <button onClick={generatePDF} style={{
            padding: '1.25rem 3rem', background: 'linear-gradient(135deg, #10b981, #047857)',
            color: 'white', border: 'none', borderRadius: '16px', fontSize: '1.05rem',
            fontWeight: 'bold', cursor: 'pointer', margin: '2rem auto 0', display: 'block',
            boxShadow: '0 12px 30px rgba(16,185,129,0.35)', letterSpacing: '0.5px'
          }}>
            📄 Download Official Forensic PDF Report
          </button>
        </div>
      )}


    </div>
  );
};

export default ReportWizard;
