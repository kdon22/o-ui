import { z } from 'zod';

// Core Credential schema with all branching fields
export const CredentialSchema = z.object({
  // Core Identity Fields
  id: z.string().uuid(),
  originalCredentialId: z.string().uuid().optional(),
  
  // Branching Fields
  tenantId: z.string().uuid(),
  branchId: z.string().uuid(),
  defaultBranchId: z.string().uuid(),
  
  // Core Business Fields
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(2000).optional(),
  type: z.enum(['API_KEY', 'TOKEN', 'CERTIFICATE', 'USERNAME_PASSWORD', 'OAUTH2', 'SAML', 'CUSTOM']),
  provider: z.enum(['SABRE', 'AMADEUS', 'TRAVELPORT', 'INTERNAL', 'EXTERNAL', 'CUSTOM']),
  
  // Security Configuration
  isActive: z.boolean().default(true),
  expiresAt: z.date().optional(),
  rotationSchedule: z.enum(['NEVER', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).default('NEVER'),
  lastRotatedAt: z.date().optional(),
  
  // Credential Data (encrypted)
  encryptedData: z.string(),
  encryptionKeyId: z.string().uuid(),
  
  // Access Control
  allowedIps: z.array(z.string()).default([]),
  allowedOfficeIds: z.array(z.string().uuid()).default([]),
  maxConcurrentConnections: z.number().int().positive().default(10),
  
  // Environment Configuration
  environment: z.enum(['PRODUCTION', 'STAGING', 'DEVELOPMENT', 'SANDBOX']).default('PRODUCTION'),
  endpoint: z.string().url().optional(),
  
  // Monitoring
  lastUsedAt: z.date().optional(),
  usageCount: z.number().int().nonnegative().default(0),
  failureCount: z.number().int().nonnegative().default(0),
  
  // Versioning & Audit
  version: z.number().int().positive().default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
  
  // Computed Fields
  isExpired: z.boolean().default(false),
  isHealthy: z.boolean().default(true),
  healthScore: z.number().min(0).max(100).default(100),
  
  // Cache Fields
  _cached: z.boolean().default(false),
  _optimistic: z.boolean().default(false),
});

// Create/Update DTOs
export const CreateCredentialSchema = CredentialSchema.omit({
  id: true,
  originalCredentialId: true,
  version: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  usageCount: true,
  failureCount: true,
  lastUsedAt: true,
  lastRotatedAt: true,
  isExpired: true,
  isHealthy: true,
  healthScore: true,
  _cached: true,
  _optimistic: true,
});

export const UpdateCredentialSchema = CreateCredentialSchema.partial();

// Query/Filter schemas
export const CredentialFilterSchema = z.object({
  name: z.string().optional(),
  type: z.enum(['API_KEY', 'TOKEN', 'CERTIFICATE', 'USERNAME_PASSWORD', 'OAUTH2', 'SAML', 'CUSTOM']).optional(),
  provider: z.enum(['SABRE', 'AMADEUS', 'TRAVELPORT', 'INTERNAL', 'EXTERNAL', 'CUSTOM']).optional(),
  isActive: z.boolean().optional(),
  environment: z.enum(['PRODUCTION', 'STAGING', 'DEVELOPMENT', 'SANDBOX']).optional(),
  expiresWithin: z.number().optional(), // days
  officeId: z.string().uuid().optional(),
  isExpired: z.boolean().optional(),
  isHealthy: z.boolean().optional(),
  search: z.string().optional(),
});

export const CredentialQueryOptionsSchema = z.object({
  sortBy: z.enum(['name', 'type', 'provider', 'createdAt', 'updatedAt', 'expiresAt', 'usageCount', 'healthScore']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  limit: z.number().int().positive().max(1000).default(50),
  offset: z.number().int().nonnegative().default(0),
  includeInactive: z.boolean().default(false),
  includeExpired: z.boolean().default(false),
});

// Field Configuration for UI
export const CredentialFieldConfig = {
  // High Priority Fields (always visible)
  highPriority: [
    'name',
    'type',
    'provider',
    'isActive',
    'environment',
    'expiresAt',
    'isExpired',
    'isHealthy',
    'healthScore',
  ],
  
  // Medium Priority Fields (responsive)
  mediumPriority: [
    'description',
    'rotationSchedule',
    'lastRotatedAt',
    'lastUsedAt',
    'usageCount',
    'failureCount',
    'maxConcurrentConnections',
    'endpoint',
  ],
  
  // Low Priority Fields (desktop only)
  lowPriority: [
    'encryptionKeyId',
    'allowedIps',
    'allowedOfficeIds',
    'version',
    'createdAt',
    'updatedAt',
    'createdBy',
    'updatedBy',
  ],
  
  // Read-only Fields
  readOnly: [
    'id',
    'originalCredentialId',
    'encryptedData',
    'encryptionKeyId',
    'usageCount',
    'failureCount',
    'lastUsedAt',
    'lastRotatedAt',
    'isExpired',
    'isHealthy',
    'healthScore',
    'version',
    'createdAt',
    'updatedAt',
    'createdBy',
    'updatedBy',
    '_cached',
    '_optimistic',
  ],
  
  // Required Fields
  required: [
    'name',
    'type',
    'provider',
    'encryptedData',
    'encryptionKeyId',
    'tenantId',
    'branchId',
    'defaultBranchId',
  ],
  
  // Searchable Fields
  searchable: [
    'name',
    'description',
    'type',
    'provider',
    'environment',
    'endpoint',
  ],
  
  // Filterable Fields
  filterable: [
    'type',
    'provider',
    'isActive',
    'environment',
    'isExpired',
    'isHealthy',
    'createdBy',
    'updatedBy',
  ],
};

// UI Configuration
export const CredentialUIConfig = {
  // List View Configuration
  listView: {
    defaultColumns: ['name', 'type', 'provider', 'environment', 'isActive', 'healthScore', 'expiresAt'],
    mobileColumns: ['name', 'type', 'isActive', 'healthScore'],
    sortableColumns: ['name', 'type', 'provider', 'createdAt', 'updatedAt', 'expiresAt', 'usageCount', 'healthScore'],
    searchPlaceholder: 'Search credentials...',
    emptyStateMessage: 'No credentials found',
    itemsPerPage: 50,
  },
  
  // Detail View Configuration
  detailView: {
    tabs: [
      { id: 'overview', label: 'Overview', icon: 'Key' },
      { id: 'security', label: 'Security', icon: 'Shield' },
      { id: 'access', label: 'Access Control', icon: 'Lock' },
      { id: 'monitoring', label: 'Monitoring', icon: 'Activity' },
      { id: 'history', label: 'History', icon: 'Clock' },
    ],
    sections: {
      overview: ['name', 'description', 'type', 'provider', 'environment', 'endpoint', 'isActive'],
      security: ['encryptionKeyId', 'expiresAt', 'rotationSchedule', 'lastRotatedAt', 'isExpired'],
      access: ['allowedIps', 'allowedOfficeIds', 'maxConcurrentConnections'],
      monitoring: ['lastUsedAt', 'usageCount', 'failureCount', 'isHealthy', 'healthScore'],
      history: ['version', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'],
    },
  },
  
  // Form Configuration
  form: {
    steps: [
      {
        id: 'basic',
        title: 'Basic Information',
        fields: ['name', 'description', 'type', 'provider', 'environment'],
      },
      {
        id: 'security',
        title: 'Security Configuration',
        fields: ['encryptedData', 'expiresAt', 'rotationSchedule'],
      },
      {
        id: 'access',
        title: 'Access Control',
        fields: ['allowedIps', 'allowedOfficeIds', 'maxConcurrentConnections'],
      },
      {
        id: 'settings',
        title: 'Settings',
        fields: ['endpoint', 'isActive'],
      },
    ],
    validation: {
      showErrorSummary: true,
      validateOnChange: true,
      validateOnBlur: true,
    },
  },
  
  // Action Configuration
  actions: {
    primary: ['test', 'rotate', 'clone'],
    secondary: ['edit', 'activate', 'deactivate', 'delete'],
    bulk: ['activate', 'deactivate', 'delete', 'rotate'],
  },
  
  // Status Indicators
  statusIndicators: {
    active: { color: 'success', icon: 'CheckCircle' },
    inactive: { color: 'warning', icon: 'XCircle' },
    expired: { color: 'error', icon: 'AlertTriangle' },
    healthy: { color: 'success', icon: 'Heart' },
    unhealthy: { color: 'error', icon: 'AlertCircle' },
  },
};

// Custom Actions
export const CredentialActions = {
  // Core CRUD Actions
  create: {
    label: 'Create Credential',
    icon: 'Plus',
    permissions: ['credential:create'],
    type: 'primary' as const,
  },
  
  read: {
    label: 'View Credential',
    icon: 'Eye',
    permissions: ['credential:read'],
    type: 'secondary' as const,
  },
  
  update: {
    label: 'Edit Credential',
    icon: 'Edit',
    permissions: ['credential:update'],
    type: 'secondary' as const,
  },
  
  delete: {
    label: 'Delete Credential',
    icon: 'Trash',
    permissions: ['credential:delete'],
    type: 'danger' as const,
    requiresConfirmation: true,
  },
  
  // Credential Management Actions
  test: {
    label: 'Test Connection',
    icon: 'Wifi',
    permissions: ['credential:test'],
    type: 'primary' as const,
    description: 'Test credential connectivity',
  },
  
  rotate: {
    label: 'Rotate Credential',
    icon: 'RefreshCw',
    permissions: ['credential:rotate'],
    type: 'secondary' as const,
    requiresConfirmation: true,
    description: 'Generate new credential data',
  },
  
  clone: {
    label: 'Clone Credential',
    icon: 'Copy',
    permissions: ['credential:create'],
    type: 'secondary' as const,
    description: 'Create a copy of this credential',
  },
  
  activate: {
    label: 'Activate',
    icon: 'Power',
    permissions: ['credential:update'],
    type: 'success' as const,
    description: 'Activate credential',
  },
  
  deactivate: {
    label: 'Deactivate',
    icon: 'PowerOff',
    permissions: ['credential:update'],
    type: 'warning' as const,
    description: 'Deactivate credential',
  },
  
  // Security Actions
  encrypt: {
    label: 'Re-encrypt',
    icon: 'Lock',
    permissions: ['credential:encrypt'],
    type: 'secondary' as const,
    requiresConfirmation: true,
    description: 'Re-encrypt credential data',
  },
  
  // Monitoring Actions
  viewUsage: {
    label: 'View Usage',
    icon: 'BarChart',
    permissions: ['credential:read'],
    type: 'secondary' as const,
    description: 'View credential usage statistics',
  },
  
  viewHealth: {
    label: 'View Health',
    icon: 'Activity',
    permissions: ['credential:read'],
    type: 'secondary' as const,
    description: 'View credential health status',
  },
  
  // Branching Actions
  viewHistory: {
    label: 'View History',
    icon: 'Clock',
    permissions: ['credential:read'],
    type: 'secondary' as const,
    description: 'View credential change history',
  },
  
  branchFrom: {
    label: 'Branch From',
    icon: 'GitBranch',
    permissions: ['credential:create'],
    type: 'secondary' as const,
    description: 'Create new branch from this credential',
  },
  
  mergeTo: {
    label: 'Merge To',
    icon: 'GitMerge',
    permissions: ['credential:update'],
    type: 'secondary' as const,
    description: 'Merge credential to another branch',
  },
  
  switchBranch: {
    label: 'Switch Branch',
    icon: 'GitBranch',
    permissions: ['credential:read'],
    type: 'secondary' as const,
    description: 'Switch to different branch',
  },
  
  compareBranches: {
    label: 'Compare Branches',
    icon: 'GitCompare',
    permissions: ['credential:read'],
    type: 'secondary' as const,
    description: 'Compare credential across branches',
  },
};

// Relationships Configuration
export const CredentialRelationships = {
  // One-to-One Relationships
  office: {
    type: 'one-to-one' as const,
    entity: 'offices',
    foreignKey: 'credentialId',
    required: false,
    description: 'Associated office',
  },
  
  // One-to-Many Relationships (owned by Credential)
  usageLogs: {
    type: 'one-to-many' as const,
    entity: 'credentialUsageLogs',
    foreignKey: 'credentialId',
    required: false,
    description: 'Usage history logs',
  },
  
  rotationHistory: {
    type: 'one-to-many' as const,
    entity: 'credentialRotations',
    foreignKey: 'credentialId',
    required: false,
    description: 'Rotation history',
  },
  
  // Many-to-Many Relationships
  allowedUsers: {
    type: 'many-to-many' as const,
    entity: 'users',
    junction: 'credentialUserAccess',
    required: false,
    description: 'Users with access to this credential',
  },
  
  allowedGroups: {
    type: 'many-to-many' as const,
    entity: 'groups',
    junction: 'credentialGroupAccess',
    required: false,
    description: 'Groups with access to this credential',
  },
  
  integrations: {
    type: 'many-to-many' as const,
    entity: 'integrations',
    junction: 'credentialIntegrations',
    required: false,
    description: 'Integrations using this credential',
  },
};

// Enhanced Permissions
export const CredentialPermissions = {
  // Basic CRUD permissions
  'credential:create': {
    label: 'Create Credentials',
    description: 'Can create new credentials',
    category: 'basic',
  },
  
  'credential:read': {
    label: 'View Credentials',
    description: 'Can view credentials',
    category: 'basic',
  },
  
  'credential:update': {
    label: 'Edit Credentials',
    description: 'Can modify credentials',
    category: 'basic',
  },
  
  'credential:delete': {
    label: 'Delete Credentials',
    description: 'Can delete credentials',
    category: 'basic',
  },
  
  // Security permissions
  'credential:test': {
    label: 'Test Credentials',
    description: 'Can test credential connectivity',
    category: 'security',
  },
  
  'credential:rotate': {
    label: 'Rotate Credentials',
    description: 'Can rotate credential data',
    category: 'security',
  },
  
  'credential:encrypt': {
    label: 'Re-encrypt Credentials',
    description: 'Can re-encrypt credential data',
    category: 'security',
  },
  
  'credential:view-sensitive': {
    label: 'View Sensitive Data',
    description: 'Can view decrypted credential data',
    category: 'security',
  },
  
  // Access control permissions
  'credential:manage-access': {
    label: 'Manage Access',
    description: 'Can manage credential access permissions',
    category: 'access',
  },
  
  // Monitoring permissions
  'credential:view-usage': {
    label: 'View Usage',
    description: 'Can view credential usage statistics',
    category: 'monitoring',
  },
  
  'credential:view-health': {
    label: 'View Health',
    description: 'Can view credential health status',
    category: 'monitoring',
  },
  
  // Branching permissions
  'credential:branch': {
    label: 'Branch Credentials',
    description: 'Can create branches from credentials',
    category: 'branching',
  },
  
  'credential:merge': {
    label: 'Merge Credentials',
    description: 'Can merge credential branches',
    category: 'branching',
  },
  
  'credential:history': {
    label: 'View History',
    description: 'Can view credential change history',
    category: 'branching',
  },
};

// Export all types
export type Credential = z.infer<typeof CredentialSchema>;
export type CreateCredential = z.infer<typeof CreateCredentialSchema>;
export type UpdateCredential = z.infer<typeof UpdateCredentialSchema>;
export type CredentialFilter = z.infer<typeof CredentialFilterSchema>;
export type CredentialQueryOptions = z.infer<typeof CredentialQueryOptionsSchema>; 