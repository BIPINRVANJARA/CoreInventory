import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Package, AlertTriangle, XCircle, Calendar, ArrowDown,
    ChevronDown, Plus, MoreHorizontal, Download
} from 'lucide-react';
import api from '../api/axios';
import PremiumSelect from '../components/PremiumSelect';

export default function Dashboard() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const globalSearch = searchParams.get('q') || '';

    const [kpiData, setKpiData] = useState(null);
    const [operationsData, setOperationsData] = useState({ operations: [], totalCount: 0 });
    const [warehouses, setWarehouses] = useState([]);

    // Filters and Pagination State
    const [filters, setFilters] = useState({
        type: 'All Types',
        warehouse_id: 'All',
        status: 'All'
    });
    const [page, setPage] = useState(1);
    const limit = 10;

    const [loadingKpis, setLoadingKpis] = useState(true);
    const [loadingOps, setLoadingOps] = useState(true);

    useEffect(() => {
        fetchKPIs();
        fetchWarehouses();
    }, []);

    useEffect(() => {
        fetchOperations();
    }, [filters, page, globalSearch]);

    const fetchKPIs = async () => {
        try {
            const res = await api.get('/dashboard/kpis');
            setKpiData(res.data.data);
        } catch (error) {
            console.error('Failed to fetch KPIs:', error);
        } finally {
            setLoadingKpis(false);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const res = await api.get('/warehouses');
            setWarehouses(res.data.data);
        } catch (error) {
            console.error('Failed to fetch warehouses:', error);
        }
    };

    const fetchOperations = async () => {
        setLoadingOps(true);
        try {
            const res = await api.get('/dashboard/operations', {
                params: {
                    type: filters.type,
                    warehouse_id: filters.warehouse_id,
                    status: filters.status,
                    search: globalSearch,
                    page,
                    limit
                }
            });
            setOperationsData(res.data.data);
        } catch (error) {
            console.error('Failed to fetch operations:', error);
        } finally {
            setLoadingOps(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1); // Reset to first page on filter change
    };

    const downloadCSV = () => {
        if (!operationsData.operations || !operationsData.operations.length) return;

        const headers = ['Reference No', 'Type', 'Product', 'Status', 'Warehouse', 'Date', 'Total Qty'];
        const csvRows = [
            headers.join(','),
            ...operationsData.operations.map(op => [
                op.reference_no,
                op.type,
                `"${op.products || ''}"`,
                op.status,
                `"${op.warehouse_name || ''}"`,
                new Date(op.created_at).toLocaleDateString('en-CA'),
                op.total_qty
            ].join(','))
        ];

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `operations_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (loadingKpis && !kpiData) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full spinner"></div>
            </div>
        );
    }

    const getStatusStyle = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'done') return 'bg-emerald-100/60 text-emerald-600 border border-emerald-200/50';
        if (s === 'ready') return 'bg-blue-100/60 text-blue-600 border border-blue-200/50';
        if (s === 'waiting') return 'bg-amber-100/60 text-amber-600 border border-amber-200/50';
        if (s === 'canceled') return 'bg-red-100/60 text-red-600 border border-red-200/50';
        return 'bg-slate-100/60 text-slate-500 border border-slate-200/50'; // draft
    };

    const getTypeIcon = (type) => {
        if (type === 'Receipt') return <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 002-2v-4M17 9l-5 5-5-5M12 14V3" /></svg>;
        if (type === 'Delivery') return <ArrowDown className="w-4 h-4 text-emerald-500" />;
        return <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>; // Internal
    };

    const totalPages = Math.ceil((operationsData?.totalCount || 0) / limit);

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-8">
            {/* Low Stock Alert */}
            <div className="bg-[#FFFDF4] border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
                <div className="flex items-center gap-3 pl-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <div>
                        <h4 className="text-[14px] font-bold text-amber-800">Low Stock Alert</h4>
                        <p className="text-[13px] text-amber-700/80 mt-0.5 font-medium">There are {kpiData?.lowStock || 0} items currently below their reorder point. Action required.</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/products')}
                    className="text-[13px] font-bold text-amber-800 bg-amber-100/50 hover:bg-amber-100 px-4 py-2 rounded-lg transition-colors border border-amber-200/50 shadow-sm">
                    View Inventory
                </button>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Products</span>
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100/50">
                            <Package className="w-4 h-4 text-indigo-600" />
                        </div>
                    </div>
                    <div className="flex gap-2 items-baseline">
                        <span className="text-2xl font-black text-slate-800">{kpiData?.totalProducts?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="mt-1 text-[12px] font-semibold text-emerald-500 flex items-center gap-1">
                        Active in system
                    </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Low Stock</span>
                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100/50">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-800">{kpiData?.lowStock || '0'}</div>
                    <div className="mt-1 text-[12px] font-medium text-slate-500">Requires attention</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Out of Stock</span>
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center border border-red-100/50">
                            <XCircle className="w-4 h-4 text-red-500" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-800">{kpiData?.outOfStock || '0'}</div>
                    <div className="mt-1 text-[12px] font-medium text-red-500">Critical status</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Receipts</span>
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100/50">
                            <Calendar className="w-4 h-4 text-blue-500" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-800">{kpiData?.receipts?.toReceive || '0'}</div>
                    <div className="mt-1 text-[12px] font-medium text-slate-500">Incoming deliveries</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Deliveries</span>
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100/50">
                            <ArrowDown className="w-4 h-4 text-emerald-600" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-800">{kpiData?.deliveries?.totalPending || '0'}</div>
                    <div className="mt-1 text-[12px] font-medium text-slate-500">Awaiting dispatch</div>
                </div>
            </div>

            {/* Filters Row */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-end justify-between flex-wrap gap-4">
                <div className="flex items-center gap-6 flex-wrap">
                    {/* Doc Type Dropdown */}
                    <PremiumSelect
                        label="Document Type"
                        value={filters.type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        options={[
                            { value: 'All Types', label: 'All Types' },
                            { value: 'Receipt', label: 'Receipts' },
                            { value: 'Delivery', label: 'Deliveries' },
                            { value: 'Internal', label: 'Internal Transfers' }
                        ]}
                    />

                    <PremiumSelect
                        label="Warehouse"
                        value={filters.warehouse_id}
                        onChange={(e) => handleFilterChange('warehouse_id', e.target.value)}
                        options={[{ id: 'All', name: 'All Warehouses' }, ...warehouses]}
                    />

                    {/* Status Pills */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status Filter</label>
                        <div className="flex items-center gap-2 flex-wrap">
                            {['All', 'Draft', 'Waiting', 'Ready', 'Done', 'Canceled'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => handleFilterChange('status', status)}
                                    className={`px-3 py-1.5 rounded-full text-xs transition-colors shadow-sm ${filters.status === status
                                        ? 'font-bold bg-indigo-600 text-white shadow-indigo-600/30'
                                        : 'font-medium bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <Link to="/receipts" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex items-center gap-2 px-5 py-2.5 rounded-lg transition-colors shadow-md shadow-indigo-600/20 shrink-0">
                    <Plus className="w-4 h-4" /> New Operation
                </Link>
            </div>

            {/* Table Area */}
            <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-lg">Recent Operations</h3>
                    <button
                        onClick={downloadCSV}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1.5"
                    >
                        <Download className="w-4 h-4" /> Download CSV
                    </button>
                </div>

                <div className="overflow-x-auto flex-1 relative">
                    {loadingOps && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                    <table className="w-full text-left bg-white">
                        <thead className="bg-[#FAFAFA] text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Reference No.</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Product</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Warehouse</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/80">
                            {operationsData?.operations?.map((op, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <Link to={op.type === 'Receipt' ? '/receipts' : '/deliveries'} className="text-[13px] font-bold text-indigo-600 hover:underline">
                                            {op.reference_no}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2.5">
                                            {getTypeIcon(op.type)}
                                            <span className="text-[13px] font-medium text-slate-600">{op.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="space-y-1">
                                            <div className="text-[13px] font-bold text-slate-800 truncate max-w-[200px]" title={op.products}>
                                                {op.products?.split(',')[0]} {op.products?.split(',').length > 1 && '...'}
                                            </div>
                                            <div className="text-[11px] font-medium text-slate-500">
                                                {op.total_qty} units
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2.5 py-1 text-[10px] uppercase font-black tracking-widest rounded-md ${getStatusStyle(op.status)}`}>
                                            {op.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-[13px] text-slate-600 font-medium whitespace-nowrap">
                                        {op.warehouse_name}
                                    </td>
                                    <td className="px-6 py-5 text-[13px] text-slate-500 font-medium whitespace-nowrap">
                                        {new Date(op.created_at).toLocaleDateString('en-CA')}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <Link to={op.type === 'Receipt' ? '/receipts' : '/deliveries'} className="text-slate-300 hover:text-indigo-600 transition-colors inline-block">
                                            <MoreHorizontal className="w-5 h-5 mx-auto" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {(!operationsData?.operations || operationsData.operations.length === 0) && !loadingOps && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500 text-sm">
                                        No recent operations found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white mt-auto">
                    <div className="text-[13px] text-slate-500 font-medium">
                        Showing {operationsData?.operations?.length ? ((page - 1) * limit) + 1 : 0} to {((page - 1) * limit) + (operationsData?.operations?.length || 0)} of {operationsData?.totalCount || 0} results
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className={`px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium transition-colors ${page === 1 ? 'text-slate-400 bg-slate-50 cursor-not-allowed' : 'text-slate-700 bg-white shadow-sm hover:bg-slate-50'}`}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages || totalPages === 0}
                            className={`px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium transition-colors ${page >= totalPages || totalPages === 0 ? 'text-slate-400 bg-slate-50 cursor-not-allowed' : 'text-slate-700 bg-white shadow-sm hover:bg-slate-50'}`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
