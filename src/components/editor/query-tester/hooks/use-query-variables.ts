/**
 * Query Variables Hook - Handles variable detection and substitution
 * Detects {variableName} placeholders and manages test values
 */

'use client';

import { useState, useEffect, useMemo } from 'react';

export interface QueryVariable {
  name: string;
  value: string;
  placeholder?: string;
}

export function useQueryVariables(queryText: string) {
  const [variables, setVariables] = useState<QueryVariable[]>([]);

  // Extract variable names from query text using {variableName} pattern
  const detectedVariables = useMemo(() => {
    const variablePattern = /\{(\w+)\}/g;
    const matches: string[] = [];
    let match;

    while ((match = variablePattern.exec(queryText)) !== null) {
      const variableName = match[1];
      if (!matches.includes(variableName)) {
        matches.push(variableName);
      }
    }

    return matches;
  }, [queryText]);

  // Update variables state when detected variables change
  useEffect(() => {
    setVariables(prevVariables => {
      const newVariables: QueryVariable[] = [];

      // Keep existing values for variables that still exist
      detectedVariables.forEach(name => {
        const existing = prevVariables.find(v => v.name === name);
        newVariables.push({
          name,
          value: existing?.value || '',
          placeholder: `Enter ${name} value...`
        });
      });

      return newVariables;
    });
  }, [detectedVariables]);

  // Update a specific variable value
  const updateVariable = (name: string, value: string) => {
    setVariables(prev => 
      prev.map(v => v.name === name ? { ...v, value } : v)
    );
  };

  // Substitute variables in query text with their values
  const substituteVariables = (query: string): string => {
    let substitutedQuery = query;

    variables.forEach(variable => {
      if (variable.value.trim()) {
        // Replace {variableName} with the actual value
        // Add quotes if the value doesn't already have them and looks like a string
        const value = variable.value.trim();
        const needsQuotes = !value.startsWith('"') && !value.startsWith("'") && isNaN(Number(value));
        const finalValue = needsQuotes ? `"${value}"` : value;
        
        substitutedQuery = substitutedQuery.replace(
          new RegExp(`\\{${variable.name}\\}`, 'g'), 
          finalValue
        );
      }
    });

    return substitutedQuery;
  };

  // Check if all variables have values
  const hasAllVariableValues = variables.length === 0 || variables.every(v => v.value.trim() !== '');

  // Get the final query with variables substituted
  const getFinalQuery = (): string => {
    return substituteVariables(queryText);
  };

  return {
    variables,
    hasVariables: variables.length > 0,
    hasAllVariableValues,
    updateVariable,
    getFinalQuery,
    substituteVariables
  };
}
