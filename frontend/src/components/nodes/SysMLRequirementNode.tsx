import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import styles from './SysMLRequirementNode.module.css';

function SysMLRequirementNode({ data, selected }: NodeProps) {
    return (
        <div className={styles.sysmlRequirement}>
            <NodeResizer color="#d97706" isVisible={selected} minWidth={150} minHeight={80} />

            {/* Handles - Visible only when selected or hovered */}
            <Handle type="target" position={Position.Top} id="top" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Top} id="top-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />

            <Handle type="target" position={Position.Left} id="left" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Left} id="left-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />

            <div className={styles.header}>
                <div className={styles.stereotype}>&lt;&lt;requirement&gt;&gt;</div>
                <div className={styles.title}>{data.label as string}</div>
            </div>

            <div className={styles.body}>
                <div className={styles.reqId}>Id: {data.reqId as string || 'REQ-XXX'}</div>
                <div className={styles.reqText}>"{data.reqText as string || 'Requirement text...'}"</div>
            </div>

            <Handle type="target" position={Position.Right} id="right" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Right} id="right-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />

            <Handle type="target" position={Position.Bottom} id="bottom" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />
        </div>
    );
}

export default memo(SysMLRequirementNode);
