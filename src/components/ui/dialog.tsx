"use client"

import * as React from "react"
import * as ReactDOM from "react-dom"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from '@/lib/utils/generalUtils'

// Add a VisuallyHidden component for accessibility
const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "absolute h-px w-px p-0 overflow-hidden whitespace-nowrap border-0",
      className
    )}
    style={{ clip: "rect(0 0 0 0)" }}
    {...props}
  />
))
VisuallyHidden.displayName = "VisuallyHidden"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & { blurBackground?: boolean }
>(({ className, blurBackground = true, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60",
      blurBackground ? "backdrop-blur-sm" : "",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { 
    hideCloseButton?: boolean;
    blurBackground?: boolean;
    fullScreen?: boolean;
    accessibleTitle?: string;
    accessibleDescription?: string;
  }
>(({ className, children, hideCloseButton = false, blurBackground = true, fullScreen = false, accessibleTitle = "Dialog", accessibleDescription = "Dialog content", ...props }, ref) => {
  // Create unique IDs for accessibility
  const descriptionId = React.useId();
  
  const content = (
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "DialogContent",
        fullScreen 
          ? "fixed top-0 left-0 right-0 bottom-0 w-[100vw] h-[100vh] max-w-none max-h-none rounded-none border-0 m-0 p-0 transform-none" 
          : "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4",
        !fullScreen && "bg-white dark:bg-gray-900 p-6 shadow-lg",
        !fullScreen && "border border-gray-200 dark:border-gray-800",
        !fullScreen && "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
        !fullScreen && "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        !fullScreen && "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        !fullScreen && "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
        !fullScreen && "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        !fullScreen && "sm:rounded-lg max-h-[85vh] overflow-y-auto flex flex-col",
        className
      )}
      aria-describedby={descriptionId}
      style={fullScreen ? { 
        position: 'fixed',
        zIndex: 999999,
        transform: 'none',
        top: 0,
        left: 0,
        margin: 0,
        width: '100vw',
        height: '100vh',
      } : undefined}
      {...props}
    >
      {/* Add a visually hidden DialogTitle for accessibility */}
      <DialogPrimitive.Title asChild>
        <VisuallyHidden>{accessibleTitle}</VisuallyHidden>
      </DialogPrimitive.Title>
      
      {/* Add a visually hidden description for accessibility */}
      <DialogPrimitive.Description asChild>
        <VisuallyHidden id={descriptionId}>{accessibleDescription}</VisuallyHidden>
      </DialogPrimitive.Description>
      
      {children}
      {!hideCloseButton && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  );

  // For fullScreen dialogs, we create a custom portal directly to document.body
  if (fullScreen) {
    return (
      <>
        <div 
          className="fixed inset-0" 
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 999998,
          }}
        />
        {typeof window !== 'undefined' && ReactDOM.createPortal(
          content,
          document.body
        )}
      </>
    );
  }

  // Regular dialog uses the standard portal
  return (
    <DialogPortal>
      <DialogOverlay blurBackground={blurBackground} />
      {content}
    </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-start",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "DialogFooter",
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> & { size?: "sm" | "md" | "lg" }
>(({ className, size = "md", ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "font-semibold leading-none tracking-tight",
      size === "sm" && "text-lg",
      size === "md" && "text-2xl",
      size === "lg" && "text-3xl",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  VisuallyHidden,
} 