'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import styles from './SysMLDecisionNode.module.css';

interface DecisionNodeData {
    label?: string;
    condition?: string;
    isSimulationActive?: boolean;
}

function SysMLDecisionNode({ data, selected }: { data: DecisionNodeData; selected: boolean }) {
    const isActive = data.isSimulationActive || false;

    return (
        <div className={styles.decisionNode}>
            {/* Input from top/left */}
            <Handle type="target" position={Position.Top} id="top" className={styles.handle} />
            <Handle type="target" position={Position.Left} id="left" className={styles.handle} />

            {/* Diamond shape via CSS */}
            <div className={`${styles.diamond} ${isActive ? styles.simulationActive : ''}`}>
                {data.label && <span className={styles.label}>{data.label}</span>}
            </div>

            {/* Guard condition label */}
            {data.condition && (
                <div className={styles.condition}>[{data.condition}]</div>
            )}

            {/* Output to bottom/right */}
            <Handle type="source" position={Position.Bottom} id="bottom" className={styles.handle} />
            <Handle type="source" position={Position.Right} id="right" className={styles.handle} />
        </div>
    );
}

export default memo(SysMLDecisionNode);
