import { useCallback, useState, useMemo } from 'react'

export interface SearchResult {
  id: string
  name: string
  path: string
  type: string
  level: number
  description: string
  parentId?: string | null
}

export interface SearchState {
  searchQuery: string
  searchResults: SearchResult[]
  isSearching: boolean
  searchableNodes: SearchResult[]
}

export interface SearchActions {
  handleSearch: (query: string) => void
  handleSearchClear: () => void
  handleSearchResultSelect: (result: SearchResult) => void
}

export interface UseSearchReturn extends SearchState, SearchActions {}

export function useSearch(nodesData?: any[]): UseSearchReturn {
  // ✅ REMOVED: Duplicate query - now uses passed data from AutoTree
  // const { data: allNodesData } = useResourceList('node', ...)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Convert node data to searchable format
  const searchableNodes = useMemo(() => {
    if (!nodesData) return []
    
    return nodesData.map((node: any) => ({
      id: node.id,
      name: node.name,
      path: node.path || `/${node.name}`,
      type: node.type || 'NODE',
      level: node.level || 0,
      description: node.description || '',
      parentId: node.parentId
    }))
  }, [nodesData])

  // Search function that filters nodes based on query
  const searchNodes = useCallback((query: string): SearchResult[] => {
    if (!query.trim()) return []
    
    const lowerQuery = query.toLowerCase()
    return searchableNodes.filter(node => 
      node.name.toLowerCase().includes(lowerQuery) ||
      node.description.toLowerCase().includes(lowerQuery) ||
      node.path.toLowerCase().includes(lowerQuery)
    ).slice(0, 10) // Limit to 10 results
  }, [searchableNodes])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setIsSearching(true)
    
    // Perform real search using searchNodes function
    const results = searchNodes(query)
    setSearchResults(results)
    setIsSearching(false)
    
    
  }, [searchNodes])

  const handleSearchClear = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
    setIsSearching(false)
  }, [])

  const handleSearchResultSelect = useCallback((result: SearchResult) => {
    
    // TODO: Implement navigation to node page (window.location.href = `/nodes/${result.id}`)
  }, [])

  return {
    searchQuery,
    searchResults,
    isSearching,
    searchableNodes,
    handleSearch,
    handleSearchClear,
    handleSearchResultSelect
  }
}