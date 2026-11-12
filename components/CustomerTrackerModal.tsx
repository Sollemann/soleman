/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Search, 
  X, 
  MapPin, 
  Truck, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  Phone, 
  Printer, 
  FileText,
  Zap
} from 'lucide-react';
import { Order } from '../types';
import { STATUS_LABELS, WORKSHOP_INFO, getServiceTierDetail } from '../data/solcreftData';
import { soundFx } from '../services/soundEffects';

interface CustomerTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  initialQuery?: string;
}

export const CustomerTrackerModal: React.FC<CustomerTrackerModalProps> = ({
  isOpen,
  onClose,
  orders,
  initialQuery = ''
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);

  // Fungsi pencocokan cerdas: ID angka, SLC-xxxx, nomor telepon, nama
  const findMatchingOrder = (input: string, list: Order[]): Order | undefined => {
    const clean = input.trim().toLowerCase().replace(/^#/, '');
    if (!clean) return undefined;
    const cleanDigits = clean.replace(/[^0-9]/g, '');

    return list.find(o => {
      const oIdLower = o.id.toLowerCase();
      const oIdDigits = o.id.replace(/[^0-9]/g, '');
      const phoneDigits = o.customerPhone.replace(/[^0-9]/g, '');
      const nameLower = o.customerName.toLowerCase();

      // 1. Direct or partial ID (SLC-3891 or 3891)
      if (oIdLower === clean || oIdLower.includes(clean)) return true;
      if (cleanDigits && oIdDigits === cleanDigits) return true;
      // 2. Phone match
      if (cleanDigits && cleanDigits.length >= 4 && (phoneDigits.includes(cleanDigits) || cleanDigits.includes(phoneDigits))) return true;
      // 3. Name match
      if (clean.length >= 3 && nameLower.includes(clean)) return true;
      return false;
    });
  };

  // Otomatis melacak kode seri pesanan saat prop initialQuery berubah atau modal dibuka
  useEffect(() => {
    if (initialQuery.trim()) {
      setQuery(initialQuery.trim());
      const found = findMatchingOrder(initialQuery, orders);
      if (found) {
        setSearchedOrder(found);
      } else if (orders.length > 0) {
        setSearchedOrder(orders[0]);
      }
    } else if (orders.length > 0 && !searchedOrder) {
      setSearchedOrder(orders[0]);
      setQuery(orders[0].id);
    }
  }, [initialQuery, orders]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    if (!query.trim()) {
      setSearchedOrder(null);
      return;
    }

    const found = findMatchingOrder(query, orders);
    if (found) {
      soundFx.playSuccess();
    }
    setSearchedOrder(found || null);
  };

  const steps = [
    { key: 'menunggu_jemput', label: '1. Dijadwalkan' },
    { key: 'perjalanan_workshop', label: '2. Dijemput Kurir' },
    { key: 'pengerjaan', label: '3. Diservis' },
    { key: 'quality_check', label: '4. QC' },
    { key: 'siap_antar', label: '5. Diantar Pulang' },
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
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-cyan-500/40 p-6 sm:p-7 space-y-5 shadow-[0_0_30px_rgba(0,240,255,0.2)] relative my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Pelacakan Otomatis Soleman Cirebon</span>
            </div>
            <h3 className="text-xl font-extrabold text-white mt-1">Status Progres Reparasi Sepatu</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Kode seri terlacak secara otomatis tanpa perlu mengetik ulang.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 text-xl cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search input with Quick Order Suggestions */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Kode Seri (misal: SLC-1234) atau Nomor WA"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-white text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-inner"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/30 cursor-pointer"
          >
            Cari
          </button>
        </form>

        {/* Quick Chip for recent orders if available */}
        {orders.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] text-slate-500 shrink-0">Pesanan Tersimpan:</span>
            {orders.slice(0, 4).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  setQuery(o.id);
                  setSearchedOrder(o);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer shrink-0 ${
                  searchedOrder?.id === o.id
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                #{o.id} ({o.customerName})
              </button>
            ))}
          </div>
        )}

        {/* Order Details View */}
        {searchedOrder ? (
          <div className="space-y-4 pt-2">
            
            {/* Main Order Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider block">
                    ID RESMI: #{searchedOrder.id}
                  </span>
                  <h4 className="text-base font-extrabold text-white">
                    {searchedOrder.shoeBrand} ({searchedOrder.pairsCount} Pasang)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Pelanggan: <strong className="text-slate-200">{searchedOrder.customerName}</strong> • {searchedOrder.location.areaName}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                    {STATUS_LABELS[searchedOrder.status] || searchedOrder.status}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Masuk: {searchedOrder.createdAt}
                  </span>
                </div>
              </div>

              {/* Progress Bar / Steps */}
              <div className="pt-2">
                <div className="grid grid-cols-5 gap-1 text-center">
                  {steps.map((st, i) => {
                    const currentIndex = getStepIndex(searchedOrder.status);
                    const isDone = i <= currentIndex;
                    const isCurrent = i === currentIndex;
                    return (
                      <div key={st.key} className="space-y-1">
                        <div className={`h-1.5 rounded-full transition-all ${
                          isDone 
                            ? 'bg-gradient-to-r from-cyan-400 to-sky-300 shadow-[0_0_8px_rgba(0,240,255,0.4)]' 
                            : 'bg-slate-800'
                        }`} />
                        <span className={`text-[10px] block font-bold ${
                          isCurrent 
                            ? 'text-cyan-300 font-extrabold' 
                            : isDone 
                              ? 'text-slate-300' 
                              : 'text-slate-600'
                        }`}>
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Courier & Payment Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Truck className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Kurir: <strong className="text-white">{searchedOrder.assignedCourier || 'Kurir Soleman'}</strong></span>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 text-slate-300">
                  <span>Total Tagihan:</span>
                  <span className="font-extrabold text-cyan-300">
                    Rp {searchedOrder.totalAmount.toLocaleString('id-ID')} ({searchedOrder.paymentMethod.toUpperCase()})
                  </span>
                </div>
              </div>

              {/* Location & Action Bar */}
              <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-start gap-1.5 text-slate-300">
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] text-slate-400 block">Titik Antar-Jemput:</span>
                    <span className="text-white font-medium text-xs">
                      {searchedOrder.location.fullAddress || searchedOrder.location.areaName}
                    </span>
                    {searchedOrder.location.lat && searchedOrder.location.lng && (
                      <a
                        href={searchedOrder.location.mapsUrl || `https://www.google.com/maps?q=${searchedOrder.location.lat},${searchedOrder.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-cyan-400 hover:underline block font-semibold mt-0.5"
                      >
                        📍 Buka di Google Maps
                      </a>
                    )}
                  </div>
                </div>

                <a
                  href={`https://wa.me/62${(searchedOrder.assignedCourierPhone || '08814519955').replace(/^0/, '')}?text=${encodeURIComponent(`Halo Kurir Soleman, saya ${searchedOrder.customerName} ingin menanyakan penjemputan/pengantaran sepatu #${searchedOrder.id} di ${searchedOrder.location.areaName}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs inline-flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 shrink-0 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat Kurir WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 block">Riwayat & Timeline:</span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {searchedOrder.timeline && searchedOrder.timeline.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{item.label}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{item.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center py-8 bg-slate-950/40 rounded-2xl border border-slate-800">
            <Search className="w-8 h-8 text-cyan-400/50 mx-auto mb-2" />
            <p className="text-xs text-slate-400">
              {query ? `Pesanan dengan kode "${query}" tidak ditemukan.` : 'Belum ada pesanan yang dipilih.'}
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
