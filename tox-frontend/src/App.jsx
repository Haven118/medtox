import { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import { LayoutDashboard, Search, FileText, LogOut, FolderOpen } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import ToxSearch from './components/ToxSearch'
import ReportWizard from './components/ReportWizard'
import ReportsList from './components/ReportsList'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import './App.css'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="app" style={{minHeight: '100vh'}}>
      <nav className="glass-panel app-nav" style={{
        position: 'fixed', left: '20px', top: '50%', transform: 'translateY(-50%)',
        width: isNavOpen ? '280px' : '80px', padding: '30px 0', display: 'flex', flexDirection: 'column', gap: '25px',
        transition: 'width 0.4s'
      }}>
        <button onClick={() => setIsNavOpen(o => !o)} style={{
          color: 'var(--accent-cyan)', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '20px', padding: '12px 25px', fontSize: '1.2rem'
        }}>
          {isNavOpen ? '✕' : '☰'}
        </button>
        <Link to="/" style={{color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '20px', padding: '12px 25px'}}>
          <LayoutDashboard size={20} />
          {isNavOpen && <span>Dashboard</span>}
        </Link>
        <Link to="/search" style={{color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '20px', padding: '12px 25px'}}>
          <Search size={20} />
          {isNavOpen && <span>Tox Search</span>}
        </Link>
        <Link to="/reports" style={{color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '20px', padding: '12px 25px'}}>
          <FolderOpen size={20} />
          {isNavOpen && <span>Reports</span>}
        </Link>
        <Link to="/report" style={{color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '20px', padding: '12px 25px'}}>
          <FileText size={20} />
          {isNavOpen && <span>New Report</span>}
        </Link>
        {user && (
          <>
            <div style={{padding: '12px 25px', color: 'var(--text-dim)', fontSize: '0.9rem'}}>
              {isNavOpen && <span>{user.username} ({user.role})</span>}
            </div>
            <button onClick={handleLogout} style={{color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '20px', padding: '12px 25px', background: 'none', border: 'none', cursor: 'pointer'}}>
              <LogOut size={20} />
              {isNavOpen && <span>Logout</span>}
            </button>
          </>
        )}
      </nav>
      <main style={{paddingLeft: '120px', paddingTop: '40px'}}>
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <div><h1 style={{color: 'var(--accent-cyan)'}}>MedTox Dashboard</h1><p>Welcome {user?.role || 'EMS'} - Ready for tox queries</p></div>
            </ProtectedRoute>
          } />
          <Route path="/search" element={
            <ProtectedRoute>
              <ToxSearch />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <ReportsList />
            </ProtectedRoute>
          } />
          <Route path="/report" element={
            <ProtectedRoute>
              <ReportWizard />
            </ProtectedRoute>
          } />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
