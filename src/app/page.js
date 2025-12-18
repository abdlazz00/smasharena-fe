import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-12">
        
        {/* Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden h-64 md:h-[400px] bg-navy-800 group cursor-pointer shadow-2xl border border-navy-800">
            <div 
                className="absolute inset-0 bg-cover bg-center opacity-40 transition transform group-hover:scale-105 duration-700"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1626224583764-847890e0e966?q=80&w=1200&auto=format&fit=crop')" }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-navy-950 via-navy-900/60 to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full md:w-2/3">
                {/* <span className="bg-neon text-navy-950 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full mb-3 inline-block uppercase tracking-wider shadow-lg shadow-neon/20">
                    Promo Member Baru
                </span> */}
                <h2 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4 text-white">
                    Sewa Lapangan<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-green-400">
                        Lebih Mudah & Cepat.
                    </span>
                </h2>
                <p className="text-slate-300 text-sm md:text-lg mb-6 hidden md:block max-w-lg">
                    Nikmati pengalaman booking lapangan badminton tanpa antre. Cek jadwal real-time dan bayar langsung dari HP Anda.
                </p>
                <Link href="/booking">
                    <div className="inline-flex items-center gap-2 text-neon text-sm md:text-base font-bold group-hover:gap-4 transition-all bg-navy-950/50 backdrop-blur px-4 py-2 rounded-lg border border-neon/30">
                        Booking Sekarang <i className="fa-solid fa-arrow-right"></i>
                    </div>
                </Link>
            </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-8">
            <Link href="/booking" className="bg-navy-800/50 hover:bg-navy-800 p-4 rounded-2xl border border-navy-700 flex flex-col items-center gap-3 active:scale-95 transition cursor-pointer group">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-neon/10 flex items-center justify-center text-neon group-hover:scale-110 transition">
                    <i className="fa-regular fa-calendar-plus text-xl md:text-2xl"></i>
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-300 group-hover:text-white">Booking</span>
            </Link>
            <Link href="/history" className="bg-navy-800/50 hover:bg-navy-800 p-4 rounded-2xl border border-navy-700 flex flex-col items-center gap-3 active:scale-95 transition cursor-pointer group">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition">
                    <i className="fa-solid fa-clock-rotate-left text-xl md:text-2xl"></i>
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-300 group-hover:text-white">Riwayat</span>
            </Link>
            {/* Disabled Menus */}
            <div className="bg-navy-800/30 p-4 rounded-2xl border border-navy-700/50 flex flex-col items-center gap-3 opacity-60 cursor-not-allowed">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <i className="fa-solid fa-users text-xl md:text-2xl"></i>
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-300">Member</span>
            </div>
            <div className="bg-navy-800/30 p-4 rounded-2xl border border-navy-700/50 flex flex-col items-center gap-3 opacity-60 cursor-not-allowed">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400">
                    <i className="fa-solid fa-shop text-xl md:text-2xl"></i>
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-300">Shop</span>
            </div>
        </div>

        {/* Testimoni Section */}
        <div>
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h3 className="font-bold text-2xl text-white">Kata Mereka</h3>
                    <p className="text-slate-400 text-sm">Apa kata member setia Smash Arena</p>
                </div>
            </div>
            
            <div className="flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-visible gap-4 pb-4 md:pb-0 snap-x no-scrollbar">
                {/* Testimoni 1 */}
                <div className="snap-center flex-shrink-0 w-72 md:w-full bg-navy-800 p-6 rounded-2xl border border-navy-700 relative hover:border-navy-600 transition">
                    <i className="fa-solid fa-quote-right absolute top-6 right-6 text-navy-700 text-4xl"></i>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-slate-600 overflow-hidden">
                             {/* Placeholder Avatar */}
                             <div className="w-full h-full bg-slate-500"></div>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white">Budi Santoso</h4>
                            <div className="flex text-neon text-[10px]">
                                <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-slate-300 italic leading-relaxed">"Lapangannya enak banget, karpetnya masih kesat. Booking lewat web gampang gak perlu chat admin lama."</p>
                </div>
                {/* Testimoni 2 */}
                <div className="snap-center flex-shrink-0 w-72 md:w-full bg-navy-800 p-6 rounded-2xl border border-navy-700 relative hover:border-navy-600 transition">
                    <i className="fa-solid fa-quote-right absolute top-6 right-6 text-navy-700 text-4xl"></i>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-slate-600 overflow-hidden">
                             <div className="w-full h-full bg-slate-500"></div>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white">Siti Aminah</h4>
                            <div className="flex text-neon text-[10px]">
                                <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star-half-stroke"></i>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-slate-300 italic leading-relaxed">"Parkiran luas, ada musholla bersih. Sistem per 2 jam ini pas banget buat latihan rutin."</p>
                </div>
                {/* Testimoni 3 */}
                <div className="snap-center flex-shrink-0 w-72 md:w-full bg-navy-800 p-6 rounded-2xl border border-navy-700 relative hover:border-navy-600 transition">
                    <i className="fa-solid fa-quote-right absolute top-6 right-6 text-navy-700 text-4xl"></i>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-slate-600 overflow-hidden">
                             <div className="w-full h-full bg-slate-500"></div>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white">Andi Pratama</h4>
                            <div className="flex text-neon text-[10px]">
                                <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-slate-300 italic leading-relaxed">"Website responsif banget. Booking jam 8 malem dapet diskon member. Recommended!"</p>
                </div>
            </div>
        </div>

      </div>
    </main>
  );
}