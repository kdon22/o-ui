/**
 * Bootstrap Splash Screen - Professional Enterprise Loading Experience
 * 
 * Provides a polished loading experience during workspace bootstrap with:
 * - Progress tracking and visual feedback
 * - Error handling with retry options
 * - Professional enterprise branding
 * - Responsive design for all screen sizes
 */

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { AnimatedLogo } from '@/components/ui/animated-logo';

// Simple Progress component inline
function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`w-full bg-secondary rounded-full h-2 ${className}`}>
      <div 
        className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

interface BootstrapSplashScreenProps {
  progress: number;
  error?: Error | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  tenantName?: string;
  branchName?: string;
}

export function BootstrapSplashScreen({
  progress,
  error,
  onRetry,
  isRetrying = false,
  tenantName,
  branchName
}: BootstrapSplashScreenProps) {
  const getProgressMessage = (progress: number) => {
    if (progress === 0) return 'Initializing workspace...';
    if (progress < 25) return 'Loading node structure...';
    if (progress < 50) return 'Loading processes and rules...';
    if (progress < 75) return 'Loading workflows and offices...';
    if (progress < 100) return 'Finalizing cache...';
    return 'Ready!';
  };

  const getProgressColor = (progress: number) => {
    if (progress < 25) return 'bg-blue-500';
    if (progress < 50) return 'bg-indigo-500';
    if (progress < 75) return 'bg-purple-500';
    if (progress < 100) return 'bg-green-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="text-center space-y-8 max-w-md mx-auto px-6">
        {/* Animated Logo */}
        <div className="flex justify-center">
          <AnimatedLogo size="md" showText={false} />
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              {error ? 'Loading Failed' : 'Loading Workspace'}
            </h1>
            <p className="text-muted-foreground">
              {error 
                ? 'There was an issue loading your workspace data' 
                : 'Preparing your data for instant access...'}
            </p>
          </div>

          {/* Tenant/Branch Info */}
          {(tenantName || branchName) && !error && (
            <div className="text-sm text-muted-foreground space-y-1">
              {tenantName && (
                <p>Workspace: <span className="font-medium">{tenantName}</span></p>
              )}
              {branchName && (
                <p>Branch: <span className="font-medium">{branchName}</span></p>
              )}
            </div>
          )}
        </div>

        {/* Progress or Error */}
        {error ? (
          <div className="space-y-4">
            <Alert variant="destructive" className="text-left">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error.message || 'An unexpected error occurred while loading your workspace.'}
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col gap-2">
              <Button 
                onClick={onRetry} 
                disabled={isRetrying}
                className="w-full"
              >
                {isRetrying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {getProgressMessage(progress)}
                </span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              
              <Progress 
                value={progress} 
                className="h-2"
              />
            </div>

            {/* Subtle loading indicator */}
            <div className="flex justify-center">
              <div className="w-8 h-1 bg-primary/20 rounded-full overflow-hidden">
                <div className="w-full h-full bg-primary rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Performance Message */}
            <p className="text-xs text-muted-foreground">
              Optimizing for instant navigation...
            </p>
          </div>
        )}

        {/* Technical Details (Dev Mode) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <p>Bootstrap Progress: {progress}%</p>
            {error && <p className="text-red-500 mt-1">Error: {error.message}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default BootstrapSplashScreen; 