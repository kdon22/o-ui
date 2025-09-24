/**
 * Workspace Bootstrap Service
 * 
 * Handles workspace initialization and cache warming in a controlled, modular way.
 * Prevents duplicate bootstraps and manages resource loading efficiently.
 * Auto-discovers resources from the resource registry and junction registry.
 */

import { getActionClient } from '@/lib/action-client'
import { 
  getAllResourceSchemas,
  getAllActionPrefixes,
  getActionMapping,
  getIndexedDBStoreConfigs,
  type ActionMapping 
} from '@/lib/resource-system/resource-registry'
// Junction functionality moved to unified-resource-registry
import { getUnifiedResourceRegistry } from '@/lib/resource-system/unified-resource-registry'
import type { BranchContext, ResourceSchema } from '@/lib/resource-system/schemas'
import { formatBranchContext } from '@/lib/utils/branch-utils'

// ============================================================================
// TYPES
// ============================================================================

export interface BootstrapOptions {
  tenantId: string
  branchContext: BranchContext
  force?: boolean
  resourceFilter?: string[]
  includeJunctions?: boolean
  strategy?: 'full' | 'lazy' | 'critical' // New loading strategy
  maxRecordsPerResource?: number // Configurable limit
}

export interface LazyBootstrapOptions extends BootstrapOptions {
  strategy: 'lazy'
  criticalResources?: string[] // Resources needed immediately
  lazyResources?: string[] // Resources to load on-demand
}

export interface BootstrapResult {
  success: boolean
  loadedResources: number
  loadedJunctions: number
  skippedResources: string[]
  errors: string[]
  duration: number
  resourceSummary: ResourceSummary[]
  junctionSummary: JunctionSummary[]
}

export interface ResourceSummary {
  resourceType: string
  action: string
  recordCount: number
  success: boolean
  error?: string
  loadTime: number
}

export interface JunctionSummary {
  junctionType: string
  action: string
  recordCount: number
  success: boolean
  error?: string
  loadTime: number
}

// ============================================================================
// BOOTSTRAP STATE MANAGEMENT
// ============================================================================

const bootstrapState = {
  isBootstrapping: false,
  lastBootstrap: null as Date | null,
  bootstrapPromise: null as Promise<BootstrapResult> | null
}

// ============================================================================
// RESOURCE DISCOVERY
// ============================================================================

/**
 * Discover all available resources from the resource registry
 */
function discoverResources(): Array<{
  resourceType: string;
  action: string;
  databaseKey: string;
  schema: ResourceSchema;
}> {
  // Discovering resources - silent
  const resourceSchemas = getAllResourceSchemas()
  
  const resources: Array<{
    resourceType: string;
    action: string;
    databaseKey: string;
    schema: ResourceSchema;
  }> = []

  // Iterate over array directly instead of Object.entries()
  resourceSchemas.forEach(schema => {
    const actionPrefix = schema.actionPrefix; // Use actionPrefix directly (e.g., 'node', 'process')
    
    const resource = {
      resourceType: schema.actionPrefix, // Use actionPrefix as resourceType
      action: `${actionPrefix}.list`,
      databaseKey: schema.databaseKey,
      schema
    }
    
    resources.push(resource)
  })
  
  return resources
}

/**
 * Discover all available junction tables from the junction registry
 */
function discoverJunctions(): Array<{
  junctionType: string;
  action: string;
  databaseKey: string;
  schema: JunctionSchemaType;
}> {
  const junctions: Array<{
    junctionType: string;
    action: string;
    databaseKey: string;
    schema: JunctionSchemaType;
  }> = []

  // Junction tables are now auto-discovered from entity schema relationships
  // No separate junction schemas needed - they're embedded in main schemas
  const registry = getUnifiedResourceRegistry()
  const junctionTables = registry.getAllJunctionTables()
  
  junctionTables.forEach(tableName => {
    junctions.push({
      junctionType: tableName,
      action: `${tableName}.list`,
      databaseKey: tableName,
      schema: null // Schema embedded in main entity schemas
    })
  })

  return junctions
}

// ============================================================================
// LOADING STRATEGIES  
// ============================================================================

/**
 * Critical resources that must be loaded immediately for app functionality
 * According to user requirements: bootstrap loads ALL nodes, then lazy loads resources
 */
const CRITICAL_RESOURCES = ['node', 'branches'] as const;

type CriticalResourceType = typeof CRITICAL_RESOURCES[number];

/**
 * Bootstrap strategy: Load ALL nodes with full hierarchy (children, grandchildren)
 * This ensures complete tree navigation is available immediately
 */
const BOOTSTRAP_STRATEGY = {
  // Always load ALL nodes immediately for complete tree navigation
  nodes: {
    strategy: 'full',
    include: ['children', 'parent'], // Use include instead of includeChildren
    maxRecords: 10000 // High limit to get full hierarchy
  },
  
  // Lazy load resources FROM VISIBLE NODES only
  resources: {
    strategy: 'node-specific',
    loadFor: 'visible-nodes', // Only load for nodes that are visible in the tree
    include: ['junctions'], // Use include instead of includeJunctions
    parallel: true // Load all resources in parallel
  }
};

/**
 * Resources that should be loaded per-node when nodes are visible/expanded
 */
const NODE_SPECIFIC_RESOURCES = ['process', 'rule', 'office', 'workflow'];

/**
 * Junction table dependencies - defines which junction tables to load with resources
 */
const JUNCTION_DEPENDENCIES: Record<string, string[]> = {
  process: ['nodeProcesses'],           // When loading node processes, also load junction  
  rule: ['processRules'],               // When loading node rules, also load junction
  office: []                            // Office has no junction dependencies
};

/**
 * Load ALL nodes with full hierarchy for complete tree navigation
 */
async function loadAllNodes(
  tenantId: string,
  branchContext: BranchContext,
  maxRecords: number = 10000
): Promise<ResourceSummary> {
  const startTime = Date.now()
  console.log('[WorkspaceBootstrap] loadAllNodes start', {
    tenantId,
    branchIds: { current: branchContext.currentBranchId, def: branchContext.defaultBranchId },
    maxRecords,
    timestamp: new Date().toISOString()
  })
  
  try {
    const actionClient = getActionClient(tenantId, branchContext)
    
    // Load all nodes - the action client will handle the hierarchy
    const response = await actionClient.executeAction({
      action: 'node.list',
      options: { 
        pagination: { page: 1, limit: maxRecords },
        include: ['children', 'parent'], // Use include instead of includeChildren
        sort: { field: 'sortOrder', direction: 'asc' }
      },
      branchContext
    })

    const recordCount = Array.isArray(response.data) ? response.data.length : 0
    const loadTime = Date.now() - startTime
    console.log('[WorkspaceBootstrap] loadAllNodes complete', {
      recordCount,
      ms: loadTime,
      timestamp: new Date().toISOString()
    })

    return {
      resourceType: 'node',
      action: 'node.list',
      recordCount,
      success: true,
      loadTime
    }
  } catch (error) {
    const loadTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[WorkspaceBootstrap] loadAllNodes error', { error: errorMessage, ms: loadTime })
    return {
      resourceType: 'node',
      action: 'node.list',
      recordCount: 0,
      success: false,
      error: errorMessage,
      loadTime
    }
  }
}

/**
 * Load resources for specific visible nodes only
 */
async function loadNodeSpecificResources(
  visibleNodeIds: string[],
  branchContext: BranchContext,
  maxRecords: number = 200
): Promise<ResourceSummary[]> {
  const startTime = Date.now()
  console.log('[WorkspaceBootstrap] loadNodeSpecificResources start', {
    visibleNodeIdsCount: visibleNodeIds.length,
    maxRecords,
    timestamp: new Date().toISOString()
  })
  
  const results: ResourceSummary[] = []
  
  // Load resources for each visible node in parallel
  const nodePromises = visibleNodeIds.map(async (nodeId) => {
    const nodeResults: ResourceSummary[] = []
    
    // Load each resource type for this node
    const resourcePromises = NODE_SPECIFIC_RESOURCES.map(async (resourceType) => {
      return loadResourceForNode(branchContext.tenantId, nodeId, resourceType, branchContext, maxRecords)
    })
    
    const resourceResults = await Promise.all(resourcePromises)
    nodeResults.push(...resourceResults)
    
    return nodeResults
  })
  
  const allNodeResults = await Promise.all(nodePromises)
  const flatResults = allNodeResults.flat()
  
  const loadTime = Date.now() - startTime
  console.log('[WorkspaceBootstrap] loadNodeSpecificResources complete', { ms: loadTime })
  return flatResults
}

/**
 * Load a specific resource type for a specific node
 */
async function loadResourceForNode(
  tenantId: string,
  nodeId: string,
  resourceType: string,
  branchContext: BranchContext,
  maxRecords: number = 200
): Promise<ResourceSummary> {
  const startTime = Date.now()
  console.log('[WorkspaceBootstrap] loadResourceForNode start', { nodeId, resourceType, maxRecords })
  try {
    const actionClient = getActionClient(tenantId, branchContext)
    
    // Load resources filtered by node
    const response = await actionClient.executeAction({
      action: `${resourceType}.list`,
      options: { 
        pagination: { page: 1, limit: maxRecords },
        filters: { nodeId }, // Filter by specific node
        include: ['junctions'] // Use include instead of includeJunctions
      },
      branchContext
    })

    const recordCount = Array.isArray(response.data) ? response.data.length : 0
    const loadTime = Date.now() - startTime
    console.log('[WorkspaceBootstrap] loadResourceForNode complete', { nodeId, resourceType, count: recordCount, ms: loadTime })
    // Load dependent junction tables in parallel
    await loadJunctionsForNodeResource(nodeId, resourceType, branchContext, maxRecords)

    return {
      resourceType: `${resourceType}_for_${nodeId}`,
      action: `${resourceType}.list`,
      recordCount,
      success: true,
      loadTime
    }
  } catch (error) {
    const loadTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[WorkspaceBootstrap] loadResourceForNode error', { nodeId, resourceType, error: errorMessage, ms: loadTime })
    return {
      resourceType: `${resourceType}_for_${nodeId}`,
      action: `${resourceType}.list`,
      recordCount: 0,
      success: false,
      error: errorMessage,
      loadTime
    }
  }
}

/**
 * Load junction tables for a specific node and resource type
 */
async function loadJunctionsForNodeResource(
  nodeId: string,
  resourceType: string,
  branchContext: BranchContext,
  maxRecords: number = 200
): Promise<void> {
  const junctionTypes = JUNCTION_DEPENDENCIES[resourceType] || []
  
  if (junctionTypes.length === 0) {
    console.log('[WorkspaceBootstrap] loadJunctionsForNodeResource skip (no deps)', { nodeId, resourceType })
    return
  }
  
  console.log('[WorkspaceBootstrap] loadJunctionsForNodeResource start', { nodeId, resourceType, junctionTypes })
  const junctionPromises = junctionTypes.map(async (junctionType) => {
    try {
      const { getActionClient } = await import('@/lib/action-client')
      const actionClient = getActionClient(branchContext.tenantId, branchContext)
      
      const response = await actionClient.executeAction({
        action: `${junctionType}.list`,
        options: { 
          pagination: { page: 1, limit: maxRecords },
          filters: { nodeId } // Filter junction by node
        },
        branchContext
      })

      const recordCount = Array.isArray(response.data) ? response.data.length : 0
      console.log('[WorkspaceBootstrap] junction loaded', { junctionType, nodeId, count: recordCount })
    } catch (error) {
      console.error('[WorkspaceBootstrap] junction load error', { junctionType, nodeId, error: error instanceof Error ? error.message : error })
    }
  })
  
  await Promise.all(junctionPromises)
}

/**
 * Get visible node IDs from the loaded nodes (roots + expanded nodes)
 */
function getVisibleNodeIds(nodes: any[]): string[] {
  if (!Array.isArray(nodes)) return []
  
  // For bootstrap, get root nodes and first level children
  const rootNodes = nodes.filter(node => !node.parentId || node.parentId === 'root')
  const firstLevelChildren = nodes.filter(node => 
    rootNodes.some(root => root.id === node.parentId)
  )
  
  const visibleNodes = [...rootNodes, ...firstLevelChildren]
  const visibleNodeIds = visibleNodes.map(node => node.id)
  

  
  return visibleNodeIds
}

/**
 * Load a single resource from the server and store in IndexedDB
 * Also loads dependent junction tables if their dependencies are available
 */
async function loadResource(
  resourceInfo: ReturnType<typeof discoverResources>[0],
  branchContext: BranchContext,
  maxRecords: number = 1000
): Promise<ResourceSummary> {
  const startTime = Date.now()
  console.log('[WorkspaceBootstrap] loadResource start', { resourceType: resourceInfo.resourceType, action: resourceInfo.action, maxRecords })

  
  try {

    const { getActionClient } = await import('@/lib/action-client')
    const actionClient = getActionClient(branchContext.tenantId, branchContext)
    
    const response = await actionClient.executeAction({
      action: resourceInfo.action,
      options: { 
        pagination: { page: 1, limit: maxRecords }
      },
      branchContext
    })

    const recordCount = Array.isArray(response.data) ? response.data.length : 0
    const loadTime = Date.now() - startTime
    console.log('[WorkspaceBootstrap] loadResource complete', { resourceType: resourceInfo.resourceType, count: recordCount, ms: loadTime })
    // Don't load junctions here - they'll be loaded in parallel separately

    return {
      resourceType: resourceInfo.resourceType,
      action: resourceInfo.action,
      recordCount,
      success: true,
      loadTime
    }
  } catch (error) {
    const loadTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[WorkspaceBootstrap] loadResource error', { resourceType: resourceInfo.resourceType, error: errorMessage, ms: loadTime })
    return {
      resourceType: resourceInfo.resourceType,
      action: resourceInfo.action,
      recordCount: 0,
      success: false,
      error: errorMessage,
      loadTime
    }
  }
}

/**
 * Load a single junction table (for parallel loading)
 */
async function loadSingleJunction(
  junctionTableKey: string,
  branchContext: BranchContext,
  maxRecords: number = 1000
): Promise<JunctionSummary> {
  const startTime = Date.now()
  console.log('[WorkspaceBootstrap] loadSingleJunction start', { junctionTableKey, maxRecords })
  
  try {
    const { getActionClient } = await import('@/lib/action-client')
    const actionClient = getActionClient(branchContext.tenantId, branchContext)
    
    const response = await actionClient.executeAction({
      action: `${junctionTableKey}.list`,
      options: { pagination: { page: 1, limit: maxRecords } },
      branchContext
    })

    const recordCount = Array.isArray(response.data) ? response.data.length : 0
    const loadTime = Date.now() - startTime
    console.log('[WorkspaceBootstrap] loadSingleJunction complete', { junctionTableKey, count: recordCount, ms: loadTime })

    return {
      junctionType: junctionTableKey,
      action: `${junctionTableKey}.list`,
      recordCount,
      success: true,
      loadTime
    }
  } catch (error) {
    const loadTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[WorkspaceBootstrap] loadSingleJunction error', { junctionTableKey, error: errorMessage, ms: loadTime })
    
    return {
      junctionType: junctionTableKey,
      action: `${junctionTableKey}.list`,
      recordCount: 0,
      success: false,
      error: errorMessage,
      loadTime
    }
  }
}

/**
 * Load junction tables that depend on the given resource type (DEPRECATED - use loadSingleJunction)
 */
async function loadDependentJunctions(
  resourceType: string,
  branchContext: BranchContext,
  maxRecords: number = 1000
): Promise<void> {
  // This function is now deprecated - junctions are loaded in parallel via loadSingleJunction
  console.log('[WorkspaceBootstrap] loadDependentJunctions DEPRECATED - using parallel loading instead', { resourceType })
  return
}

/**
 * Main bootstrap function with different strategies
 */
async function smartBootstrap(options: BootstrapOptions): Promise<BootstrapResult> {
  const startTime = Date.now()
  console.log('[WorkspaceBootstrap] smartBootstrap start', { strategy: options.strategy, tenantId: options.tenantId })
  
  // Discover all available resources

  const availableResources = discoverResources()

  
  // Determine what to load based on strategy
  let resourcesToLoad: ReturnType<typeof discoverResources> = []
  

  
  switch (options.strategy) {
    case 'critical':
      resourcesToLoad = availableResources.filter(r => 
        (CRITICAL_RESOURCES as readonly string[]).includes(r.resourceType)
      )
      break

    case 'lazy':
      const lazyOptions = options as LazyBootstrapOptions
      resourcesToLoad = availableResources.filter(r => 
        (lazyOptions.criticalResources || CRITICAL_RESOURCES as readonly string[]).includes(r.resourceType)
      )
      break

    default:
      resourcesToLoad = availableResources
      break
  }
  

  
  if (resourcesToLoad.length === 0) {
    
    return {
      success: false,
      loadedResources: 0,
      loadedJunctions: 0,
      skippedResources: availableResources.map(r => r.resourceType),
      errors: ['No resources to load'],
      duration: Date.now() - startTime,
      resourceSummary: [],
      junctionSummary: []
    }
  }
  
  // Load critical resources and ALL junctions in parallel for maximum speed
  const maxRecords = options.maxRecordsPerResource || 100 // Much smaller default

  
  // Start loading main resources
  const resourcePromises = resourcesToLoad.map(resource => loadResource(resource, options.branchContext, maxRecords))
  
  // Start loading all junctions in parallel (don't wait for main resources)
  const allJunctionPromises = resourcesToLoad.flatMap(resource => {
    const junctionTables = JUNCTION_DEPENDENCIES[resource.resourceType] || []
    return junctionTables.map(junctionTableKey => 
      loadSingleJunction(junctionTableKey, options.branchContext, maxRecords)
    )
  })
  
  console.log('[WorkspaceBootstrap] Loading resources and junctions in parallel', {
    resourceCount: resourcePromises.length,
    junctionCount: allJunctionPromises.length
  })

  // Wait for EVERYTHING to finish in parallel
  const [resourceResults, junctionResults] = await Promise.all([
    Promise.all(resourcePromises),
    Promise.all(allJunctionPromises)
  ])
  

  
  const duration = Date.now() - startTime
  const successfulResources = resourceResults.filter(r => r.success).length
  const errors = resourceResults.filter(r => !r.success).map(r => r.error!)
  
  const successfulJunctions = junctionResults.filter(j => j.success).length
  const junctionErrors = junctionResults.filter(j => !j.success).map(j => j.error!)
  const allErrors = [...errors, ...junctionErrors]
  
  console.log('[WorkspaceBootstrap] smartBootstrap complete', { 
    duration, 
    successfulResources, 
    successfulJunctions,
    totalErrors: allErrors.length 
  })
  
  const result = {
    success: allErrors.length === 0,
    loadedResources: successfulResources,
    loadedJunctions: successfulJunctions, // Now includes actual junction count
    skippedResources: availableResources
      .filter(r => !resourcesToLoad.includes(r))
      .map(r => r.resourceType),
    errors: allErrors,
    duration,
    resourceSummary: resourceResults,
    junctionSummary: junctionResults
  }
  
  console.log('[WorkspaceBootstrap] result', result)
  return result
}

/**
 * Load a single junction table from the server and store in IndexedDB
 */
async function loadJunction(
  tenantId: string,
  junctionInfo: ReturnType<typeof discoverJunctions>[0],
  branchContext: BranchContext
): Promise<JunctionSummary> {
  const startTime = Date.now()
  
  try {

    
    const actionClient = getActionClient(tenantId, branchContext)
    const response = await actionClient.executeAction({
      action: junctionInfo.action,
      options: { pagination: { page: 1, limit: 1000 } },
      branchContext
    })

    const loadTime = Date.now() - startTime
    const recordCount = Array.isArray(response.data) ? response.data.length : 0



    return {
      junctionType: junctionInfo.junctionType,
      action: junctionInfo.action,
      recordCount,
      success: true,
      loadTime
    }
  } catch (error) {
    const loadTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    
    
    return {
      junctionType: junctionInfo.junctionType,
      action: junctionInfo.action,
      recordCount: 0,
      success: false,
      error: errorMessage,
      loadTime
    }
  }
}

/**
 * Bootstrap workspace data - loads all resources and junction tables
 */
async function bootstrapWorkspace(options: BootstrapOptions): Promise<BootstrapResult> {
  const startTime = Date.now()
  console.log('[WorkspaceBootstrap] bootstrapWorkspace start', { tenantId: options.tenantId })

  // Discover all available resources and junctions
  const availableResources = discoverResources()
  const availableJunctions = discoverJunctions()
  



  // Filter resources if specified
  const resourcesToLoad = options.resourceFilter
    ? availableResources.filter(r => options.resourceFilter!.includes(r.resourceType))
    : availableResources

  // Include junctions if requested
  const junctionsToLoad = options.includeJunctions ? availableJunctions : []



  // Load resources in parallel
  const resourcePromises = resourcesToLoad.map(resource => 
    loadResource(resource, options.branchContext)
  )

  // Load junctions in parallel
  const junctionPromises = junctionsToLoad.map(junction => 
    loadJunction(options.branchContext.tenantId, junction, options.branchContext)
  )

  // Wait for all loads to complete
  const [resourceResults, junctionResults] = await Promise.all([
    Promise.all(resourcePromises),
    Promise.all(junctionPromises)
  ])

  const duration = Date.now() - startTime
  const successfulResources = resourceResults.filter(r => r.success).length
  const successfulJunctions = junctionResults.filter(j => j.success).length
  const errors = [
    ...resourceResults.filter(r => !r.success).map(r => r.error!),
    ...junctionResults.filter(j => !j.success).map(j => j.error!)
  ]

  const totalRecords = [
    ...resourceResults.map(r => r.recordCount),
    ...junctionResults.map(j => j.recordCount)
  ].reduce((sum, count) => sum + count, 0)





  const result = {
    success: errors.length === 0,
    loadedResources: successfulResources,
    loadedJunctions: successfulJunctions,
    skippedResources: availableResources
      .filter(r => !resourcesToLoad.includes(r))
      .map(r => r.resourceType),
    errors,
    duration,
    resourceSummary: resourceResults,
    junctionSummary: junctionResults
  }
  console.log('[WorkspaceBootstrap] bootstrapWorkspace complete', result)
  return result
}

// ============================================================================
// PUBLIC API
// ============================================================================

const workspaceBootstrap = {
  /**
   * Bootstrap workspace with deduplication and smart loading
   */
  async bootstrap(options: BootstrapOptions): Promise<BootstrapResult> {
    // Prevent duplicate bootstraps
    if (bootstrapState.isBootstrapping && bootstrapState.bootstrapPromise) {

      return bootstrapState.bootstrapPromise
    }

    // Check if recent bootstrap exists (unless forced)
    if (!options.force && bootstrapState.lastBootstrap) {
      const timeSinceLastBootstrap = Date.now() - bootstrapState.lastBootstrap.getTime()
      if (timeSinceLastBootstrap < 30000) { // 30 seconds

        return {
          success: true,
          loadedResources: 0,
          loadedJunctions: 0,
          skippedResources: [],
          errors: [],
          duration: 0,
          resourceSummary: [],
          junctionSummary: []
        }
      }
    }

    bootstrapState.isBootstrapping = true
    
    // Use smart bootstrap by default unless explicitly set to full
    const strategy = options.strategy || 'critical'
    const bootstrapPromise = strategy === 'full' 
      ? bootstrapWorkspace(options)
      : smartBootstrap({ ...options, strategy })
    
    bootstrapState.bootstrapPromise = bootstrapPromise

    try {
      const result = await bootstrapState.bootstrapPromise
      bootstrapState.lastBootstrap = new Date()
      return result
    } finally {
      bootstrapState.isBootstrapping = false
      bootstrapState.bootstrapPromise = null
    }
  },

  /**
   * Get bootstrap status
   */
  getStatus() {
    return {
      isBootstrapping: bootstrapState.isBootstrapping,
      lastBootstrap: bootstrapState.lastBootstrap
    }
  },

  /**
   * Force a fresh bootstrap
   */
  async forceBootstrap(options: Omit<BootstrapOptions, 'force'>): Promise<BootstrapResult> {
    return this.bootstrap({ ...options, force: true })
  },

  /**
   * Critical resources only (fastest startup)
   */
  async criticalBootstrap(options: Omit<BootstrapOptions, 'strategy'>): Promise<BootstrapResult> {
    return this.bootstrap({ ...options, strategy: 'critical', maxRecordsPerResource: 50 })
  },

  /**
   * Lazy loading bootstrap (critical + on-demand)
   */
  async lazyBootstrap(options: Omit<LazyBootstrapOptions, 'strategy'>): Promise<BootstrapResult> {
    return this.bootstrap({ ...options, strategy: 'lazy' })
  },

  /**
   * Full bootstrap (legacy behavior)
   */
  async fullBootstrap(options: Omit<BootstrapOptions, 'strategy'>): Promise<BootstrapResult> {
    return this.bootstrap({ ...options, strategy: 'full' })
  },

  /**
   * Bootstrap with junctions included
   */
  async bootstrapWithJunctions(options: Omit<BootstrapOptions, 'includeJunctions'>): Promise<BootstrapResult> {
    return this.bootstrap({ ...options, includeJunctions: true })
  },

  /**
   * Load additional resources on-demand
   */
  async loadResourceOnDemand(resourceType: string, options: Pick<BootstrapOptions, 'tenantId' | 'branchContext'>): Promise<ResourceSummary> {
    const resources = discoverResources()
    const resource = resources.find(r => r.resourceType === resourceType)
    
    if (!resource) {
      throw new Error(`Resource type ${resourceType} not found`)
    }
    
    return loadResource(resource, options.branchContext, 200) // Smaller limit for on-demand
  },

  /**
   * Get available resources for filtering
   */
  getAvailableResources(): string[] {
    return discoverResources().map(r => r.resourceType)
  },

  /**
   * Get available junction tables
   */
  getAvailableJunctions(): string[] {
    return discoverJunctions().map(j => j.junctionType)
  }
}

export default workspaceBootstrap