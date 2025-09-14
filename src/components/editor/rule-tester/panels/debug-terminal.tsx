import React, { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Terminal, Trash2, Download, Play } from 'lucide-react'
import { cn } from '@/lib/utils/generalUtils'
import type { DebugTerminalMessage } from '../types'

interface DebugTerminalProps {
  messages: DebugTerminalMessage[]
  onClear: () => void
  onExecuteCommand?: (command: string) => void
  className?: string
}

export const DebugTerminal = ({ 
  messages, 
  onClear, 
  onExecuteCommand,
  className 
}: DebugTerminalProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const getMessageIcon = (type: DebugTerminalMessage['type']) => {
    switch (type) {
      case 'output': return '▶'
      case 'error': return '❌'
      case 'info': return 'ℹ'
      case 'debug': return '🐛'
      case 'trace': return '📍'
      case 'step': return '👣'
      default: return '•'
    }
  }

  const getMessageColor = (type: DebugTerminalMessage['type']) => {
    switch (type) {
      case 'output': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'info': return 'text-blue-600'
      case 'debug': return 'text-yellow-600'
      case 'trace': return 'text-purple-600'
      case 'step': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const command = e.currentTarget.value.trim()
      if (command && onExecuteCommand) {
        onExecuteCommand(command)
        e.currentTarget.value = ''
      }
    }
  }

  const exportLogs = () => {
    const logContent = messages.map(msg => 
      `[${formatTimestamp(msg.timestamp)}] ${msg.type.toUpperCase()}: ${msg.content}${msg.line ? ` (Line ${msg.line})` : ''}`
    ).join('\n')
    
    const blob = new Blob([logContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debug-log-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={cn("flex flex-col h-full bg-gray-900 text-green-400 font-mono text-sm", className)}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <span className="text-xs font-medium">Debug Terminal</span>
          <span className="text-xs text-gray-400">({messages.length} messages)</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={exportLogs}
            className="h-6 px-2 text-gray-400 hover:text-green-400 hover:bg-gray-700"
            disabled={messages.length === 0}
          >
            <Download className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClear}
            className="h-6 px-2 text-gray-400 hover:text-red-400 hover:bg-gray-700"
            disabled={messages.length === 0}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Terminal Content */}
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="p-3 space-y-1">
          {messages.length === 0 ? (
            <div className="text-gray-500 italic text-center py-8">
              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Debug terminal ready...</p>
              <p className="text-xs mt-1">Start debugging to see execution traces</p>
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id}
                className="flex items-start gap-2 hover:bg-gray-800 px-2 py-1 rounded-sm group"
              >
                {/* Timestamp */}
                <span className="text-gray-500 text-xs font-mono w-20 flex-shrink-0">
                  {formatTimestamp(message.timestamp)}
                </span>
                
                {/* Message Type Icon */}
                <span className={cn("w-4 flex-shrink-0", getMessageColor(message.type))}>
                  {getMessageIcon(message.type)}
                </span>
                
                {/* Line Number */}
                {message.line && (
                  <span className="text-blue-400 text-xs w-8 flex-shrink-0">
                    L{message.line}
                  </span>
                )}
                
                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <span className={cn("break-words", getMessageColor(message.type))}>
                    {message.content}
                  </span>
                  
                  {/* Variable Summary */}
                  {message.variables && message.variables.length > 0 && (
                    <div className="text-xs text-gray-400 mt-1 space-x-2">
                      {message.variables.slice(0, 3).map((v, i) => (
                        <span key={i} className="inline-block">
                          <span className="text-blue-300">{v.name}</span>
                          <span>=</span>
                          <span className="text-yellow-300">{String(v.value)}</span>
                        </span>
                      ))}
                      {message.variables.length > 3 && (
                        <span className="text-gray-500">+{message.variables.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Command Input (if enabled) */}
      {onExecuteCommand && (
        <div className="px-3 py-2 bg-gray-800 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-green-400">$</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Enter debug command..."
              className="flex-1 bg-transparent text-green-400 text-sm border-none outline-none placeholder-gray-500"
              onKeyPress={handleKeyPress}
            />
            <Play className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      )}
    </div>
  )
} 