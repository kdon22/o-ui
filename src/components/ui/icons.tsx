/**
 * UI Icons Module
 * 
 * This module provides a centralized collection of icon components used throughout the application.
 * Icons are implemented as React components that accept standard SVG props.
 * 
 * Benefits of centralizing icons:
 * - Consistent styling and sizing across the application
 * - Easy switching between icon libraries or custom icons
 * - Type safety with TypeScript props
 * - Reduced bundle size by avoiding importing entire icon libraries
 */

import React from 'react'

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number
}

/**
 * Base icon component that all specific icons extend
 * Provides consistent default props and sizing
 */
const IconBase: React.FC<IconProps> = ({ 
  children, 
  size = 24, 
  stroke = 'currentColor',
  fill = 'none',
  strokeWidth = 2,
  className = '', 
  viewBox = '0 0 24 24',
  ...props 
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox={viewBox}
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {children}
  </svg>
)

/**
 * PlusIcon
 * Used for add/create actions
 */
export const PlusIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </IconBase>
)

/**
 * SearchIcon
 * Used in search inputs and search-related actions
 */
export const SearchIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </IconBase>
)

/**
 * PencilIcon
 * Used for edit/update actions
 */
export const PencilIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </IconBase>
)

/**
 * TrashIcon
 * Used for delete/remove actions
 */
export const TrashIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </IconBase>
)

/**
 * ChevronDownIcon
 * Used for dropdown menus and expandable sections
 */
export const ChevronDownIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="6 9 12 15 18 9" />
  </IconBase>
)

/**
 * ChevronRightIcon
 * Used for navigation and expandable trees
 */
export const ChevronRightIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="9 18 15 12 9 6" />
  </IconBase>
)

/**
 * HomeIcon
 * Used for home/dashboard navigation
 */
export const HomeIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </IconBase>
)

/**
 * UserIcon
 * Used for user profiles and account-related features
 */
export const UserIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </IconBase>
)

/**
 * SettingsIcon
 * Used for configuration and settings pages
 */
export const SettingsIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </IconBase>
)

/**
 * LogoutIcon
 * Used for sign out functionality
 */
export const LogoutIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </IconBase>
) 