'use client'

import type { TabSaveAdapter, TabSnapshot } from '../types'

interface PythonCodeSnapshot extends TabSnapshot {
    pythonCode: string
}

export const pythonCodeAdapter: TabSaveAdapter<PythonCodeSnapshot> = {
    actionName: 'rule.update',
    getEntityKey: ({ id, tab }) => `rule:${id}:${tab}`,
    hasChanges: (prev, curr) => {
        if (!prev) return true
        return prev.pythonCode !== curr.pythonCode
    },
    buildPayload: (id, curr) => ({ id, pythonCode: curr.pythonCode })
}


