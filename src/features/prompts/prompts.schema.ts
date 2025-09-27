/**
 * Prompt Schema - Interactive Prompt Builder for Rules
 * 
 * Single Source of Truth for:
 * - Interactive prompt forms and layouts
 * - Dynamic form builder capabilities
 * - Execution modes and settings
 * - Mobile-first responsive design
 * - Field validation and types
 * - Server-only execution architecture
 * 
 * This schema will auto-generate the entire prompt management system.
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';

export const PROMPT_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY - BULLETPROOF 3-FIELD DESIGN
  // ============================================================================
  databaseKey: 'prompt',      // IndexedDB store + API endpoints
  modelName: 'Prompt',        // Prisma model access
  actionPrefix: 'prompt',     // Action naming
  
  // ============================================================================
  // BRANCHING CONFIGURATION
  // ============================================================================
  // Prompts now support branching - they follow rules when branched

  // ============================================================================
  // UI DISPLAY CONFIGURATION
  // ============================================================================
  display: {
    title: 'Prompts',
    description: 'Interactive prompts for user interaction and data collection',
    icon: 'message-square',
    color: 'blue'
  },

  // ============================================================================
  // FORM CONFIGURATION
  // ============================================================================
  form: {
    width: 'lg',
    layout: 'compact',
    showDescriptions: true
  },

  // ============================================================================
  // FIELD DEFINITIONS
  // ============================================================================
  fields: [
    // Basic prompt information
    {
      key: 'promptName',
      label: 'Prompt Name',
      type: 'text',
      required: true,
      placeholder: 'Enter a descriptive name for this prompt',
      validation: [
        { type: 'required', message: 'Prompt name is required' },
        { type: 'minLength', value: 2, message: 'Prompt name must be at least 2 characters' },
        { type: 'maxLength', value: 100, message: 'Prompt name cannot exceed 100 characters' }
      ],
      form: { row: 1, width: 'full' },
      table: { width: 'lg', sortable: true }
    },
    
    {
      key: 'content',
      label: 'Description',
      type: 'textarea',
      required: false,
      placeholder: 'Optional description of what this prompt does',
      validation: [
        { type: 'maxLength', value: 500, message: 'Description cannot exceed 500 characters' }
      ],
      form: { row: 2, width: 'full' },
      table: { width: 'xl' }
    },
    
    // Prompt configuration
    {
      key: 'executionMode',
      label: 'Execution Mode',
      type: 'select',
      required: false,
      defaultValue: 'INTERACTIVE',
      options: {
        static: [
          { value: 'INTERACTIVE', label: 'Interactive' },
          { value: 'AUTOMATED', label: 'Automated' },
          { value: 'READ_ONLY', label: 'Read Only' }
        ]
      },
      form: { row: 3, width: 'half', showInForm: false },
      table: { width: 'sm', sortable: true,  }
    },
    
    {
      key: 'isPublic',
      label: 'Public Prompt',
      type: 'switch',
      required: true,
      defaultValue: false,
      description: 'Whether this prompt is available to all users',
      form: { row: 3, width: 'half', showInForm: false },
      table: { width: 'xs', sortable: true }
    },
    
    // Layout configuration (complex JSON field)
    {
      key: 'layout',
      label: 'Form Layout',
      type: 'json',
      required: true,
      description: 'JSON configuration for the form layout',
      validation: [
        { type: 'required', message: 'Layout configuration is required' }
      ],
      form: { row: 4, width: 'full', showInForm: false },
      table: { width: 'auto',  }
    },
    
    // Relationship to rule  
    {
      key: 'ruleId',
      label: 'Rule',
      type: 'text',
      required: true,
      autoValue: {
        source: 'navigation.parentId',
        required: true
      },
      form: { row: 5, width: 'full', showInForm: false },
      table: { width: 'sm',  }
    }
  ],

  // ============================================================================
  // SEARCH CONFIGURATION
  // ============================================================================
  search: {
    fields: ['promptName', 'content'],
    placeholder: 'Search prompts...'
  },

  // ============================================================================
  // ACTIONS CONFIGURATION
  // ============================================================================
  actions: {
    create: true,
    update: true,
    delete: true,
    duplicate: true,
    bulk: true,
    // Server-first execution for prompts (use server-only execution, SSOT pattern)
    optimistic: false,
    custom: [
      {
        id: 'design',
        label: 'Design Layout',
        icon: 'layout',
        description: 'Open the visual layout designer',
        handler: 'designPromptLayout'
      },
      {
        id: 'preview',
        label: 'Preview',
        icon: 'eye',
        description: 'Preview the prompt form',
        handler: 'previewPrompt'
      },
      {
        id: 'execute',
        label: 'Execute',
        icon: 'play',
        description: 'Run the prompt interactively',
        handler: 'executePrompt'
      },
      {
        id: 'test',
        label: 'Test',
        icon: 'flask',
        description: 'Test the prompt execution',
        handler: 'testPrompt'
      },
      {
        id: 'exportLayout',
        label: 'Export Layout',
        icon: 'download',
        description: 'Export the form layout as JSON',
        handler: 'exportPromptLayout'
      },
      {
        id: 'importLayout',
        label: 'Import Layout',
        icon: 'upload',
        description: 'Import a form layout from JSON',
        handler: 'importPromptLayout'
      },
      {
        id: 'viewResults',
        label: 'View Results',
        icon: 'bar-chart',
        description: 'View prompt execution results',
        handler: 'viewPromptResults'
      }
    ]
  },

  // ============================================================================
  // MOBILE CONFIGURATION
  // ============================================================================
  mobile: {
    cardFormat: 'compact',
    primaryField: 'promptName',
    secondaryFields: ['executionMode', 'isPublic'],
    showSearch: true,
    showFilters: false,
    fabPosition: 'bottom-right'
  },

  // ============================================================================
  // RELATIONSHIP DEFINITIONS
  // ============================================================================
  relationships: {
    rule: {
      type: 'one-to-one',
      relatedEntity: 'rules',
      description: 'Rule that owns this prompt',
      foreignKey: 'ruleId'
    },
    tenant: {
      type: 'one-to-one',
      relatedEntity: 'tenants',
      description: 'Tenant that owns this prompt',
      foreignKey: 'tenantId'
    },
    branch: {
      type: 'one-to-one',
      relatedEntity: 'branches',
      description: 'Branch that owns this prompt version',
      foreignKey: 'branchId'
    },
    createdBy: {
      type: 'one-to-one',
      relatedEntity: 'users',
      description: 'User who created this prompt',
      foreignKey: 'createdById'
    },
    updatedBy: {
      type: 'one-to-one',
      relatedEntity: 'users',
      description: 'User who last updated this prompt',
      foreignKey: 'updatedById'
    },
    originalPrompt: {
      type: 'one-to-one',
      relatedEntity: 'prompts',
      description: 'Original prompt this is branched from',
      foreignKey: 'originalPromptId'
    }
  },

  // ============================================================================
  // DESKTOP CONFIGURATION
  // ============================================================================
  desktop: {
    sortField: 'promptName',
    sortOrder: 'asc',
    editableField: 'promptName',
    rowActions: true,
    bulkActions: false
  },

  // ✅ ENTITY: IndexedDB key configuration
  indexedDBKey: (record: any) => record.id
}; 