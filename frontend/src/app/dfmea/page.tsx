'use client';

import { useState, useEffect } from 'react';
import { Plus, Shield, Trash2, Box, Sparkles, Loader2 } from 'lucide-react';
import styles from './dfmea.module.css';
import { useModel } from '@/context/ModelContext';
import { API_BASE_URL } from '@/config/api';
import clsx from 'clsx'; // Assuming clsx might be used or styles logic is fine manually

interface DFMEAEntry {
    id: string;
    displayId: string; // Sequential ID like DFMEA-001
    itemFunction: string;
    failureMode: string;
    potentialEffects: string;
    severity: number;
    potentialCauses: string;
    occurrence: number;
    currentControls: string;
    detection: number;
    recommendedActions: string;
    responsibility: string;
    status: 'Open' | 'In Progress' | 'Closed';
    sourceNodeId?: string;
    isAnalyzing?: boolean;
}

const ANALYZABLE_NODE_TYPES = [
    'sysmlBlock', 'sysmlPart', 'sysmlAction', 'ecu', 'sensor',
    'actuator', 'gateway', 'sysmlState',
];

export default function DFMEAPage() {
    const { nodes } = useModel(); // Use global model state
    const [entries, setEntries] = useState<DFMEAEntry[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [idCounter, setIdCounter] = useState(1);

    // Load entries and ID counter from localStorage on mount
    useEffect(() => {
        try {
            const savedEntries = localStorage.getItem('dfmea_entries');
            const savedCounter = localStorage.getItem('dfmea_id_counter');

            if (savedEntries) {
                setEntries(JSON.parse(savedEntries));
            }
            if (savedCounter) {
                setIdCounter(parseInt(savedCounter, 10));
            }
        } catch (e) {
            console.error('Failed to load DFMEA data:', e);
        }
    }, []);

    // Save entries to localStorage whenever they change
    useEffect(() => {
        if (entries.length > 0) {
            try {
                localStorage.setItem('dfmea_entries', JSON.stringify(entries));
            } catch (e) {
                console.error('Failed to save DFMEA entries:', e);
            }
        }
    }, [entries]);

    // Save ID counter to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('dfmea_id_counter', String(idCounter));
        } catch (e) {
            console.error('Failed to save DFMEA ID counter:', e);
        }
    }, [idCounter]);

    // Generate next sequential ID
    const getNextId = () => {
        const nextId = `DFMEA-${String(idCounter).padStart(3, '0')}`;
        setIdCounter(prev => prev + 1);
        return nextId;
    };

    const calculateRPN = (s: number, o: number, d: number) => s * o * d;

    const getRPNClass = (rpn: number) => {
        if (rpn >= 200) return styles.rpnHigh;
        if (rpn >= 100) return styles.rpnMedium;
        return styles.rpnLow;
    };

    const addEntry = () => {
        const newEntry: DFMEAEntry = {
            id: `dfmea_${Date.now()}`,
            displayId: getNextId(),
            itemFunction: '',
            failureMode: '',
            potentialEffects: '',
            severity: 5,
            potentialCauses: '',
            occurrence: 5,
            currentControls: '',
            detection: 5,
            recommendedActions: '',
            responsibility: '',
            status: 'Open',
        };
        setEntries([...entries, newEntry]);
    };

    const updateEntry = (id: string, field: keyof DFMEAEntry, value: any) => {
        setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
    };

    const deleteEntry = (id: string) => {
        setEntries(entries.filter(e => e.id !== id));
    };

    // AI-powered analysis for a single entry
    const analyzeEntryWithAI = async (entryId: string) => {
        const entry = entries.find(e => e.id === entryId);
        if (!entry || !entry.itemFunction.trim()) {
            alert('Please enter an Item/Function name first.');
            return;
        }

        setEntries(entries.map(e => e.id === entryId ? { ...e, isAnalyzing: true } : e));

        const apiKey = localStorage.getItem('openai_api_key');
        const baseUrl = localStorage.getItem('openai_base_url');
        const model = localStorage.getItem('openai_model');

        if (!apiKey) {
            alert('Please configure your API Key in Settings first.');
            setEntries(entries.map(e => e.id === entryId ? { ...e, isAnalyzing: false } : e));
            return;
        }

        try {
            // Using backend endpoint now
            const response = await fetch(`${API_BASE_URL}/generate-dfmea`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    component_name: entry.itemFunction,
                    component_type: entry.itemFunction.match(/\(([^)]+)\)/)?.[1] || 'Component',
                    api_key: apiKey,
                    base_url: baseUrl,
                    model: model
                }),
            });

            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();
            const analysis = data.failureModes?.[0]; // Use first suggestion

            if (analysis) {
                setEntries(entries.map(e => e.id === entryId ? {
                    ...e,
                    failureMode: analysis.mode || e.failureMode,
                    potentialEffects: analysis.effects || e.potentialEffects,
                    potentialCauses: analysis.causes || e.potentialCauses,
                    currentControls: analysis.controls || e.currentControls,
                    recommendedActions: analysis.actions || e.recommendedActions,
                    severity: analysis.suggestedSeverity || e.severity,
                    occurrence: analysis.suggestedOccurrence || e.occurrence,
                    detection: analysis.suggestedDetection || e.detection,
                    isAnalyzing: false,
                } : e));
            }
        } catch (error) {
            console.error('AI analysis failed:', error);
            alert('AI analysis failed. Please try again.');
            setEntries(entries.map(e => e.id === entryId ? { ...e, isAnalyzing: false } : e));
        }
    };

    // Generate and analyze from model with AI
    const generateFromModelWithAI = async () => {
        try {
            const analyzableNodes = nodes.filter((n: any) => ANALYZABLE_NODE_TYPES.includes(n.type));

            if (analyzableNodes.length === 0) {
                alert('No analyzable components found in the model.');
                return;
            }

            const existingSourceIds = new Set(entries.filter(e => e.sourceNodeId).map(e => e.sourceNodeId));
            const newNodes = analyzableNodes.filter((n: any) => !existingSourceIds.has(n.id));

            if (newNodes.length === 0) {
                alert('All model components already have DFMEA entries.');
                return;
            }

            const apiKey = localStorage.getItem('openai_api_key');
            const baseUrl = localStorage.getItem('openai_base_url');
            const model = localStorage.getItem('openai_model');

            if (!apiKey) {
                alert('Please configure your API Key in Settings first.');
                return;
            }

            setIsGenerating(true);
            const newEntries: DFMEAEntry[] = [];
            let currentIdCounter = idCounter;

            for (const node of newNodes) {
                const label = node.data?.label || node.data?.name || `${node.type}_${node.id.slice(-4)}`;
                const nodeType = node.type?.replace('sysml', '').replace(/([A-Z])/g, ' $1').trim() || 'Component';

                const displayId = `DFMEA-${String(currentIdCounter).padStart(3, '0')}`;
                currentIdCounter++;

                // Create base entry
                const baseEntry: DFMEAEntry = {
                    id: `dfmea_${Date.now()}_${node.id}`,
                    displayId: displayId,
                    itemFunction: `${label} (${nodeType})`,
                    failureMode: '',
                    potentialEffects: '',
                    severity: 5,
                    potentialCauses: '',
                    occurrence: 5,
                    currentControls: '',
                    detection: 5,
                    recommendedActions: '',
                    responsibility: '',
                    status: 'Open',
                    sourceNodeId: node.id,
                };

                // Try to get AI analysis
                try {
                    const response = await fetch(`${API_BASE_URL}/generate-dfmea`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            component_name: label,
                            component_type: nodeType,
                            api_key: apiKey,
                            base_url: baseUrl,
                            model: model
                        }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const analysis = data.failureModes?.[0];
                        if (analysis) {
                            baseEntry.failureMode = analysis.mode || '';
                            baseEntry.potentialEffects = analysis.effects || '';
                            baseEntry.potentialCauses = analysis.causes || '';
                            baseEntry.currentControls = analysis.controls || '';
                            baseEntry.recommendedActions = analysis.actions || '';
                            baseEntry.severity = analysis.suggestedSeverity || 5;
                            baseEntry.occurrence = analysis.suggestedOccurrence || 5;
                            baseEntry.detection = analysis.suggestedDetection || 5;
                        }
                    }
                } catch (e) {
                    console.log('AI analysis skipped for', label);
                }

                newEntries.push(baseEntry);
            }

            setEntries([...entries, ...newEntries]);
            setIdCounter(currentIdCounter);
            setIsGenerating(false);
            alert(`Generated ${newEntries.length} AI-powered DFMEA entries!`);

        } catch (e) {
            console.error('Failed to generate:', e);
            setIsGenerating(false);
            alert('Failed to generate DFMEA entries.');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Design FMEA (DFMEA)</h1>
                <p>AI-Powered Failure Mode and Effects Analysis</p>
            </div>

            <div className={styles.toolbar}>
                <button className={styles.addButton} onClick={addEntry}>
                    <Plus size={16} />
                    Add Entry
                </button>
                <button
                    className={styles.addButton}
                    onClick={generateFromModelWithAI}
                    disabled={isGenerating}
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
                >
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {isGenerating ? 'Generating...' : 'Generate with AI'}
                </button>
                <span style={{ color: '#888', fontSize: 13, marginLeft: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Box size={14} />
                    Active Nodes: {nodes.length}
                </span>
            </div>

            <div className={styles.tableContainer}>
                {entries.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Shield size={48} className={styles.emptyIcon} />
                        <h3 className={styles.emptyTitle}>No DFMEA Entries</h3>
                        <p className={styles.emptyDescription}>
                            Generate AI-powered DFMEA entries from your model, or add entries manually.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                className={styles.addButton}
                                onClick={generateFromModelWithAI}
                                disabled={isGenerating}
                                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
                            >
                                <Sparkles size={16} />
                                Generate with AI
                            </button>
                            <button className={styles.addButton} onClick={addEntry}>
                                <Plus size={16} />
                                Add Manually
                            </button>
                        </div>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th style={{ width: 90 }}>ID</th>
                                <th style={{ width: 140 }}>Item/Function</th>
                                <th style={{ width: 140 }}>Failure Mode</th>
                                <th style={{ width: 140 }}>Potential Effects</th>
                                <th style={{ width: 50 }}>S</th>
                                <th style={{ width: 140 }}>Potential Causes</th>
                                <th style={{ width: 50 }}>O</th>
                                <th style={{ width: 140 }}>Current Controls</th>
                                <th style={{ width: 50 }}>D</th>
                                <th style={{ width: 60 }}>RPN</th>
                                <th style={{ width: 140 }}>Recommended Actions</th>
                                <th style={{ width: 100 }}>Status</th>
                                <th style={{ width: 80 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry) => {
                                const rpn = calculateRPN(entry.severity, entry.occurrence, entry.detection);
                                return (
                                    <tr key={entry.id}>
                                        <td style={{ fontWeight: 600, color: '#6366f1', fontSize: 12 }}>
                                            {entry.displayId}
                                        </td>
                                        <td>
                                            <textarea
                                                className={styles.textInput}
                                                value={entry.itemFunction}
                                                onChange={(e) => updateEntry(entry.id, 'itemFunction', e.target.value)}
                                                placeholder="Component..."
                                            />
                                        </td>
                                        <td>
                                            <textarea
                                                className={styles.textInput}
                                                value={entry.failureMode}
                                                onChange={(e) => updateEntry(entry.id, 'failureMode', e.target.value)}
                                                placeholder="How it could fail..."
                                            />
                                        </td>
                                        <td>
                                            <textarea
                                                className={styles.textInput}
                                                value={entry.potentialEffects}
                                                onChange={(e) => updateEntry(entry.id, 'potentialEffects', e.target.value)}
                                                placeholder="Impact of failure..."
                                            />
                                        </td>
                                        <td className={styles.ratingCell}>
                                            <input
                                                type="number"
                                                className={styles.ratingInput}
                                                min={1}
                                                max={10}
                                                value={entry.severity}
                                                onChange={(e) => updateEntry(entry.id, 'severity', Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                                            />
                                        </td>
                                        <td>
                                            <textarea
                                                className={styles.textInput}
                                                value={entry.potentialCauses}
                                                onChange={(e) => updateEntry(entry.id, 'potentialCauses', e.target.value)}
                                                placeholder="Why it might fail..."
                                            />
                                        </td>
                                        <td className={styles.ratingCell}>
                                            <input
                                                type="number"
                                                className={styles.ratingInput}
                                                min={1}
                                                max={10}
                                                value={entry.occurrence}
                                                onChange={(e) => updateEntry(entry.id, 'occurrence', Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                                            />
                                        </td>
                                        <td>
                                            <textarea
                                                className={styles.textInput}
                                                value={entry.currentControls}
                                                onChange={(e) => updateEntry(entry.id, 'currentControls', e.target.value)}
                                                placeholder="Detection methods..."
                                            />
                                        </td>
                                        <td className={styles.ratingCell}>
                                            <input
                                                type="number"
                                                className={styles.ratingInput}
                                                min={1}
                                                max={10}
                                                value={entry.detection}
                                                onChange={(e) => updateEntry(entry.id, 'detection', Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                                            />
                                        </td>
                                        <td className={`${styles.rpnCell} ${getRPNClass(rpn)}`}>
                                            {rpn}
                                        </td>
                                        <td>
                                            <textarea
                                                className={styles.textInput}
                                                value={entry.recommendedActions}
                                                onChange={(e) => updateEntry(entry.id, 'recommendedActions', e.target.value)}
                                                placeholder="Mitigation steps..."
                                            />
                                        </td>
                                        <td>
                                            <select
                                                className={styles.selectInput}
                                                value={entry.status}
                                                onChange={(e) => updateEntry(entry.id, 'status', e.target.value as any)}
                                            >
                                                <option value="Open">Open</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Closed">Closed</option>
                                            </select>
                                        </td>
                                        <td style={{ display: 'flex', gap: 4, flexDirection: 'column' }}>
                                            <button
                                                className={styles.addButton}
                                                onClick={() => analyzeEntryWithAI(entry.id)}
                                                disabled={entry.isAnalyzing}
                                                style={{ padding: '4px 8px', fontSize: 11 }}
                                                title="AI Analyze"
                                            >
                                                {entry.isAnalyzing ? <Loader2 size={12} /> : <Sparkles size={12} />}
                                            </button>
                                            <button
                                                className={styles.deleteButton}
                                                onClick={() => deleteEntry(entry.id)}
                                                title="Delete"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
