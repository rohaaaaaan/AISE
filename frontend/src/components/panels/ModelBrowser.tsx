'use client';

import {
    Eye, EyeOff, Lock, Unlock, Layers, ChevronRight, ChevronDown,
    Box, Circle, FileText, Cpu, Activity, Zap, Network, Search, FolderTree
} from 'lucide-react';
import { Node } from '@xyflow/react';
import { useState, useMemo, useEffect } from 'react';
import styles from './ModelBrowser.module.css';
import { TreeContextMenu } from '@/components/ui/TreeContextMenu';

// Helper to get icon based on node type
const getNodeIcon = (type?: string) => {
    switch (type) {
        case 'sysmlBlock': return <Box size={14} color="#a3caff" strokeWidth={1.5} />;
        case 'sysmlPart': return <Box size={12} color="#ddd" />;
        case 'sysmlPort': return <Box size={10} color="#fffd82" fill='#fffd82' />;
        case 'sysmlRequirement': return <FileText size={14} color="#ffadad" />;
        case 'sysmlAction': return <Activity size={14} color="#ffd6a5" />;
        case 'sysmlLifeline': return <Activity size={14} color="#a3caff" />;
        case 'sysmlState': return <Box size={14} color="#fcd34d" style={{ borderRadius: 6 }} />;
        case 'diagramFrame': return <Layers size={14} color="#fff" />;
        case 'package': return <FolderTree size={14} color="#f0e68c" style={{ fill: '#f0e68c', fillOpacity: 0.1 }} />;
        default: return <Box size={14} color="#888" />;
    }
};

interface ModelBrowserProps {
    nodes: Node[];
    onSelectionChange: (nodeId: string | null) => void;
    onFocusNode?: (nodeId: string) => void;
    onToggleVisibility?: (nodeId: string) => void;
    onToggleLock?: (nodeId: string) => void;
    onReparent?: (nodeId: string, newParentId: string | null) => void;
    onCreateNode?: (type: string, parentId?: string) => void;
    onDeleteNode?: (nodeId: string) => void;
    onRenameNode?: (nodeId: string) => void;
}

interface TreeNode {
    node: Node;
    children: TreeNode[];
}

export function ModelBrowser({
    nodes, onSelectionChange, onFocusNode, onToggleVisibility, onToggleLock, onReparent,
    onCreateNode, onDeleteNode, onRenameNode
}: ModelBrowserProps) {
    const [activeTab, setActiveTab] = useState<'containment' | 'diagrams'>('containment');
    const [expanded, setExpanded] = useState<Set<string>>(new Set(['root-data']));
    const [searchTerm, setSearchTerm] = useState('');
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, nodeId: string } | null>(null);

    // Filter nodes based on search
    const filteredNodes = useMemo(() => {
        if (!searchTerm) return nodes;
        const term = searchTerm.toLowerCase();
        const matches = new Set<string>();

        nodes.forEach(n => {
            const label = (n.data.label as string || '').toLowerCase();
            if (label.includes(term) || n.id.toLowerCase().includes(term)) {
                matches.add(n.id);
                // Walk up parents
                let curr = n;
                while (curr.parentId) {
                    matches.add(curr.parentId);
                    const parent = nodes.find(p => p.id === curr.parentId);
                    if (!parent) break;
                    curr = parent;
                }
            }
        });

        return nodes.filter(n => matches.has(n.id));
    }, [nodes, searchTerm]);

    // Build tree structure
    const tree = useMemo(() => {
        const nodeMap = new Map<string, TreeNode>();
        const topLevelNodes: TreeNode[] = [];

        // Initialize map
        filteredNodes.forEach(node => {
            nodeMap.set(node.id, { node, children: [] });
        });

        const frames = filteredNodes.filter(n => n.type === 'diagramFrame');

        filteredNodes.forEach(node => {
            // Skip diagram frames in normal tree if they are empty or we want strict hierarchy
            // Actually, frames ARE nodes, so they should show up in tree.

            const treeNode = nodeMap.get(node.id)!;

            // 1. Explicit Parent
            if (node.parentId && nodeMap.has(node.parentId)) {
                const parent = nodeMap.get(node.parentId)!;
                parent.children.push(treeNode);
                return;
            }

            // 2. Implicit Visual Parent (Diagram Frame)
            // Only if node is NOT a frame itself and has no explicit parent
            if (node.type !== 'diagramFrame' && frames.length > 0) {
                const nodeX = node.position.x;
                const nodeY = node.position.y;
                const w = (node.style?.width as number) || (node.measured?.width || 100);
                const h = (node.style?.height as number) || (node.measured?.height || 60);
                const centerX = nodeX + w / 2;
                const centerY = nodeY + h / 2;

                // Find containing frame
                const containingFrame = frames.find(f => {
                    // Determine frame bounds
                    const fx = f.position.x;
                    const fy = f.position.y;
                    const fw = (f.style?.width as number) || (f.measured?.width || 600);
                    const fh = (f.style?.height as number) || (f.measured?.height || 400);

                    return (
                        centerX >= fx &&
                        centerX <= fx + fw &&
                        centerY >= fy &&
                        centerY <= fy + fh
                    );
                });

                if (containingFrame && nodeMap.has(containingFrame.id)) {
                    const frameNode = nodeMap.get(containingFrame.id)!;
                    frameNode.children.push(treeNode);
                    return;
                }
            }

            // 3. Associations: IBD Frames nested under Blocks
            // logic: If node is DiagramFrame and label starts with "ibd <BlockLabel>", nest under that block.
            if (node.type === 'diagramFrame') {
                const myLabel = (node.data?.label as string)?.toLowerCase() || '';
                if (myLabel.startsWith('ibd')) {
                    // Extract block name (e.g. "ibd user" -> "user")
                    const targetBlockName = myLabel.replace('ibd', '').trim();

                    // Allow substring match or exact match on other nodes
                    const parentBlock = nodes.find(n =>
                        (n.data?.label as string)?.toLowerCase() === targetBlockName && n.type === 'sysmlBlock'
                    );

                    if (parentBlock && nodeMap.has(parentBlock.id)) {
                        const blockTreeNode = nodeMap.get(parentBlock.id)!;
                        blockTreeNode.children.push(treeNode);
                        return;
                    }
                }
            }

            // 3. Fallback: Top Level
            topLevelNodes.push(treeNode);
        });

        // Sort by label
        const sortNodes = (nodes: TreeNode[]) => {
            nodes.sort((a, b) => {
                const labelA = (a.node.data.label as string || '').toLowerCase();
                const labelB = (b.node.data.label as string || '').toLowerCase();
                return labelA.localeCompare(labelB);
            });
            nodes.forEach(n => sortNodes(n.children));
        };
        sortNodes(topLevelNodes);

        // Virtual Root
        const dataRoot: TreeNode = {
            node: {
                id: 'root-data',
                type: 'package',
                position: { x: 0, y: 0 },
                data: { label: 'Data' }
            },
            children: topLevelNodes
        };

        return [dataRoot];
    }, [filteredNodes]);

    // Auto-expand on search
    useEffect(() => {
        if (searchTerm) {
            const allIds = filteredNodes.map(n => n.id);
            allIds.push('root-data');
            setExpanded(new Set(allIds));
        }
    }, [searchTerm, filteredNodes]);

    const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) next.delete(nodeId);
            else next.add(nodeId);
            return next;
        });
    };

    const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
        if (nodeId === 'root-data') return;

        // Single selection for now to match page.tsx expectations
        onSelectionChange(nodeId);

        // If focusing
        if (onFocusNode) {
            onFocusNode(nodeId);
        }
    };

    const handleDragStart = (e: React.DragEvent, node: Node) => {
        if (node.id === 'root-data') {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('application/sysml-node', JSON.stringify({
            id: node.id,
            type: node.type,
            label: node.data.label
        }));
        e.dataTransfer.effectAllowed = 'copyMove';
    };

    const handleContextMenu = (e: React.MouseEvent, nodeId: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
    };

    const handleContextAction = (action: string, nodeId: string) => {
        if (nodeId === 'root-data') {
            if (action === 'createBlock' && onCreateNode) onCreateNode('sysmlBlock', undefined);
            return;
        }
        if (action === 'createBlock' && onCreateNode) onCreateNode('sysmlBlock', nodeId);
        if (action === 'delete' && onDeleteNode) onDeleteNode(nodeId);
        if (action === 'rename' && onRenameNode) onRenameNode(nodeId);
    };

    const renderTreeNode = (treeNode: TreeNode, depth: number = 0) => {
        const { node, children } = treeNode;
        const isExpanded = expanded.has(node.id);
        const hasChildren = children.length > 0;
        const isSelected = node.id !== 'root-data' && node.selected;

        return (
            <div key={node.id}>
                <div
                    className={`${styles.treeItem} ${isSelected ? styles.selected : ''}`}
                    style={{ paddingLeft: `${depth * 16 + 4}px` }}
                    onClick={(e) => handleNodeClick(e, node.id)}
                    onContextMenu={(e) => handleContextMenu(e, node.id)}
                    draggable={node.id !== 'root-data'}
                    onDragStart={(e) => handleDragStart(e, node)}
                >
                    <div
                        style={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginRight: 4 }}
                        onClick={(e) => hasChildren && toggleExpand(node.id, e)}
                    >
                        {hasChildren ? (
                            isExpanded ? <ChevronDown size={12} color="#cccccc" /> : <ChevronRight size={12} color="#cccccc" />
                        ) : <div style={{ width: 12 }} />}
                    </div>

                    <div style={{ marginRight: 6, display: 'flex', alignItems: 'center' }}>
                        {getNodeIcon(node.type)}
                    </div>

                    <span className={styles.nodeLabel}>{node.data.label as string || node.id || 'Data'}</span>
                </div>
                {isExpanded && children.map(child => renderTreeNode(child, depth + 1))}
            </div>
        );
    };

    const renderDiagramList = () => {
        const diagrams = nodes.filter(n => n.type === 'diagramFrame');
        if (diagrams.length === 0) {
            return <div className={styles.emptyState} style={{ padding: 20, textAlign: 'center', color: '#666' }}>No active diagrams.</div>;
        }

        return diagrams.map(node => (
            <div key={node.id} className={styles.treeItem} onClick={(e) => handleNodeClick(e, node.id)}>
                <div className={`${styles.treeRow} ${node.selected ? styles.selected : ''}`} style={{ paddingLeft: 8, display: 'flex', alignItems: 'center' }}>
                    <span className={styles.icon} style={{ marginRight: 8 }}><Layers size={14} color="#fff" /></span>
                    <span className={styles.label}>{node.data.label as string || 'New Diagram'}</span>
                </div>
            </div>
        ));
    };

    return (
        <div className={styles.modelBrowser}>
            <div className={styles.header}>
                <div className={styles.title}>Model Explorer</div>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'containment' ? styles.active : ''}`}
                        onClick={() => setActiveTab('containment')}
                    >
                        Structure
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'diagrams' ? styles.active : ''}`}
                        onClick={() => setActiveTab('diagrams')}
                    >
                        Diagrams
                    </button>
                </div>
            </div>

            <div className={styles.content}>
                {activeTab === 'containment' ? (
                    tree.map(root => renderTreeNode(root))
                ) : (
                    <div className={styles.list}>
                        {renderDiagramList()}
                    </div>
                )}
            </div>

            {contextMenu && (
                <TreeContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    nodeId={contextMenu.nodeId}
                    onClose={() => setContextMenu(null)}
                    onAction={handleContextAction}
                />
            )}
        </div>
    );
}
