'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';

// Helper untuk format URL gambar dari storage Laravel
const getImageUrl = (path) => {
    if (!path) return null;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/${path}`;
};

export default function AdminTransactions() {
    // DATA STATE
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // FILTER & SEARCH STATE
    const [filterStatus, setFilterStatus] = useState('all');
    const [search, setSearch] = useState('');

    // PAGINATION STATE
    const [pagination, setPagination] = useState({
        currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0
    });

    // MODAL STATE
    const [showModal, setShowModal] = useState(false); 
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showCompleteModal, setShowCompleteModal] = useState(false); 
    const [completeId, setCompleteId] = useState(null);
    const [processing, setProcessing] = useState(false);

    // FORM BAYAR STATE
    const [payMethod, setPayMethod] = useState('cash'); // cash | transfer
    const [proofFile, setProofFile] = useState(null);

    // 1. Ambil Data Booking
    const fetchBookings = async (page = 1) => {
        setLoading(true);
        try {
            const res = await api.get('/admin/bookings', {
                params: {
                    status: filterStatus,
                    search: search,
                    page: page
                }
            });
            setBookings(res.data.data);
            setPagination({
                currentPage: res.data.current_page,
                lastPage: res.data.last_page,
                total: res.data.total,
                from: res.data.from,
                to: res.data.to
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings(1);
    }, [filterStatus]);

    const handleSearch = (e) => {
        if (e.key === 'Enter') fetchBookings(1);
    };

    const changePage = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.lastPage) {
            fetchBookings(newPage);
        }
    };

    // Helper Hitung Tagihan Kantin
    const calculatePosTotal = (orders) => {
        if (!orders) return 0;
        // Jika status booking sudah paid/completed, hitung semua order POS yg paid juga (history)
        // Jika status booked, hitung yg unpaid (tagihan)
        const isPaid = selectedBooking?.status === 'paid' || selectedBooking?.status === 'completed';
        
        return orders
            .filter(o => isPaid ? true : o.payment_status === 'unpaid')
            .reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0);
    };

    // --- HANDLERS ---
    
    const openDetail = (booking) => {
        setSelectedBooking(booking);
        // Reset Form setiap buka modal
        setPayMethod('cash');
        setProofFile(null);
        setShowModal(true);
    };

    const openCompleteModal = (id) => {
        setCompleteId(id);
        setShowCompleteModal(true);
    };

    // PROSES PELUNASAN
    const handleSettlePayment = async (e) => {
        e.preventDefault();
        
        if (payMethod === 'transfer' && !proofFile) {
            alert("Harap upload bukti transfer!");
            return;
        }

        if (!confirm("Konfirmasi pelunasan total?")) return;
        
        setProcessing(true);
        
        const formData = new FormData();
        formData.append('payment_method', payMethod);
        if (proofFile) {
            formData.append('proof_image', proofFile);
        }

        try {
            await api.post(`/admin/bookings/${selectedBooking.id}/settle`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            alert("Pembayaran Berhasil!");
            setShowModal(false);
            fetchBookings(pagination.currentPage); 
        } catch (error) {
            alert(error.response?.data?.message || "Gagal memproses pembayaran.");
        } finally {
            setProcessing(false);
        }
    };

    const processComplete = async () => {
        try {
            await api.post(`/admin/bookings/${completeId}/complete`);
            setShowCompleteModal(false);
            fetchBookings(pagination.currentPage);
        } catch (error) {
            alert("Gagal mengubah status.");
        }
    };

    const formatDateTime = (isoString) => {
        const date = new Date(isoString);
        return {
            date: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
            time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        };
    };

    return (
        <div>
            {/* HEADER & FILTER */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Transaksi & Kasir</h2>
                    <p className="text-slate-400 text-sm">Kelola pembayaran dan status booking.</p>
                </div>
                <div className="relative w-full md:w-72">
                    <input 
                        type="text" placeholder="Cari Kode / Nama..." 
                        value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={handleSearch}
                        className="w-full bg-navy-800 border border-navy-700 text-white py-2 pl-10 pr-4 rounded-xl focus:border-neon outline-none shadow-sm"
                    />
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-500"></i>
                </div>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
                {['all', 'booked', 'paid', 'completed', 'cancelled'].map((status) => (
                    <button key={status} onClick={() => setFilterStatus(status)} className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition border ${filterStatus === status ? 'bg-neon text-navy-900 border-neon shadow-lg shadow-neon/20' : 'bg-navy-800 text-slate-400 border-navy-700 hover:text-white hover:border-slate-500'}`}>
                        {status === 'all' ? 'Semua Data' : status === 'booked' ? 'Perlu Diproses' : status}
                    </button>
                ))}
            </div>

            {/* TABEL DATA */}
            <div className="bg-navy-800 rounded-2xl border border-navy-700 overflow-hidden shadow-xl mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-navy-900 text-xs uppercase font-bold text-slate-300">
                            <tr>
                                <th className="px-6 py-4">Jadwal Main</th>
                                <th className="px-6 py-4">Pemesan</th>
                                <th className="px-6 py-4">Lapangan</th>
                                <th className="px-6 py-4 text-center">Tagihan Kantin</th>
                                <th className="px-6 py-4">Total Booking</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-700">
                            {loading ? (
                                <tr><td colSpan="7" className="text-center py-8">Memuat data...</td></tr>
                            ) : bookings.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-8">Tidak ada data booking.</td></tr>
                            ) : bookings.map((item) => {
                                // Hitung hutang kantin (hanya yg unpaid)
                                const posDebt = item.pos_orders?.filter(o => o.payment_status === 'unpaid').reduce((acc, c) => acc + parseFloat(c.total_amount), 0) || 0;
                                
                                return (
                                    <tr key={item.id} className="hover:bg-navy-700/50 transition">
                                        <td className="px-6 py-4">
                                            <div className="text-white font-bold">{item.booking_date}</div>
                                            <div className="text-xs font-mono text-slate-500">{item.start_time.substring(0,5)} - {item.end_time.substring(0,5)}</div>
                                            <div className="text-[10px] text-neon mt-1">{item.booking_code}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white">{item.customer_name}</div>
                                            <div className="text-xs text-slate-500">{item.customer_phone}</div>
                                        </td>
                                        <td className="px-6 py-4 text-white">{item.court?.name}</td>
                                        <td className="px-6 py-4 text-center">
                                            {posDebt > 0 ? (
                                                <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded text-xs font-bold">
                                                    + Rp {posDebt.toLocaleString()}
                                                </span>
                                            ) : <span className="text-slate-600">-</span>}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white">
                                            Rp {parseInt(item.total_price).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${item.status === 'paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' : item.status === 'booked' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : item.status === 'completed' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button onClick={() => openDetail(item)} className="bg-navy-900 hover:bg-white hover:text-navy-900 text-slate-300 border border-navy-600 px-3 py-1.5 rounded-lg text-xs font-bold transition">
                                                <i className="fa-solid fa-eye mr-1"></i> Detail
                                            </button>
                                            {item.status === 'paid' && posDebt === 0 && (
                                                <button onClick={() => openCompleteModal(item.id)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow transition">
                                                    <i className="fa-solid fa-check-double"></i>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- PAGINATION --- */}
            {bookings.length > 0 && (
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
                    <div>
                        Menampilkan <span className="font-bold text-white">{pagination.from}</span> sampai <span className="font-bold text-white">{pagination.to}</span> dari <span className="font-bold text-white">{pagination.total}</span> data
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => changePage(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1 ${pagination.currentPage === 1 ? 'border-navy-700 text-slate-600 cursor-not-allowed' : 'border-navy-600 text-white hover:bg-navy-700 hover:border-slate-500'}`}>
                            <i className="fa-solid fa-chevron-left text-xs"></i> Prev
                        </button>
                        <div className="px-2 font-bold text-white">Page {pagination.currentPage} of {pagination.lastPage}</div>
                        <button onClick={() => changePage(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.lastPage} className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1 ${pagination.currentPage === pagination.lastPage ? 'border-navy-700 text-slate-600 cursor-not-allowed' : 'border-navy-600 text-white hover:bg-navy-700 hover:border-slate-500'}`}>
                            Next <i className="fa-solid fa-chevron-right text-xs"></i>
                        </button>
                    </div>
                </div>
            )}

            {/* --- MODAL RINCIAN & PEMBAYARAN --- */}
            {showModal && selectedBooking && (
                <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-navy-800 w-full max-w-md rounded-2xl border border-navy-700 shadow-2xl p-6 relative animate-bounce-small">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                            <i className="fa-solid fa-xmark text-xl"></i>
                        </button>
                        
                        <h3 className="font-bold text-xl text-white mb-4 border-b border-navy-700 pb-2">Rincian Tagihan</h3>
                        
                        <div className="space-y-4 text-sm mb-6">
                            <div className="flex justify-between items-center pb-2 border-b border-navy-700">
                                <span className="text-slate-400">Sewa Lapangan ({selectedBooking.court.name})</span>
                                <span className="text-white font-bold">Rp {parseInt(selectedBooking.total_price).toLocaleString()}</span>
                            </div>

                            {selectedBooking.pos_orders && calculatePosTotal(selectedBooking.pos_orders) > 0 ? (
                                <div className="bg-navy-900 p-3 rounded-xl border border-navy-700">
                                    <p className="text-xs text-slate-500 font-bold uppercase mb-2 flex items-center gap-2">
                                        <i className="fa-solid fa-utensils"></i> Jajanan (Kantin)
                                    </p>
                                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                        {selectedBooking.pos_orders
                                            // Tampilkan semua jika sudah lunas/selesai, atau hanya unpaid jika masih booked
                                            .filter(o => (selectedBooking.status === 'paid' || selectedBooking.status === 'completed') ? true : o.payment_status === 'unpaid')
                                            .map(order => (
                                            <div key={order.id} className="border-b border-navy-800 pb-1 mb-1 last:border-0">
                                                {order.order_items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-xs text-slate-300">
                                                        <span>{item.quantity}x {item.product.name}</span>
                                                        <span>{parseInt(item.price * item.quantity).toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-navy-800">
                                        <span className="text-xs font-bold text-slate-400">Subtotal Kantin</span>
                                        <span className="text-red-400 font-bold text-sm">Rp {calculatePosTotal(selectedBooking.pos_orders).toLocaleString()}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-slate-600 italic text-center py-2 border border-dashed border-navy-700 rounded-lg">Tidak ada tagihan kantin.</div>
                            )}

                            <div className="flex justify-between items-center pt-4 border-t border-navy-700">
                                <span className="text-white font-bold text-lg">Total Harus Dibayar</span>
                                <span className="text-neon font-bold text-xl">
                                    Rp {(
                                        parseInt(selectedBooking.total_price) + 
                                        calculatePosTotal(selectedBooking.pos_orders)
                                    ).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* --- LOGIKA TAMPILAN BERDASARKAN STATUS --- */}

                        {/* 1. JIKA STATUS BOOKED (BELUM LUNAS) */}
                        {selectedBooking.status === 'booked' && (
                            <form onSubmit={handleSettlePayment} className="space-y-4 pt-4 border-t border-navy-700">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Metode Pembayaran</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={`cursor-pointer border rounded-xl p-3 text-center transition ${payMethod === 'cash' ? 'bg-neon/10 border-neon text-white' : 'bg-navy-900 border-navy-600 text-slate-400 hover:border-slate-500'}`}>
                                        <input type="radio" name="method" value="cash" className="hidden" checked={payMethod === 'cash'} onChange={() => setPayMethod('cash')} />
                                        <i className="fa-solid fa-money-bill-wave block text-xl mb-1"></i>
                                        <span className="text-xs font-bold">Tunai (Cash)</span>
                                    </label>
                                    <label className={`cursor-pointer border rounded-xl p-3 text-center transition ${payMethod === 'transfer' ? 'bg-neon/10 border-neon text-white' : 'bg-navy-900 border-navy-600 text-slate-400 hover:border-slate-500'}`}>
                                        <input type="radio" name="method" value="transfer" className="hidden" checked={payMethod === 'transfer'} onChange={() => setPayMethod('transfer')} />
                                        <i className="fa-solid fa-building-columns block text-xl mb-1"></i>
                                        <span className="text-xs font-bold">Transfer Bank</span>
                                    </label>
                                </div>

                                {payMethod === 'transfer' && (
                                    <div className="animate-fade-in bg-navy-900 p-3 rounded-xl border border-navy-600">
                                        <label className="text-xs font-bold text-slate-400 block mb-2">Upload Bukti Transfer</label>
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={(e) => setProofFile(e.target.files[0])}
                                            className="w-full text-xs text-slate-300 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-navy-700 file:text-white hover:file:bg-navy-600"
                                        />
                                    </div>
                                )}

                                <button disabled={processing} className="w-full bg-neon hover:bg-neon-hover text-navy-900 font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2">
                                    {processing ? 'Memproses...' : 'Lunasi Sekarang'}
                                </button>
                            </form>
                        )}

                        {/* 2. JIKA STATUS CANCELLED (BATAL) */}
                        {selectedBooking.status === 'cancelled' && (
                            <div className="pt-4 border-t border-navy-700 text-center">
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl font-bold mb-2 flex items-center justify-center gap-2">
                                    <i className="fa-solid fa-ban"></i> BOOKING DIBATALKAN
                                </div>
                                <p className="text-xs text-slate-500">Transaksi ini tidak valid karena telah dibatalkan.</p>
                            </div>
                        )}

                        {/* 3. JIKA STATUS PAID / COMPLETED (SUDAH LUNAS) */}
                        {(selectedBooking.status === 'paid' || selectedBooking.status === 'completed') && (
                            <div className="pt-4 border-t border-navy-700">
                                <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-xl text-center font-bold mb-4 flex items-center justify-center gap-2">
                                    <i className="fa-solid fa-check-circle"></i> SUDAH LUNAS
                                </div>
                                
                                {selectedBooking.transaction?.payment_method === 'transfer' && selectedBooking.transaction?.proof_image && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-slate-400 uppercase">Bukti Transfer:</p>
                                        <div className="rounded-xl overflow-hidden border border-navy-600 bg-navy-900">
                                            <img 
                                                src={getImageUrl(selectedBooking.transaction.proof_image)} 
                                                alt="Bukti Transfer" 
                                                className="w-full h-auto object-cover hover:scale-105 transition duration-500 cursor-pointer"
                                                onClick={() => window.open(getImageUrl(selectedBooking.transaction.proof_image), '_blank')}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-500 text-center italic">Klik gambar untuk memperbesar</p>
                                    </div>
                                )}
                                
                                {selectedBooking.transaction?.payment_method === 'cash' && (
                                    <p className="text-center text-slate-400 text-sm italic">Dibayar Tunai (Cash) di Kasir.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI SELESAI (Tetap Sama) */}
            {showCompleteModal && (
                <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-navy-800 w-full max-w-sm rounded-2xl border border-navy-700 shadow-2xl p-6 text-center animate-bounce-small">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30"><i className="fa-solid fa-check-double text-2xl text-blue-500"></i></div>
                        <h3 className="font-bold text-xl text-white mb-2">Selesai Bermain?</h3>
                        <p className="text-slate-400 text-sm mb-6">Ubah status menjadi <span className="text-blue-400 font-bold">Completed</span>?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowCompleteModal(false)} className="flex-1 bg-navy-900 hover:bg-navy-700 text-slate-300 font-bold py-3 rounded-xl border border-navy-600 transition">Batal</button>
                            <button onClick={processComplete} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg transition">Ya, Selesai</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}