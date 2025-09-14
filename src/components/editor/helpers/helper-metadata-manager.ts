/**
 * Helper Metadata Manager - Bulletproof Persistence for Helper Blocks
 * 
 * Embeds helper configuration as structured comments in source code:
 * // HELPER_START:helper-1753044853124-6jiprnthh:find-remark-helper
 * // {"vendorId": "sabre", "remarkType": "general", "includeValidation": true}
 * add_remark_to_systems(["sabre"])
 * // HELPER_END:helper-1753044853124-6jiprnthh:find-remark-helper
 */

import type * as monaco from 'monaco-editor'

export interface HelperMetadata {
  id: string
  schemaId: string
  data: Record<string, any>
  startLine: number
  endLine: number
  content: string
}

export interface HelperValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  migratedData?: Record<string, any>
}

export type DataMigrationFunction = (data: any, fromVersion: string, toVersion: string) => any

export class HelperMetadataManager {
  private editor: monaco.editor.IStandaloneCodeEditor
  private migrations: Map<string, Map<string, DataMigrationFunction>> = new Map()

  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor
  }

  /**
   * Register a data migration function for a schema
   */
  registerMigration(
    schemaId: string, 
    fromVersion: string, 
    toVersion: string, 
    migrationFn: DataMigrationFunction
  ): void {
    if (!this.migrations.has(schemaId)) {
      this.migrations.set(schemaId, new Map())
    }
    
    const schemaMigrations = this.migrations.get(schemaId)!
    const migrationKey = `${fromVersion}->${toVersion}`
    schemaMigrations.set(migrationKey, migrationFn)
    

  }

  /**
   * Insert helper block with embedded metadata and validation
   */
  insertHelperWithMetadata(
    content: string, 
    schemaId: string, 
    data: Record<string, any> = {},
    position?: monaco.Position
  ): string {
    const helperId = this.generateHelperId()
    const insertPosition = position || this.editor.getPosition() || new monaco.Position(1, 1)
    
    // Add schema version if not present
    const enrichedData = {
      ...data,
      schemaVersion: data.schemaVersion || '1.0',
      createdAt: data.createdAt || new Date().toISOString()
    }
    
    // Validate data structure
    const validation = this.validateHelperData(schemaId, enrichedData)
    if (!validation.isValid) {
      
      // Continue anyway but log issues
    }
    
    // Create structured comment block with pretty JSON for complex objects
    const metadataJson = this.formatMetadataForStorage(enrichedData)
    const helperBlock = [
      `// HELPER_START:${helperId}:${schemaId}`,
      `// ${metadataJson}`,
      content,
      `// HELPER_END:${helperId}:${schemaId}`,
      '' // Empty line for readability
    ].join('\n')

    // Insert the complete block
    this.editor.executeEdits('helper-insert-with-metadata', [{
      range: new monaco.Range(
        insertPosition.lineNumber, 
        insertPosition.column, 
        insertPosition.lineNumber, 
        insertPosition.column
      ),
      text: helperBlock
    }])

    console.log(`✅ Helper block inserted with metadata: ${helperId}`, { 
      schemaId, 
      dataSize: JSON.stringify(enrichedData).length 
    })
    return helperId
  }

  /**
   * Parse all helper blocks from source code with migration support
   */
  parseHelperBlocks(): HelperMetadata[] {
    const model = this.editor.getModel()
    if (!model) return []

    const helpers: HelperMetadata[] = []
    const lines = model.getLinesContent()
    
    let i = 0
    while (i < lines.length) {
      const line = lines[i].trim()
      
      // Look for helper start markers
      const startMatch = line.match(/^\/\/ HELPER_START:([^:]+):(.+)$/)
      if (startMatch) {
        const [, helperId, schemaId] = startMatch
        const startLine = i + 1
        
        // Next line should contain JSON metadata
        if (i + 1 < lines.length) {
          const metadataLine = lines[i + 1].trim()
          const metadataMatch = metadataLine.match(/^\/\/ (.+)$/)
          
          if (metadataMatch) {
            try {
              let data = JSON.parse(metadataMatch[1])
              
              // Apply any necessary migrations
              const migrationResult = this.migrateHelperData(schemaId, data)
              if (migrationResult.migratedData) {
                data = migrationResult.migratedData
            
              }
              
              // Find the end marker
              let endLine = startLine
              let content: string[] = []
              let j = i + 2 // Start after metadata line
              
              while (j < lines.length) {
                const currentLine = lines[j].trim()
                const endMatch = currentLine.match(/^\/\/ HELPER_END:([^:]+):(.+)$/)
                
                if (endMatch && endMatch[1] === helperId) {
                  endLine = j + 1
                  break
                }
                
                content.push(lines[j])
                j++
              }
              
              helpers.push({
                id: helperId,
                schemaId,
                data,
                startLine,
                endLine,
                content: content.join('\n').trim()
              })
              
              i = j // Continue after end marker
            } catch (error) {
              
              i++
            }
          } else {
            i++
          }
        } else {
          i++
        }
      } else {
        i++
      }
    }
    

    return helpers
  }

  /**
   * Update helper block content and metadata with validation
   */
  updateHelperBlock(
    helperId: string, 
    newContent: string, 
    newData?: Record<string, any>
  ): boolean {
    const helpers = this.parseHelperBlocks()
    const helper = helpers.find(h => h.id === helperId)
    
    if (!helper) {
      
      return false
    }

    const model = this.editor.getModel()
    if (!model) return false

    // Merge with existing data and update timestamp
    const data = newData ? {
      ...helper.data,
      ...newData,
      updatedAt: new Date().toISOString()
    } : helper.data
    
    // Validate merged data
    const validation = this.validateHelperData(helper.schemaId, data)
    if (!validation.isValid) {
      
    }
    
    const metadataJson = this.formatMetadataForStorage(data)
    
    // Create updated helper block
    const updatedBlock = [
      `// HELPER_START:${helperId}:${helper.schemaId}`,
      `// ${metadataJson}`,
      newContent,
      `// HELPER_END:${helperId}:${helper.schemaId}`
    ].join('\n')

    // Replace the entire helper block
    this.editor.executeEdits('helper-update-with-metadata', [{
      range: new monaco.Range(helper.startLine, 1, helper.endLine, model.getLineMaxColumn(helper.endLine)),
      text: updatedBlock
    }])


    return true
  }

  /**
   * Get helper block at cursor position
   */
  getHelperAtCursor(): HelperMetadata | null {
    const position = this.editor.getPosition()
    if (!position) return null

    const helpers = this.parseHelperBlocks()
    return helpers.find(h => 
      position.lineNumber >= h.startLine && 
      position.lineNumber <= h.endLine
    ) || null
  }

  /**
   * Remove helper block completely
   */
  removeHelperBlock(helperId: string): boolean {
    const helper = this.parseHelperBlocks().find(h => h.id === helperId)
    if (!helper) return false

    const model = this.editor.getModel()
    if (!model) return false

    // Delete entire range including trailing empty line if present
    const endLine = helper.endLine < model.getLineCount() && 
                   model.getLineContent(helper.endLine + 1).trim() === '' 
                   ? helper.endLine + 1 
                   : helper.endLine

    this.editor.executeEdits('helper-remove', [{
      range: new monaco.Range(helper.startLine, 1, endLine, model.getLineMaxColumn(endLine)),
      text: ''
    }])


    return true
  }

  /**
   * Generate unique helper ID
   */
  private generateHelperId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `helper-${timestamp}-${random}`
  }

  /**
   * Format metadata for storage (single line for simple objects, readable for complex ones)
   */
  private formatMetadataForStorage(data: Record<string, any>): string {
    const jsonString = JSON.stringify(data)
    
    // For very complex objects (>200 chars), consider if we need multiline
    // For now, keep single line for parsing simplicity
    if (jsonString.length > 500) {
      console.warn(`⚠️ Large helper metadata (${jsonString.length} chars). Consider optimizing.`)
    }
    
    return jsonString
  }

  /**
   * Validate helper data structure
   */
  private validateHelperData(schemaId: string, data: Record<string, any>): HelperValidationResult {
    const result: HelperValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    // Basic validation
    if (!data.schemaVersion) {
      result.warnings.push('Missing schemaVersion, defaulting to 1.0')
    }

    // Schema-specific validation could be added here
    switch (schemaId) {
      case 'add-vendor-remark':
        if (!data.selectedVendors || !Array.isArray(data.selectedVendors)) {
          result.errors.push('selectedVendors must be an array')
          result.isValid = false
        } else if (data.selectedVendors.length === 0) {
          result.warnings.push('No vendors selected')
        }
        break
        
      // Add validation for other helper types
      default:
        // Generic validation
        break
    }

    return result
  }

  /**
   * Apply data migrations if needed
   */
  private migrateHelperData(schemaId: string, data: Record<string, any>): HelperValidationResult {
    const result: HelperValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    const schemaMigrations = this.migrations.get(schemaId)
    if (!schemaMigrations || !data.schemaVersion) {
      return result
    }

    const currentVersion = data.schemaVersion
    let migratedData = { ...data }
    let hasChanges = false

    // Apply migrations sequentially if needed
    // This is a simplified approach - real migration might need more sophisticated versioning
    for (const [migrationKey, migrationFn] of schemaMigrations) {
      if (migrationKey.startsWith(`${currentVersion}->`)) {
        const [, toVersion] = migrationKey.split('->')
        try {
          migratedData = migrationFn(migratedData, currentVersion, toVersion)
          hasChanges = true
          result.warnings.push(`Migrated data from ${currentVersion} to ${toVersion}`)
        } catch (error) {
          result.errors.push(`Migration failed: ${error}`)
          result.isValid = false
        }
        break
      }
    }

    if (hasChanges) {
      result.migratedData = migratedData
    }

    return result
  }

  /**
   * Clean up orphaned helper markers (recovery function)
   */
  cleanupOrphanedMarkers(): void {
    const model = this.editor.getModel()
    if (!model) return

    const lines = model.getLinesContent()
    const edits: monaco.editor.IIdentifiedSingleEditOperation[] = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Remove orphaned start/end markers without matching pairs
      if (line.match(/^\/\/ HELPER_(START|END):/)) {
        const helpers = this.parseHelperBlocks()
        const lineInHelper = helpers.some(h => i + 1 >= h.startLine && i + 1 <= h.endLine)
        
        if (!lineInHelper) {
          edits.push({
            range: new monaco.Range(i + 1, 1, i + 1, model.getLineMaxColumn(i + 1)),
            text: ''
          })
        }
      }
    }

    if (edits.length > 0) {
      this.editor.executeEdits('cleanup-orphaned-markers', edits)
  
    }
  }

  /**
   * Extract just the code content (without helper metadata) for execution
   */
  getExecutableCode(): string {
    const model = this.editor.getModel()
    if (!model) return ''

    const lines = model.getLinesContent()
    const executableLines: string[] = []
    
    for (const line of lines) {
      // Skip helper metadata comments but keep regular comments and code
      if (!line.trim().match(/^\/\/ HELPER_(START|END):/)) {
        executableLines.push(line)
      }
    }

    return executableLines.join('\n')
  }

  /**
   * Get statistics about helper blocks in the editor
   */
  getHelperStatistics(): {
    totalHelpers: number
    helpersBySchema: Record<string, number>
    totalMetadataSize: number
    oldestHelper?: { id: string, createdAt: string }
    newestHelper?: { id: string, createdAt: string }
  } {
    const helpers = this.parseHelperBlocks()
    const stats = {
      totalHelpers: helpers.length,
      helpersBySchema: {} as Record<string, number>,
      totalMetadataSize: 0,
      oldestHelper: undefined as any,
      newestHelper: undefined as any
    }

    let oldestDate = new Date()
    let newestDate = new Date(0)

    for (const helper of helpers) {
      // Count by schema
      stats.helpersBySchema[helper.schemaId] = (stats.helpersBySchema[helper.schemaId] || 0) + 1
      
      // Calculate metadata size
      stats.totalMetadataSize += JSON.stringify(helper.data).length
      
      // Track oldest/newest if timestamps exist
      if (helper.data.createdAt) {
        const createdAt = new Date(helper.data.createdAt)
        if (createdAt < oldestDate) {
          oldestDate = createdAt
          stats.oldestHelper = { id: helper.id, createdAt: helper.data.createdAt }
        }
        if (createdAt > newestDate) {
          newestDate = createdAt
          stats.newestHelper = { id: helper.id, createdAt: helper.data.createdAt }
        }
      }
    }

    return stats
  }
}