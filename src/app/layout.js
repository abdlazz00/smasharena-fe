import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Smash Arena - Booking Badminton",
  description: "Sewa lapangan badminton mudah dan cepat",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      
      {/* PERBAIKAN: Tambahkan suppressHydrationWarning={true} */}
      <body 
        className={`${inter.className} bg-navy-950 text-slate-100 min-h-screen`}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}