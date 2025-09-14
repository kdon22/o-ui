/**
 * Short ID Generator for Nodes, Rules, and Classes
 * 
 * Generates short, human-readable IDs for navigation:
 * - Nodes: n{6 characters} (e.g., "n4b7x2")
 * - Rules: r{6 characters} (e.g., "r8k9l3")
 * - Classes: c{6 characters} (e.g., "c3f5h8")
 * 
 * Uses lowercase letters and numbers (excluding confusing chars like 0, o, i, 1, l)
 */

// Character set excluding confusing characters (lowercase)
const SAFE_CHARS = '23456789abcdefghjklmnpqrstuvwxyz';

/**
 * Generate a random string of specified length using safe characters
 */
function generateRandomString(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += SAFE_CHARS.charAt(Math.floor(Math.random() * SAFE_CHARS.length));
  }
  return result;
}

/**
 * Generate a short ID for a node
 * Format: n{6 characters} (e.g., "n4b7x2")
 */
export function generateNodeShortId(): string {
  return 'n' + generateRandomString(6);
}

/**
 * Generate a short ID for a rule
 * Format: r{6 characters} (e.g., "r8k9l3")
 */
export function generateRuleShortId(): string {
  return 'r' + generateRandomString(6);
}

/**
 * Generate a short ID for a class
 * Format: c{6 characters} (e.g., "c3f5h8")
 */
export function generateClassShortId(): string {
  return 'c' + generateRandomString(6);
}

/**
 * Generate a short ID based on entity type
 */
export function generateShortId(entityType: 'node' | 'rule' | 'class'): string {
  switch (entityType) {
    case 'node':
      return generateNodeShortId();
    case 'rule':
      return generateRuleShortId();
    case 'class':
      return generateClassShortId();
    default:
      throw new Error(`Unsupported entity type: ${entityType}`);
  }
}

/**
 * Validate a short ID format
 */
export function validateShortId(shortId: string, entityType: 'node' | 'rule' | 'class'): boolean {
  const prefixMap = { node: 'n', rule: 'r', class: 'c' };
  const prefix = prefixMap[entityType];
  const pattern = new RegExp(`^${prefix}[${SAFE_CHARS}]{6}$`);
  return pattern.test(shortId);
}

/**
 * Extract entity type from short ID
 */
export function getEntityTypeFromShortId(shortId: string): 'node' | 'rule' | 'class' | null {
  if (shortId.startsWith('n') && shortId.length === 7) {
    return 'node';
  }
  if (shortId.startsWith('r') && shortId.length === 7) {
    return 'rule';
  }
  if (shortId.startsWith('c') && shortId.length === 7) {
    return 'class';
  }
  return null;
}

/**
 * Generate a unique short ID with retry logic
 * This should be used with database uniqueness checks
 */
export async function generateUniqueShortId(
  entityType: 'node' | 'rule' | 'class',
  checkExists: (shortId: string) => Promise<boolean>,
  maxRetries: number = 10
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const shortId = generateShortId(entityType);
    const exists = await checkExists(shortId);
    if (!exists) {
      return shortId;
    }
  }
  throw new Error(`Failed to generate unique short ID for ${entityType} after ${maxRetries} attempts`);
} 