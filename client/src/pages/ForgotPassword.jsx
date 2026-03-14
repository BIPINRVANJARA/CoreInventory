import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Key, ArrowRight, ArrowLeft, CheckCircle, Shield } from 'lucide-react';
import api from '../api/axios';
import logo from '../assets/logo.png';

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/forgot-password', { email });
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to request OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/verify-otp', { email, otp });
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/reset-password', { email, otp, new_password: newPassword });
            setStep(4);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-96 bg-brand-500 rounded-b-[100px] shadow-lg transform -translate-y-16 -z-10 opacity-10"></div>

            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl mb-4 ring-4 ring-brand-500/10 p-2">
                        <img src={logo} alt="Vyntro Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900">Secure Reset</h1>
                    <p className="mt-2 text-sm font-medium text-slate-500">Protecting your account access</p>
                </div>

                <section className="bg-white/80 backdrop-blur-md p-8 border border-slate-200 shadow-2xl rounded-[32px]">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                            <Shield className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm font-bold leading-tight">{error}</span>
                        </div>
                    )}

                    {step === 1 && (
                        <form onSubmit={handleRequestOTP} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-xl font-black text-slate-800">Forgot Password?</h2>
                                <p className="text-sm text-slate-500 mt-1">Enter your email and we'll send you a 6-digit recovery code.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border-slate-200 rounded-2xl text-sm focus:ring-brand-500 transition-all font-medium"
                                        placeholder="name@company.com"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit" disabled={loading}
                                className="w-full py-4 bg-brand-500 text-white font-black text-sm rounded-2xl hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Sending Code...' : <><Mail className="w-4 h-4" /> Send Recovery Code</>}
                            </button>
                            <button type="button" onClick={() => navigate('/login')} className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-2">
                                <ArrowLeft className="w-3 h-3" /> Back to Login
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-xl font-black text-slate-800">Check your Email</h2>
                                <p className="text-sm text-slate-500 mt-1">We've sent a 6-digit code to <span className="font-bold text-slate-700">{email}</span></p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest text-center block">Verification Code</label>
                                <input
                                    type="text" required maxLength="6" value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    className="w-full py-4 bg-slate-50 border-slate-200 rounded-2xl text-2xl font-black text-center tracking-[0.5em] focus:ring-brand-500 transition-all"
                                    placeholder="000000"
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit" disabled={loading}
                                className="w-full py-4 bg-slate-900 text-white font-black text-sm rounded-2xl hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-2"
                            >
                                {loading ? 'Verifying...' : 'Verify Code'}
                            </button>
                            <button type="button" onClick={() => setStep(1)} className="w-full text-xs font-bold text-slate-400 hover:text-slate-600">
                                Incorrect email? Change it
                            </button>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-xl font-black text-slate-800">Set New Password</h2>
                                <p className="text-sm text-slate-500 mt-1">Choose a secure password you haven't used before.</p>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                                    <input
                                        type="password" required minLength="6" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-4 bg-slate-50 border-slate-200 rounded-2xl text-sm focus:ring-brand-500 transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                                    <input
                                        type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-4 bg-slate-50 border-slate-200 rounded-2xl text-sm focus:ring-brand-500 transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit" disabled={loading}
                                className="w-full py-4 bg-brand-500 text-white font-black text-sm rounded-2xl hover:bg-brand-600 transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    )}

                    {step === 4 && (
                        <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-10 h-10 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800">Success!</h2>
                                <p className="text-sm text-slate-500 mt-2">Your password has been reset successfully. You can now log in with your new credentials.</p>
                            </div>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full py-4 bg-slate-900 text-white font-black text-sm rounded-2xl hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-2"
                            >
                                Go to Login <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </section>

                <p className="text-center text-xs text-slate-400 mt-8">Secure encryption powered by Vyntro v1.2</p>
            </div>
        </main>
    );
}
