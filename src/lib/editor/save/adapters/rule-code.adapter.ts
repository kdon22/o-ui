'use client'

import type { TabSaveAdapter, TabSnapshot } from '../types'

interface RuleCodeSnapshot extends TabSnapshot {
    sourceCode: string
    pythonCode?: string
}

export const ruleCodeAdapter: TabSaveAdapter<RuleCodeSnapshot> = {
    actionName: 'rule.update',
    getEntityKey: ({ id, tab }) => {
        const key = `rule:${id}:${tab}`
        console.log('🔑 [ruleCodeAdapter] getEntityKey called:', { id, tab, key })
        return key
    },
    hasChanges: (prev, curr) => {
        const hasChanges = !prev ? true : prev.sourceCode !== curr.sourceCode
        console.log('🔄 [ruleCodeAdapter] hasChanges check:', {
            hasPrev: !!prev,
            prevSourceLength: prev?.sourceCode?.length || 0,
            currSourceLength: curr?.sourceCode?.length || 0,
            hasChanges,
            prevPreview: prev?.sourceCode?.substring(0, 50) + '...' || 'none',
            currPreview: curr?.sourceCode?.substring(0, 50) + '...' || 'none'
        })
        return hasChanges
    },
    buildPayload: (id, curr) => {
        const payload = {
            id,
            sourceCode: curr.sourceCode,
            ...(curr.pythonCode !== undefined ? { pythonCode: curr.pythonCode } : {})
        }
        console.log('📦 [ruleCodeAdapter] buildPayload called:', {
            id,
            sourceCodeLength: curr.sourceCode?.length || 0,
            pythonCodeLength: curr.pythonCode?.length || 0,
            payload
        })
        return payload
    }
}
