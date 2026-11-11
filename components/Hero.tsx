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
  Search, 
  ArrowRight, 
  Sparkles,
  Zap,
  QrCode,
  Calculator
} from 'lucide-react';
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
  onOpenQrModal
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
    <section className="relative overflow-hidden pt-8 pb-14 lg:pt-14 lg:pb-20 border-b border-cyan-500/20">
      {/* Background Ice Neon ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-cyan-500/15 via-blue-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -top-32 right-10 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Headlines & Action */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-400/30 text-cyan-300 text-xs font-semibold shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Workshop Sukalila Selatan Kota Cirebon</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-cyan-400" /> Gratis Ongkir Kota • Kabupaten 15k
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1] font-display">
              Sepatu Rusak & Mangap? <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 neon-glow-cyan">
                Soleman Kembalikan
              </span> <br />
              Kuat Seperti Baru.
            </h1>

            {/* Subtitle */}
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              Spesialis reparasi sepatu terpercaya di Cirebon: <strong className="text-white">sol copot, jahit sol benang tanam tidak terlihat, resoling tapak trail/gunung/kulit, hingga unyellowing</strong>. Kurir siap jemput ke rumah Anda dengan <strong className="text-cyan-300">GRATIS ONGKIR khusus wilayah Kota Cirebon</strong> (Kabupaten 15k) dan bayar fleksibel via QRIS atau COD!
            </p>

            {/* Key Value Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/20 text-xs font-medium text-slate-200">
                <Truck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Gratis Ongkir Kota Cirebon</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/20 text-xs font-medium text-slate-200">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Garansi Resmi 30-90 Hari</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/20 text-xs font-medium text-slate-200 col-span-2 sm:col-span-1">
                <QrCode className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Bayar QRIS & COD Tunai</span>
              </div>
            </div>

            {/* Main CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  soundFx.playClick();
                  onOpenBooking();
                }}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-black text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-sky-300 shadow-xl shadow-cyan-400/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Truck className="w-5 h-5 stroke-[2.3]" />
                <span>Pesan Antar-Jemput (Gratis Kota / 15k Kab.)</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  onExploreServices();
                }}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 transition-all hover:text-white cursor-pointer"
              >
                <Wrench className="w-4 h-4 text-cyan-400" />
                <span>Lihat Menu Kerusakan</span>
              </button>
            </div>

            {/* Quick Feature Shortcut Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => scrollToElement('transformasi')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-950/40 hover:bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Foto Sebelum/Sesudah</span>
              </button>

              <button
                type="button"
                onClick={() => scrollToElement('kalkulator')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                <span>Kalkulator Estimasi Biaya</span>
              </button>

              {onOpenQrModal && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playQrScan();
                    onOpenQrModal();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Kode QR DANA Resmi</span>
                </button>
              )}
            </div>

            {/* Quick Order Tracker Bar */}
            <div className="pt-1">
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-lg max-w-lg">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                    <Search className="w-3.5 h-3.5 text-cyan-400" /> Lacak Kode Seri Sepatu Otomatis
                  </span>
                  <span className="text-[11px] text-cyan-400/80 font-mono">Misal: SLC-3891</span>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={orderQuery}
                    onChange={(e) => setOrderQuery(e.target.value)}
                    placeholder="Masukkan Nomor Seri Sepatu..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 shadow-inner"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl transition-all shrink-0 flex items-center gap-1 cursor-pointer shadow-md shadow-cyan-500/30"
                  >
                    <span>Lacak</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

          </div>

          {/* Right Column: Clean Process Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-slate-900/90 border border-cyan-500/30 p-6 sm:p-7 shadow-[0_0_30px_rgba(0,240,255,0.15)] space-y-4">
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[11px] font-black text-cyan-400 uppercase tracking-widest">Workshop Soleman Cirebon</span>
                  <h3 className="text-lg font-black text-white mt-0.5">Antar-Jemput Mudah & Praktis</h3>
                  <p className="text-xs text-slate-400">Area Kota & Kabupaten Cirebon • Ongkir 15k</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                  <Truck className="w-5 h-5" />
                </div>
              </div>

              {/* 3 Step Process */}
              <div className="space-y-3.5 py-1">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Foto & Pilih Kerusakan</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Unggah foto sepatu, tingkat kerusakan langsung terdeteksi otomatis oleh sistem.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Kurir Jemput ke Lokasi (Ongkir 15k)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Pilih kecamatan di Cirebon, kurir menjemput sesuai urutan rute terdekat.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Bayar QRIS atau COD saat Selesai</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Sepatu selesai diperbaiki dengan garansi 30-90 hari resmi workshop Sukalila.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Jl. Sukalila Selatan, Pekalipan Cirebon</span>
                </div>
                <span className="text-cyan-300 font-bold">Buka Tiap Hari</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
