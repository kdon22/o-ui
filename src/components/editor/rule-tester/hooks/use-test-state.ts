"use client"

import { useState, useCallback } from 'react'
import type { TestSession, ExecutionResult } from '../types'

export const useTestState = (businessRules: string, pythonCode: string) => {
  const [session, setSession] = useState<TestSession>({
    id: `test-${Date.now()}`,
    businessRules,
    pythonCode,
    status: 'idle'
  })

  const [result, setResult] = useState<ExecutionResult | null>(null)

  const startTest = useCallback(() => {
    setSession(prev => ({
      ...prev,
      status: 'running',
      startedAt: new Date(),
      error: undefined
    }))
    setResult(null)
  }, [])

  const completeTest = useCallback((executionResult: ExecutionResult) => {
    setSession(prev => ({
      ...prev,
      status: executionResult.success ? 'completed' : 'error',
      completedAt: new Date(),
      error: executionResult.error
    }))
    setResult(executionResult)
  }, [])

  const resetTest = useCallback(() => {
    setSession(prev => ({
      ...prev,
      status: 'idle',
      startedAt: undefined,
      completedAt: undefined,
      error: undefined
    }))
    setResult(null)
  }, [])

  return { session, result, startTest, completeTest, resetTest }
} 