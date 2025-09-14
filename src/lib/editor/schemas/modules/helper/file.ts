// 🎯 File Helper Functions - Interface-first approach for perfect IntelliSense
// Cross-tenant file processing utilities with clean type definitions

import type { UnifiedSchema } from '../../types'

// 🎯 INTERFACE-FIRST: File operation result interfaces
export interface FileReadResult {
  success: boolean
  content: string | Buffer
  encoding?: string
  size: number
  path: string
  error?: string
}

export interface FileWriteResult {
  success: boolean
  path: string
  size: number
  encoding?: string
  error?: string
}

export interface FileParseResult {
  success: boolean
  parsed: any
  format: string
  originalPath: string
  metadata: Record<string, any>
  error?: string
}

export interface FileConvertResult {
  success: boolean
  convertedPath: string
  originalPath: string
  fromFormat: string
  toFormat: string
  size: number
  error?: string
}

export interface FileUploadResult {
  success: boolean
  url: string
  path: string
  size: number
  mimeType: string
  error?: string
}

export interface FileDownloadResult {
  success: boolean
  content: string | Buffer
  size: number
  mimeType: string
  filename: string
  error?: string
}

// 🎯 FILE HELPER SCHEMAS - Interface-first for perfect IntelliSense
export const FILE_HELPER_SCHEMAS: UnifiedSchema[] = [
  // Future file helper functions will be added here
  // Examples: read, write, parse, convert, upload, download, etc.
] 