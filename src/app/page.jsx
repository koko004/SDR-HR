'use client';

import { useState } from 'react';
import InstallPanel from '../components/InstallPanel.jsx';
import Orchestrator from '../components/Orchestrator.jsx';
import StatusMonitor from '../components/StatusMonitor.jsx';
import SystemMonitor from '../components/SystemMonitor.jsx';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="app">
      <header className="header">
        <h1>SDR-HR</h1>
        <p>Gestor de Receptor RTL-SDR</p>
      </header>

      <main className="main">
        <SystemMonitor />
        <StatusMonitor key={refreshKey} />
        <Orchestrator onModeChange={() => setRefreshKey((k) => k + 1)} />
        <InstallPanel />
      </main>

      <footer className="footer">
        <p>SDR-HR &middot; Next.js &middot; Armbian</p>
      </footer>

      <style jsx global>{`
        *,
        *::before,
        *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
            'Helvetica Neue', Arial, sans-serif;
          background: #0f1117;
          color: #e2e8f0;
          min-height: 100vh;
          line-height: 1.5;
        }

        .app {
          max-width: 720px;
          margin: 0 auto;
          padding: 24px 16px;
        }

        .header {
          text-align: center;
          margin-bottom: 32px;
        }

        .header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #60a5fa;
          letter-spacing: 0.05em;
        }

        .header p {
          font-size: 0.875rem;
          color: #94a3b8;
          margin-top: 4px;
        }

        .main {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .panel {
          background: #1a1d2e;
          border: 1px solid #2d3148;
          border-radius: 12px;
          padding: 20px;
        }

        .panel h2 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #f1f5f9;
          margin-bottom: 4px;
        }

        .panel-subtitle {
          font-size: 0.8rem;
          color: #64748b;
          margin-bottom: 16px;
        }

        .install-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .install-item {
          flex: 1;
          min-width: 180px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .installed-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
        }

        .installed-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: #4ade80;
        }

        .installed-url {
          font-size: 0.7rem;
          color: #94a3b8;
          word-break: break-all;
        }

        .btn {
          flex: 1;
          min-width: 180px;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #3b82f6;
          color: #fff;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-secondary {
          background: #8b5cf6;
          color: #fff;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #7c3aed;
        }

        .btn-tertiary {
          background: #059669;
          color: #fff;
        }

        .btn-tertiary:hover:not(:disabled) {
          background: #047857;
        }

        .btn-reinstall {
          background: #dc2626;
          color: #fff;
          padding: 6px 14px;
          font-size: 0.75rem;
          min-width: auto;
          margin-top: 4px;
        }

        .btn-reinstall:hover:not(:disabled) {
          background: #b91c1c;
        }

        .log-container {
          margin-top: 16px;
          background: #0d0f17;
          border: 1px solid #1e2235;
          border-radius: 8px;
          max-height: 280px;
          overflow-y: auto;
        }

        .log-output {
          padding: 12px;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.75rem;
          color: #22c55e;
          white-space: pre-wrap;
          word-break: break-all;
          line-height: 1.6;
        }

        .mode-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .mode-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 16px 8px;
          background: #232640;
          border: 2px solid transparent;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
          color: #e2e8f0;
        }

        .mode-card:hover:not(.disabled) {
          border-color: #3b82f6;
          background: #2a2d4a;
        }

        .mode-card.active {
          border-color: #22c55e;
          background: #1a2e1a;
        }

        .mode-card.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .mode-icon {
          font-size: 1.5rem;
        }

        .mode-label {
          font-size: 0.85rem;
          font-weight: 600;
        }

        .mode-desc {
          font-size: 0.7rem;
          color: #94a3b8;
        }

        .mode-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          font-size: 0.55rem;
          font-weight: 700;
          background: #22c55e;
          color: #000;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .status-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #232640;
          border-radius: 8px;
        }

        .status-name {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .badge {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          letter-spacing: 0.05em;
        }

        .badge-green {
          background: #166534;
          color: #4ade80;
        }

        .badge-red {
          background: #7f1d1d;
          color: #f87171;
        }

        .status-text {
          font-size: 0.8rem;
          margin-top: 12px;
          text-align: center;
        }

        .status-text.switching {
          color: #60a5fa;
        }

        .status-text.error {
          color: #f87171;
        }

        .spinner {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .spinner-dot {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .system-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .sys-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px;
          background: #232640;
          border-radius: 8px;
        }

        .sys-item.sys-full {
          grid-column: 1 / -1;
        }

        .sys-label {
          font-size: 0.75rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .sys-value {
          font-size: 1.1rem;
          font-weight: 600;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }

        .sys-warn {
          color: #f87171;
        }

        .sys-net-rx {
          color: #60a5fa;
        }

        .sys-net-tx {
          color: #a78bfa;
        }

        .sys-bar-container {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 4px;
        }

        .sys-bar {
          flex: 1;
          height: 8px;
          background: #1e2235;
          border-radius: 4px;
          overflow: hidden;
        }

        .sys-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .sys-bar-ram {
          background: #3b82f6;
        }

        .sys-bar-swap {
          background: #f59e0b;
        }

        .sys-bar-text {
          font-size: 0.75rem;
          color: #94a3b8;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          white-space: nowrap;
        }

        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 16px;
          border-top: 1px solid #2d3148;
          font-size: 0.75rem;
          color: #475569;
        }

        @media (max-width: 480px) {
          .mode-cards {
            grid-template-columns: 1fr;
          }

          .install-buttons {
            flex-direction: column;
          }

          .btn {
            min-width: 100%;
          }

          .system-grid {
            grid-template-columns: 1fr;
          }

          .sys-item.sys-full {
            grid-column: auto;
          }
        }
      `}</style>
    </div>
  );
}
