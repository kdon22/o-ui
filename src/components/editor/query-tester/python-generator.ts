/**
 * Python Code Generator for Query Test Bench
 * 
 * Converts simple business rules query syntax to Python functions
 * that can be executed in your backend system.
 */

export interface QueryAST {
  type: 'SELECT';
  columns: string[];
  table: string;
  conditions?: ConditionAST[];
}

export interface ConditionAST {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=';
  value: string | number | boolean;
  logicalOperator?: 'AND' | 'OR';
}

export class QueryPythonGenerator {
  
  /**
   * Parse simple query syntax into AST
   */
  parseQuery(query: string): QueryAST {
    // Remove extra whitespace and normalize
    const normalizedQuery = query.trim().replace(/\s+/g, ' ');
    
    // Match SELECT [columns] FROM table WHERE [conditions]
    const selectMatch = normalizedQuery.match(/SELECT\s+\[(.*?)\]\s+FROM\s+(.*?)(?:\s+WHERE\s+\[(.*?)\])?$/i);
    
    if (!selectMatch) {
      throw new Error('Invalid query format. Use: SELECT [columns] FROM table WHERE [conditions]');
    }

    const [, columnsStr, table, conditionsStr] = selectMatch;
    
    // Parse columns
    const columns = columnsStr.split(',').map(col => col.trim());
    
    // Parse conditions if present
    let conditions: ConditionAST[] = [];
    if (conditionsStr) {
      conditions = this.parseConditions(conditionsStr);
    }

    return {
      type: 'SELECT',
      columns,
      table: table.trim(),
      conditions: conditions.length > 0 ? conditions : undefined
    };
  }

  /**
   * Parse condition string into condition AST
   */
  private parseConditions(conditionsStr: string): ConditionAST[] {
    const conditions: ConditionAST[] = [];
    
    // Split by AND/OR while preserving the operators
    const parts = conditionsStr.split(/\s+(and|or)\s+/i);
    
    for (let i = 0; i < parts.length; i += 2) {
      const conditionStr = parts[i].trim();
      const logicalOp = parts[i + 1]?.trim().toUpperCase() as 'AND' | 'OR';
      
      const condition = this.parseCondition(conditionStr);
      if (condition) {
        condition.logicalOperator = logicalOp;
        conditions.push(condition);
      }
    }
    
    return conditions;
  }

  /**
   * Parse single condition
   */
  private parseCondition(conditionStr: string): ConditionAST | null {
    // Match: field operator value
    const match = conditionStr.match(/(\w+)\s*([=><]+|!=)\s*(.+)/);
    if (!match) return null;
    
    const [, field, operator, valueStr] = match;
    
    // Parse value
    let value: string | number | boolean = valueStr.trim();
    
    // Remove quotes from strings
    if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (typeof value === 'string' && value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    } else if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    } else if (typeof value === 'string' && !isNaN(Number(value))) {
      value = Number(value);
    } else if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
      // Keep parameter placeholders as strings for now
      value = value;
    }
    
    return {
      field: field.trim(),
      operator: operator as any,
      value
    };
  }

  /**
   * Generate Python function from query AST
   */
  generatePythonFunction(ast: QueryAST, functionName?: string): string {
    const funcName = functionName || this.generateFunctionName(ast.table);
    const tableVar = ast.table.toLowerCase().replace(/\s+/g, '_');
    
    let code = `def ${funcName}(`;
    
    // Add parameters for any placeholders
    const parameters = this.extractParameters(ast);
    if (parameters.length > 0) {
      code += parameters.join(', ');
    }
    
    code += `):\n`;
    code += `    """\n`;
    code += `    Query ${ast.table} table\n`;
    code += `    \n`;
    code += `    Returns:\n`;
    code += `        List[Dict]: Filtered and selected data\n`;
    code += `    """\n`;
    code += `    \n`;
    
    // Import statements (if needed)
    code += `    # Import required modules\n`;
    code += `    from typing import List, Dict, Any\n`;
    code += `    \n`;
    
    // Load data
    code += `    # Load data from ${ast.table}\n`;
    code += `    data = get_table_data("${ast.table}")\n`;
    code += `    \n`;
    
    // Apply filters
    if (ast.conditions && ast.conditions.length > 0) {
      code += `    # Apply filters\n`;
      code += `    filtered_data = []\n`;
      code += `    for row in data:\n`;
      code += `        if ${this.generateConditionCode(ast.conditions)}:\n`;
      code += `            filtered_data.append(row)\n`;
      code += `    \n`;
    } else {
      code += `    # No filters applied\n`;
      code += `    filtered_data = data\n`;
      code += `    \n`;
    }
    
    // Select columns
    code += `    # Select specified columns: ${ast.columns.join(', ')}\n`;
    code += `    result = []\n`;
    code += `    for row in filtered_data:\n`;
    code += `        selected_row = {\n`;
    
    ast.columns.forEach(column => {
      code += `            "${column}": row.get("${column}"),\n`;
    });
    
    code += `        }\n`;
    code += `        result.append(selected_row)\n`;
    code += `    \n`;
    code += `    return result\n`;
    
    return code;
  }

  /**
   * Generate helper functions for the Python code
   */
  generateHelperFunctions(): string {
    return `# Helper functions for query execution

def get_table_data(table_name: str) -> List[Dict[str, Any]]:
    """
    Load table data from your data source
    
    Args:
        table_name: Name of the table to load
        
    Returns:
        List of dictionaries representing table rows
    """
    # TODO: Implement your data loading logic here
    # This could connect to your database, API, or file system
    
    # Example implementation:
    # if table_name == "Agent Data":
    #     return load_agent_data()
    # elif table_name == "Customer Data":
    #     return load_customer_data()
    
    raise NotImplementedError(f"Data loading for table '{table_name}' not implemented")

def execute_query(query_function, **params):
    """
    Execute a query function with parameters
    
    Args:
        query_function: The generated query function
        **params: Parameters to pass to the function
        
    Returns:
        Query results
    """
    try:
        return query_function(**params)
    except Exception as e:
        print(f"Query execution error: {e}")
        return []

`;
  }

  /**
   * Extract parameter names from conditions
   */
  private extractParameters(ast: QueryAST): string[] {
    const parameters: string[] = [];
    
    if (ast.conditions) {
      for (const condition of ast.conditions) {
        if (typeof condition.value === 'string' && 
            condition.value.startsWith('{') && 
            condition.value.endsWith('}')) {
          const paramName = condition.value.slice(1, -1);
          if (!parameters.includes(paramName)) {
            parameters.push(paramName);
          }
        }
      }
    }
    
    return parameters;
  }

  /**
   * Generate function name from table name
   */
  private generateFunctionName(tableName: string): string {
    return 'query_' + tableName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  }

  /**
   * Generate Python condition code
   */
  private generateConditionCode(conditions: ConditionAST[]): string {
    const conditionParts: string[] = [];
    
    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];
      let conditionCode = '';
      
      // Handle parameter placeholders
      let value = condition.value;
      if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        value = value.slice(1, -1); // Remove braces for parameter name
      } else if (typeof value === 'string') {
        value = `"${value}"`;
      } else if (typeof value === 'boolean') {
        value = value ? 'True' : 'False';
      }
      
      // Convert operator
      const operator = condition.operator === '=' ? '==' : condition.operator;
      
      conditionCode = `row.get("${condition.field}") ${operator} ${value}`;
      conditionParts.push(conditionCode);
      
      // Add logical operator for next condition
      if (i < conditions.length - 1 && condition.logicalOperator) {
        conditionParts.push(condition.logicalOperator.toLowerCase());
      }
    }
    
    return conditionParts.join(' ');
  }

  /**
   * Generate complete Python module with query and helpers
   */
  generateCompleteModule(query: string, moduleName?: string): string {
    const ast = this.parseQuery(query);
    const funcName = this.generateFunctionName(ast.table);
    const modName = moduleName || `${funcName}_module`;
    
    let code = `"""
${modName.toUpperCase()}

Auto-generated query module from business rules syntax:
${query}

Generated on: ${new Date().toISOString()}
"""

from typing import List, Dict, Any

`;
    
    // Add helper functions
    code += this.generateHelperFunctions();
    code += '\n';
    
    // Add main query function
    code += this.generatePythonFunction(ast, funcName);
    code += '\n';
    
    // Add example usage
    code += `# Example usage:\n`;
    code += `if __name__ == "__main__":\n`;
    code += `    # Execute the query\n`;
    
    const parameters = this.extractParameters(ast);
    if (parameters.length > 0) {
      code += `    results = ${funcName}(`;
      code += parameters.map(param => `${param}=None`).join(', ');
      code += `)\n`;
    } else {
      code += `    results = ${funcName}()\n`;
    }
    
    code += `    \n`;
    code += `    # Print results\n`;
    code += `    print(f"Found {len(results)} results:")\n`;
    code += `    for i, row in enumerate(results):\n`;
    code += `        print(f"  {i+1}: {row}")\n`;
    
    return code;
  }
}

// Export singleton instance
export const queryPythonGenerator = new QueryPythonGenerator();
