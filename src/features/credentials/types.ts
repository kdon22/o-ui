import { 
  Credential, 
  CreateCredential, 
  UpdateCredential, 
  CredentialFilter, 
  CredentialQueryOptions,
  CredentialSchema,
  CreateCredentialSchema,
  UpdateCredentialSchema,
  CredentialFilterSchema,
  CredentialQueryOptionsSchema
} from './credentials.schema';

// Re-export base types
export type { 
  Credential, 
  CreateCredential, 
  UpdateCredential, 
  CredentialFilter, 
  CredentialQueryOptions 
};

// Re-export schemas
export { 
  CredentialSchema,
  CreateCredentialSchema,
  UpdateCredentialSchema,
  CredentialFilterSchema,
  CredentialQueryOptionsSchema
};

// Entity with relationships
export interface CredentialEntity extends Credential {
  // One-to-One Relationships
  office?: OfficeEntity | null;
  
  // One-to-Many Relationships
  usageLogs?: CredentialUsageLog[];
  rotationHistory?: CredentialRotation[];
  
  // Many-to-Many Relationships
  allowedUsers?: UserEntity[];
  allowedGroups?: GroupEntity[];
  integrations?: IntegrationEntity[];
  
  // Computed relationship fields
  officeId?: string | null;
  allowedUserIds?: string[];
  allowedGroupIds?: string[];
  integrationIds?: string[];
}

// Related entity types (imported from other features)
export interface OfficeEntity {
  id: string;
  name: string;
  officeId: string;
  isActive: boolean;
  // ... other office fields
}

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  // ... other user fields
}

export interface GroupEntity {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  // ... other group fields
}

export interface IntegrationEntity {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  // ... other integration fields
}

// Usage and rotation tracking
export interface CredentialUsageLog {
  id: string;
  credentialId: string;
  userId: string;
  action: 'CONNECT' | 'DISCONNECT' | 'AUTHENTICATE' | 'AUTHORIZE';
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface CredentialRotation {
  id: string;
  credentialId: string;
  rotatedBy: string;
  rotationReason: 'SCHEDULED' | 'MANUAL' | 'SECURITY' | 'EXPIRATION';
  oldKeyId?: string;
  newKeyId: string;
  rotatedAt: Date;
  isSuccessful: boolean;
  errorMessage?: string;
}

// Junction table types for many-to-many relationships
export interface CredentialUserAccess {
  credentialId: string;
  userId: string;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  permissions: ('READ' | 'USE' | 'MANAGE')[];
}

export interface CredentialGroupAccess {
  credentialId: string;
  groupId: string;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  permissions: ('READ' | 'USE' | 'MANAGE')[];
}

export interface CredentialIntegration {
  credentialId: string;
  integrationId: string;
  configuredBy: string;
  configuredAt: Date;
  isActive: boolean;
  configuration?: Record<string, any>;
}

// Input/Output types for API operations
export interface CreateCredentialInput extends CreateCredential {
  relationships?: {
    office?: {
      connect?: { id: string };
    };
    allowedUsers?: {
      connect?: Array<{
        id: string;
        permissions: ('READ' | 'USE' | 'MANAGE')[];
        expiresAt?: Date;
      }>;
    };
    allowedGroups?: {
      connect?: Array<{
        id: string;
        permissions: ('READ' | 'USE' | 'MANAGE')[];
        expiresAt?: Date;
      }>;
    };
    integrations?: {
      connect?: Array<{
        id: string;
        configuration?: Record<string, any>;
      }>;
    };
  };
}

export interface UpdateCredentialInput extends UpdateCredential {
  relationships?: {
    office?: {
      connect?: { id: string };
      disconnect?: boolean;
    };
    allowedUsers?: {
      connect?: Array<{
        id: string;
        permissions: ('READ' | 'USE' | 'MANAGE')[];
        expiresAt?: Date;
      }>;
      disconnect?: Array<{ id: string }>;
      update?: Array<{
        id: string;
        permissions?: ('READ' | 'USE' | 'MANAGE')[];
        expiresAt?: Date;
      }>;
    };
    allowedGroups?: {
      connect?: Array<{
        id: string;
        permissions: ('READ' | 'USE' | 'MANAGE')[];
        expiresAt?: Date;
      }>;
      disconnect?: Array<{ id: string }>;
      update?: Array<{
        id: string;
        permissions?: ('READ' | 'USE' | 'MANAGE')[];
        expiresAt?: Date;
      }>;
    };
    integrations?: {
      connect?: Array<{
        id: string;
        configuration?: Record<string, any>;
      }>;
      disconnect?: Array<{ id: string }>;
      update?: Array<{
        id: string;
        configuration?: Record<string, any>;
      }>;
    };
  };
}

export interface DeleteCredentialInput {
  id: string;
}

// API Response types
export interface CredentialListResponse {
  success: true;
  data: CredentialEntity[];
  meta: {
    total: number;
    count: number;
    page: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CredentialItemResponse {
  success: true;
  data: CredentialEntity;
}

export interface CredentialCreateResponse {
  success: true;
  data: CredentialEntity;
}

export interface CredentialUpdateResponse {
  success: true;
  data: CredentialEntity;
}

export interface CredentialDeleteResponse {
  success: true;
  data: { id: string };
}

// Custom action response types
export interface CredentialTestResponse {
  success: true;
  data: {
    isConnected: boolean;
    responseTime: number;
    errorMessage?: string;
    testTimestamp: Date;
  };
}

export interface CredentialRotateResponse {
  success: true;
  data: {
    credential: CredentialEntity;
    rotationLog: CredentialRotation;
  };
}

export interface CredentialCloneResponse {
  success: true;
  data: CredentialEntity;
}

export interface CredentialHealthResponse {
  success: true;
  data: {
    credentialId: string;
    isHealthy: boolean;
    healthScore: number;
    lastChecked: Date;
    issues: Array<{
      type: 'EXPIRATION' | 'CONNECTIVITY' | 'AUTHENTICATION' | 'AUTHORIZATION';
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      message: string;
      since?: Date;
    }>;
  };
}

export interface CredentialUsageResponse {
  success: true;
  data: {
    credentialId: string;
    totalUsage: number;
    successfulUsage: number;
    failedUsage: number;
    lastUsed: Date;
    usageByDay: Array<{
      date: string;
      count: number;
      successCount: number;
      failCount: number;
    }>;
    topUsers: Array<{
      userId: string;
      userName: string;
      usageCount: number;
    }>;
  };
}

// Query and filter types
export interface CredentialQuery extends CredentialQueryOptions {
  filter?: CredentialFilter;
  includeRelationships?: boolean;
  branchId?: string;
}

export interface CredentialSort {
  field: keyof Credential;
  direction: 'asc' | 'desc';
}

// Error types
export interface CredentialError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

export interface CredentialValidationError extends CredentialError {
  field: string;
  value: any;
}

// Branch-specific types
export interface CredentialBranchContext {
  currentBranchId: string;
  defaultBranchId: string;
  tenantId: string;
  userId: string;
}

export interface CredentialBranchOperation {
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  credentialId: string;
  branchId: string;
  operation: string;
  timestamp: Date;
  userId: string;
}

// Hooks and components types
export interface UseCredentialListOptions {
  filter?: CredentialFilter;
  queryOptions?: CredentialQueryOptions;
  includeRelationships?: boolean;
  enabled?: boolean;
  branchId?: string;
}

export interface UseCredentialItemOptions {
  credentialId: string;
  includeRelationships?: boolean;
  enabled?: boolean;
  branchId?: string;
}

export interface UseCredentialMutationOptions {
  onSuccess?: (data: CredentialEntity) => void;
  onError?: (error: CredentialError) => void;
  optimistic?: boolean;
}

// Component prop types
export interface CredentialListProps {
  filter?: CredentialFilter;
  queryOptions?: CredentialQueryOptions;
  onSelect?: (credential: CredentialEntity) => void;
  onEdit?: (credential: CredentialEntity) => void;
  onDelete?: (credential: CredentialEntity) => void;
  multiSelect?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export interface CredentialItemProps {
  credential: CredentialEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onTest?: () => void;
  onRotate?: () => void;
  onClone?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export interface CredentialFormProps {
  credential?: CredentialEntity;
  onSubmit: (data: CreateCredentialInput | UpdateCredentialInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit' | 'clone';
}

export interface CredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  credential?: CredentialEntity;
  mode: 'create' | 'edit' | 'view' | 'clone';
  onSubmit?: (data: CreateCredentialInput | UpdateCredentialInput) => void;
}

// Security and encryption types
export interface CredentialEncryption {
  algorithm: 'AES-256-GCM' | 'RSA-4096' | 'ECDSA-P256';
  keyId: string;
  iv?: string;
  tag?: string;
}

export interface CredentialDecryption {
  encryptedData: string;
  encryptionKeyId: string;
  algorithm: string;
}

// Audit and compliance types
export interface CredentialAuditLog {
  id: string;
  credentialId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ACCESS' | 'ROTATE' | 'TEST';
  userId: string;
  timestamp: Date;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface CredentialCompliance {
  credentialId: string;
  lastAudit: Date;
  complianceScore: number;
  issues: Array<{
    type: 'WEAK_ENCRYPTION' | 'EXPIRED' | 'OVERUSED' | 'INSECURE_STORAGE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    recommendation: string;
  }>;
}

// Export constants
export const CREDENTIAL_TYPES = [
  'API_KEY',
  'TOKEN', 
  'CERTIFICATE',
  'USERNAME_PASSWORD',
  'OAUTH2',
  'SAML',
  'CUSTOM'
] as const;

export const CREDENTIAL_PROVIDERS = [
  'SABRE',
  'AMADEUS', 
  'TRAVELPORT',
  'INTERNAL',
  'EXTERNAL',
  'CUSTOM'
] as const;

export const CREDENTIAL_ENVIRONMENTS = [
  'PRODUCTION',
  'STAGING',
  'DEVELOPMENT',
  'SANDBOX'
] as const;

export const CREDENTIAL_PERMISSIONS = [
  'READ',
  'USE',
  'MANAGE'
] as const;

export const ROTATION_SCHEDULES = [
  'NEVER',
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY'
] as const;

export const ROTATION_REASONS = [
  'SCHEDULED',
  'MANUAL',
  'SECURITY',
  'EXPIRATION'
] as const; 