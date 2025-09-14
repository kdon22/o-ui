import { useState, useEffect, useRef } from 'react'
import { SCROLL_THRESHOLD, NAVIGATION_CONTROLS } from '../constants'

export function useScrollControls() {
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [navControlsPosition, setNavControlsPosition] = useState<{ top: number; right: number }>({ 
    top: NAVIGATION_CONTROLS.TOP_OFFSET, 
    right: NAVIGATION_CONTROLS.RIGHT_OFFSET 
  })
  
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Scroll detection for back-to-top button and navigation positioning
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const containerHeight = container.clientHeight
      setShowBackToTop(scrollTop > SCROLL_THRESHOLD)
      
      // Position navigation controls to follow scroll but stay in viewport
      // Keep them in the upper part of the visible area for easy access
      const viewportTop = scrollTop + NAVIGATION_CONTROLS.TOP_OFFSET
      const viewportBottom = scrollTop + containerHeight - NAVIGATION_CONTROLS.BOTTOM_BUFFER
      const preferredTop = scrollTop + NAVIGATION_CONTROLS.PREFERRED_TOP_OFFSET // Prefer positioning in upper third
      
      setNavControlsPosition({ 
        top: Math.max(viewportTop, Math.min(preferredTop, viewportBottom)), 
        right: NAVIGATION_CONTROLS.RIGHT_OFFSET 
      })
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const resetNavControlsToTop = () => {
    setNavControlsPosition({ 
      top: NAVIGATION_CONTROLS.TOP_OFFSET, 
      right: NAVIGATION_CONTROLS.RIGHT_OFFSET 
    })
  }

  const updateNavControlsPosition = (position: { top: number; right: number }) => {
    setNavControlsPosition(position)
  }

  return {
    showBackToTop,
    navControlsPosition,
    scrollContainerRef,
    resetNavControlsToTop,
    updateNavControlsPosition
  }
}