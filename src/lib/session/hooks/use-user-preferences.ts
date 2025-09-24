/**
 * useUserPreferences - User Preferences Hook
 * 
 * Single source of truth for user preferences including theme, editor settings,
 * language, and other user customization options.
 */

import { useSession } from 'next-auth/react';
import { useCallback } from 'react';
import type { UserPreferencesHookReturn, UserPreferences } from '../types';

export function useUserPreferences(): UserPreferencesHookReturn {
  const { data: session, update: updateSession } = useSession();
  
  // ============================================================================
  // PREFERENCES STATE
  // ============================================================================
  
  const isReady = !!session?.user;
  const preferences = session?.user?.preferences || null;
  
  // ============================================================================
  // PREFERENCES ACTIONS
  // ============================================================================
  
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!isReady) {
      console.warn('[useUserPreferences] Cannot update preferences: session not ready');
      return;
    }
    
    console.log('🔄 [useUserPreferences] Updating preferences:', updates);
    
    const updatedPreferences = {
      ...preferences,
      ...updates,
      lastUpdatedAt: new Date().toISOString(),
    };
    
    await updateSession({
      preferences: updatedPreferences
    });
    
    console.log('✅ [useUserPreferences] Preferences updated');
  }, [isReady, preferences, updateSession]);
  
  const resetPreferences = useCallback(async () => {
    if (!isReady) {
      console.warn('[useUserPreferences] Cannot reset preferences: session not ready');
      return;
    }
    
    console.log('🔄 [useUserPreferences] Resetting preferences to defaults');
    
    const defaultPreferences: UserPreferences = {
      theme: 'system',
      editorSettings: {
        fontSize: 14,
        tabSize: 4,
        wordWrap: true,
        minimap: false,
        lineNumbers: true,
        theme: 'vs-dark',
      },
      lastAccessedNodeId: null,
      lastAccessedNodeIdShort: null,
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      lastUpdatedAt: new Date().toISOString(),
    };
    
    await updateSession({
      preferences: defaultPreferences
    });
    
    console.log('✅ [useUserPreferences] Preferences reset to defaults');
  }, [isReady, updateSession]);
  
  // ============================================================================
  // RETURN VALUES
  // ============================================================================
  
  return {
    preferences,
    isReady,
    updatePreferences,
    resetPreferences,
  };
}
