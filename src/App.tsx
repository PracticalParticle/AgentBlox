import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import CopilotPage from './pages/CopilotPage';
import ConsolePage from './pages/ConsolePage';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <Link to="/">AgentBlox</Link>
          <span className="tagline">Treasury Copilot · Bloxchain Protocol</span>
        </div>
        <nav className="nav">
          <Link to="/">Copilot</Link>
          <Link to="/console">Console</Link>
        </nav>
        <DynamicWidget />
      </header>
      <main className="app-main app-main-wide">
        <Routes>
          <Route path="/" element={<CopilotPage />} />
          <Route path="/console" element={<ConsolePage />} />
          <Route path="/treasury" element={<Navigate to="/console" replace />} />
          <Route path="/agent" element={<Navigate to="/" replace />} />
          <Route path="/dashboard" element={<Navigate to="/console" replace />} />
        </Routes>
      </main>
    </div>
  );
}
