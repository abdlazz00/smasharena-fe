'use client';

import { useState } from 'react';
import api from '@/lib/axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/login', form);
            
            // Simpan data ke Cookie
            const { access_token, user } = res.data;
            Cookies.set('token', access_token, { expires: 7 });
            Cookies.set('user_role', user.role, { expires: 7 });
            Cookies.set('user_name', user.name, { expires: 7 });

            // Redirect
            if (user.role === 'admin') router.push('/admin/dashboard');
            else router.push('/');

        } catch (error) {
            alert(error.response?.data?.message || 'Login Gagal');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
    };

    return (
        <main className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
            <div className="bg-navy-800 w-full max-w-md p-8 rounded-2xl border border-navy-700 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Selamat Datang</h1>
                    <p className="text-slate-400 text-sm">Masuk untuk mulai booking lapangan</p>
                </div>

                {/* Form Manual */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-400 font-bold block mb-1">Email</label>
                        <input 
                            type="email" required
                            className="w-full bg-navy-900 border border-navy-600 rounded-lg p-3 text-white focus:border-neon outline-none"
                            onChange={(e) => setForm({...form, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-bold block mb-1">Password</label>
                        <input 
                            type="password" required
                            className="w-full bg-navy-900 border border-navy-600 rounded-lg p-3 text-white focus:border-neon outline-none"
                            onChange={(e) => setForm({...form, password: e.target.value})}
                        />
                    </div>
                    <button disabled={loading} className="w-full bg-neon text-navy-900 font-bold py-3 rounded-xl hover:bg-neon-hover transition">
                        {loading ? 'Memproses...' : 'Masuk'}
                    </button>
                </form>

                <div className="flex items-center gap-4 my-6">
                    <div className="h-px bg-navy-600 flex-1"></div>
                    <span className="text-xs text-slate-500">ATAU</span>
                    <div className="h-px bg-navy-600 flex-1"></div>
                </div>

                {/* Tombol Google */}
                <button onClick={handleGoogleLogin} className="w-full bg-white text-navy-900 font-bold py-3 rounded-xl hover:bg-gray-100 transition flex items-center justify-center gap-2">
                    <i className="fa-brands fa-google text-red-500"></i> Masuk dengan Google
                </button>

                <p className="text-center text-slate-400 text-xs mt-6">
                    Belum punya akun? <Link href="/register" className="text-neon font-bold hover:underline">Daftar disini</Link>
                </p>
            </div>
        </main>
    );
}