import React from 'react';
import { useNavigate } from 'react-router-dom';

class POSErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('POS Error:', error, errorInfo);
    // Log error to your error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong with the POS system</h2>
          <p>{this.state.error.message}</p>
          <button 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset?.();
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Create a new functional component that wraps your component with the error boundary
export const withErrorBoundary = (WrappedComponent) => {
  return function WrappedWithErrorBoundary(props) {
    const navigate = useNavigate();
    return (
      <POSErrorBoundary onReset={() => navigate('/pos')}>
        <WrappedComponent {...props} />
      </POSErrorBoundary>
    );
  };
};

export default POSErrorBoundary;