'use client'

import { useState, useEffect } from 'react'
import { DollarSign } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/generalUtils'

interface CurrencyFieldProps {
  value?: number
  onChange?: (value: number | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  label?: string
  description?: string
  required?: boolean
  min?: number
  max?: number
  currency?: string
}

export function CurrencyField({
  value,
  onChange,
  placeholder = '0.00',
  disabled = false,
  className,
  label,
  description,
  required = false,
  min = 0,
  max = 999999.99,
  currency = 'USD'
}: CurrencyFieldProps) {
  const [displayValue, setDisplayValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  // Format number as currency for display
  const formatCurrency = (num: number | undefined): string => {
    if (num === undefined || num === null || isNaN(num)) return ''
    return num.toFixed(2)
  }

  // Parse currency string to number
  const parseCurrency = (str: string): number | undefined => {
    if (!str.trim()) return undefined
    
    // Remove currency symbols and spaces
    const cleaned = str.replace(/[$,\s]/g, '')
    const parsed = parseFloat(cleaned)
    
    if (isNaN(parsed)) return undefined
    return Math.max(min, Math.min(max, parsed))
  }

  // Update display value when value prop changes
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatCurrency(value))
    }
  }, [value, isFocused])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setDisplayValue(inputValue)
    
    const numericValue = parseCurrency(inputValue)
    onChange?.(numericValue)
  }

  const handleFocus = () => {
    setIsFocused(true)
    // Show raw number when focused for easier editing
    setDisplayValue(value ? value.toString() : '')
  }

  const handleBlur = () => {
    setIsFocused(false)
    // Format as currency when not focused
    const numericValue = parseCurrency(displayValue)
    setDisplayValue(formatCurrency(numericValue))
    onChange?.(numericValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, period, and numbers
    if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Allow home, end, left, right
        (e.keyCode >= 35 && e.keyCode <= 39)) {
      return
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault()
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className={cn(required && 'after:content-["*"] after:text-red-500 after:ml-1')}>
          {label}
        </Label>
      )}
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <DollarSign className="h-4 w-4" />
        </div>
        
        <Input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'pl-10',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        />
        
        {currency !== 'USD' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {currency}
          </div>
        )}
      </div>
      
      {description && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      {value !== undefined && (
        <div className="text-xs text-muted-foreground">
          Formatted: ${formatCurrency(value)} {currency}
        </div>
      )}
    </div>
  )
}
