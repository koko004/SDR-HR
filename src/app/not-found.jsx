'use client';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0f1117', color: '#e2e8f0', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', margin: 0 }}>404</h1>
        <p>Page not found</p>
        <a href="/" style={{ color: '#60a5fa' }}>Go home</a>
      </div>
    </div>
  );
}
