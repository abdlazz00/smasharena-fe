'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';

// --- IMPORT FUNGSI PRINT DARI FILE TERPISAH ---
import { printBookingReceipt } from './print/struk'; 
// ----------------------------------------------

export default function AdminTransactions() {
    // --- STATE ---
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filter & Search
    const [filterStatus, setFilterStatus] = useState('all');
    const [search, setSearch] = useState('');

    // Pagination
    const [pagination, setPagination] = useState({
        currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0
    });

    // Modal Details
    const [showModal, setShowModal] = useState(false); 
    const [selectedBooking, setSelectedBooking] = useState(null);
    
    // Modal Complete
    const [showCompleteModal, setShowCompleteModal] = useState(false); 
    const [completeId, setCompleteId] = useState(null);
    
    // Modal Konfirmasi Pembayaran
    const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);

    const [processing, setProcessing] = useState(false);
    
    // Loading Print
    const [printingId, setPrintingId] = useState(null);

    // Form Bayar
    const [payMethod, setPayMethod] = useState('cash'); 
    const [proofFile, setProofFile] = useState(null);

    // Helper Image URL
    const getImageUrl = (path) => {
        if (!path) return null;
        return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/${path}`;
    };

    // --- FETCH DATA ---
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

    // Hitung Total Kantin untuk Modal Detail
    const calculatePosTotal = (orders) => {
        if (!orders) return 0;
        // Jika status booking 'booked' (belum bayar), ambil yg unpaid saja.
        // Jika 'paid'/'completed', ambil semua (history).
        const isPaid = selectedBooking?.status === 'paid' || selectedBooking?.status === 'completed';
        
        return orders
            .filter(o => isPaid ? true : o.payment_status === 'unpaid')
            .reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0);
    };

    // --- HANDLERS ---
    const openDetail = (booking) => {
        setSelectedBooking(booking);
        setPayMethod('cash');
        setProofFile(null);
        setShowModal(true);
    };

    const openCompleteModal = (id) => {
        setCompleteId(id);
        setShowCompleteModal(true);
    };

    // Handler Tombol "Lunasi Sekarang"
    const handlePaymentClick = (e) => {
        e.preventDefault();
        if (payMethod === 'transfer' && !proofFile) {
            alert("Harap upload bukti transfer!");
            return;
        }
        setShowPaymentConfirm(true); // Buka popup konfirmasi custom
    };

    // Eksekusi API Pembayaran
    const executePayment = async () => {
        setShowPaymentConfirm(false);
        setProcessing(true);

        const formData = new FormData();
        formData.append('payment_method', payMethod);
        if (proofFile) formData.append('proof_image', proofFile);

        try {
            await api.post(`/admin/bookings/${selectedBooking.id}/settle`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowModal(false); 
            fetchBookings(pagination.currentPage); 
        } catch (error) {
            alert(error.response?.data?.message || "Gagal memproses pembayaran.");
        } finally {
            setProcessing(false);
        }
    };

    // Eksekusi API Selesai Main
    const processComplete = async () => {
        try {
            await api.post(`/admin/bookings/${completeId}/complete`);
            setShowCompleteModal(false);
            fetchBookings(pagination.currentPage);
        } catch (error) {
            alert("Gagal mengubah status.");
        }
    };

    // Fitur Direct Print
    const handleDirectPrint = async (id) => {
        setPrintingId(id);
        try {
            const res = await api.get(`/admin/bookings/${id}`);
            const fullBookingData = res.data;
            printBookingReceipt(fullBookingData); 
        } catch (error) {
            console.error(error);
            alert("Gagal memuat data struk.");
        } finally {
            setPrintingId(null);
        }
    };

    // Helper Hitung Total untuk Popup Konfirmasi
    const grandTotalConfirm = selectedBooking 
        ? (parseInt(selectedBooking.total_price) + calculatePosTotal(selectedBooking.pos_orders))
        : 0;

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

            {/* TABEL LIST TRANSAKSI */}
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
                                // 1. Hitung Hutang (Hanya yg unpaid) - untuk status BOOKED
                                const unpaidPos = item.pos_orders?.filter(o => o.payment_status === 'unpaid').reduce((acc, c) => acc + parseFloat(c.total_amount), 0) || 0;
                                
                                // 2. Hitung Total Sejarah (Semua order) - untuk status PAID/COMPLETED
                                const totalPosHistory = item.pos_orders?.reduce((acc, c) => acc + parseFloat(c.total_amount), 0) || 0;
                                
                                const isCompleted = item.status === 'paid' || item.status === 'completed';

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
                                        
                                        {/* KOLOM TAGIHAN KANTIN (LOGIKA DIPERBAIKI) */}
                                        <td className="px-6 py-4 text-center">
                                            {isCompleted ? (
                                                // Jika Sudah Lunas -> Tampilkan Total History (Putih/Hijau)
                                                totalPosHistory > 0 ? (
                                                    <span className="text-slate-300 font-bold text-xs bg-navy-900 border border-navy-600 px-2 py-1 rounded">
                                                        Rp {totalPosHistory.toLocaleString()}
                                                    </span>
                                                ) : <span className="text-slate-600">-</span>
                                            ) : (
                                                // Jika Belum Lunas -> Tampilkan Hutang (Merah)
                                                unpaidPos > 0 ? (
                                                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded text-xs font-bold">
                                                        + Rp {unpaidPos.toLocaleString()}
                                                    </span>
                                                ) : <span className="text-slate-600">-</span>
                                            )}
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
                                            <button 
                                                onClick={() => handleDirectPrint(item.id)} 
                                                disabled={printingId === item.id}
                                                className="bg-slate-700 hover:bg-white hover:text-navy-900 text-white border border-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center min-w-[32px]"
                                                title="Cetak Struk"
                                            >
                                                {printingId === item.id ? (
                                                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                                                ) : (
                                                    <i className="fa-solid fa-print"></i>
                                                )}
                                            </button>

                                            <button onClick={() => openDetail(item)} className="bg-navy-900 hover:bg-white hover:text-navy-900 text-slate-300 border border-navy-600 px-3 py-1.5 rounded-lg text-xs font-bold transition">
                                                <i className="fa-solid fa-eye mr-1"></i> Detail
                                            </button>
                                            
                                            {item.status === 'paid' && unpaidPos === 0 && (
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

            {/* PAGINATION */}
            {bookings.length > 0 && (
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
                    <div>Menampilkan <span className="font-bold text-white">{pagination.from}</span> sampai <span className="font-bold text-white">{pagination.to}</span> dari <span className="font-bold text-white">{pagination.total}</span> data</div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => changePage(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="px-3 py-1.5 rounded-lg border border-navy-600 text-white hover:bg-navy-700 disabled:opacity-50">Prev</button>
                        <div className="px-2 font-bold text-white">Page {pagination.currentPage} of {pagination.lastPage}</div>
                        <button onClick={() => changePage(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.lastPage} className="px-3 py-1.5 rounded-lg border border-navy-600 text-white hover:bg-navy-700 disabled:opacity-50">Next</button>
                    </div>
                </div>
            )}

            {/* --- MODAL RINCIAN TAGIHAN & PEMBAYARAN --- */}
            {showModal && selectedBooking && (
                <div className="fixed inset-0 bg-navy-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-navy-800 w-full max-w-[450px] rounded-2xl border border-navy-700 shadow-2xl relative overflow-hidden">
                        
                        {/* HEADER */}
                        <div className="flex justify-between items-center p-6 border-b border-navy-700">
                            <h3 className="font-bold text-lg text-white">Rincian Tagihan</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition">
                                <i className="fa-solid fa-xmark text-xl"></i>
                            </button>
                        </div>
                        
                        <div className="p-6">
                            {/* SEWA LAPANGAN */}
                            <div className="flex justify-between items-center text-sm mb-4">
                                <span className="text-slate-400">Sewa Lapangan ({selectedBooking.court.name})</span>
                                <span className="text-white font-bold">Rp {parseInt(selectedBooking.total_price).toLocaleString()}</span>
                            </div>

                            {/* JAJANAN KANTIN (List item akan menyesuaikan status booked/paid) */}
                            {selectedBooking.pos_orders && calculatePosTotal(selectedBooking.pos_orders) > 0 ? (
                                <div className="bg-navy-950/50 p-4 rounded-xl border border-navy-700/50 mb-6">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-3">
                                        <i className="fa-solid fa-utensils"></i> Jajanan (Kantin)
                                    </div>
                                    <div className="space-y-2 mb-3 max-h-[120px] overflow-y-auto custom-scrollbar">
                                        {selectedBooking.pos_orders
                                            // Filter: Kalau booked -> cuma unpaid. Kalau paid -> semua.
                                            .filter(o => (selectedBooking.status === 'paid' || selectedBooking.status === 'completed') ? true : o.payment_status === 'unpaid')
                                            .map(order => (
                                                <div key={order.id}>
                                                    {order.order_items.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between text-xs text-slate-300 mb-1">
                                                            <span>{item.quantity}x {item.product.name}</span>
                                                            <span className="font-mono text-slate-400">{parseInt(item.price * item.quantity).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))
                                        }
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-navy-700/50">
                                        <span className="text-xs font-bold text-slate-400">Subtotal Kantin</span>
                                        <span className="text-red-400 font-bold text-sm">Rp {calculatePosTotal(selectedBooking.pos_orders).toLocaleString()}</span>
                                    </div>
                                </div>
                            ) : null}

                            {/* TOTAL */}
                            <div className="flex justify-between items-center mb-6 pt-2">
                                <span className="text-white font-bold text-lg">Total Harus Dibayar</span>
                                <span className="text-neon font-bold text-xl">
                                    Rp {(parseInt(selectedBooking.total_price) + calculatePosTotal(selectedBooking.pos_orders)).toLocaleString()}
                                </span>
                            </div>

                            {/* FORM PEMBAYARAN */}
                            {selectedBooking.status === 'booked' && (
                                <form onSubmit={handlePaymentClick}>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-3">Metode Pembayaran</p>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <label className={`cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition ${payMethod === 'cash' ? 'bg-neon/10 border-neon text-white' : 'bg-navy-900 border-navy-600 text-slate-400 hover:border-slate-500'}`}>
                                            <input type="radio" name="method" value="cash" className="hidden" checked={payMethod === 'cash'} onChange={() => setPayMethod('cash')} />
                                            <i className="fa-solid fa-money-bill-wave"></i>
                                            <span className="font-bold text-sm">Tunai (Cash)</span>
                                        </label>
                                        <label className={`cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition ${payMethod === 'transfer' ? 'bg-neon/10 border-neon text-white' : 'bg-navy-900 border-navy-600 text-slate-400 hover:border-slate-500'}`}>
                                            <input type="radio" name="method" value="transfer" className="hidden" checked={payMethod === 'transfer'} onChange={() => setPayMethod('transfer')} />
                                            <i className="fa-solid fa-building-columns"></i>
                                            <span className="font-bold text-sm">Transfer Bank</span>
                                        </label>
                                    </div>

                                    {payMethod === 'transfer' && (
                                        <div className="bg-navy-900 p-3 rounded-xl border border-navy-600 mb-6 animate-fade-in">
                                            <input type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files[0])} className="w-full text-xs text-slate-300" />
                                        </div>
                                    )}

                                    <button disabled={processing} className="w-full bg-neon hover:bg-neon-hover text-navy-900 font-bold py-3.5 rounded-xl shadow-lg shadow-neon/20 transition flex items-center justify-center gap-2">
                                        {processing ? (
                                            <><i className="fa-solid fa-circle-notch fa-spin"></i> Memproses...</>
                                        ) : 'Lunasi Sekarang'}
                                    </button>
                                </form>
                            )}

                            {/* VIEW STATUS LUNAS */}
                            {(selectedBooking.status === 'paid' || selectedBooking.status === 'completed') && (
                                <div className="text-center">
                                    <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-xl font-bold mb-4 flex items-center justify-center gap-2">
                                        <i className="fa-solid fa-check-circle"></i> SUDAH LUNAS
                                    </div>
                                    {selectedBooking.transaction?.payment_method === 'cash' && (
                                        <p className="text-slate-400 text-sm italic">Pembayaran diterima secara Tunai.</p>
                                    )}
                                    {selectedBooking.transaction?.payment_method === 'transfer' && (
                                         <button onClick={() => window.open(getImageUrl(selectedBooking.transaction.proof_image), '_blank')} className="text-neon hover:underline text-sm font-bold">
                                            <i className="fa-solid fa-image mr-1"></i> Lihat Bukti Transfer
                                         </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- POPUP KONFIRMASI PEMBAYARAN (CUSTOM) --- */}
            {showPaymentConfirm && (
                <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-navy-800 w-full max-w-sm rounded-2xl border border-navy-700 shadow-2xl p-6 text-center animate-bounce-small">
                        <div className="w-16 h-16 bg-neon/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-neon/30">
                            <i className="fa-solid fa-money-bill-wave text-2xl text-neon"></i>
                        </div>
                        <h3 className="font-bold text-xl text-white mb-2">Konfirmasi Pembayaran</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            Pastikan Anda telah menerima uang sebesar <br/>
                            <span className="text-neon font-bold text-lg">Rp {grandTotalConfirm.toLocaleString()}</span>
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowPaymentConfirm(false)} className="flex-1 bg-navy-900 border border-navy-600 hover:bg-navy-700 text-slate-300 py-3 rounded-xl font-bold transition">
                                Batal
                            </button>
                            <button onClick={executePayment} className="flex-1 bg-neon hover:bg-neon-hover text-navy-900 py-3 rounded-xl font-bold shadow-lg transition">
                                Ya, Lunas
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL COMPLETE --- */}
            {showCompleteModal && (
                <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-navy-800 w-full max-w-sm rounded-2xl border border-navy-700 shadow-2xl p-6 text-center">
                        <h3 className="font-bold text-xl text-white mb-2">Selesai Bermain?</h3>
                        <p className="text-slate-400 text-sm mb-6">Ubah status menjadi <span className="text-blue-400 font-bold">Completed</span>?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowCompleteModal(false)} className="flex-1 bg-navy-900 border border-navy-600 text-slate-300 py-3 rounded-xl font-bold">Batal</button>
                            <button onClick={processComplete} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold">Ya, Selesai</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}