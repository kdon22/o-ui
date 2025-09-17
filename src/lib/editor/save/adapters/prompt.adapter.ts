'use client'

import type { TabSaveAdapter, TabSnapshot } from '../types'

interface PromptSnapshot extends TabSnapshot {
    layout: any
    promptName?: string
    content?: string
    isPublic?: boolean
    executionMode?: string
}

export const promptAdapter: TabSaveAdapter<PromptSnapshot> = {
    actionName: 'prompt.update',
    getEntityKey: ({ id, tab }) => `prompt:${id}:${tab}`,
    hasChanges: (prev, curr) => {
        if (!prev) return true
        try {
            return JSON.stringify(prev.layout) !== JSON.stringify(curr.layout)
        } catch {
            return true
        }
    },
    buildPayload: (id, curr) => {
        // Only include scalar fields and layout; do not include ruleId here
        return {
            id,
            layout: curr.layout,
            ...(curr.promptName !== undefined ? { promptName: curr.promptName } : {}),
            ...(curr.content !== undefined ? { content: curr.content } : {}),
            ...(curr.isPublic !== undefined ? { isPublic: curr.isPublic } : {}),
            ...(curr.executionMode !== undefined ? { executionMode: curr.executionMode } : {})
        }
    }
}
