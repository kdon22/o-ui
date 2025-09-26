/**
 * Sync Queue - Background Sync System
 * 
 * Manages queuing and processing of failed operations for eventual consistency.
 * Provides retry logic and error handling for offline-first operations.
 */

import { ACTION_MAPPINGS } from '@/lib/resource-system/resource-registry';

interface SyncQueueItem {
  id: string;
  action: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

export class SyncQueue {
  private queue: SyncQueueItem[] = [];
  private isProcessing = false;
  private readonly MAX_RETRIES = 3;

  add(action: string, data: any): void {
    const item: SyncQueueItem = {
      id: crypto.randomUUID(),
      action,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };
    
    this.queue.push(item);
    this.processQueue();
  }

  // Debug methods
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      items: this.queue.map(item => ({
        id: item.id,
        action: item.action,
        retryCount: item.retryCount,
        timestamp: new Date(item.timestamp).toISOString(),
        hasProblematicData: 'branchTimestamp' in item.data
      }))
    };
  }

  clearQueue(): void {
    // Clearing queued operations
    this.queue = [];
    this.isProcessing = false;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      
      try {
        await this.processItem(item);
      } catch (error) {
        console.error('Sync queue error:', error);
        
        // 🚨 CRITICAL FIX: Don't retry permanent errors
        const isPermanentError = this.isPermanentError(error);
        
        if (isPermanentError) {
          console.error('🚫 [SyncQueue] Permanent error - not retrying:', {
            action: item.action,
            error: error instanceof Error ? error.message : error,
            isPermanentError,
            timestamp: new Date().toISOString()
          });
          // Don't retry permanent errors like unique constraints
        } else if (item.retryCount < this.MAX_RETRIES) {
          item.retryCount++;
          
          // 🔥 CRITICAL FIX: Add exponential backoff for FK constraint violations
          const isFKError = error instanceof Error && error.message.includes('Foreign key constraint violated');
          if (isFKError) {
            // Exponential backoff: 2s, 4s, 8s for FK constraint retries
            const backoffMs = Math.pow(2, item.retryCount) * 1000;
            console.log('🔄 [SyncQueue] FK constraint retry with backoff:', {
              action: item.action,
              retryCount: item.retryCount,
              backoffMs,
              maxRetries: this.MAX_RETRIES,
              timestamp: new Date().toISOString()
            });
            
            // Schedule retry after backoff delay
            setTimeout(() => {
              this.queue.push(item);
              this.processQueue(); // Resume processing
            }, backoffMs);
          } else {
            // Immediate retry for other transient errors
            this.queue.push(item);
            console.log('🔄 [SyncQueue] Retrying transient error:', {
              action: item.action,
              retryCount: item.retryCount,
              maxRetries: this.MAX_RETRIES,
              timestamp: new Date().toISOString()
            });
          }
        } else {
          console.error('Max retries exceeded for sync item:', item);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Determines if an error is permanent and should not be retried
   */
  private isPermanentError(error: any): boolean {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // 🔧 DEBUG: Log error detection for troubleshooting
    console.log('🔍 [SyncQueue] isPermanentError check:', {
      errorMessage,
      errorType: typeof error,
      isError: error instanceof Error,
      timestamp: new Date().toISOString()
    });
    
    // Unique constraint violations - never retry
    if (errorMessage.includes('Unique constraint failed')) {
      console.warn('⚠️ [SyncQueue] Unique constraint violation detected - permanent error');
      return true;
    }
    
    // 🔥 CRITICAL FIX: Foreign key constraint violations for junction tables should be retried
    // They often fail temporarily when the referenced entity hasn't been synced yet
    if (errorMessage.includes('Foreign key constraint violated')) {
      console.log('🔄 [SyncQueue] Foreign key constraint violation - will retry (likely dependency not synced yet)', {
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
      return false; // Allow retry for FK constraints
    }
    
    // 🔧 WORKFLOW FIX: Handle workflow name conflicts gracefully
    const isHttp409 = errorMessage.includes('HTTP 409: Conflict');
    const isWorkflowAction = errorMessage.includes('action: workflow.');
    const hasWorkflowKeyword = errorMessage.includes('workflow');
    const hasAlreadyExists = errorMessage.includes('already exists');
    
    if (isHttp409 && (isWorkflowAction || (hasWorkflowKeyword && hasAlreadyExists))) {
      console.warn('⚠️ [SyncQueue] Workflow name conflict - likely create/update timing issue', {
        error: errorMessage,
        isHttp409,
        isWorkflowAction,
        hasWorkflowKeyword,
        hasAlreadyExists,
        timestamp: new Date().toISOString()
      });
      // Don't retry workflow conflicts - they indicate a UI state issue that should be handled at the component level
      return true;
    }
    
    // 🔧 GENERAL 409 FIX: Handle unique constraint conflicts for any entity
    if (isHttp409 && hasAlreadyExists) {
      console.warn('⚠️ [SyncQueue] General unique constraint conflict - not retrying', {
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
      return true;
    }
    
    // Other permanent errors
    const permanentErrorPatterns = [
      'Invalid `prisma.',  // Prisma validation errors (but not FK constraints)
      'Record to update not found',  // Update on non-existent record
      'Record to delete does not exist',  // Delete on non-existent record
      'Validation failed',  // Schema validation errors
      'Bad Request',  // 400 errors
      'Unauthorized',  // 401 errors  
      'Forbidden',  // 403 errors
      'Not Found',  // 404 errors
      'Method Not Allowed',  // 405 errors
    ];
    
    const matchedPattern = permanentErrorPatterns.find(pattern => 
      errorMessage.includes(pattern)
    );
    
    if (matchedPattern) {
      console.warn('⚠️ [SyncQueue] Permanent error pattern matched:', {
        pattern: matchedPattern,
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
      return true;
    }
    
    console.log('🔍 [SyncQueue] Error is not permanent - will allow retry');
    return false;
  }

  private async processItem(item: SyncQueueItem): Promise<void> {
    // This would make the actual API call
    const mapping = ACTION_MAPPINGS[item.action];
    if (!mapping) {
      throw new Error(`Unknown action: ${item.action}`);
    }

    // Clean data to remove IndexedDB-specific fields before sending to API
    const cleanData = { ...item.data };
    
    // Remove IndexedDB-specific metadata fields that shouldn't be sent to server
    delete cleanData.branchTimestamp;
    delete cleanData._cached;
    delete cleanData._optimistic;
    delete cleanData._loading;
    delete cleanData._error;
    delete cleanData._dirty;
    delete cleanData._touched;
    delete cleanData._validating;
    delete cleanData._submitCount;
    delete cleanData._isSubmitting;
    delete cleanData._isValidating;
    delete cleanData._isValid;
    delete cleanData._hasError;
    delete cleanData._hasWarning;
    delete cleanData._hasSuccess;
    delete cleanData._meta;
    delete cleanData._clientOnly;
    delete cleanData._uiState;
    delete cleanData._tempId;
    delete cleanData._localState;

    // Detect server-side execution and construct appropriate URL
    const isServerSide = typeof window === 'undefined';
    const baseUrl = isServerSide ? process.env.NEXTAUTH_URL || 'http://localhost:3000' : '';
    const apiUrl = `${baseUrl}/api/workspaces/current/actions`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: item.action,
        data: cleanData
      })
    });

    if (!response.ok) {
      // Get more detailed error information
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorResult = await response.json();
        if (errorResult.error) {
          errorMessage += ` - ${errorResult.error}`;
        }
      } catch (e) {
        // If we can't parse the error response, use the basic message
      }
      
      // Include action context for better error handling
      throw new Error(`${errorMessage} (action: ${item.action})`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(`${result.error || 'Unknown API error'} (action: ${item.action})`);
    }
  }
}