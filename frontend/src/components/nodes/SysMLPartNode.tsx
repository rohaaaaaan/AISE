import React, { memo, useMemo } from 'react';
import { Handle, Position, NodeProps, NodeResizer, useNodes } from '@xyflow/react';
import styles from './SysMLPartNode.module.css';
import { getBlockDefinition } from '@/utils/sysmlRegistry';

function SysMLPartNode({ data, selected }: NodeProps) {
    const nodes = useNodes();

    // Look up the definition if a blockDefId is provided
    const blockDef = useMemo(() => {
        if (!data.blockDefId || typeof data.blockDefId !== 'string') return null;
        return getBlockDefinition(nodes, data.blockDefId);
    }, [nodes, data.blockDefId]);

    const label = data.label as string;
    const typeLabel = blockDef ? blockDef.label : '';

    return (
        <div className={styles.sysmlPart}>
            <NodeResizer color="#000" isVisible={selected} minWidth={100} minHeight={50} />

            {/* Inherited Ports (Proxy Ports) */}
            {blockDef && blockDef.ports.map((port, idx) => {
                // Position ports on the edge of the Part (straddling the boundary)
                const isLeft = port.position === 'left';
                const isRight = port.position === 'right';

                // Calculate top position - distribute starting from header
                const topOffset = 30 + (idx * 18); // Start below header, space 18px apart

                // Horizontal position: straddle the edge
                const horizontalStyle = isLeft
                    ? { left: '-6px' }
                    : isRight
                        ? { right: '-6px' }
                        : { left: '-6px' }; // Default to left

                return (
                    <div
                        key={port.id}
                        className={styles.proxyPort}
                        style={{ top: `${topOffset}px`, ...horizontalStyle }}
                        title={`${port.label} (inherited)`}
                    >
                        {/* Cameo-style Proxy Port: Box with Arrow */}
                        <div style={{
                            width: '12px',
                            height: '12px',
                            border: '1px solid #333',
                            background: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '8px'
                        }}>
                            {port.direction === 'out' ? '→' : '←'}
                        </div>

                        <Handle
                            type={port.direction === 'in' ? 'target' : 'source'}
                            position={isLeft ? Position.Left : Position.Right}
                            id={`proxy-${port.id}`}
                            style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}
                        />
                    </div>
                );
            })}

            {/* Standard Connection Handles for the Part itself */}
            <Handle type="target" position={Position.Top} id="top" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Top} id="top-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />
            <Handle type="target" position={Position.Left} id="left" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Left} id="left-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />
            <Handle type="target" position={Position.Right} id="right" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Right} id="right-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />
            <Handle type="target" position={Position.Bottom} id="bottom" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />

            <div className={styles.header}>
                <div className={styles.title}>
                    <span style={{ fontWeight: 'bold' }}>{label}</span>
                    {typeLabel && <span style={{ fontWeight: 'normal' }}> : {typeLabel}</span>}
                </div>
            </div>

            <div className={styles.body}>
                {/* Parts in IBDs can contain property values or compartments if needed */}
            </div>
        </div>
    );
}

export default memo(SysMLPartNode);
