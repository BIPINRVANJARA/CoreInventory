import { useState, useEffect } from 'react';
import { User, Mail, Shield, Save, Key, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Profile() {
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        confirmPassword: ''
    });

    // Keep form in sync with user context (crucial for initial load)
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || ''
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (success) setSuccess('');
        if (error) setError('');
    };

    const [showOTP, setShowOTP] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // If no password change, update name/email only
        if (!formData.password && !formData.confirmPassword) {
            setLoading(true);
            try {
                await api.put('/users/me', { name: formData.name, email: formData.email });
                setUser({ ...user, name: formData.name, email: formData.email });
                setSuccess('Profile updated successfully!');
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to update profile');
            } finally {
                setLoading(false);
            }
            return;
        }

        // Handle password change validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        // Trigger OTP for password change
        setLoading(true);
        try {
            await api.post('/auth/request-password-change-otp');
            setShowOTP(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to request verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyPasswordChange = async (e) => {
        e.preventDefault();
        setOtpLoading(true);
        setError('');
        try {
            await api.post('/auth/verify-password-change', {
                otp,
                new_password: formData.password
            });

            // Success! Update only name/email in context
            setUser({ ...user, name: formData.name, email: formData.email });
            setSuccess('Password and profile updated successfully!');
            setFormData({ ...formData, password: '', confirmPassword: '' });
            setShowOTP(false);
            setOtp('');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired code');
        } finally {
            setOtpLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">My Profile</h2>
                <p className="text-slate-500 mt-2">Manage your account information and security settings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
                        <div className="w-24 h-24 bg-brand-500 rounded-full mx-auto flex items-center justify-center text-white text-3xl font-black mb-4 shadow-lg shadow-brand-500/30">
                            {user?.name?.charAt(0)}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">{user?.name}</h3>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[10px] uppercase font-bold text-slate-600 mt-2 border border-slate-200">
                            <Shield className="w-3 h-3" /> {user?.role}
                        </div>
                        <p className="text-sm text-slate-400 mt-4 leading-relaxed">
                            Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                <User className="w-5 h-5 text-brand-500" /> Account Details
                            </h4>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
                            {success && (
                                <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="text-sm font-bold">{success}</span>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
                                    <Shield className="w-5 h-5" />
                                    <span className="text-sm font-bold">{error}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-slate-200 rounded-2xl text-sm focus:ring-brand-500 focus:border-brand-500 transition-all font-medium"
                                            placeholder="Your full name"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-slate-200 rounded-2xl text-sm focus:ring-brand-500 focus:border-brand-500 transition-all font-medium"
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                                    <Key className="w-5 h-5 text-amber-500" /> Change Password
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                                        <input
                                            name="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3.5 bg-slate-50 border-slate-200 rounded-2xl text-sm focus:ring-brand-500 focus:border-brand-500 transition-all font-medium"
                                            placeholder="Leave blank to keep current"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                                        <input
                                            name="confirmPassword"
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3.5 bg-slate-50 border-slate-200 rounded-2xl text-sm focus:ring-brand-500 focus:border-brand-500 transition-all font-medium"
                                            placeholder="Re-type new password"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-4 bg-brand-500 text-white font-black text-sm rounded-2xl hover:bg-brand-600 transition-all flex items-center gap-2 shadow-lg shadow-brand-500/25 active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* OTP Verification Modal */}
            {showOTP && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"></div>
                    <div className="bg-white w-full max-w-md rounded-[32px] p-8 relative shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-200">
                        <div className="mb-6 text-center">
                            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-8 h-8 text-amber-500" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">Confirm Security Code</h3>
                            <p className="text-sm text-slate-500 mt-2">A code has been sent to your registered email. Please enter it below to confirm your password change.</p>
                        </div>

                        <form onSubmit={handleVerifyPasswordChange} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest text-center block">Verification Code</label>
                                <input
                                    type="text" required maxLength="6" value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    className="w-full py-4 bg-slate-50 border-slate-200 rounded-2xl text-2xl font-black text-center tracking-[0.5em] focus:ring-brand-500 transition-all font-mono"
                                    placeholder="000000"
                                    autoFocus
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    type="submit" disabled={otpLoading}
                                    className="w-full py-4 bg-brand-500 text-white font-black text-sm rounded-2xl hover:bg-brand-600 transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    {otpLoading ? 'Verifying...' : 'Confirm Update'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowOTP(false); setOtp(''); }}
                                    className="w-full py-4 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Cancel & Go Back
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
