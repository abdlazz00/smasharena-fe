'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';

export default function AdminOrders() {
    // --- STATE ---
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination
    const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });

    // Filter
    const [search, setSearch] = useState('');

    // Modal Detail
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // --- FETCH DATA ---
    const fetchOrders = async (page = 1) => {
        setLoading(true);
        try {
            const res = await api.get('/admin/orders', {
                params: { page, search }
            });
            setOrders(res.data.data);
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
        fetchOrders();
    }, []);

    // Handle Search (Enter)
    const handleSearch = (e) => {
        if (e.key === 'Enter') fetchOrders(1);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.lastPage) {
            fetchOrders(newPage);
        }
    };

    const openDetail = (order) => {
        setSelectedOrder(order);
        setShowModal(true);
    };

    // Helper Format Tanggal
    const formatDate = (isoString) => {
        const d = new Date(isoString);
        return {
            date: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
            time: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        };
    };

    // Helper Badge Metode Bayar
    const getMethodBadge = (method) => {
        const styles = {
            cash: 'bg-green-500/10 text-green-500 border-green-500/20',
            qris: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            transfer: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
            open_bill: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
        };
        const labels = {
            cash: 'Tunai',
            qris: 'QRIS',
            transfer: 'Transfer',
            open_bill: 'Open Bill'
        };
        return (
            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${styles[method] || 'text-slate-400'}`}>
                {labels[method] || method}
            </span>
        );
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <i className="fa-solid fa-receipt text-neon"></i> Riwayat Penjualan
                    </h1>
                    <p className="text-slate-400 text-sm">Daftar transaksi kasir (POS).</p>
                </div>
                
                <div className="relative w-full md:w-64">
                    <input 
                        type="text" 
                        placeholder="Cari No Invoice..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleSearch}
                        className="w-full bg-navy-800 border border-navy-700 text-white py-2 pl-10 pr-4 rounded-xl focus:border-neon outline-none text-sm"
                    />
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-500"></i>
                </div>
            </div>

            {/* TABEL TRANSAKSI */}
            <div className="bg-navy-800 rounded-2xl border border-navy-700 overflow-hidden shadow-xl mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-navy-900 text-xs uppercase font-bold text-slate-300">
                            <tr>
                                <th className="px-6 py-4">Waktu</th>
                                <th className="px-6 py-4">Invoice</th>
                                <th className="px-6 py-4">Kasir</th>
                                <th className="px-6 py-4">Keterangan</th>
                                <th className="px-6 py-4">Metode</th>
                                <th className="px-6 py-4 text-right">Total</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-700">
                            {loading ? (
                                <tr><td colSpan="7" className="text-center py-10">Memuat data...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-10">Belum ada transaksi penjualan.</td></tr>
                            ) : orders.map((order) => {
                                const { date, time } = formatDate(order.created_at);
                                return (
                                    <tr key={order.id} className="hover:bg-navy-700/50 transition">
                                        <td className="px-6 py-4">
                                            <div className="text-white font-bold">{date}</div>
                                            <div className="text-xs text-slate-500 font-mono">{time}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-neon font-bold text-xs">
                                            {order.invoice_code}
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            {order.cash_session?.user?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {order.booking ? (
                                                <div className="flex items-center gap-1 text-xs text-yellow-400">
                                                    <i className="fa-solid fa-link"></i> Booking {order.booking.booking_code}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getMethodBadge(order.payment_method)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-white">
                                            Rp {parseInt(order.total_amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => openDetail(order)}
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
            {orders.length > 0 && (
                <div className="flex justify-between items-center text-xs text-slate-400">
                    <div>
                        Menampilkan {pagination.from}-{pagination.to} dari {pagination.total} transaksi
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

            {/* MODAL DETAIL ORDER */}
            {showModal && selectedOrder && (
                <div className="fixed inset-0 z-[100] bg-navy-950/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-navy-800 w-full max-w-md rounded-2xl border border-navy-600 shadow-2xl overflow-hidden animate-fade-in-up">
                        <div className="bg-navy-900 p-4 border-b border-navy-700 flex justify-between items-center">
                            <div>
                                <h3 className="text-white font-bold">Detail Transaksi</h3>
                                <p className="text-xs text-neon font-mono">{selectedOrder.invoice_code}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><i className="fa-solid fa-xmark text-lg"></i></button>
                        </div>
                        
                        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-3">
                                {selectedOrder.order_items?.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-start border-b border-navy-700/50 pb-2">
                                        <div>
                                            <p className="text-white font-bold text-sm">{item.product?.name}</p>
                                            <p className="text-xs text-slate-400">{item.quantity} x Rp {parseInt(item.price).toLocaleString()}</p>
                                        </div>
                                        <p className="text-white font-bold text-sm">Rp {(item.quantity * item.price).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-navy-900 p-4 border-t border-navy-700 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Metode Bayar</span>
                                <span className="text-white font-bold uppercase">{selectedOrder.payment_method.replace('_', ' ')}</span>
                            </div>
                            <div className="flex justify-between text-lg">
                                <span className="text-slate-400 font-bold">Total</span>
                                <span className="text-neon font-bold">Rp {parseInt(selectedOrder.total_amount).toLocaleString()}</span>
                            </div>
                            
                            <button onClick={() => setShowModal(false)} className="w-full mt-4 bg-navy-800 hover:bg-navy-700 text-white py-2 rounded-xl font-bold transition border border-navy-600">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}