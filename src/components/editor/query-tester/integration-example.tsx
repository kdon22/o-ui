/**
 * Integration Example - How to add Query Test Bench to Editor
 * 
 * This shows how to integrate the QueryTestBench into your existing
 * editor system with tabs.
 */

'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QueryTestBench } from './query-test-bench';
import { Database, Code, TestTube } from 'lucide-react';

// Example of how to integrate with your existing editor
export function EditorWithQueryTester() {
  const [activeTab, setActiveTab] = useState('editor');
  const [editorContent, setEditorContent] = useState('');

  const handleQueryGenerated = (query: string) => {
    // When user copies query from test bench, switch to editor and paste it
    setEditorContent(query);
    setActiveTab('editor');
  };

  return (
    <div className="w-full h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Rule Editor
          </TabsTrigger>
          <TabsTrigger value="query-tester" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Query Tester
          </TabsTrigger>
          <TabsTrigger value="rule-tester" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Rule Tester
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="h-full">
          {/* Your existing Monaco editor would go here */}
          <div className="border rounded-lg p-4 h-full">
            <h3 className="text-lg font-medium mb-4">Business Rules Editor</h3>
            <textarea
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              className="w-full h-96 p-3 border rounded font-mono text-sm"
              placeholder="Paste your generated query here or write business rules..."
            />
          </div>
        </TabsContent>

        <TabsContent value="query-tester" className="h-full">
          <QueryTestBench />
        </TabsContent>

        <TabsContent value="rule-tester" className="h-full">
          {/* Your existing rule tester would go here */}
          <div className="border rounded-lg p-4 h-full">
            <h3 className="text-lg font-medium mb-4">Rule Tester</h3>
            <p className="text-muted-foreground">Your existing rule tester component goes here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Simple hook for integrating with your existing editor state
export function useQueryTestBenchIntegration() {
  const [generatedQuery, setGeneratedQuery] = useState<string>('');
  const [generatedPython, setGeneratedPython] = useState<string>('');

  const handleQueryGenerated = (query: string) => {
    setGeneratedQuery(query);
  };

  const handlePythonGenerated = (pythonCode: string) => {
    setGeneratedPython(pythonCode);
  };

  const insertIntoEditor = (editorInstance: any) => {
    // For Monaco editor integration
    if (editorInstance && generatedQuery) {
      const position = editorInstance.getPosition();
      editorInstance.executeEdits('query-tester', [{
        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
        text: generatedQuery
      }]);
    }
  };

  return {
    generatedQuery,
    generatedPython,
    handleQueryGenerated,
    handlePythonGenerated,
    insertIntoEditor
  };
}
