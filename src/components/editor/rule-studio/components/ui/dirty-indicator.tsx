/**
 * 🏆 DirtyIndicator - Unsaved Changes Indicator
 * 
 * Visual indicators for unsaved changes in tabs and UI.
 * Clean, consistent styling for change tracking.
 */

interface DirtyIndicatorProps {
  isDirty: boolean
  title?: string
  size?: 'sm' | 'md'
  variant?: 'dot' | 'text'
}

export function DirtyIndicator({ 
  isDirty, 
  title = 'Unsaved changes',
  size = 'sm',
  variant = 'dot'
}: DirtyIndicatorProps) {
  
  if (!isDirty) return null
  
  if (variant === 'dot') {
    const sizeClasses = {
      sm: 'w-2 h-2',
      md: 'w-3 h-3'
    }
    
    return (
      <div 
        className={`${sizeClasses[size]} bg-orange-500 rounded-full flex-shrink-0`}
        title={title}
      />
    )
  }
  
  return (
    <span className="text-xs text-orange-600 font-medium">
      {title}
    </span>
  )
}

export function TabDirtyIndicator({ isDirty }: { isDirty: boolean }) {
  return (
    <DirtyIndicator
      isDirty={isDirty}
      title="Unsaved changes"
      size="sm"
      variant="dot"
    />
  )
}

export function SaveStatusIndicator({ 
  isDirty, 
  saving 
}: { 
  isDirty: boolean
  saving: boolean 
}) {
  
  if (saving) {
    return (
      <div className="flex items-center gap-1 text-xs text-blue-600">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <span>Saving...</span>
      </div>
    )
  }
  
  if (isDirty) {
    return (
      <div className="flex items-center gap-1 text-xs text-orange-600">
        <div className="w-2 h-2 bg-orange-500 rounded-full" />
        <span>Unsaved changes</span>
      </div>
    )
  }
  
  return (
    <div className="flex items-center gap-1 text-xs text-green-600">
      <div className="w-2 h-2 bg-green-500 rounded-full" />
      <span>Saved</span>
    </div>
  )
}
