import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import styles from './SysMLPseudoStateNode.module.css';

type PseudoStateType = 'history' | 'deepHistory' | 'entryPoint' | 'exitPoint' | 'terminate' | 'junction';

interface PseudoStateData {
    label?: string;
    pseudoType?: PseudoStateType;
}

const SysMLPseudoStateNode = ({ data, type, selected }: NodeProps) => {
    const pseudoData = data as PseudoStateData;

    // Auto-detect pseudoType from node type if not explicitly set
    const getPseudoType = (): PseudoStateType => {
        if (pseudoData.pseudoType) return pseudoData.pseudoType;
        // Infer from node type (e.g., 'sysmlHistory' -> 'history')
        if (type === 'sysmlHistory') return 'history';
        if (type === 'sysmlDeepHistory') return 'deepHistory';
        if (type === 'sysmlEntryPoint') return 'entryPoint';
        if (type === 'sysmlExitPoint') return 'exitPoint';
        return 'history'; // Default
    };

    const pseudoType = getPseudoType();

    const getClassName = () => {
        switch (pseudoType) {
            case 'history':
            case 'deepHistory':
                return styles.history;
            case 'entryPoint':
                return styles.entryPoint;
            case 'exitPoint':
                return styles.exitPoint;
            case 'terminate':
                return styles.terminate;
            case 'junction':
                return styles.junction;
            default:
                return styles.history;
        }
    };

    const getLabel = () => {
        switch (pseudoType) {
            case 'history':
                return 'H';
            case 'deepHistory':
                return 'H*';
            case 'entryPoint':
            case 'exitPoint':
            case 'terminate':
            case 'junction':
                return '';
            default:
                return '';
        }
    };

    return (
        <div className={`${styles.pseudoStateNode} ${getClassName()} ${selected ? styles.selected : ''}`}>
            {getLabel()}

            {/* Handles for Transitions */}
            <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Top} style={{ opacity: 0 }} />
            <Handle type="target" position={Position.Bottom} style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
            <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Left} style={{ opacity: 0 }} />
            <Handle type="target" position={Position.Right} style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
        </div>
    );
};

export default memo(SysMLPseudoStateNode);
