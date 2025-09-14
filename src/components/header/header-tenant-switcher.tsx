'use client'

import { useState } from 'react'
import { Building2, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/generalUtils'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

export interface HeaderTenantSwitcherProps {
  currentTenant?: any
  onTenantSwitch?: (tenantId: string) => void
  className?: string
}

export function HeaderTenantSwitcher({ 
  currentTenant, 
  onTenantSwitch, 
  className 
}: HeaderTenantSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Mock tenant data - TODO: Replace with real data from session
  const availableTenants = [
    { id: '1', name: 'Acme Corp', description: 'Primary workspace' },
    { id: '2', name: 'Beta Industries', description: 'Secondary workspace' },
    { id: '3', name: 'Gamma LLC', description: 'Development workspace' }
  ]

  const handleTenantChange = (tenantId: string) => {
    onTenantSwitch?.(tenantId)
    setIsOpen(false)
  }

  if (!currentTenant) {
    return null
  }

  return (
    <div className={cn("relative", className)}>
      <Select 
        value={currentTenant.id} 
        onValueChange={handleTenantChange}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger className="w-48 h-8 border-0 bg-transparent hover:bg-muted/50 focus:ring-0 focus:ring-offset-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {currentTenant.name}
              </div>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </SelectTrigger>
        
        <SelectContent align="end" className="w-64">
          <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
            Switch Workspace
          </div>
          
          {availableTenants.map((tenant) => (
            <SelectItem
              key={tenant.id}
              value={tenant.id}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-3 w-full">
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {tenant.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {tenant.description}
                  </div>
                </div>
                {tenant.id === currentTenant.id && (
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </div>
            </SelectItem>
          ))}
          
          <div className="border-t mt-1 pt-1">
            <SelectItem
              value="manage-tenants"
              className="cursor-pointer text-muted-foreground"
              onSelect={(e) => {
                e.preventDefault()
                // TODO: Open tenant management modal
              }}
            >
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4" />
                <span className="text-sm">Manage Workspaces...</span>
              </div>
            </SelectItem>
          </div>
        </SelectContent>
      </Select>
    </div>
  )
}