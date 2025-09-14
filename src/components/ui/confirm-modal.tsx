"use client"

import React from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Spinner } from './spinner'
import { cn } from '@/lib/utils/generalUtils'
import { AlertTriangle, Trash2 } from "lucide-react"

interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  blurBackground?: boolean
  isConfirming?: boolean
  variant?: 'default' | 'destructive'
  confirmLabel?: string
  icon?: React.ReactNode // Optional icon
}

export function ConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  blurBackground = false,
  isConfirming = false,
  variant = 'default', // Default variant
  confirmLabel = "Confirm", // Default label
  icon // Destructure icon prop
}: ConfirmModalProps) {

  const confirmButtonVariant = variant === 'destructive' ? 'destructive' : 'default';
  const confirmButtonClasses = cn(
    "min-w-[90px]", // Ensure minimum width
    variant === 'default' && "bg-black hover:bg-gray-800 text-white",
    variant === 'destructive' && "bg-red-600 hover:bg-red-700 text-white"
  );

  const footer = (
    <>
      <Button
        variant="outline"
        onClick={() => onOpenChange(false)}
        className="bg-gray-50 text-gray-700 hover:bg-gray-100"
        disabled={isConfirming}
      >
        Cancel
      </Button>
      <Button
        variant={confirmButtonVariant}
        onClick={onConfirm}
        className={confirmButtonClasses}
        disabled={isConfirming}
      >
        {isConfirming ? <Spinner /> : confirmLabel}
      </Button>
    </>
  )

  // Determine default icon based on variant if no icon is provided
  let displayIcon = icon;
  if (!displayIcon && variant === 'destructive') {
    displayIcon = (
        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <Trash2 className="h-6 w-6 text-red-600" aria-hidden="true" />
        </div>
    );
  }
  // Add default icon for warning/other variants if needed in the future

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="sm"
      blurBackground={blurBackground}
    >
          <> 
            {displayIcon && <div className="mb-4 flex justify-center sm:justify-start">{displayIcon}</div>}
            {description}
          </>
      <div className="mt-6 flex justify-end space-x-3">
        {footer}
      </div>
    </Modal>
  )
} 