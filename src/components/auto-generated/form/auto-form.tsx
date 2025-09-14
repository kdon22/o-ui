'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { FormField } from './form-field';
import { 
  organizeFieldsIntoRows, 
  getFormValidationSchema, 
  getVisibleFormFields, 
  getValidatableFields, 
  getFormTabs,
  prepareSubmissionData,
  getFormWidthClass,
  getFieldWidthClass
} from './form-utils';
import { cn } from '@/lib/utils/generalUtils';
import { useSession } from 'next-auth/react';
import { useMutation } from '@tanstack/react-query';
import { getActionClient } from '@/lib/action-client';
import { useBranchContextWithLoading } from '@/lib/context/branch-context';
import { generateCompleteDefaultValues } from '../modal/utils';
import { FormDebugComponent } from './form-debug';
import type { FormRow } from './form-utils';
import type { ResourceSchema } from '@/lib/resource-system/schemas';
import { convertToPythonName } from '@/components/editor/utils/python-name-converter';
// Junction creation now handled automatically by the action client
// Navigation context types moved locally
type NavigationContext = {
  nodeId?: string;
  parentId?: string;
  selectedId?: string;
  processId?: string;
  workflowId?: string;
  [key: string]: string | undefined;
};

// AutoForm Props interface
interface AutoFormProps {
  schema: ResourceSchema;
  mode: 'create' | 'edit';
  initialData?: Record<string, any>;
  parentData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
  compact?: boolean;
  enableAnimations?: boolean;
  enableKeyboardShortcuts?: boolean;
  onError?: (error: Error) => void;
  
  // 🔥 Context-aware auto-population and junction creation
  navigationContext?: { nodeId?: string; parentId?: string; selectedId?: string };
  componentContext?: { parentData?: any; contextId?: string };
  
  // 🚀 NEW: Enable smart junction creation (default: true for create mode)
  enableJunctionCreation?: boolean;
  
  // 🎯 NEW: Control button visibility
  showCancel?: boolean;
}

// Error Boundary Component
class FormErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Form error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Something went wrong
          </h3>
          <p className="text-red-600 mb-4">
            The form encountered an error. Please try again.
          </p>
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={() => this.setState({ hasError: false, error: null })}
              variant="outline"
              size="sm"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced tab content renderer with staggered animations
const renderTabContent = (
  tabFields: any[], 
  tenantId: string, 
  branchId: string, 
  control: any, 
  errors: any, 
  isCompact: boolean = false,
  enableAnimations: boolean = true
) => {
  const tabRows = organizeFieldsIntoRows(tabFields);
  
  return (
    <div className={cn(
      "space-y-6",
      isCompact && "space-y-4"
    )}>
      {tabRows.map((row, index) => (
        <div 
          key={index}
          className={cn(
            "grid grid-cols-12 gap-4", // Always use 12-column grid
            isCompact && "gap-3",
            enableAnimations && "animate-in fade-in-0 slide-in-from-left-2"
          )}
          style={enableAnimations ? { 
            animationDelay: `${index * 50}ms`,
            animationDuration: '300ms'
          } : undefined}
        >
          {row.fields.map((field, fieldIndex) => (
            <div
              key={field.key}
              className={cn(
                getFieldWidthClass(field, row.fields.length),
                "min-w-0", // Prevent flex overflow
                enableAnimations && "animate-in fade-in-0 slide-in-from-bottom-1"
              )}
              style={enableAnimations ? { 
                animationDelay: `${(index * 50) + (fieldIndex * 25)}ms`,
                animationDuration: '200ms'
              } : undefined}
            >
              <FormField
                field={field}
                control={control}
                errors={errors}
                tenantId={tenantId}
                branchId={branchId}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// Main AutoForm component with memoization
const AutoFormComponent: React.FC<AutoFormProps> = ({
  schema,
  mode,
  initialData,
  parentData,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
  compact = false,
  showCancel = true,
  enableAnimations = true,
  enableKeyboardShortcuts = true,
  onError,
  navigationContext,
  componentContext,
  enableJunctionCreation = mode === 'create' // Default: enable for create mode
}) => {
  // Get branch context from SSOT
  const branchContext = useBranchContextWithLoading();
  const { data: session } = useSession();
  
  // 🔍 DEBUG: Log branch context state on every render
  console.log('🔍 [AutoForm] Component render - Branch context state:', {
    hasBranchContext: !!branchContext,
    branchContextIsReady: branchContext?.isReady,
    branchContextType: typeof branchContext,
    tenantId: branchContext?.tenantId,
    currentBranchId: branchContext?.currentBranchId,
    sessionStatus: session ? 'has-session' : 'no-session',
    sessionTenantId: session?.user?.tenantId,
    timestamp: new Date().toISOString()
  });
  const [activeTab, setActiveTab] = useState<string>('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔥 Enhanced context-aware form setup - use simple synchronous function
  const defaultValues = useMemo(() => {
    return generateCompleteDefaultValues(
      schema,
      mode,
      initialData,
      parentData,
      navigationContext,
      session
    );
  }, [schema, mode, initialData, parentData, navigationContext, session]);

  // 🚨 DEBUG: Log all available context at form initialization
  console.log('🚨 [AutoForm] CONTEXT DEBUG AT INITIALIZATION:', {
    schema: {
      name: schema.name,
      actionPrefix: schema.actionPrefix,
      type: schema.type
    },
    session: {
      exists: !!session,
      userId: session?.user?.id,
      tenantId: session?.user?.tenantId,
      branchContext: session?.user?.branchContext,
      currentBranchId: session?.user?.branchContext?.currentBranchId,
      branches: session?.user?.branchContext?.branches?.length || 0
    },
    navigationContext,
    componentContext,
    defaultValues,
    timestamp: new Date().toISOString()
  });

  // Junction creation setup - simplified for auto-discovery system
  const mergedNavigationContext: NavigationContext = useMemo(() => {
    // Simple merge of navigation contexts
    const extracted = {
      nodeId: parentData?.nodeId || parentData?.parentId,
      processId: parentData?.processId,
      workflowId: parentData?.workflowId,
      parentId: parentData?.parentId
    };
    
    return {
      ...extracted,
      ...navigationContext
    };
  }, [navigationContext, parentData, componentContext]);

  // ✅ CONDITIONAL MUTATION: Only create internal mutation if no parent onSubmit provided
  // This prevents double mutation when used inside AutoModal
  const shouldUseInternalMutation = !onSubmit;
  
  const createMutation = useMutation({
    enabled: shouldUseInternalMutation, // Only enable if no parent callback
    mutationFn: async (data: Record<string, any>) => {
      console.log('🔍 [AutoForm] Mutation starting - Branch context check:', {
        hasBranchContext: !!branchContext,
        branchContext: branchContext,
        branchContextType: typeof branchContext,
        branchContextKeys: branchContext ? Object.keys(branchContext) : [],
        tenantId: branchContext?.tenantId,
        currentBranchId: branchContext?.currentBranchId,
        sessionStatus: session?.user ? 'has-user' : 'no-user',
        sessionTenantId: session?.user?.tenantId,
        sessionBranchContext: session?.user?.branchContext,
        timestamp: new Date().toISOString()
      });
      
      // ✅ GUARD: Ensure branch context is ready before executing
      if (!branchContext) {
        const errorDetails = {
          sessionStatus: session?.user ? 'has-user' : 'no-user',
          sessionTenantId: session?.user?.tenantId,
          sessionBranchContext: session?.user?.branchContext,
          hasSession: !!session,
          timestamp: new Date().toISOString()
        };
        console.error('🔥 [AutoForm] Branch context is null - detailed context:', errorDetails);
        throw new Error('Branch context not ready - cannot execute action');
      }
      
      console.log('🎯 [AutoForm] Creating action client with:', {
        tenantId: branchContext.tenantId,
        currentBranchId: branchContext.currentBranchId,
        action: `${schema.actionPrefix}.create`,
        dataKeys: Object.keys(data),
        navigationContextKeys: Object.keys(mergedNavigationContext),
        timestamp: new Date().toISOString()
      });
      
      const actionClient = getActionClient(branchContext.tenantId, branchContext);
      // Include navigation context in the data for automatic junction creation
      const dataWithContext = {
        ...data,
        ...mergedNavigationContext // Navigation context enables automatic junction creation
      };
      if (!mergedNavigationContext || Object.keys(mergedNavigationContext).length === 0) {
        console.warn('⚠️ [AutoForm] No navigationContext provided for create - junction auto-creation will be skipped', {
          action: `${schema.actionPrefix}.create`
        });
      }
      return actionClient.executeAction({
        action: `${schema.actionPrefix}.create`,
        data: data, // Keep data clean - don't mix in navigation context
        options: {
          navigationContext: mergedNavigationContext // ✅ FIX: Pass navigation context in options
        },
        branchContext: branchContext // ✅ FIX: Pass branchContext in request
      });
    },
          onSuccess: (result) => {
        console.log('🎉 [AutoForm] Contextual creation completed', {
          entityType: schema.actionPrefix,
          entityId: result.data?.id, // ✅ FIX: Correct path to entity ID
          hasJunctions: !!result.junctions,
          junctionCount: result.junctions ? Object.keys(result.junctions).length : 0,
          timestamp: new Date().toISOString()
        });
      },
      onError: (error) => {
        console.error('❌ [AutoForm] Contextual creation failed', {
          entityType: schema.actionPrefix,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        onError?.(error);
      }
    }
  );

  // 🔍 MOVED DEBUG TO FORM SUBMISSION - No more render loop!

  // Memoize expensive computations
  const { validationSchema, visibleFields, validatableFields, tabs } = useMemo(() => {
    const isCreate = mode === 'create';
    const validationSchema = getFormValidationSchema(schema, isCreate);
    const visibleFields = getVisibleFormFields(schema);
    const validatableFields = getValidatableFields(schema, isCreate);
    const tabs = getFormTabs(visibleFields);
    
    return { validationSchema, visibleFields, validatableFields, tabs };
  }, [schema, mode]);

  // Setup form (hooks must be at top level)
  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: defaultValues || {}, // 🔥 Use context-aware defaults
    mode: 'onChange'
  });

  const { control, handleSubmit, formState: { errors }, reset } = form;

  // Reset form when default values change
  useEffect(() => {
    if (Object.keys(defaultValues).length > 0) {
      reset(defaultValues);
      console.log('🔄 [AutoForm] Form reset with default values:', {
        schema: schema.databaseKey,
        defaultKeys: Object.keys(defaultValues),
        timestamp: new Date().toISOString()
      });
    }
  }, [defaultValues, reset, schema.databaseKey]);

  // Set default active tab to first tab
  useEffect(() => {
    if (tabs.length > 0 && !activeTab) {
      setActiveTab(tabs[0].key);
    }
  }, [tabs, activeTab]);

  // Form state tracking - silent

  // Enhanced keyboard navigation
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter to submit (power user feature)
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        // Keyboard shortcut submit triggered
        handleSubmit(onFormSubmit)();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, handleSubmit]);

  // Memoized form submission handler
  const onFormSubmit = useCallback(async (data: any) => {
    console.log('🚀 [AutoForm] Form submission started', {
      entityType: schema.actionPrefix,
      mode,
      enableJunctionCreation,
      navigationContext: mergedNavigationContext,
      formData: data,
      timestamp: new Date().toISOString()
    });

    setSubmitAttempted(true);
    setIsSubmitting(true);

    try {
      // Get tenant and branch context
      const tenantId = session?.user?.tenantId;
      const currentBranchId = branchContext?.currentBranchId;

      if (!tenantId || !currentBranchId) {
        const contextError = new Error(`Missing context - tenantId: ${tenantId}, branchId: ${currentBranchId}`);
        console.error('🔥 [AutoForm] Context validation failed:', contextError);
        throw contextError;
      }

      // 🚀 CONDITIONAL LOGIC: Use internal mutation only if no parent onSubmit provided
      console.log('🔍 [AutoForm] Mutation path decision:', {
        shouldUseInternalMutation,
        mode,
        enableJunctionCreation,
        willUseInternalMutation: shouldUseInternalMutation && mode === 'create' && enableJunctionCreation,
        hasOnSubmit: !!onSubmit,
        entityType: schema.actionPrefix
      });
      
      if (shouldUseInternalMutation && mode === 'create' && enableJunctionCreation) {
        // 🛡️ SCHEMA-DRIVEN FIX: Merge form data with defaultValues (includes auto-values: ID, tenantId, branchId, etc.)
        const completeData = { ...defaultValues, ...data };
        const submissionData = prepareSubmissionData(completeData, mode, tenantId, currentBranchId, parentData, schema, navigationContext);

        // 🚨 DEBUG: Log all data being passed to contextual create
        console.log('🚨 [AutoForm] CONTEXTUAL CREATE DEBUG:', {
          tenantId,
          currentBranchId,
          entityType: schema.actionPrefix,
          defaultValues,
          formData: data,
          completeData,
          submissionData,
          mergedNavigationContext,
          parentData,
              createMutation: {
      isLoading: createMutation.isPending,
      isError: createMutation.isError,
      error: createMutation.error
          },
          timestamp: new Date().toISOString()
        });

        // Use contextual create mutation (handles entity + junction)
        const result = await createMutation.mutateAsync(submissionData);
        
        console.log('🎉 [AutoForm] Contextual create completed successfully', {
          result,
          timestamp: new Date().toISOString()
        });

        // 🔥 CRITICAL FIX: Always call onSubmit to notify parent (modal) of success
        // Extract just the entity data for the modal's mutation (not the full contextual result)
        console.log('🔍 [AutoForm] Contextual result structure analysis:', {
          result,
          hasEntity: !!result?.entity,
          hasData: !!result?.data,
          resultKeys: Object.keys(result || {}),
          timestamp: new Date().toISOString()
        });
        
        // Extract the actual entity data from the contextual result
        // The contextual result has structure: { entity: { data: actualProcessData, success: true, ... }, junction: {...} }
        // We need to extract the actual process data from result.entity.data
        const entityActionResult = result?.entity || result?.data || result;
        const actualEntityData = entityActionResult?.data || entityActionResult;
        
        console.log('🎯 [AutoForm] Extracted entity data for modal:', {
          entityActionResult,
          actualEntityData,
          actualEntityDataKeys: Object.keys(actualEntityData || {}),
          hasId: !!actualEntityData?.id,
          timestamp: new Date().toISOString()
        });
        
        // 🔥 CRITICAL FIX: Pass the actual process data (not the action result wrapper)
        await onSubmit(actualEntityData);
        
      } else {
        console.log('🔥 [AutoForm] Using parent onSubmit callback (NOT internal mutation)', {
          entityType: schema.actionPrefix,
          mode,
          enableJunctionCreation,
          shouldUseInternalMutation,
          reason: !shouldUseInternalMutation ? 'parent onSubmit provided' : 
                  mode === 'edit' ? 'edit mode' : 'junction creation disabled',
          timestamp: new Date().toISOString()
        });

        // Traditional form submission (edit mode or junction creation disabled)
        // 🛡️ SCHEMA-DRIVEN FIX: Merge form data with defaultValues (includes auto-values: ID, tenantId, branchId, etc.)
        const completeData = { ...defaultValues, ...data };
        const submissionData = prepareSubmissionData(completeData, mode, tenantId, currentBranchId, parentData, schema, navigationContext);
        await onSubmit(submissionData);
      }
      
      // Reset form state on success
      setSubmitAttempted(false);
      if (mode === 'create') {
        reset();
      }
    } catch (error) {
      console.error('🔥 [AutoForm] Form submission failed:', {
        entityType: schema.actionPrefix,
        mode,
        enableJunctionCreation,
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      onError?.(error instanceof Error ? error : new Error('Form submission failed'));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    mode, 
    enableJunctionCreation, 
    schema.actionPrefix,
    mergedNavigationContext,
            createMutation,
    initialData, 
    parentData, 
    onSubmit, 
    session, 
    reset, 
    onError
  ]);

  // Memoized form content
  const formContent = useMemo(() => {
    if (!session?.user?.tenantId || !branchContext) {
      return (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading session...</span>
        </div>
      );
    }

    const tenantId = session.user.tenantId;
    const currentBranchId = branchContext?.currentBranchId;

    if (tabs.length === 1) {
      // Single tab - render directly
      return renderTabContent(
        tabs[0].fields, 
        tenantId, 
        currentBranchId, 
        control, 
        errors, 
        compact,
        enableAnimations
      );
    }

    // Multiple tabs
    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={cn(
          "grid w-full gap-1",
          `grid-cols-${Math.min(tabs.length, 5)}`, // Max 5 columns
          "h-auto p-1"
        )}>
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.key} 
              value={tab.key}
              className={cn(
                "flex items-center gap-2 px-3 py-2",
                "data-[state=active]:bg-white data-[state=active]:shadow-sm",
                enableAnimations && "transition-all duration-200"
              )}
            >
              {tab.label}
              {/* Show error indicator if tab has errors */}
              {submitAttempted && tab.fields.some(field => errors[field.key]) && (
                <AlertCircle className="h-3 w-3 text-red-500" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.key} value={tab.key} className="mt-6">
            {renderTabContent(
              tab.fields, 
              tenantId, 
              currentBranchId, 
              control, 
              errors, 
              compact,
              enableAnimations
            )}
          </TabsContent>
        ))}
      </Tabs>
    );
  }, [session, control, errors, compact, enableAnimations, tabs, activeTab, submitAttempted]);

  // Auto-generate pythonName from rule name for rule schemas
  useEffect(() => {
    if (schema.databaseKey !== 'rule') {
      return // Early return if not a rule schema
    }

    const subscription = form.watch((value, { name }) => {
      if (name === 'name' && value.name && value.name !== '') {
        const currentPythonName = form.getValues('pythonName')
        const generatedPythonName = convertToPythonName(value.name)
        
        // Only update if different (avoids infinite loops)
        if (currentPythonName !== generatedPythonName) {
          form.setValue('pythonName', generatedPythonName, { 
            shouldValidate: true,
            shouldDirty: true 
          })
          
          console.log('🔧 [AutoForm] Auto-generated pythonName:', {
            ruleName: value.name,
            pythonName: generatedPythonName,
            timestamp: new Date().toISOString()
          })
        }
      }
    })
    
    return () => subscription.unsubscribe()
  }, [form, schema.databaseKey])

  return (
    <FormErrorBoundary onError={onError}>
      <form 
        onSubmit={handleSubmit(onFormSubmit)} 
        className={className}
      >
        <div className={cn(getFormWidthClass(schema), 'mx-auto w-full')}>
          <div className="relative">
            {/* Generic loading overlay */}
            {(isLoading || isSubmitting || (shouldUseInternalMutation && createMutation.isPending)) && (
              <div className={cn(
                "absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50",
                enableAnimations && "animate-in fade-in-0 duration-200"
              )}>
                <div className="bg-white rounded-lg p-4 shadow-lg border border-gray-200 flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {isLoading ? 'Loading...' : mode === 'create' ? 'Creating...' : 'Updating...'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isLoading ? 'Preparing form' : mode === 'create' ? 'Adding new record' : 'Saving changes'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form content */}
            {formContent}
          </div>

          {/* Debug Component - Remove after troubleshooting */}
          <FormDebugComponent
            schema={schema}
            formValues={form.watch()}
            errors={errors}
            isValid={form.formState.isValid}
            isSubmitting={isSubmitting}
            mode={mode}
            onSubmit={onSubmit}
          />
          
          {/* Context Debug - Show auto-populated values */}
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">🔧 Context Auto-Values</h4>
            <div className="text-xs space-y-1">
              <div><strong>Navigation Context:</strong> {JSON.stringify(navigationContext)}</div>
              <div><strong>Default Values (includes auto-values):</strong> {JSON.stringify(defaultValues)}</div>
            </div>
          </div>

          {/* Form actions */}
          <div className={cn(
            "flex items-center justify-end gap-3 pt-6 border-t border-gray-200",
            compact && "pt-4"
          )}>
            {showCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // Cancel button clicked
                  onCancel();
                }}
                disabled={isLoading || isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || isSubmitting || (shouldUseInternalMutation && createMutation.isPending)}
              className="relative"
              onClick={(e) => {
                console.log('🎯 [AutoForm] Submit button clicked', {
                  buttonType: 'submit',
                  isLoading,
                  isSubmitting,
                  createPending: shouldUseInternalMutation && createMutation.isPending,
                  enableJunctionCreation,
                  navigationContext: mergedNavigationContext,
                  formValid: form.formState.isValid,
                  formErrors: Object.keys(errors),
                  formValues: form.watch(),
                  event: e,
                  timestamp: new Date().toISOString()
                });
                
                // Don't prevent default - let the form handle it
                // The handleSubmit will be called automatically
              }}
            >
              {(isSubmitting || (shouldUseInternalMutation && createMutation.isPending)) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {mode === 'create' ? 'Create' : 'Update'}
            </Button>
          </div>
        </div>
      </form>
    </FormErrorBoundary>
  );
};

// Export memoized component
export const AutoForm = memo(AutoFormComponent);
AutoForm.displayName = 'AutoForm';

// Also export as default
export default AutoForm;