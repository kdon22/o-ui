/**
 * 🎯 BUSINESS RULES DIAGNOSTIC PROVIDER
 * 
 * Small focused file for real-time syntax error detection in Monaco Editor
 * Integrates with focused validators for clean error reporting
 */

import type * as Monaco from 'monaco-editor';
import { ScopeTracker } from '@/lib/editor/type-system/scope-tracker'
import { schemaBridge } from '@/lib/editor/type-system/schema-bridge'
import { ALL_MODULE_SCHEMAS } from '@/lib/editor/schemas/modules'

// TODO: This is a legacy diagnostic provider that will be replaced by UnifiedDiagnosticProvider
// Temporarily removing the missing import to fix build error

interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  source: 'syntax' | 'safety' | 'style';
}

export interface DiagnosticConfig {
  enableSyntaxValidation: boolean;
  enableSafetyValidation: boolean;
  enableStyleWarnings: boolean;
  debounceMs: number;
}

/**
 * Registers diagnostic provider with Monaco Editor
 */
export class BusinessRulesDiagnosticProvider {
  private monaco: typeof Monaco;
  private config: DiagnosticConfig;
  private currentModel: Monaco.editor.ITextModel | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private modelDisposables = new Map<string, Monaco.IDisposable>(); // Track model disposables

  constructor(
    monaco: typeof Monaco,
    config: Partial<DiagnosticConfig> = {}
  ) {
    this.monaco = monaco;
    this.config = {
      enableSyntaxValidation: true,
      enableSafetyValidation: true,
      enableStyleWarnings: true,
      debounceMs: 300,
      ...config
    };
  }

  /**
   * Register diagnostic provider with Monaco
   */
  register(): Monaco.IDisposable {
    // Registering business rules diagnostics
    
    const disposables: Monaco.IDisposable[] = [];
    
    // Listen for new models being created
    const modelChangeDisposable = this.monaco.editor.onDidCreateModel((model) => {
      if (model.getLanguageId() === 'business-rules') {
        this.attachToModel(model);
      }
    });
    disposables.push(modelChangeDisposable);

    // 🎯 FIX: Check existing models and attach to them
    const existingModels = this.monaco.editor.getModels();
    for (const model of existingModels) {
      if (model.getLanguageId() === 'business-rules') {
        this.attachToModel(model);
      }
    }

    // Diagnostic provider registered successfully

    return {
      dispose: () => {
        // Dispose main event listeners
        disposables.forEach(d => d.dispose());
        
        // Dispose all model-specific listeners
        this.modelDisposables.forEach(disposable => disposable.dispose());
        this.modelDisposables.clear();
        
        // Clear debounce timer
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
        }
        
        // All resources disposed
      }
    };
  }

  /**
   * Attach diagnostics to a specific model
   */
  private attachToModel(model: Monaco.editor.ITextModel): void {
    const modelId = model.uri.toString();
    // Attaching to model
    
    // Don't attach twice to the same model
    if (this.modelDisposables.has(modelId)) {
      // Model already attached, skipping
      return;
    }
    
    this.currentModel = model;
    
    // Validate immediately
    this.validateModel(model);
    
    // 🎯 FIX: Listen for content changes on this specific model
    const contentChangeDisposable = model.onDidChangeContent(() => {
      this.validateModel(model);
    });
    
    // Track disposable for cleanup
    this.modelDisposables.set(modelId, contentChangeDisposable);
    // Content change listener attached to model
  }

  /**
   * Validate model with debouncing
   */
  private validateModel(model: Monaco.editor.ITextModel): void {
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Debounce validation to avoid excessive calls during typing
    this.debounceTimer = setTimeout(() => {
      this.performValidation(model);
    }, this.config.debounceMs);
  }

  /**
   * Perform actual validation and update markers
   */
  private performValidation(model: Monaco.editor.ITextModel): void {
    const code = model.getValue();
    const errors: ValidationError[] = [];

    // Performing validation on code

    try {
      // 🎯 BASIC SYNTAX VALIDATION: Simple checks
      if (this.config.enableSyntaxValidation) {
        errors.push(...this.basicSyntaxValidation(code));
      }

      // 🎯 SAFETY VALIDATION: Basic safety checks
      if (this.config.enableSafetyValidation) {
        errors.push(...this.basicSafetyValidation(code));
      }

      // 🎯 FACTORY DIAGNOSTICS: Execute lightweight rule factories
      const tracker = new ScopeTracker()
      tracker.updateFromModel(model)
      const rules = this.createDiagnosticRules()
      for (const rule of rules) {
        try {
          errors.push(...rule({ model, monaco: this.monaco, tracker }))
        } catch {}
      }

      // Convert validation errors to Monaco markers
      const markers = this.convertToMarkers(errors);
      
      // Validation issues found and markers created

      // Update markers in Monaco
      this.monaco.editor.setModelMarkers(model, 'business-rules-diagnostics', markers);

    } catch (error) {
      console.error('❌ [DiagnosticProvider] Error during validation:', error);
      
      // Clear markers on error
      this.monaco.editor.setModelMarkers(model, 'business-rules-diagnostics', []);
    }
  }

  /**
   * Convert validation errors to Monaco markers
   */
  private convertToMarkers(errors: ValidationError[]): Monaco.editor.IMarkerData[] {
    return errors.map((error): Monaco.editor.IMarkerData => {
      // Map severity
      let severity: Monaco.MarkerSeverity;
      switch (error.severity) {
        case 'error':
          severity = this.monaco.MarkerSeverity.Error;
          break;
        case 'warning':
          severity = this.monaco.MarkerSeverity.Warning;
          break;
        default:
          severity = this.monaco.MarkerSeverity.Info;
      }

      // Skip style warnings if disabled
      if (error.source === 'style' && !this.config.enableStyleWarnings) {
        severity = this.monaco.MarkerSeverity.Hint;
      }

      // Skip safety warnings if disabled
      if (error.source === 'safety' && !this.config.enableSafetyValidation) {
        return null as any; // Will be filtered out
      }

      return {
        severity,
        message: error.message,
        startLineNumber: error.line,
        startColumn: error.column,
        endLineNumber: error.line,
        endColumn: error.column + 10, // Highlight ~10 characters
        source: `business-rules-${error.source}`,
        code: error.source
      };
    }).filter(Boolean); // Remove null entries
  }

  /**
   * Manually trigger validation (useful for testing)
   */
  validateNow(model?: Monaco.editor.ITextModel): void {
    const targetModel = model || this.currentModel;
    if (targetModel) {
      // Manual validation triggered
      this.performValidation(targetModel);
    } else {
      console.warn('⚠️ [DiagnosticProvider] No model available for validation');
    }
  }

  /**
   * Clear all diagnostics
   */
  clearDiagnostics(model?: Monaco.editor.ITextModel): void {
    const targetModel = model || this.currentModel;
    if (targetModel) {
      // Clearing diagnostics
      this.monaco.editor.setModelMarkers(targetModel, 'business-rules-diagnostics', []);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DiagnosticConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Configuration updated
    
    // Re-validate with new config
    if (this.currentModel) {
      this.validateModel(this.currentModel);
    }
  }

  /**
   * Basic syntax validation (temporary replacement for ControlFlowValidator)
   */
  private basicSyntaxValidation(code: string): ValidationError[] {
    const errors: ValidationError[] = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      // Skip empty lines and comments
      if (!line || line.startsWith('//')) continue;

      // Check for SQL queries - don't apply arithmetic operator validation
      if (this.isSqlQueryLine(line)) continue;

      // Colon after control flow keywords is OPTIONAL in this DSL.
      // We allow both styles:
      //   if condition
      //   if condition:
      // No error should be raised for missing ':'
    }

    return errors;
  }

  /**
   * Check if a line contains SQL query syntax
   */
  private isSqlQueryLine(line: string): boolean {
    // Match SELECT statements (case insensitive)
    return /^\s*[a-zA-Z_]\w*\s*=\s*SELECT\b/i.test(line)
  }

  /**
   * Basic safety validation
   */
  private basicSafetyValidation(code: string): ValidationError[] {
    const errors: ValidationError[] = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      // Check for while loops without maxloop safety
      if (/^\s*while\s+/.test(line) && !line.includes('maxloop')) {
        errors.push({
          line: lineNumber,
          column: 1,
          message: 'Consider adding "| maxloop N" to prevent infinite loops',
          severity: 'warning',
          source: 'safety'
        });
      }
    }

    return errors;
  }

  // ============================================================================
  // Factory-based diagnostics (small, composable rules)
  // ============================================================================

  private createDiagnosticRules(): Array<(ctx: { model: Monaco.editor.ITextModel; monaco: typeof Monaco; tracker: ScopeTracker }) => ValidationError[]> {
    return [
      this.createTypeMismatchRule(),
      this.createInvalidOperatorRule(),
      this.createMethodArgumentTypeRule(),
    ]
  }

  /**
   * Warn when comparing/assigning mismatched types (e.g., number vs string)
   * Uses only Monaco APIs + our schemaBridge/ScopeTracker (no heavy parsing)
   */
  private createTypeMismatchRule() {
    type Ctx = { model: Monaco.editor.ITextModel; monaco: typeof Monaco; tracker: ScopeTracker }
    const isStringLiteral = (s: string) => /^\s*['"][\s\S]*['"]\s*$/.test(s)
    const isNumberLiteral = (s: string) => /^\s*\d+(?:\.\d+)?\s*$/.test(s)

    const inferExprType = (expr: string, ctx: Ctx): string => {
      const e = expr.trim()
      if (isStringLiteral(e)) return 'string'
      if (isNumberLiteral(e)) return 'number'
      if (/^(true|false)$/i.test(e)) return 'boolean'

      // obj.prop or obj.prop.leaf
      const deep = e.match(/^([a-zA-Z_][\w]*)\.(?:([a-zA-Z_][\w]*))(?:\.([a-zA-Z_][\w]*))?$/)
      if (deep) {
        const [, base, first, second] = deep
        const baseType = ctx.tracker.getTypeOf(base)
        if (baseType && baseType !== 'unknown') {
          if (second) {
            const mid = schemaBridge.getBusinessObjectPropertyType?.(baseType as any, first, ctx.model.getValue())
            if (mid && mid !== 'unknown') {
              const leaf = schemaBridge.getBusinessObjectPropertyType?.(mid as any, second, ctx.model.getValue())
              if (leaf && leaf !== 'unknown') return leaf
            }
          } else {
            const t = schemaBridge.getBusinessObjectPropertyType?.(baseType as any, first, ctx.model.getValue())
            if (t && t !== 'unknown') return t
          }
        }
      }

      // single identifier
      const id = e.match(/^([a-zA-Z_][\w]*)$/)
      if (id) {
        const t = ctx.tracker.getTypeOf(id[1])
        if (t && t !== 'unknown') return t
      }
      return 'unknown'
    }

    const rule = (ctx: Ctx): ValidationError[] => {
      const errors: ValidationError[] = []
      const lineCount = ctx.model.getLineCount()
      for (let ln = 1; ln <= lineCount; ln++) {
        const raw = ctx.model.getLineContent(ln)
        const line = raw.trim()
        if (!line || line.startsWith('//')) continue
        // Find simple binary operations (comparisons or assignment inside if/while or standalone)
        const m = raw.match(/(.+?)(==|!=|<=|>=|=|<|>)(.+)/)
        if (!m) continue
        const [_, leftRaw, op, rightRaw] = m
        // Infer types
        const leftType = inferExprType(leftRaw, ctx)
        const rightType = inferExprType(rightRaw, ctx)
        if (leftType === 'unknown' || rightType === 'unknown') continue

        const mismatch = (leftType === 'number' && rightType === 'string') || (leftType === 'string' && rightType === 'number')
        if (!mismatch) continue

        // Compute marker range around the right operand
        const opIdx = raw.indexOf(op)
        const startCol = opIdx + op.length + 1
        const endCol = Math.max(startCol + Math.max(1, rightRaw.trim().length), startCol + 1)
        errors.push({
          line: ln,
          column: startCol,
          message: `Type mismatch: ${leftType} ${op} ${rightType}`,
          severity: 'warning',
          source: 'syntax'
        })
      }
      return errors
    }

    return rule
  }

  /**
   * Warn when using invalid operators for operand types (e.g., string - number)
   */
  private createInvalidOperatorRule() {
    type Ctx = { model: Monaco.editor.ITextModel; monaco: typeof Monaco; tracker: ScopeTracker }
    const arithmeticOps = /[+\-*/]/
    const comparisonOps = /(==|!=|<=|>=|<|>)/
    const inferSimple = (s: string): string => {
      const t = s.trim()
      if (/^['"][\s\S]*['"]$/.test(t)) return 'string'
      if (/^\d+(?:\.\d+)?$/.test(t)) return 'number'
      if (/^(true|false)$/i.test(t)) return 'boolean'
      return 'unknown'
    }
    const rule = (ctx: Ctx): ValidationError[] => {
      const errors: ValidationError[] = []
      const lineCount = ctx.model.getLineCount()
      for (let ln = 1; ln <= lineCount; ln++) {
        const raw = ctx.model.getLineContent(ln)
        if (!raw.trim() || raw.trim().startsWith('//')) continue

        // Skip SQL query lines
        if (this.isSqlQueryLine(raw.trim())) continue

        const m = raw.match(/(.+?)([+\-*/]|==|!=|<=|>=|<|>)(.+)/)
        if (!m) continue
        const [, leftRaw, op, rightRaw] = m
        // Fast path literals
        let leftType = inferSimple(leftRaw)
        let rightType = inferSimple(rightRaw)
        // If unknown, try identifiers via ScopeTracker
        if (leftType === 'unknown') {
          const id = leftRaw.trim().match(/^([a-zA-Z_][\w]*)$/)
          if (id) leftType = ctx.tracker.getTypeOf(id[1])
        }
        if (rightType === 'unknown') {
          const id = rightRaw.trim().match(/^([a-zA-Z_][\w]*)$/)
          if (id) rightType = ctx.tracker.getTypeOf(id[1])
        }
        // Arithmetic requires numbers on both sides
        if (arithmeticOps.test(op)) {
          if (leftType === 'string' || rightType === 'string' || (leftType !== 'number' || rightType !== 'number')) {
            const col = raw.indexOf(op) + 1
            errors.push({
              line: ln,
              column: col,
              message: `Operator '${op}' expects numbers; got ${leftType} ${op} ${rightType}`,
              severity: 'warning',
              source: 'syntax'
            })
          }
        }
        // Comparisons between incompatible primitives
        if (comparisonOps.test(op)) {
          const primitives = new Set(['string', 'number', 'boolean'])
          if (primitives.has(leftType) && primitives.has(rightType) && leftType !== rightType) {
            const col = raw.indexOf(op) + 1
            errors.push({
              line: ln,
              column: col,
              message: `Suspicious comparison: ${leftType} ${op} ${rightType}`,
              severity: 'warning',
              source: 'syntax'
            })
          }
        }
      }
      return errors
    }
    return rule
  }

  /**
   * Validate method/function argument arity and basic parameter types
   */
  private createMethodArgumentTypeRule() {
    type Ctx = { model: Monaco.editor.ITextModel; monaco: typeof Monaco; tracker: ScopeTracker }
    // Build known module names once (lowercased) to distinguish module vs variable calls
    const knownModuleNames = new Set(
      (ALL_MODULE_SCHEMAS as any[])
        .flatMap(s => (s.examples || []) as string[])
        .map(ex => ex.split('.')[0])
        .filter(Boolean)
        .map(n => String(n).toLowerCase())
    )
    const rule = (ctx: Ctx): ValidationError[] => {
      const errors: ValidationError[] = []
      const lineCount = ctx.model.getLineCount()
      for (let ln = 1; ln <= lineCount; ln++) {
        const raw = ctx.model.getLineContent(ln)
        const line = raw.trim()
        if (!line || line.startsWith('//')) continue

        // Pattern 1: module.method(args)
        const modCall = raw.match(/\b([A-Za-z][\w]*)\.([a-zA-Z_][\w]*)\s*\((.*)\)/)
        if (modCall) {
          const [, mod, method, argStr] = modCall
          // Only treat as a module call if the identifier is a known module
          if (knownModuleNames.has(mod.toLowerCase())) {
            const params = schemaBridge.getParametersForModuleMethod(mod.toLowerCase(), method)
            const args = this.splitArgs(argStr)
            // Arity check (best effort)
            const requiredCount = (params || []).filter(p => p.required !== false).length
            if (args.length < requiredCount || args.length > (params?.length || 0)) {
              const col = raw.indexOf('(') + 1
              errors.push({
                line: ln,
                column: col,
                message: `Argument count mismatch for ${mod}.${method} — expected ${requiredCount}-${params?.length ?? 0}, got ${args.length}`,
                severity: 'warning',
                source: 'syntax'
              })
            }
          }
        }

        // Pattern 2: var.method(args) with typed base variable
        const varCall = raw.match(/\b([a-zA-Z_][\w]*)\.([a-zA-Z_][\w]*)\s*\((.*)\)/)
        if (varCall) {
          const [, base, method, argStr] = varCall
          const baseType = ctx.tracker.getTypeOf(base)
          if (baseType && baseType !== 'unknown') {
            const params = schemaBridge.getParametersForTypeMethod(baseType as any, method)
            const args = this.splitArgs(argStr)
            const requiredCount = (params || []).filter(p => p.required !== false).length
            if (params && (args.length < requiredCount || args.length > (params?.length || 0))) {
              const col = raw.indexOf('(') + 1
              errors.push({
                line: ln,
                column: col,
                message: `Argument count mismatch for ${base}.${method} — expected ${requiredCount}-${params?.length ?? 0}, got ${args.length}`,
                severity: 'warning',
                source: 'syntax'
              })
            }
          }
        }
      }
      return errors
    }
    return rule
  }

  // Best-effort comma splitter (no nested handling; keeps rule simple and fast)
  private splitArgs(argStr: string): string[] {
    const s = argStr.trim()
    if (!s) return []
    return s.split(',').map(a => a.trim()).filter(Boolean)
  }
}