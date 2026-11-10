/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  ExternalLink,
  Phone,
  DollarSign,
  CreditCard,
  QrCode,
  Lock,
  Printer,
  FileText,
  Share2,
  Award
} from 'lucide-react';
import { Order } from '../types';
import { STATUS_LABELS, WORKSHOP_INFO, getServiceTierDetail } from '../data/solcreftData';
import { buildConsultationWhatsAppUrl } from '../services/whatsappHelper';
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
  const [hasSearched, setHasSearched] = useState(Boolean(initialQuery));
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(() => {
    if (initialQuery.trim()) {
      const clean = initialQuery.trim().toLowerCase();
      return orders.find(o => 
        o.id.toLowerCase() === clean || 
        o.customerPhone.replace(/[^0-9]/g, '').includes(clean)
      ) || null;
    }
    return null;
  });

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptQrUrl, setReceiptQrUrl] = useState<string>('');

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    const clean = query.trim().toLowerCase();
    setHasSearched(true);
    if (!clean) {
      setSearchedOrder(null);
      return;
    }

    const found = orders.find(o => 
      o.id.toLowerCase() === clean || 
      o.customerPhone.replace(/[^0-9]/g, '') === clean.replace(/[^0-9]/g, '') ||
      o.customerPhone.toLowerCase() === clean
    );
    if (found) {
      soundFx.playSuccess();
    }
    setSearchedOrder(found || null);
  };

  const handleOpenReceipt = async () => {
    soundFx.playClick();
    if (!searchedOrder) return;
    try {
      const qrData = `https://wa.me/628814519955?text=Verifikasi+Garansi+Resi+${searchedOrder.id}+Soleman+Sukalila+Cirebon`;
      const url = await QRCode.toDataURL(qrData, { width: 180, margin: 1 });
      setReceiptQrUrl(url);
    } catch {
      setReceiptQrUrl('');
    }
    setShowReceiptModal(true);
  };

  const handlePrintReceipt = () => {
    soundFx.playSuccess();
    window.print();
  };

  const steps = [
    { key: 'menunggu_jemput', label: '1. Dijadwalkan' },
    { key: 'perjalanan_workshop', label: '2. Dijemput Kurir Soleman' },
    { key: 'pengerjaan', label: '3. Diservis Teknisi' },
    { key: 'quality_check', label: '4. Quality Control' },
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
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700 p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
          
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Search className="w-3.5 h-3.5" /> Lacak Status Sepatu Anda
              </div>
              <h3 className="text-xl font-extrabold text-white mt-1">Status Progres Reparasi Soleman</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Masukkan nomor kode seri order untuk menampilkan data reparasi sepatu Anda.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 text-xl cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search input */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Masukkan No. Order (misal: SLC-3891) atau No. WhatsApp..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shrink-0 cursor-pointer"
            >
              Cari Status
            </button>
          </form>

          {/* Quick query chips */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
            <span>Contoh Kode Seri:</span>
            {['SLC-3891', 'SLC-3892', 'SLC-3893'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setQuery(code);
                  const found = orders.find(o => o.id.toLowerCase() === code.toLowerCase());
                  setSearchedOrder(found || null);
                  setHasSearched(true);
                }}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-[10px] border border-slate-700 transition-colors cursor-pointer"
              >
                {code}
              </button>
            ))}
          </div>

          {searchedOrder ? (
            <div className="space-y-6 pt-2">
              
              {/* Top Order Badge & Info */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono font-bold text-amber-400">Order #{searchedOrder.id}</span>
                  <h4 className="text-base font-bold text-white mt-0.5">{searchedOrder.shoeBrand}</h4>
                  <p className="text-xs text-slate-400">
                    Pemilik: {searchedOrder.customerName} • {searchedOrder.pairsCount} Pasang
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${STATUS_LABELS[searchedOrder.status].badgeBg}`}>
                    {STATUS_LABELS[searchedOrder.status].label}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Est. Selesai: <strong className="text-slate-200">{searchedOrder.estimatedFinishedAt}</strong>
                  </p>
                </div>
              </div>

              {/* Stepper Progres Visual */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tahapan Progres Pengerjaan:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                  {steps.map((st, index) => {
                    const currentIdx = getStepIndex(searchedOrder.status);
                    const isDone = index <= currentIdx;
                    const isCurrent = index === currentIdx;

                    return (
                      <div
                        key={st.key}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isCurrent
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                            : isDone
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400'
                            : 'bg-slate-950/40 border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="flex justify-center mb-1">
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

              {/* Official Digital Receipt & Warranty Banner CTA */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-sky-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                    <FileText className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white">Struk & Kartu Garansi Digital Resmi</h5>
                    <p className="text-[11px] text-slate-300">
                      Tanda terima elektronik lengkap dengan QR verifikasi & stempel garansi Sukalila Cirebon.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenReceipt}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-md cursor-pointer active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Lihat & Cetak Struk</span>
                </button>
              </div>

              {/* Payment & Courier Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" /> Metode Pembayaran:
                  </span>
                  <p className="text-slate-200 font-semibold">
                    {searchedOrder.paymentMethod === 'cod' ? 'COD (Bayar Tunai ke Kurir Soleman)' : 'QRIS / DANA Resmi Soleman Cirebon'}
                  </p>
                  <p className="text-[11px] text-amber-300 font-mono">
                    Total Biaya: Rp {searchedOrder.totalAmount.toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-sky-400" /> Kurir Ditugaskan:
                  </span>
                  <p className="text-slate-200 font-semibold">
                    {searchedOrder.assignedCourier || 'Kurir Soleman'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Antar-Jemput: {searchedOrder.location.areaName}
                  </p>
                </div>
              </div>

              {/* Multi-shoe breakdown */}
              {searchedOrder.shoes && searchedOrder.shoes.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Rincian Kerusakan & Harga ({searchedOrder.shoes.length} Pasang Sepatu):
                  </span>
                  <div className="space-y-2.5">
                    {searchedOrder.shoes.map((sh, idx) => {
                      const sevBadge = sh.severity === 'kecil'
                        ? { text: 'Ringan (Sebagian)', cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' }
                        : sh.severity === 'hard'
                        ? { text: 'Berat / Parah', cls: 'text-red-300 bg-red-500/10 border-red-500/30' }
                        : { text: 'Sedang (Standar)', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/30' };
                      return (
                        <div key={sh.id || idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-white">#{idx + 1} {sh.shoeBrand}</span>
                            <span className="text-amber-400 font-mono">Rp {sh.price.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-400">
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">{sh.shoeType}</span>
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">{sh.material}</span>
                            <span className={`px-2 py-0.5 rounded border font-bold ${sevBadge.cls}`}>Tingkat: {sevBadge.text}</span>
                          </div>
                          <div className="space-y-1.5 pt-1 border-t border-slate-900">
                            {sh.selectedServices.map(s => {
                              const tier = getServiceTierDetail(s, sh.severity);
                              return (
                                <div key={s.id} className="flex items-start justify-between gap-2 text-[11px]">
                                  <div>
                                    <span className="font-semibold text-slate-200">{s.name}</span>
                                    <span className="text-[10px] text-amber-300 ml-1.5">({tier.label})</span>
                                    <p className="text-[10px] text-slate-500">{tier.damageDesc}</p>
                                  </div>
                                  <span className="font-mono font-bold text-slate-300 shrink-0">{tier.priceFormatted}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Timeline history */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Catatan Riwayat Servis:
                </span>
                <div className="space-y-2.5 pl-2 border-l-2 border-slate-800">
                  {searchedOrder.timeline.map((item, idx) => (
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

              {/* WA Help Button */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <a
                  href={buildConsultationWhatsAppUrl(`Order #${searchedOrder.id} - ${searchedOrder.shoeBrand}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Tanya Status ke Admin via WA</span>
                </a>

                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                >
                  Tutup
                </button>
              </div>

            </div>
          ) : hasSearched ? (
            <div className="text-center py-10 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
              <Lock className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-sm font-bold text-slate-200">
                Tidak ditemukan data order dengan kata kunci "{query}".
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Pastikan format kode seri benar (contoh: SLC-3891) atau masukkan nomor WhatsApp pemesanan Anda.
              </p>
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
              <Lock className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs font-semibold text-slate-300">
                Privasi Terjaga
              </p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Ketikkan nomor kode seri order sepatu Anda di kolom pencarian di atas untuk melihat status pengerjaan secara privat.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Printable Digital Receipt & Warranty Modal */}
      {showReceiptModal && searchedOrder && (
        <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
          <div className="w-full max-w-lg bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-slate-200 my-auto print:border-none print:shadow-none print:max-w-none print:p-4">
            
            {/* Close button (Hidden during print) */}
            <button
              onClick={() => setShowReceiptModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors print:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / Kop Workshop */}
            <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 space-y-1">
              <span className="text-[11px] font-black tracking-widest text-amber-600 uppercase">
                TANDA TERIMA ELEKTRONIK & KARTU GARANSI
              </span>
              <h3 className="text-xl font-black text-slate-950 tracking-tight">
                {WORKSHOP_INFO.name.toUpperCase()}
              </h3>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                {WORKSHOP_INFO.address}
              </p>
              <p className="text-[11px] font-mono text-slate-700">
                WhatsApp: {WORKSHOP_INFO.phoneFormatted} • Instagram: {WORKSHOP_INFO.instagram}
              </p>
            </div>

            {/* Order Identity & Meta */}
            <div className="py-4 border-b border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-600">Nomor Tanda Terima:</span>
                <span className="text-slate-950 font-mono text-sm">#{searchedOrder.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Nama Pelanggan:</span>
                <span className="font-semibold text-slate-900">{searchedOrder.customerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">No. WhatsApp:</span>
                <span className="font-mono text-slate-800">{searchedOrder.customerPhone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Alamat Antar-Jemput:</span>
                <span className="font-medium text-slate-800 text-right max-w-[220px] truncate">{searchedOrder.location.areaName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Kurir Pengantar:</span>
                <span className="font-medium text-slate-800">{searchedOrder.assignedCourier || 'Armada Kurir Soleman'}</span>
              </div>
            </div>

            {/* Itemized Services Table */}
            <div className="py-4 border-b border-slate-200 space-y-2 text-xs">
              <span className="font-bold uppercase tracking-wider text-[11px] text-slate-600 block">
                Item Reparasi Sepatu:
              </span>
              
              {searchedOrder.shoes && searchedOrder.shoes.length > 0 ? (
                searchedOrder.shoes.map((sh, i) => (
                  <div key={i} className="flex justify-between items-start py-1 border-b border-slate-100 last:border-none">
                    <div>
                      <strong className="text-slate-900 block">{sh.shoeBrand} ({sh.shoeType})</strong>
                      <span className="text-[11px] text-slate-500">
                        {sh.selectedServices.map(s => s.name).join(', ')}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 shrink-0 ml-2">
                      Rp {sh.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <strong className="text-slate-900 block">{searchedOrder.shoeBrand}</strong>
                    <span className="text-[11px] text-slate-500">Reparasi Sepatu Spesialis</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    Rp {searchedOrder.totalAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>

            {/* Total & Payment Summary */}
            <div className="py-3 border-b-2 border-dashed border-slate-300 space-y-1 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Ongkos Kirim Kurir:</span>
                <span className="font-bold text-emerald-600">GRATIS / Termasuk</span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-slate-950 pt-1">
                <span>TOTAL PEMBAYARAN:</span>
                <span className="text-base text-amber-600 font-mono">
                  Rp {searchedOrder.totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-600">
                <span>Metode Pembayaran:</span>
                <span className="font-semibold uppercase text-slate-800">
                  {searchedOrder.paymentMethod === 'cod' ? 'COD (Saat Pengantaran Selesai)' : 'Transfer DANA / QRIS Terverifikasi'}
                </span>
              </div>
            </div>

            {/* Official Warranty Seal & QR Code Validation */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>JAMINAN GARANSI RESMI 30 HARI</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed max-w-[240px]">
                  Jika lem mangap atau jahitan terlepas dalam 30 hari pemakaian wajar, bawa resi ini ke Workshop Sukalila Selatan atau panggil Kurir Soleman untuk klaim pengerjaan ulang GRATIS.
                </p>
                <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 font-mono font-bold text-[10px]">
                  KODE VERIFIKASI: {searchedOrder.id}-SLCRFT
                </div>
              </div>

              {receiptQrUrl && (
                <div className="text-center shrink-0">
                  <img src={receiptQrUrl} alt="QR Resi" className="w-20 h-20 border border-slate-200 rounded-xl p-1 bg-white" />
                  <span className="text-[9px] text-slate-500 font-mono block mt-0.5">Scan Garansi</span>
                </div>
              )}
            </div>

            {/* Actions for Printing / WhatsApp (Hidden in print) */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row gap-2 print:hidden">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </button>
              
              <a
                href={buildConsultationWhatsAppUrl(`Halo Soleman, ini tanda terima order #${searchedOrder.id} untuk verifikasi garansi servis saya.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Share2 className="w-4 h-4" />
                <span>Kirim ke WhatsApp</span>
              </a>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
