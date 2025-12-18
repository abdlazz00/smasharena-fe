'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';

// --- KOMPONEN AVATAR PINTAR (FIX GAMBAR RUSAK) ---
function UserAvatar({ user }) {
    const [imgError, setImgError] = useState(false);

    // Jika ada avatar DAN belum error, tampilkan gambar
    if (user.avatar && !imgError) {
        return (
            <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-full h-full object-cover"
                onError={() => setImgError(true)} // Kalau error, switch ke inisial
                referrerPolicy="no-referrer"      // Penting untuk gambar Google
            />
        );
    }

    // Fallback: Tampilkan Inisial Nama
    return (
        <span className="font-bold text-white text-lg uppercase">
            {user.name.charAt(0)}
        </span>
    );
}

export default function AdminCustomers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchCustomers = async (keyword = '') => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/customers?search=${keyword}`);
            setCustomers(res.data);
        } catch (error) {
            console.error("Gagal ambil data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            fetchCustomers(search);
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Data Member</h2>
                    <p className="text-slate-400 text-sm">Daftar pelanggan terdaftar</p>
                </div>
                
                <div className="relative w-full md:w-64">
                    <input 
                        type="text" 
                        placeholder="Cari Nama / No. WA..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleSearch}
                        className="w-full bg-navy-800 border border-navy-700 text-white py-2 pl-10 pr-4 rounded-xl focus:border-neon outline-none"
                    />
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-500"></i>
                </div>
            </div>

            <div className="bg-navy-800 rounded-2xl border border-navy-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-navy-900 text-xs uppercase font-bold text-slate-300">
                            <tr>
                                <th className="px-6 py-4">Profil</th>
                                <th className="px-6 py-4">Nama Lengkap</th>
                                <th className="px-6 py-4">Kontak</th>
                                <th className="px-6 py-4">Bergabung Sejak</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-700">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-8">Memuat data...</td></tr>
                            ) : customers.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-8">Tidak ada data member.</td></tr>
                            ) : customers.map((user) => (
                                <tr key={user.id} className="hover:bg-navy-700/50 transition">
                                    <td className="px-6 py-4">
                                        <div className="w-10 h-10 rounded-full bg-navy-600 overflow-hidden flex items-center justify-center border border-navy-500">
                                            {/* PANGGIL KOMPONEN AVATAR DISINI */}
                                            <UserAvatar user={user} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-white">
                                        {user.name}
                                        {user.google_id && (
                                            <span className="ml-2 text-[10px] bg-white text-navy-900 px-1.5 py-0.5 rounded border border-gray-300" title="Login via Google">
                                                <i className="fa-brands fa-google"></i>
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-white text-xs mb-1"><i className="fa-solid fa-envelope mr-1 text-slate-500"></i> {user.email}</span>
                                            <span className="text-neon text-xs"><i className="fa-brands fa-whatsapp mr-1"></i> {user.phone_number || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono">
                                        {new Date(user.created_at).toLocaleDateString('id-ID', {
                                            day: 'numeric', month: 'long', year: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {user.phone_number && (
                                            <a 
                                                href={`https://wa.me/${user.phone_number.replace(/^0/, '62')}`} 
                                                target="_blank"
                                                className="text-green-500 hover:text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg text-xs transition inline-flex items-center gap-1"
                                            >
                                                Chat <i className="fa-solid fa-arrow-up-right-from-square"></i>
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}