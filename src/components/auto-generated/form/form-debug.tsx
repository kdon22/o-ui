'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/generalUtils';

interface FormDebugProps {
  schema: any;
  formValues: Record<string, any>;
  errors: Record<string, any>;
  isValid: boolean;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
  onSubmit?: (...args: any[]) => any;
}

export const FormDebugComponent: React.FC<FormDebugProps> = ({
  schema,
  formValues,
  errors,
  isValid,
  isSubmitting,
  mode,
  onSubmit
}) => {
  const { data: session } = useSession();

  const tenantId = session?.user?.tenantId;
  const branchId = session?.user?.branchContext?.currentBranchId;

  const getStatusIcon = (condition: boolean, loading?: boolean) => {
    if (loading) return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
    return condition ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const requiredFields = schema?.fields?.filter((f: any) => f.required && f.form?.showInForm !== false) || [];
  const missingRequiredFields = requiredFields.filter((f: any) => !formValues[f.key] && f.key !== 'id');

  // 🔥 NEW: Enhanced ID tracking debug
  const idDebugInfo = useMemo(() => {
    const idField = schema.fields?.find((f: any) => f.key === 'id');
    const hasAutoValueId = idField?.autoValue?.source === 'auto.uuid';
    const currentId = formValues?.id;
    
    return {
      hasIdField: !!idField,
      hasAutoValueId,
      autoValueSource: idField?.autoValue?.source,
      currentFormId: currentId,
      idType: typeof currentId,
      idLength: currentId ? String(currentId).length : null,
      isOptimisticId: currentId && String(currentId).startsWith('optimistic-'),
      isUUID: currentId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentId),
      timestamp: new Date().toISOString()
    };
  }, [schema, formValues?.id]);

  // 🔥 NEW: Track submission flow
  const [submissionDebug, setSubmissionDebug] = useState<any[]>([]);
  
  useEffect(() => {
    if (isSubmitting) {
      setSubmissionDebug(prev => [...prev, {
        event: 'submission-started',
        mode,
        formId: formValues?.id,
        timestamp: new Date().toISOString()
      }]);
    }
  }, [isSubmitting, mode, formValues?.id]);

  return (
    <Card className="mt-4 border-dashed border-orange-300 bg-orange-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          Form Debug Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        {/* Session Context */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            {getStatusIcon(!!session)}
            Session Context
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Tenant ID:</span>
              <Badge variant={tenantId ? "default" : "secondary"} className={cn("ml-1 text-xs", !tenantId && "bg-red-100 text-red-700")}>
                {tenantId || 'Missing'}
              </Badge>
            </div>
            <div>
              <span className="text-gray-500">Branch ID:</span>
              <Badge variant={branchId ? "default" : "secondary"} className={cn("ml-1 text-xs", !branchId && "bg-red-100 text-red-700")}>
                {branchId || 'Missing'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Form State */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            {getStatusIcon(isValid, isSubmitting)}
            Form State
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-500">Mode:</span>
              <Badge variant="outline" className="ml-1 text-xs">{mode}</Badge>
            </div>
            <div>
              <span className="text-gray-500">Valid:</span>
              <Badge variant={isValid ? "default" : "secondary"} className={cn("ml-1 text-xs", !isValid && "bg-red-100 text-red-700")}>
                {isValid ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <span className="text-gray-500">Submitting:</span>
              <Badge variant={isSubmitting ? "default" : "outline"} className="ml-1 text-xs">
                {isSubmitting ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <span className="text-gray-500">Has onSubmit:</span>
              <Badge variant={onSubmit ? "default" : "secondary"} className={cn("ml-1 text-xs", !onSubmit && "bg-red-100 text-red-700")}>
                {onSubmit ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Schema Info */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            {getStatusIcon(!!schema?.actionPrefix)}
            Schema Info
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-500">Action Prefix:</span>
              <Badge variant="outline" className="ml-1 text-xs">
                {schema?.actionPrefix || 'Missing'}
              </Badge>
            </div>
            <div>
              <span className="text-gray-500">Fields Count:</span>
              <Badge variant="outline" className="ml-1 text-xs">
                {schema?.fields?.length || 0}
              </Badge>
            </div>
          </div>
        </div>

        {/* Required Fields Status */}
        {requiredFields.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              {getStatusIcon(missingRequiredFields.length === 0)}
              Required Fields ({missingRequiredFields.length}/{requiredFields.length} missing)
            </h4>
            <div className="flex flex-wrap gap-1">
              {requiredFields.map((field: any) => {
                const hasValue = !!formValues[field.key];
                return (
                                     <Badge 
                     key={field.key}
                     variant={hasValue ? "default" : "secondary"} 
                     className={cn("text-xs", !hasValue && "bg-red-100 text-red-700")}
                   >
                     {field.key}
                   </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Errors */}
        {Object.keys(errors).length > 0 && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              Validation Errors ({Object.keys(errors).length})
            </h4>
            <div className="space-y-1">
              {Object.entries(errors).map(([field, error]: [string, any]) => (
                <div key={field} className="text-red-600 text-xs">
                  <span className="font-medium">{field}:</span> {error?.message || 'Unknown error'}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Values Preview */}
        <div>
          <h4 className="font-medium mb-2">Form Values</h4>
          <div className="bg-gray-100 p-2 rounded text-xs max-h-32 overflow-y-auto">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(formValues, null, 2)}
            </pre>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h4 className="font-medium mb-2">Debug Actions</h4>
          <div className="flex gap-2">
            <button
              onClick={() => {
                console.log('🔍 [Debug] Full form state:', {
                  schema,
                  formValues,
                  errors,
                  isValid,
                  isSubmitting,
                  mode,
                  session,
                  tenantId,
                  branchId,
                  timestamp: new Date().toISOString()
                });
              }}
              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
            >
              Log State
            </button>
            <button
              onClick={() => {
                if (onSubmit) {
                  // Testing onSubmit call with current values
                  onSubmit(formValues);
                } else {
                  // No onSubmit handler provided
                }
              }}
              className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
              disabled={!onSubmit}
            >
              Test Submit
            </button>
          </div>
        </div>

        {/* 🔥 NEW: ID Tracking Debug Section */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">🆔 ID Tracking Debug</h4>
          <div className="text-xs space-y-1 font-mono">
            <div><strong>ID Field Config:</strong> {JSON.stringify(idDebugInfo, null, 2)}</div>
            <div><strong>Expected Behavior:</strong> {
              idDebugInfo.hasAutoValueId 
                ? "Server generates ID → optimistic record should be replaced" 
                : "Client generates ID → should use same ID for IndexedDB"
            }</div>
          </div>
        </div>

        {/* 🔥 NEW: Submission Flow Debug */}
        {submissionDebug.length > 0 && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-medium text-purple-800 mb-2">🔄 Submission Flow Debug</h4>
            <div className="text-xs space-y-1 font-mono max-h-32 overflow-y-auto">
              {submissionDebug.map((debug, index) => (
                <div key={index}>
                  <strong>{debug.timestamp}:</strong> {debug.event} - ID: {debug.formId}
                </div>
              ))}
            </div>
            <button 
              onClick={() => setSubmissionDebug([])}
              className="mt-2 text-xs text-purple-600 hover:underline"
            >
              Clear Debug
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};