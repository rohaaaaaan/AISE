import React, { memo, useRef, useCallback } from 'react';
import { Handle, Position, NodeProps, NodeResizer, useReactFlow, Node } from '@xyflow/react';
import styles from './SysMLBlockNode.module.css';

interface SysMLBlockData extends Record<string, unknown> {
    label?: string;
    stereotype?: string;
    values?: string[];
    operations?: string[];
    parts?: string[];
    isIBDFrame?: boolean;
}

type SysMLBlockNodeType = Node<SysMLBlockData>;

function SysMLBlockNode({ id, data, selected }: NodeProps<SysMLBlockNodeType>) {
    const { setNodes, getNodes } = useReactFlow();
    const prevSize = useRef<{ w: number, h: number } | null>(null);

    const onResizeStart = useCallback((_: any, params: { width: number; height: number }) => {
        prevSize.current = { w: params.width, h: params.height };
    }, []);

    const onResize = useCallback((_: any, params: { width: number; height: number }) => {
        const { width: newW, height: newH } = params;
        if (!prevSize.current) {
            prevSize.current = { w: newW, h: newH };
            return;
        }

        const { w: oldW, h: oldH } = prevSize.current;

        // Update ports positions
        setNodes((nodes) => nodes.map((n) => {
            if (n.parentId !== id || n.type !== 'sysmlPort') return n;

            let { x, y } = n.position;
            const threshold = 10; // Detection threshold for "sticking"

            // Stick to Right
            // Check if it was on the old Right edge
            if (Math.abs(x - oldW) < threshold) {
                x = newW;
            } else if (Math.abs(x) >= threshold) {
                // If not on Left Edge (x ~ 0), scale X proportionally (e.g. Center Top port)
                x = x * (newW / oldW);
            }

            // Stick to Bottom
            // Check if it was on the old Bottom edge
            if (Math.abs(y - oldH) < threshold) {
                y = newH;
            } else if (Math.abs(y) >= threshold) {
                // If not on Top Edge (y ~ 0), scale Y proportionally (e.g. Center Left port)
                y = y * (newH / oldH);
            }

            return { ...n, position: { x, y } };
        }));

        prevSize.current = { w: newW, h: newH };
    }, [id, setNodes]);

    // Extract custom styling from data
    const customStyle: React.CSSProperties = {};
    if (data.backgroundColor) customStyle.backgroundColor = data.backgroundColor as string;
    if (data.borderColor) customStyle.borderColor = data.borderColor as string;

    const labelStyle: React.CSSProperties = {};
    if (data.labelFontSize) labelStyle.fontSize = `${data.labelFontSize}px`;
    if (data.labelColor) labelStyle.color = data.labelColor as string;

    return (
        <div className={styles.sysmlBlock} style={customStyle}>
            <NodeResizer
                color="#000"
                isVisible={selected}
                minWidth={100}
                minHeight={50}
                onResizeStart={onResizeStart}
                onResize={onResize}
            />

            {/* Handles - Visible only when selected or hovered (handled via CSS opacity if needed, but here we keep them functional) */}
            {/* We make them transparent by default to avoid visual clutter, but they are still interactive */}
            <Handle type="target" position={Position.Top} id="top" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Top} id="top-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />

            <Handle type="target" position={Position.Left} id="left" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Left} id="left-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />

            <div className={styles.header}>
                <div className={styles.stereotype}>&lt;&lt;{data.stereotype || 'block'}&gt;&gt;</div>
                <div className={styles.title} style={labelStyle}>{data.label as string}</div>
            </div>

            {/* If IBD Frame, we don't show the text compartments. We show the "diagram canvas" (empty space) */}
            {!data.isIBDFrame && (
                <div className={styles.compartment}>
                    <div className={styles.sectionTitle}>values</div>
                    {(data.values as any[])?.map((val, i) => {
                        // Handle both string and object formats
                        const displayText = typeof val === 'string'
                            ? val
                            : typeof val === 'object' && val !== null
                                ? `${val.name || ''}${val.type ? `: ${val.type}` : ''}${val.default ? ` = ${val.default}` : ''}${val.value ? ` = ${val.value}` : ''}`
                                : String(val);
                        return (
                            <div key={i} style={{ fontSize: '0.75rem', paddingLeft: '4px' }}>{displayText}</div>
                        );
                    })}

                    <div className={styles.separator} />

                    <div className={styles.sectionTitle}>operations</div>
                    {(data.operations as any[])?.map((op, i) => {
                        // Handle both string and object formats
                        const displayText = typeof op === 'string'
                            ? op
                            : typeof op === 'object' && op !== null
                                ? `${op.name || ''}(${op.params?.join(', ') || ''})${op.return ? `: ${op.return}` : ''}`
                                : String(op);
                        return (
                            <div key={i} style={{ fontSize: '0.75rem', paddingLeft: '4px' }}>{displayText}</div>
                        );
                    })}

                    <div className={styles.separator} />

                    <div className={styles.sectionTitle}>parts</div>
                    {(data.parts as any[])?.map((part, i) => {
                        // Handle both string and object formats
                        const displayText = typeof part === 'string'
                            ? part
                            : typeof part === 'object' && part !== null
                                ? `${part.name || part.label || ''}${part.type ? `: ${part.type}` : ''}`
                                : String(part);
                        return (
                            <div key={i} style={{ fontSize: '0.75rem', paddingLeft: '4px' }}>{displayText}</div>
                        );
                    })}
                </div>
            )}

            {/* If IBD Frame, just render a spacer or background if needed, but the container div handles the box */}
            {data.isIBDFrame && <div style={{ flex: 1, minHeight: '400px', background: '#fff' }} />}


            <Handle type="target" position={Position.Right} id="right" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Right} id="right-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />

            <Handle type="target" position={Position.Bottom} id="bottom" style={{ opacity: selected ? 1 : 0 }} />
            <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ background: 'transparent', opacity: selected ? 1 : 0 }} />
        </div >
    );
}

export default memo(SysMLBlockNode);
