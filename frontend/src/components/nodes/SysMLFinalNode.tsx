'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import styles from './SysMLFinalNode.module.css';

interface FinalNodeData {
    flowFinal?: boolean; // true = flow final (X), false = activity final (bullseye)
    isSimulationActive?: boolean;
}

function SysMLFinalNode({ data, selected }: { data: FinalNodeData; selected: boolean }) {
    const isActive = data.isSimulationActive || false;

    return (
        <div className={styles.finalNode}>
            {/* Only input - Final nodes end the flow */}
            <Handle type="target" position={Position.Top} id="top" className={styles.handle} />
            <Handle type="target" position={Position.Left} id="left" className={styles.handle} />

            <div className={`${styles.outerCircle} ${isActive ? styles.simulationActive : ''}`}>
                <div className={data.flowFinal ? styles.cross : styles.innerCircle} />
            </div>
        </div>
    );
}

export default memo(SysMLFinalNode);
