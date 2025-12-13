'use client';

import styles from './Toolbar.module.css';


interface ToolbarProps {
  connectionType: string;
  onConnectionTypeChange: (type: string) => void;
  snapToGrid: boolean;
  onSnapToGridChange: (value: boolean) => void;
  onSave: () => void;
  onLoad: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
}

export function Toolbar({
  connectionType,
  onConnectionTypeChange,
  snapToGrid,
  onSnapToGridChange,
  onSave,
  onLoad,
  onExportPng,
  onExportSvg
}: ToolbarProps) {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={styles.toolbar}>
      {/* Node Types */}
      <div className={styles.nodeType} onDragStart={(event) => onDragStart(event, 'default')} draggable>
        System
      </div>
      <div className={styles.nodeType} onDragStart={(event) => onDragStart(event, 'ecu')} draggable>
        ECU
      </div>
      <div className={styles.nodeType} onDragStart={(event) => onDragStart(event, 'sensor')} draggable>
        Sensor
      </div>
      <div className={styles.nodeType} onDragStart={(event) => onDragStart(event, 'actuator')} draggable>
        Actuator
      </div>
      <div className={styles.nodeType} onDragStart={(event) => onDragStart(event, 'gateway')} draggable>
        Gateway
      </div>
      <div className={styles.nodeType} onDragStart={(event) => onDragStart(event, 'sysmlBlock')} draggable>
        SysML Block
      </div>
      <div className={styles.nodeType} onDragStart={(event) => onDragStart(event, 'sysmlPort')} draggable>
        SysML Port
      </div>
      <div className={styles.nodeType} onDragStart={(event) => onDragStart(event, 'sysmlRequirement')} draggable>
        SysML Requirement
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '30px', backgroundColor: 'var(--border)' }} />

      {/* Connection Type */}
      <select
        value={connectionType}
        onChange={(e) => onConnectionTypeChange(e.target.value)}
        style={{
          padding: '0.4rem 0.75rem',
          backgroundColor: 'var(--input)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          color: 'var(--foreground)',
          fontSize: '0.8rem'
        }}
      >
        <option value="default">Default</option>
        <option value="can">CAN</option>
        <option value="ethernet">Ethernet</option>
        <option value="lin">LIN</option>
        <option value="composition">Composition</option>
        <option value="aggregation">Aggregation</option>
        <option value="generalization">Generalization</option>
        <option value="itemFlow">Item Flow</option>
        <option value="satisfy">Satisfy</option>
        <option value="verify">Verify</option>
        <option value="derive">Derive</option>
        <option value="refine">Refine</option>
      </select>

      {/* Snap to Grid */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
        <input
          type="checkbox"
          checked={snapToGrid}
          onChange={(e) => onSnapToGridChange(e.target.checked)}
          style={{ cursor: 'pointer' }}
        />
        Snap
      </label>

      {/* Divider */}
      <div style={{ width: '1px', height: '30px', backgroundColor: 'var(--border)' }} />

      {/* Action Buttons */}
      <button onClick={onSave} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer' }}>
        Save
      </button>
      <button onClick={onLoad} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', backgroundColor: 'var(--input)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer' }}>
        Load
      </button>
      <button onClick={onExportPng} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', backgroundColor: 'var(--input)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer' }}>
        PNG
      </button>
      <button onClick={onExportSvg} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', backgroundColor: 'var(--input)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer' }}>
        SVG
      </button>
    </div>
  );
}
