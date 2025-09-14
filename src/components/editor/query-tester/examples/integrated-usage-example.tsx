/**
 * Integrated Query Interface Usage Examples
 * 
 * Shows how to use the new tree-integrated query interface
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  QueryTestBench, 
  ThreePanelQueryInterface, 
  IntegratedQueryInterface 
} from '../index';

export function IntegratedUsageExample() {
  const [generatedQuery, setGeneratedQuery] = useState<string>('');
  const [activeLayout, setActiveLayout] = useState<'three-panel' | 'integrated'>('three-panel');

  const handleQueryGenerated = (query: string) => {
    setGeneratedQuery(query);
    console.log('Generated query:', query);
  };

  return (
    <div className="h-screen flex flex-col p-4 space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Query Builder with Integrated Tree View</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Layout:</span>
              <div className="flex gap-1">
                <Button
                  variant={activeLayout === 'three-panel' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveLayout('three-panel')}
                >
                  Three Panel
                </Button>
                <Button
                  variant={activeLayout === 'integrated' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveLayout('integrated')}
                >
                  Integrated
                </Button>
              </div>
            </div>
            
            {generatedQuery && (
              <Badge variant="secondary">
                Query Generated: {generatedQuery.slice(0, 30)}...
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Query Interface */}
      <div className="flex-1">
        <QueryTestBench
          layout={activeLayout}
          onQueryGenerated={handleQueryGenerated}
          className="h-full"
        />
      </div>

      {/* Generated Query Output */}
      {generatedQuery && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generated Query</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-3 rounded text-sm font-mono">
              {generatedQuery}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Example usage in different contexts
export function QueryBuilderExamples() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Query Builder Examples</h2>
        <p className="text-muted-foreground mb-6">
          The new query builder integrates the table tree view for a seamless experience.
        </p>
      </div>

      <Tabs defaultValue="three-panel" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="three-panel">Three Panel Layout</TabsTrigger>
          <TabsTrigger value="integrated">Integrated Layout</TabsTrigger>
        </TabsList>
        
        <TabsContent value="three-panel" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Three-Panel Interface</CardTitle>
              <p className="text-sm text-muted-foreground">
                Professional IDE-style with table tree, query builder, and live results
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <ThreePanelQueryInterface
                  onQueryGenerated={(query) => console.log('Three-panel query:', query)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="integrated" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrated Interface</CardTitle>
              <p className="text-sm text-muted-foreground">
                Step-by-step workflow: Table → Query → Results
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <IntegratedQueryInterface
                  onQueryGenerated={(query) => console.log('Integrated query:', query)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Direct component usage examples
export const USAGE_EXAMPLES = {
  // Basic usage
  basic: `
import { QueryTestBench } from '@/components/editor/query-tester';

function MyQueryPage() {
  return (
    <div className="h-screen">
      <QueryTestBench 
        layout="three-panel"
        onQueryGenerated={(query) => console.log(query)} 
      />
    </div>
  );
}`,

  // Advanced usage with custom handler
  advanced: `
import { ThreePanelQueryInterface } from '@/components/editor/query-tester';

function AdvancedQueryBuilder() {
  const handleQueryGenerated = (query: string) => {
    // Send to business rules editor
    setBusinessRuleCode(query);
    
    // Or save to workspace
    saveQueryToWorkspace(query);
  };

  return (
    <ThreePanelQueryInterface
      onQueryGenerated={handleQueryGenerated}
      className="border rounded-lg"
    />
  );
}`,

  // Mobile-friendly integrated layout
  mobile: `
import { IntegratedQueryInterface } from '@/components/editor/query-tester';

function MobileQueryBuilder() {
  return (
    <div className="h-full">
      <IntegratedQueryInterface
        onQueryGenerated={(query) => {
          // Handle mobile query generation
          navigator.share?.({ text: query });
        }}
      />
    </div>
  );
}`
};
