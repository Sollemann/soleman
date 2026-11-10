/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order, OrderStatus } from '../types';
import { WORKSHOP_INFO, STATUS_LABELS, getServiceTierDetail } from '../data/solcreftData';

/**
 * Membuat link WhatsApp untuk pemesanan servis & antar jemput baru
 */
export function buildNewOrderWhatsAppUrl(order: Order): string {
  let shoesDetailText = '';
  if (order.shoes && order.shoes.length > 0) {
    shoesDetailText = order.shoes.map((sh, idx) => {
      const sevLabel = sh.severity === 'kecil' ? '🟢 Tingkat Ringan (Sebagian)' : sh.severity === 'hard' ? '🔴 Tingkat Berat (Parah)' : '🟡 Tingkat Sedang (Standar)';
      const sList = sh.selectedServices.map(s => {
        const tier = getServiceTierDetail(s, sh.severity);
        return `\n     • *${s.name}* [${tier.label}] — ${tier.priceFormatted}\n       _(Kondisi: ${tier.damageDesc})_`;
      }).join('');
      return `👟 *SEPATU #${idx + 1}:* ${sh.shoeBrand}
  • Kategori: ${sh.shoeType}
  • Bahan Material: *${sh.material}*
  • Tingkat Kerusakan: *${sevLabel}*
  • Rincian Kerusakan & Harga:${sList}
  ${sh.damageNotes ? `• Keluhan Khusus: _"${sh.damageNotes}"_\n  ` : ''}• Subtotal Sepatu #${idx + 1}: *Rp ${sh.price.toLocaleString('id-ID')}*`;
    }).join('\n\n');
  } else {
    const orderSev = order.severity || 'normal';
    const sevLabel = orderSev === 'kecil' ? '🟢 Tingkat Ringan (Sebagian)' : orderSev === 'hard' ? '🔴 Tingkat Berat (Parah)' : '🟡 Tingkat Sedang (Standar)';
    const serviceList = order.selectedServices
      .map((s, idx) => {
        const tier = getServiceTierDetail(s, orderSev);
        return `   ${idx + 1}. *${s.name}* [${tier.label}] (${tier.priceFormatted})\n      _${tier.damageDesc}_`;
      })
      .join('\n');
    shoesDetailText = `👟 *DATA SEPATU:*
- Merk/Model: *${order.shoeBrand}*
- Kategori: ${order.shoeType}
${order.material ? `- Bahan Material: ${order.material}\n` : ''}- Tingkat Kerusakan: *${sevLabel}*
- Jumlah: ${order.pairsCount} Pasang
${order.customNotes ? `- Keluhan/Catatan: _"${order.customNotes}"_` : ''}

🛠️ *RINCIAN KERUSAKAN & LAYANAN DIPILIH:*
${serviceList}`;
  }

  const paymentText = order.paymentMethod === 'qris'
    ? `💳 *Metode Pembayaran:* QRIS Instan (BCA/Mandiri/BRI/BNI/GoPay/OVO/Dana)`
    : `💵 *Metode Pembayaran:* COD (Bayar Tunai ke Kurir Soleman saat Antar)`;

  const photoConfirmNeeded = order.selectedServices.some(s => s.requiresPhotoConfirmation);
  const photoConfirmText = photoConfirmNeeded || order.customerConfirmedMaterialPhoto
    ? `\n📸 *KONFIRMASI BAHAN SOL:* Mohon kirimkan foto sampel bahan & tapak ke WA saya sebelum mulai dikerjakan ya Kak, untuk memastikan kecocokan model & ukuran!`
    : '';

  const logisticsLabel = order.logisticsPartner === 'jnt_express'
    ? `📦 *Logistik Ekspedisi:* J&T Express / SiCepat (Luar Cirebon)${order.trackingNumber ? `\n🏷️ *No. Resi J&T:* ${order.trackingNumber}` : '\n*(No. resi akan saya kirim setelah paket dikirim ke workshop)*'}`
    : order.logisticsPartner === 'grab_maxim'
      ? `🛵 *Logistik Pengantaran:* Mitra GrabExpress / Maxim Delivery & Kurir Soleman (Radius Kabupaten)`
      : `🛵 *Logistik Pengantaran:* Kurir Internal Soleman (Area Dekat / Kota Cirebon)`;

  const patokanInfo = order.location.landmark
    ? `\n🚩 *Patokan Lokasi (Landmark):* *${order.location.landmark}*`
    : '';
  const gpsInfo = order.location.lat && order.location.lng
    ? `\n🛰️ *Titik Sherlock GPS Akurat:* ${order.location.lat.toFixed(6)}, ${order.location.lng.toFixed(6)} (±${order.location.accuracy || 10}m)`
    : '';
  const mapsLinkInfo = order.location.mapsUrl
    ? `\n🗺️ *Link Sherlock Google Maps:* ${order.location.mapsUrl}`
    : '';

  const locationText = order.pickupType === 'drop_off'
    ? `🏢 *Metode:* Drop-off Langsung ke Workshop Soleman (Jl. Sukalila Selatan Cirebon)`
    : `${logisticsLabel}
📍 *Wilayah / Kecamatan:* *${order.location.areaName}* (${order.distanceZone === 'luar_cirebon' ? 'Luar Cirebon' : order.location.areaType || 'Cirebon'})${patokanInfo}${gpsInfo}${mapsLinkInfo}
📍 *Sherlock WhatsApp:* *Titik Sherlock & Patokan sudah tersinkron otomatis ke Dashboard Kurir Soleman (+ saya siap kirim Share Location di chat WA ini!)* 🛵💨
⏰ *Jadwal Jemput:* Sesi ${order.preferredTimeSlot.toUpperCase()}`;

  const photoNote = (order.photos && order.photos.length > 0) || order.photoUrl
    ? `📸 *FOTO SEPATU RUSAK:* Sudah terunggah di sistem & saya siap kirim foto tambahan ke chat ini agar admin mudah cek kondisinya.${photoConfirmText}`
    : `📸 *FOTO SEPATU RUSAK:* Saya akan kirim foto fisiknya ke chat ini untuk dicek admin Soleman.${photoConfirmText}`;

  const ongkirText = order.deliveryFee === 0 
    ? (order.location.areaType === 'Kota' || order.distanceZone === 'dekat_kota' ? 'GRATIS (Khusus Seluruh Kota Cirebon)' : 'GRATIS (Promo Kab. Cirebon 2+ Pasang)')
    : `Rp ${order.deliveryFee.toLocaleString('id-ID')} (${order.distanceZone === 'luar_cirebon' ? 'Ekspedisi J&T Express' : 'Ongkir Jarak Jauh Grab/Maxim/Kurir'})`;

  const message = `*HALO SOLEMAN CIREBON!* 👟✨
Saya ingin konfirmasi booking perbaikan sepatu & layanan antar-jemput.

📋 *NO. ORDER:* #${order.id}
👤 *Nama Pelanggan:* ${order.customerName}
📱 *No. WhatsApp:* ${order.customerPhone}
🔢 *Total Jumlah:* *${order.pairsCount} Pasang*

${shoesDetailText}

${photoNote}

${locationText}

${paymentText}

💰 *RINCIAN BIAYA:*
- Subtotal Servis (${order.pairsCount} psg): Rp ${order.totalServicesPrice.toLocaleString('id-ID')}
- Ongkir Kurir Cirebon: *${ongkirText}*
- *TOTAL BIAYA:* *Rp ${order.totalAmount.toLocaleString('id-ID')}*

Pesanan sudah tercatat di sistem Soleman Cirebon. Mohon konfirmasi jadwal kurirnya ya Kak. Terima kasih! 🙏`;

  return `https://wa.me/${WORKSHOP_INFO.phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Membuat link notifikasi update status servis untuk dikirim ke WhatsApp pelanggan
 */
export function buildStatusNotificationWhatsAppUrl(
  order: Order, 
  targetStatus: OrderStatus,
  customDriverNote?: string
): string {
  const statusInfo = STATUS_LABELS[targetStatus];
  let cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith('62')) {
    cleanPhone = '62' + cleanPhone;
  }

  let statusDescription = '';
  switch (targetStatus) {
    case 'menunggu_jemput':
      statusDescription = `Permintaan antar-jemput Kakak telah dijadwalkan. Tim Kurir Soleman akan segera meluncur ke lokasi Anda di ${order.location.areaName}.`;
      break;
    case 'perjalanan_workshop':
      statusDescription = `🛵 *Kurir Meluncur!* Sepatu Kakak sedang dijemput oleh Kurir Soleman menuju Workshop (Jl. Sukalila Selatan Cirebon).`;
      break;
    case 'pengerjaan':
      statusDescription = `🛠️ *Sedang Dikerjakan Teknisi:* Sepatu Kakak sedang ditangani teknisi ahli dengan standar lem Polyurethane & jahitan sol terbaik Soleman.`;
      break;
    case 'quality_check':
      statusDescription = `🔍 *Quality Control:* Pengerjaan selesai! Tim Soleman sedang memastikan kerapian, daya tahan rekat, dan sterilisasi anti-jamur.`;
      break;
    case 'siap_antar':
      statusDescription = `🎉 *Sepatu Sudah Selesai & Siap Diantar!* Kurir Soleman siap mengantarkan kembali sepatu prima Kakak ke alamat tujuan.`;
      break;
    case 'selesai':
      statusDescription = `✅ *Servis Selesai:* Sepatu telah diserahterimakan dengan baik. Garansi resmi servis Soleman Cirebon aktif.`;
      break;
  }

  const paymentText = order.paymentMethod === 'cod'
    ? `💵 Metode: COD (${order.paymentStatus === 'cod_selesai' ? 'Sudah Lunas Diterima Kurir' : 'Bayar Tunai saat Kurir Tiba'})`
    : `💳 Metode: QRIS (${order.paymentStatus === 'lunas' ? 'Lunas' : 'Menunggu Pembayaran'})`;

  const message = `*UPDATE STATUS SERVIS SOLEMAN CIREBON* 👟✨

Halo Kak *${order.customerName}*!
Berikut kabar terbaru mengenai sepatu Anda:

📌 *No. Order:* #${order.id}
👟 *Sepatu:* ${order.shoeBrand} (${order.pairsCount} pasang)
⚡ *Status Terkini:* *${statusInfo.label.toUpperCase()}*

📢 *Keterangan Progres:*
${statusDescription}
${customDriverNote ? `\n📝 *Catatan Kurir/Teknisi:* "${customDriverNote}"` : ''}

📍 *Alamat:* ${order.location.fullAddress}
${order.location.mapsUrl ? `🗺️ *Titik Antar-Jemput:* ${order.location.mapsUrl}` : ''}
💰 *Total Biaya:* Rp ${order.totalAmount.toLocaleString('id-ID')}
${paymentText}

Jika ada pertanyaan, langsung balas pesan ini ya Kak.
*Soleman Cirebon* - _Perbaikan Sepatu Terlengkap & Presisi_`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Link WhatsApp untuk konsultasi foto kerusakan langsung ke CS
 */
export function buildConsultationWhatsAppUrl(prefillIssue?: string): string {
  const text = `Halo Soleman Cirebon! 👋
Saya ingin konsultasi kondisi sepatu saya yang rusak:
${prefillIssue ? `Jenis Kerusakan: *${prefillIssue}*\n` : ''}
Saya mau kirim foto sepatunya ke sini untuk estimasi biaya dan penjemputan Kurir Soleman di wilayah Cirebon.`;

  return `https://wa.me/${WORKSHOP_INFO.phone}?text=${encodeURIComponent(text)}`;
}

/**
 * Link WhatsApp untuk konfirmasi penerimaan pesanan oleh Admin ke pelanggan
 */
export function buildOrderAcceptedWhatsAppUrl(order: Order, courierName: string = 'Kurir Soleman'): string {
  let cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith('62')) {
    cleanPhone = '62' + cleanPhone;
  }

  const paymentText = order.paymentMethod === 'cod' ? 'COD (Bayar Tunai ke Kurir)' : 'QRIS Resmi Soleman';

  const message = `*PESANAN DITERIMA ADMIN SOLEMAN CIREBON* ✅👟

Halo Kak *${order.customerName}*!
Permintaan servis & antar-jemput sepatu Kakak telah *DITERIMA & DIKONFIRMASI* oleh Admin Workshop Soleman.

📋 *No. Order:* #${order.id}
👟 *Sepatu:* ${order.shoeBrand} (${order.pairsCount} pasang)
🛠️ *Layanan:* ${order.selectedServices.map(s => s.name).join(', ')}
🛵 *Kurir Ditugaskan:* ${courierName} (No. WA: 0881-4519-955)
⏰ *Sesi Jemput:* ${order.preferredTimeSlot.toUpperCase()}
💳 *Pembayaran:* ${paymentText}

📍 *Alamat Penjemputan:*
${order.location.fullAddress}
${order.location.landmark ? `🚩 Patokan: ${order.location.landmark}` : ''}
${order.location.mapsUrl ? `🗺️ Titik Maps: ${order.location.mapsUrl}` : ''}
💰 *Total Biaya:* Rp ${order.totalAmount.toLocaleString('id-ID')}

Mohon pastikan sepatu sudah siap saat Kurir Soleman tiba ya Kak. Terima kasih banyak telah memilih Soleman Cirebon! 🙏`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Link WhatsApp untuk Admin membagikan tugas penjemputan ke Kurir Soleman
 */
export function buildNotifyCourierWhatsAppUrl(order: Order, courierPhone: string = '08814519955', courierName: string = 'Kurir Soleman'): string {
  let cleanPhone = courierPhone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith('62')) {
    cleanPhone = '62' + cleanPhone;
  }

  const paymentText = order.paymentMethod === 'cod'
    ? `💵 COD (Tagih Tunai Rp ${order.totalAmount.toLocaleString('id-ID')} saat antar)`
    : `💳 QRIS (Non-Tunai)`;

  const message = `*SURAT TUGAS PENJEMPUTAN KURIR SOLEMAN* 🛵📋
Halo ${courierName}, ada tugas antar-jemput baru dari Admin Workshop:

📌 *No. Order:* #${order.id}
👤 *Pelanggan:* ${order.customerName}
📱 *No. HP Pelanggan:* ${order.customerPhone}
👟 *Sepatu:* ${order.shoeBrand} (${order.pairsCount} pasang)
🛠️ *Kerusakan:* ${order.selectedServices.map(s => s.name).join(', ')}
${order.customNotes ? `📝 *Catatan:* "${order.customNotes}"` : ''}

📍 *WILAYAH & ALAMAT:*
- Area: *${order.location.areaName}* (${order.location.areaType || 'Cirebon'})
- Alamat: ${order.location.fullAddress}
- Patokan: *${order.location.landmark || '-'}*
${order.location.lat && order.location.lng ? `- GPS: ${order.location.lat.toFixed(5)}, ${order.location.lng.toFixed(5)}` : ''}
${order.location.mapsUrl ? `🗺️ *LINK MAPS NAVIGASI:* ${order.location.mapsUrl}` : ''}

⏰ *Jadwal Jemput:* Sesi ${order.preferredTimeSlot.toUpperCase()}
💰 *Ongkir:* ${order.deliveryFee === 0 ? 'GRATIS' : `Rp ${order.deliveryFee.toLocaleString('id-ID')}`}
💳 *Pembayaran:* ${paymentText}

Harap segera meluncur dan konfirmasi jika sepatu sudah diambil. Semangat di jalan Kurir Soleman! 🚀`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Ekstrak koordinat lat/lng atau URL Google Maps dari teks/link Share Loc WhatsApp
 */
export function parseShareLocInput(input: string): { lat?: number; lng?: number; cleanUrl?: string } {
  const trimmed = input.trim();
  if (!trimmed) return {};

  // Cari pola koordinat lat,lng seperti -6.715234, 108.552341
  const coordRegex = /(-?\d{1,2}\.\d{3,10})\s*,\s*(-?\d{1,3}\.\d{3,10})/;
  const match = trimmed.match(coordRegex);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return {
        lat,
        lng,
        cleanUrl: `https://www.google.com/maps?q=${lat},${lng}`
      };
    }
  }

  // Cari URL http/https di dalam teks WA
  const urlMatch = trimmed.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) {
    return { cleanUrl: urlMatch[0] };
  }

  return {};
}

/**
 * Link navigasi Google Maps akurat untuk Kurir berdasarkan Sherlock GPS, Link WA, atau Patokan + Kecamatan
 */
export function buildGoogleMapsRouteUrl(
  lat?: number,
  lng?: number,
  addressQuery?: string,
  landmark?: string,
  mapsUrl?: string
): string {
  if (lat && lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  if (mapsUrl && (mapsUrl.includes('goo.gl') || mapsUrl.includes('maps.app') || (mapsUrl.includes('maps') && !mapsUrl.includes('-6.7248,108.5521')))) {
    const parsed = parseShareLocInput(mapsUrl);
    if (parsed.lat && parsed.lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${parsed.lat},${parsed.lng}`;
    }
    return mapsUrl;
  }
  const cleanAddress = (addressQuery || '').replace(/\(Share Loc WA\)|Share Loc via WhatsApp Kurir Soleman|Patokan:\s*/gi, '').trim();
  const cleanLandmark = (landmark || '').trim();
  const combinedParts = [cleanLandmark, cleanAddress, 'Cirebon'].filter(Boolean);
  if (combinedParts.length > 1) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(combinedParts.join(', '))}`;
  }
  return WORKSHOP_INFO.googleMapsUrl;
}
