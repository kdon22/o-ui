"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Trash2 } from "lucide-react"

interface DeleteConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  itemName?: string
  itemType?: string
  onDelete: () => Promise<void> | void
  isDeleting?: boolean
}

export function DeleteConfirmationModal({
  open,
  onOpenChange,
  title = "Delete Confirmation",
  description,
  itemName,
  itemType = "item",
  onDelete,
  isDeleting = false
}: DeleteConfirmationModalProps) {
  const defaultDescription = itemName
    ? `Are you sure you want to delete "${itemName}"?`
    : `Are you sure you want to delete this ${itemType}?`

  const finalDescription = description || defaultDescription

  const handleDelete = async () => {
    await onDelete()
    onOpenChange(false)
  }

  const footerContent = (
    <>
      <Button
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={isDeleting}
        className="bg-gray-50 text-gray-700 hover:bg-gray-100"
      >
        Cancel
      </Button>
      <Button
        variant="destructive"
        onClick={handleDelete}
        disabled={isDeleting}
        className="bg-red-600 hover:bg-red-700 text-white"
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>
    </>
  )

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="sm"
    >
      <div className="sm:flex sm:items-start">
        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
          <Trash2 className="h-6 w-6 text-red-600" aria-hidden="true" />
        </div>
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <h3 className="text-base font-semibold leading-6 text-gray-900">{title}</h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
      </div>
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
        {footerContent}
      </div>
    </Modal>
  )
} 