'use client';

import { memo } from 'react';
import { NodeResizer } from '@xyflow/react';
import styles from './SysMLSwimlaneNode.module.css';

interface Lane {
    name: string;
    width?: number;
}

interface SwimlaneNodeData {
    label: string;
    lanes: Lane[];
}

function SysMLSwimlaneNode({ data, selected }: { data: SwimlaneNodeData; selected: boolean }) {
    const lanes = data.lanes || [{ name: 'Lane 1' }, { name: 'Lane 2' }];
    const laneWidth = 100 / lanes.length;

    return (
        <div className={styles.swimlaneNode}>
            <NodeResizer
                minWidth={200}
                minHeight={300}
                isVisible={selected}
                lineClassName={styles.resizerLine}
                handleClassName={styles.resizerHandle}
            />

            {/* Header with lane names */}
            <div className={styles.header}>
                {lanes.map((lane, idx) => (
                    <div
                        key={idx}
                        className={styles.laneHeader}
                        style={{ width: `${laneWidth}%` }}
                    >
                        {lane.name}
                    </div>
                ))}
            </div>

            {/* Lane body with vertical separators */}
            <div className={styles.body}>
                {lanes.map((lane, idx) => (
                    <div
                        key={idx}
                        className={styles.lane}
                        style={{ width: `${laneWidth}%` }}
                    >
                        {/* Lane content area - actions can be placed here */}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default memo(SysMLSwimlaneNode);
