'use client'

import * as React from 'react'

// Types for toast
export type ToastProps = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  duration?: number
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info'
  onOpenChange?: (open: boolean) => void
}

// Context type
type ToastContextType = {
  toasts: ToastProps[]
  addToast: (props: Omit<ToastProps, 'id'>) => string
  updateToast: (id: string, props: Partial<ToastProps>) => void
  dismissToast: (id: string) => void
  dismissAll: () => void
}

// Create context with default values
const ToastContext = React.createContext<ToastContextType>({
  toasts: [],
  addToast: () => '',
  updateToast: () => {},
  dismissToast: () => {},
  dismissAll: () => {},
})

// Provider component
export function ToastProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])
  
  // Function to dismiss a toast - defined first to avoid reference issues
  const dismissToast = React.useCallback(
    (id: string) => {
      setToasts((prev) => {
        const toast = prev.find((t) => t.id === id)
        if (toast?.onOpenChange) {
          toast.onOpenChange(false)
        }
        return prev.filter((t) => t.id !== id)
      })
    },
    []
  )
  
  // Function to dismiss all toasts
  const dismissAll = React.useCallback(
    () => {
      setToasts([])
    },
    []
  )
  
  // Function to add a new toast
  const addToast = React.useCallback(
    (props: Omit<ToastProps, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9)
      const duration = props.duration || 5000 // Default 5 seconds
      
      setToasts((prev) => [...prev, { id, ...props }])
      
      // Auto-dismiss after duration
      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id)
        }, duration)
      }
      
      return id
    },
    [dismissToast]
  )
  
  // Function to update an existing toast
  const updateToast = React.useCallback(
    (id: string, props: Partial<ToastProps>) => {
      setToasts((prev) =>
        prev.map((toast) =>
          toast.id === id ? { ...toast, ...props } : toast
        )
      )
    },
    []
  )
  
  const value = React.useMemo(
    () => ({
      toasts,
      addToast,
      updateToast,
      dismissToast,
      dismissAll,
    }),
    [toasts, addToast, updateToast, dismissToast, dismissAll]
  )
  
  return React.createElement(ToastContext.Provider, { value }, children);
}

// Hook to use the toast context
export function useToast() {
  const context = React.useContext(ToastContext)
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  
  return {
    ...context,
    // Convenience function with simpler API
    toast: (props: Omit<ToastProps, 'id'>) => context.addToast(props),
    // Specialized variants
    success: (props: Omit<ToastProps, 'id' | 'variant'>) => 
      context.addToast({ ...props, variant: 'success' }),
    error: (props: Omit<ToastProps, 'id' | 'variant'>) => 
      context.addToast({ ...props, variant: 'destructive' }),
    warning: (props: Omit<ToastProps, 'id' | 'variant'>) => 
      context.addToast({ ...props, variant: 'warning' }),
    info: (props: Omit<ToastProps, 'id' | 'variant'>) => 
      context.addToast({ ...props, variant: 'info' }),
  }
}
