'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { X, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/generalUtils'

interface TagsFieldProps {
  value?: string[]
  onChange?: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  label?: string
  description?: string
  required?: boolean
  maxTags?: number
  allowDuplicates?: boolean
  suggestions?: string[]
}

export function TagsField({
  value = [],
  onChange,
  placeholder = 'Type and press Enter to add tags...',
  disabled = false,
  className,
  label,
  description,
  required = false,
  maxTags = 10,
  allowDuplicates = false,
  suggestions = []
}: TagsFieldProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredSuggestions = suggestions.filter(
    suggestion => 
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      (allowDuplicates || !value.includes(suggestion))
  )

  const addTag = (tag: string) => {
    if (!tag.trim() || disabled) return
    
    const trimmedTag = tag.trim()
    
    // Check if tag already exists (unless duplicates allowed)
    if (!allowDuplicates && value.includes(trimmedTag)) return
    
    // Check max tags limit
    if (value.length >= maxTags) return
    
    const newTags = [...value, trimmedTag]
    onChange?.(newTags)
    setInputValue('')
    setShowSuggestions(false)
  }

  const removeTag = (indexToRemove: number) => {
    if (disabled) return
    
    const newTags = value.filter((_, index) => index !== indexToRemove)
    onChange?.(newTags)
  }

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        if (inputValue.trim()) {
          addTag(inputValue)
        }
        break
        
      case 'Backspace':
        if (inputValue === '' && value.length > 0) {
          removeTag(value.length - 1)
        }
        break
        
      case 'Escape':
        setShowSuggestions(false)
        setInputValue('')
        break
        
      case 'ArrowDown':
      case 'ArrowUp':
        // TODO: Handle suggestion navigation
        break
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setShowSuggestions(newValue.length > 0 && filteredSuggestions.length > 0)
  }

  const handleInputFocus = () => {
    if (inputValue.length > 0 && filteredSuggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowSuggestions(false), 150)
  }

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion)
    inputRef.current?.focus()
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className={cn(required && 'after:content-["*"] after:text-red-500 after:ml-1')}>
          {label}
        </Label>
      )}
      
      <div className="relative">
        {/* Tags Container */}
        <div className={cn(
          'min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          disabled && 'cursor-not-allowed opacity-50',
          'flex flex-wrap gap-1 items-center'
        )}>
          {/* Existing Tags */}
          {value.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1"
            >
              <span>{tag}</span>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeTag(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
          
          {/* Input Field */}
          {value.length < maxTags && (
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={value.length === 0 ? placeholder : ''}
              disabled={disabled}
              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-w-[120px]"
            />
          )}
          
          {/* Add Button */}
          {inputValue.trim() && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => addTag(inputValue)}
              disabled={disabled}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover shadow-lg">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {description && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      {/* Tag Count Info */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{value.length} of {maxTags} tags</span>
        {value.length >= maxTags && (
          <span className="text-amber-600">Maximum tags reached</span>
        )}
      </div>
    </div>
  )
}
