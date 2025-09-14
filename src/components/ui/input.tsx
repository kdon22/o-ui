/**
 * Input Component
 * 
 * A flexible input component with Stripe-inspired styling.
 * Includes focus states, validation indicators, and error handling.
 */

import React, { useState, useId } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils/generalUtils'

/**
 * Input props interface extending input HTML attributes
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Optional prefix element to display before the input text
   */
  prefixElement?: React.ReactNode
  
  /**
   * Optional suffix element to display after the input text
   */
  suffixElement?: React.ReactNode
  
  /**
   * Whether the input has an error
   */
  hasError?: boolean
  
  /**
   * Optional error message to display
   */
  errorMessage?: string

  /**
   * Optional helper text to display below input
   */
  helperText?: string

  /**
   * Optional label for the input
   */
  label?: string

  /**
   * Whether to show success indicator when value is present
   */
  showSuccessIndicator?: boolean

  /**
   * Size of the input
   */
  inputSize?: 'sm' | 'md' | 'lg'
}

/**
 * Input Component
 * 
 * @param prefixElement - Element to display before the input
 * @param suffixElement - Element to display after the input
 * @param hasError - Whether the input has an error
 * @param errorMessage - Error message to display
 * @param helperText - Helper text to display below input
 * @param label - Label for the input
 * @param className - Additional CSS classes
 * @param showSuccessIndicator - Whether to show success icon when value is present
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type,
    prefixElement,
    suffixElement,
    hasError,
    errorMessage,
    helperText,
    label,
    id,
    value,
    showSuccessIndicator = true,
    inputSize = 'md',
    ...props
  }, ref) => {
    const [focused, setFocused] = useState(false)
    const reactId = useId()
    const inputId = id || `input-${reactId.replace(/:/g, '')}`
    const hasValue = value !== undefined && value !== ''

    // Size-based classes
    const sizeClasses = {
      sm: 'px-3 py-1 text-sm',
      md: 'px-3 py-2 text-base', 
      lg: 'px-4 py-3 text-lg'
    }

    // Main input classes
    const inputClasses = cn(
      // Base styles
      'w-full text-gray-900 placeholder-gray-400 border rounded-md transition-all duration-200',
      'focus:outline-none',
      
      // Size classes
      sizeClasses[inputSize],
      
      // Focus, error and hover states
      {
        'pl-10': prefixElement,
        'pr-10': suffixElement || (hasValue && !hasError && showSuccessIndicator),
        'border-red-500 shadow-[0_0_0_1px_rgba(220,38,38,0.5),0_1px_1px_0_rgba(0,0,0,0.07),0_0_0_4px_rgba(220,38,38,0.1)]': hasError,
        'border-gray-700 shadow-[0_0_0_1px_rgba(55,65,81,0.3),0_1px_1px_0_rgba(0,0,0,0.05),0_0_0_3px_rgba(55,65,81,0.08)]': focused && !hasError,
        'border-gray-300 shadow-sm hover:border-gray-400': !focused && !hasError,
        'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed': props.disabled,
      },
      
      // Additional custom classes
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
          <label htmlFor={inputId} className={labelClasses}>
            {label}
          </label>
        )}
        
        <div className="relative">
          {prefixElement && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              {prefixElement}
            </div>
          )}
          
          <input
            id={inputId}
            type={type}
            className={inputClasses}
            ref={ref}
            value={props.onChange ? (value ?? '') : undefined}
            defaultValue={!props.onChange ? (value ?? '') : undefined}
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
          
          {suffixElement && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              {suffixElement}
            </div>
          )}

          {hasValue && !hasError && showSuccessIndicator && !suffixElement && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 pointer-events-none">
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

Input.displayName = 'Input' 