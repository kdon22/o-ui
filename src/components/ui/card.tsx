"use client"

import * as React from "react"
import { cn } from '@/lib/utils/generalUtils'

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-slate-50 rounded-lg",
      "shadow-[0_4px_12px_rgba(0,0,0,0.05)]",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-base font-semibold leading-none tracking-tight text-[#1a1f36]",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardSubtitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[#697386]", className)}
    {...props}
  />
))
CardSubtitle.displayName = "CardSubtitle"

const CardValue = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-2xl font-semibold text-[#1a1f36]", className)}
    {...props}
  />
))
CardValue.displayName = "CardValue"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center text-sm", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

const CardTrend = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    trend: 'up' | 'down'
    value: string | number
  }
>(({ className, trend, value, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center mr-2",
      trend === 'up' ? "text-[#32a37f]" : "text-red-500",
      className
    )}
    {...props}
  >
    {trend === 'up' ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mr-1"
      >
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    ) : (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mr-1"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    )}
    {value}
  </div>
))
CardTrend.displayName = "CardTrend"

const CardFooterText = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-[#697386]", className)}
    {...props}
  />
))
CardFooterText.displayName = "CardFooterText"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-[#697386] mt-2", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardSubtitle,
  CardValue,
  CardContent,
  CardFooter,
  CardTrend,
  CardFooterText,
} 