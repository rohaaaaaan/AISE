'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './TopBar.module.css';
import {
    Save, FolderOpen, Image as ImageIcon, FileImage,
    Box, Circle, FileText, Cpu, Activity, Zap, Network,
    ArrowRight, GitMerge, GitBranch, Link, CheckCircle, ShieldCheck,
    Grid, Layers, Settings, User, Hexagon, Package, Calculator,
    Play, Diamond, GitFork, CircleDot, Target, XCircle,
    Download, FileJson, Undo2, Redo2, FilePlus, Cloud, CloudDownload, Upload
} from 'lucide-react';

interface TopBarProps {
    connectionType: string;
    onConnectionTypeChange: (type: string) => void;
    snapToGrid: boolean;
    onSnapToGridChange: (value: boolean) => void;
    onSave: () => void;
    onLoad: () => void;
    onCloudSave: () => void; // New
    onCloudLoad: () => void; // New
    onExportPng: () => void;
    onImportScript: () => void;
    onExportSvg: () => void;
    onNewProject: () => void;
    showLegend: boolean;
    onToggleLegend: () => void;
    showProperties: boolean;
    onToggleProperties: () => void;
    // Simulation
    hasConstraints: boolean;
    showSimulation: boolean;
    onToggleSimulation: () => void;
    // Activity Simulation
    hasActivityNodes: boolean;
    showActivitySimulation: boolean;
    onToggleActivitySimulation: () => void;
    onValidateModel: () => void;
    // Undo/Redo
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
}

export function TopBar({
    connectionType,
    onConnectionTypeChange,
    snapToGrid,
    onSnapToGridChange,
    onSave,
    onLoad,
    onCloudSave,
    onCloudLoad,
    onExportPng,
    onImportScript,
    onExportSvg,
    showLegend,
    onToggleLegend,
    showProperties,
    onToggleProperties,
    hasConstraints,
    showSimulation,
    onToggleSimulation,
    hasActivityNodes,
    showActivitySimulation,
    onToggleActivitySimulation,
    onValidateModel,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onNewProject
}: TopBarProps) {
    // Re-added internal state that was deleted
    const [activePopover, setActivePopover] = useState<'toolbox' | 'connectors' | null>(null);
    const toolboxRef = useRef<HTMLDivElement>(null);
    const connectorsRef = useRef<HTMLDivElement>(null);

    // Close popovers when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                toolboxRef.current && !toolboxRef.current.contains(event.target as Node) &&
                connectorsRef.current && !connectorsRef.current.contains(event.target as Node)
            ) {
                setActivePopover(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const togglePopover = (name: 'toolbox' | 'connectors') => {
        setActivePopover(activePopover === name ? null : name);
    };

    return (
        <div className={styles.topBar}>
            {/* File Menu */}
            < div className={styles.actionButton} onClick={onNewProject} title="New Project" >
                <FilePlus size={14} />
                <span>New</span>
            </div>

            <div className={styles.actionButton} onClick={onCloudSave} title="Save to Cloud">
                <Cloud size={14} />
                <span>Save</span>
            </div>

            <div className={styles.actionButton} onClick={onCloudLoad} title="Open from Cloud">
                <CloudDownload size={14} />
                <span>Open</span>
            </div>

            <div className={styles.separator} />

            <div className={styles.actionButton} onClick={onSave} title="Export to File">
                <Save size={14} />
                <span>Export</span>
            </div>

            <div className={styles.actionButton} onClick={onLoad} title="Import from File">
                <Upload size={14} />
                <span>Import</span>
            </div>

            <div className={styles.actionButton} onClick={onImportScript} title="Import GPT Script">
                <FileJson size={14} />
                <span>Import Script</span>
            </div>

            <div className={styles.separator} />

            {/* Undo/Redo */}
            <div
                className={`${styles.actionButton} ${!canUndo ? styles.disabled : ''}`}
                onClick={canUndo ? onUndo : undefined}
                title="Undo (Ctrl+Z)"
                style={{ opacity: canUndo ? 1 : 0.4 }}
            >
                <Undo2 size={14} />
                <span>Undo</span>
            </div>
            <div
                className={`${styles.actionButton} ${!canRedo ? styles.disabled : ''}`}
                onClick={canRedo ? onRedo : undefined}
                title="Redo (Ctrl+Y)"
                style={{ opacity: canRedo ? 1 : 0.4 }}
            >
                <Redo2 size={14} />
                <span>Redo</span>
            </div>

            <div className={styles.separator} />

            <div className={styles.actionButton} onClick={onValidateModel} title="Validate Model Compliance">
                <ShieldCheck size={14} />
                <span>Validate</span>
            </div>

            <div className={styles.actionButton} onClick={onExportPng} title="Export PNG">
                <Download size={14} />
                <span>Export PNG</span>
            </div>
            <div className={styles.actionButton} onClick={onExportSvg} title="Export SVG">
                <FileImage size={14} />
                <span>Export SVG</span>
            </div>

            <div className={styles.separator} />

            {/* Toolbox Toggle */}
            <div
                className={`${styles.actionButton} ${activePopover === 'toolbox' ? styles.active : ''}`}
                onClick={() => togglePopover('toolbox')}
                ref={toolboxRef}
            >
                <Box size={14} />
                <span>Toolbox</span>
                {activePopover === 'toolbox' && (
                    <div className={styles.popover} style={{ left: 120 }}>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'diagramFrame')} draggable>
                            <Package size={14} /> Diagram Frame
                        </div>
                        <div className={styles.separator}></div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlBlock')} draggable>
                            <Box size={14} /> Block
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlPort')} draggable>
                            <Circle size={14} /> Port
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlPart')} draggable>
                            <Box size={14} /> Part
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlRequirement')} draggable>
                            <FileText size={14} /> Requirement
                        </div>
                        <div className={styles.separator}></div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlActor')} draggable>
                            <User size={14} /> Actor
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlUseCase')} draggable>
                            <Hexagon size={14} /> Use Case
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlSystemBoundary')} draggable>
                            <Package size={14} /> System Boundary
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlConstraintBlock')} draggable>
                            <Calculator size={14} /> Constraint
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlPackage')} draggable>
                            <Package size={14} /> Package
                        </div>
                        <div className={styles.separator}></div>
                        {/* Sequence Diagram */}
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlLifeline')} draggable>
                            <Activity size={14} /> Lifeline
                        </div>
                        <div className={styles.separator}></div>
                        {/* State Machine Diagram */}
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlState')} draggable>
                            <Box size={14} style={{ borderRadius: 4 }} /> State
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlInitial')} draggable>
                            <CircleDot size={14} /> Initial
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlFinal')} draggable>
                            <Target size={14} /> Final
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlDecision')} draggable>
                            <Diamond size={14} /> Choice
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlHistory')} draggable>
                            <CircleDot size={14} /> History (H)
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlDeepHistory')} draggable>
                            <CircleDot size={14} /> Deep History (H*)
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlEntryPoint')} draggable>
                            <Circle size={14} /> Entry Point
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlExitPoint')} draggable>
                            <XCircle size={14} /> Exit Point
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlForkJoin')} draggable>
                            <GitFork size={14} /> Fork/Join
                        </div>
                        <div className={styles.separator}></div>
                        {/* Activity Diagram */}
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlAction')} draggable>
                            <Play size={14} /> Action
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlDecision')} draggable>
                            <Diamond size={14} /> Decision
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlForkJoin')} draggable>
                            <GitFork size={14} /> Fork/Join
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlInitial')} draggable>
                            <CircleDot size={14} /> Initial
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlFinal')} draggable>
                            <Target size={14} /> Final
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlSwimlane')} draggable>
                            <Layers size={14} /> Swimlane
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlSignal')} draggable>
                            <Zap size={14} /> Signal
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sysmlInterruptibleRegion')} draggable>
                            <Box size={14} /> Interruptible Region
                        </div>
                        <div className={styles.separator}></div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'ecu')} draggable>
                            <Cpu size={14} /> ECU
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'sensor')} draggable>
                            <Activity size={14} /> Sensor
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'actuator')} draggable>
                            <Zap size={14} /> Actuator
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'gateway')} draggable>
                            <Network size={14} /> Gateway
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'default')} draggable>
                            <Box size={14} /> Node
                        </div>
                        <div className={styles.separator}></div>
                        {/* Annotation Tools */}
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'textBox')} draggable>
                            <FileText size={14} /> Text Box
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'note')} draggable>
                            <FileText size={14} style={{ color: '#f59e0b' }} /> Note
                        </div>
                        <div className={styles.toolboxItem} onDragStart={(e) => onDragStart(e, 'comment')} draggable>
                            <FileText size={14} style={{ color: '#9ca3af' }} /> Comment
                        </div>
                    </div>
                )}
            </div>

            {/* Connectors Toggle */}
            <div
                className={`${styles.actionButton} ${activePopover === 'connectors' ? styles.active : ''}`}
                onClick={() => togglePopover('connectors')}
                ref={connectorsRef}
            >
                <Link size={14} />
                <span>Connectors</span>
                {activePopover === 'connectors' && (
                    <div className={styles.popover} style={{ left: 220, maxHeight: 400, overflowY: 'auto' }}>
                        {/* Structural Relationships */}
                        <div className={styles.connectorCategory}>Structural</div>
                        {[
                            { id: 'default', label: 'Association', icon: <ArrowRight size={14} /> },
                            { id: 'composition', label: 'Composition', icon: <GitMerge size={14} /> },
                            { id: 'aggregation', label: 'Aggregation', icon: <GitBranch size={14} /> },
                            { id: 'generalization', label: 'Generalization', icon: <ArrowRight size={14} /> },
                            { id: 'dependency', label: 'Dependency', icon: <ArrowRight size={14} /> },
                            { id: 'realization', label: 'Realization', icon: <ArrowRight size={14} /> },
                        ].map(type => (
                            <div
                                key={type.id}
                                className={`${styles.connectorItem} ${connectionType === type.id ? styles.selected : ''}`}
                                onClick={() => onConnectionTypeChange(type.id)}
                            >
                                {type.icon} {type.label}
                            </div>
                        ))}

                        {/* Requirements */}
                        <div className={styles.connectorCategory}>Requirements</div>
                        {[
                            { id: 'satisfy', label: 'Satisfy', icon: <CheckCircle size={14} /> },
                            { id: 'verify', label: 'Verify', icon: <ShieldCheck size={14} /> },
                            { id: 'derive', label: 'Derive', icon: <ArrowRight size={14} /> },
                            { id: 'refine', label: 'Refine', icon: <ArrowRight size={14} /> },
                            { id: 'trace', label: 'Trace', icon: <ArrowRight size={14} /> },
                        ].map(type => (
                            <div
                                key={type.id}
                                className={`${styles.connectorItem} ${connectionType === type.id ? styles.selected : ''}`}
                                onClick={() => onConnectionTypeChange(type.id)}
                            >
                                {type.icon} {type.label}
                            </div>
                        ))}

                        {/* Use Case */}
                        <div className={styles.connectorCategory}>Use Case</div>
                        {[
                            { id: 'include', label: 'Include', icon: <ArrowRight size={14} /> },
                            { id: 'extend', label: 'Extend', icon: <ArrowRight size={14} /> },
                        ].map(type => (
                            <div
                                key={type.id}
                                className={`${styles.connectorItem} ${connectionType === type.id ? styles.selected : ''}`}
                                onClick={() => onConnectionTypeChange(type.id)}
                            >
                                {type.icon} {type.label}
                            </div>
                        ))}

                        {/* Package */}
                        <div className={styles.connectorCategory}>Package</div>
                        {[
                            { id: 'packageImport', label: 'Import', icon: <ArrowRight size={14} /> },
                            { id: 'packageMerge', label: 'Merge', icon: <GitMerge size={14} /> },
                        ].map(type => (
                            <div
                                key={type.id}
                                className={`${styles.connectorItem} ${connectionType === type.id ? styles.selected : ''}`}
                                onClick={() => onConnectionTypeChange(type.id)}
                            >
                                {type.icon} {type.label}
                            </div>
                        ))}

                        {/* Interactions (Sequence) */}
                        <div className={styles.connectorCategory}>Interactions</div>
                        {[
                            { id: 'sequenceSync', label: 'Synchronous', icon: <ArrowRight size={14} /> },
                            { id: 'sequenceAsync', label: 'Asynchronous', icon: <ArrowRight size={14} /> },
                            { id: 'sequenceReply', label: 'Reply', icon: <ArrowRight size={14} /> },
                        ].map(type => (
                            <div
                                key={type.id}
                                className={`${styles.connectorItem} ${connectionType === type.id ? styles.selected : ''}`}
                                onClick={() => onConnectionTypeChange(type.id)}
                            >
                                {type.icon} {type.label}
                            </div>
                        ))}

                        {/* State Machine */}
                        <div className={styles.connectorCategory}>State Machine</div>
                        {[
                            { id: 'transition', label: 'Transition', icon: <ArrowRight size={14} /> },
                        ].map(type => (
                            <div
                                key={type.id}
                                className={`${styles.connectorItem} ${connectionType === type.id ? styles.selected : ''}`}
                                onClick={() => onConnectionTypeChange(type.id)}
                            >
                                {type.icon} {type.label}
                            </div>
                        ))}

                        {/* Behavior / Activity */}
                        <div className={styles.connectorCategory}>Behavior</div>
                        {[
                            { id: 'controlFlow', label: 'Control Flow', icon: <Play size={14} /> },
                            { id: 'objectFlow', label: 'Object Flow', icon: <ArrowRight size={14} /> },
                            { id: 'itemFlow', label: 'Item Flow', icon: <ArrowRight size={14} /> },
                        ].map(type => (
                            <div
                                key={type.id}
                                className={`${styles.connectorItem} ${connectionType === type.id ? styles.selected : ''}`}
                                onClick={() => onConnectionTypeChange(type.id)}
                            >
                                {type.icon} {type.label}
                            </div>
                        ))}

                        {/* Allocations */}
                        <div className={styles.connectorCategory}>Allocations</div>
                        {[
                            { id: 'allocate', label: 'Allocate', icon: <ArrowRight size={14} /> },
                            { id: 'binding', label: 'Binding', icon: <Link size={14} /> },
                        ].map(type => (
                            <div
                                key={type.id}
                                className={`${styles.connectorItem} ${connectionType === type.id ? styles.selected : ''}`}
                                onClick={() => onConnectionTypeChange(type.id)}
                            >
                                {type.icon} {type.label}
                            </div>
                        ))}

                        {/* Communication Buses */}
                        <div className={styles.connectorCategory}>Communication</div>
                        {[
                            { id: 'can', label: 'CAN Bus', icon: <Network size={14} /> },
                            { id: 'ethernet', label: 'Ethernet', icon: <Network size={14} /> },
                            { id: 'lin', label: 'LIN Bus', icon: <Network size={14} /> },
                        ].map(type => (
                            <div
                                key={type.id}
                                className={`${styles.connectorItem} ${connectionType === type.id ? styles.selected : ''}`}
                                onClick={() => onConnectionTypeChange(type.id)}
                            >
                                {type.icon} {type.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.separator} />

            {/* View Toggles */}
            <div
                className={`${styles.actionButton} ${showLegend ? styles.active : ''}`}
                onClick={onToggleLegend}
                title="Toggle Legend"
            >
                <Layers size={14} />
                <span>Legend</span>
            </div>

            <div
                className={`${styles.actionButton} ${showProperties ? styles.active : ''}`}
                onClick={onToggleProperties}
                title="Toggle Properties"
            >
                <Settings size={14} />
                <span>Properties</span>
            </div>

            {/* Parametric Simulation Button - Only shows when there are constraint blocks */}
            {
                hasConstraints && (
                    <div
                        className={`${styles.actionButton} ${showSimulation ? styles.active : ''}`}
                        onClick={onToggleSimulation}
                        title="Run Parametric Simulation"
                        style={{ background: showSimulation ? '#7c3aed' : undefined }}
                    >
                        <Calculator size={14} />
                        <span>Parametric</span>
                    </div>
                )
            }

            {/* Activity Simulation Button - Only shows when there are activity nodes */}
            {
                hasActivityNodes && (
                    <div
                        className={`${styles.actionButton} ${showActivitySimulation ? styles.active : ''}`}
                        onClick={onToggleActivitySimulation}
                        title="Run Activity Diagram Simulation"
                        style={{ background: showActivitySimulation ? '#3b82f6' : undefined }}
                    >
                        <Play size={14} />
                        <span>Activity Sim</span>
                    </div>
                )
            }

            <div className={styles.separator} />

            {/* Snap to Grid */}
            <div
                className={`${styles.actionButton} ${snapToGrid ? styles.active : ''}`}
                onClick={() => onSnapToGridChange(!snapToGrid)}
                title="Snap to Grid"
            >
                <Grid size={14} />
            </div>
        </div >
    );
}
