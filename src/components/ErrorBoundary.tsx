import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'An unexpected application error occurred.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-lg border border-[#C8231D]/30 bg-white p-6 space-y-4">
            <p className="text-xs font-semibold text-[#C8231D]">System Notice</p>
            <h1 className="font-serif text-2xl text-[#111827]">
              Unable to complete this operation
            </h1>
            <p className="text-sm text-[#4B5563] break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 rounded-md bg-[#194793] text-white text-sm font-semibold hover:bg-[#133672]"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
