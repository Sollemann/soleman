/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { DamageCatalog } from './components/DamageCatalog';
import { PickupOrderSection } from './components/PickupOrderSection';
import { DashboardView } from './components/DashboardView';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginModal } from './components/AdminLoginModal';
import { CourierDashboard } from './components/CourierDashboard';
import { CourierLoginModal } from './components/CourierLoginModal';
import { WorkshopLocationSection } from './components/WorkshopLocationSection';
import { TestimonialsAndFaq } from './components/TestimonialsAndFaq';
import { CustomerTrackerModal } from './components/CustomerTrackerModal';
import { StaffAccessModal } from './components/StaffAccessModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { CustomerProfileDrawer } from './components/CustomerProfileDrawer';
import { WaConsultationBotModal } from './components/WaConsultationBotModal';
import { SolemanQrModal } from './components/SolemanQrModal';
import { SolemanLogo } from './components/SolemanLogo';
import { ShoeRestorationShowcase } from './components/ShoeRestorationShowcase';
import { RepairCostCalculator } from './components/RepairCostCalculator';
import { Footer } from './components/Footer';
import { INITIAL_ORDERS, WORKSHOP_INFO, SERVICES_CATALOG } from './data/solcreftData';
import { Order, OrderStatus, ServiceItem, ShoeType, DamageSeverity, AdminUser, CourierUser, CustomerUser, PaymentStatus } from './types';
import { adminAuthService } from './services/adminAuthService';
import { courierAuthService } from './services/courierAuthService';
import { customerAuthService } from './services/customerAuthService';
import { MessageSquare, Phone, Truck, Lock, ShieldCheck, CheckCircle2, Bot, LogOut, Wrench, Search, MapPin, WifiOff } from 'lucide-react';
import { soundFx } from './services/soundEffects';
import {
  subscribeToOrdersRealtime,
  saveOrderToFirestore,
  deleteOrderFromFirestore,
} from './services/firebaseOrderService';

const STORAGE_KEY = 'solcreft_orders_cirebon_v1';

export const App: React.FC = () => {
  // Orders State (disinkronkan secara real-time dari Firebase Firestore ke semua HP Kurir, Admin & Pelanggan)
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load initial cached orders', e);
    }
    return INITIAL_ORDERS;
  });

  // Admin Authentication State
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    return adminAuthService.getCurrentUser();
  });
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  // Courier Authentication State
  const [courierUser, setCourierUser] = useState<CourierUser | null>(() => {
    return courierAuthService.getCurrentUser();
  });
  const [isCourierLoginModalOpen, setIsCourierLoginModalOpen] = useState(false);
  const [isStaffAccessModalOpen, setIsStaffAccessModalOpen] = useState(false);

  // Customer Authentication State (Sederhana & Berkeamanan Tinggi)
  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(() => {
    return customerAuthService.getCurrentUser();
  });
  const [isCustomerAuthModalOpen, setIsCustomerAuthModalOpen] = useState(false);
  const [isCustomerProfileOpen, setIsCustomerProfileOpen] = useState(false);

  // WhatsApp Damage Consultation Bot Modal State
  const [isWaBotModalOpen, setIsWaBotModalOpen] = useState(false);

  // Workshop DANA & QRIS QR Code Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Navigation & Modal State
  const [activeTab, setActiveTab] = useState<string>('layanan');
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackerQuery, setTrackerQuery] = useState('');

  // Preselected data for Pickup Section
  const [preselectedServices, setPreselectedServices] = useState<ServiceItem[]>([]);
  const [preselectedShoeType, setPreselectedShoeType] = useState<ShoeType>('Sneakers');
  const [preselectedSeverity, setPreselectedSeverity] = useState<DamageSeverity>('normal');
  const [preselectedPairsCount, setPreselectedPairsCount] = useState<number>(1);
  const [preselectedArea, setPreselectedArea] = useState<string>('');

  // Count pending unaccepted orders
  const pendingOrdersCount = orders.filter(o => !o.isAcceptedByAdmin).length;

  // Real-time Firebase Firestore synchronization (onSnapshot) across all devices + URL ?kurir_order= capture
  useEffect(() => {
    const unsubscribeFirestore = subscribeToOrdersRealtime((liveOrders) => {
      setOrders(liveOrders);
    });

    // Check URL parameter ?kurir_order= from WhatsApp link
    try {
      const params = new URLSearchParams(window.location.search);
      const kurirToken = params.get('kurir_order');
      if (kurirToken) {
        import('./services/whatsappHelper').then(({ decodeOrderFromCourierLink }) => {
          const decodedOrder = decodeOrderFromCourierLink(kurirToken, courierUser?.name || 'Kurir Soleman');
          if (decodedOrder) {
            setOrders((prev) => {
              const existing = prev.find((o) => o.id === decodedOrder.id);
              const mergedOrder = existing
                ? { ...decodedOrder, isAcceptedByAdmin: existing.isAcceptedByAdmin, status: existing.status }
                : decodedOrder;
              void saveOrderToFirestore(mergedOrder, !existing);
              if (existing) {
                return prev.map((o) => (o.id === decodedOrder.id ? mergedOrder : o));
              }
              return [mergedOrder, ...prev];
            });
            // Bersihkan parameter URL tanpa reload
            const cleanUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, document.title, cleanUrl);
            if (!courierAuthService.getCurrentUser() && !adminAuthService.getCurrentUser()) {
              setIsCourierLoginModalOpen(true);
            }
          }
        });
      }
    } catch (err) {
      console.warn('Failed to parse kurir_order URL param', err);
    }

    return () => {
      unsubscribeFirestore();
    };
  }, []);

  // Handle adding new order (or updating if ID already exists) & sync immediately to Firebase Firestore
  const handleOrderCreated = (newOrder: Order) => {
    const orderWithCustomer = customerUser && !newOrder.customerId
      ? { ...newOrder, customerId: customerUser.id }
      : newOrder;
    setOrders(prev => {
      const existingIdx = prev.findIndex(o => o.id.toUpperCase() === orderWithCustomer.id.toUpperCase());
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = orderWithCustomer;
        return updated;
      }
      return [orderWithCustomer, ...prev];
    });
    void saveOrderToFirestore(orderWithCustomer, true);
  };

  // Handle accepting order by Admin or Courier Soleman & sync immediately to Firebase Firestore
  const handleAcceptOrder = (orderId: string, courierName: string = 'Kurir Soleman', courierPhone: string = '08814519955') => {
    const timeStr = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;

      const acceptTimeline = {
        status: 'perjalanan_workshop' as OrderStatus,
        label: 'Pesanan Diterima & Kurir Meluncur',
        timestamp: timeStr,
        description: `Pesanan diterima di Portal Kurir. ${courierName} sedang meluncur ke titik penjemputan (${order.location.landmark || order.location.areaName}).`
      };

      const updatedOrder: Order = {
        ...order,
        isAcceptedByAdmin: true,
        acceptedAt: timeStr + ' WIB',
        assignedCourier: courierName,
        assignedCourierPhone: courierPhone,
        status: 'perjalanan_workshop' as OrderStatus,
        timeline: [acceptTimeline, ...order.timeline]
      };
      void saveOrderToFirestore(updatedOrder, false);
      return updatedOrder;
    }));
  };

  // Handle updating full order details (e.g. physical shoe inspection by Courier Soleman) & sync to Firebase Firestore
  const handleUpdateOrderDetails = (orderId: string, updatedFields: Partial<Order>, logNote?: string) => {
    const timeStr = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const nextTimeline = logNote
        ? [
            {
              status: updatedFields.status || order.status,
              label: 'Data Pesanan / Cek Fisik Diperbarui Kurir',
              timestamp: timeStr,
              description: logNote,
            },
            ...order.timeline,
          ]
        : order.timeline;
      const updatedOrder: Order = {
        ...order,
        ...updatedFields,
        timeline: nextTimeline,
      };
      void saveOrderToFirestore(updatedOrder, false);
      return updatedOrder;
    }));
  };

  // Handle deleting/removing order from portal & Firebase Firestore
  const handleDeleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    void deleteOrderFromFirestore(orderId);
  };

  // Handle rejecting order by Admin & sync to Firebase Firestore
  const handleRejectOrder = (orderId: string, reason: string) => {
    const timeStr = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;

      const rejectTimeline = {
        status: 'menunggu_jemput' as OrderStatus,
        label: 'Pesanan Dibatalkan',
        timestamp: timeStr,
        description: `Pesanan dibatalkan/ditolak admin: ${reason}`
      };

      const updatedOrder: Order = {
        ...order,
        isAcceptedByAdmin: false,
        customNotes: (order.customNotes ? order.customNotes + ' • ' : '') + `[Admin: ${reason}]`,
        timeline: [rejectTimeline, ...order.timeline]
      };
      void saveOrderToFirestore(updatedOrder, false);
      return updatedOrder;
    }));
  };

  // Handle updating order status (jemput, workshop, siap antar, selesai) & sync immediately to Firebase Firestore
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus, customNote?: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;

      const newTimelineItem = {
        status: newStatus,
        label: getStatusShortLabel(newStatus),
        timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
        description: customNote || getDefaultStatusDescription(newStatus, order)
      };

      const updatedOrder: Order = {
        ...order,
        isAcceptedByAdmin: true,
        status: newStatus,
        timeline: [newTimelineItem, ...order.timeline]
      };
      void saveOrderToFirestore(updatedOrder, false);
      return updatedOrder;
    }));
  };

  // Handle updating payment status (from Courier or Admin) & sync to Firebase Firestore
  const handleUpdatePaymentStatus = (orderId: string, paymentStatus: PaymentStatus) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const updatedOrder: Order = {
        ...order,
        paymentStatus
      };
      void saveOrderToFirestore(updatedOrder, false);
      return updatedOrder;
    }));
  };

  // Handle updating customer Sherlock & Patokan location on Courier Dashboard & sync to Firebase Firestore
  const handleUpdateOrderLocation = (
    orderId: string,
    locUpdate: {
      landmark?: string;
      fullAddress?: string;
      mapsUrl?: string;
      lat?: number;
      lng?: number;
      accuracy?: number;
    }
  ) => {
    const timeStr = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const updatedLandmark = locUpdate.landmark !== undefined ? locUpdate.landmark : order.location.landmark;
      const updatedFullAddress = locUpdate.fullAddress !== undefined ? locUpdate.fullAddress : order.location.fullAddress;
      const locTimeline = {
        status: order.status,
        label: 'Titik Sherlock & Patokan WA Diperbarui',
        timestamp: timeStr,
        description: `Lokasi Sherlock WA & Patokan disinkronkan akurat: ${updatedLandmark || updatedFullAddress}.`
      };
      const updatedOrder: Order = {
        ...order,
        location: {
          ...order.location,
          ...locUpdate,
          shareLocViaWhatsApp: true,
        },
        timeline: [locTimeline, ...order.timeline]
      };
      void saveOrderToFirestore(updatedOrder, false);
      return updatedOrder;
    }));
  };

  const getStatusShortLabel = (status: OrderStatus): string => {
    switch (status) {
      case 'menunggu_jemput': return 'Jadwal Penjemputan';
      case 'perjalanan_workshop': return 'Kurir Membawa ke Workshop';
      case 'pengerjaan': return 'Pengerjaan Servis';
      case 'quality_check': return 'Quality Control Lolos';
      case 'siap_antar': return 'Siap Diantar Kurir';
      case 'selesai': return 'Selesai & Diterima Pelanggan';
      default: return 'Update Progres';
    }
  };

  const getDefaultStatusDescription = (status: OrderStatus, order: Order): string => {
    switch (status) {
      case 'menunggu_jemput':
        return `Penjemputan dijadwalkan di ${order.location.areaName}.`;
      case 'perjalanan_workshop':
        return `Kurir Soleman sedang mengambil sepatu di ${order.location.fullAddress}.`;
      case 'pengerjaan':
        return `Sepatu ${order.shoeBrand} sedang ditangani teknisi dengan lem/jahit standar pabrik.`;
      case 'quality_check':
        return `Pemeriksaan kerapian dan sterilisasi anti-jamur selesai.`;
      case 'siap_antar':
        return `Sepatu selesai direparasi dan dijadwalkan pengantaran kembali oleh Kurir Soleman.`;
      case 'selesai':
        return `Sepatu telah diserahterimakan kepada ${order.customerName}. Garansi servis Soleman aktif.`;
      default:
        return 'Status diperbarui oleh sistem.';
    }
  };

  // Offline network status tracking
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Flow handlers
  const handleSelectServiceForPickup = (service: ServiceItem, severity: DamageSeverity = 'normal') => {
    setPreselectedServices([service]);
    setPreselectedSeverity(severity);
    handleScrollToSection('antar-jemput');
  };

  const handleApplyEstimate = (data: {
    services: ServiceItem[];
    shoeType: ShoeType;
    pairsCount: number;
    areaName: string;
    severity?: DamageSeverity;
  }) => {
    setPreselectedServices(data.services);
    setPreselectedShoeType(data.shoeType);
    if (data.severity) {
      setPreselectedSeverity(data.severity);
    }
    setPreselectedPairsCount(data.pairsCount);
    setPreselectedArea(data.areaName);
    handleScrollToSection('antar-jemput');
  };

  const handleSearchOrder = (query: string) => {
    setTrackerQuery(query);
    setIsTrackerOpen(true);
  };

  const handleScrollToSection = (sectionId: string) => {
    setActiveTab(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleAdminLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLogout = () => {
    adminAuthService.logout();
    setAdminUser(null);
  };

  const handleCourierLoginSuccess = (user: CourierUser) => {
    setCourierUser(user);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCourierLogout = () => {
    courierAuthService.logout();
    setCourierUser(null);
  };

  const handleCustomerLogout = () => {
    customerAuthService.logout();
    setCustomerUser(null);
    setIsCustomerProfileOpen(false);
  };

  // =========================================================================
  // 1. TAMPILAN KHUSUS ADMIN WORKSHOP (Fokus HANYA Fitur Admin, Tanpa Landing Pelanggan)
  // =========================================================================
  if (adminUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Dedicated Admin Portal Header Bar */}
        <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-amber-500/30 px-4 py-3 shadow-xl">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <SolemanLogo size="sm" />
              <div className="border-l border-slate-700 pl-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                    Portal Khusus Admin Workshop
                  </span>
                  <span className="text-xs font-bold text-white hidden sm:inline">Soleman Cirebon</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Login: <strong className="text-amber-400">{adminUser.name}</strong> ({adminUser.email})
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAdminLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 font-bold text-xs transition-all"
                title="Keluar dari portal Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar (Logout Admin)</span>
              </button>
            </div>
          </div>
        </header>

        {/* Exclusive Admin Dashboard Area */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
          <AdminDashboard
            adminUser={adminUser}
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onAcceptOrder={handleAcceptOrder}
            onRejectOrder={handleRejectOrder}
            onLogout={handleAdminLogout}
            onOpenCreateOrder={() => {}}
            onOrderCreated={handleOrderCreated}
          />
        </main>
      </div>
    );
  }

  // =========================================================================
  // 2. TAMPILAN KHUSUS KURIR SOLEMAN (Fokus HANYA Fitur Kurir, Tanpa Landing Pelanggan)
  // =========================================================================
  if (courierUser) {
    const incomingPickupCount = orders.filter(o => o.status === 'menunggu_jemput' || !o.isAcceptedByAdmin).length;
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Dedicated Courier Portal Header Bar */}
        <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-amber-500/30 px-4 py-3 shadow-xl">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <SolemanLogo size="sm" />
              <div className="border-l border-slate-700 pl-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full">
                    Portal Khusus Kurir Soleman
                  </span>
                  {incomingPickupCount > 0 && (
                    <span className="text-[10px] font-black bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full animate-pulse">
                      {incomingPickupCount} Pesanan Siap Jemput
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Petugas Kurir: <strong className="text-amber-400">{courierUser.name}</strong> • Armada Aktif Cirebon
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCourierLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 font-bold text-xs transition-all cursor-pointer"
                title="Keluar dari portal Kurir"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar Portal</span>
              </button>
            </div>
          </div>
        </header>

        {/* Exclusive Courier Dashboard Area */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
          <CourierDashboard
            courierUser={courierUser}
            orders={orders}
            onAcceptOrder={handleAcceptOrder}
            onOrderCreated={handleOrderCreated}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onUpdatePaymentStatus={handleUpdatePaymentStatus}
            onUpdateOrderLocation={handleUpdateOrderLocation}
            onUpdateOrderDetails={handleUpdateOrderDetails}
            onDeleteOrder={handleDeleteOrder}
            onLogout={handleCourierLogout}
          />
        </main>
      </div>
    );
  }

  // =========================================================================
  // 3. TAMPILAN WEBSITE PELANGGAN (Menu Admin & Kurir Disembunyikan di Logo)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Navbar Pelanggan: Bersih tanpa tombol Admin/Kurir (Akses staf hanya via klik logo Soleman) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleScrollToSection}
        onOpenBooking={() => handleScrollToSection('antar-jemput')}
        onOpenTracker={() => { setTrackerQuery(''); setIsTrackerOpen(true); }}
        ordersCount={orders.length}
        adminUser={null}
        courierUser={null}
        customerUser={customerUser}
        onAdminLogout={handleAdminLogout}
        onCourierLogout={handleCourierLogout}
        onOpenStaffPortal={() => setIsStaffAccessModalOpen(true)}
        onOpenCustomerAuth={() => setIsCustomerAuthModalOpen(true)}
        onOpenCustomerProfile={() => setIsCustomerProfileOpen(true)}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenWaBot={() => setIsWaBotModalOpen(true)}
        pendingOrdersCount={pendingOrdersCount}
      />

      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-amber-600 text-slate-950 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-inner">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Mode Offline Aktif: Koneksi internet terputus. Data Workshop Sukalila Cirebon & kontak darurat tetap dapat diakses.</span>
        </div>
      )}

      {/* Main Content Sections Pelanggan */}
      <main className="flex-1 pb-24 lg:pb-0">
        {/* 1. Hero Section dengan Quick Tracker, Bot WA & Tombol Pintas */}
        <Hero
          onOpenBooking={() => handleScrollToSection('antar-jemput')}
          onSearchOrder={handleSearchOrder}
          onExploreServices={() => handleScrollToSection('layanan')}
          onOpenDashboard={() => handleScrollToSection('dashboard')}
          onOpenWaBot={() => setIsWaBotModalOpen(true)}
          onOpenQrModal={() => setIsQrModalOpen(true)}
        />

        {/* 2. Interactive Before-After Transformation Gallery */}
        <ShoeRestorationShowcase
          onSelectService={handleSelectServiceForPickup}
        />

        {/* 3. Instant Repair Cost & Time Calculator */}
        <RepairCostCalculator
          onApplyEstimate={handleApplyEstimate}
        />

        {/* 4. Full Damage Catalog & Repair Services (Termasuk Filter "Menu Terbaik", Jahit Sol & Ganti Tapak) */}
        <DamageCatalog
          onSelectServiceForPickup={handleSelectServiceForPickup}
        />

        {/* 5. Booking Antar-Jemput: Pisah Trail Rp 200rb & Gunung, Konfirmasi Foto WA, Jarak Logistik (Soleman/Grab/Maxim/J&T) */}
        <PickupOrderSection
          initialServices={preselectedServices}
          initialShoeType={preselectedShoeType}
          initialSeverity={preselectedSeverity}
          initialPairsCount={preselectedPairsCount}
          initialArea={preselectedArea}
          customerUser={customerUser}
          onOrderCreated={handleOrderCreated}
          onOpenDashboard={() => handleScrollToSection('dashboard')}
        />

        {/* 6. DASHBOARD PELANGGAN: Hanya Pelacakan Kode Seri Sepatu yang Tepat (Privasi Terjamin, Tanpa Order Lain) */}
        <DashboardView
          orders={orders}
          onOpenBooking={() => handleScrollToSection('antar-jemput')}
        />

        {/* 7. Physical Workshop & Coverage Section Cirebon (Sukalila Selatan) */}
        <WorkshopLocationSection />

        {/* 8. Testimonials & FAQs + Write Review Form */}
        <TestimonialsAndFaq />
      </main>

      {/* Footer Pelanggan (Logo dengan trigger staff tersembunyi) */}
      <Footer 
        onNavigate={handleScrollToSection} 
        onStaffAccess={() => setIsStaffAccessModalOpen(true)} 
      />

      {/* Staff Secret Portal Modal (HANYA muncul jika logo Soleman diklik khusus) */}
      <StaffAccessModal
        isOpen={isStaffAccessModalOpen}
        onClose={() => setIsStaffAccessModalOpen(false)}
        onSelectAdminLogin={() => setIsAdminLoginModalOpen(true)}
        onSelectCourierLogin={() => setIsCourierLoginModalOpen(true)}
        adminUser={adminUser}
        courierUser={courierUser}
        onAdminLogout={handleAdminLogout}
        onCourierLogout={handleCourierLogout}
        onOpenDashboard={() => handleScrollToSection('dashboard')}
      />

      {/* Customer Tracking Modal */}
      <CustomerTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        orders={orders}
        initialQuery={trackerQuery}
      />

      {/* Admin Login Modal (password Hafidahcantik87) */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Courier Login Modal (password Herdazabuza) */}
      <CourierLoginModal
        isOpen={isCourierLoginModalOpen}
        onClose={() => setIsCourierLoginModalOpen(false)}
        onLoginSuccess={handleCourierLoginSuccess}
      />

      {/* Customer Auth Modal (Daftar & Login Sederhana Standar Keamanan Tinggi FB) */}
      <CustomerAuthModal
        isOpen={isCustomerAuthModalOpen}
        onClose={() => setIsCustomerAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCustomerUser(user);
          setIsCustomerAuthModalOpen(false);
        }}
      />

      {/* Customer Profile Drawer */}
      {customerUser && (
        <CustomerProfileDrawer
          isOpen={isCustomerProfileOpen}
          onClose={() => setIsCustomerProfileOpen(false)}
          customerUser={customerUser}
          orders={orders}
          onLogout={handleCustomerLogout}
          onTrackOrder={(orderId) => {
            setIsCustomerProfileOpen(false);
            setTrackerQuery(orderId);
            setIsTrackerOpen(true);
          }}
          onOpenBooking={() => {
            setIsCustomerProfileOpen(false);
            handleScrollToSection('antar-jemput');
          }}
        />
      )}

      {/* WhatsApp Damage Consultation Bot Modal (Konsultasi Kerusakan Sepatu Interaktif 24 Jam) */}
      <WaConsultationBotModal
        isOpen={isWaBotModalOpen}
        onClose={() => setIsWaBotModalOpen(false)}
        onBookService={(serviceId) => {
          const found = SERVICES_CATALOG.find(s => s.id === serviceId);
          if (found) {
            setPreselectedServices([found]);
            if (found.suitableShoes && found.suitableShoes.length > 0) {
              setPreselectedShoeType(found.suitableShoes[0]);
            }
          }
          setIsWaBotModalOpen(false);
          handleScrollToSection('antar-jemput');
        }}
      />

      {/* Workshop DANA & QRIS QR Code Modal */}
      <SolemanQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />

      {/* Floating Action Buttons: Bot WA AI + Chat WA Customer Support (Desktop) */}
      <div className="hidden sm:flex fixed bottom-6 right-6 z-40 flex-col items-end gap-2.5">
        {/* Floating Gemini AI Vision Konsultasi */}
        <button
          onClick={() => setIsWaBotModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-full shadow-2xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all border border-amber-300/40 cursor-pointer"
          title="Tanya Gemini AI & Unggah Foto Kerusakan Sepatu 24 Jam"
        >
          <Bot className="w-4 h-4 text-slate-950" />
          <span>📸 Gemini AI Vision: Foto & Cek Menu</span>
        </button>

        {/* Floating Direct WhatsApp CS Workshop */}
        <a
          href={`https://wa.me/${WORKSHOP_INFO.phone}?text=${encodeURIComponent('Halo Soleman Cirebon! Mau tanya servis sepatu dan antar-jemput Kurir Soleman.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-full shadow-2xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all border border-amber-300/40"
          title="Chat WhatsApp Soleman Cirebon: 0881-4519-955"
        >
          <MessageSquare className="w-4 h-4 fill-slate-950" />
          <span>WA: 0881-4519-955</span>
        </a>
      </div>

      {/* Mobile Native Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 px-3 py-2 flex items-center justify-around text-[10px] font-bold shadow-2xl">
        <button
          onClick={() => handleScrollToSection('layanan')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-white"
        >
          <Wrench className="w-4 h-4 text-amber-400" />
          <span>Menu</span>
        </button>

        <button
          onClick={() => setIsWaBotModalOpen(true)}
          className="flex flex-col items-center gap-1 text-amber-400 font-extrabold relative"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-0 right-1 animate-ping" />
          <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
            <Bot className="w-4 h-4" />
          </div>
          <span>Foto AI</span>
        </button>

        {/* Featured Center Booking Button */}
        <button
          onClick={() => handleScrollToSection('antar-jemput')}
          className="flex flex-col items-center gap-1 relative -top-3.5 group cursor-pointer"
          title="Pesan Antar-Jemput Sepatu"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 absolute -top-1 -right-1 animate-ping" />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/40 border-2 border-amber-300 group-hover:scale-110 active:scale-95 transition-all">
            <Truck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-amber-300 font-black text-[10px] tracking-tight bg-slate-900/90 px-2 py-0.5 rounded-full border border-amber-400/50 shadow-sm">
            Jemput
          </span>
        </button>

        <button
          onClick={() => { setTrackerQuery(''); setIsTrackerOpen(true); }}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-white"
        >
          <CheckCircle2 className="w-4 h-4 text-sky-400" />
          <span>Lacak</span>
        </button>

        <button
          onClick={() => handleScrollToSection('workshop')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-white"
        >
          <MapPin className="w-4 h-4 text-amber-400" />
          <span>Lokasi</span>
        </button>
      </div>

    </div>
  );
};

export default App;
