import { useState, useEffect } from 'react';
import { Inbox, Plus, CheckCircle, XCircle, Search, LayoutGrid, List, Wallet, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import PremiumSelect from '../components/PremiumSelect';

export default function Receipts() {
    const { user } = useAuth();
    const [receipts, setReceipts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [viewMode, setViewMode] = useState('list');
    const [status, setStatus] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [viewReceipt, setViewReceipt] = useState(null);

    const [formData, setFormData] = useState({
        supplier_name: '',
        warehouse_id: '',
        notes: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        is_order: false,
        total_amount: 0,
        paid_amount: 0,
        payment_status: 'pending',
        payment_due_date: ''
    });
    const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);

    useEffect(() => {
        fetchData();
    }, [page, status, warehouseId]);

    const pendingAmount = Math.max(0, formData.total_amount - formData.paid_amount);
    const paymentPercentage = formData.total_amount > 0
        ? Math.min(100, Math.round((formData.paid_amount / formData.total_amount) * 100))
        : 0;

    const fetchData = async () => {
        try {
            setLoading(true);
            const [recRes, whRes, prodRes] = await Promise.all([
                api.get('/receipts', { params: { page, limit: 20, status, warehouse_id: warehouseId } }),
                api.get('/warehouses'),
                api.get('/products', { params: { limit: 1000, status: 'active' } })
            ]);
            setReceipts(recRes.data.data.receipts);
            setTotalPages(recRes.data.data.pagination.totalPages);
            setWarehouses(whRes.data.data);
            setProducts(prodRes.data.data.products);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadReceiptDetails = async (id) => {
        try {
            const res = await api.get(`/receipts/${id}`);
            setViewReceipt(res.data.data);
        } catch (err) {
            alert('Error loading receipt details');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            if (items.some(i => !i.product_id || i.quantity < 1)) {
                return alert('Please fill all item lines correctly');
            }
            await api.post('/receipts', { ...formData, items });
            setShowModal(false);
            fetchData();
            setFormData({
                supplier_name: '', warehouse_id: '', notes: '',
                scheduled_date: new Date().toISOString().split('T')[0],
                is_order: false, total_amount: 0, paid_amount: 0,
                payment_status: 'pending', payment_due_date: ''
            });
            setItems([{ product_id: '', quantity: 1 }]);
        } catch (err) {
            alert(err.response?.data?.message || 'Error creating receipt');
        }
    };

    const handleValidate = async (id) => {
        if (confirm('Validate receipt? This will add items to stock and cannot be undone.')) {
            try {
                await api.put(`/receipts/${id}/validate`);
                if (viewReceipt && viewReceipt.id === id) setViewReceipt({ ...viewReceipt, status: 'done' });
                fetchData();
            } catch (err) {
                alert(err.response?.data?.message || 'Validation failed');
            }
        }
    };

    const handleCancel = async (id) => {
        if (confirm('Cancel this receipt?')) {
            try {
                await api.put(`/receipts/${id}/cancel`);
                if (viewReceipt && viewReceipt.id === id) setViewReceipt({ ...viewReceipt, status: 'canceled' });
                fetchData();
            } catch (err) {
                alert('Cancellation failed');
            }
        }
    };

    const getStatusBadge = (s) => {
        switch (s) {
            case 'done': return <span className="px-2 py-1 text-[10px] uppercase font-bold bg-emerald-100 text-emerald-700 rounded-md">Done</span>;
            case 'ready': return <span className="px-2 py-1 text-[10px] uppercase font-bold bg-blue-100 text-blue-700 rounded-md">Ready</span>;
            case 'canceled': return <span className="px-2 py-1 text-[10px] uppercase font-bold bg-red-100 text-red-700 rounded-md">Canceled</span>;
            default: return <span className="px-2 py-1 text-[10px] uppercase font-bold bg-slate-100 text-slate-600 rounded-md">Draft</span>;
        }
    };

    const getPaymentBadge = (receipt) => {
        if (!receipt.is_order) return null;
        const pending = Math.max(0, receipt.total_amount - receipt.paid_amount);
        const percent = receipt.total_amount > 0 ? Math.round((receipt.paid_amount / receipt.total_amount) * 100) : 0;

        switch (receipt.payment_status) {
            case 'full_advance': return <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200">Paid (100%)</span>;
            case 'after_delivery': return <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-md border border-slate-200">After Delivery</span>;
            case 'partial_advance':
            case 'custom_amount':
                return (
                    <div className="flex flex-col items-end gap-1">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-md border border-amber-200">{percent}% Paid</span>
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">₹{pending.toLocaleString()} Pending</span>
                    </div>
                );
            case 'pending':
            default:
                return (
                    <div className="flex flex-col items-end gap-1">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-md border border-red-200">Pending</span>
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">₹{receipt.total_amount.toLocaleString()} Remaining</span>
                    </div>
                );
        }
    };

    const filteredReceipts = receipts.filter(r =>
        search === '' ||
        r.reference_no.toLowerCase().includes(search.toLowerCase()) ||
        r.supplier_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col space-y-4 max-w-7xl mx-auto overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Inbox className="w-6 h-6 text-brand-500" /> Receipts
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Manage stock receipts and order payments</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all">New</button>
            </div>

            {/* Control Bar */}
            <section className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative w-64">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input type="text" placeholder="Search reference or supplier..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-brand-500 transition-all font-medium" />
                    </div>
                    <PremiumSelect
                        value={status}
                        onChange={e => { setStatus(e.target.value); setPage(1); }}
                        options={[
                            { value: '', label: 'All Statuses' },
                            { value: 'overdue', label: 'Overdue Payments' },
                            { value: 'draft', label: 'Draft' },
                            { value: 'ready', label: 'Ready' },
                            { value: 'done', label: 'Done' },
                            { value: 'canceled', label: 'Canceled' }
                        ]}
                        className="w-48"
                    />

                </div>
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-800'}`}><List className="w-5 h-5" /></button>
                    <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-lg flex items-center justify-center transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-800'}`}><LayoutGrid className="w-5 h-5" /></button>
                </div>
            </section>

            {/* Main Content */}
            <div className="flex gap-4 flex-1 overflow-hidden relative">
                {/* List View */}
                {viewMode === 'list' && (
                    <section className={`bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden ${viewReceipt ? 'hidden xl:flex' : 'flex'}`}>
                        <div className="overflow-y-auto flex-1">
                            <table className="w-full text-left bg-white whitespace-nowrap">
                                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black sticky top-0 z-10 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Reference</th>
                                        <th className="px-6 py-4">Supplier</th>
                                        <th className="px-6 py-4">Warehouse</th>
                                        <th className="px-6 py-4 text-right">Payment</th>
                                        <th className="px-6 py-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan="5" className="p-12 text-center"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full spinner mx-auto"></div></td></tr>
                                    ) : filteredReceipts.length === 0 ? (
                                        <tr><td colSpan="5" className="p-12 text-center text-slate-500 font-medium">No receipts found.</td></tr>
                                    ) : filteredReceipts.map(r => (
                                        <tr key={r.id} onClick={() => loadReceiptDetails(r.id)} className={`group hover:bg-slate-50/80 cursor-pointer transition-colors ${viewReceipt?.id === r.id ? 'bg-brand-50/50' : ''}`}>
                                            <td className="px-6 py-4 font-black text-brand-600 text-sm">{r.reference_no}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-800">{r.supplier_name}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-600">{r.warehouse_name}</td>
                                            <td className="px-6 py-4 text-right">{getPaymentBadge(r)}</td>
                                            <td className="px-6 py-4 text-right">{getStatusBadge(r.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* Kanban View */}
                {viewMode === 'kanban' && (
                    <section className={`flex-1 overflow-x-auto flex gap-6 pb-2 ${viewReceipt ? 'hidden' : ''}`}>
                        {['draft', 'ready', 'done'].map(col => (
                            <div key={col} className="w-80 flex-shrink-0 flex flex-col bg-slate-50/40 rounded-2xl border border-slate-200/60">
                                <div className="p-4 flex justify-between items-center bg-white/40 border-b border-slate-200/40 rounded-t-2xl">
                                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">{col}</h3>
                                    <span className="text-[10px] font-black bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{filteredReceipts.filter(r => r.status === col).length}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {filteredReceipts.filter(r => r.status === col).map(r => (
                                        <div key={r.id} onClick={() => loadReceiptDetails(r.id)} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-brand-300 hover:shadow-md transition-all cursor-pointer group">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="font-black text-brand-600 text-sm tracking-tight">{r.reference_no}</span>
                                                {getStatusBadge(r.status)}
                                            </div>
                                            <p className="text-sm font-bold text-slate-800 mb-1">{r.supplier_name}</p>
                                            <p className="text-xs text-slate-500 mb-4 flex items-center gap-1.5"><Inbox className="w-3.5 h-3.5" /> {r.warehouse_name}</p>
                                            {r.is_order && (
                                                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Payment</span>
                                                    {getPaymentBadge(r)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                {/* Detail View */}
                {viewReceipt && (
                    <section className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full xl:w-[480px] flex flex-col shrink-0 animate-in slide-in-from-right-8 duration-500 overflow-hidden relative z-20">
                        {/* Detail Header */}
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{viewReceipt.reference_no}</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Receipt Record</p>
                                </div>
                                <button onClick={() => setViewReceipt(null)} className="p-2 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-slate-800 transition-all shadow-sm"><XCircle className="w-6 h-6" /></button>
                            </div>
                            {/* Actions */}
                            <div className="flex gap-3">
                                {viewReceipt.status === 'draft' && (
                                    <button onClick={() => handleValidate(viewReceipt.id)} className="flex-1 bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-500/20 transition-all active:scale-95">Validate</button>
                                )}
                                <button className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Print</button>
                                {viewReceipt.status !== 'done' && (
                                    <button onClick={() => handleCancel(viewReceipt.id)} className="flex-1 bg-white border border-slate-200 text-red-600 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-all">Cancel</button>
                                )}
                            </div>
                        </div>

                        {/* Detail Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Scheduled</p>
                                    <p className="font-bold text-slate-800">{new Date(viewReceipt.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Warehouse</p>
                                    <p className="font-bold text-slate-800 truncate">{viewReceipt.warehouse_name}</p>
                                </div>
                            </div>

                            {/* Payment Section */}
                            {viewReceipt.is_order ? (
                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest bg-slate-100/50 p-2 rounded-lg">
                                        <Wallet className="w-4 h-4 text-emerald-500" /> Payment Tracking
                                    </h4>
                                    <div className="p-6 border border-brand-100 bg-brand-50/30 rounded-2xl space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-1">Total Order Value</p>
                                                <p className="text-2xl font-black text-slate-800 tracking-tight">₹{viewReceipt.total_amount.toLocaleString()}</p>
                                            </div>
                                            {getPaymentBadge(viewReceipt)}
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                                <span>Paid: ₹{viewReceipt.paid_amount.toLocaleString()}</span>
                                                <span>{Math.round((viewReceipt.paid_amount / viewReceipt.total_amount) * 100)}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500" style={{ width: `${(viewReceipt.paid_amount / viewReceipt.total_amount) * 100}%` }}></div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 pt-2">
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Amount</p>
                                                <p className="text-sm font-black text-red-600">₹{(viewReceipt.total_amount - viewReceipt.paid_amount).toLocaleString()}</p>
                                            </div>
                                            <div className="flex-1 text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expected Date</p>
                                                <p className="text-sm font-black text-slate-800">{viewReceipt.payment_due_date ? new Date(viewReceipt.payment_due_date).toLocaleDateString() : 'Not Set'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Payment Linked to this Receipt</p>
                                </div>
                            )}

                            {/* Products Table */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 px-1">
                                    <Plus className="w-4 h-4 text-brand-500" /> Products Received
                                </h4>
                                <div className="space-y-3">
                                    {viewReceipt.items?.map(item => (
                                        <div key={item.id} className="p-4 border border-slate-100 rounded-2xl bg-white shadow-sm flex items-center justify-between group hover:border-brand-200 transition-all">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{item.product_name}</p>
                                                <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-tighter">{item.sku}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-brand-600">{item.quantity}</p>
                                                <p className="text-[10px] font-black text-slate-300 uppercase">Units</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh]">
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Create Receipt</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Stock Entry Record</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-slate-800 transition-all"><XCircle className="w-6 h-6" /></button>
                        </div>

                        <form onSubmit={handleCreate} className="overflow-y-auto p-8 space-y-8">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Supplier / Source *</label>
                                    <input required value={formData.supplier_name} onChange={e => setFormData({ ...formData, supplier_name: e.target.value })} className="w-full bg-slate-50 border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-brand-100 focus:bg-white transition-all outline-none" placeholder="Vendor company" />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Receive Location *</label>
                                    <PremiumSelect
                                        label="Receive Location"
                                        value={formData.warehouse_id}
                                        options={[{ id: '', name: 'Select Warehouse...' }, ...warehouses.map(w => ({ id: w.id, name: `${w.name} Warehouse` }))]}
                                        onChange={e => setFormData({ ...formData, warehouse_id: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Payment Toggle */}
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <label className="flex items-center gap-4 cursor-pointer group mb-1">
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only peer" checked={formData.is_order} onChange={e => setFormData({ ...formData, is_order: e.target.checked })} />
                                        <div className="w-12 h-7 bg-slate-200 peer-focus:ring-4 peer-focus:ring-brand-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-[19px] after:w-[19px] after:transition-all peer-checked:bg-brand-500"></div>
                                    </div>
                                    <span className="text-sm font-black text-slate-800 group-hover:text-brand-600 transition-colors uppercase tracking-tight">Is this item part of an order?</span>
                                </label>
                                <p className="text-[10px] text-slate-400 font-bold ml-16 uppercase tracking-wider italic">Enable to track payments and financial deadlines</p>

                                {formData.is_order && (
                                    <div className="grid grid-cols-2 gap-6 mt-8 animate-in slide-in-from-top-4 duration-300">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Payment Status</label>
                                            <PremiumSelect
                                                label="Payment Status"
                                                value={formData.payment_status}
                                                options={[
                                                    { value: 'pending', label: 'Pending Payment' },
                                                    { value: 'partial_advance', label: 'Partial Advance Payment' },
                                                    { value: 'full_advance', label: 'Full Advance Payment' },
                                                    { value: 'custom_amount', label: 'Custom Amount Paid' },
                                                    { value: 'after_delivery', label: 'Payment After Delivery' }
                                                ]}
                                                onChange={e => setFormData({ ...formData, payment_status: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Amount (₹)</label>
                                            <input type="number" value={formData.total_amount} onChange={e => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })} className="w-full bg-white border-slate-200 rounded-2xl px-5 py-4 text-sm font-black focus:ring-4 focus:ring-brand-100 transition-all outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Paid Amount (₹)</label>
                                            <input type="number" value={formData.paid_amount} onChange={e => setFormData({ ...formData, paid_amount: parseFloat(e.target.value) || 0 })} className="w-full bg-white border-slate-200 rounded-2xl px-5 py-4 text-sm font-black focus:ring-4 focus:ring-brand-100 transition-all outline-none" />
                                        </div>

                                        <div className="col-span-2 bg-emerald-500/10 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Calculated Balance</p>
                                                <p className="text-lg font-black text-slate-800">₹{pendingAmount.toLocaleString()} <span className="text-[10px] font-bold text-slate-400">PENDING</span></p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Progress</p>
                                                <p className="text-lg font-black text-brand-600">{paymentPercentage}%</p>
                                            </div>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Calendar className="w-4 h-4 text-brand-500" /> Expected Payment Date</label>
                                            <input type="date" value={formData.payment_due_date} onChange={e => setFormData({ ...formData, payment_due_date: e.target.value })} className="w-full bg-white border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-brand-100 transition-all outline-none" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Products Section */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-center px-1">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Products List</h4>
                                    <button type="button" onClick={() => setItems([...items, { product_id: '', quantity: 1 }])} className="bg-brand-50 text-brand-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-100 transition-all flex items-center gap-2"><Plus className="w-3 h-3" /> Add Product</button>
                                </div>
                                <div className="space-y-4">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 items-center bg-slate-50 p-4 rounded-[20px] border border-slate-100 group">
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
                                            <div className="w-24 relative">
                                                <input required type="number" min="1" value={item.quantity} onChange={e => { const n = [...items]; n[idx].quantity = parseInt(e.target.value) || 1; setItems(n); }} className="w-full bg-white border-slate-200 rounded-xl px-4 py-3.5 text-sm font-black text-center focus:ring-4 focus:ring-brand-100 transition-all outline-none" placeholder="Qty" />
                                            </div>
                                            {items.length > 1 && (
                                                <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 transition-all"><XCircle className="w-6 h-6" /></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </form>

                        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 shrink-0">
                            <button type="button" onClick={() => setShowModal(false)} className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">Cancel</button>
                            <button onClick={handleCreate} className="px-8 py-4 text-xs font-black uppercase tracking-widest text-white bg-brand-500 rounded-2xl hover:bg-brand-600 shadow-xl shadow-brand-500/25 transition-all">Save Record</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
