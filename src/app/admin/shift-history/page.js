'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';

export default function ShiftHistory() {
    // --- STATE ---
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination
    const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });

    // Modal Detail
    const [selectedShift, setSelectedShift] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // --- FETCH DATA ---
    const fetchShifts = async (page = 1) => {
        setLoading(true);
        try {
            const res = await api.get('/admin/cash-session/history', {
                params: { page }
            });
            setShifts(res.data.data);
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
        fetchShifts();
    }, []);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.lastPage) {
            fetchShifts(newPage);
        }
    };

    const openDetail = (shift) => {
        setSelectedShift(shift);
        setShowModal(true);
    };

    // Helper Format Tanggal & Waktu
    const formatDate = (isoString) => {
        if (!isoString) return '-';
        const d = new Date(isoString);
        return {
            date: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
            time: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        };
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* HEADER */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <i className="fa-solid fa-clock-rotate-left text-neon"></i> Laporan Shift Kasir
                </h1>
                <p className="text-slate-400 text-sm">Rekapitulasi buka-tutup kasir dan selisih uang.</p>
            </div>

            {/* TABEL SHIFT */}
            <div className="bg-navy-800 rounded-2xl border border-navy-700 overflow-hidden shadow-xl mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-navy-900 text-xs uppercase font-bold text-slate-300">
                            <tr>
                                <th className="px-6 py-4">Waktu Buka</th>
                                <th className="px-6 py-4">Waktu Tutup</th>
                                <th className="px-6 py-4">Kasir</th>
                                <th className="px-6 py-4 text-right">Penjualan Tunai</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Selisih</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-700">
                            {loading ? (
                                <tr><td colSpan="7" className="text-center py-10">Memuat data...</td></tr>
                            ) : shifts.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-10">Belum ada riwayat shift.</td></tr>
                            ) : shifts.map((shift) => {
                                const open = formatDate(shift.opened_at);
                                const close = shift.closed_at ? formatDate(shift.closed_at) : null;
                                const diff = parseFloat(shift.cash_difference);

                                return (
                                    <tr key={shift.id} className="hover:bg-navy-700/50 transition">
                                        <td className="px-6 py-4">
                                            <div className="text-white font-bold">{open.date}</div>
                                            <div className="text-xs text-slate-500 font-mono">{open.time}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {close ? (
                                                <>
                                                    <div className="text-white font-bold">{close.date}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{close.time}</div>
                                                </>
                                            ) : (
                                                <span className="text-neon text-xs italic animate-pulse">Sedang Aktif...</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-white">
                                            {shift.user?.name || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-white">
                                            Rp {parseInt(shift.total_cash_sales).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${shift.status === 'open' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                                                {shift.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {shift.status === 'closed' ? (
                                                <span className={`font-bold ${diff === 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {diff === 0 ? 'Pas' : (diff > 0 ? '+' : '') + parseInt(diff).toLocaleString()}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => openDetail(shift)}
                                                className="bg-navy-900 hover:bg-white hover:text-navy-900 text-slate-300 border border-navy-600 px-3 py-1 rounded text-xs transition font-bold"
                                            >
                                                Detail
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PAGINATION */}
            {shifts.length > 0 && (
                <div className="flex justify-between items-center text-xs text-slate-400">
                    <div>
                        Menampilkan {pagination.from}-{pagination.to} dari {pagination.total} shift
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            className="px-3 py-1 bg-navy-800 rounded border border-navy-700 hover:bg-navy-700 disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <button 
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.lastPage}
                            className="px-3 py-1 bg-navy-800 rounded border border-navy-700 hover:bg-navy-700 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL DETAIL SHIFT */}
            {showModal && selectedShift && (
                <div className="fixed inset-0 z-[100] bg-navy-950/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-navy-800 w-full max-w-md rounded-2xl border border-navy-600 shadow-2xl overflow-hidden animate-fade-in-up">
                        <div className="bg-navy-900 p-4 border-b border-navy-700 flex justify-between items-center">
                            <div>
                                <h3 className="text-white font-bold">Detail Shift Kasir</h3>
                                <p className="text-xs text-slate-400">ID: #{selectedShift.id} • {selectedShift.user?.name}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><i className="fa-solid fa-xmark text-lg"></i></button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            {/* Waktu */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-navy-900 p-3 rounded-xl border border-navy-700">
                                    <p className="text-xs text-slate-500 uppercase font-bold">Dibuka</p>
                                    <p className="text-white text-sm font-bold">{formatDate(selectedShift.opened_at).time}</p>
                                    <p className="text-[10px] text-slate-400">{formatDate(selectedShift.opened_at).date}</p>
                                </div>
                                <div className="bg-navy-900 p-3 rounded-xl border border-navy-700">
                                    <p className="text-xs text-slate-500 uppercase font-bold">Ditutup</p>
                                    <p className="text-white text-sm font-bold">{selectedShift.closed_at ? formatDate(selectedShift.closed_at).time : '-'}</p>
                                    <p className="text-[10px] text-slate-400">{selectedShift.closed_at ? formatDate(selectedShift.closed_at).date : 'Sedang Aktif'}</p>
                                </div>
                            </div>

                            {/* Perhitungan Uang */}
                            <div className="space-y-2 border-t border-navy-700 pt-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Modal Awal</span>
                                    <span className="text-white font-mono">Rp {parseInt(selectedShift.starting_cash).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Penjualan Tunai (Cash)</span>
                                    <span className="text-neon font-mono">+ Rp {parseInt(selectedShift.total_cash_sales).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm border-b border-navy-700 pb-2">
                                    <span className="text-slate-400 italic">Penjualan Non-Tunai</span>
                                    <span className="text-slate-500 font-mono italic">(Rp {parseInt(selectedShift.total_non_cash_sales).toLocaleString()})</span>
                                </div>
                                
                                <div className="flex justify-between text-sm pt-1">
                                    <span className="text-white font-bold">Total Seharusnya</span>
                                    <span className="text-white font-bold font-mono">
                                        Rp {(parseInt(selectedShift.starting_cash) + parseInt(selectedShift.total_cash_sales)).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Uang Fisik (Aktual)</span>
                                    <span className="text-white font-bold font-mono">
                                        Rp {selectedShift.ending_cash_actual ? parseInt(selectedShift.ending_cash_actual).toLocaleString() : '-'}
                                    </span>
                                </div>
                            </div>

                            {/* Selisih & Catatan */}
                            {selectedShift.status === 'closed' && (
                                <div className={`p-4 rounded-xl border mt-4 ${parseInt(selectedShift.cash_difference) === 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-xs font-bold uppercase ${parseInt(selectedShift.cash_difference) === 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {parseInt(selectedShift.cash_difference) === 0 ? 'Balance (Sesuai)' : 'Selisih'}
                                        </span>
                                        <span className={`text-lg font-bold font-mono ${parseInt(selectedShift.cash_difference) === 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            Rp {parseInt(selectedShift.cash_difference).toLocaleString()}
                                        </span>
                                    </div>
                                    {selectedShift.note && (
                                        <p className="text-xs text-slate-300 italic border-t border-white/10 pt-2 mt-2">
                                            "{selectedShift.note}"
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="bg-navy-900 p-4 border-t border-navy-700">
                            <button onClick={() => setShowModal(false)} className="w-full bg-navy-800 hover:bg-navy-700 text-white font-bold py-2 rounded-xl transition border border-navy-600">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}