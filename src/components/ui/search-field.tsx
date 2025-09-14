"use client"

import { forwardRef } from "react"
import { Search } from "lucide-react"
import { cn } from '@/lib/utils/generalUtils'

export interface SearchFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  placeholder?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

/**
 * SearchField component
 * 
 * A consistent search input field with icon and styling used across the application.
 */
const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(({
  className,
  placeholder = "Search...",
  value,
  onChange,
  ...props
}, ref) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="h-4 w-4 text-slate-400" />
      </div>
      <input
        ref={ref}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={cn(
          "w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm text-slate-900",
          "bg-slate-100 placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent",
          "transition-colors",
          className
        )}
        {...props}
      />
    </div>
  )
})

SearchField.displayName = "SearchField"

export { SearchField } 