/**
 * Tag System Types - TypeScript definitions for tags and tag groups
 * 
 * Defines interfaces for:
 * - TagGroup entity and related DTOs
 * - Tag entity and related DTOs  
 * - Relationship interfaces
 * - API request/response types
 */

// ============================================================================
// TAG GROUP TYPES
// ============================================================================

export interface TagGroupEntity {
  // Core identity
  id: string;
  
  // Basic info
  name: string;
  description?: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  
  // Audit fields
  tenantId: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  version: number;
  
  // Computed fields
  tagCount?: number;
  
  // Cache fields
  _cached?: boolean;
  _optimistic?: boolean;
  
  // Relationships
  tags?: TagEntity[];
}

export interface CreateTagGroupInput {
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateTagGroupInput {
  name?: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// ============================================================================
// TAG TYPES
// ============================================================================

export interface TagEntity {
  // Core identity
  id: string;
  
  // Basic info
  name: string;
  description?: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  
  // Optional group association
  groupId?: string | null;
  
  // Usage statistics
  usageCount: number;
  
  // Audit fields
  tenantId: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  version: number;
  
  // Cache fields
  _cached?: boolean;
  _optimistic?: boolean;
  
  // Relationships
  group?: TagGroupEntity | null;
  rules?: RuleTagRelation[];
}

export interface CreateTagInput {
  name: string;
  description?: string;
  color?: string;
  groupId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateTagInput {
  name?: string;
  description?: string;
  color?: string;
  groupId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

// ============================================================================
// RELATIONSHIP TYPES
// ============================================================================

export interface RuleTagRelation {
  id: string;
  ruleId: string;
  tagId: string;
  
  // Junction metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  
  // Related entities
  rule?: any; // Import RuleEntity when available
  tag?: TagEntity;
}

// ============================================================================
// MODAL AND UI TYPES
// ============================================================================

export interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruleId?: string;
  selectedTagIds?: string[];
  onTagsChange?: (tagIds: string[]) => void;
  mode?: 'select' | 'manage';
}

export interface TagSelectorProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  placeholder?: string;
  readOnly?: boolean;
  showCreateButton?: boolean;
  maxTags?: number;
}

export interface TagDisplayProps {
  tags: TagEntity[];
  showGroup?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'solid';
  onTagClick?: (tag: TagEntity) => void;
  onTagRemove?: (tagId: string) => void;
  editable?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface TagGroupsResponse {
  data: TagGroupEntity[];
  total: number;
  hasMore: boolean;
}

export interface TagsResponse {
  data: TagEntity[];
  total: number;
  hasMore: boolean;
}

export interface TagsByGroupResponse {
  [groupId: string]: {
    group: TagGroupEntity;
    tags: TagEntity[];
  };
  ungrouped: {
    group: null;
    tags: TagEntity[];
  };
}

// ============================================================================
// SEARCH AND FILTER TYPES
// ============================================================================

export interface TagFilters {
  search?: string;
  groupId?: string | null;
  isActive?: boolean;
  sortBy?: 'name' | 'usageCount' | 'createdAt' | 'sortOrder';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface TagGroupFilters {
  search?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'sortOrder' | 'createdAt' | 'tagCount';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export interface BulkTagOperation {
  operation: 'update' | 'delete' | 'move';
  tagIds: string[];
  data?: Partial<UpdateTagInput>;
  targetGroupId?: string | null;
}

export interface BulkTagGroupOperation {
  operation: 'update' | 'delete';
  groupIds: string[];
  data?: Partial<UpdateTagGroupInput>;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface TagValidationResult {
  isValid: boolean;
  errors: {
    name?: string;
    color?: string;
    groupId?: string;
    general?: string;
  };
}

export interface TagGroupValidationResult {
  isValid: boolean;
  errors: {
    name?: string;
    color?: string;
    general?: string;
  };
} 