'use client';

import Navbar from '@/components/Navbar';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function BookingPage() {
    const router = useRouter();
    
    // DATA STATE
    const [courts, setCourts] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // FORM STATE
    const [date, setDate] = useState(''); 
    const [expandedCourt, setExpandedCourt] = useState(null); 
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [formData, setFormData] = useState({ name: '', phone: '' });
    const [dateList, setDateList] = useState([]);

    // NEW: State Notifikasi Custom
    const [notif, setNotif] = useState({ show: false, message: '', isError: false });

    // 1. Inisialisasi Tanggal
    useEffect(() => {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 14; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            dates.push(d);
        }
        setDateList(dates);
        
        const offset = today.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(today - offset)).toISOString().slice(0, 10);
        setDate(localISOTime);

        const savedName = Cookies.get('user_name');
        if(savedName) setFormData(prev => ({ ...prev, name: savedName }));
    }, []);

    // 2. Ambil Data Lapangan
    useEffect(() => {
        const fetchCourts = async () => {
            try {
                const response = await api.get('/courts');
                setCourts(response.data);
            } catch (error) {
                console.error("Gagal ambil lapangan:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourts();
    }, []);

    // NEW: Helper Notifikasi
    const showNotification = (message, isError = false) => {
        setNotif({ show: true, message, isError });
        setTimeout(() => setNotif({ show: false, message: '', isError: false }), 3000);
    };

    // 3. Handle Buka Jadwal
    const handleExpandCourt = async (courtId) => {
        if (expandedCourt === courtId) {
            setExpandedCourt(null); 
            return;
        }

        setExpandedCourt(courtId);
        setLoadingSlots(true);
        setSlots([]); 
        setSelectedSlot(null); 

        try {
            const response = await api.get('/slots', {
                params: { date: date, court_id: courtId }
            });
            setSlots(response.data);
        } catch (error) {
            console.error("Gagal ambil slot:", error);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleDateChange = (newDate) => {
        setDate(newDate);
        setExpandedCourt(null);
        setSlots([]);
        setSelectedSlot(null);
    };

    // Handle Booking (UPDATED)
    const handleBooking = async () => {
        if (!selectedSlot || !formData.name || !formData.phone) {
            // Ganti alert dengan popup error
            showNotification("Mohon lengkapi nama dan nomor WhatsApp!", true);
            return;
        }

        try {
            setLoading(true);
            await api.post('/bookings', {
                court_id: expandedCourt,
                date: date,
                start_time: selectedSlot.start_time,
                customer_name: formData.name,
                customer_phone: formData.phone
            });

            // Tampilkan notifikasi sukses
            showNotification("Booking Berhasil! Silakan cek riwayat untuk pembayaran.");
            
            // Beri jeda 2 detik agar popup terlihat sebelum pindah halaman
            setTimeout(() => {
                router.push('/history');
            }, 2000);
            
            // Jangan set loading false disini agar tombol tetap disabled sampai redirect

        } catch (error) {
            // Tampilkan notifikasi error
            showNotification(error.response?.data?.message || "Gagal booking", true);
            setLoading(false); // Stop loading jika error
        }
    };

    const formatDateDisplay = (dateObj) => {
        if (!dateObj) return { day: '', date: '' };
        const day = dateObj.toLocaleDateString('id-ID', { weekday: 'short' });
        const date = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        return { day, date };
    };

    return (
        <main className="min-h-screen bg-navy-950 pb-20 relative">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
                
                {/* HEADER TANGGAL */}
                <section>
                    <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                        <i className="fa-regular fa-calendar text-neon"></i> Pilih Tanggal Main
                    </h2>
                    <div className="flex items-center gap-2 bg-navy-900/50 p-2 rounded-2xl border border-navy-800">
                        <div className="flex overflow-x-auto no-scrollbar gap-3 flex-grow">
                            {dateList.map((d, index) => {
                                const dateStr = d.toISOString().split('T')[0];
                                const isActive = date === dateStr;
                                const { day, date: dateText } = formatDateDisplay(d);

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleDateChange(dateStr)}
                                        className={`flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center transition-all duration-300 border ${
                                            isActive
                                            ? 'bg-red-700 border-red-500 text-white shadow-lg shadow-red-900/50 scale-105'
                                            : 'bg-navy-800 border-navy-700 text-slate-400 hover:bg-navy-700 hover:text-white'
                                        }`}
                                    >
                                        <span className="text-[10px] font-bold uppercase mb-1">{day}</span>
                                        <span className="text-sm font-bold">{dateText}</span>
                                    </button>
                                )
                            })}
                        </div>
                        
                        <div className="relative pl-2 border-l border-navy-700">
                            <input 
                                type="date"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => handleDateChange(e.target.value)}
                            />
                            <button className="w-12 h-12 bg-navy-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white border border-navy-700">
                                <i className="fa-solid fa-calendar-days text-lg"></i>
                            </button>
                        </div>
                    </div>
                </section>

                {/* LIST LAPANGAN */}
                <section className="space-y-6">
                    <h2 className="text-white font-bold flex items-center gap-2">
                        <i className="fa-solid fa-layer-group text-neon"></i> Daftar Lapangan
                    </h2>

                    {courts.map((court) => (
                        <div key={court.id} className="bg-navy-800 rounded-2xl border border-navy-700 overflow-hidden hover:border-navy-600 transition shadow-lg">
                            <div className="flex flex-col md:flex-row">
                                {/* KIRI: FOTO */}
                                <div className="md:w-1/3 h-48 md:h-auto relative bg-navy-900">
                                    {court.image_url ? (
                                        <img src={court.image_url} alt={court.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                                            <i className="fa-solid fa-image text-4xl"></i>
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1">
                                        <i className="fa-solid fa-camera"></i> Foto
                                    </div>
                                </div>

                                {/* KANAN: INFO */}
                                <div className="p-6 md:w-2/3 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1 pr-4">
                                                <h3 className="text-xl font-bold text-white">{court.name}</h3>
                                                <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-[85%] line-clamp-2">
                                                    {court.description || 'Lapangan Standar Internasional.'}
                                                </p>
                                            </div>
                                            <div className="text-right whitespace-nowrap min-w-fit">
                                                <p className="text-neon font-bold text-lg">Rp {parseInt(court.price_per_hour).toLocaleString()}</p>
                                                <p className="text-[10px] text-slate-500">/ Jam</p>
                                            </div>
                                        </div>

                                        {/* CHIPS FASILITAS */}
                                        <div className="flex flex-wrap gap-2 mt-4 mb-6">
                                            <span className="px-3 py-1 rounded-full bg-navy-900 border border-navy-700 text-xs text-slate-300 flex items-center gap-2 font-semibold">
                                                {court.sport_type === 'Futsal' ? <i className="fa-regular fa-futbol text-neon"></i> :
                                                 court.sport_type === 'Basketball' ? <i className="fa-solid fa-basketball text-neon"></i> :
                                                 <i className="fa-solid fa-table-tennis-paddle-ball text-neon"></i>} 
                                                {court.sport_type || 'Badminton'}
                                            </span>
                                            <span className="px-3 py-1 rounded-full bg-navy-900 border border-navy-700 text-xs text-slate-300 capitalize flex items-center gap-2 font-semibold">
                                                {court.court_type === 'outdoor' ? <i className="fa-solid fa-sun text-yellow-400"></i> : <i className="fa-solid fa-warehouse text-blue-400"></i>}
                                                {court.court_type || 'Indoor'}
                                            </span>
                                            <span className="px-3 py-1 rounded-full bg-navy-900 border border-navy-700 text-xs text-slate-300 capitalize flex items-center gap-2 font-semibold">
                                                <i className="fa-solid fa-layer-group text-green-400"></i> {court.type}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Tombol Lihat Jadwal */}
                                    <button 
                                        onClick={() => handleExpandCourt(court.id)}
                                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                                            expandedCourt === court.id 
                                            ? 'bg-red-700 text-white shadow-lg shadow-red-900/50' 
                                            : 'bg-neon text-navy-900 hover:bg-neon-hover'
                                        }`}
                                    >
                                        {expandedCourt === court.id ? (
                                            <>Tutup Jadwal <i className="fa-solid fa-chevron-up"></i></>
                                        ) : (
                                            <>Lihat Jadwal Tersedia <i className="fa-solid fa-chevron-down"></i></>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* DROPDOWN JADWAL */}
                            {expandedCourt === court.id && (
                                <div className="border-t border-navy-700 bg-navy-900/50 p-6 animate-fade-in-down">
                                    <h4 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">
                                        Pilih Jam Main ({new Date(date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long'})})
                                    </h4>
                                    
                                    {loadingSlots ? (
                                        <div className="flex justify-center py-8"><div className="animate-spin w-8 h-8 border-4 border-neon border-t-transparent rounded-full"></div></div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                            {slots.map((slot, idx) => {
                                                const isBooked = slot.status === 'booked';
                                                const isSelected = selectedSlot?.start_time === slot.start_time;
                                                return (
                                                    <button
                                                        key={idx}
                                                        disabled={isBooked}
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                                                            isBooked 
                                                            ? 'bg-navy-900 border-navy-700 opacity-50 cursor-not-allowed text-slate-500'
                                                            : isSelected
                                                                ? 'bg-neon border-neon text-navy-900 shadow-[0_0_15px_rgba(163,230,53,0.4)] scale-105'
                                                                : 'bg-navy-800 border-navy-600 text-white hover:border-neon'
                                                        }`}
                                                    >
                                                        <span className="text-xs text-slate-400 font-normal">60 Menit</span>
                                                        <span className="text-sm font-bold">{slot.start_time} - {slot.end_time}</span>
                                                        <span className={`text-[10px] font-bold uppercase mt-1 ${isBooked ? 'text-red-500' : isSelected ? 'text-navy-900' : 'text-green-400'}`}>
                                                            {isBooked ? 'Booked' : isSelected ? 'Dipilih' : 'Available'}
                                                        </span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {/* FORM DATA DIRI & TOMBOL BOOKING */}
                                    {selectedSlot && (
                                        <div className="mt-6 bg-navy-800 p-4 rounded-xl border border-navy-600 flex flex-col md:flex-row gap-4 items-center justify-between animate-fade-in-up">
                                            <div className="flex-grow w-full md:w-auto grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <input 
                                                    type="text" 
                                                    placeholder="Nama Pemesan" 
                                                    value={formData.name}
                                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                                    className="bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white focus:border-neon outline-none text-sm"
                                                />
                                                <input 
                                                    type="tel" 
                                                    placeholder="WhatsApp (08xx)" 
                                                    value={formData.phone}
                                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                                    className="bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white focus:border-neon outline-none text-sm"
                                                />
                                            </div>
                                            <div className="text-right whitespace-nowrap">
                                                <p className="text-xs text-slate-400">Total Harga (2 Jam)</p>
                                                <p className="text-lg font-bold text-white">Rp {(parseInt(court.price_per_hour) * 2).toLocaleString()}</p>
                                            </div>
                                            <button 
                                                onClick={handleBooking}
                                                disabled={loading}
                                                className="w-full md:w-auto bg-neon hover:bg-neon-hover text-navy-900 font-bold py-3 px-6 rounded-xl shadow-lg transition flex items-center gap-2 justify-center"
                                            >
                                                {loading ? <><i className="fa-solid fa-spinner animate-spin"></i> Proses...</> : 'Booking'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </section>
            </div>

            {/* NEW: NOTIFIKASI POPUP (TOAST) */}
            {notif.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                    <div className="bg-navy-800 border border-navy-600 shadow-2xl p-6 rounded-2xl flex flex-col items-center justify-center min-w-[250px] animate-bounce-small pointer-events-auto">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${notif.isError ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                            <i className={`fa-solid ${notif.isError ? 'fa-xmark' : 'fa-check'} text-3xl`}></i>
                        </div>
                        <h4 className="text-white font-bold text-lg mb-1">{notif.isError ? 'Gagal!' : 'Berhasil!'}</h4>
                        <p className="text-slate-400 text-sm text-center">{notif.message}</p>
                    </div>
                </div>
            )}
        </main>
    );
}