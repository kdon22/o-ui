'use client'

import { useState } from 'react'
import { Package, Plus, Eye, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AutoForm } from '@/components/auto-generated/form'
import { MARKETPLACE_PACKAGE_SCHEMA } from '@/features/marketplace/marketplace.schema'
import { Rule } from '@/features/rules/types'
import { cn } from '@/lib/utils/generalUtils'
import { useActionClientContext } from '@/lib/session'
import { getActionClient } from '@/lib/action-client'

interface RuleMarketTabProps {
  rule: Rule
}

type MarketMode = 'create' | 'manage'

export function RuleMarketTab({ rule }: RuleMarketTabProps) {
  const [mode, setMode] = useState<MarketMode>('create')
  const [isCreating, setIsCreating] = useState(false)
  const { tenantId, branchContext, isReady } = useActionClientContext()
  
  // Guard: Return loading if action client context isn't ready
  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  const handleCreatePackage = async (formData: Record<string, any>) => {
    setIsCreating(true)
    try {
      console.log('Creating marketplace package:', formData)
      
      // ✅ FIXED: Use action system to create marketplace package
      const validTenantId = tenantId || session?.user?.tenantId
      if (!validTenantId) {
        throw new Error('No tenant ID available')
      }
      
      const actionClient = getActionClient(validTenantId, branchContext)
      
      const result = await actionClient.executeAction({
        action: 'marketplacePackages.create',
        data: formData,
        options: { 
          serverOnly: true, 
          skipCache: true 
        },
        branchContext
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create package')
      }
      
      console.log('✅ Package created successfully:', result.data)
      setMode('manage')
    } catch (error) {
      console.error('❌ Failed to create package:', error)
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancel = () => {
    setMode('create')
    setIsCreating(false)
  }

  // Browse Mode - Default marketplace view
  if (mode === 'browse') {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Marketplace
              </h2>
              <p className="text-sm text-muted-foreground">
                Share your rule or browse packages from other developers
              </p>
            </div>
            
            <Button onClick={() => setMode('create')} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Package
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create" className="gap-2">
                <Package className="h-4 w-4" />
                Publish This Rule
              </TabsTrigger>
              <TabsTrigger value="browse" className="gap-2">
                <Search className="h-4 w-4" />
                Browse Marketplace
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Package This Rule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-blue-900">Ready to Share</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Your rule "<strong>{rule.name}</strong>" is ready to be packaged and shared with other developers.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h5 className="font-medium">What's Included</h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Business rule logic</li>
                        <li>• Generated Python code</li>
                        <li>• Documentation</li>
                        <li>• Usage examples</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <h5 className="font-medium">Protection Options</h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Server-side execution</li>
                        <li>• License validation</li>
                        <li>• Usage tracking</li>
                        <li>• Subscription management</li>
                      </ul>
                    </div>
                  </div>
                  
                  <Button onClick={() => setMode('create')} className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    Create Package from This Rule
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="browse" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Browse Marketplace
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Marketplace Coming Soon</h3>
                    <p className="text-gray-600 mb-4">
                      Discover and install packages created by other developers
                    </p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• Browse business rules and utilities</p>
                      <p>• One-click installation</p>
                      <p>• Subscription management</p>
                      <p>• Community ratings and reviews</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  }

  // Package creation form
  if (mode === 'create') {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Create Package</h2>
              <p className="text-sm text-muted-foreground">
                Configure your package settings and publish to the marketplace
              </p>
            </div>
            
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <AutoForm
                  schema={MARKETPLACE_PACKAGE_SCHEMA}
                  mode="create"
                  initialData={{
                    selectedRules: [rule.id], // Pre-select current rule
                    name: `${rule.name} Package`,
                    description: rule.description || `Package containing the ${rule.name} business rule`,
                    category: 'validation',
                    licenseType: 'FREE'
                  }}
                  onSubmit={handleCreatePackage}
                  onCancel={handleCancel}
                  isLoading={isCreating}
                  compact={false}
                  enableAnimations={true}
                  className="space-y-6"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Manage Mode - Package management
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Package Created</h2>
            <p className="text-sm text-muted-foreground">
              Your package has been successfully created and published
            </p>
          </div>
          
          <Button variant="outline" onClick={() => setMode('browse')}>
            Back to Marketplace
          </Button>
        </div>
      </div>

      {/* Success Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-green-600" />
              </div>
              
              <h3 className="text-xl font-semibold mb-2">Package Published Successfully!</h3>
              <p className="text-muted-foreground mb-6">
                Your package is now available in the marketplace for other developers to discover and use.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Button variant="outline" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
                <Button variant="outline" className="gap-2">
                  <Search className="h-4 w-4" />
                  View in Marketplace
                </Button>
                <Button variant="outline" className="gap-2">
                  <Package className="h-4 w-4" />
                  Manage Package
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>Package ID: pkg_12345</p>
                <p>Published: Just now</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
