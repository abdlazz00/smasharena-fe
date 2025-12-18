'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const role = Cookies.get('user_role');
        if (role !== 'admin') {
            alert("Akses Ditolak! Area khusus Admin.");
            router.push('/'); 
        } else {
            setIsAuthorized(true);
        }
    }, [router]);

    if (!isAuthorized) return null;

    // --- STRUKTUR MENU BARU ---
    const menuGroups = [
        {
            title: "Utama",
            items: [
                { name: 'Dashboard', href: '/admin/dashboard', icon: 'fa-chart-pie' },
            ]
        },
        {
            title: "Manajemen Arena",
            items: [
                // Di sini khusus Booking Lapangan
                { name: 'Transaksi Booking', href: '/admin/transactions', icon: 'fa-calendar-check' },
                { name: 'Kelola Lapangan', href: '/admin/courts', icon: 'fa-layer-group' },
                { name: 'Data Member', href: '/admin/customers', icon: 'fa-users' },
            ]
        },
        {
            title: "Kantin & Store",
            items: [
                // Di sini khusus Jualan Ritel
                { name: 'Mesin Kasir (POS)', href: '/admin/pos', icon: 'fa-cash-register' }, // Icon kasir dipindah ke sini
                { name: 'Riwayat Penjualan', href: '/admin/orders', icon: 'fa-receipt' },     // Menu baru utk liat history POS
                { name: 'Master Produk', href: '/admin/products', icon: 'fa-box-open' },
                { name: 'Stok Masuk', href: '/admin/purchases', icon: 'fa-truck-ramp-box' },
                { name: 'Laporan Shift', href: '/admin/shift-history', icon: 'fa-clock-rotate-left' }, // Nanti kita buat
            ]
        }
    ];

    return (
        <div className="flex h-screen bg-navy-950 text-slate-100 overflow-hidden">
            {/* SIDEBAR */}
            <aside className="w-64 bg-navy-900 border-r border-navy-800 hidden md:flex flex-col h-full flex-shrink-0">
                
                {/* LOGO */}
                <div className="h-16 flex items-center px-6 border-b border-navy-800 shrink-0">
                    <div className="w-8 h-8 bg-neon rounded-lg flex items-center justify-center mr-3">
                        <i className="fa-solid fa-shuttlecock text-navy-900"></i>
                    </div>
                    <h1 className="font-black text-lg text-white tracking-wide italic">
                        ADMIN<span className="text-neon">PANEL</span>
                    </h1>
                </div>

                {/* NAVIGASI (SCROLLABLE) */}
                <nav className="flex-1 py-6 px-4 space-y-8 overflow-y-auto custom-scrollbar">
                    {menuGroups.map((group, idx) => (
                        <div key={idx}>
                            <p className="text-[10px] font-bold text-slate-500 uppercase px-4 mb-3 tracking-widest border-b border-navy-800/50 pb-1 mx-2">
                                {group.title}
                            </p>
                            <div className="space-y-1">
                                {group.items.map((menu) => {
                                    const isActive = pathname.startsWith(menu.href);
                                    return (
                                        <Link 
                                            key={menu.name}
                                            href={menu.href} 
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-bold ${
                                                isActive 
                                                ? 'bg-neon text-navy-950 shadow-lg shadow-neon/20' 
                                                : 'text-slate-400 hover:bg-navy-800 hover:text-white'
                                            }`}
                                        >
                                            <i className={`fa-solid ${menu.icon} w-5 text-center`}></i>
                                            {menu.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
                
                {/* FOOTER LOGOUT */}
                <div className="p-4 border-t border-navy-800 shrink-0">
                    <button 
                        onClick={() => {
                            Cookies.remove('token');
                            Cookies.remove('user_role');
                            router.push('/');
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition font-bold"
                    >
                        <i className="fa-solid fa-right-from-bracket w-5 text-center"></i> Logout
                    </button>
                </div>
            </aside>

            {/* CONTENT AREA */}
            <main className="flex-1 overflow-y-auto h-screen bg-navy-950 p-8 relative">
                {children}
            </main>
        </div>
    );
}