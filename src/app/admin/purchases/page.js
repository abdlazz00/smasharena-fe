'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';

export default function AdminPurchases() {
    // --- STATE ---
    const [history, setHistory] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form Header
    const [supplier, setSupplier] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Form Item
    const [cart, setCart] = useState([]);
    const [currentItem, setCurrentItem] = useState({
        product_id: '',
        quantity: '',
        buy_price: ''
    });

    const [saving, setSaving] = useState(false);
    const [notif, setNotif] = useState({ show: false, message: '', isError: false });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resHistory, resProducts] = await Promise.all([
                api.get('/admin/purchases'),
                api.get('/admin/products')
            ]);
            setHistory(resHistory.data.data);
            setProducts(resProducts.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const showNotification = (message, isError = false) => {
        setNotif({ show: true, message, isError });
        setTimeout(() => setNotif({ show: false, message: '', isError: false }), 3000);
    };

    // --- FITUR BARU: FORMAT TANGGAL CANTIK ---
    const formatDate = (isoString) => {
        if (!isoString) return '-';
        const dateObj = new Date(isoString);
        return dateObj.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long', 
            year: 'numeric'
        });
    };

    const addToCart = () => {
        if (!currentItem.product_id || !currentItem.quantity || !currentItem.buy_price) {
            showNotification("Lengkapi data item!", true);
            return;
        }

        const selectedProduct = products.find(p => p.id == currentItem.product_id);
        
        const newItem = {
            ...currentItem,
            product_name: selectedProduct.name,
            total: parseInt(currentItem.quantity) * parseInt(currentItem.buy_price)
        };

        setCart([...cart, newItem]);
        setCurrentItem({ product_id: '', quantity: '', buy_price: '' });
    };

    const removeFromCart = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const handleSubmit = async () => {
        if (cart.length === 0) {
            showNotification("Keranjang belanja masih kosong!", true);
            return;
        }
        setSaving(true);
        try {
            await api.post('/admin/purchases', {
                supplier_name: supplier,
                purchase_date: date,
                items: cart
            });
            showNotification("Stok berhasil ditambahkan!");
            setCart([]);
            setSupplier('');
            fetchData();
        } catch (error) {
            showNotification(error.response?.data?.message || "Gagal menyimpan.", true);
        } finally {
            setSaving(false);
        }
    };

    const grandTotal = cart.reduce((acc, item) => acc + item.total, 0);

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <i className="fa-solid fa-boxes-packing text-neon"></i> Stok Masuk (Purchasing)
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                {/* FORM INPUT */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-navy-800 p-6 rounded-2xl border border-navy-700">
                        <h3 className="text-white font-bold mb-4 border-b border-navy-700 pb-2">Informasi Supplier</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Tanggal Beli</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white focus:border-neon outline-none" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Nama Toko / Supplier</label>
                                <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Contoh: Agen Jaya" className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white focus:border-neon outline-none" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-navy-800 p-6 rounded-2xl border border-navy-700">
                        <h3 className="text-white font-bold mb-4 border-b border-navy-700 pb-2">Input Barang</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-2">
                                <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Pilih Produk</label>
                                <select 
                                    value={currentItem.product_id} 
                                    onChange={e => setCurrentItem({...currentItem, product_id: e.target.value})} 
                                    className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white focus:border-neon outline-none"
                                >
                                    <option value="">-- Pilih Produk --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Jumlah Beli</label>
                                <input type="number" placeholder="0" value={currentItem.quantity} onChange={e => setCurrentItem({...currentItem, quantity: e.target.value})} className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white focus:border-neon outline-none" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Harga Beli / Pcs</label>
                                <input type="number" placeholder="Rp 0" value={currentItem.buy_price} onChange={e => setCurrentItem({...currentItem, buy_price: e.target.value})} className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white focus:border-neon outline-none" />
                            </div>
                        </div>
                        <button onClick={addToCart} className="mt-4 w-full bg-navy-700 hover:bg-navy-600 text-white font-bold py-2 rounded-lg border border-navy-600 transition flex items-center justify-center gap-2">
                            <i className="fa-solid fa-plus-circle"></i> Tambah ke Daftar
                        </button>
                    </div>
                </div>

                {/* KERANJANG */}
                <div className="lg:col-span-1">
                    <div className="bg-navy-800 rounded-2xl border border-navy-700 h-full flex flex-col overflow-hidden">
                        <div className="p-4 bg-navy-900 border-b border-navy-700">
                            <h3 className="text-white font-bold">Daftar Belanjaan</h3>
                            <p className="text-xs text-slate-400">Pastikan data sudah benar.</p>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar" style={{maxHeight: '400px'}}>
                            {cart.length === 0 ? (
                                <div className="text-center py-10 text-slate-500 italic">Belum ada item.</div>
                            ) : (
                                cart.map((item, idx) => (
                                    <div key={idx} className="bg-navy-900 p-3 rounded-xl border border-navy-700 flex justify-between items-center group">
                                        <div>
                                            <p className="text-white font-bold text-sm">{item.product_name}</p>
                                            <p className="text-xs text-slate-400">{item.quantity} x Rp {parseInt(item.buy_price).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-neon font-bold text-sm">Rp {item.total.toLocaleString()}</p>
                                            <button onClick={() => removeFromCart(idx)} className="text-red-500 text-xs hover:underline mt-1">Hapus</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 bg-navy-900 border-t border-navy-700">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-slate-400 font-bold uppercase text-xs">Total Modal</span>
                                <span className="text-xl font-bold text-white">Rp {grandTotal.toLocaleString()}</span>
                            </div>
                            <button 
                                onClick={handleSubmit} 
                                disabled={cart.length === 0 || saving}
                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${cart.length === 0 ? 'bg-navy-700 text-slate-500 cursor-not-allowed' : 'bg-neon hover:bg-neon-hover text-navy-900 shadow-lg shadow-neon/20'}`}
                            >
                                {saving ? <><i className="fa-solid fa-spinner animate-spin"></i> Proses...</> : <><i className="fa-solid fa-save"></i> Simpan Stok Masuk</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABEL RIWAYAT */}
            <h2 className="text-xl font-bold text-white mb-4">Riwayat Pembelian Terakhir</h2>
            <div className="bg-navy-800 rounded-2xl border border-navy-700 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-navy-900 text-xs uppercase font-bold text-slate-300">
                        <tr>
                            <th className="px-6 py-4">Tanggal</th>
                            <th className="px-6 py-4">Supplier</th>
                            <th className="px-6 py-4">Barang</th>
                            <th className="px-6 py-4 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-700">
                        {loading ? (
                             <tr><td colSpan="4" className="text-center py-8">Memuat data...</td></tr>
                        ) : history.length === 0 ? (
                            <tr><td colSpan="4" className="text-center py-8">Belum ada riwayat pembelian.</td></tr>
                        ) : history.map((h) => (
                            <tr key={h.id} className="hover:bg-navy-700/50">
                                {/* PERBAIKAN DI SINI: Panggil fungsi formatDate */}
                                <td className="px-6 py-4 text-white font-bold">{formatDate(h.purchase_date)}</td>
                                
                                <td className="px-6 py-4">{h.supplier_name || '-'}</td>
                                <td className="px-6 py-4">
                                    <ul className="list-disc list-inside text-xs space-y-1">
                                        {h.purchase_items.map((item, i) => (
                                            <li key={i}>
                                                <span className="text-white font-bold">{item.product?.name}</span> 
                                                <span className="text-slate-500 ml-1">({item.quantity} pcs @ Rp {parseInt(item.buy_price).toLocaleString()})</span>
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-neon">Rp {parseInt(h.total_amount).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

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
        </div>
    );
}