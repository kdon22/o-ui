/**
 * Integrated Query Interface - Tree View + Query Builder + Results
 * 
 * A unified interface that shows:
 * 1. Table tree view prominently at the top/left
 * 2. Query builder when table is selected
 * 3. Live results that update instantly
 * 
 * Perfect UX: Select table → See query → See results instantly
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TextArea } from '@/components/ui/text-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Copy, 
  RotateCcw, 
  BookOpen, 
  Database, 
  Loader2,
  ChevronRight,
  ChevronLeft,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils/generalUtils';
import { Toaster, showToast } from '@/components/ui/toast';

// Components
import { TableTreeSelector } from './table-tree-selector';
import { SmartExamplesPanel } from './smart-examples-panel';
import { ResultsModal } from './results-modal';
import { QueryVariablesPanel } from './query-variables-panel';

// Hooks
import { useQueryExecution } from '../hooks/use-query-execution';
import { useTableSelection } from '../hooks/use-table-selection';
import { useQueryVariables } from '../hooks/use-query-variables';

export interface IntegratedQueryInterfaceProps {
  onQueryGenerated?: (query: string) => void;
  className?: string;
}

type ViewMode = 'tree' | 'query' | 'results';

export function IntegratedQueryInterface({ 
  onQueryGenerated,
  className 
}: IntegratedQueryInterfaceProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [showExamples, setShowExamples] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [showResultsModal, setShowResultsModal] = useState(false);
  
  const { selectedTable, availableTables, selectTable, tablesLoading } = useTableSelection();
  const { 
    queryResult, 
    isExecuting, 
    executeQuery, 
    resetQuery 
  } = useQueryExecution(selectedTable);
  
  const {
    variables,
    hasVariables,
    hasAllVariableValues,
    updateVariable,
    getFinalQuery
  } = useQueryVariables(queryText);

  // Auto-advance to query view when table is selected
  useEffect(() => {
    if (selectedTable && viewMode === 'tree') {
      setViewMode('query');
      
      // Auto-populate query (but don't execute)
      // Use tableName (sanitized) instead of name (display name)
      const tableRef = selectedTable.tableName;
      const searchAllQuery = `SELECT * FROM [${tableRef}]`;
      setQueryText(searchAllQuery);
    }
  }, [selectedTable, viewMode]);

  const handleQueryChange = (newQuery: string) => {
    setQueryText(newQuery);
  };

  const handleExecuteQuery = async () => {
    if (!queryText.trim()) return;
    
    // Use the final query with variables substituted
    const finalQuery = getFinalQuery();
    await executeQuery(queryText, finalQuery);
    setViewMode('results');
  };

  const handleExampleSelect = (exampleQuery: string) => {
    setQueryText(exampleQuery);
    setShowExamples(false);
    setViewMode('query');
  };

  const copyTextToClipboard = async (text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {}
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    } catch (_) {
      return false;
    }
  };

  const handleCopyToEditor = async () => {
    const text = queryText?.trim();
    if (!text) return;
    const ok = await copyTextToClipboard(text);
    if (ok) showToast.success('Copied', 'Query copied to clipboard.');
    else showToast.error('Copy failed', 'Unable to copy query. Please copy manually.');
    if (onQueryGenerated) onQueryGenerated(text);
  };

  const handleTableSelect = (tableId: string) => {
    selectTable(tableId);
  };

  const handleReset = () => {
    setQueryText('');
    resetQuery();
    setViewMode('tree');
  };

  // Determine if we have results to show
  const hasResults = queryResult?.success && queryResult?.data && queryResult.data.length > 0;
  
  return (
    <div className={cn("h-full w-full flex flex-col", className)}>
      {/* Header with Navigation */}
      <Card className="rounded-b-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5" />
              Query Builder
              {selectedTable && (
                <Badge variant="outline" className="ml-2">
                  {selectedTable.name}
                </Badge>
              )}
            </CardTitle>
            
            {/* View Mode Navigation */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'tree' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('tree')}
                className="h-8"
              >
                Tables
              </Button>
              <Button
                variant={viewMode === 'query' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('query')}
                disabled={!selectedTable}
                className="h-8"
              >
                Query
              </Button>
              <Button
                variant={viewMode === 'results' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('results')}
                disabled={!hasResults}
                className="h-8"
              >
                Results
                {queryResult?.data && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {queryResult.data.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-muted/30">
        {viewMode === 'tree' && (
          <Card className="flex-1 rounded-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select a Table</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <TableTreeSelector
                tables={availableTables}
                selectedTableId={selectedTable?.id || ''}
                onTableSelect={handleTableSelect}
                isLoading={tablesLoading}
              />
            </CardContent>
          </Card>
        )}

        {viewMode === 'query' && selectedTable && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-1">
            {/* Query Editor */}
            <Card className="rounded-none">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Query Editor</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowExamples(true)}
                    >
                      <BookOpen className="h-4 w-4" />
                      Examples
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4">
                <TextArea
                  value={queryText}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder={`SELECT * FROM [${selectedTable.tableName}]`}
                  className="font-mono text-sm flex-1 min-h-[200px] resize-none"
                />
                
                {/* Query Variables */}
                {hasVariables && (
                  <QueryVariablesPanel
                    variables={variables}
                    onVariableChange={updateVariable}
                    compact={true}
                  />
                )}
                
                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={handleExecuteQuery}
                    disabled={isExecuting || !queryText.trim() || (hasVariables && !hasAllVariableValues)}
                    className="flex items-center gap-2"
                  >
                    {isExecuting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {isExecuting ? 'Running...' : 'Run Query'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleCopyToEditor}
                    disabled={!queryText.trim()}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleReset}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Live Preview */}
            <Card className="rounded-none">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Live Preview</CardTitle>
                  {hasResults && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowResultsModal(true)}
                    >
                      <Maximize2 className="h-4 w-4" />
                      Full Screen
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isExecuting ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Executing query...</span>
                  </div>
                ) : queryResult?.success ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {queryResult.data?.length || 0} rows
                      </Badge>
                      <Badge variant="outline">
                        {queryResult.columns?.length || 0} columns
                      </Badge>
                    </div>
                    
                    {/* Mini table preview */}
                    <div className="border rounded overflow-auto max-h-[300px]">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            {(queryResult.columns || []).slice(0, 4).map((col: any, idx: number) => (
                              <th key={idx} className="p-2 text-left border-r">
                                {col.label || col.key}
                              </th>
                            ))}
                            {(queryResult.columns?.length || 0) > 4 && (
                              <th className="p-2 text-left text-muted-foreground">
                                +{(queryResult.columns?.length || 0) - 4} more...
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {(queryResult.data || []).slice(0, 5).map((row: any, idx: number) => (
                            <tr key={idx} className="border-t">
                              {(queryResult.columns || []).slice(0, 4).map((col: any, colIdx: number) => (
                                <td key={colIdx} className="p-2 border-r max-w-[120px] truncate">
                                  {String(row[col.key] || '—')}
                                </td>
                              ))}
                              {(queryResult.columns?.length || 0) > 4 && (
                                <td className="p-2 text-muted-foreground">...</td>
                              )}
                            </tr>
                          ))}
                          {(queryResult.data?.length || 0) > 5 && (
                            <tr className="border-t bg-muted/50">
                              <td colSpan={Math.min(5, queryResult.columns?.length || 0)} className="p-2 text-center text-muted-foreground">
                                +{(queryResult.data?.length || 0) - 5} more rows...
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : queryResult?.error ? (
                  <div className="text-center p-8 text-red-600">
                    <div className="text-sm font-medium">Query Error</div>
                    <div className="text-xs mt-1">{queryResult.error}</div>
                  </div>
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">Run a query to see results</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {viewMode === 'results' && hasResults && (
          <Card className="flex-1 rounded-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Query Results</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {queryResult?.data?.length || 0} rows
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowResultsModal(true)}
                  >
                    <Maximize2 className="h-4 w-4" />
                    Full Screen
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="border rounded overflow-auto h-full">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      {(queryResult?.columns || []).map((col: any, idx: number) => (
                        <th key={idx} className="p-3 text-left border-r font-medium">
                          {col.label || col.key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(queryResult?.data || []).map((row: any, idx: number) => (
                      <tr key={idx} className="border-t hover:bg-muted/50">
                        {(queryResult?.columns || []).map((col: any, colIdx: number) => (
                          <td key={colIdx} className="p-3 border-r">
                            {String(row[col.key] || '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Navigation */}
      <Card className="rounded-t-none border-t-0">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {viewMode !== 'tree' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('tree')}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Tables
                </Button>
              )}
              
              {selectedTable && viewMode === 'tree' && (
                <Button
                  size="sm"
                  onClick={() => setViewMode('query')}
                >
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Build Query
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {selectedTable && (
                <span>Table: {selectedTable.name}</span>
              )}
              {queryResult?.data && (
                <span>• {queryResult.data.length} rows</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smart Examples Overlay */}
      {showExamples && (
        <SmartExamplesPanel
          selectedTable={selectedTable}
          onExampleSelect={handleExampleSelect}
          onClose={() => setShowExamples(false)}
        />
      )}

      {/* Full-Screen Results Modal */}
      <ResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        queryResult={queryResult}
        queryText={queryText}
      />
      <Toaster />
    </div>
  );
}
