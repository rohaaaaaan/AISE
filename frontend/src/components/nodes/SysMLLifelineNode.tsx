import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import styles from './SysMLLifelineNode.module.css';

const SysMLLifelineNode = ({ data, selected }: NodeProps) => {
    return (
        <div className={`${styles.lifelineNode} ${selected ? styles.selected : ''}`}>
            <NodeResizer
                minWidth={100}
                minHeight={100}
                isVisible={selected}
                lineStyle={{ border: '1px solid #3b82f6' }}
                handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
            />

            {/* Lifeline Head (Participant) */}
            <div className={styles.head}>
                <strong>{data.label as string || 'Lifeline'}</strong>
            </div>

            {/* The Timeline Line */}
            <div className={styles.timeline}></div>

            {/* 
               Invisible handles for connecting messages.
               We place handles along the center line.
               Since we want connections anywhere, we might need a custom edge or just a few handles.
               For V1, let's place a generic Target/Source handle that spans the verticality 
               or multiple distinct handles? 
               
               Actually, standard React Flow philosophy: 
               We can place a Source and Target connector mostly for 'center' to 'center' connections, 
               and the edge path calculator `getSmartEdge` or similar can handle the visual "attach to line" logic.
               
               However, sequence diagrams usually attach to specific "Activation Bars" or points.
               For simplicity V1: One source/target handle at the top/center that allows connections.
            */}

            {/* 
                We use 'target' and 'source' handles. 
                Position Left and Right allow side connections.
            */}
            <Handle
                type="target"
                position={Position.Top}
                style={{ top: '50%', left: '50%', opacity: 0, width: 20, height: '100%', borderRadius: 0 }}
                isConnectable={true}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                style={{ top: '50%', left: '50%', opacity: 0, width: 20, height: '100%', borderRadius: 0 }}
                id="bottom"
                isConnectable={true}
            />

            {/* Side handles often help with orthogonal routing if we were using it */}
            <Handle
                type="target"
                position={Position.Left}
                style={{ opacity: 0, height: '100%', top: 0, borderRadius: 0 }}
                id="left-t"
            />
            <Handle
                type="source"
                position={Position.Right}
                style={{ opacity: 0, height: '100%', top: 0, borderRadius: 0 }}
                id="right-s"
            />
            <Handle
                type="target"
                position={Position.Right}
                style={{ opacity: 0, height: '100%', top: 0, borderRadius: 0 }}
                id="right-t"
            />
            <Handle
                type="source"
                position={Position.Left}
                style={{ opacity: 0, height: '100%', top: 0, borderRadius: 0 }}
                id="left-s"
            />
        </div>
    );
};

export default memo(SysMLLifelineNode);
