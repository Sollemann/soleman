/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Truck, 
  Wrench, 
  ShieldCheck, 
  MapPin, 
  MessageSquare, 
  Search, 
  ArrowRight, 
  Sparkles,
  CheckCircle2,
  Clock,
  Bot,
  Smartphone,
  Calculator,
  QrCode
} from 'lucide-react';
import { WORKSHOP_INFO } from '../data/solcreftData';
import { soundFx } from '../services/soundEffects';

interface HeroProps {
  onOpenBooking: () => void;
  onSearchOrder: (id: string) => void;
  onExploreServices: () => void;
  onOpenDashboard: () => void;
  onOpenWaBot?: () => void;
  onOpenInstallModal?: () => void;
  onOpenQrModal?: () => void;
  onOpenCalculator?: () => void;
  onOpenTransformasi?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenBooking,
  onSearchOrder,
  onExploreServices,
  onOpenDashboard,
  onOpenWaBot,
  onOpenInstallModal,
  onOpenQrModal,
  onOpenCalculator,
  onOpenTransformasi
}) => {
  const [orderQuery, setOrderQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    if (orderQuery.trim()) {
      onSearchOrder(orderQuery.trim());
    }
  };

  const scrollToElement = (id: string) => {
    soundFx.playClick();
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -80;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-800/80">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-amber-500/15 via-orange-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -top-32 right-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headlines & Action */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-inner">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Workshop Sukalila Selatan Kota Cirebon</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" /> Antar-Jemput se-Cirebon
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1] font-display">
              Sepatu Rusak & Menganga? <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
                Soleman Kembalikan
              </span> <br />
              Kuat Seperti Baru.
            </h1>

            {/* Subtitle */}
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
              Spesialis reparasi sepatu terlengkap di Cirebon: dari <strong className="text-white">sol copot / reglue press pabrik, jahit sol keliling benang tanam, resoling tapak gunung/kulit, unyellowing, hingga deep clean</strong>. <strong className="text-amber-400">Kurir Soleman</strong> jemput ke depan pintu rumah Anda dengan <strong className="text-amber-400">pembayaran fleksibel DANA, QRIS, atau COD!</strong>
            </p>

            {/* Key Value Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-medium text-slate-300">
                <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Antar-Jemput se-Cirebon</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-medium text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Garansi Resmi 30-90 Hari</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-medium text-slate-300 col-span-2 sm:col-span-1">
                <QrCode className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Bayar DANA, QRIS & COD</span>
              </div>
            </div>

            {/* Main CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  soundFx.playClick();
                  onOpenBooking();
                }}
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Truck className="w-5 h-5 stroke-[2.3]" />
                <span>Pesan Antar-Jemput Kurir Soleman</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  onExploreServices();
                }}
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-all hover:text-white cursor-pointer"
              >
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>Lihat Semua Jenis Kerusakan</span>
              </button>
            </div>

            {/* Quick Feature Shortcut Pills: Transformasi + Kalkulator + QR DANA + Gemini AI */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => scrollToElement('transformasi')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Galeri Sebelum/Sesudah</span>
              </button>

              <button
                type="button"
                onClick={() => scrollToElement('kalkulator')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-all cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5 text-amber-400" />
                <span>Kalkulator Estimasi Biaya</span>
              </button>

              {onOpenQrModal && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playQrScan();
                    onOpenQrModal();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-950/60 hover:bg-sky-900/60 border border-sky-500/40 text-sky-300 transition-all cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-sky-400" />
                  <span>Kode QR DANA Resmi</span>
                </button>
              )}

              {onOpenWaBot && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    onOpenWaBot();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5 text-amber-400" />
                  <span>Foto Gemini AI</span>
                </button>
              )}
            </div>

            {/* Quick Order Tracker Bar */}
            <div className="pt-2">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl max-w-lg">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Search className="w-3.5 h-3.5 text-amber-400" /> Lacak Kode Seri Sepatu
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Contoh: SLC-3891</span>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={orderQuery}
                    onChange={(e) => setOrderQuery(e.target.value)}
                    placeholder="Masukkan Nomor Seri Sepatu (SLC-3891)..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lacak</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Highlight Card */}
          <div className="lg:col-span-5">
            <div className="relative">
              {/* Outer decorative card */}
              <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 border border-slate-800 shadow-2xl">
                
                {/* Header card */}
                <div className="flex items-start justify-between pb-6 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Workshop Soleman Cirebon</span>
                    <h3 className="text-xl font-bold text-white mt-1">Layanan Antar-Jemput Prioritas</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Area Kota & Kabupaten Cirebon • Kurir Soleman</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Truck className="w-6 h-6" />
                  </div>
                </div>

                {/* Live Process Showcase */}
                <div className="py-6 space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Lokasi Otomatis Lewat WhatsApp</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tulis kecamatan di Cirebon, titik lokasi otomatis dishare langsung lewat fitur Share Loc WhatsApp ke Kurir Soleman tanpa repot ketik alamat atau koordinat.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Pembayaran DANA, QRIS & COD</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Bebas pilih: Scan Kode QR DANA / QRIS resmi semua bank & e-wallet atau bayar tunai COD saat sepatu diantar kembali.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Pengerjaan Presisi & Bergaransi</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Teknisi berpengalaman, lem polyurethane pres manual, jahitan sol wax anti-lepas, dan garansi resmi hingga 90 hari.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Workshop Quick Location Footer */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>Jl. Sukalila Selatan, Cirebon</span>
                  </div>
                  <span className="text-emerald-400 font-bold">Buka Tiap Hari (09.00 - 21.00)</span>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
