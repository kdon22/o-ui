/**
 * Full-Screen Results Modal - For wide tables with many columns
 * Provides optimal viewing experience with column management
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { 
  Download, 
  Table, 
  Settings, 
  Search, 
  Eye, 
  EyeOff,
  X,
  CheckCircle,
  Columns
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface QueryResult {
  success: boolean;
  data?: Record<string, any>[];
  columns?: any[];
  error?: string;
}

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  queryResult: QueryResult | null;
  queryText: string;
}

export function ResultsModal({ isOpen, onClose, queryResult, queryText }: ResultsModalProps) {
  const { toast } = useToast();
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

  // Get all available columns
  const allColumns = useMemo(() => {
    if (!queryResult?.data?.[0]) return [];
    
    return queryResult.columns?.length ? 
      queryResult.columns.map(col => ({
        key: col.name || col.key,
        name: col.displayName || col.name || col.key,
        type: col.type
      })) :
      Object.keys(queryResult.data[0]).map(key => ({
        key,
        name: key,
        type: 'text'
      }));
  }, [queryResult]);

  // Filter visible columns
  const visibleColumns = useMemo(() => {
    return allColumns.filter(col => !hiddenColumns.has(col.key));
  }, [allColumns, hiddenColumns]);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!queryResult?.data || !searchTerm.trim()) {
      return queryResult?.data || [];
    }

    return queryResult.data.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [queryResult?.data, searchTerm]);

  const handleToggleColumn = (columnKey: string) => {
    setHiddenColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey);
      } else {
        newSet.add(columnKey);
      }
      return newSet;
    });
  };

  const handleShowAllColumns = () => {
    setHiddenColumns(new Set());
  };

  const handleHideAllColumns = () => {
    setHiddenColumns(new Set(allColumns.map(col => col.key)));
  };

  const handleExportCSV = () => {
    if (!filteredData || filteredData.length === 0) return;
    
    const headers = visibleColumns.map(col => col.key);
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
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

  if (!queryResult) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full" hideCloseButton>
        {/* Custom Header - No DialogHeader to avoid conflicts */}
        <div className="flex-shrink-0 p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Table className="h-5 w-5" />
                Query Results
              </h2>
              {queryResult.success && (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {filteredData.length} rows × {visibleColumns.length} columns
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search results..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              
              {/* Column Manager Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowColumnManager(!showColumnManager)}
                className="flex items-center gap-2"
              >
                <Columns className="h-4 w-4" />
                Columns
              </Button>
              
              {/* Export */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              
              {/* Close */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex gap-4 min-h-0 p-6 pt-4">
          {/* Column Manager Sidebar */}
          {showColumnManager && (
            <Card className="w-80 flex-shrink-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Column Visibility
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShowAllColumns}
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Show All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleHideAllColumns}
                    className="flex-1"
                  >
                    <EyeOff className="h-3 w-3 mr-1" />
                    Hide All
                  </Button>
                </div>
                
                {/* Column List */}
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {allColumns.map((column) => (
                      <div key={column.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={column.key}
                          checked={!hiddenColumns.has(column.key)}
                          onCheckedChange={() => handleToggleColumn(column.key)}
                        />
                        <label
                          htmlFor={column.key}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                        >
                          {column.name}
                          {column.type && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({column.type})
                            </span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Results Table */}
          <Card className="flex-1 flex flex-col min-w-0">
            <CardContent className="flex-1 flex flex-col p-4">
              {queryResult.success ? (
                filteredData && filteredData.length > 0 ? (
                  <div className="flex-1 overflow-auto border rounded-lg">
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 bg-muted z-10">
                        <tr>
                          {visibleColumns.map((column) => (
                            <th 
                              key={column.key}
                              className="border-b border-border p-3 text-left text-sm font-medium min-w-[120px]"
                              title={column.name}
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate">{column.name}</span>
                                {column.type && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    ({column.type})
                                  </span>
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((row, index) => (
                          <tr 
                            key={index} 
                            className="hover:bg-muted/50 transition-colors"
                          >
                            {visibleColumns.map((column, cellIndex) => (
                              <td 
                                key={cellIndex} 
                                className="border-b border-border p-3 text-sm max-w-[200px]"
                                title={String(row[column.key] || '')}
                              >
                                <div className="truncate">
                                  {String(row[column.key] || '')}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Table className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium mb-2">No Results Found</h3>
                      <p className="text-sm">
                        {searchTerm ? 
                          `No results match "${searchTerm}"` : 
                          'Your query returned no results.'
                        }
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-red-600 bg-red-50 p-6 rounded-lg max-w-md">
                      <X className="h-8 w-8 mx-auto mb-4" />
                      <strong className="block mb-2 text-lg">Query Error</strong>
                      <p className="text-sm">{queryResult.error}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
