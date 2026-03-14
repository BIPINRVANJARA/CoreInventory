import { useState, useEffect } from 'react';
import { DollarSign, AlertCircle, CheckCircle2, Clock, ArrowUpRight, ArrowDownRight, TrendingUp, History, Calendar } from 'lucide-react';
import api from '../api/axios';

export default function PaymentDashboard() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            const res = await api.get('/api/payments/summary');
            setSummary(res.data.data);
        } catch (err) {
            console.error('Error fetching summary:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="h-full flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const { metrics, recentPayments } = summary || {};

    const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }) => (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform`}></div>
            <div className="flex items-start justify-between relative z-10">
                <div className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-600`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-black ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'} bg-white px-2 py-1 rounded-full border border-slate-100 shadow-sm`}>
                        {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                        {trendValue}
                    </div>
                )}
            </div>
            <div className="mt-6 relative z-10">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">₹{parseFloat(value || 0).toLocaleString()}</h3>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col space-y-8 max-w-7xl mx-auto overflow-y-auto pb-8 pr-4">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <DollarSign className="w-10 h-10 text-brand-500 bg-brand-50 p-2 rounded-2xl border border-brand-100" />
                        Financial Overview
                    </h2>
                    <p className="text-slate-500 font-bold mt-2 ml-1 flex items-center gap-2">
                        Tracking revenue and pending collections <span className="w-1 h-1 bg-slate-300 rounded-full"></span> {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <button onClick={fetchSummary} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                    <TrendingUp className="w-5 h-5 text-slate-600" />
                </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Sales"
                    value={metrics?.total_sales}
                    icon={DollarSign}
                    color="brand"
                    trend="up"
                    trendValue="+12%"
                />
                <StatCard
                    title="Total Collected"
                    value={metrics?.total_paid}
                    icon={CheckCircle2}
                    color="emerald"
                    trend="up"
                    trendValue="84%"
                />
                <StatCard
                    title="Pending Dues"
                    value={metrics?.total_pending}
                    icon={Clock}
                    color="amber"
                />
                <StatCard
                    title="Overdue"
                    value={metrics?.total_overdue}
                    icon={AlertCircle}
                    color="rose"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Payments */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <History className="w-6 h-6 text-slate-400" />
                            <h3 className="text-xl font-black text-slate-800">Recent Transactions</h3>
                        </div>
                        <button className="text-xs font-black text-brand-600 uppercase tracking-widest hover:underline">View All</button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-4">Receipt</th>
                                    <th className="px-8 py-4">Supplier</th>
                                    <th className="px-8 py-4">Date</th>
                                    <th className="px-8 py-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recentPayments?.length === 0 ? (
                                    <tr><td colSpan="4" className="p-12 text-center text-slate-400 font-bold italic">No recent transactions found</td></tr>
                                ) : recentPayments?.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5 font-black text-brand-600 text-sm">{p.reference_no}</td>
                                        <td className="px-8 py-5 text-sm font-bold text-slate-800">{p.supplier_name}</td>
                                        <td className="px-8 py-5 text-sm font-medium text-slate-500">{new Date(p.payment_date).toLocaleDateString()}</td>
                                        <td className="px-8 py-5 text-right font-black text-slate-800 text-sm">₹{parseFloat(p.amount).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Overdue Alerts */}
                <div className="bg-rose-50/50 rounded-[2.5rem] border border-rose-100 p-8 flex flex-col">
                    <div className="flex items-center gap-3 mb-8">
                        <AlertCircle className="w-6 h-6 text-rose-500" />
                        <h3 className="text-xl font-black text-slate-800">Critical Alerts</h3>
                    </div>

                    <div className="space-y-4">
                        {metrics?.total_overdue > 0 ? (
                            <div className="bg-white p-6 rounded-3xl border border-rose-200 shadow-sm border-l-8 border-l-rose-500">
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Overdue Payment Detected</p>
                                <p className="text-lg font-black text-slate-800 tracking-tight">₹{parseFloat(metrics.total_overdue).toLocaleString()} is past due</p>
                                <button className="mt-4 w-full bg-rose-500 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all">Review Overdue Orders</button>
                            </div>
                        ) : (
                            <div className="bg-emerald-50 text-emerald-700 p-8 rounded-3xl border border-emerald-100 text-center flex flex-col items-center gap-4">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                <p className="font-black uppercase text-xs tracking-widest text-emerald-600">No Overdue Payments</p>
                                <p className="text-xs font-bold text-emerald-800/60 leading-relaxed">System healthy. All payments are current or within grace periods.</p>
                            </div>
                        )}

                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Calendar className="w-3 h-3" /> Upcoming Deadlines</p>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-slate-600">Next 7 Days</span>
                                    <span className="font-black text-slate-800">₹45,000</span>
                                </div>
                                <div className="h-1 bg-slate-100 rounded-full">
                                    <div className="h-full bg-brand-500 rounded-full" style={{ width: '40%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
