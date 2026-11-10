/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Navigation, 
  MessageSquare, 
  Truck, 
  Phone, 
  Search, 
  LogOut, 
  AlertCircle, 
  ChevronRight, 
  Plus, 
  Printer, 
  Lock, 
  Eye, 
  EyeOff, 
  Send, 
  FileText, 
  Check, 
  X,
  Sparkles,
  Share2,
  Calendar
} from 'lucide-react';
import { Order, OrderStatus, AdminUser, ServiceItem, ShoeType } from '../types';
import { STATUS_LABELS, COURIER_DRIVERS, SERVICES_CATALOG, CIREBON_AREAS, WORKSHOP_INFO, getServiceTierDetail } from '../data/solcreftData';
import { 
  buildOrderAcceptedWhatsAppUrl, 
  buildNotifyCourierWhatsAppUrl, 
  buildStatusNotificationWhatsAppUrl, 
  buildGoogleMapsRouteUrl 
} from '../services/whatsappHelper';
import { SolemanLogo } from './SolemanLogo';

interface AdminDashboardProps {
  adminUser: AdminUser;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus, customNote?: string) => void;
  onAcceptOrder: (orderId: string, courierName: string, courierPhone: string) => void;
  onRejectOrder: (orderId: string, reason: string) => void;
  onLogout: () => void;
  onOpenCreateOrder: () => void;
  onOrderCreated: (order: Order) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  orders,
  onUpdateOrderStatus,
  onAcceptOrder,
  onRejectOrder,
  onLogout,
  onOpenCreateOrder,
  onOrderCreated
}) => {
  const [filterTab, setFilterTab] = useState<'pending' | 'in_progress' | 'ready' | 'completed' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Privacy toggle per order (by default all addresses are kept private in dashboard, routed via WhatsApp)
  const [unmaskedOrderIds, setUnmaskedOrderIds] = useState<Record<string, boolean>>({});

  // Modals state
  const [acceptingOrder, setAcceptingOrder] = useState<Order | null>(null);
  const [selectedCourierId, setSelectedCourierId] = useState<string>(COURIER_DRIVERS[0].id);

  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [quickOrderModalOpen, setQuickOrderModalOpen] = useState(false);
  const [dailyRecapModalOpen, setDailyRecapModalOpen] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Quick Order State
  const [qCustomerName, setQCustomerName] = useState('');
  const [qCustomerPhone, setQCustomerPhone] = useState('');
  const [qShoeBrand, setQShoeBrand] = useState('');
  const [qShoeType, setQShoeType] = useState<ShoeType>('Sneakers');
  const [qServiceId, setQServiceId] = useState<string>(SERVICES_CATALOG[0].id);
  const [qArea, setQArea] = useState<string>(CIREBON_AREAS[0].name);

  // Notification Modal State
  const [notifModalOrder, setNotifModalOrder] = useState<Order | null>(null);
  const [notifStatus, setNotifStatus] = useState<OrderStatus>('perjalanan_workshop');
  const [notifNote, setNotifNote] = useState('');

  const toggleAddressVisibility = (orderId: string) => {
    setUnmaskedOrderIds(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  // Filtered orders
  const pendingOrders = orders.filter(o => !o.isAcceptedByAdmin);
  const inProgressOrders = orders.filter(o => o.isAcceptedByAdmin && (o.status === 'perjalanan_workshop' || o.status === 'pengerjaan' || o.status === 'menunggu_jemput'));
  const readyOrders = orders.filter(o => o.status === 'quality_check' || o.status === 'siap_antar');
  const completedOrders = orders.filter(o => o.status === 'selesai');

  const filteredOrders = orders.filter(order => {
    let matchTab = true;
    if (filterTab === 'pending') matchTab = !order.isAcceptedByAdmin;
    else if (filterTab === 'in_progress') matchTab = !!order.isAcceptedByAdmin && (order.status === 'perjalanan_workshop' || order.status === 'pengerjaan' || order.status === 'menunggu_jemput');
    else if (filterTab === 'ready') matchTab = order.status === 'quality_check' || order.status === 'siap_antar';
    else if (filterTab === 'completed') matchTab = order.status === 'selesai';

    const q = searchQuery.toLowerCase();
    const matchSearch = 
      order.id.toLowerCase().includes(q) ||
      order.customerName.toLowerCase().includes(q) ||
      order.customerPhone.includes(q) ||
      order.shoeBrand.toLowerCase().includes(q) ||
      order.location.areaName.toLowerCase().includes(q);

    return matchTab && matchSearch;
  });

  // Financial Stats
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Accept Order Handler
  const handleConfirmAccept = (sendWaToCustomer: boolean, sendWaToCourier: boolean) => {
    if (!acceptingOrder) return;
    const courier = COURIER_DRIVERS.find(c => c.id === selectedCourierId) || COURIER_DRIVERS[0];

    onAcceptOrder(acceptingOrder.id, courier.name, courier.phone);

    if (sendWaToCustomer) {
      const waCustomerUrl = buildOrderAcceptedWhatsAppUrl(acceptingOrder, courier.name);
      window.open(waCustomerUrl, '_blank');
    }

    if (sendWaToCourier) {
      setTimeout(() => {
        const waCourierUrl = buildNotifyCourierWhatsAppUrl(acceptingOrder, courier.phone, courier.name);
        window.open(waCourierUrl, '_blank');
      }, 500);
    }

    setAcceptingOrder(null);
  };

  // Submit Quick Order
  const handleCreateQuickOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qCustomerName.trim() || !qCustomerPhone.trim() || !qShoeBrand.trim()) return;

    const chosenService = SERVICES_CATALOG.find(s => s.id === qServiceId) || SERVICES_CATALOG[0];
    const chosenArea = CIREBON_AREAS.find(a => a.name === qArea) || CIREBON_AREAS[0];

    const newOrder: Order = {
      id: `SLC-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: qCustomerName.trim(),
      customerPhone: qCustomerPhone.trim(),
      shoeBrand: qShoeBrand.trim(),
      shoeType: qShoeType,
      pairsCount: 1,
      selectedServices: [chosenService],
      pickupType: 'antar_jemput',
      preferredTimeSlot: 'siang',
      location: {
        areaName: chosenArea.name,
        fullAddress: `Area ${chosenArea.name}, Cirebon`,
        landmark: 'Order Cepat Walk-In / Telepon',
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(chosenArea.name + ', Cirebon')}`
      },
      totalServicesPrice: chosenService.price,
      deliveryFee: 10000,
      totalAmount: chosenService.price + 10000,
      paymentMethod: 'cod',
      paymentStatus: 'cod_pending',
      status: 'pengerjaan',
      isAcceptedByAdmin: true,
      acceptedAt: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) + ' WIB',
      assignedCourier: COURIER_DRIVERS[0].name,
      assignedCourierPhone: COURIER_DRIVERS[0].phone,
      createdAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      estimatedFinishedAt: '2 Hari Kerja',
      technicianName: 'Kang Asep (Solcreft Cirebon)',
      timeline: [
        {
          status: 'pengerjaan',
          label: 'Order Cepat Masuk',
          timestamp: 'Baru saja',
          description: 'Order dicatat langsung oleh Admin Soleman.'
        }
      ]
    };

    // Reset form
    setQCustomerName('');
    setQCustomerPhone('');
    setQShoeBrand('');
    setQuickOrderModalOpen(false);

    // Add to parent orders
    onOrderCreated(newOrder);
  };

  return (
    <section id="dashboard" className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* 1. COMPACT ADMIN HEADER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SolemanLogo size="md" showSubtitle={false} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-white">Dashboard Admin Soleman</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Login: <strong className="text-slate-200">{adminUser.email}</strong> • Kurir Herdi Siap Antar-Jemput
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setQuickOrderModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Input Order Cepat</span>
            </button>
            <button
              onClick={() => setDailyRecapModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Rekap Rute Antar-Jemput Hari Ini"
            >
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>Rekap Rute WA</span>
            </button>
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors border border-slate-800"
              title="Logout Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* COMPACT KPI METRIC STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
          <div 
            onClick={() => setFilterTab('pending')}
            className={`p-3 rounded-2xl border cursor-pointer transition-all ${
              pendingOrders.length > 0
                ? 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/15'
                : 'bg-slate-950/60 border-slate-800/80'
            }`}
          >
            <span className="text-[11px] font-bold text-amber-400 block">Pesanan Baru (Perlu Terima)</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5 font-mono">
              {pendingOrders.length}
            </div>
          </div>

          <div 
            onClick={() => setFilterTab('in_progress')}
            className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-all"
          >
            <span className="text-[11px] font-bold text-sky-400 block">Sedang Dikerjakan</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5 font-mono">
              {inProgressOrders.length}
            </div>
          </div>

          <div 
            onClick={() => setFilterTab('ready')}
            className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-all"
          >
            <span className="text-[11px] font-bold text-purple-400 block">Siap Diantar</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5 font-mono">
              {readyOrders.length}
            </div>
          </div>

          <div 
            onClick={() => setFilterTab('all')}
            className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-all"
          >
            <span className="text-[11px] font-bold text-emerald-400 block">Total Omset Servis</span>
            <div className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5 font-mono">
              Rp {totalRevenue.toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </div>

      {/* 2. SIMPLE FILTER TABS & SEARCH */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          {[
            { id: 'pending', label: '📥 Perlu Terima', count: pendingOrders.length, alert: pendingOrders.length > 0 },
            { id: 'in_progress', label: '🛠️ Dikerjakan', count: inProgressOrders.length },
            { id: 'ready', label: '🚚 Siap Antar', count: readyOrders.length },
            { id: 'completed', label: '✅ Selesai', count: completedOrders.length },
            { id: 'all', label: 'Semua', count: orders.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterTab === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filterTab === tab.id
                  ? 'bg-slate-950 text-amber-300'
                  : tab.alert
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID, Pelanggan, No WA..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* 3. SIMPLIFIED ORDERS LIST */}
      <div className="mt-5 space-y-4">
        {filteredOrders.map(order => {
          const isPending = !order.isAcceptedByAdmin;
          const statusConfig = STATUS_LABELS[order.status];
          const isAddressUnmasked = !!unmaskedOrderIds[order.id];

          return (
            <div
              key={order.id}
              className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                isPending
                  ? 'bg-slate-900/90 border-amber-500/50 ring-1 ring-amber-500/30'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Order Row: Top Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs rounded-lg">
                    #{order.id}
                  </span>
                  <div>
                    <span className="text-sm font-bold text-white mr-2">{order.customerName}</span>
                    <a
                      href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:underline font-mono inline-flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{order.customerPhone}</span>
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.badgeBg}`}>
                    {statusConfig.label}
                  </span>

                  {/* Print Invoice Button */}
                  <button
                    onClick={() => setInvoiceOrder(order)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-950 border border-slate-800 transition-colors"
                    title="Cetak Nota Servis Sepatu"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Order Row: Middle Details */}
              <div className="py-3 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                {/* Shoe & Services (5 cols) */}
                <div className="md:col-span-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{order.shoeBrand}</span>
                    <span className="text-amber-400 font-bold font-mono">{order.pairsCount} Pasang</span>
                  </div>

                  {/* Multi-pair breakdown if present */}
                  {order.shoes && order.shoes.length > 0 ? (
                    <div className="space-y-1.5 pt-0.5">
                      {order.shoes.map((sh, sIdx) => {
                        const sevBadgeClass = sh.severity === 'hard' 
                          ? 'text-red-400 bg-red-500/10 border-red-500/30' 
                          : sh.severity === 'kecil' 
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' 
                          : 'text-amber-400 bg-amber-500/10 border-amber-500/30';
                        const sevLabelText = sh.severity === 'hard'
                          ? 'Berat / Parah'
                          : sh.severity === 'kecil'
                          ? 'Ringan'
                          : 'Sedang';

                        return (
                          <div key={sh.id || sIdx} className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-200 text-[11px]">
                                #{sIdx + 1} {sh.shoeBrand}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border ${sevBadgeClass}`}>
                                {sevLabelText}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 text-[10px] text-slate-400">
                              <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">{sh.shoeType}</span>
                              <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-amber-300/90">{sh.material}</span>
                            </div>
                            <p className="text-slate-400 text-[10px] line-clamp-2">
                              Servis: {sh.selectedServices.map(s => {
                                const tier = getServiceTierDetail(s, sh.severity);
                                return `${s.name} (${tier.label} - ${tier.priceFormatted})`;
                              }).join(', ')}
                            </p>
                            {sh.photoUrl && (
                              <div className="pt-1 flex items-center gap-2">
                                <img
                                  src={sh.photoUrl}
                                  alt={`Foto Sepatu #${sIdx + 1}`}
                                  onClick={() => setPreviewPhotoUrl(sh.photoUrl || null)}
                                  className="w-10 h-10 object-cover rounded-lg border border-slate-700 hover:opacity-80 cursor-pointer"
                                />
                                <span className="text-[10px] text-sky-400 hover:underline cursor-pointer" onClick={() => setPreviewPhotoUrl(sh.photoUrl || null)}>
                                  Lihat Foto Sepatu #{sIdx + 1}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-slate-400 text-[11px] line-clamp-1">
                        Servis: {order.selectedServices.map(s => s.name).join(', ')}
                      </p>
                      {order.customNotes && (
                        <p className="text-slate-400 text-[11px] italic line-clamp-1">
                          Catatan: "{order.customNotes}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* General order photo preview if present */}
                  {order.photos && order.photos.length > 0 ? (
                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                          📷 <span>Foto Kerusakan ({order.photos.length} Foto)</span>
                        </span>
                        <span className="text-[10px] text-sky-400">Klik untuk zoom</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {order.photos.map((pUrl, pIdx) => (
                          <div
                            key={pIdx}
                            onClick={() => setPreviewPhotoUrl(pUrl)}
                            className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-700 hover:border-amber-400 transition-all"
                          >
                            <img
                              src={pUrl}
                              alt={`Foto Kerusakan ${pIdx + 1}`}
                              className="w-12 h-12 object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent flex items-end p-0.5">
                              <span className="text-[9px] bg-slate-950/80 text-amber-300 px-1 rounded font-mono font-bold">#{pIdx + 1}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : order.photoUrl ? (
                    <div className="pt-1 flex items-center gap-2">
                      <img
                        src={order.photoUrl}
                        alt="Foto Sepatu"
                        onClick={() => setPreviewPhotoUrl(order.photoUrl || null)}
                        className="w-12 h-12 object-cover rounded-xl border border-slate-700 hover:opacity-80 cursor-pointer"
                      />
                      <span className="text-[10px] text-sky-400 hover:underline cursor-pointer font-bold" onClick={() => setPreviewPhotoUrl(order.photoUrl || null)}>
                        🔍 Klik untuk Cek Foto Sepatu Rusak
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-amber-400 font-mono text-xs">
                      Total: Rp {order.totalAmount.toLocaleString('id-ID')}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                      order.paymentMethod === 'cod'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                    }`}>
                      {order.paymentMethod === 'cod' ? '💵 COD' : '💳 QRIS'}
                    </span>
                  </div>
                </div>

                {/* PRIVACY-PROTECTED LOCATION (4 cols): Route & Location sent directly via WA */}
                <div className="md:col-span-4 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300 flex items-center gap-1 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>Area: {order.location.areaName}</span>
                    </span>
                    <button
                      onClick={() => toggleAddressVisibility(order.id)}
                      className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
                      title="Tampilkan alamat di layar"
                    >
                      {isAddressUnmasked ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{isAddressUnmasked ? 'Sembunyikan' : 'Buka'}</span>
                    </button>
                  </div>

                  {isAddressUnmasked ? (
                    <div className="text-[11px] text-slate-300 leading-tight space-y-0.5">
                      <p>{order.location.fullAddress}</p>
                      {order.location.landmark && <p className="text-amber-300/80">Patokan: {order.location.landmark}</p>}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 italic">
                      <Lock className="w-3 h-3 text-slate-600 shrink-0" />
                      <span>Alamat detail & GPS terproteksi (dikirim otomatis via WA kurir)</span>
                    </p>
                  )}

                  {/* Send location to WhatsApp Button */}
                  {order.assignedCourierPhone && (
                    <a
                      href={buildNotifyCourierWhatsAppUrl(order, order.assignedCourierPhone, order.assignedCourier || 'Kurir')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-400 hover:text-sky-300 hover:underline pt-0.5"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Kirim Rute Maps & Lokasi Privat ke WA Kurir</span>
                    </a>
                  )}
                </div>

                {/* Actions (3 cols) */}
                <div className="md:col-span-3 flex flex-col justify-center space-y-1.5">
                  {isPending ? (
                    <div className="space-y-1.5">
                      <button
                        onClick={() => setAcceptingOrder(order)}
                        className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Terima Pesanan</span>
                      </button>
                      <button
                        onClick={() => onRejectOrder(order.id, 'Dibatalkan oleh admin')}
                        className="w-full py-1.5 rounded-lg text-[11px] text-slate-400 hover:text-red-400 text-center transition-colors"
                      >
                        Tolak / Batalkan
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {/* Quick WhatsApp update trigger */}
                      <button
                        onClick={() => {
                          setNotifModalOrder(order);
                          setNotifStatus(order.status === 'menunggu_jemput' ? 'perjalanan_workshop' : order.status === 'perjalanan_workshop' ? 'pengerjaan' : 'siap_antar');
                          setNotifNote('');
                        }}
                        className="w-full py-1.5 px-2.5 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Kirim Update WA</span>
                      </button>

                      {/* Status Dropdown */}
                      <select
                        value={order.status}
                        onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="menunggu_jemput">Menunggu Jemput</option>
                        <option value="perjalanan_workshop">Kurir Ambil Sepatu</option>
                        <option value="pengerjaan">Sedang Servis</option>
                        <option value="quality_check">Quality Control</option>
                        <option value="siap_antar">Siap Diantar</option>
                        <option value="selesai">Selesai</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
            <p className="text-slate-400 text-xs">Tidak ada pesanan pada filter ini.</p>
          </div>
        )}
      </div>

      {/* MODAL 1: ACCEPT ORDER & ASSIGN COURIER */}
      {acceptingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Konfirmasi Penerimaan</span>
                <h3 className="text-base font-bold text-white mt-0.5">Terima Order #{acceptingOrder.id}</h3>
                <p className="text-xs text-slate-400">{acceptingOrder.customerName} • {acceptingOrder.shoeBrand}</p>
              </div>
              <button onClick={() => setAcceptingOrder(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Courier Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">Pilih Kurir Soleman Penjemput:</label>
              <div className="space-y-1.5">
                {COURIER_DRIVERS.map(driver => (
                  <div
                    key={driver.id}
                    onClick={() => setSelectedCourierId(driver.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer text-xs flex items-center justify-between transition-all ${
                      selectedCourierId === driver.id
                        ? 'bg-amber-500/15 border-amber-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{driver.name}</span>
                    <span className="text-[11px] font-mono text-emerald-400">{driver.phone}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => handleConfirmAccept(true, true)}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Terima & Kirim WA Otomatis (Pelanggan + Kurir)</span>
              </button>
              <button
                type="button"
                onClick={() => handleConfirmAccept(false, false)}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white"
              >
                Terima Saja (Tanpa Buka WhatsApp)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CETAK NOTA / STRUK DIGITAL INVOICE */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white text-slate-900 p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setInvoiceOrder(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1"
            >
              ✕
            </button>

            {/* Receipt Header */}
            <div className="text-center border-b border-dashed border-slate-300 pb-4 space-y-1">
              <span className="text-xl font-black tracking-tight text-slate-900 font-display">SOLEMAN WORKSHOP & SHOE REPAIR</span>
              <p className="text-xs text-slate-600 font-medium">{WORKSHOP_INFO.address}</p>
              <p className="text-[11px] text-slate-500 font-mono">WA: {WORKSHOP_INFO.phoneFormatted} • IG: {WORKSHOP_INFO.instagram}</p>
              <div className="mt-2 inline-block px-3 py-1 bg-slate-100 rounded-full font-mono text-xs font-bold">
                NOTA REPARASI: #{invoiceOrder.id}
              </div>
            </div>

            {/* Receipt Details */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal Order:</span>
                <span className="font-semibold">{invoiceOrder.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pelanggan:</span>
                <span className="font-bold">{invoiceOrder.customerName} ({invoiceOrder.customerPhone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sepatu:</span>
                <span className="font-semibold">{invoiceOrder.shoeBrand} ({invoiceOrder.pairsCount} Pasang)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Area Antar-Jemput:</span>
                <span className="font-semibold">{invoiceOrder.location.areaName}</span>
              </div>
              {invoiceOrder.assignedCourier && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Kurir Pengantar:</span>
                  <span className="font-semibold">{invoiceOrder.assignedCourier}</span>
                </div>
              )}
            </div>

            {/* Services Table */}
            <div className="border-t border-b border-dashed border-slate-300 py-3 space-y-1.5 text-xs">
              <div className="flex justify-between font-bold text-slate-700 uppercase text-[10px]">
                <span>Layanan Reparasi</span>
                <span>Biaya</span>
              </div>
              {invoiceOrder.selectedServices.map(s => (
                <div key={s.id} className="flex justify-between">
                  <span>{s.name} (Garansi {s.warrantyDays} Hari)</span>
                  <span className="font-mono">{s.priceFormatted}</span>
                </div>
              ))}
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span>Ongkir Antar-Jemput Cirebon</span>
                <span className="font-mono">
                  {invoiceOrder.deliveryFee === 0 ? 'GRATIS' : `Rp ${invoiceOrder.deliveryFee.toLocaleString('id-ID')}`}
                </span>
              </div>
              <div className="flex justify-between pt-1 font-bold text-sm text-slate-900">
                <span>TOTAL PEMBAYARAN</span>
                <span className="font-mono">Rp {invoiceOrder.totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Warranty Footnote */}
            <div className="text-[10px] text-slate-500 space-y-1">
              <p>* Garansi lem & jahitan berlaku 30-90 hari dengan menunjukkan nota fisik/digital ini.</p>
              <p>* Terima kasih telah mempercayakan perbaikan sepatu Anda di Soleman Cirebon.</p>
            </div>

            {/* Print Action */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Nota / Save PDF</span>
              </button>
              <button
                onClick={() => setInvoiceOrder(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: INPUT ORDER KILAT WALK-IN / TELEPON */}
      {quickOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">Input Kilat</span>
                <h3 className="text-base font-bold text-white">Tambah Order Walk-In / Telepon</h3>
              </div>
              <button onClick={() => setQuickOrderModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateQuickOrder} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nama Pelanggan *</label>
                <input
                  type="text"
                  required
                  value={qCustomerName}
                  onChange={(e) => setQCustomerName(e.target.value)}
                  placeholder="Contoh: Aldi Pratama"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Nomor WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={qCustomerPhone}
                  onChange={(e) => setQCustomerPhone(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Merk & Tipe Sepatu *</label>
                <input
                  type="text"
                  required
                  value={qShoeBrand}
                  onChange={(e) => setQShoeBrand(e.target.value)}
                  placeholder="Contoh: Nike Air Force 1 / Vans"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Layanan Servis</label>
                  <select
                    value={qServiceId}
                    onChange={(e) => setQServiceId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none"
                  >
                    {SERVICES_CATALOG.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Area di Cirebon</label>
                  <select
                    value={qArea}
                    onChange={(e) => setQArea(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none"
                  >
                    {CIREBON_AREAS.map(a => (
                      <option key={a.name} value={a.name}>{a.name.split('(')[0]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
                >
                  Simpan & Proses Langsung
                </button>
                <button
                  type="button"
                  onClick={() => setQuickOrderModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: REKAP SURAT TUGAS KURIR HARIAN */}
      {dailyRecapModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-widest">Kurir Antar-Jemput</span>
                <h3 className="text-base font-bold text-white">Rekap Penjemputan Cirebon Hari Ini</h3>
              </div>
              <button onClick={() => setDailyRecapModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 text-xs">
              {orders.filter(o => o.status === 'menunggu_jemput' || o.status === 'perjalanan_workshop').map(order => (
                <div key={order.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-amber-400">#{order.id} - {order.customerName}</span>
                    <span className="text-slate-400">{order.location.areaName}</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{order.shoeBrand} • Sesi {order.preferredTimeSlot.toUpperCase()}</p>
                  <a
                    href={buildGoogleMapsRouteUrl(order.location.lat, order.location.lng, order.location.fullAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 text-[11px] hover:underline inline-flex items-center gap-1 font-bold"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Rute Google Maps Kurir</span>
                  </a>
                </div>
              ))}
            </div>

            <button
              onClick={() => setDailyRecapModalOpen(false)}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white"
            >
              Tutup Rekap
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: CUSTOM WHATSAPP NOTIFICATION SENDER */}
      {notifModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Kirim Notif WhatsApp</span>
                <h3 className="text-base font-bold text-white">Order #{notifModalOrder.id} - {notifModalOrder.customerName}</h3>
              </div>
              <button onClick={() => setNotifModalOrder(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Pilih Status Progres:</label>
                <select
                  value={notifStatus}
                  onChange={(e) => setNotifStatus(e.target.value as OrderStatus)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="perjalanan_workshop">🛵 Driver Menuju Lokasi Penjemputan</option>
                  <option value="pengerjaan">🛠️ Sepatu Sedang Dikerjakan di Workshop</option>
                  <option value="quality_check">🔍 Quality Control Lolos & Sterilisasi</option>
                  <option value="siap_antar">🎉 Sepatu Beres & Kurir Siap Mengantar Kembali</option>
                  <option value="selesai">✅ Servis Selesai & Garansi Aktif</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Catatan Tambahan (Opsional):</label>
                <textarea
                  value={notifNote}
                  onChange={(e) => setNotifNote(e.target.value)}
                  rows={2}
                  placeholder="Contoh: Kurir perkiraan sampai 15 menit lagi ya Kak."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateOrderStatus(notifModalOrder.id, notifStatus, notifNote.trim() || undefined);
                    const waUrl = buildStatusNotificationWhatsAppUrl(notifModalOrder, notifStatus, notifNote.trim() || undefined);
                    window.open(waUrl, '_blank');
                    setNotifModalOrder(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Buka & Kirim WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNotifModalOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
                >
                  Batal
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 6: ZOOM PREVIEW FOTO SEPATU RUSAK */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 p-4 space-y-3 shadow-2xl relative">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                📷 Detail Foto Fisik Sepatu Rusak (Dikirim Pelanggan)
              </span>
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-[70vh]">
              <img
                src={previewPhotoUrl}
                alt="Detail Sepatu Rusak"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
              <span>Periksa kondisi sol, jahitan, atau material sebelum kurir meluncur</span>
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs"
              >
                Tutup Foto
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
