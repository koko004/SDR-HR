'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

const INSTALLERS = [
  { id: 'openwebrx', name: 'OpenWebRX', endpoint: '/api/install/openwebrx', btnClass: 'btn-primary' },
  { id: 'spyserver', name: 'SpyServer', endpoint: '/api/install/spyserver', btnClass: 'btn-secondary' },
  { id: 'rtltcp', name: 'rtl_tcp', endpoint: '/api/install/rtltcp', btnClass: 'btn-tertiary' },
  { id: 'aisdispatcher', name: 'AIS Dispatcher', endpoint: '/api/install/aisdispatcher', btnClass: 'btn-ais' },
  { id: 'aiscatcher', name: 'AIS Catcher', endpoint: '/api/install/aiscatcher', btnClass: 'btn-ais' },
  { id: 'signalk', name: 'SignalK', endpoint: '/api/install/signalk', btnClass: 'btn-signalk' },
];

export default function InstallPanel() {
  const [installing, setInstalling] = useState(null);
  const [logs, setLogs] = useState('');
  const [status, setStatus] = useState(null);
  const logRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/install/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const runInstall = useCallback(
    async (endpoint, name, operation = 'Installing') => {
      setInstalling(name);
      setLogs(`=== ${operation} ${name} ===\n\n`);

      try {
        const res = await fetch(endpoint, { method: 'POST' });
        if (!res.ok || !res.body) {
          setLogs((prev) => prev + `ERROR: HTTP ${res.status}\n`);
          setInstalling(null);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const parsed = JSON.parse(line.slice(6));
              setLogs((prev) => prev + parsed.text);
              if (parsed.text === 'DONE') {
                fetchStatus();
                setLogs((prev) => prev + `\nOperation completed successfully.`);
              }
            } catch {
              // skip
            }
          }

          if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setLogs((prev) => prev + `\nERROR: ${msg}\n`);
      }

      setInstalling(null);
    },
    [fetchStatus]
  );

  const handleRemove = (inst) => {
    if (!confirm(`Delete ${inst.name}? This will stop the service and remove all its files.`)) {
      return;
    }
    runInstall(`${inst.endpoint}/remove`, inst.name, 'Removing');
  };

  return (
    <div className="panel">
      <h2>Installation Panel</h2>
      <div className="install-buttons">
        {INSTALLERS.map((inst) => {
          const isInstalled = status && status[`${inst.id}Installed`];
          const url = status && status[`${inst.id}Url`];
          const isInstalling = installing === inst.name;

          return (
            <div key={inst.id} className="install-item">
              <button
                className={`btn ${inst.btnClass}`}
                onClick={() => runInstall(inst.endpoint, inst.name)}
                disabled={isInstalling || isInstalled}
              >
                {isInstalling ? (
                  <span className="spinner">
                    <span className="spinner-dot" /> Processing {inst.name}...
                  </span>
                ) : isInstalled ? (
                  `${inst.name} Installed`
                ) : (
                  `Install ${inst.name}`
                )}
              </button>
              {isInstalled && (
                <div className="installed-info">
                  <span className="installed-name">{inst.name} active</span>
                  <span className="installed-url">{url}</span>
                  <button
                    className="btn btn-delete"
                    onClick={() => handleRemove(inst)}
                    disabled={isInstalling}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {logs && (
        <div className="log-container">
          <pre ref={logRef} className="log-output">
            {logs}
          </pre>
        </div>
      )}
    </div>
  );
}
