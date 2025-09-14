/**
 * API Client - Server Integration & Response Handling
 * 
 * Handles:
 * - API requests to action router
 * - Response processing and validation
 * - Server response storage coordination
 */

import type { BranchContext } from '../types';
import type { ActionResponse } from '@/lib/resource-system/schemas';

export class APIClient {
  
  constructor(
    private currentTenantId: string
  ) {}

  /**
   * Fetch data from API with proper headers and error handling
   */
  async fetchFromAPI(
    action: string, 
    data: any, 
    options: any, 
    branchContext?: BranchContext | null
  ): Promise<ActionResponse> {
    const requestPayload = {
      action,
      data,
      options,
      branchContext
    };
    
    // Detect server-side execution and construct appropriate URL
    const isServerSide = typeof window === 'undefined';
    const baseUrl = isServerSide ? process.env.NEXTAUTH_URL || 'http://localhost:3000' : '';
    const apiUrl = `${baseUrl}/api/workspaces/current/actions`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': this.currentTenantId || branchContext?.tenantId || 'default',
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // General debug: log junction presence for all actions
    console.log('[APIClient] API response summary', {
      action,
      success: result?.success,
      hasData: !!result?.data,
      hasJunctions: !!result?.junctions,
      junctionKeys: result?.junctions ? Object.keys(result.junctions) : [],
      resultKeys: result ? Object.keys(result) : [],
      timestamp: new Date().toISOString()
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown API error');
    }

    return result;
  }

  /**
   * Fetch from API with response building and execution time tracking
   */
  async fetchFromAPIWithResponse(
    action: string, 
    data: any, 
    options: any, 
    branchContext: BranchContext | null, 
    startTime: number,
    storeAPIResponseFn: (apiData: ActionResponse, action: string, options: any, branchContext: BranchContext | null) => Promise<void>
  ): Promise<ActionResponse> {
    const apiData = await this.fetchFromAPI(action, data, options, branchContext);
    
    // Store successful API responses in IndexedDB
    if (apiData.success) {
      await storeAPIResponseFn(apiData, action, options, branchContext);
    }

    return {
      ...apiData,
      executionTime: Date.now() - startTime
    };
  }

  /**
   * Update tenant ID for API requests
   */
  setTenantId(tenantId: string): void {
    this.currentTenantId = tenantId;
  }

  /**
   * Get current tenant ID
   */
  getTenantId(): string {
    return this.currentTenantId;
  }
} 