/**
 * Session Schema - ActionClient Integration
 * 
 * Handles session state through the ActionClient system for:
 * - Branch switching with <50ms performance
 * - Offline-first session management
 * - Optimistic updates with server sync
 * - Copy-on-Write semantics for branch context
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';

export const SESSION_SCHEMA: ResourceSchema = {
  // ============================================================================
  // BASIC CONFIGURATION
  // ============================================================================
  
  name: 'Session',
  pluralName: 'Sessions',
  description: 'User session state and branch context management',
  
  // ============================================================================
  // ACTION SYSTEM INTEGRATION
  // ============================================================================
  
  actionPrefix: 'session',
  databaseKey: 'session',
  
  // ✅ GLOBAL RESOURCE: Sessions are global entities that manage branch context
  notHasBranchContext: true,
  
  // Custom actions for session management
  actions: {
    optimistic: true, // Enable optimistic updates for instant branch switching
    custom: [
      {
        id: 'updateBranch',
        description: 'Switch user to different branch',
        method: 'POST',
        endpoint: '/api/auth/session/branch',
        optimistic: true,
        cached: false
      },
      {
        id: 'refreshContext',
        description: 'Refresh session context from server',
        method: 'GET', 
        endpoint: '/api/auth/session',
        optimistic: false,
        cached: true
      }
    ]
  },

  // ============================================================================
  // DATA STRUCTURE
  // ============================================================================
  
  fields: {
    // Primary session identifiers
    id: {
      type: 'string',
      required: true,
      description: 'Session ID (matches NextAuth session)'
    },
    userId: {
      type: 'string', 
      required: true,
      description: 'User ID'
    },
    
    // Branch context (the key data for switching)
    currentBranchId: {
      type: 'string',
      required: true,
      description: 'Currently active branch ID'
    },
    defaultBranchId: {
      type: 'string',
      required: true, 
      description: 'Default/main branch ID for fallback'
    },
    
    // Navigation context
    rootNodeId: {
      type: 'string',
      required: false,
      description: 'Root node ID for workspace navigation'
    },
    lastSelectedNodeId: {
      type: 'string',
      required: false,
      description: 'Last accessed node for quick navigation'
    },
    
    // User preferences and context
    preferences: {
      type: 'json',
      required: false,
      description: 'User preferences object'
    },
    permissions: {
      type: 'json',
      required: false,
      description: 'User permissions array'
    },
    
    // Data sync tracking
    dataLastSync: {
      type: 'string',
      required: false,
      description: 'Last data synchronization timestamp'
    },
    cacheVersion: {
      type: 'string',
      required: false,
      description: 'Cache version for invalidation'
    },
    
    // Session metadata
    expiresAt: {
      type: 'string',
      required: false,
      description: 'Session expiration timestamp'
    },
    lastActivity: {
      type: 'string',
      required: false,
      description: 'Last activity timestamp'
    }
  },

  // ============================================================================
  // STORAGE CONFIGURATION
  // ============================================================================
  
  storage: {
    // Use compound keys for tenant isolation
    keyStrategy: 'compound',
    indexes: [
      'userId',
      'currentBranchId', 
      'defaultBranchId',
      'lastActivity',
      'expiresAt'
    ]
  },

  // ============================================================================
  // PERMISSIONS & VALIDATION
  // ============================================================================
  
  permissions: {
    create: ['user'], // Users can create their session
    read: ['user'],   // Users can read their own session
    update: ['user'], // Users can update their session
    delete: ['admin'] // Only admins can delete sessions
  },

  validation: {
    required: ['id', 'userId', 'currentBranchId', 'defaultBranchId'],
    unique: ['id'] // Session ID must be unique
  },

  // ✅ ENTITY: IndexedDB key configuration
  indexedDBKey: (record: any) => record.id
};