"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"
import { cn } from '@/lib/utils/generalUtils'
import type { BreadcrumbItem as NavigationBreadcrumbItem } from "@/types/navigation"

interface BreadcrumbProps {
  items?: NavigationBreadcrumbItem[]
  className?: string
  onClick?: (item: NavigationBreadcrumbItem) => void
}

export function Breadcrumb({ items = [], className, onClick }: BreadcrumbProps) {
  return (
    <nav className={cn("flex", className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />}
            {onClick ? (
              <button
                onClick={() => onClick(item)}
                className="text-sm font-medium hover:underline"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
} 