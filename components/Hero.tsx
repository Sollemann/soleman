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
              <span>Workshop Sukalila Selatan, Kota Cirebon</span>
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
                onClick={() => scrollToElement('transformasi')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Hasil Sebelum & Sesudah</span>
              </button>

              <button
                type="button"
                onClick={() => scrollToElement('kalkulator')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors cursor-pointer"
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-sky-400" />
                  <span>Kode QR DANA Resmi</span>
                </button>
              )}
            </div>

            {/* Quick Order Tracker Bar */}
            <div className="pt-1">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 max-w-lg">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5 text-slate-200 font-semibold">
                    <Search className="w-3.5 h-3.5 text-sky-400" /> Lacak Status Sepatu Anda
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Misal: SLC-3891</span>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={orderQuery}
                    onChange={(e) => setOrderQuery(e.target.value)}
                    placeholder="Masukkan Nomor Seri Sepatu..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-lg transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lacak</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

          </div>

          {/* Right Column: Clean & Simple Process Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-sm">
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-sky-400 uppercase tracking-wide">3 Langkah Praktis</span>
                  <h3 className="text-base font-bold text-white mt-0.5">Cara Antar-Jemput Sepatu</h3>
                  <p className="text-xs text-slate-400">Wilayah Cirebon Kota & Kabupaten</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Truck className="w-4 h-4" />
                </div>
              </div>

              {/* 3 Steps */}
              <div className="space-y-3.5 py-1 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-sky-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Unggah Foto & Pilih Layanan</h4>
                    <p className="text-slate-400 mt-0.5 text-[11px] leading-relaxed">
                      Kirim foto sepatu Anda, sistem kami langsung mendeteksi tingkat kerusakan secara otomatis.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-sky-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Kurir Menjemput Sepatu</h4>
                    <p className="text-slate-400 mt-0.5 text-[11px] leading-relaxed">
                      Gratis ongkir untuk 5 kecamatan Kota Cirebon, atau flat Rp 15.000 untuk wilayah Kabupaten.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-sky-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Selesai, Bergaransi & Antar Kembali</h4>
                    <p className="text-slate-400 mt-0.5 text-[11px] leading-relaxed">
                      Sepatu kembali rapi dengan garansi resmi 30-90 hari. Pembayaran via QRIS DANA atau COD.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>Jl. Sukalila Selatan, Kota Cirebon</span>
                </div>
                <span className="text-emerald-400 font-medium">Buka Tiap Hari</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
