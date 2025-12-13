'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import styles from './SysMLSignalNode.module.css';

interface SignalNodeData {
    label: string;
    signalType: 'send' | 'accept';
    signalName?: string;
    isSimulationActive?: boolean;
}

function SysMLSignalNode({ data, selected }: { data: SignalNodeData; selected: boolean }) {
    const isSend = data.signalType === 'send';
    const isActive = data.isSimulationActive || false;

    return (
        <div className={`${styles.signalNode} ${isSend ? styles.send : styles.accept} ${isActive ? styles.simulationActive : ''}`}>
            {/* Control Flow Handles */}
            <Handle type="target" position={Position.Top} id="top" className={styles.handle} />
            <Handle type="target" position={Position.Left} id="left" className={styles.handle} />

            <div className={styles.content}>
                <div className={styles.label}>{data.label || (isSend ? 'Send' : 'Accept')}</div>
                {data.signalName && (
                    <div className={styles.signalName}>{data.signalName}</div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} id="bottom" className={styles.handle} />
            <Handle type="source" position={Position.Right} id="right" className={styles.handle} />
        </div>
    );
}

export default memo(SysMLSignalNode);
