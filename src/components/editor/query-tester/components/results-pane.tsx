/**
 * Results Pane - Right side of split interface
 * Modern data visualization with virtual scrolling and export features
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Table, Code, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface QueryResult {
  success: boolean;
  data?: Record<string, any>[];
  columns?: any[];
  error?: string;
}

interface ResultsPaneProps {
  queryResult: QueryResult | null;
  isExecuting: boolean;
  queryText: string;
  onOpenFullScreen?: () => void;
}

export function ResultsPane({ queryResult, isExecuting, queryText, onOpenFullScreen }: ResultsPaneProps) {
  const { toast } = useToast();

  // Determine if table is too wide for split-pane view
  const columnCount = queryResult?.columns?.length || 
    (queryResult?.data?.[0] ? Object.keys(queryResult.data[0]).length : 0);
  const isWideTable = columnCount > 4;

  const handleExportCSV = () => {
    if (!queryResult?.data || queryResult.data.length === 0) return;
    
    // Use column definitions if available, otherwise fall back to object keys
    const headers = queryResult.columns?.map(col => col.name || col.key) || 
                   Object.keys(queryResult.data[0]);
    const csvContent = [
      headers.join(','),
      ...queryResult.data.map(row => 
        headers.map(header => `"${String(row[header] || '')}"`).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query-results.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Results exported!',
      description: 'CSV file has been downloaded.',
      variant: 'success'
    });
  };

  const renderEmptyState = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <Table className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium mb-2">Ready to run queries</h3>
        <p className="text-sm">
          {queryText.trim() 
            ? "Click 'Run Query' to see results here" 
            : "Write a query and click 'Run Query' to see results"
          }
        </p>
      </div>
    </div>
  );

  const renderLoadingState = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
        <h3 className="text-lg font-medium mb-2">Executing query...</h3>
        <p className="text-sm text-muted-foreground">This may take a moment</p>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      {/* Header with Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Table className="h-5 w-5" />
              Query Results
              {queryResult && (
                <Badge 
                  variant={queryResult.success ? "default" : "destructive"}
                  className="ml-2"
                >
                  {queryResult.success ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {queryResult.data?.length || 0} rows
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Error
                    </>
                  )}
                </Badge>
              )}
            </CardTitle>
            
            {queryResult?.success && queryResult.data && queryResult.data.length > 0 && (
              <div className="flex items-center gap-2">
                {isWideTable && onOpenFullScreen && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onOpenFullScreen}
                    className="flex items-center gap-2"
                  >
                    <Table className="h-4 w-4" />
                    View Full Screen
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Results Content */}
      {isExecuting ? (
        renderLoadingState()
      ) : !queryResult ? (
        renderEmptyState()
      ) : (
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-4">
            {queryResult.success ? (
              queryResult.data && queryResult.data.length > 0 ? (
                isWideTable ? (
                  // Wide table: Compact prompt with preview
                  <div className="flex-1 flex flex-col">
                    {/* Compact Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-blue-50">
                      <div className="flex items-center gap-3">
                        <Table className="h-5 w-5 text-blue-600" />
                        <div>
                          <h3 className="font-medium text-blue-900">Wide Table ({columnCount} columns)</h3>
                          <p className="text-sm text-blue-700">Best viewed in full-screen mode</p>
                        </div>
                      </div>
                      {onOpenFullScreen && (
                        <Button
                          onClick={onOpenFullScreen}
                          className="flex items-center gap-2"
                          size="sm"
                        >
                          <Table className="h-4 w-4" />
                          View Full Screen
                        </Button>
                      )}
                    </div>
                    
                    {/* Compact Preview */}
                    <div className="flex-1 p-4">
                      <div className="text-xs text-muted-foreground mb-2">
                        Preview: {queryResult.data.length} rows × first 3 of {columnCount} columns
                      </div>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full border-collapse text-sm">
                          <thead className="bg-muted">
                            <tr>
                              {(queryResult.columns?.slice(0, 3) || Object.keys(queryResult.data[0]).slice(0, 3)).map((column) => (
                                <th 
                                  key={typeof column === 'string' ? column : column.name || column.key}
                                  className="border-b border-border p-2 text-left font-medium"
                                >
                                  {typeof column === 'string' ? column : column.displayName || column.name || column.key}
                                </th>
                              ))}
                              <th className="border-b border-border p-2 text-left font-medium text-muted-foreground">
                                +{columnCount - 3} more
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {queryResult.data.slice(0, 5).map((row, index) => {
                              const previewColumns = queryResult.columns?.slice(0, 3).map(col => col.name || col.key) || 
                                Object.keys(row).slice(0, 3);
                              
                              return (
                                <tr key={index} className="hover:bg-muted/50">
                                  {previewColumns.map((columnKey, cellIndex) => (
                                    <td key={cellIndex} className="border-b border-border p-2">
                                      <div className="truncate max-w-[120px]" title={String(row[columnKey] || '')}>
                                        {String(row[columnKey] || '')}
                                      </div>
                                    </td>
                                  ))}
                                  <td className="border-b border-border p-2 text-muted-foreground text-center">
                                    ···
                                  </td>
                                </tr>
                              );
                            })}
                            {queryResult.data.length > 5 && (
                              <tr>
                                <td colSpan={4} className="p-2 text-center text-muted-foreground text-xs border-b">
                                  +{queryResult.data.length - 5} more rows
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Normal table: Show in split-pane
                  <div className="flex-1 overflow-auto border rounded-lg">
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 bg-muted">
                        <tr>
                          {(queryResult.columns?.length ? 
                            queryResult.columns.map((column) => (
                              <th 
                                key={column.name || column.key} 
                                className="border-b border-border p-3 text-left text-sm font-medium"
                                title={column.description}
                              >
                                {column.displayName || column.name || column.key}
                                {column.type && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    ({column.type})
                                  </span>
                                )}
                              </th>
                            )) :
                            Object.keys(queryResult.data[0]).map((column) => (
                              <th 
                                key={column} 
                                className="border-b border-border p-3 text-left text-sm font-medium"
                              >
                                {column}
                              </th>
                            ))
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResult.data.map((row, index) => {
                          const columns = queryResult.columns?.length ? 
                            queryResult.columns.map(col => col.name || col.key) :
                            Object.keys(row);
                          
                          return (
                            <tr 
                              key={index} 
                              className="hover:bg-muted/50 transition-colors"
                            >
                              {columns.map((columnKey, cellIndex) => (
                                <td 
                                  key={cellIndex} 
                                  className="border-b border-border p-3 text-sm"
                                >
                                  {String(row[columnKey] || '')}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Table className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No results found for this query.</p>
                  </div>
                </div>
              )
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-red-600 bg-red-50 p-4 rounded-lg max-w-md">
                    <XCircle className="h-6 w-6 mx-auto mb-2" />
                    <strong className="block mb-2">Query Error</strong>
                    <p className="text-sm">{queryResult.error}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
