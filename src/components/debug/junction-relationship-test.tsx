'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { JunctionRelationshipService } from '@/lib/resource-system/junction-relationship-service';

export default function JunctionRelationshipTest() {
  const [testResult, setTestResult] = useState<any>(null);

  const testDiscovery = () => {
    // Test discovering relationships between different resource types
    const testCases = [
      { resourceA: 'node', resourceB: 'process' },
      { resourceA: 'process', resourceB: 'rule' },
      { resourceA: 'node', resourceB: 'workflow' },
      { resourceA: 'workflow', resourceB: 'process' },
      { resourceA: 'customer', resourceB: 'workflow' },
      { resourceA: 'user', resourceB: 'group' },
      { resourceA: 'group', resourceB: 'permission' },
      { resourceA: 'invalid', resourceB: 'test' } // Should return empty
    ];

    const results = testCases.map(testCase => {
      const relationships = JunctionRelationshipService.discoverRelationships(
        testCase.resourceA, 
        testCase.resourceB
      );
      
      return {
        ...testCase,
        relationships,
        hasRelationships: relationships.length > 0
      };
    });

    // Discovery results
    setTestResult(results);
  };

  const testJunctionDataCreation = () => {
    // Test creating junction data for a node-process relationship
    const relationships = JunctionRelationshipService.discoverRelationships('node', 'process');
    
    if (relationships.length > 0) {
      const testContext = {
        parentResourceType: 'node',
        parentId: 'root-1',
        childResourceType: 'process',
        childId: 'test-process-123',
        tenantId: '1BD',
        branchId: 'main',
        additionalData: {
          status: 'ACTIVE',
          sequence: 1
        }
      };

      const junctionData = JunctionRelationshipService.createJunctionData(
        relationships[0],
        testContext
      );

      const actionName = JunctionRelationshipService.getJunctionCreateAction(relationships[0]);
      
      setTestResult({
        ...testResult,
        junctionData,
        actionName
      });
    } else {
      // No relationships found
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Junction Relationship Discovery Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testDiscovery}>
              Test Discovery
            </Button>
            <Button onClick={testJunctionDataCreation}>
              Test Junction Data Creation
            </Button>
          </div>
          
          {testResult && (
            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Test Results:</h3>
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