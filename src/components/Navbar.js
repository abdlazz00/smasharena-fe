'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        // Cek cookies saat website dibuka
        const token = Cookies.get('token');
        const name = Cookies.get('user_name');
        if (token) {
            setIsLoggedIn(true);
            setUserName(name || 'User');
        }

        // Event listener untuk menutup dropdown saat klik di luar
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogin = () => {
        router.push('/login');
    };

    const handleLogout = () => {
        Cookies.remove('token');
        Cookies.remove('user_role');
        Cookies.remove('user_name');
        
        setIsLoggedIn(false);
        setUserName('');
        setDropdownOpen(false);
        router.push('/');
        router.refresh();
    };

    return (
        <header className="sticky top-0 z-50 glass border-b border-navy-800">
            <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white group">
                    <i className="fa-solid fa-shuttlecock text-neon text-2xl group-hover:rotate-45 transition duration-300"></i>
                    SMASH<span className="text-neon">ARENA</span>
                </Link>

                {/* Menu Tengah (Desktop) */}
                <div className="hidden md:flex items-center gap-8">
                    <Link href="/" className="text-sm font-medium text-slate-300 hover:text-neon transition">Beranda</Link>
                    <Link href="/booking" className="text-sm font-medium text-slate-300 hover:text-neon transition">Booking</Link>
                    <Link href="/history" className="text-sm font-medium text-slate-300 hover:text-neon transition">Riwayat</Link>
                </div>

                {/* Bagian Kanan (Login/User Dropdown) */}
                <div className="flex items-center gap-4">
                    {isLoggedIn ? (
                        <div className="relative" ref={dropdownRef}>
                            {/* Avatar Button */}
                            <button 
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-3 focus:outline-none"
                            >
                                <div className="text-right hidden md:block">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Halo,</p>
                                    <p className="text-sm font-bold text-white max-w-[100px] truncate">{userName}</p>
                                </div>
                                <div className={`w-10 h-10 rounded-full bg-navy-700 border-2 flex items-center justify-center text-neon font-bold text-lg shadow-lg transition duration-300 ${dropdownOpen ? 'border-neon ring-2 ring-neon/20' : 'border-navy-600 hover:border-slate-500'}`}>
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-3 w-48 bg-navy-800 border border-navy-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
                                    <div className="py-1">
                                        <Link 
                                            href="/profile" 
                                            className="flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-navy-700 hover:text-white transition"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <i className="fa-solid fa-user-pen w-5 text-center"></i> Edit Profil
                                        </Link>
                                        <Link 
                                            href="/history" 
                                            className="flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-navy-700 hover:text-white transition md:hidden"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <i className="fa-solid fa-clock-rotate-left w-5 text-center"></i> Riwayat
                                        </Link>
                                        <div className="border-t border-navy-700 my-1"></div>
                                        <button 
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                                        >
                                            <i className="fa-solid fa-right-from-bracket w-5 text-center"></i> Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button onClick={handleLogin} className="bg-neon text-navy-950 px-5 py-2 rounded-lg text-sm font-bold hover:bg-neon-hover flex items-center gap-2 shadow-lg shadow-neon/20 transition transform hover:scale-105">
                            <i className="fa-brands fa-google"></i> Login
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}