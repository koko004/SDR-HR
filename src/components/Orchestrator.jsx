'use client';

import { useState, useEffect, useCallback } from 'react';

export default function Orchestrator({ onModeChange }) {
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState(null);
  const [activeMode, setActiveMode] = useState('off');

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setActiveMode(data.activeMode);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const switchMode = async (mode) => {
    if (switching) return;
    setSwitching(true);
    setError(null);

    try {
      const res = await fetch('/api/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || data.error || 'Failed to switch mode');
      } else {
        setActiveMode(data.mode);
        onModeChange();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }

    setSwitching(false);
  };

  const modes = [
    {
      id: 'openwebrx',
      label: 'Web Mode',
      desc: 'OpenWebRX',
      icon: '\u{1F310}',
    },
    {
      id: 'spyserver',
      label: 'Network Mode',
      desc: 'SpyServer',
      icon: '\u{1F4E1}',
    },
    {
      id: 'rtltcp',
      label: 'TCP Mode',
      desc: 'rtl_tcp',
      icon: '\u{1F50C}',
    },
    {
      id: 'aiscatcher',
      label: 'AIS Mode',
      desc: 'AIS Catcher',
      icon: '\u{1F6A2}',
    },
    {
      id: 'signalk',
      label: 'SignalK',
      desc: 'Marine Data',
      icon: '\u{1F30A}',
    },
    {
      id: 'off',
      label: 'Power Off',
      desc: 'Release USB',
      icon: '\u23FB',
    },
  ];

  return (
    <div className="panel">
      <h2>Service Orchestrator</h2>
      <p className="panel-subtitle">Only one service can use the USB tuner at a time.</p>

      <div className="mode-cards">
        {modes.map((m) => {
          const isActive = activeMode === m.id;
          return (
            <button
              key={m.id}
              className={`mode-card ${isActive ? 'active' : ''} ${switching ? 'disabled' : ''}`}
              onClick={() => switchMode(m.id)}
              disabled={switching}
            >
              <span className="mode-icon">{m.icon}</span>
              <span className="mode-label">{m.label}</span>
              <span className="mode-desc">{m.desc}</span>
              {isActive && <span className="mode-badge">ACTIVE</span>}
            </button>
          );
        })}
      </div>

      {switching && <p className="status-text switching">Switching mode...</p>}
      {error && <p className="status-text error">{error}</p>}
    </div>
  );
}
