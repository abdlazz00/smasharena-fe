// src/app/admin/transactions/print/struk.js

export const printBookingReceipt = (booking) => {
    // 1. Buat Iframe Tersembunyi
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    
    // --- HELPER FORMATTING ---
    const formatRp = (num) => parseInt(num || 0).toLocaleString('id-ID');
    
    // Waktu saat print
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID');
    // Format jam pakai titik dua (:) sesuai request
    const timeStr = now.toLocaleTimeString('id-ID').replace(/\./g, ':'); 

    // Data Kasir & Customer
    const cashierName = booking.transaction?.processed_by?.name || 'Admin';
    const customerName = booking.user?.name || booking.customer_name || 'Guest';

    // --- PERHITUNGAN TOTAL ---
    // Hitung total kantin
    const ordersTotal = booking.orders?.reduce((acc, order) => acc + parseInt(order.total_amount), 0) || 0;
    // Grand Total
    const grandTotal = parseInt(booking.total_price) + ordersTotal;
    
    // Cek Metode Bayar
    const paymentMethod = booking.transaction?.payment_method || 'cash';

    // --- GENERATE HTML STRUK ---
    // Kita menyusun HTML agar struktur dan class-nya meniru 'PrintStruk' POS
    doc.open();
    doc.write(`
        <html>
        <head>
            <title>Struk Booking - ${booking.booking_code}</title>
            <style>
                /* RESET & PAGE */
                @page { margin: 0; }
                body { 
                    margin: 0; 
                    padding: 0; 
                    background: white; 
                    font-family: 'Courier New', monospace; /* font-mono */
                    font-size: 10px; /* text-[10px] */
                    color: black;
                }
                
                /* CONTAINER (Meniru w-[58mm] mx-auto p-2) */
                .struk-container {
                    width: 58mm;
                    margin: 0 auto;
                    padding: 8px; /* p-2 */
                }

                /* UTILITY CLASSES MENIRU TAILWIND */
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .font-bold { font-weight: bold; }
                .text-sm { font-size: 14px; } /* text-sm di tailwind biasanya 14px */
                .uppercase { text-transform: uppercase; }
                
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                
                .mb-1 { margin-bottom: 4px; }
                .mb-2 { margin-bottom: 8px; }
                .pb-2 { padding-bottom: 8px; }
                .pt-2 { padding-top: 8px; }
                .mt-4 { margin-top: 16px; }

                /* BORDER DASHED (Sesuai request) */
                .border-b { border-bottom: 1px dashed black; }
                .border-t { border-top: 1px dashed black; }
                
                /* Layout Item List */
                .item-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4px; /* mb-1 */
                }
            </style>
        </head>
        <body>
            <div class="struk-container">
                
                <div class="text-center mb-2 border-b pb-2">
                    <h1 class="font-bold text-sm" style="margin:0;">SMASH ARENA</h1>
                    <p style="margin:2px 0;">Jl. Badminton No. 1</p>
                    <p style="margin:0;">Telp: 0812-3456-7890</p>
                </div>

                <div class="mb-2">
                    <p style="margin:2px 0;">No: ${booking.booking_code}</p>
                    <p style="margin:2px 0;">Tgl: ${dateStr} ${timeStr}</p>
                    <p style="margin:2px 0;">Kasir: ${cashierName}</p>
                    <p style="margin:2px 0;">Cust: ${customerName}</p>
                </div>

                <div class="border-b pb-2 mb-2">
                    
                    <div class="item-row">
                        <div>
                            <div class="font-bold">${booking.court?.name} (Sewa)</div>
                            <div>1 x ${formatRp(booking.total_price)}</div>
                            <div style="font-size: 9px; font-style: italic;">
                                (${booking.start_time.substring(0,5)} - ${booking.end_time.substring(0,5)})
                            </div>
                        </div>
                        <div class="text-right">
                            ${formatRp(booking.total_price)}
                        </div>
                    </div>

                    ${booking.orders && booking.orders.length > 0 ? booking.orders.map(order => 
                        order.order_items.map(item => `
                            <div class="item-row">
                                <div>
                                    <div class="font-bold">${item.product?.name || 'Item'}</div>
                                    <div>${item.quantity} x ${formatRp(item.price)}</div>
                                </div>
                                <div class="text-right">
                                    ${formatRp(item.price * item.quantity)}
                                </div>
                            </div>
                        `).join('')
                    ).join('') : ''}
                </div>

                <div class="flex justify-between font-bold text-sm mb-1">
                    <span>TOTAL</span>
                    <span>Rp ${grandTotal.toLocaleString('id-ID')}</span>
                </div>

                ${paymentMethod === 'cash' ? `
                    <div class="flex justify-between mb-1">
                        <span>Tunai</span>
                        <span>Rp ${grandTotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div class="flex justify-between mb-2">
                        <span>Kembali</span>
                        <span>Rp 0</span>
                    </div>
                ` : `
                    <div class="text-center mb-2 font-bold uppercase">
                        (${paymentMethod.replace('_', ' ')})
                    </div>
                `}

                <div class="flex justify-between mb-2" style="font-size: 10px;">
                    <span>Status</span>
                    <span class="font-bold uppercase">${booking.status === 'paid' || booking.status === 'completed' ? 'LUNAS' : 'BELUM LUNAS'}</span>
                </div>

                <div class="text-center mt-4 pt-2 border-t">
                    <p style="margin:2px 0;">Terima Kasih</p>
                    <p style="margin:0;">Selamat Berolahraga!</p>
                </div>

            </div>
        </body>
        </html>
    `);
    doc.close();

    // 4. Print & Hapus Iframe
    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
    }, 500);
};