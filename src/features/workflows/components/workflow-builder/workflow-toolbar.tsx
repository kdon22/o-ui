/**
 * Workflow Toolbar - Node Palette and Tools
 * 
 * Provides tools for adding nodes, zooming, and other workflow actions.
 * Includes a draggable node palette and common workflow operations.
 */

'use client';

import { 
  Play, 
  Square, 
  Settings, 
  GitBranch, 
  Split, 
  Merge,
  MousePointer, 
  Move3D,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Save,
  Download,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils/generalUtils'
import { nanoid } from 'nanoid/non-secure';
import type { WorkflowNode, WorkflowNodeType, Position } from '../../types/workflow-builder';

interface WorkflowToolbarProps {
  tool: 'select' | 'connect' | 'pan';
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
  readOnly?: boolean;
  onToolChange: (tool: 'select' | 'connect' | 'pan') => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onAddNode: (node: WorkflowNode) => void;
}

export function WorkflowToolbar({
  tool,
  zoom,
  canUndo,
  canRedo,
  readOnly = false,
  onToolChange,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onUndo,
  onRedo,
  onSave,
  onExport,
  onImport,
  onAddNode
}: WorkflowToolbarProps) {

  // ============================================================================
  // NODE CREATION HELPERS
  // ============================================================================

  const createNode = (type: WorkflowNodeType, position?: Position): WorkflowNode => {
    const id = nanoid();
    const defaultPosition = position || { x: 100, y: 100 };

    const baseNode = {
      id,
      position: defaultPosition,
      selected: false,
      dragging: false
    };

    switch (type) {
      case 'start':
        return {
          ...baseNode,
          type: 'start',
          label: 'Start',
          size: { width: 60, height: 60 },
          trigger: { type: 'manual' }
        };

      case 'end':
        return {
          ...baseNode,
          type: 'end',
          label: 'End',
          size: { width: 60, height: 60 },
          action: { type: 'success' }
        };

      case 'process':
        return {
          ...baseNode,
          type: 'process',
          label: 'Process',
          size: { width: 140, height: 80 },
          
        };

      case 'decision':
        return {
          ...baseNode,
          type: 'decision',
          label: 'Decision',
          size: { width: 80, height: 80 },
          condition: {
            type: 'expression',
            value: 'condition'
          },
          branches: { true: '', false: '' }
        };

      case 'parallel':
        return {
          ...baseNode,
          type: 'parallel',
          label: 'Parallel',
          size: { width: 120, height: 80 },
          branches: ['', '']
        };

      case 'merge':
        return {
          ...baseNode,
          type: 'merge',
          label: 'Merge',
          size: { width: 120, height: 80 },
          waitForAll: true
        };

      default:
        throw new Error(`Unknown node type: ${type}`);
    }
  };

  const handleAddNode = (type: WorkflowNodeType) => {
    if (readOnly) return;
    
    const node = createNode(type, { x: 200 + Math.random() * 200, y: 150 + Math.random() * 200 });
    onAddNode(node);
  };

  // ============================================================================
  // NODE PALETTE ITEMS
  // ============================================================================

  const nodeTypes = [
    { type: 'start' as const, icon: Play, label: 'Start', color: 'text-emerald-600' },
    { type: 'end' as const, icon: Square, label: 'End', color: 'text-gray-600' },
    { type: 'process' as const, icon: Settings, label: 'Process', color: 'text-blue-600' },
    { type: 'decision' as const, icon: GitBranch, label: 'Decision', color: 'text-amber-600' },
    { type: 'parallel' as const, icon: Split, label: 'Parallel', color: 'text-violet-600' },
    { type: 'merge' as const, icon: Merge, label: 'Merge', color: 'text-emerald-600' }
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex flex-col gap-4 p-4 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-64">
      
      {/* Tools Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tools</h3>
        <div className="flex gap-1">
          <Button
            variant={tool === 'select' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToolChange('select')}
            disabled={readOnly}
          >
            <MousePointer size={16} />
          </Button>
          <Button
            variant={tool === 'connect' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToolChange('connect')}
            disabled={readOnly}
          >
            <GitBranch size={16} />
          </Button>
          <Button
            variant={tool === 'pan' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToolChange('pan')}
            disabled={readOnly}
          >
            <Move3D size={16} />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Zoom Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Zoom</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onZoomOut}>
            <ZoomOut size={16} />
          </Button>
          <div 
            className="text-xs text-center min-w-[60px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
            onClick={onZoomReset}
          >
            {Math.round(zoom * 100)}%
          </div>
          <Button variant="outline" size="sm" onClick={onZoomIn}>
            <ZoomIn size={16} />
          </Button>
        </div>
      </div>

      <Separator />

      {/* History Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">History</h3>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo || readOnly}
          >
            <RotateCcw size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo || readOnly}
          >
            <RotateCw size={16} />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Actions Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Actions</h3>
        <div className="flex flex-col gap-1">
          <Button variant="outline" size="sm" onClick={onSave} disabled={readOnly}>
            <Save size={16} className="mr-2" />
            Save
          </Button>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download size={16} className="mr-2" />
              Export
            </Button>
          )}
          {onImport && (
            <Button variant="outline" size="sm" onClick={onImport} disabled={readOnly}>
              <Upload size={16} className="mr-2" />
              Import
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Node Palette Section */}
      {!readOnly && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Add Nodes</h3>
          <div className="grid grid-cols-2 gap-2">
            {nodeTypes.map(({ type, icon: Icon, label, color }) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                className={cn(
                  "h-16 flex-col gap-1 hover:bg-gray-50 dark:hover:bg-gray-700",
                  color
                )}
                onClick={() => handleAddNode(type)}
              >
                <Icon size={20} />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-auto">
        <div className="mb-2">
          <strong>Shortcuts:</strong>
        </div>
        <div>V - Select tool</div>
        <div>C - Connect tool</div>
        <div>H - Pan tool</div>
        <div>Del - Delete selected</div>
        <div>Ctrl+Z - Undo</div>
        <div>Ctrl+Y - Redo</div>
      </div>

    </div>
  );
}

