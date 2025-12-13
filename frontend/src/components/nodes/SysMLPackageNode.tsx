import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import styles from './SysMLPackageNode.module.css';

interface PackageData {
    label?: string;
    stereotype?: string;  // e.g. «model», «library», «profile»
    uri?: string;         // Package namespace/URI
    members?: string[];   // List of contained elements (for display)
}

const SysMLPackageNode = ({ data, selected }: NodeProps) => {
    const packageData = data as PackageData;
    const label = packageData.label || 'Package';
    const stereotype = packageData.stereotype || 'package';
    const uri = packageData.uri;
    const members = packageData.members || [];

    return (
        <div className={`${styles.packageNode} ${selected ? styles.selected : ''}`}>
            <NodeResizer
                minWidth={150}
                minHeight={100}
                isVisible={selected}
                lineStyle={{ border: '1px solid #6366f1' }}
                handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
            />

            {/* Package Tab (Folder look) */}
            <div className={styles.packageTab}>pkg</div>

            {/* Header */}
            <div className={styles.header}>
                <span className={styles.stereotype}>«{stereotype}»</span>
                <span>{label}</span>
            </div>

            {/* Body - Member Elements */}
            {members.length > 0 && (
                <div className={styles.body}>
                    <ul className={styles.memberList}>
                        {members.map((member, idx) => (
                            <li key={idx} className={styles.member}>
                                <span className={styles.memberIcon}>□</span>
                                {member}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* URI (if specified) */}
            {uri && (
                <div className={styles.uri}>{uri}</div>
            )}

            {/* Handles for connections */}
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

export default memo(SysMLPackageNode);
