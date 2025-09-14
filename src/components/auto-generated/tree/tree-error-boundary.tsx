/**
 * Tree Error Boundary - Robust error handling for tree components
 * 
 * Features:
 * - Catches JavaScript errors in tree components
 * - Provides fallback UI with recovery options
 * - Logs errors for monitoring
 * - Preserves tree state when possible
 * - Graceful degradation
 * - User-friendly error messages
 */

"use client";

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug, 
  ArrowLeft,
  Copy,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils/generalUtils';

// ============================================================================
// TYPES
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  lastErrorTime: number;
}

interface TreeErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  className?: string;
}

interface ErrorAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

export class TreeErrorBoundary extends Component<TreeErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: NodeJS.Timeout | null = null;
  private readonly maxRetries: number;

  constructor(props: TreeErrorBoundaryProps) {
    super(props);
    
    this.maxRetries = props.maxRetries || 3;
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      lastErrorTime: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `tree-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo
    });

    // Log error for monitoring
    this.logError(error, errorInfo);
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);
    
    // Auto-recovery for transient errors
    if (this.isTransientError(error) && this.state.retryCount < this.maxRetries) {
      this.scheduleAutoRetry();
    }
  }

  componentDidUpdate(prevProps: TreeErrorBoundaryProps) {
    const { resetOnPropsChange } = this.props;
    const { hasError, error } = this.state;
    
    // Reset error state when props change (e.g., new tree data)
    if (resetOnPropsChange && hasError && error && prevProps.children !== this.props.children) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
        retryCount: 0,
        lastErrorTime: 0
      });
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount
    };

    console.error('🚨 Tree Error Boundary:', errorData);
    
    // Send to monitoring service (e.g., Sentry, LogRocket)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        extra: errorData,
        tags: {
          component: 'TreeErrorBoundary',
          errorId: this.state.errorId
        }
      });
    }
  };

  private isTransientError = (error: Error): boolean => {
    // Check if error might be transient (network, race conditions, etc.)
    const transientMessages = [
      'Network request failed',
      'fetch',
      'Connection',
      'timeout',
      'AbortError',
      'TypeError: Failed to fetch'
    ];
    
    return transientMessages.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  };

  private scheduleAutoRetry = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
    
    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 4000);
    
    this.resetTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: prevState.retryCount + 1,
      lastErrorTime: 0
    }));
    
    // Tree Error Boundary: Retry attempt
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      lastErrorTime: 0
    });
    
    // Tree Error Boundary: Manual reset
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleCopyError = () => {
    const { error, errorInfo, errorId } = this.state;
    
    const errorText = `
Tree Error Report
================
Error ID: ${errorId}
Time: ${new Date().toISOString()}
Message: ${error?.message || 'Unknown error'}

Stack Trace:
${error?.stack || 'No stack trace available'}

Component Stack:
${errorInfo?.componentStack || 'No component stack available'}

User Agent: ${navigator.userAgent}
URL: ${window.location.href}
    `.trim();
    
    navigator.clipboard.writeText(errorText).then(() => {
      // Error details copied to clipboard
    });
  };

  private handleReportBug = () => {
    const { error, errorId } = this.state;
    const issueUrl = `https://github.com/your-org/your-repo/issues/new?title=Tree%20Error%20${errorId}&body=${encodeURIComponent(`
Error ID: ${errorId}
Error: ${error?.message || 'Unknown error'}
Stack: ${error?.stack || 'No stack trace'}

Steps to reproduce:
1. 
2. 
3. 

Expected behavior:


Actual behavior:

    `)}`;
    
    window.open(issueUrl, '_blank');
  };

  private getErrorActions = (): ErrorAction[] => {
    const { retryCount } = this.state;
    const canRetry = retryCount < this.maxRetries;
    
    return [
      {
        id: 'retry',
        label: canRetry ? 'Try Again' : 'Reset',
        icon: RefreshCw,
        onClick: canRetry ? this.handleRetry : this.handleReset,
        variant: 'primary'
      },
      {
        id: 'reload',
        label: 'Reload Page',
        icon: RefreshCw,
        onClick: this.handleReload,
        variant: 'secondary'
      },
      {
        id: 'home',
        label: 'Go Home',
        icon: Home,
        onClick: this.handleGoHome,
        variant: 'secondary'
      },
      {
        id: 'copy',
        label: 'Copy Error',
        icon: Copy,
        onClick: this.handleCopyError,
        variant: 'secondary'
      },
      {
        id: 'report',
        label: 'Report Bug',
        icon: ExternalLink,
        onClick: this.handleReportBug,
        variant: 'secondary'
      }
    ];
  };

  private renderErrorUI = () => {
    const { error, errorInfo, errorId, retryCount } = this.state;
    const { className } = this.props;
    
    const actions = this.getErrorActions();
    const isRetrying = retryCount > 0 && retryCount < this.maxRetries;
    
    return (
      <motion.div
        className={cn(
          "tree-error-boundary flex flex-col items-center justify-center p-8 bg-red-50 border-2 border-red-200 rounded-lg min-h-[400px]",
          className
        )}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Error Icon */}
        <motion.div
          className="mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        >
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </motion.div>

        {/* Error Message */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Tree Loading Error
          </h2>
          <p className="text-red-700 mb-2">
            {error?.message || 'An unexpected error occurred while loading the tree.'}
          </p>
          
          {isRetrying && (
            <motion.p
              className="text-sm text-red-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Retrying automatically... (Attempt {retryCount} of {this.maxRetries})
            </motion.p>
          )}
        </motion.div>

        {/* Error Details (Development) */}
        {process.env.NODE_ENV === 'development' && (
          <motion.details
            className="mb-6 w-full max-w-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <summary className="cursor-pointer text-sm font-medium text-red-700 hover:text-red-800 mb-2">
              Technical Details (Development)
            </summary>
            <div className="bg-red-100 p-4 rounded-md text-xs font-mono text-red-800 overflow-auto max-h-40">
              <div className="mb-2">
                <strong>Error ID:</strong> {errorId}
              </div>
              <div className="mb-2">
                <strong>Stack:</strong>
                <pre className="mt-1 whitespace-pre-wrap">{error?.stack}</pre>
              </div>
              {errorInfo && (
                <div>
                  <strong>Component Stack:</strong>
                  <pre className="mt-1 whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                </div>
              )}
            </div>
          </motion.details>
        )}

        {/* Action Buttons */}
        <motion.div
          className="flex flex-wrap gap-3 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {actions.map((action, index) => (
            <motion.button
              key={action.id}
              onClick={action.onClick}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 hover:scale-105 active:scale-95",
                action.variant === 'primary' && "bg-red-600 text-white hover:bg-red-700",
                action.variant === 'secondary' && "bg-gray-200 text-gray-700 hover:bg-gray-300",
                action.variant === 'danger' && "bg-red-100 text-red-700 hover:bg-red-200"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </motion.button>
          ))}
        </motion.div>
        
        {/* Retry countdown */}
        {isRetrying && (
          <motion.div
            className="mt-4 text-sm text-red-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <RefreshCw className="inline w-4 h-4 animate-spin mr-1" />
            Retrying in a moment...
          </motion.div>
        )}
      </motion.div>
    );
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || this.renderErrorUI();
    }

    return this.props.children;
  }
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook for handling tree errors
 */
export function useTreeErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);
  const [hasError, setHasError] = React.useState(false);
  
  const handleError = React.useCallback((error: Error) => {
    setError(error);
    setHasError(true);
    console.error('Tree Error:', error);
  }, []);
  
  const resetError = React.useCallback(() => {
    setError(null);
    setHasError(false);
  }, []);
  
  return {
    error,
    hasError,
    handleError,
    resetError,
  };
}

// ============================================================================
// SIMPLIFIED ERROR BOUNDARY
// ============================================================================

/**
 * Simple error boundary for smaller tree components
 */
export const SimpleTreeErrorBoundary: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ children, fallback }) => {
  return (
    <TreeErrorBoundary
      fallback={fallback}
      maxRetries={1}
      resetOnPropsChange={true}
    >
      {children}
    </TreeErrorBoundary>
  );
};