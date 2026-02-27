import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
                    <div className="glass bg-slate-800/95 rounded-2xl p-8 max-w-md w-full text-center border border-red-500/30">
                        <div className="p-4 bg-red-500/10 rounded-full w-fit mx-auto mb-4">
                            <AlertTriangle className="w-10 h-10 text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
                        <p className="text-slate-400 text-sm mb-2">
                            {this.props.name
                                ? `The ${this.props.name} page encountered an error.`
                                : 'This page encountered an unexpected error.'}
                        </p>
                        {this.state.error && (
                            <pre className="text-xs text-red-400 bg-red-500/10 rounded-lg p-3 mb-4 text-left overflow-x-auto whitespace-pre-wrap">
                                {this.state.error.message}
                            </pre>
                        )}
                        <button
                            onClick={this.handleReset}
                            className="flex items-center gap-2 mx-auto px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" /> Try Again
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
