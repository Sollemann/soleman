/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  Phone, 
  FileCheck, 
  Camera, 
  Upload, 
  X, 
  Layers, 
  Sparkles, 
  DollarSign, 
  QrCode, 
  Share2,
  Navigation,
  Crosshair,
  Compass,
  Zap
} from 'lucide-react';
import { 
  SERVICES_CATALOG, 
  CIREBON_AREAS, 
  ALL_CIREBON_KECAMATAN_SUGGESTIONS,
  DISTANCE_ZONES,
  WORKSHOP_INFO, 
  KOTA_CIREBON_KECAMATAN,
  calculateDistanceToWorkshop,
  SHOE_MATERIALS, 
  DAMAGE_SEVERITIES, 
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
  DistanceZone,
  LogisticsPartner,
  CustomerUser
} from '../types';
import { buildNewOrderWhatsAppUrl, parseShareLocInput } from '../services/whatsappHelper';

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
}

const AVAILABLE_SHOE_TYPES: { id: ShoeType; label: string; desc: string }[] = [
  { id: 'Sneakers', label: 'Sneakers', desc: 'Jordan, Vans, Ventela, Compass' },
  { id: 'Sepatu Sekolah', label: 'Sepatu Sekolah', desc: 'Warrior, NB, Sepatu hitam anak' },
  { id: 'Sepatu Kantor / Pantofel', label: 'Sepatu Kantor / Pantofel', desc: 'Kulit kerja, formal pria/wanita' },
  { id: 'Sepatu Proyek / Safety', label: 'Sepatu Proyek / Safety', desc: 'Safety boots, tapak paku, baja' },
  { id: 'Sepatu Futsal', label: 'Sepatu Futsal', desc: 'Sol karet mentah indoor/outdoor' },
  { id: 'Sepatu Olah Raga / Sport', label: 'Sepatu Olah Raga / Sport', desc: 'Running joging, senam, badminton' },
  { id: 'Sepatu Trail', label: 'Sepatu Trail', desc: 'Trail run, motocross, cadas (Ganti Tapak Rp 200rb)' },
  { id: 'Sepatu Gunung / Hiking', label: 'Sepatu Gunung / Hiking', desc: 'Hiking boots, trekking Ciremai lugged grip' },
  { id: 'Sepatu Bola / Cleats', label: 'Sepatu Bola / Cleats', desc: 'Pul stud rumput sintetis/alami' },
  { id: 'Sendal Biasa', label: 'Sendal Biasa', desc: 'Sandal jepit, casual, slip-on' },
  { id: 'Sendal Kulit', label: 'Sendal Kulit', desc: 'Sandal selop kulit pria/wanita' },
];

export const PickupOrderSection: React.FC<PickupOrderSectionProps> = ({
  initialServices,
  initialShoeType,
  initialPairsCount,
  initialArea,
  initialSeverity,
  customerUser,
  onOrderCreated,
  onOpenDashboard
}) => {
  // Customer Info State
  const [customerName, setCustomerName] = useState(customerUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(customerUser?.phone || '');
  const [pairsCount, setPairsCount] = useState<number>(initialPairsCount || 1);
  const [activePairIndex, setActivePairIndex] = useState<number>(0);

  // Prefill customer if logged in
  useEffect(() => {
    if (customerUser) {
      if (!customerName) setCustomerName(customerUser.name);
      if (!customerPhone) setCustomerPhone(customerUser.phone);
      if (customerUser.savedArea && !initialArea) setAreaName(customerUser.savedArea);
    }
  }, [customerUser]);

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
      photoPreview: undefined
    }
  ]);

  // Sync external preselection from Catalog or Calculator
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

  // Delivery & Distance Zone State (Jarak: Dekat, Jauh Grab/Maxim, Luar Cirebon J&T Express)
  const [pickupType, setPickupType] = useState<'antar_jemput' | 'hanya_jemput' | 'drop_off'>('antar_jemput');
  const [distanceZone, setDistanceZone] = useState<DistanceZone>('dekat_kota');
  const [logisticsPartner, setLogisticsPartner] = useState<LogisticsPartner>('kurir_soleman');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [confirmMaterialPhoto, setConfirmMaterialPhoto] = useState(true);
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<'pagi' | 'siang' | 'sore'>('siang');
  const [areaType, setAreaType] = useState<'Kota' | 'Kabupaten'>('Kota');
  const [areaName, setAreaName] = useState<string>(initialArea || 'Kesambi');
  const [landmark, setLandmark] = useState('');
  const [waShareLocLink, setWaShareLocLink] = useState('');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState('');

  // Deteksi Sherlock GPS Otomatis 1-Klik & Hitung Jarak ke Workshop Sukalila
  const handleDetectSherlockGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatusMsg('Perangkat Anda belum mendukung GPS otomatis. Silakan pilih salah satu tombol Kecamatan Cirebon di bawah (1 Klik Tanpa Ketik).');
      return;
    }
    setIsLocatingGps(true);
    setGpsStatusMsg('🛰️ Sedang mengunci titik GPS akurat & menghitung jarak ke Workshop Sukalila...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy || 10);
        const dist = calculateDistanceToWorkshop(lat, lng);

        setGpsCoords({ lat, lng, accuracy });
        setDistanceKm(dist);
        setWaShareLocLink(`https://www.google.com/maps?q=${lat},${lng}`);
        setIsLocatingGps(false);

        // Jika Jarak <= 6.5 KM (Atau berada di Wilayah Cirebon Kota)
        if (dist <= 6.5) {
          setAreaType('Kota');
          setDistanceZone('dekat_kota');
          setLogisticsPartner('kurir_soleman');
          if (!areaName || areaName === 'Kesambi' || areaName.includes('Cirebon')) {
            setAreaName('Kota Cirebon');
          }
          if (!landmark || landmark.startsWith('Titik GPS') || landmark.startsWith('Wilayah Kec.')) {
            setLandmark(`Titik GPS Akurat (${dist} KM dari Sukalila • ±${accuracy}m)`);
          }
          setGpsStatusMsg(`✓ Lokasi Terkunci: Jarak ${dist} KM dari Workshop Sukalila • Wilayah Kota Cirebon (🎉 GRATIS ONGKIR AKTIF Rp 0!)`);
        } else if (dist <= 25) {
          setAreaType('Kabupaten');
          setDistanceZone('jauh_kabupaten');
          setLogisticsPartner('grab_maxim');
          if (!areaName || areaName === 'Kesambi' || areaName.includes('Cirebon')) {
            setAreaName('Kabupaten Cirebon');
          }
          if (!landmark || landmark.startsWith('Titik GPS') || landmark.startsWith('Wilayah Kec.')) {
            setLandmark(`Titik GPS Akurat (${dist} KM dari Sukalila • ±${accuracy}m)`);
          }
          setGpsStatusMsg(`✓ Lokasi Terkunci: Jarak ${dist} KM dari Workshop Sukalila • Wilayah Kab. Cirebon (Ongkir Rp 10.000 / Gratis min. 2 pasang)`);
        } else {
          setDistanceZone('luar_cirebon');
          setLogisticsPartner('jnt_express');
          if (!areaName || areaName === 'Kesambi') {
            setAreaName('Luar Cirebon');
          }
          setGpsStatusMsg(`✓ Lokasi Terkunci: Jarak ${dist} KM — Wilayah Luar Cirebon (Ekspedisi J&T Express)`);
        }
      },
      () => {
        setIsLocatingGps(false);
        setGpsStatusMsg('Izin GPS belum aktif di browser HP. Jangan khawatir, klik tombol Kecamatan Cirebon di bawah (1 Klik Tanpa Ketik), Gratis Ongkir tetap otomatis berlaku!');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Metode Pembayaran: QRIS dan COD
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

  // UI state
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [validationError, setValidationError] = useState('');
  const [showQrisModal, setShowQrisModal] = useState(false);

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
            photoPreview: undefined
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

  // Active shoe item helper functions
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

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setValidationError('Ukuran foto maksimal 8 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      updateActiveShoe({ photoPreview: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    updateActiveShoe({ photoPreview: undefined });
  };

  // Calculate pricing per shoe & total
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

  // ATURAN ONGKIR REAL-TIME BERDASARKAN WILAYAH & JARAK KE WORKSHOP SUKALILA:
  // 1. Drop-off Mandiri ke Workshop Sukalila: GRATIS (Rp 0)
  // 2. Seluruh Wilayah Kota Cirebon (5 Kecamatan Resmi: Kesambi, Kejaksan, Pekalipan, Lemahwungkuk, Harjamukti
  //    atau Jarak GPS <= 6.5 KM atau Zona Dekat Kota): SELALU GRATIS ONGKIR OTOMATIS (Rp 0)
  // 3. Kabupaten Cirebon: GRATIS jika order >= 2 pasang / Rp 10.000 jika hanya 1 pasang
  // 4. Luar Cirebon: Ekspedisi J&T Express Rp 15.000
  const isCirebonKotaAuto =
    distanceZone === 'dekat_kota' ||
    areaType === 'Kota' ||
    (distanceKm !== null && distanceKm <= 6.5) ||
    KOTA_CIREBON_KECAMATAN.some(k => areaName.toLowerCase().includes(k.toLowerCase()));

  let deliveryFee = 0;
  if (pickupType === 'drop_off') {
    deliveryFee = 0;
  } else if (distanceZone === 'luar_cirebon') {
    deliveryFee = 15000;
  } else if (isCirebonKotaAuto) {
    deliveryFee = 0; // GRATIS ONGKIR OTOMATIS CIREBON KOTA
  } else if (distanceZone === 'jauh_kabupaten' || areaType === 'Kabupaten') {
    deliveryFee = pairsCount >= 2 ? 0 : 10000;
  } else {
    deliveryFee = 0;
  }

  const grandTotal = totalServicesPrice + deliveryFee;

  // Cek apakah ada layanan yang butuh konfirmasi sampel foto bahan sol (seperti Ganti Tapak Trail Rp 200rb)
  const hasServiceRequiringPhotoConfirm = shoeDetailsWithPrices.some(s => 
    s.selectedServices.some(serv => serv.requiresPhotoConfirmation)
  );

  // Handle Order Submit (Otomatis Lokasi via WA)
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
      setValidationError(`Silakan isi Merk/Jenis untuk Sepatu #${emptyBrandIndex + 1}.`);
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

    const cleanArea = areaName.trim() || (distanceZone === 'luar_cirebon' ? 'Luar Cirebon' : areaType === 'Kota' ? 'Kota Cirebon' : 'Kabupaten Cirebon');
    const cleanLandmark = landmark.trim();
    const parsedShareLoc = parseShareLocInput(waShareLocLink);
    const finalLat = gpsCoords?.lat ?? parsedShareLoc.lat;
    const finalLng = gpsCoords?.lng ?? parsedShareLoc.lng;
    const finalAccuracy = gpsCoords?.accuracy ?? (finalLat ? 10 : undefined);

    const finalMapsUrl = finalLat && finalLng
      ? `https://www.google.com/maps?q=${finalLat},${finalLng}`
      : parsedShareLoc.cleanUrl
      ? parsedShareLoc.cleanUrl
      : undefined;

    const finalFullAddress = cleanLandmark
      ? `${cleanLandmark} (Kec. ${cleanArea})`
      : `Kec. ${cleanArea} (Sherlock Asli di Fitur WA Kurir)`;

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
      preferredTimeSlot,
      distanceZone,
      logisticsPartner,
      trackingNumber: trackingNumber.trim() || undefined,
      customerConfirmedMaterialPhoto: confirmMaterialPhoto,
      location: {
        areaName: cleanArea,
        areaType: distanceZone === 'luar_cirebon' ? 'Luar_Cirebon' : areaType,
        distanceZone,
        logisticsPartner,
        trackingNumber: trackingNumber.trim() || undefined,
        shareLocViaWhatsApp: true,
        fullAddress: finalFullAddress,
        landmark: cleanLandmark || `Titik Sherlock Area ${cleanArea}`,
        lat: finalLat,
        lng: finalLng,
        accuracy: finalAccuracy,
        mapsUrl: finalMapsUrl,
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
      assignedCourier: logisticsPartner === 'jnt_express' ? 'Ekspedisi J&T Express' : 'Kurir Soleman',
      assignedCourierPhone: '08814519955',
      timeline: [
        {
          status: 'menunggu_jemput',
          label: 'Sherlock & Patokan Tersinkron ke Dashboard Kurir',
          timestamp: 'Baru saja',
          description: `Booking ${pairsCount} pasang sepatu. Patokan: "${cleanLandmark || 'Share Loc WA'}" (${cleanArea}) otomatis masuk ke Dashboard Kurir Soleman.`
        }
      ]
    };

    setCreatedOrder(newOrder);
    onOrderCreated(newOrder);

    // Buka WhatsApp langsung
    if (sendToWhatsApp) {
      const waUrl = buildNewOrderWhatsAppUrl(newOrder);
      window.open(waUrl, '_blank');
    }
  };

  return (
    <section id="antar-jemput" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
          <Truck className="w-3.5 h-3.5" />
          <span>Antar-Jemput Sepatu & Sandal Se-Cirebon • Kurir Soleman</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
          Formulir Pemesanan Reparasi <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">
            Jahit Sol, Ganti Tapak & Share Loc Otomatis via WA
          </span>
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto">
          Tanpa repot mengetik alamat atau titik koordinat rumit! Titik lokasi otomatis dikirim lewat <strong className="text-amber-400">Share Loc di WhatsApp</strong> ke <strong className="text-amber-400">Kurir Soleman</strong> dengan pilihan bayar <strong className="text-amber-400">QRIS</strong> atau <strong className="text-amber-400">COD</strong>.
        </p>
      </div>

      {/* Promosi Ongkir Banner */}
      <div className="mt-8 max-w-4xl mx-auto p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-sky-500/15 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-white block">
              Ketentuan Promo Ongkir Antar-Jemput Soleman Cirebon:
            </span>
            <span className="text-slate-300">
              • <strong className="text-emerald-400">Khusus Kota Cirebon: GRATIS ONGKIR</strong> (Berapapun pasang).
              <br className="hidden sm:inline" />
              • <strong className="text-amber-300">Kabupaten Cirebon: GRATIS ONGKIR</strong> minimal 2 pasang (1 pasang hanya Rp 10.000).
            </span>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold self-start sm:self-center shrink-0">
          Praktis & Hemat
        </span>
      </div>

      {/* Success Notification after Order Created */}
      {createdOrder && (
        <div className="mt-8 max-w-4xl mx-auto p-6 rounded-3xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 shadow-2xl space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-lg shadow-emerald-500/25">
              <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Pesanan Berhasil Dicatat!
              </span>
              <h3 className="text-xl font-extrabold text-white">
                Order #{createdOrder.id} - Siap Dijemput Kurir Soleman
              </h3>
              <p className="text-xs text-emerald-300 leading-relaxed">
                Rincian {createdOrder.pairsCount} pasang sepatu, patokan lokasi, dan metode pembayaran <strong className="text-white uppercase">{createdOrder.paymentMethod}</strong> (Total Rp {createdOrder.totalAmount.toLocaleString('id-ID')}) telah masuk otomatis ke Dashboard Kurir. Sekarang kirimkan <strong>Sherlock Asli lewat fitur 📍 Lokasi bawaan WhatsApp</strong> di chat Kurir Soleman!
              </p>
            </div>
          </div>

          {/* Panduan Penting Kirim Sherlock Asli di Fitur WhatsApp */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/40 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 font-black text-emerald-400 uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Cara Kirim Sherlock Asli di Fitur WhatsApp Kurir Agar 100% Akurat:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <strong className="text-amber-400 block mb-0.5">1. Buka Chat WA Kurir</strong>
                Klik tombol hijau WhatsApp di bawah untuk mengirim pesan order & patokan rumah Anda.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <strong className="text-emerald-400 block mb-0.5">2. Klik Ikon 📎 Lampiran WA</strong>
                Di ruang chat WA Kurir, tekan ikon <strong>📎 (Klip Kertas / +)</strong> lalu pilih menu <strong>📍 Lokasi (Location)</strong>.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <strong className="text-sky-400 block mb-0.5">3. Kirim Lokasi Saat Ini</strong>
                Pilih <strong>"Kirim Lokasi Anda Saat Ini"</strong> atau <strong>"Berbagi Lokasi Terkini"</strong> langsung ke Kurir!
              </div>
            </div>
          </div>

          {/* If QRIS selected, show QRIS quick card */}
          {createdOrder.paymentMethod === 'qris' && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center">
                  <QrCode className="w-9 h-9 text-slate-950" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    Pembayaran QRIS Soleman Cirebon
                  </span>
                  <span className="text-sm font-bold text-white">
                    Scan via BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana
                  </span>
                  <p className="text-[11px] text-slate-400">Total Tagihan: Rp {createdOrder.totalAmount.toLocaleString('id-ID')}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowQrisModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all shrink-0"
              >
                Tampilkan Barcode QRIS
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={buildNewOrderWhatsAppUrl(createdOrder)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Buka WA Kurir & Kirim Sherlock Asli (📎 ➔ 📍 Lokasi)</span>
            </a>
            <button
              onClick={onOpenDashboard}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all"
            >
              <span>Lacak Progres di Sistem</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Booking Form Grid */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form: Data Pelanggan + Sepatu + Lokasi Otomatis + Pembayaran (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Data Kontak & Jumlah Pasang */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center">1</span>
                <h3 className="text-sm font-bold text-white">Data Kontak & Jumlah Pasang Sepatu/Sandal</h3>
              </div>
              {areaType === 'Kota' ? (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  🎉 Gratis Ongkir Kota Cirebon
                </span>
              ) : pairsCount >= 2 ? (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  🎉 Gratis Ongkir Kab. Cirebon (2+ Psg)
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Nama Anda *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Dimas Prasetyo"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Nomor WhatsApp *
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Pilihan Jumlah Pasang */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Jumlah Pasang yang Mau Diservis:
                </label>
                <span className="text-[11px] text-amber-400 font-semibold">
                  {pairsCount} Pasang Dipilih
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPairsCount(num)}
                    className={`py-2.5 rounded-xl text-xs font-extrabold border transition-all ${
                      pairsCount === num
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-105'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {num} Pasang
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Pengaturan Sepatu/Sandal Aktif */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center">2</span>
                <h3 className="text-sm font-bold text-white">
                  Rincian Item #{activePairIndex + 1}
                </h3>
              </div>

              {pairsCount > 1 && (
                <div className="flex items-center gap-1.5">
                  {shoesList.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePairIndex(idx)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        activePairIndex === idx
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      #{idx + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Merk & Tipe Lengkap (Termasuk Sepatu Sekolah, Kantor, Proyek, Futsal, Trail, Sendal, dll) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Merk / Model #{activePairIndex + 1} *
                </label>
                <input
                  type="text"
                  value={activeShoe.shoeBrand}
                  onChange={(e) => updateActiveShoe({ shoeBrand: e.target.value })}
                  placeholder="Contoh: Warrior Sekolah / Specs Futsal / Pantofel"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Jenis Sepatu / Sendal:
                </label>
                <select
                  value={activeShoe.shoeType}
                  onChange={(e) => updateActiveShoe({ shoeType: e.target.value as ShoeType })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {AVAILABLE_SHOE_TYPES.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.label} ({t.desc})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* BAHAN SEPATU/SENDAL */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Bahan Material #{activePairIndex + 1}:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SHOE_MATERIALS.map(mat => (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => updateActiveShoe({ material: mat.id })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      activeShoe.material === mat.id
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold truncate">{mat.label}</div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">{mat.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* TINGKAT KERUSAKAN & HARGA MASING-MASING */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
                  Tingkat Kerusakan Sepatu #{activePairIndex + 1} (Sesuai Kondisi & Harga):
                </label>
                <span className="text-[11px] font-semibold text-slate-300">
                  Klik tingkat kerusakan untuk menyesuaikan tarif
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {DAMAGE_SEVERITIES.map(sev => {
                  const isSelected = activeShoe.severity === sev.id;
                  const activeSelectedServices = SERVICES_CATALOG.filter(s => activeShoe.serviceIds.includes(s.id));
                  const primaryServ = activeSelectedServices[0] || SERVICES_CATALOG[0];
                  const tierDetail = getServiceTierDetail(primaryServ, sev.id);
                  const totalForThisSeverity = activeSelectedServices.reduce(
                    (sum, s) => sum + calculateServicePrice(s, activeShoe.material, sev.id),
                    0
                  );

                  return (
                    <button
                      key={sev.id}
                      type="button"
                      onClick={() => updateActiveShoe({ severity: sev.id })}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? sev.activeBorderClass
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${sev.dotColor}`} />
                            <span className="text-xs font-extrabold text-white">{sev.shortLabel}</span>
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border ${sev.colorClass}`}>
                            {sev.badge}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-amber-300/95 truncate mt-1">
                          {tierDetail.label.replace(/^(Ringan|Sedang|Berat)\s*\/\s*/i, '')}
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-snug mt-0.5">
                          {tierDetail.damageDesc}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          {activeSelectedServices.length} Layanan:
                        </span>
                        <span className={`text-xs font-black font-mono ${isSelected ? 'text-amber-400' : 'text-slate-200'}`}>
                          Rp {totalForThisSeverity.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PILIHAN LAYANAN REPARASI DENGAN RINCIAN HARGA PER TINGKAT KERUSAKAN */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Pilih Layanan & Kerusakan Sepatu #{activePairIndex + 1}:
                </label>
                <span className="text-[11px] text-amber-400 font-semibold">Bisa pilih lebih dari 1 layanan</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                {SERVICES_CATALOG.map(serv => {
                  const isChecked = activeShoe.serviceIds.includes(serv.id);
                  const activeTier = getServiceTierDetail(serv, activeShoe.severity);
                  const tierKecil = getServiceTierDetail(serv, 'kecil');
                  const tierNormal = getServiceTierDetail(serv, 'normal');
                  const tierHard = getServiceTierDetail(serv, 'hard');

                  return (
                    <div
                      key={serv.id}
                      onClick={() => toggleServiceForActiveShoe(serv.id)}
                      className={`p-3 rounded-2xl border text-xs cursor-pointer flex flex-col justify-between gap-2 transition-all ${
                        isChecked
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="font-bold text-white leading-snug">{serv.name}</span>
                              {serv.isBestMenu && (
                                <span className="text-[9px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-black shrink-0">
                                  Terbaik
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-amber-300 font-semibold block mt-0.5">
                              • {activeTier.label}
                            </span>
                          </div>
                          <span className="text-amber-400 font-black shrink-0 font-mono text-xs">
                            {activeTier.priceFormatted}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-snug mt-1">
                          {activeTier.damageDesc}
                        </p>
                      </div>

                      {/* Mini 3-tier price bar */}
                      <div className="pt-1.5 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-[9px] font-mono text-center">
                        <span className={`py-0.5 rounded px-1 ${activeShoe.severity === 'kecil' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'bg-slate-900/70 text-slate-500'}`}>
                          Ringan: {tierKecil.price / 1000}rb
                        </span>
                        <span className={`py-0.5 rounded px-1 ${activeShoe.severity === 'normal' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' : 'bg-slate-900/70 text-slate-500'}`}>
                          Sedang: {tierNormal.price / 1000}rb
                        </span>
                        <span className={`py-0.5 rounded px-1 ${activeShoe.severity === 'hard' ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30' : 'bg-slate-900/70 text-slate-500'}`}>
                          Berat: {tierHard.price / 1000}rb
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tabel Rincian Kerusakan & Harga Terpilih untuk Sepatu Ini */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 border-b border-slate-800 pb-1.5">
                  <span>Rincian Kerusakan & Harga Sepatu #{activePairIndex + 1}:</span>
                  <span className="text-amber-400 font-mono">
                    Subtotal: Rp {(shoeDetailsWithPrices[activePairIndex]?.price || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {SERVICES_CATALOG.filter(s => activeShoe.serviceIds.includes(s.id)).map(srv => {
                    const tier = getServiceTierDetail(srv, activeShoe.severity);
                    return (
                      <div key={srv.id} className="flex items-start justify-between gap-3 text-xs py-1 border-b border-slate-900 last:border-none">
                        <div className="min-w-0">
                          <div className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                            <span>✓ {srv.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-amber-300">
                              {tier.label}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{tier.damageDesc}</p>
                        </div>
                        <span className="font-mono font-bold text-amber-400 shrink-0">
                          {tier.priceFormatted}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* KONFIRMASI FOTO BAHAN KE WA (Khusus Tapak Trail Rp 200rb & Gunung) */}
            {hasServiceRequiringPhotoConfirm && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-950 to-emerald-950/40 border border-emerald-500/40 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                      <span>Konfirmasi Sampel Foto Bahan Sol ke WhatsApp Anda</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        Wajib Sebelum Dikerjakan
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Khusus layanan Tapak Trail (Rp 200.000) & Gunung, teknisi Soleman <strong>WAJIB memotret sampel bahan tapak & compound karet</strong> lalu mengirimkannya ke WhatsApp Anda terlebih dahulu untuk memastikan kecocokan model, ukuran & ketebalan sebelum mulai dipasang!
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmMaterialPhoto}
                    onChange={(e) => setConfirmMaterialPhoto(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700"
                  />
                  <span className="text-xs font-bold text-emerald-300">
                    ✓ Saya setuju dikirimi foto sampel bahan sol ke WhatsApp sebelum pengerjaan
                  </span>
                </label>
              </div>
            )}

            {/* UPLOAD FOTO SEPATU */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-sky-400" />
                  Kirim Gambar Sepatu #{activePairIndex + 1} ke Admin
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Upload foto fisik sepatu agar teknisi dan Kurir Soleman bisa memeriksa kondisinya.
                </p>
              </div>

              {activeShoe.photoPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 max-w-xs">
                  <img
                    src={activeShoe.photoPreview}
                    alt={`Preview Sepatu #${activePairIndex + 1}`}
                    className="w-full h-36 object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-md"
                    title="Hapus Foto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="p-1.5 bg-slate-950/80 text-[10px] text-emerald-400 font-bold text-center">
                    ✓ Foto siap diperiksa Admin Soleman
                  </div>
                </div>
              ) : (
                <div>
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 hover:border-amber-400 rounded-2xl cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition-colors">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-300">Ambil Foto / Pilih dari Galeri</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Format JPG, PNG (Maks 8MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Catatan Tambahan */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Catatan Khusus #{activePairIndex + 1} (Opsional)
              </label>
              <input
                type="text"
                value={activeShoe.customNotes}
                onChange={(e) => updateActiveShoe({ customNotes: e.target.value })}
                placeholder="Contoh: Jahit sol rapi gak kelihatan benang & ganti tapak"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
              />
            </div>

          </div>

          {/* Card 3: FITUR LOKASI OTOMATIS & GRATIS ONGKIR CIREBON KOTA */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">3</span>
                <h3 className="text-sm font-bold text-white">Lokasi Jemput & Gratis Ongkir Otomatis</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-extrabold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>GPS 1-Klik • Bebas Repot Ketik</span>
                </span>
              </div>
            </div>

            {/* Metode Layanan */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'antar_jemput', title: 'Antar-Jemput', desc: 'Kurir jemput & antar' },
                { id: 'hanya_jemput', title: 'Jemput Saja', desc: 'Ambil di workshop' },
                { id: 'drop_off', title: 'Drop-Off Mandiri', desc: 'Antar ke workshop Sukalila' },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPickupType(m.id as any)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    pickupType === m.id
                      ? 'bg-amber-500/15 border-amber-500 text-white font-bold ring-1 ring-amber-500/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold">{m.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>

            {pickupType !== 'drop_off' && (
              <div className="space-y-4">

                {/* 1. FITUR UTAMA: AMBIL LOKASI SAYA OTOMATIS (GPS 1-KLIK TANPA KETIK) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-950 to-slate-950 border-2 border-emerald-500/50 shadow-lg shadow-emerald-950/30 space-y-3.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Crosshair className={`w-4 h-4 ${isLocatingGps ? 'animate-spin text-amber-400' : ''}`} />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                          <span>📍 Ambil Lokasi Saya Otomatis (GPS 1-Klik)</span>
                          <span className="text-[9px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-black">
                            REKOMENDASI
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          Tanpa repot ketik alamat • Otomatis ukur jarak KM ke Workshop Sukalila & terapkan Gratis Ongkir
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDetectSherlockGps}
                    disabled={isLocatingGps}
                    className="w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-70"
                  >
                    <Compass className={`w-4 h-4 stroke-[2.5] ${isLocatingGps ? 'animate-spin' : ''}`} />
                    <span>
                      {isLocatingGps 
                        ? '🛰️ Sedang Mengunci GPS & Mengukur Jarak...' 
                        : gpsCoords 
                        ? '🔄 Kunci Ulang Titik GPS Saya Sekarang' 
                        : '📍 KLIK DISINI: Ambil Lokasi Saya Otomatis (Bebas Ketik)'}
                    </span>
                  </button>

                  {/* HASIL DETEKSI GPS & JARAK KE WORKSHOP */}
                  {gpsCoords && (
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-2 text-emerald-300 font-mono font-bold">
                          <span>🛰️ Koordinat GPS: {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}</span>
                          <span className="text-[10px] text-slate-400 font-sans">±{gpsCoords.accuracy}m</span>
                        </div>
                        {distanceKm !== null && (
                          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-500/30 font-mono">
                            🎯 Jarak: {distanceKm} KM ke Workshop
                          </span>
                        )}
                      </div>

                      {distanceKm !== null && distanceKm <= 6.5 ? (
                        <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center gap-2 text-xs font-bold text-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>
                            🎉 <strong>WILAYAH KOTA CIREBON ({distanceKm} KM)</strong> — Terdeteksi dalam radius layanan utama. <strong>GRATIS ONGKIR Rp 0 OTOMATIS!</strong>
                          </span>
                        </div>
                      ) : distanceKm !== null && distanceKm <= 25 ? (
                        <div className="p-2.5 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center gap-2 text-xs font-bold text-amber-200">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>
                            📍 <strong>WILAYAH KABUPATEN CIREBON ({distanceKm} KM)</strong> — Ongkir Rp 10.000 (Otomatis <strong>GRATIS</strong> jika order 2 pasang atau lebih).
                          </span>
                        </div>
                      ) : null}

                      {waShareLocLink && (
                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <span className="text-slate-400">Titik lokasi otomatis tersambung ke Kurir & WhatsApp</span>
                          <a
                            href={waShareLocLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 underline font-semibold flex items-center gap-1"
                          >
                            <span>Lihat di Google Maps</span>
                            <ChevronRight className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {gpsStatusMsg && !gpsCoords && (
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{gpsStatusMsg}</span>
                    </div>
                  )}
                </div>

                {/* 2. PILIHAN 1-KLIK 5 KECAMATAN RESMI KOTA CIREBON (SEMUA GRATIS ONGKIR RP 0 - BEBAS KETIK) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                          🏙️ 5 Kecamatan Resmi Kota Cirebon (1-Klik Bebas Ketik)
                        </span>
                        <span className="text-[9px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full font-black">
                          100% GRATIS ONGKIR
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Tinggal klik salah satu kecamatan tempat tinggal Anda di bawah — Ongkir otomatis Rp 0:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      { 
                        name: 'Kesambi', 
                        sub: 'Cipto, Sudarsono, Sunyaragi, Drajat',
                        badge: 'GRATIS ONGKIR' 
                      },
                      { 
                        name: 'Kejaksan', 
                        sub: 'Siliwangi, Kartini, Sukapura, Kebonbaru',
                        badge: 'GRATIS ONGKIR' 
                      },
                      { 
                        name: 'Pekalipan', 
                        sub: 'Pulasaren, Jagasatru, Pekalangan, Sukalila',
                        badge: 'GRATIS ONGKIR' 
                      },
                      { 
                        name: 'Lemahwungkuk', 
                        sub: 'Kasepuhan, Pegambiran, Cangkol, Panjunan',
                        badge: 'GRATIS ONGKIR' 
                      },
                      { 
                        name: 'Harjamukti', 
                        sub: 'Kalijaga, Larangan, Argasunya, Perumnas',
                        badge: 'GRATIS ONGKIR' 
                      },
                    ].map(item => {
                      const isSelected = areaName.toLowerCase().includes(item.name.toLowerCase());
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => {
                            setAreaName(item.name);
                            setAreaType('Kota');
                            setDistanceZone('dekat_kota');
                            setLogisticsPartner('kurir_soleman');
                            if (!landmark || landmark.startsWith('Wilayah Kec.') || landmark.startsWith('Titik GPS')) {
                              setLandmark(`Wilayah Kec. ${item.name} (Kota Cirebon)`);
                            }
                            setGpsStatusMsg(`✓ Kecamatan ${item.name} dipilih! Wilayah Kota Cirebon — 🎉 GRATIS ONGKIR OTOMATIS (Rp 0)!`);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all relative ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400/50 text-white shadow-md'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-emerald-500/40 hover:bg-slate-900/80'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black text-white">Kec. {item.name}</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                              isSelected ? 'bg-emerald-400 text-slate-950' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight truncate">{item.sub}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. PILIHAN 1-KLIK KECAMATAN KABUPATEN CIREBON */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      📍 Atau Pilih Kecamatan Kabupaten Cirebon:
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Gratis Min. 2 Pasang / Rp 10.000
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'Kedawung / Tuparev' },
                      { name: 'Weru / Plered' },
                      { name: 'Sumber' },
                      { name: 'Gunung Jati' },
                      { name: 'Tengah Tani' },
                      { name: 'Talun' },
                      { name: 'Mundu' },
                      { name: 'Plumbon' },
                      { name: 'Palimanan' },
                      { name: 'Klangenan' },
                      { name: 'Astanajapura' },
                    ].map(item => {
                      const isSelected = areaName.toLowerCase().includes(item.name.toLowerCase().split(' ')[0]);
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => {
                            setAreaName(item.name);
                            setAreaType('Kabupaten');
                            setDistanceZone('jauh_kabupaten');
                            setLogisticsPartner('grab_maxim');
                            if (!landmark || landmark.startsWith('Wilayah Kec.') || landmark.startsWith('Titik GPS')) {
                              setLandmark(`Wilayah Kec. ${item.name} (Kab. Cirebon)`);
                            }
                          }}
                          className={`text-[10px] px-2.5 py-1.5 rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-amber-500/25 border-amber-400 text-amber-300 font-bold shadow-sm'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          {item.name} <span className="opacity-70 text-[9px]">(Kabupaten)</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. TULIS MANUAL KECAMATAN / DESA (OPSIONAL) */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Cari / Ketik Nama Kecamatan Lain (Jika Tidak Ada di Pilihan Cepat):
                    </label>
                    <span className="text-[10px] text-slate-500">Opsional</span>
                  </div>
                  <input
                    type="text"
                    list="cirebon-kecamatan-options"
                    value={areaName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAreaName(val);
                      const lower = val.toLowerCase();
                      const isKota = KOTA_CIREBON_KECAMATAN.some(k => lower.includes(k.toLowerCase()));
                      if (isKota) {
                        setAreaType('Kota');
                        setDistanceZone('dekat_kota');
                        setLogisticsPartner('kurir_soleman');
                      } else if (val.trim().length >= 4) {
                        setAreaType('Kabupaten');
                        setDistanceZone('jauh_kabupaten');
                      }
                    }}
                    placeholder="Ketik kecamatan Anda, misal: Kedawung, Weru, Astanajapura..."
                    className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                  <datalist id="cirebon-kecamatan-options">
                    {ALL_CIREBON_KECAMATAN_SUGGESTIONS.map(kec => (
                      <option key={kec} value={kec} />
                    ))}
                  </datalist>
                </div>

                {/* 5. LIVE BANNER: STATUS JARAK & GRATIS ONGKIR OTOMATIS */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  isCirebonKotaAuto
                    ? 'bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border-emerald-500/50 shadow-md'
                    : distanceZone === 'jauh_kabupaten'
                    ? 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 border-amber-500/40 shadow-md'
                    : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                        isCirebonKotaAuto 
                          ? 'bg-emerald-500 text-slate-950' 
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {isCirebonKotaAuto ? '✓' : '📍'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">
                            {isCirebonKotaAuto ? 'WILAYAH KOTA CIREBON' : 'WILAYAH KABUPATEN CIREBON'}
                          </span>
                          {distanceKm !== null && (
                            <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-950 border border-slate-700 text-emerald-300 font-bold">
                              Jarak {distanceKm} KM
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Kecamatan terpilih: <strong className="text-white font-bold">{areaName}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-semibold">Biaya Ongkir Kurir:</span>
                      <span className={`text-sm sm:text-base font-black ${
                        deliveryFee === 0 ? 'text-emerald-400' : 'text-amber-300 font-mono'
                      }`}>
                        {deliveryFee === 0 
                          ? (isCirebonKotaAuto ? '🎉 GRATIS ONGKIR (Rp 0)' : '🎉 GRATIS ONGKIR (2+ Psg)') 
                          : `Rp ${deliveryFee.toLocaleString('id-ID')}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 6. PILIHAN ZONA JARAK & LOGISTIK PENGANTARAN */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Pilihan Zona Pengantaran & Ekspedisi:
                    </label>
                    <span className="text-[10px] text-amber-400 font-semibold">Tersedia Kurir, Grab, Maxim & J&T</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Zona 1: Dekat Kota */}
                    <div
                      onClick={() => {
                        setDistanceZone('dekat_kota');
                        setLogisticsPartner('kurir_soleman');
                        setAreaType('Kota');
                      }}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        distanceZone === 'dekat_kota'
                          ? 'bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-400/40 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-white">Zona 1: Dekat Kota</span>
                        <span className="text-[9px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-black">
                          GRATIS ONGKIR
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-400 font-semibold">Kurir Internal Soleman</p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-tight">Radius &lt; 6 KM (Kesambi, Kejaksan, Pekalipan, Lemahwungkuk, Harjamukti)</p>
                    </div>

                    {/* Zona 2: Jauh Kabupaten */}
                    <div
                      onClick={() => {
                        setDistanceZone('jauh_kabupaten');
                        setLogisticsPartner('grab_maxim');
                        setAreaType('Kabupaten');
                      }}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        distanceZone === 'jauh_kabupaten'
                          ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-400/40 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-white">Zona 2: Jauh Kab.</span>
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold">
                          Gratis 2+ Psg
                        </span>
                      </div>
                      <p className="text-[10px] text-amber-400 font-semibold">Grab, Maxim & Kurir</p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-tight">Kedawung, Sumber, Plered, Gunung Jati, Mundu, Plumbon, dll.</p>
                    </div>

                    {/* Zona 3: Luar Cirebon */}
                    <div
                      onClick={() => {
                        setDistanceZone('luar_cirebon');
                        setLogisticsPartner('jnt_express');
                      }}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        distanceZone === 'luar_cirebon'
                          ? 'bg-sky-500/15 border-sky-500 ring-1 ring-sky-400/40 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-white">Zona 3: Luar Cirebon</span>
                        <span className="text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.2 rounded font-bold">
                          J&T Express
                        </span>
                      </div>
                      <p className="text-[10px] text-sky-400 font-semibold">J&T, SiCepat, JNE</p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-tight">Kuningan, Majalengka, Indramayu, Brebes, Jabodetabek & Antar-Kota.</p>
                    </div>
                  </div>

                  {/* Info Khusus Zona 3 (Luar Cirebon) */}
                  {distanceZone === 'luar_cirebon' && (
                    <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/30 space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-sky-300 font-bold">
                        <Truck className="w-4 h-4 text-sky-400" />
                        <span>Kirim Paket ke Workshop Soleman via Ekspedisi J&T Express</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Alamat kirim workshop: <strong>Soleman Shoes Repair, Jl. Sukalila Selatan, Pekalangan, Kec. Pekalipan, Kota Cirebon 45118 (Dekat Karanggetas & Pasar Pagi PGC)</strong> (WhatsApp: 0881-4519-955).
                      </p>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Nomor Resi J&T Express (Boleh diisi sekarang atau nanti via chat WA):
                        </label>
                        <input
                          type="text"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          placeholder="Contoh: JNT8821948192 (Boleh dikosongkan dulu)"
                          className="w-full bg-slate-900 border border-slate-700 focus:border-sky-400 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 7. PATOKAN RUMAH / CIRI-CIRI LOKASI (OTOMATIS MASUK KE DASHBOARD KURIR) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/50 via-slate-950 to-slate-950 border border-emerald-500/40 space-y-3.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      <span>🚩 Patokan Rumah / Lokasi Penjemputan</span>
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      Otomatis Terbaca di HP Kurir
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-amber-300">
                      Patokan / Ciri Rumah Anda (Bisa Tambah No. Rumah / Warna Pagar):
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Contoh: Depan Indomaret Tuparev, Gang Melati No. 4, pagar hitam cat putih"
                      className="w-full bg-slate-900 border border-amber-500/40 focus:border-amber-400 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 block">
                      Sudah terisi otomatis dari GPS/Kecamatan. Anda juga bisa menambahkan patokan lebih detail.
                    </span>
                  </div>

                  {/* Visual Panduan Fitur Sherlock Asli Bawaan WhatsApp */}
                  <div className="p-3.5 rounded-xl bg-slate-900/95 border border-emerald-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                        <span>📲 Cara Kirim Sherlock Asli yang Ada di Fitur WhatsApp ke Kurir:</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">WA: 0881-4519-955</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                          Langkah 1
                        </span>
                        <p className="text-slate-200 font-semibold leading-snug">
                          Klik tombol <strong>"Pesan & Kirim Sherlock Asli di WA"</strong> di bawah.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                          Langkah 2 (Fitur WA)
                        </span>
                        <p className="text-slate-200 font-semibold leading-snug">
                          Di chat WA Kurir, tekan ikon <strong>📎 (Lampiran / +)</strong> lalu pilih <strong>📍 Lokasi</strong>.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold text-[10px]">
                          Langkah 3 (Akurat)
                        </span>
                        <p className="text-slate-200 font-semibold leading-snug">
                          Tap <strong>"Kirim Lokasi Anda Saat Ini"</strong> atau <strong>"Berbagi Lokasi Terkini"</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Dengan GPS otomatis & Sherlock WhatsApp, titik rumah Anda langsung akurat masuk ke HP Kurir Soleman tanpa meleset!
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sesi Jam Jemput */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Sesi Jam Jemput Kurir Soleman:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'pagi', label: 'Pagi (09:00 - 12:00)' },
                      { id: 'siang', label: 'Siang (13:00 - 16:00)' },
                      { id: 'sore', label: 'Sore (16:00 - 19:00)' },
                    ].map(slot => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setPreferredTimeSlot(slot.id as any)}
                        className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all ${
                          preferredTimeSlot === slot.id
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Card 4: PILIHAN METODE PEMBAYARAN: QRIS DAN COD */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 font-bold text-xs flex items-center justify-center">4</span>
                <h3 className="text-sm font-bold text-white">Metode Pembayaran (QRIS & COD)</h3>
              </div>
              <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Pilih Sesuai Kenyamanan
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* OPSI 1: COD (Cash on Delivery) */}
              <div
                onClick={() => setPaymentMethod('cod')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-400/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-white">COD (Bayar Tunai)</span>
                  </div>
                  {paymentMethod === 'cod' && (
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Bayar tunai langsung ke <strong>Kurir Soleman</strong> saat sepatu diantar kembali ke rumah Anda. Tanpa DP!
                </p>
                <span className="inline-block mt-2 text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                  ✓ Tanpa DP di Muka
                </span>
              </div>

              {/* OPSI 2: QRIS Instan Resmi */}
              <div
                onClick={() => setPaymentMethod('qris')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'qris'
                    ? 'bg-sky-500/15 border-sky-500 ring-1 ring-sky-400/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-white">QRIS Instan Resmi</span>
                  </div>
                  {paymentMethod === 'qris' && (
                    <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Scan barcode QRIS memakai <strong>BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay</strong> tanpa biaya admin.
                </p>
                <span className="inline-block mt-2 text-[10px] text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded">
                  ✓ Semua Bank & E-Wallet
                </span>
              </div>

            </div>

            {/* QRIS preview card when selected */}
            {paymentMethod === 'qris' && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-sky-500/30 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white p-1 shrink-0 flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-slate-950" />
                  </div>
                  <div>
                    <span className="text-white font-bold block">QRIS: SOLEMAN SHOE REPAIR CIREBON</span>
                    <span className="text-[11px] text-slate-400">NMID: ID1024358920192 • Siap discan setelah booking</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrisModal(true)}
                  className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shrink-0"
                >
                  Lihat QRIS
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Right Summary Card (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-5">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-2xl">
            
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Ringkasan Biaya</span>
                <h3 className="text-lg font-extrabold text-white mt-0.5">
                  Total {pairsCount} Pasang
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                {areaType} Cirebon
              </span>
            </div>

            {/* Validation alert */}
            {validationError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{validationError}</span>
              </div>
            )}

            {/* List per item */}
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {shoeDetailsWithPrices.map((sh, idx) => {
                const sevMeta = DAMAGE_SEVERITIES.find(s => s.id === sh.severity) || DAMAGE_SEVERITIES[1];
                return (
                  <div key={sh.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-white">#{idx + 1} {sh.shoeBrand || 'Belum diisi'}</span>
                      <span className="text-amber-400 font-mono">Rp {sh.price.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">{sh.shoeType}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">{sh.material}</span>
                      <span className={`px-1.5 py-0.5 rounded border font-bold ${sevMeta.colorClass}`}>
                        Tingkat {sevMeta.shortLabel}
                      </span>
                      {sh.photoUrl && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                          📷 Foto Ada
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 pt-1 border-t border-slate-900">
                      {sh.selectedServices.map(s => {
                        const t = getServiceTierDetail(s, sh.severity);
                        return (
                          <div key={s.id} className="flex items-center justify-between text-[11px] text-slate-300">
                            <span className="truncate pr-2">• {s.name} ({t.badge})</span>
                            <span className="font-mono text-amber-300 shrink-0">{t.priceFormatted}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Ongkir & Calculation */}
            <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal Jasa ({pairsCount} psg)</span>
                <span className="font-mono text-white">Rp {totalServicesPrice.toLocaleString('id-ID')}</span>
              </div>

              <div className="flex justify-between items-center text-slate-400">
                <div>
                  <span>Ongkir Kurir Soleman</span>
                  <span className="text-[10px] text-slate-500 block">
                    {areaType === 'Kota' ? 'Khusus Seluruh Kota Cirebon' : `${areaType} Cirebon (${pairsCount} psg)`}
                  </span>
                </div>
                <span className={deliveryFee === 0 ? 'text-emerald-400 font-bold text-xs' : 'font-mono text-white'}>
                  {deliveryFee === 0 ? 'GRATIS ONGKIR' : `Rp ${deliveryFee.toLocaleString('id-ID')}`}
                </span>
              </div>

              {/* Informative Ongkir Note */}
              {areaType === 'Kabupaten' && pairsCount === 1 && (
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                  💡 <strong>Tips Hemat:</strong> Tambah 1 pasang lagi untuk menikmati <strong>GRATIS ONGKIR</strong> Kabupaten Cirebon!
                </div>
              )}

              <div className="flex justify-between text-slate-400 pt-1">
                <span>Metode Bayar</span>
                <span className="font-bold text-amber-300 uppercase">
                  {paymentMethod === 'cod' ? 'COD (Bayar Tunai)' : 'QRIS Instan'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline font-bold">
                <span className="text-sm text-slate-200">Total Pembayaran</span>
                <span className="text-2xl text-amber-400 font-mono font-black">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleCreateOrder(true)}
                className="w-full py-4 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <MessageSquare className="w-4 h-4 stroke-[2.4]" />
                <span>Pesan Sekarang & Share Loc ke WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => handleCreateOrder(false)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700/80 flex items-center justify-center gap-2 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Simpan Pesanan di Web Saja</span>
              </button>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 space-y-1">
              <p>✓ Lokasi jemput otomatis dikirim via Share Loc di WhatsApp Kurir Soleman.</p>
              <p>✓ Pembayaran {paymentMethod === 'cod' ? 'COD bayar tunai saat sepatu diantar kembali.' : 'QRIS instan resmi semua bank & e-wallet.'}</p>
              <p>✓ Garansi servis resmi 30 hingga 90 hari.</p>
            </div>

          </div>
        </div>

      </div>

      {/* SOLEMAN DANA & QRIS POPUP MODAL */}
      <SolemanQrModal
        isOpen={showQrisModal}
        onClose={() => setShowQrisModal(false)}
        nominal={grandTotal}
      />

    </section>
  );
};
