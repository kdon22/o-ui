'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Command } from 'lucide-react'
import { cn } from '@/lib/utils/generalUtils'

export interface HeaderSearchProps {
  onSearch?: (query: string) => void
  className?: string
}

export function HeaderSearch({ onSearch, className }: HeaderSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        inputRef.current?.focus()
      }
      
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setQuery('')
        inputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    onSearch?.(searchQuery)
  }

  const handleFocus = () => {
    setIsOpen(true)
  }

  const handleBlur = () => {
    // Delay to allow for click events
    setTimeout(() => {
      setIsOpen(false)
    }, 150)
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          ref={inputRef}
          type="search"
          placeholder="Search everything..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            "w-64 rounded-md border border-input bg-background py-2 pl-10 pr-12 text-sm",
            "placeholder:text-muted-foreground",
            "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "transition-all duration-200",
            isOpen && "ring-2 ring-ring ring-offset-2"
          )}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Command className="h-3 w-3" />
            <span>K</span>
          </div>
        </div>
      </div>
      
      {/* Search Results Dropdown */}
      {isOpen && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-md shadow-lg z-50">
          <div className="p-3">
            <div className="text-sm text-muted-foreground">
              Search results for "{query}"
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {/* TODO: Implement real search results */}
              No results found. Universal search coming soon...
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 