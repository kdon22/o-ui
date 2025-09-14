import { Button } from '@/components/ui/button'
import { Play, Square, RotateCcw, Bug } from 'lucide-react'
import type { TestSession } from '../types'

interface DebugControlsProps {
  session: TestSession
  onStart: () => void
  onReset: () => void
  onDebugToggle: () => void
}

export const DebugControls = ({ session, onStart, onReset, onDebugToggle }: DebugControlsProps) => {
  const isRunning = session.status === 'running' || session.status === 'debugging'

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={onStart}
          disabled={isRunning}
          className="flex-1 h-8 text-xs"
        >
          <Play className="w-3 h-3 mr-1" />
          {session.status === 'debugging' ? 'Continue' : 'Run Test'}
        </Button>

        <Button
          size="sm"
          variant="outline" 
          onClick={onReset}
          className="h-8 px-2"
        >
          <RotateCcw className="w-3 h-3" />
        </Button>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={onDebugToggle}
        className="w-full h-8 text-xs"
        disabled={isRunning}
      >
        <Bug className="w-3 h-3 mr-1" />
        Debug Mode
      </Button>
    </div>
  )
} 