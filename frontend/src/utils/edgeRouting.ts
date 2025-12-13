import { Position, Node, Edge, getSmoothStepPath } from '@xyflow/react';

// Simple point interface
interface Point {
    x: number;
    y: number;
}

// Check if two line segments intersect
// s1: p1->p2, s2: p3->p4
// Returns intersection point or null
function getIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
    const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
    if (d === 0) return null; // Parallel

    const u = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
    const v = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;

    // Check if intersection is within segments
    // We use a small epsilon to avoid bridge at exact endpoints
    const EPS = 0.1; // Increased epsilon
    if (u >= EPS && u <= 1 - EPS && v >= EPS && v <= 1 - EPS) {
        return {
            x: p1.x + u * (p2.x - p1.x),
            y: p1.y + u * (p2.y - p1.y),
        };
    }
    return null;
}

// Convert SVG path 'M x y L x y ...' to array of points
function parsePathToPoints(path: string): Point[] {
    const points: Point[] = [];
    // Split commands (M, L, etc.)
    // Handle paths like "M 10 10 L 20 20"
    const commands = path.split(/(?=[MmLlHhVv])/);

    let currentX = 0;
    let currentY = 0;

    commands.forEach(cmd => {
        const type = cmd[0];
        const args = cmd.slice(1).trim().split(/[\s,]+/).map(Number);

        if (type === 'M' || type === 'L') {
            currentX = args[0];
            currentY = args[1];
            points.push({ x: currentX, y: currentY });
        }
        // We only handle M and L for now, which getSmoothStepPath returns
    });

    return points;
}

// Helper to calculate handle position roughly
// Used if we don't have exact handle info
function getNodeCenter(node: any): Point {
    const x = node.positionAbsolute?.x || node.position.x || 0;
    const y = node.positionAbsolute?.y || node.position.y || 0;
    const w = node.width || node.measured?.width || 0;
    const h = node.height || node.measured?.height || 0;
    return { x: x + w / 2, y: y + h / 2 };
}

// Main function to add jumps
export function addLineJumps(
    currentPath: string,
    currentEdge: Edge,
    otherEdges: Edge[],
    nodeInternals: Map<string, any> // React Flow internal node map
): string {
    // Parsing is expensive, so check basic bounds or count first?
    if (otherEdges.length === 0) return currentPath;

    const points = parsePathToPoints(currentPath);
    if (points.length < 2) return currentPath;

    // Pre-calculate other paths
    const otherPathsPoints: Point[][] = [];

    otherEdges.forEach(edge => {
        if (edge.id === currentEdge.id) return;

        const sourceNode = nodeInternals.get(edge.source);
        const targetNode = nodeInternals.get(edge.target);

        if (sourceNode && targetNode) {
            // Approximate handles (Center-Center for simplicity in jump calculation)
            // Or try to use handles if available?
            // SysML Ports are small, so Center is good enough.
            const sCenter = getNodeCenter(sourceNode);
            const tCenter = getNodeCenter(targetNode);

            // Generate simpler path (straight line) for checking? 
            // No, we need orthogonal path for accurate jumps.
            // Use getSmoothStepPath logic

            // Handle positions: simplified
            // We assume sourcePosition/targetPosition (Right/Left etc)
            // This requires guessing the handle configuration.

            const [path] = getSmoothStepPath({
                sourceX: sCenter.x,
                sourceY: sCenter.y,
                sourcePosition: Position.Right, // Default assumption
                targetX: tCenter.x,
                targetY: tCenter.y,
                targetPosition: Position.Left, // Default assumption
                borderRadius: 0
            });

            otherPathsPoints.push(parsePathToPoints(path));
        }
    });

    if (otherPathsPoints.length === 0) return currentPath;

    // Reconstruct Process
    let newPath = `M ${points[0].x} ${points[0].y}`;
    const jumpSize = 6; // Radius

    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];

        const intersections: { t: number, pt: Point }[] = [];

        otherPathsPoints.forEach(otherPoints => {
            for (let j = 0; j < otherPoints.length - 1; j++) {
                const p3 = otherPoints[j];
                const p4 = otherPoints[j + 1];

                const hit = getIntersection(p1, p2, p3, p4);
                if (hit) {
                    const distTotal = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                    const distHit = Math.hypot(hit.x - p1.x, hit.y - p1.y);
                    if (distTotal > 0) {
                        const t = distHit / distTotal;
                        intersections.push({ t, pt: hit });
                    }
                }
            }
        });

        intersections.sort((a, b) => a.t - b.t);

        if (intersections.length === 0) {
            newPath += ` L ${p2.x} ${p2.y}`;
        } else {
            let currentPos = p1;

            // De-duplicate close jumps
            const uniqueIntersections = intersections.filter((item, index, self) =>
                index === 0 || (item.t - self[index - 1].t) * Math.hypot(p2.x - p1.x, p2.y - p1.y) > jumpSize * 2.1
            );

            uniqueIntersections.forEach(({ pt }) => {
                let dirX = p2.x - p1.x;
                let dirY = p2.y - p1.y;
                const len = Math.hypot(dirX, dirY);
                if (len === 0) return;
                dirX /= len;
                dirY /= len;

                const jumpStart = {
                    x: pt.x - dirX * jumpSize,
                    y: pt.y - dirY * jumpSize
                };

                const jumpEnd = {
                    x: pt.x + dirX * jumpSize,
                    y: pt.y + dirY * jumpSize
                };

                newPath += ` L ${jumpStart.x} ${jumpStart.y}`;
                // Standard arc flag: 0 0 1 means "small arc", sweep positive
                newPath += ` A ${jumpSize} ${jumpSize} 0 0 1 ${jumpEnd.x} ${jumpEnd.y}`;
            });

            newPath += ` L ${p2.x} ${p2.y}`;
        }
    }

    return newPath;
}
