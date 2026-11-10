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
  DollarSign,
  CreditCard,
  Send,
  Check,
  Wrench,
  PackageCheck,
  PlusCircle,
  ClipboardPaste,
  Sparkles,
  X,
  UserCheck,
  Edit3,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  Order,
  OrderStatus,
  CourierUser,
  PaymentStatus,
  DamageSeverity,
  ShoeType,
  ShoeItemDetail,
} from '../types';
import {
  STATUS_LABELS,
  SERVICES_CATALOG,
  CIREBON_AREAS,
  getServiceTierDetail,
  calculateDistanceToWorkshop,
} from '../data/solcreftData';
import {
  buildGoogleMapsRouteUrl,
  buildStatusNotificationWhatsAppUrl,
  buildRequestRealWaSherlockUrl,
  parseShareLocInput,
  parseWhatsAppOrderTextToOrder,
} from '../services/whatsappHelper';
import { soundFx } from '../services/soundEffects';

interface CourierDashboardProps {
  courierUser: CourierUser;
  orders: Order[];
  onAcceptOrder?: (orderId: string, courierName?: string, courierPhone?: string) => void;
  onOrderCreated?: (order: Order) => void;
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
  onUpdateOrderDetails?: (orderId: string, updatedFields: Partial<Order>, logNote?: string) => void;
  onDeleteOrder?: (orderId: string) => void;
  onLogout: () => void;
}

export const CourierDashboard: React.FC<CourierDashboardProps> = ({
  courierUser,
  orders,
  onAcceptOrder,
  onOrderCreated,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  onUpdateOrderLocation,
  onUpdateOrderDetails,
  onDeleteOrder,
}) => {
  const [filterTab, setFilterTab] = useState<
    'need_pickup' | 'in_transit' | 'ready_deliver' | 'cod_pending' | 'completed' | 'all'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Inline WA Paste Bar State
  const [inlineWaInput, setInlineWaInput] = useState('');

  // Modal Terima Cepat / Input Manual Pesanan
  const [isReceiveWaModalOpen, setIsReceiveWaModalOpen] = useState(false);
  const [rawWaMessage, setRawWaMessage] = useState('');
  const [qOrderId, setQOrderId] = useState('');
  const [qCustomerName, setQCustomerName] = useState('');
  const [qCustomerPhone, setQCustomerPhone] = useState('');
  const [qShoeBrand, setQShoeBrand] = useState('');
  const [qShoeType, setQShoeType] = useState<ShoeType>('Sneakers');
  const [qSeverity, setQSeverity] = useState<DamageSeverity>('normal');
  const [qServiceId, setQServiceId] = useState<string>(SERVICES_CATALOG[0].id);
  const [qPairsCount, setQPairsCount] = useState<number>(1);
  const [qAreaName, setQAreaName] = useState<string>('Kesambi');
  const [qLandmark, setQLandmark] = useState('');
  const [qSherlockInput, setQSherlockInput] = useState('');
  const [qPaymentMethod, setQPaymentMethod] = useState<'cod' | 'qris'>('cod');
  const [qCustomPrice, setQCustomPrice] = useState<number>(0);
  const [parseFeedback, setParseFeedback] = useState('');
  const [extractedFullOrder, setExtractedFullOrder] = useState<Order | null>(null);

  // Modal Cek Fisik / Edit Cepat Pesanan (Akurasi Tingkat Kerusakan & Harga di Lokasi)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editLandmark, setEditLandmark] = useState('');
  const [editAreaName, setEditAreaName] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'cod' | 'qris'>('cod');
  const [editDeliveryFee, setEditDeliveryFee] = useState<number>(0);
  const [editShoes, setEditShoes] = useState<ShoeItemDetail[]>([]);

  // Quick WA Sherlock & Patokan Sync State per Order Card
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [waShareLocText, setWaShareLocText] = useState('');
  const [waPatokanText, setWaPatokanText] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Notification Modal State
  const [activeModalOrder, setActiveModalOrder] = useState<Order | null>(null);
  const [modalTargetStatus, setModalTargetStatus] = useState<OrderStatus>('perjalanan_workshop');
  const [modalCustomNote, setModalCustomNote] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3800);
  };

  // Counters
  const countNeedPickup = orders.filter(
    (o) => o.status === 'menunggu_jemput' || !o.isAcceptedByAdmin
  ).length;
  const countInTransit = orders.filter(
    (o) =>
      o.isAcceptedByAdmin &&
      (o.status === 'perjalanan_workshop' || o.status === 'pengerjaan')
  ).length;
  const countReadyDeliver = orders.filter(
    (o) => o.status === 'siap_antar' || o.status === 'quality_check'
  ).length;
  const countCodPending = orders.filter(
    (o) => o.paymentMethod === 'cod' && o.paymentStatus !== 'cod_selesai'
  ).length;
  const countCompleted = orders.filter((o) => o.status === 'selesai').length;

  // Proses Kilat 1-Klik dari Teks WA / Link Sherlock
  const processInstantWaText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      showToast('Tempelkan teks pesan WA atau link Sherlock pelanggan terlebih dahulu.');
      return;
    }

    // 1. Cek apakah teks adalah format Pesanan WA atau Link ?kurir_order=
    const parsedOrderResult = parseWhatsAppOrderTextToOrder(trimmed, courierUser.name);
    if (parsedOrderResult && parsedOrderResult.order) {
      soundFx.playSuccess();
      const timeStr = new Date().toLocaleString('id-ID', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
      const readyOrder: Order = {
        ...parsedOrderResult.order,
        isAcceptedByAdmin: true,
        acceptedAt: timeStr + ' WIB',
        status: 'perjalanan_workshop',
        assignedCourier: courierUser.name,
        assignedCourierPhone: '08814519955',
        timeline: [
          {
            status: 'perjalanan_workshop',
            label: 'Diterima Cepat di Portal Kurir Soleman',
            timestamp: timeStr,
            description: `Pesanan #${parsedOrderResult.order.id} (${parsedOrderResult.order.customerName}) diterima akurat oleh ${courierUser.name}. Kurir meluncur ke lokasi.`,
          },
          ...parsedOrderResult.order.timeline,
        ],
      };

      if (onOrderCreated) {
        onOrderCreated(readyOrder);
      }
      setInlineWaInput('');
      showToast(
        `⚡ Order #${readyOrder.id} (${readyOrder.customerName} • ${readyOrder.pairsCount} psg) otomatis diterima & siap dijemput!`
      );
      return;
    }

    // 2. Jika bukan teks order lengkap, cek apakah berupa Link Google Maps / Koordinat Sherlock WA
    const parsedSherlock = parseShareLocInput(trimmed);
    if (parsedSherlock.lat || parsedSherlock.cleanUrl) {
      const targetOrder =
        orders.find((o) => !o.isAcceptedByAdmin || o.status === 'menunggu_jemput') ||
        orders.find((o) => o.status === 'perjalanan_workshop') ||
        orders[0];

      if (targetOrder && onUpdateOrderLocation) {
        soundFx.playSuccess();
        onUpdateOrderLocation(targetOrder.id, {
          lat: parsedSherlock.lat ?? targetOrder.location.lat,
          lng: parsedSherlock.lng ?? targetOrder.location.lng,
          accuracy: 5,
          mapsUrl: parsedSherlock.cleanUrl || trimmed,
        });
        setInlineWaInput('');
        showToast(
          `📍 Titik Sherlock WA berhasil dikunci akurat ke Order #${targetOrder.id} (${targetOrder.customerName})!`
        );
        return;
      }
    }

    // 3. Jika tidak dikenali otomatis, buka modal dengan isian yang ada
    setIsReceiveWaModalOpen(true);
    handleParseWaOrderMessage(trimmed);
  };

  // Smart Parser di dalam Modal
  const handleParseWaOrderMessage = (text: string) => {
    setRawWaMessage(text);
    if (!text.trim()) {
      setParseFeedback('');
      setExtractedFullOrder(null);
      return;
    }

    const result = parseWhatsAppOrderTextToOrder(text, courierUser.name);
    if (result && result.order) {
      const o = result.order;
      setExtractedFullOrder(o);
      setQOrderId(o.id);
      setQCustomerName(o.customerName);
      setQCustomerPhone(o.customerPhone);
      setQShoeBrand(o.shoeBrand);
      setQShoeType(o.shoeType);
      setQSeverity(o.severity || 'normal');
      if (o.selectedServices[0]) setQServiceId(o.selectedServices[0].id);
      setQPairsCount(o.pairsCount);
      setQAreaName(o.location.areaName);
      setQLandmark(o.location.landmark || '');
      if (o.location.mapsUrl || o.location.lat) {
        setQSherlockInput(
          o.location.mapsUrl || `${o.location.lat},${o.location.lng}`
        );
      }
      setQPaymentMethod(o.paymentMethod);
      setQCustomPrice(o.totalAmount);
      setParseFeedback(
        `✅ Akurat 100%: Order #${o.id} (${o.customerName} • ${o.pairsCount} pasang • Rp ${o.totalAmount.toLocaleString('id-ID')}) berhasil diekstrak!`
      );
      return;
    }

    const parsedLoc = parseShareLocInput(text);
    if (parsedLoc.cleanUrl || parsedLoc.lat) {
      setQSherlockInput(parsedLoc.cleanUrl || `${parsedLoc.lat},${parsedLoc.lng}`);
      setParseFeedback('📍 Titik koordinat / link Sherlock WA berhasil dibaca!');
    }
  };

  // Submit Terima Pesanan dari Modal WA / Input Cepat Kurir
  const handleConfirmReceiveFromWa = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playSuccess();

    const parsedSherlock = parseShareLocInput(qSherlockInput);
    const cleanArea = qAreaName.trim() || 'Kesambi';
    const cleanPatokan = qLandmark.trim() || `Titik Sherlock WA (${cleanArea})`;
    const cleanOrderId =
      qOrderId.trim().toUpperCase() || `SLC-${Math.floor(1000 + Math.random() * 9000)}`;
    const timeStr = new Date().toLocaleString('id-ID', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    // Jika hasil ekstrak otomatis multi-sepatu tersedia, gunakan datanya secara utuh
    if (extractedFullOrder && extractedFullOrder.id === cleanOrderId) {
      const completeOrder: Order = {
        ...extractedFullOrder,
        customerName: qCustomerName.trim() || extractedFullOrder.customerName,
        customerPhone: qCustomerPhone.trim() || extractedFullOrder.customerPhone,
        paymentMethod: qPaymentMethod,
        paymentStatus: qPaymentMethod === 'cod' ? 'cod_pending' : 'menunggu_pembayaran',
        totalAmount: qCustomPrice > 0 ? qCustomPrice : extractedFullOrder.totalAmount,
        status: 'perjalanan_workshop',
        isAcceptedByAdmin: true,
        acceptedAt: timeStr + ' WIB',
        assignedCourier: courierUser.name,
        assignedCourierPhone: '08814519955',
        location: {
          ...extractedFullOrder.location,
          areaName: cleanArea,
          landmark: cleanPatokan,
          fullAddress: `${cleanPatokan} (Kec. ${cleanArea})`,
          lat: parsedSherlock.lat ?? extractedFullOrder.location.lat,
          lng: parsedSherlock.lng ?? extractedFullOrder.location.lng,
          accuracy: parsedSherlock.lat ? 5 : extractedFullOrder.location.accuracy,
          mapsUrl: parsedSherlock.cleanUrl || extractedFullOrder.location.mapsUrl,
        },
      };

      if (onOrderCreated) {
        onOrderCreated(completeOrder);
      }
      resetReceiveModal();
      showToast(`Pesanan #${completeOrder.id} diterima akurat ke daftar tugas Kurir!`);
      return;
    }

    // Jika order manual baru dari form
    const chosenService =
      SERVICES_CATALOG.find((s) => s.id === qServiceId) || SERVICES_CATALOG[0];
    const tierDetail = getServiceTierDetail(chosenService, qSeverity);
    const serviceTotal = tierDetail.price * Math.max(1, qPairsCount);
    const isKota = ['kesambi', 'kejaksan', 'pekalipan', 'lemahwungkuk', 'harjamukti'].some(
      (k) => cleanArea.toLowerCase().includes(k)
    );
    const autoDeliveryFee = isKota || qPairsCount >= 2 ? 0 : 10000;
    const finalTotal = qCustomPrice > 0 ? qCustomPrice : serviceTotal + autoDeliveryFee;

    const newOrder: Order = {
      id: cleanOrderId,
      customerName: qCustomerName.trim() || 'Pelanggan WA Soleman',
      customerPhone: qCustomerPhone.trim() || '08814519955',
      shoeBrand: qShoeBrand.trim() || 'Sepatu Pelanggan',
      shoeType: qShoeType,
      material: 'Canvas / Kain',
      severity: qSeverity,
      pairsCount: Math.max(1, qPairsCount),
      selectedServices: [chosenService],
      shoes: Array.from({ length: Math.max(1, qPairsCount) }).map((_, idx) => ({
        id: `pair-${idx + 1}`,
        pairNumber: idx + 1,
        shoeBrand:
          qPairsCount > 1
            ? `${qShoeBrand.trim() || 'Sepatu'} #${idx + 1}`
            : qShoeBrand.trim() || 'Sepatu Pelanggan',
        shoeType: qShoeType,
        material: 'Canvas / Kain',
        severity: qSeverity,
        selectedServices: [chosenService],
        price: tierDetail.price,
      })),
      pickupType: 'antar_jemput',
      preferredTimeSlot: 'siang',
      distanceZone: isKota ? 'dekat_kota' : 'jauh_kabupaten',
      logisticsPartner: 'kurir_soleman',
      location: {
        areaName: cleanArea,
        areaType: isKota ? 'Kota' : 'Kabupaten',
        shareLocViaWhatsApp: true,
        landmark: cleanPatokan,
        fullAddress: `${cleanPatokan} (Kec. ${cleanArea})`,
        lat: parsedSherlock.lat,
        lng: parsedSherlock.lng,
        accuracy: parsedSherlock.lat ? 5 : undefined,
        mapsUrl: parsedSherlock.cleanUrl,
      },
      paymentMethod: qPaymentMethod,
      paymentStatus: qPaymentMethod === 'cod' ? 'cod_pending' : 'menunggu_pembayaran',
      totalServicesPrice: serviceTotal,
      deliveryFee: autoDeliveryFee,
      totalAmount: finalTotal,
      status: 'perjalanan_workshop',
      isAcceptedByAdmin: true,
      acceptedAt: timeStr + ' WIB',
      assignedCourier: courierUser.name,
      assignedCourierPhone: '08814519955',
      createdAt: new Date().toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      estimatedFinishedAt: tierDetail.durationEst || '1 - 2 Hari Kerja',
      technicianName: 'Master Teknisi Soleman',
      timeline: [
        {
          status: 'perjalanan_workshop',
          label: 'Diterima Langsung di Portal Kurir Soleman',
          timestamp: timeStr,
          description: `Pesanan & Patokan "${cleanPatokan}" (${cleanArea}) diterima oleh ${courierUser.name}. Kurir meluncur ke titik Sherlock WA.`,
        },
      ],
    };

    if (onOrderCreated) {
      onOrderCreated(newOrder);
    }

    resetReceiveModal();
    showToast(`Order baru #${newOrder.id} berhasil diterima ke tugas Kurir!`);
  };

  const resetReceiveModal = () => {
    setRawWaMessage('');
    setQOrderId('');
    setQCustomerName('');
    setQCustomerPhone('');
    setQShoeBrand('');
    setQPairsCount(1);
    setQLandmark('');
    setQSherlockInput('');
    setQCustomPrice(0);
    setParseFeedback('');
    setExtractedFullOrder(null);
    setIsReceiveWaModalOpen(false);
  };

  // Buka Modal Cek Fisik / Edit Cepat Pesanan
  const handleOpenEditOrder = (order: Order) => {
    soundFx.playClick();
    setEditingOrder(order);
    setEditLandmark(order.location.landmark || '');
    setEditAreaName(order.location.areaName || 'Kesambi');
    setEditPaymentMethod(order.paymentMethod);
    setEditDeliveryFee(order.deliveryFee);

    if (order.shoes && order.shoes.length > 0) {
      setEditShoes(
        order.shoes.map((sh) => ({
          ...sh,
          selectedServices: [...sh.selectedServices],
        }))
      );
    } else {
      const defaultServices =
        order.selectedServices.length > 0
          ? order.selectedServices
          : [SERVICES_CATALOG[0]];
      const defaultSev = order.severity || 'normal';
      setEditShoes([
        {
          id: 'pair-1',
          pairNumber: 1,
          shoeBrand: order.shoeBrand,
          shoeType: order.shoeType,
          material: order.material || 'Canvas / Kain',
          severity: defaultSev,
          selectedServices: defaultServices,
          price: defaultServices.reduce(
            (sum, s) => sum + getServiceTierDetail(s, defaultSev).price,
            0
          ),
        },
      ]);
    }
  };

  // Simpan Hasil Cek Fisik / Edit Pesanan
  const handleSaveEditedOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder || !onUpdateOrderDetails) return;
    soundFx.playSuccess();

    const recalculatedShoes = editShoes.map((sh, idx) => {
      const pairPrice = sh.selectedServices.reduce(
        (sum, s) => sum + getServiceTierDetail(s, sh.severity).price,
        0
      );
      return {
        ...sh,
        pairNumber: idx + 1,
        price: pairPrice,
      };
    });

    const newTotalServicesPrice = recalculatedShoes.reduce(
      (sum, sh) => sum + sh.price,
      0
    );
    const newTotalAmount = newTotalServicesPrice + editDeliveryFee;
    const allServices = recalculatedShoes.flatMap((sh) => sh.selectedServices);
    const summaryBrand =
      recalculatedShoes.length === 1
        ? recalculatedShoes[0].shoeBrand
        : `${recalculatedShoes[0].shoeBrand} (+${recalculatedShoes.length - 1} psg lain)`;

    onUpdateOrderDetails(
      editingOrder.id,
      {
        shoeBrand: summaryBrand,
        shoeType: recalculatedShoes[0]?.shoeType || editingOrder.shoeType,
        severity: recalculatedShoes[0]?.severity || editingOrder.severity,
        pairsCount: recalculatedShoes.length,
        selectedServices: allServices,
        shoes: recalculatedShoes,
        paymentMethod: editPaymentMethod,
        totalServicesPrice: newTotalServicesPrice,
        deliveryFee: editDeliveryFee,
        totalAmount: newTotalAmount,
        location: {
          ...editingOrder.location,
          areaName: editAreaName.trim() || editingOrder.location.areaName,
          landmark: editLandmark.trim() || editingOrder.location.landmark,
          fullAddress: editLandmark.trim()
            ? `${editLandmark.trim()} (Kec. ${editAreaName.trim()})`
            : editingOrder.location.fullAddress,
        },
      },
      `Cek fisik sepatu oleh ${courierUser.name}: ${recalculatedShoes.length} pasang, Total akurat Rp ${newTotalAmount.toLocaleString('id-ID')}.`
    );

    setEditingOrder(null);
    showToast(
      `Data pesanan #${editingOrder.id} & harga tingkat kerusakan berhasil disesuaikan secara akurat!`
    );
  };

  // Handler Terima Pesanan Langsung pada Kartu Order
  const handleQuickAcceptCard = (order: Order, openWaConfirmation: boolean) => {
    soundFx.playSuccess();
    if (onAcceptOrder) {
      onAcceptOrder(order.id, courierUser.name, '08814519955');
    } else {
      onUpdateOrderStatus(
        order.id,
        'perjalanan_workshop',
        `Pesanan diterima oleh ${courierUser.name}. Kurir Soleman sedang meluncur ke lokasi penjemputan (${order.location.landmark || order.location.areaName}).`
      );
    }
    showToast(
      `⚡ Pesanan #${order.id} (${order.customerName}) diterima! Status: Meluncur Jemput.`
    );

    if (openWaConfirmation) {
      const waUrl = buildRequestRealWaSherlockUrl(order);
      window.open(waUrl, '_blank');
    }
  };

  // Filtered & Sorted Orders (Prioritaskan yang belum diterima / menunggu_jemput di paling atas)
  const filteredOrders = orders
    .filter((order) => {
      let matchTab = true;
      if (filterTab === 'need_pickup')
        matchTab = order.status === 'menunggu_jemput' || !order.isAcceptedByAdmin;
      else if (filterTab === 'in_transit')
        matchTab =
          !!order.isAcceptedByAdmin &&
          (order.status === 'perjalanan_workshop' || order.status === 'pengerjaan');
      else if (filterTab === 'ready_deliver')
        matchTab = order.status === 'siap_antar' || order.status === 'quality_check';
      else if (filterTab === 'cod_pending')
        matchTab =
          order.paymentMethod === 'cod' && order.paymentStatus !== 'cod_selesai';
      else if (filterTab === 'completed') matchTab = order.status === 'selesai';

      const q = searchQuery.toLowerCase();
      const matchSearch =
        order.id.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.includes(q) ||
        order.shoeBrand.toLowerCase().includes(q) ||
        order.location.areaName.toLowerCase().includes(q) ||
        (order.location.landmark || '').toLowerCase().includes(q) ||
        order.location.fullAddress.toLowerCase().includes(q);

      return matchTab && matchSearch;
    })
    .sort((a, b) => {
      const aNew = !a.isAcceptedByAdmin || a.status === 'menunggu_jemput' ? 1 : 0;
      const bNew = !b.isAcceptedByAdmin || b.status === 'menunggu_jemput' ? 1 : 0;
      return bNew - aNew;
    });

  const handleOpenNotification = (order: Order, defaultStatus: OrderStatus) => {
    setActiveModalOrder(order);
    setModalTargetStatus(defaultStatus);
    setModalCustomNote('');
  };

  const handleSendNotification = () => {
    if (!activeModalOrder) return;
    onUpdateOrderStatus(
      activeModalOrder.id,
      modalTargetStatus,
      modalCustomNote.trim() || undefined
    );
    const waUrl = buildStatusNotificationWhatsAppUrl(
      activeModalOrder,
      modalTargetStatus,
      modalCustomNote.trim() || undefined
    );
    window.open(waUrl, '_blank');
    setActiveModalOrder(null);
  };

  const getStepNumber = (order: Order): number => {
    if (!order.isAcceptedByAdmin || order.status === 'menunggu_jemput') return 1;
    if (order.status === 'perjalanan_workshop' || order.status === 'pengerjaan') return 2;
    if (order.status === 'quality_check' || order.status === 'siap_antar') return 3;
    return 4;
  };

  return (
    <section id="dashboard" className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md px-4 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs shadow-2xl flex items-center gap-2 border-2 border-emerald-300 animate-bounce">
          <CheckCircle2 className="w-4 h-4 stroke-[2.5] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. PUSAT KONTROL & TERIMA KILAT PESANAN KURIR SOLEMAN */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Armada Jemput-Antar Aktif Cirebon</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                WA Kurir: 0881-4519-955
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-display">
              Portal Pesanan & Navigasi {courierUser.name}
            </h1>
            <p className="text-xs text-slate-400">
              Terima pesanan pelanggan dalam 1 klik, kunci lokasi Sherlock Asli WA & patokan rumah, serta sesuaikan kerusakan fisik di lapangan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={async () => {
                soundFx.playClick();
                try {
                  if (navigator.clipboard && navigator.clipboard.readText) {
                    const clip = await navigator.clipboard.readText();
                    if (clip && clip.trim()) {
                      processInstantWaText(clip);
                      return;
                    }
                  }
                } catch {
                  // Fallback jika clipboard diblokir browser
                }
                setIsReceiveWaModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
              title="Salin chat order WA atau link Sherlock pelanggan lalu klik tombol ini"
            >
              <ClipboardPaste className="w-4 h-4 stroke-[2.5]" />
              <span>📋 1-Klik Tempel Otomatis dari WA</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setIsReceiveWaModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Input / Terima Pesanan Baru</span>
            </button>
          </div>
        </div>

        {/* BAR TEMPEL CEPAT INLINE (TANPA PERLU BUKA MODAL) */}
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/90 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 shrink-0 px-1">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Terima Kilat WA:</span>
          </div>
          <input
            type="text"
            value={inlineWaInput}
            onChange={(e) => setInlineWaInput(e.target.value)}
            placeholder="Tempel (Paste) pesan order WhatsApp pelanggan atau link Sherlock Maps WA di sini..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <button
            type="button"
            onClick={() => processInstantWaText(inlineWaInput)}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 font-black text-xs transition-all cursor-pointer shrink-0"
          >
            Proses & Terima Akurat
          </button>
        </div>

        {/* 4 KARTU RINGKASAN TUGAS (KPI FILTER CARDS) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <button
            type="button"
            onClick={() =>
              setFilterTab(filterTab === 'need_pickup' ? 'all' : 'need_pickup')
            }
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filterTab === 'need_pickup'
                ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/40'
                : countNeedPickup > 0
                ? 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/15'
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-amber-400">
                1. Antrean Jemput
              </span>
              <Truck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                {countNeedPickup}
              </span>
              {countNeedPickup > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                  Siap Jemput
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Pesanan baru masuk pelanggan
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setFilterTab(filterTab === 'in_transit' ? 'all' : 'in_transit')
            }
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filterTab === 'in_transit'
                ? 'bg-emerald-500/20 border-emerald-400 ring-1 ring-emerald-400/40'
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-400">
                2. Dijemput / Workshop
              </span>
              <Wrench className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1.5 font-mono">
              {countInTransit}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              OTW jemput & pengerjaan teknisi
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setFilterTab(
                filterTab === 'ready_deliver' ? 'all' : 'ready_deliver'
              )
            }
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filterTab === 'ready_deliver'
                ? 'bg-sky-500/20 border-sky-400 ring-1 ring-sky-400/40'
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-sky-400">
                3. Siap Antar Balik
              </span>
              <PackageCheck className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1.5 font-mono">
              {countReadyDeliver}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Lolos QC di Sukalila Selatan
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setFilterTab(filterTab === 'cod_pending' ? 'all' : 'cod_pending')
            }
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filterTab === 'cod_pending'
                ? 'bg-purple-500/20 border-purple-400 ring-1 ring-purple-400/40'
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-purple-400">
                4. Tagihan COD & Selesai
              </span>
              <DollarSign className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                {countCodPending}
              </span>
              <span className="text-[11px] text-slate-400">
                COD ({countCompleted} Selesai)
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Tagih tunai saat serah terima
            </span>
          </button>
        </div>
      </div>

      {/* 2. FILTER TABS & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
          {[
            { id: 'all', label: `Semua (${orders.length})` },
            {
              id: 'need_pickup',
              label: `📥 Antrean Jemput (${countNeedPickup})`,
              highlight: countNeedPickup > 0,
            },
            {
              id: 'in_transit',
              label: `🛵 Dijemput / Workshop (${countInTransit})`,
            },
            {
              id: 'ready_deliver',
              label: `📦 Siap Antar (${countReadyDeliver})`,
            },
            { id: 'cod_pending', label: `💵 Tagihan COD (${countCodPending})` },
            { id: 'completed', label: `✅ Selesai (${countCompleted})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : tab.highlight
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[270px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Kode Order, Nama, Patokan, Kecamatan..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* 3. DAFTAR PESANAN KURIR YANG RAPIH, AKURAT & CEPAT */}
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const statusConfig = STATUS_LABELS[order.status];
          const isNewUnaccepted =
            !order.isAcceptedByAdmin || order.status === 'menunggu_jemput';
          const hasExactSherlock = Boolean(
            (order.location.lat && order.location.lng) || order.location.mapsUrl
          );
          const isSyncingThisOrder = syncingOrderId === order.id;
          const activeStep = getStepNumber(order);

          const navigationUrl = buildGoogleMapsRouteUrl(
            order.location.lat,
            order.location.lng,
            order.location.areaName || order.location.fullAddress,
            order.location.landmark,
            order.location.mapsUrl
          );

          return (
            <div
              key={order.id}
              className={`rounded-3xl border transition-all overflow-hidden shadow-xl ${
                isNewUnaccepted
                  ? 'bg-slate-900 border-amber-500/60 ring-1 ring-amber-500/30'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Banner Prioritas Pesanan Baru Masuk */}
              {isNewUnaccepted && (
                <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-emerald-500/15 border-b border-amber-500/30 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    <span>
                      PESANAN BARU MASUK — SIAP DITERIMA & DIJEMPUT KURIR SOLEMAN
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickAcceptCard(order, false)}
                      className="px-3.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-sm cursor-pointer transition-all"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Terima & Meluncur Jemput</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Header Kartu: Identitas Pelanggan + Stepper Progres + Tagihan */}
              <div className="px-5 py-3.5 border-b border-slate-800/90 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-black text-xs rounded-xl shrink-0">
                    #{order.id}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-white">
                        {order.customerName}
                      </h3>
                      <a
                        href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1 font-mono font-bold"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{order.customerPhone}</span>
                      </a>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Sesi Jemput:{' '}
                      <strong className="text-amber-300 uppercase">
                        {order.preferredTimeSlot}
                      </strong>{' '}
                      • Masuk: {order.createdAt}
                    </p>
                  </div>
                </div>

                {/* 4-Step Visual Progress Bar */}
                <div className="flex items-center gap-1.5 text-[10px] font-bold bg-slate-950/90 px-3 py-1.5 rounded-xl border border-slate-800">
                  {[
                    { step: 1, label: '1. Jemput' },
                    { step: 2, label: '2. Workshop' },
                    { step: 3, label: '3. Siap Antar' },
                    { step: 4, label: '4. Selesai' },
                  ].map((st, idx) => (
                    <React.Fragment key={st.step}>
                      <span
                        className={`px-2 py-0.5 rounded-md transition-colors ${
                          activeStep === st.step
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : activeStep > st.step
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {st.label}
                      </span>
                      {idx < 3 && <span className="text-slate-700">➔</span>}
                    </React.Fragment>
                  ))}
                </div>

                {/* Badges Pembayaran & Status */}
                <div className="flex flex-wrap items-center gap-2">
                  {order.paymentMethod === 'cod' ? (
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                        order.paymentStatus === 'cod_selesai'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>
                        COD: Rp {order.totalAmount.toLocaleString('id-ID')} (
                        {order.paymentStatus === 'cod_selesai'
                          ? 'LUNAS'
                          : 'TAGIH TUNAI'}
                        )
                      </span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-xl text-xs font-bold border bg-sky-500/20 text-sky-300 border-sky-500/40 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>
                        QRIS Rp {order.totalAmount.toLocaleString('id-ID')} (
                        {order.paymentStatus === 'lunas' ? 'LUNAS' : 'Non-Tunai'}
                        )
                      </span>
                    </span>
                  )}

                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-bold border ${statusConfig.badgeBg}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>
              </div>

              {/* Body Kartu: 3 Kolom Proporsional & Rapi */}
              <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* KOLOM 1: LOKASI SHERLOCK ASLI WA & PATOKAN PELANGGAN (5 Cols) */}
                <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" /> 1. Lokasi & Sherlock Asli WA
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          hasExactSherlock
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {hasExactSherlock
                          ? '✅ Sherlock Terkunci'
                          : '📲 Sherlock via Chat WA'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800">
                      <span className="text-slate-300">
                        Kecamatan:{' '}
                        <strong className="text-white">
                          {order.location.areaName}
                        </strong>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-amber-300 font-bold">
                        {order.location.areaType || 'Cirebon'}
                      </span>
                    </div>

                    {/* Kotak Patokan Rumah Pelanggan */}
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                        🚩 Patokan Rumah / Lokasi Pelanggan:
                      </span>
                      <p className="text-xs font-bold text-white leading-snug">
                        {order.location.landmark || order.location.fullAddress}
                      </p>
                    </div>

                    {/* Koordinat / Status Sherlock Asli WA & Jarak KM */}
                    {order.location.lat && order.location.lng ? (
                      <div className="text-[11px] font-mono text-emerald-300 flex items-center justify-between flex-wrap gap-1 bg-emerald-950/40 px-3 py-2 rounded-xl border border-emerald-500/30">
                        <span>
                          🛰️ GPS: {order.location.lat.toFixed(5)}, {order.location.lng.toFixed(5)}
                        </span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                            🎯 {calculateDistanceToWorkshop(order.location.lat, order.location.lng)} KM
                          </span>
                          <span className="text-slate-400 font-sans text-[10px]">
                            ±{order.location.accuracy || 5}m
                          </span>
                        </div>
                      </div>
                    ) : order.location.mapsUrl ? (
                      <div className="text-[11px] text-emerald-300 flex items-center justify-between bg-emerald-950/40 px-3 py-2 rounded-xl border border-emerald-500/30">
                        <span className="truncate pr-2">
                          🔗 Link Sherlock WA Tersimpan
                        </span>
                        <span className="font-bold shrink-0">Akurat</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Tombol Navigasi & Sinkronisasi Sherlock Asli WA */}
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={buildRequestRealWaSherlockUrl(order)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl text-xs font-extrabold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition-all"
                        title="Buka Chat WA & Minta/Lihat Sherlock Asli Fitur Lokasi WA"
                      >
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Sherlock Asli WA</span>
                      </a>

                      <a
                        href={navigationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl text-xs font-extrabold bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md transition-all"
                      >
                        <Navigation className="w-3.5 h-3.5 fill-slate-950 shrink-0" />
                        <span className="truncate">Navigasi Rute</span>
                      </a>
                    </div>

                    {onUpdateOrderLocation && (
                      <div>
                        {!isSyncingThisOrder ? (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                if (
                                  navigator.clipboard &&
                                  navigator.clipboard.readText
                                ) {
                                  const clip =
                                    await navigator.clipboard.readText();
                                  const parsed = parseShareLocInput(clip);
                                  if (parsed.lat || parsed.cleanUrl) {
                                    onUpdateOrderLocation(order.id, {
                                      lat: parsed.lat ?? order.location.lat,
                                      lng: parsed.lng ?? order.location.lng,
                                      accuracy: 5,
                                      mapsUrl: parsed.cleanUrl || clip.trim(),
                                    });
                                    showToast(
                                      `📍 Titik Sherlock WA untuk #${order.id} berhasil dikunci akurat!`
                                    );
                                    return;
                                  }
                                }
                              } catch {
                                // Buka form manual jika clipboard tidak diizinkan
                              }
                              setSyncingOrderId(order.id);
                              setWaShareLocText(order.location.mapsUrl || '');
                              setWaPatokanText(order.location.landmark || '');
                            }}
                            className="w-full py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-amber-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <ClipboardPaste className="w-3.5 h-3.5" />
                            <span>
                              Tempel Titik Sherlock dari WA / Edit Patokan
                            </span>
                          </button>
                        ) : (
                          <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/40 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-300 text-[11px]">
                                Kunci Titik Sherlock WA & Patokan:
                              </span>
                              <button
                                type="button"
                                onClick={() => setSyncingOrderId(null)}
                                className="text-slate-400 hover:text-white"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={waPatokanText}
                              onChange={(e) => setWaPatokanText(e.target.value)}
                              placeholder="Patokan rumah (misal: Pagar hitam depan masjid)"
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                            />
                            <input
                              type="text"
                              value={waShareLocText}
                              onChange={(e) => setWaShareLocText(e.target.value)}
                              placeholder="Tempel koordinat / link Maps dari Sherlock WA..."
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-mono focus:outline-none focus:border-emerald-400"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const parsed =
                                    parseShareLocInput(waShareLocText);
                                  const cleanPatokan =
                                    waPatokanText.trim() ||
                                    order.location.landmark;
                                  onUpdateOrderLocation(order.id, {
                                    landmark: cleanPatokan,
                                    fullAddress: cleanPatokan
                                      ? `${cleanPatokan} (Kec. ${order.location.areaName})`
                                      : order.location.fullAddress,
                                    lat: parsed.lat ?? order.location.lat,
                                    lng: parsed.lng ?? order.location.lng,
                                    accuracy: parsed.lat
                                      ? 5
                                      : order.location.accuracy,
                                    mapsUrl:
                                      parsed.cleanUrl ||
                                      waShareLocText.trim() ||
                                      order.location.mapsUrl,
                                  });
                                  setSyncingOrderId(null);
                                  showToast(
                                    `Lokasi Sherlock #${order.id} berhasil diperbarui!`
                                  );
                                }}
                                className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                              >
                                Simpan Akurat
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

                {/* KOLOM 2: RINCIAN SEPATU, TINGKAT KERUSAKAN & BIAYA AKURAT (4 Cols) */}
                <div className="lg:col-span-4 flex flex-col justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                        2. Sepatu & Tingkat Kerusakan
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-amber-400 font-mono">
                          {order.pairsCount} Pasang
                        </span>
                        {onUpdateOrderDetails && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditOrder(order)}
                            className="px-2 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[10px] font-bold text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                            title="Sesuaikan tingkat kerusakan, layanan, atau jumlah pasang saat cek fisik di lokasi"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Cek Fisik / Edit</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {order.shoes && order.shoes.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {order.shoes.map((sh, idx) => {
                          const sevBadge =
                            sh.severity === 'hard'
                              ? {
                                  label: '🔴 Berat / Parah',
                                  cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
                                }
                              : sh.severity === 'kecil'
                              ? {
                                  label: '🟢 Ringan',
                                  cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                                }
                              : {
                                  label: '🟡 Sedang',
                                  cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                                };
                          return (
                            <div
                              key={sh.id || idx}
                              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold text-white truncate">
                                  #{idx + 1} {sh.shoeBrand}
                                </span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border shrink-0 ${sevBadge.cls}`}
                                >
                                  {sevBadge.label}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {sh.shoeType} •{' '}
                                <span className="text-amber-300">
                                  {sh.material}
                                </span>
                              </div>
                              <div className="space-y-0.5 pt-1 border-t border-slate-800/80">
                                {sh.selectedServices.map((s) => {
                                  const tier = getServiceTierDetail(
                                    s,
                                    sh.severity
                                  );
                                  return (
                                    <div
                                      key={s.id}
                                      className="flex items-center justify-between text-[11px] text-slate-300"
                                    >
                                      <span className="truncate pr-1">
                                        • {s.name}
                                      </span>
                                      <span className="font-mono text-amber-300 shrink-0">
                                        {tier.priceFormatted}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                        <div className="text-xs font-bold text-white">
                          {order.shoeBrand}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {order.shoeType}
                        </div>
                        <div className="pt-1 border-t border-slate-800 space-y-1">
                          {order.selectedServices.map((s) => {
                            const orderSev = order.severity || 'normal';
                            const tier = getServiceTierDetail(s, orderSev);
                            return (
                              <div
                                key={s.id}
                                className="flex items-center justify-between text-xs text-slate-300"
                              >
                                <span className="truncate pr-1">
                                  • {s.name} ({tier.badge})
                                </span>
                                <span className="font-mono text-amber-300 shrink-0">
                                  {tier.priceFormatted}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {order.customNotes && (
                      <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                        Catatan: "{order.customNotes}"
                      </p>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-slate-800 space-y-1">
                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                      <span>Subtotal Servis ({order.pairsCount} psg):</span>
                      <span className="font-mono text-slate-200">
                        Rp {order.totalServicesPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                      <span>Ongkir Kurir Cirebon:</span>
                      <span className="font-bold text-emerald-400">
                        {order.deliveryFee === 0
                          ? 'GRATIS'
                          : `Rp ${order.deliveryFee.toLocaleString('id-ID')}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-black pt-1 border-t border-slate-800/60">
                      <span className="text-slate-200">Total Tagihan Akurat:</span>
                      <span className="text-amber-400 font-mono text-sm">
                        Rp {order.totalAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* KOLOM 3: EKSEKUSI CEPAT KURIR (HANYA TOMBOL TAHAP AKTIF, RAPIH TANPA MENUMPUK) (3 Cols) */}
                <div className="lg:col-span-3 flex flex-col justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3">
                  <div className="space-y-2.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Wrench className="w-4 h-4" /> 3. Eksekusi Tugas Kurir
                    </span>

                    {/* TAHAP 1: PESANAN BARU / MENUNGGU JEMPUT */}
                    {isNewUnaccepted && (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => handleQuickAcceptCard(order, false)}
                          className="w-full py-3 px-3 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                        >
                          <UserCheck className="w-4 h-4 stroke-[2.5]" />
                          <span>Terima & Meluncur Jemput</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickAcceptCard(order, true)}
                          className="w-full py-2 px-3 rounded-xl text-[11px] font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Terima + WA Minta Sherlock</span>
                        </button>
                      </div>
                    )}

                    {/* TAHAP 2: SEDANG DIJEMPUT -> TIBA DI WORKSHOP SUKALILA */}
                    {!isNewUnaccepted &&
                      order.status === 'perjalanan_workshop' && (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => {
                              soundFx.playSuccess();
                              onUpdateOrderStatus(
                                order.id,
                                'pengerjaan',
                                'Sepatu telah tiba di Workshop Sukalila Selatan & mulai ditangani teknisi Soleman.'
                              );
                              showToast(
                                `🛠️ Order #${order.id} tiba di Workshop & masuk tahap pengerjaan!`
                              );
                            }}
                            className="w-full py-3 px-3 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                          >
                            <Wrench className="w-4 h-4" />
                            <span>Sepatu Tiba di Workshop</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleOpenNotification(
                                order,
                                'perjalanan_workshop'
                              )
                            }
                            className="w-full py-2 px-3 rounded-xl text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>WA Pelanggan: Kurir OTW</span>
                          </button>
                        </div>
                      )}

                    {/* TAHAP 3: DI WORKSHOP / LOLOS QC -> MULAI ANTAR BALIK */}
                    {!isNewUnaccepted &&
                      (order.status === 'pengerjaan' ||
                        order.status === 'quality_check') && (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => {
                              soundFx.playSuccess();
                              onUpdateOrderStatus(
                                order.id,
                                'siap_antar',
                                'Reparasi selesai & lolos QC. Kurir Soleman sedang mengantar kembali ke lokasi pelanggan.'
                              );
                              showToast(
                                `🛵 Order #${order.id} dibawa Kurir untuk diantar balik ke pelanggan!`
                              );
                            }}
                            className="w-full py-3 px-3 rounded-xl text-xs font-black bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                          >
                            <PackageCheck className="w-4 h-4" />
                            <span>Ambil & Mulai Antar Balik</span>
                          </button>
                        </div>
                      )}

                    {/* TAHAP 4: SIAP ANTAR -> SELESAI SERAH TERIMA & LUNAS */}
                    {!isNewUnaccepted && order.status === 'siap_antar' && (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playSuccess();
                            onUpdateOrderStatus(
                              order.id,
                              'selesai',
                              'Sepatu telah diserahterimakan kepada pelanggan dengan baik. Garansi servis aktif.'
                            );
                            if (order.paymentMethod === 'cod') {
                              onUpdatePaymentStatus(order.id, 'cod_selesai');
                            } else {
                              onUpdatePaymentStatus(order.id, 'lunas');
                            }
                            showToast(
                              `✅ Order #${order.id} selesai diserahterimakan & lunas!`
                            );
                          }}
                          className="w-full py-3 px-3 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          <span>Selesai Serah Terima & Lunas</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleOpenNotification(order, 'siap_antar')
                          }
                          className="w-full py-2 px-3 rounded-xl text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>WA Pelanggan: Siap Diantar</span>
                        </button>
                      </div>
                    )}

                    {/* TAHAP 5: SELESAI */}
                    {order.status === 'selesai' && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1.5">
                        <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xs font-extrabold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Tugas Selesai & Lunas</span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenNotification(order, 'selesai')
                          }
                          className="w-full py-1.5 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-[11px] font-bold cursor-pointer"
                        >
                          Kirim Nota Garansi via WA
                        </button>
                      </div>
                    )}

                    {/* Status Pembayaran COD Quick Toggle */}
                    {order.paymentMethod === 'cod' && (
                      <div className="pt-1">
                        {order.paymentStatus === 'cod_selesai' ? (
                          <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-[11px] font-bold bg-emerald-500/10 py-2 px-2.5 rounded-xl border border-emerald-500/20">
                            <Check className="w-3.5 h-3.5" />
                            <span>Tunai COD Sudah Diterima</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              soundFx.playSuccess();
                              onUpdatePaymentStatus(order.id, 'cod_selesai');
                              showToast(
                                `💵 Pembayaran COD Rp ${order.totalAmount.toLocaleString('id-ID')} dicatat LUNAS!`
                              );
                            }}
                            className="w-full py-2 px-2.5 rounded-xl text-[11px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Catat Terima Tunai COD</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Kontrol Ubah Status Manual & Kirim WA */}
                  <div className="pt-2.5 border-t border-slate-800 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={order.status}
                        onChange={(e) => {
                          onUpdateOrderStatus(
                            order.id,
                            e.target.value as OrderStatus
                          );
                          showToast(`Status #${order.id} diperbarui!`);
                        }}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-amber-400"
                      >
                        <option value="menunggu_jemput">
                          1. Menunggu Jemput
                        </option>
                        <option value="perjalanan_workshop">
                          2. Kurir Menjemput
                        </option>
                        <option value="pengerjaan">3. Servis Workshop</option>
                        <option value="quality_check">4. Lolos QC</option>
                        <option value="siap_antar">5. Siap Diantar</option>
                        <option value="selesai">6. Selesai</option>
                      </select>

                      {onDeleteOrder && (
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteOrder(order.id);
                            showToast(`Pesanan #${order.id} dihapus.`);
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-slate-800 transition-colors cursor-pointer"
                          title="Hapus pesanan ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleOpenNotification(
                          order,
                          order.status === 'menunggu_jemput'
                            ? 'perjalanan_workshop'
                            : order.status === 'siap_antar'
                            ? 'selesai'
                            : 'siap_antar'
                        )
                      }
                      className="w-full py-1.5 px-3 rounded-xl text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Send className="w-3 h-3 text-emerald-400" />
                      <span>Kirim Kabar Status via WA</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="text-center py-14 bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
            <Truck className="w-10 h-10 text-slate-600 mx-auto" />
            <div>
              <h4 className="text-white font-bold text-sm">
                Belum ada pesanan pada kategori ini
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Gunakan tombol{' '}
                <strong>"📋 1-Klik Tempel Otomatis dari WA"</strong> di atas
                untuk memasukkan pesanan baru dari WhatsApp pelanggan.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: TERIMA CEPAT PESANAN DARI CHAT WHATSAPP PELANGGAN */}
      {isReceiveWaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-amber-500/40 p-6 sm:p-7 space-y-5 shadow-2xl my-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3.5">
              <div>
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Penerimaan Akurat Portal
                  Kurir Soleman
                </span>
                <h3 className="text-lg font-extrabold text-white mt-0.5">
                  Terima Pesanan & Sherlock dari Chat WhatsApp
                </h3>
                <p className="text-xs text-slate-400">
                  Tempel teks order dari chat WA pelanggan untuk ekstraksi
                  otomatis 100% akurat, atau isi manual di bawah.
                </p>
              </div>
              <button
                type="button"
                onClick={resetReceiveModal}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Kotak Paste Otomatis dari Chat WhatsApp */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-emerald-400">
                  📲 Tempel Pesan Order dari WhatsApp Pelanggan
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (navigator.clipboard && navigator.clipboard.readText) {
                        const clip = await navigator.clipboard.readText();
                        if (clip) {
                          handleParseWaOrderMessage(clip);
                        }
                      }
                    } catch {
                      // Biarkan user paste manual
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  <span>Tempel dari Clipboard</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={rawWaMessage}
                onChange={(e) => handleParseWaOrderMessage(e.target.value)}
                placeholder="Tempel (Paste) teks chat order WhatsApp dari pelanggan di sini... Seluruh pasang sepatu, layanan, tingkat kerusakan & patokan akan terisi otomatis!"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
              {parseFeedback && (
                <p className="text-[11px] font-bold text-emerald-400">
                  {parseFeedback}
                </p>
              )}
            </div>

            <form
              onSubmit={handleConfirmReceiveFromWa}
              className="space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Nama Pelanggan *
                  </label>
                  <input
                    type="text"
                    required
                    value={qCustomerName}
                    onChange={(e) => setQCustomerName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    No. WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={qCustomerPhone}
                    onChange={(e) => setQCustomerPhone(e.target.value)}
                    placeholder="0812xxxxxxx"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Jumlah Pasang
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={qPairsCount}
                    onChange={(e) =>
                      setQPairsCount(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Merk / Model Sepatu *
                  </label>
                  <input
                    type="text"
                    required
                    value={qShoeBrand}
                    onChange={(e) => setQShoeBrand(e.target.value)}
                    placeholder="Contoh: Nike / Vans / Pantofel"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Layanan Reparasi
                  </label>
                  <select
                    value={qServiceId}
                    onChange={(e) => setQServiceId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {SERVICES_CATALOG.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Tingkat Kerusakan
                  </label>
                  <select
                    value={qSeverity}
                    onChange={(e) =>
                      setQSeverity(e.target.value as DamageSeverity)
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="kecil">🟢 Ringan (Sebagian)</option>
                    <option value="normal">🟡 Sedang (Standar)</option>
                    <option value="hard">🔴 Berat / Parah</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Kecamatan di Cirebon *
                  </label>
                  <input
                    type="text"
                    list="courier-cirebon-areas"
                    required
                    value={qAreaName}
                    onChange={(e) => setQAreaName(e.target.value)}
                    placeholder="Kesambi, Kedawung, Sumber..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <datalist id="courier-cirebon-areas">
                    {CIREBON_AREAS.map((a) => (
                      <option
                        key={a.name}
                        value={a.name.split('(')[0].trim()}
                      />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-amber-300 font-bold mb-1">
                    🚩 Patokan Rumah / Lokasi *
                  </label>
                  <input
                    type="text"
                    required
                    value={qLandmark}
                    onChange={(e) => setQLandmark(e.target.value)}
                    placeholder="Contoh: Depan Indomaret Tuparev, pagar hitam"
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-300 font-bold mb-1">
                    📍 Koordinat / Link dari Sherlock Asli WA (Opsional)
                  </label>
                  <input
                    type="text"
                    value={qSherlockInput}
                    onChange={(e) => setQSherlockInput(e.target.value)}
                    placeholder="Contoh: -6.715, 108.552 atau link Maps WA"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={qPaymentMethod}
                    onChange={(e) =>
                      setQPaymentMethod(e.target.value as 'cod' | 'qris')
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="cod">
                      💵 COD (Tagih Tunai oleh Kurir)
                    </option>
                    <option value="qris">💳 QRIS Resmi Soleman</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Terima Pesanan & Masukkan ke Tugas Kurir</span>
                </button>
                <button
                  type="button"
                  onClick={resetReceiveModal}
                  className="px-5 py-3 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CEK FISIK & SESUAIKAN TINGKAT KERUSAKAN / HARGA DI LOKASI */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-amber-500/40 p-6 sm:p-7 space-y-5 shadow-2xl my-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3.5">
              <div>
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" /> Cek Fisik Sepatu oleh Kurir
                  Soleman
                </span>
                <h3 className="text-lg font-extrabold text-white mt-0.5">
                  Sesuaikan Kerusakan & Harga — Order #{editingOrder.id} (
                  {editingOrder.customerName})
                </h3>
                <p className="text-xs text-slate-400">
                  Pastikan tingkat kerusakan (Ringan / Sedang / Berat), layanan,
                  dan total biaya 100% akurat sesuai kondisi fisik sepatu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveEditedOrder}
              className="space-y-4 text-xs"
            >
              {/* Daftar Pasang Sepatu */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {editShoes.map((shoe, sIdx) => {
                  const currentPrimaryService =
                    shoe.selectedServices[0] || SERVICES_CATALOG[0];
                  const tierInfo = getServiceTierDetail(
                    currentPrimaryService,
                    shoe.severity
                  );
                  return (
                    <div
                      key={shoe.id || sIdx}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-amber-400 uppercase">
                          👟 Sepatu #{sIdx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-400">
                            Subtotal: Rp{' '}
                            {shoe.selectedServices
                              .reduce(
                                (sum, s) =>
                                  sum +
                                  getServiceTierDetail(s, shoe.severity).price,
                                0
                              )
                              .toLocaleString('id-ID')}
                          </span>
                          {editShoes.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditShoes((prev) =>
                                  prev.filter((_, i) => i !== sIdx)
                                )
                              }
                              className="text-rose-400 hover:text-rose-300 text-[11px] font-bold"
                            >
                              Hapus Pasang
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            Merk / Model
                          </label>
                          <input
                            type="text"
                            value={shoe.shoeBrand}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditShoes((prev) =>
                                prev.map((item, i) =>
                                  i === sIdx
                                    ? { ...item, shoeBrand: val }
                                    : item
                                )
                              );
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            Layanan Utama
                          </label>
                          <select
                            value={currentPrimaryService.id}
                            onChange={(e) => {
                              const found =
                                SERVICES_CATALOG.find(
                                  (s) => s.id === e.target.value
                                ) || SERVICES_CATALOG[0];
                              setEditShoes((prev) =>
                                prev.map((item, i) =>
                                  i === sIdx
                                    ? { ...item, selectedServices: [found] }
                                    : item
                                )
                              );
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                          >
                            {SERVICES_CATALOG.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            Tingkat Kerusakan Fisik
                          </label>
                          <select
                            value={shoe.severity}
                            onChange={(e) => {
                              const sev = e.target.value as DamageSeverity;
                              setEditShoes((prev) =>
                                prev.map((item, i) =>
                                  i === sIdx ? { ...item, severity: sev } : item
                                )
                              );
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                          >
                            <option value="kecil">🟢 Ringan (Sebagian)</option>
                            <option value="normal">🟡 Sedang (Standar)</option>
                            <option value="hard">🔴 Berat / Parah</option>
                          </select>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800/80">
                        Kondisi Fisik:{' '}
                        <span className="text-slate-200">
                          {tierInfo.damageDesc}
                        </span>{' '}
                        ({tierInfo.priceFormatted})
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditShoes((prev) => [
                    ...prev,
                    {
                      id: `pair-${prev.length + 1}`,
                      pairNumber: prev.length + 1,
                      shoeBrand: `Sepatu #${prev.length + 1}`,
                      shoeType: 'Sneakers',
                      material: 'Canvas / Kain',
                      severity: 'normal',
                      selectedServices: [SERVICES_CATALOG[0]],
                      price: SERVICES_CATALOG[0].price,
                    },
                  ])
                }
                className="w-full py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-dashed border-amber-500/40 text-amber-300 font-bold text-xs cursor-pointer"
              >
                + Tambah Pasang Sepatu Lainnya
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Kecamatan
                  </label>
                  <input
                    type="text"
                    value={editAreaName}
                    onChange={(e) => setEditAreaName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-amber-300 font-bold mb-1">
                    Patokan Rumah
                  </label>
                  <input
                    type="text"
                    value={editLandmark}
                    onChange={(e) => setEditLandmark(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Ongkir Kurir (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={editDeliveryFee}
                    onChange={(e) =>
                      setEditDeliveryFee(Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-emerald-300 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Simpan Perubahan Akurat</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-5 py-3 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: NOTIFIKASI PROGRES WHATSAPP KE PELANGGAN */}
      {activeModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Notifikasi WhatsApp
                  Pelanggan
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Order #{activeModalOrder.id} - {activeModalOrder.customerName}
                </h3>
              </div>
              <button
                type="button"
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
                onChange={(e) =>
                  setModalTargetStatus(e.target.value as OrderStatus)
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="perjalanan_workshop">
                  🛵 Kurir Soleman Menuju Lokasi Jemput
                </option>
                <option value="pengerjaan">
                  🛠️ Sepatu Tiba & Sedang Dikerjakan di Workshop
                </option>
                <option value="siap_antar">
                  🎉 Sepatu Selesai & Kurir Siap Mengantar Kembali
                </option>
                <option value="selesai">
                  ✅ Sepatu Telah Diterima (Garansi Aktif)
                </option>
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
                placeholder="Contoh: Saya sudah di depan patokan ya Kak."
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
