import { Node, Edge } from '@xyflow/react';

export interface ValidationIssue {
    severity: 'error' | 'warning';
    message: string;
    nodeId?: string;
}

/**
 * Validates consistency between Behavior (Activity Diagrams) and Structure (Blocks).
 * Specifically checks if Activity Parameters match their owning Block's Ports.
 */
export const validateBehaviorSync = (nodes: Node[], edges: Edge[]): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    // 1. Group nodes by Parent (Block)
    const blockActivities = new Map<string, Node[]>();

    nodes.forEach(node => {
        if (node.parentId) {
            if (!blockActivities.has(node.parentId)) {
                blockActivities.set(node.parentId, []);
            }
            blockActivities.get(node.parentId)?.push(node);
        }
    });

    // 2. Iterate through blocks that have internal behavior
    blockActivities.forEach((children, blockId) => {
        const block = nodes.find(n => n.id === blockId);
        if (!block) return; // Parent might be a frame or missing

        // Find Ports on the Block (Structure)
        // Adjust this filter based on your actual Port node type/structure
        // Assuming Ports are children of the block with type 'sysmlPort' OR defined in data
        const blockPorts = nodes.filter(n => n.parentId === blockId && n.type === 'sysmlPort');
        const blockPortNames = new Set(blockPorts.map(p => p.data.label as string));

        // Find Activity Parameters (Behavior)
        // Assuming "Activity Parameter" nodes have type 'sysmlActivityParameter' (or similar)
        // OR standard 'sysmlAction' nodes acting as pins.
        // For compliance, let's check 'sysmlActivityParameter' nodes if they exist, 
        // or more commonly in this tool, maybe we treat specific nodes as inputs/outputs.

        // Let's assume we are looking for generic Action Nodes that represent IO if not explicitly typed.
        // Better: Validate that if an Activity has "Input Pin: X", the Block has "Port: X".

        // Filter for Activity Parameter Nodes
        const parameters = children.filter(n => n.type === 'sysmlParam' || (n.data.stereotype === 'parameter'));

        parameters.forEach(param => {
            const paramName = param.data.label as string;
            if (!blockPortNames.has(paramName)) {
                issues.push({
                    severity: 'warning',
                    message: `Behavior Mismatch: Activity Parameter '${paramName}' in Block '${block.data.label}' has no matching Port.`,
                    nodeId: param.id
                });
            }
        });
    });

    return issues;
};

/**
 * Checks for Ports that are not attached to any parent Block.
 * Ports must be children of a Block to be valid SysML.
 */
export const validateOrphanedPorts = (nodes: Node[]): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];
    nodes.filter(n => n.type === 'sysmlPort').forEach(port => {
        if (!port.parentId) {
            issues.push({
                severity: 'error',
                message: `Orphaned Port detected: '${port.data.label || 'Unnamed Port'}' has no parent Block.`,
                nodeId: port.id
            });
        }
    });
    return issues;
};

/**
 * Checks for key structural elements that lack a descriptive name.
 */
export const validateNaming = (nodes: Node[]): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];
    // Only check structural/behavioral elements that should be named
    const significantTypes = ['sysmlBlock', 'sysmlActivity', 'sysmlRequirement', 'sysmlUseCase', 'sysmlAction'];

    nodes.filter(n => significantTypes.includes(n.type || '')).forEach(node => {
        const label = node.data.label as string;
        if (!label || label.trim() === '' || label.startsWith('New ')) {
            issues.push({
                severity: 'warning',
                message: `Weak Naming: Node '${label || 'Unnamed'}' (${node.type}) should have a descriptive name.`,
                nodeId: node.id
            });
        }
    });
    return issues;
};

/**
 * Validates that structural blocks involved in connections have appropriate Types.
 */
export const validateConnections = (nodes: Node[], edges: Edge[]): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];
    const nodeIds = new Set(nodes.map(n => n.id));

    edges.forEach(edge => {
        if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
            issues.push({
                severity: 'error',
                message: `Broken Connection: Edge '${edge.label || edge.id}' has a missing endpoint.`,
                // nodeId: edge.id 
            });
        }
    });
    return issues;
};

/**
 * Master Validation Function
 */
export const validateModel = (nodes: Node[], edges: Edge[]): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    issues.push(...validateBehaviorSync(nodes, edges));
    issues.push(...validateOrphanedPorts(nodes));
    issues.push(...validateNaming(nodes));
    issues.push(...validateConnections(nodes, edges));

    return issues;
};
