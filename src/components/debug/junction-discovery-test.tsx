'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { JunctionRelationshipService } from '@/lib/resource-system/junction-relationship-service';
// Junction schemas now handled by unified-resource-registry

export default function JunctionDiscoveryTest() {
  const [testResult, setTestResult] = useState<any>(null);

  const testNodeProcessDiscovery = () => {
    // Test the specific case that's failing
    const relationships = JunctionRelationshipService.discoverRelationships('node', 'process');
    
    // Also test the junction schemas directly
    const junctionSchemas = getJunctionSchemas();
    // Available junction schemas
    
    // Test the specific node-process schema
    const nodeProcessSchema = junctionSchemas.find((s: any) => s.databaseKey === 'node_processes');
    
    if (nodeProcessSchema) {
      const fieldMappings = (nodeProcessSchema as any).fieldMappings || {};
      
      const relationFields = Object.keys(fieldMappings).filter(field => 
        fieldMappings[field].type === 'relation'
      );
      
      const nodeField = relationFields.find(field => 
        field.toLowerCase().includes('node'.toLowerCase())
      );
      const processField = relationFields.find(field => 
        field.toLowerCase().includes('process'.toLowerCase())
      );
      
    }
    
    setTestResult({
      relationships,
      nodeProcessSchema,
      timestamp: new Date().toISOString()
    });
  };

  const testJunctionData = () => {
    // Testing junction data creation
    
    const relationships = JunctionRelationshipService.discoverRelationships('node', 'process');
    
    if (relationships.length > 0) {
      const testContext = {
        parentResourceType: 'node',
        parentId: 'root-1',
        childResourceType: 'process',
        childId: 'test-process-123',
        tenantId: 'tenant-1',
        branchId: 'main',
        additionalData: {
          isActive: true,
          status: 'ACTIVE'
        }
      };
      
      const junctionData = JunctionRelationshipService.createJunctionData(relationships[0], testContext);
      
      const actionName = JunctionRelationshipService.getJunctionCreateAction(relationships[0]);
      
      setTestResult({
        relationships,
        junctionData,
        actionName,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ [JunctionDiscoveryTest] No relationships discovered!');
      setTestResult({
        error: 'No relationships discovered',
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Junction Discovery Debug Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testNodeProcessDiscovery}>
              Test Node-Process Discovery
            </Button>
            <Button onClick={testJunctionData}>
              Test Junction Data Creation
            </Button>
          </div>
          
          {testResult && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-semibold mb-2">Test Result:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}