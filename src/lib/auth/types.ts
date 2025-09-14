import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      tenantId: string | null
      rootNodeId: string | null
      userTenants: UserTenant[]
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    tenantId?: string | null
    rootNodeId?: string | null
    userTenants?: UserTenant[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string
    tenantId: string | null
    rootNodeId: string | null
    userTenants: UserTenant[]
  }
}

export interface UserTenant {
  id: string
  name: string
  rootNodeId: string | null
  isActive: boolean
}

export interface TotpVerificationResult {
  success: boolean
  user?: {
    id: string
    email: string
    name?: string
  }
  error?: string
}

export interface TotpCodeRequest {
  email: string
}

export interface TotpVerificationRequest {
  email: string
  code: string
} 