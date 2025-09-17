'use client'

import type { TabSaveAdapter, TabSnapshot } from '../types'

interface RuleDocSnapshot extends TabSnapshot {
    documentation?: string
    examples?: string
    notes?: string
    changelog?: string
}

export const ruleDocumentationAdapter: TabSaveAdapter<RuleDocSnapshot> = {
    actionName: 'rule.update',
    getEntityKey: ({ id, tab }) => `rule:${id}:${tab}`,
    hasChanges: (prev, curr) => {
        if (!prev) return true
        return (
            prev.documentation !== curr.documentation ||
            prev.examples !== curr.examples ||
            prev.notes !== curr.notes ||
            prev.changelog !== curr.changelog
        )
    },
    buildPayload: (id, curr) => ({
        id,
        ...(curr.documentation !== undefined ? { documentation: curr.documentation } : {}),
        ...(curr.examples !== undefined ? { examples: curr.examples } : {}),
        ...(curr.notes !== undefined ? { notes: curr.notes } : {}),
        ...(curr.changelog !== undefined ? { changelog: curr.changelog } : {})
    })
}
