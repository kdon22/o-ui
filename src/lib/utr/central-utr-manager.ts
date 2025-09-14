// 🎯 GOLD STANDARD: Single UTR Manager for Everything
// No complex transformers - just smart schema-driven access

export class CentralUTRManager {
  private static instance: CentralUTRManager
  private utrCache = new Map<string, UTR>()
  private listeners = new Set<() => void>()

  static getInstance(): CentralUTRManager {
    if (!CentralUTRManager.instance) {
      CentralUTRManager.instance = new CentralUTRManager()
    }
    return CentralUTRManager.instance
  }

  // 🎯 SINGLE ENTRY POINT: Get UTR for any system
  async getUTR(recordLocator: string, options?: UTRGetOptions): Promise<UTR> {
    const cacheKey = `${recordLocator}:${options?.sources?.join(',') || 'all'}`

    // Check cache first
    if (this.utrCache.has(cacheKey) && !options?.forceRefresh) {
      return this.utrCache.get(cacheKey)!
    }

    // Fetch from backend
    const utr = await this.fetchUTRFromBackend(recordLocator, options)

    // Cache it
    this.utrCache.set(cacheKey, utr)
    this.notifyListeners()

    return utr
  }

  // 🎯 SMART FLUSH: Clear cache when needed
  flush(recordLocator?: string): void {
    if (recordLocator) {
      // Flush specific UTR
      Array.from(this.utrCache.keys())
        .filter(key => key.startsWith(recordLocator))
        .forEach(key => this.utrCache.delete(key))
    } else {
      // Flush all
      this.utrCache.clear()
    }
    this.notifyListeners()
  }

  // 🎯 REFILL: Preload UTRs for performance
  async refill(recordLocators: string[]): Promise<void> {
    await Promise.allSettled(
      recordLocators.map(locator => this.getUTR(locator))
    )
  }

  // 🎯 SYSTEM ACCESS METHODS (no complex transformers)
  getForBusinessRules(recordLocator: string): BusinessRuleUTR {
    const utr = this.utrCache.get(recordLocator)
    if (!utr) throw new Error(`UTR ${recordLocator} not loaded`)

    // Direct property access - schema is the transformer
    return {
      recordLocator: utr.recordLocator,
      passengers: utr.passengers,
      segments: utr.segments,
      invoices: utr.invoices,
      metadata: utr.metadata,
      // Add convenience methods as direct properties
      getTotalFare: () => utr.invoices?.reduce((sum, inv) => sum + (inv.totalFare?.amount || 0), 0) || 0,
      getPrimaryEmail: () => utr.passengers?.find(p => p.contactInfo?.find(c => c.type === 'email' && c.isPrimary))?.contactInfo?.find(c => c.type === 'email')?.value
    }
  }

  getForMonaco(recordLocator: string): MonacoUTR {
    const utr = this.utrCache.get(recordLocator)
    if (!utr) throw new Error(`UTR ${recordLocator} not loaded`)

    return {
      // Monaco gets direct access to UTR structure
      // IntelliSense works directly on the schema
      ...utr
    }
  }

  getForPythonExecution(recordLocator: string): PythonUTR {
    const utr = this.utrCache.get(recordLocator)
    if (!utr) throw new Error(`UTR ${recordLocator} not loaded`)

    return {
      // Python gets the data it needs for execution
      record_locator: utr.recordLocator,
      passengers: utr.passengers,
      segments: utr.segments,
      invoices: utr.invoices,
      // Direct mapping - no complex transformation
      get_passenger_by_number: (num: number) => utr.passengers?.find(p => p.passengerNumber === num),
      get_total_fare: () => utr.invoices?.reduce((sum, inv) => sum + (inv.totalFare?.amount || 0), 0) || 0
    }
  }

  // 🎯 VENDOR OPERATIONS (simplified)
  async vendorCall(operation: VendorOperation): Promise<any> {
    // Single point for all vendor operations
    const response = await fetch('/api/vendor/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(operation)
    })

    if (!response.ok) {
      throw new Error(`Vendor operation failed: ${response.statusText}`)
    }

    const result = await response.json()

    // If operation modified UTR, update cache
    if (operation.updatesUTR && operation.recordLocator) {
      this.flush(operation.recordLocator)
      // Optionally refetch immediately
      if (operation.returnUpdatedUTR) {
        await this.getUTR(operation.recordLocator)
      }
    }

    return result
  }

  private async fetchUTRFromBackend(recordLocator: string, options?: UTRGetOptions): Promise<UTR> {
    const response = await fetch('/api/utr/retrieve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordLocator,
        ...options
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch UTR: ${response.statusText}`)
    }

    const result = await response.json()
    return result.output // Backend returns { output: utrData }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener())
  }

  // Listen for UTR changes
  onUTRChange(callback: () => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }
}

// 🎯 SINGLETON ACCESS
export const utrManager = CentralUTRManager.getInstance()

// 🎯 VENDOR OPERATIONS (clean and simple)
export const vendor = {
  async utrGet(recordLocator: string, sources?: string[], options?: any): Promise<UTR> {
    return utrManager.getUTR(recordLocator, { sources, ...options })
  },

  async segmentsCancel(recordLocator: string, segmentNumbers: number[], reason?: string): Promise<any> {
    return utrManager.vendorCall({
      operation: 'segmentsCancel',
      recordLocator,
      segmentNumbers,
      reason,
      updatesUTR: true,
      returnUpdatedUTR: true
    })
  },

  async emailSend(recipients: string | string[], subject: string, body: string, options?: any): Promise<any> {
    return utrManager.vendorCall({
      operation: 'emailSend',
      recipients: Array.isArray(recipients) ? recipients : [recipients],
      subject,
      body,
      options
    })
  }
}

// 🎯 TYPES
interface UTRGetOptions {
  sources?: string[]
  forceRefresh?: boolean
}

interface BusinessRuleUTR {
  recordLocator: string
  passengers: Passenger[]
  segments: TravelSegment[]
  invoices: Invoice[]
  metadata: NormalizationMetadata
  getTotalFare(): number
  getPrimaryEmail(): string | undefined
}

interface MonacoUTR extends UTR {
  // Monaco gets full UTR with IntelliSense
}

interface PythonUTR {
  record_locator: string
  passengers: Passenger[]
  segments: TravelSegment[]
  invoices: Invoice[]
  get_passenger_by_number(num: number): Passenger | undefined
  get_total_fare(): number
}

interface VendorOperation {
  operation: string
  recordLocator?: string
  updatesUTR?: boolean
  returnUpdatedUTR?: boolean
  [key: string]: any
}
