'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';

// 1. Komponen Internal: Berisi logika yang menggunakan useSearchParams
function AuthContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        const role = searchParams.get('role');
        const name = searchParams.get('name');

        if (token) {
            // Simpan ke Cookies (Berlaku 7 hari)
            Cookies.set('token', token, { expires: 7 });
            Cookies.set('user_role', role, { expires: 7 });
            Cookies.set('user_name', name, { expires: 7 });

            // Redirect sesuai role
            if (role === 'admin') {
                router.push('/admin/dashboard');
            } else {
                router.push('/');
            }
        } else {
            // Gagal login, balik ke home
            router.push('/');
        }
    }, [searchParams, router]);

    // Tampilan saat logika sedang berjalan (bisa null atau spinner juga)
    return (
        <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-navy-700 border-t-neon rounded-full animate-spin mb-4"></div>
            <p>Sedang memverifikasi data...</p>
        </div>
    );
}

// 2. Komponen Utama: Membungkus AuthContent dengan Suspense
export default function AuthCallback() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-navy-950 text-white">
            <Suspense fallback={
                // Tampilan Loading sementara menunggu parameter URL siap
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-navy-700 border-t-neon rounded-full animate-spin mb-4"></div>
                    <p>Sedang memproses login...</p>
                </div>
            }>
                <AuthContent />
            </Suspense>
        </div>
    );
}