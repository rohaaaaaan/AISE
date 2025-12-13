import React, { useEffect, useState } from 'react';
import { X, Trash2, Clock, Database } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';

interface ProjectSummary {
    id: number;
    name: string;
    updated_at: string;
    data_size: number;
}

interface ProjectListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoadProject: (id: number) => void;
}

export function ProjectListModal({ isOpen, onClose, onLoadProject }: ProjectListModalProps) {
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            // Updated backend port to 8000
            const res = await fetch(`${API_BASE_URL}/projects`);
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to load projects from server.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this project?')) return;

        try {
            await fetch(`${API_BASE_URL}/projects/${id}`, { method: 'DELETE' });
            fetchProjects(); // Reload list
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchProjects();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: '#1e1e2f', width: 500, borderRadius: 12,
                border: '1px solid #2d2d44', display: 'flex', flexDirection: 'column',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{
                    padding: '16px 20px', borderBottom: '1px solid #2d2d44',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e5e7eb', fontSize: 16, fontWeight: 600 }}>
                        <Database size={18} className="text-purple-400" />
                        Saved Projects
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: 20, maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {loading ? (
                        <div style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>Loading...</div>
                    ) : projects.length === 0 ? (
                        <div style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>No saved projects found.</div>
                    ) : (
                        projects.map(p => (
                            <div
                                key={p.id}
                                onClick={() => onLoadProject(p.id)}
                                style={{
                                    backgroundColor: '#2d2d44', padding: '12px 16px', borderRadius: 8,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    transition: 'background 0.2s', border: '1px solid transparent'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                            >
                                <div>
                                    <div style={{ color: '#fff', fontWeight: 500 }}>{p.name}</div>
                                    <div style={{ color: '#9ca3af', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                        <Clock size={12} />
                                        {new Date(p.updated_at).toLocaleString()}
                                        <span style={{ margin: '0 4px' }}>•</span>
                                        {Math.round(p.data_size / 1024)} KB
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(p.id, e)}
                                    title="Delete Project"
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: 4,
                                        padding: 6, color: '#ef4444', cursor: 'pointer', display: 'flex'
                                    }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
