import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import styles from './SensorNode.module.css';

function SensorNode({ data, selected }: NodeProps) {
    return (
        <div className={styles.sensorNode}>
            <NodeResizer color="#8b5cf6" isVisible={selected} minWidth={100} minHeight={50} />
            <Handle type="target" position={Position.Top} id="top" />
            <Handle type="target" position={Position.Left} id="left" />

            <div className={styles.header}>SENSOR</div>
            <div className={styles.label}>{data.label as string}</div>

            <Handle type="source" position={Position.Right} id="right" />
            <Handle type="source" position={Position.Bottom} id="bottom" />
        </div>
    );
}

export default memo(SensorNode);
