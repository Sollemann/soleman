/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { DamageCatalog } from './components/DamageCatalog';
import { PickupOrderSection } from './components/PickupOrderSection';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginModal } from './components/AdminLoginModal';
import { CourierDashboard } from './components/CourierDashboard';
import { CourierLoginModal } from './components/CourierLoginModal';
import { TestimonialsAndFaq } from './components/TestimonialsAndFaq';
import { StaffAccessModal } from './components/StaffAccessModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { CustomerProfileDrawer } from './components/CustomerProfileDrawer';
import { WaConsultationBotModal } from './components/WaConsultationBotModal';
import { SolemanQrModal } from './components/SolemanQrModal';
import { SolemanLogo } from './components/SolemanLogo';
import { RepairCostCalculator } from './components/RepairCostCalculator';
import { Footer } from './components/Footer';
import { BatikMegaMendungUdangBg } from './components/BatikMegaMendungUdangBg';
import { WORKSHOP_INFO, SERVICES_CATALOG } from './data/solcreftData';
import { Order, OrderStatus, ServiceItem, ShoeType, DamageSeverity, AdminUser, CourierUser, CustomerUser, PaymentStatus, ServiceStockItem } from './types';
import { adminAuthService } from './services/adminAuthService';
import { courierAuthService } from './services/courierAuthService';
import { customerAuthService } from './services/customerAuthService';
import { MessageSquare, Truck, Bot, LogOut, Wrench, AlertTriangle, RefreshCw, Calculator, WifiOff, Bell, CheckCircle2, X } from 'lucide-react';
import { STATUS_LABELS } from './data/solcreftData';
import { soundFx } from './services/soundEffects';
import {
  subscribeToOrdersRealtime,
  saveOrderToFirestore,
  deleteOrderFromFirestore,
  purgeLegacyLocalStorage,
  FirestoreSyncState,
  ORDERS_COLLECTION,
} from './services/firebaseOrderService';
import { subscribeToStockStatus, saveServiceStockStatus } from './services/firebaseStockService';
import { FIRESTORE_DATABASE_ID } from './firebase';

export const App: React.FC = () => {
  // Orders State: 100% Real-Time dari Firebase Firestore (default) koleksi 'oderan' (Tanpa localStorage & Tanpa Data Contoh)
  const [orders, setOrders] = useState<Order[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, ServiceStockItem>>({});
  const [firestoreSyncState, setFirestoreSyncState] = useState<FirestoreSyncState>('connecting');
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

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

  // Navigation & Preselection State
  const [activeTab, setActiveTab] = useState<string>('layanan');

  // Preselected data for Pickup Section
  const [preselectedServices, setPreselectedServices] = useState<ServiceItem[]>([]);
  const [preselectedShoeType, setPreselectedShoeType] = useState<ShoeType>('Sneakers');
  const [preselectedSeverity, setPreselectedSeverity] = useState<DamageSeverity>('normal');
  const [preselectedPairsCount, setPreselectedPairsCount] = useState<number>(1);
  const [preselectedArea, setPreselectedArea] = useState<string>('');
  const [preselectedShoeSize, setPreselectedShoeSize] = useState<string>('40');

  // Pelacakan Notifikasi Real-Time Pelanggan (Saat Pesanan Diterima / Diproses / Dibatalkan)
  const [myOrderIds, setMyOrderIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('soleman_customer_my_orders_v1');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [customerNotifications, setCustomerNotifications] = useState<Array<{
    uid: string;
    orderId: string;
    title: string;
    message: string;
    status: OrderStatus;
    timestamp: string;
  }>>([]);
  const [browserNotifPermission, setBrowserNotifPermission] = useState<string>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  const normalizePhoneForMatch = (ph?: string) => (ph || '').replace(/[^0-9]/g, '').replace(/^62/, '0');

  const requestBrowserNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const res = await Notification.requestPermission();
      setBrowserNotifPermission(res);
      if (res === 'granted') {
        new Notification('Notifikasi Soleman Aktif 🔔', {
          body: 'Anda akan langsung mendapat info saat pesanan diterima atau diproses.',
        });
      }
    } catch {}
  };

  // Count pending unaccepted orders
  const pendingOrdersCount = orders.filter(o => !o.isAcceptedByAdmin).length;

  // Real-time Firebase Firestore synchronization pada koleksi 'oderan'
  useEffect(() => {
    purgeLegacyLocalStorage();
    let prevCount: number | null = null;
    const unsubscribeFirestore = subscribeToOrdersRealtime(
      (liveOrders) => {
        if (prevCount !== null && liveOrders.length > prevCount) {
          try {
            soundFx.playSuccess();
          } catch {}
        }
        prevCount = liveOrders.length;
        setOrders(liveOrders);
      },
      (syncState) => {
        setFirestoreSyncState(syncState);
      },
      (errMsg) => {
        setFirebaseError(errMsg);
      }
    );

    const unsubscribeStock = subscribeToStockStatus((nextStockMap) => {
      setStockMap(nextStockMap);
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
              void saveOrderToFirestore(mergedOrder, !existing, setFirebaseError);
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
      } else {
        const isKurirReq = params.get('portal') === 'kurir' || params.get('kurir') === '1' || window.location.hash === '#kurir';
        if (isKurirReq && !courierAuthService.getCurrentUser() && !adminAuthService.getCurrentUser()) {
          setIsCourierLoginModalOpen(true);
        }
      }
    } catch (err) {
      console.warn('Failed to parse kurir_order URL param', err);
    }

    return () => {
      unsubscribeFirestore();
      unsubscribeStock();
    };
  }, [retryTrigger]);

  // Daftar pesanan milik pelanggan saat ini (dari browser lokal maupun akun customer login)
  const myCustomerOrders = orders.filter((o) => {
    if (myOrderIds.includes(o.id)) return true;
    if (customerUser) {
      if (o.customerId && o.customerId === customerUser.id) return true;
      if (customerUser.phone && normalizePhoneForMatch(o.customerPhone) === normalizePhoneForMatch(customerUser.phone)) {
        return true;
      }
    }
    return false;
  });

  // Deteksi perubahan status pesanan pelanggan secara real-time & tampilkan notifikasi saat diterima / diproses
  useEffect(() => {
    if (adminUser || courierUser || myCustomerOrders.length === 0) return;

    let seenMap: Record<string, { status: OrderStatus; isAcceptedByAdmin: boolean }> = {};
    try {
      const raw = localStorage.getItem('soleman_customer_seen_states_v1');
      if (raw) seenMap = JSON.parse(raw) || {};
    } catch {}

    const newAlerts: Array<{
      uid: string;
      orderId: string;
      title: string;
      message: string;
      status: OrderStatus;
      timestamp: string;
    }> = [];

    let updatedMap = { ...seenMap };

    myCustomerOrders.forEach((order) => {
      const prev = seenMap[order.id];
      const currAccepted = Boolean(order.isAcceptedByAdmin);

      if (!prev) {
        // Pertama kali terlihat: catat status awal, dan jika sudah diterima/diproses sejak awal, tetap tampilkan
        updatedMap[order.id] = { status: order.status, isAcceptedByAdmin: currAccepted };
        if (currAccepted || order.status !== 'menunggu_jemput') {
          const title =
            order.status === 'dibatalkan'
              ? `❌ Pesanan #${order.id} Dibatalkan`
              : order.status === 'perjalanan_workshop'
              ? `🎉 Pesanan #${order.id} Diterima!`
              : order.status === 'pengerjaan'
              ? `🛠️ Pesanan #${order.id} Sedang Diproses!`
              : `📦 Update Pesanan #${order.id}: ${STATUS_LABELS[order.status].label}`;
          const message =
            order.status === 'dibatalkan'
              ? `Mohon maaf, pesanan ${order.shoeBrand} dibatalkan (${order.cancellationReason || 'Stok tapak/bahan sedang kosong'}).`
              : order.status === 'perjalanan_workshop'
              ? `Pesanan ${order.shoeBrand} Anda diterima! ${order.assignedCourier || 'Kurir Soleman'} siap menuju lokasi Anda.`
              : order.status === 'pengerjaan'
              ? `Sepatu ${order.shoeBrand} sedang dikerjakan teknisi ahli Workshop Soleman Cirebon.`
              : order.timeline[0]?.description || `Status terbaru: ${STATUS_LABELS[order.status].label}.`;
          newAlerts.push({
            uid: `${order.id}-${order.status}-${Date.now()}`,
            orderId: order.id,
            title,
            message,
            status: order.status,
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
          });
        }
        return;
      }

      const statusChanged = prev.status !== order.status;
      const justAccepted = !prev.isAcceptedByAdmin && currAccepted;

      if (statusChanged || justAccepted) {
        updatedMap[order.id] = { status: order.status, isAcceptedByAdmin: currAccepted };

        let title = `📦 Update Pesanan #${order.id}`;
        let message = `Status pesanan ${order.shoeBrand}: ${STATUS_LABELS[order.status]?.label || order.status}.`;

        if (order.status === 'dibatalkan') {
          title = `❌ Pesanan #${order.id} Dibatalkan`;
          message = `Mohon maaf, pesanan ${order.shoeBrand} dibatalkan (${order.cancellationReason || 'Stok tapak/bahan sedang kosong'}).`;
        } else if (justAccepted || order.status === 'perjalanan_workshop') {
          title = `🎉 Pesanan #${order.id} Diterima!`;
          message = `Admin/Kurir Soleman menerima pesanan ${order.shoeBrand} Anda. ${order.assignedCourier || 'Kurir Soleman'} siap meluncur ke lokasi!`;
        } else if (order.status === 'pengerjaan') {
          title = `🛠️ Pesanan #${order.id} Sedang Diproses!`;
          message = `Sepatu ${order.shoeBrand} sudah di workshop & sedang ditangani teknisi Soleman Cirebon.`;
        } else if (order.status === 'quality_check') {
          title = `🔍 Pesanan #${order.id} Quality Control`;
          message = `Sepatu ${order.shoeBrand} sedang diperiksa kerapian jahitan/lem & sterilisasi akhir.`;
        } else if (order.status === 'siap_antar') {
          title = `🚚 Sepatu #${order.id} Siap Diantar!`;
          message = `Reparasi ${order.shoeBrand} selesai! Kurir segera mengantar kembali ke lokasi Anda.`;
        } else if (order.status === 'selesai') {
          title = `✅ Pesanan #${order.id} Selesai!`;
          message = `Servis ${order.shoeBrand} telah diterima. Garansi resmi Soleman aktif.`;
        }

        newAlerts.push({
          uid: `${order.id}-${order.status}-${currAccepted}-${Date.now()}`,
          orderId: order.id,
          title,
          message,
          status: order.status,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        });
      }
    });

    try {
      localStorage.setItem('soleman_customer_seen_states_v1', JSON.stringify(updatedMap));
    } catch {}

    if (newAlerts.length > 0) {
      try {
        soundFx.playSuccess();
      } catch {}
      setCustomerNotifications((prev) => [...newAlerts, ...prev].slice(0, 5));

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        newAlerts.forEach((al) => {
          try {
            new Notification(al.title, { body: al.message });
          } catch {}
        });
      }
    }
  }, [orders, myOrderIds, customerUser, adminUser, courierUser]);

  // Handle adding new order & simpan langsung ke koleksi 'oderan' di Firebase Firestore (default)
  const handleOrderCreated = (newOrder: Order): Promise<boolean> => {
    const orderWithCustomer = customerUser && !newOrder.customerId
      ? { ...newOrder, customerId: customerUser.id }
      : newOrder;

    // Simpan ID order pelanggan di browser ini agar menerima notifikasi real-time saat diterima/diproses
    setMyOrderIds((prev) => {
      const next = prev.includes(orderWithCustomer.id) ? prev : [orderWithCustomer.id, ...prev].slice(0, 15);
      try {
        localStorage.setItem('soleman_customer_my_orders_v1', JSON.stringify(next));
        const rawSeen = localStorage.getItem('soleman_customer_seen_states_v1');
        const seen = rawSeen ? JSON.parse(rawSeen) : {};
        seen[orderWithCustomer.id] = {
          status: orderWithCustomer.status,
          isAcceptedByAdmin: Boolean(orderWithCustomer.isAcceptedByAdmin),
        };
        localStorage.setItem('soleman_customer_seen_states_v1', JSON.stringify(seen));
      } catch {}
      return next;
    });

    setOrders(prev => {
      const existingIdx = prev.findIndex(o => o.id.toUpperCase() === orderWithCustomer.id.toUpperCase());
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = orderWithCustomer;
        return updated;
      }
      return [orderWithCustomer, ...prev];
    });
    return saveOrderToFirestore(orderWithCustomer, true, setFirebaseError);
  };

  // Handle accepting order by Admin or Courier Soleman & sync immediately to Firebase Firestore (default)
  const handleAcceptOrder = (orderId: string, courierName: string = 'Kurir Soleman', courierPhone: string = '083152276387') => {
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
      void saveOrderToFirestore(updatedOrder, false, setFirebaseError);
      return updatedOrder;
    }));
  };

  // Handle updating full order details (e.g. physical shoe inspection by Courier Soleman) & sync to Firebase Firestore (default)
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
      void saveOrderToFirestore(updatedOrder, false, setFirebaseError);
      return updatedOrder;
    }));
  };

  // Handle deleting/removing order from portal & Firebase Firestore (default)
  const handleDeleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    void deleteOrderFromFirestore(orderId, setFirebaseError);
  };

  // Handle canceling order (especially due to Out-of-Stock / Stok Kosong) & sync immediately to Firestore
  const handleCancelOrder = (
    orderId: string,
    reason: string,
    isOutOfStock: boolean = true,
    cancelledBy: string = 'Admin/Kurir Soleman'
  ) => {
    const timeStr = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;

      const cancelTimeline = {
        status: 'dibatalkan' as OrderStatus,
        label: isOutOfStock ? 'Dibatalkan (Stok Tapak/Bahan Kosong)' : 'Pesanan Dibatalkan',
        timestamp: timeStr,
        description: `Pesanan dibatalkan oleh ${cancelledBy}: ${reason}`
      };

      const updatedOrder: Order = {
        ...order,
        status: 'dibatalkan',
        isAcceptedByAdmin: true,
        cancellationReason: reason,
        cancelledAt: timeStr + ' WIB',
        cancelledBy,
        isOutOfStockCancelled: isOutOfStock,
        customNotes: (order.customNotes ? order.customNotes + ' • ' : '') + `[Batal: ${reason}]`,
        timeline: [cancelTimeline, ...order.timeline]
      };
      void saveOrderToFirestore(updatedOrder, false, setFirebaseError);
      return updatedOrder;
    }));
  };

  // Handle toggling out-of-stock status per service/size in Firestore
  const handleToggleServiceStock = async (
    serviceId: string,
    isOutOfStock: boolean,
    emptySizes: string[] = [],
    note: string = ''
  ) => {
    setStockMap(prev => ({
      ...prev,
      [serviceId]: {
        serviceId,
        isOutOfStock,
        emptySizes,
        note,
        updatedAt: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
        updatedAtMs: Date.now(),
      },
    }));
    await saveServiceStockStatus(serviceId, isOutOfStock, emptySizes, note);
  };

  // Handle rejecting order by Admin & sync to Firebase Firestore (default)
  const handleRejectOrder = (orderId: string, reason: string) => {
    handleCancelOrder(orderId, reason, reason.toLowerCase().includes('stok'), adminUser?.name || 'Admin Soleman');
  };

  // Handle updating order status (jemput, workshop, siap antar, selesai) & sync immediately to Firebase Firestore (default)
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
      void saveOrderToFirestore(updatedOrder, false, setFirebaseError);
      return updatedOrder;
    }));
  };

  // Handle updating payment status (from Courier or Admin) & sync to Firebase Firestore (default)
  const handleUpdatePaymentStatus = (orderId: string, paymentStatus: PaymentStatus) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const updatedOrder: Order = {
        ...order,
        paymentStatus
      };
      void saveOrderToFirestore(updatedOrder, false, setFirebaseError);
      return updatedOrder;
    }));
  };

  // Handle updating customer Sherlock & Patokan location on Courier Dashboard & sync to Firebase Firestore (default)
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
      void saveOrderToFirestore(updatedOrder, false, setFirebaseError);
      return updatedOrder;
    }));
  };

  // Komponen Pesan Error Merah di Layar jika Koneksi / Penyimpanan ke Firebase Firestore Gagal
  const renderFirebaseErrorBanner = () => {
    if (!firebaseError) return null;
    return (
      <div className="bg-red-950/95 border-b-2 border-red-500 text-red-100 px-4 py-3.5 shadow-2xl z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-lg">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider bg-red-500 text-white px-2 py-0.5 rounded">
                  ERROR KONEKSI FIREBASE FIRESTORE
                </span>
                <span className="text-[11px] font-mono text-red-300">
                  Database: {FIRESTORE_DATABASE_ID} • Koleksi: {ORDERS_COLLECTION}
                </span>
              </div>
              <p className="text-xs font-bold text-white leading-relaxed">
                {firebaseError}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setFirebaseError(null);
                setRetryTrigger((prev) => prev + 1);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-black text-xs shadow-md cursor-pointer transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Hubungkan Ulang</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const getStatusShortLabel = (status: OrderStatus): string => {
    switch (status) {
      case 'menunggu_jemput': return 'Jadwal Penjemputan';
      case 'perjalanan_workshop': return 'Kurir Membawa ke Workshop';
      case 'pengerjaan': return 'Pengerjaan Servis';
      case 'quality_check': return 'Quality Control Lolos';
      case 'siap_antar': return 'Siap Diantar Kurir';
      case 'selesai': return 'Selesai & Diterima Pelanggan';
      case 'dibatalkan': return 'Pesanan Dibatalkan (Stok Kosong)';
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
      case 'dibatalkan':
        return `Pesanan dibatalkan (${order.cancellationReason || 'Stok tapak / bahan sedang kosong'}).`;
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
    shoeSize?: string;
  }) => {
    setPreselectedServices(data.services);
    setPreselectedShoeType(data.shoeType);
    if (data.severity) {
      setPreselectedSeverity(data.severity);
    }
    if (data.shoeSize) {
      setPreselectedShoeSize(data.shoeSize);
    }
    if (data.areaName) {
      setPreselectedArea(data.areaName);
    }
    setPreselectedPairsCount(data.pairsCount);
    handleScrollToSection('antar-jemput');
  };

  const handleSearchOrder = (_query: string) => {
    handleScrollToSection('antar-jemput');
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
      <div className="min-h-screen bg-gradient-to-b from-[#071024] via-[#0a1936] to-[#050c1d] text-slate-100 flex flex-col font-sans relative isolate">
        <BatikMegaMendungUdangBg subtle />
        {renderFirebaseErrorBanner()}
        {/* Dedicated Admin Portal Header Bar */}
        <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-amber-500/30 px-4 py-3 shadow-xl">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <SolemanLogo size="sm" />
              <div className="border-l border-slate-700 pl-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                    Portal Khusus Admin Workshop
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    firestoreSyncState === 'connected'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : firestoreSyncState === 'error'
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}>
                    {firestoreSyncState === 'connected'
                      ? `🟢 Firestore Realtime • ${ORDERS_COLLECTION} Live`
                      : firestoreSyncState === 'error'
                      ? '🔴 Koneksi Firestore Gagal'
                      : '⏳ Menghubungkan Firestore...'}
                  </span>
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
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 relative z-10">
          <AdminDashboard
            adminUser={adminUser}
            orders={orders}
            stockMap={stockMap}
            onToggleServiceStock={handleToggleServiceStock}
            onCancelOrder={handleCancelOrder}
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
      <div className="min-h-screen bg-gradient-to-b from-[#071024] via-[#0a1936] to-[#050c1d] text-slate-100 flex flex-col font-sans relative isolate">
        <BatikMegaMendungUdangBg subtle />
        {renderFirebaseErrorBanner()}
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
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    firestoreSyncState === 'connected'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : firestoreSyncState === 'error'
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}>
                    {firestoreSyncState === 'connected'
                      ? `🟢 Firestore Realtime • ${ORDERS_COLLECTION} Live`
                      : firestoreSyncState === 'error'
                      ? '🔴 Koneksi Firestore Gagal'
                      : '⏳ Menghubungkan Firestore...'}
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
                type="button"
                onClick={() => {
                  setRetryTrigger((prev) => prev + 1);
                  soundFx.playClick();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 font-bold text-xs transition-all cursor-pointer"
                title="Sinkronkan ulang seluruh pesanan dari server cloud secara online"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sinkronkan Online</span>
              </button>
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
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 relative z-10">
          <CourierDashboard
            courierUser={courierUser}
            orders={orders}
            stockMap={stockMap}
            onToggleServiceStock={handleToggleServiceStock}
            onCancelOrder={handleCancelOrder}
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
    <div className="min-h-screen bg-gradient-to-b from-[#071024] via-[#0a1936] to-[#050c1d] text-slate-100 flex flex-col font-sans relative isolate selection:bg-cyan-400 selection:text-slate-950">
      {/* Latar Belakang Tema Khas Cirebon: Batik Mega Mendung & Udang */}
      <BatikMegaMendungUdangBg />

      {renderFirebaseErrorBanner()}
      {/* Navbar Pelanggan: Bersih tanpa tombol Admin/Kurir (Akses staf hanya via klik logo Soleman) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleScrollToSection}
        onOpenBooking={() => handleScrollToSection('antar-jemput')}
        onOpenTracker={() => handleScrollToSection('antar-jemput')}
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
        <div className="relative z-10 bg-amber-600 text-slate-950 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-inner">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Mode Offline Aktif: Koneksi internet terputus. Data Workshop Sukalila Cirebon & kontak darurat tetap dapat diakses.</span>
        </div>
      )}

      {/* Main Content Sections Pelanggan */}
      <main className="flex-1 pb-24 lg:pb-0 relative z-10">
        {/* 1. Hero Section */}
        <Hero
          onOpenBooking={() => handleScrollToSection('antar-jemput')}
          onSearchOrder={handleSearchOrder}
          onExploreServices={() => handleScrollToSection('layanan')}
          onOpenDashboard={() => handleScrollToSection('antar-jemput')}
          onOpenWaBot={() => setIsWaBotModalOpen(true)}
          onOpenQrModal={() => setIsQrModalOpen(true)}
        />

        {/* 2. PILIH SESUAI KERUSAKAN SEPATU & SANDAL ANDA */}
        <DamageCatalog
          stockMap={stockMap}
          onSelectServiceForPickup={handleSelectServiceForPickup}
        />

        {/* 3. Instant Repair Cost & Time Calculator */}
        <RepairCostCalculator
          stockMap={stockMap}
          onApplyEstimate={handleApplyEstimate}
        />

        {/* 4. Booking Antar-Jemput + Bagi Lokasi Akurat ke Kurir + Status Live Pesanan Pelanggan */}
        <PickupOrderSection
          initialServices={preselectedServices}
          initialShoeType={preselectedShoeType}
          initialSeverity={preselectedSeverity}
          initialPairsCount={preselectedPairsCount}
          initialArea={preselectedArea}
          initialShoeSize={preselectedShoeSize}
          stockMap={stockMap}
          customerUser={customerUser}
          myActiveOrders={myCustomerOrders}
          browserNotifPermission={browserNotifPermission}
          onRequestBrowserNotif={requestBrowserNotificationPermission}
          onOrderCreated={handleOrderCreated}
          onOpenDashboard={() => handleScrollToSection('antar-jemput')}
        />

        {/* Real-Time Customer Notification Toast Stack (Ketika Pesanan Diterima atau Diproses) */}
        {customerNotifications.length > 0 && (
          <div className="fixed top-20 right-4 left-4 sm:left-auto sm:w-96 z-50 space-y-2.5 pointer-events-none">
            {customerNotifications.map((notif) => (
              <div
                key={notif.uid}
                className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all ${
                  notif.status === 'dibatalkan'
                    ? 'bg-rose-950/95 border-rose-400/60 text-white'
                    : 'bg-slate-900/95 border-emerald-400/60 text-white shadow-emerald-500/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      notif.status === 'dibatalkan'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {notif.status === 'dibatalkan' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">{notif.title}</span>
                        <span className="text-[10px] font-mono text-slate-400">{notif.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-200 leading-relaxed">{notif.message}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            handleScrollToSection('antar-jemput');
                            setCustomerNotifications((prev) => prev.filter((x) => x.uid !== notif.uid));
                          }}
                          className="text-[10px] font-bold text-cyan-300 hover:text-cyan-200 underline cursor-pointer"
                        >
                          Lihat Status Pesanan Saya
                        </button>
                        {browserNotifPermission === 'default' && (
                          <button
                            type="button"
                            onClick={requestBrowserNotificationPermission}
                            className="text-[10px] font-bold text-amber-300 hover:text-amber-200 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Bell className="w-3 h-3" /> Aktifkan Notif HP
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomerNotifications((prev) => prev.filter((x) => x.uid !== notif.uid))}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 5. Testimonials & FAQs + Write Review Form */}
        <TestimonialsAndFaq />
      </main>

      {/* Footer Pelanggan (Logo dengan trigger staff tersembunyi) */}
      <div className="relative z-10">
        <Footer 
          onNavigate={handleScrollToSection} 
          onStaffAccess={() => setIsStaffAccessModalOpen(true)} 
        />
      </div>

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
        onOpenDashboard={() => handleScrollToSection('antar-jemput')}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Courier Login Modal */}
      <CourierLoginModal
        isOpen={isCourierLoginModalOpen}
        onClose={() => setIsCourierLoginModalOpen(false)}
        onLoginSuccess={handleCourierLoginSuccess}
      />

      {/* Customer Auth Modal */}
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
          onTrackOrder={() => {
            setIsCustomerProfileOpen(false);
            handleScrollToSection('antar-jemput');
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
          title="Chat WhatsApp Soleman Cirebon: 0831-5227-6387"
        >
          <MessageSquare className="w-4 h-4 fill-slate-950" />
          <span>WA: 0831-5227-6387</span>
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
          onClick={() => handleScrollToSection('kalkulator')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-white"
        >
          <Calculator className="w-4 h-4 text-sky-400" />
          <span>Hitung</span>
        </button>

        <a
          href={`https://wa.me/${WORKSHOP_INFO.phone}?text=${encodeURIComponent('Halo Soleman Cirebon! Saya ingin konsultasi perbaikan sepatu/sandal.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-white"
        >
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span>WA CS</span>
        </a>
      </div>

    </div>
  );
};

export default App;
