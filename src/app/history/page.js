'use client';

import Navbar from '@/components/Navbar';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // --- STATE MODAL & NOTIFIKASI ---
    const [ticketModal, setTicketModal] = useState({ show: false, data: null });
    const [notif, setNotif] = useState({ show: false, message: '', isError: false });
    
    // State Khusus untuk Modal Konfirmasi Batal
    const [cancelModal, setCancelModal] = useState({ show: false, id: null });

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await api.get('/my-bookings');
            
            // --- FIX: SORTING DATA TERBARU PALING ATAS (DESCENDING BY ID) ---
            const sortedData = res.data.sort((a, b) => b.id - a.id);
            
            setBookings(sortedData);
        } catch (error) {
            console.error("Gagal ambil history:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    // Helper: Tampilkan Notifikasi Toast
    const showNotification = (message, isError = false) => {
        setNotif({ show: true, message, isError });
        setTimeout(() => setNotif({ show: false, message: '', isError: false }), 3000);
    };

    // 1. Trigger saat tombol "Batalkan" diklik (Buka Modal)
    const handleCancelClick = (id) => {
        setCancelModal({ show: true, id: id });
    };

    // 2. Eksekusi Pembatalan (Setelah klik "Ya, Batalkan" di Modal)
    const executeCancel = async () => {
        try {
            await api.post(`/bookings/${cancelModal.id}/cancel`);
            
            // Tutup modal dulu
            setCancelModal({ show: false, id: null });
            
            // Tampilkan notifikasi sukses
            showNotification("Booking berhasil dibatalkan.");
            
            // Refresh data
            fetchHistory();
        } catch (error) {
            setCancelModal({ show: false, id: null });
            showNotification(error.response?.data?.message || "Gagal membatalkan booking.", true);
        }
    };

    const openTicket = (booking) => {
        setTicketModal({ show: true, data: booking });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid': return <span className="bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1 rounded-full text-xs font-bold">Lunas</span>;
            case 'booked': return <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1 rounded-full text-xs font-bold animate-pulse">Menunggu Pembayaran</span>;
            case 'completed': return <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-bold">Selesai</span>;
            case 'cancelled': return <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-xs font-bold">Dibatalkan</span>;
            default: return <span className="text-slate-400">{status}</span>;
        }
    };

    return (
        <main className="min-h-screen bg-navy-950 pb-20">
            <Navbar />

            <div className="max-w-3xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <i className="fa-solid fa-clock-rotate-left text-neon"></i> Riwayat Booking
                </h1>

                <div className="space-y-4">
                    {loading ? (
                        <p className="text-slate-400 text-center py-10">Memuat riwayat...</p>
                    ) : bookings.length === 0 ? (
                        <div className="text-center py-10 border border-dashed border-navy-700 rounded-2xl">
                            <p className="text-slate-400 mb-4">Belum ada riwayat booking.</p>
                            <button onClick={() => router.push('/booking')} className="bg-neon text-navy-900 px-6 py-2 rounded-xl font-bold hover:bg-neon-hover transition">
                                Booking Sekarang
                            </button>
                        </div>
                    ) : bookings.map((item) => (
                        <div key={item.id} className="bg-navy-800 border border-navy-700 rounded-2xl p-5 shadow-lg hover:border-navy-600 transition group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-xs text-slate-400 font-bold uppercase mb-1">Kode Booking</div>
                                    <div className="text-lg font-mono font-bold text-white tracking-wide">{item.booking_code}</div>
                                </div>
                                <div>{getStatusBadge(item.status)}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                <div>
                                    <div className="text-slate-400 text-xs mb-1">Jadwal Main</div>
                                    <div className="text-white font-bold flex items-center gap-2"><i className="fa-regular fa-calendar"></i> {item.booking_date}</div>
                                    <div className="text-white font-bold flex items-center gap-2 mt-1"><i className="fa-regular fa-clock"></i> {item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}</div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs mb-1">Lapangan</div>
                                    <div className="text-white font-bold">{item.court?.name}</div>
                                    <div className="text-neon font-bold mt-1">Rp {parseInt(item.total_price).toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="border-t border-navy-700 pt-4 flex gap-3">
                                {item.status !== 'cancelled' && (
                                    <button onClick={() => openTicket(item)} className="flex-1 bg-navy-700 hover:bg-white hover:text-navy-900 text-white py-2 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 border border-navy-600">
                                        <i className="fa-solid fa-ticket"></i> E-Ticket
                                    </button>
                                )}
                                {item.status === 'booked' && (
                                    <button onClick={() => handleCancelClick(item.id)} className="flex-1 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white py-2 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
                                        <i className="fa-solid fa-ban"></i> Batalkan
                                    </button>
                                )}
                                {item.status === 'cancelled' && <div className="w-full text-center text-xs text-red-500 italic py-2">Booking ini telah dibatalkan.</div>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODAL E-TICKET */}
            {ticketModal.show && ticketModal.data && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-navy-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative border border-navy-700">
                        <div className="absolute -top-10 -left-10 w-32 h-32 bg-neon/20 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
                        <div className="bg-gradient-to-br from-navy-800 to-navy-900 p-6 text-center border-b border-navy-700 relative z-10">
                            <h3 className="text-neon font-black text-2xl tracking-widest uppercase italic">E-TICKET</h3>
                            <p className="text-slate-400 text-xs mt-1">SMASH ARENA BADMINTON</p>
                        </div>
                        <div className="p-6 space-y-6 relative z-10">
                            <div className="flex justify-center">
                                <div className="bg-white p-2 rounded-xl">
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticketModal.data.booking_code}`} alt="QR Code" className="w-32 h-32" />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Kode Booking</p>
                                <p className="text-2xl font-mono font-bold text-white tracking-widest bg-navy-800 py-2 rounded-lg border border-navy-700 select-all">{ticketModal.data.booking_code}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div><p className="text-xs text-slate-400 mb-1">Tanggal</p><p className="text-white font-bold text-sm">{ticketModal.data.booking_date}</p></div>
                                <div><p className="text-xs text-slate-400 mb-1">Jam Main</p><p className="text-white font-bold text-sm">{ticketModal.data.start_time.substring(0,5)} - {ticketModal.data.end_time.substring(0,5)}</p></div>
                                <div><p className="text-xs text-slate-400 mb-1">Lapangan</p><p className="text-neon font-bold text-sm uppercase">{ticketModal.data.court?.name}</p></div>
                                <div><p className="text-xs text-slate-400 mb-1">Status</p><div className="flex justify-center">{getStatusBadge(ticketModal.data.status)}</div></div>
                            </div>
                        </div>
                        <div className="p-4 bg-navy-950 border-t border-navy-800">
                            <button onClick={() => setTicketModal({ show: false, data: null })} className="w-full bg-navy-800 hover:bg-navy-700 text-white font-bold py-3 rounded-xl transition border border-navy-700">Tutup Tiket</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI PEMBATALAN (DESIGN CUSTOM) */}
            {cancelModal.show && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-navy-950/90 backdrop-blur-sm p-4">
                    <div className="bg-navy-800 w-full max-w-sm rounded-2xl border border-navy-600 shadow-2xl p-6 text-center animate-bounce-small">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                            <i className="fa-solid fa-triangle-exclamation text-3xl text-red-500"></i>
                        </div>
                        <h3 className="font-bold text-xl text-white mb-2">Batalkan Booking?</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            Apakah Anda yakin? Slot lapangan akan dibuka kembali untuk customer lain.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setCancelModal({ show: false, id: null })}
                                className="flex-1 bg-navy-900 hover:bg-navy-700 text-slate-300 font-bold py-3 rounded-xl border border-navy-600 transition"
                            >
                                Tidak
                            </button>
                            <button 
                                onClick={executeCancel}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-600/20 transition"
                            >
                                Ya, Batalkan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* NOTIFIKASI TOAST (BERHASIL/GAGAL) */}
            {notif.show && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center pointer-events-none">
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