/**
 * TabBar Component - Gold Standard Unified Navigation
 * 
 * One component that handles ALL navigation levels with consistent API
 * 
 * Props:
 * - tabs: Array of tab objects with key, label, icon, count, disabled, badge, color
 * - activeTab: Currently active tab key
 * - onTabChange: Callback when tab is clicked
 * - variant: 'gradient', 'pills', 'minimal', 'elevated', 'bordered'
 * - theme: 'red', 'blue', 'purple', 'green', 'gray'
 * - selectedColor: Override color for active/selected state ('red', 'blue', 'purple', 'green', 'gray', 'black')
 * - size: 'sm', 'md', 'lg'
 * - orientation: 'horizontal', 'vertical'
 * - showCounts: Whether to show count badges
 * - showIcons: Whether to show icons
 * - showDots: Whether to show colored dots (for process types)
 * - fullWidth: Whether tabs should take full width
 * - centered: Whether to center the tabs
 * - animate: Whether to animate transitions
 * - title: Optional title above tabs
 * - titleSize: Size of the title ('sm', 'md', 'lg', 'xl')
 * - showAll: Whether to show "All" option (for pills variant)
 * - scrollable: Whether to enable horizontal scrolling
 * - spacing: Gap between tabs ('sm', 'md', 'lg', 'xl')
 * - className: Additional CSS classes
 * - tabClassName: Additional CSS classes for individual tabs
 * - onTabHover: Callback when tab is hovered
 * - onTabFocus: Callback when tab is focused
 * - ariaLabel: Accessibility label
 * - testId: Test ID for automated testing
 */

'use client'

import React, { useMemo } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/generalUtils'

interface TabItem {
  key: string
  label: string
  icon?: LucideIcon
  count?: number
  disabled?: boolean
  badge?: string | number
  color?: string // For colored dots
  tooltip?: string
  description?: string
}

interface TabBarProps {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (tabKey: string) => void
  variant?: 'gradient' | 'pills' | 'minimal' | 'elevated' | 'bordered'
  theme?: 'red' | 'blue' | 'purple' | 'green' | 'gray'
  selectedColor?: 'red' | 'blue' | 'purple' | 'green' | 'gray' | 'black'
  size?: 'sm' | 'md' | 'lg'
  orientation?: 'horizontal' | 'vertical'
  showCounts?: boolean
  showIcons?: boolean
  showDots?: boolean
  fullWidth?: boolean
  centered?: boolean
  animate?: boolean
  title?: string
  titleSize?: 'sm' | 'md' | 'lg' | 'xl'
  showAll?: boolean
  scrollable?: boolean
  spacing?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  tabClassName?: string
  onTabHover?: (tabKey: string) => void
  onTabFocus?: (tabKey: string) => void
  ariaLabel?: string
  testId?: string
}

export function TabBar({
  tabs,
  activeTab,
  onTabChange,
  variant = 'gradient',
  theme = 'red',
  selectedColor,
  size = 'md',
  orientation = 'horizontal',
  showCounts = true,
  showIcons = true,
  showDots = false,
  fullWidth = false,
  centered = false,
  animate = true,
  title,
  titleSize = 'lg',
  showAll = false,
  scrollable = false,
  spacing = 'md',
  className,
  tabClassName,
  onTabHover,
  onTabFocus,
  ariaLabel = 'Tab navigation',
  testId
}: TabBarProps) {
  
  // Single theme function - much cleaner!
  const getThemeClasses = (isActive: boolean, isAllTab: boolean = false) => {
    const baseActive = 'text-white shadow-sm'
    const baseInactive = 'text-gray-600 hover:bg-gray-50'
    const activeColor = selectedColor || theme
    
    switch (variant) {
      case 'pills':
        return isActive 
          ? `bg-${activeColor}-500 ${baseActive}`
          : `bg-white border border-gray-300 ${baseInactive}`
      case 'bordered':
        // Special styling for "All" tab when active
        if (isAllTab && isActive) {
          return activeColor === 'black' 
            ? 'bg-gray-900 text-white border border-gray-900 shadow-sm'
            : `bg-${activeColor}-500 ${baseActive} border border-${activeColor}-500`
        }
        return isActive
          ? activeColor === 'black' 
            ? 'bg-gray-900 text-white border border-gray-900 shadow-sm'
            : `bg-${activeColor}-50 border border-${activeColor}-200 text-${activeColor}-700`
          : `bg-white border border-gray-300 ${baseInactive} hover:border-gray-400`
      case 'gradient':
        return isActive
          ? `bg-${activeColor}-500 ${baseActive}`
          : `bg-white ${baseInactive} border border-gray-200 hover:bg-gray-50`
      case 'minimal':
        return isActive
          ? `border-b-2 border-${activeColor}-500 text-${activeColor}-600`
          : `border-b-2 border-transparent ${baseInactive} hover:text-gray-900 hover:border-gray-300`
      case 'elevated':
        return isActive
          ? `bg-${activeColor}-500 ${baseActive}`
          : `bg-white shadow-sm hover:shadow-md ${baseInactive}`
      default:
        return isActive
          ? `bg-${activeColor}-500 ${baseActive}`
          : baseInactive
    }
  }

  const getSizeClasses = () => {
    const sizes = {
      sm: {
        container: 'gap-1',
        tab: 'px-3 py-1.5 text-sm',
        count: 'text-xs px-1.5 py-0.5 min-w-[18px]'
      },
      md: {
        container: 'gap-2',
        tab: 'px-4 py-2 text-sm',
        count: 'text-xs px-2 py-1 min-w-[20px]'
      },
      lg: {
        container: 'gap-3',
        tab: 'px-6 py-3 text-base',
        count: 'text-sm px-2 py-1 min-w-[24px]'
      }
    }
    return sizes[size]
  }

  const getSpacingClasses = () => {
    const spacings = {
      sm: 'gap-1',
      md: 'gap-2',
      lg: 'gap-3',
      xl: 'gap-4'
    }
    return spacings[spacing]
  }

  const getVariantClasses = () => {
    const variants = {
      gradient: {
        container: 'bg-white border border-gray-200 rounded-lg p-1 shadow-sm',
        tab: 'rounded-md font-medium transition-all'
      },
      pills: {
        container: `flex flex-wrap ${getSpacingClasses()}`,
        tab: 'rounded-full font-medium transition-all'
      },
      bordered: {
        container: `flex flex-wrap ${getSpacingClasses()}`,
        tab: 'rounded-md font-medium transition-all border'
      },
      minimal: {
        container: 'border-b border-gray-200',
        tab: 'font-medium transition-all'
      },
      elevated: {
        container: 'bg-white shadow-sm rounded-lg p-2',
        tab: 'rounded-md font-medium transition-all'
      }
    }
    return variants[variant]
  }

  const getTitleClasses = () => {
    const titleSizes = {
      sm: 'text-sm font-medium text-gray-700',
      md: 'text-base font-semibold text-gray-800',
      lg: 'text-lg font-semibold text-gray-900',
      xl: 'text-xl font-bold text-gray-900'
    }
    return titleSizes[titleSize]
  }

  const sizeConfig = getSizeClasses()
  const variantConfig = getVariantClasses()

  // Prepare tabs with "All" option if needed - prevent duplicate keys
  const allTabs = useMemo(() => {
    if (!showAll) return tabs
    
    // Check if there's already an 'all' tab
    const hasAllTab = tabs.some(tab => tab.key === 'all')
    
    if (hasAllTab) {
      // If there's already an 'all' tab, don't add another one
      return tabs
    }
    
    // Add an 'all' tab at the beginning
    return [
      { 
        key: 'all', 
        label: 'All', 
        count: tabs.reduce((sum, tab) => sum + (tab.count || 0), 0) 
      }, 
      ...tabs
    ]
  }, [tabs, showAll])

  const handleTabClick = (tab: TabItem) => {
    if (tab.disabled) return
    onTabChange(tab.key)
  }

  const getTabStyles = (tab: TabItem, isActive: boolean) => {
    const isAllTab = tab.key === 'all'
    return cn(
      'flex items-center gap-2', // Add gap between label and count
      variantConfig.tab,
      sizeConfig.tab,
      getThemeClasses(isActive, isAllTab),
      tab.disabled && 'opacity-50 cursor-not-allowed',
      fullWidth && 'flex-1',
      animate && 'transition-all duration-200',
      tabClassName
    )
  }

  const getCountStyles = (isActive: boolean) => {
    return cn(
      sizeConfig.count,
      'rounded-full font-semibold',
      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600',
      animate && 'transition-all duration-200'
    )
  }

  const getContainerClasses = () => {
    const baseClasses = cn(
      'flex items-center',
      orientation === 'horizontal' ? 'flex-row' : 'flex-col',
      variantConfig.container,
      sizeConfig.container,
      fullWidth && 'w-full',
      centered && 'justify-center'
    )

    // Add scrolling if enabled
    if (scrollable && orientation === 'horizontal') {
      return cn(
        baseClasses,
        'overflow-x-auto scrollbar-hide',
        'min-w-0', // Allows flex children to shrink
        variant === 'bordered' && 'pb-1' // Add padding for border focus rings
      )
    }

    return baseClasses
  }

  const renderContent = () => (
    <div
      className={cn(
        getContainerClasses(),
        className
      )}
      role="tablist"
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {allTabs.map((tab) => {
        const isActive = activeTab === tab.key
        
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.key}`}
            tabIndex={isActive ? 0 : -1}
            className={getTabStyles(tab, isActive)}
            onClick={() => handleTabClick(tab)}
            onMouseEnter={() => onTabHover?.(tab.key)}
            onFocus={() => onTabFocus?.(tab.key)}
            title={tab.tooltip}
            style={{ 
              minWidth: scrollable ? 'max-content' : undefined,
              whiteSpace: scrollable ? 'nowrap' : undefined
            }}
          >
            {/* Colored Dot */}
            {showDots && tab.color && (
              <span className={cn(
                'w-2 h-2 rounded-full flex-shrink-0',
                tab.color
              )} />
            )}
            
            {/* Icon */}
            {showIcons && tab.icon && (
              <tab.icon className={cn(
                'flex-shrink-0',
                size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'
              )} />
            )}
            
            {/* Label */}
            <span className="flex-shrink-0">{tab.label}</span>
            
            {/* Count Badge */}
            {showCounts && typeof tab.count === 'number' && (
              <span className={cn(getCountStyles(isActive), 'flex-shrink-0')}>
                {tab.count}
              </span>
            )}
            
            {/* Custom Badge */}
            {tab.badge && (
              <span className={cn(
                'px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium flex-shrink-0',
                sizeConfig.count
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )

  // Handle pills and bordered variants with title
  if ((variant === 'pills' || variant === 'bordered') && title) {
    return (
      <div className={cn('space-y-3', className)}>
        <h3 className={getTitleClasses()}>{title}</h3>
        {renderContent()}
      </div>
    )
  }

  return renderContent()
} 