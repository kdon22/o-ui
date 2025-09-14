/**
 * IndexedDB Inspector - Development Debug Component
 * 
 * Provides real-time inspection of IndexedDB contents and cache status
 * for debugging the bootstrap process and data availability.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { actionClient } from '@/lib/action-client';
import { getAllDatabaseKeys } from '@/lib/resource-system/resource-registry';
// Junction table names now handled by unified-resource-registry

interface IndexedDBStats {
  storeName: string;
  itemCount: number;
  sampleItems: any[];
  lastUpdated: string;
  size?: string;
}

export function IndexedDBInspector() {
  const [stats, setStats] = useState<IndexedDBStats[]>([]);
  const [isInspecting, setIsInspecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapLog, setBootstrapLog] = useState<string[]>([]);

  const inspectIndexedDB = useCallback(async () => {
    try {
      setIsInspecting(true);
      setError(null);
      
      // Open IndexedDB directly to inspect contents
      const dbName = `o-${actionClient.getTenantId()}`;
      const request = indexedDB.open(dbName);
      
      request.onsuccess = async (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const storeNames = Array.from(db.objectStoreNames);
        const storeStats: IndexedDBStats[] = [];
        
        // Get expected store names from registries
        const resourceTables = getAllDatabaseKeys();
        const junctionTables = getJunctionTableNames();
        const expectedStores = [...resourceTables, ...junctionTables];
        
        console.log('📊 Expected stores:', expectedStores);
        console.log('📊 Actual stores:', storeNames);
        
        for (const storeName of storeNames) {
          try {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const countRequest = store.count();
            const getAllRequest = store.getAll();
            
            await new Promise((resolve, reject) => {
              transaction.oncomplete = resolve;
              transaction.onerror = () => reject(transaction.error);
            });
            
            const count = countRequest.result;
            const allItems = getAllRequest.result;
            
            const isJunction = junctionTables.includes(storeName);
            
            storeStats.push({
              storeName: isJunction ? `${storeName} (junction)` : storeName,
              itemCount: count,
              sampleItems: allItems.slice(0, 3), // First 3 items as sample
              lastUpdated: new Date().toISOString()
            });
          } catch (err) {
            console.error(`Error inspecting store ${storeName}:`, err);
          }
        }
        
        // Add missing stores with 0 counts
        expectedStores.forEach(storeName => {
          if (!storeNames.includes(storeName)) {
            const isJunction = junctionTables.includes(storeName);
            storeStats.push({
              storeName: isJunction ? `${storeName} (junction)` : storeName,
              itemCount: 0,
              sampleItems: [],
              lastUpdated: new Date().toISOString()
            });
          }
        });
        
        setStats(storeStats);
        db.close();
      };
      
      request.onerror = () => {
        setError('Failed to open IndexedDB');
      };
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsInspecting(false);
    }
  }, []);

  const testBootstrap = useCallback(async () => {
    try {
      setBootstrapLog(['🔄 Testing bootstrap process...']);
      
      // Test the action client directly
      const resources = ['nodes', 'processes', 'rules', 'offices', 'workflows'];
      
      for (const resource of resources) {
        try {
          const actionPrefix = resource === 'nodes' ? 'node' : 
                             resource === 'processes' ? 'process' :
                             resource === 'rules' ? 'rule' :
                             resource === 'offices' ? 'office' :
                             resource === 'workflows' ? 'workflow' : resource.slice(0, -1);
          
          setBootstrapLog(prev => [...prev, `📦 Testing ${resource}...`]);
          
          const response = await actionClient.executeAction({
            action: `${actionPrefix}.list`,
            options: { limit: 10 }
          });
          
          if (response.success) {
            setBootstrapLog(prev => [...prev, `✅ ${resource}: ${response.data?.length || 0} items (${response.cached ? 'cached' : 'fresh'})`]);
          } else {
            setBootstrapLog(prev => [...prev, `❌ ${resource}: ${response.error || 'Failed'}`]);
          }
        } catch (err) {
          setBootstrapLog(prev => [...prev, `💥 ${resource}: ${err instanceof Error ? err.message : 'Unknown error'}`]);
        }
      }
      
      setBootstrapLog(prev => [...prev, '🔍 Refreshing IndexedDB inspection...']);
      await inspectIndexedDB();
      
    } catch (err) {
      setBootstrapLog(prev => [...prev, `💥 Bootstrap test failed: ${err instanceof Error ? err.message : 'Unknown error'}`]);
    }
  }, [inspectIndexedDB]);

  const clearIndexedDB = useCallback(async () => {
    try {
      const dbName = `o-${actionClient.getTenantId()}`;
      const deleteRequest = indexedDB.deleteDatabase(dbName);
      
      deleteRequest.onsuccess = () => {
        setStats([]);
        setBootstrapLog(prev => [...prev, '🗑️ IndexedDB cleared successfully']);
      };
      
      deleteRequest.onerror = () => {
        setError('Failed to clear IndexedDB');
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  useEffect(() => {
    inspectIndexedDB();
  }, [inspectIndexedDB]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 overflow-auto z-50 bg-white shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">IndexedDB Inspector</CardTitle>
        <CardDescription className="text-xs">
          Debug tool for cache and bootstrap status
        </CardDescription>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={inspectIndexedDB}
            disabled={isInspecting}
          >
            {isInspecting ? 'Inspecting...' : 'Refresh'}
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={testBootstrap}
          >
            Test Bootstrap
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={clearIndexedDB}
          >
            Clear DB
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {error && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
        
        {/* IndexedDB Stats */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold">Stores:</h4>
          {stats.length === 0 ? (
            <div className="text-xs text-gray-500">No stores found or empty</div>
          ) : (
            stats.map((stat) => (
              <div key={stat.storeName} className="flex items-center justify-between text-xs">
                <span className="font-mono">{stat.storeName}</span>
                <Badge variant={stat.itemCount > 0 ? 'default' : 'secondary'}>
                  {stat.itemCount} items
                </Badge>
              </div>
            ))
          )}
        </div>
        
        {/* Bootstrap Log */}
        {bootstrapLog.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-xs font-semibold">Bootstrap Log:</h4>
            <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
              {bootstrapLog.map((log, index) => (
                <div key={index} className="font-mono text-gray-600">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 