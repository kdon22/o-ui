import React, { useEffect, useState } from 'react';
import workspaceBootstrap from '@/lib/services/workspace-bootstrap';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function BootstrapTest() {
  const [resources, setResources] = useState<string[]>([]);
  const [junctions, setJunctions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const availableResources = workspaceBootstrap.getAvailableResources();
      const availableJunctions = workspaceBootstrap.getAvailableJunctions();
      
      setResources(availableResources);
      setJunctions(availableJunctions);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Bootstrap Resource Discovery</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Available Resources ({resources.length})</h3>
              <div className="flex flex-wrap gap-2">
                {resources.map((resource, index) => (
                  <Badge 
                    key={index} 
                    variant={resource === 'branches' ? 'default' : 'secondary'}
                    className={resource === 'branches' ? 'bg-green-100 text-green-800 border-green-300' : ''}
                  >
                    {resource}
                    {resource === 'branches' && ' ✅'}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Available Junctions ({junctions.length})</h3>
              <div className="flex flex-wrap gap-2">
                {junctions.map((junction, index) => (
                  <Badge key={index} variant="outline">
                    {junction}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
