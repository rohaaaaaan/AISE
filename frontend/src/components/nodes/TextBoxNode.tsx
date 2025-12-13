import React, { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import styles from './TextBoxNode.module.css';

interface TextBoxData {
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    textColor?: string;
    backgroundColor?: string;
    borderColor?: string;
    variant?: 'default' | 'note' | 'comment' | 'transparent' | 'bordered';
}

const TextBoxNode = ({ data, selected, id }: NodeProps) => {
    const textData = data as TextBoxData;
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(textData.text || '');
    const contentRef = useRef<HTMLDivElement>(null);

    // Sync with external data changes
    useEffect(() => {
        if (!isEditing && textData.text !== text) {
            setText(textData.text || '');
        }
    }, [textData.text, isEditing]);

    const handleDoubleClick = () => {
        setIsEditing(true);
        // Focus the content div after a short delay
        setTimeout(() => {
            contentRef.current?.focus();
        }, 0);
    };

    const handleBlur = () => {
        setIsEditing(false);
        // Trigger a custom event or callback to save the text
        if (contentRef.current) {
            const newText = contentRef.current.innerText;
            // This will be handled by the parent to update node data
            const event = new CustomEvent('textBoxUpdate', {
                detail: { nodeId: id, text: newText }
            });
            window.dispatchEvent(event);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Exit editing on Escape
        if (e.key === 'Escape') {
            setIsEditing(false);
            contentRef.current?.blur();
        }
        // Prevent node deletion while editing
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.stopPropagation();
        }
    };

    // Build class names
    const variant = textData.variant || 'default';
    const classNames = [
        styles.textBoxNode,
        selected ? styles.selected : '',
        isEditing ? styles.editing : '',
        styles[variant] || ''
    ].filter(Boolean).join(' ');

    // Build inline styles
    const contentStyle: React.CSSProperties = {
        fontSize: textData.fontSize || 14,
        fontFamily: textData.fontFamily || 'inherit',
        fontWeight: textData.fontWeight || 'normal',
        fontStyle: textData.fontStyle || 'normal',
        color: textData.textColor || '#e5e7eb',
    };

    const nodeStyle: React.CSSProperties = {};
    if (textData.backgroundColor) {
        nodeStyle.backgroundColor = textData.backgroundColor;
    }
    if (textData.borderColor) {
        nodeStyle.borderColor = textData.borderColor;
    }

    return (
        <div
            className={classNames}
            style={nodeStyle}
            onDoubleClick={handleDoubleClick}
        >
            <NodeResizer
                minWidth={80}
                minHeight={30}
                isVisible={selected}
                lineStyle={{ border: '1px solid #3b82f6' }}
                handleStyle={{ width: 6, height: 6, borderRadius: 2 }}
            />

            <div
                ref={contentRef}
                className={styles.content}
                style={contentStyle}
                contentEditable={isEditing}
                suppressContentEditableWarning
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
            >
                {text}
            </div>

            {/* Minimal handles for optional connections */}
            <Handle type="target" position={Position.Top} style={{ opacity: 0, width: 10, height: 10 }} />
            <Handle type="source" position={Position.Bottom} style={{ opacity: 0, width: 10, height: 10 }} />
        </div>
    );
};

export default memo(TextBoxNode);
