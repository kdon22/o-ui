// Block Boundary Detection for Helper Blocks
import type * as monaco from 'monaco-editor'

export interface HelperBlockBoundaries {
  startLine: number
  endLine: number
  blockId: string
  schemaId: string
  range: monaco.Range
  contentRange: monaco.Range
  isReadOnly?: boolean
}

export class BlockBoundaryDetector {
  private editor: monaco.editor.IStandaloneCodeEditor
  
  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor
  }
  
  // Find complete helper block boundaries
  findHelperBlockBoundaries(position: monaco.Position): HelperBlockBoundaries | null {
    const model = this.editor.getModel()
    if (!model) return null
    
    let startLine: number | null = null
    let endLine: number | null = null
    let blockId: string | null = null
    let schemaId: string | null = null
    
    // Search backwards for HELPER_START
    for (let line = position.lineNumber; line >= 1; line--) {
      const content = model.getLineContent(line)
      const startMatch = content.match(/# HELPER_START:([^:]+):(.+)/)
      
      if (startMatch) {
        startLine = line
        blockId = startMatch[1]
        schemaId = startMatch[2]
        break
      }
    }
    
    // Search forwards for matching HELPER_END
    if (startLine && blockId && schemaId) {
      for (let line = position.lineNumber; line <= model.getLineCount(); line++) {
        const content = model.getLineContent(line)
        if (content.includes(`# HELPER_END:${blockId}:${schemaId}`)) {
          endLine = line
          break
        }
      }
    }
    
    if (startLine && endLine && blockId && schemaId) {
      return {
        startLine,
        endLine,
        blockId,
        schemaId,
        range: new monaco.Range(startLine, 1, endLine, model.getLineMaxColumn(endLine)),
        contentRange: new monaco.Range(startLine + 1, 1, endLine - 1, model.getLineMaxColumn(endLine - 1))
      }
    }
    
    return null
  }
  
  // Check if position is inside any helper block
  isInsideHelperBlock(position: monaco.Position): boolean {
    return this.findHelperBlockBoundaries(position) !== null
  }
  
  // Get all helper blocks in the editor
  getAllHelperBlocks(): HelperBlockBoundaries[] {
    const model = this.editor.getModel()
    if (!model) return []
    
    const blocks: HelperBlockBoundaries[] = []
    const totalLines = model.getLineCount()
    
    for (let line = 1; line <= totalLines; line++) {
      const content = model.getLineContent(line)
      const startMatch = content.match(/# HELPER_START:([^:]+):(.+)/)
      
      if (startMatch) {
        const blockId = startMatch[1]
        const schemaId = startMatch[2]
        
        // Find matching end
        for (let endLine = line + 1; endLine <= totalLines; endLine++) {
          const endContent = model.getLineContent(endLine)
          if (endContent.includes(`# HELPER_END:${blockId}:${schemaId}`)) {
            blocks.push({
              startLine: line,
              endLine,
              blockId,
              schemaId,
              range: new monaco.Range(line, 1, endLine, model.getLineMaxColumn(endLine)),
              contentRange: new monaco.Range(line + 1, 1, endLine - 1, model.getLineMaxColumn(endLine - 1))
            })
            break
          }
        }
      }
    }
    
    return blocks
  }
  
  // Find blocks affected by a range (for deletion detection)
  findBlocksAffectedByRange(range: monaco.Range): HelperBlockBoundaries[] {
    const allBlocks = this.getAllHelperBlocks()
    const affectedBlocks: HelperBlockBoundaries[] = []
    
    for (const block of allBlocks) {
      // Block is affected if range overlaps with block boundaries
      if (range.intersectRanges(block.range)) {
        affectedBlocks.push(block)
      }
    }
    
    return affectedBlocks
  }
} 