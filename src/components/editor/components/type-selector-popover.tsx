import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Search, Type, ChevronRight, Package, Wrench } from 'lucide-react'
import { typeRegistry, TypeDefinition, TypeCategory } from '../types/type-registry'
import { useCustomTypeCreator } from '../hooks/use-custom-type-creator'

interface TypeSelectorPopoverProps {
  children: React.ReactNode
  onTypeSelect: (type: TypeDefinition) => void
  selectedTypeId?: string
  placeholder?: string
  showSearch?: boolean
  categories?: TypeCategory[]
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  width?: number
}

const getCategoryInfo = (category: TypeCategory) => {
  switch (category) {
    case 'primitive':
      return { label: 'Basic Types', icon: Type, color: 'text-blue-600' }
    case 'system':
      return { label: 'System Types', icon: Package, color: 'text-purple-600' }
    case 'custom':
      return { label: 'Custom Classes', icon: Wrench, color: 'text-green-600' }
    default:
      return { label: 'Other', icon: Type, color: 'text-gray-600' }
  }
}

export function TypeSelectorPopover({
  children,
  onTypeSelect,
  selectedTypeId,
  placeholder = 'Search types...',
  showSearch = true,
  categories = ['primitive', 'system', 'custom'],
  side = 'right',
  align = 'start',
  width = 320
}: TypeSelectorPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [types, setTypes] = useState<TypeDefinition[]>([])
  
  const { openTypeCreator } = useCustomTypeCreator()

  // Subscribe to registry changes
  useEffect(() => {
    const updateTypes = () => {
      setTypes(typeRegistry.getAllTypes())
    }
    
    updateTypes()
    const unsubscribe = typeRegistry.subscribe(updateTypes)
    return unsubscribe
  }, [])

  // Filter types based on search and categories
  const filteredTypes = useMemo(() => {
    let result = types.filter(type => categories.includes(type.category))

    if (searchQuery) {
      result = typeRegistry.searchTypes(searchQuery).filter(type => 
        categories.includes(type.category)
      )
    } else {
      // Show most popular types first when no search
      result = result.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    }

    return result
  }, [types, searchQuery, categories])

  // Group types by category
  const groupedTypes = useMemo(() => {
    const groups: Record<TypeCategory, TypeDefinition[]> = {
      primitive: [],
      system: [],
      custom: []
    }

    filteredTypes.forEach(type => {
      groups[type.category].push(type)
    })

    return groups
  }, [filteredTypes])

  const handleTypeSelect = (type: TypeDefinition) => {
    onTypeSelect(type)
    setIsOpen(false)
    setSearchQuery('')
  }

  const selectedType = selectedTypeId ? typeRegistry.getType(selectedTypeId) : null

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      
      <PopoverContent
        side={side}
        align={align}
        className="p-0"
        style={{ width }}
        sideOffset={4}
      >
        {/* Header */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">Select Type</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              ✕
            </Button>
          </div>
          
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholder}
                className="pl-8 h-8 text-sm"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Type List */}
        <ScrollArea className="max-h-80">
          <div className="p-2">
            {categories.map(category => {
              const categoryTypes = groupedTypes[category]
              if (categoryTypes.length === 0) return null

              const { label, icon: Icon, color } = getCategoryInfo(category)

              return (
                <div key={category} className="mb-3 last:mb-0">
                  <div className="flex items-center gap-1.5 px-1 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                    {label}
                  </div>
                  <div className="space-y-0.5">
                    {categoryTypes.map(type => (
                      <button
                        key={type.id}
                        onClick={() => handleTypeSelect(type)}
                        className={`w-full p-2 text-left rounded hover:bg-gray-50 focus:bg-blue-50 focus:outline-none group transition-colors ${
                          selectedTypeId === type.id ? 'bg-blue-50 ring-1 ring-blue-200' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900">
                              {type.name}
                            </div>
                            <div className="text-xs text-gray-600 leading-tight mt-0.5">
                              {type.description}
                            </div>
                            
                            {/* Show properties for complex types */}
                            {'properties' in type && type.properties && type.properties.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {type.properties.slice(0, 3).map((prop) => (
                                  <Badge 
                                    key={prop.name} 
                                    variant="outline" 
                                    className="text-xs h-4 px-1.5 py-0 font-mono"
                                  >
                                    {prop.name}: {prop.type}
                                  </Badge>
                                ))}
                                {type.properties.length > 3 && (
                                  <span className="text-xs text-gray-400">
                                    +{type.properties.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Show methods count for complex types */}
                            {'methods' in type && type.methods && type.methods.length > 0 && (
                              <div className="mt-1">
                                <Badge variant="secondary" className="text-xs h-4 px-1.5 py-0">
                                  {type.methods.length} method{type.methods.length !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                            )}
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* No results */}
            {filteredTypes.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                <Type className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <div className="text-sm">No types found</div>
                {searchQuery && (
                  <div className="text-xs mt-1">
                    Try a different search term
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer with actions */}
        <div className="p-2 border-t border-gray-100">
          <Button
            size="sm"
            variant="ghost"
            className="w-full text-xs text-gray-600 hover:text-gray-800"
            onClick={() => {
              openTypeCreator()
              setIsOpen(false)
            }}
          >
            <Wrench className="h-3.5 w-3.5 mr-1.5" />
            Create New Type
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
} 