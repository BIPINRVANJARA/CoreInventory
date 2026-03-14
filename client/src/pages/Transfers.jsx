import { useState, useEffect } from 'react';
import { ArrowRightLeft, Plus, CheckCircle, XCircle } from 'lucide-react';
import api from '../api/axios';
import PremiumSelect from '../components/PremiumSelect';

export default function Transfers() {
    const [transfers, setTransfers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ from_location_id: '', to_location_id: '', notes: '' });
    const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);
    const [viewTransfer, setViewTransfer] = useState(null);

    useEffect(() => {
        fetchData();
    }, [page]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [transRes, locRes, prodRes] = await Promise.all([
                api.get('/transfers', { params: { page, limit: 10 } }),
                api.get('/locations'),
                api.get('/products', { params: { limit: 1000, status: 'active' } })
            ]);
            setTransfers(transRes.data.data.transfers);
            setTotalPages(transRes.data.data.pagination.totalPages);
            setLocations(locRes.data.data);
            setProducts(prodRes.data.data.products);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadDetails = async (id) => {
        try {
            const res = await api.get(`/transfers/${id}`);
            setViewTransfer(res.data.data);
        } catch (err) {
            alert('Error loading details');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            if (formData.from_location_id === formData.to_location_id) return alert('Source and destination must be different');
            if (items.some(i => !i.product_id || i.quantity < 1)) return alert('Fill all lines correctly');
            await api.post('/transfers', { ...formData, items });
            setShowModal(false);
            fetchData();
            setFormData({ from_location_id: '', to_location_id: '', notes: '' });
            setItems([{ product_id: '', quantity: 1 }]);
        } catch (err) {
            alert(err.response?.data?.message || 'Error creating transfer');
        }
    };

    const handleValidate = async (id) => {
        if (confirm('Validate transfer? Stock will be moved instantly.')) {
            try {
                await api.put(`/transfers/${id}/validate`);
                if (viewTransfer?.id === id) await loadDetails(id);
                fetchData();
            } catch (err) {
                alert(err.response?.data?.message || 'Validation failed');
            }
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ArrowRightLeft className="w-6 h-6 text-brand-500" /> Internal Transfers
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Move stock between internal locations.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-brand-500 text-white px-4 py-2 rounded-custom text-sm font-semibold flex items-center gap-2">
                    <Plus className="w-4 h-4" /> New Transfer
                </button>
            </div>

            <div className="flex gap-4 flex-1 overflow-hidden mt-4">
                <section className={`bg-white rounded-custom border border-slate-200 shadow-sm flex flex-col flex-1 ${viewTransfer ? 'hidden lg:flex' : ''}`}>
                    <div className="overflow-y-auto flex-1">
                        <table className="w-full text-left bg-white">
                            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-3">Reference</th>
                                    <th className="px-6 py-3">From</th>
                                    <th className="px-6 py-3">To</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? <tr><td colSpan="5" className="p-8"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full spinner mx-auto"></div></td></tr> :
                                    transfers.length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-slate-500">No transfers found.</td></tr> :
                                        transfers.map(t => (
                                            <tr key={t.id} onClick={() => loadDetails(t.id)} className={`table-row-hover cursor-pointer ${viewTransfer?.id === t.id ? 'bg-brand-50' : ''}`}>
                                                <td className="px-6 py-4 font-semibold text-brand-600 text-sm">{t.reference_no}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{t.from_location_name}</td>
                                                <td className="px-6 py-4 text-sm text-slate-800 font-medium">{t.to_location_name}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md ${t.status === 'done' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{t.status}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 text-right">{new Date(t.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {viewTransfer && (
                    <section className="bg-white rounded-custom border border-slate-200 shadow-sm w-full lg:w-96 flex flex-col shrink-0 animate-in slide-in-from-right-8 duration-300">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">{viewTransfer.reference_no}</h3>
                            <button onClick={() => setViewTransfer(null)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto space-y-6">
                            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-custom">
                                <div className="text-center flex-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">From</p>
                                    <p className="text-sm font-semibold text-slate-700">{viewTransfer.from_location_name}</p>
                                </div>
                                <ArrowRightLeft className="w-5 h-5 text-slate-400 mx-2" />
                                <div className="text-center flex-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">To</p>
                                    <p className="text-sm font-bold text-brand-600">{viewTransfer.to_location_name}</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Items</h4>
                                <div className="space-y-2">
                                    {viewTransfer.items?.map(i => (
                                        <div key={i.id} className="flex justify-between p-2 border border-slate-100 rounded text-sm">
                                            <span className="font-medium text-slate-700">{i.product_name}</span>
                                            <span className="font-bold text-slate-800">{i.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50">
                            {viewTransfer.status === 'draft' ? (
                                <button onClick={() => handleValidate(viewTransfer.id)} className="w-full flex justify-center py-2 bg-brand-500 text-white rounded font-medium text-sm">Validate Transfer</button>
                            ) : (
                                <div className="text-center text-sm text-emerald-600 font-medium">Completed</div>
                            )}
                        </div>
                    </section>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">New Transfer</h3>
                            <button onClick={() => setShowModal(false)}><XCircle className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <PremiumSelect
                                    label="From Location"
                                    value={formData.from_location_id}
                                    options={[{ id: '', name: 'Select From...' }, ...locations.map(l => ({ id: l.id, name: `${l.name} (${l.warehouse_name})` }))]}
                                    onChange={e => setFormData({ ...formData, from_location_id: e.target.value })}
                                />
                                <PremiumSelect
                                    label="To Location"
                                    value={formData.to_location_id}
                                    options={[{ id: '', name: 'Select To...' }, ...locations.map(l => ({ id: l.id, name: `${l.name} (${l.warehouse_name})` }))]}
                                    onChange={e => setFormData({ ...formData, to_location_id: e.target.value })}
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-medium">Items</label>
                                    <button type="button" onClick={() => setItems([...items, { product_id: '', quantity: 1 }])} className="text-brand-500 text-xs font-bold">+ Add Line</button>
                                </div>
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 mb-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <PremiumSelect
                                            label="Product"
                                            value={item.product_id}
                                            options={[{ id: '', name: 'Select Product...' }, ...products]}
                                            onChange={e => {
                                                const n = [...items];
                                                n[idx].product_id = e.target.value;
                                                setItems(n);
                                            }}
                                            className="flex-1"
                                        />
                                        <div className="w-24">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Qty</label>
                                            <input required type="number" min="1" value={item.quantity} onChange={e => { const n = [...items]; n[idx].quantity = e.target.value; setItems(n) }} className="w-full border border-slate-200 p-3 rounded-2xl text-sm font-black text-center focus:ring-brand-500" />
                                        </div>
                                        {items.length > 1 && (
                                            <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="mt-7 text-slate-300 hover:text-red-500 transition-all"><XCircle className="w-6 h-6" /></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-500">Cancel</button>
                                <button type="submit" className="px-10 py-3 bg-brand-500 text-white rounded-xl text-sm font-black shadow-lg shadow-brand-500/20">Create Transfer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
