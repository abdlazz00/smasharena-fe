'use client';

import Navbar from '@/components/Navbar';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const router = useRouter();
    const fileInputRef = useRef(null);
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // State Notifikasi Custom
    const [notif, setNotif] = useState({ show: false, message: '', isError: false });
    
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone_number: '',
        avatar: null,
        avatar_url: ''
    });

    // Helper: Tampilkan Notifikasi
    const showNotification = (message, isError = false) => {
        setNotif({ show: true, message, isError });
        // Hilang otomatis setelah 3 detik
        setTimeout(() => setNotif({ show: false, message: '', isError: false }), 3000);
    };

    // 1. Ambil Data User
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/auth/me');
                setForm({
                    name: res.data.name,
                    email: res.data.email,
                    phone_number: res.data.phone_number || '',
                    avatar: null,
                    avatar_url: res.data.avatar
                });
            } catch (error) {
                console.error(error);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [router]);

    // 2. Handle Ganti Foto (Preview)
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm(prev => ({
                ...prev,
                avatar: file,
                avatar_url: URL.createObjectURL(file) 
            }));
        }
    };

    // 3. Handle Submit
    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);

        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('email', form.email);
        formData.append('phone_number', form.phone_number);
        
        if (form.avatar) {
            formData.append('avatar', form.avatar);
        }

        try {
            const res = await api.post('/auth/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Update nama di Cookies
            Cookies.set('user_name', res.data.user.name, { expires: 7 });
            
            // Tampilkan Notifikasi Sukses
            showNotification("Profil berhasil diperbarui!");
            
            // Refresh halaman setelah 2 detik agar user lihat notif dulu
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            showNotification(error.response?.data?.message || "Gagal update profil.", true);
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="min-h-screen bg-navy-950 pb-20">
            <Navbar />

            <div className="max-w-xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <i className="fa-solid fa-user-pen text-neon"></i> Edit Profil
                </h1>

                <div className="bg-navy-800 border border-navy-700 p-6 rounded-2xl shadow-xl relative">
                    {loading ? (
                        <p className="text-slate-400 text-center py-10">Memuat data...</p>
                    ) : (
                        <form onSubmit={handleUpdate} className="space-y-6">
                            
                            {/* AREA FOTO PROFIL */}
                            <div className="flex flex-col items-center">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                                    <div className="w-24 h-24 rounded-full bg-navy-600 border-2 border-neon overflow-hidden flex items-center justify-center relative">
                                        {form.avatar_url ? (
                                            <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-3xl font-bold text-white">{form.name.charAt(0)}</span>
                                        )}
                                        
                                        <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition">
                                            <i className="fa-solid fa-camera text-white text-2xl"></i>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 right-0 bg-neon text-navy-900 w-8 h-8 rounded-full flex items-center justify-center border-2 border-navy-800 shadow-lg">
                                        <i className="fa-solid fa-camera text-sm"></i>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Klik foto untuk mengganti</p>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>

                            {/* Form Inputs */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1 font-bold">Nama Lengkap</label>
                                    <input 
                                        type="text" required
                                        className="w-full bg-navy-900 border border-navy-600 rounded-lg p-3 text-white focus:border-neon outline-none"
                                        value={form.name}
                                        onChange={(e) => setForm({...form, name: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-slate-400 mb-1 font-bold">Email</label>
                                    <input 
                                        type="email" required
                                        className="w-full bg-navy-900 border border-navy-600 rounded-lg p-3 text-white focus:border-neon outline-none"
                                        value={form.email}
                                        onChange={(e) => setForm({...form, email: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-slate-400 mb-1 font-bold">Nomor WhatsApp</label>
                                    <input 
                                        type="tel" required
                                        placeholder="Contoh: 0812345678"
                                        className="w-full bg-navy-900 border border-navy-600 rounded-lg p-3 text-white focus:border-neon outline-none"
                                        value={form.phone_number}
                                        onChange={(e) => setForm({...form, phone_number: e.target.value})}
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={saving}
                                className="w-full bg-neon hover:bg-neon-hover text-navy-900 font-bold py-3 rounded-xl transition shadow-lg shadow-neon/20 flex justify-center items-center gap-2"
                            >
                                {saving ? (
                                    <><i className="fa-solid fa-spinner animate-spin"></i> Menyimpan...</>
                                ) : (
                                    'Simpan Perubahan'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* NOTIFIKASI POPUP (Sama seperti Admin) */}
            {notif.show && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center pointer-events-none">
                    <div className="bg-navy-800 border border-navy-600 shadow-2xl p-6 rounded-2xl flex flex-col items-center justify-center min-w-[250px] animate-bounce-small pointer-events-auto">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${notif.isError ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                            <i className={`fa-solid ${notif.isError ? 'fa-xmark' : 'fa-check'} text-3xl`}></i>
                        </div>
                        <h4 className="text-white font-bold text-lg mb-1">{notif.isError ? 'Gagal!' : 'Berhasil!'}</h4>
                        <p className="text-slate-400 text-sm text-center">{notif.message}</p>
                    </div>
                </div>
            )}
        </main>
    );
}