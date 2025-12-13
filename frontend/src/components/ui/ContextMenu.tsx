'use client';

import { useEffect, useRef } from 'react';
import { Copy, Trash2, ArrowUp, ArrowDown, Lock, Unlock, RotateCw, FileText, Clipboard, Layers, PlusCircle, Grid } from 'lucide-react';
import styles from './ContextMenu.module.css';

export interface ContextMenuItem {
    label: string;
    icon?: React.ReactNode;
    shortcut?: string;
    onClick: () => void;
    disabled?: boolean;
}

interface ContextMenuProps {
    x: number;
    y: number;
    type: 'node' | 'edge' | 'canvas';
    target?: any;
    onClose: () => void;
    // Node actions
    onDelete: (id: string) => void;
    onDuplicate: (node: any) => void;
    onBringToFront?: (id: string) => void;
    onSendToBack?: (id: string) => void;
    onToggleLock?: (id: string) => void;
    // Edge actions
    onReverseEdge?: (id: string) => void;
    // Canvas actions
    onPaste?: (x: number, y: number) => void;
    onAddTextBox?: (x: number, y: number) => void;
    onAddDiagramFrame?: (x: number, y: number) => void;
    onSelectAll?: () => void;
    onFitView?: () => void;
    onToggleGrid?: () => void;
    // Clipboard state
    hasClipboard?: boolean;
    gridEnabled?: boolean;
}

export function ContextMenu({
    x, y, type, target, onClose,
    onDelete, onDuplicate,
    onBringToFront, onSendToBack, onToggleLock,
    onReverseEdge,
    onPaste, onAddTextBox, onAddDiagramFrame, onSelectAll, onFitView, onToggleGrid,
    hasClipboard, gridEnabled
}: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const items: (ContextMenuItem | 'separator')[] = [];

    if (type === 'node') {
        // Duplicate
        items.push({
            label: 'Duplicate',
            icon: <Copy size={14} />,
            onClick: () => onDuplicate(target),
            shortcut: 'Ctrl+D'
        });

        items.push('separator');

        // Z-index controls
        if (onBringToFront) {
            items.push({
                label: 'Bring to Front',
                icon: <ArrowUp size={14} />,
                onClick: () => onBringToFront(target.id),
                shortcut: 'Ctrl+]'
            });
        }
        if (onSendToBack) {
            items.push({
                label: 'Send to Back',
                icon: <ArrowDown size={14} />,
                onClick: () => onSendToBack(target.id),
                shortcut: 'Ctrl+['
            });
        }

        // Lock/Unlock
        if (onToggleLock) {
            const isLocked = target?.data?.locked;
            items.push({
                label: isLocked ? 'Unlock' : 'Lock',
                icon: isLocked ? <Unlock size={14} /> : <Lock size={14} />,
                onClick: () => onToggleLock(target.id),
                shortcut: 'Ctrl+L'
            });
        }

        items.push('separator');

        // Delete
        items.push({
            label: 'Delete',
            icon: <Trash2 size={14} />,
            onClick: () => onDelete(target.id),
            shortcut: 'Del'
        });

    } else if (type === 'edge') {
        // Reverse Direction
        if (onReverseEdge) {
            items.push({
                label: 'Reverse Direction',
                icon: <RotateCw size={14} />,
                onClick: () => onReverseEdge(target.id),
            });
        }

        items.push('separator');

        // Delete
        items.push({
            label: 'Delete',
            icon: <Trash2 size={14} />,
            onClick: () => onDelete(target.id),
            shortcut: 'Del'
        });

    } else {
        // Canvas context menu
        if (onPaste) {
            items.push({
                label: 'Paste',
                icon: <Clipboard size={14} />,
                onClick: () => onPaste(x, y),
                shortcut: 'Ctrl+V',
                disabled: !hasClipboard
            });
        }

        items.push('separator');

        if (onAddTextBox) {
            items.push({
                label: 'Add Note',
                icon: <FileText size={14} />,
                onClick: () => onAddTextBox(x, y),
            });
        }

        if (onAddDiagramFrame) {
            items.push({
                label: 'Add Diagram Frame',
                icon: <Layers size={14} />,
                onClick: () => onAddDiagramFrame(x, y),
            });
        }

        items.push('separator');

        if (onSelectAll) {
            items.push({
                label: 'Select All',
                icon: <PlusCircle size={14} />,
                onClick: onSelectAll,
                shortcut: 'Ctrl+A'
            });
        }

        if (onFitView) {
            items.push({
                label: 'Fit View',
                icon: <Layers size={14} />,
                onClick: onFitView,
            });
        }

        if (onToggleGrid) {
            items.push({
                label: gridEnabled ? 'Hide Grid' : 'Show Grid',
                icon: <Grid size={14} />,
                onClick: onToggleGrid,
            });
        }
    }

    return (
        <div
            ref={menuRef}
            className={styles.contextMenu}
            style={{ left: x, top: y }}
        >
            {items.map((item, index) => {
                if (item === 'separator') {
                    return <div key={`sep-${index}`} className={styles.separator} />;
                }

                return (
                    <div
                        key={index}
                        className={`${styles.menuItem} ${item.disabled ? styles.disabled : ''}`}
                        onClick={() => {
                            if (!item.disabled) {
                                item.onClick();
                                onClose();
                            }
                        }}
                    >
                        {item.icon && <div className={styles.menuIcon}>{item.icon}</div>}
                        <span>{item.label}</span>
                        {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
                    </div>
                );
            })}
        </div>
    );
}
