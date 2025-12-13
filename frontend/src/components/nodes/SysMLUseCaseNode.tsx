import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import styles from './SysMLUseCaseNode.module.css';

function SysMLUseCaseNode({ data, selected }: NodeProps) {
    return (
        <div className={styles.sysmlUseCase}>
            <NodeResizer color="#10b981" isVisible={selected} minWidth={120} minHeight={80} />

            {/* Handles */}
            <Handle type="target" position={Position.Top} id="top" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Top} id="top-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />

            <Handle type="target" position={Position.Left} id="left" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Left} id="left-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />

            {/* Use Case Label */}
            <div className={styles.label}>{data.label as string || 'Use Case'}</div>

            <Handle type="target" position={Position.Right} id="right" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Right} id="right-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />

            <Handle type="target" position={Position.Bottom} id="bottom" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />
        </div>
    );
}

export default memo(SysMLUseCaseNode);
