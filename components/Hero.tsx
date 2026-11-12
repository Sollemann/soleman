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
  QrCode,
  Calculator,
  CheckCircle2
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
    <section className="relative overflow-hidden pt-8 pb-12 lg:pt-12 lg:pb-16 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Headlines & Action */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
              <span className="flex h-2 w-2 rounded-full bg-sky-400" />
              <span>Layanan Antar-Jemput Sepatu Se-Cirebon</span>
              <span className="text-slate-600">•</span>
              <span className="text-sky-400 font-semibold flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" /> Gratis Ongkir Kota • Kab. 15k
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Sepatu Rusak & Menganga? <br />
              <span className="text-sky-400">Soleman Kembalikan</span> Kuat Seperti Baru.
            </h1>

            {/* Subtitle */}
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              Layanan reparasi sepatu resmi di Cirebon: sol copot, jahit sol tanam rapi tidak terlihat, ganti tapak baru, unyellowing, hingga recolor. Kurir siap jemput ke rumah Anda dengan <strong className="text-sky-400 font-semibold">GRATIS ONGKIR khusus Kota Cirebon</strong> (Kabupaten Rp 15.000).
            </p>

            {/* Key Value Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <Truck className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Gratis Ongkir Kota Cirebon</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Garansi Resmi 30-90 Hari</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <QrCode className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Bayar QRIS DANA & COD</span>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  soundFx.playClick();
                  onOpenBooking();
                }}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-md hover:shadow-sky-900/30 transition-all cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Pesan Antar-Jemput Sepatu</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  onExploreServices();
                }}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:text-white transition-all cursor-pointer"
              >
                <Wrench className="w-4 h-4 text-slate-400" />
                <span>Lihat Katalog Kerusakan</span>
              </button>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onExploreServices();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/70 text-cyan-300 transition-colors cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pilih Kerusakan Sepatu Anda</span>
              </button>

              <button
                type="button"
                onClick={() => scrollToElement('kalkulator')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/70 text-slate-300 transition-colors cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5 text-sky-400" />
                <span>Kalkulator Estimasi Biaya</span>
              </button>

              {onOpenQrModal && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playQrScan();
                    onOpenQrModal();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/70 text-slate-300 transition-colors cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-sky-400" />
                  <span>Kode QR DANA Resmi</span>
                </button>
              )}
            </div>

            {/* Quick Order Tracker Bar */}
            <div className="pt-1">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/70 max-w-lg shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5 text-slate-200 font-semibold">
                    <Search className="w-3.5 h-3.5 text-cyan-400" /> Lacak Status Sepatu Anda
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Misal: 3891 / SLC-3891</span>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={orderQuery}
                    onChange={(e) => setOrderQuery(e.target.value)}
                    placeholder="Masukkan Nomor Seri Sepatu..."
                    className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-xs rounded-lg transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lacak</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </form>
              </div>
            </div>

          </div>

          {/* Right Column: Clean Repair Solutions Showcase */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-slate-900/90 border border-cyan-500/25 p-6 space-y-4 shadow-xl backdrop-blur-sm">
              <div className="flex items-start justify-between pb-3 border-b border-slate-800/80">
                <div>
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Spesialis Reparasi Cirebon</span>
                  <h3 className="text-base font-extrabold text-white mt-0.5">Solusi Tuntas Kerusakan Sepatu</h3>
                  <p className="text-xs text-slate-400">Pengerjaan rapi standar pabrik & bergaransi</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Wrench className="w-5 h-5" />
                </div>
              </div>

              {/* Top Service Categories */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div 
                  onClick={() => {
                    soundFx.playClick();
                    onExploreServices();
                  }}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group"
                >
                  <span className="text-base block mb-1">🪡</span>
                  <h4 className="font-bold text-white group-hover:text-cyan-300 transition-colors">Jahit Sol Tanam</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Benang nilon tersembunyi, kuat & anti jebol</p>
                </div>

                <div 
                  onClick={() => {
                    soundFx.playClick();
                    onExploreServices();
                  }}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group"
                >
                  <span className="text-base block mb-1">👟</span>
                  <h4 className="font-bold text-white group-hover:text-cyan-300 transition-colors">Ganti Tapak Sol</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Outsole baru anti licin, sekolah, futsal & kantor</p>
                </div>

                <div 
                  onClick={() => {
                    soundFx.playClick();
                    onExploreServices();
                  }}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group"
                >
                  <span className="text-base block mb-1">✨</span>
                  <h4 className="font-bold text-white group-hover:text-cyan-300 transition-colors">Treatment & Cuci</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Unyellowing UV, repaint warna baru & deep clean</p>
                </div>

                <div 
                  onClick={() => {
                    soundFx.playClick();
                    onExploreServices();
                  }}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group"
                >
                  <span className="text-base block mb-1">🛠️</span>
                  <h4 className="font-bold text-white group-hover:text-cyan-300 transition-colors">Rekonstruksi Busa</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Busa tumit anti lecet & tambal kain upper</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    onExploreServices();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-sky-500/20 hover:from-cyan-500/30 hover:to-sky-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <span>Pilih Sesuai Kerusakan Sepatu Anda di Bawah</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-cyan-400 font-medium">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Gratis Jemput Kota Cirebon</span>
                </div>
                <span className="text-emerald-400 font-medium">Garansi 30-90 Hari</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
