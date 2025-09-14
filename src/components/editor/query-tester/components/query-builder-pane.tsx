/**
 * Query Builder Pane - Left side of split interface
 * Modern query editor with syntax highlighting and smart features
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TextArea } from '@/components/ui/text-area';
import { Badge } from '@/components/ui/badge';
import { Play, Copy, RotateCcw, BookOpen, Database, Loader2 } from 'lucide-react';
import { TableTreeSelector } from './table-tree-selector';

interface DataTable {
  id: string;
  name: string;
  tableName?: string;
  description?: string;
  isActive: boolean;
}

interface QueryBuilderPaneProps {
  queryText: string;
  onQueryChange: (query: string) => void;
  onExecute: () => void;
  onReset: () => void;
  onCopyToEditor: () => void;
  onShowExamples: () => void;
  isExecuting: boolean;
  selectedTable: DataTable | null;
  availableTables: DataTable[];
  onTableSelect: (tableId: string) => void;
  showExamples: boolean;
  tablesLoading?: boolean;
  compact?: boolean;
}

export function QueryBuilderPane({
  queryText,
  onQueryChange,
  onExecute,
  onReset,
  onCopyToEditor,
  onShowExamples,
  isExecuting,
  selectedTable,
  availableTables,
  onTableSelect,
  showExamples,
  tablesLoading = false,
  compact = false
}: QueryBuilderPaneProps) {
  if (compact) {
    return (
      <div className="h-full flex flex-col p-4 space-y-3">
        {/* Compact Header with Table Selection */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="font-medium">Query Builder</span>
                {selectedTable && (
                  <Badge variant="outline" className="text-xs">
                    {selectedTable.name}
                  </Badge>
                )}
              </div>
              
              {/* Inline Table Selector */}
              <select
                value={selectedTable?.id || ''}
                onChange={(e) => onTableSelect(e.target.value)}
                className="text-sm border rounded px-2 py-1 bg-background"
              >
                <option value="">Select table...</option>
                {availableTables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Compact Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={onExecute}
                disabled={isExecuting || !queryText.trim()}
                className="flex items-center gap-2"
                size="sm"
              >
                {isExecuting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isExecuting ? 'Running...' : 'Run'}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onCopyToEditor} 
                size="sm"
              >
                <Copy className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onReset} 
                size="sm"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <Button 
                variant={showExamples ? "default" : "outline"}
                onClick={onShowExamples} 
                size="sm"
              >
                <BookOpen className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Compact Query Editor */}
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-4">
            <TextArea
              value={queryText}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={
                selectedTable 
                  ? `SELECT * FROM ${selectedTable.tableName}` 
                  : "SELECT columns FROM table WHERE conditions"
              }
              className="font-mono text-sm flex-1 resize-none"
              style={{ minHeight: '120px' }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5" />
            Query Builder
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={onExecute}
          disabled={isExecuting || !queryText.trim()}
          className="flex items-center gap-2"
          size="sm"
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
          onClick={onCopyToEditor} 
          className="flex items-center gap-2"
          size="sm"
        >
          <Copy className="h-4 w-4" />
          Copy to Editor
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onReset} 
          className="flex items-center gap-2"
          size="sm"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        
        <Button 
          variant={showExamples ? "default" : "outline"}
          onClick={onShowExamples} 
          className="flex items-center gap-2"
          size="sm"
        >
          <BookOpen className="h-4 w-4" />
          Examples
        </Button>
      </div>

      {/* Query Editor */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Query Editor</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4">
          <TextArea
            value={queryText}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={
              selectedTable 
                ? `SELECT * FROM ${selectedTable.tableName}` 
                : "SELECT columns FROM table WHERE conditions"
            }
            className="font-mono text-sm flex-1 min-h-[200px] resize-none"
          />
        </CardContent>
      </Card>

      {/* Table Selection - Tree View */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Select Table
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <TableTreeSelector
            tables={availableTables}
            selectedTableId={selectedTable?.id || ''}
            onTableSelect={onTableSelect}
            isLoading={tablesLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
