/**
 * String Utilities - Centralized string processing functions
 *
 * This module provides common string manipulation utilities used throughout
 * the application, particularly for schema-driven data processing.
 */

/**
 * Convert display name to snake_case table name
 *
 * Used for generating database table names from user-friendly display names.
 * Follows strict validation rules for database compatibility.
 *
 * @param displayName User-friendly display name (e.g., "Customer Data")
 * @returns Snake_case table name (e.g., "customer_data")
 *
 * @example
 * ```typescript
 * convertToSnakeCase("Customer Orders"); // "customer_orders"
 * convertToSnakeCase("API Keys"); // "api_keys"
 * convertToSnakeCase("Test Table!@#"); // "test_table"
 * ```
 */
export function convertToSnakeCase(displayName: string): string {
  if (!displayName || typeof displayName !== 'string') {
    return 'unnamed_table';
  }

  // Remove leading/trailing whitespace
  let tableName = displayName.trim();

  // Convert to lowercase
  tableName = tableName.toLowerCase();

  // Replace spaces and hyphens with underscores
  tableName = tableName.replace(/[\s\-]+/g, '_');

  // Remove all invalid characters (keep only letters, numbers, underscores)
  tableName = tableName.replace(/[^a-z0-9_]/g, '');

  // Remove consecutive underscores
  tableName = tableName.replace(/_+/g, '_');

  // Remove leading/trailing underscores
  tableName = tableName.replace(/^_+|_+$/g, '');

  // Ensure it starts with a letter or underscore (not a number)
  if (tableName && /^\d/.test(tableName)) {
    tableName = 'table_' + tableName;
  }

  // Handle empty results
  if (!tableName) {
    return 'unnamed_table';
  }

  return tableName;
}

/**
 * Convert camelCase or PascalCase to snake_case
 *
 * @param str CamelCase or PascalCase string
 * @returns snake_case string
 *
 * @example
 * ```typescript
 * camelToSnake("customerData"); // "customer_data"
 * camelToSnake("APIKeys"); // "api_keys"
 * ```
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase
 *
 * @param str snake_case string
 * @returns camelCase string
 *
 * @example
 * ```typescript
 * snakeToCamel("customer_data"); // "customerData"
 * snakeToCamel("api_keys"); // "apiKeys"
 * ```
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert snake_case to PascalCase
 *
 * @param str snake_case string
 * @returns PascalCase string
 *
 * @example
 * ```typescript
 * snakeToPascal("customer_data"); // "CustomerData"
 * snakeToPascal("api_keys"); // "ApiKeys"
 * ```
 */
export function snakeToPascal(str: string): string {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Capitalize first letter of string
 *
 * @param str Input string
 * @returns String with first letter capitalized
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Check if string is valid for database identifier
 *
 * @param str String to validate
 * @returns true if valid database identifier
 */
export function isValidDatabaseIdentifier(str: string): boolean {
  const identifierPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  return identifierPattern.test(str) && str.length > 0 && str.length <= 255;
}
