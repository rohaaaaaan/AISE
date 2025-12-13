'use client';

import { memo, useMemo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import styles from './SysMLConstraintBlockNode.module.css';

interface ConstraintBlockData {
    label: string;
    equation?: string;
    parameters?: string[];
}

function SysMLConstraintBlockNode({ data, selected }: { data: ConstraintBlockData; selected: boolean }) {
    // Normalize parameters to strings (handle both string and object formats)
    const parameters = useMemo(() => {
        const params = data.parameters || [];
        return params.map((param: any) => {
            if (typeof param === 'string') return param;
            if (typeof param === 'object' && param !== null) {
                return `${param.name || ''}${param.type ? `: ${param.type}` : ''}`;
            }
            return String(param);
        });
    }, [data.parameters]);

    // Split parameters between left (first half) and right (second half)
    const leftParams = useMemo(() => parameters.slice(0, Math.ceil(parameters.length / 2)), [parameters]);
    const rightParams = useMemo(() => parameters.slice(Math.ceil(parameters.length / 2)), [parameters]);

    return (
        <div className={styles.constraintBlock}>
            <NodeResizer
                minWidth={180}
                minHeight={100}
                isVisible={selected}
                lineClassName={styles.resizerLine}
                handleClassName={styles.resizerHandle}
            />

            {/* Top/Bottom generic handles */}
            <Handle type="target" position={Position.Top} id="top" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: selected ? 1 : 0 }} />

            {/* Left Parameter Ports */}
            {leftParams.map((param, idx) => {
                const topPercent = ((idx + 1) / (leftParams.length + 1)) * 100;
                return (
                    <div key={`left-${idx}-${param}`} className={styles.parameterPortContainer} style={{ top: `${topPercent}%`, left: 0 }}>
                        <Handle
                            type="target"
                            position={Position.Left}
                            id={`param-${param}`}
                            className={styles.parameterPort}
                        />
                        <span className={styles.parameterLabel} style={{ left: '14px' }}>{param}</span>
                    </div>
                );
            })}

            {/* Right Parameter Ports */}
            {rightParams.map((param, idx) => {
                const topPercent = ((idx + 1) / (rightParams.length + 1)) * 100;
                return (
                    <div key={`right-${idx}-${param}`} className={styles.parameterPortContainer} style={{ top: `${topPercent}%`, right: 0 }}>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={`param-${param}`}
                            className={styles.parameterPort}
                        />
                        <span className={styles.parameterLabel} style={{ right: '14px' }}>{param}</span>
                    </div>
                );
            })}

            {/* Content */}
            <div className={styles.stereotype}>&laquo;constraint&raquo;</div>
            <div className={styles.header}>{data.label || 'Constraint'}</div>
            {data.equation && (
                <div className={styles.equation}>{data.equation}</div>
            )}
        </div>
    );
}

export default memo(SysMLConstraintBlockNode);
