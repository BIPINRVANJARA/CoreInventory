import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Package, Inbox, Truck,
    ArrowRightLeft, FileEdit, History, Settings, LogOut,
    User, Shield, DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

function Sidebar() {
    const location = useLocation();
    const { user, logout } = useAuth();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Stock', path: '/products', icon: Package },
        { name: 'Receipts', path: '/receipts', icon: Inbox },
        { name: 'Delivery Orders', path: '/deliveries', icon: Truck },
        { name: 'Payments', path: '/payments', icon: DollarSign },
        { name: 'Internal Transfers', path: '/transfers', icon: ArrowRightLeft },
        { name: 'Move History', path: '/ledger', icon: History },
        { name: 'My Profile', path: '/profile', icon: User },
    ];


    const adminItems = [
        { name: 'Adjustments', path: '/adjustments', icon: FileEdit },
        { name: 'Settings', path: '/settings', icon: Settings },
        { name: 'Admin Console', path: '/admin', icon: Shield, role: 'admin' },
    ];

    const isActive = (path) => {
        if (path === '/' && location.pathname !== '/') return false;
        return location.pathname.startsWith(path);
    };

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col transition-sidebar shrink-0 h-screen overflow-hidden">
            {/* Logo */}
            <div className="p-6 flex items-center gap-3 border-b border-slate-800 shrink-0 text-white">
                <img src={logo} alt="Vyntro Logo" className="w-8 h-8 object-contain rounded-lg" />
                <span className="text-xl font-bold tracking-tight">Vyntro</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 sidebar-scroll overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2 rounded-custom transition-colors ${active ? 'bg-brand-500 text-white' : 'hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}

                {(user?.role === 'manager' || user?.role === 'admin') && (
                    <div className="pt-4 mt-4 border-t border-slate-800">
                        <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Administration</div>
                        {adminItems.filter(item => !item.role || user?.role === item.role).map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-custom transition-colors ${active ? 'bg-brand-500 text-white' : 'hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-slate-800 shrink-0">
                <div className="flex items-center gap-3 p-2 rounded-custom hover:bg-slate-800 transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate capitalize">{user?.role || 'Staff'}</p>
                    </div>
                    <button onClick={logout} className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors" title="Logout">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
