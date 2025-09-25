/**
 * Permission Template Registry - Factory-Driven Permission Matrices
 * 
 * Configurable permission matrix templates that can be reused across
 * different entities (Groups, Users, API Keys, etc.)
 */

// ============================================================================
// PERMISSION TEMPLATE INTERFACES
// ============================================================================

export interface PermissionAction {
  id: string;
  label: string;
  description?: string;
  dangerous?: boolean; // Highlights destructive actions (Delete, etc.)
}

export interface PermissionResource {
  id: string;
  label: string;
  description?: string;
  category?: string; // For grouping resources
  icon?: string;
}

export interface PermissionSection {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  resources: PermissionResource[];
  actions: PermissionAction[];
  defaultPermissions?: Record<string, string[]>; // Default state for new entities
}

export interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  sections: PermissionSection[];
  
  // Data structure configuration
  dataFormat?: 'nested' | 'flat'; // How to store the JSON data
  
  // UI configuration
  ui?: {
    layout?: 'tabs' | 'accordion' | 'sections';
    showSelectAll?: boolean;
    showResourceCategories?: boolean;
    compact?: boolean;
  };
}

// ============================================================================
// CORE PERMISSION TEMPLATES
// ============================================================================

/**
 * Standard System Permissions Template
 * Used for Groups, Roles, and general user management
 */
export const SYSTEM_PERMISSIONS_TEMPLATE: PermissionTemplate = {
  id: 'system-permissions',
  name: 'System Permissions',
  description: 'Standard system-wide permissions for users and groups',
  dataFormat: 'nested',
  
  sections: [
    {
      id: 'general',
      label: 'General Rights',
      description: 'Core system functionality and data management',
      icon: 'Shield',
      resources: [
        { id: 'users', label: 'Users', description: 'User account management', icon: 'Users' },
        { id: 'groups', label: 'Groups', description: 'Group and role management', icon: 'Shield' },
        { id: 'categories', label: 'Categories', description: 'Category management', icon: 'FolderTree' },
        { id: 'business-units', label: 'Business Units', description: 'Organizational units', icon: 'Building' },
        { id: 'customers', label: 'Customers', description: 'Customer data management', icon: 'UserCheck' },
        { id: 'queue-tree', label: 'Queue Tree', description: 'Queue management', icon: 'GitBranch' },
        { id: 'default-node', label: 'Default Node', description: 'Default node configuration', icon: 'Settings' },
        { id: 'processes', label: 'Processes', description: 'Business process management', icon: 'Workflow' },
        { id: 'intersections', label: 'Intersections', description: 'Process intersections', icon: 'Merge' },
        { id: 'internal-queues', label: 'Internal Queues', description: 'Internal queue management', icon: 'Queue' },
        { id: 'workflows', label: 'Workflows', description: 'Workflow management', icon: 'PlayCircle' },
        { id: 'reporting-tree', label: 'Reporting Tree', description: 'Reporting structure', icon: 'BarChart3' }
      ],
      actions: [
        { id: 'view', label: 'View', description: 'Read access to resource' },
        { id: 'create', label: 'Create', description: 'Create new items' },
        { id: 'modify', label: 'Modify', description: 'Edit existing items' },
        { id: 'delete', label: 'Delete', description: 'Remove items', dangerous: true }
      ]
    },
    
    {
      id: 'settings',
      label: 'Setting Rights',
      description: 'System configuration and administrative settings',
      icon: 'Settings',
      resources: [
        { id: 'lock', label: 'Lock', description: 'System locking mechanisms', icon: 'Lock' },
        { id: 'override-lock', label: 'Override Lock', description: 'Bypass system locks', icon: 'Unlock' },
        { id: 'agency-tree-activation', label: 'Perform Agency Tree Activation', description: 'Activate agency trees', icon: 'Power' },
        { id: 'cut-paste', label: 'Cut and Paste', description: 'Move operations', icon: 'Scissors' },
        { id: 'copy-paste', label: 'Copy and Paste', description: 'Copy operations', icon: 'Copy' },
        { id: 'partial-activation', label: 'Perform Partial Activation', description: 'Partial system activation', icon: 'PlayCircle' },
        { id: 'tester', label: 'Tester', description: 'Testing capabilities', icon: 'TestTube' },
        { id: 'control-user', label: 'Control User', description: 'User control functions', icon: 'UserCog' },
        { id: 'status-user', label: 'Status User', description: 'User status management', icon: 'UserCheck' },
        { id: 'view-error-log', label: 'View Error Log', description: 'System error logs', icon: 'AlertTriangle' },
        { id: 'agency-reports-user', label: 'Full Agency Reports User', description: 'Complete reporting access', icon: 'FileText' },
        { id: 'import-data', label: 'Import Data', description: 'Data import capabilities', icon: 'Upload' }
      ],
      actions: [
        { id: 'view', label: 'View', description: 'Read access to setting' },
        { id: 'modify', label: 'Modify', description: 'Change setting values', dangerous: true }
      ]
    }
  ],
  
  ui: {
    layout: 'tabs',
    showSelectAll: true,
    showResourceCategories: false,
    compact: false
  }
};

/**
 * API Access Permissions Template
 * For API keys, service accounts, and external integrations
 */
export const API_PERMISSIONS_TEMPLATE: PermissionTemplate = {
  id: 'api-permissions',
  name: 'API Access Permissions',
  description: 'API endpoint and service permissions',
  dataFormat: 'flat',
  
  sections: [
    {
      id: 'endpoints',
      label: 'API Endpoints',
      description: 'Access to specific API endpoints',
      icon: 'Globe',
      resources: [
        { id: 'users-api', label: 'Users API', description: '/api/users endpoints' },
        { id: 'groups-api', label: 'Groups API', description: '/api/groups endpoints' },
        { id: 'processes-api', label: 'Processes API', description: '/api/processes endpoints' },
        { id: 'workflows-api', label: 'Workflows API', description: '/api/workflows endpoints' },
        { id: 'reports-api', label: 'Reports API', description: '/api/reports endpoints' }
      ],
      actions: [
        { id: 'read', label: 'Read', description: 'GET requests' },
        { id: 'write', label: 'Write', description: 'POST/PUT requests' },
        { id: 'delete', label: 'Delete', description: 'DELETE requests', dangerous: true }
      ]
    }
  ],
  
  ui: {
    layout: 'sections',
    showSelectAll: true,
    compact: true
  }
};

// ============================================================================
// PERMISSION TEMPLATE REGISTRY
// ============================================================================

export const PERMISSION_TEMPLATE_REGISTRY = {
  'system-permissions': SYSTEM_PERMISSIONS_TEMPLATE,
  'api-permissions': API_PERMISSIONS_TEMPLATE
} as const;

export type PermissionTemplateId = keyof typeof PERMISSION_TEMPLATE_REGISTRY;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get permission template by ID
 */
export function getPermissionTemplate(templateId: PermissionTemplateId): PermissionTemplate {
  const template = PERMISSION_TEMPLATE_REGISTRY[templateId];
  if (!template) {
    throw new Error(`Permission template not found: ${templateId}`);
  }
  return template;
}

/**
 * Create default permissions structure for a template
 */
export function createDefaultPermissions(templateId: PermissionTemplateId): Record<string, any> {
  const template = getPermissionTemplate(templateId);
  const defaultPermissions: Record<string, any> = {};
  
  template.sections.forEach(section => {
    if (template.dataFormat === 'nested') {
      defaultPermissions[section.id] = section.defaultPermissions || {};
    } else {
      // Flat format - merge all sections
      Object.assign(defaultPermissions, section.defaultPermissions || {});
    }
  });
  
  return defaultPermissions;
}

/**
 * Validate permissions data against template
 */
export function validatePermissions(
  data: Record<string, any>, 
  templateId: PermissionTemplateId
): boolean {
  const template = getPermissionTemplate(templateId);
  
  try {
    template.sections.forEach(section => {
      const sectionData = template.dataFormat === 'nested' 
        ? data[section.id] 
        : data;
      
      if (sectionData) {
        // Validate resource IDs
        Object.keys(sectionData).forEach(resourceId => {
          const validResource = section.resources.some(r => r.id === resourceId);
          if (!validResource) {
            throw new Error(`Invalid resource: ${resourceId}`);
          }
          
          // Validate action IDs
          const actions = sectionData[resourceId];
          if (Array.isArray(actions)) {
            actions.forEach((actionId: string) => {
              const validAction = section.actions.some(a => a.id === actionId);
              if (!validAction) {
                throw new Error(`Invalid action: ${actionId} for resource: ${resourceId}`);
              }
            });
          }
        });
      }
    });
    
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// JSON SCHEMA DEFINITIONS (for validation)
// ============================================================================

/**
 * JSON schema for permission data validation
 * Can be used by JsonInput component for validation
 */
export function getPermissionJsonSchema(templateId: PermissionTemplateId) {
  const template = getPermissionTemplate(templateId);
  
  const resourceSchemas: Record<string, any> = {};
  
  template.sections.forEach(section => {
    section.resources.forEach(resource => {
      resourceSchemas[resource.id] = {
        type: 'array',
        items: {
          type: 'string',
          enum: section.actions.map(a => a.id)
        }
      };
    });
  });
  
  if (template.dataFormat === 'nested') {
    const sectionSchemas: Record<string, any> = {};
    template.sections.forEach(section => {
      sectionSchemas[section.id] = {
        type: 'object',
        properties: Object.fromEntries(
          section.resources.map(resource => [
            resource.id,
            {
              type: 'array',
              items: {
                type: 'string',
                enum: section.actions.map(a => a.id)
              }
            }
          ])
        ),
        additionalProperties: false
      };
    });
    
    return {
      type: 'object',
      properties: sectionSchemas,
      additionalProperties: false
    };
  } else {
    return {
      type: 'object',
      properties: resourceSchemas,
      additionalProperties: false
    };
  }
}
