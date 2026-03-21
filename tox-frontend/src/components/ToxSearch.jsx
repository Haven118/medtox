import { useState, useEffect } from 'react';
import { Search, Loader } from 'lucide-react';
import API_URL from '../config';

const ToxSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/tox/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div className="glass-panel" style={{padding: '2rem', maxWidth: '600px', margin: '2rem auto'}}>
      <h2 style={{color: 'var(--accent-cyan)', marginBottom: '1rem'}}>Tox Query</h2>
      <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. fentanyl, needle"
          style={{flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'white'}}
        />
        <button onClick={handleSearch} disabled={loading} style={{padding: '0.75rem 1.5rem', background: 'var(--accent-cyan)', border: 'none', borderRadius: '12px', cursor: 'pointer'}}>
          {loading ? <Loader className="animate-spin" size={20} /> : <Search size={20} />}
        </button>
      </div>
      <div>
        {results.map((drug) => (
          <div key={drug.id} style={{padding: '1rem', background: 'rgba(255,255,255,0.03)', marginBottom: '0.5rem', borderRadius: '8px'}}>
            <h4 style={{color: 'var(--accent-cyan)'}}>{drug.name}</h4>
            <p><strong>Category:</strong> {drug.category}</p>
            <p><strong>Effects:</strong> {drug.effects}</p>
            <p><strong>Tests Run:</strong> {drug.tests?.join(', ')}</p>
            <p><strong>Findings:</strong> {drug.findings}</p>
            <p style={{color: 'var(--accent-purple)'}}>EMS: ${drug.rpBilling}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToxSearch;

