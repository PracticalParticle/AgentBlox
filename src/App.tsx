import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import WorkspacePage from './pages/WorkspacePage';
import SetupPage from './pages/SetupPage';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <Link to="/">AgentBlox</Link>
          <span className="tagline">Treasury Workspace · Bloxchain Protocol</span>
        </div>
        <nav className="nav">
          <Link to="/">Workspace</Link>
          <Link to="/setup">Setup</Link>
        </nav>
        <DynamicWidget />
      </header>
      <main className="app-main app-main-wide">
        <Routes>
          <Route path="/" element={<WorkspacePage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/console" element={<Navigate to="/setup" replace />} />
          <Route path="/copilot" element={<Navigate to="/" replace />} />
          <Route path="/treasury" element={<Navigate to="/setup" replace />} />
          <Route path="/agent" element={<Navigate to="/" replace />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
