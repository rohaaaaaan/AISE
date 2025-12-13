import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import styles from './ActuatorNode.module.css';

function ActuatorNode({ data, selected }: NodeProps) {
    return (
        <div className={styles.actuatorNode}>
            <NodeResizer color="#f43f5e" isVisible={selected} minWidth={100} minHeight={50} />
            <Handle type="target" position={Position.Top} id="top" />
            <Handle type="target" position={Position.Left} id="left" />

            <div className={styles.header}>ACTUATOR</div>
            <div className={styles.label}>{data.label as string}</div>

            <Handle type="source" position={Position.Right} id="right" />
            <Handle type="source" position={Position.Bottom} id="bottom" />
        </div>
    );
}

export default memo(ActuatorNode);
