'use client';

import { Eye, EyeOff, Lock, Unlock, Layers, ChevronRight, ChevronDown, Box, Circle, FileText, Cpu, Activity, Zap, Network, Share2 } from 'lucide-react';
import { Node } from '@xyflow/react';
import { useState, useMemo } from 'react';
import styles from './LayersPanel.module.css';

// Helper to get icon based on node type
const getNodeIcon = (type?: string) => {
    switch (type) {
        case 'sysmlBlock': return <Box size={14} />;
        case 'sysmlPort': return <Circle size={12} />;
        case 'sysmlRequirement': return <FileText size={14} />;
        case 'ecu': return <Cpu size={14} />;
        case 'sensor': return <Activity size={14} />;
        case 'actuator': return <Zap size={14} />;
        case 'gateway': return <Network size={14} />;
        default: return <Box size={14} />;
    }
};

interface LayersPanelProps {
    nodes: Node[];
    activeViewId: string | null;
    onSelectNode: (nodeId: string) => void;
    onToggleVisibility: (nodeId: string) => void;
    onToggleLock: (nodeId: string) => void;
    onReparent: (nodeId: string, newParentId: string | null) => void;
}

interface TreeNode {
    node: Node;
    children: TreeNode[];
}

export function LayersPanel({ nodes, activeViewId, onSelectNode, onToggleVisibility, onToggleLock, onReparent }: LayersPanelProps) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    // Build tree structure
    const tree = useMemo(() => {
        const nodeMap = new Map<string, TreeNode>();
        const roots: TreeNode[] = [];

        // Initialize map
        nodes.forEach(node => {
            nodeMap.set(node.id, { node, children: [] });
        });

        // Build hierarchy
        nodes.forEach(node => {
            const treeNode = nodeMap.get(node.id)!;
            if (node.parentId && nodeMap.has(node.parentId)) {
                const parent = nodeMap.get(node.parentId)!;
                parent.children.push(treeNode);
            } else {
                roots.push(treeNode);
            }
        });

        // Sort by zIndex (descending)
        const sortNodes = (nodes: TreeNode[]) => {
            nodes.sort((a, b) => (b.node.zIndex || 0) - (a.node.zIndex || 0));
            nodes.forEach(n => sortNodes(n.children));
        };
        sortNodes(roots);

        return roots;
    }, [nodes]);

    const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) next.delete(nodeId);
            else next.add(nodeId);
            return next;
        });
    };

    const handleDragStart = (e: React.DragEvent, nodeId: string) => {
        e.dataTransfer.setData('application/layer-node-id', nodeId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetId: string | null) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('application/layer-node-id');
        if (!draggedId || draggedId === targetId) return;

        // Prevent dropping parent into child
        let current = nodes.find(n => n.id === targetId);
        while (current?.parentId) {
            if (current.parentId === draggedId) return;
            current = nodes.find(n => n.id === current?.parentId);
        }

        onReparent(draggedId, targetId);
    };

    const renderTreeNode = (treeNode: TreeNode, depth: number = 0) => {
        // ... (existing renderTreeNode implementation)
        const { node, children } = treeNode;
        const isExpanded = expanded.has(node.id);
        const hasChildren = children.length > 0;

        return (
            <div key={node.id}>
                <div
                    className={`${styles.layerItem} ${node.selected ? styles.selected : ''}`}
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                    onClick={() => onSelectNode(node.id)}
                    draggable={node.draggable !== false}
                    onDragStart={(e) => handleDragStart(e, node.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => {
                        e.stopPropagation();
                        handleDrop(e, node.id);
                    }}
                >
                    <div
                        style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginRight: 4 }}
                        onClick={(e) => hasChildren && toggleExpand(node.id, e)}
                    >
                        {hasChildren && (
                            isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                        )}
                    </div>

                    <div style={{ marginRight: 6, display: 'flex', alignItems: 'center', color: 'var(--muted-foreground)' }}>
                        {getNodeIcon(node.type)}
                    </div>

                    <span className={styles.nodeLabel} style={{ flex: 1 }}>{node.data.label as string || node.id}</span>

                    <button
                        className={`${styles.iconButton} ${node.hidden ? styles.active : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleVisibility(node.id);
                        }}
                        title={node.hidden ? "Show" : "Hide"}
                    >
                        {node.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                        className={`${styles.iconButton} ${!node.draggable ? styles.active : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleLock(node.id);
                        }}
                        title={!node.draggable ? "Unlock" : "Lock"}
                    >
                        {!node.draggable ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                </div>
                {isExpanded && children.map(child => renderTreeNode(child, depth + 1))}
            </div>
        );
    };

    // Derived: Ports of the active view (boundary ports)
    const boundaryPorts = useMemo(() => {
        if (!activeViewId) return [];
        return nodes.filter(n => n.parentId === activeViewId && n.type === 'sysmlPort');
    }, [nodes, activeViewId]);

    const handleBoundaryDragStart = (e: React.DragEvent, nodeId: string) => {
        e.dataTransfer.setData('application/sysml-boundary-port', nodeId);
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className={styles.layersPanel}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, null)}
        >
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={16} />
                    <span>Layers</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    {nodes.length} items
                </span>
            </div>

            {/* Boundary Ports Section (Only in IBD) */}
            {activeViewId && boundaryPorts.length > 0 && (
                <div className={styles.section} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                    <div className={styles.sectionHeader} style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                        Boundary Ports (Pull to Use)
                    </div>
                    {boundaryPorts.map(port => (
                        <div
                            key={port.id}
                            className={styles.layerItem}
                            style={{ paddingLeft: '1rem', cursor: 'grab' }}
                            draggable
                            onDragStart={(e) => handleBoundaryDragStart(e, port.id)}
                        >
                            <div style={{ marginRight: 6, display: 'flex', alignItems: 'center', color: 'var(--primary)' }}>
                                {getNodeIcon(port.type)}
                            </div>
                            <span className={styles.nodeLabel}>{port.data.label as string || port.id}</span>
                            <span style={{ fontSize: '0.7em', marginLeft: 'auto', color: '#999' }}>
                                {port.data.direction === 'out' ? '→ Out' : 'In →'}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <div className={styles.list}>
                {tree.map(root => renderTreeNode(root))}
                {nodes.length === 0 && (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>
                        No nodes on canvas
                    </div>
                )}
            </div>
        </div>
    );
}
