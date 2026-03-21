import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Lock, Shield, Mail, Activity, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'EMS' // Default EMS only
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth(); // Assume added to context
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await register(formData.username, formData.email, formData.password, formData.role);
    setLoading(false);
    if (result.success) {
      navigate('/login');
    } else {
      setError(result.message || 'Signup failed');
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '80vh',
      padding: '20px',
      background: 'var(--bg-gradient)'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '450px',
          padding: '2.5rem',
          borderRadius: '24px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ color: 'var(--accent-cyan)', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <UserPlus size={56} />
          </div>
          <h2 style={{ fontSize: '2.2rem', backgroundImage: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Create EMS Account
          </h2>
          <p style={{ color: 'var(--text-dim)' }}>Join MedTox Lab Portal</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <User size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)' }} />
            <input
              name="username"
              placeholder="EMS Username"
              value={formData.username}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '1rem 1rem 1rem 3rem',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                color: 'white',
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)'
              }}
              required
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Mail size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)' }} />
            <input
              name="email"
              type="email"
              placeholder="EMS Email"
              value={formData.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '1rem 1rem 1rem 3rem',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                color: 'white',
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)'
              }}
              required
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)' }} />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '1rem 1rem 1rem 3rem',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                color: 'white',
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)'
              }}
              minLength="6"
              required
            />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>
              <Shield size={18} /> Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '1rem',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                color: 'white',
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <option value="EMS">EMS Lab Technician</option>
            </select>
          </div>

          {error && (
            <div style={{
              color: '#ff4b4b',
              backgroundColor: 'rgba(255, 75, 75, 0.15)',
              padding: '1rem',
              borderRadius: '12px',
              borderLeft: '4px solid #ff4b4b',
              backdropFilter: 'blur(10px)'
            }}>
              {error}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            style={{
              padding: '1.2rem',
              background: 'linear-gradient(135deg, rgba(0,242,255,0.3), rgba(139,92,246,0.3))',
              border: '1px solid var(--accent-cyan)',
              borderRadius: '16px',
              color: 'var(--accent-cyan)',
              fontWeight: 600,
              fontSize: '1.1rem',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Creating Account...' : 'Create EMS Account'}
          </motion.button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
          Already have account? <a href="/login" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 600 }}>Sign In</a>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
