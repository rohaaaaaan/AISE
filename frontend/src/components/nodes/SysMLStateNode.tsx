import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import styles from './SysMLStateNode.module.css';

const SysMLStateNode = ({ data, selected }: NodeProps) => {
    // Check for internal activities in data
    const entry = data.entry as string;
    const doActivity = data.do as string;
    const exit = data.exit as string;

    const showBody = entry || doActivity || exit;

    return (
        <div className={`${styles.stateNode} ${selected ? styles.selected : ''}`}>
            <NodeResizer
                minWidth={100}
                minHeight={60}
                isVisible={selected}
                lineStyle={{ border: '1px solid #3b82f6' }}
                handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
            />

            {/* Header: State Name */}
            <div className={styles.header}>
                {data.label as string || 'State'}
            </div>

            {/* Body: Internal Activities */}
            {showBody && (
                <div className={styles.body}>
                    {entry && <div className={styles.internalActivity}>entry/ {entry}</div>}
                    {doActivity && <div className={styles.internalActivity}>do/ {doActivity}</div>}
                    {exit && <div className={styles.internalActivity}>exit/ {exit}</div>}
                </div>
            )}

            {/* Handles for Transitions */}
            <Handle type="target" position={Position.Top} className="w-16 !bg-gray-500" />
            <Handle type="source" position={Position.Top} className="w-16 !bg-gray-500" />

            <Handle type="target" position={Position.Bottom} className="w-16 !bg-gray-500" />
            <Handle type="source" position={Position.Bottom} className="w-16 !bg-gray-500" />

            <Handle type="target" position={Position.Left} className="h-16 !bg-gray-500" />
            <Handle type="source" position={Position.Left} className="h-16 !bg-gray-500" />

            <Handle type="target" position={Position.Right} className="h-16 !bg-gray-500" />
            <Handle type="source" position={Position.Right} className="h-16 !bg-gray-500" />
        </div>
    );
};

export default memo(SysMLStateNode);
