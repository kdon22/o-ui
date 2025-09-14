// 🎯 Crypto Helper Functions - Interface-first approach for perfect IntelliSense
// Cross-tenant cryptographic utilities with clean type definitions

import type { UnifiedSchema } from '../../types'

// 🎯 INTERFACE-FIRST: Crypto operation result interfaces
export interface CryptoEncryptResult {
  success: boolean
  encryptedData: string
  algorithm: string
  keyId?: string
}

export interface CryptoDecryptResult {
  success: boolean
  decryptedData: string
  algorithm: string
}

export interface CryptoHashResult {
  hash: string
  algorithm: string
  encoding: 'hex' | 'base64'
}

export interface CryptoSignResult {
  signature: string
  algorithm: string
  keyId: string
}

export interface CryptoVerifyResult {
  isValid: boolean
  algorithm: string
  keyId: string
}

export interface CryptoGenerateKeyResult {
  keyId: string
  publicKey?: string
  algorithm: string
  createdAt: string
}

// 🎯 CRYPTO HELPER SCHEMAS - Interface-first for perfect IntelliSense
export const CRYPTO_HELPER_SCHEMAS: UnifiedSchema[] = [
  // Future crypto helper functions will be added here
  // Examples: encrypt, decrypt, hash, sign, verify, generate_key, etc.
] 