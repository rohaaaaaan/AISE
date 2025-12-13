import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import styles from './SysMLActorNode.module.css';

function SysMLActorNode({ data, selected }: NodeProps) {
    return (
        <div className={styles.sysmlActor}>
            <NodeResizer color="#3b82f6" isVisible={selected} minWidth={80} minHeight={120} />

            {/* Handles */}
            <Handle type="target" position={Position.Top} id="top" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Top} id="top-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />

            <Handle type="target" position={Position.Left} id="left" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Left} id="left-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />

            {/* Stick Figure SVG */}
            <svg className={styles.stickFigure} viewBox="0 0 60 100" xmlns="http://www.w3.org/2000/svg">
                {/* Head */}
                <circle cx="30" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="2" />

                {/* Body */}
                <line x1="30" y1="32" x2="30" y2="60" stroke="currentColor" strokeWidth="2" />

                {/* Arms */}
                <line x1="30" y1="40" x2="10" y2="50" stroke="currentColor" strokeWidth="2" />
                <line x1="30" y1="40" x2="50" y2="50" stroke="currentColor" strokeWidth="2" />

                {/* Legs */}
                <line x1="30" y1="60" x2="15" y2="85" stroke="currentColor" strokeWidth="2" />
                <line x1="30" y1="60" x2="45" y2="85" stroke="currentColor" strokeWidth="2" />
            </svg>

            {/* Actor Label */}
            <div className={styles.label}>{data.label as string || 'Actor'}</div>

            <Handle type="target" position={Position.Right} id="right" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Right} id="right-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />

            <Handle type="target" position={Position.Bottom} id="bottom" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />
        </div>
    );
}

export default memo(SysMLActorNode);
