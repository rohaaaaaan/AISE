import React, { useCallback, useMemo, useEffect } from 'react';
import {
    BaseEdge,
    EdgeLabelRenderer,
    EdgeProps,
    Position,
    useReactFlow,
    getStraightPath,
    useEdges,
} from '@xyflow/react';
import { SYSML_CONNECTORS } from '@/config/sysml-connectors';
import { useEdgePathContext } from '@/context/EdgePathContext';

interface SysMLEdgeData extends Record<string, unknown> {
    connectorType?: string;
    itemFlow?: string;
    showDirection?: boolean;
    busType?: string;
    // User-controlled offset for the middle segment
    bendOffset?: number;
    // State Machine Transition properties
    trigger?: string;  // Event that triggers the transition
    guard?: string;    // Boolean condition [guard]
    effect?: string;   // Action executed / effect
}

/**
 * Custom Orthogonal Path Generator
 * Creates a 3-segment path with a movable middle segment.
 * Returns the SVG path string AND the anchor point position.
 */
function createOrthogonalPath(
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    sourcePosition: Position,
    targetPosition: Position,
    bendOffset: number = 0
): { path: string; anchorX: number; anchorY: number; labelX: number; labelY: number } {

    // Determine if we should route horizontally first or vertically first
    // Based on source/target positions
    const isSourceHorizontal = sourcePosition === Position.Left || sourcePosition === Position.Right;
    const isTargetHorizontal = targetPosition === Position.Left || targetPosition === Position.Right;

    let path: string;
    let anchorX: number;
    let anchorY: number;

    if (isSourceHorizontal && isTargetHorizontal) {
        // Both horizontal: Route like └─┐ or ┌─┘
        // Horizontal from source, vertical middle, horizontal to target
        const midX = (sourceX + targetX) / 2 + bendOffset;
        path = `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;
        anchorX = midX;
        anchorY = (sourceY + targetY) / 2;
    } else if (!isSourceHorizontal && !isTargetHorizontal) {
        // Both vertical (Top/Bottom): Route like ⌐ or └
        // Vertical from source, horizontal middle, vertical to target
        const midY = (sourceY + targetY) / 2 + bendOffset;
        path = `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;
        anchorX = (sourceX + targetX) / 2;
        anchorY = midY;
    } else if (isSourceHorizontal) {
        // Source horizontal, target vertical
        // Go horizontal from source, then turn to target
        const midX = targetX + bendOffset;
        path = `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;
        anchorX = midX;
        anchorY = (sourceY + targetY) / 2;
    } else {
        // Source vertical, target horizontal
        const midY = targetY + bendOffset;
        path = `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;
        anchorX = (sourceX + targetX) / 2;
        anchorY = midY;
    }

    // Label/center position
    const labelX = (sourceX + targetX) / 2;
    const labelY = (sourceY + targetY) / 2;

    return { path, anchorX, anchorY, labelX, labelY };
}

/**
 * Line intersection detection for bypass/jumps
 */
function getLineIntersection(
    p1: { x: number, y: number }, p2: { x: number, y: number },
    p3: { x: number, y: number }, p4: { x: number, y: number }
): { x: number, y: number } | null {
    const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
    if (Math.abs(d) < 0.001) return null; // Parallel

    const u = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
    const v = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;

    // Check if intersection is within both segments (with small margin)
    if (u > 0.05 && u < 0.95 && v > 0.05 && v < 0.95) {
        return {
            x: p1.x + u * (p2.x - p1.x),
            y: p1.y + u * (p2.y - p1.y),
        };
    }
    return null;
}

/**
 * Parse simple M L path to points
 */
function parsePathToSegments(path: string): { x: number, y: number }[] {
    const points: { x: number, y: number }[] = [];
    const commands = path.split(/(?=[ML])/);
    commands.forEach(cmd => {
        const type = cmd[0];
        if (type === 'M' || type === 'L') {
            const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number);
            if (coords.length >= 2 && !isNaN(coords[0])) {
                points.push({ x: coords[0], y: coords[1] });
            }
        }
    });
    return points;
}

/**
 * Add bypass arcs to path at intersection points
 */
function addBypassArcs(
    basePath: string,
    currentEdgeId: string,
    allEdges: { id: string; source: string; target: string; sourceX: number; sourceY: number; targetX: number; targetY: number }[]
): string {
    const myPoints = parsePathToSegments(basePath);
    if (myPoints.length < 2) return basePath;

    const jumpRadius = 8;
    const intersections: { segIndex: number, t: number, pt: { x: number, y: number } }[] = [];

    // Check each segment of current path against all segments of other edges
    for (let i = 0; i < myPoints.length - 1; i++) {
        const p1 = myPoints[i];
        const p2 = myPoints[i + 1];

        allEdges.forEach(otherEdge => {
            if (otherEdge.id === currentEdgeId) return;
            // Approximate other edge as straight line (simple case)
            const p3 = { x: otherEdge.sourceX, y: otherEdge.sourceY };
            const p4 = { x: otherEdge.targetX, y: otherEdge.targetY };

            const hit = getLineIntersection(p1, p2, p3, p4);
            if (hit) {
                const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                const hitDist = Math.hypot(hit.x - p1.x, hit.y - p1.y);
                const t = segLen > 0 ? hitDist / segLen : 0;
                intersections.push({ segIndex: i, t, pt: hit });
            }
        });
    }

    if (intersections.length === 0) return basePath;

    // Sort by segment then by t
    intersections.sort((a, b) => a.segIndex - b.segIndex || a.t - b.t);

    // Rebuild path with arcs
    let newPath = `M ${myPoints[0].x} ${myPoints[0].y}`;

    for (let i = 0; i < myPoints.length - 1; i++) {
        const p1 = myPoints[i];
        const p2 = myPoints[i + 1];
        const segIntersections = intersections.filter(int => int.segIndex === i);

        if (segIntersections.length === 0) {
            newPath += ` L ${p2.x} ${p2.y}`;
        } else {
            // Draw to each intersection with arc
            segIntersections.forEach(({ pt }) => {
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const len = Math.hypot(dx, dy);
                if (len === 0) return;
                const ux = dx / len;
                const uy = dy / len;

                const arcStart = { x: pt.x - ux * jumpRadius, y: pt.y - uy * jumpRadius };
                const arcEnd = { x: pt.x + ux * jumpRadius, y: pt.y + uy * jumpRadius };

                newPath += ` L ${arcStart.x} ${arcStart.y}`;
                newPath += ` A ${jumpRadius} ${jumpRadius} 0 0 1 ${arcEnd.x} ${arcEnd.y}`;
            });
            newPath += ` L ${p2.x} ${p2.y}`;
        }
    }

    return newPath;
}

export default function SysMLEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    targetPosition,
    sourcePosition,
    style = {},
    markerEnd,
    selected,
    data,
}: EdgeProps) {
    const { setEdges, screenToFlowPosition } = useReactFlow();
    const allEdges = useEdges();

    const edgeData = data as SysMLEdgeData;
    const connectorType = edgeData?.connectorType || 'standard';
    const itemFlow = edgeData?.itemFlow;
    const busType = edgeData?.busType;
    const bendOffset = edgeData?.bendOffset ?? 0;

    // Check if this is a Sequence Diagram connector
    const isSequence = ['sequenceSync', 'sequenceAsync', 'sequenceReply'].includes(connectorType);

    // Generate path based on type
    let basePath: string;
    let anchorX: number;
    let anchorY: number;
    let labelX: number;
    let labelY: number;

    if (isSequence) {
        // Use Straight Path for Sequence Messages
        [basePath, labelX, labelY] = getStraightPath({
            sourceX, sourceY, targetX, targetY
        });
        anchorX = labelX; // Center for anchor (not really used for straight)
        anchorY = labelY;
    } else {
        // Generate custom orthogonal path
        const res = createOrthogonalPath(
            sourceX, sourceY,
            targetX, targetY,
            sourcePosition, targetPosition,
            bendOffset
        );
        basePath = res.path;
        anchorX = res.anchorX;
        anchorY = res.anchorY;
        labelX = res.labelX;
        labelY = res.labelY;
    }

    // Parse current path to segments for bypass detection
    const mySegments = useMemo(() => parsePathToSegments(basePath), [basePath]);

    // Get context for path sharing
    const pathContext = useEdgePathContext();

    // Register this edge's path in the shared context
    useEffect(() => {
        if (pathContext) {
            pathContext.registerPath(id, mySegments);
            return () => pathContext.unregisterPath(id);
        }
    }, [id, mySegments, pathContext]);

    // Apply bypass arcs where this edge crosses other edges
    const edgePath = useMemo(() => {
        if (!pathContext) return basePath;

        const jumpRadius = 8;
        const intersections: { segIndex: number, t: number, pt: { x: number, y: number } }[] = [];
        const otherPaths = pathContext.getAllPaths();

        // Check each segment of current path against all segments of other edges
        for (let i = 0; i < mySegments.length - 1; i++) {
            const p1 = mySegments[i];
            const p2 = mySegments[i + 1];

            otherPaths.forEach(otherPath => {
                if (otherPath.id === id) return;

                // Check against each segment of other edge
                for (let j = 0; j < otherPath.segments.length - 1; j++) {
                    const p3 = otherPath.segments[j];
                    const p4 = otherPath.segments[j + 1];

                    const hit = getLineIntersection(p1, p2, p3, p4);
                    if (hit) {
                        const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                        const hitDist = Math.hypot(hit.x - p1.x, hit.y - p1.y);
                        const t = segLen > 0 ? hitDist / segLen : 0;
                        intersections.push({ segIndex: i, t, pt: hit });
                    }
                }
            });
        }

        // If no intersections detected, return base path
        if (intersections.length === 0) return basePath;

        // Build path with arcs
        intersections.sort((a, b) => a.segIndex - b.segIndex || a.t - b.t);
        let newPath = `M ${mySegments[0].x} ${mySegments[0].y}`;

        for (let i = 0; i < mySegments.length - 1; i++) {
            const p1 = mySegments[i];
            const p2 = mySegments[i + 1];
            const segInts = intersections.filter(int => int.segIndex === i);

            if (segInts.length === 0) {
                newPath += ` L ${p2.x} ${p2.y}`;
            } else {
                segInts.forEach(({ pt }) => {
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const len = Math.hypot(dx, dy);
                    if (len === 0) return;
                    const ux = dx / len;
                    const uy = dy / len;
                    const arcStart = { x: pt.x - ux * jumpRadius, y: pt.y - uy * jumpRadius };
                    const arcEnd = { x: pt.x + ux * jumpRadius, y: pt.y + uy * jumpRadius };
                    newPath += ` L ${arcStart.x} ${arcStart.y}`;
                    newPath += ` A ${jumpRadius} ${jumpRadius} 0 0 1 ${arcEnd.x} ${arcEnd.y}`;
                });
                newPath += ` L ${p2.x} ${p2.y}`;
            }
        }
        return newPath;
    }, [basePath, mySegments, id, pathContext]);

    // Drag handler for the anchor point
    const handleAnchorDrag = useCallback((evt: React.MouseEvent) => {
        evt.stopPropagation();
        evt.preventDefault();

        const startFlowPos = screenToFlowPosition({ x: evt.clientX, y: evt.clientY });
        const initialOffset = bendOffset;

        // Determine drag direction based on path orientation
        const isVerticalMiddle = Math.abs(sourceX - targetX) > Math.abs(sourceY - targetY);

        const onMouseMove = (moveEvt: MouseEvent) => {
            const currentFlowPos = screenToFlowPosition({ x: moveEvt.clientX, y: moveEvt.clientY });
            // Use appropriate axis based on middle segment orientation
            const delta = isVerticalMiddle
                ? currentFlowPos.y - startFlowPos.y  // Vertical middle segment → drag Y
                : currentFlowPos.x - startFlowPos.x; // Horizontal middle segment → drag X

            setEdges((eds) => eds.map((e) => {
                if (e.id === id) {
                    return {
                        ...e,
                        data: { ...e.data, bendOffset: initialOffset + delta }
                    };
                }
                return e;
            }));
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }, [id, setEdges, screenToFlowPosition, bendOffset, sourceX, targetX, sourceY, targetY]);

    // Styles and Labels based on connector type
    let edgeStyle: React.CSSProperties = { ...style };
    let label = '';

    const config = SYSML_CONNECTORS[connectorType];
    if (config) {
        if (config.style) {
            edgeStyle = { ...edgeStyle, ...config.style } as React.CSSProperties;
        }
        if (config.stereotype) {
            label = config.stereotype;
        }
    }

    // Dynamic CAN Overrides
    if (connectorType === 'can') {
        switch (busType) {
            case 'canfd':
                edgeStyle = { ...edgeStyle, stroke: '#7c3aed', strokeWidth: 3 };
                break;
            case 'highspeed':
                edgeStyle = { ...edgeStyle, stroke: '#dc2626', strokeWidth: 2, strokeDasharray: '10,5' };
                break;
            case 'lowspeed':
                edgeStyle = { ...edgeStyle, stroke: '#059669', strokeWidth: 2, strokeDasharray: '2,2' };
                break;
            default:
                if (!config?.style) {
                    edgeStyle = { ...edgeStyle, stroke: '#f59e0b', strokeWidth: 3, strokeDasharray: '5,5' };
                }
                break;
        }
    } else if (connectorType === 'binding' && !config) {
        edgeStyle = { ...edgeStyle, strokeWidth: 2, strokeDasharray: '5,5' };
        label = '<<binding>>';
    }

    // State Machine Transition Label Formatting
    const trigger = edgeData?.trigger as string;
    const guard = edgeData?.guard as string;
    const effect = edgeData?.effect as string;

    let transitionLabel = '';
    if (connectorType === 'transition') {
        // Format: trigger [guard] / effect
        const parts: string[] = [];
        if (trigger) parts.push(trigger);
        if (guard) parts.push(`[${guard}]`);
        if (effect) parts.push(`/ ${effect}`);
        transitionLabel = parts.join(' ');
        // If no structured data, fall back to regular label
        if (!transitionLabel && label) transitionLabel = label as string;
    }

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} interactionWidth={20} />
            <EdgeLabelRenderer>
                {/* Label at center */}
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        fontSize: 12,
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan"
                >
                    {label && connectorType !== 'binding' && connectorType !== 'transition' && (
                        <div style={{
                            background: '#222',
                            padding: '2px 5px',
                            borderRadius: 4,
                            color: '#fff',
                            fontSize: '11px',
                            marginBottom: 5
                        }}>
                            {label}
                        </div>
                    )}
                    {/* Transition Label with trigger [guard] / effect format */}
                    {connectorType === 'transition' && transitionLabel && (
                        <div style={{
                            background: '#1e1b4b',
                            padding: '3px 8px',
                            borderRadius: 4,
                            color: '#c7d2fe',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            border: '1px solid #4338ca',
                            marginBottom: 5
                        }}>
                            {transitionLabel}
                        </div>
                    )}
                    {connectorType === 'binding' && (
                        <div style={{ background: '#222', padding: '2px 5px', borderRadius: 4, color: '#fff', marginBottom: 5 }}>
                            {label}
                        </div>
                    )}
                    {itemFlow && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ fontSize: 16, color: '#fff', transform: 'rotate(90deg)' }}>➤</div>
                            <div style={{ background: '#222', padding: '2px 5px', borderRadius: 4, color: '#fff', marginTop: -5 }}>
                                «flow» {itemFlow}
                            </div>
                        </div>
                    )}
                </div>

                {/* ANCHOR POINT - Positioned exactly on the middle segment bend */}
                {selected && (
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${anchorX}px,${anchorY}px)`,
                            width: 14,
                            height: 14,
                            background: '#3b82f6',
                            border: '2px solid #fff',
                            borderRadius: '50%',
                            cursor: 'move',
                            pointerEvents: 'all',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                            zIndex: 100,
                        }}
                        className="nodrag nopan"
                        onMouseDown={handleAnchorDrag}
                        title="Drag to reshape connector"
                    />
                )}
            </EdgeLabelRenderer>
        </>
    );
}
