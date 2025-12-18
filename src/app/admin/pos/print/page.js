'use client';

import { useEffect, useState } from 'react';

export default function PrintStruk() {
    const [data, setData] = useState(null);

    useEffect(() => {
        const storedData = localStorage.getItem('print_data');
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            setData(parsedData);
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, []);

    if (!data) return <div className="p-4 text-center">Memuat Struk...</div>;

    const items = data.items || [];
    const total = parseInt(data.total_amount);
    const cash = parseInt(data.cash_given || 0);
    const change = parseInt(data.change || 0);
    const cashierName = data.cashier_name || 'Admin';

    return (
        <div className="w-[58mm] md:w-[80mm] mx-auto p-2 font-mono text-[10px] md:text-xs text-black bg-white">
            <style jsx global>{`
                @page { margin: 0; }
                body { margin: 0; padding: 0; background: white; }
            `}</style>

            <div className="text-center mb-2 border-b border-black pb-2 border-dashed">
                <h1 className="font-bold text-sm">SMASH ARENA</h1>
                <p>Jl. Badminton No. 1</p>
                <p>Telp: 0812-3456-7890</p>
            </div>

            <div className="mb-2">
                <p>No: {data.invoice_code}</p>
                {/* Format Jam Pakai Titik Dua */}
                <p>Tgl: {new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID').replace(/\./g, ':')}</p>
                <p>Kasir: {cashierName}</p>
            </div>

            <div className="border-b border-black pb-2 mb-2 border-dashed">
                {items.map((item, idx) => {
                    const price = parseInt(item.price || item.buy_price || 0);
                    const qty = parseInt(item.qty || item.quantity || 0);
                    const subtotal = price * qty;

                    return (
                        <div key={idx} className="flex justify-between mb-1">
                            <div>
                                <div className="font-bold">{item.product_name || item.name}</div>
                                <div>{qty} x {price.toLocaleString()}</div>
                            </div>
                            <div className="text-right">
                                {subtotal.toLocaleString()}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-between font-bold text-sm mb-1">
                <span>TOTAL</span>
                <span>Rp {total.toLocaleString()}</span>
            </div>

            {data.payment_method === 'cash' && (
                <>
                    <div className="flex justify-between mb-1">
                        <span>Tunai</span>
                        <span>Rp {cash.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span>Kembali</span>
                        <span>Rp {change.toLocaleString()}</span>
                    </div>
                </>
            )}

            {data.payment_method !== 'cash' && (
                <div className="text-center mb-2 font-bold uppercase">
                    ({data.payment_method.replace('_', ' ')})
                </div>
            )}

            <div className="text-center mt-4 pt-2 border-t border-black border-dashed">
                <p>Terima Kasih</p>
                <p>Selamat Berolahraga!</p>
            </div>
        </div>
    );
}