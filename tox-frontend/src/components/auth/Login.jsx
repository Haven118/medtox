import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Lock, Shield, Activity } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PD');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(username, password, role);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Login failed');
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '80vh',
      padding: '20px',
      background: 'var(--bg-gradient, linear-gradient(135deg, #0a0a1e 0%, #1a0033 50%, #0f0f2b 100%)'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '2.5rem',
          borderRadius: '24px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 45px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ color: 'var(--accent-cyan, #00f2ff)', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <Activity size={56} />
          </div>
          <h2 style={{ fontSize: '2.2rem', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            MedTox Login
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem' }}>PD/EMS Toxicology Portal</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <User size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)' }} />
            <input
              type="text"
              placeholder="Username (pd_officer / ems_lab)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem 1rem 1rem 3rem',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                color: 'white',
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                outline: 'none',
                fontSize: '1rem'
              }}
              required
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)' }} />
            <input
              type="password"
              placeholder="Password (PASS123)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem 1rem 1rem 3rem',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                color: 'white',
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                outline: 'none',
                fontSize: '1rem'
              }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              <Shield size={18} /> Role:
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                color: 'white',
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                outline: 'none',
                fontSize: '1rem'
              }}
            >
              <option value="PD">PD Officer</option>
              <option value="EMS">EMS Lab</option>
            </select>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                color: '#ff4b4b',
                fontSize: '0.9rem',
                backgroundColor: 'rgba(255, 75, 75, 0.15)',
                padding: '1rem',
                borderRadius: '12px',
                borderLeft: '4px solid #ff4b4b',
                backdropFilter: 'blur(10px)'
              }}
            >
              {error}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            style={{
              padding: '1.2rem',
              background: 'linear-gradient(135deg, rgba(0,242,255,0.3), rgba(100,200,255,0.3))',
              border: '1px solid var(--accent-cyan)',
              borderRadius: '16px',
              color: 'var(--accent-cyan)',
              fontWeight: 600,
              fontSize: '1.1rem',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </motion.button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
          Demo: pd_officer/PASS123 or ems_lab/PASS123
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
