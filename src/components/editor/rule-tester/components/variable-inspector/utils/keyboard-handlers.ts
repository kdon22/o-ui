import { useEffect } from 'react'
import { KEYBOARD_SHORTCUTS } from '../constants'

interface KeyboardHandlersProps {
  isSearchActive: boolean
  hasMatches: boolean
  onBackToTop: () => void
  onNextMatch: () => void
  onPreviousMatch: () => void
}

export function useKeyboardHandlers({
  isSearchActive,
  hasMatches,
  onBackToTop,
  onNextMatch,
  onPreviousMatch
}: KeyboardHandlersProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when search is active
      if (!isSearchActive || !hasMatches) return

      switch (event.key) {
        case KEYBOARD_SHORTCUTS.ESCAPE:
          event.preventDefault()
          onBackToTop()
          break
        case KEYBOARD_SHORTCUTS.F3:
          event.preventDefault()
          if (event.shiftKey) {
            onPreviousMatch()
          } else {
            onNextMatch()
          }
          break
        case KEYBOARD_SHORTCUTS.ARROW_DOWN:
          if (event.ctrlKey && event.shiftKey) {
            event.preventDefault()
            onNextMatch()
          }
          break
        case KEYBOARD_SHORTCUTS.ARROW_UP:
          if (event.ctrlKey && event.shiftKey) {
            event.preventDefault()
            onPreviousMatch()
          }
          break
        case KEYBOARD_SHORTCUTS.HOME:
          if (event.ctrlKey) {
            event.preventDefault()
            onBackToTop()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSearchActive, hasMatches, onBackToTop, onNextMatch, onPreviousMatch])
}