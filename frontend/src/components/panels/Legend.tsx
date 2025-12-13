import React from 'react';
import styles from './Legend.module.css';

const portColors: Record<string, string> = {
    'Electrical': '#0000FF',
    'Mechanical': '#008000',
    'HeaterOperation': '#FF0000',
    'ValvesOperation': '#800080',
    'DataTransferOperation': '#FFA500',
    'UserInterface': '#90EE90',
    'GPRS': '#808080',
    'GPS': '#FFFF00',
    'SensorOperation': '#006400',
    'CANBus': '#A52A2A',
    'Ambience_Air': '#ADD8E6',
    'Sensor Status': '#FFC0CB',
    'Start Electricity': '#00FFFF',
    'Valves Status': '#FF00FF',
};

export function Legend() {
    return (
        <div className={styles.legend}>
            <div className={styles.title}>Ports Legend</div>
            {Object.entries(portColors).map(([label, color]) => (
                <div key={label} className={styles.item}>
                    <div className={styles.colorBox} style={{ backgroundColor: color }} />
                    <span className={styles.label}>{label}</span>
                </div>
            ))}

            <div className={styles.title} style={{ marginTop: 20 }}>Connector Types</div>
            <div className={styles.item}>
                <svg width="40" height="10" className={styles.connectorIcon}>
                    <line x1="0" y1="5" x2="40" y2="5" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5,5" />
                </svg>
                <span className={styles.label}>Classic CAN</span>
            </div>
            <div className={styles.item}>
                <svg width="40" height="10" className={styles.connectorIcon}>
                    <line x1="0" y1="5" x2="40" y2="5" stroke="#7c3aed" strokeWidth="3" />
                </svg>
                <span className={styles.label}>CAN FD</span>
            </div>
            <div className={styles.item}>
                <svg width="40" height="10" className={styles.connectorIcon}>
                    <line x1="0" y1="5" x2="40" y2="5" stroke="#dc2626" strokeWidth="2" strokeDasharray="10,5" />
                </svg>
                <span className={styles.label}>High Speed CAN</span>
            </div>
            <div className={styles.item}>
                <svg width="40" height="10" className={styles.connectorIcon}>
                    <line x1="0" y1="5" x2="40" y2="5" stroke="#3b82f6" strokeWidth="3" />
                </svg>
                <span className={styles.label}>Ethernet</span>
            </div>
            <div className={styles.item}>
                <svg width="40" height="10" className={styles.connectorIcon}>
                    <line x1="0" y1="5" x2="40" y2="5" stroke="#0891b2" strokeWidth="2" strokeDasharray="4,4" />
                </svg>
                <span className={styles.label}>LIN Bus</span>
            </div>
            <div className={styles.item}>
                <svg width="40" height="10" className={styles.connectorIcon}>
                    <line x1="0" y1="5" x2="40" y2="5" stroke="#059669" strokeWidth="2" strokeDasharray="2,2" />
                </svg>
                <span className={styles.label}>Low Speed CAN</span>
            </div>
        </div>
    );
}
