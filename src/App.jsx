import React, { useState } from 'react';
import { Lock, Users } from 'lucide-react';
import PublicInterview from './components/PublicInterview';
import AdminPanel from './components/AdminPanel';
import './App.css';

function App() {
  const [view, setView] = useState('public'); // 'public' or 'admin'
  const [isAdminAuth, setIsAdminAuth] = useState(false);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🐋 Whale Cloud Interview Platform</h1>
          <p>Employee Spotlight Series 2026</p>
        </div>
        <nav className="header-nav">
          <button
            className={`nav-btn ${view === 'public' ? 'active' : ''}`}
            onClick={() => setView('public')}
          >
            <Users size={20} />
            <span>Interview</span>
          </button>
          <button
            className={`nav-btn ${view === 'admin' ? 'active' : ''}`}
            onClick={() => setView('admin')}
          >
            <Lock size={20} />
            <span>Admin</span>
          </button>
        </nav>
      </header>

      <main className="app-main">
        {view === 'public' ? (
          <PublicInterview />
        ) : (
          <AdminPanel
            isAuthenticated={isAdminAuth}
            onAuthenticate={setIsAdminAuth}
          />
        )}
      </main>
    </div>
  );
}

export default App;
