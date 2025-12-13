import React from 'react';
import { Plus, Trash2, Edit2, Box, Circle, FileText, Cpu } from 'lucide-react';

interface TreeContextMenuProps {
    x: number;
    y: number;
    nodeId: string;
    onClose: () => void;
    onAction: (action: string, nodeId: string) => void;
}

export function TreeContextMenu({ x, y, nodeId, onClose, onAction }: TreeContextMenuProps) {
    const handleAction = (action: string) => {
        onAction(action, nodeId);
        onClose();
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: y,
                left: x,
                zIndex: 1000,
                backgroundColor: '#1e1e1e',
                border: '1px solid #333',
                borderRadius: '4px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                padding: '4px',
                minWidth: '150px'
            }}
            onMouseLeave={onClose}
        >
            <div className="menu-item" onClick={() => handleAction('createBlock')} style={menuItemStyle}>
                <Box size={14} /> <span>Create Block</span>
            </div>
            <div className="menu-item" onClick={() => handleAction('createRequirement')} style={menuItemStyle}>
                <FileText size={14} /> <span>Create Requirement</span>
            </div>
            <div style={{ height: '1px', background: '#333', margin: '4px 0' }} />
            <div className="menu-item" onClick={() => handleAction('rename')} style={menuItemStyle}>
                <Edit2 size={14} /> <span>Rename</span>
            </div>
            <div className="menu-item" onClick={() => handleAction('delete')} style={{ ...menuItemStyle, color: '#ff6b6b' }}>
                <Trash2 size={14} /> <span>Delete</span>
            </div>
        </div>
    );
}

const menuItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    color: '#eee',
    cursor: 'pointer',
    borderRadius: '2px',
    transition: 'background 0.2s'
};
