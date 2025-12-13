'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import styles from './SysMLInitialNode.module.css';

function SysMLInitialNode({ data, selected }: { data: any; selected: boolean }) {
    const isActive = data.isSimulationActive || false;

    return (
        <div className={styles.initialNode}>
            <div className={`${styles.circle} ${isActive ? styles.simulationActive : ''}`} />

            {/* Only output - Initial nodes start the flow */}
            <Handle type="source" position={Position.Bottom} id="bottom" className={styles.handle} />
            <Handle type="source" position={Position.Right} id="right" className={styles.handle} />
        </div>
    );
}

export default memo(SysMLInitialNode);
