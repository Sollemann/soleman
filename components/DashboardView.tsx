/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Truck, 
  MessageSquare, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Lock, 
  CreditCard, 
  DollarSign, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  Phone,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { STATUS_LABELS, WORKSHOP_INFO, getServiceTierDetail } from '../data/solcreftData';
import { buildConsultationWhatsAppUrl } from '../services/whatsappHelper';

interface DashboardViewProps {
  orders: Order[];
  onOpenBooking: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  onOpenBooking
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchQuery.trim().toLowerCase();
    setHasSearched(true);
    if (!clean) {
      setFoundOrder(null);
      return;
    }

    const matched = orders.find(o => 
      o.id.toLowerCase() === clean || 
      o.customerPhone.replace(/[^0-9]/g, '') === clean.replace(/[^0-9]/g, '') ||
      o.customerPhone.toLowerCase() === clean
    );

    setFoundOrder(matched || null);
  };

  const handleQuickChipClick = (code: string) => {
    setSearchQuery(code);
    setHasSearched(true);
    const matched = orders.find(o => o.id.toLowerCase() === code.toLowerCase());
    setFoundOrder(matched || null);
  };

  const steps = [
    { key: 'menunggu_jemput', label: '1. Jadwal Jemput' },
    { key: 'perjalanan_workshop', label: '2. Dijemput Kurir Soleman' },
    { key: 'pengerjaan', label: '3. Diservis di Workshop' },
    { key: 'quality_check', label: '4. Quality Control Lolos' },
    { key: 'siap_antar', label: '5. Diantar Kurir Soleman' },
  ];

  const getStepIndex = (status: Order['status']) => {
    switch (status) {
      case 'menunggu_jemput': return 0;
      case 'perjalanan_workshop': return 1;
      case 'pengerjaan': return 2;
      case 'quality_check': return 3;
      case 'siap_antar': return 4;
      case 'selesai': return 5;
      default: return 0;
    }
  };

  return (
    <section id="dashboard" className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
          <Search className="w-3.5 h-3.5" />
          <span>Lacak Progres Reparasi Sepatu Anda</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-white font-display">
          Cek Status Pengerjaan Sepatu Soleman
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Demi menjaga privasi Anda, data pesanan tidak ditampilkan secara terbuka. Silakan masukkan kode seri pesanan untuk melihat detail pengerjaan & update Kurir Soleman.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mt-8 max-w-2xl mx-auto">
        <div className="p-3 sm:p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-3">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik Kode Seri Order (misal: SLC-3891) atau No. WhatsApp..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-xs rounded-2xl shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>Cari Status</span>
            </button>
          </form>

          {/* Quick test chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
            <span className="text-[11px] font-semibold text-slate-500">Coba kode contoh:</span>
            {['SLC-3891', 'SLC-3892', 'SLC-3893'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => handleQuickChipClick(code)}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-300 font-mono text-[11px] border border-slate-800 transition-colors"
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result Section */}
      <div className="mt-8 max-w-4xl mx-auto">
        {foundOrder ? (
          <div className="rounded-3xl bg-slate-900 border border-amber-500/40 p-6 sm:p-8 shadow-2xl space-y-6">
            
            {/* Header Result */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-black text-sm rounded-xl">
                  #{foundOrder.id}
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <span>{foundOrder.shoeBrand}</span>
                    <span className="text-xs text-amber-400 font-normal">({foundOrder.pairsCount} Pasang)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pemilik: <strong className="text-slate-200">{foundOrder.customerName}</strong> • Sesi: {foundOrder.preferredTimeSlot.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className={`inline-block px-3.5 py-1 rounded-full text-xs font-bold border ${STATUS_LABELS[foundOrder.status].badgeBg}`}>
                  {STATUS_LABELS[foundOrder.status].label}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Est. Selesai: <strong className="text-slate-200">{foundOrder.estimatedFinishedAt}</strong>
                </p>
              </div>
            </div>

            {/* Stepper Progres */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Tahapan Progres Pengerjaan:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                {steps.map((st, index) => {
                  const currentIdx = getStepIndex(foundOrder.status);
                  const isDone = index <= currentIdx;
                  const isCurrent = index === currentIdx;

                  return (
                    <div
                      key={st.key}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        isCurrent
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-lg shadow-amber-500/10'
                          : isDone
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-950/40 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div className="flex justify-center mb-1.5">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                      <span className="text-[10px] block leading-tight font-semibold">{st.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rincian Layanan & Pembayaran */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card 1: Kerusakan & Layanan */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5" /> Layanan Yang Dikerjakan
                </span>

                <div className="space-y-2.5 text-xs">
                  {foundOrder.selectedServices.map((s) => {
                    const orderSev = foundOrder.severity || (foundOrder.shoes && foundOrder.shoes[0]?.severity) || 'normal';
                    const tier = getServiceTierDetail(s, orderSev);
                    return (
                      <div key={s.id} className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between text-slate-200 font-bold">
                          <span>• {s.name}</span>
                          <span className="text-amber-400 font-mono font-bold">{tier.priceFormatted}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-amber-300/90 font-semibold">{tier.badge}: {tier.label}</span>
                          <span className="text-slate-500">{tier.durationEst}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">{tier.damageDesc}</p>
                      </div>
                    );
                  })}

                  {foundOrder.customNotes && (
                    <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 italic">
                      "{foundOrder.customNotes}"
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-xs">
                    <span className="text-slate-400">Total Biaya Servis:</span>
                    <span className="text-amber-400 font-mono text-sm">
                      Rp {foundOrder.totalAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Pengiriman & Pembayaran */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" /> Kurir & Pembayaran
                </span>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Kurir Ditugaskan:</span>
                    <span className="text-white font-bold">{foundOrder.assignedCourier || 'Kurir Soleman'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Wilayah Antar-Jemput:</span>
                    <span className="text-slate-200">{foundOrder.location.areaName}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Ongkir Cirebon:</span>
                    <span className="text-emerald-400 font-bold">
                      {foundOrder.deliveryFee === 0 ? 'GRATIS ONGKIR' : `Rp ${foundOrder.deliveryFee.toLocaleString('id-ID')}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-slate-400">Metode Pembayaran:</span>
                    <span className="text-amber-400 font-bold uppercase flex items-center gap-1">
                      {foundOrder.paymentMethod === 'cod' ? (
                        <>
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>COD (Bayar Tunai ke Kurir)</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>QRIS Instan Resmi</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Riwayat Catatan Timeline */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Riwayat Update Pengerjaan:
              </span>
              <div className="space-y-2.5 pl-2 border-l-2 border-slate-800">
                {foundOrder.timeline.map((item, idx) => (
                  <div key={idx} className="relative pl-4 space-y-0.5">
                    <span className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-slate-900" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">{item.label}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{item.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-400">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hubungi Soleman Button */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <a
                href={buildConsultationWhatsAppUrl(`Order #${foundOrder.id} - ${foundOrder.shoeBrand}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Konsultasi Progres ke Admin Soleman via WhatsApp</span>
              </a>

              <button
                onClick={() => { setFoundOrder(null); setSearchQuery(''); setHasSearched(false); }}
                className="px-5 py-3 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white"
              >
                Lacak Order Lain
              </button>
            </div>

          </div>
        ) : hasSearched ? (
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="text-white font-bold text-base">
              Tidak Ditemukan Data Pesanan untuk "{searchQuery}"
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Pastikan kode seri yang Anda masukkan sesuai (contoh format: <strong className="text-amber-300">SLC-3891</strong>) atau masukkan nomor WhatsApp yang Anda gunakan saat booking antar-jemput.
            </p>
          </div>
        ) : (
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/60 border border-slate-800/80 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h4 className="text-white font-bold text-base">
                Data Pesanan Pelanggan Dijaga Privasinya
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Untuk melihat status sepatu, rincian biaya, atau jadwal Kurir Soleman, masukkan nomor kode seri pesanan Anda di atas.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenBooking}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-all"
              >
                <Truck className="w-4 h-4" />
                <span>Belum Punya Order? Pesan Antar-Jemput Sekarang</span>
              </button>
            </div>
          </div>
        )}
      </div>

    </section>
  );
};
