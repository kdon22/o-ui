/**
 * Change History Modal - Gold Standard Change Viewing
 * 
 * Provides comprehensive change viewing with:
 * - Monaco diff editor for code changes
 * - Semantic change visualization
 * - Version timeline
 * - Rollback capabilities
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DiffEditor } from '@monaco-editor/react';
import { Clock, User, GitBranch, RotateCcw, Eye, Code, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

export interface ChangeHistoryItem {
  id: string;
  sha: string;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'MERGE' | 'ROLLBACK';
  message?: string;
  userId: string;
  userName: string;
  branchId: string;
  branchName: string;
  createdAt: string;
  fieldChanges?: Record<string, FieldChange>;
  beforeData?: any;
  afterData?: any;
  isConflicted?: boolean;
  mergeEventId?: string;
}

export interface FieldChange {
  type: 'added' | 'modified' | 'deleted';
  from?: any;
  to?: any;
  fieldType?: string;
}

export interface ChangeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityType: string;
  entityName: string;
  tenantId: string;
  branchId: string;
}

// ============================================================================
// FIELD CHANGE CARD COMPONENT
// ============================================================================

interface FieldChangeCardProps {
  field: string;
  change: FieldChange;
  entityType: string;
}

function FieldChangeCard({ field, change, entityType }: FieldChangeCardProps) {
  // 🎯 ENTITY-SPECIFIC FIELD LABELS
  const getFieldLabel = (field: string, entityType: string) => {
    const fieldLabels: Record<string, Record<string, string>> = {
      Office: {
        officeId: 'Office ID',
        address: 'Address',
        city: 'City',
        state: 'State',
        zipCode: 'ZIP Code',
        phone: 'Phone Number',
        isActive: 'Status',
        credentialId: 'Credential'
      },
      Process: {
        name: 'Process Name',
        description: 'Description',
        type: 'Process Type',
        isActive: 'Status',
        runOrder: 'Execution Order'
      },
      Node: {
        name: 'Node Name',
        type: 'Node Type',
        level: 'Hierarchy Level',
        sortOrder: 'Sort Order',
        isActive: 'Status'
      },
      Rule: {
        name: 'Rule Name',
        sourceCode: 'Business Logic',
        pythonName: 'Python Function Name',
        type: 'Rule Type',
        executionMode: 'Execution Mode',
        runOrder: 'Run Order',
        isActive: 'Status'
      }
    };
    
    return fieldLabels[entityType]?.[field] || field;
  };

  // 🎯 SMART VALUE FORMATTING
  const formatValue = (value: any, field: string) => {
    if (value === null || value === undefined) return 'Not set';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (field === 'isActive') return value ? 'Active' : 'Inactive';
    if (field.includes('At') && typeof value === 'string') {
      try {
        return formatDistanceToNow(new Date(value)) + ' ago';
      } catch {
        return value;
      }
    }
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    return String(value);
  };

  const fieldLabel = getFieldLabel(field, entityType);

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline" className="font-medium">
          {fieldLabel}
        </Badge>
        <Badge 
          variant={
            change.type === 'added' ? 'default' :
            change.type === 'modified' ? 'secondary' :
            'destructive'
          }
        >
          {change.type}
        </Badge>
      </div>
      
      {change.type === 'modified' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-destructive mb-2 flex items-center gap-1">
              <span className="w-2 h-2 bg-destructive rounded-full"></span>
              Before
            </h4>
            <div className="text-sm bg-destructive/10 p-3 rounded border border-destructive/20">
              {field === 'sourceCode' ? (
                <pre className="whitespace-pre-wrap font-mono text-xs">
                  {formatValue(change.from, field)}
                </pre>
              ) : (
                <span className="font-medium">
                  {formatValue(change.from, field)}
                </span>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              After
            </h4>
            <div className="text-sm bg-green-50 p-3 rounded border border-green-200">
              {field === 'sourceCode' ? (
                <pre className="whitespace-pre-wrap font-mono text-xs">
                  {formatValue(change.to, field)}
                </pre>
              ) : (
                <span className="font-medium">
                  {formatValue(change.to, field)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {change.type === 'added' && (
        <div>
          <h4 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-600 rounded-full"></span>
            Added
          </h4>
          <div className="text-sm bg-green-50 p-3 rounded border border-green-200">
            {field === 'sourceCode' ? (
              <pre className="whitespace-pre-wrap font-mono text-xs">
                {formatValue(change.to, field)}
              </pre>
            ) : (
              <span className="font-medium">
                {formatValue(change.to, field)}
              </span>
            )}
          </div>
        </div>
      )}
      
      {change.type === 'deleted' && (
        <div>
          <h4 className="text-sm font-medium text-destructive mb-2 flex items-center gap-1">
            <span className="w-2 h-2 bg-destructive rounded-full"></span>
            Deleted
          </h4>
          <div className="text-sm bg-destructive/10 p-3 rounded border border-destructive/20">
            {field === 'sourceCode' ? (
              <pre className="whitespace-pre-wrap font-mono text-xs">
                {formatValue(change.from, field)}
              </pre>
            ) : (
              <span className="font-medium">
                {formatValue(change.from, field)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ChangeHistoryModal({
  isOpen,
  onClose,
  entityId,
  entityType,
  entityName,
  tenantId,
  branchId
}: ChangeHistoryModalProps) {
  const [history, setHistory] = useState<ChangeHistoryItem[]>([]);
  const [selectedChange, setSelectedChange] = useState<ChangeHistoryItem | null>(null);
  const [compareMode, setCompareMode] = useState<'current' | 'previous'>('previous');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    if (isOpen && entityId) {
      loadChangeHistory();
    }
  }, [isOpen, entityId, entityType, tenantId, branchId]);

  const loadChangeHistory = async () => {
    try {
      setLoading(true);
      
      // 🏆 GOLD STANDARD: Load version history using our enhanced system
      const response = await fetch('/api/workspaces/current/actions/version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'version.getHistory',
          data: {
            entityType,
            entityId,
            tenantId,
            branchId,
            includeFieldChanges: true,
            includeContent: true
          }
        })
      });

      if (!response.ok) throw new Error('Failed to load change history');
      
      const result = await response.json();
      if (result.success) {
        setHistory(result.data.history || []);
        if (result.data.history?.length > 0) {
          setSelectedChange(result.data.history[0]); // Select latest change
        }
      }
    } catch (error) {
      console.error('Failed to load change history:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // CHANGE COMPARISON
  // ============================================================================

  const getComparisonData = () => {
    if (!selectedChange || !history.length) return null;

    const currentIndex = history.findIndex(h => h.id === selectedChange.id);
    const previousChange = compareMode === 'previous' 
      ? history[currentIndex + 1] 
      : history[0]; // Compare with latest

    return {
      current: selectedChange,
      previous: previousChange,
      originalCode: previousChange?.afterData?.sourceCode || '',
      modifiedCode: selectedChange.afterData?.sourceCode || '',
      originalPython: previousChange?.afterData?.pythonCode || '',
      modifiedPython: selectedChange.afterData?.pythonCode || ''
    };
  };

  const comparisonData = getComparisonData();

  // ============================================================================
  // ROLLBACK FUNCTIONALITY
  // ============================================================================

  const handleRollback = async (targetChange: ChangeHistoryItem) => {
    try {
      const response = await fetch('/api/workspaces/current/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'version.rollback',
          data: {
            entityType,
            entityId,
            targetVersionSha: targetChange.sha,
            tenantId,
            branchId,
            reason: `Rollback to version from ${formatDistanceToNow(new Date(targetChange.createdAt))} ago`
          }
        })
      });

      if (response.ok) {
        // Reload history and close modal
        await loadChangeHistory();
        onClose();
      }
    } catch (error) {
      console.error('Rollback failed:', error);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Change History: {entityName}
            <Badge variant="outline">{entityType}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[calc(90vh-120px)]">
          {/* LEFT SIDEBAR: Timeline */}
          <div className="w-80 border-r bg-muted/30">
            <div className="p-4 border-b">
              <h3 className="font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Version Timeline
              </h3>
            </div>
            
            <ScrollArea className="h-full">
              <div className="p-2">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading history...
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No changes found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map((change, index) => (
                      <div
                        key={change.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedChange?.id === change.id
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedChange(change)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {change.userName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant={
                                  change.changeType === 'CREATE' ? 'default' :
                                  change.changeType === 'UPDATE' ? 'secondary' :
                                  change.changeType === 'DELETE' ? 'destructive' :
                                  'outline'
                                }
                                className="text-xs"
                              >
                                {change.changeType}
                              </Badge>
                              {change.isConflicted && (
                                <Badge variant="destructive" className="text-xs">
                                  CONFLICT
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm font-medium truncate">
                              {change.message || `${change.changeType.toLowerCase()} operation`}
                            </p>
                            
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <User className="w-3 h-3" />
                              <span>{change.userName}</span>
                              <GitBranch className="w-3 h-3 ml-1" />
                              <span>{change.branchName}</span>
                            </div>
                            
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(change.createdAt))} ago
                            </p>
                          </div>
                        </div>
                        
                        {/* Field Changes Summary */}
                        {change.fieldChanges && Object.keys(change.fieldChanges).length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(change.fieldChanges).slice(0, 3).map(([field, _]) => (
                                <Badge key={field} variant="outline" className="text-xs">
                                  {field}
                                </Badge>
                              ))}
                              {Object.keys(change.fieldChanges).length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{Object.keys(change.fieldChanges).length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* RIGHT CONTENT: Diff Viewer */}
          <div className="flex-1 flex flex-col">
            {selectedChange ? (
              <>
                {/* Header with actions */}
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">
                        {selectedChange.message || `${selectedChange.changeType} operation`}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedChange.sha.substring(0, 8)} • {formatDistanceToNow(new Date(selectedChange.createdAt))} ago by {selectedChange.userName}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCompareMode(compareMode === 'current' ? 'previous' : 'current')}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Compare with {compareMode === 'current' ? 'Previous' : 'Current'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRollback(selectedChange)}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Rollback to This
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Diff Content */}
                <div className="flex-1">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                    <TabsList className="mx-4 mt-4">
                      <TabsTrigger value="timeline" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Timeline
                      </TabsTrigger>
                      
                      {/* 🎯 SMART TAB VISIBILITY: Only show code tabs for entities with source code */}
                      {(entityType === 'Rule' || entityType === 'Workflow') && comparisonData?.originalCode && (
                        <TabsTrigger value="code" className="flex items-center gap-2">
                          <Code className="w-4 h-4" />
                          {entityType === 'Rule' ? 'Business Rules' : 'Workflow Code'}
                        </TabsTrigger>
                      )}
                      
                      {(entityType === 'Rule' || entityType === 'Workflow') && comparisonData?.originalPython && (
                        <TabsTrigger value="python" className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Python Code
                        </TabsTrigger>
                      )}
                      
                      <TabsTrigger value="fields" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {entityType === 'Office' ? 'Office Settings' :
                         entityType === 'Process' ? 'Process Details' :
                         entityType === 'Node' ? 'Node Properties' :
                         'Field Changes'}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="timeline" className="flex-1 m-0">
                      <div className="p-4">
                        <div className="text-center text-muted-foreground">
                          Select a version from the timeline to view changes
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="code" className="flex-1 m-0">
                      {comparisonData && (
                        <DiffEditor
                          height="100%"
                          language="business-rules"
                          original={comparisonData.originalCode}
                          modified={comparisonData.modifiedCode}
                          options={{
                            readOnly: true,
                            renderSideBySide: true,
                            ignoreTrimWhitespace: false,
                            renderWhitespace: 'boundary',
                            minimap: { enabled: true },
                            scrollBeyondLastLine: false,
                            fontSize: 14,
                            lineNumbers: 'on',
                            folding: true
                          }}
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="python" className="flex-1 m-0">
                      {comparisonData && (
                        <DiffEditor
                          height="100%"
                          language="python"
                          original={comparisonData.originalPython}
                          modified={comparisonData.modifiedPython}
                          options={{
                            readOnly: true,
                            renderSideBySide: true,
                            ignoreTrimWhitespace: false,
                            renderWhitespace: 'boundary',
                            minimap: { enabled: true },
                            scrollBeyondLastLine: false,
                            fontSize: 14,
                            lineNumbers: 'on',
                            folding: true
                          }}
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="fields" className="flex-1 m-0">
                      <ScrollArea className="h-full">
                        <div className="p-4">
                          {selectedChange.fieldChanges && Object.keys(selectedChange.fieldChanges).length > 0 ? (
                            <div className="space-y-4">
                              {Object.entries(selectedChange.fieldChanges).map(([field, change]) => (
                                <FieldChangeCard 
                                  key={field} 
                                  field={field} 
                                  change={change} 
                                  entityType={entityType}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground py-8">
                              No field changes recorded for this version
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a version from the timeline to view changes
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ChangeHistoryModal;
