'use client';

import { useEffect, useState, useCallback } from 'react';

export default function StatusMonitor() {
  const [status, setStatus] = useState({
    openwebrx: false,
    spyserver: false,
    rtltcp: false,
    aisdispatcher: false,
    aiscatcher: false,
    signalk: false,
    activeMode: 'off',
  });
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // silent fail, retry on next poll
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="panel">
        <h2>Service Status</h2>
        <p className="status-text">Loading...</p>
      </div>
    );
  }

  const services = [
    { name: 'OpenWebRX', key: 'openwebrx' },
    { name: 'SpyServer', key: 'spyserver' },
    { name: 'rtl_tcp', key: 'rtltcp' },
    { name: 'AIS Dispatcher', key: 'aisdispatcher' },
    { name: 'AIS Catcher', key: 'aiscatcher' },
    { name: 'SignalK', key: 'signalk' },
  ];

  return (
    <div className="panel">
      <h2>Service Status</h2>
      <div className="status-cards">
        {services.map((svc) => (
          <div key={svc.key} className="status-item">
            <span className="status-name">{svc.name}</span>
            <span className={`badge ${status[svc.key] ? 'badge-green' : 'badge-red'}`}>
              {status[svc.key] ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
