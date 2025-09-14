/**
 * Entity Generator
 * 
 * Exports functionality to generate entity hooks, adapters, and related files
 * based on the entity blueprint pattern.
 * 
 * NOTE: This is a build/CLI script not intended for client-side use.
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { EntityConfig } from './config';
import { 
  generateTypeDefinitions, 
  generateRestAdapter, 
  generateZustandAdapter,
  generateEntityFactory, 
  generateIndex 
} from './generators';

// Promisified fs functions with correct type
const writeFileAsync = promisify(fs.writeFile) as (path: string, content: string) => Promise<void>;
const mkdirAsync = promisify(fs.mkdir);

/**
 * Generate entity hook files based on configuration
 */
export async function generateEntityHooks(config: EntityConfig): Promise<void> {
  // Ensure the target directory exists
  await mkdirAsync(config.entityDir, { recursive: true });
  
  // Create subdirectories
  const dirs = [
    path.join(config.entityDir, 'hooks'),
    path.join(config.entityDir, 'hooks', 'adapters'),
    path.join(config.entityDir, 'types'),
    path.join(config.entityDir, 'api'),
    path.join(config.entityDir, 'components')
  ];
  
  for (const dir of dirs) {
    await mkdirAsync(dir, { recursive: true });
  }
  
  // Generate entity type definitions
  await generateTypeDefinitions(config, writeFileAsync);
  
  // Generate adapter implementations
  if (config.adapters.includes('rest')) {
    await generateRestAdapter(config, writeFileAsync);
  }
  
  if (config.adapters.includes('zustand')) {
    await generateZustandAdapter(config, writeFileAsync);
  }
  
  // Generate entity factory
  await generateEntityFactory(config, writeFileAsync);
  
  // Generate index exports
  await generateIndex(config, writeFileAsync);
  
  console.log(`✅ Entity hooks generated for ${config.entityNameCapitalized}`);
}

// Re-export configuration types
export * from './config'; 