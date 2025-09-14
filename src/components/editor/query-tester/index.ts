/**
 * Query Tester Module - Modern IDE-Style Query Builder
 * 
 * Exports the main QueryTestBench component and supporting components
 * for integration into the editor system.
 */

export { QueryTestBench } from './query-test-bench';
export type { QueryTestBenchProps } from './query-test-bench';

// New integrated interfaces
export { ThreePanelQueryInterface } from './components/three-panel-query-interface';
export { IntegratedQueryInterface } from './components/integrated-query-interface';
export type { ThreePanelQueryInterfaceProps } from './components/three-panel-query-interface';
export type { IntegratedQueryInterfaceProps } from './components/integrated-query-interface';

// Export components for advanced customization
export { QueryBuilderPane } from './components/query-builder-pane';
export { ResultsPane } from './components/results-pane';
export { SmartExamplesPanel } from './components/smart-examples-panel';
export { ResultsModal } from './components/results-modal';
export { TableTreeSelector } from './components/table-tree-selector';

// Export hooks for custom implementations
export { useTableSelection } from './hooks/use-table-selection';
export { useQueryExecution } from './hooks/use-query-execution';

// Export sample data for testing
export const SAMPLE_QUERY_SYNTAX = {
  basic: 'SELECT agent, officeId, queueNumber FROM [Agent Data]',
  filtered: 'SELECT agent, officeId, queueNumber FROM [Agent Data] WHERE officeId = "NYC001" AND queueNumber = {queueNumber}',
  vipCustomers: 'SELECT name, age, totalBookings FROM [Customer Data] WHERE vipStatus = true AND totalBookings > 10',
  confirmedBookings: 'SELECT customerName, destination, amount FROM [Booking Data] WHERE status = "confirmed" AND amount > 700'
};

// Export examples
export { IntegratedUsageExample, QueryBuilderExamples } from './examples/integrated-usage-example';