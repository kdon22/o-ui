# Background Refresh System

## Overview

The Background Refresh System provides automatic data freshening for cached resources without requiring changes to the `useResource` hook or existing components. It runs independently in the background, monitoring query staleness and refreshing data based on configurable time intervals.

## Architecture

```
Background Refresh Service
├── Staleness Monitor (checks cache age)
├── Refresh Scheduler (time-based intervals)
├── Resource Configuration (per-resource settings)
├── Network Detection (online/offline awareness)
└── Query Invalidation (TanStack Query integration)
```

## Key Features

- **Zero Breaking Changes**: Works with existing `useResource` hook unchanged
- **Configurable Staleness**: Per-resource time intervals
- **Network Aware**: Respects online/offline state
- **Performance Optimized**: Batches refresh operations
- **Provider Pattern**: Integrates with existing app providers

## Configuration

### Resource Staleness Configuration

```typescript
// background-refresh-config.ts
export const BACKGROUND_REFRESH_CONFIG = {
  // Navigation data - never stale (static structure)
  node: 'never',
  
  // Business data - moderate staleness
  process: 5 * 60 * 1000,    // 5 minutes
  rule: 10 * 60 * 1000,      // 10 minutes
  office: 30 * 60 * 1000,    // 30 minutes
  workflow: 15 * 60 * 1000,  // 15 minutes
  
  // User data - short staleness
  notification: 30 * 1000,   // 30 seconds
  settings: 2 * 60 * 1000,   // 2 minutes
  
  // Real-time data - always stale
  system_health: 'always',
  workflow_status: 'always',
};

export const REFRESH_SETTINGS = {
  // How often to check for stale queries
  checkInterval: 30 * 1000,      // 30 seconds
  
  // Maximum concurrent refresh operations
  maxConcurrentRefreshes: 3,
  
  // Batch size for refresh operations
  batchSize: 5,
  
  // Retry failed refreshes
  retryFailedRefresh: true,
  retryInterval: 60 * 1000,      // 1 minute
  maxRetries: 3,
};
```

## How It Works

### 1. Initialization
- Background service starts when app loads
- Integrates with existing TanStack Query client
- Monitors all active queries automatically

### 2. Staleness Detection
- Checks query timestamps against configuration
- Identifies stale queries that need refreshing
- Respects network state (no refresh when offline)

### 3. Background Refresh
- Silently fetches fresh data from server
- Updates TanStack Query cache
- Triggers IndexedDB updates via ActionClient
- Components re-render automatically with fresh data

### 4. Error Handling
- Failed refreshes retry at next interval
- Network errors pause refresh until online
- Graceful degradation - uses cached data if refresh fails

## Integration Points

### 1. App Providers
```typescript
// app-providers.tsx
import { BackgroundRefreshProvider } from '@/lib/background-refresh';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider>
      <BackgroundRefreshProvider>
        {children}
      </BackgroundRefreshProvider>
    </QueryClientProvider>
  );
}
```

### 2. ActionClient Integration
The service uses the existing ActionClient to fetch fresh data:
```typescript
// Uses existing ActionClient methods
actionClient.executeAction('process.list', filters);
```

### 3. TanStack Query Integration
Leverages existing query infrastructure:
```typescript
// Updates existing queries in cache
queryClient.setQueryData(queryKey, freshData);
queryClient.invalidateQueries(queryKey);
```

## User Experience

### For Users
- **Instant Navigation**: `useResource` returns cached data immediately (<50ms)
- **Fresh Data**: Background refresh keeps data current automatically
- **Offline Resilience**: Works offline, syncs when online
- **Invisible Operation**: No loading spinners or UI disruption

### For Developers
- **No Code Changes**: Existing components work unchanged
- **Simple Configuration**: Set staleness per resource type
- **Easy Debugging**: Built-in logging and monitoring
- **Predictable Behavior**: Clear rules for when data refreshes

## Performance Considerations

### Optimizations
- **Batch Operations**: Groups multiple refreshes together
- **Concurrent Limits**: Prevents overwhelming the server
- **Network Awareness**: Pauses when offline
- **Smart Scheduling**: Avoids refreshing inactive queries

### Monitoring
- **Refresh Statistics**: Track success/failure rates
- **Performance Metrics**: Monitor refresh times
- **Cache Hit Rates**: Measure effectiveness
- **Network Usage**: Track data consumption

## Configuration Examples

### Development Environment
```typescript
// More aggressive refreshing for development
const DEV_CONFIG = {
  node: 'never',
  process: 1 * 60 * 1000,    // 1 minute
  rule: 2 * 60 * 1000,       // 2 minutes
  notification: 10 * 1000,   // 10 seconds
};
```

### Production Environment
```typescript
// Conservative refreshing for production
const PROD_CONFIG = {
  node: 'never',
  process: 10 * 60 * 1000,   // 10 minutes
  rule: 30 * 60 * 1000,      // 30 minutes
  notification: 60 * 1000,   // 1 minute
};
```

### Resource-Specific Overrides
```typescript
// Override for specific high-priority resources
const PRIORITY_OVERRIDES = {
  'process.list': 2 * 60 * 1000,  // 2 minutes for process lists
  'rule.search': 30 * 1000,       // 30 seconds for search results
};
```

## Debugging and Monitoring

### Debug Logging
```typescript
// Enable debug mode
BackgroundRefreshService.setDebugMode(true);

// Console output:
// 🔍 [BackgroundRefresh] Checking staleness for 12 queries
// ⏰ [BackgroundRefresh] process.list is stale (age: 6m, limit: 5m)
// 🔄 [BackgroundRefresh] Refreshing process.list
// ✅ [BackgroundRefresh] Successfully refreshed process.list
```

### Performance Metrics
```typescript
// Get refresh statistics
const stats = BackgroundRefreshService.getStats();
// {
//   totalRefreshes: 1247,
//   successfulRefreshes: 1198,
//   failedRefreshes: 49,
//   averageRefreshTime: 234,
//   lastRefreshTime: Date,
//   activeQueries: 15
// }
```

## Migration Path

### Phase 1: Setup
1. Add background refresh files to `/lib/background-refresh/`
2. Update `app-providers.tsx` to include BackgroundRefreshProvider
3. Configure staleness settings per resource

### Phase 2: Testing
1. Enable debug mode in development
2. Monitor refresh behavior and performance
3. Adjust staleness configuration as needed

### Phase 3: Production
1. Deploy with conservative refresh intervals
2. Monitor performance and user experience
3. Optimize configuration based on real usage

## Benefits

### For Performance
- **Instant Navigation**: Always serve from cache first
- **Background Updates**: Fresh data without blocking UI
- **Reduced Server Load**: Intelligent refresh scheduling
- **Offline Resilience**: Graceful degradation

### For Maintenance
- **Zero Refactoring**: Existing code works unchanged
- **Centralized Config**: All refresh logic in one place
- **Easy Debugging**: Clear logging and monitoring
- **Predictable Behavior**: Simple, documented rules

### For User Experience
- **Faster UI**: Instant response from cache
- **Fresh Data**: Always up-to-date information
- **Offline Support**: Works without network
- **Seamless Operation**: No loading interruptions

## Future Enhancements

### Smart Refresh Triggers
- User activity detection
- Window focus/blur events
- Network connectivity changes
- Time-based patterns

### Advanced Configuration
- User-specific staleness preferences
- Context-aware refresh rates
- A/B testing for refresh strategies
- Machine learning for optimal timing

### Integration Extensions
- WebSocket integration for real-time updates
- Service worker for background operation
- Push notifications for critical updates
- Analytics integration for usage patterns

## Conclusion

The Background Refresh System provides a clean, performant solution for keeping cached data fresh without disrupting the existing architecture. It works invisibly in the background, ensuring users always have access to current data while maintaining the instant response times that make the application feel fast and responsive.

The system is designed to be:
- **Simple to configure** - Just set staleness times per resource
- **Easy to integrate** - Works with existing providers and hooks
- **Performance focused** - Optimized for minimal impact
- **User-friendly** - Invisible operation, visible benefits 