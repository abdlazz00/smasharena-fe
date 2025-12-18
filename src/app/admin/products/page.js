'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import Navbar from '@/components/Navbar'; // Pastikan path Navbar sesuai

export default function AdminProducts() {
    // --- STATE ---
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState('all');
    const [search, setSearch] = useState('');

    // State Modal & Form
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [saving, setSaving] = useState(false);
    
    // Form Data
    const [form, setForm] = useState({
        name: '',
        category: 'drink',
        price: '',       // Harga Jual
        cost_price: '',  // Harga Modal
        stock: '',
        image: null
    });
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    // Notifikasi
    const [notif, setNotif] = useState({ show: false, message: '', isError: false });

    // --- FETCH DATA ---
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/products', {
                params: { category: filterCategory, search: search }
            });
            setProducts(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [filterCategory]); // Refresh saat ganti kategori

    // --- HANDLERS ---
    const showNotification = (message, isError = false) => {
        setNotif({ show: true, message, isError });
        setTimeout(() => setNotif({ show: false, message: '', isError: false }), 3000);
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') fetchProducts();
    };

    const openModal = (product = null) => {
        if (product) {
            // Mode Edit
            setIsEdit(true);
            setEditId(product.id);
            setForm({
                name: product.name,
                category: product.category,
                price: product.price,
                cost_price: product.cost_price,
                stock: product.stock,
                image: null
            });
            setImagePreview(product.image); // Tampilkan foto lama
        } else {
            // Mode Tambah
            setIsEdit(false);
            setEditId(null);
            setForm({ name: '', category: 'drink', price: '', cost_price: '', stock: '', image: null });
            setImagePreview(null);
        }
        setShowModal(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm({ ...form, image: file });
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('category', form.category);
        formData.append('price', form.price);
        formData.append('cost_price', form.cost_price || 0);
        formData.append('stock', form.stock || 0);
        if (form.image) {
            formData.append('image', form.image);
        }

        try {
            if (isEdit) {
                // Update (POST ke endpoint update yg sudah kita buat)
                await api.post(`/admin/products/${editId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showNotification("Produk berhasil diperbarui!");
            } else {
                // Create
                await api.post('/admin/products', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showNotification("Produk baru ditambahkan!");
            }
            setShowModal(false);
            fetchProducts();
        } catch (error) {
            showNotification(error.response?.data?.message || "Gagal menyimpan.", true);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (id) => {
        if (!confirm("Ubah status aktif produk ini?")) return;
        try {
            await api.delete(`/admin/products/${id}`); // Route delete kita pakai utk toggle status
            fetchProducts();
            showNotification("Status produk diubah.");
        } catch (error) {
            showNotification("Gagal ubah status.", true);
        }
    };

    return (
        <main className="min-h-screen bg-navy-950 pb-20">
            {/* Navbar Admin (Pastikan ada komponen ini atau hapus jika pakai Layout) */}
            {/* <Navbar /> */} 

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <i className="fa-solid fa-box-open text-neon"></i> Master Produk
                        </h1>
                        <p className="text-slate-400 text-sm">Kelola barang jualan kantin & toko.</p>
                    </div>
                    <button 
                        onClick={() => openModal()}
                        className="bg-neon hover:bg-neon-hover text-navy-900 px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-neon/20 transition flex items-center gap-2"
                    >
                        <i className="fa-solid fa-plus"></i> Tambah Produk
                    </button>
                </div>

                {/* FILTER & SEARCH */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    {/* Tabs Kategori */}
                    <div className="flex bg-navy-900 p-1 rounded-xl border border-navy-800">
                        {['all', 'drink', 'food', 'equipment'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition ${
                                    filterCategory === cat 
                                    ? 'bg-navy-700 text-white shadow' 
                                    : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                {cat === 'all' ? 'Semua' : cat}
                            </button>
                        ))}
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-64">
                        <input 
                            type="text" 
                            placeholder="Cari produk..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleSearch}
                            className="w-full bg-navy-800 border border-navy-700 text-white py-2 pl-10 pr-4 rounded-xl focus:border-neon outline-none text-sm"
                        />
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-500"></i>
                    </div>
                </div>

                {/* GRID PRODUK */}
                {loading ? (
                    <div className="text-center py-20 text-slate-500">Memuat produk...</div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-navy-800 rounded-2xl">
                        <i className="fa-solid fa-box-open text-4xl text-navy-700 mb-3"></i>
                        <p className="text-slate-400">Belum ada produk.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {products.map((item) => (
                            <div key={item.id} className={`bg-navy-800 rounded-2xl border ${item.is_active ? 'border-navy-700' : 'border-red-900/50 opacity-75'} overflow-hidden shadow-lg group hover:border-navy-500 transition`}>
                                {/* Gambar */}
                                <div className="h-40 bg-navy-900 relative">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                                            <i className="fa-regular fa-image text-3xl"></i>
                                        </div>
                                    )}
                                    {/* Badge Kategori */}
                                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-white uppercase">
                                        {item.category}
                                    </div>
                                    {/* Badge Status jika Non-Aktif */}
                                    {!item.is_active && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <span className="text-red-500 font-bold border border-red-500 px-3 py-1 rounded uppercase text-xs">Non-Aktif</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    <h3 className="text-white font-bold truncate mb-1">{item.name}</h3>
                                    <div className="flex justify-between items-end mb-3">
                                        <div>
                                            <p className="text-[10px] text-slate-500">Harga Jual</p>
                                            <p className="text-neon font-bold">Rp {parseInt(item.price).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-500">Stok</p>
                                            <p className={`font-bold ${item.stock < 5 ? 'text-red-500' : 'text-white'}`}>{item.stock}</p>
                                        </div>
                                    </div>

                                    {/* Tombol Aksi */}
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => openModal(item)}
                                            className="flex-1 bg-navy-700 hover:bg-navy-600 text-slate-200 py-2 rounded-lg text-xs font-bold transition"
                                        >
                                            <i className="fa-solid fa-pen"></i> Edit
                                        </button>
                                        <button 
                                            onClick={() => handleToggleStatus(item.id)}
                                            className={`w-8 flex items-center justify-center rounded-lg text-xs transition ${item.is_active ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white'}`}
                                            title={item.is_active ? "Non-aktifkan" : "Aktifkan"}
                                        >
                                            <i className={`fa-solid ${item.is_active ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL FORM ADD/EDIT */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm">
                    <div className="bg-navy-800 w-full max-w-lg rounded-2xl border border-navy-700 shadow-2xl overflow-hidden animate-fade-in-up">
                        <div className="p-4 border-b border-navy-700 flex justify-between items-center bg-navy-900">
                            <h3 className="text-white font-bold">{isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><i className="fa-solid fa-xmark text-xl"></i></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            
                            {/* Upload Gambar */}
                            <div className="flex items-center gap-4">
                                <div 
                                    onClick={() => fileInputRef.current.click()}
                                    className="w-20 h-20 rounded-xl bg-navy-900 border border-navy-600 flex items-center justify-center overflow-hidden cursor-pointer hover:border-neon transition relative"
                                >
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <i className="fa-solid fa-camera text-slate-500"></i>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-white font-bold">Foto Produk</p>
                                    <p className="text-xs text-slate-500 mb-2">Format: JPG, PNG. Max 2MB.</p>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                    <button type="button" onClick={() => fileInputRef.current.click()} className="text-xs bg-navy-700 px-3 py-1 rounded text-slate-300 hover:text-white">Pilih File</button>
                                </div>
                            </div>

                            {/* Nama & Kategori */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Nama Produk</label>
                                    <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white focus:border-neon outline-none" placeholder="Contoh: Pocari Sweat" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Kategori</label>
                                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white focus:border-neon outline-none">
                                        <option value="drink">Minuman</option>
                                        <option value="food">Makanan</option>
                                        <option value="equipment">Perlengkapan</option>
                                        <option value="other">Lainnya</option>
                                    </select>
                                </div>
                            </div>

                            {/* Harga & Stok */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Harga Jual</label>
                                    <input type="number" required value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white focus:border-neon outline-none" placeholder="0" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Harga Modal</label>
                                    <input type="number" value={form.cost_price} onChange={e => setForm({...form, cost_price: e.target.value})} className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white focus:border-neon outline-none" placeholder="0" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Stok Awal</label>
                                    <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white focus:border-neon outline-none" placeholder="0" />
                                </div>
                            </div>

                            <button type="submit" disabled={saving} className="w-full bg-neon hover:bg-neon-hover text-navy-900 font-bold py-3 rounded-xl transition shadow-lg shadow-neon/20 flex justify-center items-center gap-2 mt-2">
                                {saving ? <><i className="fa-solid fa-spinner animate-spin"></i> Menyimpan...</> : 'Simpan Produk'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* NOTIFIKASI */}
            {notif.show && (
                <div className="fixed bottom-10 right-10 z-[100] bg-navy-800 border border-navy-600 shadow-2xl p-4 rounded-xl flex items-center gap-3 animate-slide-up">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notif.isError ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                        <i className={`fa-solid ${notif.isError ? 'fa-xmark' : 'fa-check'}`}></i>
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm">{notif.isError ? 'Error' : 'Berhasil'}</h4>
                        <p className="text-slate-400 text-xs">{notif.message}</p>
                    </div>
                </div>
            )}
        </main>
    );
}