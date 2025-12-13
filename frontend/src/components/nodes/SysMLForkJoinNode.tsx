'use client';

import { memo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import styles from './SysMLForkJoinNode.module.css';

interface ForkJoinNodeData {
    label?: string;
    orientation?: 'horizontal' | 'vertical';
    isSimulationActive?: boolean;
}

function SysMLForkJoinNode({ data, selected }: { data: ForkJoinNodeData; selected: boolean }) {
    const isHorizontal = data.orientation !== 'vertical';
    const isActive = data.isSimulationActive || false;

    return (
        <div className={`${styles.forkJoinNode} ${isHorizontal ? styles.horizontal : styles.vertical} ${isActive ? styles.simulationActive : ''}`}>
            <NodeResizer
                minWidth={isHorizontal ? 100 : 8}
                minHeight={isHorizontal ? 8 : 100}
                isVisible={selected}
                lineClassName={styles.resizerLine}
                handleClassName={styles.resizerHandle}
            />

            {/* Handles positioned based on orientation */}
            {isHorizontal ? (
                <>
                    <Handle type="target" position={Position.Top} id="top" className={styles.handle} />
                    <Handle type="source" position={Position.Bottom} id="bottom-1" className={styles.handle} style={{ left: '25%' }} />
                    <Handle type="source" position={Position.Bottom} id="bottom-2" className={styles.handle} style={{ left: '50%' }} />
                    <Handle type="source" position={Position.Bottom} id="bottom-3" className={styles.handle} style={{ left: '75%' }} />
                </>
            ) : (
                <>
                    <Handle type="target" position={Position.Left} id="left" className={styles.handle} />
                    <Handle type="source" position={Position.Right} id="right-1" className={styles.handle} style={{ top: '25%' }} />
                    <Handle type="source" position={Position.Right} id="right-2" className={styles.handle} style={{ top: '50%' }} />
                    <Handle type="source" position={Position.Right} id="right-3" className={styles.handle} style={{ top: '75%' }} />
                </>
            )}

            <div className={styles.bar} />
        </div>
    );
}

export default memo(SysMLForkJoinNode);
