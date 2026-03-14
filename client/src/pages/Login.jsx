import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showOTP, setShowOTP] = useState(false);
    const [otp, setOtp] = useState('');
    const { login, verify2FA } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            const data = await login(email, password);

            if (data.twoFactorRequired) {
                setShowOTP(true);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to sign in. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleOTPSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await verify2FA(email, otp);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">

            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-96 bg-brand-500 rounded-b-[100px] shadow-lg transform -translate-y-16 -z-10 opacity-10"></div>
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-brand-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            <div className="w-full max-w-md w-full">
                {/* Brand Logo */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-xl mb-4 ring-4 ring-brand-500/10 p-2">
                        <img src={logo} alt="Vyntro Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 drop-shadow-sm">Vyntro</h1>
                    <p className="mt-2 text-sm font-medium text-slate-500 tracking-wide">Streamlined Operations Management</p>
                </div>

                {/* Auth Card */}
                <section className="bg-white/80 backdrop-blur-md p-8 sm:p-10 border border-slate-200/50 shadow-2xl rounded-[24px]">

                    <div className="mb-6">
                        <h2 className="text-xl font-black text-slate-800">
                            {showOTP ? 'Verification Required' : 'Welcome Back'}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {showOTP ? `Please enter the 6-digit code sent to your email` : 'Sign in with your credentials to continue'}
                        </p>
                    </div>

                    {!showOTP ? (
                        <form onSubmit={handleSubmit} className="space-y-5 relative">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <input
                                            id="email" type="email"
                                            required value={email} onChange={(e) => setEmail(e.target.value)}
                                            className="block w-full pl-10 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50 hover:bg-white transition-colors placeholder-slate-400 font-medium text-slate-800"
                                            placeholder="name@company.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5 ml-1">
                                        <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/forgot-password')}
                                            className="text-xs font-bold text-brand-500 hover:text-brand-600 transition-colors"
                                        >
                                            Forgot?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <input
                                            id="password" type="password"
                                            required value={password} onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full pl-10 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50 hover:bg-white transition-colors placeholder-slate-400 font-medium text-slate-800"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-brand-500/30 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {loading ? 'Signing In...' : 'Sign In to Account'}
                                        {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                                    </span>
                                    <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                </button>
                            </div>

                            <div className="text-center text-xs font-medium text-slate-400 mt-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <span className="text-slate-500">Manager:</span> alex@coreinventory.com <br />
                                <span className="text-slate-500">Staff:</span> sarah@coreinventory.com <br />
                                <span className="text-slate-500">Password:</span> password123
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleOTPSubmit} className="space-y-5 relative">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> {error}
                                </div>
                            )}

                            <div>
                                <label htmlFor="otp" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1 text-center">6-Digit Code</label>
                                <div className="relative">
                                    <input
                                        id="otp" type="text" maxLength="6"
                                        required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className="block w-full text-center tracking-[1em] font-black border border-slate-200 rounded-xl py-4 text-2xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50 hover:bg-white transition-all text-slate-800"
                                        placeholder="000000"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 px-4 border border-transparent rounded-xl shadow-xl text-sm font-black text-white bg-slate-900 hover:bg-slate-800 focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-70"
                            >
                                {loading ? 'Verifying...' : 'Verify & Complete Login'}
                            </button>

                            <div className="flex flex-col items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowOTP(false)}
                                    className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Cancel & Return to Login
                                </button>


                            </div>
                        </form>
                    )}

                </section>

                <p className="text-center text-xs text-slate-400 mt-6">Staff accounts are created by your Inventory Manager</p>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}} />
        </main>
    );
}
