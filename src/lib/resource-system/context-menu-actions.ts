/**
 * Context Menu Action Handlers
 * 
 * Centralized action handlers for table context menus
 * This file manages all the different actions that can be triggered from
 * table context menus and row actions.
 */

import type { ContextMenuItem } from './schemas';
import { confirm } from '@/components/ui/confirm';

// ============================================================================
// ACTION HANDLER INTERFACE
// ============================================================================

export interface ActionContext {
  entity: any;
  resource: any;
  resourceKey: string;
  
  // Context data
  contextData?: {
    nodeId?: string;
    parentId?: string;
    branchId?: string;
    tenantId?: string;
    userId?: string;
    [key: string]: any;
  };
  
  // Callbacks
  onEdit?: (entity: any) => void;
  onDelete?: (entity: any, skipConfirmation?: boolean) => void;
  onDuplicate?: (entity: any) => void;
  onInlineEdit?: (entity: any) => void;
  customHandlers?: Record<string, (entity: any, context?: any) => void>;
  
  // Confirmation system - Stripe-style
  showConfirmDialog?: (
    action: () => Promise<void> | void,
    config: {
      title: string;
      description: string;
      variant?: 'default' | 'destructive';
      confirmLabel?: string;
    }
  ) => void;
}

// ============================================================================
// CORE ACTION HANDLERS
// ============================================================================

export class ContextMenuActions {
  private context: ActionContext;

  constructor(context: ActionContext) {
    this.context = context;
  }

  /**
   * Execute an action based on the action type
   */
  async executeAction(action: string, menuItem?: ContextMenuItem): Promise<void> {
    const { entity } = this.context;
    
    console.log('🎯 [ContextMenuActions] Executing action:', {
      action,
      actionType: menuItem?.actionType,
      entityId: entity.id,
      resourceKey: this.context.resourceKey,
      timestamp: new Date().toISOString()
    });

    // Check context requirements
    if (menuItem?.contextRequirements) {
      const missingContext = this.checkContextRequirements(menuItem.contextRequirements);
      if (missingContext.length > 0) {
        console.warn(`🎯 [ContextMenuActions] Missing required context: ${missingContext.join(', ')}`);
        return;
      }
    }

    // Check conditions
    if (menuItem?.conditions && !this.checkConditions(menuItem.conditions)) {
  
      return;
    }

    // Handle confirmation if required - MANDATORY Stripe-style confirm system
    if (menuItem?.confirmMessage) {
      if (!this.context.showConfirmDialog) {
        console.error('🎯 [ContextMenuActions] showConfirmDialog is required for confirmation. Component must use useConfirmDialog hook.');
        return;
      }
      
      // Use Stripe-style confirmation system
      const entityName = entity.name || entity.title || entity.id;
      const entityType = this.context.resource?.display?.title?.slice(0, -1) || 'item'; // Remove 's' from plural
      
      // Determine confirmation config based on action
      let confirmConfig;
      switch (action) {
        case 'delete':
          confirmConfig = confirm.delete(entityName, entityType);
          break;
        case 'duplicate':
          confirmConfig = confirm.duplicate(entityName, entityType);
          break;
        default:
          // Use custom config for other actions
          confirmConfig = confirm.custom({
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} ${entityType}`,
            description: menuItem.confirmMessage,
            variant: action === 'delete' ? 'destructive' : 'default',
            confirmLabel: action.charAt(0).toUpperCase() + action.slice(1)
          });
      }
      
      // Show confirmation dialog and return early - the actual action will run in the callback
      // Remove confirmMessage from menuItem to prevent double confirmation
      const menuItemWithoutConfirm = menuItem ? { ...menuItem, confirmMessage: undefined } : undefined;
      this.context.showConfirmDialog(
        () => this.executeActionWithoutConfirmation(action, menuItemWithoutConfirm),
        confirmConfig
      );
      return;
    }

    // Execute action without confirmation (confirmation already handled above)
    await this.executeActionWithoutConfirmation(action, menuItem);
  }

  /**
   * Execute action without confirmation check (internal method)
   */
  private async executeActionWithoutConfirmation(action: string, menuItem?: ContextMenuItem): Promise<void> {
    try {
      // Handle based on actionType
      switch (menuItem?.actionType) {
        case 'inline-edit':
          await this.handleInlineEdit();
          break;
        case 'modal':
          await this.handleModalAction(action);
          break;
        case 'api':
          await this.handleApiAction(menuItem);
          break;
        case 'handler':
        default:
          await this.handleStandardAction(action);
      }
    } catch (error) {
      console.error('🎯 [ContextMenuActions] Action failed:', {
        action,
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  // ============================================================================
  // VALIDATION METHODS
  // ============================================================================

  private checkContextRequirements(requirements: NonNullable<ContextMenuItem['contextRequirements']>): string[] {
    const missing: string[] = [];
    const { contextData } = this.context;
    
    if (requirements.nodeId && !contextData?.nodeId) {
      missing.push('nodeId');
    }
    if (requirements.parentId && !contextData?.parentId) {
      missing.push('parentId');
    }
    if (requirements.branchId && !contextData?.branchId) {
      missing.push('branchId');
    }
    if (requirements.customContext) {
      for (const key of requirements.customContext) {
        if (!contextData?.[key]) {
          missing.push(key);
        }
      }
    }
    
    return missing;
  }

  private checkConditions(conditions: NonNullable<ContextMenuItem['conditions']>): boolean {
    const { entity } = this.context;
    
    if (conditions.field && conditions.operator && conditions.value !== undefined) {
      const fieldValue = entity[conditions.field];
      
      switch (conditions.operator) {
        case 'equals':
          return fieldValue === conditions.value;
        case 'not-equals':
          return fieldValue !== conditions.value;
        case 'contains':
          return String(fieldValue).includes(String(conditions.value));
        default:
          return true;
      }
    }
    
    // TODO: Add permission checking when available
    if (conditions.permission) {
      // For now, assume permission is granted
      return true;
    }
    
    return true;
  }

  // ============================================================================
  // ACTION TYPE HANDLERS
  // ============================================================================

  private async handleInlineEdit(): Promise<void> {
    if (this.context.onInlineEdit) {
      this.context.onInlineEdit(this.context.entity);
    } else if (this.context.onEdit) {
      this.context.onEdit(this.context.entity);
    } else {
      console.warn('🎯 [ContextMenuActions] No inline edit handler provided');
    }
  }

  private async handleModalAction(action: string): Promise<void> {
    // Modal actions are handled like standard actions but could have special modal behavior
    await this.handleStandardAction(action);
  }

  private async handleApiAction(menuItem: ContextMenuItem): Promise<void> {
    const { entity, contextData } = this.context;
    const { parameters } = menuItem;
    
    if (!parameters?.endpoint) {
      console.warn('🎯 [ContextMenuActions] No endpoint specified for API action');
      return;
    }
    
    try {
      // Build payload from mapping
      const payload = this.buildPayloadFromMapping(
        parameters.payloadMapping || {},
        entity,
        contextData
      );
      
      console.log('🎯 [ContextMenuActions] Making API call:', {
        endpoint: parameters.endpoint,
        method: parameters.method || 'POST',
        payload
      });
      
      // Make API call
      const response = await fetch(parameters.endpoint, {
        method: parameters.method || 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // TODO: Add authentication headers
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
  
      
      // TODO: Handle success feedback (toast, refresh, etc.)
      
    } catch (error) {
      console.error('🎯 [ContextMenuActions] API action failed:', error);
      throw error;
    }
  }

  private async handleStandardAction(action: string): Promise<void> {
    const { entity } = this.context;
    
    switch (action) {
      case 'edit':
        await this.handleEdit();
        break;
      case 'delete':
        await this.handleDelete();
        break;
      case 'duplicate':
        await this.handleDuplicate();
        break;
      case 'ignoreRule':
        await this.handleIgnoreRule();
        break;
      case 'unignoreRule':
        await this.handleUnignoreRule();
        break;
      case 'testConnection':
        await this.handleTestConnection();
        break;
      case 'viewCustomers':
        await this.handleViewCustomers();
        break;
      case 'viewActivity':
        await this.handleViewActivity();
        break;
      case 'branchFrom':
        await this.handleBranchFrom();
        break;
      case 'mergeTo':
        await this.handleMergeTo();
        break;
      case 'viewHistory':
        await this.handleViewHistory();
        break;
      case 'compareBranches':
        await this.handleCompareBranches();
        break;
      case 'switchBranch':
        await this.handleSwitchBranch();
        break;
      default:
        // Try custom handlers
        if (this.context.customHandlers?.[action]) {
          await this.context.customHandlers[action](entity, this.context.contextData);
        } else {
          console.warn(`🎯 [ContextMenuActions] Unknown action: ${action}`);
        }
    }
  }

  private buildPayloadFromMapping(
    mapping: Record<string, string>,
    entity: any,
    contextData: any
  ): Record<string, any> {
    const payload: Record<string, any> = {};
    
    for (const [key, path] of Object.entries(mapping)) {
      const value = this.getValueFromPath(path, { entity, context: contextData });
      if (value !== undefined) {
        payload[key] = value;
      }
    }
    
    return payload;
  }

  private getValueFromPath(path: string, data: any): any {
    const parts = path.split('.');
    let current = data;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  // ============================================================================
  // CORE ACTIONS
  // ============================================================================

  private async handleEdit(): Promise<void> {
    if (this.context.onEdit) {
      this.context.onEdit(this.context.entity);
    } else {
      console.warn('🎯 [ContextMenuActions] No edit handler provided');
    }
  }

  private async handleDelete(): Promise<void> {
    if (this.context.onDelete) {
      // Pass skipConfirmation = true since we already handled confirmation
      this.context.onDelete(this.context.entity, true);
    } else {
      console.warn('🎯 [ContextMenuActions] No delete handler provided');
    }
  }

  private async handleDuplicate(): Promise<void> {
    if (this.context.onDuplicate) {
      this.context.onDuplicate(this.context.entity);
    } else {
      console.warn('🎯 [ContextMenuActions] No duplicate handler provided');
    }
  }

  // ============================================================================
  // CUSTOM ACTIONS - RULE SPECIFIC
  // ============================================================================

    private async handleIgnoreRule(isToggle: boolean = false): Promise<void> {
    const { entity, contextData } = this.context;
    
    if (!contextData?.nodeId) {
      console.warn('🎯 [ContextMenuActions] Missing nodeId for rule ignore');
      return;
    }

    try {
      console.log('🎯 [ContextMenuActions] Ignoring rule:', {
        ruleId: entity.id,
        nodeId: contextData.nodeId,
        tenantId: contextData.tenantId,
        branchId: contextData.branchId,
        entityDisplayClass: entity.displayClass,
        entityIsIgnored: entity.isIgnored,
        entityTextColor: entity.textColor,
        fullContextData: contextData
      }, { isToggle });
      
      // Use action system for optimistic updates
      const { getActionClient } = await import('@/lib/action-client');
      // TODO: Context menu actions need access to branchContext - for now use minimal client
      const actionClient = getActionClient('temp-tenant');
      
      await actionClient.executeAction({
        action: 'ruleIgnores.create',
        data: {
          ruleId: entity.id,
          nodeId: contextData.nodeId,
          tenantId: contextData.tenantId,
          branchId: contextData.branchId,
          ignoredAt: new Date().toISOString(),
          ignoredBy: contextData.userId
        }
      });
      
  
      
      // Invalidate rules cache to update visual feedback
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('rule-ignored', {
          detail: { ruleId: entity.id, nodeId: contextData.nodeId }
        });
        window.dispatchEvent(event);
      }
      
    } catch (error) {
      console.error('🎯 [ContextMenuActions] Failed to ignore rule:', error);
      
      // Only try to toggle if we're not already in a toggle operation
      if (!isToggle && error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as any).message || '';
        if (errorMessage.includes('Unique constraint failed')) {
      
          // If rule is already ignored, unignore it instead
          await this.handleUnignoreRule(true);
          
          // Show notification
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('rule-toggle-notification', {
              detail: { 
                message: 'Rule was already ignored - unignored instead',
                type: 'info'
              }
            });
            window.dispatchEvent(event);
          }
          return;
        }
      }
      
      throw error;
    }
  }

    private async handleUnignoreRule(isToggle: boolean = false): Promise<void> {
    const { entity, contextData } = this.context;
    
    if (!contextData?.nodeId) {
      console.warn('🎯 [ContextMenuActions] Missing nodeId for rule unignore');
      return;
    }

    try {
      console.log('🎯 [ContextMenuActions] Unignoring rule:', {
        ruleId: entity.id,
        nodeId: contextData.nodeId,
        tenantId: contextData.tenantId,
        branchId: contextData.branchId
      }, { isToggle });
      
      // Use action system for optimistic updates
      const { getActionClient } = await import('@/lib/action-client');
      // TODO: Context menu actions need access to branchContext - for now use minimal client
      const actionClient = getActionClient('temp-tenant');
      
      // For junction table deletion, we need to find the existing record first
      // The action system will handle finding and deleting the correct record
      await actionClient.executeAction({
        action: 'ruleIgnores.delete',
        data: {
          ruleId: entity.id,
          nodeId: contextData.nodeId,
          tenantId: contextData.tenantId,
          branchId: contextData.branchId
        }
      });
      
  
      
      // Invalidate rules cache to update visual feedback
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('rule-unignored', {
          detail: { ruleId: entity.id, nodeId: contextData.nodeId }
        });
        window.dispatchEvent(event);
      }
      
    } catch (error) {
      console.error('🎯 [ContextMenuActions] Failed to unignore rule:', error);
      
      // Only try to toggle if we're not already in a toggle operation
      if (!isToggle && error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as any).message || '';
        if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
      
          // If rule is not ignored, ignore it instead
          await this.handleIgnoreRule(true);
          
          // Show notification
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('rule-toggle-notification', {
              detail: { 
                message: 'Rule was not ignored - ignored instead',
                type: 'info'
              }
            });
            window.dispatchEvent(event);
          }
          return;
        }
      }
      
      throw error;
    }
  }

  // ============================================================================
  // CUSTOM ACTIONS - OFFICE SPECIFIC
  // ============================================================================

  private async handleTestConnection(): Promise<void> {
    const { entity, resourceKey } = this.context;
    
    if (resourceKey !== 'office') {
      console.warn('🎯 [ContextMenuActions] testConnection only available for offices');
      return;
    }


    
    // TODO: Implement actual connection test
    // This would typically call an API endpoint to test the vendor connection
    alert(`Testing connection for office: ${entity.name} (${entity.officeId})`);
  }

  private async handleViewCustomers(): Promise<void> {
    const { entity, resourceKey } = this.context;
    
    if (resourceKey !== 'office') {
      console.warn('🎯 [ContextMenuActions] viewCustomers only available for offices');
      return;
    }


    
    // TODO: Implement customer viewing
    // This would typically navigate to a customer list filtered by office
    alert(`Viewing customers for office: ${entity.name}`);
  }

  private async handleViewActivity(): Promise<void> {
    const { entity } = this.context;
    

    
    // TODO: Implement activity viewing
    // This would typically open an activity log or analytics view
    alert(`Viewing activity for: ${entity.name || entity.id}`);
  }

  // ============================================================================
  // BRANCHING ACTIONS
  // ============================================================================

  private async handleBranchFrom(): Promise<void> {
    const { entity } = this.context;
    

    
    // TODO: Implement branch creation
    // This would typically open a dialog to create a new branch from this entity
    alert(`Creating branch from: ${entity.name || entity.id}`);
  }

  private async handleMergeTo(): Promise<void> {
    const { entity } = this.context;
    

    
    // TODO: Implement merge functionality
    // This would typically open a dialog to select target branch and merge
    alert(`Merging: ${entity.name || entity.id}`);
  }

  private async handleViewHistory(): Promise<void> {
    const { entity, customHandlers } = this.context;
    
    console.log('🔍 [ContextMenuActions] handleViewHistory called:', {
      entityId: entity.id,
      entityName: entity.name,
      hasCustomHandlers: !!customHandlers,
      hasViewHistoryHandler: !!(customHandlers?.viewHistory)
    });
    
    // 🏆 GOLD STANDARD: Use custom handler if available (from auto-table)
    if (customHandlers?.viewHistory) {
      customHandlers.viewHistory(entity);
    } else {
      // Fallback for components that don't use the auto-table system
      console.warn('🚨 [ContextMenuActions] No viewHistory custom handler found');
      alert(`Viewing history for: ${entity.name || entity.id}`);
    }
  }

  private async handleCompareBranches(): Promise<void> {
    const { entity } = this.context;
    

    
    // TODO: Implement branch comparison
    // This would typically open a diff view between branches
    alert(`Comparing branches for: ${entity.name || entity.id}`);
  }

  private async handleSwitchBranch(): Promise<void> {
    const { entity } = this.context;
    

    
    // TODO: Implement branch switching
    // This would typically open a branch selector dialog
    alert(`Switching branch for: ${entity.name || entity.id}`);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a context menu action handler
 */
export function createContextMenuActions(context: ActionContext): ContextMenuActions {
  return new ContextMenuActions(context);
}

/**
 * Get icon component for action
 */
export function getActionIcon(iconName: string): React.ComponentType<any> | null {
  // This would be implemented based on your icon system
  // For now, return null and let the table handle icon rendering
  return null;
}

/**
 * Get action display name
 */
export function getActionDisplayName(action: string): string {
  const actionNames: Record<string, string> = {
    edit: 'Edit',
    delete: 'Delete',
    duplicate: 'Duplicate',
    testConnection: 'Test Connection',
    viewCustomers: 'View Customers',
    viewActivity: 'View Activity',
    branchFrom: 'Branch From',
    mergeTo: 'Merge To',
    viewHistory: 'View History',
    compareBranches: 'Compare Branches',
    switchBranch: 'Switch Branch'
  };
  
  return actionNames[action] || action;
}




