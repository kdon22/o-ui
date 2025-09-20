/**
 * Simple SQL Parser - Basic WHERE clause parsing for query testing
 * Supports simple conditions like: WHERE column = 'value' AND column2 > 123
 */

export interface ParsedQuery {
  tableName: string;
  columns: string[];
  whereConditions: WhereCondition[];
  isValid: boolean;
  error?: string;
}

export interface WhereCondition {
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'NOT LIKE';
  value: string | number | boolean;
  logicalOperator?: 'AND' | 'OR';
}

export function parseSimpleSQL(query: string): ParsedQuery {
  try {
    if (!query || typeof query !== 'string') {
      return {
        tableName: '',
        columns: [],
        whereConditions: [],
        isValid: false,
        error: 'Empty or invalid query string.'
      };
    }
    // Clean up the query
    const cleanQuery = query.trim().replace(/\s+/g, ' ');
    
    // Basic SELECT pattern – REQUIRE bracketed table name [Table Name]
    const selectMatch = cleanQuery.match(/^SELECT\s+(.+?)\s+FROM\s+(\[[^\]]+\])(?:\s+WHERE\s+(.+))?$/i);
    
    if (!selectMatch) {
      return {
        tableName: '',
        columns: [],
        whereConditions: [],
        isValid: false,
        error: 'Invalid SQL syntax. Expected: SELECT columns FROM table [WHERE conditions]'
      };
    }

    const [, columnsStr, rawTableName, whereClause] = selectMatch;
    
    // Parse columns (will throw if invalid)
    const columns = parseColumns(columnsStr);
    
    // Parse WHERE conditions
    const whereConditions = whereClause ? parseWhereClause(whereClause) : [];
    const hadWhereClause = Boolean(whereClause);
    
    // If a WHERE keyword was provided but we could not parse any conditions,
    // surface a clear error instead of silently returning all rows.
    if (hadWhereClause && whereConditions.length === 0) {
      return {
        tableName: rawTableName.trim().replace(/^\[|\]$|^"|"$|^`|`$/g, ''),
        columns,
        whereConditions,
        isValid: false,
        error: 'Invalid WHERE clause. Columns must be bracketed like [Column Name] and use operators (=, !=, >, <, >=, <=, LIKE).'
      };
    }

    return {
      // Normalize table: support [table name] syntax
      tableName: rawTableName.trim().replace(/^\[|\]$|^"|"$|^`|`$/g, ''),
      columns,
      whereConditions,
      isValid: true
    };
    
  } catch (error) {
    return {
      tableName: '',
      columns: [],
      whereConditions: [],
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error'
    };
  }
}

function parseColumns(columnsStr: string): string[] {
  const trimmed = columnsStr.trim();
  
  // Handle SELECT *
  if (trimmed === '*' || trimmed === '[*]') {
    return ['*'];
  }
  
  // Handle column list – REQUIRE each column to be bracketed: [Column]
  const tokens = trimmed.split(',').map(col => col.trim());
  if (tokens.length === 0) return [];
  const invalid = tokens.find(t => !/^\[[^\]]+\]$/.test(t));
  if (invalid) {
    throw new Error(`Invalid column selector "${invalid}". Columns must be written as [Column Name] or use *.`);
  }
  return tokens.map(t => t.replace(/^\[|\]$/g, ''));
}

function parseWhereClause(whereClause: string): WhereCondition[] {
  const conditions: WhereCondition[] = [];
  
  // Remove parentheses – our evaluator processes left-to-right with explicit ops
  const normalized = whereClause.replace(/[()]/g, ' ').trim();
  
  // Split by AND/OR (after normalization)
  const parts = normalized.split(/\s+(AND|OR)\s+/i);
  
  for (let i = 0; i < parts.length; i += 2) {
    const conditionStr = parts[i].trim();
    const logicalOp = i + 1 < parts.length ? parts[i + 1].toUpperCase() as 'AND' | 'OR' : undefined;
    
    const condition = parseCondition(conditionStr);
    if (condition) {
      condition.logicalOperator = logicalOp;
      conditions.push(condition);
    }
  }
  
  return conditions;
}

function parseCondition(conditionStr: string): WhereCondition | null {
  // REQUIRE bracketed column identifiers: [Column Name]
  const match = conditionStr.match(/^\[([^\]]+)\]\s*(=|!=|>=|<=|>|<|LIKE|NOT\s+LIKE)\s*(.+)$/i);

  if (!match) {
    return null;
  }

  const [, bracketed, dquoted, bquoted, bare, operator, valueStr] = match;
  const columnRaw = bracketed || dquoted || bquoted || bare || '';
  const value = parseValue(valueStr.trim());

  return {
    column: columnRaw.trim(),
    operator: operator.toUpperCase().replace(/\s+/g, ' ') as WhereCondition['operator'],
    value
  };
}

function parseValue(valueStr: string): string | number | boolean {
  // Remove quotes
  if ((valueStr.startsWith('"') && valueStr.endsWith('"')) ||
      (valueStr.startsWith("'") && valueStr.endsWith("'"))) {
    return valueStr.slice(1, -1);
  }
  
  // Try to parse as number
  const num = Number(valueStr);
  if (!isNaN(num)) {
    return num;
  }
  
  // Try to parse as boolean
  if (valueStr.toLowerCase() === 'true') return true;
  if (valueStr.toLowerCase() === 'false') return false;
  
  // Return as string
  return valueStr;
}

export function applyWhereConditions(data: Record<string, any>[], conditions: WhereCondition[]): Record<string, any>[] {
  if (conditions.length === 0) {
    return data;
  }
  
  return data.filter(row => {
    let result = true;
    let currentLogicalOp: 'AND' | 'OR' = 'AND';
    
    for (const condition of conditions) {
      // Case-insensitive column matching
      const columnName = condition.column;
      const rowValue = findColumnValue(row, columnName);
      const conditionResult = evaluateCondition(rowValue, condition);
      
      if (currentLogicalOp === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }
      
      if (condition.logicalOperator) {
        currentLogicalOp = condition.logicalOperator;
      }
    }
    
    return result;
  });
}

function findColumnValue(row: Record<string, any>, columnName: string): any {
  // First try exact match
  if (row[columnName] !== undefined) {
    return row[columnName];
  }
  
  // Then try case-insensitive match
  const lowerColumnName = columnName.toLowerCase();
  for (const [key, value] of Object.entries(row)) {
    if (key.toLowerCase() === lowerColumnName) {
      return value;
    }
  }
  
  return undefined;
}

function evaluateCondition(rowValue: any, condition: WhereCondition): boolean {
  const { operator, value } = condition;
  
  switch (operator) {
    case '=':
      return rowValue == value; // Loose equality for type coercion
    case '!=':
      return rowValue != value;
    case '>':
      return Number(rowValue) > Number(value);
    case '<':
      return Number(rowValue) < Number(value);
    case '>=':
      return Number(rowValue) >= Number(value);
    case '<=':
      return Number(rowValue) <= Number(value);
    case 'LIKE':
      return String(rowValue).toLowerCase().includes(String(value).toLowerCase());
    case 'NOT LIKE':
      return !String(rowValue).toLowerCase().includes(String(value).toLowerCase());
    default:
      return false;
  }
}
