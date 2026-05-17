export const dynamic = 'force-dynamic';

export default function ErrorPage({ error, reset }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0f1117', color: '#e2e8f0', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Something went wrong</h1>
        <p style={{ color: '#f87171' }}>{error?.message || 'Unknown error'}</p>
        <button onClick={reset} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', marginTop: '16px' }}>
          Try again
        </button>
      </div>
    </div>
  );
}
