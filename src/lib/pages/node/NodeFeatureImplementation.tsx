// /**
//  * Node Feature Implementation
//  * 
//  * Implementation of the node feature factory for node tabs.
//  */

// import React from 'react';
// import { NodeFeatureFactory } from './NodeFeatureFactory';
// import { FeatureType, TabDefinition } from '../types';
// import { prefetchNodeTab, getQueryKeyForTab } from './prefetch';
// import { queryKeys } from '@/lib/query-keys';
// import { fixedRenderStandardTabs } from './tabRenderingFix';

// // Import the actual feature components and the new wrapper
// import { NodeRulesTabWrapper } from '@/features/rule/components/NodeRulesTabWrapper'; // Import the wrapper
// import { WorkflowList } from '@/features/workflow/components/WorkflowList';
// import { OfficeList } from '@/features/office/components/OfficeList'; // Assuming path

// // Define and export the component mapping and default tab
// export const nodeTabComponents = {
//   'processes': NodeRulesTabWrapper, // Use wrapper
//   'workflows': WorkflowList,
//   'offices': OfficeList,
//   'rules': NodeRulesTabWrapper // Use wrapper
// };

// export const nodeDefaultTab = 'processes';

// /**
//  * Node tabs configuration
//  */
// const NODE_TABS: TabDefinition[] = [
//   { id: 'processes', label: 'Processes' },
//   { id: 'workflows', label: 'Workflows' },  
//   { id: 'offices', label: 'Offices' },
//   { id: 'rules', label: 'Rules' }
// ];

// /**
//  * Create the node feature client using our factory
//  */
// export const NodeTabsClient = NodeFeatureFactory.createClient({
//   featureKey: 'node-tabs',
//   featureType: FeatureType.NODE,
//   displayName: 'Node Tabs',
  
//   // Tab configuration
//   tabs: NODE_TABS,
//   defaultTab: nodeDefaultTab, // Use exported constant
  
//   // Components for each tab
//   components: nodeTabComponents, // Use exported constant
  
//   // Use fixed version of standard tab rendering
//   renderTabs: fixedRenderStandardTabs,
  
//   // Data handling
//   getQueryKeys: (nodeId: string, tenantId: string) => ({
//     processes: queryKeys.processes.nodeProcess(nodeId, tenantId),
//     workflows: queryKeys.workflows.nodeWorkflow(nodeId, tenantId),
//     offices: queryKeys.offices.nodeOffices(nodeId, tenantId),
//     // REMOVED: rules query key - no direct node->rule relationship
//     // Rules are accessed through: node->process->rule
//   }),
  
//   // Prefetch data on tab hover
//   prefetchTabData: prefetchNodeTab,
  
//   // Performance options
//   prefetchStrategy: 'hover',
//   cacheStrategy: 'indexeddb'
// }); 