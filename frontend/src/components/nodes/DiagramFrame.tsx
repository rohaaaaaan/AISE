'use client';

import React, { memo } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import styles from './DiagramFrame.module.css';

// SysML Diagram Types
const DIAGRAM_TYPES = [
    { value: 'bdd', label: 'Block Definition Diagram' },
    { value: 'ibd', label: 'Internal Block Diagram' },
    { value: 'act', label: 'Activity Diagram' },
    { value: 'req', label: 'Requirement Diagram' },
    { value: 'par', label: 'Parametric Diagram' },
    { value: 'pkg', label: 'Package Diagram' },
    { value: 'stm', label: 'State Machine Diagram' },
    { value: 'uc', label: 'Use Case Diagram' },
    { value: 'sd', label: 'Sequence Diagram' },
];

interface DiagramFrameData {
    diagramType?: string;
    elementType?: string;
    elementName?: string;
    diagramName?: string;
}

function DiagramFrame({ data, selected }: NodeProps) {
    const frameData = data as DiagramFrameData;

    const diagramType = frameData.diagramType || 'bdd';
    const elementType = frameData.elementType || 'Package';
    const elementName = frameData.elementName || 'Model';
    const diagramName = frameData.diagramName || 'New Diagram';

    // Format: "bdd [Package] ModelName [ DiagramName ]"
    const headerText = `${diagramType} [${elementType}] ${elementName} [ ${diagramName} ]`;

    return (
        <div className={styles.diagramFrame}>
            {/* Resizer needs pointer-events enabled */}
            <NodeResizer
                color="#b8860b"
                isVisible={selected}
                minWidth={400}
                minHeight={300}
                handleStyle={{ pointerEvents: 'auto' }}
                lineStyle={{ pointerEvents: 'none' }}
            />

            {/* Diagram Frame Header */}
            <div className={styles.frameHeader}>
                <span className={styles.headerText}>{headerText}</span>
            </div>

            {/* Frame Border Pentagon Tab */}
            <div className={styles.headerTab} />

            {/* Frame Content Area (transparent) */}
            <div className={styles.frameContent} />
        </div>
    );
}

export default memo(DiagramFrame);
