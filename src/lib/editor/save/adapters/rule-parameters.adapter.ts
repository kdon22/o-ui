'use client'

import type { TabSaveAdapter, TabSnapshot } from '../types'

interface RuleParametersSnapshot extends TabSnapshot {
    schema?: any // Complete UnifiedSchema object for IntelliSense
    parameters?: any[]
    returnType?: string
}

export const ruleParametersAdapter: TabSaveAdapter<RuleParametersSnapshot> = {
    actionName: 'rule.update',
    getEntityKey: ({ id, tab }) => `rule:${id}:${tab}`,
    hasChanges: (prev, curr) => {
        if (!prev) return true
        try {
            // Compare the full schema object for changes
            return JSON.stringify(prev.schema) !== JSON.stringify(curr.schema)
        } catch {
            return true
        }
    },
    buildPayload: (id, curr) => ({
        id,
        // Only send the complete schema object - this contains all parameter info
        ...(curr.schema !== undefined ? { schema: curr.schema } : {})
    })
}
