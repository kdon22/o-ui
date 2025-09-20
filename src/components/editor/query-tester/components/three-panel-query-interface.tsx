/**
 * Three-Panel Query Interface - Professional IDE-Style Layout
 * 
 * Layout:
 * - Left Panel: Table Tree (always visible, categorized)
 * - Middle Panel: Query Builder with syntax highlighting
 * - Right Panel: Live Results (updates instantly)
 * 
 * Perfect for: Professional query building with instant feedback
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
  Maximize2,
  Download,
  Code
} from 'lucide-react';
import { cn } from '@/lib/utils/generalUtils';
import { Toaster, useToast } from '@/components/ui/toast';

// Components
import { TableTreeSelector } from './table-tree-selector';
import { SmartExamplesPanel } from './smart-examples-panel';
import { ResultsModal } from './results-modal';
import { QueryVariablesPanel } from './query-variables-panel';

// Hooks
import { useQueryExecution } from '../hooks/use-query-execution';
import { useTableSelection } from '../hooks/use-table-selection';
import { useQueryVariables } from '../hooks/use-query-variables';
import { parseSimpleSQL } from '../utils/simple-sql-parser';

export interface ThreePanelQueryInterfaceProps {
  onQueryGenerated?: (query: string) => void;
  className?: string;
}

export function ThreePanelQueryInterface({ 
  onQueryGenerated,
  className 
}: ThreePanelQueryInterfaceProps) {
  const { toast } = useToast();
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

  // Auto-populate query when table is selected (but don't execute)
  useEffect(() => {
    if (selectedTable) {
      // Use tableName (sanitized) instead of name (display name)
      const tableRef = selectedTable.tableName;
      const searchAllQuery = `SELECT * FROM [${tableRef}]`;
      setQueryText(searchAllQuery);
    }
  }, [selectedTable]);

  const handleQueryChange = (newQuery: string) => {
    setQueryText(newQuery);
  };

  const handleExecuteQuery = async () => {
    if (!queryText.trim()) return;
    
    // Use the final query with variables substituted
    const finalQuery = getFinalQuery();

    // Pre-validate SQL (require [Table] and [Column] identifiers)
    const parsed = parseSimpleSQL(finalQuery);
    if (!parsed.isValid) {
      toast({ title: 'Invalid SQL', description: parsed.error || 'Please fix your query syntax.', variant: 'destructive' });
      return;
    }
    await executeQuery(queryText, finalQuery);
  };

  const handleExampleSelect = (exampleQuery: string) => {
    setQueryText(exampleQuery);
    setShowExamples(false);
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
    if (ok) toast({ title: 'Copied', description: 'Query copied to clipboard.', variant: 'success' });
    else toast({ title: 'Copy failed', description: 'Unable to copy query. Please copy manually.', variant: 'destructive' });
    if (onQueryGenerated) onQueryGenerated(text);
  };

  const handleTableSelect = (tableId: string) => {
    selectTable(tableId);
  };

  const handleReset = () => {
    setQueryText('');
    resetQuery();
  };

  const hasResults = queryResult?.success && queryResult?.data && queryResult.data.length > 0;
  
  return (
    <div className={cn("h-full w-full flex flex-col", className)}>
      {/* Header */}
      <Card className="rounded-b-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5" />
              Query Builder
              {selectedTable && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <Badge variant="outline">
                    {selectedTable.name}
                  </Badge>
                </>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {hasResults && (
                <Badge variant="secondary">
                  {queryResult?.data?.length || 0} rows
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Three-Panel Layout */}
      <div className="flex-1 grid grid-cols-12 gap-1 bg-border">
        {/* Left Panel: Table Tree (2 columns - more compact) */}
        <div className="col-span-2 bg-background">
          <Card className="h-full rounded-none border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Tables</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <TableTreeSelector
                tables={availableTables}
                selectedTableId={selectedTable?.id || ''}
                onTableSelect={handleTableSelect}
                isLoading={tablesLoading}
                compact={true}
              />
            </CardContent>
          </Card>
        </div>

        {/* Middle Panel: Query Builder (6 columns) */}
        <div className="col-span-6 bg-background">
          <Card className="h-full rounded-none border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Query Editor</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExamples(true)}
                >
                  <BookOpen className="h-3 w-3 mr-1" />
                  Examples
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-3">
              {/* Query Textarea */}
              <TextArea
                value={queryText}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder={
                  selectedTable
                    ? `SELECT * FROM [${selectedTable.tableName}]`
                    : "SELECT columns FROM table WHERE conditions"
                }
                className="font-mono text-sm flex-1 resize-none"
                style={{ minHeight: '200px' }}
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
                  disabled={isExecuting || !queryText.trim() || !selectedTable || (hasVariables && !hasAllVariableValues)}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  {isExecuting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                  Run
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleCopyToEditor}
                  disabled={!queryText.trim()}
                  size="sm"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  size="sm"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </div>

              {/* Query Status */}
              {selectedTable ? (
                <div className="text-xs text-muted-foreground">
                  Ready to query {selectedTable.name}
                  {selectedTable.description && (
                    <span> • {selectedTable.description}</span>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Select a table from the tree to start building queries
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Live Results (4 columns) */}
        <div className="col-span-4 bg-background">
          <Card className="h-full rounded-none border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Results</CardTitle>
                {hasResults && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowResultsModal(true)}
                    >
                      <Maximize2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {isExecuting ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground">Executing query...</div>
                  </div>
                </div>
              ) : queryResult?.success ? (
                <div className="h-full flex flex-col space-y-3">
                  {/* Results Summary */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {queryResult.data?.length || 0} rows
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {queryResult.columns?.length || 0} columns
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Results Table */}
                  <div className="border rounded overflow-auto flex-1">
                    <table className="w-full text-xs">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          {(queryResult.columns || []).map((col: any, idx: number) => (
                            <th key={idx} className="p-2 text-left border-r font-medium">
                              <div className="truncate max-w-[80px]" title={col.label || col.key}>
                                {col.label || col.key}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(queryResult.data || []).map((row: any, idx: number) => (
                          <tr key={idx} className="border-t hover:bg-muted/30">
                            {(queryResult.columns || []).map((col: any, colIdx: number) => (
                              <td key={colIdx} className="p-2 border-r">
                                <div className="truncate max-w-[80px]" title={String(row[col.key] || '')}>
                                  {String(row[col.key] || '—')}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : queryResult?.error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-sm font-medium text-red-600 mb-1">Query Error</div>
                    <div className="text-xs text-red-500">{queryResult.error}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Database className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <div className="text-sm text-muted-foreground">
                      {selectedTable ? 'Run a query to see results' : 'Select a table to start'}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
