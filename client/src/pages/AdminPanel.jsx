import { useState, useEffect } from 'react';
import { Shield, Users, Database, Activity, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api/axios';

export default function AdminPanel() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalWarehouses: 0,
        totalOperations: 0,
        recentLogs: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminStats();
    }, []);

    const fetchAdminStats = async () => {
        try {
            setLoading(true);
            // In a real app, these would be dedicated admin endpoints
            const [usersRes, whRes, opsRes] = await Promise.all([
                api.get('/users'),
                api.get('/warehouses'),
                api.get('/dashboard/operations?limit=5')
            ]);

            setStats({
                totalUsers: usersRes.data.data.length,
                totalWarehouses: whRes.data.data.length,
                totalOperations: opsRes.data.data.totalCount || 0,
                recentLogs: opsRes.data.data.operations || []
            });
        } catch (err) {
            console.error('Failed to fetch admin stats:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-tighter rounded-md border border-red-200">System Admin</div>
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Admin Console</h2>
                    <p className="text-slate-500 mt-2">Global system overview and administrative controls.</p>
                </div>
                <button
                    onClick={fetchAdminStats}
                    className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                    <Activity className={`w-5 h-5 text-slate-400 ${loading ? 'animate-pulse' : ''}`} />
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm group hover:border-brand-500 transition-all duration-300">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-4xl font-black text-slate-800 mb-1">{stats.totalUsers}</div>
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Global Users</div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm group hover:border-brand-500 transition-all duration-300">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Database className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="text-4xl font-black text-slate-800 mb-1">{stats.totalWarehouses}</div>
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Warehouses</div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm group hover:border-brand-500 transition-all duration-300">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="text-4xl font-black text-slate-800 mb-1">{stats.totalOperations}</div>
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Operations</div>
                </div>
            </div>

            {/* System Status & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Status Card */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Shield className="w-48 h-48 rotate-12" />
                    </div>
                    <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-brand-400" /> System Health
                    </h3>

                    <div className="space-y-6 relative z-10">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                                <span className="font-bold text-sm">Database Connection</span>
                            </div>
                            <span className="text-xs font-black uppercase text-emerald-400">Stable</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                                <span className="font-bold text-sm">Auth Service</span>
                            </div>
                            <span className="text-xs font-black uppercase text-emerald-400">Online</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                                <span className="font-bold text-sm">API Gateway</span>
                            </div>
                            <span className="text-xs font-black uppercase text-emerald-400">Active</span>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/10">
                        <button className="w-full py-4 bg-white text-slate-900 font-black text-sm rounded-2xl hover:bg-slate-100 transition-colors">
                            Run Full Diagnostic
                        </button>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Global Activity Feed</h3>
                        <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-2 py-1 rounded-md">Live Stream</span>
                    </div>
                    <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[400px]">
                        {stats.recentLogs.map((log, idx) => (
                            <div key={idx} className="flex gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                                <div className="mt-1">
                                    {log.status === 'done' ? (
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-amber-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 group-hover:text-brand-600 transition-colors">
                                        {log.type} - {log.reference_no}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">Processed in {log.warehouse_name}</p>
                                    <p className="text-[10px] text-slate-400 mt-2 font-mono">{new Date(log.date).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
