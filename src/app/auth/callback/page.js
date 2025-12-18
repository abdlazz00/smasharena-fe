'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';

export default function AuthCallback() {
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

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-navy-950 text-white">
            <div className="w-12 h-12 border-4 border-navy-700 border-t-neon rounded-full animate-spin mb-4"></div>
            <p>Sedang memproses login...</p>
        </div>
    );
}