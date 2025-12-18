'use client';

import { useState } from 'react';
import api from '@/lib/axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: '', email: '', phone_number: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/register', form);
            
            // Auto login setelah register
            const { access_token, user } = res.data;
            Cookies.set('token', access_token, { expires: 7 });
            Cookies.set('user_role', user.role, { expires: 7 });
            Cookies.set('user_name', user.name, { expires: 7 });

            router.push('/');
        } catch (error) {
            alert(error.response?.data?.message || 'Registrasi Gagal. Email/HP mungkin sudah terpakai.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
            <div className="bg-navy-800 w-full max-w-md p-8 rounded-2xl border border-navy-700 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Buat Akun Baru</h1>
                    <p className="text-slate-400 text-sm">Isi data diri Anda dengan benar</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-400 font-bold block mb-1">Nama Lengkap</label>
                        <input type="text" required className="w-full bg-navy-900 border border-navy-600 rounded-lg p-3 text-white focus:border-neon outline-none"
                            onChange={(e) => setForm({...form, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-bold block mb-1">Email</label>
                        <input type="email" required className="w-full bg-navy-900 border border-navy-600 rounded-lg p-3 text-white focus:border-neon outline-none"
                            onChange={(e) => setForm({...form, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-bold block mb-1">No. WhatsApp</label>
                        <input type="tel" required className="w-full bg-navy-900 border border-navy-600 rounded-lg p-3 text-white focus:border-neon outline-none"
                            onChange={(e) => setForm({...form, phone_number: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-bold block mb-1">Password</label>
                        <input type="password" required className="w-full bg-navy-900 border border-navy-600 rounded-lg p-3 text-white focus:border-neon outline-none"
                            onChange={(e) => setForm({...form, password: e.target.value})} />
                    </div>
                    <button disabled={loading} className="w-full bg-neon text-navy-900 font-bold py-3 rounded-xl hover:bg-neon-hover transition mt-4">
                        {loading ? 'Memproses...' : 'Daftar Sekarang'}
                    </button>
                </form>

                <p className="text-center text-slate-400 text-xs mt-6">
                    Sudah punya akun? <Link href="/login" className="text-neon font-bold hover:underline">Login disini</Link>
                </p>
            </div>
        </main>
    );
}