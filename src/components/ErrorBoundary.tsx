import { ReactNode, Component, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('❌ Error caught by boundary:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error details:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a2e',
          color: '#fff',
          flexDirection: 'column',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '600px'
          }}>
            <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>⚠️ Something went wrong</h1>
            <p style={{ marginBottom: '16px', color: '#aaa' }}>
              An error occurred while rendering the application.
            </p>
            <details style={{
              backgroundColor: '#0f0f1e',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'left',
              marginBottom: '16px',
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              <summary style={{ cursor: 'pointer', color: '#ff6b6b' }}>
                Error details (click to expand)
              </summary>
              <pre style={{
                marginTop: '8px',
                fontSize: '12px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.error?.toString()}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
