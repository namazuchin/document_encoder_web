import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { type PromptPreset } from '../types';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import styles from '../components/dashboard/DashboardComponents.module.css';

export const PromptManager: React.FC = () => {
    const { presets, updatePresets } = useApp();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<PromptPreset | null>(null);

    const handleCreate = () => {
        const newPreset: PromptPreset = {
            id: crypto.randomUUID(),
            name: 'New Preset',
            content: '',
            isDefault: false
        };
        setEditForm(newPreset);
        setEditingId(newPreset.id);
    };

    const handleEdit = (preset: PromptPreset) => {
        setEditForm({ ...preset });
        setEditingId(preset.id);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this preset?')) {
            updatePresets(presets.filter(p => p.id !== id));
        }
    };

    const handleSave = () => {
        if (!editForm) return;

        if (presets.find(p => p.id === editForm.id)) {
            updatePresets(presets.map(p => p.id === editForm.id ? editForm : p));
        } else {
            updatePresets([...presets, editForm]);
        }
        setEditingId(null);
        setEditForm(null);
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm(null);
    };

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Prompt Presets</h2>
                {!editingId && (
                    <button onClick={handleCreate} className={`${styles.button} ${styles.primaryButton}`}>
                        <Plus size={16} /> New Preset
                    </button>
                )}
            </div>

            {editingId && editForm ? (
                <div className="bg-gray-50 p-4 rounded-lg border border-blue-200 mb-6">
                    <h3 className="font-semibold mb-4 text-blue-800">
                        {presets.find(p => p.id === editForm.id) ? 'Edit Preset' : 'New Preset'}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className={styles.label}>Name</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={editForm.name}
                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className={styles.label}>Content</label>
                            <textarea
                                className={`${styles.textarea} h-48`}
                                value={editForm.content}
                                onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button onClick={handleCancel} className={`${styles.button} ${styles.secondaryButton}`}>
                                <X size={16} /> Cancel
                            </button>
                            <button onClick={handleSave} className={`${styles.button} ${styles.primaryButton}`}>
                                <Save size={16} /> Save
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {presets.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                            No custom presets found. Create one to get started.
                        </div>
                    )}
                    {presets.map(preset => (
                        <div key={preset.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                            <div>
                                <h3 className="font-medium text-gray-900">{preset.name}</h3>
                                <p className="text-sm text-gray-500 truncate max-w-md">{preset.content}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(preset)}
                                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(preset.id)}
                                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
