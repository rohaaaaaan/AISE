import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import styles from './SysMLSystemBoundaryNode.module.css';

function SysMLSystemBoundaryNode({ data, selected }: NodeProps) {
    return (
        <div className={styles.sysmlSystemBoundary}>
            <NodeResizer color="#9333ea" isVisible={selected} minWidth={300} minHeight={200} />

            {/* System Boundary Label */}
            <div className={styles.header}>
                <div className={styles.label}>{data.label as string || 'System'}</div>
            </div>

            {/* Content Area (contains use cases) */}
            <div className={styles.content}>
                {/* Children nodes will be rendered here by ReactFlow */}
            </div>

            {/* Handles for connecting actors */}
            <Handle type="target" position={Position.Top} id="top" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Top} id="top-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />

            <Handle type="target" position={Position.Left} id="left" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Left} id="left-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />

            <Handle type="target" position={Position.Right} id="right" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Right} id="right-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />

            <Handle type="target" position={Position.Bottom} id="bottom" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />
        </div>
    );
}

export default memo(SysMLSystemBoundaryNode);
