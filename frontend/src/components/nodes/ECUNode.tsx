import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import styles from './ECUNode.module.css';

function ECUNode({ data, selected }: NodeProps) {
  return (
    <div className={styles.ecuNode}>
      <NodeResizer color="#ff0072" isVisible={selected} minWidth={100} minHeight={50} />
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Top} id="top-source" style={{ background: 'transparent' }} />

      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Left} id="left-source" style={{ background: 'transparent' }} />

      <div className={styles.header}>ECU</div>
      <div className={styles.label}>{data.label as string}</div>
      <div className={styles.ports}>
        <div className={styles.port} />
        <div className={styles.port} />
      </div>

      <Handle type="target" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Right} id="right-source" style={{ background: 'transparent' }} />

      <Handle type="target" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ background: 'transparent' }} />
    </div>
  );
}

export default memo(ECUNode);
