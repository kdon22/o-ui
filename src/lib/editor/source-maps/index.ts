/**
 * Source Maps - Block-based source mapping system
 * 
 * Main exports for the source mapping system that enables smart stepping
 * by mapping business logic blocks to Python execution points.
 */

// Core classes
export { BlockSourceMap } from './block-source-map'
export { BusinessLineMapper } from './business-line-mapper'

// Utility functions
export {
  createBlockSourceMapFromSteps,
  mergeBlockSourceMaps
} from './block-source-map'

export {
  createLineMapperFromSteps,
  createLineMapperFromBlocks,
  findBusinessLineGaps,
  optimizeMappings
} from './business-line-mapper'
