"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from '@/lib/utils/generalUtils'

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    variant?: "default" | "pill"
  }
>(({ className, variant = "default", ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "relative flex",
      variant === "default" && "border-b border-[rgba(0,0,0,0.08)]",
      variant === "pill" && "gap-2 justify-start",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    variant?: "default" | "pill"
    icon?: React.ReactNode
    fontSize?: "sm" | "base" | "lg"
    activeColor?: "red" | "black"
    activeTabWeight?: 1 | 2 | 3
    underlineStyle?: "full" | "exact"
  }
>(({ 
  className, 
  variant = "default", 
  icon, 
  fontSize = "sm", 
  activeColor = "red", 
  activeTabWeight = 2, 
  underlineStyle = "full", 
  children, 
  ...props 
}, ref) => {
  const colorValues = {
    red: "#cc3333",
    black: "#000000"
  }
  
  const activeColorClasses = {
    red: underlineStyle === "full" ? "after:bg-[#cc3333]" : "border-[#cc3333]",
    black: underlineStyle === "full" ? "after:bg-black" : "border-black"
  }

  const weightClasses = {
    1: "after:h-[1px]",
    2: "after:h-[2px]",
    3: "after:h-[3px]"
  }

  const underlineExactClasses = 
    underlineStyle === "exact" && variant === "default" 
      ? [
          "border-b-0 group relative",
          "after:absolute after:bottom-0 after:left-1/2 after:transform after:-translate-x-1/2",
          "after:h-0.5 after:bg-transparent",
          `data-[state=active]:after:bg-${activeColor === "red" ? "[#cc3333]" : "black"}`,
          "after:transition-all after:duration-200 after:ease-out",
          "hover:after:w-full",
          "data-[state=active]:after:w-4/5"
        ] 
      : [];

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap transition-all gap-2 text-sm",
        variant === "default" && [
          "px-4 py-2 font-medium text-[#6b7c93]",
          "hover:text-[#0a2540]",
          "data-[state=active]:text-[#0a2540]",
          "focus-visible:outline-none",
          "relative",
          underlineStyle === "full" && [
            "after:absolute after:bottom-[-1px] after:left-0 after:w-full",
            weightClasses[activeTabWeight],
            activeColorClasses[activeColor],
            "after:opacity-0 after:transition-opacity",
            "data-[state=active]:after:opacity-100"
          ],
          ...underlineExactClasses
        ],
        variant === "pill" && [
          "px-3 py-1.5 min-h-[28px] font-medium text-[#425466]",
          "rounded-full",
          "bg-transparent",
          activeColor === "red" ? "hover:bg-[#cc3333]/5" : "hover:bg-black/5",
          activeColor === "red" ? "data-[state=active]:bg-[#cc3333]" : "data-[state=active]:bg-black",
          "data-[state=active]:text-white",
          "transition-colors duration-150"
        ],
        fontSize === "sm" && "text-sm",
        fontSize === "base" && "text-base",
        fontSize === "lg" && "text-lg",
        className
      )}
      {...props}
    >
      {icon && <span className="opacity-80">{icon}</span>}
      <span className="relative">
        {children}
        {underlineStyle === "exact" && variant === "default" && (
          <span 
            className={cn(
              "absolute -bottom-[10px] left-0 h-0.5 w-0",
              "transition-all duration-200 ease-out",
              "data-[state=active]:w-full",
              "group-data-[state=active]:opacity-100 opacity-0",
              activeColor === "red" ? "bg-[#cc3333]" : "bg-black"
            )}
            style={{ 
              width: "100%",
              transformOrigin: "center" 
            }}
            data-state={props['data-state' as keyof typeof props]}
          ></span>
        )}
      </span>
    </TabsPrimitive.Trigger>
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-white focus-visible:outline-none",
      "data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:zoom-in-95",
      "data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0 data-[state=inactive]:zoom-out-95",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent } 