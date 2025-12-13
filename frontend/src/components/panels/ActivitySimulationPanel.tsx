'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';
import {
    ActivitySimulator,
    SimulationState,
    SimulationLog,
    SimulationVariable
} from '@/utils/activitySimulationEngine';
import styles from './ActivitySimulationPanel.module.css';

interface ActivitySimulationPanelProps {
    nodes: Node[];
    edges: Edge[];
    onNodeHighlight: (nodeId: string, isActive: boolean) => void;
}

export function ActivitySimulationPanel({
    nodes,
    edges,
    onNodeHighlight
}: ActivitySimulationPanelProps) {
    const [simState, setSimState] = useState<SimulationState | null>(null);
    const [speed, setSpeed] = useState(1);
    const [autoScroll, setAutoScroll] = useState(true);
    const simulatorRef = useRef<ActivitySimulator | null>(null);
    const consoleRef = useRef<HTMLDivElement>(null);

    // Initialize simulator
    useEffect(() => {
        const callbacks = {
            onStateChange: (state: SimulationState) => {
                setSimState({ ...state });
            },
            onNodeActivate: (nodeId: string) => {
                onNodeHighlight(nodeId, true);
            },
            onNodeDeactivate: (nodeId: string) => {
                onNodeHighlight(nodeId, false);
            },
            onTokenMove: (tokenId: string, from: string, to: string) => {
                // Token animation can be added here
            },
            onComplete: () => {
                // Simulation completed
            },
            onError: (error: string) => {
                console.error('Simulation error:', error);
            },
        };

        simulatorRef.current = new ActivitySimulator(callbacks);
        simulatorRef.current.initialize(nodes, edges);

        return () => {
            simulatorRef.current?.stop();
        };
    }, [nodes, edges, onNodeHighlight]);

    // Auto-scroll console
    useEffect(() => {
        if (autoScroll && consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
    }, [simState?.logs, autoScroll]);

    // Update speed
    useEffect(() => {
        simulatorRef.current?.setSpeed(speed);
    }, [speed]);

    const handlePlay = useCallback(() => {
        if (!simulatorRef.current) return;

        if (simState?.status === 'paused') {
            simulatorRef.current.resume();
        } else {
            simulatorRef.current.initialize(nodes, edges);
            simulatorRef.current.start();
        }
    }, [nodes, edges, simState?.status]);

    const handlePause = useCallback(() => {
        simulatorRef.current?.pause();
    }, []);

    const handleStep = useCallback(() => {
        if (!simulatorRef.current) return;
        if (simState?.status === 'idle') {
            simulatorRef.current.initialize(nodes, edges);
        }
        simulatorRef.current.step();
    }, [nodes, edges, simState?.status]);

    const handleStop = useCallback(() => {
        simulatorRef.current?.stop();
    }, []);

    const handleReset = useCallback(() => {
        simulatorRef.current?.reset();
        simulatorRef.current?.initialize(nodes, edges);
    }, [nodes, edges]);

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        });
    };

    const getLogClass = (level: SimulationLog['level']) => {
        switch (level) {
            case 'info': return styles.logInfo;
            case 'warning': return styles.logWarning;
            case 'error': return styles.logError;
            case 'success': return styles.logSuccess;
            default: return '';
        }
    };

    const isRunning = simState?.status === 'running';
    const isPaused = simState?.status === 'paused';
    const isIdle = simState?.status === 'idle' || !simState;
    const isCompleted = simState?.status === 'completed';

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <span className={styles.title}>🎬 Simulation</span>
                <div className={styles.sessionInfo}>
                    {/* Interactive Mode Toggle */}
                    <div className={styles.toggleWrapper} title="Toggle Interactive Manual Mode">
                        <label className={styles.toggleLabel}>
                            <input
                                type="checkbox"
                                onChange={(e) => {
                                    if (simulatorRef.current) {
                                        simulatorRef.current.setInteractiveMode(e.target.checked);
                                    }
                                }}
                            />
                            <span className={styles.toggleSlider}></span>
                        </label>
                        <span className={styles.toggleText}>Manual</span>
                    </div>

                    <span className={styles.status}>
                        {isRunning && '▶ Running'}
                        {isPaused && '⏸ Paused'}
                        {isIdle && '⏹ Ready'}
                        {isCompleted && '✓ Complete'}
                        {simState?.status === 'paused_decision' && '⏳ Decision...'}
                        {simState?.status === 'error' && '⚠ Error'}
                    </span>
                </div>
            </div>

            {/* Decision Input Overlay */}
            {simState?.status === 'paused_decision' && simState.pendingDecision && (
                <div className={styles.decisionPanel}>
                    <div className={styles.decisionHeader}>
                        ⚠️ Logic Branch
                    </div>
                    <div className={styles.decisionText}>
                        Select path:
                    </div>
                    <div className={styles.decisionButtons}>
                        {simState.pendingDecision.options.map(option => (
                            <button
                                key={option.edgeId}
                                className={styles.decisionOptionBtn}
                                onClick={() => simulatorRef.current?.selectDecisionPath(option.edgeId)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className={styles.controls}>
                <div className={styles.buttonGroup}>
                    {!isRunning ? (
                        <button
                            className={`${styles.controlBtn} ${styles.playBtn}`}
                            onClick={handlePlay}
                            title="Play"
                        >
                            ▶
                        </button>
                    ) : (
                        <button
                            className={`${styles.controlBtn} ${styles.pauseBtn}`}
                            onClick={handlePause}
                            title="Pause"
                        >
                            ⏸
                        </button>
                    )}

                    <button
                        className={styles.controlBtn}
                        onClick={handleStep}
                        disabled={isRunning}
                        title="Step"
                    >
                        ⏭
                    </button>

                    <button
                        className={styles.controlBtn}
                        onClick={handleStop}
                        disabled={isIdle}
                        title="Stop"
                    >
                        ⏹
                    </button>

                    <button
                        className={styles.controlBtn}
                        onClick={handleReset}
                        title="Reset"
                    >
                        🔄
                    </button>
                </div>

                <div className={styles.speedControl}>
                    <label>Speed:</label>
                    <input
                        type="range"
                        min="0.25"
                        max="4"
                        step="0.25"
                        value={speed}
                        onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    />
                    <span>{speed}x</span>
                </div>
            </div>

            {/* Stats */}
            <div className={styles.stats}>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>Tokens:</span>
                    <span className={styles.statValue}>{simState?.tokens.length || 0}</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>Steps:</span>
                    <span className={styles.statValue}>{simState?.stepCount || 0}</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>Active:</span>
                    <span className={styles.statValue}>{simState?.activeNodeIds.size || 0}</span>
                </div>
            </div>

            {/* Variables Panel */}
            <div className={styles.variablesPanel}>
                <div className={styles.sectionHeader}> Variables & Logic</div>

                {/* Add New Variable */}
                <div className={styles.addVariableRow}>
                    <input
                        placeholder="Name (e.g. Temp)"
                        className={styles.varNameInput}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const input = e.currentTarget;
                                const valInput = input.nextElementSibling as HTMLInputElement;
                                if (input.value && valInput.value) {
                                    simulatorRef.current?.setVariable(input.value, valInput.value);
                                    input.value = '';
                                    valInput.value = '';
                                }
                            }
                        }}
                    />
                    <input
                        placeholder="Value (e.g. 100)"
                        className={styles.varValueInput}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const input = e.currentTarget;
                                const nameInput = input.previousElementSibling as HTMLInputElement;
                                if (nameInput.value && input.value) {
                                    simulatorRef.current?.setVariable(nameInput.value, input.value);
                                    nameInput.value = '';
                                    input.value = '';
                                }
                            }
                        }}
                    />
                    <button
                        className={styles.addVarBtn}
                        onClick={(e) => {
                            const btn = e.currentTarget;
                            const valInput = btn.previousElementSibling as HTMLInputElement;
                            const nameInput = valInput.previousElementSibling as HTMLInputElement;
                            if (nameInput.value && valInput.value) {
                                simulatorRef.current?.setVariable(nameInput.value, valInput.value);
                                nameInput.value = '';
                                valInput.value = '';
                            }
                        }}
                    >
                        +
                    </button>
                </div>

                <table className={styles.variablesTable}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {simState?.variables.map((v, i) => (
                            <tr key={i}>
                                <td>{v.name}</td>
                                <td>
                                    <input
                                        className={styles.editableValue}
                                        value={String(v.value)}
                                        onChange={(e) => simulatorRef.current?.setVariable(v.name, e.target.value)}
                                        disabled={v.value === 'executing' || v.value === 'completed'}
                                    />
                                </td>
                            </tr>
                        ))}
                        {(!simState?.variables || simState.variables.length === 0) && (
                            <tr>
                                <td colSpan={2} style={{ textAlign: 'center', opacity: 0.5 }}>No variables set</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Console */}
            <div className={styles.consoleSection}>
                <div className={styles.consoleHeader}>
                    <span>Console</span>
                    <label className={styles.autoScrollLabel}>
                        <input
                            type="checkbox"
                            checked={autoScroll}
                            onChange={(e) => setAutoScroll(e.target.checked)}
                        />
                        Auto-scroll
                    </label>
                </div>
                <div className={styles.console} ref={consoleRef}>
                    {simState?.logs.map((log, i) => (
                        <div key={i} className={`${styles.logLine} ${getLogClass(log.level)}`}>
                            <span className={styles.timestamp}>{formatTime(log.timestamp)}</span>
                            <span className={styles.logMessage}>{log.message}</span>
                        </div>
                    ))}
                    {(!simState?.logs.length) && (
                        <div className={styles.emptyConsole}>
                            Click ▶ Play to start simulation...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
