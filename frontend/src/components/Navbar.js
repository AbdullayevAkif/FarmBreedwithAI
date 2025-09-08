import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', emoji: '📊' },
    { path: '/animals', label: 'Animals', emoji: '🐑' },
    { path: '/breeding', label: 'Breeding', emoji: '💕' },
    { path: '/breeding-box', label: 'Breeding Box', emoji: '🧬' },
    { path: '/ai-advisor', label: 'AI Advisor', emoji: '🤖' },
    { path: '/schedule', label: 'Schedule', emoji: '📅' },
  ];

  const isActive = (path) => location.pathname === path;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          <span className="emoji">🐄</span>
          <span className="navbar-title">Farm Breed AI</span>
        </Link>

        <div className={`navbar-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          <div className="navbar-nav">
            {navItems.map(({ path, label, emoji }) => (
              <Link
                key={path}
                to={path}
                className={`nav-link ${isActive(path) ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="emoji">{emoji}</span>
                <span>{label}</span>
              </Link>
            ))}
          </div>

          <div className="navbar-user">
            <div className="user-info">
              <div className="user-avatar">
                <span className="emoji">👤</span>
              </div>
              <div className="user-details">
                <div className="user-name">{user?.firstName} {user?.lastName}</div>
                <div className="user-farm">{user?.farmName}</div>
              </div>
            </div>
            <Link to="/profile" className="nav-link">
              <span className="emoji">👤</span>
              <span>Profile</span>
            </Link>
            <button onClick={handleLogout} className="btn btn-outline">
              <span className="emoji">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>

        <button
          className="navbar-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? '❌' : '☰'}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;



