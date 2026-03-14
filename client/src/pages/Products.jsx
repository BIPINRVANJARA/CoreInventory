import { useState, useEffect } from 'react';
import { Package, Search, Plus, FileEdit, XCircle } from 'lucide-react';
import api from '../api/axios';
import PremiumSelect from '../components/PremiumSelect';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modals
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Consolidated Form Data
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category_id: '',
        unit_of_measure: 'units',
        reorder_point: 10,
        description: '',
        cost_price: 0,
        sale_price: 0,
        lot_size: 1,
        // Stock Adjustment specific (optional)
        adj_location_id: '',
        adj_qty: '',
        adj_reason: 'recount'
    });

    const [categories, setCategories] = useState([]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        fetchData();
        fetchCategories();
    }, [page]);


    const fetchData = async () => {
        try {
            setLoading(true);
            const [prodRes, locRes] = await Promise.all([
                api.get('/products', { params: { page, limit: 20 } }),
                api.get('/locations')
            ]);
            setProducts(prodRes.data.data.products);
            setTotalPages(prodRes.data.data.pagination.totalPages);
            setLocations(locRes.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/products/categories');
            setCategories(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const openEditModal = (product) => {
        setSelectedProduct(product);
        setFormData({
            name: product.name || '',
            sku: product.sku || '',
            category_id: product.category_id || '',
            unit_of_measure: product.unit_of_measure || 'units',
            reorder_point: product.reorder_point || 10,
            description: product.description || '',
            cost_price: product.cost_price || 0,
            sale_price: product.sale_price || 0,
            lot_size: product.lot_size || 1,
            adj_location_id: '',
            adj_qty: '',
            adj_reason: 'recount'
        });
        setShowEditModal(true);
    };

    const openCreateModal = () => {
        setSelectedProduct(null);
        setFormData({
            name: '', sku: '', category_id: '', unit_of_measure: 'units',
            reorder_point: 10, description: '', cost_price: 0, sale_price: 0, lot_size: 1,
            adj_location_id: '', adj_qty: '', adj_reason: 'recount'
        });
        setShowEditModal(true);
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        try {
            if (selectedProduct?.id) {
                // Update Product Details
                await api.put(`/products/${selectedProduct.id}`, formData);

                // If stock adjustment info provided, process it
                if (formData.adj_location_id && formData.adj_qty !== '') {
                    await api.post('/adjustments', {
                        product_id: selectedProduct.id,
                        location_id: formData.adj_location_id,
                        physical_qty: formData.adj_qty,
                        reason: formData.adj_reason
                    });
                }
            } else {
                // Create New Product
                await api.post('/products', formData);
            }

            setShowEditModal(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving product');
        }
    };

    const filteredProducts = products.filter(p =>
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col space-y-4 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Package className="w-6 h-6 text-brand-500" /> Stock Overview
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Manage global product catalog and track inventory levels.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-custom text-sm font-bold shadow-sm transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> New Product
                </button>
            </div>


            {/* Control Bar */}
            <section className="bg-white p-3 rounded-custom border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                <div className="relative w-72">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input type="text" placeholder="Search product name or SKU..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-custom text-sm focus:ring-brand-500" />
                </div>
            </section>

            {/* Main Table */}
            <section className="bg-white rounded-custom border border-slate-200 shadow-sm flex-1 overflow-auto flex flex-col">
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left bg-white whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold sticky top-0 shadow-sm">
                            <tr>
                                <th className="px-6 py-3">Product Name</th>
                                <th className="px-6 py-3">SKU</th>
                                <th className="px-6 py-3 text-center">Lot Size</th>
                                <th className="px-6 py-3 text-right">Per Unit Cost</th>
                                <th className="px-6 py-3 text-right">On Hand</th>
                                <th className="px-6 py-3 text-right">Free to Use</th>
                                <th className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? <tr><td colSpan="6" className="p-8"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full spinner mx-auto"></div></td></tr> :
                                filteredProducts.length === 0 ? <tr><td colSpan="6" className="p-8 text-center text-slate-500">No products found.</td></tr> :
                                    filteredProducts.map(p => {
                                        const onHand = Number(p.total_stock) || 0;
                                        const freeToUse = Math.max(0, onHand - 5);
                                        return (
                                            <tr key={p.id} className="table-row-hover group">
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-slate-800">{p.name}</span>
                                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{p.category_name || 'Uncategorized'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-mono text-slate-500">{p.sku}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[11px] font-bold">
                                                        {p.lot_size || 1} {p.unit_of_measure || 'units'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">₹{Number(p.cost_price || 0).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-sm font-black text-slate-800 text-right">
                                                    {onHand}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">
                                                    {freeToUse}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => openEditModal(p)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-brand-50 text-slate-600 hover:text-brand-600 rounded text-xs font-bold uppercase transition-colors"
                                                    >
                                                        <FileEdit className="w-3 h-3" /> Manage
                                                    </button>
                                                </td>

                                            </tr>
                                        );
                                    })}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Consolidated Manage Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl p-8 overflow-hidden relative flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                                    {selectedProduct ? 'Edit Product' : 'Create New Product'}
                                </h3>
                                <p className="text-slate-500 font-medium mt-1">
                                    {selectedProduct ? `Updating: ${selectedProduct.name}` : 'Add a new item to your universal catalog.'}
                                </p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <XCircle className="w-6 h-6 text-slate-300 hover:text-slate-600" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6 pb-6 border-b border-slate-100">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Product Name *</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Samsung Galaxy S24" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:ring-brand-500 font-bold" />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">SKU (Internal Code) *</label>
                                    <input required type="text" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} placeholder="E-GEN-001" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-[13px] font-mono focus:ring-brand-500 uppercase" />
                                </div>

                                <div className="grid grid-cols-2 gap-4 col-span-2">
                                    <PremiumSelect
                                        label="Category"
                                        value={formData.category_id}
                                        options={[{ id: '', name: 'Uncategorized' }, ...categories]}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                        className="col-span-1"
                                    />
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Unit of Measure</label>
                                        <input
                                            type="text"
                                            name="unit_of_measure"
                                            value={formData.unit_of_measure}
                                            onChange={handleInputChange}
                                            placeholder="e.g., units, kg, pcs"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 col-span-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Lot Size (Per Unit)</label>
                                        <input
                                            type="number"
                                            name="lot_size"
                                            value={formData.lot_size}
                                            onChange={handleInputChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 transition-all font-medium"
                                            placeholder="Quantity in one lot..."
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1.5 font-medium italic">
                                            Units per lot (e.g., 10 units in 1 box).
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Low Stock Threshold</label>
                                        <input
                                            type="number"
                                            name="reorder_point"
                                            value={formData.reorder_point}
                                            onChange={handleInputChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 transition-all font-medium"
                                            placeholder="Alert me when stock reaches..."
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1.5 font-medium italic">
                                            System will show this product in "Low Stock" section.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cost Price (₹) *</label>
                                    <input required type="number" step="0.01" value={formData.cost_price} onChange={e => setFormData({ ...formData, cost_price: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:ring-brand-500 font-black text-slate-800" />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sale Price (₹) *</label>
                                    <input required type="number" step="0.01" value={formData.sale_price} onChange={e => setFormData({ ...formData, sale_price: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:ring-brand-500 font-black text-emerald-600" />
                                </div>
                            </div>

                            {selectedProduct && (
                                <div className="mt-8 bg-slate-50 rounded-3xl p-6 border border-brand-50">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-2 h-6 bg-brand-500 rounded-full"></div>
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Quick Stock Adjustment</h4>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <PremiumSelect
                                                label="Adjustment Location"
                                                value={formData.adj_location_id}
                                                options={[{ id: '', name: 'No stock change (Update details only)' }, ...locations.map(l => ({ id: l.id, name: `${l.name} (${l.warehouse_name})` }))]}
                                                onChange={(e) => setFormData({ ...formData, adj_location_id: e.target.value })}
                                            />
                                        </div>

                                        {formData.adj_location_id && (
                                            <>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">New Physical Qty</label>
                                                    <input type="number" min="0" value={formData.adj_qty} onChange={e => setFormData({ ...formData, adj_qty: e.target.value })} placeholder={`Current: ${selectedProduct.total_stock}`} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-brand-500 font-black" />
                                                </div>
                                                <div>
                                                    <PremiumSelect
                                                        label="Adjustment Reason"
                                                        value={formData.adj_reason}
                                                        options={[
                                                            { value: 'recount', label: 'Recount / Audit' },
                                                            { value: 'damaged', label: 'Damaged Goods' },
                                                            { value: 'lost', label: 'Lost / Misplaced' },
                                                            { value: 'found', label: 'Inbound / Found Extra' }
                                                        ]}
                                                        onChange={(e) => setFormData({ ...formData, adj_reason: e.target.value })}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-8 sticky bottom-0 bg-white pt-4">
                                <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">Discard Changes</button>
                                <button type="submit" className="bg-brand-500 hover:bg-brand-600 text-white px-10 py-3 rounded-2xl text-sm font-black shadow-lg shadow-brand-500/30 transition-all flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> Save All Updates
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
