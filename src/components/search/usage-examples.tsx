'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  SearchTrigger, 
  useUniversalSearch, 
  useRuleTypeSearch, 
  useRuleSelection,
  type RuleSearchResult 
} from './index'
import { Code2, Database, Wrench, Search } from 'lucide-react'

// ============================================================================
// EXAMPLE 1: RULE BROWSER PANEL
// ============================================================================

export function RuleBrowserPanel() {
  const { searchGlobalVars, searchUtilities, searchClasses } = useRuleTypeSearch()
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Browse Rules by Category</h3>
      
      {/* Universal Search Input */}
      <div className="mb-4">
        <SearchTrigger 
          placeholder="Search all rules..."
          className="w-full"
        />
      </div>
      
      {/* Category-Specific Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Button
          variant="outline"
          onClick={searchGlobalVars}
          className="flex items-center gap-2 h-auto py-3 px-4"
        >
          <Database className="w-5 h-5 text-blue-500" />
          <div className="text-left">
            <div className="font-medium">Global Variables</div>
            <div className="text-xs text-muted-foreground">Search configuration values</div>
          </div>
        </Button>
        
        <Button
          variant="outline"
          onClick={searchUtilities}
          className="flex items-center gap-2 h-auto py-3 px-4"
        >
          <Wrench className="w-5 h-5 text-green-500" />
          <div className="text-left">
            <div className="font-medium">Utility Functions</div>
            <div className="text-xs text-muted-foreground">Reusable helper functions</div>
          </div>
        </Button>
        
        <Button
          variant="outline"
          onClick={searchClasses}
          className="flex items-center gap-2 h-auto py-3 px-4"
        >
          <Code2 className="w-5 h-5 text-purple-500" />
          <div className="text-left">
            <div className="font-medium">Business Classes</div>
            <div className="text-xs text-muted-foreground">Business logic & workflows</div>
          </div>
        </Button>
      </div>
      
      <div className="mt-4 text-sm text-muted-foreground">
        <p>💡 <strong>Keyboard shortcuts:</strong></p>
        <ul className="mt-1 space-y-1">
          <li>• <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs">⇧⌥G</kbd> - Search Global Variables</li>
          <li>• <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs">⇧⌥U</kbd> - Search Utilities</li>
          <li>• <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs">⇧⌥C</kbd> - Search Classes</li>
        </ul>
      </div>
    </Card>
  )
}

// ============================================================================
// EXAMPLE 2: CONTEXTUAL SEARCH FOR FORMS
// ============================================================================

interface RuleSelectionFieldProps {
  label: string
  selectedRule?: RuleSearchResult
  onRuleSelect: (rule: RuleSearchResult) => void
  ruleType?: 'utility' | 'global_var' | 'classes'
  placeholder?: string
}

export function RuleSelectionField({
  label,
  selectedRule,
  onRuleSelect,
  ruleType = 'utility',
  placeholder = 'Select a rule...'
}: RuleSelectionFieldProps) {
  const { openSearch } = useUniversalSearch()
  
  // Set up custom rule selection for this component
  useRuleSelection(onRuleSelect)
  
  const handleSearchClick = () => {
    openSearch({
      defaultTab: ruleType,
      placeholder: `Select ${ruleType.replace('_', ' ')}...`
    })
  }
  
  const getRuleTypeLabel = (type: string) => {
    switch (type) {
      case 'GLOBAL_VAR': return 'Global Variable'
      case 'UTILITY': return 'Utility Function'
      case 'BUSINESS': return 'Business Class'
      default: return 'Rule'
    }
  }
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      
      <div
        onClick={handleSearchClick}
        className="relative cursor-pointer border border-input rounded-md bg-background hover:bg-accent/50 transition-colors"
      >
        {selectedRule ? (
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{selectedRule.name}</div>
                {selectedRule.pythonName && (
                  <code className="text-xs text-muted-foreground">
                    {selectedRule.pythonName}
                  </code>
                )}
                {selectedRule.description && (
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {selectedRule.description}
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {getRuleTypeLabel(selectedRule.type)}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 text-muted-foreground text-sm flex items-center gap-2">
            <Search className="w-4 h-4" />
            {placeholder}
          </div>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground">
        Click to search or press <kbd className="bg-muted px-1 py-0.5 rounded">⌘K</kbd> anywhere
      </div>
    </div>
  )
}

// ============================================================================
// EXAMPLE 3: SEARCH SHORTCUTS TOOLBAR
// ============================================================================

export function SearchShortcutsToolbar() {
  const { openSearch, openGlobalVarSearch, openUtilitySearch, openClassesSearch } = useUniversalSearch()
  
  return (
    <div className="flex items-center gap-2 p-2 border border-border rounded-lg bg-muted/30">
      <div className="text-sm font-medium text-muted-foreground">
        Quick Search:
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openSearch()}
          className="text-xs h-7"
        >
          <Search className="w-3 h-3 mr-1" />
          All
          <kbd className="ml-1 bg-background px-1 py-0.5 rounded text-xs">⌘K</kbd>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={openGlobalVarSearch}
          className="text-xs h-7"
        >
          <Database className="w-3 h-3 mr-1" />
          Global
          <kbd className="ml-1 bg-background px-1 py-0.5 rounded text-xs">⇧⌥G</kbd>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={openUtilitySearch}
          className="text-xs h-7"
        >
          <Wrench className="w-3 h-3 mr-1" />
          Utils
          <kbd className="ml-1 bg-background px-1 py-0.5 rounded text-xs">⇧⌥U</kbd>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={openClassesSearch}
          className="text-xs h-7"
        >
          <Code2 className="w-3 h-3 mr-1" />
          Classes
          <kbd className="ml-1 bg-background px-1 py-0.5 rounded text-xs">⇧⌥C</kbd>
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// EXAMPLE 4: DEMO PAGE COMBINING ALL EXAMPLES
// ============================================================================

export function UniversalSearchDemo() {
  const [selectedUtility, setSelectedUtility] = React.useState<RuleSearchResult>()
  const [selectedGlobalVar, setSelectedGlobalVar] = React.useState<RuleSearchResult>()
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Universal Search Demo</h1>
        <p className="text-muted-foreground">
          Examples of how to use the universal rule search system throughout the application.
        </p>
      </div>
      
      {/* Quick Search Toolbar */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Quick Search Toolbar</h2>
        <SearchShortcutsToolbar />
      </section>
      
      {/* Rule Browser */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Rule Browser Panel</h2>
        <RuleBrowserPanel />
      </section>
      
      {/* Form Integration */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Form Integration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <RuleSelectionField
              label="Select Utility Function"
              selectedRule={selectedUtility}
              onRuleSelect={setSelectedUtility}
              ruleType="utility"
              placeholder="Choose a utility function..."
            />
          </Card>
          
          <Card className="p-4">
            <RuleSelectionField
              label="Select Global Variable"
              selectedRule={selectedGlobalVar}
              onRuleSelect={setSelectedGlobalVar}
              ruleType="global_var"
              placeholder="Choose a global variable..."
            />
          </Card>
        </div>
      </section>
      
      {/* Usage Tips */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Usage Tips</h2>
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">🚀 Getting Started</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Press <kbd className="bg-muted px-1 py-0.5 rounded">⌘K</kbd> anywhere to search</li>
                <li>• Use tabs or shortcuts to filter by type</li>
                <li>• Click on tags to filter by categories</li>
                <li>• Press <kbd className="bg-muted px-1 py-0.5 rounded">F</kbd> to toggle filters</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">⌨️ Keyboard Shortcuts</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <kbd className="bg-muted px-1 py-0.5 rounded">⇧⌥G</kbd> - Global Variables</li>
                <li>• <kbd className="bg-muted px-1 py-0.5 rounded">⇧⌥U</kbd> - Utility Functions</li>
                <li>• <kbd className="bg-muted px-1 py-0.5 rounded">⇧⌥C</kbd> - Business Classes</li>
                <li>• <kbd className="bg-muted px-1 py-0.5 rounded">1-4</kbd> - Switch tabs</li>
              </ul>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
} 