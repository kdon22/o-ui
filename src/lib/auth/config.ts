import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import CredentialsProvider from "next-auth/providers/credentials"
import { TotpService } from "@/lib/auth/services/totp"

// Extend NextAuth types for our enriched session
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      tenantId: string | null
      rootNodeId: string | null
      rootNodeIdShort: string | null // ✅ NEW: Root node idShort for instant redirects
      userTenants: any[]
      currentTenant: any
      workspaceStructure: any
      branchContext: any
      preferences: any
      permissions: any
      dataLastSync: string
      cacheVersion: string
      codeEditorPreferences: any // ✅ NEW: Code editor preferences
    }
  }

  interface User {
    tenantId?: string | null
    rootNodeId?: string | null
    rootNodeIdShort?: string | null // ✅ NEW: Root node idShort for instant redirects
    userTenants?: any[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    tenantId: string | null
    rootNodeId: string | null
    rootNodeIdShort: string | null // ✅ NEW: Root node idShort for instant redirects
    userTenants: any[]
    currentTenant: any
    workspaceStructure: any
    branchContext: any
    preferences: any
    permissions: any
    dataLastSync: string
    cacheVersion: string
    codeEditorPreferences: any // ✅ NEW: Code editor preferences
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  
  providers: [
    CredentialsProvider({
      id: "totp",
      name: "TOTP",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "6-digit code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.code) {
          return null
        }

        try {
          // Verify the TOTP code using our service
          const result = await TotpService.verifyCode(
            credentials.email as string,
            credentials.code as string,
            "login"
          )

          if (!result.success || !result.user) {
            return null
          }

          // Return user object that NextAuth expects
          return {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name || null,
          }
        } catch (error) {
          console.error("TOTP authorization failed:", error)
          return null
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (per your requirement)
    updateAge: 24 * 60 * 60, // Refresh once per day
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // ✅ CRITICAL FIX: Handle session updates for branch switching
      if (trigger === "update" && session) {
        // Session update triggered - merge new data (deep-merge branchContext)
        console.log('🔄 [NextAuth] JWT callback - session update:', {
          trigger,
          sessionKeys: Object.keys(session),
          currentBranchId: (session as any).currentBranchId,
          hasBranchContext: !!(session as any).branchContext,
          timestamp: new Date().toISOString()
        });

        // Ensure branchContext exists
        if (!token.branchContext) {
          token.branchContext = {} as any;
        }

        // 1) Explicit currentBranchId updates (top-level convenience from client)
        if ((session as any).currentBranchId) {
          (token.branchContext as any).currentBranchId = (session as any).currentBranchId;
        }

        // 2) Deep-merge provided branchContext without losing existing keys
        if ((session as any).branchContext) {
          const incoming = (session as any).branchContext as any;
          token.branchContext = {
            ...(token.branchContext as any),
            ...incoming,
          };
        }

        // 3) Merge remaining non-branchContext fields
        const { branchContext: _bc, ...rest } = (session as any);
        Object.assign(token as any, rest);

        console.log('✅ [NextAuth] JWT after session merge:', {
          branchContext: token.branchContext,
          timestamp: new Date().toISOString()
        });

        return token;
      }
      
      // On sign-in, fetch user data and enrich session for instant performance
      if (trigger === "signIn" && user) {
        console.log('🔐 [JWT] Starting sign-in enrichment for user:', user.id);
        
        try {
          // 🚀 **TIMEOUT PROTECTION**: Wrap database calls with timeout
          const dbUser = await Promise.race([
            prisma.user.findUnique({
              where: { id: user.id },
              include: {
                userTenants: {
                  include: {
                    tenant: true,
                  },
                },
              },
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('User query timeout')), 5000)
            )
          ]) as any;

          if (!dbUser) {
            console.error('❌ [JWT] User not found in database:', user.id);
            // 🛡️ **FALLBACK**: Set minimal token data for basic auth
            token.userId = user.id;
            token.email = user.email || '';
            token.name = user.name || null;
            token.tenantId = null;
            token.rootNodeId = null;
            token.userTenants = [];
            // NEVER hardcode 'main' - this should never happen in production
            console.error('🚨 [AUTH] No tenant found - this should not happen in production');
            token.branchContext = { currentBranchId: null, defaultBranchId: null, availableBranches: [] };
            token.preferences = { theme: 'system' };
            token.permissions = { role: 'viewer', canCreateNodes: false };
            token.dataLastSync = new Date().toISOString();
            token.cacheVersion = '1.0';
            console.log('⚠️ [JWT] Using fallback token data');
            return token;
          }

          console.log('✅ [JWT] User found, enriching session data...');
          const currentTenant = dbUser.userTenants.find(ut => ut.isDefault) || dbUser.userTenants[0]
          
          // Core identity and tenant context
          token.userId = dbUser.id
          token.email = dbUser.email
          token.name = dbUser.name
          token.tenantId = currentTenant?.tenant.id || null
          token.rootNodeId = currentTenant?.rootNodeId || null

          // Multi-tenant access
          token.userTenants = dbUser.userTenants.map(ut => ({
            id: ut.tenant.id,
            name: ut.tenant.name,
            rootNodeId: ut.rootNodeId,
            isActive: ut.isDefault,
            role: 'editor', // TODO: Add role field to UserTenant schema when needed
            lastAccessed: ut.updatedAt
          }))

          // Current tenant details for instant access
          if (currentTenant) {
            token.currentTenant = {
              id: currentTenant.tenant.id,
              name: currentTenant.tenant.name,
              slug: currentTenant.tenant.name.toLowerCase().replace(/\s+/g, '-'),
              isActive: currentTenant.tenant.isActive,
              plan: 'enterprise' // TODO: Add plan field to Tenant schema when needed
            }

            // 🚀 **WORKSPACE STRUCTURE**: Fetch with timeout and fallback
            let rootNodes = [];
            let rootNodeData = null;
            
            try {
              console.log('🌳 [JWT] Fetching workspace structure...');
              
              // Workspace structure for instant tree navigation with timeout
              rootNodes = await Promise.race([
                prisma.node.findMany({
                  where: { 
                    tenantId: currentTenant.tenant.id,
                    parentId: null,
                    isActive: true,
                  // Do not hardcode branchId; server should provide real IDs
                  branchId: undefined as unknown as string
                  },
                  select: {
                    id: true,
                    idShort: true, // ✅ NEW: Include idShort for root nodes
                    name: true,
                    type: true,
                    path: true,
                    sortOrder: true,
                    _count: { select: { children: true } }
                  },
                  orderBy: { sortOrder: 'asc' },
                  take: 15 // Strategic limit for session size
                }),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Root nodes query timeout')), 3000)
                )
              ]) as any;

              // Get root node idShort for instant redirects with timeout
              if (currentTenant.rootNodeId) {
                rootNodeData = await Promise.race([
                  prisma.node.findUnique({
                    where: { id: currentTenant.rootNodeId },
                    select: { idShort: true }
                  }),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Root node query timeout')), 2000)
                  )
                ]) as any;
              }
              
              console.log('✅ [JWT] Workspace structure loaded:', { rootNodesCount: rootNodes.length });
            } catch (error) {
              console.error('⚠️ [JWT] Workspace structure query failed:', error);
              // Continue with empty workspace structure
              rootNodes = [];
              rootNodeData = null;
            }

            token.workspaceStructure = {
              rootNodes: rootNodes.map(node => ({
                id: node.id,
                idShort: node.idShort, // ✅ NEW: Include idShort
                name: node.name,
                type: node.type || 'NODE',
                path: node.path || `/${node.name.toLowerCase()}`,
                childCount: node._count.children,
                sortOrder: node.sortOrder
              })),
              recentNodes: [], // TODO: Implement recent node tracking
              favoriteNodes: [] // TODO: Implement favorites from user preferences
            }

            // ✅ NEW: Store rootNode idShort for instant access
            token.rootNodeIdShort = rootNodeData?.idShort || null

            // 🚀 **BRANCH CONTEXT**: Fetch with timeout and fallback
            let userBranches = [];
            
            try {
              console.log('🌿 [JWT] Fetching branch context...');
              
              // Branch context for git-like workflow with timeout
              userBranches = await Promise.race([
                prisma.branch.findMany({
                  where: { 
                    tenantId: currentTenant.tenant.id,
                    NOT: { isLocked: true }
                  },
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    isDefault: true,
                    updatedAt: true
                  },
                  orderBy: { isDefault: 'desc' },
                  take: 10 // Recent branches only
                }),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Branch query timeout')), 3000)
                )
              ]) as any;
              
              console.log('✅ [JWT] Branch context loaded:', { branchCount: userBranches.length });
            } catch (error) {
              console.error('⚠️ [JWT] Branch context query failed:', error);
              // 🛡️ **FALLBACK**: Create default main branch
              // Create a proper default branch with UUID instead of hardcoded 'main'
              const defaultBranchId = `default-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              userBranches = [{
                id: defaultBranchId,
                name: 'main',
                description: 'Default branch',
                isDefault: true,
                updatedAt: new Date()
              }];
            }

            // OPTIMIZED: Minimal branch context for ActionClient initialization
            const defaultBranch = userBranches.find(b => b.isDefault) || userBranches[0]
            token.branchContext = {
              currentBranchId: defaultBranch?.id || null,
              defaultBranchId: defaultBranch?.id || null,
              isFeatureBranch: defaultBranch ? defaultBranch.name !== 'main' : false
              // availableBranches removed - ActionClient will load from IndexedDB
            }

            // OPTIMIZED: Minimal preferences for immediate UI needs only
            const personalPrefs = dbUser.personalPreferences as any || {}
            const editorPrefs = dbUser.codeEditorPreferences as any || {}
            
            // ESSENTIAL: Only critical preferences for immediate UI rendering
            token.preferences = {
              theme: dbUser.themePreference || 'system',
              language: personalPrefs.language || 'en'
              // Other preferences will be loaded by ActionClient from IndexedDB when needed
            }

            // OPTIMIZED: Minimal code editor preferences
            token.codeEditorPreferences = {
              theme: editorPrefs.theme || 'vs-dark'
              // Detailed preferences will be loaded by ActionClient from IndexedDB
            }

            // ESSENTIAL: Minimal permissions for immediate access control
            const isFirstUser = dbUser.userTenants.length > 0 && dbUser.userTenants[0].tenant.id === currentTenant.tenant.id
            const userRole: 'admin' | 'editor' | 'viewer' = isFirstUser ? 'admin' : 'editor'
            const isEditor = ['admin', 'editor'].includes(userRole)
            
            token.permissions = {
              canEdit: isEditor,
              canDelete: isEditor,
              role: userRole
              // Detailed permissions will be loaded by ActionClient from IndexedDB
            }

            // OPTIMIZED: Minimal workspace structure for ActionClient initialization
            token.workspaceStructure = {
              nodeCount: 0, // ActionClient will load actual count from IndexedDB
              lastSync: new Date().toISOString()
              // rootNodes removed - ActionClient will load from IndexedDB for <50ms performance
            }
          }

          // Performance metadata
          token.dataLastSync = new Date().toISOString()
          token.cacheVersion = '1.0'
          
          console.log('🎉 [JWT] Session enrichment completed successfully');
        
        } catch (error) {
          console.error('❌ [JWT] Session enrichment failed:', error);
          
          // 🛡️ **CRITICAL FALLBACK**: Ensure basic auth works even if enrichment fails
          token.userId = user.id;
          token.email = user.email || '';
          token.name = user.name || null;
          token.tenantId = null;
          token.rootNodeId = null;
          token.rootNodeIdShort = null;
          token.userTenants = [];
          token.currentTenant = null;
          // OPTIMIZED: Minimal workspace structure for ActionClient initialization
          token.workspaceStructure = { 
            rootNodes: [], // Empty - will be loaded by ActionClient from IndexedDB
            nodeCount: 0,
            lastSync: new Date().toISOString()
          };
          
          // ESSENTIAL: Branch context for ActionClient (minimal)
          // NEVER hardcode 'main' - create proper default branch
          const fallbackBranchId = `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          token.branchContext = { 
            currentBranchId: fallbackBranchId, 
            defaultBranchId: fallbackBranchId, 
            isFeatureBranch: false
          };
          
          // ESSENTIAL: Minimal preferences for immediate UI needs
          token.preferences = { 
            theme: 'system',
            language: 'en'
          };
          
          // ESSENTIAL: Minimal permissions for immediate access control
          token.permissions = { 
            canEdit: false,
            canDelete: false,
            role: 'viewer'
          };
          
          // MINIMAL: Empty editor preferences (ActionClient will load from IndexedDB)
          token.codeEditorPreferences = { theme: 'vs-dark' };
          token.dataLastSync = new Date().toISOString();
          token.cacheVersion = '1.0-fallback';
          
          console.log('⚠️ [JWT] Using complete fallback token - basic auth will work');
        }
      }

      // Handle session update (e.g., when preferences or branch context are changed)
      if (trigger === "update" && token.userId) {
        console.log('🔄 [NextAuth] JWT update trigger fired:', {
          userId: token.userId,
          hasUserParam: !!user,
          userKeys: user ? Object.keys(user) : [],
          currentTokenBranchId: token.branchContext?.currentBranchId,
          timestamp: new Date().toISOString()
        });

        // Check if this is a branch context update
        if (user && 'branchContext' in user) {
          console.log('🎯 [NextAuth] Branch context update detected:', {
            newBranchContext: user.branchContext,
            oldBranchContext: token.branchContext,
            timestamp: new Date().toISOString()
          });
          
          // Update the branch context in the token
          token.branchContext = {
            ...token.branchContext,
            ...user.branchContext
          };
          
          console.log('✅ [NextAuth] JWT token updated with new branch context:', {
            updatedBranchContext: token.branchContext,
            timestamp: new Date().toISOString()
          });
        } else {
          // Refetch just the preferences when session is updated (non-branch updates)
          const dbUser = await prisma.user.findUnique({
            where: { id: token.userId as string },
            select: { codeEditorPreferences: true }
          })
          
          if (dbUser) {
            token.codeEditorPreferences = dbUser.codeEditorPreferences as any || {}
          }
        }
      }

      return token
    },

    async session({ session, token }) {
      console.log('🚨 [Session] SESSION CALLBACK TRIGGERED!');
      
      // 🚀 **PERFORMANCE OPTIMIZED**: Direct token-to-session mapping (no DB queries)
      // All data is pre-fetched and cached in JWT token during sign-in
      
      console.log('🔍 [Session] Session callback called:', {
        hasToken: !!token,
        tokenKeys: token ? Object.keys(token) : [],
        hasUserId: !!(token as any)?.userId,
        hasId: !!(token as any)?.id,
        tokenUserId: (token as any)?.userId,
        tokenId: (token as any)?.id,
        timestamp: new Date().toISOString()
      });
      
      if (token) {
        // Core identity - direct assignment (fast)
        // Handle both userId (new) and id (legacy) for backward compatibility
        session.user.id = (token.userId || token.id) as string
        session.user.tenantId = token.tenantId as string | null
        session.user.rootNodeId = token.rootNodeId as string | null
        session.user.rootNodeIdShort = token.rootNodeIdShort as string | null
        session.user.userTenants = token.userTenants as any[]
        
        // Pre-cached data - OPTIMIZED FOR ACTIONCLIENT SYSTEM
        session.user.currentTenant = token.currentTenant as any
        
        // ✅ ACTIONCLIENT INTEGRATION: Essential data for IndexedDB initialization
        // The ActionClient needs this data to initialize IndexedDB stores and branch context
        session.user.workspaceStructure = token.workspaceStructure as any
        session.user.preferences = token.preferences as any
        session.user.permissions = token.permissions as any
        session.user.codeEditorPreferences = token.codeEditorPreferences as any
        
        // Branch context with safe fallbacks (fast)
        const bc = (token.branchContext as any) || {};
        const list = Array.isArray(bc.availableBranches) ? bc.availableBranches : [];
        const derivedDefault = bc.defaultBranchId || list.find((b: any) => b.isDefault)?.id || list[0]?.id;
        const derivedCurrent = bc.currentBranchId || derivedDefault;
        
        session.user.branchContext = {
          ...bc,
          currentBranchId: derivedCurrent,
          defaultBranchId: bc.defaultBranchId || derivedDefault,
        } as any
        
        // Metadata - direct assignment (fast)
        session.user.dataLastSync = token.dataLastSync as string
        session.user.cacheVersion = token.cacheVersion as string
      }

      console.log('🎉 [Session] Returning session object:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        tenantId: session?.user?.tenantId,
        hasBranchContext: !!session?.user?.branchContext,
        currentBranchId: session?.user?.branchContext?.currentBranchId,
        sessionKeys: session ? Object.keys(session) : [],
        userKeys: session?.user ? Object.keys(session.user) : [],
        timestamp: new Date().toISOString()
      });

      return session
    },

    async redirect({ url, baseUrl }) {
      // Handle post-login redirects with workspace context
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },

  pages: {
    signIn: "/login", // Updated to match your login page
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },

  events: {
    async signIn({ user }) {
      // TODO: Update user's last login timestamp
      // TODO: Log security event for audit trail
    },
  },

  // Security settings for production
  useSecureCookies: process.env.NODE_ENV === "production",
  
  // Performance optimization
  debug: false,
}

// For NextAuth v4, export the configuration as default
export default NextAuth(authOptions) 