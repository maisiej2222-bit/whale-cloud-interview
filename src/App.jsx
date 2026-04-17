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
        <div className="header-content" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img
            src="/whale-cloud-logo.png"
            alt="Whale Cloud"
            style={{ height: '50px', objectFit: 'contain' }}
          />
          <div>
            <h1>Start a Chat with Maisie2</h1>
            <p>Whale Spotlight 2026</p>
          </div>
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
