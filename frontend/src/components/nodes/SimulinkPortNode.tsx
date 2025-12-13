import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';

interface SimulinkPortData extends Record<string, unknown> {
    label: string;
    direction?: 'in' | 'out' | 'inout';
    portType?: string;
}

function SimulinkPortNode({ data, selected }: NodeProps<Node<SimulinkPortData>>) {
    const direction = data.direction || 'in';
    const label = data.label || 'Port';

    // Aesthetic Colors (Simulink-ish)
    // Inports: often white/gray background
    const bg = '#f0f0f0';
    const border = selected ? '#2196F3' : '#333';
    const textColor = '#333';

    // Shape definition
    // We try to mimic the pill shape with a point.
    // 100x40 roughly.

    return (
        <div style={{ position: 'relative', width: 100, height: 40, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}>
            <svg width="100" height="40" viewBox="0 0 100 40" style={{ overflow: 'visible' }}>
                {direction === 'out' ? (
                    // Point on Left? No, usually Outports flow OUT of the system, but in Simulink Diagram:
                    // Input Port [ > ] ----> [ Block ] ----> [ > ] Output Port
                    // So Input Port points RIGHT.
                    // Output Port points RIGHT (receiving flow from left).
                    // Wait, actually:
                    // Inport: (Label>  Points Right.
                    // Outport: <Label) Points Left? Or (Label> also points right?
                    // Standard flow is Left to Right.
                    // Inport Source (Left side of screen) -> Points Right.
                    // Outport Sink (Right side of screen) -> Points Right.
                    // So they both point RIGHT usually.
                    // BUT let's stick to a generic "Pill with Point" shape pointing Right for now.
                    <path
                        d="M 5,5 L 85,5 L 95,20 L 85,35 L 5,35 A 10,10 0 0 1 5,5 Z"
                        fill={bg}
                        stroke={border}
                        strokeWidth="1.5"
                    />
                ) : (
                    // Inport
                    <path
                        d="M 5,5 L 85,5 L 95,20 L 85,35 L 5,35 A 10,10 0 0 1 5,5 Z"
                        fill={bg}
                        stroke={border}
                        strokeWidth="1.5"
                    />
                )}

                <text x="45" y="24" textAnchor="middle" fontSize="12" fill={textColor} fontWeight="500">
                    {label}
                </text>
            </svg>

            {/* Handles */}
            {/* If Inport (Source), handle is on Tip (Right)? No, handle is where it connects. */}
            {/* Logic: Boundary Inport -> drives internal blocks. So it is a SOURCE. Handle on Right. */}
            {/* Logic: Boundary Outport -> receives from internal blocks. So it is a TARGET. Handle on Left. */}

            {direction === 'in' && (
                <Handle
                    type="source"
                    position={Position.Right}
                    style={{ right: 5, top: 20, background: 'transparent', border: 'none' }}
                />
            )}

            {direction === 'out' && (
                <Handle
                    type="target"
                    position={Position.Left}
                    style={{ left: 5, top: 20, background: 'transparent', border: 'none' }}
                />
            )}
        </div>
    );
}

export default memo(SimulinkPortNode);
