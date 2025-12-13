'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import {
    Node,
    Edge,
    OnNodesChange,
    OnEdgesChange,
    useNodesState,
    useEdgesState,
    addEdge as flowAddEdge,
    Connection,
} from '@xyflow/react';

// Initial Data (Moved from page.tsx)
const initialNodesData: Node[] = [
    { id: '1', position: { x: 100, y: 100 }, data: { label: 'System Context' }, type: 'sysmlBlock', style: { width: 200, height: 100 } },
    { id: '2', position: { x: 100, y: 250 }, data: { label: 'External Entity' }, type: 'sysmlBlock', style: { width: 200, height: 100 } },
    // Test Ports
    { id: 'p1', type: 'sysmlPort', position: { x: -10, y: 40 }, parentId: '1', extent: 'parent', data: { label: 'In', portType: 'Electrical', sysmlType: 'proxy', direction: 'in' } },
    { id: 'p2', type: 'sysmlPort', position: { x: 190, y: 40 }, parentId: '1', extent: 'parent', data: { label: 'Out', portType: 'Mechanical', sysmlType: 'full', direction: 'out' } },
    { id: 'p3', type: 'sysmlPort', position: { x: 90, y: -10 }, parentId: '1', extent: 'parent', data: { label: 'InOut', portType: 'DataTransferOperation', sysmlType: 'proxy', direction: 'inout' } },
];
const initialEdgesData: Edge[] = [{ id: 'e1-2', source: '1', target: '2' }];

interface ModelContextType {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
    addConnection: (connection: Connection) => void;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export function ModelProvider({ children }: { children: ReactNode }) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodesData);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdgesData);

    const addConnection = useCallback(
        (params: Connection) => setEdges((eds) => flowAddEdge(params, eds)),
        [setEdges]
    );

    return (
        <ModelContext.Provider
            value={{
                nodes,
                edges,
                onNodesChange,
                onEdgesChange,
                setNodes,
                setEdges,
                addConnection,
            }}
        >
            {children}
        </ModelContext.Provider>
    );
}

export function useModel() {
    const context = useContext(ModelContext);
    if (context === undefined) {
        throw new Error('useModel must be used within a ModelProvider');
    }
    return context;
}
