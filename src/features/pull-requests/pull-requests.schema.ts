/**
 * Pull Request Schema - Comprehensive PR System
 * 
 * Features:
 * - Optional PR workflow with smart bypass
 * - Advanced review states and approvals
 * - Impact analysis and risk assessment
 * - Smart reviewer assignment
 * - Enterprise governance support
 */

import { z } from 'zod';

// ============================================================================
// CORE PR TYPES
// ============================================================================

export const PullRequestStatusSchema = z.enum([
  'DRAFT',           // Work in progress, not ready for review
  'OPEN',            // Ready for review
  'APPROVED',        // Approved and ready to merge
  'CHANGES_REQUESTED', // Reviewer requested changes
  'MERGED',          // Successfully merged
  'CLOSED',          // Closed without merging
  'CONFLICTED'       // Has merge conflicts
]);

export const ReviewStatusSchema = z.enum([
  'PENDING',         // Awaiting review
  'APPROVED',        // Reviewer approved
  'CHANGES_REQUESTED', // Reviewer wants changes
  'DISMISSED'        // Review was dismissed
]);

export const PRModeSchema = z.enum([
  'DISABLED',        // No PR workflow
  'OPTIONAL',        // Can choose PR or direct merge
  'REQUIRED',        // Must use PR workflow
  'SMART_AUTO'       // System decides based on context
]);

export const MergeStrategySchema = z.enum([
  'MERGE_COMMIT',    // Create merge commit
  'SQUASH',          // Squash all commits
  'REBASE',          // Rebase and merge
  'FAST_FORWARD'     // Fast-forward merge
]);

// ============================================================================
// PR REVIEW SYSTEM
// ============================================================================

export const PullRequestReviewSchema = z.object({
  id: z.string(),
  pullRequestId: z.string(),
  reviewerId: z.string(),
  reviewerName: z.string(),
  reviewerEmail: z.string().optional(),
  status: ReviewStatusSchema,
  comment: z.string().optional(),
  submittedAt: z.string(),
  
  // Review metadata
  reviewType: z.enum(['REQUIRED', 'OPTIONAL', 'AUTO_ASSIGNED']),
  expertise: z.array(z.string()).optional(), // Areas of expertise
  
  // Tenant and branch context
  tenantId: z.string(),
  branchId: z.string(),
  
  // System fields
  createdAt: z.string(),
  updatedAt: z.string(),
  createdById: z.string().nullable(),
  updatedById: z.string().nullable(),
});

export const PullRequestCommentSchema = z.object({
  id: z.string(),
  pullRequestId: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  content: z.string(),
  
  // Comment positioning
  filePath: z.string().optional(),
  lineNumber: z.number().optional(),
  isResolved: z.boolean().default(false),
  
  // Reply threading
  parentCommentId: z.string().optional(),
  
  // Tenant and branch context
  tenantId: z.string(),
  branchId: z.string(),
  
  // System fields
  createdAt: z.string(),
  updatedAt: z.string(),
  createdById: z.string().nullable(),
  updatedById: z.string().nullable(),
});

// ============================================================================
// IMPACT ANALYSIS
// ============================================================================

export const ImpactAnalysisSchema = z.object({
  riskScore: z.number().min(0).max(10), // 0 = no risk, 10 = high risk
  
  affectedEntities: z.object({
    rules: z.array(z.string()),
    processes: z.array(z.string()),
    nodes: z.array(z.string()),
    workflows: z.array(z.string()),
  }),
  
  changeMetrics: z.object({
    linesAdded: z.number(),
    linesDeleted: z.number(),
    linesModified: z.number(),
    filesChanged: z.number(),
  }),
  
  businessImpact: z.object({
    criticalProcesses: z.array(z.string()),
    customerFacing: z.boolean(),
    financialImpact: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']),
    complianceRelevant: z.boolean(),
  }),
  
  technicalMetrics: z.object({
    testCoverage: z.number().min(0).max(100),
    performanceImpact: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE']),
    securityRelevant: z.boolean(),
  }),
});

// ============================================================================
// SMART REVIEWER ASSIGNMENT
// ============================================================================

export const SmartReviewerSuggestionSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  confidence: z.number().min(0).max(1), // 0-1 confidence score
  
  reasons: z.array(z.enum([
    'RULE_EXPERTISE',      // Expert in business rules
    'NODE_KNOWLEDGE',      // Knows affected nodes
    'PROCESS_OWNER',       // Owns affected processes
    'PREVIOUS_COLLABORATOR', // Worked on similar changes
    'CODE_OWNER',          // Code ownership
    'AVAILABILITY',        // Currently available
    'WORKLOAD_BALANCE'     // Help balance review workload
  ])),
  
  expertise: z.object({
    businessRules: z.number().min(0).max(10),
    processDesign: z.number().min(0).max(10),
    nodeHierarchy: z.number().min(0).max(10),
    compliance: z.number().min(0).max(10),
  }),
});

// ============================================================================
// MAIN PR SCHEMA
// ============================================================================

export const PullRequestSchema = z.object({
  id: z.string(),
  
  // Basic PR info
  title: z.string(),
  description: z.string().optional(),
  
  // Branch information
  sourceBranchId: z.string(),
  sourceBranchName: z.string(),
  targetBranchId: z.string(),
  targetBranchName: z.string(),
  
  // Author information
  authorId: z.string(),
  authorName: z.string(),
  authorEmail: z.string().optional(),
  
  // PR state
  status: PullRequestStatusSchema,
  isDraft: z.boolean().default(false),
  
  // Review system
  reviews: z.array(PullRequestReviewSchema).default([]),
  comments: z.array(PullRequestCommentSchema).default([]),
  
  // Required reviewers
  requiredReviewers: z.array(z.string()).default([]),
  optionalReviewers: z.array(z.string()).default([]),
  
  // Smart suggestions
  suggestedReviewers: z.array(SmartReviewerSuggestionSchema).default([]),
  
  // Approval state
  approvalsRequired: z.number().default(0),
  approvalsReceived: z.number().default(0),
  
  // Merge configuration
  mergeStrategy: MergeStrategySchema.default('MERGE_COMMIT'),
  autoMergeEnabled: z.boolean().default(false),
  
  // Impact analysis
  impactAnalysis: ImpactAnalysisSchema.optional(),
  
  // Conflict information
  hasConflicts: z.boolean().default(false),
  conflictFiles: z.array(z.string()).default([]),
  
  // Bypass information (for optional PR mode)
  bypassReason: z.string().optional(),
  bypassedAt: z.string().optional(),
  bypassedById: z.string().optional(),
  
  // Merge information
  mergedAt: z.string().optional(),
  mergedById: z.string().optional(),
  mergeCommitSha: z.string().optional(),
  
  // Tenant and branch context
  tenantId: z.string(),
  branchId: z.string(),
  
  // System fields
  createdAt: z.string(),
  updatedAt: z.string(),
  createdById: z.string().nullable(),
  updatedById: z.string().nullable(),
  
  // Versioning
  version: z.number().default(1),
  isActive: z.boolean().default(true),
  
  // Branch-specific fields
  originalPullRequestId: z.string().optional(), // For branch copies
});

// ============================================================================
// PR SETTINGS SCHEMA
// ============================================================================

export const PRSettingsSchema = z.object({
  id: z.string(),
  
  // Workspace-level settings
  workspaceId: z.string(),
  prMode: PRModeSchema,
  
  // Auto-detection rules
  autoDetection: z.object({
    enableForSingleUser: z.boolean().default(true),
    enableForTeams: z.boolean().default(true),
    enableForProtectedBranches: z.boolean().default(true),
  }),
  
  // Bypass rules
  bypassRules: z.object({
    allowDirectMerge: z.boolean().default(true),
    allowSelfApproval: z.boolean().default(true),
    allowEmergencyMerge: z.boolean().default(true),
    requireBypassReason: z.boolean().default(false),
  }),
  
  // Default review requirements
  defaultReviewers: z.object({
    required: z.number().default(0),
    autoAssign: z.boolean().default(true),
    requireCodeOwnerReview: z.boolean().default(false),
  }),
  
  // Branch protection rules
  branchProtection: z.array(z.object({
    branchPattern: z.string(), // e.g., "main", "production", "release/*"
    requirePR: z.boolean(),
    requiredReviewers: z.number(),
    allowSelfMerge: z.boolean(),
    allowAdminBypass: z.boolean(),
  })).default([]),
  
  // Tenant context
  tenantId: z.string(),
  
  // System fields
  createdAt: z.string(),
  updatedAt: z.string(),
  createdById: z.string().nullable(),
  updatedById: z.string().nullable(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type PullRequest = z.infer<typeof PullRequestSchema>;
export type PullRequestReview = z.infer<typeof PullRequestReviewSchema>;
export type PullRequestComment = z.infer<typeof PullRequestCommentSchema>;
export type ImpactAnalysis = z.infer<typeof ImpactAnalysisSchema>;
export type SmartReviewerSuggestion = z.infer<typeof SmartReviewerSuggestionSchema>;
export type PRSettings = z.infer<typeof PRSettingsSchema>;

export type PullRequestStatus = z.infer<typeof PullRequestStatusSchema>;
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;
export type PRMode = z.infer<typeof PRModeSchema>;
export type MergeStrategy = z.infer<typeof MergeStrategySchema>;

// ============================================================================
// RESOURCE SCHEMA CONFIGURATION
// ============================================================================

export const PULL_REQUEST_SCHEMA = {
  databaseKey: 'pullRequests',
  modelName: 'PullRequest',
  actionPrefix: 'pullRequests',
  schema: PullRequestSchema,
  
  // Display configuration
  display: {
    title: 'Pull Requests',
    description: 'Code review and merge requests',
    icon: 'GitPullRequest',
    color: 'blue'
  },
  
  // Form configuration
  form: {
    width: 'lg',
    layout: 'compact',
    showDescriptions: true
  },
  
  // Field definitions with proper autoValue configuration
  fields: [
    // ID field with auto-generation
    {
      key: 'id',
      label: 'ID',
      type: 'text',
      required: true,
      description: 'Unique identifier - auto-generated UUID',
      autoValue: {
        source: 'auto.uuid',
        required: true
      },
      form: {
        row: 1,
        width: 'full',
        showInForm: false
      },
      table: {
        width: 'sm',
        
      }
    },
    // User input fields
    {
      key: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      placeholder: 'Enter PR title...',
      description: 'Brief description of the changes',
      form: {
        row: 1,
        width: 'full',
        order: 1
      },
      table: {
        width: 'lg'
      },
      validation: [
        { type: 'required', message: 'Title is required' },
        { type: 'maxLength', value: 255, message: 'Title cannot exceed 255 characters' }
      ]
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Describe your changes...',
      description: 'Detailed description of the changes',
      form: {
        row: 2,
        width: 'full',
        order: 2
      },
      table: {
        width: 'xl',
        
      }
    },
    {
      key: 'sourceBranchId',
      label: 'Source Branch',
      type: 'text',
      required: true,
      form: {
        row: 3,
        width: 'half',
        order: 3
      }
    },
    {
      key: 'targetBranchId',
      label: 'Target Branch',
      type: 'text',
      required: true,
      form: {
        row: 3,
        width: 'half',
        order: 4
      }
    },
    {
      key: 'isDraft',
      label: 'Draft',
      type: 'switch',
      defaultValue: false,
      description: 'Mark as draft (work in progress)',
      form: {
        row: 4,
        width: 'full',
        order: 5
      }
    },
    // System fields
    {
      key: 'tenantId',
      label: 'Tenant ID',
      type: 'text',
      required: true,
      autoValue: {
        source: 'session.user.tenantId',
        required: true
      },
      form: {
        showInForm: false
      },
      table: {
        
      }
    },
    {
      key: 'branchId',
      label: 'Branch ID',
      type: 'text',
      required: true,
      autoValue: {
        source: 'session.user.branchContext.currentBranchId',
        required: true
      },
      form: {
        showInForm: false
      },
      table: {
        
      }
    },
    {
      key: 'createdAt',
      label: 'Created',
      type: 'date',
      form: {
        showInForm: false
      },
      table: {
        width: 'sm'
      }
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      type: 'date',
      form: {
        showInForm: false
      },
      table: {
        width: 'sm'
      }
    },
    {
      key: 'createdById',
      label: 'Created By',
      type: 'text',
      form: {
        showInForm: false
      },
      table: {
        
      }
    },
    {
      key: 'updatedById',
      label: 'Updated By',
      type: 'text',
      form: {
        showInForm: false
      },
      table: {
        
      }
    }
  ],
  
  // Search configuration
  search: {
    fields: ['title', 'description'],
    placeholder: 'Search pull requests...',
    mobileFilters: true,
    fuzzy: true
  },
  
  // Actions configuration
  actions: {
    create: true,
    update: true,
    delete: true,
    duplicate: false,
    bulk: false
  },
  
  // Mobile configuration
  mobile: {
    cardFormat: 'compact',
    primaryField: 'title',
    secondaryFields: ['status', 'authorName'],
    showSearch: true,
    showFilters: true,
    fabPosition: 'bottom-right'
  },
  
  // Desktop configuration
  desktop: { 
    sortField: 'createdAt', 
    sortOrder: 'desc' 
  },
  
  // Permissions
  permissions: {
    create: 'pullRequests:create',
    update: 'pullRequests:update',
    delete: 'pullRequests:delete',
    view: 'pullRequests:view'
  },
  
  // ✅ ENTITY: IndexedDB key configuration
  indexedDBKey: (record: any) => record.id,
  
  // Relationships
  relationships: {
    reviews: {
      type: 'one-to-many',
      relatedEntity: 'pullRequestReviews',
      description: 'Reviews for this pull request',
    },
    comments: {
      type: 'one-to-many',
      relatedEntity: 'pullRequestComments',
      description: 'Comments on this pull request',
    },
    sourceBranch: {
      type: 'many-to-one',
      relatedEntity: 'branches',
      description: 'Source branch for this PR',
    },
    targetBranch: {
      type: 'many-to-one',
      relatedEntity: 'branches',
      description: 'Target branch for this PR',
    },
  },
} as const;

export const PULL_REQUEST_REVIEW_SCHEMA = {
  databaseKey: 'pullRequestReviews',
  modelName: 'PullRequestReview',
  actionPrefix: 'pullRequestReviews',
  schema: PullRequestReviewSchema,
  relations: ['pullRequest', 'reviewer', 'tenant', 'branch'],
  primaryKey: ['id'],
  
  // Branch-specific configuration
  indexedDBKey: (record: PullRequestReview) => `${record.pullRequestId}:${record.reviewerId}`,
} as const;

export const PULL_REQUEST_COMMENT_SCHEMA = {
  databaseKey: 'pullRequestComments',
  modelName: 'PullRequestComment',
  actionPrefix: 'pullRequestComments',
  schema: PullRequestCommentSchema,
  relations: ['pullRequest', 'author', 'tenant', 'branch'],
  primaryKey: ['id'],
  
  // Branch-specific configuration
  indexedDBKey: (record: PullRequestComment) => record.id,
} as const;

export const PR_SETTINGS_SCHEMA = {
  databaseKey: 'prSettings',
  modelName: 'PRSettings',
  actionPrefix: 'prSettings',
  schema: PRSettingsSchema,
  relations: ['tenant'],
  primaryKey: ['id'],
  
  // Branch-specific configuration
  indexedDBKey: (record: PRSettings) => record.workspaceId,
} as const;
