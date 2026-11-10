/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  Phone, 
  ExternalLink, 
  Truck, 
  ShieldCheck, 
  Navigation,
  MessageSquare,
  QrCode,
  Wallet,
  Share2,
  Copy,
  Check,
  Compass
} from 'lucide-react';
import { WORKSHOP_INFO, CIREBON_AREAS } from '../data/solcreftData';
import { buildConsultationWhatsAppUrl } from '../services/whatsappHelper';
import { SolemanQrModal } from './SolemanQrModal';
import { soundFx } from '../services/soundEffects';

export const WorkshopLocationSection: React.FC = () => {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);

  const handleCopyCoordinates = () => {
    soundFx.playClick();
    navigator.clipboard.writeText(`${WORKSHOP_INFO.lat}, ${WORKSHOP_INFO.lng}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2500);
  };

  return (
    <section id="workshop" className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <MapPin className="w-3.5 h-3.5" />
          <span>Workshop Fisik & Jangkauan Antar-Jemput</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
          Kunjungi Workshop Soleman <br />
          <span className="text-amber-400">Sukalila Selatan, Kota Cirebon</span>
        </h2>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Workshop kami berlokasi di kawasan Sukalila Selatan, pusat perdagangan Kota Cirebon (dekat Karanggetas & Pasar Pagi PGC). Melayani drop-off langsung dan penjemputan kurir ke seluruh penjuru Cirebon.
        </p>
      </div>

      {/* Featured QR Code Banner / Quick Scan Bar */}
      <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-950/70 via-slate-900 to-amber-950/40 border border-sky-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black shadow-lg shadow-sky-500/30 shrink-0">
            <QrCode className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-white">Kode QR DANA & Transfer Workshop</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold font-mono">
                62-8814***9955
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Pindai kode QR untuk pembayaran DANA, QRIS, atau simpan kontak resmi Soleman Shoes Repair.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFx.playQrScan();
            setIsQrModalOpen(true);
          }}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-sky-500/20 cursor-pointer active:scale-95"
        >
          <QrCode className="w-4 h-4 stroke-[2.5]" />
          <span>Buka Kode QR DANA</span>
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Workshop Details & Navigations (6 cols) */}
        <div className="lg:col-span-6 rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Alamat Workshop</span>
              <p className="text-xs text-slate-400 mt-1">{WORKSHOP_INFO.tagline}</p>
            </div>

            {/* Quick Landmark Proximities */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300">
                <span className="text-amber-400 font-bold block">📍 3 Menit:</span>
                Pasar Pagi & PGC Cirebon
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300">
                <span className="text-amber-400 font-bold block">📍 4 Menit:</span>
                Sentra Karanggetas
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300">
                <span className="text-sky-400 font-bold block">📍 7 Menit:</span>
                Stasiun Cirebon Kejaksan
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300">
                <span className="text-sky-400 font-bold block">📍 10 Menit:</span>
                CSB Mall & Grage Mall
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <MapPin className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Alamat Lengkap:</strong>
                  <span className="text-slate-300 leading-relaxed font-semibold">{WORKSHOP_INFO.address}</span>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyCoordinates}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCoords ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCoords ? 'Koordinat Tersalin!' : 'Salin Koordinat GPS'}</span>
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono">-6.7175, 108.5630</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <Clock className="w-5 h-5 text-sky-400 shrink-0" />
                <div>
                  <strong className="text-white block mb-0.5">Jam Operasional:</strong>
                  <span className="text-slate-300">{WORKSHOP_INFO.operatingHours}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <Phone className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <strong className="text-white block mb-0.5">Kontak WhatsApp Admin:</strong>
                  <span className="text-slate-300">{WORKSHOP_INFO.phoneFormatted} (Fast Response)</span>
                </div>
              </div>

              {/* DANA & Payment Info */}
              <div 
                onClick={() => {
                  soundFx.playQrScan();
                  setIsQrModalOpen(true);
                }}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-sky-950/40 border border-sky-500/30 hover:border-sky-400 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block text-xs">Akun DANA Resmi:</strong>
                    <span className="text-sky-300 font-mono text-[11px]">0881-4519-955 (Soleman Shoes)</span>
                  </div>
                </div>
                <span className="text-[11px] text-sky-400 group-hover:underline font-bold flex items-center gap-1">
                  Lihat QR →
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <a
                href={WORKSHOP_INFO.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md transition-all text-center cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>Rute Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href="https://waze.com/ul?ll=-6.7175,108.5630&navigate=yes"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all text-center cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Buka di Waze</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <a
              href={buildConsultationWhatsAppUrl('Halo Admin Soleman, saya ingin share lokasi atau minta panduan jalan ke workshop Sukalila Selatan.')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition-all text-center cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat Panduan Rute via WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Right Column: Coverage Area Cirebon (6 cols) */}
        <div className="lg:col-span-6 rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Jangkauan Wilayah</span>
                <h3 className="text-xl font-bold text-white mt-1">Area Antar-Jemput Cirebon</h3>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Kurir Soleman beroperasi setiap hari dari workshop Sukalila Selatan menjemput dan mengantar sepatu ke kecamatan se-Cirebon:
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
              {CIREBON_AREAS.map((area, idx) => (
                <div 
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="truncate pr-1">
                    <span className="font-semibold text-white truncate block">{area.name.split('(')[0]}</span>
                    <span className="text-[10px] text-slate-500">{area.type} Cirebon</span>
                  </div>
                  <span className="text-[11px] font-mono text-amber-400 shrink-0 font-medium">
                    Rp {area.deliveryFee.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 shrink-0 text-amber-400" />
            <div>
              <span className="font-bold block text-white">Promo Khusus Warga Cirebon:</span>
              Antar-Jemput <strong className="text-amber-400 font-extrabold underline">GRATIS</strong> untuk order minimal 2 pasang sepatu di semua kecamatan di atas!
            </div>
          </div>

        </div>

      </div>

      {/* Embedded Soleman QR Modal */}
      <SolemanQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />

    </section>
  );
};
