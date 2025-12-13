
export interface SysMLConnectorRule {
    allowedSourceTypes: string[];
    allowedTargetTypes: string[];
    description?: string;
}

export interface SysMLConnectorConfig {
    id: string;
    label: string; // User Facing Label
    stereotype?: string; // SysML Stereotype (e.g., «verify»)
    style?: React.CSSProperties;
    markerStart?: string; // ID of the marker definition
    markerEnd?: string;   // ID of the marker definition
    className?: string;   // CSS class for additional styling
    rules: SysMLConnectorRule;
    isDirected?: boolean; // Whether the edge has a direction (arrowhead)
}

export const SYSML_CONNECTORS: Record<string, SysMLConnectorConfig> = {
    // --- Structural Relationships ---
    composition: {
        id: 'composition',
        label: 'Composition',
        style: { stroke: '#ef4444', strokeWidth: 2 },
        markerStart: 'composition-diamond', // Custom marker ID
        rules: {
            allowedSourceTypes: ['sysmlBlock', 'sensor', 'actuator', 'ecu', 'gateway', 'default'],
            allowedTargetTypes: ['sysmlBlock', 'sensor', 'actuator', 'ecu', 'gateway', 'default'],
            description: 'Strong ownership relationship where the part cannot exist without the whole.',
        },
        isDirected: true,
    },
    aggregation: {
        id: 'aggregation',
        label: 'Aggregation',
        style: { stroke: '#eab308', strokeWidth: 2 },
        markerStart: 'aggregation-diamond', // Custom marker ID
        rules: {
            allowedSourceTypes: ['sysmlBlock', 'sensor', 'actuator', 'ecu', 'gateway', 'default'],
            allowedTargetTypes: ['sysmlBlock', 'sensor', 'actuator', 'ecu', 'gateway', 'default'],
            description: 'Shared ownership relationship.',
        },
        isDirected: true,
    },
    generalization: {
        id: 'generalization',
        label: 'Generalization',
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        markerEnd: 'generalization-triangle', // Custom marker ID
        rules: {
            allowedSourceTypes: ['sysmlBlock', 'sysmlRequirement'],
            allowedTargetTypes: ['sysmlBlock', 'sysmlRequirement'],
            description: 'Inheritance relationship.',
        },
        isDirected: true,
    },
    association: {
        id: 'association',
        label: 'Association',
        style: { stroke: '#aaa', strokeWidth: 1.5 },
        rules: {
            // Association is for abstract relationships between blocks
            allowedSourceTypes: ['sysmlBlock', 'sysmlPart'],
            allowedTargetTypes: ['sysmlBlock', 'sysmlPart'],
            description: 'General link between blocks. Use CAN/Ethernet for hardware connections.',
        },
        isDirected: false,
    },
    dependency: {
        id: 'dependency',
        label: 'Dependency',
        stereotype: '«use»',
        style: { stroke: '#888', strokeWidth: 1.5, strokeDasharray: '5,3' },
        markerEnd: 'open-arrow',
        rules: {
            allowedSourceTypes: ['sysmlBlock', 'sysmlPart', 'sysmlRequirement'],
            allowedTargetTypes: ['sysmlBlock', 'sysmlPart', 'sysmlRequirement'],
            description: 'One element depends on another.',
        },
        isDirected: true,
    },
    realization: {
        id: 'realization',
        label: 'Realization',
        stereotype: '«realize»',
        style: { stroke: '#3b82f6', strokeWidth: 1.5, strokeDasharray: '8,4' },
        markerEnd: 'generalization-triangle',
        rules: {
            allowedSourceTypes: ['sysmlBlock', 'sysmlPart'],
            allowedTargetTypes: ['sysmlBlock', 'sysmlPart'],
            description: 'An implementation realizes a specification.',
        },
        isDirected: true,
    },

    // --- Requirement Relationships ---
    satisfy: {
        id: 'satisfy',
        label: 'Satisfy',
        stereotype: '«satisfy»',
        style: { stroke: '#b1b1b7', strokeWidth: 1.5, strokeDasharray: '5,5' },
        markerEnd: 'open-arrow', // Standard arrow
        rules: {
            // Any physical/logical block can satisfy a requirement
            allowedSourceTypes: ['sysmlBlock', 'default', 'ecu', 'sensor', 'actuator', 'gateway'],
            allowedTargetTypes: ['sysmlRequirement'],
            description: 'Asserts that a block satisfies a requirement.',
        },
        isDirected: true,
    },
    verify: {
        id: 'verify',
        label: 'Verify',
        stereotype: '«verify»',
        style: { stroke: '#b1b1b7', strokeWidth: 1.5, strokeDasharray: '5,5' },
        markerEnd: 'open-arrow',
        rules: {
            // A Test Case (Block) verifies a requirement
            allowedSourceTypes: ['sysmlBlock', 'default', 'ecu', 'sensor', 'actuator', 'gateway'],
            allowedTargetTypes: ['sysmlRequirement'],
            description: 'Asserts that a test case verifies a requirement.',
        },
        isDirected: true,
    },
    derive: {
        id: 'derive',
        label: 'Derive',
        stereotype: '«deriveReqt»',
        style: { stroke: '#b1b1b7', strokeWidth: 1.5, strokeDasharray: '5,5' },
        markerEnd: 'open-arrow',
        rules: {
            allowedSourceTypes: ['sysmlRequirement'],
            allowedTargetTypes: ['sysmlRequirement'],
            description: 'Derives a new requirement from an existing one.',
        },
        isDirected: true,
    },
    refine: {
        id: 'refine',
        label: 'Refine',
        stereotype: '«refine»',
        style: { stroke: '#b1b1b7', strokeWidth: 1.5, strokeDasharray: '5,5' },
        markerEnd: 'open-arrow',
        rules: {
            allowedSourceTypes: ['sysmlRequirement', 'sysmlBlock', 'default', 'ecu', 'sensor', 'actuator', 'gateway'],
            allowedTargetTypes: ['sysmlRequirement'],
            description: 'Clarifies or adds detail to a requirement.',
        },
        isDirected: true,
    },
    trace: {
        id: 'trace',
        label: 'Trace',
        stereotype: '«trace»',
        style: { stroke: '#b1b1b7', strokeWidth: 1.5, strokeDasharray: '5,5' },
        markerEnd: 'open-arrow',
        rules: {
            allowedSourceTypes: ['*'],
            allowedTargetTypes: ['*'],
            description: 'General traceability link between any elements.',
        },
        isDirected: true,
    },

    // --- Package Relationships ---
    packageImport: {
        id: 'packageImport',
        label: 'Package Import',
        stereotype: '«import»',
        style: { stroke: '#8b5cf6', strokeWidth: 1.5, strokeDasharray: '8,4' },
        markerEnd: 'open-arrow',
        rules: {
            allowedSourceTypes: ['sysmlPackage'],
            allowedTargetTypes: ['sysmlPackage'],
            description: 'Imports elements from one package into another.',
        },
        isDirected: true,
    },
    packageMerge: {
        id: 'packageMerge',
        label: 'Package Merge',
        stereotype: '«merge»',
        style: { stroke: '#8b5cf6', strokeWidth: 1.5, strokeDasharray: '4,2' },
        markerEnd: 'open-arrow',
        rules: {
            allowedSourceTypes: ['sysmlPackage'],
            allowedTargetTypes: ['sysmlPackage'],
            description: 'Merges elements from one package into another.',
        },
        isDirected: true,
    },

    // --- Flow & Port ---
    itemFlow: {
        id: 'itemFlow',
        label: 'Item Flow',
        stereotype: '«flow»', // Logic sometimes dynamically adds item name
        style: { stroke: '#b1b1b7', strokeWidth: 1.5 },
        markerEnd: 'item-flow-arrow',
        rules: {
            allowedSourceTypes: ['sysmlPort'],
            allowedTargetTypes: ['sysmlPort'],
            description: 'Represents the flow of items (energy, matter, data) between ports.',
        },
        isDirected: true,
    },

    // --- Use Case Relationships ---
    include: {
        id: 'include',
        label: 'Include',
        stereotype: '«include»',
        style: { stroke: '#10b981', strokeWidth: 1.5, strokeDasharray: '5,5' },
        markerEnd: 'open-arrow',
        rules: {
            allowedSourceTypes: ['sysmlUseCase'],
            allowedTargetTypes: ['sysmlUseCase'],
            description: 'Indicates that one use case includes the behavior of another.',
        },
        isDirected: true,
    },
    extend: {
        id: 'extend',
        label: 'Extend',
        stereotype: '«extend»',
        style: { stroke: '#10b981', strokeWidth: 1.5, strokeDasharray: '5,5' },
        markerEnd: 'open-arrow',
        rules: {
            allowedSourceTypes: ['sysmlUseCase'],
            allowedTargetTypes: ['sysmlUseCase'],
            description: 'Indicates that one use case extends the behavior of another.',
        },
        isDirected: true,
    },

    allocate: {
        id: 'allocate',
        label: 'Allocate',
        stereotype: '«allocate»',
        style: { stroke: '#7c3aed', strokeWidth: 2, strokeDasharray: '6,3' },
        markerEnd: 'open-arrow',
        rules: {
            allowedSourceTypes: ['*'], // Flexible allocation
            allowedTargetTypes: ['*'],
            description: 'Allocates behavior to structure or logical to physical.',
        },
        isDirected: true,
    },

    binding: {
        id: 'binding',
        label: 'Binding',
        stereotype: '«binding»',
        style: { stroke: '#7c3aed', strokeWidth: 2, strokeDasharray: '6,3' },
        rules: {
            allowedSourceTypes: ['*'], // Allow any source for binding
            allowedTargetTypes: ['*'], // Allow any target for binding
            description: 'Binds constraint parameters to block properties in Parametric Diagrams.',
        },
        isDirected: false,
    },

    // --- Activity Diagram Connectors ---
    controlFlow: {
        id: 'controlFlow',
        label: 'Control Flow',
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        markerEnd: 'arrow',
        rules: {
            // Allow connections between all Activity Diagram nodes
            allowedSourceTypes: ['*'], // Wildcard for flexible connections
            allowedTargetTypes: ['*'], // Wildcard for flexible connections
            description: 'Control flow between actions and control nodes in Activity Diagrams.',
        },
        isDirected: true,
    },

    objectFlow: {
        id: 'objectFlow',
        label: 'Object Flow',
        style: { stroke: '#10b981', strokeWidth: 2, strokeDasharray: '6,3' },
        markerEnd: 'arrow',
        rules: {
            // Allow flexible object flow connections
            allowedSourceTypes: ['*'], // Wildcard for flexible connections
            allowedTargetTypes: ['*'], // Wildcard for flexible connections
            description: 'Data/object flow between actions via pins.',
        },
        isDirected: true,
    },

    // --- Automotive / Physical (Legacy Support) ---
    can: {
        id: 'can',
        label: 'CAN Bus',
        style: { stroke: '#f59e0b', strokeWidth: 3, strokeDasharray: '5,5' },
        rules: {
            allowedSourceTypes: ['ecu', 'gateway', 'sensor', 'actuator'], // Broadened slightly based on typical usage
            allowedTargetTypes: ['ecu', 'gateway', 'sensor', 'actuator'],
        },
        isDirected: false,
    },
    ethernet: {
        id: 'ethernet',
        label: 'Ethernet',
        style: { stroke: '#3b82f6', strokeWidth: 3 },
        rules: {
            allowedSourceTypes: ['ecu', 'gateway'],
            allowedTargetTypes: ['ecu', 'gateway'],
        },
        isDirected: false,
    },
    lin: {
        id: 'lin',
        label: 'LIN Bus',
        style: { stroke: '#0891b2', strokeWidth: 2, strokeDasharray: '4,4' }, // Teal, Dashed
        rules: {
            allowedSourceTypes: ['ecu', 'gateway', 'sensor', 'actuator'],
            allowedTargetTypes: ['ecu', 'gateway', 'sensor', 'actuator'],
        },
        isDirected: false,
    },
    // --- Sequence Diagram ---
    sequenceSync: {
        id: 'sequenceSync',
        label: 'Synchronous',
        style: { stroke: '#b1b1b7', strokeWidth: 1.5 },
        markerEnd: 'sequence-filled-arrow',
        rules: {
            allowedSourceTypes: ['sysmlLifeline'],
            allowedTargetTypes: ['sysmlLifeline', 'sysmlActor'],
            description: 'Synchronous message (sender waits for response).',
        },
        isDirected: true,
    },
    sequenceAsync: {
        id: 'sequenceAsync',
        label: 'Asynchronous',
        style: { stroke: '#b1b1b7', strokeWidth: 1.5 },
        markerEnd: 'open-arrow',
        rules: {
            allowedSourceTypes: ['sysmlLifeline', 'sysmlActor', 'sysmlSystemBoundary'],
            allowedTargetTypes: ['sysmlLifeline', 'sysmlActor'],
            description: 'Asynchronous message (sender does not wait).',
        },
        isDirected: true,
    },
    sequenceReply: {
        id: 'sequenceReply',
        label: 'Reply',
        style: { stroke: '#b1b1b7', strokeWidth: 1.5, strokeDasharray: '4,4' },
        markerEnd: 'open-arrow',
        rules: {
            allowedSourceTypes: ['sysmlLifeline', 'sysmlActor'],
            allowedTargetTypes: ['sysmlLifeline', 'sysmlActor'],
            description: 'Reply message returning control/data.',
        },
        isDirected: true,
    },
    // --- State Machine Diagram ---
    transition: {
        id: 'transition',
        label: 'Transition',
        style: { stroke: '#b1b1b7', strokeWidth: 1.5 },
        markerEnd: 'open-arrow',
        rules: {
            allowedSourceTypes: ['sysmlState', 'sysmlInitial', 'sysmlDecision', 'sysmlForkJoin', 'sysmlPseudoState'],
            allowedTargetTypes: ['sysmlState', 'sysmlFinal', 'sysmlDecision', 'sysmlForkJoin', 'sysmlPseudoState'],
            description: 'State transition triggered by an event.',
        },
        isDirected: true,
    }
};

/**
 * Validates if a connection is allowed based on the connector type and node types.
 */
export function isValidSysMLConnection(
    sourceType: string | undefined,
    targetType: string | undefined,
    connectorType: string
): boolean {
    const config = SYSML_CONNECTORS[connectorType];
    if (!config) {
        // If connector type is not defined, default to allowing if generic connection logic exists,
        // or strictly fail. For now, let's be permissive for 'default' but restrictive otherwise.
        if (connectorType === 'default') return true;
        return true; // Unknown types allowed? specific check?
    }

    const sType = sourceType || 'default';
    const tType = targetType || 'default';

    // Handle wildcard '*' - allows any type
    const sourceAllowed = config.rules.allowedSourceTypes.includes('*') || config.rules.allowedSourceTypes.includes(sType);
    const targetAllowed = config.rules.allowedTargetTypes.includes('*') || config.rules.allowedTargetTypes.includes(tType);

    return sourceAllowed && targetAllowed;
}

/**
 * Helper to get marker definitions for SVG defs
 */
// --- Marker Definitions ---
export const MARKER_DEFINITIONS = [
    {
        id: 'composition-diamond',
        path: 'M0,6 L6,0 L12,6 L6,12 z',
        fill: '#b1b1b7',
        stroke: '#b1b1b7',
        refX: 0,
        refY: 6,
        width: 12,
        height: 12
    },
    {
        id: 'aggregation-diamond',
        path: 'M0,6 L6,0 L12,6 L6,12 z',
        fill: '#000', // Aggregation often empty or black? Aggregation is hollow diamond.
        stroke: '#b1b1b7', // Stroke visible
        refX: 0,
        refY: 6,
        width: 12,
        height: 12
    },
    {
        id: 'generalization-triangle',
        path: 'M0,0 L0,12 L12,6 z',
        fill: '#b1b1b7',
        stroke: '#3b82f6',
        refX: 12,
        refY: 6,
        width: 12,
        height: 12
    },
    {
        id: 'item-flow-arrow',
        path: 'M0,0 L0,10 L10,5 z',
        fill: '#b1b1b7',
        stroke: '#b1b1b7',
        refX: 10,
        refY: 5,
        width: 10,
        height: 10
    },
    {
        id: 'open-arrow',
        path: 'M0,0 L10,5 L0,10',
        fill: 'none',
        stroke: '#b1b1b7',
        refX: 10,
        refY: 5,
        width: 10,
        height: 10
    },
    {
        id: 'sequence-filled-arrow',
        path: 'M0,0 L10,5 L0,10 z',
        fill: '#b1b1b7',
        stroke: '#b1b1b7',
        refX: 10,
        refY: 5,
        width: 10,
        height: 10
    }
];
