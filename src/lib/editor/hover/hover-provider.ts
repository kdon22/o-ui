/**
 * 🎯 HOVER PROVIDER - Unified Type System Integration
 *
 * Provides rich hover information using the bulletproof unified type system.
 * Shows accurate type information and available methods.
 * 
 * ⚠️ SSR SAFE: Monaco imports are conditional to prevent server-side rendering errors.
 */

import type * as MonacoTypes from 'monaco-editor'
import type { UnifiedType } from '@/lib/editor/schemas'
import { unifiedTypeDetectionFactory } from '@/lib/editor/schemas'
import { masterTypeDetector, detectVariableType } from '@/lib/editor/type-system/master-type-detector'
import { getDisplayName } from '@/lib/editor/schemas/types/unified-types'
import { debugUnifiedTypeSystem } from '@/lib/editor/schemas/types/index'
import { ScopeTracker } from '@/lib/editor/type-system/scope-tracker'
import { schemaBridge } from '@/lib/editor/type-system/schema-bridge'
import { ALL_METHOD_SCHEMAS } from '@/lib/editor/schemas/methods'
import { getMethodCategoriesForType } from '@/lib/editor/schemas/types/method-categories'

// =============================================================================
// UNIFIED HOVER PROVIDER (SSR SAFE)
// =============================================================================

export function createUnifiedHoverProvider(): MonacoTypes.languages.HoverProvider {
  return {
    provideHover: (model, position) => {
      // ⚠️ SSR SAFETY: Only run in browser environment
      if (typeof window === 'undefined') {
        return null
      }

      try {
        // 🚨 **GOLD STANDARD DEBUG**: Bulletproof hover logging with visual separator
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
    
    
    
        
        
    
        
        // 🚨 **CRITICAL CHECK**: Verify we're actually being called for the right language
        if (model.getLanguageId() !== 'business-rules') {
          console.log(`❌ [HOVER] WRONG LANGUAGE! Expected 'business-rules', got '${model.getLanguageId()}'`)
          return null
        }
        
        const wordInfo = model.getWordAtPosition(position)
        if (!wordInfo) {
      
          return null
        }

        const word = wordInfo.word
        const allText = model.getValue()
        
        // Detect member access like `owner.member` to decide between variable vs method/module hover
        const lineText = model.getLineContent(position.lineNumber)
        const before = lineText.slice(0, wordInfo.startColumn - 1)
        const memberMatch = before.match(/([a-zA-Z_][\w]*)\s*\.\s*$/)
        const ownerIdent = memberMatch ? memberMatch[1] : null

        // Build a lightweight scope for alias/module/method inference (factory-driven)
        const tracker = new ScopeTracker()
        try {
          tracker.updateFromModel(model)
        } catch {}

    
    
    

        // If hovering a method (owner.method), show method or module method hover
        if (ownerIdent && word) {
          // 1) Try module method (e.g., http.get)
          const moduleReturn = schemaBridge.getModuleReturnType(ownerIdent, word)
          if (moduleReturn && moduleReturn !== 'unknown') {
            const monaco = require('monaco-editor')
            const params = schemaBridge.getParametersForModuleMethod(ownerIdent, word) || []
            const paramList = params.length
              ? params.map(p => `\`${p.name}: ${p.type}${p.required ? '' : '?'}\``).join(', ')
              : 'none'
            const header = `**${ownerIdent}.${word}** → *${moduleReturn}*`
            const body = [
              `**Module Method**`,
              `**Parameters:** ${paramList}`
            ].join('\n\n')

            return {
              range: new monaco.Range(
                position.lineNumber,
                wordInfo.startColumn,
                position.lineNumber,
                wordInfo.endColumn
              ),
              contents: [
                { value: header, isTrusted: true },
                { value: body, isTrusted: true }
              ]
            }
          }

          // 2) Try variable-instance method (e.g., myStr.toBase64)
          // Determine the variable type using scope (factory) with unified fallback
          const trackedType = tracker.getTypeOf(ownerIdent)
          const unified = unifiedTypeDetectionFactory.detectVariableType(ownerIdent, allText)
          let baseType: UnifiedType = (trackedType && trackedType !== 'unknown') ? trackedType as UnifiedType : unified.type
          // Normalize legacy names to unified primitives
          const legacyToUnified: Record<string, UnifiedType> = { string: 'str', number: 'int', boolean: 'bool', array: 'list', object: 'dict', date: 'date' }
          if (typeof baseType === 'string' && legacyToUnified[baseType]) {
            baseType = legacyToUnified[baseType]
          }

          if (baseType && baseType !== 'unknown') {
            const categories = getMethodCategoriesForType(baseType)
            const methodSchema = (ALL_METHOD_SCHEMAS as any[]).find(s => s.name === word && (categories as any).includes(s.category))
            if (methodSchema) {
              const monaco = require('monaco-editor')
              const header = `**${ownerIdent}.${methodSchema.name}** → *${methodSchema.returnType || 'unknown'}*`
              const description = methodSchema.description ? String(methodSchema.description) : ''
              const example = Array.isArray(methodSchema.examples) && methodSchema.examples.length > 0
                ? `\n\n**Example:** \`${ownerIdent}.${methodSchema.examples[0].split('.').pop()}\``
                : ''
              const body = `${description}${example}`

              return {
                range: new monaco.Range(
                  position.lineNumber,
                  wordInfo.startColumn,
                  position.lineNumber,
                  wordInfo.endColumn
                ),
                contents: [
                  { value: header, isTrusted: true },
                  ...(body ? [{ value: body, isTrusted: true }] as any : [])
                ]
              }
            }
          }

          // 3) Business-object property hover (owner.property)
          try {
            const { createBusinessObjectRegistry } = require('@/lib/editor/type-system/business-object-registry')
            const reg = createBusinessObjectRegistry(allText)

            // Determine type name of owner variable
            let ownerTypeName: string | undefined
            const trackedOwner = tracker.getTypeOf(ownerIdent)
            if (trackedOwner && trackedOwner !== 'unknown') {
              ownerTypeName = String(trackedOwner)
            } else {
              const assignMatch = new RegExp(`^\\s*${ownerIdent}\\s*=\\s*([A-Z][\\w]*)\\s*\\(`, 'm').exec(allText)
              if (assignMatch) ownerTypeName = assignMatch[1]
            }

            if (ownerTypeName) {
              const propType = reg.getPropertyType(ownerTypeName, word)
              if (propType) {
                const monaco = require('monaco-editor')
                const header = `**${ownerIdent}.${word}** → *${getDisplayName(propType as any)}*`
                return {
                  range: new monaco.Range(
                    position.lineNumber,
                    wordInfo.startColumn,
                    position.lineNumber,
                    wordInfo.endColumn
                  ),
                  contents: [{ value: header, isTrusted: true }]
                }
              }
            }
          } catch {}
        }

        // Variable hover: use MASTER TYPE DETECTION SYSTEM
        const targetIdent = ownerIdent || word
        console.log(`[UnifiedHoverProvider] Using MASTER SYSTEM for variable: ${targetIdent}`)
        
        const masterResult = detectVariableType(targetIdent, allText)
        let variableInfo = {
          name: masterResult.name,
          type: masterResult.type,
          confidence: masterResult.confidence,
          source: masterResult.source,
          evidence: masterResult.evidence,
          availableMethods: masterResult.methods || []
        }
        
        console.log(`[UnifiedHoverProvider] Master system result for "${targetIdent}":`, variableInfo)
        
    
    
    
    
    
        
        if (variableInfo.confidence < 0.5) {
          // keep minimal
        }
        
        // 🚨 **CRITICAL CHECK**: Verify we have enough info to show hover
        if (!variableInfo.type || variableInfo.type === 'unknown') {
      
          return null
        }

        // Generate hover content
        const hoverContent = generateUnifiedHoverContent(variableInfo, ownerIdent ? `${ownerIdent}.${word}` : word)
        
        // Dynamic Monaco import for Range creation
        const monaco = require('monaco-editor')
        
        return {
          range: new monaco.Range(
            position.lineNumber,
            wordInfo.startColumn,
            position.lineNumber,
            wordInfo.endColumn
          ),
          contents: hoverContent
        }
      } catch (error) {
        console.error('❌ [UnifiedHoverProvider] Error providing hover:', error)
        return null
      }
    }
  }
}

// =============================================================================
// HOVER CONTENT GENERATION
// =============================================================================

function generateUnifiedHoverContent(
  variableInfo: { name: string; type: UnifiedType; confidence: number; source: string; evidence: string; availableMethods: any[] },
  variableName: string
): MonacoTypes.IMarkdownString[] {
  const contents: MonacoTypes.IMarkdownString[] = []

  // Compact type header only
  const displayName = getDisplayName(variableInfo.type)
  contents.push({ value: `**${variableName}** → *${displayName}*`, isTrusted: true })

  return contents
}

// =============================================================================
// LEGACY COMPATIBILITY (TEMPORARY)
// =============================================================================

/**
 * @deprecated Use createUnifiedHoverProvider instead
 * Legacy hover provider for backward compatibility during transition
 */
export function createHoverProvider(): MonacoTypes.languages.HoverProvider {
  console.warn('⚠️ [HoverProvider] Using deprecated createHoverProvider. Please migrate to createUnifiedHoverProvider.')
  
  return {
    provideHover: (model, position) => {
      // ⚠️ SSR SAFETY: Only run in browser environment
      if (typeof window === 'undefined') {
        return null
      }

      const wordInfo = model.getWordAtPosition(position)
      if (!wordInfo) {
        return null
      }

      const word = wordInfo.word
      const allText = model.getValue()
      
      // Use unified system but convert to old format
      const variableInfo = unifiedTypeDetectionFactory.detectVariableType(word, allText)
      
      // Dynamic Monaco import for Range creation
      const monaco = require('monaco-editor')
      
      return {
        range: new monaco.Range(
          position.lineNumber,
          wordInfo.startColumn,
          position.lineNumber,
          wordInfo.endColumn
        ),
        contents: [{
          value: `**${word}** → *${getDisplayName(variableInfo.type)}*`,
          isTrusted: true
        }]
      }
    }
  }
}