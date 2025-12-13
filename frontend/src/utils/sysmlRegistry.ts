import { Node } from '@xyflow/react';

export interface BlockDefinition {
    id: string;
    label: string;
    ports: BlockPort[];
}

export interface BlockPort {
    id: string;
    label: string;
    position: 'left' | 'right' | 'top' | 'bottom';
    direction: 'in' | 'out' | 'inout'; // Added for proxy port arrow
}

/**
 * Scans the current nodes to find all valid SysML Block definitions.
 * Returns a registry map for quick lookup.
 */
export const buildBlockRegistry = (nodes: Node[]): Map<string, BlockDefinition> => {
    const registry = new Map<string, BlockDefinition>();

    nodes.forEach(node => {
        if (node.type === 'sysmlBlock') {
            // Extract ports from the block's data or children
            // In our implementation, ports might be child nodes OR data properties
            // For now, let's assume we look for child nodes of type 'sysmlPort'
            const ports: BlockPort[] = [];

            // We need to find nodes that are children of this block
            // This is tricky because 'nodes' list is flat.
            // We'll require a second pass or filtered lookup if ports are separate nodes.
            // PROPOSAL: For this MVP, let's assume Ports are defined in 'data.ports'
            // OR we scan the node list for children.

            // Let's rely on the node list being passed in fully.

            registry.set(node.id, {
                id: node.id,
                label: (node.data.label as string) || 'Unnamed Block',
                ports: [] // Populated in pass 2 if needed
            });
        }
    });

    // Pass 2: find ports
    nodes.forEach(node => {
        if (node.type === 'sysmlPort' && node.parentId) {
            const block = registry.get(node.parentId);
            if (block) {
                // Heuristic for position based on relative position or explicit data
                // For simplicity, we default to 'left' or read from data
                block.ports.push({
                    id: node.id,
                    label: (node.data.label as string) || 'Port',
                    position: (node.data.position as any) || 'left',
                    direction: (node.data.direction as 'in' | 'out' | 'inout') || 'in'
                });
            }
        }
    });

    return registry;
};

/**
 * Hook-like helper to get a specific block definition
 */
export const getBlockDefinition = (nodes: Node[], blockId: string): BlockDefinition | undefined => {
    const registry = buildBlockRegistry(nodes);
    return registry.get(blockId);
}
