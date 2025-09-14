/**
 * TextArea Component
 * 
 * A flexible textarea component with Stripe-inspired styling.
 * Includes focus states, validation indicators, and error handling.
 */

import React, { useState } from "react"
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils/generalUtils'

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Whether the textarea has an error
   */
  hasError?: boolean
  
  /**
   * Optional error message to display
   */
  errorMessage?: string

  /**
   * Optional helper text to display below textarea
   */
  helperText?: string

  /**
   * Optional label for the textarea
   */
  label?: string

  /**
   * Whether to show success indicator when value is present
   */
  showSuccessIndicator?: boolean
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ 
    className, 
    hasError, 
    errorMessage, 
    helperText, 
    label, 
    id,
    value,
    showSuccessIndicator = true,
    ...props 
  }, ref) => {
    const [focused, setFocused] = useState(false)
    const textareaId = id || `textarea-${Math.random().toString(36).substring(2, 9)}`
    const hasValue = value !== undefined && value !== ''

    // Main textarea classes
    const textareaClasses = cn(
      // Base styles
      "w-full min-h-[80px] px-3 py-2 text-gray-900 placeholder-gray-400 border rounded-md text-base transition-all duration-200",
      "focus:outline-none resize-vertical",
      
      // Focus, error and hover states
      {
        'border-red-500 shadow-[0_0_0_1px_rgba(220,38,38,0.5),0_1px_1px_0_rgba(0,0,0,0.07),0_0_0_4px_rgba(220,38,38,0.1)]': hasError,
        'border-gray-700 shadow-[0_0_0_1px_rgba(55,65,81,0.3),0_1px_1px_0_rgba(0,0,0,0.05),0_0_0_3px_rgba(55,65,81,0.08)]': focused && !hasError,
        'border-gray-300 shadow-sm hover:border-gray-400': !focused && !hasError,
        'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed': props.disabled,
      },
      
      className
    )

    const labelClasses = cn(
      'block text-sm font-medium mb-1 transition-colors duration-200',
      {
        'text-red-500': hasError,
        'text-gray-700': focused && !hasError,
        'text-gray-600': !focused && !hasError,
        'text-gray-500': props.disabled,
      }
    )

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className={labelClasses}>
            {label}
          </label>
        )}
        
        <div className="relative">
          <textarea
            id={textareaId}
            className={textareaClasses}
            ref={ref}
            value={value}
            onFocus={(e) => {
              setFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          />
          
          {hasValue && !hasError && showSuccessIndicator && (
            <div className="absolute right-3 top-3 text-green-500 pointer-events-none">
              <Check className="h-5 w-5" />
            </div>
          )}
        </div>
        
        {hasError && errorMessage && (
          <p className="mt-1 text-sm text-red-500">{errorMessage}</p>
        )}

        {helperText && !hasError && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)
TextArea.displayName = "TextArea"

export { TextArea } 