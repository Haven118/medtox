import { useState, useRef, useEffect } from 'react';
import { FileText, Download, Trash2, Eye } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import API_URL from '../config';

const ReportsList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const reportRef = useRef();

  useEffect(() => {
    fetch(`${API_URL}/api/reports`)
      .then(r => r.json())
      .then(data => { setReports(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const deleteReport = (id) => {
    fetch(`${API_URL}/api/reports/${id}`, { method: 'DELETE' }).catch(() => {});
    setReports(prev => prev.filter(r => r.id !== id));
    if (viewing?.id === id) setViewing(null);
  };

  const downloadPDF = (report) => {
    const el = reportRef.current;
    if (!el) return;
    html2pdf().set({
      filename: `FORENSIC-TOX-${report.pdCaseNumber || report.emsCaseNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      margin: [0.6, 0.6, 0.6, 0.6],
    }).from(el).save();
  };

  if (loading) return <div className="glass-panel" style={{ padding: '3rem', maxWidth: '800px', margin: '2rem auto', textAlign: 'center', color: 'var(--text-dim)' }}>Loading reports...</div>;

  if (reports.length === 0) return (
    <div className="glass-panel" style={{ padding: '3rem', maxWidth: '800px', margin: '2rem auto', textAlign: 'center' }}>
      <FileText size={48} style={{ color: 'var(--text-dim)', marginBottom: '1rem' }} />
      <h2 style={{ color: 'var(--accent-cyan)' }}>No Reports Yet</h2>
      <p style={{ color: 'var(--text-dim)' }}>Generated reports will appear here for viewing and download.</p>
    </div>
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>
      <h2 style={{ color: 'var(--accent-cyan)', marginBottom: '1.5rem' }}>📁 Saved Reports ({reports.length})</h2>

      <div style={{ display: 'grid', gap: '1rem', marginBottom: viewing ? '2rem' : 0 }}>
        {reports.map(r => {
          const positives = r.analytes.filter(a => a.screening === 'POSITIVE').length;
          return (
            <div key={r.id} className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: '700', fontSize: '0.95rem' }}>{r.emsCaseNumber}</span>
                  {r.pdCaseNumber && <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>· PD: {r.pdCaseNumber}</span>}
                  <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', background: positives > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(74,222,128,0.2)', color: positives > 0 ? '#f87171' : '#4ade80' }}>
                    {positives > 0 ? `${positives} POSITIVE` : 'ALL NEGATIVE'}
                  </span>
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  {r.pdName && <span>Officer: {r.pdName} · </span>}
                  {r.specimenType} · {r.date}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button onClick={() => setViewing(viewing?.id === r.id ? null : r)} style={{ padding: '0.5rem 1rem', background: 'rgba(0,242,255,0.15)', border: '1px solid var(--accent-cyan)', borderRadius: '10px', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                  <Eye size={15} /> {viewing?.id === r.id ? 'Hide' : 'View'}
                </button>
                <button onClick={() => { setViewing(r); setTimeout(() => downloadPDF(r), 100); }} style={{ padding: '0.5rem 1rem', background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', borderRadius: '10px', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                  <Download size={15} /> PDF
                </button>
                <button onClick={() => deleteReport(r.id)} style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#f87171', cursor: 'pointer' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* REPORT PREVIEW */}
      {viewing && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--accent-cyan)', margin: 0 }}>Report Preview — {viewing.emsCaseNumber}</h3>
            <button onClick={() => downloadPDF(viewing)} style={{ padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg, #10b981, #047857)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
              📄 Download PDF
            </button>
          </div>
          <ReportTemplate report={viewing} reportRef={reportRef} />
        </div>
      )}
    </div>
  );
};

export const ReportTemplate = ({ report, reportRef }) => {
  const positives = report.analytes.filter(a => a.screening === 'POSITIVE');
  return (
    <div ref={reportRef} style={{ background: 'white', color: '#111', padding: '1.5rem', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '10pt', lineHeight: '1.5' }}>
      <div style={{ borderBottom: '4px solid #1e3a8a', paddingBottom: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '7pt', color: '#64748b', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>Trifinity Emergency Medical Services</div>
            <h1 style={{ fontSize: '18pt', color: '#1e3a8a', margin: '0 0 2px 0', fontWeight: '900', lineHeight: 1.1 }}>FORENSIC TOXICOLOGY REPORT</h1>
            <div style={{ fontSize: '11pt', color: '#1e40af', fontWeight: '600' }}>CASE #{report.pdCaseNumber || 'PENDING'}</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '8pt', color: '#475569' }}>
            <div style={{ fontWeight: '700', color: '#1e3a8a', fontSize: '9pt' }}>EMS Lab Case: {report.emsCaseNumber}</div>
            <div>Date: {report.date}</div>
            <div style={{ marginTop: '4px', padding: '2px 8px', background: positives.length > 0 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${positives.length > 0 ? '#fca5a5' : '#86efac'}`, color: positives.length > 0 ? '#dc2626' : '#16a34a', fontWeight: '700', fontSize: '8pt' }}>
              {positives.length > 0 ? `⚠ ${positives.length} POSITIVE RESULT(S)` : '✓ ALL NEGATIVE'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
        {[
          ['PREPARED FOR', 'Los Santos Police Department (Narcotics Division)'],
          ['REQUESTING OFFICER', report.pdName || 'N/A'],
          ['SUBJECT', report.subjectName || 'Not Provided'],
          ['SPECIMEN TYPE', report.specimenType],
          ['LOCATION', report.location || 'Not Specified'],
          ['SCENE OF INCIDENT', report.isScene === 'yes' ? 'YES — Active Scene' : 'No — Standard Submission'],
        ].map(([k, v], i) => (
          <div key={i} style={{ padding: '6px 10px', borderBottom: '1px solid #e2e8f0', borderRight: i % 2 === 0 ? '1px solid #e2e8f0' : 'none', background: i % 4 < 2 ? '#f8fafc' : 'white' }}>
            <div style={{ fontSize: '7pt', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k}</div>
            <div style={{ fontSize: '9.5pt', color: '#1e293b', fontWeight: '500' }}>{v}</div>
          </div>
        ))}
      </div>

      {report.narrative && (
        <>
          <div style={{ background: '#1e3a8a', color: 'white', padding: '5px 10px', fontSize: '9pt', fontWeight: '700', marginBottom: '8px' }}>1. ANALYTICAL SUMMARY</div>
          <div style={{ fontSize: '9.5pt', color: '#1e293b', lineHeight: '1.6', marginBottom: '1rem' }}>
            <p style={{ margin: '0 0 6px 0' }}>{report.narrative.intro}{report.narrative.subjectLine}</p>
            <p style={{ margin: '0 0 6px 0' }}>{report.narrative.methodText}</p>
            <p style={{ margin: 0 }}>{report.narrative.findingsText}</p>
          </div>
        </>
      )}

      <div style={{ background: '#1e3a8a', color: 'white', padding: '5px 10px', fontSize: '9pt', fontWeight: '700', marginBottom: '8px' }}>2. QUANTITATIVE RESULTS</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '1rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#dbeafe' }}>
            {['Analyte', 'Screening Result', 'Confirmatory Result', 'Cutoff Level', 'Observed Concentration'].map(h => (
              <th key={h} style={{ border: '1px solid #93c5fd', padding: '6px 8px', textAlign: 'left', fontWeight: '700', color: '#1e3a8a' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.analytes.map((a, i) => (
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

      {report.narrative && (
        <>
          <div style={{ background: '#1e3a8a', color: 'white', padding: '5px 10px', fontSize: '9pt', fontWeight: '700', marginBottom: '8px' }}>3. LABORATORY INTERPRETATION</div>
          <div style={{ fontSize: '9.5pt', color: '#1e293b', lineHeight: '1.6', marginBottom: '1rem' }}>
            <p style={{ margin: '0 0 8px 0' }}>{report.narrative.conclusion}</p>
            {positives.length > 0 && (
              <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', padding: '8px 12px' }}>
                <strong style={{ color: '#92400e' }}>⚠ POSITIVE FINDINGS: </strong>
                <span style={{ color: '#78350f' }}>{positives.map(a => `${a.analyte} at ${a.observed}`).join(' | ')}</span>
              </div>
            )}
          </div>
        </>
      )}

      <div style={{ background: '#1e3a8a', color: 'white', padding: '5px 10px', fontSize: '9pt', fontWeight: '700', marginBottom: '8px' }}>4. CHAIN OF CUSTODY &amp; AUTHENTICATION</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', border: '1px solid #e2e8f0', fontSize: '9pt', marginBottom: '10px' }}>
        {[
          ['Submitted By', report.pdName || 'N/A'],
          ['Received By', report.analyst],
          ['Object Submitted', report.objectDesc || 'N/A'],
          ['Specimen Type', report.specimenType],
          ['Submission Location', report.location || 'N/A'],
          ['Seal Status', 'Intact — Chain of Custody Verified'],
        ].map(([k, v], i) => (
          <div key={i} style={{ padding: '5px 10px', borderBottom: '1px solid #e2e8f0', borderRight: i % 2 === 0 ? '1px solid #e2e8f0' : 'none', background: i % 4 < 2 ? '#f8fafc' : 'white' }}>
            <div style={{ fontSize: '7pt', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>{k}</div>
            <div style={{ color: '#1e293b', fontWeight: '500' }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '2px solid #1e3a8a' }}>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <div style={{ borderBottom: '1px solid #334155', marginBottom: '4px', height: '28px' }}></div>
          <div style={{ fontSize: '8pt', color: '#475569', fontWeight: '600' }}>Lead Forensic Toxicologist</div>
          <div style={{ fontSize: '8pt', color: '#475569' }}>Trifinity EMS Forensic Laboratory</div>
        </div>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <div style={{ borderBottom: '1px solid #334155', marginBottom: '4px', height: '28px' }}></div>
          <div style={{ fontSize: '8pt', color: '#475569', fontWeight: '600' }}>Requesting Officer Acknowledgement</div>
          <div style={{ fontSize: '8pt', color: '#475569' }}>{report.pdName || 'LSPD Officer'}</div>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '10px', padding: '6px', background: '#f0fdf4', border: '1px solid #86efac', fontSize: '8pt' }}>
        <strong style={{ color: '#15803d' }}>✓ CHAIN OF CUSTODY VERIFIED — DIGITAL CERTIFICATE &amp; AUDIT TRAIL COMPLETE</strong>
        <div style={{ color: '#475569', marginTop: '2px' }}>Report ID: {report.emsCaseNumber} | Generated: {report.date} | Trifinity EMS Forensic Lab</div>
      </div>
    </div>
  );
};

export default ReportsList;
