import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../context/AuthContext';

export function ProtectedLayout() {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role-based route protection
    const restrictedRoutes = ['/settings', '/adjustments', '/admin'];
    if (user.role === 'staff' && restrictedRoutes.some(route => location.pathname.startsWith(route))) {
        return <Navigate to="/" replace />;
    }

    // Determine a default title based on path
    let title = 'Dashboard';
    const path = location.pathname;
    if (path.startsWith('/products')) title = 'Products';
    else if (path.startsWith('/receipts')) title = 'Receipts';
    else if (path.startsWith('/deliveries')) title = 'Delivery Orders';
    else if (path.startsWith('/transfers')) title = 'Internal Transfers';
    else if (path.startsWith('/adjustments')) title = 'Stock Adjustments';
    else if (path.startsWith('/ledger')) title = 'Move History';
    else if (path.startsWith('/settings')) title = 'Settings';

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <Header title={title} />
                <main className="flex-1 overflow-y-auto p-6 relative">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export function PublicLayout() {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (user) return <Navigate to="/" replace />;

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Outlet />
        </div>
    );
}
