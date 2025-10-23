import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Met à jour l'état pour afficher l'UI de repli
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Tu peux aussi logguer l'erreur à un service externe ici
    console.error("Erreur capturée par ErrorBoundary :", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'red' }}>
          <h2>Oups, une erreur s'est produite !</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
