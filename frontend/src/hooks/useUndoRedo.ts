import { useCallback, useRef, useState, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';

interface HistoryState {
    nodes: Node[];
    edges: Edge[];
}

interface UseUndoRedoReturn {
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    takeSnapshot: () => void;
}

const MAX_HISTORY_SIZE = 50;

export function useUndoRedo(
    nodes: Node[],
    edges: Edge[],
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
): UseUndoRedoReturn {
    // History stacks
    const undoStack = useRef<HistoryState[]>([]);
    const redoStack = useRef<HistoryState[]>([]);

    // Keep refs to current state (avoids stale closure issues)
    const nodesRef = useRef(nodes);
    const edgesRef = useRef(edges);

    // Update refs when state changes
    useEffect(() => {
        nodesRef.current = nodes;
        edgesRef.current = edges;
    }, [nodes, edges]);

    // Force re-render when stacks change
    const [, forceUpdate] = useState(0);

    // Take a snapshot of the current state
    const takeSnapshot = useCallback(() => {
        const snapshot: HistoryState = {
            nodes: JSON.parse(JSON.stringify(nodesRef.current)),
            edges: JSON.parse(JSON.stringify(edgesRef.current)),
        };

        undoStack.current.push(snapshot);

        // Limit history size
        if (undoStack.current.length > MAX_HISTORY_SIZE) {
            undoStack.current.shift();
        }

        // Clear redo stack when new action is taken
        redoStack.current = [];

        forceUpdate(n => n + 1);
    }, []);

    // Undo: Pop from undo stack, push current to redo, restore previous state
    const undo = useCallback(() => {
        if (undoStack.current.length === 0) return;

        // Save current state to redo stack
        const currentState: HistoryState = {
            nodes: JSON.parse(JSON.stringify(nodesRef.current)),
            edges: JSON.parse(JSON.stringify(edgesRef.current)),
        };
        redoStack.current.push(currentState);

        // Pop and restore previous state
        const previousState = undoStack.current.pop()!;
        setNodes(previousState.nodes);
        setEdges(previousState.edges);

        forceUpdate(n => n + 1);
    }, [setNodes, setEdges]);

    // Redo: Pop from redo stack, push current to undo, restore next state
    const redo = useCallback(() => {
        if (redoStack.current.length === 0) return;

        // Save current state to undo stack
        const currentState: HistoryState = {
            nodes: JSON.parse(JSON.stringify(nodesRef.current)),
            edges: JSON.parse(JSON.stringify(edgesRef.current)),
        };
        undoStack.current.push(currentState);

        // Pop and restore next state
        const nextState = redoStack.current.pop()!;
        setNodes(nextState.nodes);
        setEdges(nextState.edges);

        forceUpdate(n => n + 1);
    }, [setNodes, setEdges]);

    return {
        canUndo: undoStack.current.length > 0,
        canRedo: redoStack.current.length > 0,
        undo,
        redo,
        takeSnapshot,
    };
}
