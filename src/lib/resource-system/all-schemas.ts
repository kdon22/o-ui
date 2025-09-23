/**
 * All Resource Schemas - Centralized Schema Registry
 * 
 * GOLD STANDARD: Single source of truth for all resource schemas
 * - Prevents circular dependencies
 * - Centralized schema access
 * - Used by both unified-resource-registry and relationship engine
 */

import { NODE_SCHEMA } from '@/features/nodes/nodes.schema';
import { PROCESS_SCHEMA } from '@/features/processes/processes.schema';
import { RULE_SCHEMA } from '@/features/rules/rules.schema';
import { OFFICE_SCHEMA } from '@/features/offices/offices.schema';
import { WORKFLOW_SCHEMA } from '@/features/workflows/workflows.schema';
import { PROMPT_SCHEMA } from '@/features/prompts/prompts.schema';
import { USER_SCHEMA } from '@/features/users/users.schema';
import { BRANCH_SCHEMA } from '@/features/branches/branches.schema';
import { SESSION_SCHEMA } from '@/features/session/session.schema';
import { TAG_GROUP_SCHEMA } from '@/features/tags/tag-groups.schema';
import { TAG_SCHEMA } from '@/features/tags/tags.schema';
import { CLASS_SCHEMA } from '@/features/classes/classes.schema';
import { TABLE_CATEGORY_SCHEMA } from '@/features/table-categories/table-categories.schema';
import { DATA_TABLE_SCHEMA } from '@/features/data-tables/data-tables.schema';
import { TABLE_DATA_SCHEMA } from '@/features/table-data/table-data.schema';
import { QUEUE_CONFIG_SCHEMA, QUEUE_MESSAGE_SCHEMA, QUEUE_WORKER_SCHEMA } from '@/features/queues/queues.schema';

// Pull Request System Schemas
import { 
  PULL_REQUEST_SCHEMA, 
  PULL_REQUEST_REVIEW_SCHEMA, 
  PULL_REQUEST_COMMENT_SCHEMA, 
  PR_SETTINGS_SCHEMA 
} from '@/features/pull-requests/pull-requests.schema';

// Marketplace System Schemas
import { MARKETPLACE_PACKAGE_SCHEMA } from '@/features/marketplace/marketplace.schema';
import { PACKAGE_INSTALLATION_SCHEMA } from '@/features/marketplace/schemas/package-installation.schema';
import { PACKAGE_SUBSCRIPTION_SCHEMA } from '@/features/marketplace/schemas/package-subscription.schema';

// Junction schemas (auto-discovered from entity relationships)
import { PROCESS_RULE_SCHEMA } from '@/features/rules/rules.schema';
import { RULE_IGNORE_SCHEMA } from '@/features/rules/rules.schema';
import { NODE_PROCESS_SCHEMA } from '@/features/processes/processes.schema';
import { NODE_WORKFLOW_SCHEMA } from '@/features/workflows/workflows.schema';
import { WORKFLOW_PROCESS_SCHEMA } from '@/features/workflows/workflows.schema';
import { CUSTOMER_WORKFLOW_SCHEMA } from '@/features/workflows/workflows.schema';

/**
 * All resource schemas in a centralized registry
 * Used by unified-resource-registry and relationship engine
 */
export const ALL_SCHEMAS = [
  // Core entity schemas
  BRANCH_SCHEMA,
  SESSION_SCHEMA,
  NODE_SCHEMA,
  PROCESS_SCHEMA,
  RULE_SCHEMA,
  OFFICE_SCHEMA,
  WORKFLOW_SCHEMA,
  PROMPT_SCHEMA,
  USER_SCHEMA,
  
  // Tag System Entities
  TAG_GROUP_SCHEMA,
  TAG_SCHEMA,
  CLASS_SCHEMA,
  
  // Table Management Entities
  TABLE_CATEGORY_SCHEMA,
  DATA_TABLE_SCHEMA,
  TABLE_DATA_SCHEMA,
  
  // Pull Request System Entities
  PULL_REQUEST_SCHEMA,
  PULL_REQUEST_REVIEW_SCHEMA,
  PULL_REQUEST_COMMENT_SCHEMA,
  PR_SETTINGS_SCHEMA,
  
  // Marketplace System Entities
  MARKETPLACE_PACKAGE_SCHEMA,
  PACKAGE_INSTALLATION_SCHEMA,
  PACKAGE_SUBSCRIPTION_SCHEMA,
  
  // Travel Queue Management System (server-only)
  QUEUE_CONFIG_SCHEMA,
  QUEUE_MESSAGE_SCHEMA,
  QUEUE_WORKER_SCHEMA,
  
  // Junction schemas (auto-discovered)
  PROCESS_RULE_SCHEMA,
  RULE_IGNORE_SCHEMA,
  NODE_PROCESS_SCHEMA,
  NODE_WORKFLOW_SCHEMA,
  WORKFLOW_PROCESS_SCHEMA,
  CUSTOMER_WORKFLOW_SCHEMA,
] as const;

/**
 * Schema resources - filtered for core entities only
 */
export const SCHEMA_RESOURCES = ALL_SCHEMAS.filter(schema => 
  schema && (!schema.junctionConfig || schema.junctionConfig.autoCreateOnParentCreate !== true)
);

/**
 * Junction schemas - filtered for junction tables only
 */
export const JUNCTION_SCHEMAS = ALL_SCHEMAS.filter(schema => 
  schema && schema.junctionConfig && schema.junctionConfig.autoCreateOnParentCreate === true
);