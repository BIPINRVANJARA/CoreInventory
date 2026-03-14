import { useState, useEffect } from 'react';
import { FileEdit, Plus, XCircle } from 'lucide-react';
import api from '../api/axios';
import PremiumSelect from '../components/PremiumSelect';

export default function Adjustments() {
    const [adjustments, setAdjustments] = useState([]);
    const [locations, setLocations] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ product_id: '', location_id: '', physical_qty: 0, reason: 'recount', notes: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [adjRes, locRes, prodRes] = await Promise.all([
                api.get('/adjustments', { params: { limit: 50 } }),
                api.get('/locations'),
                api.get('/products')
            ]);
            setAdjustments(adjRes.data.data.adjustments);
            setLocations(locRes.data.data);
            setProducts(prodRes.data.data.products);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/adjustments', formData);
            setShowModal(false);
            fetchData();
            setFormData({ product_id: '', location_id: '', physical_qty: 0, reason: 'recount', notes: '' });
        } catch (err) {
            alert(err.response?.data?.message || 'Error creating adjustment');
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FileEdit className="w-6 h-6 text-brand-500" /> Stock Adjustments
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Record physical counts and correct inventory discrepancies.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-brand-500 text-white px-4 py-2 rounded-custom text-sm font-semibold flex items-center gap-2">
                    <Plus className="w-4 h-4" /> New Count
                </button>
            </div>

            <section className="bg-white rounded-custom border border-slate-200 shadow-sm flex-1 overflow-auto">
                <table className="w-full text-left bg-white">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold sticky top-0">
                        <tr>
                            <th className="px-6 py-3">Reference</th>
                            <th className="px-6 py-3">Product</th>
                            <th className="px-6 py-3">Location</th>
                            <th className="px-6 py-3">Sys Qty</th>
                            <th className="px-6 py-3">Physical Qty</th>
                            <th className="px-6 py-3">Diff</th>
                            <th className="px-6 py-3">Reason</th>
                            <th className="px-6 py-3 text-right">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan="8" className="p-8"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full spinner mx-auto"></div></td></tr> :
                            adjustments.length === 0 ? <tr><td colSpan="8" className="p-8 text-center text-slate-500">No adjustments recorded.</td></tr> :
                                adjustments.map(a => (
                                    <tr key={a.id} className="table-row-hover">
                                        <td className="px-6 py-4 font-semibold text-brand-600 text-sm">{a.reference_no}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{a.product_name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{a.location_name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{a.system_qty}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-800">{a.physical_qty}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-bold rounded ${a.difference_qty > 0 ? 'bg-emerald-100 text-emerald-700' : a.difference_qty < 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {a.difference_qty > 0 ? '+' : ''}{a.difference_qty}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 capitalize">{a.reason}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500 text-right">{new Date(a.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                    </tbody>
                </table>
            </section>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold mb-4">Record Physical Count</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <PremiumSelect
                                label="Product"
                                value={formData.product_id}
                                options={[{ id: '', name: 'Select Product...' }, ...products]}
                                onChange={e => setFormData({ ...formData, product_id: e.target.value })}
                            />
                            <PremiumSelect
                                label="Location"
                                value={formData.location_id}
                                options={[{ id: '', name: 'Select Location...' }, ...locations]}
                                onChange={e => setFormData({ ...formData, location_id: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Physical Qty *</label>
                                    <input required type="number" min="0" value={formData.physical_qty} onChange={e => setFormData({ ...formData, physical_qty: e.target.value })} className="w-full border p-2 rounded text-sm" />
                                </div>
                                <div>
                                    <PremiumSelect
                                        label="Reason"
                                        value={formData.reason}
                                        options={[
                                            { value: 'recount', label: 'Recount' },
                                            { value: 'damaged', label: 'Damaged' },
                                            { value: 'lost', label: 'Lost' },
                                            { value: 'expired', label: 'Expired' },
                                            { value: 'found', label: 'Found / Found Extra' },
                                            { value: 'other', label: 'Other' }
                                        ]}
                                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-brand-500 text-white rounded text-sm font-medium">Save Adjustment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
