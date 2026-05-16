'use client';

import { useEffect, useState, useCallback } from 'react';

export default function StatusMonitor() {
  const [status, setStatus] = useState({
    openwebrx: false,
    spyserver: false,
    rtltcp: false,
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
        <h2>Monitor de Estado</h2>
        <p className="status-text">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>Monitor de Estado</h2>
      <div className="status-cards">
        <div className="status-item">
          <span className="status-name">OpenWebRX</span>
          <span className={`badge ${status.openwebrx ? 'badge-green' : 'badge-red'}`}>
            {status.openwebrx ? 'ACTIVO' : 'INACTIVO'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-name">SpyServer</span>
          <span className={`badge ${status.spyserver ? 'badge-green' : 'badge-red'}`}>
            {status.spyserver ? 'ACTIVO' : 'INACTIVO'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-name">rtl_tcp</span>
          <span className={`badge ${status.rtltcp ? 'badge-green' : 'badge-red'}`}>
            {status.rtltcp ? 'ACTIVO' : 'INACTIVO'}
          </span>
        </div>
      </div>
    </div>
  );
}
