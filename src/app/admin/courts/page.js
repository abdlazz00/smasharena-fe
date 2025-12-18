'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';

export default function AdminCourts() {
    // --- STATE MANAGEMENT ---
    const [courts, setCourts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    
    // State Notifikasi Custom
    const [notif, setNotif] = useState({ show: false, message: '', isError: false });

    // State Modal Hapus
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

    // State Mode Edit
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // State Form
    const [form, setForm] = useState({
        name: '',
        sport_type: 'Badminton',
        court_type: 'indoor',
        type: 'vinyl',
        price: '',
        description: '', 
        is_active: '1',
        image: null
    });

    // --- API FUNCTIONS ---

    // Ambil Data Lapangan
    const fetchCourts = async () => {
        try {
            // Parameter ?all=1 agar admin bisa lihat lapangan maintenance
            const res = await api.get('/courts?all=1');
            setCourts(res.data);
        } catch (error) {
            console.error(error);
            showNotification('Gagal memuat data.', true);
        }
    };

    useEffect(() => { fetchCourts(); }, []);

    // Helper Notifikasi
    const showNotification = (message, isError = false) => {
        setNotif({ show: true, message, isError });
        setTimeout(() => setNotif({ show: false, message: '', isError: false }), 3000);
    };

    // Reset Form
    const resetForm = () => {
        setForm({ 
            name: '', 
            sport_type: 'Badminton', 
            court_type: 'indoor', 
            type: 'vinyl', 
            price: '', 
            description: '', 
            is_active: '1', 
            image: null 
        });
        setEditMode(false);
        setEditingId(null);
    };

    // Buka Modal Tambah/Edit
    const openModal = (court = null) => {
        if (court) {
            setEditMode(true);
            setEditingId(court.id);
            setForm({
                name: court.name,
                sport_type: court.sport_type || 'Badminton',
                court_type: court.court_type || 'indoor',
                type: court.type,
                price: court.price_per_hour,
                description: court.description || '', 
                is_active: court.is_active ? '1' : '0',
                image: null
            });
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    // Submit Data (Tambah/Update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('sport_type', form.sport_type);
        formData.append('court_type', form.court_type);
        formData.append('type', form.type);
        formData.append('price_per_hour', form.price);
        formData.append('description', form.description);
        formData.append('is_active', form.is_active);
        
        if (form.image) {
            formData.append('image', form.image);
        }

        try {
            if (editMode) {
                await api.post(`/courts/${editingId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showNotification('Lapangan Berhasil Diupdate!');
            } else {
                await api.post('/courts', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showNotification('Lapangan Berhasil Ditambah!');
            }

            setShowModal(false);
            fetchCourts(); 
            resetForm();
        } catch (error) {
            showNotification('Gagal menyimpan data.', true);
            console.error(error);
        }
    };

    // Buka Modal Konfirmasi Hapus
    const confirmDelete = (id) => {
        setDeleteModal({ show: true, id });
    };

    // Eksekusi Hapus
    const handleDeleteExecute = async () => {
        try {
            await api.delete(`/courts/${deleteModal.id}`);
            fetchCourts();
            showNotification('Lapangan Berhasil Dihapus!');
            setDeleteModal({ show: false, id: null });
        } catch (error) {
            showNotification('Gagal menghapus.', true);
            setDeleteModal({ show: false, id: null });
        }
    };

    // --- JSX RENDER ---
    return (
        <div>
            {/* HEADER */}
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white">Kelola Lapangan</h2>
                <button 
                    onClick={() => openModal()}
                    className="bg-neon hover:bg-neon-hover text-navy-950 px-4 py-2 rounded-lg font-bold shadow-lg shadow-neon/20 flex items-center gap-2 transition"
                >
                    <i className="fa-solid fa-plus"></i> Tambah Lapangan
                </button>
            </div>

            {/* LIST LAPANGAN (GRID) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {courts.map((court) => (
                    <div key={court.id} className={`bg-navy-800 rounded-2xl border ${court.is_active ? 'border-navy-700' : 'border-red-900 opacity-75'} overflow-hidden group hover:border-navy-500 transition`}>
                        {/* Gambar Lapangan */}
                        <div className="h-40 bg-navy-900 relative">
                            {court.image_url ? (
                                <img src={court.image_url} alt={court.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                    <i className="fa-solid fa-image text-3xl"></i>
                                </div>
                            )}
                            <span className={`absolute top-2 right-2 text-white text-xs font-bold px-2 py-1 rounded ${court.is_active ? 'bg-green-500' : 'bg-red-500'}`}>
                                {court.is_active ? 'Aktif' : 'Maintenance'}
                            </span>
                        </div>

                        {/* Info Lapangan */}
                        <div className="p-5">
                            <h3 className="font-bold text-lg text-white">{court.name}</h3>
                            <p className="text-sm text-slate-400 mb-2 capitalize">
                                {court.sport_type} • {court.court_type}
                            </p>
                            <p className="text-xs text-slate-500 mb-4 line-clamp-2 h-8">
                                {court.description || 'Tidak ada deskripsi.'}
                            </p>
                            
                            <div className="flex justify-between items-center bg-navy-900 p-3 rounded-lg mb-4">
                                <span className="text-xs text-slate-400 font-bold uppercase">Harga / Jam</span>
                                <span className="text-neon font-bold">Rp {parseInt(court.price_per_hour).toLocaleString()}</span>
                            </div>

                            <div className="flex gap-2">
                                <button 
                                    onClick={() => openModal(court)}
                                    className="flex-1 bg-navy-700 hover:bg-white hover:text-navy-900 text-white py-2 rounded-lg text-sm font-bold transition"
                                >
                                    <i className="fa-solid fa-pen-to-square mr-1"></i> Edit
                                </button>
                                <button 
                                    onClick={() => confirmDelete(court.id)}
                                    className="flex-1 border border-red-500/30 text-red-400 hover:bg-red-500/10 py-2 rounded-lg text-sm transition"
                                >
                                    <i className="fa-solid fa-trash mr-1"></i> Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL FORM TAMBAH/EDIT */}
            {showModal && (
                <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-navy-800 w-full max-w-md rounded-2xl border border-navy-700 shadow-2xl p-6 relative animate-fade-in-up">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition">
                            <i className="fa-solid fa-xmark text-xl"></i>
                        </button>

                        <div className="mb-6 border-b border-navy-700 pb-4">
                            <h3 className="font-bold text-lg text-white">
                                {editMode ? 'Edit Lapangan' : 'Tambah Lapangan'}
                            </h3>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scroll">
                            {/* Input Nama */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-1 font-bold">Nama Lapangan</label>
                                <input 
                                    type="text" required
                                    className="w-full bg-navy-900 border border-navy-600 rounded-lg p-3 text-white focus:border-neon outline-none"
                                    value={form.name}
                                    onChange={(e) => setForm({...form, name: e.target.value})}
                                />
                            </div>
                            
                            {/* Input Deskripsi */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-1 font-bold">Deskripsi & Fasilitas</label>
                                <textarea 
                                    rows="3"
                                    className="w-full bg-navy-900 border border-navy-600 rounded-lg p-3 text-white focus:border-neon outline-none text-sm"
                                    placeholder="Contoh: Karpet standar BWF, AC Dingin, Pencahayaan LED."
                                    value={form.description}
                                    onChange={(e) => setForm({...form, description: e.target.value})}
                                ></textarea>
                            </div>

                            {/* Dropdown Group 1: Jenis & Lokasi */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1 font-bold">Jenis Olahraga</label>
                                    <select 
                                        className="w-full bg-navy-900 border border-navy-600 rounded-lg p-3 text-white focus:border-neon outline-none"
                                        value={form.sport_type}
                                        onChange={(e) => setForm({...form, sport_type: e.target.value})}
                                    >
                                        <option value="Badminton">Badminton</option>
                                        <option value="Futsal">Futsal</option>
                                        <option value="Tennis">Tennis</option>
                                        <option value="Basketball">Basket</option>
                                        <option value="Table Tennis">Tenis Meja</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1 font-bold">Lokasi</label>
                                    <select 
                                        className="w-full bg-navy-900 border border-navy-600 rounded-lg p-3 text-white focus:border-neon outline-none"
                                        value={form.court_type}
                                        onChange={(e) => setForm({...form, court_type: e.target.value})}
                                    >
                                        <option value="indoor">Indoor</option>
                                        <option value="outdoor">Outdoor</option>
                                    </select>
                                </div>
                            </div>

                            {/* Dropdown Group 2: Lantai & Status */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1 font-bold">Jenis Lantai</label>
                                    <select 
                                        className="w-full bg-navy-900 border border-navy-600 rounded-lg p-3 text-white focus:border-neon outline-none"
                                        value={form.type}
                                        onChange={(e) => setForm({...form, type: e.target.value})}
                                    >
                                        <option value="vinyl">Karpet Vinyl</option>
                                        <option value="parquet">Kayu (Parquet)</option>
                                        <option value="cement">Semen</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1 font-bold">Status</label>
                                    <select 
                                        className="w-full bg-navy-900 border border-navy-600 rounded-lg p-3 text-white focus:border-neon outline-none"
                                        value={form.is_active}
                                        onChange={(e) => setForm({...form, is_active: e.target.value})}
                                    >
                                        <option value="1">Aktif</option>
                                        <option value="0">Maintenance</option>
                                    </select>
                                </div>
                            </div>

                            {/* Harga */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-1 font-bold">Harga per Jam</label>
                                <input 
                                    type="number" required
                                    className="w-full bg-navy-900 border border-navy-600 rounded-lg p-3 text-white focus:border-neon outline-none"
                                    value={form.price}
                                    onChange={(e) => setForm({...form, price: e.target.value})}
                                />
                            </div>

                            {/* Foto */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-1 font-bold">
                                    Foto {editMode && '(Biarkan kosong jika tidak ganti)'}
                                </label>
                                <input 
                                    type="file" 
                                    className="w-full text-slate-400 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-neon file:text-navy-900 hover:file:bg-neon-hover"
                                    onChange={(e) => setForm({...form, image: e.target.files[0]})}
                                />
                            </div>

                            <button type="submit" className="w-full bg-neon text-navy-900 font-bold py-3 rounded-xl hover:bg-neon-hover mt-4 shadow-lg shadow-neon/20 transition">
                                {editMode ? 'Update Data' : 'Simpan Data'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI HAPUS */}
            {deleteModal.show && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy-950/90 backdrop-blur-sm p-4">
                    <div className="bg-navy-800 w-full max-w-sm rounded-2xl border border-navy-600 shadow-2xl p-6 text-center animate-bounce-small">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                            <i className="fa-solid fa-triangle-exclamation text-3xl text-red-500"></i>
                        </div>
                        <h3 className="font-bold text-xl text-white mb-2">Hapus Lapangan?</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            Data yang dihapus tidak dapat dikembalikan. Apakah Anda yakin ingin menghapusnya?
                        </p>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setDeleteModal({ show: false, id: null })}
                                className="flex-1 bg-navy-900 hover:bg-navy-700 text-slate-300 font-bold py-3 rounded-xl border border-navy-600 transition"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleDeleteExecute}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-600/20 transition"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* NOTIFIKASI POPUP (TOAST) */}
            {notif.show && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none">
                    <div className="bg-navy-800 border border-navy-600 shadow-2xl p-6 rounded-2xl flex flex-col items-center justify-center min-w-[250px] animate-bounce-small pointer-events-auto">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${notif.isError ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                            <i className={`fa-solid ${notif.isError ? 'fa-xmark' : 'fa-check'} text-3xl`}></i>
                        </div>
                        <h4 className="text-white font-bold text-lg mb-1">{notif.isError ? 'Gagal!' : 'Berhasil!'}</h4>
                        <p className="text-slate-400 text-sm text-center">{notif.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
}