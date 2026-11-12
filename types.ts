/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DamageCategory = 
  | 'all'
  | 'sol' 
  | 'jahit' 
  | 'warna' 
  | 'kebersihan' 
  | 'busa' 
  | 'kulit_upper';

export type ShoeType = 
  | 'Sneakers'
  | 'Sepatu Sekolah'
  | 'Sepatu Kantor / Pantofel'
  | 'Sepatu Proyek / Safety'
  | 'Sepatu Futsal'
  | 'Sepatu Olah Raga / Sport'
  | 'Sepatu Trail'
  | 'Sepatu Gunung / Hiking'
  | 'Sepatu Bola / Cleats'
  | 'Sendal Biasa'
  | 'Sendal Kulit'
  | 'Pantofel / Formal'
  | 'Boots / Safety'
  | 'Running / Sport'
  | 'Heels / Flat Shoes'
  | 'Canvas / Casual';

export type ShoeMaterial =
  | 'Canvas / Kain'
  | 'Kulit Asli (Leather)'
  | 'Suede / Nubuck'
  | 'Kulit Sintetis (Faux)'
  | 'Mesh / Rajut / Flyknit'
  | 'Karet / EVA / Foam';

export type DamageSeverity = 
  | 'kecil'    // Tingkat Ringan / Sebagian
  | 'normal'   // Tingkat Sedang / Standar
  | 'hard';    // Tingkat Berat / Parah / Full Rekonstruksi

export interface SeverityTierDetail {
  severity: DamageSeverity;
  label: string;         // Nama tingkat spesifik layanan (misal: "Ringan / Setengah Sol")
  badge: string;         // Badge pendek: "Ringan" | "Sedang" | "Berat"
  damageDesc: string;    // Kondisi kerusakan spesifik untuk tingkat ini
  price: number;         // Harga pas sesuai tingkat kerusakan (IDR)
  priceFormatted: string;// Format Rupiah (misal: "Rp 30.000")
  durationEst: string;   // Estimasi pengerjaan untuk tingkat ini
}

export interface ServiceItem {
  id: string;
  name: string;
  category: DamageCategory;
  damageTitle: string;
  symptoms: string[];
  solution: string;
  price: number;
  priceFormatted: string;
  durationEst: string;
  warrantyDays: number;
  popular?: boolean;
  isBestMenu?: boolean; // Menu Terbaik Soleman
  requiresPhotoConfirmation?: boolean; // Konfirmasi foto bahan ke WA pelanggan sebelum dikerjakan
  suitableShoes: ShoeType[];
  iconName: string;
  beforeAfterDescription: string;
  image: string;
  severityTiers: Record<DamageSeverity, SeverityTierDetail>;
}

export type OrderStatus = 
  | 'menunggu_jemput'
  | 'perjalanan_workshop'
  | 'pengerjaan'
  | 'quality_check'
  | 'siap_antar'
  | 'selesai';

export type PaymentMethod = 'qris' | 'cod';

export type PaymentStatus = 'menunggu_pembayaran' | 'lunas' | 'cod_pending' | 'cod_selesai';

export type DistanceZone = 'dekat_kota' | 'jauh_kabupaten' | 'luar_cirebon';

export type LogisticsPartner = 'kurir_soleman' | 'grab_maxim' | 'jnt_express';

export interface PickupLocation {
  areaName: string; // Kecamatan di Cirebon atau Kota Asal
  areaType?: 'Kota' | 'Kabupaten' | 'Luar_Cirebon'; // Wilayah
  distanceZone?: DistanceZone; // Berdasarkan jarak
  logisticsPartner?: LogisticsPartner; // Kurir Soleman, Grab/Maxim, atau J&T Express
  fullAddress?: string;
  landmark?: string;
  trackingNumber?: string; // No. Resi J&T Express jika dikirim dari luar Cirebon
  lat?: number;
  lng?: number;
  accuracy?: number;
  mapsUrl?: string;
  shareLocViaWhatsApp?: boolean; // Lokasi dishare via WhatsApp (opsional)
  isLiveShared?: boolean; // Lokasi akurat dibagikan langsung ke web kurir (tanpa WA)
  liveSharedAt?: string; // Waktu update lokasi terkini
}

export interface OrderTimelineStep {
  status: OrderStatus;
  label: string;
  timestamp: string;
  description: string;
}

export interface ShoeItemDetail {
  id: string;
  pairNumber: number;
  shoeBrand: string;
  shoeType: ShoeType;
  material: ShoeMaterial;
  severity: DamageSeverity;
  selectedServices: ServiceItem[];
  photoUrl?: string;
  damageNotes?: string;
  price: number;
}

export interface Order {
  id: string;
  customerId?: string; // ID Akun Pelanggan terdaftar
  customerName: string;
  customerPhone: string;
  shoeBrand: string;
  shoeType: ShoeType;
  material?: ShoeMaterial;
  severity?: DamageSeverity;
  pairsCount: number;
  selectedServices: ServiceItem[];
  shoes?: ShoeItemDetail[];
  customNotes?: string;
  photoUrl?: string;
  photos?: string[];
  pickupType: 'antar_jemput' | 'hanya_jemput' | 'drop_off';
  preferredTimeSlot: 'pagi' | 'siang' | 'sore';
  location: PickupLocation;
  logisticsPartner?: LogisticsPartner;
  distanceZone?: DistanceZone;
  trackingNumber?: string; // Resi J&T Express
  customerConfirmedMaterialPhoto?: boolean; // Konfirmasi foto bahan cocok
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalServicesPrice: number;
  deliveryFee: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  estimatedFinishedAt: string;
  technicianName: string;
  timeline: OrderTimelineStep[];
  isAcceptedByAdmin?: boolean;
  acceptedAt?: string;
  assignedCourier?: string;
  assignedCourierPhone?: string;
  internalAdminNotes?: string;
}

export interface CustomerUser {
  id: string;
  name: string;
  phone: string; // No WhatsApp terverifikasi
  email?: string;
  savedArea?: string;
  savedAddress?: string;
  createdAt: string;
  lastLogin: string;
  securityBadge: string;
  verified: boolean;
}

export interface AdminUser {
  email: string;
  name: string;
  role: string;
  loggedAt?: string;
}

export interface CourierUser {
  username: string;
  name: string;
  role: string;
  loggedAt?: string;
}

export interface CirebonArea {
  name: string;
  type: 'Kota' | 'Kabupaten';
  deliveryFee: number;
  estimatedPickupHours: string;
  lat?: number;
  lng?: number;
}
