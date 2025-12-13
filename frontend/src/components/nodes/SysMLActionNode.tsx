'use client';

import { memo, useMemo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import styles from './SysMLActionNode.module.css';

interface Pin {
    name: string;
    type?: string;
}

interface ActionNodeData {
    label: string;
    description?: string;
    inputPins?: Pin[];
    outputPins?: Pin[];
    isSimulationActive?: boolean;
}

function SysMLActionNode({ data, selected }: { data: ActionNodeData; selected: boolean }) {
    const inputPins = data.inputPins || [];
    const outputPins = data.outputPins || [];
    const isActive = data.isSimulationActive || false;

    return (
        <div className={`${styles.actionNode} ${isActive ? styles.simulationActive : ''}`}>
            <NodeResizer
                minWidth={120}
                minHeight={50}
                isVisible={selected}
                lineClassName={styles.resizerLine}
                handleClassName={styles.resizerHandle}
            />

            {/* Control Flow Handles - All 4 directions for flexible connections */}
            <Handle type="target" position={Position.Top} id="top" className={styles.controlHandle} />
            <Handle type="target" position={Position.Left} id="left" className={styles.controlHandle} />

            {/* Input Pins (Left side) */}
            {inputPins.map((pin, idx) => {
                const topPercent = ((idx + 1) / (inputPins.length + 1)) * 100;
                return (
                    <div key={`in-${idx}`} className={styles.pinContainer} style={{ top: `${topPercent}%`, left: 0 }}>
                        <Handle
                            type="target"
                            position={Position.Left}
                            id={`pin-in-${pin.name}`}
                            className={styles.pin}
                        />
                        <span className={styles.pinLabel} style={{ left: '12px' }}>{pin.name}</span>
                    </div>
                );
            })}

            <div className={styles.content}>
                {data.label || 'Action'}
            </div>

            {/* Output Pins (Right side) */}
            {outputPins.map((pin, idx) => {
                const topPercent = ((idx + 1) / (outputPins.length + 1)) * 100;
                return (
                    <div key={`out-${idx}`} className={styles.pinContainer} style={{ top: `${topPercent}%`, right: 0 }}>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={`pin-out-${pin.name}`}
                            className={styles.pin}
                        />
                        <span className={styles.pinLabel} style={{ right: '12px' }}>{pin.name}</span>
                    </div>
                );
            })}

            <Handle type="source" position={Position.Bottom} id="bottom" className={styles.controlHandle} />
            <Handle type="source" position={Position.Right} id="right" className={styles.controlHandle} />
        </div>
    );
}

export default memo(SysMLActionNode);
