/**
 * Smart Examples Panel - Contextual examples overlay
 * Searchable, categorized examples that adapt to selected table
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Search, BookOpen, Copy } from 'lucide-react';

interface DataTable {
  id: string;
  name: string;
  tableName?: string;
  description?: string;
  isActive: boolean;
}

interface QueryExample {
  id: string;
  title: string;
  description: string;
  query: string;
  explanation: string;
  category: 'basic' | 'filtering' | 'advanced' | 'parameters';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

interface SmartExamplesPanelProps {
  selectedTable: DataTable | null;
  onExampleSelect: (query: string) => void;
  onClose: () => void;
}

export function SmartExamplesPanel({ 
  selectedTable, 
  onExampleSelect, 
  onClose 
}: SmartExamplesPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Generate contextual examples based on selected table
  const examples = useMemo((): QueryExample[] => {
    const tableName = selectedTable?.name || 'YourTable';
    const tableRef = /[^A-Za-z0-9_]/.test(tableName) ? `[${tableName}]` : tableName;
    
    return [
      {
        id: '1',
        title: 'Select All Records',
        description: 'Get all data from the table',
        query: `SELECT * FROM ${tableRef}`,
        explanation: `Retrieves all columns and rows from ${tableRef}`,
        category: 'basic',
        difficulty: 'beginner',
        tags: ['select', 'all', 'basic']
      },
      {
        id: '2',
        title: 'Select Specific Columns',
        description: 'Choose only the columns you need',
        query: `SELECT id, name, status FROM ${tableRef}`,
        explanation: `Gets only the id, name, and status columns from ${tableRef}`,
        category: 'basic',
        difficulty: 'beginner',
        tags: ['select', 'columns', 'specific']
      },
      {
        id: '3',
        title: 'Filter by Text Value',
        description: 'Find records matching text criteria',
        query: `SELECT * FROM ${tableRef} WHERE status = "active"`,
        explanation: `Finds all records where status equals "active"`,
        category: 'filtering',
        difficulty: 'beginner',
        tags: ['filter', 'text', 'equals']
      },
      {
        id: '4',
        title: 'Filter by Number Range',
        description: 'Find records within a numeric range',
        query: `SELECT * FROM ${tableRef} WHERE age > 18 AND age < 65`,
        explanation: `Finds records where age is between 18 and 65`,
        category: 'filtering',
        difficulty: 'intermediate',
        tags: ['filter', 'number', 'range', 'and']
      },
      {
        id: '5',
        title: 'Multiple Conditions (OR)',
        description: 'Find records matching any of several criteria',
        query: `SELECT * FROM ${tableRef} WHERE status = "active" OR status = "pending"`,
        explanation: `Finds records where status is either "active" or "pending"`,
        category: 'filtering',
        difficulty: 'intermediate',
        tags: ['filter', 'multiple', 'or', 'conditions']
      },
      {
        id: '6',
        title: 'Complex Filtering',
        description: 'Combine multiple conditions with AND/OR',
        query: `SELECT * FROM ${tableRef} WHERE (status = "active" OR status = "pending") AND age > 21`,
        explanation: `Finds active or pending records where age is over 21`,
        category: 'advanced',
        difficulty: 'advanced',
        tags: ['filter', 'complex', 'parentheses', 'logic']
      },
      {
        id: '7',
        title: 'Using Parameters',
        description: 'Create reusable queries with parameters',
        query: `SELECT * FROM ${tableRef} WHERE id = {recordId}`,
        explanation: `Finds a specific record using a parameter for the ID`,
        category: 'parameters',
        difficulty: 'intermediate',
        tags: ['parameters', 'dynamic', 'reusable']
      },
      {
        id: '8',
        title: 'Multiple Parameters',
        description: 'Use several parameters in one query',
        query: `SELECT * FROM ${tableRef} WHERE status = {userStatus} AND age > {minAge}`,
        explanation: `Filters by status and minimum age using parameters`,
        category: 'parameters',
        difficulty: 'advanced',
        tags: ['parameters', 'multiple', 'dynamic']
      }
    ];
  }, [selectedTable]);

  // Filter examples based on search and category
  const filteredExamples = useMemo(() => {
    return examples.filter(example => {
      const matchesSearch = searchTerm === '' || 
        example.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        example.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        example.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || example.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [examples, searchTerm, selectedCategory]);

  const categories = [
    { id: 'all', label: 'All Examples', count: examples.length },
    { id: 'basic', label: 'Basic', count: examples.filter(e => e.category === 'basic').length },
    { id: 'filtering', label: 'Filtering', count: examples.filter(e => e.category === 'filtering').length },
    { id: 'advanced', label: 'Advanced', count: examples.filter(e => e.category === 'advanced').length },
    { id: 'parameters', label: 'Parameters', count: examples.filter(e => e.category === 'parameters').length }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Smart Query Examples
              {selectedTable && (
                <Badge variant="outline" className="ml-2">
                  {selectedTable.name}
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search examples..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Categories */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {categories.map(category => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80 transition-colors"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.label} ({category.count})
              </Badge>
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-auto">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredExamples.map(example => (
              <Card key={example.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{example.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {example.description}
                      </p>
                    </div>
                    <Badge 
                      className={`ml-2 ${getDifficultyColor(example.difficulty)}`}
                    >
                      {example.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="bg-muted p-3 rounded font-mono text-sm">
                    {example.query}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {example.explanation}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex gap-1 flex-wrap">
                      {example.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => onExampleSelect(example.query)}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-3 w-3" />
                      Use This
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredExamples.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No examples found</h3>
              <p className="text-sm">
                Try adjusting your search terms or category filter
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
