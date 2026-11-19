/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, 
  MapPin, 
  CheckCircle2, 
  MessageSquare, 
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  Phone, 
  Camera, 
  Upload, 
  X, 
  Layers, 
  Sparkles, 
  QrCode, 
  Bell,
  Check,
  Loader2
} from 'lucide-react';
import { 
  SERVICES_CATALOG, 
  WORKSHOP_INFO, 
  SHOE_SIZES,
  STATUS_LABELS,
  isTapakOrSoleSizeRequired,
  calculateServicePrice,
  getServiceTierDetail
} from '../data/solcreftData';
import { 
  ServiceItem, 
  ShoeType, 
  ShoeMaterial, 
  DamageSeverity, 
  Order, 
  ShoeItemDetail, 
  PaymentMethod,
  CustomerUser,
  ServiceStockItem
} from '../types';
import { buildNewOrderWhatsAppUrl, parseShareLocInput } from '../services/whatsappHelper';
import { isServiceOrSizeOutOfStock } from '../services/firebaseStockService';
import { soundFx } from '../services/soundEffects';

interface PairFormItem {
  id: string;
  pairNumber: number;
  shoeBrand: string;
  shoeType: ShoeType;
  shoeSize?: string;
  material: ShoeMaterial;
  severity: DamageSeverity;
  serviceIds: string[];
  customNotes: string;
  photoPreview?: string;
  aiDetectedSeverity?: DamageSeverity;
  aiAnalyzing?: boolean;
  aiDiagnostics?: {
    severity?: DamageSeverity;
    estimatedPrice?: string;
    proTip?: string;
    summary?: string;
    shoeTypeEstimated?: string;
    technicalProcedures?: string[];
  };
}

interface PickupOrderSectionProps {
  initialServices?: ServiceItem[];
  initialShoeType?: ShoeType;
  initialPairsCount?: number;
  initialArea?: string;
  initialSeverity?: DamageSeverity;
  initialShoeSize?: string;
  stockMap?: Record<string, ServiceStockItem>;
  customerUser?: CustomerUser | null;
  myActiveOrders?: Order[];
  browserNotifPermission?: string;
  onRequestBrowserNotif?: () => void;
  onOrderCreated: (order: Order) => Promise<boolean> | void;
  onOpenDashboard: () => void;
  onOpenTrackerWithId?: (orderId: string) => void;
}

const AVAILABLE_SHOE_TYPES: { id: ShoeType; label: string }[] = [
  { id: 'Sneakers', label: 'Sneakers (Vans, Ventela, Converse, Nike)' },
  { id: 'Sepatu Sekolah', label: 'Sepatu Sekolah (Warrior, NB)' },
  { id: 'Sepatu Kantor / Pantofel', label: 'Pantofel / Kulit Formal' },
  { id: 'Sepatu Proyek / Safety', label: 'Safety Boots / Proyek' },
  { id: 'Sepatu Futsal', label: 'Sepatu Futsal (Karet Mentah)' },
  { id: 'Sepatu Olah Raga / Sport', label: 'Running / Sport' },
  { id: 'Sepatu Trail', label: 'Sepatu Trail (Extreme Grip)' },
  { id: 'Sepatu Gunung / Hiking', label: 'Sepatu Gunung / Hiking' },
  { id: 'Sepatu Bola / Cleats', label: 'Sepatu Bola' },
  { id: 'Sendal Biasa', label: 'Sandal Biasa / Jepit / Gunung' },
  { id: 'Sendal Kulit', label: 'Sandal Kulit' },
];

export const PickupOrderSection: React.FC<PickupOrderSectionProps> = ({
  initialServices,
  initialShoeType,
  initialPairsCount,
  initialArea,
  initialSeverity,
  initialShoeSize,
  stockMap,
  customerUser,
  myActiveOrders = [],
  browserNotifPermission,
  onRequestBrowserNotif,
  onOrderCreated,
}) => {
  // Customer Info State
  const [customerName, setCustomerName] = useState(customerUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(customerUser?.phone || '');
  const [customerAddress, setCustomerAddress] = useState(customerUser?.savedAddress || '');
  const [pairsCount, setPairsCount] = useState<number>(initialPairsCount || 1);
  const [activePairIndex, setActivePairIndex] = useState<number>(0);

  // Shoes Data State
  const [shoesList, setShoesList] = useState<PairFormItem[]>([
    {
      id: 'pair-1',
      pairNumber: 1,
      shoeBrand: '',
      shoeType: initialShoeType || 'Sneakers',
      shoeSize: initialShoeSize || '40',
      material: 'Canvas / Kain',
      severity: initialSeverity || 'normal',
      serviceIds: initialServices && initialServices.length > 0 ? initialServices.map(s => s.id) : ['jahit-benang-tersembunyi'],
      customNotes: '',
      photoPreview: undefined,
      aiDetectedSeverity: undefined,
      aiAnalyzing: false
    }
  ]);

  // Sync external preselection from Catalog / Calculator
  useEffect(() => {
    if (initialServices && initialServices.length > 0) {
      setShoesList(prev => prev.map((sh, idx) => {
        if (idx === 0) {
          return {
            ...sh,
            serviceIds: initialServices.map(s => s.id),
            shoeType: initialShoeType || sh.shoeType,
            severity: initialSeverity || sh.severity,
            shoeSize: initialShoeSize || sh.shoeSize || '40',
          };
        }
        return sh;
      }));
    } else if (initialShoeSize) {
      setShoesList(prev => prev.map((sh, idx) => idx === 0 ? { ...sh, shoeSize: initialShoeSize } : sh));
    }
    if (initialPairsCount && initialPairsCount > 0) {
      setPairsCount(initialPairsCount);
    }
    if (initialArea) {
      setAreaName(initialArea);
    }
  }, [initialServices, initialShoeType, initialPairsCount, initialArea, initialSeverity, initialShoeSize]);

  // Delivery State: Alamat Penjemputan & Link Google Maps (Opsional) tanpa akses lokasi browser
  const [pickupType] = useState<'antar_jemput' | 'drop_off'>('antar_jemput');
  const [areaName, setAreaName] = useState<string>(initialArea || customerUser?.savedArea || 'Cirebon');
  const [mapsLinkInput, setMapsLinkInput] = useState<string>('');

  // Active Menu Tab for Service Selection (Organized by Menu Category)
  const [activeFormMenuTab, setActiveFormMenuTab] = useState<'jahit' | 'sol' | 'treatment' | 'rekonstruksi'>('jahit');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

  // UI state & anti-spam lock
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [validationError, setValidationError] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [submittingMode, setSubmittingMode] = useState<'courier' | 'whatsapp' | null>(null);
  const [submitCooldown, setSubmitCooldown] = useState<number>(0);
  const submittingLockRef = useRef<boolean>(false);
  const statusCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (submitCooldown <= 0) return;
    const timer = window.setTimeout(() => {
      setSubmitCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [submitCooldown]);

  // Synchronize shoesList when pairsCount changes
  useEffect(() => {
    setShoesList(prev => {
      const current = [...prev];
      if (pairsCount > current.length) {
        for (let i = current.length + 1; i <= pairsCount; i++) {
          current.push({
            id: `pair-${i}`,
            pairNumber: i,
            shoeBrand: '',
            shoeType: 'Sneakers',
            shoeSize: '40',
            material: 'Canvas / Kain',
            severity: 'normal',
            serviceIds: ['jahit-benang-tersembunyi'],
            customNotes: '',
            photoPreview: undefined,
          });
        }
      } else if (pairsCount < current.length) {
        return current.slice(0, pairsCount);
      }
      return current;
    });

    if (activePairIndex >= pairsCount) {
      setActivePairIndex(pairsCount - 1);
    }
  }, [pairsCount]);

  const activeShoe = shoesList[activePairIndex] || shoesList[0];

  const updateActiveShoe = (updates: Partial<PairFormItem>) => {
    setShoesList(prev => prev.map((item, idx) => {
      if (idx === activePairIndex) {
        return { ...item, ...updates };
      }
      return item;
    }));
  };

  const toggleServiceForActiveShoe = (serviceId: string) => {
    const isCurrentlyChecked = activeShoe.serviceIds.includes(serviceId);
    if (!isCurrentlyChecked) {
      const checkSrv = SERVICES_CATALOG.find(s => s.id === serviceId);
      const checkSize = checkSrv && isTapakOrSoleSizeRequired([checkSrv]) ? activeShoe.shoeSize : undefined;
      const stockCheck = isServiceOrSizeOutOfStock(stockMap, serviceId, checkSize);
      if (stockCheck.blocked) {
        setValidationError(stockCheck.reason || 'Menu layanan ini sedang stok kosong.');
        return;
      }
    }
    setValidationError('');
    soundFx.playClick();
    const currentServices = activeShoe.serviceIds;
    let nextServices: string[];
    if (currentServices.includes(serviceId)) {
      if (currentServices.length > 1) {
        nextServices = currentServices.filter(id => id !== serviceId);
      } else {
        nextServices = currentServices;
      }
    } else {
      nextServices = [...currentServices, serviceId];
    }
    updateActiveShoe({ serviceIds: nextServices });
  };

  // Otomatis deteksi tingkat kerusakan sepatu dari foto pelanggan via Soleman AI 3.8
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setValidationError('Ukuran foto maksimal 8 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      updateActiveShoe({ photoPreview: dataUrl, aiAnalyzing: true });

      // Call diagnosis endpoint in server.ts powered by Gemini 3.8 Flash
      try {
        const response = await fetch('/api/gemini/diagnose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: 'Analisis foto sepatu pelanggan untuk deteksi kerusakan sol dan keparahan tingkat kerusakan.',
            imageBase64: dataUrl,
            shoeType: activeShoe.shoeType
          })
        });

        if (response.ok) {
          const result = await response.json();
          let detectedSeverity: DamageSeverity = 'normal';
          if (result.detectedSeverity === 'hard' || result.detectedSeverity === 'kecil' || result.detectedSeverity === 'normal') {
            detectedSeverity = result.detectedSeverity;
          } else {
            const textToEval = JSON.stringify(result).toLowerCase();
            if (textToEval.includes('berat') || textToEval.includes('parah') || textToEval.includes('hancur') || textToEval.includes('lepas total')) {
              detectedSeverity = 'hard';
            } else if (textToEval.includes('ringan') || textToEval.includes('sebagian') || textToEval.includes('sedikit')) {
              detectedSeverity = 'kecil';
            } else {
              detectedSeverity = 'normal';
            }
          }

          // Otomatis terapkan layanan rekomendasi jika AI mendeteksi servis yang cocok
          let nextServiceIds = activeShoe.serviceIds;
          if (Array.isArray(result.recommendedServiceIds) && result.recommendedServiceIds.length > 0) {
            const validServices = result.recommendedServiceIds.filter((id: string) =>
              SERVICES_CATALOG.some(s => s.id === id)
            );
            if (validServices.length > 0) {
              nextServiceIds = validServices;
            }
          }

          const notes = result.summary || (result.technicalProcedures?.length ? result.technicalProcedures.join('. ') : activeShoe.customNotes);

          updateActiveShoe({
            severity: detectedSeverity,
            aiDetectedSeverity: detectedSeverity,
            serviceIds: nextServiceIds,
            customNotes: notes,
            aiAnalyzing: false,
            aiDiagnostics: {
              severity: detectedSeverity,
              estimatedPrice: result.estimatedPrice,
              proTip: result.proTip,
              summary: result.summary,
              shoeTypeEstimated: result.shoeTypeEstimated,
              technicalProcedures: result.technicalProcedures
            }
          });
          soundFx.playSuccess();
        } else {
          // Fallback automatic severity: normal
          updateActiveShoe({ severity: 'normal', aiDetectedSeverity: 'normal', aiAnalyzing: false });
        }
      } catch (err) {
        console.warn('AI diagnosis fallback:', err);
        updateActiveShoe({ severity: 'normal', aiDetectedSeverity: 'normal', aiAnalyzing: false });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    updateActiveShoe({ photoPreview: undefined, aiDetectedSeverity: undefined, aiDiagnostics: undefined });
  };

  // Calculate pricing
  const shoeDetailsWithPrices: ShoeItemDetail[] = shoesList.map((shoe, idx) => {
    const selectedServiceObjs = SERVICES_CATALOG.filter(s => shoe.serviceIds.includes(s.id));
    const pairPrice = selectedServiceObjs.reduce((sum, s) => {
      return sum + calculateServicePrice(s, shoe.material, shoe.severity);
    }, 0);

    return {
      id: shoe.id,
      pairNumber: idx + 1,
      shoeBrand: shoe.shoeBrand || `Sepatu #${idx + 1}`,
      shoeType: shoe.shoeType,
      shoeSize: isTapakOrSoleSizeRequired(selectedServiceObjs) ? (shoe.shoeSize || '40') : shoe.shoeSize,
      material: shoe.material,
      severity: shoe.severity,
      selectedServices: selectedServiceObjs,
      photoUrl: shoe.photoPreview,
      damageNotes: shoe.customNotes,
      price: pairPrice
    };
  });

  const totalServicesPrice = shoeDetailsWithPrices.reduce((sum, s) => sum + s.price, 0);

  // Aturan Ongkir: Kota Cirebon Gratis Ongkir (Rp 0), Kabupaten Rp 15.000
  const deliveryFee = pickupType === 'drop_off' ? 0 : 0;
  const grandTotal = totalServicesPrice + deliveryFee;

  // Handle Order Submit: simpan pesanan & alamat lengkap ke Portal Kurir Soleman (dengan kunci anti-spam)
  const handleCreateOrder = async (sendToWhatsApp: boolean = false) => {
    if (submittingLockRef.current || isSubmittingOrder || submitCooldown > 0) {
      return;
    }

    setValidationError('');

    if (!customerName.trim()) {
      setValidationError('Silakan masukkan nama Anda.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 9) {
      setValidationError('Silakan masukkan nomor WhatsApp aktif Anda.');
      return;
    }

    const emptyBrandIndex = shoesList.findIndex(s => !s.shoeBrand.trim());
    if (emptyBrandIndex !== -1) {
      setValidationError(`Silakan isi Merk/Model untuk Sepatu #${emptyBrandIndex + 1}.`);
      setActivePairIndex(emptyBrandIndex);
      return;
    }

    // Validasi ukuran tapak & stok kosong sebelum submit
    for (let i = 0; i < shoesList.length; i++) {
      const sh = shoesList[i];
      const srvObjs = SERVICES_CATALOG.filter(s => sh.serviceIds.includes(s.id));
      const needsSz = isTapakOrSoleSizeRequired(srvObjs);
      if (needsSz && (!sh.shoeSize || !sh.shoeSize.trim())) {
        setValidationError(`Silakan pilih Ukuran Sepatu / Sandal untuk Sepatu #${i + 1} agar tapak sesuai.`);
        setActivePairIndex(i);
        return;
      }
      for (const srv of srvObjs) {
        const check = isServiceOrSizeOutOfStock(stockMap, srv.id, needsSz ? sh.shoeSize : undefined);
        if (check.blocked) {
          setValidationError(`Maaf, ${srv.name} pada Sepatu #${i + 1}: ${check.reason}`);
          setActivePairIndex(i);
          return;
        }
      }
    }

    if (!customerAddress.trim() && !mapsLinkInput.trim()) {
      setValidationError('Silakan isi alamat penjemputan / patokan rumah Anda agar kurir mudah menemukan lokasi.');
      return;
    }

    // Kunci segera agar klik ganda / tap berulang tidak menghasilkan pesanan duplikat
    submittingLockRef.current = true;
    setIsSubmittingOrder(true);
    setSubmittingMode(sendToWhatsApp ? 'whatsapp' : 'courier');
    soundFx.playClick();

    try {
      const parsedMaps = mapsLinkInput.trim() ? parseShareLocInput(mapsLinkInput) : {};

      const allPhotos = shoeDetailsWithPrices
        .map(s => s.photoUrl)
        .filter((url): url is string => Boolean(url));

      const allServicesFlattened = Array.from(
        new Set(shoeDetailsWithPrices.flatMap(s => s.selectedServices))
      );

      const summaryBrand = pairsCount === 1 
        ? shoesList[0].shoeBrand 
        : `${shoesList[0].shoeBrand} (+${pairsCount - 1} pasang)`;

      const cleanArea = areaName.trim() || 'Cirebon';
      const cleanAddressNote = customerAddress.trim();

      const newOrder: Order = {
        id: `SLC-${Math.floor(1000 + Math.random() * 9000)}`,
        customerId: customerUser?.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        shoeBrand: summaryBrand,
        shoeType: shoesList[0].shoeType,
        shoeSize: shoeDetailsWithPrices[0]?.shoeSize,
        material: shoesList[0].material,
        severity: shoesList[0].severity,
        pairsCount,
        selectedServices: allServicesFlattened,
        shoes: shoeDetailsWithPrices,
        customNotes: shoesList.map(s => s.customNotes).filter(Boolean).join(' | ') || undefined,
        photoUrl: allPhotos[0],
        photos: allPhotos,
        pickupType,
        preferredTimeSlot: 'siang',
        distanceZone: 'dekat_kota',
        logisticsPartner: 'kurir_soleman',
        customerConfirmedMaterialPhoto: true,
        location: {
          areaName: cleanArea,
          areaType: 'Kota',
          distanceZone: 'dekat_kota',
          logisticsPartner: 'kurir_soleman',
          shareLocViaWhatsApp: false,
          isLiveShared: Boolean(parsedMaps.lat || parsedMaps.cleanUrl),
          lat: parsedMaps.lat,
          lng: parsedMaps.lng,
          mapsUrl: parsedMaps.cleanUrl,
          fullAddress: cleanAddressNote || 'Lihat titik Google Maps pesanan',
          landmark: cleanAddressNote || 'Alamat penjemputan Kurir Soleman',
        },
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'cod_pending' : 'menunggu_pembayaran',
        totalServicesPrice,
        deliveryFee,
        totalAmount: grandTotal,
        status: 'menunggu_jemput',
        isAcceptedByAdmin: false,
        createdAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        estimatedFinishedAt: '1 - 3 Hari Kerja',
        technicianName: 'Master Teknisi Soleman',
        assignedCourier: 'Kurir Soleman',
        assignedCourierPhone: '083152276387',
        timeline: [
          {
            status: 'menunggu_jemput',
            label: 'Pesanan Diterima di Sistem',
            timestamp: 'Baru saja',
            description: `Booking ${pairsCount} pasang sepatu atas nama ${customerName.trim()}. Alamat: ${cleanAddressNote || parsedMaps.cleanUrl}.`
          }
        ]
      };

      const minDelay = new Promise<void>((resolve) => window.setTimeout(resolve, 900));
      const savePromise = Promise.resolve(onOrderCreated(newOrder));
      const timeoutPromise = new Promise<void>((resolve) => window.setTimeout(resolve, 6000));

      await Promise.all([
        minDelay,
        Promise.race([savePromise.then(() => undefined), timeoutPromise]),
      ]);

      setCreatedOrder(newOrder);
      setSubmitCooldown(6);
      soundFx.playSuccess();

      window.setTimeout(() => {
        statusCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);

      if (sendToWhatsApp) {
        const waUrl = buildNewOrderWhatsAppUrl(newOrder);
        const opened = window.open(waUrl, '_blank', 'noopener,noreferrer');
        if (!opened) {
          try {
            window.location.assign(waUrl);
          } catch {}
        }
      }
    } finally {
      submittingLockRef.current = false;
      setIsSubmittingOrder(false);
      setSubmittingMode(null);
    }
  };

  return (
    <section id="antar-jemput" className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-xs font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(0,240,255,0.2)]">
          <Truck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Antar-Jemput Sepatu Se-Cirebon • Ongkir 15k</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
          Formulir Pemesanan Reparasi <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">
            Praktis, Cepat & Otomatis
          </span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Tingkat kerusakan otomatis terdeteksi dari foto sepatu Anda. Ongkir flat 15k se-Cirebon.
        </p>
      </div>

      {/* Real-Time Live Customer Order Status Card (Selalu sinkron dari Firestore saat diterima / diproses / selesai) */}
      {(() => {
        const liveCreatedOrder = createdOrder
          ? myActiveOrders.find((o) => o.id === createdOrder.id) || createdOrder
          : null;
        const ordersToShow = liveCreatedOrder
          ? [liveCreatedOrder, ...myActiveOrders.filter((o) => o.id !== liveCreatedOrder.id).slice(0, 1)]
          : myActiveOrders.slice(0, 2);

        if (ordersToShow.length === 0) return null;

        return (
          <div ref={statusCardRef} className="mb-8 space-y-4">
            {ordersToShow.map((ord, idx) => {
              const stInfo = STATUS_LABELS[ord.status] || STATUS_LABELS.menunggu_jemput;
              const isCancelled = ord.status === 'dibatalkan';
              const isAccepted = Boolean(ord.isAcceptedByAdmin) && !isCancelled;

              return (
                <div
                  key={ord.id}
                  className={`p-5 sm:p-6 rounded-3xl border shadow-2xl space-y-4 transition-all ${
                    isCancelled
                      ? 'bg-rose-950/60 border-rose-500/60'
                      : ord.status === 'selesai'
                      ? 'bg-emerald-950/40 border-emerald-400/60'
                      : isAccepted
                      ? 'bg-slate-900 border-emerald-400/60 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
                      : 'bg-slate-900 border-cyan-400/60 shadow-[0_0_25px_rgba(0,240,255,0.2)]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-bold shadow-lg ${
                        isCancelled
                          ? 'bg-rose-500 text-white'
                          : isAccepted
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-cyan-400 text-slate-950'
                      }`}>
                        <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${stInfo.badgeBg}`}>
                            {isCancelled
                              ? '❌ Dibatalkan'
                              : !ord.isAcceptedByAdmin
                              ? '⏳ Menunggu Konfirmasi Admin / Kurir'
                              : ord.status === 'perjalanan_workshop'
                              ? '🎉 Pesanan Diterima • Kurir Menjemput'
                              : ord.status === 'pengerjaan'
                              ? '🛠️ Sedang Diproses di Workshop'
                              : stInfo.label}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-300">#{ord.id}</span>
                        </div>

                        <h3 className="text-base sm:text-lg font-extrabold text-white">
                          {ord.shoeBrand}{ord.shoeSize ? ` (EU ${ord.shoeSize})` : ''} • {ord.pairsCount} Pasang
                        </h3>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {isCancelled
                            ? `Pesanan dibatalkan: ${ord.cancellationReason || 'Stok tapak / bahan sedang kosong.'}`
                            : !ord.isAcceptedByAdmin
                            ? `Pesanan atas nama ${ord.customerName} telah masuk ke portal Admin & Kurir. Halaman ini otomatis memberi notifikasi saat diterima atau diproses.`
                            : ord.timeline?.[0]?.description || `Diproses oleh ${ord.assignedCourier || 'Tim Soleman Cirebon'}.`}
                        </p>

                        <p className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1.5 flex-wrap pt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            Lokasi jemput tersimpan untuk Kurir: {ord.location?.fullAddress || ord.location?.landmark || ord.location?.areaName}
                          </span>
                        </p>
                      </div>
                    </div>

                    {onRequestBrowserNotif && browserNotifPermission !== 'granted' && browserNotifPermission !== 'unsupported' && (
                      <button
                        type="button"
                        onClick={onRequestBrowserNotif}
                        className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Aktifkan Notif Browser/HP</span>
                      </button>
                    )}
                  </div>

                  {/* Step Progress Strip */}
                  {!isCancelled && (
                    <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-800/80 text-[10px] font-bold">
                      {[
                        { label: '1. Masuk', active: true },
                        { label: '2. Diterima', active: Boolean(ord.isAcceptedByAdmin) },
                        { label: '3. Diproses', active: ['pengerjaan', 'quality_check', 'siap_antar', 'selesai'].includes(ord.status) },
                        { label: '4. Selesai', active: ord.status === 'selesai' },
                      ].map((step) => (
                        <div
                          key={step.label}
                          className={`px-2 py-1.5 rounded-xl text-center border ${
                            step.active
                              ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                              : 'bg-slate-950/60 border-slate-800 text-slate-500'
                          }`}
                        >
                          {step.label}
                        </div>
                      ))}
                    </div>
                  )}

                  {idx === 0 && createdOrder && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-800">
                      <div className="flex flex-wrap items-center gap-3">
                        <a
                          href={buildNewOrderWhatsAppUrl(ord)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => soundFx.playClick()}
                          className="flex-1 py-3 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Kirim Salinan ke WA (0831-5227-6387)</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            setCreatedOrder(null);
                            setSubmitCooldown(0);
                          }}
                          className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
                        >
                          <span>Tutup / Pesan Lagi</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Main Order Form Card */}
      <div className="bg-slate-900/72 backdrop-blur-md border border-cyan-500/25 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
        
        {/* Step 1: Customer Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-400">
            <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-[10px]">1</span>
            <span>Data Kontak Pelanggan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 text-white text-xs outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Nomor WhatsApp Aktif</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="08123456789"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 text-white text-xs outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Pairs Count & Shoe Details */}
        <div className="space-y-4 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-400">
              <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-[10px]">2</span>
              <span>Jumlah & Detail Sepatu</span>
            </div>

            {/* Pairs Count selector */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1.5 rounded-xl border border-slate-800 flex-wrap">
              <span className="text-[11px] text-slate-400 mr-1 font-semibold">Jumlah Pasang:</span>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setPairsCount(num);
                  }}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    pairsCount === num
                      ? 'bg-sky-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Active Shoe Form */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 space-y-4">
            {pairsCount > 1 && (
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 overflow-x-auto">
                {shoesList.map((shoe, idx) => (
                  <button
                    key={shoe.id}
                    type="button"
                    onClick={() => setActivePairIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      activePairIndex === idx
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Sepatu #{idx + 1} {shoe.shoeBrand ? `(${shoe.shoeBrand})` : ''}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Merk / Model Sepatu</label>
                <input
                  type="text"
                  value={activeShoe.shoeBrand}
                  onChange={(e) => updateActiveShoe({ shoeBrand: e.target.value })}
                  placeholder="Contoh: Ventela / Vans / Nike Air"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Kategori Jenis Sepatu</label>
                <select
                  value={activeShoe.shoeType}
                  onChange={(e) => updateActiveShoe({ shoeType: e.target.value as ShoeType })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-white text-xs outline-none"
                >
                  {AVAILABLE_SHOE_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Photo Upload with Automatic Damage Severity Detection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Foto Fisik Sepatu (Otomatis Deteksi Tingkat Kerusakan)</span>
                </label>
                {activeShoe.aiAnalyzing && (
                  <span className="text-[10px] text-cyan-400 animate-pulse font-bold">
                    ✨ AI Menganalisis Foto...
                  </span>
                )}
              </div>

              {activeShoe.photoPreview ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
                    <img
                      src={activeShoe.photoPreview}
                      alt="Preview Sepatu"
                      className="w-16 h-16 object-cover rounded-lg border border-cyan-500/30 shrink-0"
                    />
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-cyan-300">
                          Foto Teranalisis Soleman AI 3.8
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                          activeShoe.severity === 'hard'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : activeShoe.severity === 'kecil'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        }`}>
                          Otomatis: {activeShoe.severity === 'hard' ? 'Kerusakan Berat' : activeShoe.severity === 'kecil' ? 'Kerusakan Ringan' : 'Kerusakan Sedang'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300 line-clamp-2">
                        {activeShoe.customNotes || 'Tingkat kerusakan otomatis disinkronkan ke rincian harga.'}
                      </p>
                      {activeShoe.aiDiagnostics?.proTip && (
                        <p className="text-[10px] text-cyan-400 font-medium">
                          💡 Rekomendasi AI: {activeShoe.aiDiagnostics.proTip}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer shrink-0"
                      title="Hapus foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-cyan-500/40 hover:border-cyan-400 bg-slate-900/50 hover:bg-slate-900 cursor-pointer transition-all text-xs text-slate-300">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Unggah Foto Sepatu (Tingkat Kerusakan Terdeteksi Otomatis)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Services selection for this shoe - Neatly Organized by Category Menu */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-[11px] font-bold text-slate-300 block">
                  Pilih Menu Servis untuk Sepatu #{activePairIndex + 1} ({activeShoe.serviceIds.length} dipilih):
                </label>
                <span className="text-[10px] text-cyan-300 font-mono">
                  Bisa pilih lebih dari 1 menu
                </span>
              </div>

              {/* 4 Category Menu Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'jahit', label: '🪡 Jahit Sol', cat: (s: ServiceItem) => s.category === 'jahit' },
                  { id: 'sol', label: '👟 Tapak & Tambal', cat: (s: ServiceItem) => s.category === 'sol' },
                  { id: 'treatment', label: '✨ Treatment', cat: (s: ServiceItem) => s.category === 'warna' || s.category === 'kebersihan' },
                  { id: 'rekonstruksi', label: '🛠️ Busa & Upper', cat: (s: ServiceItem) => s.category === 'busa' || s.category === 'kulit_upper' },
                ].map((menu) => {
                  const isActive = activeFormMenuTab === menu.id;
                  const selectedInThisMenu = SERVICES_CATALOG
                    .filter(menu.cat)
                    .filter(s => activeShoe.serviceIds.includes(s.id)).length;
                  return (
                    <button
                      key={menu.id}
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setActiveFormMenuTab(menu.id as any);
                      }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between border ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 border-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.3)] font-black'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-cyan-500/40 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{menu.label}</span>
                      {selectedInThisMenu > 0 && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                          isActive ? 'bg-slate-950 text-cyan-300' : 'bg-cyan-500 text-slate-950'
                        }`}>
                          {selectedInThisMenu}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Services List for Active Menu Tab */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-72 overflow-y-auto pr-1">
                {SERVICES_CATALOG.filter((s) => {
                  if (activeFormMenuTab === 'jahit') return s.category === 'jahit';
                  if (activeFormMenuTab === 'sol') return s.category === 'sol';
                  if (activeFormMenuTab === 'treatment') return s.category === 'warna' || s.category === 'kebersihan';
                  return s.category === 'busa' || s.category === 'kulit_upper';
                }).map((serv) => {
                  const isChecked = activeShoe.serviceIds.includes(serv.id);
                  const tier = getServiceTierDetail(serv, activeShoe.severity);
                  const needsSzForServ = isTapakOrSoleSizeRequired([serv]);
                  const stockCheck = isServiceOrSizeOutOfStock(stockMap, serv.id, needsSzForServ ? activeShoe.shoeSize : undefined);
                  const isOut = stockCheck.blocked && !isChecked;
                  return (
                    <div
                      key={serv.id}
                      onClick={() => {
                        if (!isOut) toggleServiceForActiveShoe(serv.id);
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all text-xs ${
                        isOut
                          ? 'bg-rose-950/20 border-rose-500/30 text-slate-500 opacity-70 cursor-not-allowed'
                          : isChecked
                          ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.2)] cursor-pointer'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 ${
                          isChecked ? 'bg-cyan-400 border-cyan-400 text-slate-950' : 'border-slate-700'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="font-semibold text-white truncate text-[11px] sm:text-xs">
                          {serv.name}
                        </span>
                      </div>
                      {stockCheck.blocked ? (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-600 text-white shrink-0">
                          STOK KOSONG
                        </span>
                      ) : (
                        <span className="font-black text-cyan-300 text-[11px] shrink-0 font-mono">
                          {tier.priceFormatted}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Shoe Size Picker whenever a Ganti Tapak / Tambal service is selected */}
              {isTapakOrSoleSizeRequired(SERVICES_CATALOG.filter(s => activeShoe.serviceIds.includes(s.id))) && (
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/35 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-[11px] font-black text-cyan-300">
                      📏 Pilih Ukuran Sepatu / Sandal (Wajib untuk Ganti Tapak & Tambal):
                    </label>
                    <span className="text-[11px] font-mono font-bold text-white bg-cyan-500/20 border border-cyan-400/40 px-2 py-0.5 rounded-lg">
                      Ukuran: EU {activeShoe.shoeSize || '40'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {SHOE_SIZES.map((sz) => {
                      const activeServicesForShoe = SERVICES_CATALOG.filter(s => activeShoe.serviceIds.includes(s.id));
                      const sizeBlocked = activeServicesForShoe.some(
                        (srv) => isServiceOrSizeOutOfStock(stockMap, srv.id, sz).blocked
                      );
                      const isSel = activeShoe.shoeSize === sz;
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            soundFx.playClick();
                            updateActiveShoe({ shoeSize: sz });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            sizeBlocked
                              ? 'bg-rose-950/40 border-rose-500/40 text-rose-300 line-through'
                              : isSel
                              ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-black shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-cyan-500/40'
                          }`}
                          title={sizeBlocked ? `Stok ukuran EU ${sz} kosong` : `Ukuran EU ${sz}`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                    <input
                      type="text"
                      value={activeShoe.shoeSize || ''}
                      onChange={(e) => updateActiveShoe({ shoeSize: e.target.value })}
                      placeholder="Lainnya"
                      className="w-20 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Alamat Penjemputan Kurir Soleman */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-400">
              <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-[10px]">3</span>
              <span>Alamat Penjemputan Kurir Soleman</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/35 space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-200 block mb-1">
                Alamat Lengkap Penjemputan & Patokan Rumah:
              </label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Contoh: Jl. Cipto Mangunkusumo No. 45, Kec. Kesambi (Pagar hitam depan minimarket)"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-white text-xs outline-none transition-colors placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Link Google Maps / Koordinat (Opsional):
              </label>
              <input
                type="text"
                value={mapsLinkInput}
                onChange={(e) => setMapsLinkInput(e.target.value)}
                placeholder="Contoh: https://maps.app.goo.gl/... atau -6.7175, 108.5630"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-white text-xs outline-none transition-colors placeholder:text-slate-600"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-cyan-950/35 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="text-cyan-300 font-semibold">
                🛵 Gratis Ongkir wilayah Kota Cirebon • Kab. Cirebon Rp 15.000
              </span>
            </div>
          </div>
        </div>

        {/* Step 4: Payment Method */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-400">
            <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-[10px]">4</span>
            <span>Metode Pembayaran</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setPaymentMethod('cod');
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                paymentMethod === 'cod'
                  ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <span className="text-xs font-bold text-white block mb-0.5">COD (Bayar Tunai)</span>
              <span className="text-[10px] text-slate-400">Bayar ke kurir saat serah terima sepatu.</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setPaymentMethod('qris');
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                paymentMethod === 'qris'
                  ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <span className="text-xs font-bold text-white block mb-0.5">QRIS Instan</span>
              <span className="text-[10px] text-slate-400">BCA, Mandiri, BRI, GoPay, Dana, dll.</span>
            </button>
          </div>
        </div>

        {/* Order Summary & Submit Button */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs shadow-inner">
            <div className="flex justify-between text-slate-400">
              <span>Total Biaya Servis ({pairsCount} pasang):</span>
              <span className="text-white font-bold font-mono">Rp {totalServicesPrice.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Biaya Ongkir Kurir:</span>
              <span className={deliveryFee === 0 ? "text-sky-400 font-bold font-mono" : "text-slate-200 font-bold font-mono"}>
                {deliveryFee === 0 
                  ? 'Rp 0 (GRATIS ONGKIR Kota Cirebon)' 
                  : 'Rp 15.000 (Kabupaten Cirebon)'}
              </span>
            </div>
            <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
              <span>Total Akhir:</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-200 font-mono text-base">
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {validationError && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs">
              {validationError}
            </div>
          )}

          {(isSubmittingOrder || submitCooldown > 0) && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs font-semibold flex items-center gap-2">
              <Loader2 className={`w-4 h-4 text-amber-300 shrink-0 ${isSubmittingOrder ? 'animate-spin' : ''}`} />
              <span>
                {isSubmittingOrder
                  ? 'Pesanan lagi diproses & dikirim ke Kurir Soleman... Mohon tunggu sebentar, jangan tekan ulang.'
                  : `Pesanan #${createdOrder?.id || ''} lagi diproses di sistem Kurir. Tombol dikunci ${submitCooldown} detik agar tidak spam pesanan ganda.`}
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={isSubmittingOrder || submitCooldown > 0}
              onClick={() => handleCreateOrder(false)}
              className={`flex-1 py-3.5 px-6 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                isSubmittingOrder || submitCooldown > 0
                  ? 'bg-amber-400/90 text-slate-950 cursor-not-allowed opacity-90 shadow-lg shadow-amber-500/20'
                  : 'bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-slate-950 shadow-lg shadow-cyan-500/25 cursor-pointer'
              }`}
            >
              {isSubmittingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                  <span>{submittingMode === 'whatsapp' ? 'Lagi Diproses ke WA...' : 'Lagi Diproses...'}</span>
                </>
              ) : submitCooldown > 0 ? (
                <>
                  <Clock className="w-4 h-4 stroke-[2.5]" />
                  <span>Lagi Diproses ({submitCooldown}d)</span>
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4 stroke-[2.5]" />
                  <span>Pesan Sekarang (Kirim ke Kurir)</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isSubmittingOrder || submitCooldown > 0}
              onClick={() => handleCreateOrder(true)}
              className={`py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all ${
                isSubmittingOrder || submitCooldown > 0
                  ? 'bg-slate-800/80 text-slate-400 border-slate-700 cursor-not-allowed opacity-75'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-400/40 cursor-pointer'
              }`}
            >
              {isSubmittingOrder && submittingMode === 'whatsapp' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Lagi Diproses...</span>
                </>
              ) : submitCooldown > 0 ? (
                <>
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Lagi Diproses ({submitCooldown}d)</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Pesan & Salinan ke WA</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
