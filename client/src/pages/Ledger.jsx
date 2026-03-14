import { useState, useEffect } from 'react';
import { History, Download, Search, LayoutGrid, List } from 'lucide-react';
import api from '../api/axios';
import PremiumSelect from '../components/PremiumSelect';
import { useAuth } from '../context/AuthContext';

export default function Ledger() {
    const [ledger, setLedger] = useState([]);
    const [loading, setLoading] = useState(true);

    const [viewMode, setViewMode] = useState('list');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [type, setType] = useState('');
    const { user } = useAuth();
    const isManager = user?.role === 'manager';

    useEffect(() => {
        fetchLedger();
    }, [page, type]);

    const fetchLedger = async () => {
        try {
            setLoading(true);
            const res = await api.get('/ledger', { params: { page, limit: 20, movement_type: type } });
            setLedger(res.data.data.entries);
            setTotalPages(res.data.data.pagination.totalPages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        window.open(`http://localhost:5000/api/ledger/export?token=${localStorage.getItem('token')}`, '_blank');
    };

    const filteredLedger = ledger.filter(l =>
        search === '' ||
        (l.reference_no && l.reference_no.toLowerCase().includes(search.toLowerCase())) ||
        l.product_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col space-y-4 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <History className="w-6 h-6 text-brand-500" /> Move History
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Population of move between the From → To location in inventory</p>
                </div>
                {isManager && (
                    <button onClick={handleExport} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-custom text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                )}
            </div>

            {/* Control Bar */}
            <section className="bg-white p-3 rounded-custom border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative w-64">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input type="text" placeholder="Search reference or product..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-custom text-sm focus:ring-brand-500" />
                    </div>
                    <PremiumSelect
                        value={type}
                        onChange={e => { setType(e.target.value); setPage(1); }}
                        options={[
                            { value: '', label: 'All Movements' },
                            { value: 'incoming', label: 'Receipts In' },
                            { value: 'outgoing', label: 'Deliveries Out' },
                            { value: 'transfer_in', label: 'Transfers In' },
                            { value: 'transfer_out', label: 'Transfers Out' },
                            { value: 'adjustment', label: 'Adjustments' }
                        ]}
                        className="w-48"
                    />
                </div>

                {/* Toggle View */}
                <div className="flex items-center bg-slate-100 p-1 rounded-custom">
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-800'}`}><List className="w-5 h-5" /></button>
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-800'}`}><LayoutGrid className="w-5 h-5" /></button>
                </div>
            </section>

            {/* Main View Area */}
            {viewMode === 'list' ? (
                <section className="bg-white rounded-custom border border-slate-200 shadow-sm flex-1 overflow-auto flex flex-col">
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left bg-white whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold sticky top-0 shadow-sm">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Reference</th>
                                    <th className="px-6 py-3">From</th>
                                    <th className="px-6 py-3">To</th>
                                    <th className="px-6 py-3 text-right">Quantity</th>
                                    <th className="px-6 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? <tr><td colSpan="6" className="p-8"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full spinner mx-auto"></div></td></tr> :
                                    filteredLedger.length === 0 ? <tr><td colSpan="6" className="p-8 text-center text-slate-500">No history found.</td></tr> :
                                        filteredLedger.map(l => (
                                            <tr key={l.id} className="table-row-hover">
                                                <td className="px-6 py-3 text-sm text-slate-500">{new Date(l.created_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-3 text-sm font-semibold text-brand-600">{l.reference_no || 'Global'}</td>
                                                <td className="px-6 py-3 text-sm text-slate-600">{l.from_location_name || 'External'}</td>
                                                <td className="px-6 py-3 text-sm text-slate-600">{l.to_location_name || 'External'}</td>
                                                <td className="px-6 py-3 text-sm font-bold text-slate-800 text-right">{l.qty_change} <span className="text-[10px] font-normal text-slate-400 ml-1">{l.product_name}</span></td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className="px-2 py-1 text-[10px] uppercase font-bold bg-emerald-100 text-emerald-700 rounded-md">Done</span>
                                                </td>
                                            </tr>
                                        ))}
                            </tbody>
                        </table>
                    </div>
                    {!loading && ledger.length > 0 && (
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between text-xs text-slate-500 shrink-0">
                            <p>Page {page} of {totalPages}</p>
                            <div className="flex gap-2">
                                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border border-slate-300 rounded-md bg-white hover:bg-slate-50 disabled:opacity-50 font-bold transition-colors">Prev</button>
                                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border border-slate-300 rounded-md bg-white hover:bg-slate-50 disabled:opacity-50 font-bold transition-colors">Next</button>
                            </div>
                        </div>
                    )}
                </section>
            ) : (
                <section className="flex-1 overflow-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
                    {filteredLedger.map(l => (
                        <div key={l.id} className="bg-white p-4 border border-slate-200 rounded-custom shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-brand-600 text-sm">{l.reference_no || 'Global'}</span>
                                    <span className="px-2 py-1 text-[10px] uppercase font-bold bg-emerald-100 text-emerald-700 rounded-md">Done</span>
                                </div>
                                <div className="text-sm font-semibold text-slate-800 mb-1">{l.product_name}</div>
                                <div className="text-xs text-slate-500 mb-1 line-clamp-1 flex justify-between"><span>From:</span> <span className="font-medium text-slate-700">{l.from_location_name || 'External'}</span></div>
                                <div className="text-xs text-slate-500 mb-3 line-clamp-1 flex justify-between"><span>To:</span> <span className="font-medium text-slate-700">{l.to_location_name || 'External'}</span></div>
                            </div>
                            <div className="flex justify-between items-end border-t border-slate-100 pt-3 mt-1">
                                <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(l.created_at).toLocaleDateString()}</div>
                                <div className="text-lg font-black text-slate-800">{l.qty_change} <span className="text-[10px] font-normal text-slate-400">QTY</span></div>
                            </div>
                        </div>
                    ))}
                </section>
            )}
        </div>
    );
}
