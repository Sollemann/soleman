/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  MessageSquare, 
  Phone, 
  Search, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  DollarSign, 
  CreditCard, 
  AlertCircle, 
  Send, 
  ChevronRight, 
  LogOut, 
  Check, 
  ExternalLink,
  Wrench,
  PackageCheck
} from 'lucide-react';
import { Order, OrderStatus, CourierUser, PaymentStatus } from '../types';
import { STATUS_LABELS, WORKSHOP_INFO, getServiceTierDetail } from '../data/solcreftData';
import { 
  buildGoogleMapsRouteUrl, 
  buildStatusNotificationWhatsAppUrl,
  parseShareLocInput
} from '../services/whatsappHelper';
import { SolemanLogo } from './SolemanLogo';

interface CourierDashboardProps {
  courierUser: CourierUser;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus, customNote?: string) => void;
  onUpdatePaymentStatus: (orderId: string, paymentStatus: PaymentStatus) => void;
  onUpdateOrderLocation?: (
    orderId: string,
    locUpdate: {
      landmark?: string;
      fullAddress?: string;
      mapsUrl?: string;
      lat?: number;
      lng?: number;
      accuracy?: number;
    }
  ) => void;
  onLogout: () => void;
}

export const CourierDashboard: React.FC<CourierDashboardProps> = ({
  courierUser,
  orders,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  onUpdateOrderLocation,
  onLogout
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'need_pickup' | 'ready_deliver' | 'cod_pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Notification Modal State
  const [activeModalOrder, setActiveModalOrder] = useState<Order | null>(null);
  const [modalTargetStatus, setModalTargetStatus] = useState<OrderStatus>('perjalanan_workshop');
  const [modalCustomNote, setModalCustomNote] = useState('');

  // Quick WA Sherlock & Patokan Sync State per Order
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [waShareLocText, setWaShareLocText] = useState('');
  const [waPatokanText, setWaPatokanText] = useState('');

  // Counters
  const countNeedPickup = orders.filter(o => o.status === 'menunggu_jemput').length;
  const countReadyDeliver = orders.filter(o => o.status === 'siap_antar' || o.status === 'quality_check').length;
  const countCodPending = orders.filter(o => o.paymentMethod === 'cod' && o.paymentStatus !== 'cod_selesai').length;
  const countCompleted = orders.filter(o => o.status === 'selesai').length;

  const filteredOrders = orders.filter(order => {
    let matchTab = true;
    if (filterTab === 'need_pickup') matchTab = order.status === 'menunggu_jemput';
    else if (filterTab === 'ready_deliver') matchTab = order.status === 'siap_antar' || order.status === 'quality_check';
    else if (filterTab === 'cod_pending') matchTab = order.paymentMethod === 'cod' && order.paymentStatus !== 'cod_selesai';
    else if (filterTab === 'completed') matchTab = order.status === 'selesai';

    const q = searchQuery.toLowerCase();
    const matchSearch = 
      order.id.toLowerCase().includes(q) ||
      order.customerName.toLowerCase().includes(q) ||
      order.customerPhone.includes(q) ||
      order.shoeBrand.toLowerCase().includes(q) ||
      order.location.areaName.toLowerCase().includes(q) ||
      order.location.fullAddress.toLowerCase().includes(q);

    return matchTab && matchSearch;
  });

  const handleOpenNotification = (order: Order, defaultStatus: OrderStatus) => {
    setActiveModalOrder(order);
    setModalTargetStatus(defaultStatus);
    setModalCustomNote('');
  };

  const handleSendNotification = () => {
    if (!activeModalOrder) return;

    onUpdateOrderStatus(activeModalOrder.id, modalTargetStatus, modalCustomNote.trim() || undefined);

    const waUrl = buildStatusNotificationWhatsAppUrl(
      activeModalOrder,
      modalTargetStatus,
      modalCustomNote.trim() || undefined
    );
    window.open(waUrl, '_blank');
    setActiveModalOrder(null);
  };

  return (
    <section id="dashboard" className="py-12 lg:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Top Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-sky-500/20 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" /> Dashboard Kurir Soleman
            </span>
            <span className="text-xs text-amber-300 font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              Armada Antar-Jemput Cirebon
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-display">
            Halo, {courierUser.name}!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Kelola rute penjemputan se-Kota & Kabupaten Cirebon, navigasi koordinat titik GPS pelanggan, tagihan COD, dan kirim update via WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Kurir</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setFilterTab('need_pickup')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            filterTab === 'need_pickup' ? 'bg-amber-500/20 border-amber-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400">Perlu Dijemput</span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white mt-2 font-mono">{countNeedPickup}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Pelanggan menunggu kurir</span>
        </div>

        <div 
          onClick={() => setFilterTab('ready_deliver')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            filterTab === 'ready_deliver' ? 'bg-sky-500/20 border-sky-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400">Siap Diantar Balik</span>
            <PackageCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black text-white mt-2 font-mono">{countReadyDeliver}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">QC selesai di Workshop Sukalila</span>
        </div>

        <div 
          onClick={() => setFilterTab('cod_pending')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            filterTab === 'cod_pending' ? 'bg-emerald-500/20 border-emerald-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">Tagihan COD Pending</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white mt-2 font-mono">{countCodPending}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Perlu ditagih tunai ke pelanggan</span>
        </div>

        <div 
          onClick={() => setFilterTab('completed')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            filterTab === 'completed' ? 'bg-purple-500/20 border-purple-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400">Pesanan Selesai</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-white mt-2 font-mono">{countCompleted}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Berhasil serah terima</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          {[
            { id: 'all', label: 'Semua Tugas' },
            { id: 'need_pickup', label: `Perlu Jemput (${countNeedPickup})` },
            { id: 'ready_deliver', label: `Siap Antar (${countReadyDeliver})` },
            { id: 'cod_pending', label: `COD Pending (${countCodPending})` },
            { id: 'completed', label: 'Selesai' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterTab === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID, Nama, No WA, Kecamatan Cirebon..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Orders List for Courier */}
      <div className="mt-6 space-y-6">
        {filteredOrders.map((order) => {
          const statusConfig = STATUS_LABELS[order.status];
          const navigationUrl = buildGoogleMapsRouteUrl(
            order.location.lat,
            order.location.lng,
            order.location.areaName || order.location.fullAddress,
            order.location.landmark,
            order.location.mapsUrl
          );

          const isCodPending = order.paymentMethod === 'cod' && order.paymentStatus !== 'cod_selesai';
          const isSyncingThisOrder = syncingOrderId === order.id;

          return (
            <div
              key={order.id}
              className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-6 sm:p-7 shadow-xl space-y-6 transition-all"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs rounded-xl">
                    #{order.id}
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <span>{order.customerName}</span>
                      <a
                        href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{order.customerPhone}</span>
                      </a>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sesi: <strong className="text-white uppercase">{order.preferredTimeSlot}</strong> • Dipesan: {order.createdAt}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Payment Badge */}
                  {order.paymentMethod === 'cod' ? (
                    <span className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                      order.paymentStatus === 'cod_selesai'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                    }`}>
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>COD: Rp {order.totalAmount.toLocaleString('id-ID')} ({order.paymentStatus === 'cod_selesai' ? 'LUNAS' : 'TAGIH TUNAI'})</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-xl text-xs font-bold border bg-sky-500/20 text-sky-300 border-sky-500/40 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>QRIS ({order.paymentStatus === 'lunas' ? 'LUNAS' : 'Menunggu Bayar'})</span>
                    </span>
                  )}

                  <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${statusConfig.badgeBg}`}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>

              {/* Order Info Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Col 1: Lokasi Sherlock WA & Patokan Akurat (5 cols) */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> Sherlock WA & Patokan Pelanggan
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      order.location.lat && order.location.lng
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}>
                      {order.location.lat && order.location.lng ? '🛰️ GPS Sherlock Akurat' : '📍 Sherlock & Patokan WA Aktif'}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>Kecamatan: {order.location.areaName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">
                        {order.location.areaType || 'Cirebon'}
                      </span>
                    </div>

                    {/* HIGHLIGHTED PATOKAN BOX FOR COURIER */}
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                        🚩 Patokan Rumah / Ciri-Ciri Lokasi (Dari WA Pelanggan):
                      </span>
                      <p className="text-xs font-bold text-white leading-snug">
                        {order.location.landmark || order.location.fullAddress}
                      </p>
                      {order.location.fullAddress && order.location.landmark && order.location.fullAddress !== order.location.landmark && (
                        <p className="text-[11px] text-slate-300">
                          Detail Area: {order.location.fullAddress}
                        </p>
                      )}
                    </div>

                    {order.location.lat && order.location.lng ? (
                      <div className="text-[10px] font-mono text-slate-300 flex items-center justify-between bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/30">
                        <span>🛰️ Koordinat: {order.location.lat.toFixed(6)}, {order.location.lng.toFixed(6)}</span>
                        <span className="text-emerald-400 font-bold">Akurasi ±{order.location.accuracy || 10}m</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                        <span>Rute diarahkan akurat ke Patokan & Kec. {order.location.areaName}</span>
                        <span className="text-amber-300 font-bold">Siap Navigasi</span>
                      </div>
                    )}

                    {/* Navigation & WhatsApp Share Loc Buttons */}
                    <div className="pt-1 flex flex-wrap gap-2">
                      <a
                        href={navigationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md transition-all"
                      >
                        <Navigation className="w-4 h-4 fill-slate-950" />
                        <span>Navigasi ke Titik Sherlock</span>
                      </a>

                      <a
                        href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo Kak ${order.customerName}! Saya Kurir Soleman Cirebon untuk Order #${order.id}. Patokan lokasi Kakak di "${order.location.landmark || order.location.fullAddress}" sudah masuk di Dashboard Kurir saya. Mohon kirim Share Location (Sherlock) terkini di chat ini jika sudah siap dijemput ya Kak!`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition-all"
                        title="Chat & Minta Share Loc Pelanggan di WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>WA Pelanggan</span>
                      </a>
                    </div>

                    {/* Instant WA Sherlock & Patokan Sync Tool for Courier */}
                    {onUpdateOrderLocation && (
                      <div className="pt-2 border-t border-slate-800/80">
                        {!isSyncingThisOrder ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSyncingOrderId(order.id);
                              setWaShareLocText(order.location.mapsUrl || '');
                              setWaPatokanText(order.location.landmark || '');
                            }}
                            className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-amber-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Tempel / Update Link Sherlock & Patokan dari Chat WA</span>
                          </button>
                        ) : (
                          <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/40 space-y-2.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-300 text-[11px]">
                                Sinkronkan Sherlock & Patokan Baru dari WA:
                              </span>
                              <button
                                type="button"
                                onClick={() => setSyncingOrderId(null)}
                                className="text-slate-400 hover:text-white text-xs"
                              >
                                ✕
                              </button>
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400 mb-1">Update Patokan Lokasi:</label>
                              <input
                                type="text"
                                value={waPatokanText}
                                onChange={(e) => setWaPatokanText(e.target.value)}
                                placeholder="Contoh: Rumah pagar hitam samping masjid"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400 mb-1">Tempel Link Share Loc WA / Koordinat GPS:</label>
                              <input
                                type="text"
                                value={waShareLocText}
                                onChange={(e) => setWaShareLocText(e.target.value)}
                                placeholder="Contoh: https://maps.google.com/?q=-6.715,108.552"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-mono focus:outline-none focus:border-emerald-400"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const parsed = parseShareLocInput(waShareLocText);
                                  const cleanPatokan = waPatokanText.trim() || order.location.landmark;
                                  onUpdateOrderLocation(order.id, {
                                    landmark: cleanPatokan,
                                    fullAddress: cleanPatokan ? `${cleanPatokan} (Kec. ${order.location.areaName})` : order.location.fullAddress,
                                    lat: parsed.lat ?? order.location.lat,
                                    lng: parsed.lng ?? order.location.lng,
                                    accuracy: parsed.lat ? 5 : order.location.accuracy,
                                    mapsUrl: parsed.cleanUrl || waShareLocText.trim() || order.location.mapsUrl,
                                  });
                                  setSyncingOrderId(null);
                                }}
                                className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                              >
                                Simpan & Akuratkan Rute
                              </button>
                              <button
                                type="button"
                                onClick={() => setSyncingOrderId(null)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Col 2: Sepatu & Rincian Servis (4 cols) */}
                <div className="lg:col-span-4 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Sepatu & Rincian Servis
                  </span>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{order.shoeBrand}</span>
                      <span className="text-xs text-amber-400 font-bold">{order.pairsCount} Pasang</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">{order.shoeType}</span>

                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                      {order.selectedServices.map(s => {
                        const orderSev = order.severity || (order.shoes && order.shoes[0]?.severity) || 'normal';
                        const tier = getServiceTierDetail(s, orderSev);
                        return (
                          <div key={s.id} className="text-xs text-slate-300 flex items-center justify-between gap-2">
                            <span className="truncate pr-1">• {s.name} <span className="text-[10px] text-amber-300">({tier.badge})</span></span>
                            <span className="text-amber-400/90 font-mono text-[11px] shrink-0">{tier.priceFormatted}</span>
                          </div>
                        );
                      })}
                    </div>

                    {order.customNotes && (
                      <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 italic">
                        "{order.customNotes}"
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-400">Total Tagihan:</span>
                      <span className="text-amber-400 font-mono text-sm">
                        Rp {order.totalAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Col 3: Courier Actions (3 cols) */}
                <div className="lg:col-span-3 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4" /> Tindakan Kurir
                  </span>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                    {/* Action 1: Jemput */}
                    {order.status === 'menunggu_jemput' && (
                      <button
                        onClick={() => {
                          onUpdateOrderStatus(order.id, 'perjalanan_workshop', 'Kurir Soleman telah mengambil sepatu dan membawanya ke Workshop Jl. Sukalila Selatan Cirebon.');
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Ambil & Bawa ke Workshop</span>
                      </button>
                    )}

                    {/* Action 2: Siap Antar */}
                    {(order.status === 'pengerjaan' || order.status === 'quality_check' || order.status === 'perjalanan_workshop') && (
                      <button
                        onClick={() => {
                          onUpdateOrderStatus(order.id, 'siap_antar', 'Sepatu selesai dikerjakan & Kurir Soleman siap mengantar ke rumah pelanggan.');
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md transition-all"
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>Mulai Antar ke Pelanggan</span>
                      </button>
                    )}

                    {/* Action 3: Selesai */}
                    {order.status !== 'selesai' && (
                      <button
                        onClick={() => {
                          onUpdateOrderStatus(order.id, 'selesai', 'Sepatu telah diserahterimakan ke pelanggan dengan baik.');
                          if (order.paymentMethod === 'cod') {
                            onUpdatePaymentStatus(order.id, 'cod_selesai');
                          } else {
                            onUpdatePaymentStatus(order.id, 'lunas');
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Selesai & Serah Terima</span>
                      </button>
                    )}

                    {/* COD Payment Toggle Button */}
                    {order.paymentMethod === 'cod' && (
                      <div className="pt-2 border-t border-slate-800">
                        {order.paymentStatus === 'cod_selesai' ? (
                          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                            <Check className="w-4 h-4" />
                            <span>COD Sudah Lunas Diterima</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => onUpdatePaymentStatus(order.id, 'cod_selesai')}
                            className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all flex items-center justify-center gap-1.5"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Terima Tunai COD Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Quick WhatsApp update modal trigger */}
                    <button
                      onClick={() => handleOpenNotification(order, order.status === 'menunggu_jemput' ? 'perjalanan_workshop' : order.status === 'siap_antar' ? 'selesai' : 'siap_antar')}
                      className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Kirim Progres via WA</span>
                    </button>

                  </div>
                </div>

              </div>

            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800">
            <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-white font-bold text-base">Tidak ada tugas pada filter ini</h4>
            <p className="text-xs text-slate-400 mt-1">Semua pesanan antar-jemput sudah tertangani dengan baik.</p>
          </div>
        )}
      </div>

      {/* WhatsApp Modal */}
      {activeModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Notifikasi WhatsApp Pelanggan
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Order #{activeModalOrder.id} - {activeModalOrder.customerName}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalOrder(null)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase">
                Pilih Tahap Status:
              </label>
              <select
                value={modalTargetStatus}
                onChange={(e) => setModalTargetStatus(e.target.value as OrderStatus)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="perjalanan_workshop">🛵 Kurir Soleman Menuju Lokasi Jemput</option>
                <option value="pengerjaan">🛠️ Sepatu Tiba & Sedang Dikerjakan di Workshop</option>
                <option value="siap_antar">🎉 Sepatu Selesai & Kurir Siap Mengantar Kembali</option>
                <option value="selesai">✅ Sepatu Telah Diterima (Garansi Aktif)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase">
                Catatan Kurir Tambahan (Opsional):
              </label>
              <textarea
                value={modalCustomNote}
                onChange={(e) => setModalCustomNote(e.target.value)}
                rows={2}
                placeholder="Contoh: Kurir Soleman sudah sampai di depan gang ya Kak."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveModalOrder(null)}
                className="flex-1 py-3 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSendNotification}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
              >
                <Send className="w-4 h-4" />
                <span>Kirim WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
