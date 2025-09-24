/**
 * Factory Hook for Name Validation - Reusable across all entities
 * 
 * Provides real-time validation for entity names to prevent duplicates
 * before saving. Works with the action system and follows DRY principles.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useActionQuery } from '@/hooks/use-action-api';
import { useBranchContext } from '@/lib/session';

// ============================================================================
// TYPES
// ============================================================================

export interface NameValidationResult {
  /** Whether the name is valid (no duplicates, meets criteria) */
  isValid: boolean;
  /** User-friendly error message if invalid */
  error?: string;
  /** Whether validation is currently checking */
  isChecking: boolean;
  /** Whether this name already exists */
  isDuplicate: boolean;
  /** Suggested alternative names if duplicate */
  suggestions?: string[];
}

export interface NameValidationConfig {
  /** Entity type (e.g., 'workflow', 'rule', 'process', 'node') */
  entityType: string;
  /** Current entity ID to exclude from duplicate check (for updates) */
  currentEntityId?: string;
  /** Minimum name length (default: 1) */
  minLength?: number;
  /** Maximum name length (default: 100) */
  maxLength?: number;
  /** Custom validation function */
  customValidator?: (name: string) => string | null;
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number;
}

// ============================================================================
// FACTORY HOOK
// ============================================================================

/**
 * Creates a name validation hook for any entity type
 * 
 * @example
 * ```tsx
 * // In workflow component
 * const useWorkflowNameValidation = createNameValidationHook({
 *   entityType: 'workflow',
 *   minLength: 3,
 *   maxLength: 50
 * });
 * 
 * // In component
 * const validation = useWorkflowNameValidation('My Workflow Name', currentWorkflowId);
 * ```
 */
export function createNameValidationHook(config: NameValidationConfig) {
  return function useNameValidation(
    name: string,
    currentEntityId?: string
  ): NameValidationResult {
    // Safely get branch context - gracefully handle if provider is missing
    let branchContext = null;
    try {
      branchContext = useBranchContext();
    } catch (error) {
      // Branch provider not available - validation will still work for basic checks
      console.warn('BranchProvider not available for name validation, duplicate checking disabled');
    }
    
    const [debouncedName, setDebouncedName] = useState(name);
    const [isChecking, setIsChecking] = useState(false);

    // ========================================================================
    // CONFIGURATION
    // ========================================================================
    
    const {
      entityType,
      minLength = 1,
      maxLength = 100,
      customValidator,
      debounceMs = 300
    } = config;

    const entityIdToExclude = currentEntityId || config.currentEntityId;

    // ========================================================================
    // DEBOUNCED NAME
    // ========================================================================

    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedName(name);
      }, debounceMs);

      return () => clearTimeout(timer);
    }, [name, debounceMs]);

    // ========================================================================
    // BASIC VALIDATION (IMMEDIATE)
    // ========================================================================

    const basicValidation = useMemo(() => {
      const trimmed = name.trim();

      // Empty name
      if (!trimmed) {
        return { isValid: false, error: 'Name is required' };
      }

      // Length validation
      if (trimmed.length < minLength) {
        return { 
          isValid: false, 
          error: `Name must be at least ${minLength} character${minLength > 1 ? 's' : ''}` 
        };
      }

      if (trimmed.length > maxLength) {
        return { 
          isValid: false, 
          error: `Name must be less than ${maxLength} characters` 
        };
      }

      // Custom validation
      if (customValidator) {
        const customError = customValidator(trimmed);
        if (customError) {
          return { isValid: false, error: customError };
        }
      }

      return { isValid: true };
    }, [name, minLength, maxLength, customValidator]);

    // ========================================================================
    // DUPLICATE CHECK QUERY
    // ========================================================================

    // Only check for duplicates if basic validation passes, name is debounced, and we have branch context
    const shouldCheckDuplicates = basicValidation.isValid && 
                                  debouncedName.trim().length > 0 && 
                                  debouncedName === name &&
                                  branchContext !== null;

    const duplicateCheckQuery = useActionQuery(
      `${entityType}.list`,
      {
        filters: {
          name: debouncedName.trim(),
          tenantId: branchContext?.tenantId,
          branchId: branchContext?.currentBranchId
        },
        options: {
          limit: 10 // Get a few to suggest alternatives
        }
      },
      {
        enabled: shouldCheckDuplicates,
        staleTime: 30000, // Cache for 30 seconds
        gcTime: 60000,
      }
    );

    // ========================================================================
    // CHECKING STATE
    // ========================================================================

    useEffect(() => {
      if (shouldCheckDuplicates && duplicateCheckQuery.isLoading) {
        setIsChecking(true);
      } else {
        setIsChecking(false);
      }
    }, [shouldCheckDuplicates, duplicateCheckQuery.isLoading]);

    // ========================================================================
    // DUPLICATE ANALYSIS
    // ========================================================================

    const duplicateAnalysis = useMemo(() => {
      if (!shouldCheckDuplicates || !duplicateCheckQuery.data) {
        return { isDuplicate: false, suggestions: [] };
      }

      const existingEntities = duplicateCheckQuery.data.data || [];
      const exactMatches = existingEntities.filter((entity: any) => 
        entity.name.toLowerCase() === debouncedName.trim().toLowerCase() &&
        entity.id !== entityIdToExclude
      );

      const isDuplicate = exactMatches.length > 0;

      // Generate suggestions if duplicate found
      const suggestions: string[] = [];
      if (isDuplicate) {
        const baseName = debouncedName.trim();
        suggestions.push(
          `${baseName} v2`,
          `${baseName} - Copy`,
          `${baseName} (New)`,
          `${baseName} - ${new Date().toLocaleDateString()}`
        );
      }

      return { isDuplicate, suggestions };
    }, [shouldCheckDuplicates, duplicateCheckQuery.data, debouncedName, entityIdToExclude]);

    // ========================================================================
    // FINAL RESULT
    // ========================================================================

    return useMemo((): NameValidationResult => {
      // Basic validation failed
      if (!basicValidation.isValid) {
        return {
          isValid: false,
          error: basicValidation.error,
          isChecking: false,
          isDuplicate: false
        };
      }

      // Still checking duplicates - BLOCK submission until complete
      if (isChecking) {
        return {
          isValid: false, // Block submission while checking
          error: 'Checking for duplicate names...',
          isChecking: true,
          isDuplicate: false
        };
      }

      // Duplicate found
      if (duplicateAnalysis.isDuplicate) {
        return {
          isValid: false,
          error: `A ${entityType} named "${debouncedName.trim()}" already exists`,
          isChecking: false,
          isDuplicate: true,
          suggestions: duplicateAnalysis.suggestions
        };
      }

      // All good!
      return {
        isValid: true,
        isChecking: false,
        isDuplicate: false
      };
    }, [basicValidation, isChecking, duplicateAnalysis, entityType, debouncedName]);
  };
}

// ============================================================================
// PRE-CONFIGURED HOOKS FOR COMMON ENTITIES
// ============================================================================

/**
 * Workflow name validation
 */
export const useWorkflowNameValidation = createNameValidationHook({
  entityType: 'workflow',
  minLength: 3,
  maxLength: 50,
  customValidator: (name) => {
    if (name.toLowerCase() === 'new workflow') {
      return 'Please choose a more descriptive name';
    }
    if (name.toLowerCase() === 'untitled workflow') {
      return 'Please choose a more descriptive name';
    }
    return null;
  }
});

/**
 * Rule name validation
 */
export const useRuleNameValidation = createNameValidationHook({
  entityType: 'rule',
  minLength: 3,
  maxLength: 100
});

/**
 * Process name validation
 */
export const useProcessNameValidation = createNameValidationHook({
  entityType: 'process',
  minLength: 3,
  maxLength: 80
});

/**
 * Node name validation
 */
export const useNodeNameValidation = createNameValidationHook({
  entityType: 'node',
  minLength: 2,
  maxLength: 60
});

/**
 * Office name validation
 */
export const useOfficeNameValidation = createNameValidationHook({
  entityType: 'office',
  minLength: 2,
  maxLength: 50
});
