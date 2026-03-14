import { Bell, Search, Settings, X } from 'lucide-react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function Header({ title }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

    // Sync input with actual URL search param
    useEffect(() => {
        setSearchQuery(searchParams.get('q') || '');
    }, [searchParams]);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        if (val === '') {
            navigate(window.location.pathname);
        }
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            const query = searchQuery.trim();
            if (query) {
                navigate(`?q=${encodeURIComponent(query)}`);
            } else {
                navigate(window.location.pathname);
            }
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        navigate(window.location.pathname);
    };

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 w-full font-inter">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative hidden md:block group">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors">
                        <Search className="w-4 h-4" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search operations..."
                        value={searchQuery}
                        onChange={handleInputChange}
                        onKeyDown={handleSearch}
                        className="pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 w-72 transition-all font-medium placeholder:text-slate-400"
                    />
                    {searchQuery && (
                        <button
                            onClick={clearSearch}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => alert("No new notifications")}
                        className="relative text-slate-500 hover:text-brand-500 p-2 transition-colors rounded-full hover:bg-slate-50"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </button>
                    {(user?.role === 'manager' || user?.role === 'admin') && (
                        <Link
                            to="/settings"
                            className="text-slate-500 hover:text-brand-500 p-2 transition-colors rounded-full hover:bg-slate-50"
                        >
                            <Settings className="w-5 h-5" />
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
