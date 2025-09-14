"use client"

import type { UTRSourceData, ConsolidatedUTR, UTRConnectionConfig } from '../types'

/**
 * 🏗️ VENDOR INTEGRATION SERVICE
 * 
 * Handles vendor.get() calls and UTR assembly for rule testing.
 * Connects the UTR connection configuration to actual data retrieval.
 */

export class VendorIntegrationService {
  
  /**
   * 🎯 Main method: Get consolidated UTR from multiple sources
   */
  async getConsolidatedUTR(config: UTRConnectionConfig): Promise<ConsolidatedUTR> {

    
    const startTime = Date.now()
    const results: any[] = []
    const errors: string[] = []
    
    // Phase 1: Fetch data from each source
    for (const source of config.sources) {
      try {
  
        
        // Update source status to loading
        source.status = 'loading'
        
        const sourceData = await this.fetchFromVendor(source)
        results.push({ source, data: sourceData })
        
        // Update source status to loaded
        source.status = 'loaded'
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error(`❌ [VendorIntegration] Failed to fetch from ${source.vendor}:`, errorMsg)
        
        errors.push(`${source.vendor} (${source.locator}): ${errorMsg}`)
        source.status = 'error'
        source.error = errorMsg
      }
    }
    
    // Phase 2: Assemble consolidated UTR
    const assembledUTR = await this.assembleUTR(results, config)
    
    const completionTime = Date.now() - startTime

    
    return {
      metadata: {
        sourceCount: results.length,
        assembledAt: new Date(),
        completenessScore: this.calculateCompletenessScore(results)
      },
      sources: config.sources,
      data: assembledUTR,
      errors: errors.length > 0 ? errors : undefined
    }
  }
  
  /**
   * 🌐 Fetch data from a specific vendor
   */
  private async fetchFromVendor(source: UTRSourceData): Promise<any> {
    // TODO: Replace with actual vendor.get() calls
    // For now, return mock data based on vendor type
    
    switch (source.vendor) {
      case 'amadeus':
        return this.getMockAmadeusData(source.locator)
      case 'sabre':
        return this.getMockSabreData(source.locator)
      case 'kayak':
        return this.getMockKayakData(source.locator)
      case 'direct':
        return this.getMockDirectData(source.locator)
      default:
        throw new Error(`Unsupported vendor: ${source.vendor}`)
    }
  }
  
  /**
   * 🔧 Assemble UTR from multiple source results
   */
  private async assembleUTR(results: any[], config: UTRConnectionConfig): Promise<any> {

    
    // Use UTR assembly logic similar to schemas/utr/normalized/multi-source-utr.json
    const assembledUTR = {
      metadata: {
        normalizationVersion: "1.0.0",
        generatedAt: new Date().toISOString(),
        sourceCount: results.length,
        dataQuality: {
          completenessScore: this.calculateCompletenessScore(results),
          sourceContributions: this.calculateSourceContributions(results),
          missingElements: [],
          dataAgeHours: 0.1
        }
      },
      pnrHeader: this.assemblePNRHeader(results),
      associatedRecords: this.assembleAssociatedRecords(results),
      officeContext: this.assembleOfficeContext(results),
      agentContext: this.assembleAgentContext(results),
      passengers: this.assemblePassengers(results),
      segments: this.assembleSegments(results),
      invoices: this.assembleInvoices(results),
      communications: this.assembleCommunications(results, config.emailOverrides)
    }
    
    return assembledUTR
  }
  
  /**
   * 📊 Calculate completeness score based on available data
   */
  private calculateCompletenessScore(results: any[]): number {
    if (results.length === 0) return 0
    
    // Simple scoring: more sources = higher completeness
    const baseScore = Math.min(results.length / 2, 1) // Max at 2 sources
    return Math.round(baseScore * 100) / 100
  }
  
  /**
   * 📈 Calculate source contributions
   */
  private calculateSourceContributions(results: any[]): Record<string, number> {
    const contributions: Record<string, number> = {}
    const total = results.length
    
    results.forEach(result => {
      const vendor = result.source.vendor
      contributions[vendor] = (contributions[vendor] || 0) + (1 / total)
    })
    
    return contributions
  }
  
  // 🎭 Mock data generators (replace with real vendor.get() calls later)
  
  private async getMockAmadeusData(locator: string): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
    
    // Load mock Amadeus data from public directory
    try {
      const response = await fetch('/schemas/utr/normalized/amadeus-utr-full.json')
      if (!response.ok) {
        throw new Error(`Failed to fetch amadeus data: ${response.status}`)
      }
      const amadeusUTR = await response.json()
      return {
        ...amadeusUTR,
        pnrHeader: { ...amadeusUTR.pnrHeader, recordLocator: locator }
      }
    } catch (error) {
      console.warn('Failed to load Amadeus UTR data, using fallback:', error)
      // Fallback to simple mock
      return {
        vendor: 'amadeus',
        locator,
        segments: [
          {
            segmentNumber: 1,
            type: 'air',
            departure: { airport: 'JFK', date: '2025-02-15' },
            arrival: { airport: 'LHR', date: '2025-02-15' }
          }
        ],
        passengers: [
          { name: { first: 'John', last: 'DOE' }, passengerNumber: 1 }
        ]
      }
    }
  }
  
  private async getMockSabreData(locator: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 800))
    
    try {
      const response = await fetch('/schemas/utr/normalized/sabre-utr-full.json')
      if (!response.ok) {
        throw new Error(`Failed to fetch sabre data: ${response.status}`)
      }
      const sabreUTR = await response.json()
      return {
        ...sabreUTR,
        pnrHeader: { ...sabreUTR.pnrHeader, recordLocator: locator }
      }
    } catch (error) {
      console.warn('Failed to load Sabre UTR data, using fallback:', error)
      return {
        vendor: 'sabre',
        locator,
        segments: [
          {
            segmentNumber: 1,
            type: 'hotel',
            property: 'Marriott London',
            checkIn: '2025-02-15',
            checkOut: '2025-02-17'
          }
        ]
      }
    }
  }
  
  private async getMockKayakData(locator: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 600))
    
    return {
      vendor: 'kayak',
      locator,
      segments: [
        {
          segmentNumber: 1,
          type: 'air',
          departure: { airport: 'LAX', date: '2025-02-20' },
          arrival: { airport: 'JFK', date: '2025-02-20' }
        }
      ],
      pricing: { totalFare: 542.50, currency: 'USD' }
    }
  }
  
  private async getMockDirectData(locator: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 400))
    
    return {
      vendor: 'direct',
      locator,
      segments: [
        {
          segmentNumber: 1,
          type: 'car',
          pickup: { location: 'LHR Airport', date: '2025-02-15' },
          dropoff: { location: 'LHR Airport', date: '2025-02-17' }
        }
      ]
    }
  }
  
  // UTR Assembly helper methods
  private assemblePNRHeader(results: any[]) {
    const primary = results.find(r => r.source.isPrimary) || results[0]
    return primary?.data?.pnrHeader || {
      recordLocator: 'TEST' + Date.now().toString().slice(-6),
      source: { system: 'multi-source', type: 'combined' }
    }
  }
  
  private assembleAssociatedRecords(results: any[]) {
    return results.map(r => ({
      recordLocator: r.source.locator,
      vendor: r.source.vendor,
      type: r.source.vendor === 'amadeus' ? 'edifact' : 'gds',
      isPrimary: r.source.isPrimary,
      contribution: r.source.dataTypes.join(', ')
    }))
  }
  
  private assembleOfficeContext(results: any[]) {
    const primary = results.find(r => r.source.isPrimary) || results[0]
    return primary?.data?.officeContext || {
      responsibilityOffice: 'TEST001'
    }
  }
  
  private assembleAgentContext(results: any[]) {
    const primary = results.find(r => r.source.isPrimary) || results[0]
    return primary?.data?.agentContext || {
      currentAgent: 'TESTAGT'
    }
  }
  
  private assemblePassengers(results: any[]) {
    // Combine passengers from all sources, avoiding duplicates
    const allPassengers = results.flatMap(r => r.data?.passengers || [])
    return allPassengers.slice(0, 1) // For now, take first passenger
  }
  
  private assembleSegments(results: any[]) {
    // Combine all segments from all sources
    const allSegments = results.flatMap(r => r.data?.segments || [])
    return allSegments.map((segment, index) => ({
      ...segment,
      segmentNumber: index + 1,
      source: {
        system: results.find(r => r.data?.segments?.includes(segment))?.source?.vendor || 'unknown'
      }
    }))
  }
  
  private assembleInvoices(results: any[]) {
    return results.flatMap(r => r.data?.invoices || [])
  }
  
  private assembleCommunications(results: any[], emailOverrides: any) {
    const baseCommunications = results.flatMap(r => r.data?.communications || [])
    
    // Apply email overrides for testing
    return baseCommunications.map(comm => ({
      ...comm,
      testingOverrides: {
        originalRecipient: comm.recipient,
        overrideMode: emailOverrides.mode,
        testRecipient: emailOverrides.testEmail || emailOverrides.deliveryAddress
      }
    }))
  }
}