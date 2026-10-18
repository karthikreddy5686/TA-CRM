import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled CRM Component Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    // If it's a persistent cache glitch, reload cleanly
    try {
      if ('caches' in window) {
        caches.keys().then(keys => {
          keys.forEach(k => caches.delete(k));
        });
      }
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: '#ffffff',
          padding: '24px',
          textAlign: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            marginBottom: '10px',
            color: '#ffffff'
          }}>
            flu<span style={{ color: '#facc15' }}>X</span>
          </div>

          <div style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '20px'
          }}>
            Talent Acquisition CRM
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '20px 24px',
            maxWidth: '420px',
            width: '100%',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px 0' }}>
              App Session Recovered
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              A temporary cache or connection interruption was resolved. Click below to continue right where you left off.
            </p>
          </div>

          <button
            onClick={this.handleReload}
            style={{
              background: '#facc15',
              color: '#0f172a',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 28px',
              fontSize: '0.9rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(250, 204, 21, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ↻ Reload CRM App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
