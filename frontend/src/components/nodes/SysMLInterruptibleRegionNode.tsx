'use client';

import { memo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import styles from './SysMLInterruptibleRegionNode.module.css';

interface InterruptibleRegionData {
    label?: string;
}

function SysMLInterruptibleRegionNode({ data, selected }: { data: InterruptibleRegionData; selected: boolean }) {
    return (
        <div className={styles.regionNode}>
            <NodeResizer
                minWidth={200}
                minHeight={150}
                isVisible={selected}
                lineClassName={styles.resizerLine}
                handleClassName={styles.resizerHandle}
            />

            {/* Label in top-left corner */}
            {data.label && (
                <div className={styles.label}>{data.label}</div>
            )}

            {/* Lightning bolt icon for interrupt indicator */}
            <div className={styles.interruptIcon}>⚡</div>

            {/* Interrupt edge handle */}
            <Handle
                type="source"
                position={Position.Right}
                id="interrupt"
                className={styles.interruptHandle}
                style={{ top: '20px' }}
            />

            {/* Content area for nested actions */}
            <div className={styles.content}>
                {/* Actions go here */}
            </div>
        </div>
    );
}

export default memo(SysMLInterruptibleRegionNode);
