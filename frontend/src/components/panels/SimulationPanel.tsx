'use client';

import { useState } from 'react';
import { Node, Edge } from '@xyflow/react';
import { Play, AlertCircle, CheckCircle, Calculator } from 'lucide-react';
import { runSimulation, SimulationResult } from '@/utils/simulationEngine';
import styles from './SimulationPanel.module.css';

interface SimulationPanelProps {
    nodes: Node[];
    edges: Edge[];
    onUpdateNodeValue?: (nodeId: string, valueName: string, newValue: number) => void;
}

export function SimulationPanel({ nodes, edges, onUpdateNodeValue }: SimulationPanelProps) {
    const [results, setResults] = useState<SimulationResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRunSimulation = () => {
        setIsRunning(true);
        setError(null);

        try {
            const simulationResults = runSimulation(nodes, edges);
            setResults(simulationResults);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsRunning(false);
        }
    };

    const constraintCount = nodes.filter(n => n.type === 'sysmlConstraintBlock').length;
    const bindingCount = edges.filter(e => e.type === 'binding').length;

    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <Calculator size={16} />
                <span>Simulation</span>
            </div>

            <div className={styles.stats}>
                <div className={styles.stat}>
                    <span className={styles.statValue}>{constraintCount}</span>
                    <span className={styles.statLabel}>Constraints</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statValue}>{bindingCount}</span>
                    <span className={styles.statLabel}>Bindings</span>
                </div>
            </div>

            <button
                className={styles.runButton}
                onClick={handleRunSimulation}
                disabled={isRunning || constraintCount === 0}
            >
                <Play size={14} />
                {isRunning ? 'Running...' : 'Run Simulation'}
            </button>

            {error && (
                <div className={styles.error}>
                    <AlertCircle size={14} />
                    {error}
                </div>
            )}

            {results.length > 0 && (
                <div className={styles.results}>
                    <div className={styles.resultsHeader}>Results</div>
                    {results.map((result, idx) => (
                        <div key={idx} className={styles.resultRow}>
                            <div className={styles.resultName}>
                                <span className={styles.constraintName}>{result.nodeName}</span>
                                <span className={styles.paramName}>.{result.parameter}</span>
                            </div>
                            <div className={styles.resultValue}>
                                {result.isCalculated && <CheckCircle size={12} className={styles.calculatedIcon} />}
                                <span className={result.isCalculated ? styles.calculated : ''}>
                                    {result.value.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {constraintCount === 0 && (
                <div className={styles.hint}>
                    Add Constraint Blocks and Binding edges to run simulations.
                </div>
            )}
        </div>
    );
}
