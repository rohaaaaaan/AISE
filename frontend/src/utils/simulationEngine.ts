'use client';

import { create, all } from 'mathjs';
import { Node, Edge } from '@xyflow/react';

// Create a mathjs instance
const math = create(all);

export interface ValueProperty {
    name: string;
    value: number;
    unit?: string;
}

export interface SimulationResult {
    nodeId: string;
    nodeName: string;
    parameter: string;
    value: number;
    isCalculated: boolean;
}

/**
 * Gets numeric values from a block's value properties
 */
function getBlockValues(node: Node): Record<string, number> {
    const values: Record<string, number> = {};
    const nodeValues = node.data?.values as (string | ValueProperty)[] | undefined;

    if (Array.isArray(nodeValues)) {
        nodeValues.forEach(v => {
            if (typeof v === 'string') {
                // Parse "name = value" or "name: value" or "name=value" format
                const match = v.match(/^(\w+)\s*[=:]\s*([\d.]+)/);
                if (match) {
                    values[match[1]] = parseFloat(match[2]);
                }
            } else if (typeof v === 'object' && v.name && v.value !== undefined) {
                values[v.name] = v.value;
            }
        });
    }

    return values;
}

/**
 * Finds blocks connected to a constraint via binding edges
 */
function findConnectedBlocks(constraintId: string, nodes: Node[], edges: Edge[]): Node[] {
    const connectedBlockIds = new Set<string>();

    edges.forEach(edge => {
        if (edge.type === 'binding') {
            if (edge.source === constraintId) {
                connectedBlockIds.add(edge.target);
            } else if (edge.target === constraintId) {
                connectedBlockIds.add(edge.source);
            }
        }
    });

    return nodes.filter(n => connectedBlockIds.has(n.id) && n.type !== 'sysmlConstraintBlock');
}

/**
 * Main simulation function - evaluates all constraint equations
 */
export function runSimulation(nodes: Node[], edges: Edge[]): SimulationResult[] {
    const results: SimulationResult[] = [];
    const constraintBlocks = nodes.filter(n => n.type === 'sysmlConstraintBlock');

    console.log('=== Simulation Debug ===');
    console.log('Constraint blocks:', constraintBlocks.length);

    constraintBlocks.forEach(constraint => {
        const equation = (constraint.data?.equation as string) || '';
        const params = (constraint.data?.parameters as string[]) || [];
        const constraintName = (constraint.data?.label as string) || 'Constraint';

        console.log(`Processing constraint: ${constraintName}, equation: ${equation}`);

        if (!equation) {
            console.log('No equation, skipping');
            return;
        }

        // Find all blocks connected to this constraint
        const connectedBlocks = findConnectedBlocks(constraint.id, nodes, edges);
        console.log('Connected blocks:', connectedBlocks.map(b => b.data?.label));

        // Gather all values from connected blocks
        const allBlockValues: Record<string, number> = {};
        connectedBlocks.forEach(block => {
            const blockValues = getBlockValues(block);
            console.log(`Block ${block.data?.label} values:`, blockValues);
            Object.assign(allBlockValues, blockValues);
        });

        console.log('All available values:', allBlockValues);

        // Build scope for math.js evaluation
        // Match constraint parameters to block values by name
        const scope: Record<string, number> = {};
        params.forEach(param => {
            if (allBlockValues[param] !== undefined) {
                scope[param] = allBlockValues[param];
                console.log(`Bound param ${param} = ${allBlockValues[param]}`);
            }
        });

        console.log('Scope for evaluation:', scope);

        // Try to solve the equation
        try {
            // Parse equation (e.g., "F = m * a" or "F=m*a")
            const [leftSide, rightSide] = equation.split('=').map(s => s.trim());

            if (leftSide && rightSide) {
                console.log(`Evaluating: ${rightSide} with scope:`, scope);

                // Evaluate right side
                const result = math.evaluate(rightSide, scope);
                console.log(`Result: ${result}`);

                results.push({
                    nodeId: constraint.id,
                    nodeName: constraintName,
                    parameter: leftSide,
                    value: typeof result === 'number' ? result : parseFloat(result.toString()),
                    isCalculated: true
                });
            }
        } catch (err) {
            console.warn(`Could not evaluate equation "${equation}":`, err);
            results.push({
                nodeId: constraint.id,
                nodeName: constraintName,
                parameter: 'Error',
                value: 0,
                isCalculated: false
            });
        }
    });

    console.log('Final results:', results);
    return results;
}

/**
 * Validates if an equation is syntactically correct
 */
export function validateEquation(equation: string): { valid: boolean; error?: string } {
    try {
        const [leftSide, rightSide] = equation.split('=').map(s => s.trim());
        if (!leftSide || !rightSide) {
            return { valid: false, error: 'Equation must be in format: result = expression' };
        }
        // Try to parse the right side
        math.parse(rightSide);
        return { valid: true };
    } catch (err) {
        return { valid: false, error: (err as Error).message };
    }
}
