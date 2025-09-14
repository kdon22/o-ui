/**
 * Query Variables Panel - Input fields for query variables
 * Shows input fields for {variableName} placeholders found in queries
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/generalUtils';
import type { QueryVariable } from '../hooks/use-query-variables';

export interface QueryVariablesPanelProps {
  variables: QueryVariable[];
  onVariableChange: (name: string, value: string) => void;
  className?: string;
  compact?: boolean;
}

export function QueryVariablesPanel({
  variables,
  onVariableChange,
  className,
  compact = false
}: QueryVariablesPanelProps) {
  if (variables.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Query Variables</span>
          <Badge variant="secondary" className="text-xs">
            {variables.length}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {variables.map((variable) => (
            <div key={variable.name} className="space-y-1">
              <Label htmlFor={`var-${variable.name}`} className="text-xs font-medium">
                {variable.name}
              </Label>
              <Input
                id={`var-${variable.name}`}
                value={variable.value}
                onChange={(e) => onVariableChange(variable.name, e.target.value)}
                placeholder={variable.placeholder}
                className="text-sm"
                size="sm"
              />
            </div>
          ))}
        </div>
        
        {variables.some(v => !v.value.trim()) && (
          <div className="flex items-center gap-2 text-xs text-amber-600">
            <AlertCircle className="h-3 w-3" />
            Fill in all variables to run the query
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Settings className="h-4 w-4" />
          Query Variables
          <Badge variant="secondary" className="text-xs">
            {variables.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {variables.map((variable) => (
            <div key={variable.name} className="space-y-1">
              <Label htmlFor={`var-${variable.name}`} className="text-sm font-medium">
                {variable.name}
              </Label>
              <Input
                id={`var-${variable.name}`}
                value={variable.value}
                onChange={(e) => onVariableChange(variable.name, e.target.value)}
                placeholder={variable.placeholder}
                className="font-mono text-sm"
              />
            </div>
          ))}
        </div>
        
        {variables.some(v => !v.value.trim()) && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
            <AlertCircle className="h-4 w-4" />
            Fill in all variables to run the query
          </div>
        )}
      </CardContent>
    </Card>
  );
}
