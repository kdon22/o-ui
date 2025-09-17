'use client'

import type { TabSaveAdapter, TabSnapshot } from '../types'

interface RuleCodeSnapshot extends TabSnapshot {
    sourceCode: string
    pythonCode?: string
}

export const ruleCodeAdapter: TabSaveAdapter<RuleCodeSnapshot> = {
    actionName: 'rule.update',
    getEntityKey: ({ id, tab }) => `rule:${id}:${tab}`,
    hasChanges: (prev, curr) => {
        if (!prev) return true
        return prev.sourceCode !== curr.sourceCode
    },
    buildPayload: (id, curr) => ({
        id,
        sourceCode: curr.sourceCode,
        ...(curr.pythonCode !== undefined ? { pythonCode: curr.pythonCode } : {})
    })
}


