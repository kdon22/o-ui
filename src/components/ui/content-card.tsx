import * as React from "react"
import { PlusCircle } from "lucide-react"
import { cn } from '@/lib/utils/generalUtils'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card"

interface ContentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  children?: React.ReactNode
  footerContent?: React.ReactNode
}

export function ContentCard({
  title,
  description,
  actionLabel,
  onAction,
  children,
  footerContent,
  className,
  ...props
}: ContentCardProps) {
  return (
    <Card className={cn("mt-6", className)} {...props}>
      {/* Header section with title, description, and action button */}
      <CardHeader className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-medium text-gray-900 mb-1">{title}</CardTitle>
            {description && (
              <CardDescription className="text-gray-600">{description}</CardDescription>
            )}
          </div>
          {actionLabel && onAction && (
            <button 
              onClick={onAction}
              className="flex items-center px-4 py-2 bg-[#CC3333] text-white rounded-md hover:bg-[#B52E2E] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#CC3333]"
            >
              <PlusCircle size={18} className="mr-2" />
              {actionLabel}
            </button>
          )}
        </div>
      </CardHeader>
      
      {/* Main content */}
      <CardContent className="p-0">
        {children}
      </CardContent>
      
      {/* Optional footer */}
      {footerContent && (
        <CardFooter className="px-6 py-3 border-t border-gray-200">
          {footerContent}
        </CardFooter>
      )}
    </Card>
  )
}

// Filter bar component that can be used inside ContentCard
interface ContentCardFilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function ContentCardFilterBar({ children, className, ...props }: ContentCardFilterBarProps) {
  return (
    <div 
      className={cn("px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center space-x-4", className)} 
      {...props}
    >
      {children}
    </div>
  )
}

// Table wrapper that can be used inside ContentCard
interface ContentCardTableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function ContentCardTable({ children, className, ...props }: ContentCardTableProps) {
  return (
    <div className={cn("overflow-hidden", className)} {...props}>
      {children}
    </div>
  )
}

// Table header with red background
interface ContentCardTableHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  columns: { name: string; span: number }[]
}

export function ContentCardTableHeader({ columns, className, ...props }: ContentCardTableHeaderProps) {
  const totalSpans = columns.reduce((sum, col) => sum + col.span, 0)
  
  return (
    <div className={cn("grid bg-[#CC3333] text-white", `grid-cols-${totalSpans}`, className)} {...props}>
      {columns.map((column, index) => (
        <div 
          key={index} 
          className={cn(`col-span-${column.span} px-6 py-3 text-left font-medium`)}
        >
          {column.name}
        </div>
      ))}
    </div>
  )
}

// Pagination component for ContentCard
interface ContentCardPaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  totalItems: number
  currentPage: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

export function ContentCardPagination({ 
  totalItems, 
  currentPage, 
  itemsPerPage, 
  onPageChange,
  className,
  ...props 
}: ContentCardPaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)
  
  return (
    <div 
      className={cn("px-6 py-3 flex items-center justify-between border-t border-gray-200", className)} 
      {...props}
    >
      <p className="text-sm text-gray-700">
        Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of <span className="font-medium">{totalItems}</span> items
      </p>
      <div className="flex space-x-1">
        <button 
          className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </button>
        {Array.from({ length: totalPages }).map((_, index) => (
          <button 
            key={index}
            className={cn(
              "px-3 py-1 rounded-md",
              currentPage === index + 1 
                ? "bg-[#CC3333] text-white" 
                : "border border-gray-300 text-gray-700"
            )}
            onClick={() => onPageChange(index + 1)}
          >
            {index + 1}
          </button>
        ))}
        <button 
          className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  )
} 