'use client'

import { useState, useCallback } from 'react'
import { FONT_FAMILY_OPTIONS } from '../constants/font-options'

export function useFontAvailability() {
  const [fontAvailability, setFontAvailability] = useState<Record<string, boolean>>({})

  // Check which fonts are actually available
  const checkFontAvailability = useCallback(() => {
    if (typeof window === 'undefined') return

    const testString = 'mmmmmmmmmmlli'
    const fallbackFont = 'monospace'
    
    // Create a test element
    const testElement = document.createElement('div')
    testElement.style.position = 'absolute'
    testElement.style.visibility = 'hidden'
    testElement.style.fontSize = '72px'
    testElement.style.fontFamily = fallbackFont
    testElement.innerHTML = testString
    document.body.appendChild(testElement)
    
    const fallbackWidth = testElement.offsetWidth
    const fallbackHeight = testElement.offsetHeight
    
    const availability: Record<string, boolean> = {}
    
    FONT_FAMILY_OPTIONS.forEach(font => {
      testElement.style.fontFamily = font.value + ', ' + fallbackFont
      const hasFont = testElement.offsetWidth !== fallbackWidth || testElement.offsetHeight !== fallbackHeight
      availability[font.label] = hasFont || font.webFont // Web fonts should be available
    })
    
    document.body.removeChild(testElement)
    setFontAvailability(availability)
    
  }, [])

  return {
    fontAvailability,
    checkFontAvailability
  }
}