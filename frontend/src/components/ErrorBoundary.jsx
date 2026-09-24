import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('UI error:', error, info);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div className="container" style={{ padding: '2rem' }}>
          <div className="alert alert-error">
            <strong>Something went wrong loading this page.</strong>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>{error.message}</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
