"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle, Search } from "lucide-react"
import { cn } from '@/lib/utils/generalUtils'

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger> & {
    label?: string
  }
>(({ className, children, label, ...props }, ref) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    )}
    <DropdownMenuPrimitive.Trigger
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
      {children}
    </DropdownMenuPrimitive.Trigger>
  </div>
))
DropdownMenuTrigger.displayName = DropdownMenuPrimitive.Trigger.displayName

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    icon?: React.ReactNode
  }
>(({ className, children, icon, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none",
      "hover:bg-gray-50 focus:bg-gray-50",
      "data-[state=open]:bg-gray-50",
      "transition-colors duration-200",
      className
    )}
    {...props}
  >
    {icon}
    {children}
    <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md bg-white p-1",
      "shadow-[0_4px_12px_rgba(0,0,0,0.1),0_0_1px_rgba(0,0,0,0.1)]",
      "animate-in fade-in-0 zoom-in-95",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
      "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
      "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName

// Custom DropdownMenuContent with search functionality
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
    showSearch?: boolean
  }
>(({ className, sideOffset = 4, children, showSearch, ...props }, ref) => {
  const [searchTerm, setSearchTerm] = React.useState("")
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const childrenArray = React.Children.toArray(children)
  const childCount = React.Children.count(childrenArray.filter(
    child => React.isValidElement(child) && 
    (child.type as any)?.displayName === DropdownMenuItem.displayName
  ))
  
  // Determine if we should show search (more than 8 options or explicitly enabled)
  const shouldShowSearch = showSearch || childCount > 8
  
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
      (child.type as any)?.displayName !== DropdownMenuItem.displayName
    ) {
      return child
    }

    // Type casting to access props safely
    const childElement = child as React.ReactElement<{ children: React.ReactNode }>
    const childText = typeof childElement.props.children === 'string' 
      ? childElement.props.children.toLowerCase() 
      : ''
    
    if (childText.includes(searchTerm.toLowerCase())) {
      return child
    }
    return null
  })
  
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[8rem] max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-hidden rounded-md bg-white",
          "shadow-[0_4px_12px_rgba(0,0,0,0.1),0_0_1px_rgba(0,0,0,0.1)]",
          "animate-in fade-in-0 zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
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
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                className="w-full rounded-md border-0 py-2 pl-10 pr-3 text-sm text-gray-900 bg-gray-50 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:outline-none shadow-[0_0_0_1px_rgba(50,151,211,0.3),0_1px_1px_0_rgba(0,0,0,0.07),0_0_0_4px_rgba(50,151,211,0.1)]"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-autocomplete="list"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
        <div className="p-1 bg-white">
          {searchTerm && filteredChildren?.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">No results found</div>
          ) : (
            filteredChildren
          )}
        </div>
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  )
})
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    icon?: React.ReactNode
    checked?: boolean
  }
>(({ className, children, icon, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-2",
      "rounded-sm px-2 py-2 pl-8 text-sm outline-none",
      "hover:bg-gray-50 focus:bg-gray-50",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "data-[selected]:bg-gray-50",
      "transition-colors duration-200",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {checked && <Check className="h-4 w-4 text-[#CC3333]" />}
    </span>
    {icon}
    {children}
  </DropdownMenuPrimitive.Item>
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    icon?: React.ReactNode
  }
>(({ className, children, icon, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "flex items-center gap-2 px-2 py-1.5 text-sm font-semibold text-gray-700",
      className
    )}
    {...props}
  >
    {icon}
    {children}
  </DropdownMenuPrimitive.Label>
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-gray-200", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} 