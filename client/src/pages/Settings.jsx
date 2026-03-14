import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Database, MapPin, Plus, Trash2, XCircle, Users, UserPlus, Shield, Edit3 } from 'lucide-react';
import api from '../api/axios';
import PremiumSelect from '../components/PremiumSelect';

export default function Settings() {
    const [warehouses, setWarehouses] = useState([]);
    const [locations, setLocations] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showWhModal, setShowWhModal] = useState(false);
    const [showLocModal, setShowLocModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);

    // Editing State
    const [editingWh, setEditingWh] = useState(null);
    const [editingLoc, setEditingLoc] = useState(null);
    const [editingUser, setEditingUser] = useState(null);

    const [whData, setWhData] = useState({ name: '', code: '', address: '' });
    const [locData, setLocData] = useState({ name: '', type: 'internal', warehouse_id: '' });
    const [userData, setUserData] = useState({ name: '', email: '', password: '', role: 'staff' });
    const [userError, setUserError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [whRes, locRes, usersRes] = await Promise.all([
                api.get('/warehouses'),
                api.get('/locations'),
                api.get('/users')
            ]);
            setWarehouses(whRes.data.data);
            setLocations(locRes.data.data);
            setUsers(usersRes.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveWarehouse = async (e) => {
        e.preventDefault();
        try {
            if (editingWh) {
                await api.put(`/warehouses/${editingWh.id}`, whData);
            } else {
                await api.post('/warehouses', whData);
            }
            setShowWhModal(false);
            setEditingWh(null);
            setWhData({ name: '', code: '', address: '' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving warehouse');
        }
    };

    const handleSaveLocation = async (e) => {
        e.preventDefault();
        try {
            if (editingLoc) {
                await api.put(`/locations/${editingLoc.id}`, locData);
            } else {
                await api.post('/locations', locData);
            }
            setShowLocModal(false);
            setEditingLoc(null);
            setLocData({ name: '', type: 'internal', warehouse_id: '' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving location');
        }
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        setUserError('');
        try {
            if (editingUser) {
                // Remove password if empty to avoid overriding with null or empty string
                const data = { ...userData };
                if (!data.password) delete data.password;
                await api.put(`/users/${editingUser.id}`, data);
            } else {
                await api.post('/users', userData);
            }
            setShowUserModal(false);
            setEditingUser(null);
            setUserData({ name: '', email: '', password: '', role: 'staff' });
            fetchData();
        } catch (err) {
            setUserError(err.response?.data?.message || 'Error saving user');
        }
    };

    const deleteWarehouse = async (id) => {
        if (confirm('Delete warehouse? Must be empty first.')) {
            try {
                await api.delete(`/warehouses/${id}`);
                fetchData();
            } catch (err) {
                alert(err.response?.data?.message || 'Cannot delete warehouse');
            }
        }
    };

    const deleteUser = async (id) => {
        if (confirm('Remove this staff member? This cannot be undone.')) {
            try {
                await api.delete(`/users/${id}`);
                fetchData();
            } catch (err) {
                alert(err.response?.data?.message || 'Cannot delete user');
            }
        }
    };

    const openWhEdit = (wh) => {
        setEditingWh(wh);
        setWhData({ name: wh.name, code: wh.code, address: wh.address || '' });
        setShowWhModal(true);
    };

    const openLocEdit = (loc) => {
        setEditingLoc(loc);
        setLocData({ name: loc.name, type: loc.type, warehouse_id: loc.warehouse_id });
        setShowLocModal(true);
    };

    const openUserEdit = (user) => {
        setEditingUser(user);
        setUserData({ name: user.name, email: user.email, role: user.role, password: '' });
        setShowUserModal(true);
    };

    return (
        <div className="h-full flex flex-col space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <SettingsIcon className="w-6 h-6 text-brand-500" /> Infrastructure Settings
                </h2>
                <p className="text-sm text-slate-500 mt-1">Manage warehouses, locations, and staff accounts.</p>
            </div>

            {/* ===== Staff Management Section ===== */}
            <section className="bg-white rounded-custom border border-slate-200 shadow-sm">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-brand-50 to-white rounded-t-custom">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Staff Management</h3>
                            <p className="text-xs text-slate-500">Create and manage user accounts</p>
                        </div>
                    </div>
                    <button onClick={() => { setEditingUser(null); setUserData({ name: '', email: '', role: 'staff', password: '' }); setShowUserModal(true); }} className="bg-brand-500 text-white text-sm font-bold flex items-center gap-1.5 px-4 py-2 rounded-xl hover:bg-brand-600 transition-colors shadow-md shadow-brand-500/20">
                        <UserPlus className="w-4 h-4" /> Add Staff
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Joined</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(u => (
                                <tr key={u.id} className="table-row-hover group">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
                                                {u.name?.charAt(0)}
                                            </div>
                                            <span className="text-sm font-semibold text-slate-800">{u.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-slate-500">{u.email}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md ${u.role === 'manager' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                            <Shield className="w-3 h-3 inline mr-1" />{u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-3 text-right space-x-2">
                                        <button onClick={() => openUserEdit(u)} className="text-slate-300 hover:text-brand-500 transition-colors p-1" title="Edit user">
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => deleteUser(u.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1" title="Remove user">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ===== Warehouses & Locations Grid ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Warehouses Card */}
                <section className="bg-white rounded-custom border border-slate-200 shadow-sm flex flex-col h-[420px]">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-custom">
                        <div className="flex items-center gap-3">
                            <Database className="w-5 h-5 text-brand-500" />
                            <h3 className="font-bold text-slate-800">Warehouses</h3>
                        </div>
                        <button onClick={() => { setEditingWh(null); setWhData({ name: '', code: '', address: '' }); setShowWhModal(true); }} className="text-brand-500 text-sm font-bold flex items-center gap-1 hover:text-brand-600">
                            <Plus className="w-4 h-4" /> Add
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2">
                        {warehouses.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">No warehouses configured.</div>
                        ) : (
                            <ul className="space-y-2">
                                {warehouses.map(w => (
                                    <li key={w.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-colors shadow-sm group">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-slate-800">{w.name}</span>
                                                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">{w.code}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {w.address || 'No address'}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => openWhEdit(w)} className="text-slate-300 hover:text-brand-500 transition-colors p-2">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => deleteWarehouse(w.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                {/* Locations Card */}
                <section className="bg-white rounded-custom border border-slate-200 shadow-sm flex flex-col h-[420px]">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-custom">
                        <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-emerald-500" />
                            <h3 className="font-bold text-slate-800">Locations (Racks/Bins)</h3>
                        </div>
                        <button onClick={() => { setEditingLoc(null); setLocData({ name: '', type: 'internal', warehouse_id: '' }); setShowLocModal(true); }} className="text-emerald-600 text-sm font-bold flex items-center gap-1 hover:text-emerald-700">
                            <Plus className="w-4 h-4" /> Add
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2">
                        {locations.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">No locations configured.</div>
                        ) : (
                            <ul className="space-y-2">
                                {locations.map(l => (
                                    <li key={l.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-slate-200 transition-colors group">
                                        <div>
                                            <span className="font-bold text-slate-800 text-sm block mb-1">{l.name}</span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1">In: <span className="font-semibold text-slate-700">{l.warehouse_name}</span></span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md tracking-wider ${l.type === 'internal' ? 'bg-slate-100 text-slate-600' : 'bg-brand-50 text-brand-600'}`}>
                                                {l.type}
                                            </span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openLocEdit(l)} className="text-slate-300 hover:text-brand-500 transition-colors p-1" title="Edit location">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

            </div>

            {/* ===== Warehouse Modal ===== */}
            {showWhModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-slate-800">{editingWh ? 'Edit Warehouse' : 'New Warehouse'}</h3>
                            <button onClick={() => setShowWhModal(false)}><XCircle className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <form onSubmit={handleSaveWarehouse} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Name *</label>
                                <input required value={whData.name} onChange={e => setWhData({ ...whData, name: e.target.value })} className="w-full border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-brand-500 bg-slate-50" placeholder="Central Depot" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Short Code *</label>
                                <input required value={whData.code} onChange={e => setWhData({ ...whData, code: e.target.value })} className="w-full border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-brand-500 bg-slate-50 uppercase font-mono" placeholder="WH-01" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Address</label>
                                <textarea value={whData.address} onChange={e => setWhData({ ...whData, address: e.target.value })} className="w-full border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-brand-500 bg-slate-50 min-h-[80px]" placeholder="123 Industry Park..."></textarea>
                            </div>
                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowWhModal(false)} className="px-5 py-2.5 text-sm font-bold border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-brand-500 rounded-xl hover:bg-brand-600 shadow-md">{editingWh ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== Location Modal ===== */}
            {showLocModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-slate-800">{editingLoc ? 'Edit Location' : 'New Location'}</h3>
                            <button onClick={() => setShowLocModal(false)}><XCircle className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <form onSubmit={handleSaveLocation} className="space-y-4">
                            {!editingLoc && (
                                <div>
                                    <PremiumSelect
                                        label="Warehouse"
                                        value={locData.warehouse_id}
                                        options={[{ id: '', name: 'Select Warehouse...' }, ...warehouses]}
                                        onChange={e => setLocData({ ...locData, warehouse_id: e.target.value })}
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Location Name / Code *</label>
                                <input required value={locData.name} onChange={e => setLocData({ ...locData, name: e.target.value })} className="w-full border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-brand-500 bg-slate-50" placeholder="A1-Shelf-2" />
                            </div>
                            <div>
                                <PremiumSelect
                                    label="Type"
                                    value={locData.type}
                                    options={[
                                        { value: 'internal', label: 'Internal (Racks/Bins)' },
                                        { value: 'customer', label: 'Customer Location' },
                                        { value: 'supplier', label: 'Supplier Location' },
                                        { value: 'loss', label: 'Inventory Loss' }
                                    ]}
                                    onChange={e => setLocData({ ...locData, type: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowLocModal(false)} className="px-5 py-2.5 text-sm font-bold border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 shadow-md">{editingLoc ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== Add Staff Modal ===== */}
            {showUserModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                {editingUser ? <Edit3 className="w-5 h-5 text-brand-500" /> : <UserPlus className="w-5 h-5 text-brand-500" />}
                                {editingUser ? 'Edit Staff Member' : 'Add Staff Member'}
                            </h3>
                            <button onClick={() => { setShowUserModal(false); setUserError(''); }}><XCircle className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                        </div>

                        {userError && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2 mb-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> {userError}
                            </div>
                        )}

                        <form onSubmit={handleSaveUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Full Name *</label>
                                <input required value={userData.name} onChange={e => setUserData({ ...userData, name: e.target.value })} className="w-full border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-brand-500 bg-slate-50" placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Address *</label>
                                <input required type="email" value={userData.email} onChange={e => setUserData({ ...userData, email: e.target.value })} className="w-full border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-brand-500 bg-slate-50" placeholder="staff@vyntro.com" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{editingUser ? 'Change Password (Leave blank to keep)' : 'Temporary Password *'}</label>
                                <input required={!editingUser} type="password" minLength={6} value={userData.password} onChange={e => setUserData({ ...userData, password: e.target.value })} className="w-full border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-brand-500 bg-slate-50" placeholder={editingUser ? 'New password' : 'Min 6 characters'} />
                            </div>
                            <div>
                                <PremiumSelect
                                    label="Role"
                                    value={userData.role}
                                    options={[
                                        { value: 'staff', label: 'Warehouse Staff' },
                                        { value: 'manager', label: 'Inventory Manager' }
                                    ]}
                                    onChange={e => setUserData({ ...userData, role: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button type="button" onClick={() => { setShowUserModal(false); setUserError(''); }} className="px-5 py-2.5 text-sm font-bold border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-brand-500 rounded-xl hover:bg-brand-600 shadow-md shadow-brand-500/20">{editingUser ? 'Update Account' : 'Create Account'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
