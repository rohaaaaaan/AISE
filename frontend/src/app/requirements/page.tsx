'use client';

import { useState, useMemo } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import styles from './requirements.module.css';
import { clsx } from 'clsx';
import { useModel } from '@/context/ModelContext';
import { generateSysMLId } from '@/utils/idGenerator';

interface Requirement {
  id: string;
  description: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
}

export default function RequirementsPage() {
  const { nodes, setNodes } = useModel();
  const [isAdding, setIsAdding] = useState(false);
  const [newReq, setNewReq] = useState<Partial<Requirement>>({ priority: 'Medium' });

  // Filter nodes to get only Requirements
  const requirements = useMemo(() => {
    return nodes
      .filter((n) => n.type === 'sysmlRequirement')
      .map((n) => ({
        id: n.data.reqId as string || n.id,
        description: n.data.reqText as string || n.data.label as string || 'No description',
        priority: (n.data.priority as 'Critical' | 'High' | 'Medium' | 'Low') || 'Medium',
        nodeId: n.id // storing actual node ID for deletion
      }));
  }, [nodes]);

  const handleDelete = (reqId: string, nodeId: string) => {
    // Remove the node from the model
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
  };

  const handleAdd = () => {
    if (!newReq.id || !newReq.description) return;

    // Create a new SysML Requirement Node
    const newNode = {
      id: generateSysMLId('req'),
      type: 'sysmlRequirement',
      position: { x: 100 + (requirements.length * 20), y: 100 + (requirements.length * 20) }, // Cascade positions
      data: {
        label: newReq.id,
        reqId: newReq.id,
        reqText: newReq.description,
        priority: newReq.priority
      }
    };

    setNodes((nds) => [...nds, newNode]);
    setIsAdding(false);
    setNewReq({ priority: 'Medium' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Requirements from Model</h1>
        <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
          <Plus size={16} style={{ marginRight: '8px' }} />
          Add Requirement
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>ID</th>
              <th className={styles.th}>Description</th>
              <th className={styles.th}>Priority</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isAdding && (
              <tr className={styles.tr}>
                <td className={styles.td}>
                  <input
                    className={styles.input}
                    placeholder="REQ-XXX"
                    value={newReq.id || ''}
                    onChange={(e) => setNewReq({ ...newReq, id: e.target.value })}
                  />
                </td>
                <td className={styles.td}>
                  <input
                    className={styles.input}
                    placeholder="Description..."
                    value={newReq.description || ''}
                    onChange={(e) => setNewReq({ ...newReq, description: e.target.value })}
                  />
                </td>
                <td className={styles.td}>
                  <select
                    className={styles.input}
                    value={newReq.priority}
                    onChange={(e) => setNewReq({ ...newReq, priority: e.target.value as any })}
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </td>
                <td className={styles.td}>
                  <div className={styles.actions}>
                    <button className="btn btn-primary" onClick={handleAdd}>
                      <Save size={16} />
                    </button>
                    <button className="btn btn-ghost" onClick={() => setIsAdding(false)}>
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {requirements.length === 0 && !isAdding && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No requirements found in the model.</td></tr>
            )}
            {requirements.map((req) => (
              <tr key={req.nodeId} className={styles.tr}>
                <td className={styles.td}>{req.id}</td>
                <td className={styles.td}>{req.description}</td>
                <td className={styles.td}>
                  <span
                    className={clsx(
                      styles.badge,
                      req.priority === 'Critical' && styles.badgeCritical,
                      req.priority === 'High' && styles.badgeHigh,
                      req.priority === 'Medium' && styles.badgeMedium,
                      req.priority === 'Low' && styles.badgeLow
                    )}
                  >
                    {req.priority}
                  </span>
                </td>
                <td className={styles.td}>
                  <button
                    className="btn btn-ghost"
                    style={{ color: '#ef4444' }}
                    onClick={() => handleDelete(req.id, req.nodeId)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
