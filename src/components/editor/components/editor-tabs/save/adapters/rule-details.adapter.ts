'use client'

import type { TabSaveAdapter, TabSnapshot } from '../types'

interface RuleDetailsSnapshot extends TabSnapshot {
    name?: string
    description?: string
    type?: string
    isActive?: boolean
}

export const ruleDetailsAdapter: TabSaveAdapter<RuleDetailsSnapshot> = {
    actionName: 'rule.update',
    getEntityKey: ({ id, tab }) => `rule:${id}:${tab}`,
    hasChanges: (prev, curr) => {
        if (!prev) return true
        return (
            prev.name !== curr.name ||
            prev.description !== curr.description ||
            prev.type !== curr.type ||
            prev.isActive !== curr.isActive
        )
    },
    buildPayload: (id, curr) => ({
        id,
        ...(curr.name !== undefined ? { name: curr.name } : {}),
        ...(curr.description !== undefined ? { description: curr.description } : {}),
        ...(curr.type !== undefined ? { type: curr.type } : {}),
        ...(curr.isActive !== undefined ? { isActive: curr.isActive } : {})
    })
}


