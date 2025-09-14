'use client'

import { useState } from 'react'
import { ShoppingCart, Package, Search, Star, Download, Filter, X, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useActionQuery } from '@/hooks/use-action-api'
import { MarketplacePackage, PackageCategory, LicenseType } from '@/features/marketplace/types'
import { cn } from '@/lib/utils/generalUtils'

interface MarketplaceProps {
  className?: string
}

type SortOption = 'name' | 'downloads' | 'rating' | 'created' | 'updated'
type SortDirection = 'asc' | 'desc'

const CATEGORY_LABELS: Record<PackageCategory, string> = {
  validation: 'Validation',
  utilities: 'Utilities', 
  workflows: 'Workflows',
  integrations: 'Integrations',
  travel: 'Travel',
  finance: 'Finance',
  compliance: 'Compliance',
  analytics: 'Analytics',
  other: 'Other'
}

const LICENSE_LABELS: Record<LicenseType, string> = {
  FREE: 'Free',
  ONE_TIME: 'One-time Purchase',
  SUBSCRIPTION: 'Subscription',
  USAGE_BASED: 'Usage-based'
}

export function Marketplace({ className }: MarketplaceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [licenseFilter, setLicenseFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('downloads')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [cart, setCart] = useState<string[]>([])

  // Fetch marketplace packages
  const { data: packagesResponse, isLoading } = useActionQuery(
    'package.list' as any,
    { 
      limit: 100,
      isPublic: true,
      includeInactive: false 
    },
    { enabled: isOpen }
  )

  const allPackages = (packagesResponse?.data || []) as MarketplacePackage[]

  // Filter and sort packages
  const filteredAndSortedPackages = allPackages
    .filter(pkg => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          pkg.name.toLowerCase().includes(query) ||
          pkg.description.toLowerCase().includes(query) ||
          pkg.tags.some(tag => tag.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }

      // Category filter
      if (categoryFilter !== 'all' && pkg.category !== categoryFilter) {
        return false
      }

      // License filter
      if (licenseFilter !== 'all' && pkg.licenseType !== licenseFilter) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'downloads':
          aValue = a.downloadCount || 0
          bValue = b.downloadCount || 0
          break
        case 'rating':
          aValue = a.rating || 0
          bValue = b.rating || 0
          break
        case 'created':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'updated':
          aValue = new Date(a.updatedAt).getTime()
          bValue = new Date(b.updatedAt).getTime()
          break
        default:
          aValue = a.downloadCount || 0
          bValue = b.downloadCount || 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

  const clearFilters = () => {
    setSearchQuery('')
    setCategoryFilter('all')
    setLicenseFilter('all')
    setSortBy('downloads')
    setSortDirection('desc')
  }

  const addToCart = (packageId: string) => {
    if (!cart.includes(packageId)) {
      setCart([...cart, packageId])
    }
  }

  const removeFromCart = (packageId: string) => {
    setCart(cart.filter(id => id !== packageId))
  }

  const installPackage = async (pkg: MarketplacePackage) => {
    try {
      console.log('Installing package:', pkg.name)
      // TODO: Implement package installation via action system
      // await actionClient.executeAction({
      //   action: 'package.install',
      //   data: { packageId: pkg.id }
      // })
      
      // For now, just add to cart
      addToCart(pkg.id)
    } catch (error) {
      console.error('Failed to install package:', error)
    }
  }

  const hasFilters = searchQuery.trim() || categoryFilter !== 'all' || licenseFilter !== 'all'
  const cartCount = cart.length

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("relative", className)}
        >
          <ShoppingCart className="h-4 w-4" />
          {cartCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {cartCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Marketplace
          </SheetTitle>
          <SheetDescription>
            Discover and install packages created by the community
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Search and Filters */}
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search packages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Filters Row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* License Filter */}
              <Select value={licenseFilter} onValueChange={setLicenseFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="License" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Licenses</SelectItem>
                  {Object.entries(LICENSE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort Options */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Sort
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48" align="start">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Sort by</div>
                    <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="downloads">Downloads</SelectItem>
                        <SelectItem value="rating">Rating</SelectItem>
                        <SelectItem value="created">Created</SelectItem>
                        <SelectItem value="updated">Updated</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortDirection} onValueChange={(value: SortDirection) => setSortDirection(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Clear Filters */}
              {hasFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}

              {/* Results Count */}
              <div className="text-sm text-muted-foreground ml-auto">
                {filteredAndSortedPackages.length} packages
              </div>
            </div>
          </div>

          {/* Package List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-sm text-muted-foreground">Loading packages...</div>
              </div>
            ) : filteredAndSortedPackages.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <div className="text-sm text-muted-foreground">
                      {hasFilters ? 'No packages match your filters' : 'No packages available'}
                    </div>
                    {hasFilters && (
                      <Button variant="link" size="sm" onClick={clearFilters} className="mt-2">
                        Clear filters
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredAndSortedPackages.map((pkg) => {
                const isInCart = cart.includes(pkg.id)
                
                return (
                  <Card key={pkg.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium truncate">{pkg.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              v{pkg.version}
                            </Badge>
                            <Badge 
                              variant={pkg.licenseType === 'FREE' ? 'secondary' : 'default'}
                              className="text-xs"
                            >
                              {LICENSE_LABELS[pkg.licenseType]}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {pkg.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              {pkg.downloadCount || 0}
                            </div>
                            {pkg.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {pkg.rating.toFixed(1)}
                              </div>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {CATEGORY_LABELS[pkg.category]}
                            </Badge>
                          </div>
                          
                          {pkg.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {pkg.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {pkg.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{pkg.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          {pkg.price && pkg.price > 0 && (
                            <div className="text-sm font-medium text-right">
                              ${pkg.price}
                              {pkg.subscriptionInterval && (
                                <span className="text-xs text-muted-foreground">
                                  /{pkg.subscriptionInterval}
                                </span>
                              )}
                            </div>
                          )}
                          
                          <Button
                            size="sm"
                            variant={isInCart ? "secondary" : "default"}
                            onClick={() => isInCart ? removeFromCart(pkg.id) : installPackage(pkg)}
                            className="whitespace-nowrap"
                          >
                            {isInCart ? 'In Cart' : 'Install'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          {/* Cart Summary */}
          {cartCount > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">
                      {cartCount} package{cartCount > 1 ? 's' : ''} in cart
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCart([])}>
                      Clear
                    </Button>
                    <Button size="sm">
                      Install All
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
