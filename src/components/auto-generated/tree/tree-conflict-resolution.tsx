import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  RefreshCw, 
  Undo2, 
  Check, 
  X, 
  GitMerge, 
  Clock,
  User,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export interface ConflictData {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move';
  nodeId: string;
  nodeName: string;
  timestamp: number;
  localChanges: any;
  serverChanges: any;
  originalData: any;
  conflictFields: string[];
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  branch?: string;
}

export interface ConflictResolution {
  conflictId: string;
  resolution: 'accept-local' | 'accept-server' | 'merge' | 'manual';
  mergedData?: any;
  resolvedBy?: string;
  resolvedAt?: number;
}

export interface ConflictResolutionProps {
  conflicts: ConflictData[];
  onResolve: (resolution: ConflictResolution) => void;
  onRetry: (conflictId: string) => void;
  onDismiss: (conflictId: string) => void;
  onRollback: (conflictId: string) => void;
  autoResolve?: boolean;
  showDetails?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

const TreeConflictResolution: React.FC<ConflictResolutionProps> = ({
  conflicts,
  onResolve,
  onRetry,
  onDismiss,
  onRollback,
  autoResolve = false,
  showDetails = true,
  maxRetries = 3,
  retryDelay = 1000,
}) => {
  const [selectedConflict, setSelectedConflict] = useState<string | null>(null);
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set());
  const [retryAttempts, setRetryAttempts] = useState<Record<string, number>>({});
  const [isResolving, setIsResolving] = useState<Record<string, boolean>>({});
  const [resolutionHistory, setResolutionHistory] = useState<ConflictResolution[]>([]);
  const retryTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Auto-resolve conflicts based on rules
  const attemptAutoResolve = useCallback((conflict: ConflictData) => {
    if (!autoResolve) return false;

    // Simple auto-resolve rules
    const rules = [
      // If only timestamp differs, prefer server
      () => {
        const diffFields = conflict.conflictFields.filter(f => f !== 'updatedAt' && f !== 'timestamp');
        if (diffFields.length === 0) {
          return 'accept-server';
        }
        return null;
      },
      
      // If conflict is in non-critical fields, prefer local
      () => {
        const criticalFields = ['id', 'type', 'parentId', 'name'];
        const hasCriticalConflict = conflict.conflictFields.some(f => criticalFields.includes(f));
        if (!hasCriticalConflict) {
          return 'accept-local';
        }
        return null;
      },
      
      // If local changes are more recent, prefer local
      () => {
        const localTime = conflict.localChanges?.updatedAt || conflict.timestamp;
        const serverTime = conflict.serverChanges?.updatedAt || 0;
        if (localTime > serverTime) {
          return 'accept-local';
        }
        return null;
      }
    ];

    for (const rule of rules) {
      const resolution = rule();
      if (resolution) {
        return resolution;
      }
    }

    return null;
  }, [autoResolve]);

  // Handle conflict resolution
  const handleResolve = useCallback(async (conflictId: string, resolution: ConflictResolution['resolution'], mergedData?: any) => {
    setIsResolving(prev => ({ ...prev, [conflictId]: true }));

    try {
      const resolutionData: ConflictResolution = {
        conflictId,
        resolution,
        mergedData,
        resolvedBy: 'user', // In real app, get from auth context
        resolvedAt: Date.now(),
      };

      setResolutionHistory(prev => [...prev, resolutionData]);
      await onResolve(resolutionData);
      
      // Clean up
      setRetryAttempts(prev => {
        const { [conflictId]: _, ...rest } = prev;
        return rest;
      });
      
      if (retryTimeoutRef.current[conflictId]) {
        clearTimeout(retryTimeoutRef.current[conflictId]);
        delete retryTimeoutRef.current[conflictId];
      }
      
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      // Could show error toast here
    } finally {
      setIsResolving(prev => ({ ...prev, [conflictId]: false }));
    }
  }, [onResolve]);

  // Handle retry with exponential backoff
  const handleRetry = useCallback(async (conflictId: string) => {
    const attempts = retryAttempts[conflictId] || 0;
    
    if (attempts >= maxRetries) {
      console.warn(`Max retries exceeded for conflict ${conflictId}`);
      return;
    }

    const delay = retryDelay * Math.pow(2, attempts);
    
    setRetryAttempts(prev => ({ ...prev, [conflictId]: attempts + 1 }));
    
    retryTimeoutRef.current[conflictId] = setTimeout(async () => {
      try {
        await onRetry(conflictId);
      } catch (error) {
        console.error('Retry failed:', error);
      }
    }, delay);
  }, [retryAttempts, maxRetries, retryDelay, onRetry]);

  // Auto-resolve conflicts when they appear
  useEffect(() => {
    if (autoResolve) {
      conflicts.forEach(conflict => {
        const resolution = attemptAutoResolve(conflict);
        if (resolution) {
          handleResolve(conflict.id, resolution as ConflictResolution['resolution']);
        }
      });
    }
  }, [conflicts, autoResolve, attemptAutoResolve, handleResolve]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(retryTimeoutRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  // Toggle conflict expansion
  const toggleExpanded = useCallback((conflictId: string) => {
    setExpandedConflicts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conflictId)) {
        newSet.delete(conflictId);
      } else {
        newSet.add(conflictId);
      }
      return newSet;
    });
  }, []);

  // Format field value for display
  const formatFieldValue = (value: any) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  // Get conflict type icon
  const getConflictIcon = (type: ConflictData['type']) => {
    switch (type) {
      case 'create': return Check;
      case 'update': return RefreshCw;
      case 'delete': return X;
      case 'move': return ArrowRight;
      default: return AlertTriangle;
    }
  };

  // Get conflict type color
  const getConflictColor = (type: ConflictData['type']) => {
    switch (type) {
      case 'create': return 'bg-green-100 text-green-800 border-green-200';
      case 'update': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delete': return 'bg-red-100 text-red-800 border-red-200';
      case 'move': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">Conflict Resolution</h3>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => conflicts.forEach(c => handleRetry(c.id))}
            disabled={conflicts.some(c => isResolving[c.id])}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry All
          </Button>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {conflicts.map((conflict) => {
          const Icon = getConflictIcon(conflict.type);
          const isExpanded = expandedConflicts.has(conflict.id);
          const attempts = retryAttempts[conflict.id] || 0;
          const resolving = isResolving[conflict.id];

          return (
            <motion.div
              key={conflict.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-2"
            >
              <Card className="border-l-4 border-l-yellow-400">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-base">{conflict.nodeName}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Badge className={getConflictColor(conflict.type)}>
                            {conflict.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(conflict.timestamp).toLocaleString()}
                          </span>
                          {conflict.user && (
                            <span className="text-xs text-muted-foreground">
                              by {conflict.user.name}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {attempts > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Retry {attempts}/{maxRetries}
                        </Badge>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(conflict.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4">
                    {/* Conflict fields */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <GitMerge className="w-4 h-4" />
                        Conflicting Fields
                      </h4>
                      
                      {conflict.conflictFields.map((field) => (
                        <div key={field} className="border rounded-lg p-3 space-y-2">
                          <div className="font-medium text-sm">{field}</div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            {/* Local changes */}
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-blue-600">Local</div>
                              <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs font-mono">
                                {formatFieldValue(conflict.localChanges?.[field])}
                              </div>
                            </div>
                            
                            {/* Server changes */}
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-green-600">Server</div>
                              <div className="bg-green-50 border border-green-200 rounded p-2 text-xs font-mono">
                                {formatFieldValue(conflict.serverChanges?.[field])}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Resolution actions */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Resolution Options</h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolve(conflict.id, 'accept-local')}
                          disabled={resolving}
                          className="justify-start text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Accept Local
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolve(conflict.id, 'accept-server')}
                          disabled={resolving}
                          className="justify-start text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Accept Server
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetry(conflict.id)}
                          disabled={resolving || attempts >= maxRetries}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retry
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRollback(conflict.id)}
                          disabled={resolving}
                        >
                          <Undo2 className="w-4 h-4 mr-2" />
                          Rollback
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDismiss(conflict.id)}
                          disabled={resolving}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Resolution summary */}
      {resolutionHistory.length > 0 && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Resolutions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resolutionHistory.slice(-5).map((resolution, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span>Conflict {resolution.conflictId}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {resolution.resolution}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(resolution.resolvedAt!).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TreeConflictResolution; 