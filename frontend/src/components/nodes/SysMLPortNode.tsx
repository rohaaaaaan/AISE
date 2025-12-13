import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import styles from './SysMLPortNode.module.css';

interface SysMLPortData extends Record<string, unknown> {
    label?: string;
    portType?: string;
    sysmlType?: 'proxy' | 'full' | 'standard';
    direction?: 'in' | 'out' | 'inout' | 'none';
    isGhost?: boolean;
    isSimulinkPort?: boolean;
}

type SysMLPortNodeType = Node<SysMLPortData>;

function SysMLPortNode({ data, selected }: NodeProps<SysMLPortNodeType>) {
    const portColors: Record<string, string> = {
        'Electrical': '#0000FF', // Blue
        'Mechanical': '#008000', // Green
        'HeaterOperation': '#FF0000', // Red
        'ValvesOperation': '#800080', // Purple
        'DataTransferOperation': '#FFA500', // Orange
        'UserInterface': '#90EE90', // Light Green
        'GPRS': '#808080', // Gray
        'GPS': '#FFFF00', // Yellow
        'SensorOperation': '#006400', // Dark Green
        'CANBus': '#A52A2A', // Brown
        'Ambience_Air': '#ADD8E6', // Light Blue
        'Sensor Status': '#FFC0CB', // Pink
        'Start Electricity': '#00FFFF', // Cyan
        'Valves Status': '#FF00FF', // Magenta
        'default': '#ffffff'
    };

    const portType = data.portType || 'default';
    // Use specific color if portType is known, otherwise default to white (or gray for full ports)
    let backgroundColor = portColors[portType] || portColors['default'];

    const isGhost = !!data.isGhost;
    const isSimulinkPort = !!data.isSimulinkPort;

    if (isGhost && !isSimulinkPort) {
        backgroundColor = 'transparent';
    } else if (isSimulinkPort) {
        backgroundColor = '#f4f4f4'; // Light grey/white for Simulink blocks
    }

    const sysmlType = data.sysmlType || 'standard'; // 'proxy', 'full', 'standard'
    const direction = data.direction || 'none'; // 'in', 'out', 'inout'

    // Override background for Full ports if no specific domain color is set, or mix it?
    // For now, let's let the CSS class handle the border/style, and keep color for domain.

    const classes = [styles.sysmlPort];
    if (sysmlType === 'proxy') classes.push(styles.proxy);
    if (sysmlType === 'full') classes.push(styles.full);
    if (isGhost) classes.push(styles.ghost);
    if (isSimulinkPort) classes.push(styles.simulinkPort);

    const side = data.side as string || 'Left'; // Default to Left if unknown

    // Direction Symbol Logic
    // In = Entering the block
    // Out = Leaving the block
    let directionSymbol = null;

    if (direction === 'in') {
        if (side === 'Left') directionSymbol = '→';
        else if (side === 'Right') directionSymbol = '←';
        else if (side === 'Top') directionSymbol = '↓';
        else if (side === 'Bottom') directionSymbol = '↑';
        else directionSymbol = '→'; // Default
    } else if (direction === 'out') {
        if (side === 'Left') directionSymbol = '←';
        else if (side === 'Right') directionSymbol = '→';
        else if (side === 'Top') directionSymbol = '↑';
        else if (side === 'Bottom') directionSymbol = '↓';
        else directionSymbol = '←'; // Default
    } else if (direction === 'inout') {
        if (side === 'Top' || side === 'Bottom') directionSymbol = '↕';
        else directionSymbol = '↔';
    }

    // Explicit Visual Arrow Override
    if (data.symbol) {
        directionSymbol = data.symbol as string;
    }

    return (
        <div
            className={classes.join(' ')}
            style={{
                borderRadius: isSimulinkPort ? '20px' : '0px',
                padding: isSimulinkPort ? '5px 15px' : '0px',
                minWidth: isSimulinkPort ? '80px' : 'auto',
                textAlign: 'center',

                borderColor: selected ? 'var(--primary)' : isGhost && !isSimulinkPort ? '#999' : '#000',
                borderStyle: isGhost && !isSimulinkPort ? 'dashed' : 'solid',
                backgroundColor: backgroundColor,
                opacity: (isGhost && !isSimulinkPort) ? 0.8 : 1,
                boxShadow: isSimulinkPort ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
            }}
            title={`${portType} (${sysmlType} - ${direction})`}
        >
            {/* Handles for connections from all sides */}
            <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Top} id="top-source" style={{ opacity: 0 }} />

            <Handle type="target" position={Position.Left} id="left" style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Left} id="left-source" style={{ opacity: 0 }} />

            <Handle type="target" position={Position.Right} id="right" style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Right} id="right-source" style={{ opacity: 0 }} />

            <Handle type="target" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ opacity: 0 }} />

            {/* Direction Indicator */}
            {!isSimulinkPort && directionSymbol && <div className={styles.directionIcon}>{directionSymbol}</div>}

            {/* Optional label if provided */}
            {data.label && <div className={styles.label}>{String(data.label)}
                {(isGhost && !isSimulinkPort) && <span style={{ fontSize: '0.6em', display: 'block', fontWeight: 'normal' }}>(Internal)</span>}
                {isSimulinkPort && <span style={{ fontSize: '0.7em', display: 'block', color: '#666' }}>{direction === 'out' ? 'Output' : 'Input'}</span>}
            </div>}
            {/* Simulink arrow decorations */}
            {isSimulinkPort && direction === 'in' && <div style={{ position: 'absolute', right: '-8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px' }}>▶</div>}
            {isSimulinkPort && direction === 'out' && <div style={{ position: 'absolute', left: '-8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px' }}>▶</div>}
        </div>
    );
}

export default memo(SysMLPortNode);
