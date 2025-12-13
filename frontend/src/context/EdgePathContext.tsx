import React, { createContext, useContext, useRef, useCallback } from 'react';

interface EdgePathData {
    id: string;
    segments: { x: number; y: number }[];
}

interface EdgePathContextType {
    registerPath: (id: string, segments: { x: number; y: number }[]) => void;
    unregisterPath: (id: string) => void;
    getAllPaths: () => EdgePathData[];
}

const EdgePathContext = createContext<EdgePathContextType | null>(null);

export function EdgePathProvider({ children }: { children: React.ReactNode }) {
    const pathsRef = useRef<Map<string, { x: number; y: number }[]>>(new Map());

    const registerPath = useCallback((id: string, segments: { x: number; y: number }[]) => {
        pathsRef.current.set(id, segments);
    }, []);

    const unregisterPath = useCallback((id: string) => {
        pathsRef.current.delete(id);
    }, []);

    const getAllPaths = useCallback((): EdgePathData[] => {
        return Array.from(pathsRef.current.entries()).map(([id, segments]) => ({
            id,
            segments,
        }));
    }, []);

    return (
        <EdgePathContext.Provider value={{ registerPath, unregisterPath, getAllPaths }}>
            {children}
        </EdgePathContext.Provider>
    );
}

export function useEdgePathContext() {
    return useContext(EdgePathContext);
}
