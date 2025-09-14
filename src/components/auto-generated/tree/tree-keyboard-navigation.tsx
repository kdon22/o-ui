import React, { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Keyboard } from 'lucide-react';

export interface KeyboardNavigationProps {
  nodes: any[];
  selectedId: string | null;
  expandedIds: Set<string>;
  onSelect: (id: string) => void;
  onExpand: (id: string) => void;
  onCollapse: (id: string) => void;
  onActivate: (id: string) => void;
  containerRef?: React.RefObject<HTMLElement>;
  disabled?: boolean;
  enableTypeAhead?: boolean;
  enableShortcuts?: boolean;
}

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  action: () => void;
}

const TreeKeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  nodes,
  selectedId,
  expandedIds,
  onSelect,
  onExpand,
  onCollapse,
  onActivate,
  containerRef,
  disabled = false,
  enableTypeAhead = true,
  enableShortcuts = true,
}) => {
  const [typeAheadQuery, setTypeAheadQuery] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [matchingNodes, setMatchingNodes] = useState<any[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const typeAheadTimeoutRef = useRef<NodeJS.Timeout>();
  const lastKeyTimeRef = useRef<number>(0);

  // Flatten nodes for navigation
  const flattenNodes = useCallback((nodeList: any[], level = 0): any[] => {
    const flattened: any[] = [];
    
    nodeList.forEach(node => {
      flattened.push({ ...node, level });
      
      if (expandedIds.has(node.id) && node.children?.length > 0) {
        flattened.push(...flattenNodes(node.children, level + 1));
      }
    });
    
    return flattened;
  }, [expandedIds]);

  const flatNodes = flattenNodes(nodes);

  // Find node index in flattened list
  const findNodeIndex = useCallback((nodeId: string) => {
    return flatNodes.findIndex(node => node.id === nodeId);
  }, [flatNodes]);

  // Type-ahead search
  const handleTypeAhead = useCallback((query: string) => {
    if (!enableTypeAhead) return;

    const matches = flatNodes.filter(node => 
      node.name.toLowerCase().includes(query.toLowerCase()) ||
      node.description?.toLowerCase().includes(query.toLowerCase())
    );

    setMatchingNodes(matches);
    setCurrentMatchIndex(0);

    if (matches.length > 0) {
      onSelect(matches[0].id);
      
      // Scroll to node if container ref is available
      if (containerRef?.current) {
        const nodeElement = containerRef.current.querySelector(`[data-node-id="${matches[0].id}"]`);
        nodeElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [flatNodes, onSelect, containerRef, enableTypeAhead]);

  // Clear type-ahead
  const clearTypeAhead = useCallback(() => {
    setTypeAheadQuery('');
    setMatchingNodes([]);
    setCurrentMatchIndex(0);
  }, []);

  // Navigate to next/previous match
  const navigateMatch = useCallback((direction: 'next' | 'prev') => {
    if (matchingNodes.length === 0) return;

    const newIndex = direction === 'next' 
      ? (currentMatchIndex + 1) % matchingNodes.length
      : (currentMatchIndex - 1 + matchingNodes.length) % matchingNodes.length;

    setCurrentMatchIndex(newIndex);
    onSelect(matchingNodes[newIndex].id);

    // Scroll to node
    if (containerRef?.current) {
      const nodeElement = containerRef.current.querySelector(`[data-node-id="${matchingNodes[newIndex].id}"]`);
      nodeElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [matchingNodes, currentMatchIndex, onSelect, containerRef]);

  // Keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'ArrowUp',
      description: 'Navigate up',
      action: () => {
        const currentIndex = selectedId ? findNodeIndex(selectedId) : 0;
        const newIndex = Math.max(0, currentIndex - 1);
        if (flatNodes[newIndex]) {
          onSelect(flatNodes[newIndex].id);
        }
      }
    },
    {
      key: 'ArrowDown',
      description: 'Navigate down',
      action: () => {
        const currentIndex = selectedId ? findNodeIndex(selectedId) : -1;
        const newIndex = Math.min(flatNodes.length - 1, currentIndex + 1);
        if (flatNodes[newIndex]) {
          onSelect(flatNodes[newIndex].id);
        }
      }
    },
    {
      key: 'ArrowRight',
      description: 'Expand node',
      action: () => {
        if (selectedId) {
          const node = flatNodes.find(n => n.id === selectedId);
          if (node?.children?.length > 0 && !expandedIds.has(selectedId)) {
            onExpand(selectedId);
          }
        }
      }
    },
    {
      key: 'ArrowLeft',
      description: 'Collapse node',
      action: () => {
        if (selectedId) {
          if (expandedIds.has(selectedId)) {
            onCollapse(selectedId);
          } else {
            // Navigate to parent
            const currentIndex = findNodeIndex(selectedId);
            const currentNode = flatNodes[currentIndex];
            if (currentNode?.level > 0) {
              // Find parent node
              for (let i = currentIndex - 1; i >= 0; i--) {
                if (flatNodes[i].level < currentNode.level) {
                  onSelect(flatNodes[i].id);
                  break;
                }
              }
            }
          }
        }
      }
    },
    {
      key: 'Enter',
      description: 'Activate node',
      action: () => {
        if (selectedId) {
          onActivate(selectedId);
        }
      }
    },
    {
      key: ' ',
      description: 'Toggle expand/collapse',
      action: () => {
        if (selectedId) {
          const node = flatNodes.find(n => n.id === selectedId);
          if (node?.children?.length > 0) {
            if (expandedIds.has(selectedId)) {
              onCollapse(selectedId);
            } else {
              onExpand(selectedId);
            }
          }
        }
      }
    },
    {
      key: 'Home',
      description: 'Go to first node',
      action: () => {
        if (flatNodes.length > 0) {
          onSelect(flatNodes[0].id);
        }
      }
    },
    {
      key: 'End',
      description: 'Go to last node',
      action: () => {
        if (flatNodes.length > 0) {
          onSelect(flatNodes[flatNodes.length - 1].id);
        }
      }
    },
    {
      key: 'f',
      ctrlKey: true,
      description: 'Search nodes',
      action: () => {
        // Focus on search input or show search UI
        const searchInput = document.querySelector('[data-tree-search]') as HTMLInputElement;
        searchInput?.focus();
      }
    },
    {
      key: 'a',
      ctrlKey: true,
      description: 'Expand all',
      action: () => {
        flatNodes.forEach(node => {
          if (node.children?.length > 0) {
            onExpand(node.id);
          }
        });
      }
    },
    {
      key: 'a',
      ctrlKey: true,
      shiftKey: true,
      description: 'Collapse all',
      action: () => {
        flatNodes.forEach(node => {
          if (expandedIds.has(node.id)) {
            onCollapse(node.id);
          }
        });
      }
    },
    {
      key: 'n',
      ctrlKey: true,
      description: 'Next search result',
      action: () => navigateMatch('next')
    },
    {
      key: 'n',
      ctrlKey: true,
      shiftKey: true,
      description: 'Previous search result',
      action: () => navigateMatch('prev')
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => setShowShortcuts(!showShortcuts)
    }
  ];

  // Handle keyboard events
  const handleKeyDown = useCallback((event: Event) => {
    if (disabled) return;

    const keyEvent = event as KeyboardEvent;
    const now = Date.now();
    const timeSinceLastKey = now - lastKeyTimeRef.current;
    lastKeyTimeRef.current = now;

    // Handle type-ahead for printable characters
    // BUT only if not focused on an input/editor to avoid interfering with typing
    const activeElement = document.activeElement;
    const isEditorFocused = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.classList.contains('monaco-editor') ||
      activeElement.closest('.monaco-editor') ||
      (activeElement as HTMLElement).contentEditable === 'true'
    );
    
    if (enableTypeAhead && !isEditorFocused && keyEvent.key.length === 1 && !keyEvent.ctrlKey && !keyEvent.altKey && !keyEvent.metaKey) {
      if (timeSinceLastKey > 1000) {
        // Reset query if more than 1 second has passed
        setTypeAheadQuery(keyEvent.key);
      } else {
        // Append to existing query
        setTypeAheadQuery(prev => prev + keyEvent.key);
      }

      // Clear timeout and set new one
      if (typeAheadTimeoutRef.current) {
        clearTimeout(typeAheadTimeoutRef.current);
      }
      
      typeAheadTimeoutRef.current = setTimeout(() => {
        clearTypeAhead();
      }, 1000);

      handleTypeAhead(typeAheadQuery + keyEvent.key);
      keyEvent.preventDefault();
      return;
    }

    // Handle keyboard shortcuts
    if (enableShortcuts) {
      const shortcut = shortcuts.find(s => {
        const keyMatches = s.key === keyEvent.key;
        const ctrlMatches = !!s.ctrlKey === (keyEvent.ctrlKey || keyEvent.metaKey);
        const shiftMatches = !!s.shiftKey === keyEvent.shiftKey;
        const altMatches = !!s.altKey === keyEvent.altKey;
        
        return keyMatches && ctrlMatches && shiftMatches && altMatches;
      });

      if (shortcut) {
        keyEvent.preventDefault();
        shortcut.action();
      }
    }

    // Handle Escape key
    if (keyEvent.key === 'Escape') {
      clearTypeAhead();
      setShowShortcuts(false);
    }
  }, [disabled, enableTypeAhead, enableShortcuts, typeAheadQuery, shortcuts, handleTypeAhead, clearTypeAhead]);

  // Attach keyboard event listeners
  useEffect(() => {
    const target = containerRef?.current || document;
    target.addEventListener('keydown', handleKeyDown);
    
    return () => {
      target.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, containerRef]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (typeAheadTimeoutRef.current) {
        clearTimeout(typeAheadTimeoutRef.current);
      }
    };
  }, []);

  // Scroll selected node into view
  useEffect(() => {
    if (selectedId && containerRef?.current) {
      const nodeElement = containerRef.current.querySelector(`[data-node-id="${selectedId}"]`);
      if (nodeElement) {
        nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedId, containerRef]);

  return (
    <>
      {/* Type-ahead indicator */}
      <AnimatePresence>
        {typeAheadQuery && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-4 right-4 bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span className="text-sm">
              Searching: <strong>{typeAheadQuery}</strong>
            </span>
            {matchingNodes.length > 0 && (
              <span className="text-xs opacity-75">
                {currentMatchIndex + 1} of {matchingNodes.length}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard shortcuts modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background border rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4">
                <Keyboard className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
              </div>
              
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/50"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.ctrlKey && (
                        <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl</kbd>
                      )}
                      {shortcut.shiftKey && (
                        <kbd className="px-2 py-1 text-xs bg-muted rounded">Shift</kbd>
                      )}
                      {shortcut.altKey && (
                        <kbd className="px-2 py-1 text-xs bg-muted rounded">Alt</kbd>
                      )}
                      <kbd className="px-2 py-1 text-xs bg-muted rounded">
                        {shortcut.key === ' ' ? 'Space' : shortcut.key}
                      </kbd>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Press <kbd className="px-2 py-1 text-xs bg-muted rounded">Escape</kbd> to close
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TreeKeyboardNavigation; 