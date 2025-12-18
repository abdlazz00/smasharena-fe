'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register ChartJS Components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await api.get('/admin/dashboard-stats');
            setData(res.data);
        } catch (error) {
            console.error("Gagal load dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return <div className="text-center py-20 text-white">Memuat Dashboard...</div>;
    if (!data) return <div className="text-center py-20 text-white">Gagal memuat data.</div>;

    // --- CONFIG CHART ---
    
    // 1. Grafik Trend Pendapatan (Line Chart)
    const revenueChartData = {
        labels: data.charts.labels,
        datasets: [
            {
                label: 'Sewa Lapangan',
                data: data.charts.booking_series,
                borderColor: '#3b82f6', // Blue
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                tension: 0.4,
            },
            {
                label: 'Kantin (POS)',
                data: data.charts.pos_series,
                borderColor: '#10b981', // Green
                backgroundColor: 'rgba(16, 185, 129, 0.5)',
                tension: 0.4,
            },
        ],
    };

    // 2. Grafik Jam Tersibuk (Bar Chart)
    const busyChartData = {
        labels: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'],
        datasets: [
            {
                label: 'Jumlah Booking (30 Hari Terakhir)',
                data: data.charts.busy_hours, // Array jam 8-22
                backgroundColor: '#f59e0b', // Amber/Yellow
                borderRadius: 4,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top', labels: { color: '#cbd5e1' } }, // Slate-300
        },
        scales: {
            y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
            x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
        }
    };

    return (
        <div className="space-y-8">
            {/* HEADER */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
                    <p className="text-slate-400 text-sm">Pantau performa bisnis hari ini.</p>
                </div>
                <button onClick={fetchData} className="bg-navy-800 hover:bg-navy-700 text-white px-4 py-2 rounded-lg border border-navy-700 transition flex items-center gap-2 text-sm">
                    <i className="fa-solid fa-rotate"></i> Refresh
                </button>
            </div>

            {/* BARIS 1: FINANCIAL CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Omzet */}
                <div className="bg-navy-800 p-5 rounded-2xl border border-navy-700 relative overflow-hidden group">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Total Omzet Hari Ini</p>
                    <h3 className="text-2xl font-bold text-white">Rp {parseInt(data.financial.total_revenue).toLocaleString()}</h3>
                    <div className="flex gap-2 mt-2 text-[10px]">
                        <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">Booking: {parseInt(data.financial.booking_revenue).toLocaleString()}</span>
                        <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded">Kantin: {parseInt(data.financial.pos_revenue).toLocaleString()}</span>
                    </div>
                    <i className="fa-solid fa-sack-dollar absolute -right-3 -bottom-3 text-7xl text-navy-900 group-hover:text-navy-950 transition z-0"></i>
                </div>

                {/* Metode Bayar */}
                <div className="bg-navy-800 p-5 rounded-2xl border border-navy-700 relative overflow-hidden group">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Metode Pembayaran</p>
                    <div className="space-y-1 mt-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-300"><i className="fa-solid fa-money-bill text-green-500 mr-2"></i>Cash</span>
                            <span className="text-white font-bold">Rp {parseInt(data.financial.cash_total).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-300"><i className="fa-solid fa-building-columns text-blue-500 mr-2"></i>Transfer</span>
                            <span className="text-white font-bold">Rp {parseInt(data.financial.transfer_total).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Shift Kasir */}
                <div className="bg-navy-800 p-5 rounded-2xl border border-navy-700 relative overflow-hidden group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Shift Kasir</p>
                            <h3 className={`text-lg font-bold ${data.shift.status === 'open' ? 'text-neon' : 'text-red-500'}`}>
                                {data.shift.status === 'open' ? 'SEDANG BUKA' : 'TUTUP'}
                            </h3>
                            <p className="text-xs text-white mt-1">User: {data.shift.user}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400">Saldo Laci</p>
                            <p className="text-sm font-mono font-bold text-white">Rp {parseInt(data.shift.current_cash).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Booking Aktif */}
                <div className="bg-navy-800 p-5 rounded-2xl border border-navy-700 relative overflow-hidden group">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Booking Aktif</p>
                    <div className="flex items-end gap-2">
                        <h3 className="text-4xl font-bold text-white">{data.operational.active_bookings}</h3>
                        <span className="text-sm text-slate-400 mb-2">Lapangan</span>
                    </div>
                    <p className="text-xs text-neon mt-1 animate-pulse">Sedang digunakan sekarang</p>
                    <i className="fa-solid fa-table-tennis-paddle-ball absolute -right-3 -bottom-3 text-7xl text-navy-900 group-hover:text-navy-950 transition z-0"></i>
                </div>
            </div>

            {/* BARIS 2: CHARTS & ALERT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Kiri: Revenue Trend */}
                <div className="lg:col-span-2 bg-navy-800 p-6 rounded-2xl border border-navy-700">
                    <h3 className="text-white font-bold mb-4">Tren Pendapatan (7 Hari Terakhir)</h3>
                    <div className="h-64">
                        <Line data={revenueChartData} options={chartOptions} />
                    </div>
                </div>

                {/* Chart Kanan: Busy Hours & Alerts */}
                <div className="space-y-6">
                    {/* Busy Hours */}
                    <div className="bg-navy-800 p-6 rounded-2xl border border-navy-700">
                        <h3 className="text-white font-bold mb-4">Jam Tersibuk (Booking)</h3>
                        <div className="h-40">
                            <Bar data={busyChartData} options={{...chartOptions, maintainAspectRatio: false}} />
                        </div>
                    </div>

                    {/* Alerts Section */}
                    <div className="bg-navy-800 p-6 rounded-2xl border border-navy-700">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <i className="fa-solid fa-triangle-exclamation text-yellow-500"></i> Perlu Perhatian
                        </h3>
                        
                        <div className="space-y-3">
                            {/* Pending Payment */}
                            {data.operational.pending_payments > 0 ? (
                                <Link href="/admin/transactions" className="flex justify-between items-center bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20 hover:bg-yellow-500/20 transition">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-yellow-500 text-navy-900 flex items-center justify-center font-bold text-xs">{data.operational.pending_payments}</div>
                                        <span className="text-yellow-500 text-sm font-bold">Menunggu Pembayaran</span>
                                    </div>
                                    <i className="fa-solid fa-chevron-right text-yellow-500 text-xs"></i>
                                </Link>
                            ) : (
                                <div className="text-xs text-slate-500 text-center py-2">Tidak ada pending payment.</div>
                            )}

                            {/* Low Stock Alert */}
                            {data.operational.low_stock.length > 0 ? (
                                <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                                    <p className="text-red-500 text-xs font-bold mb-2 flex items-center gap-2">
                                        <i className="fa-solid fa-boxes-packing"></i> Stok Menipis!
                                    </p>
                                    <ul className="space-y-1">
                                        {data.operational.low_stock.map(product => (
                                            <li key={product.id} className="flex justify-between text-xs text-slate-300">
                                                <span>{product.name}</span>
                                                <span className="text-red-400 font-bold">Sisa: {product.stock}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href="/admin/products" className="block text-center text-[10px] text-red-400 mt-2 hover:underline">Kelola Stok &rarr;</Link>
                                </div>
                            ) : (
                                <div className="text-xs text-green-500 text-center py-2 flex items-center justify-center gap-2">
                                    <i className="fa-solid fa-check-circle"></i> Stok Kantin Aman
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* BARIS 3: TABEL DETAIL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Transaksi Terbaru */}
                <div className="bg-navy-800 rounded-2xl border border-navy-700 overflow-hidden">
                    <div className="p-5 border-b border-navy-700 flex justify-between items-center">
                        <h3 className="font-bold text-white">Booking Terbaru</h3>
                        <Link href="/admin/transactions" className="text-xs text-neon hover:underline">Lihat Semua</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-400">
                            <thead className="bg-navy-900 uppercase font-bold text-slate-300">
                                <tr>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3">Jadwal</th>
                                    <th className="px-4 py-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-navy-700">
                                {data.lists.recent_bookings.map(b => (
                                    <tr key={b.id} className="hover:bg-navy-700/50">
                                        <td className="px-4 py-3 text-white font-bold">{b.customer_name}</td>
                                        <td className="px-4 py-3">
                                            {b.booking_date} <br/> 
                                            <span className="font-mono text-[10px]">{b.start_time.substring(0,5)}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${
                                                b.status === 'paid' ? 'bg-green-500/10 text-green-500' :
                                                b.status === 'booked' ? 'bg-yellow-500/10 text-yellow-500' :
                                                'bg-red-500/10 text-red-500'
                                            }`}>{b.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Produk Terlaris */}
                <div className="bg-navy-800 rounded-2xl border border-navy-700 overflow-hidden">
                    <div className="p-5 border-b border-navy-700 flex justify-between items-center">
                        <h3 className="font-bold text-white">Produk Terlaris (Bulan Ini)</h3>
                        <Link href="/admin/products" className="text-xs text-neon hover:underline">Lihat Stok</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-400">
                            <thead className="bg-navy-900 uppercase font-bold text-slate-300">
                                <tr>
                                    <th className="px-4 py-3">Produk</th>
                                    <th className="px-4 py-3 text-right">Terjual</th>
                                    <th className="px-4 py-3 text-right">Sisa Stok</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-navy-700">
                                {data.lists.top_products.length > 0 ? data.lists.top_products.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-navy-700/50">
                                        <td className="px-4 py-3 text-white font-bold flex items-center gap-2">
                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${idx === 0 ? 'bg-yellow-500 text-navy-900' : 'bg-slate-700 text-white'}`}>
                                                {idx + 1}
                                            </span>
                                            {item.product?.name}
                                        </td>
                                        <td className="px-4 py-3 text-right text-neon font-bold">{item.total_qty} pcs</td>
                                        <td className="px-4 py-3 text-right">{item.product?.stock}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="3" className="text-center py-4">Belum ada penjualan bulan ini.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}