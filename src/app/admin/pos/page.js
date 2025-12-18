'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function POSPage() {
    const router = useRouter();

    // --- STATE UTAMA ---
    const [shiftStatus, setShiftStatus] = useState(null); 
    const [products, setProducts] = useState([]);
    const [activeBookings, setActiveBookings] = useState([]); 
    const [loading, setLoading] = useState(true);

    // --- STATE KASIR (POS) ---
    const [cart, setCart] = useState([]);
    const [filterCategory, setFilterCategory] = useState('all');
    const [search, setSearch] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash'); 
    const [selectedBooking, setSelectedBooking] = useState(''); 
    
    // --- STATE MODAL ---
    const [showStartModal, setShowStartModal] = useState(false);
    const [showEndModal, setShowEndModal] = useState(false); 
    const [showCheckoutModal, setShowCheckoutModal] = useState(false); 
    const [showSummaryModal, setShowSummaryModal] = useState(false); 
    
    // MODAL SUKSES & DATA TRANSAKSI
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastTransaction, setLastTransaction] = useState(null);
    
    const [startCash, setStartCash] = useState('');
    const [endCash, setEndCash] = useState('');
    const [endNote, setEndNote] = useState('');
    const [customerCash, setCustomerCash] = useState(''); 
    const [closingData, setClosingData] = useState(null); 

    const [processing, setProcessing] = useState(false);
    const [notif, setNotif] = useState({ show: false, message: '', isError: false });

    // --- 1. INISIALISASI DATA ---
    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const resStatus = await api.get('/admin/cash-session/status');
            
            if (resStatus.data.status === 'closed') {
                setShiftStatus('closed');
                setShowStartModal(true); 
            } else {
                setShiftStatus('open');
                loadPosData();
            }
        } catch (error) {
            console.error("Gagal cek shift:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadPosData = async () => {
        try {
            const [resProd, resBook] = await Promise.all([
                api.get('/admin/products?active_only=true'),
                api.get('/admin/bookings', { params: { date: new Date().toISOString().split('T')[0], status: 'booked' } }) 
            ]);
            setProducts(resProd.data);
            setActiveBookings(resBook.data.data || []); 
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    // --- 2. LOGIKA KERANJANG ---
    const addToCart = (product) => {
        const existingItem = cart.find(item => item.id === product.id);
        const currentQty = existingItem ? existingItem.qty : 0;
        
        if (currentQty + 1 > product.stock) {
            showNotification(`Stok tidak cukup! Sisa: ${product.stock}`, true);
            return;
        }

        if (existingItem) {
            setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
        } else {
            setCart([...cart, { ...product, qty: 1 }]);
        }
    };

    const updateQty = (id, change) => {
        const newCart = cart.map(item => {
            if (item.id === id) {
                const newQty = item.qty + change;
                if (newQty > item.stock) {
                    showNotification("Stok mentok!", true);
                    return item;
                }
                return { ...item, qty: newQty };
            }
            return item;
        }).filter(item => item.qty > 0); 
        setCart(newCart);
    };

    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    
    const calculateChange = () => {
        const pay = parseInt(customerCash || 0);
        return pay - cartTotal;
    };

    // --- 3. HANDLER TRANSAKSI ---
    const confirmCheckout = () => {
        if (cart.length === 0) return showNotification("Keranjang kosong!", true);
        if (paymentMethod === 'open_bill' && !selectedBooking) return showNotification("Pilih Booking dulu untuk Open Bill!", true);
        
        setCustomerCash(''); 
        setShowCheckoutModal(true);
    };

    const executeCheckout = async () => {
        if (paymentMethod === 'cash') {
            const cash = parseInt(customerCash || 0);
            if (cash < cartTotal) {
                return showNotification("Uang customer kurang!", true);
            }
        }

        setProcessing(true);
        try {
            const payload = {
                payment_method: paymentMethod,
                booking_id: paymentMethod === 'open_bill' ? selectedBooking : null,
                items: cart.map(item => ({
                    product_id: item.id,
                    quantity: item.qty
                }))
            };

            const res = await api.post('/admin/orders', payload);
            
            // AMBIL NAMA KASIR DARI COOKIES
            const cashierName = Cookies.get('user_name') || 'Admin';

            // SIMPAN DATA TRANSAKSI LENGKAP UNTUK DICETAK
            setLastTransaction({
                ...res.data.data,
                cash_given: customerCash,
                change: calculateChange(),
                items: cart, // Kirim cart agar namanya ada (penting untuk struk)
                cashier_name: cashierName // Simpan nama kasir
            });

            showNotification("Transaksi Berhasil!");
            setCart([]); 
            loadPosData(); 
            setShowCheckoutModal(false);
            setShowSuccessModal(true); // Buka Modal Sukses
            setCustomerCash('');

        } catch (error) {
            showNotification(error.response?.data?.message || "Transaksi Gagal", true);
        } finally {
            setProcessing(false);
        }
    };

    const handlePrint = () => {
        if (lastTransaction) {
            localStorage.setItem('print_data', JSON.stringify(lastTransaction));
            window.open('/admin/pos/print', '_blank', 'width=400,height=600');
        }
    };

    // --- 4. HANDLER SHIFT ---
    const handleOpenShift = async () => {
        if (!startCash) return showNotification("Isi modal awal!", true);
        setProcessing(true);
        try {
            await api.post('/admin/cash-session/open', { starting_cash: startCash });
            setShiftStatus('open');
            setShowStartModal(false);
            loadPosData();
            showNotification("Shift Dibuka! Selamat bekerja.");
        } catch (error) {
            showNotification("Gagal buka shift.", true);
        } finally {
            setProcessing(false);
        }
    };

    const handleCloseShift = async () => {
        if (!endCash) return showNotification("Isi jumlah uang di laci!", true);
        setProcessing(true);
        try {
            const res = await api.post('/admin/cash-session/close', { 
                ending_cash_actual: endCash,
                note: endNote
            });
            
            setClosingData(res.data.summary);
            setShiftStatus('closed');
            setShowEndModal(false);
            setShowSummaryModal(true); 
        } catch (error) {
            showNotification("Gagal tutup shift.", true);
        } finally {
            setProcessing(false);
        }
    };

    const showNotification = (message, isError = false) => {
        setNotif({ show: true, message, isError });
        setTimeout(() => setNotif({ show: false, message: '', isError: false }), 3000);
    };

    const filteredProducts = products.filter(p => {
        const matchCat = filterCategory === 'all' || p.category === filterCategory;
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    if (loading) return <div className="text-center py-20 text-white">Memuat Sistem POS...</div>;

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
            
            {/* KIRI: KATALOG */}
            <div className="flex-1 flex flex-col h-full">
                <div className="mb-6 flex justify-between items-center gap-4">
                    <div className="flex bg-navy-800 p-1 rounded-xl border border-navy-700">
                        {['all', 'drink', 'food', 'equipment'].map(cat => (
                            <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition ${filterCategory === cat ? 'bg-neon text-navy-900 shadow' : 'text-slate-400 hover:text-white'}`}>
                                {cat === 'all' ? 'Semua' : cat}
                            </button>
                        ))}
                    </div>
                    <div className="relative flex-1 max-w-xs">
                        <input type="text" placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-navy-800 border border-navy-700 text-white py-2 pl-10 pr-4 rounded-xl focus:border-neon outline-none" />
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-500"></i>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
                        {filteredProducts.map(product => (
                            <div key={product.id} onClick={() => addToCart(product)} className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden cursor-pointer hover:border-neon hover:shadow-lg hover:shadow-neon/10 transition group h-full flex flex-col">
                                <div className="h-32 bg-navy-900 relative">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600"><i className="fa-regular fa-image text-2xl"></i></div>
                                    )}
                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white">
                                        Stok: {product.stock}
                                    </div>
                                </div>
                                <div className="p-3 flex flex-col flex-1">
                                    <h4 className="text-white font-bold text-sm mb-1 line-clamp-2">{product.name}</h4>
                                    <div className="mt-auto pt-2 flex justify-between items-center">
                                        <span className="text-neon font-bold text-sm">Rp {parseInt(product.price).toLocaleString()}</span>
                                        <div className="w-6 h-6 rounded-full bg-navy-700 text-slate-400 flex items-center justify-center group-hover:bg-neon group-hover:text-navy-900 transition"><i className="fa-solid fa-plus text-xs"></i></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* KANAN: KERANJANG */}
            <div className="w-full md:w-96 bg-navy-800 border border-navy-700 rounded-2xl flex flex-col h-full shadow-2xl">
                <div className="p-4 border-b border-navy-700 flex justify-between items-center bg-navy-900 rounded-t-2xl">
                    <h3 className="font-bold text-white flex items-center gap-2"><i className="fa-solid fa-cart-shopping text-neon"></i> Keranjang</h3>
                    <button onClick={() => setShowEndModal(true)} className="text-xs bg-red-500/10 text-red-500 px-3 py-1 rounded-lg hover:bg-red-500 hover:text-white transition font-bold border border-red-500/20">
                        <i className="fa-solid fa-power-off mr-1"></i> Tutup Shift
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 flex flex-col items-center">
                            <i className="fa-solid fa-basket-shopping text-4xl mb-2 opacity-50"></i>
                            <p>Keranjang kosong</p>
                        </div>
                    ) : cart.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-navy-900 p-3 rounded-xl border border-navy-700">
                            <div className="flex-1">
                                <p className="text-white font-bold text-sm line-clamp-1">{item.name}</p>
                                <p className="text-xs text-slate-400">@ Rp {parseInt(item.price).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded bg-navy-800 text-white hover:bg-red-500 hover:text-white transition flex items-center justify-center">-</button>
                                <span className="font-bold text-white w-4 text-center text-sm">{item.qty}</span>
                                <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded bg-navy-800 text-white hover:bg-neon hover:text-navy-900 transition flex items-center justify-center">+</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-navy-900 border-t border-navy-700 rounded-b-2xl space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        {['cash', 'qris', 'transfer', 'open_bill'].map(m => (
                            <button 
                                key={m} 
                                onClick={() => setPaymentMethod(m)} 
                                className={`py-2 px-1 rounded-lg text-xs font-bold uppercase border transition flex flex-col items-center justify-center gap-1 ${paymentMethod === m ? 'bg-neon text-navy-900 border-neon' : 'bg-navy-800 text-slate-400 border-navy-700 hover:border-slate-500'}`}
                            >
                                <i className={`fa-solid ${m === 'cash' ? 'fa-money-bill' : m === 'qris' ? 'fa-qrcode' : m === 'transfer' ? 'fa-building-columns' : 'fa-receipt'} text-sm`}></i>
                                {m.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    {paymentMethod === 'open_bill' && (
                        <div className="animate-fade-in">
                            <label className="text-xs text-slate-400 font-bold mb-1 block">Pilih Booking Lapangan:</label>
                            <select value={selectedBooking} onChange={e => setSelectedBooking(e.target.value)} className="w-full bg-navy-800 border border-navy-600 rounded-lg px-2 py-2 text-white text-xs outline-none focus:border-neon">
                                <option value="">-- Pilih Customer --</option>
                                {activeBookings.map(b => (
                                    <option key={b.id} value={b.id}>{b.customer_name} - {b.court?.name} ({b.start_time.substring(0,5)})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex justify-between items-end border-t border-navy-800 pt-3">
                        <div>
                            <p className="text-xs text-slate-400">Total Tagihan</p>
                            <p className="text-2xl font-bold text-white">Rp {cartTotal.toLocaleString()}</p>
                        </div>
                        <button onClick={confirmCheckout} disabled={processing} className="bg-neon hover:bg-neon-hover text-navy-900 px-6 py-3 rounded-xl font-bold shadow-lg shadow-neon/20 transition disabled:opacity-50">
                            {processing ? <i className="fa-solid fa-spinner animate-spin"></i> : 'BAYAR'}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MODAL 1: BUKA SHIFT --- */}
            {showStartModal && (
                <div className="fixed inset-0 z-[60] bg-navy-950/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-navy-800 w-full max-w-sm rounded-2xl border border-navy-600 shadow-2xl p-6 text-center animate-bounce-small relative">
                        <div className="w-16 h-16 bg-neon/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-neon/30">
                            <i className="fa-solid fa-cash-register text-3xl text-neon"></i>
                        </div>
                        <h3 className="font-bold text-xl text-white mb-2">Buka Shift Kasir</h3>
                        <p className="text-slate-400 text-sm mb-6">Masukkan modal awal di laci kasir.</p>
                        
                        <input 
                            type="number" 
                            placeholder="Rp 0" 
                            value={startCash} 
                            onChange={e => setStartCash(e.target.value)} 
                            className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-3 text-white text-center text-lg font-bold mb-4 focus:border-neon outline-none" 
                            autoFocus 
                        />
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => router.push('/admin/dashboard')} 
                                className="flex-1 bg-navy-900 hover:bg-navy-700 text-slate-300 font-bold py-3 rounded-xl border border-navy-600 transition"
                            >
                                Kembali
                            </button>
                            <button 
                                onClick={handleOpenShift} 
                                disabled={processing} 
                                className="flex-1 bg-neon hover:bg-neon-hover text-navy-900 font-bold py-3 rounded-xl shadow-lg transition"
                            >
                                {processing ? '...' : 'Buka Kasir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: INPUT TUTUP SHIFT --- */}
            {showEndModal && (
                <div className="fixed inset-0 z-[60] bg-navy-950/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-navy-800 w-full max-w-sm rounded-2xl border border-navy-600 shadow-2xl p-6 relative animate-bounce-small">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-xl text-white">Tutup Shift</h3>
                            <button onClick={() => setShowEndModal(false)} className="text-slate-400 hover:text-white"><i className="fa-solid fa-xmark text-lg"></i></button>
                        </div>
                        
                        <p className="text-slate-400 text-sm mb-6">Hitung uang tunai fisik di laci saat ini.</p>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Total Uang Fisik (Cash)</label>
                                <input type="number" placeholder="Rp 0" value={endCash} onChange={e => setEndCash(e.target.value)} className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-3 text-white font-bold focus:border-neon outline-none" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Catatan (Opsional)</label>
                                <textarea rows="2" value={endNote} onChange={e => setEndNote(e.target.value)} className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2 text-white text-sm focus:border-neon outline-none" placeholder="Selisih karena..."></textarea>
                            </div>
                        </div>

                        <button onClick={handleCloseShift} disabled={processing} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-600/20 transition">
                            {processing ? 'Menghitung...' : 'Tutup Shift'}
                        </button>
                    </div>
                </div>
            )}

            {/* --- MODAL 3: RINGKASAN CLOSING (GANTI ALERT BROWSER) --- */}
            {showSummaryModal && closingData && (
                <div className="fixed inset-0 z-[80] bg-navy-950/95 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-navy-800 w-full max-w-md rounded-3xl border border-navy-600 shadow-2xl p-0 overflow-hidden animate-fade-in-up">
                        <div className="bg-gradient-to-br from-green-500/20 to-navy-900 p-8 text-center border-b border-navy-700">
                            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                                <i className="fa-solid fa-check text-4xl text-navy-900"></i>
                            </div>
                            <h3 className="font-black text-2xl text-white tracking-wide uppercase">Shift Ditutup</h3>
                            <p className="text-green-400 text-sm font-bold mt-1">Laporan berhasil disimpan</p>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-navy-700">
                                <span className="text-slate-400 text-sm">Modal Awal</span>
                                <span className="text-white font-bold font-mono">Rp {parseInt(closingData.modal_awal).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-navy-700">
                                <span className="text-slate-400 text-sm">Penjualan Tunai</span>
                                <span className="text-neon font-bold font-mono">+ Rp {parseInt(closingData.penjualan_tunai).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-navy-700 bg-navy-900/50 px-3 rounded-lg">
                                <span className="text-slate-300 text-sm font-bold">Total Seharusnya</span>
                                <span className="text-white font-bold font-mono">Rp {parseInt(closingData.seharusnya_ada).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-slate-400 text-sm">Uang Fisik (Aktual)</span>
                                <span className="text-white font-bold font-mono">Rp {parseInt(closingData.fisik_uang).toLocaleString()}</span>
                            </div>
                            
                            {/* SELISIH */}
                            <div className={`flex justify-between items-center p-3 rounded-xl border ${parseInt(closingData.selisih) === 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                <span className={`text-sm font-bold ${parseInt(closingData.selisih) === 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {parseInt(closingData.selisih) === 0 ? 'Balance (Sesuai)' : 'Selisih'}
                                </span>
                                <span className={`font-bold font-mono ${parseInt(closingData.selisih) === 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    Rp {parseInt(closingData.selisih).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="p-4 bg-navy-950 border-t border-navy-800">
                            <button 
                                onClick={() => window.location.reload()} 
                                className="w-full bg-navy-700 hover:bg-white hover:text-navy-900 text-white font-bold py-3 rounded-xl transition"
                            >
                                <i className="fa-solid fa-arrow-rotate-right mr-2"></i> Mulai Shift Baru
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 4: KONFIRMASI CHECKOUT (CUSTOM UI) --- */}
            {showCheckoutModal && (
                <div className="fixed inset-0 z-[70] bg-navy-950/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-navy-800 w-full max-w-sm rounded-2xl border border-navy-600 shadow-2xl p-6 text-center animate-bounce-small">
                        
                        <h3 className="font-bold text-xl text-white mb-1">Konfirmasi Pembayaran</h3>
                        <p className="text-slate-400 text-sm mb-4 uppercase tracking-wider">{paymentMethod.replace('_', ' ')}</p>

                        <div className="bg-navy-900 p-4 rounded-xl border border-navy-700 mb-4">
                            <p className="text-xs text-slate-400 mb-1">Total Tagihan</p>
                            <p className="text-2xl font-bold text-white">Rp {cartTotal.toLocaleString()}</p>
                        </div>

                        {/* INPUT UANG CASH (HANYA JIKA METODE CASH) */}
                        {paymentMethod === 'cash' && (
                            <div className="mb-6 animate-fade-in">
                                <label className="text-xs text-slate-400 font-bold uppercase mb-2 block text-left">Uang Diterima</label>
                                <input 
                                    type="number" 
                                    placeholder="Rp 0" 
                                    value={customerCash} 
                                    onChange={e => setCustomerCash(e.target.value)} 
                                    className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-3 text-white text-lg font-bold mb-3 focus:border-neon outline-none" 
                                    autoFocus
                                />
                                
                                <div className="flex justify-between items-center px-2">
                                    <span className="text-sm text-slate-400">Kembalian:</span>
                                    <span className={`font-bold text-lg ${calculateChange() < 0 ? 'text-red-500' : 'text-neon'}`}>
                                        Rp {calculateChange().toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex gap-3 mt-4">
                            <button 
                                onClick={() => setShowCheckoutModal(false)}
                                className="flex-1 bg-navy-900 hover:bg-navy-700 text-slate-300 font-bold py-3 rounded-xl border border-navy-600 transition"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={executeCheckout}
                                disabled={processing || (paymentMethod === 'cash' && calculateChange() < 0)}
                                className={`flex-1 font-bold py-3 rounded-xl shadow-lg transition ${
                                    paymentMethod === 'cash' && calculateChange() < 0
                                    ? 'bg-navy-700 text-slate-500 cursor-not-allowed'
                                    : 'bg-neon hover:bg-neon-hover text-navy-900 shadow-neon/20'
                                }`}
                            >
                                {processing ? 'Proses...' : 'Bayar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 5: SUKSES TRANSAKSI (PRINT STRUK) --- */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[80] bg-navy-950/95 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-navy-800 w-full max-w-sm rounded-3xl border border-navy-600 shadow-2xl p-0 overflow-hidden animate-fade-in-up text-center">
                        <div className="p-8">
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                                <i className="fa-solid fa-receipt text-3xl text-navy-900"></i>
                            </div>
                            <h3 className="font-bold text-2xl text-white mb-2">Transaksi Berhasil!</h3>
                            <p className="text-slate-400 text-sm">Pembayaran telah diterima.</p>
                        </div>

                        <div className="p-6 bg-navy-900 border-t border-navy-700 flex flex-col gap-3">
                            <button 
                                onClick={handlePrint}
                                className="w-full bg-white hover:bg-gray-200 text-navy-900 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                            >
                                <i className="fa-solid fa-print"></i> Cetak Struk
                            </button>
                            <button 
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full bg-navy-800 hover:bg-navy-700 text-slate-300 font-bold py-3 rounded-xl border border-navy-600 transition"
                            >
                                Transaksi Baru
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* NOTIFIKASI TOAST */}
            {notif.show && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-navy-800 border border-navy-600 shadow-2xl px-6 py-3 rounded-full flex items-center gap-3 animate-slide-up">
                    <i className={`fa-solid ${notif.isError ? 'fa-triangle-exclamation text-red-500' : 'fa-circle-check text-green-500'}`}></i>
                    <span className="text-white font-bold text-sm">{notif.message}</span>
                </div>
            )}
        </div>
    );
}