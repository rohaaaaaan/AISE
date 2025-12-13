'use client';

import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import {
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  ReactFlowProvider,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
  MiniMap,
  Controls,
  Background,
  Panel,
  reconnectEdge,
} from '@xyflow/react';
import { ScriptInputModal } from '@/components/modals/ScriptInputModal';
import { toPng, toSvg } from 'html-to-image';
import Canvas from '@/components/Canvas';
import { ChatPanel } from '@/components/panels/ChatPanel';
import { TopBar } from '@/components/ui/TopBar';
import { PropertiesPanel } from '@/components/panels/PropertiesPanel';
import { ContextMenu, ContextMenuItem } from '@/components/ui/ContextMenu';
import { SearchBar } from '@/components/ui/SearchBar';
import { ModelBrowser } from '@/components/panels/ModelBrowser';
import { Legend } from '@/components/panels/Legend';
import { SimulationPanel } from '@/components/panels/SimulationPanel';
import { ActivitySimulationPanel } from '@/components/panels/ActivitySimulationPanel';
import { isValidSysMLConnection } from '@/config/sysml-connectors';
import { generateSysMLId } from '@/utils/idGenerator';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import styles from './page.module.css';

import { useModel } from '@/context/ModelContext';
import { validateModel } from '@/utils/sysmlValidator';
import { ProjectListModal } from '@/components/modals/ProjectListModal';
import { API_BASE_URL } from '@/config/api';

export default function Home() {
  const { nodes, setNodes, onNodesChange, edges, setEdges, onEdgesChange, addConnection } = useModel();
  const [connectionType, setConnectionType] = useState('default');
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [clipboard, setClipboard] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'node' | 'edge' | 'canvas'; target?: any } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Project Management
  const [projectName, setProjectName] = useState('Untitled Model');
  const [projectId, setProjectId] = useState<string>(() => `project_${Date.now()}`);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);

  const [matchCount, setMatchCount] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Drill-Down View State
  // null = Root View (Top Level)
  // string = ID of the Block we are viewing (IBD)
  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  // UI State
  const [showLegend, setShowLegend] = useState(false);
  const [showProperties, setShowProperties] = useState(true);
  const [showSimulation, setShowSimulation] = useState(false);
  const [showActivitySimulation, setShowActivitySimulation] = useState(false);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(new Set());

  // Undo/Redo functionality
  const { canUndo, canRedo, undo, redo, takeSnapshot } = useUndoRedo(nodes, edges, setNodes, setEdges);

  // Callback for simulation to highlight nodes
  const handleNodeHighlight = useCallback((nodeId: string, isActive: boolean) => {
    setHighlightedNodeIds(prev => {
      const newSet = new Set(prev);
      if (isActive) {
        newSet.add(nodeId);
      } else {
        newSet.delete(nodeId);
      }
      return newSet;
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Undo: Ctrl+Z
      if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((event.ctrlKey && event.key === 'y') || (event.ctrlKey && event.shiftKey && event.key === 'Z')) {
        event.preventDefault();
        redo();
        return;
      }

      // Escape: Deselect all
      if (event.key === 'Escape') {
        setNodes(nds => nds.map(n => ({ ...n, selected: false })));
        setEdges(eds => eds.map(e => ({ ...e, selected: false })));
        setContextMenu(null);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setNodes, setEdges]);

  // Handle TextBox inline editing updates
  useEffect(() => {
    const handleTextBoxUpdate = (event: CustomEvent<{ nodeId: string; text: string }>) => {
      const { nodeId, text } = event.detail;
      setNodes(nds => nds.map(n => {
        if (n.id === nodeId) {
          return { ...n, data: { ...n.data, text } };
        }
        return n;
      }));
    };

    window.addEventListener('textBoxUpdate', handleTextBoxUpdate as EventListener);
    return () => window.removeEventListener('textBoxUpdate', handleTextBoxUpdate as EventListener);
  }, [setNodes]);

  // Filter nodes for display
  const displayNodes = useMemo(() => {
    if (activeViewId !== null) {
      const frameNodeOriginal = nodes.find(n => n.id === activeViewId);
      if (frameNodeOriginal) {
        // 1. Create the Frame Node (As an Invisible Container / Infinite Canvas)
        const frameNode: Node = {
          ...frameNodeOriginal,
          id: activeViewId, // Keep ID for parenting
          type: 'frame',
          style: {
            width: 4000, height: 4000, // Huge canvas
            backgroundColor: 'transparent',
            boxShadow: 'none',
            border: 'none',
            pointerEvents: 'none'
          },
          position: { x: -500, y: -500 }, // Center-ish relative to view
          draggable: false,
          selectable: false,
          data: {
            ...frameNodeOriginal.data,
            label: '', // Hide label
            isIBDFrame: true,
          },
          parentId: undefined,
          extent: undefined,
          zIndex: -10
        };

        const children = nodes.filter(n => n.parentId === activeViewId);



        // Identify "Simulink Ports" (Parent Ports acting as Sources/Sinks)
        // ONLY show them if they have been "pulled" (i.e. have a position on this canvas)
        // We store this position in data.ibdPosition

        const framePorts: Node[] = [];

        children.forEach(n => {
          if (n.type === 'sysmlPort') {
            // Check if it has a position assigned for the IBD view
            const ibdPos = n.data.ibdPosition as { x: number, y: number } | undefined;

            if (ibdPos) {
              framePorts.push({
                ...n,
                // Use the new "Simulink-style" pill node
                type: 'simulinkPort',
                position: ibdPos, // Use the IBD position
                style: { width: 'auto', height: 'auto' },
                data: {
                  ...n.data,
                  isGhost: true,
                  isSimulinkPort: true,
                  side: 'Bottom'
                },
                draggable: true,
                selectable: true,
                parentId: activeViewId,
                extent: undefined // Allow free movement on infinite canvas
              });
            }
          }
        });

        const internalParts = children.filter(n => n.type !== 'sysmlPort');

        // Also find grandchildren (e.g. ports on the parts inside the IBD)
        const childIds = new Set(children.map(c => c.id));
        const grandchildren = nodes.filter(n => n.parentId && childIds.has(n.parentId));

        // Return Frame + Simulink Ports + Internal Parts + Grandchildren
        return [frameNode, ...framePorts, ...internalParts, ...grandchildren];
      }
      return []; // If activeViewId is set but node not found, display nothing
    }

    // Root View Logic (activeViewId === null)
    return nodes
      .reduce((acc: Node[], node) => {
        // Rule: Show if it has no parent (Top-level Node)
        if (!node.parentId) {
          acc.push(node);
          return acc;
        }

        // Find parent
        const parent = nodes.find(n => n.id === node.parentId);

        // Visual Containers that allow displaying children even at root level
        const visualContainers = [
          'diagramFrame',
          'sysmlSystemBoundary',
          'sysmlSwimlane',
          'sysmlInterruptibleRegion'
        ];

        // Check if parent is a visual container (System Boundary, Swimlane, etc.)
        const isVisualContainer = parent && visualContainers.includes(parent.type || '');
        const isFrameParent = parent && parent.type === 'diagramFrame';

        // Rule: Show if parent is a Visual Container
        if (parent && (isVisualContainer || isFrameParent)) {
          // FORCE extent: undefined for display to allow free movement
          // This overrides any 'parent' extent that might be set in the node execution
          acc.push({
            ...node,
            extent: undefined
          });
          return acc;
        }

        // Rule: ALSO show if it is a Port attached to a Top-level Node
        if (node.type === 'sysmlPort') {
          if (parent && !parent.parentId) {
            acc.push(node);
          }
        }
        return acc;
      }, [])
      .map(node => {
        // Inject simulation highlight state into node data
        const isSimulationActive = highlightedNodeIds.has(node.id);
        return {
          ...node,
          data: {
            ...node.data,
            isSimulationActive,
          }
        };
      });
  }, [nodes, activeViewId, highlightedNodeIds]);

  // Filter edges for display
  const displayEdges = useMemo(() => {
    const displayedNodeIds = new Set(displayNodes.map(n => n.id));
    return edges.filter(edge => {
      // Show edge if BOTH source and target are visible
      return displayedNodeIds.has(edge.source) && displayedNodeIds.has(edge.target);
    });
  }, [edges, displayNodes]);

  // Derive selected node from nodes state to ensure it's always fresh
  const selectedNode = nodes.find((n) => n.selected) || null;
  const selectedEdge = edges.find((e) => e.selected) || null;
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const handleEdgeChange = useCallback((edgeId: string, updates: any) => {
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id === edgeId) {
          return { ...e, ...updates };
        }
        return e;
      })
    );
  }, [setEdges]);

  const handleNodeChange = useCallback((nodeId: string, updates: any) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          return { ...n, ...updates };
        }
        return n;
      })
    );
  }, [setNodes]);

  const handleNextMatch = useCallback(() => {
    if (matchCount === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matchCount);
  }, [matchCount]);

  const handlePreviousMatch = useCallback(() => {
    if (matchCount === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matchCount) % matchCount);
  }, [matchCount]);

  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        id: generateSysMLId('connector'),
        type: 'sysml', // Force usage of universal SysMLEdge
        data: { connectorType: connectionType }
      };
      setEdges((eds) => addEdge(edge as Edge, eds));
    },
    [setEdges, connectionType],
  );

  // React Flow handles parent-child movement natively when parentId is set
  // We use the default onNodesChange handler
  const handleNodesChange = onNodesChange;

  // AUTO-PARENTING: Periodically check if nodes are inside DiagramFrames
  // This ensures that even if AI generates nodes without parentId (or user moves them in),
  // they get attached to the frame based on geometry.
  useEffect(() => {
    // Debounce this check to avoid performance impact
    const timer = setTimeout(() => {
      let hasChanges = false;
      const frames = nodes.filter(n => n.type === 'diagramFrame');

      if (frames.length === 0) return;

      const updatedNodes = nodes.map(n => {
        // Skip frames themselves and connectors
        if (n.type === 'diagramFrame' || n.type === 'sysml') return n;

        // If node already has a parent that is a frame, just ensure extent
        if (n.parentId) {
          const currentParent = nodes.find(p => p.id === n.parentId);
          if (currentParent?.type === 'diagramFrame') {
            if (n.extent !== 'parent' || n.zIndex !== 10) {
              hasChanges = true;
              return { ...n, extent: 'parent' as const, zIndex: 10 };
            }
          }
          return n;
        }

        // If no parent, check geometry against all frames
        for (const frame of frames) {
          // Simple AABB check
          const fx = frame.position.x;
          const fy = frame.position.y;
          const fw = (frame.measured?.width || (frame.data.width as number) || 800);
          const fh = (frame.measured?.height || (frame.data.height as number) || 600);

          const nx = n.position.x;
          const ny = n.position.y;

          // If node is strictly inside frame
          if (nx > fx && nx < fx + fw && ny > fy && ny < fy + fh) {
            hasChanges = true;
            return {
              ...n,
              parentId: frame.id,
              extent: 'parent' as const, // Align with "Port" behavior (move with parent)
              zIndex: 10,
              position: {
                x: nx - fx,
                y: ny - fy
              }
            };
          }
        }
        return n;
      });

      if (hasChanges) {
        setNodes(updatedNodes);
      }
    }, 1000); // Check every second (or on render, debounced)

    return () => clearTimeout(timer);
  }, [nodes, setNodes]); // Re-run when nodes change

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) return false;

      const sourceType = sourceNode.type;
      const targetType = targetNode.type;

      return isValidSysMLConnection(sourceType, targetType, connectionType);
    },
    [nodes, connectionType]
  );

  const handleGenerate = (data: any) => {
    // Take snapshot before making changes for undo support
    takeSnapshot();

    if (data.nodes) {
      // Sanitize nodes to ensure they aren't trapped in parents
      const sanitizedNodes = data.nodes.map((node: Node) => ({
        ...node,
        extent: undefined, // Allow moving children outside parents
        // If it's a child, give it a higher z-index so it pops out
        // Ensure z-index is explicit and higher than default 0
        zIndex: node.parentId ? 10 : 0
      }));
      setNodes(sanitizedNodes);
    }
    if (data.edges) setEdges(data.edges);
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Helper to get absolute position of a node (traversing parent chain)
  const getAbsolutePosition = useCallback((node: Node, allNodes: Node[]) => {
    let x = node.position.x;
    let y = node.position.y;
    let currentParentId = node.parentId;

    while (currentParentId) {
      const parent = allNodes.find((n) => n.id === currentParentId);
      if (parent) {
        x += parent.position.x;
        y += parent.position.y;
        currentParentId = parent.parentId;
      } else {
        break;
      }
    }
    return { x, y };
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      // Take snapshot before making changes for undo support
      takeSnapshot();

      // Check for Boundary Port Drop (Pulling into IBD)
      const boundaryPortId = event.dataTransfer.getData('application/sysml-boundary-port');
      if (boundaryPortId && activeViewId) {
        // Calculate drop position in the "infinite canvas"
        const absolutePosition = reactFlowInstance ? reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY }) : {
          x: event.clientX - 300,
          y: event.clientY - 100
        };

        // Adjust for Frame Offset (-500, -500)
        const position = {
          x: absolutePosition.x - (-500),
          y: absolutePosition.y - (-500)
        };

        // Update the SPECIFIC port node to have an ibdPosition
        setNodes(nds => nds.map(n => {
          if (n.id === boundaryPortId) {
            return {
              ...n,
              data: {
                ...n.data,
                ibdPosition: position
              }
            };
          }
          return n;
        }));
        return;
      }

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }

      // Project coordinates
      const absolutePosition = reactFlowInstance ? reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY }) : {
        x: event.clientX - 300,
        y: event.clientY - 100
      };

      let position = absolutePosition;

      // In IBD View, we must make the position relative to the Frame (Parent)
      // The FrameNode is hardcoded to { x: -500, y: -500 } in displayNodes.
      if (activeViewId) {
        position = {
          x: absolutePosition.x - (-500),
          y: absolutePosition.y - (-500)
        };
      }

      // Default label mapping for human-readable node names
      const defaultLabels: Record<string, string> = {
        sysmlBlock: 'Block',
        sysmlPart: 'Part',
        sysmlPort: '',
        sysmlRequirement: 'Requirement',
        sysmlActor: 'Actor',
        sysmlUseCase: 'Use Case',
        sysmlSystemBoundary: 'System',
        sysmlConstraintBlock: 'Constraint',
        // Activity Diagram nodes
        sysmlAction: 'Action',
        sysmlDecision: '',
        sysmlForkJoin: '',
        sysmlInitial: '',
        sysmlFinal: '',
        sysmlSwimlane: 'Swimlane',
        sysmlSignal: 'Signal',
        sysmlInterruptibleRegion: 'Interruptible',
        // Diagram Frame
        diagramFrame: 'New Diagram',
        ecu: 'ECU',
        sensor: 'Sensor',
        actuator: 'Actuator',
        gateway: 'Gateway',
        default: 'Component',
      };

      // Calculate node style based on type
      let nodeStyle: React.CSSProperties = { width: 120, height: 80 };
      if (type === 'default') {
        nodeStyle = { width: 200, height: 100 };
      } else if (type === 'sysmlPort') {
        nodeStyle = { width: 20, height: 20 };
      } else if (type === 'diagramFrame') {
        nodeStyle = { width: 600, height: 400, pointerEvents: 'none' };
      }

      const newNode: Node = {
        id: generateSysMLId(type),
        type,
        position,
        data: {
          label: defaultLabels[type] || type,
          // Add default data for diagram frame
          ...(type === 'diagramFrame' ? {
            diagramType: 'bdd',
            elementType: 'Package',
            elementName: 'Model',
            diagramName: 'New Diagram'
          } : {})
        },
        style: nodeStyle,
      };

      // DRILL-DOWN PARENTING LOGIC
      // If we are in a specific view, automatically parent to that block
      if (activeViewId) {
        newNode.parentId = activeViewId;
        // In IBD, we use infinite canvas, so we don't constrain extent
        newNode.extent = undefined;
      } else {
        // Root logic handles parenting below...
      }

      // Standard flow continues below (for root view parenting) but we intercept above for IBD if activeViewId is set?
      // Actually standard logic finds candidates.
      // If activeViewId is set, we FORCE parentId.

      if (activeViewId) {
        setNodes((nds) => nds.concat(newNode));
        return;
      }
      // Standard Intersection Logic (Root View)
      // Handle Parenting (Ports and Nested Blocks)
      const allowedParentTypes = ['sysmlBlock', 'ecu', 'sensor', 'actuator', 'gateway'];

      // Find all potential parents that intersect with the drop position
      const candidates = nodes.filter(n => {
        if (!allowedParentTypes.includes(n.type || '')) return false;

        const { x: absX, y: absY } = getAbsolutePosition(n, nodes);
        const width = n.measured?.width || 150;
        const height = n.measured?.height || 100;

        return (
          position.x >= absX &&
          position.x <= absX + width &&
          position.y >= absY &&
          position.y <= absY + height
        );
      });

      // Sort candidates by area (smallest first) to find the most specific parent
      candidates.sort((a, b) => {
        const areaA = (a.measured?.width || 150) * (a.measured?.height || 100);
        const areaB = (b.measured?.width || 150) * (b.measured?.height || 100);
        return areaA - areaB;
      });

      const parentBlock = candidates[0];

      if (parentBlock) {
        // If it's a port, only attach to SysML Blocks
        if (type === 'sysmlPort' && parentBlock.type !== 'sysmlBlock') {
          // Skip if trying to attach port to non-SysML block
        } else {
          newNode.parentId = parentBlock.id;

          // Visual Containers should not be constrained by parent extent (Frame)
          const isVisualContainer = ['sysmlSystemBoundary', 'sysmlSwimlane', 'sysmlInterruptibleRegion'].includes(type);
          newNode.extent = isVisualContainer ? undefined : 'parent';

          // Explicit Z-Index for child
          newNode.zIndex = 10;

          const { x: parentAbsX, y: parentAbsY } = getAbsolutePosition(parentBlock, nodes);

          newNode.position = {
            x: position.x - parentAbsX,
            y: position.y - parentAbsY
          };
        }
      }


      setNodes((nds) => nds.concat(newNode));
    },
    [nodes, setNodes, reactFlowInstance, getAbsolutePosition, activeViewId]
  );

  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Handle IBD Boundary Port Position Update
      if (activeViewId && node.parentId === activeViewId && (node.type === 'sysmlPort' || node.type === 'simulinkPort')) {
        // Save the current position as the ibdPosition
        // The node.position here comes from React Flow and is relative to the parent (which is the View Frame)
        // Since we set extent to undefined (infinite), this x/y is in the canvas coordinate space, which is what we want.
        setNodes((nds) => nds.map((n) => {
          if (n.id === node.id) {
            return { ...n, data: { ...n.data, ibdPosition: node.position } };
          }
          return n;
        }));
        return;
      }

      // Only handle reparenting for specific node types
      const allowedTypes = ['sysmlBlock', 'ecu', 'sensor', 'actuator', 'gateway', 'sysmlPort', 'sysmlPart', 'sysmlRequirement', 'sysmlAction'];
      if (!allowedTypes.includes(node.type || '')) return;

      // Skip reparenting for diagramFrame nodes themselves
      if (node.type === 'diagramFrame') return;

      // 1. Calculate Absolute Position of the Dragged Node
      // We need the latest 'nodes' state to traverse parents.
      // 'node' passed to callback has the updated position (relative if parented, absolute if not)

      const { x: nodeAbsX, y: nodeAbsY } = getAbsolutePosition(node, nodes);
      const nodeCenterX = nodeAbsX + (node.measured?.width || 0) / 2;
      const nodeCenterY = nodeAbsY + (node.measured?.height || 0) / 2;

      // 2. Find Candidates (Potential Parents) - DiagramFrame is excluded (visual only)
      const allowedParentTypes = ['sysmlBlock', 'ecu', 'sensor', 'actuator', 'gateway'];

      const candidates = nodes.filter(n => {
        if (n.id === node.id) return false; // Cannot parent to self
        if (!allowedParentTypes.includes(n.type || '')) return false;

        // Prevent cycles: check if n is a descendant of node
        let p = n.parentId;
        while (p) {
          if (p === node.id) return false;
          const parent = nodes.find(x => x.id === p);
          p = parent?.parentId;
        }

        const { x: absX, y: absY } = getAbsolutePosition(n, nodes);
        const width = n.measured?.width || 150;
        const height = n.measured?.height || 100;

        return (
          nodeCenterX >= absX &&
          nodeCenterX <= absX + width &&
          nodeCenterY >= absY &&
          nodeCenterY <= absY + height
        );
      });

      // Sort candidates by area (smallest first) to find the most specific parent
      candidates.sort((a, b) => {
        const areaA = (a.measured?.width || 150) * (a.measured?.height || 100);
        const areaB = (b.measured?.width || 150) * (b.measured?.height || 100);
        return areaA - areaB;
      });

      const newParent = candidates[0];

      setNodes((nds) => nds.map((n) => {
        if (n.id === node.id) {
          // If we found a new parent
          if (newParent) {
            // Logic for snapping to edge of the NEW parent (during reparenting)
            const { x: parentAbsX, y: parentAbsY } = getAbsolutePosition(newParent, nodes);
            let relativeX = nodeAbsX - parentAbsX;
            let relativeY = nodeAbsY - parentAbsY;

            // SNAP LOGIC: Project to nearest edge
            const pWidth = newParent.measured?.width || 150;
            const pHeight = newParent.measured?.height || 100;

            // Distances to edges
            const dt = Math.abs(relativeY); // Top
            const db = Math.abs(relativeY - pHeight); // Bottom
            const dl = Math.abs(relativeX); // Left
            const dr = Math.abs(relativeX - pWidth); // Right

            const min = Math.min(dt, db, dl, dr);

            let finalX = relativeX;
            let finalY = relativeY;
            let side = 'Bottom';

            if (min === dt) { finalY = -10; side = 'Top'; } // -10 to sit on border
            else if (min === db) { finalY = pHeight - 10; side = 'Bottom'; }
            else if (min === dl) { finalX = -10; side = 'Left'; }
            else if (min === dr) { finalX = pWidth - 10; side = 'Right'; }

            // Clamp to segment
            if (side === 'Top' || side === 'Bottom') {
              finalX = Math.max(-10, Math.min(finalX, pWidth - 10));
            } else {
              finalY = Math.max(-10, Math.min(finalY, pHeight - 10));
            }

            return {
              ...n,
              parentId: newParent.id,
              extent: 'parent',
              position: { x: finalX, y: finalY },
              data: { ...n.data, side } // Update side for potential rotation
            };
          } else {
            // No parent found (reverting to root or keeping current?)
            // Standard logic: if no parent, become root node (unless checking existing parent)
            // Existing logic below handles general reparenting.
          }
        }
        return n;
      }));

      // Existing logic for 'no new parent' needs to be preserved or integrated.
      // The snippet above only handles the case where *newParent* is found.
      // If we are ALREADY parented and just moving inside the parent, we should also snap.

      // Let's refine:
      // Case A: Moving inside existing parent (no reparenting, just adjustment)
      // Case B: Moving to new parent (reparenting)

      // ... Continuation of existing code ...


      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            // Case 1: Found a new parent (different from current)
            if (newParent && newParent.id !== n.parentId) {
              const { x: parentAbsX, y: parentAbsY } = getAbsolutePosition(newParent, nodes);
              const isFrameParent = newParent.type === 'diagramFrame';

              return {
                ...n,
                parentId: newParent.id,
                // All children should have extent: 'parent' to move with parent
                // DiagramFrame children use 'parent' extent for proper containment and movement
                extent: 'parent' as const,
                // Ensure children render above frame
                zIndex: isFrameParent ? 10 : n.zIndex,
                position: {
                  x: nodeAbsX - parentAbsX,
                  // For DiagramFrame, offset Y by 30 to account for header
                  y: nodeAbsY - parentAbsY + (isFrameParent ? 0 : 0)
                }
              };
            }
            // Case 2: No parent found, but currently has one -> Detach
            // EXCEPTION: If the current parent is the active IBD frame activeViewId, DO NOT DETACH.
            // We are just moving it around on the infinite canvas.
            else if (!newParent && n.parentId && n.parentId !== activeViewId) {
              return {
                ...n,
                parentId: undefined,
                extent: undefined,
                position: {
                  x: nodeAbsX,
                  y: nodeAbsY
                }
              };
            }
            // Case 3: Parent didn't change -> Update position but keep parent
            // This is CRITICAL. If we don't update position here, it reverts to the old state position!
            return {
              ...n,
              position: node.position
            };
          }
          return n;
        })
      );
    },
    [nodes, setNodes, getAbsolutePosition]
  );

  // Helper to get breadcrumb path
  const getPathToRoot = useCallback((nodeId: string | null): Node[] => {
    const path: Node[] = [];
    let currentId = nodeId;
    while (currentId) {
      const node = nodes.find(n => n.id === currentId);
      if (node) {
        path.unshift(node);
        // Traverse up using parentId from the full node tree
        currentId = node.parentId || null;
      } else {
        break;
      }
    }
    return path;
  }, [nodes]);

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    // IBD Navigation Logic for Blocks
    if (node.type === 'sysmlBlock') {
      const blockLabel = node.data?.label as string;
      if (blockLabel) {
        // Find a diagram frame named "ibd [Block Name]"
        const ibdFrame = nodes.find(n =>
          n.type === 'diagramFrame' &&
          (n.data?.label as string)?.toLowerCase().includes(`ibd ${blockLabel.toLowerCase()}`)
        );
        if (ibdFrame) {
          handleFocusNode(ibdFrame.id);
          return;
        }
      }
      // Fallback to Drill-down if no IBD found
      setActiveViewId(node.id);
      return;
    }

    // Drill-down Logic for Parts
    if (node.type === 'sysmlPart') {
      setActiveViewId(node.id);
      return;
    }

    const newLabel = window.prompt('Enter new name for this node:', node.data.label as string);
    if (newLabel !== null) {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            return { ...n, data: { ...n.data, label: newLabel } };
          }
          return n;
        })
      );
    }
  }, [setNodes]);

  const onEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    const newLabel = window.prompt('Enter label for this connection:', edge.label as string || '');
    if (newLabel !== null) {
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id === edge.id) {
            return { ...e, label: newLabel };
          }
          return e;
        })
      );
    }
  }, [setEdges]);



  // Search highlighting
  // Memoize search results to avoid re-calculating on every render
  // We only care about IDs for the search results to avoid circular dependency with style updates
  const searchResultIds = useMemo(() => {
    if (!searchQuery) return [];
    return nodes
      .filter((n) => (n.data.label as string)?.toLowerCase().includes(searchQuery.toLowerCase()))
      .map((n) => n.id);
  }, [nodes, searchQuery]);

  useEffect(() => {
    setMatchCount(searchResultIds.length);
    if (currentMatchIndex >= searchResultIds.length) {
      setCurrentMatchIndex(0);
    }
  }, [searchResultIds.length]);

  useEffect(() => {
    // Only update nodes if the search query or result IDs change
    // Avoid adding 'nodes' to dependency array to prevent loop
    // This is a bit risky but necessary if we store styles in nodes state

    if (!searchQuery) {
      setNodes((nds) =>
        nds.map(n => n.style?.border ? { ...n, style: { ...n.style, border: undefined } } : n)
      );
      return;
    }

    const currentMatchId = searchResultIds[currentMatchIndex];

    setNodes((nds) =>
      nds.map((n) => {
        const isMatch = searchResultIds.includes(n.id);
        const isCurrent = n.id === currentMatchId;

        let newBorder = undefined;
        if (isCurrent) newBorder = '2px solid var(--primary)';
        else if (isMatch) newBorder = '2px solid rgba(var(--primary-rgb), 0.5)';

        // Only update if style actually changed
        if (n.style?.border !== newBorder) {
          return {
            ...n,
            style: {
              ...n.style,
              border: newBorder,
            },
          };
        }
        return n;
      })
    );

    // Center view on match
    if (reactFlowInstance && currentMatchId) {
      const node = nodes.find(n => n.id === currentMatchId);
      if (node) {
        reactFlowInstance.fitView({ nodes: [{ id: currentMatchId }], duration: 500, padding: 2 });
      }
    }

  }, [searchQuery, JSON.stringify(searchResultIds), currentMatchIndex, setNodes, reactFlowInstance]);



  // Z-Index Control
  const handleBringToFront = useCallback(() => {
    setNodes((nds) => {
      const selectedIds = nds.filter((n) => n.selected).map((n) => n.id);
      if (selectedIds.length === 0) return nds;

      const maxZ = Math.max(...nds.map((n) => n.zIndex || 0), 0);
      return nds.map((n) => {
        if (selectedIds.includes(n.id)) {
          return { ...n, zIndex: maxZ + 1 };
        }
        return n;
      });
    });
  }, [setNodes]);

  const handleSendToBack = useCallback(() => {
    setNodes((nds) => {
      const selectedIds = nds.filter((n) => n.selected).map((n) => n.id);
      if (selectedIds.length === 0) return nds;

      const minZ = Math.min(...nds.map((n) => n.zIndex || 0), 0);
      return nds.map((n) => {
        if (selectedIds.includes(n.id)) {
          return { ...n, zIndex: minZ - 1 };
        }
        return n;
      });
    });
  }, [setNodes]);

  const handleReparent = useCallback((nodeId: string, newParentId: string | null) => {
    setNodes((nds) => {
      const node = nds.find((n) => n.id === nodeId);
      if (!node) return nds;

      // If parent hasn't changed, do nothing
      if (node.parentId === newParentId) return nds;
      if (!newParentId && !node.parentId) return nds;

      // Calculate current absolute position
      const { x: absX, y: absY } = getAbsolutePosition(node, nds);

      let newPosition = { x: absX, y: absY };

      // If moving to a new parent, calculate relative position
      if (newParentId) {
        const newParent = nds.find((n) => n.id === newParentId);
        if (newParent) {
          const { x: parentAbsX, y: parentAbsY } = getAbsolutePosition(newParent, nds);
          newPosition = {
            x: absX - parentAbsX,
            y: absY - parentAbsY,
          };
        }
      }

      return nds.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            parentId: newParentId || undefined,
            extent: newParentId ? 'parent' : undefined,
            position: newPosition,
          };
        }
        return n;
      });
    });
  }, [setNodes, getAbsolutePosition]);

  // Layers Panel Handlers
  const handleToggleVisibility = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          return { ...n, hidden: !n.hidden };
        }
        return n;
      })
    );
  }, [setNodes]);

  const handleToggleLock = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          return { ...n, draggable: n.draggable === undefined ? false : !n.draggable };
        }
        return n;
      })
    );
  }, [setNodes]);

  const handleSelectNode = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: n.id === nodeId,
      }))
    );
  }, [setNodes]);

  // Context Menu: Reverse Edge Direction
  const handleReverseEdge = useCallback((edgeId: string) => {
    takeSnapshot();
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id === edgeId) {
          return { ...e, source: e.target, target: e.source };
        }
        return e;
      })
    );
  }, [setEdges, takeSnapshot]);

  // Context Menu: Add TextBox at position
  const handleAddTextBox = useCallback((x: number, y: number) => {
    takeSnapshot();
    const position = reactFlowInstance
      ? reactFlowInstance.screenToFlowPosition({ x, y })
      : { x: x - 300, y: y - 100 };
    const newNode: Node = {
      id: generateSysMLId('note'),
      type: 'note',
      position,
      data: { text: '', variant: 'note' },
      style: { width: 150, height: 80 },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, reactFlowInstance, takeSnapshot]);

  // Context Menu: Add DiagramFrame at position
  const handleAddDiagramFrame = useCallback((x: number, y: number) => {
    takeSnapshot();
    const position = reactFlowInstance
      ? reactFlowInstance.screenToFlowPosition({ x, y })
      : { x: x - 300, y: y - 100 };
    const newNode: Node = {
      id: generateSysMLId('frame'),
      type: 'diagramFrame',
      position,
      data: { label: 'New Diagram', diagramType: 'bdd' },
      style: { width: 600, height: 400 },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, reactFlowInstance, takeSnapshot]);

  // Context Menu: Select All
  const handleSelectAll = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
  }, [setNodes]);

  // Context Menu: Fit View
  const handleFitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2, duration: 500 });
    }
  }, [reactFlowInstance]);

  // Context Menu: Delete node/edge
  const handleDelete = useCallback((id: string) => {
    takeSnapshot();
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.id !== id && e.source !== id && e.target !== id));
  }, [setNodes, setEdges, takeSnapshot]);

  // Context Menu: Duplicate node
  const handleDuplicate = useCallback((node: any) => {
    takeSnapshot();
    const newId = generateSysMLId(node.type);
    const newNode: Node = {
      ...node,
      id: newId,
      position: { x: node.position.x + 30, y: node.position.y + 30 },
      selected: false,
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, takeSnapshot]);

  // Context Menu: Bring to Front by ID
  const handleBringToFrontById = useCallback((id: string) => {
    setNodes((nds) => {
      const maxZ = Math.max(...nds.map((n) => n.zIndex || 0), 0);
      return nds.map((n) => (n.id === id ? { ...n, zIndex: maxZ + 1 } : n));
    });
  }, [setNodes]);

  // Context Menu: Send to Back by ID
  const handleSendToBackById = useCallback((id: string) => {
    setNodes((nds) => {
      const minZ = Math.min(...nds.map((n) => n.zIndex || 0), 0);
      return nds.map((n) => (n.id === id ? { ...n, zIndex: minZ - 1 } : n));
    });
  }, [setNodes]);

  // Context menu handlers
  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, type: 'node', target: node });
  }, []);

  const handleEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, type: 'edge', target: edge });
  }, []);

  const handleCanvasContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, type: 'canvas' });
  }, []);

  const getContextMenuItems = (): (ContextMenuItem | 'separator')[] => {
    if (!contextMenu) return [];

    if (contextMenu.type === 'node') {
      const node = contextMenu.target as Node;
      return [
        { label: 'Edit Label', onClick: () => onNodeDoubleClick({} as any, node) },
        'separator',
        { label: 'Copy', shortcut: 'Ctrl+C', onClick: () => { setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === node.id }))); setTimeout(handleCopy, 50); } },
        { label: 'Duplicate', shortcut: 'Ctrl+D', onClick: () => { setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === node.id }))); setTimeout(() => { handleCopy(); handlePaste(); }, 50); } },
        'separator',
        { label: 'Bring to Front', shortcut: ']', onClick: () => { setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === node.id }))); setTimeout(handleBringToFront, 50); } },
        { label: 'Send to Back', shortcut: '[', onClick: () => { setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === node.id }))); setTimeout(handleSendToBack, 50); } },
        'separator',
        { label: 'Delete', shortcut: 'Del', onClick: () => { setNodes((nds) => nds.filter((n) => n.id !== node.id)); setEdges((eds) => eds.filter((e) => e.source !== node.id && e.target !== node.id)); } },
      ];
    }

    if (contextMenu.type === 'edge') {
      const edge = contextMenu.target as Edge;
      return [
        { label: 'Edit Label', onClick: () => onEdgeDoubleClick({} as any, edge) },
        'separator',
        { label: 'Delete', shortcut: 'Del', onClick: () => setEdges((eds) => eds.filter((e) => e.id !== edge.id)) },
      ];
    }

    return [
      { label: 'Paste', shortcut: 'Ctrl+V', onClick: handlePaste, disabled: !clipboard },
      { label: 'Select All', shortcut: 'Ctrl+A', onClick: () => setNodes((nds) => nds.map((n) => ({ ...n, selected: true }))) },
    ];
  };

  // Copy selected nodes and edges
  const handleCopy = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    const selectedNodeIds = selectedNodes.map((n) => n.id);
    const selectedEdges = edges.filter(
      (e) => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target)
    );
    setClipboard({ nodes: selectedNodes, edges: selectedEdges });
  }, [nodes, edges]);

  // Paste nodes and edges from clipboard
  const handlePaste = useCallback(() => {
    if (!clipboard) return;

    const idMapping: Record<string, string> = {};
    const newNodes = clipboard.nodes.map((node) => {
      const newId = generateSysMLId(node.type);
      idMapping[node.id] = newId;
      return {
        ...node,
        id: newId,
        position: { x: node.position.x + 50, y: node.position.y + 50 },
        selected: false,
      };
    });

    const newEdges = clipboard.edges.map((edge) => ({
      ...edge,
      id: generateSysMLId('connector'),
      source: idMapping[edge.source] || edge.source,
      target: idMapping[edge.target] || edge.target,
    }));

    setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);

  }, [clipboard, setNodes, setEdges]);

  // Handle Edge Reconnection (Detach/Reattach)
  const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds));
  }, [setEdges]);

  // Diagram Focus Handler
  const handleFocusNode = useCallback((nodeId: string) => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({
        nodes: [{ id: nodeId }],
        duration: 800,
        padding: 0.2
      });
    }
  }, [reactFlowInstance]);

  // Save diagram to JSON file and localStorage
  const handleSave = useCallback(() => {
    const projectData = {
      id: projectId,
      name: projectName,
      nodes,
      edges,
      savedAt: new Date().toISOString()
    };

    // Save to localStorage
    try {
      const savedProjects = JSON.parse(localStorage.getItem('sysml_projects') || '{}');
      savedProjects[projectId] = projectData;
      localStorage.setItem('sysml_projects', JSON.stringify(savedProjects));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }

    // Download as file
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, projectId, projectName]);

  // Sync current model to localStorage for cross-page access (DFMEA, etc.)
  useEffect(() => {
    try {
      localStorage.setItem('current_model', JSON.stringify({
        projectId,
        projectName,
        nodes,
        edges,
      }));
    } catch (e) {
      console.error('Failed to sync model to localStorage:', e);
    }
  }, [nodes, edges, projectId, projectName]);

  // Load diagram from JSON file
  const handleLoad = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          try {
            takeSnapshot();
            const data = JSON.parse(event.target.result);
            setNodes(data.nodes || []);
            setEdges(data.edges || []);
            // Load project metadata if present
            if (data.name) setProjectName(data.name);
            if (data.id) setProjectId(data.id);
            setActiveViewId(null);
          } catch (error) {
            console.error('Error loading diagram:', error);
            alert('Failed to load diagram. Invalid file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [setNodes, setEdges, takeSnapshot, setProjectName, setProjectId, setActiveViewId]);

  // SELF-CORRECTION: Fix existing nodes with bad extent
  useEffect(() => {
    setNodes((currentNodes) => {
      let hasChanges = false;
      const fixedNodes = currentNodes.map(node => {
        if (node.parentId && ['sysmlSystemBoundary', 'sysmlSwimlane'].includes(node.type || '') && node.extent === 'parent') {
          hasChanges = true;
          return { ...node, extent: undefined };
        }
        return node;
      });
      return hasChanges ? fixedNodes : currentNodes;
    });
  }, [nodes.length]); // Check when node count changes (creation/load)

  // Export to PNG
  const handleExportPng = useCallback(() => {
    const canvasElement = document.querySelector('.react-flow') as HTMLElement;
    if (canvasElement) {
      toPng(canvasElement, {
        backgroundColor: '#0f0f0f',
        width: canvasElement.offsetWidth,
        height: canvasElement.offsetHeight,
      })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `diagram-${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
        })
        .catch((error) => {
          console.error('Error exporting PNG:', error);
        });
    }
  }, []);

  // Export to SVG
  const handleExportSvg = useCallback(() => {
    const canvasElement = document.querySelector('.react-flow') as HTMLElement;
    if (canvasElement) {
      toSvg(canvasElement, {
        backgroundColor: '#0f0f0f',
        width: canvasElement.offsetWidth,
        height: canvasElement.offsetHeight,
      })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `diagram-${Date.now()}.svg`;
          link.href = dataUrl;
          link.click();
        })
        .catch((error) => {
          console.error('Error exporting SVG:', error);
        });
    }
  }, []);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          handleCopy();
        } else if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          handlePaste();
        } else if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
        } else if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          handleCopy();
          handlePaste();
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          handleSave();
        } else if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          setShowSearch(true);
          // Focus search bar after a brief delay to ensure it's rendered
          setTimeout(() => {
            const searchInput = document.querySelector('input[placeholder="Search nodes..."]') as HTMLInputElement;
            searchInput?.focus();
          }, 50);
        }
      } else if (e.key === 'Escape') {
        // Hide search, clear query, and close context menu
        setShowSearch(false);
        setSearchQuery('');
        setContextMenu(null);
        setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // Nudge selected nodes
        e.preventDefault();
        const shift = e.shiftKey ? 1 : 10;
        setNodes((nds) => {
          const hasSelected = nds.some((n) => n.selected);
          if (!hasSelected) return nds;

          return nds.map((n) => {
            if (n.selected) {
              return {
                ...n,
                position: {
                  x: n.position.x + (e.key === 'ArrowRight' ? shift : e.key === 'ArrowLeft' ? -shift : 0),
                  y: n.position.y + (e.key === 'ArrowDown' ? shift : e.key === 'ArrowUp' ? -shift : 0),
                },
              };
            }
            return n;
          });
        });
      } else if (e.key === ']') {
        e.preventDefault();
        handleBringToFront();
      } else if (e.key === '[') {
        e.preventDefault();
        handleSendToBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCopy, handlePaste, setNodes, handleSave, setShowSearch, setSearchQuery, setContextMenu, nodes, edges, handleBringToFront, handleSendToBack]);

  // Viewport Management Logic
  useEffect(() => {
    if (!reactFlowInstance) return;

    if (activeViewId) {
      // IBD View: Do NOT fit the huge frame. Fit content or default to origin.
      // We need to wait for nodes to be updated in ReactFlow internal state?
      // Since displayNodes updates synchronously, wait a tick.
      setTimeout(() => {
        const contentNodes = reactFlowInstance.getNodes().filter((n: Node) => n.type !== 'frame' && !n.hidden);

        if (contentNodes.length > 0) {
          reactFlowInstance.fitView({ nodes: contentNodes, padding: 0.2 });
        } else {
          // Default to standard working area if empty
          reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 });
        }
      }, 50);
    } else {
      // Root View: Standard Fit View
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 });
      }, 50);
    }
  }, [activeViewId, reactFlowInstance]);

  // Check if there are any constraint blocks for simulation button visibility
  const hasConstraints = nodes.some(n => n.type === 'sysmlConstraintBlock');

  // Check if there are any activity diagram nodes
  const hasActivityNodes = nodes.some(n =>
    ['sysmlAction', 'sysmlDecision', 'sysmlForkJoin', 'sysmlInitial', 'sysmlFinal', 'sysmlSignal'].includes(n.type || '')
  );

  // Import Script Logic
  const [showImportModal, setShowImportModal] = useState(false);

  const handleImportJson = useCallback((jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.nodes) throw new Error("Missing 'nodes' array");

      // Basic Auto-Layout if positions missing
      const existingCount = nodes.length;
      const layoutNodes = data.nodes.map((n: any, i: number) => ({
        ...n,
        id: n.id || `imported-${Date.now()}-${i}`,
        position: n.position || {
          x: 100 + (i % 5) * 200,
          y: 100 + Math.floor(i / 5) * 150
        },
        data: { ...n.data, label: n.label || n.data?.label || 'Node' }
      }));

      const layoutEdges = (data.edges || []).map((e: any, i: number) => ({
        ...e,
        id: e.id || `edge-${Date.now()}-${i}`,
        source: e.source,
        target: e.target,
        type: e.type || 'controlFlow', // Default to ControlFlow edge for Activity Diagrams
        data: {
          // stereotype: 'control', // ControlFlowEdge doesn't need this, but good for metadata
          ...e.data
        }
      }));

      setNodes((prev) => [...prev, ...layoutNodes]);
      setEdges((prev) => [...prev, ...layoutEdges]);

      alert(`Successfully imported ${layoutNodes.length} nodes from script!`);
    } catch (e) {
      alert('Failed to import script: Invalid JSON format or missing data.');
      console.error(e);
    }
  }, [nodes, setNodes, setEdges]);

  // Database Integration State
  const [showProjectList, setShowProjectList] = useState(false);
  const [dbProjectId, setDbProjectId] = useState<number | null>(null);

  // Database Save
  const handleCloudSave = useCallback(async () => {
    const projectData = {
      name: projectName || 'Untitled Model',
      data_json: JSON.stringify({
        nodes,
        edges,
        projectId,
        viewport: reactFlowInstance ? reactFlowInstance.getViewport() : { x: 0, y: 0, zoom: 1 }
      }),
      id: dbProjectId
    };

    try {
      const res = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });

      if (res.ok) {
        const savedProject = await res.json();
        setDbProjectId(savedProject.id);
        alert(`✅ Project "${savedProject.name}" saved to cloud!`);
      } else {
        alert('❌ Failed to save project.');
      }
    } catch (e) {
      console.error(e);
      alert('❌ Error connecting to server.');
    }
  }, [nodes, edges, projectName, projectId, dbProjectId, reactFlowInstance]);

  // Database Load
  const handleCloudLoad = useCallback(async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${id}`);
      if (res.ok) {
        const project = await res.json();
        const data = JSON.parse(project.data_json);
        takeSnapshot(); // Undo point
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setProjectName(project.name);
        setProjectId(data.projectId || `project_${Date.now()}`);
        setDbProjectId(project.id);
        setActiveViewId(null);
        if (data.viewport && reactFlowInstance) {
          reactFlowInstance.setViewport(data.viewport);
        }
        setShowProjectList(false);
      }
    } catch (e) {
      console.error(e);
      alert('❌ Error loading project.');
    }
  }, [setNodes, setEdges, reactFlowInstance, takeSnapshot]);

  // Validation Logic
  const handleValidate = useCallback(() => {
    const issues = validateModel(nodes, edges);
    if (issues.length === 0) {
      alert('✅ Model Validation Passed\n\nNo issues found! Your SysML model structure looks correct.');
    } else {
      const errorCount = issues.filter(i => i.severity === 'error').length;
      const warningCount = issues.filter(i => i.severity === 'warning').length;

      const message = `⚠️ Model Validation Found ${issues.length} Issues:\n` +
        `(${errorCount} Errors, ${warningCount} Warnings)\n\n` +
        issues.map((issue, idx) => `${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`).join('\n');

      alert(message);
    }
  }, [nodes, edges]);

  return (
    <div className={styles.pageContainer} style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Project Header */}
      <div style={{
        height: 32,
        backgroundColor: '#1a1a2e',
        borderBottom: '1px solid #2d2d44',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 16,
        paddingRight: 16,
      }}>
        {isEditingProjectName ? (
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onBlur={() => setIsEditingProjectName(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setIsEditingProjectName(false);
              if (e.key === 'Escape') setIsEditingProjectName(false);
            }}
            autoFocus
            style={{
              background: 'transparent',
              border: '1px solid #4f46e5',
              borderRadius: 4,
              color: '#e5e7eb',
              fontSize: 13,
              fontWeight: 500,
              padding: '2px 8px',
              outline: 'none',
              width: 200,
            }}
          />
        ) : (
          <span
            onClick={() => setIsEditingProjectName(true)}
            style={{
              color: '#e5e7eb',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
            title="Click to rename project"
          >
            {projectName}
          </span>
        )}
      </div>



      <TopBar
        connectionType={connectionType}
        onConnectionTypeChange={setConnectionType}
        snapToGrid={snapToGrid}
        onSnapToGridChange={setSnapToGrid}
        onSave={handleSave}
        onLoad={handleLoad}
        onExportPng={handleExportPng}
        onExportSvg={handleExportSvg}
        onImportScript={() => setShowImportModal(true)}
        showLegend={showLegend}
        onToggleLegend={() => setShowLegend(!showLegend)}
        showProperties={showProperties}
        onToggleProperties={() => setShowProperties(!showProperties)}
        showSimulation={showSimulation}
        onToggleSimulation={() => setShowSimulation(!showSimulation)}
        hasConstraints={hasConstraints}
        showActivitySimulation={showActivitySimulation}
        onToggleActivitySimulation={() => setShowActivitySimulation(!showActivitySimulation)}
        hasActivityNodes={hasActivityNodes}
        onValidateModel={handleValidate}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onCloudSave={handleCloudSave}
        onCloudLoad={() => setShowProjectList(true)}
        onNewProject={() => {
          const newName = prompt('Enter project name:', 'Untitled Model');
          if (newName !== null) {
            takeSnapshot();
            setNodes([]);
            setEdges([]);
            setActiveViewId(null);
            setProjectName(newName || 'Untitled Model');
            setProjectId(`project_${Date.now()}`);
          }
        }}
      />

      <ProjectListModal
        isOpen={showProjectList}
        onClose={() => setShowProjectList(false)}
        onLoadProject={handleCloudLoad}
      />

// ...

      <ScriptInputModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportJson}
      />


      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar (Model Browser) */}
        <div style={{ width: '250px', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
          <ModelBrowser
            nodes={nodes}
            onSelectionChange={(id) => {
              setNodes((nds) => nds.map((n) => ({
                ...n,
                selected: n.id === id,
              })));
            }}
            onFocusNode={handleFocusNode}
            onToggleVisibility={(id) => setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, hidden: !n.hidden } : n)))}
            onToggleLock={(id) => setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, draggable: !n.draggable } : n)))}
            onReparent={handleReparent}
            // Context Menu Actions
            onCreateNode={(type, parentId) => {
              const id = generateSysMLId('node');
              const newNode: Node = {
                id,
                type,
                position: { x: 0, y: 0 },
                data: { label: `New ${type.replace('sysml', '')}` },
                parentId,
                expandParent: true,
                style: type === 'sysmlBlock' ? { width: 150, height: 100 } : undefined
              };
              // Add to nodes list. If parent exists, layout might overlap, but tree will show it.
              setNodes(nds => [...nds, newNode]);
            }}
            onDeleteNode={handleDelete}
            onRenameNode={(nodeId) => {
              const label = prompt("New Name:"); // Minimal UI for now
              if (label) {
                setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, label } } : n));
              }
            }}
          />
        </div>

        {/* Center Canvas */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }} ref={reactFlowWrapper}>
          {/* ... Breadcrumb ... */}
          <div style={{
            padding: '8px 16px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--background-secondary)',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {/* ... existing breadcrumb code ... */}
            <span
              style={{ cursor: 'pointer', fontWeight: activeViewId ? 'normal' : 'bold', color: activeViewId ? 'var(--foreground-muted)' : 'var(--foreground)' }}
              onClick={() => setActiveViewId(null)}
            >
              Home
            </span>
            {getPathToRoot(activeViewId).map((node, index, arr) => (
              <React.Fragment key={node.id}>
                <span>/</span>
                <span
                  style={{
                    fontWeight: index === arr.length - 1 ? 'bold' : 'normal',
                    cursor: index === arr.length - 1 ? 'default' : 'pointer',
                    color: index === arr.length - 1 ? 'var(--foreground)' : 'var(--foreground-muted)'
                  }}
                  onClick={() => {
                    if (index !== arr.length - 1) setActiveViewId(node.id);
                  }}
                >
                  {node.data.label as string || node.id}
                </span>
              </React.Fragment>
            ))}
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            <Canvas
              nodes={displayNodes}
              edges={displayEdges}
              fitView={!activeViewId} // Only auto-fit in Root view
              onNodesChange={handleNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDrop={(e) => {
                // Expanded onDrop logic for "Smart Instantiation"
                e.preventDefault();

                // 1. Check for Tree Drag (Instantiate)
                const treeData = e.dataTransfer.getData('application/sysml-node');
                if (treeData) {
                  const sourceNode = JSON.parse(treeData);

                  // If dropping a Block -> Create a Part (Instance)
                  if (sourceNode.type === 'sysmlBlock') {
                    const position = reactFlowInstance ? reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY }) : { x: e.clientX - 300, y: e.clientY - 100 };
                    const partId = generateSysMLId('part');
                    const newPart: Node = {
                      id: partId,
                      type: 'sysmlPart',
                      position,
                      parentId: activeViewId || undefined, // Parent to current view context
                      extent: activeViewId ? 'parent' : undefined,
                      data: {
                        label: `${sourceNode.label}_1`,
                        blockDefId: sourceNode.id // Link definition
                      },
                      style: { width: 120, height: 60 }
                    };
                    setNodes(nds => [...nds, newPart]);
                    return;
                  }

                  // If dragging something else, maybe just move it? (Reparenting via canvas drop is tricky, let's keep it simple)
                  return;
                }

                // 2. Standard Toolbox Drag
                onDrop(e);
              }}
              onDragOver={onDragOver}
              onNodeDragStop={onNodeDragStop}
              isValidConnection={isValidConnection}
              snapToGrid={snapToGrid}
              onNodeDoubleClick={onNodeDoubleClick}
              onEdgeDoubleClick={onEdgeDoubleClick}
              onNodeContextMenu={handleNodeContextMenu}
              onEdgeContextMenu={handleEdgeContextMenu}
              onPaneContextMenu={handleCanvasContextMenu}
              onInit={setReactFlowInstance}
              onReconnect={onReconnect}
            />
          </div>

          {/* Floating Legend (if toggled) */}
          {showLegend && <Legend />}

          {/* ... Search ... */}
          {/* Context Menu */}
          {contextMenu && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              type={contextMenu.type}
              target={contextMenu.target}
              onClose={() => setContextMenu(null)}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onBringToFront={handleBringToFrontById}
              onSendToBack={handleSendToBackById}
              onToggleLock={handleToggleLock}
              onReverseEdge={handleReverseEdge}
              onPaste={handlePaste as any}
              onAddTextBox={handleAddTextBox}
              onAddDiagramFrame={handleAddDiagramFrame}
              onSelectAll={handleSelectAll}
              onFitView={handleFitView}
              onToggleGrid={() => setSnapToGrid(!snapToGrid)}
              hasClipboard={!!clipboard}
              gridEnabled={snapToGrid}
            />
          )}

          {/* Search Bar */}
          {showSearch && (
            <SearchBar
              onSearch={setSearchQuery}
              onClose={() => setShowSearch(false)}
              onNext={handleNextMatch}
              onPrevious={handlePreviousMatch}
              matchCount={matchCount}
              currentMatchIndex={currentMatchIndex}
            />
          )}

        </div>

        {/* Right Sidebar (Properties Panel) */}
        {showProperties && (selectedNode || selectedEdge) && (
          <div style={{ width: '300px', borderLeft: '1px solid var(--border)', backgroundColor: '#fff', overflowY: 'auto' }}>
            <PropertiesPanel
              selectedNode={selectedNode}
              selectedEdge={selectedEdge}
              nodes={nodes}
              onChange={handleNodeChange}
              onEdgeChange={handleEdgeChange}
              onAddNode={(type, parentId, data) => {
                const newNode = {
                  id: `node_${Date.now()}`,
                  type,
                  position: { x: 0, y: 0 }, // Relative to parent
                  data: { label: data?.label || 'New Node', ...data },
                  parentId,
                  extent: 'parent' as const,
                };
                setNodes((nds) => [...nds, newNode]);
              }}
            />
          </div>
        )}

        {/* Parametric Simulation Panel */}
        {showSimulation && (
          <div style={{ width: '300px', borderLeft: '1px solid var(--border)', backgroundColor: '#fff', overflowY: 'auto', padding: '12px' }}>
            <SimulationPanel nodes={nodes} edges={edges} />
          </div>
        )}

        {/* Activity Diagram Simulation Panel */}
        {showActivitySimulation && (
          <div style={{ width: '350px', borderLeft: '1px solid var(--border)', backgroundColor: '#1a1a2e', overflowY: 'hidden' }}>
            <ActivitySimulationPanel
              nodes={nodes}
              edges={edges}
              onNodeHighlight={handleNodeHighlight}
            />
          </div>
        )}
      </div>

      <ChatPanel
        onGenerate={handleGenerate}
        nodes={nodes}
        edges={edges}
      />
    </div>
  );
}
