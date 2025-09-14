#!/usr/bin/env node
/**
 * Entity Generator CLI
 * 
 * Command-line utility for generating entity hooks, adapters, and related files.
 * This script should be run from the project root.
 * 
 * Example usage:
 * $ npm run generate:entity -- --name=product
 */

import { generateEntityHooks } from './generators/entity-generator';
import { createDefaultConfig, validateConfig } from './generators/entity-generator/config';

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: Record<string, string> = {};
  
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      options[key] = value;
    }
  });
  
  // Validate required arguments
  if (!options.name) {
    console.error('Error: Entity name is required. Use --name=<entity-name>');
    process.exit(1);
  }
  
  // Create config with defaults
  const config = createDefaultConfig(options.name);
  
  // Override defaults with command line options
  if (options.dir) {
    config.entityDir = options.dir;
  }
  
  if (options.adapters) {
    config.adapters = options.adapters.split(',') as ('rest' | 'zustand' | 'graphql' | 'offline' | 'mock')[];
  }
  
  // Validate configuration
  const errors = validateConfig(config);
  if (errors.length > 0) {
    console.error('Error: Invalid configuration:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  
  // Generate entity hooks
  try {
    await generateEntityHooks(config);
    console.log(`✅ Generated ${config.entityNameCapitalized} entity files in ${config.entityDir}`);
  } catch (error: unknown) {
    console.error('Error generating entity hooks:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the script
main().catch((error: unknown) => {
  console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}); 