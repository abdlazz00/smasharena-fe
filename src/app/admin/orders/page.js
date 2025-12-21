'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';

export default function OrderHistory() {
    // --- STATE ---
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination
    const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });

    // Modal Detail
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // --- FETCH DATA ---
    const fetchOrders = async (page = 1) => {
        setLoading(true);
        try {
            const res = await api.get('/admin/orders', {
                params: { page }
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
        if (!isoString) return { date: '-', time: '-' };
        const d = new Date(isoString);
        return {
            date: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
            time: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        };
    };

    // Helper Badge Metode
    const getPaymentBadge = (method) => {
        const labels = {
            cash: { text: 'Tunai', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
            transfer: { text: 'Transfer', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
            qris: { text: 'QRIS', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
            open_bill: { text: 'Open Bill', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
        };
        const badge = labels[method] || { text: method, color: 'bg-slate-700 text-slate-300' };
        
        return (
            <span className={`uppercase text-[10px] font-bold px-2 py-1 rounded border ${badge.color}`}>
                {badge.text}
            </span>
        );
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* HEADER */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <i className="fa-solid fa-receipt text-neon"></i> Riwayat Penjualan (POS)
                </h1>
                <p className="text-slate-400 text-sm">Data transaksi penjualan kantin & store.</p>
            </div>

            {/* TABEL ORDER */}
            <div className="bg-navy-800 rounded-2xl border border-navy-700 overflow-hidden shadow-xl mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-navy-900 text-xs uppercase font-bold text-slate-300">
                            <tr>
                                <th className="px-6 py-4">Invoice</th>
                                <th className="px-6 py-4">Tanggal</th>
                                <th className="px-6 py-4">Kasir</th>
                                <th className="px-6 py-4">Metode Bayar</th>
                                <th className="px-6 py-4 text-right">Total</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-700">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-10">Memuat data...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-10">Belum ada data penjualan.</td></tr>
                            ) : orders.map((order) => {
                                const { date, time } = formatDate(order.created_at);
                                return (
                                    <tr key={order.id} className="hover:bg-navy-700/50 transition">
                                        <td className="px-6 py-4 font-mono text-white font-bold">
                                            {order.invoice_code}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-white">{date}</div>
                                            <div className="text-xs text-slate-500">{time}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {order.cash_session?.user?.name || 'Admin'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getPaymentBadge(order.payment_method)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-neon">
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

            {/* --- MODAL DETAIL TRANSAKSI (REFACTORED UI) --- */}
            {showModal && selectedOrder && (
                <div className="fixed inset-0 z-[100] bg-navy-950/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-navy-800 w-full max-w-md rounded-2xl border border-navy-600 shadow-2xl overflow-hidden animate-fade-in-up">
                        
                        {/* HEADER MODAL */}
                        <div className="bg-navy-900 p-4 border-b border-navy-700 flex justify-between items-center">
                            <div>
                                <h3 className="text-white font-bold">Detail Transaksi</h3>
                                <p className="text-xs text-neon font-mono">{selectedOrder.invoice_code}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><i className="fa-solid fa-xmark text-lg"></i></button>
                        </div>
                        
                        <div className="p-6">
                            
                            {/* --- LIST PRODUCT --- */}
                            <div className="mb-4">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                                    <i className="fa-solid fa-basket-shopping"></i> Item Terjual
                                </p>
                                
                                <div className="bg-navy-900/50 rounded-xl border border-navy-700 p-4 max-h-[200px] overflow-y-auto custom-scrollbar">
                                    {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                                        <div className="space-y-3">
                                            {selectedOrder.order_items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-start text-sm border-b border-navy-700/50 pb-2 last:border-0 last:pb-0">
                                                    <div>
                                                        <div className="text-white font-medium">
                                                            {item.product?.name || 'Produk Terhapus'}
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            {item.quantity} x Rp {parseInt(item.price).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="font-bold text-slate-300">
                                                        Rp {parseInt(item.quantity * item.price).toLocaleString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-slate-500 text-xs italic">
                                            Tidak ada rincian item (Data lama).
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* --- RINGKASAN PEMBAYARAN --- */}
                            <div className="space-y-3 border-t border-navy-700 pt-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Metode Bayar</span>
                                    <span className="text-white font-bold uppercase">
                                        {selectedOrder.payment_method.replace('_', ' ')}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Status Pembayaran</span>
                                    <span className={`uppercase font-bold text-xs px-2 py-0.5 rounded ${selectedOrder.payment_status === 'paid' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                        {selectedOrder.payment_status}
                                    </span>
                                </div>

                                <div className="flex justify-between text-lg pt-2 border-t border-navy-700 border-dashed">
                                    <span className="text-white font-bold">Total Transaksi</span>
                                    <span className="text-neon font-bold">
                                        Rp {parseInt(selectedOrder.total_amount).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                        </div>

                        {/* FOOTER MODAL */}
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