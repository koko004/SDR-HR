'use client';

import { useEffect, useState, useCallback } from 'react';

export default function SystemMonitor() {
  const [data, setData] = useState({
    temp: 'N/A',
    cpu: 'N/A',
    ram: { used: 0, total: 0 },
    swap: { used: 0, total: 0 },
    net: { rx: '0 B', tx: '0 B' },
    uptime: 'N/A',
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/system');
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const pct = (used, total) => {
    if (!total) return 0;
    return Math.round((used / total) * 100);
  };

  if (loading) {
    return (
      <div className="panel">
        <h2>Monitor del Sistema</h2>
        <p className="status-text">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>Monitor del Sistema</h2>
      <div className="system-grid">
        <div className="sys-item">
          <span className="sys-label">Temperatura</span>
          <span className={`sys-value ${parseFloat(data.temp) > 60 ? 'sys-warn' : ''}`}>
            {data.temp}
          </span>
        </div>
        <div className="sys-item">
          <span className="sys-label">CPU</span>
          <span className="sys-value">{data.cpu}</span>
        </div>
        <div className="sys-item sys-full">
          <span className="sys-label">RAM</span>
          <div className="sys-bar-container">
            <div className="sys-bar">
              <div
                className="sys-bar-fill sys-bar-ram"
                style={{ width: `${pct(data.ram.used, data.ram.total)}%` }}
              />
            </div>
            <span className="sys-bar-text">
              {formatBytes(data.ram.used)} / {formatBytes(data.ram.total)}
            </span>
          </div>
        </div>
        <div className="sys-item sys-full">
          <span className="sys-label">Swap</span>
          <div className="sys-bar-container">
            <div className="sys-bar">
              <div
                className="sys-bar-fill sys-bar-swap"
                style={{ width: `${pct(data.swap.used, data.swap.total)}%` }}
              />
            </div>
            <span className="sys-bar-text">
              {formatBytes(data.swap.used)} / {formatBytes(data.swap.total)}
            </span>
          </div>
        </div>
        <div className="sys-item">
          <span className="sys-label">Red RX</span>
          <span className="sys-value sys-net-rx">{data.net.rx}</span>
        </div>
        <div className="sys-item">
          <span className="sys-label">Red TX</span>
          <span className="sys-value sys-net-tx">{data.net.tx}</span>
        </div>
        <div className="sys-item sys-full">
          <span className="sys-label">Uptime</span>
          <span className="sys-value">{data.uptime}</span>
        </div>
      </div>
    </div>
  );
}
