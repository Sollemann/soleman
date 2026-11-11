/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Search,
  Navigation,
  Crosshair,
  Zap,
  Check
} from 'lucide-react';
import { 
  SERVICES_CATALOG, 
  CIREBON_AREAS, 
  ALL_CIREBON_KECAMATAN_SUGGESTIONS,
  KOTA_CIREBON_KECAMATAN,
  WORKSHOP_INFO, 
  calculateDistanceToWorkshop,
  calculateServicePrice,
  getServiceTierDetail
} from '../data/solcreftData';
import { SolemanQrModal } from './SolemanQrModal';
import { 
  ServiceItem, 
  ShoeType, 
  ShoeMaterial, 
  DamageSeverity, 
  Order, 
  ShoeItemDetail, 
  PaymentMethod,
  CustomerUser
} from '../types';
import { buildNewOrderWhatsAppUrl } from '../services/whatsappHelper';
import { soundFx } from '../services/soundEffects';

interface PairFormItem {
  id: string;
  pairNumber: number;
  shoeBrand: string;
  shoeType: ShoeType;
  material: ShoeMaterial;
  severity: DamageSeverity;
  serviceIds: string[];
  customNotes: string;
  photoPreview?: string;
  aiDetectedSeverity?: DamageSeverity;
  aiAnalyzing?: boolean;
}

interface PickupOrderSectionProps {
  initialServices?: ServiceItem[];
  initialShoeType?: ShoeType;
  initialPairsCount?: number;
  initialArea?: string;
  initialSeverity?: DamageSeverity;
  customerUser?: CustomerUser | null;
  onOrderCreated: (order: Order) => void;
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
  { id: 'Sendal Biasa', label: 'Sandal Biasa' },
  { id: 'Sendal Kulit', label: 'Sandal Kulit' },
];

export const PickupOrderSection: React.FC<PickupOrderSectionProps> = ({
  initialServices,
  initialShoeType,
  initialPairsCount,
  initialArea,
  initialSeverity,
  customerUser,
  onOrderCreated,
  onOpenTrackerWithId
}) => {
  // Customer Info State
  const [customerName, setCustomerName] = useState(customerUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(customerUser?.phone || '');
  const [pairsCount, setPairsCount] = useState<number>(initialPairsCount || 1);
  const [activePairIndex, setActivePairIndex] = useState<number>(0);

  // Shoes Data State
  const [shoesList, setShoesList] = useState<PairFormItem[]>([
    {
      id: 'pair-1',
      pairNumber: 1,
      shoeBrand: '',
      shoeType: initialShoeType || 'Sneakers',
      material: 'Canvas / Kain',
      severity: initialSeverity || 'normal',
      serviceIds: initialServices && initialServices.length > 0 ? initialServices.map(s => s.id) : ['jahit-benang-tersembunyi'],
      customNotes: '',
      photoPreview: undefined,
      aiDetectedSeverity: undefined,
      aiAnalyzing: false
    }
  ]);

  // Sync external preselection from Catalog
  useEffect(() => {
    if (initialServices && initialServices.length > 0) {
      setShoesList(prev => prev.map((sh, idx) => {
        if (idx === 0) {
          return {
            ...sh,
            serviceIds: initialServices.map(s => s.id),
            shoeType: initialShoeType || sh.shoeType,
            severity: initialSeverity || sh.severity
          };
        }
        return sh;
      }));
    }
    if (initialPairsCount && initialPairsCount > 0) {
      setPairsCount(initialPairsCount);
    }
    if (initialArea) {
      setAreaName(initialArea);
    }
  }, [initialServices, initialShoeType, initialPairsCount, initialArea, initialSeverity]);

  // Delivery State: Antar-Jemput Flat 15k or Drop-off 0k
  const [pickupType, setPickupType] = useState<'antar_jemput' | 'drop_off'>('antar_jemput');
  const [areaName, setAreaName] = useState<string>(initialArea || 'Kesambi');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState('');

  // Active Menu Tab for Service Selection (Organized by Menu Category)
  const [activeFormMenuTab, setActiveFormMenuTab] = useState<'jahit' | 'sol' | 'treatment' | 'rekonstruksi'>('jahit');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

  // UI state
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [validationError, setValidationError] = useState('');

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

  // Otomatis deteksi tingkat kerusakan sepatu dari foto pelanggan
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

      // Call diagnosis endpoint in server.ts to auto-detect damage severity
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
          // Map response to damage severity: kecil, normal, hard
          let detectedSeverity: DamageSeverity = 'normal';
          const textToEval = JSON.stringify(result).toLowerCase();
          if (textToEval.includes('berat') || textToEval.includes('parah') || textToEval.includes('hancur') || textToEval.includes('lepas total')) {
            detectedSeverity = 'hard';
          } else if (textToEval.includes('ringan') || textToEval.includes('sebagian') || textToEval.includes('sedikit')) {
            detectedSeverity = 'kecil';
          } else {
            detectedSeverity = 'normal';
          }

          updateActiveShoe({
            severity: detectedSeverity,
            aiDetectedSeverity: detectedSeverity,
            aiAnalyzing: false,
            customNotes: result.summary ? `${result.summary}` : activeShoe.customNotes
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
    updateActiveShoe({ photoPreview: undefined, aiDetectedSeverity: undefined });
  };

  // Deteksi GPS Koordinat 1-Klik Cepat & Sederhana
  const handleDetectGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatusMsg('Perangkat belum mendukung GPS otomatis.');
      return;
    }
    setIsLocatingGps(true);
    setGpsStatusMsg('Mengunci koordinat lokasi...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const dist = calculateDistanceToWorkshop(lat, lng);
        setGpsCoords({ lat, lng });
        setIsLocatingGps(false);
        setGpsStatusMsg(`✓ Lokasi Terkunci: ${dist} KM dari Workshop Sukalila`);
      },
      () => {
        setIsLocatingGps(false);
        setGpsStatusMsg('Izin GPS belum aktif di browser. Cukup pilih nama Kecamatan di bawah.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
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
      material: shoe.material,
      severity: shoe.severity,
      selectedServices: selectedServiceObjs,
      photoUrl: shoe.photoPreview,
      damageNotes: shoe.customNotes,
      price: pairPrice
    };
  });

  const totalServicesPrice = shoeDetailsWithPrices.reduce((sum, s) => sum + s.price, 0);

  // Cek apakah wilayah termasuk Wilayah Kota Cirebon (Gratis Ongkir Khusus Kota)
  const isAreaInKotaCirebon = (name: string): boolean => {
    const lower = name.toLowerCase();
    const isKecamatanKota = KOTA_CIREBON_KECAMATAN.some(k => lower.includes(k.toLowerCase()));
    const matched = CIREBON_AREAS.find(a => a.name.toLowerCase() === lower);
    return isKecamatanKota || matched?.type === 'Kota';
  };

  const isKota = isAreaInKotaCirebon(areaName);

  // Aturan Ongkir:
  // - Drop-off mandiri ke Workshop Sukalila: Rp 0
  // - Antar-jemput Wilayah Kota Cirebon: Rp 0 (GRATIS ONGKIR)
  // - Antar-jemput Wilayah Kabupaten Cirebon: Rp 15.000 (15k)
  const deliveryFee = pickupType === 'drop_off' ? 0 : isKota ? 0 : 15000;
  const grandTotal = totalServicesPrice + deliveryFee;

  // Handle Order Submit
  const handleCreateOrder = (sendToWhatsApp: boolean = false) => {
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

    const allPhotos = shoeDetailsWithPrices
      .map(s => s.photoUrl)
      .filter((url): url is string => Boolean(url));

    const allServicesFlattened = Array.from(
      new Set(shoeDetailsWithPrices.flatMap(s => s.selectedServices))
    );

    const summaryBrand = pairsCount === 1 
      ? shoesList[0].shoeBrand 
      : `${shoesList[0].shoeBrand} (+${pairsCount - 1} pasang)`;

    const cleanArea = areaName.trim() || 'Kesambi';
    const finalLat = gpsCoords?.lat;
    const finalLng = gpsCoords?.lng;

    const newOrder: Order = {
      id: `SLC-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: customerUser?.id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      shoeBrand: summaryBrand,
      shoeType: shoesList[0].shoeType,
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
      distanceZone: isKota ? 'dekat_kota' : 'jauh_kabupaten',
      logisticsPartner: 'kurir_soleman',
      customerConfirmedMaterialPhoto: true,
      location: {
        areaName: cleanArea,
        areaType: isKota ? 'Kota' : 'Kabupaten',
        distanceZone: isKota ? 'dekat_kota' : 'jauh_kabupaten',
        logisticsPartner: 'kurir_soleman',
        shareLocViaWhatsApp: true,
        fullAddress: `Kec. ${cleanArea}, Cirebon`,
        landmark: `Titik Lokasi: ${customerName.trim()} (${cleanArea})`,
        lat: finalLat,
        lng: finalLng,
        accuracy: finalLat ? 10 : undefined,
        mapsUrl: finalLat && finalLng ? `https://www.google.com/maps?q=${finalLat},${finalLng}` : undefined,
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
      assignedCourierPhone: '08814519955',
      timeline: [
        {
          status: 'menunggu_jemput',
          label: 'Pesanan Diterima di Sistem',
          timestamp: 'Baru saja',
          description: `Booking ${pairsCount} pasang sepatu atas nama ${customerName.trim()} (${cleanArea}). Siap dijadwalkan ke rute kurir.`
        }
      ]
    };

    setCreatedOrder(newOrder);
    onOrderCreated(newOrder);
    soundFx.playSuccess();

    if (sendToWhatsApp) {
      const waUrl = buildNewOrderWhatsAppUrl(newOrder);
      window.open(waUrl, '_blank');
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

      {/* Success Notification after Order Created - With Instant Auto-Tracking Button */}
      {createdOrder && (
        <div className="mb-8 p-6 rounded-3xl bg-slate-900 border border-cyan-400/60 shadow-[0_0_25px_rgba(0,240,255,0.25)] space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-400 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-lg shadow-cyan-400/40">
              <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                Pesanan Berhasil Dicatat!
              </span>
              <h3 className="text-xl font-extrabold text-white">
                Kode Seri Order: #{createdOrder.id}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pesanan Anda untuk {createdOrder.pairsCount} pasang sepatu atas nama <strong>{createdOrder.customerName}</strong> ({createdOrder.location.areaName}) telah tersimpan. Total: <strong>Rp {createdOrder.totalAmount.toLocaleString('id-ID')}</strong> ({createdOrder.paymentMethod.toUpperCase()}).
              </p>
            </div>
          </div>

          {/* Quick Auto-Track Action Button */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                if (onOpenTrackerWithId) {
                  onOpenTrackerWithId(createdOrder.id);
                }
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-sky-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-400/30 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>Lacak Status Pesanan #{createdOrder.id} Otomatis</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const waUrl = buildNewOrderWhatsAppUrl(createdOrder);
                window.open(waUrl, '_blank');
              }}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Buka Chat WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Order Form Card */}
      <div className="bg-slate-900/90 border border-cyan-500/20 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
        
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
            <div className="flex items-center gap-2 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400">Jumlah:</span>
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setPairsCount(num);
                  }}
                  className={`w-7 h-7 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    pairsCount === num
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
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
                <div className="flex items-center gap-3 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
                  <img
                    src={activeShoe.photoPreview}
                    alt="Preview Sepatu"
                    className="w-16 h-16 object-cover rounded-lg border border-cyan-500/30"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-cyan-300">
                        Foto Sepatu Terunggah
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase">
                        Otomatis: {activeShoe.severity === 'hard' ? 'Berat' : activeShoe.severity === 'kecil' ? 'Ringan' : 'Sedang'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Tingkat kerusakan otomatis disinkronkan ke rincian harga secara akurat.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
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
                  { id: 'sol', label: '👟 Ganti Tapak', cat: (s: ServiceItem) => s.category === 'sol' },
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
                  return (
                    <div
                      key={serv.id}
                      onClick={() => toggleServiceForActiveShoe(serv.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all text-xs ${
                        isChecked
                          ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
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
                      <span className="font-black text-cyan-300 text-[11px] shrink-0 font-mono">
                        {tier.priceFormatted}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Delivery & Area */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-400">
              <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-[10px]">3</span>
              <span>Metode Pengambilan & Wilayah</span>
            </div>
          </div>

          {/* Pickup option switcher */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setPickupType('antar_jemput');
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                pickupType === 'antar_jemput'
                  ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">Antar-Jemput Kurir</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  isKota 
                    ? 'text-cyan-300 bg-cyan-950 border-cyan-400/40' 
                    : 'text-sky-300 bg-slate-900 border-sky-500/30'
                }`}>
                  {isKota ? 'Rp 0 (Kota)' : 'Rp 15.000 (Kab.)'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Kurir Soleman jemput ke rumah Anda.</p>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setPickupType('drop_off');
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                pickupType === 'drop_off'
                  ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">Drop-off Workshop</span>
                <span className="text-[10px] font-black text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-400/40">
                  Rp 0 (Gratis)
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Antar langsung ke Jl. Sukalila Selatan.</p>
            </button>
          </div>

          {/* Area & GPS Location Selector */}
          {pickupType === 'antar_jemput' && (
            <div className="space-y-2.5 bg-slate-950/80 p-3.5 rounded-2xl border border-cyan-500/20">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300">
                  Pilih Wilayah / Kecamatan di Cirebon:
                </label>
                <button
                  type="button"
                  onClick={handleDetectGps}
                  disabled={isLocatingGps}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold cursor-pointer"
                >
                  <Crosshair className="w-3 h-3 text-cyan-400" />
                  <span>{isLocatingGps ? 'Mencari...' : 'Deteksi GPS Saya'}</span>
                </button>
              </div>

              {/* Dynamic Ongkir Status Banner */}
              <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                isKota 
                  ? 'bg-cyan-950/40 border-cyan-400/50 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>
                    {isKota 
                      ? '🎉 Khusus Wilayah Kota Cirebon: GRATIS ONGKIR!' 
                      : '🛵 Wilayah Kabupaten Cirebon: Ongkir Rp 15.000 (15k)'}
                  </span>
                </div>
                <span className="font-mono font-black text-white">
                  {isKota ? 'Rp 0' : 'Rp 15.000'}
                </span>
              </div>

              {gpsStatusMsg && (
                <div className="text-[10px] text-cyan-300 bg-cyan-950/30 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                  {gpsStatusMsg}
                </div>
              )}

              <select
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-white text-xs outline-none transition-colors"
              >
                <optgroup label="── KOTA CIREBON (GRATIS ONGKIR Rp 0) ──">
                  {CIREBON_AREAS.filter(a => a.type === 'Kota').map((a) => (
                    <option key={a.name} value={a.name}>
                      {a.name} — GRATIS ONGKIR
                    </option>
                  ))}
                </optgroup>
                <optgroup label="── KABUPATEN CIREBON (ONGKIR 15k) ──">
                  {CIREBON_AREAS.filter(a => a.type === 'Kabupaten').map((a) => (
                    <option key={a.name} value={a.name}>
                      {a.name} — Ongkir 15k
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}
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
          <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/20 space-y-2 text-xs shadow-inner">
            <div className="flex justify-between text-slate-400">
              <span>Total Biaya Servis ({pairsCount} pasang):</span>
              <span className="text-white font-bold font-mono">Rp {totalServicesPrice.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Biaya Ongkir Kurir:</span>
              <span className={deliveryFee === 0 ? "text-cyan-300 font-bold font-mono" : "text-cyan-400 font-bold font-mono"}>
                {deliveryFee === 0 
                  ? (pickupType === 'drop_off' ? 'Rp 0 (Drop-off Workshop)' : 'Rp 0 (GRATIS ONGKIR Kota Cirebon)') 
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

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => handleCreateOrder(false)}
              className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-sky-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-400/30 transition-all cursor-pointer"
            >
              <Truck className="w-4 h-4 stroke-[2.5]" />
              <span>Pesan Sekarang (Langsung Masuk Sistem)</span>
            </button>

            <button
              type="button"
              onClick={() => handleCreateOrder(true)}
              className="py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Pesan & Kirim ke WhatsApp</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
