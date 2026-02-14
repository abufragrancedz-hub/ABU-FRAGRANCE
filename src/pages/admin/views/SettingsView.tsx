import React, { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { db } from '../../../lib/firebase';
import {
    collection,
    getDocs,
    setDoc,
    doc,
    timestamp
} from 'firebase/firestore';
import { CARRIERS } from '../../../utils/tracking';

export const SettingsView: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [configs, setConfigs] = useState<Record<string, { api_id: string; api_token: string }>>({});

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'delivery_config'));
            const configMap: Record<string, any> = {};
            querySnapshot.forEach(doc => {
                const data = doc.data();
                configMap[data.carrier_id] = { api_id: data.api_id, api_token: data.api_token };
            });
            setConfigs(configMap);
        } catch (error) {
            console.error('Error fetching configs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (carrierId: string) => {
        setSaving(true);
        const config = configs[carrierId];
        try {
            const docRef = doc(db, 'delivery_config', carrierId);
            await setDoc(docRef, {
                carrier_id: carrierId,
                api_id: config?.api_id || '',
                api_token: config?.api_token || '',
                updatedAt: new Date().toISOString()
            }, { merge: true });

            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (carrierId: string, field: 'api_id' | 'api_token', value: string) => {
        setConfigs(prev => ({
            ...prev,
            [carrierId]: {
                ...prev[carrierId],
                [field]: value
            }
        }));
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary/40" /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black text-primary uppercase tracking-tight">System Settings</h2>
                <p className="text-gray-500 font-medium">Configure your shipping and delivery integrations.</p>
            </div>

            <div className="grid gap-8">
                {CARRIERS.map(carrier => (
                    <div key={carrier.id} className="bg-white rounded-[2rem] shadow-sm border border-primary/5 p-8 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-8 border-b border-primary/5 pb-6">
                            <div className="flex flex-col">
                                <h3 className="text-xl font-black text-primary uppercase tracking-wide">{carrier.name}</h3>
                                <p className="text-xs font-bold text-secondary uppercase tracking-widest mt-1">Status: Operational</p>
                            </div>
                            <button
                                onClick={() => handleSave(carrier.id)}
                                disabled={saving}
                                className="flex items-center px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/20 hover:-translate-y-0.5"
                            >
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Save Changes
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400">API Access Token</label>
                                <div className="relative group">
                                    <input
                                        type="password"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-transparent focus:border-primary/20 focus:bg-white rounded-xl transition-all outline-none font-mono text-sm text-primary"
                                        placeholder={`Paste your ${carrier.name} Token here`}
                                        value={configs[carrier.id]?.api_token || ''}
                                        onChange={e => handleChange(carrier.id, 'api_token', e.target.value)}
                                    />
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-20 group-focus-within:opacity-50 transition-opacity">
                                        <Save className="w-4 h-4 text-primary" />
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 font-medium italic">Found in your {carrier.name} dashboard under API/Integration settings.</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
