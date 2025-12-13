'use client';

import { Node, Edge } from '@xyflow/react';
import { SYSML_CONNECTORS } from '@/config/sysml-connectors';
import { isValidSysMLConnection } from '@/config/sysml-connectors';
import styles from './PropertiesPanel.module.css';

interface PropertiesPanelProps {
    selectedNode: Node | null;
    selectedEdge: Edge | null;
    nodes: Node[];
    onChange: (nodeId: string, data: any) => void;
    onEdgeChange: (edgeId: string, data: any) => void;
    onAddNode?: (type: string, parentId: string, data?: any) => void; // For generating ports
}

export function PropertiesPanel({ selectedNode, selectedEdge, nodes, onChange, onEdgeChange, onAddNode }: PropertiesPanelProps) {
    if (!selectedNode && !selectedEdge) {
        return (
            <div className={styles.propertiesPanel}>
                <div className={styles.title}>Properties</div>
                <div className={styles.noSelection}>
                    Select a node or connector to view properties
                </div>
            </div>
        );
    }

    // Handle Node Properties
    if (selectedNode) {
        const handleChange = (field: string, value: any) => {
            onChange(selectedNode.id, {
                data: {
                    ...selectedNode.data,
                    [field]: value
                }
            });
        };

        const renderCommonFields = () => (
            <>
                <div className={styles.field}>
                    <label className={styles.label}>Label</label>
                    <input
                        type="text"
                        className={styles.input}
                        value={selectedNode.data.label as string || ''}
                        onChange={(e) => handleChange('label', e.target.value)}
                        placeholder="Enter label..."
                    />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Description</label>
                    <textarea
                        className={styles.textarea}
                        value={selectedNode.data.description as string || ''}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Enter description..."
                    />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Status</label>
                    <select
                        className={styles.select}
                        value={selectedNode.data.status as string || 'Draft'}
                        onChange={(e) => handleChange('status', e.target.value)}
                    >
                        <option value="Draft">Draft</option>
                        <option value="Reviewed">Reviewed</option>
                        <option value="Approved">Approved</option>
                    </select>
                </div>
            </>
        );

        const renderECUFields = () => (
            <>
                <div className={styles.sectionHeader}>ECU Specs</div>
                <div className={styles.field}>
                    <label className={styles.label}>Manufacturer</label>
                    <input
                        type="text"
                        className={styles.input}
                        value={selectedNode.data.manufacturer as string || ''}
                        onChange={(e) => handleChange('manufacturer', e.target.value)}
                        placeholder="e.g. Bosch, Continental"
                    />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Memory (MB)</label>
                    <input
                        type="number"
                        className={styles.input}
                        value={selectedNode.data.memory as number || ''}
                        onChange={(e) => handleChange('memory', Number(e.target.value))}
                    />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Clock Speed (MHz)</label>
                    <input
                        type="number"
                        className={styles.input}
                        value={selectedNode.data.clockSpeed as number || ''}
                        onChange={(e) => handleChange('clockSpeed', Number(e.target.value))}
                    />
                </div>
            </>
        );

        const renderSensorFields = () => (
            <>
                <div className={styles.sectionHeader}>Sensor Specs</div>
                <div className={styles.field}>
                    <label className={styles.label}>Sensor Type</label>
                    <select
                        className={styles.select}
                        value={selectedNode.data.sensorType as string || 'Temperature'}
                        onChange={(e) => handleChange('sensorType', e.target.value)}
                    >
                        <option value="Temperature">Temperature</option>
                        <option value="Pressure">Pressure</option>
                        <option value="Speed">Speed</option>
                        <option value="Proximity">Proximity</option>
                        <option value="Radar">Radar</option>
                        <option value="Lidar">Lidar</option>
                        <option value="Camera">Camera</option>
                    </select>
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Unit</label>
                    <input
                        type="text"
                        className={styles.input}
                        value={selectedNode.data.unit as string || ''}
                        onChange={(e) => handleChange('unit', e.target.value)}
                        placeholder="e.g. °C, kPa, km/h"
                    />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Update Rate (Hz)</label>
                    <input
                        type="number"
                        className={styles.input}
                        value={selectedNode.data.updateRate as number || ''}
                        onChange={(e) => handleChange('updateRate', Number(e.target.value))}
                    />
                </div>
            </>
        );

        const renderActuatorFields = () => (
            <>
                <div className={styles.sectionHeader}>Actuator Specs</div>
                <div className={styles.field}>
                    <label className={styles.label}>Actuator Type</label>
                    <select
                        className={styles.select}
                        value={selectedNode.data.actuatorType as string || 'Motor'}
                        onChange={(e) => handleChange('actuatorType', e.target.value)}
                    >
                        <option value="Motor">Motor</option>
                        <option value="Valve">Valve</option>
                        <option value="Solenoid">Solenoid</option>
                        <option value="Relay">Relay</option>
                        <option value="Heater">Heater</option>
                    </select>
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Max Power (W)</label>
                    <input
                        type="number"
                        className={styles.input}
                        value={selectedNode.data.maxPower as number || ''}
                        onChange={(e) => handleChange('maxPower', Number(e.target.value))}
                    />
                </div>
            </>
        );

        const renderGatewayFields = () => {
            const protocols = (selectedNode.data.protocols as string[]) || [];
            const toggleProtocol = (protocol: string) => {
                if (protocols.includes(protocol)) {
                    handleChange('protocols', protocols.filter(p => p !== protocol));
                } else {
                    handleChange('protocols', [...protocols, protocol]);
                }
            };

            return (
                <>
                    <div className={styles.sectionHeader}>Gateway Specs</div>
                    <div className={styles.field}>
                        <label className={styles.label}>Supported Protocols</label>
                        <div className={styles.checkboxGroup}>
                            {['CAN', 'LIN', 'Ethernet', 'FlexRay'].map(p => (
                                <label key={p} className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        className={styles.checkbox}
                                        checked={protocols.includes(p)}
                                        onChange={() => toggleProtocol(p)}
                                    />
                                    {p}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Bandwidth (Mbps)</label>
                        <input
                            type="number"
                            className={styles.input}
                            value={selectedNode.data.bandwidth as number || ''}
                            onChange={(e) => handleChange('bandwidth', Number(e.target.value))}
                        />
                    </div>
                </>
            );
        };

        const renderPartFields = () => {
            // Find all Blocks that can define this Part
            // Exclude itself (though parts aren't blocks, just safe filtering)
            const availableBlocks = nodes.filter(n => n.type === 'sysmlBlock');

            return (
                <>
                    <div className={styles.sectionHeader}>Part Definition</div>
                    <div className={styles.field}>
                        <label className={styles.label}>Type (Block)</label>
                        <select
                            className={styles.select}
                            value={selectedNode.data.blockDefId as string || ''}
                            onChange={(e) => handleChange('blockDefId', e.target.value)}
                        >
                            <option value="">-- Untyped --</option>
                            {availableBlocks.map(block => (
                                <option key={block.id} value={block.id}>
                                    {block.data.label as string || block.id}
                                </option>
                            ))}
                        </select>
                        <div className={styles.helpText} style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                            Select a Block to inherit its ports.
                        </div>
                    </div>
                </>
            );
        };

        // =============== Constraint Block Fields ===============
        const renderConstraintBlockFields = () => {
            const parameters = (selectedNode.data.parameters as string[]) || [];

            const addParameter = () => handleChange('parameters', [...parameters, 'param']);
            const updateParameter = (idx: number, val: string) => {
                const newParams = [...parameters];
                newParams[idx] = val;
                handleChange('parameters', newParams);
            };
            const removeParameter = (idx: number) => {
                handleChange('parameters', parameters.filter((_, i) => i !== idx));
            };

            return (
                <>
                    <div className={styles.sectionHeader}>Constraint Definition</div>
                    <div className={styles.field}>
                        <label className={styles.label}>Equation</label>
                        <input
                            className={styles.input}
                            value={selectedNode.data.equation as string || ''}
                            onChange={(e) => handleChange('equation', e.target.value)}
                            placeholder="e.g. F = m * a"
                            style={{ fontFamily: 'monospace' }}
                        />
                    </div>
                    <div className={styles.sectionHeader}>Parameters</div>
                    {parameters.map((param, i) => (
                        <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                            <input
                                className={styles.input}
                                value={param}
                                onChange={(e) => updateParameter(i, e.target.value)}
                                placeholder="Parameter name"
                            />
                            <button onClick={() => removeParameter(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                        </div>
                    ))}
                    <button onClick={addParameter} className={styles.value} style={{ cursor: 'pointer', color: 'var(--primary)' }}>+ Add Parameter</button>
                </>
            );
        };

        const renderSysMLBlockFields = () => {
            const values = (selectedNode.data.values as string[]) || [];
            const parts = (selectedNode.data.parts as string[]) || [];

            const addValue = () => handleChange('values', [...values, 'new value']);
            const updateValue = (idx: number, val: string) => {
                const newValues = [...values];
                newValues[idx] = val;
                handleChange('values', newValues);
            };
            const removeValue = (idx: number) => {
                handleChange('values', values.filter((_, i) => i !== idx));
            };

            const addPart = () => handleChange('parts', [...parts, 'new part']);
            const updatePart = (idx: number, val: string) => {
                const newParts = [...parts];
                newParts[idx] = val;
                handleChange('parts', newParts);
            };
            const removePart = (idx: number) => {
                handleChange('parts', parts.filter((_, i) => i !== idx));
            };

            return (
                <>
                    <div className={styles.sectionHeader}>General</div>
                    <div className={styles.field}>
                        <label className={styles.label}>Stereotype</label>
                        <input
                            className={styles.input}
                            value={selectedNode.data.stereotype as string || 'block'}
                            onChange={(e) => handleChange('stereotype', e.target.value)}
                            placeholder="e.g. block, system, context"
                        />
                    </div>
                    <div className={styles.sectionHeader}>Value Properties</div>
                    {values.map((val, i) => (
                        <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                            <input
                                className={styles.input}
                                value={val}
                                onChange={(e) => updateValue(i, e.target.value)}
                            />
                            <button onClick={() => removeValue(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                        </div>
                    ))}
                    <button onClick={addValue} className={styles.value} style={{ cursor: 'pointer', color: 'var(--primary)' }}>+ Add Value</button>

                    <div className={styles.sectionHeader}>Operations</div>
                    {(selectedNode.data.operations as string[] || []).map((op, i) => (
                        <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                            <input
                                className={styles.input}
                                value={op}
                                onChange={(e) => {
                                    const newOps = [...((selectedNode.data.operations as string[]) || [])];
                                    newOps[i] = e.target.value;
                                    handleChange('operations', newOps);
                                }}
                            />
                            <button onClick={() => {
                                const newOps = ((selectedNode.data.operations as string[]) || []).filter((_, idx) => idx !== i);
                                handleChange('operations', newOps);
                            }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                        </div>
                    ))}
                    <button onClick={() => handleChange('operations', [...((selectedNode.data.operations as string[]) || []), 'newOperation()'])} className={styles.value} style={{ cursor: 'pointer', color: 'var(--primary)' }}>+ Add Operation</button>

                    <div className={styles.sectionHeader}>Part Properties</div>
                    {parts.map((part, i) => (
                        <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                            <input
                                className={styles.input}
                                value={part}
                                onChange={(e) => updatePart(i, e.target.value)}
                            />
                            <button onClick={() => removePart(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                        </div>
                    ))}
                    <button onClick={addPart} className={styles.value} style={{ cursor: 'pointer', color: 'var(--primary)' }}>+ Add Part</button>

                    <div className={styles.sectionHeader}>Ports</div>
                    {/* List existing child ports */}
                    {nodes.filter(n => n.type === 'sysmlPort' && n.parentId === selectedNode.id).map((port) => (
                        <div key={port.id} style={{ display: 'flex', gap: '5px', marginBottom: '5px', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#666' }}>
                                {port.data.direction === 'in' ? '←' : port.data.direction === 'out' ? '→' : '↔'}
                            </span>
                            <span style={{ fontSize: '12px', flex: 1 }}>{port.data.label as string || 'Port'}</span>
                        </div>
                    ))}
                    {onAddNode && (
                        <button
                            onClick={() => onAddNode('sysmlPort', selectedNode.id, { label: 'NewPort', direction: 'in' })}
                            className={styles.value}
                            style={{ cursor: 'pointer', color: 'var(--primary)', marginTop: '4px' }}
                        >
                            + Add Port
                        </button>
                    )}
                </>
            );
        };

        const renderSysMLRequirementFields = () => (
            <>
                <div className={styles.sectionHeader}>Requirement Details</div>
                <div className={styles.field}>
                    <label className={styles.label}>Requirement ID</label>
                    <input
                        className={styles.input}
                        value={selectedNode.data.reqId as string || ''}
                        onChange={(e) => handleChange('reqId', e.target.value)}
                        placeholder="REQ-001"
                    />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Requirement Text</label>
                    <textarea
                        className={styles.input}
                        value={selectedNode.data.reqText as string || ''}
                        onChange={(e) => handleChange('reqText', e.target.value)}
                        placeholder="The system shall..."
                        rows={4}
                        style={{ resize: 'vertical' }}
                    />
                </div>
            </>
        );

        const renderSysMLPortFields = () => (
            <>
                <div className={styles.sectionHeader}>Port Configuration</div>
                <div className={styles.field}>
                    <label className={styles.label}>Port Domain</label>
                    <select
                        className={styles.select}
                        value={selectedNode.data.portType as string || 'default'}
                        onChange={(e) => handleChange('portType', e.target.value)}
                    >
                        <option value="default">Default</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="DataTransferOperation">Data Transfer</option>
                        <option value="HeaterOperation">Heater</option>
                        <option value="ValvesOperation">Valves</option>
                        <option value="UserInterface">User Interface</option>
                        <option value="GPRS">GPRS</option>
                        <option value="GPS">GPS</option>
                        <option value="SensorOperation">Sensor</option>
                        <option value="CANBus">CAN Bus</option>
                        <option value="Ambience_Air">Ambience Air</option>
                        <option value="Sensor Status">Sensor Status</option>
                        <option value="Start Electricity">Start Electricity</option>
                        <option value="Valves Status">Valves Status</option>
                    </select>
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>SysML Type</label>
                    <select
                        className={styles.select}
                        value={selectedNode.data.sysmlType as string || 'standard'}
                        onChange={(e) => handleChange('sysmlType', e.target.value)}
                    >
                        <option value="standard">Standard Port</option>
                        <option value="proxy">Proxy Port</option>
                        <option value="full">Full Port</option>
                    </select>
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Direction</label>
                    <select
                        className={styles.select}
                        value={selectedNode.data.direction as string || 'none'}
                        onChange={(e) => handleChange('direction', e.target.value)}
                    >
                        <option value="none">None</option>
                        <option value="in">In (→)</option>
                        <option value="out">Out (←)</option>
                        <option value="inout">In/Out (↔)</option>
                    </select>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Visual Arrow</label>
                    <div className={styles.buttonGroup} style={{ display: 'flex', gap: '5px' }}>
                        {[
                            { label: '←', val: '←' },
                            { label: '→', val: '→' },
                            { label: '↑', val: '↑' },
                            { label: '↓', val: '↓' }
                        ].map(opt => (
                            <button
                                key={opt.val}
                                className={styles.button}
                                style={{
                                    flex: 1,
                                    padding: '4px',
                                    fontSize: '1rem',
                                    backgroundColor: selectedNode.data.symbol === opt.val ? '#ddd' : '#f0f0f0',
                                    border: selectedNode.data.symbol === opt.val ? '1px solid #999' : '1px solid #ccc'
                                }}
                                onClick={() => handleChange('symbol', opt.val)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Side (Snap)</label>
                    <div className={styles.buttonGroup} style={{ display: 'flex', gap: '5px' }}>
                        {['Top', 'Bottom', 'Left', 'Right'].map(side => (
                            <button
                                key={side}
                                className={styles.button}
                                style={{ flex: 1, padding: '4px', fontSize: '0.7rem' }}
                                onClick={() => {
                                    // Snap Logic
                                    const parent = nodes.find(n => n.id === selectedNode.parentId);
                                    if (!parent) return;

                                    const pWidth = parent.measured?.width || parent.width || 150; // Fallback width
                                    const pHeight = parent.measured?.height || parent.height || 100; // Fallback height
                                    let newX = 0, newY = 0;

                                    // Improved Snap Logic: Project to edge while keeping current "slide" position
                                    // This prevents ports from bunching up in the center

                                    const portSize = 20; // assumed
                                    const currentX = selectedNode.position.x;
                                    const currentY = selectedNode.position.y;

                                    switch (side) {
                                        case 'Top':
                                            newX = Math.max(0, Math.min(pWidth - portSize, currentX));
                                            newY = -10;
                                            break;
                                        case 'Bottom':
                                            newX = Math.max(0, Math.min(pWidth - portSize, currentX));
                                            newY = pHeight - 10;
                                            break;
                                        case 'Left':
                                            newX = -10;
                                            newY = Math.max(0, Math.min(pHeight - portSize, currentY));
                                            break;
                                        case 'Right':
                                            newX = pWidth - 10;
                                            newY = Math.max(0, Math.min(pHeight - portSize, currentY));
                                            break;
                                    }

                                    // Update position and Side
                                    onChange(selectedNode.id, {
                                        position: { x: newX, y: newY },
                                        data: { ...selectedNode.data, side: side }
                                    });
                                }}
                            >
                                {side}
                            </button>
                        ))}
                    </div>
                </div>
            </>
        );

        const renderSysMLPartFields = () => (
            <>
                <div className={styles.sectionHeader}>Part Definition</div>
                <div className={styles.field}>
                    <label className={styles.label}>Block Type</label>
                    <input
                        className={styles.input}
                        value={selectedNode.data.blockType as string || ''}
                        onChange={(e) => handleChange('blockType', e.target.value)}
                        placeholder="e.g. Engine, Controller"
                    />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Multiplicity</label>
                    <input
                        className={styles.input}
                        value={selectedNode.data.multiplicity as string || '1'}
                        onChange={(e) => handleChange('multiplicity', e.target.value)}
                        placeholder="e.g. 1, 0..1, *"
                    />
                </div>
            </>
        );

        // =============== Action Node Fields (Activity Diagrams) ===============
        const renderActionFields = () => {
            const inputPins = (selectedNode.data.inputPins as string[]) || [];
            const outputPins = (selectedNode.data.outputPins as string[]) || [];

            const addInputPin = () => handleChange('inputPins', [...inputPins, 'input']);
            const updateInputPin = (idx: number, val: string) => {
                const newPins = [...inputPins];
                newPins[idx] = val;
                handleChange('inputPins', newPins);
            };
            const removeInputPin = (idx: number) => {
                handleChange('inputPins', inputPins.filter((_, i) => i !== idx));
            };

            const addOutputPin = () => handleChange('outputPins', [...outputPins, 'output']);
            const updateOutputPin = (idx: number, val: string) => {
                const newPins = [...outputPins];
                newPins[idx] = val;
                handleChange('outputPins', newPins);
            };
            const removeOutputPin = (idx: number) => {
                handleChange('outputPins', outputPins.filter((_, i) => i !== idx));
            };

            return (
                <>
                    <div className={styles.sectionHeader}>Input Pins</div>
                    {inputPins.map((pin, i) => (
                        <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                            <input
                                className={styles.input}
                                value={pin}
                                onChange={(e) => updateInputPin(i, e.target.value)}
                                placeholder="Pin name"
                            />
                            <button onClick={() => removeInputPin(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                        </div>
                    ))}
                    <button onClick={addInputPin} className={styles.value} style={{ cursor: 'pointer', color: 'var(--primary)' }}>+ Add Input Pin</button>

                    <div className={styles.sectionHeader}>Output Pins</div>
                    {outputPins.map((pin, i) => (
                        <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                            <input
                                className={styles.input}
                                value={pin}
                                onChange={(e) => updateOutputPin(i, e.target.value)}
                                placeholder="Pin name"
                            />
                            <button onClick={() => removeOutputPin(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                        </div>
                    ))}
                    <button onClick={addOutputPin} className={styles.value} style={{ cursor: 'pointer', color: 'var(--primary)' }}>+ Add Output Pin</button>
                </>
            );
        };

        // =============== Decision Node Fields ===============
        const renderDecisionFields = () => (
            <>
                <div className={styles.sectionHeader}>Decision Configuration</div>
                <div className={styles.field}>
                    <label className={styles.label}>Decision Criteria</label>
                    <input
                        className={styles.input}
                        value={selectedNode.data.guard as string || ''}
                        onChange={(e) => handleChange('guard', e.target.value)}
                        placeholder="e.g. [x > 0]"
                    />
                </div>
            </>
        );

        // =============== Fork/Join Node Fields ===============
        const renderForkJoinFields = () => (
            <>
                <div className={styles.sectionHeader}>Fork/Join Configuration</div>
                <div className={styles.field}>
                    <label className={styles.label}>Orientation</label>
                    <select
                        className={styles.select}
                        value={selectedNode.data.orientation as string || 'horizontal'}
                        onChange={(e) => handleChange('orientation', e.target.value)}
                    >
                        <option value="horizontal">Horizontal</option>
                        <option value="vertical">Vertical</option>
                    </select>
                </div>
            </>
        );

        // =============== Final Node Fields ===============
        const renderFinalFields = () => (
            <>
                <div className={styles.sectionHeader}>Final Node Configuration</div>
                <div className={styles.field}>
                    <label className={styles.label}>Final Type</label>
                    <select
                        className={styles.select}
                        value={selectedNode.data.finalType as string || 'activity'}
                        onChange={(e) => handleChange('finalType', e.target.value)}
                    >
                        <option value="activity">Activity Final (●◯)</option>
                        <option value="flow">Flow Final (⊗)</option>
                    </select>
                </div>
            </>
        );

        // =============== Signal Node Fields ===============
        const renderSignalFields = () => (
            <>
                <div className={styles.sectionHeader}>Signal Configuration</div>
                <div className={styles.field}>
                    <label className={styles.label}>Signal Type</label>
                    <select
                        className={styles.select}
                        value={selectedNode.data.signalType as string || 'send'}
                        onChange={(e) => handleChange('signalType', e.target.value)}
                    >
                        <option value="send">Send Signal (▶)</option>
                        <option value="accept">Accept Event (◁)</option>
                    </select>
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Signal Name</label>
                    <input
                        className={styles.input}
                        value={selectedNode.data.signalName as string || ''}
                        onChange={(e) => handleChange('signalName', e.target.value)}
                        placeholder="e.g. StartRequest"
                    />
                </div>
            </>
        );

        // =============== Swimlane Fields ===============
        const renderSwimlaneFields = () => {
            const lanes = (selectedNode.data.lanes as string[]) || ['Lane 1', 'Lane 2'];

            const addLane = () => handleChange('lanes', [...lanes, `Lane ${lanes.length + 1}`]);
            const updateLane = (idx: number, val: string) => {
                const newLanes = [...lanes];
                newLanes[idx] = val;
                handleChange('lanes', newLanes);
            };
            const removeLane = (idx: number) => {
                if (lanes.length > 1) {
                    handleChange('lanes', lanes.filter((_, i) => i !== idx));
                }
            };

            return (
                <>
                    <div className={styles.sectionHeader}>Swimlane Configuration</div>
                    <div className={styles.field}>
                        <label className={styles.label}>Lanes</label>
                    </div>
                    {lanes.map((lane, i) => (
                        <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                            <input
                                className={styles.input}
                                value={lane}
                                onChange={(e) => updateLane(i, e.target.value)}
                                placeholder="Lane name"
                            />
                            <button
                                onClick={() => removeLane(i)}
                                style={{ background: 'none', border: 'none', color: lanes.length > 1 ? '#ef4444' : '#666', cursor: lanes.length > 1 ? 'pointer' : 'not-allowed' }}
                                disabled={lanes.length <= 1}
                            >×</button>
                        </div>
                    ))}
                    <button onClick={addLane} className={styles.value} style={{ cursor: 'pointer', color: 'var(--primary)' }}>+ Add Lane</button>
                </>
            );
        };

        // =============== Interruptible Region Fields ===============
        const renderInterruptibleRegionFields = () => (
            <>
                <div className={styles.sectionHeader}>Interruptible Region</div>
                <div className={styles.field}>
                    <label className={styles.label}>Region Name</label>
                    <input
                        className={styles.input}
                        value={selectedNode.data.regionName as string || ''}
                        onChange={(e) => handleChange('regionName', e.target.value)}
                        placeholder="e.g. Critical Section"
                    />
                </div>
            </>
        );

        // =============== Diagram Frame Fields ===============
        const renderDiagramFrameFields = () => (
            <>
                <div className={styles.sectionHeader}>Diagram Frame</div>
                <div className={styles.field}>
                    <label className={styles.label}>Diagram Type</label>
                    <select
                        className={styles.select}
                        value={selectedNode.data.diagramType as string || 'bdd'}
                        onChange={(e) => handleChange('diagramType', e.target.value)}
                    >
                        <option value="bdd">bdd - Block Definition Diagram</option>
                        <option value="ibd">ibd - Internal Block Diagram</option>
                        <option value="act">act - Activity Diagram</option>
                        <option value="req">req - Requirement Diagram</option>
                        <option value="par">par - Parametric Diagram</option>
                        <option value="pkg">pkg - Package Diagram</option>
                        <option value="stm">stm - State Machine Diagram</option>
                        <option value="uc">uc - Use Case Diagram</option>
                        <option value="sd">sd - Sequence Diagram</option>
                    </select>
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Element Type</label>
                    <input
                        className={styles.input}
                        value={selectedNode.data.elementType as string || 'Package'}
                        onChange={(e) => handleChange('elementType', e.target.value)}
                        placeholder="e.g. Package, Block"
                    />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Element Name</label>
                    <input
                        className={styles.input}
                        value={selectedNode.data.elementName as string || ''}
                        onChange={(e) => handleChange('elementName', e.target.value)}
                        placeholder="e.g. Vehicle Structure"
                    />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Diagram Name</label>
                    <input
                        className={styles.input}
                        value={selectedNode.data.diagramName as string || ''}
                        onChange={(e) => handleChange('diagramName', e.target.value)}
                        placeholder="e.g. Main BDD"
                    />
                </div>
            </>
        );

        return (
            <div className={styles.propertiesPanel}>
                <div className={styles.title}>Node Properties</div>

                <div className={styles.field}>
                    <label className={styles.label}>Type</label>
                    <div className={styles.value} style={{ textTransform: 'capitalize' }}>
                        {selectedNode.type || 'default'}
                    </div>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>ID</label>
                    <div className={styles.value} style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {selectedNode.id}
                    </div>
                </div>

                {renderCommonFields()}

                {selectedNode.type === 'ecu' && renderECUFields()}
                {selectedNode.type === 'sensor' && renderSensorFields()}
                {selectedNode.type === 'actuator' && renderActuatorFields()}
                {selectedNode.type === 'gateway' && renderGatewayFields()}
                {selectedNode.type === 'sysmlBlock' && renderSysMLBlockFields()}
                {selectedNode.type === 'sysmlPart' && renderPartFields()}
                {selectedNode.type === 'sysmlRequirement' && renderSysMLRequirementFields()}
                {selectedNode.type === 'sysmlPort' && renderSysMLPortFields()}
                {selectedNode.type === 'sysmlConstraintBlock' && renderConstraintBlockFields()}
                {selectedNode.type === 'sysmlAction' && renderActionFields()}
                {selectedNode.type === 'sysmlDecision' && renderDecisionFields()}
                {selectedNode.type === 'sysmlForkJoin' && renderForkJoinFields()}
                {selectedNode.type === 'sysmlFinal' && renderFinalFields()}
                {selectedNode.type === 'sysmlSignal' && renderSignalFields()}
                {selectedNode.type === 'sysmlSwimlane' && renderSwimlaneFields()}
                {selectedNode.type === 'sysmlInterruptibleRegion' && renderInterruptibleRegionFields()}
                {selectedNode.type === 'diagramFrame' && renderDiagramFrameFields()}

                {/* TextBox / Note / Comment Properties */}
                {(['textBox', 'note', 'comment'].includes(selectedNode.type || '')) && (
                    <>
                        <div className={styles.sectionHeader}>Text Formatting</div>
                        <div className={styles.field}>
                            <label className={styles.label}>Text Content</label>
                            <textarea
                                className={styles.textarea}
                                value={selectedNode.data.text as string || ''}
                                onChange={(e) => handleChange('text', e.target.value)}
                                placeholder="Enter text..."
                                rows={3}
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Font Size (px)</label>
                            <input
                                type="range"
                                min="10"
                                max="36"
                                value={selectedNode.data.fontSize as number || 14}
                                onChange={(e) => handleChange('fontSize', Number(e.target.value))}
                                style={{ width: '100%' }}
                            />
                            <span style={{ fontSize: '11px', color: '#888' }}>{String(selectedNode.data.fontSize || 14)}px</span>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Font Weight</label>
                            <select
                                className={styles.select}
                                value={selectedNode.data.fontWeight as string || 'normal'}
                                onChange={(e) => handleChange('fontWeight', e.target.value)}
                            >
                                <option value="normal">Normal</option>
                                <option value="bold">Bold</option>
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Text Color</label>
                            <input
                                type="color"
                                value={selectedNode.data.textColor as string || '#e5e7eb'}
                                onChange={(e) => handleChange('textColor', e.target.value)}
                                style={{ width: '100%', height: 30 }}
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Background Color</label>
                            <input
                                type="color"
                                value={selectedNode.data.backgroundColor as string || '#2a2a3e'}
                                onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                style={{ width: '100%', height: 30 }}
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Style Variant</label>
                            <select
                                className={styles.select}
                                value={selectedNode.data.variant as string || 'default'}
                                onChange={(e) => handleChange('variant', e.target.value)}
                            >
                                <option value="default">Default</option>
                                <option value="note">Note (Sticky)</option>
                                <option value="comment">Comment (Dashed)</option>
                                <option value="transparent">Transparent</option>
                                <option value="bordered">Bordered</option>
                            </select>
                        </div>
                    </>
                )}

                <div className={styles.sectionHeader}>Layout</div>
                <div className={styles.field}>
                    <label className={styles.label}>Position</label>
                    <div className={styles.value}>
                        X: {Math.round(selectedNode.position.x)}, Y: {Math.round(selectedNode.position.y)}
                    </div>
                </div>

                {/* Appearance Section - General Font Controls */}
                <div className={styles.sectionHeader}>Appearance</div>
                <div className={styles.field}>
                    <label className={styles.label}>Label Font Size (px)</label>
                    <input
                        type="range"
                        min="10"
                        max="24"
                        value={selectedNode.data.labelFontSize as number || 13}
                        onChange={(e) => handleChange('labelFontSize', Number(e.target.value))}
                        style={{ width: '100%' }}
                    />
                    <span style={{ fontSize: '11px', color: '#888' }}>{String(selectedNode.data.labelFontSize || 13)}px</span>
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Label Color</label>
                    <input
                        type="color"
                        value={selectedNode.data.labelColor as string || '#ffffff'}
                        onChange={(e) => handleChange('labelColor', e.target.value)}
                        style={{ width: '100%', height: 28, cursor: 'pointer' }}
                    />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Background Color</label>
                    <input
                        type="color"
                        value={selectedNode.data.backgroundColor as string || '#1e1e2e'}
                        onChange={(e) => handleChange('backgroundColor', e.target.value)}
                        style={{ width: '100%', height: 28, cursor: 'pointer' }}
                    />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Border Color</label>
                    <input
                        type="color"
                        value={selectedNode.data.borderColor as string || '#6366f1'}
                        onChange={(e) => handleChange('borderColor', e.target.value)}
                        style={{ width: '100%', height: 28, cursor: 'pointer' }}
                    />
                </div>
            </div>
        );
    }

    // Handle Edge Properties
    if (selectedEdge) {
        const handleEdgeTypeChange = (newType: string) => {
            // Universal update: force type to 'sysml' and set connectorType data
            // This ensures both new and legacy edges use the correct component and styling
            onEdgeChange(selectedEdge.id, {
                type: 'sysml',
                data: { ...selectedEdge.data, connectorType: newType }
            });
        };

        const handleDataChange = (field: string, value: any) => {
            const newData = { ...selectedEdge.data, [field]: value };
            onEdgeChange(selectedEdge.id, { data: newData }); // Only update data
        };

        return (
            <div className={styles.propertiesPanel} >
                <div className={styles.title}>Connector Properties</div>

                <div className={styles.field}>
                    <label className={styles.label}>ID</label>
                    <div className={styles.value} style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {selectedEdge.id}
                    </div>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Connector Kind</label>
                    <select
                        className={styles.select}
                        value={String(selectedEdge.data?.connectorType || selectedEdge.type || 'default')}
                        onChange={(e) => handleEdgeTypeChange(e.target.value)}
                    >
                        {/* Default / Legacy Support */}
                        <option value="default">Default</option>
                        <option value="sysml">Legacy SysML (Standard)</option>

                        {/* Generated Options from Config */}
                        {Object.values(SYSML_CONNECTORS).map((connector) => {
                            const sourceNode = nodes.find(n => n.id === selectedEdge.source);
                            const targetNode = nodes.find(n => n.id === selectedEdge.target);
                            const isValid = isValidSysMLConnection(
                                sourceNode?.type,
                                targetNode?.type,
                                connector.id
                            );

                            return (
                                <option
                                    key={connector.id}
                                    value={connector.id}
                                    disabled={!isValid}
                                >
                                    {connector.label} {!isValid ? '(Invalid)' : ''}
                                </option>
                            );
                        })}
                    </select>
                </div>

                {/* Show Item Flow input only if relevant or configured */}
                {(selectedEdge.type === 'itemFlow' || !!selectedEdge.data?.itemFlow) && (
                    <div className={styles.field}>
                        <label className={styles.label}>Item Flow (Conveyed Item)</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={(selectedEdge.data?.itemFlow as string) || ''}
                            onChange={(e) => handleDataChange('itemFlow', e.target.value)}
                            placeholder="e.g. Fuel, Data..."
                        />
                    </div>
                )}

                {/* CAN Bus Specific Properties */}
                {selectedEdge.type === 'can' && (
                    <>
                        <div className={styles.sectionHeader}>CAN Configuration</div>
                        <div className={styles.field}>
                            <label className={styles.label}>CAN ID</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={(selectedEdge.data?.canId as string) || ''}
                                onChange={(e) => handleDataChange('canId', e.target.value)}
                                placeholder="e.g. 0x123"
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Bus Type</label>
                            <select
                                className={styles.select}
                                value={(selectedEdge.data?.busType as string) || 'classic'}
                                onChange={(e) => handleDataChange('busType', e.target.value)}
                            >
                                <option value="classic">Classic CAN</option>
                                <option value="canfd">CAN FD</option>
                                <option value="highspeed">High Speed</option>
                                <option value="lowspeed">Low Speed</option>
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Flow Name</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={(selectedEdge.data?.flowName as string) || ''}
                                onChange={(e) => handleDataChange('flowName', e.target.value)}
                                placeholder="e.g. EngineTemp"
                            />
                        </div>
                    </>
                )}

                {/* LIN Bus Specific Properties */}
                {selectedEdge.type === 'lin' && (
                    <>
                        <div className={styles.sectionHeader}>LIN Configuration</div>
                        <div className={styles.field}>
                            <label className={styles.label}>LIN ID</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={(selectedEdge.data?.linId as string) || ''}
                                onChange={(e) => handleDataChange('linId', e.target.value)}
                                placeholder="e.g. 0x10"
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Baud Rate</label>
                            <select
                                className={styles.select}
                                value={(selectedEdge.data?.baudRate as string) || '19200'}
                                onChange={(e) => handleDataChange('baudRate', e.target.value)}
                            >
                                <option value="9600">9600 bps</option>
                                <option value="19200">19200 bps</option>
                            </select>
                        </div>
                    </>
                )}

                {/* Ethernet Specific Properties */}
                {selectedEdge.type === 'ethernet' && (
                    <>
                        <div className={styles.sectionHeader}>Ethernet Configuration</div>
                        <div className={styles.field}>
                            <label className={styles.label}>VLAN ID</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={(selectedEdge.data?.vlanId as string) || ''}
                                onChange={(e) => handleDataChange('vlanId', e.target.value)}
                                placeholder="e.g. 10"
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Bandwidth</label>
                            <select
                                className={styles.select}
                                value={(selectedEdge.data?.bandwidth as string) || '100'}
                                onChange={(e) => handleDataChange('bandwidth', e.target.value)}
                            >
                                <option value="10">10 Mbps</option>
                                <option value="100">100 Mbps</option>
                                <option value="1000">1 Gbps</option>
                            </select>
                        </div>
                    </>
                )}

                {/* Control/Object Flow Properties (Guards) */}
                {(['controlFlow', 'objectFlow', 'default'].includes(selectedEdge.type || '')) && (
                    <div className={styles.field}>
                        <label className={styles.label}>Guard Condition</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={(selectedEdge.data?.guard as string) || ''}
                            onChange={(e) => handleDataChange('guard', e.target.value)}
                            placeholder="e.g. [x > 0] or Yes"
                        />
                    </div>
                )}

                {/* State Machine Transition Properties */}
                {selectedEdge.type === 'transition' && (
                    <>
                        <div className={styles.sectionHeader}>Transition Properties</div>
                        <div className={styles.field}>
                            <label className={styles.label}>Trigger (Event)</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={(selectedEdge.data?.trigger as string) || ''}
                                onChange={(e) => handleDataChange('trigger', e.target.value)}
                                placeholder="e.g. start, click, timeout"
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Guard [condition]</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={(selectedEdge.data?.guard as string) || ''}
                                onChange={(e) => handleDataChange('guard', e.target.value)}
                                placeholder="e.g. fuelLevel > 10"
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Effect / action</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={(selectedEdge.data?.effect as string) || ''}
                                onChange={(e) => handleDataChange('effect', e.target.value)}
                                placeholder="e.g. startMotor()"
                            />
                        </div>
                        <div className={styles.helpText} style={{ fontSize: '10px', color: '#888', marginTop: '8px', padding: '4px' }}>
                            Label format: <code>trigger [guard] / effect</code>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return null;
}
