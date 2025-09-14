"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"
import { cn } from '@/lib/utils/generalUtils'
import { SearchField } from "./search-field"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    icon?: React.ReactNode
    label?: string
  }
>(({ className, children, icon, label, ...props }, ref) => {
  // We'll create a simple component that doesn't use complex state management
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex h-9 w-full items-center justify-between whitespace-nowrap",
          "rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
          "shadow-sm hover:border-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all duration-200",
          className
        )}
        {...props}
      >
        {icon ? (
          <div className="flex items-center gap-2">
            {icon}
            {children}
          </div>
        ) : (
          children
        )}
        <ChevronDown className="h-4 w-4 text-gray-400 transition-transform duration-200 data-[state=open]:rotate-180" />
      </SelectPrimitive.Trigger>
    </div>
  );
})
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

// Custom SelectContent with search functionality
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
    showSearch?: boolean
  }
>(({ className, children, position = "popper", showSearch, ...props }, ref) => {
  const [searchTerm, setSearchTerm] = React.useState("")
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const childrenArray = React.Children.toArray(children)
  // Debug: Track SelectContent rendering
  if (childrenArray.length > 0) {
    console.log('🎪 SelectContent:', {
      itemCount: childrenArray.length,
      validSelectItems: childrenArray.filter(child => 
        React.isValidElement(child) && (child.type as any)?.displayName === 'SelectItem'
      ).length
    });
  }

  const childCount = React.Children.count(childrenArray.filter(
    child => React.isValidElement(child) && 
    (child.type as any)?.displayName === SelectItem.displayName
  ))
  
  // Determine if we should show search (9 or more options or explicitly enabled)
  const shouldShowSearch = showSearch || childCount >= 9
  
  // Focus search input when content opens
  React.useEffect(() => {
    if (shouldShowSearch && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 0)
    }
  }, [shouldShowSearch])

  // Filter children based on search term
  const filteredChildren = React.Children.map(children, (child) => {
    if (
      !searchTerm || 
      !React.isValidElement(child) || 
      (child.type as any)?.displayName !== SelectItem.displayName
    ) {
      return child
    }

    // Type casting to access props safely
    const childElement = child as React.ReactElement<{
      children: React.ReactNode;
      textValue?: string;
    }>;

    // Get text for filtering: Prefer textValue, fallback to string children
    let filterText = '';
    if (typeof childElement.props.textValue === 'string') {
      filterText = childElement.props.textValue.toLowerCase();
    } else if (typeof childElement.props.children === 'string') {
      filterText = childElement.props.children.toLowerCase();
    }
    
    // Perform filtering
    if (filterText.includes(searchTerm.toLowerCase())) {
      return child
    }
    return null
  })

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-[9999] min-w-[8rem] max-h-[400px] overflow-visible rounded-md bg-white border border-gray-200",
          "shadow-[0_4px_12px_rgba(0,0,0,0.1),0_0_1px_rgba(0,0,0,0.1)]",
          "animate-in fade-in-0 zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        onCloseAutoFocus={(e) => {
          if (searchTerm) {
            setSearchTerm("")
          }
          props.onCloseAutoFocus?.(e)
        }}
        {...props}
      >
        {shouldShowSearch && (
          <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
            <SearchField
              ref={searchInputRef}
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-50"
              aria-autocomplete="list"
            />
          </div>
        )}
        <SelectPrimitive.Viewport
          className={cn(
            "p-1 bg-white max-h-[300px] overflow-auto",
            position === "popper" &&
              "w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {searchTerm && filteredChildren?.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">No results found</div>
          ) : (
            filteredChildren
          )}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold text-gray-700", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
    icon?: React.ReactNode
  }
>(({ className, children, icon, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center gap-2",
      "rounded-sm py-2 pl-2 pr-8 text-sm outline-none",
      "hover:bg-gray-50 focus:bg-gray-50",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "data-[state=checked]:bg-gray-50",
      "transition-colors duration-200",
      className
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-[#CC3333]" />
      </SelectPrimitive.ItemIndicator>
    </span>
    {icon}
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-gray-200", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

interface MultiSelectProps {
  placeholder?: string
  children: React.ReactNode
  value?: string[]
  onValueChange?: (value: string[]) => void
  disabled?: boolean
  name?: string
  label?: string
  icon?: React.ReactNode
  className?: string
}

interface SelectItemElement extends React.ReactElement {
  props: {
    value: string
    onClick?: (event: React.MouseEvent) => void
    'data-state'?: string
    icon?: React.ReactNode
  }
}

const MultiSelect = React.forwardRef<
  HTMLButtonElement,
  MultiSelectProps
>(({ placeholder, children, value, onValueChange, label, icon, className, ...props }, ref) => {
  const [selected, setSelected] = React.useState<string[]>(value || [])
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const childrenArray = React.Children.toArray(children)
  const childCount = React.Children.count(childrenArray.filter(
    child => React.isValidElement(child) && 
    (child.type as any)?.displayName === SelectItem.displayName
  ))

  React.useEffect(() => {
    if (value) {
      setSelected(value)
    }
  }, [value])

  const handleValueChange = (itemValue: string) => {
    const newSelected = selected.includes(itemValue)
      ? selected.filter((item) => item !== itemValue)
      : [...selected, itemValue]
    setSelected(newSelected)
    onValueChange?.(newSelected)
  }

  // Filter children based on search term
  const filteredChildren = React.Children.map(children, (child) => {
    if (
      !searchTerm || 
      !React.isValidElement(child) || 
      (child.type as any)?.displayName !== SelectItem.displayName
    ) {
      return child
    }

    const childElement = child as React.ReactElement<{
      children: React.ReactNode;
      textValue?: string;
      value: string;
    }>;

    let filterText = '';
    if (typeof childElement.props.textValue === 'string') {
      filterText = childElement.props.textValue.toLowerCase();
    } else if (typeof childElement.props.children === 'string') {
      filterText = childElement.props.children.toLowerCase();
    }
    
    if (filterText.includes(searchTerm.toLowerCase())) {
      return child
    }
    return null
  })

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <div className="relative">
        <button
          ref={ref}
          type="button"
          className={cn(
            "flex h-9 w-full items-center justify-between whitespace-nowrap",
            "rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
            "shadow-sm hover:border-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-200",
            className
          )}
          onClick={() => setIsOpen(!isOpen)}
          {...props}
        >
          <span className="flex items-center gap-2">
            {icon}
            {selected.length > 0
              ? `${selected.length} selected`
              : placeholder}
          </span>
          <ChevronDown className={cn(
            "h-4 w-4 text-gray-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </button>
        
        {isOpen && (
          <div className={cn(
            "absolute z-[9999] mt-1 w-full min-w-[8rem] max-h-[400px] overflow-visible rounded-md bg-white border border-gray-200",
            "shadow-[0_4px_12px_rgba(0,0,0,0.1),0_0_1px_rgba(0,0,0,0.1)]",
            "animate-in fade-in-0 zoom-in-95"
          )}>
            {childCount > 8 && (
              <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                <SearchField
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-50"
                />
              </div>
            )}
            <div className="p-1 bg-white max-h-[300px] overflow-auto">
              {searchTerm && filteredChildren?.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">No results found</div>
              ) : (
                React.Children.map(filteredChildren, (child) => {
                  if (
                    React.isValidElement<any>(child) &&
                    (child.type as any).displayName === SelectItem.displayName
                  ) {
                    const selectItem = child as SelectItemElement
                    const isSelected = selected.includes(selectItem.props.value)
                    return (
                      <div
                        key={selectItem.props.value}
                        className={cn(
                          "relative flex w-full cursor-pointer select-none items-center gap-2",
                          "rounded-sm py-2 pl-2 pr-8 text-sm outline-none",
                          "hover:bg-gray-50 focus:bg-gray-50",
                          "transition-colors duration-200",
                          isSelected && "bg-gray-50"
                        )}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleValueChange(selectItem.props.value)
                        }}
                      >
                        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                          {isSelected && <Check className="h-4 w-4 text-[#CC3333]" />}
                        </span>
                        {selectItem.props.children}
                      </div>
                    )
                  }
                  return child
                })
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9998]" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
})
MultiSelect.displayName = "MultiSelect"

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  MultiSelect,
} 