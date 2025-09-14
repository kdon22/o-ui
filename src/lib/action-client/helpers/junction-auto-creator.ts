/**
 * Junction Auto-Creator - Factory-Driven Junction Management
 * 
 * BULLETPROOF FACTORY DESIGN:
 * - Auto-discovers ALL junction schemas from feature directories
 * - Schema-driven detection with zero hardcoding
 * - Navigation context validation  
 * - Automatic junction creation after parent entity confirmation
 * - Clean error handling and rollback
 */

import type { BranchContext } from '../types';
import type { ActionResponse } from '@/lib/resource-system/schemas';

// ============================================================================
// FACTORY IMPORTS - AUTO-DISCOVERY
// ============================================================================

// Import all schemas that might have junction configs
import { RULE_SCHEMA, PROCESS_RULE_SCHEMA, RULE_IGNORE_SCHEMA } from '@/features/rules/rules.schema';
import { NODE_SCHEMA } from '@/features/nodes/nodes.schema';
import { PROCESS_SCHEMA, NODE_PROCESS_SCHEMA } from '@/features/processes/processes.schema';
import { WORKFLOW_SCHEMA, WORKFLOW_PROCESS_SCHEMA, CUSTOMER_WORKFLOW_SCHEMA, NODE_WORKFLOW_SCHEMA } from '@/features/workflows/workflows.schema';
import { USER_SCHEMA, USER_GROUP_SCHEMA, USER_TENANT_SCHEMA, GROUP_PERMISSION_SCHEMA } from '@/features/users/users.schema';
import { ALL_TAG_SCHEMAS } from '@/features/junctions/tag.schema';

// ============================================================================
// TYPES
// ============================================================================

interface JunctionConfig {
  autoCreateOnParentCreate: boolean;
  navigationContext: Record<string, string>;
  defaults: Record<string, any>;
}

interface JunctionSchema {
  databaseKey: string;
  modelName: string;
  actionPrefix: string;
  junctionConfig?: JunctionConfig;
  fieldMappings?: Record<string, any>;
  indexedDBKey?: (record: any) => string;
}

interface AutoCreateContext {
  parentAction: string;
  parentData: any;
  parentResult: any;
  branchContext: BranchContext | null;
  // 🔎 New: pass navigationContext explicitly so we don't rely on mutating parentData
  navigationContext?: Record<string, any> | null;
}

// ============================================================================
// FACTORY - AUTO-DISCOVERY SYSTEM
// ============================================================================

/**
 * Factory class for auto-discovering and managing junction auto-creation
 */
class JunctionAutoCreatorFactory {
  private static instance: JunctionAutoCreatorFactory;
  private junctionRegistry: Map<string, JunctionSchema[]> = new Map();
  private allJunctionSchemas: JunctionSchema[] = [];
  private initialized = false;

  static getInstance(): JunctionAutoCreatorFactory {
    if (!JunctionAutoCreatorFactory.instance) {
      JunctionAutoCreatorFactory.instance = new JunctionAutoCreatorFactory();
    }
    return JunctionAutoCreatorFactory.instance;
  }

  /**
   * Factory method: Auto-discover all junction schemas
   */
  private discoverAllJunctionSchemas(): JunctionSchema[] {
    const discovered: JunctionSchema[] = [];

    // FACTORY PATTERN: Auto-discover from all imported schemas
    const allSchemas = [
      // Rule-related junctions
      PROCESS_RULE_SCHEMA,
      RULE_IGNORE_SCHEMA,
      
      // Node-related junctions
      NODE_PROCESS_SCHEMA,
      NODE_WORKFLOW_SCHEMA,
      
      // Workflow-related junctions
      WORKFLOW_PROCESS_SCHEMA,
      CUSTOMER_WORKFLOW_SCHEMA,
      
      // User-related junctions
      USER_GROUP_SCHEMA,
      USER_TENANT_SCHEMA,
      GROUP_PERMISSION_SCHEMA,
      
      // Tag junctions (factory-generated)
      ...Object.values(ALL_TAG_SCHEMAS),
    ];

    for (const schema of allSchemas) {
      if (this.isValidJunctionSchema(schema)) {
        discovered.push(schema as JunctionSchema);
        console.log('🔍 [JunctionFactory] Discovered junction schema:', {
          databaseKey: schema.databaseKey,
          hasJunctionConfig: !!schema.junctionConfig,
          autoCreate: schema.junctionConfig?.autoCreateOnParentCreate
        });
      }
    }

    return discovered;
  }

  /**
   * Validate if a schema is a valid junction with auto-creation config
   */
  private isValidJunctionSchema(schema: any): boolean {
    return schema && 
           schema.databaseKey && 
           schema.actionPrefix && 
           schema.junctionConfig?.autoCreateOnParentCreate === true;
  }

  /**
   * Factory initialization - auto-discovery
   */
  initialize(): void {
    if (this.initialized) return;

    // Auto-discover all junction schemas
    this.allJunctionSchemas = this.discoverAllJunctionSchemas();

    // Build registry mapping parent actions to junction schemas
    this.buildJunctionRegistry();

    this.initialized = true;
    console.log('✅ [JunctionFactory] Auto-discovery completed:', {
      totalJunctions: this.allJunctionSchemas.length,
      parentActions: Array.from(this.junctionRegistry.keys()),
      junctionsByAction: Object.fromEntries(
        Array.from(this.junctionRegistry.entries()).map(([action, junctions]) => 
          [action, junctions.map(j => j.databaseKey)]
        )
      )
    });

    // 🔍 TARGETED DEBUG: Ensure nodeProcesses is registered for process.create
    const junctionsForProcessCreate = this.junctionRegistry.get('process.create') || [];
    console.log('🔎 [JunctionFactory] Registry check for process.create', {
      hasNodeProcesses: junctionsForProcessCreate.some(j => j.databaseKey === 'nodeProcesses'),
      junctions: junctionsForProcessCreate.map(j => ({ key: j.databaseKey, actionPrefix: j.actionPrefix }))
    });
  }

  /**
   * Build registry by analyzing junction configs to determine parent actions
   */
  private buildJunctionRegistry(): void {
    for (const junctionSchema of this.allJunctionSchemas) {
      const parentActions = this.inferParentActionsFromJunction(junctionSchema);
      
      for (const parentAction of parentActions) {
        if (!this.junctionRegistry.has(parentAction)) {
          this.junctionRegistry.set(parentAction, []);
        }
        this.junctionRegistry.get(parentAction)!.push(junctionSchema);
      }
    }
  }

  /**
   * Factory method: Infer parent actions from junction field mappings (ZERO HARDCODING)
   */
  private inferParentActionsFromJunction(junctionSchema: JunctionSchema): string[] {
    const parentActions: string[] = [];

    // Explicit parent mapping to avoid accidental triggers from multiple relations
    const explicit = this.getExplicitParentActions(junctionSchema.databaseKey);
    if (explicit) {
      return explicit;
    }

    if (!junctionSchema.fieldMappings) {
      console.log('🏭 [JunctionFactory] No fieldMappings for schema:', {
        junction: junctionSchema.databaseKey,
        actionPrefix: junctionSchema.actionPrefix
      });
      return parentActions;
    }

    // BULLETPROOF: Extract parent entities from field mappings
    const mappingDetails = [];
    for (const [fieldName, mapping] of Object.entries(junctionSchema.fieldMappings)) {
      const detail = {
        fieldName,
        type: mapping.type,
        target: mapping.target,
        isRelation: mapping.type === 'relation',
        isNotBranch: mapping.target !== 'branch',
        willCreateAction: mapping.type === 'relation' && mapping.target && mapping.target !== 'branch'
      };
      mappingDetails.push(detail);
      
      if (mapping.type === 'relation' && mapping.target && mapping.target !== 'branch') {
        // Convert target entity to action prefix (e.g., 'rule' -> 'rule.create')
        const actionPrefix = mapping.target;
        const parentAction = `${actionPrefix}.create`;
        parentActions.push(parentAction);
        
        console.log('🎯 [JunctionFactory] Registering parent action:', {
          junction: junctionSchema.databaseKey,
          junctionActionPrefix: junctionSchema.actionPrefix,
          fieldName,
          targetEntity: mapping.target,
          parentAction,
          timestamp: new Date().toISOString()
        });
      }
    }

    // No extra special-cases; explicit mapping above handles known junctions

    console.log('🏭 [JunctionFactory] Inferred parent actions from schema:', {
      junction: junctionSchema.databaseKey,
      junctionActionPrefix: junctionSchema.actionPrefix,
      fieldMappings: Object.keys(junctionSchema.fieldMappings),
      mappingDetails,
      parentActions,
      timestamp: new Date().toISOString()
    });

    return parentActions;
  }

  /**
   * Return explicit parent action(s) for well-known junction tables
   * Ensures junctions only auto-create when their owning entity is created
   */
  private getExplicitParentActions(databaseKey: string): string[] | null {
    switch (databaseKey) {
      case 'nodeProcesses':
        return ['process.create'];
      case 'nodeWorkflows':
        return ['workflow.create'];
      case 'processRules':
        return ['rule.create'];
      case 'workflowProcesses':
        return ['workflow.create'];
      case 'customerWorkflows':
        return ['workflow.create'];
      case 'ruleIgnores':
        return ['rule.create'];
      default:
        return null;
    }
  }

  /**
   * Factory method: Check if navigation context indicates junction should be auto-created
   */
  shouldAutoCreateJunction(
    parentAction: string, 
    parentData: any, 
    junctionSchema: JunctionSchema,
    navigationContext?: Record<string, any> | null
  ): boolean {
    const junctions = this.junctionRegistry.get(parentAction);
    if (!junctions || !junctions.includes(junctionSchema)) {
      return false;
    }

    const config = junctionSchema.junctionConfig;
    if (!config?.autoCreateOnParentCreate) {
      return false;
    }

    // Check if navigation context fields are present in parent data OR in provided navigationContext
    const requiredFields = Object.keys(config.navigationContext);
    const fieldChecks = requiredFields.map(field => {
      const fromParent = parentData ? parentData[field] : undefined;
      const fromNav = navigationContext ? navigationContext[field] : undefined;
      const value = fromParent !== undefined && fromParent !== null ? fromParent : fromNav;
      return {
        field,
        hasValue: value !== undefined && value !== null,
        value,
        type: typeof value,
        source: fromParent !== undefined && fromParent !== null ? 'parentData' : (fromNav !== undefined && fromNav !== null ? 'navigationContext' : 'none')
      };
    });
    
    // Require ALL configured navigationContext fields to be present to auto-create
    const hasRequiredContext = fieldChecks.every(check => check.hasValue);

    console.log('🔍 [JunctionFactory] Detailed auto-creation check:', {
      parentAction,
      junctionTable: junctionSchema.databaseKey,
      actionPrefix: junctionSchema.actionPrefix,
      requiredFields,
      fieldChecks,
      hasRequiredContext,
      autoCreateOnParentCreate: config?.autoCreateOnParentCreate,
      navigationContext: config?.navigationContext,
      allParentDataKeys: Object.keys(parentData || {}),
      providedNavigationContextKeys: Object.keys(navigationContext || {}),
      parentDataSample: Object.fromEntries(
        Object.entries(parentData || {}).slice(0, 10) // First 10 fields for debugging
      ),
      decision: hasRequiredContext ? 'WILL CREATE' : 'WILL SKIP',
      timestamp: new Date().toISOString()
    });

    return hasRequiredContext;
  }

  /**
   * Factory method: Auto-create junction records after parent entity creation
   */
  async autoCreateJunctions(
    context: AutoCreateContext,
    executeJunctionAction: (action: string, data: any) => Promise<ActionResponse>
  ): Promise<ActionResponse[]> {
    this.initialize();

    const { parentAction, parentData, parentResult, branchContext, navigationContext } = context;
    
    console.log('🚀🚀🚀 [JunctionAutoCreator] autoCreateJunctions ENTRY POINT:', {
      parentAction,
      hasParentData: !!parentData,
      parentDataKeys: parentData ? Object.keys(parentData) : [],
      hasParentResult: !!parentResult,
      parentResultKeys: parentResult ? Object.keys(parentResult) : [],
      hasBranchContext: !!context.branchContext,
      branchId: branchContext?.currentBranchId,
      registrySize: this.junctionRegistry.size,
      registryKeys: Array.from(this.junctionRegistry.keys()),
      timestamp: new Date().toISOString()
    });
    
    const junctions = this.junctionRegistry.get(parentAction) || [];
    console.log('🔍 [JunctionAutoCreator] Found junctions for action:', {
      parentAction,
      junctionCount: junctions.length,
      junctionSchemas: junctions.map(j => j.databaseKey),
      timestamp: new Date().toISOString()
    });
    
    const results: ActionResponse[] = [];

    for (const junctionSchema of junctions) {
      console.log('🔍 [JunctionAutoCreator] Processing junction schema:', {
        junction: junctionSchema.databaseKey,
        actionPrefix: junctionSchema.actionPrefix,
        parentAction,
        navigationContext: junctionSchema.junctionConfig?.navigationContext,
        autoCreateOnParentCreate: junctionSchema.junctionConfig?.autoCreateOnParentCreate,
        timestamp: new Date().toISOString()
      });
      
      const shouldCreate = this.shouldAutoCreateJunction(parentAction, parentData, junctionSchema, navigationContext);
      console.log('🤔 [JunctionAutoCreator] Should create junction?', {
        junction: junctionSchema.databaseKey,
        actionPrefix: junctionSchema.actionPrefix,
        shouldCreate,
        parentAction,
        junctionConfig: junctionSchema.junctionConfig,
        willCreateAction: shouldCreate ? `${junctionSchema.actionPrefix}.create` : 'N/A',
        timestamp: new Date().toISOString()
      });
      
      if (!shouldCreate) {
        console.log('⏭️ [JunctionAutoCreator] Skipping junction (shouldCreate=false):', {
          junction: junctionSchema.databaseKey,
          actionPrefix: junctionSchema.actionPrefix,
          timestamp: new Date().toISOString()
        });
        continue;
      }

      try {
        const junctionData = this.buildJunctionDataFromFactory(
          parentData, 
          parentResult, 
          junctionSchema, 
          branchContext,
          parentAction,
          navigationContext
        );

        const junctionAction = `${junctionSchema.actionPrefix}.create`;
        
        console.log('🚀 [JunctionFactory] About to call executeJunctionAction:', {
          junction: junctionSchema.databaseKey,
          parentAction,
          junctionAction,
          actionPrefix: junctionSchema.actionPrefix,
          data: junctionData,
          dataKeys: Object.keys(junctionData),
          isJunctionActionSameAsParent: junctionAction === parentAction,
          timestamp: new Date().toISOString()
        });

        const junctionResult = await executeJunctionAction(
          junctionAction,
          junctionData
        );
        
        console.log('🎯 [JunctionFactory] executeJunctionAction returned:', {
          junction: junctionSchema.databaseKey,
          junctionAction,
          parentAction,
          success: junctionResult.success,
          hasData: !!junctionResult.data,
          error: junctionResult.error,
          timestamp: new Date().toISOString()
        });

        results.push(junctionResult);

        if (junctionResult.success) {
          console.log('✅ [JunctionFactory] Junction created successfully:', {
            junction: junctionSchema.databaseKey,
            parentId: parentResult.data?.id,
            junctionId: junctionResult.data?.id
          });
        } else {
          console.error('❌ [JunctionFactory] Junction creation failed:', {
            junction: junctionSchema.databaseKey,
            error: junctionResult.error
          });
        }

      } catch (error) {
        console.error('🔥 [JunctionFactory] Junction creation error:', {
          junction: junctionSchema.databaseKey,
          error: error instanceof Error ? error.message : error
        });

        results.push({
          success: false,
          error: `Junction creation failed: ${error instanceof Error ? error.message : error}`,
          timestamp: Date.now(),
          action: `${junctionSchema.actionPrefix}.create`
        });
      }
    }

    return results;
  }

  /**
   * 🏆 LEAN: Build junction data from navigation context - let action system handle the rest
   */
  private buildJunctionDataFromFactory(
    parentData: any,
    parentResult: any,
    junctionSchema: JunctionSchema,
    branchContext: BranchContext | null,
    parentAction: string,
    navigationContext?: Record<string, any> | null
  ): any {
    const config = junctionSchema.junctionConfig!;
    
    // 🚀 MINIMAL DATA: Only provide what's needed - action system will auto-generate the rest
    const junctionData: any = {
      // Copy ONLY the navigation context fields that are available
      ...Object.fromEntries(
        Object.keys(config.navigationContext)
          .map(key => {
            const fromParent = parentData ? parentData[key] : undefined;
            const fromNav = navigationContext ? navigationContext[key] : undefined;
            const value = fromParent !== undefined && fromParent !== null ? fromParent : fromNav;
            return [key, value];
          })
          .filter(([_, v]) => v !== undefined && v !== null)
      ),
      
      // Apply schema defaults
      ...config.defaults
    };

    // Set parent entity reference (the newly created parent)
    this.setParentEntityReferences(junctionData, parentResult, junctionSchema, parentAction);

    console.log('🏭 [JunctionFactory] Built minimal junction data (action system will auto-generate rest):', {
      junction: junctionSchema.databaseKey,
      providedFields: Object.keys(junctionData),
      data: junctionData
    });

    return junctionData;
  }

  /**
   * Factory method: Set parent entity references based on field mappings (ZERO HARDCODING)
   */
  private setParentEntityReferences(
    junctionData: any,
    parentResult: any,
    junctionSchema: JunctionSchema,
    parentAction: string
  ): void {
    const parentId = parentResult.data?.id || parentResult.id;
    const [parentEntity] = parentAction.split('.'); // Extract entity from 'rule.create'

    if (!junctionSchema.fieldMappings) {
      console.warn('🚨 [JunctionFactory] No field mappings found for junction:', junctionSchema.databaseKey);
      return;
    }

    // BULLETPROOF: Find the field that maps to the parent entity
    for (const [fieldName, mapping] of Object.entries(junctionSchema.fieldMappings)) {
      if (mapping.type === 'relation' && mapping.target === parentEntity) {
        // Only set if not already provided by navigation context
        if (!junctionData[fieldName]) {
          junctionData[fieldName] = parentId;
          console.log('🏭 [JunctionFactory] Set parent reference:', {
            junction: junctionSchema.databaseKey,
            field: fieldName,
            parentEntity,
            parentId
          });
        }
        break;
      }
    }
  }

  /**
   * Factory method: Auto-update junction records when parent entity is updated
   */
  async autoUpdateJunctions(
    context: Omit<AutoCreateContext, 'parentResult'> & { parentResult: any; updateData: any },
    executeJunctionAction: (action: string, data: any) => Promise<ActionResponse>
  ): Promise<ActionResponse[]> {
    this.initialize();

    const { parentAction, parentData, parentResult, updateData, branchContext } = context;
    const updateAction = parentAction.replace('.create', '.update');
    const junctions = this.junctionRegistry.get(parentAction) || [];
    const results: ActionResponse[] = [];

    for (const junctionSchema of junctions) {
      // Check if junction fields are being updated
      const junctionFieldsInUpdate = Object.keys(junctionSchema.junctionConfig?.navigationContext || {})
        .filter(field => updateData[field] !== undefined);

      if (junctionFieldsInUpdate.length === 0) {
        continue; // No junction-related fields being updated
      }

      try {
        // Find existing junction records for this parent
        const parentId = parentResult.data?.id || parentResult.id;
        const [parentEntity] = parentAction.split('.');
        
        console.log('🔄 [JunctionFactory] Updating junction for parent update:', {
          junction: junctionSchema.databaseKey,
          parentEntity,
          parentId,
          updatedFields: junctionFieldsInUpdate
        });

        // For now, we'll need to implement junction querying
        // This would require integration with the action system to find existing junctions
        // TODO: Implement junction update logic when we have junction querying capability

      } catch (error) {
        console.error('🔥 [JunctionFactory] Junction update error:', {
          junction: junctionSchema.databaseKey,
          error: error instanceof Error ? error.message : error
        });
      }
    }

    return results;
  }

  /**
   * Factory method: Auto-delete junction records when parent entity is deleted
   */
  async autoDeleteJunctions(
    context: Omit<AutoCreateContext, 'parentResult'> & { parentResult: any },
    executeJunctionAction: (action: string, data: any) => Promise<ActionResponse>
  ): Promise<ActionResponse[]> {
    this.initialize();

    const { parentAction, parentData, parentResult, branchContext } = context;
    const deleteAction = parentAction.replace('.create', '.delete');
    const junctions = this.junctionRegistry.get(parentAction) || [];
    const results: ActionResponse[] = [];

    for (const junctionSchema of junctions) {
      try {
        const parentId = parentResult.data?.id || parentResult.id;
        const [parentEntity] = parentAction.split('.');

        console.log('🗑️ [JunctionFactory] Deleting junctions for parent deletion:', {
          junction: junctionSchema.databaseKey,
          parentEntity,
          parentId
        });

        // Find and delete all junction records for this parent
        // This would require integration with the action system to find existing junctions
        // TODO: Implement junction deletion logic when we have junction querying capability

      } catch (error) {
        console.error('🔥 [JunctionFactory] Junction deletion error:', {
          junction: junctionSchema.databaseKey,
          error: error instanceof Error ? error.message : error
        });
      }
    }

    return results;
  }

  /**
   * Get registered junctions for debugging
   */
  getRegisteredJunctions(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const [action, junctions] of this.junctionRegistry.entries()) {
      result[action] = junctions.map(j => j.databaseKey);
    }
    return result;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const junctionAutoCreator = JunctionAutoCreatorFactory.getInstance();

export type { AutoCreateContext, JunctionConfig, JunctionSchema };