/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order, OrderStatus, DamageSeverity, ShoeType, ShoeItemDetail } from '../types';
import { WORKSHOP_INFO, STATUS_LABELS, SERVICES_CATALOG, getServiceTierDetail } from '../data/solcreftData';

interface CompactShoePayload {
  b: string; // shoeBrand
  t: ShoeType; // shoeType
  m: string; // material
  v: DamageSeverity; // severity
  s: string[]; // service IDs
  p: number; // price
  n?: string; // notes
}

interface CompactOrderPayload {
  i: string; // id
  n: string; // customerName
  p: string; // customerPhone
  c: number; // pairsCount
  sh: CompactShoePayload[]; // shoes
  pt: 'antar_jemput' | 'hanya_jemput' | 'drop_off'; // pickupType
  ts: 'pagi' | 'siang' | 'sore'; // preferredTimeSlot
  an: string; // areaName
  at: 'Kota' | 'Kabupaten' | 'Luar_Cirebon'; // areaType
  lm: string; // landmark
  la?: number; // lat
  ln?: number; // lng
  mu?: string; // mapsUrl
  pm: 'qris' | 'cod'; // paymentMethod
  df: number; // deliveryFee
  sp: number; // totalServicesPrice
  ta: number; // totalAmount
  cn?: string; // customNotes
}

/**
 * Encode data pesanan menjadi token ringkas URL-safe agar bisa diklik atau ditempel
 * langsung ke Portal Khusus Kurir Soleman dengan akurasi 100%
 */
export function encodeOrderForCourierLink(order: Order): string {
  try {
    const shoesPayload: CompactShoePayload[] =
      order.shoes && order.shoes.length > 0
        ? order.shoes.map((sh) => ({
            b: sh.shoeBrand,
            t: sh.shoeType,
            m: sh.material,
            v: sh.severity,
            s: sh.selectedServices.map((srv) => srv.id),
            p: sh.price,
            n: sh.damageNotes,
          }))
        : [
            {
              b: order.shoeBrand,
              t: order.shoeType,
              m: order.material || 'Canvas / Kain',
              v: order.severity || 'normal',
              s: order.selectedServices.map((srv) => srv.id),
              p: order.totalServicesPrice,
              n: order.customNotes,
            },
          ];

    const payload: CompactOrderPayload = {
      i: order.id,
      n: order.customerName,
      p: order.customerPhone,
      c: order.pairsCount,
      sh: shoesPayload,
      pt: order.pickupType,
      ts: order.preferredTimeSlot,
      an: order.location.areaName,
      at: order.location.areaType || 'Kota',
      lm: order.location.landmark || order.location.fullAddress,
      la: order.location.lat,
      ln: order.location.lng,
      mu: order.location.mapsUrl,
      pm: order.paymentMethod,
      df: order.deliveryFee,
      sp: order.totalServicesPrice,
      ta: order.totalAmount,
      cn: order.customNotes,
    };

    const jsonStr = JSON.stringify(payload);
    const base64 = btoa(encodeURIComponent(jsonStr));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return '';
  }
}

/**
 * Decode token pesanan dari link/teks WA menjadi objek Order yang utuh & akurat 100%
 */
export function decodeOrderFromCourierLink(token: string, courierName: string = 'Kurir Soleman'): Order | null {
  try {
    const cleanToken = token.trim().replace(/-/g, '+').replace(/_/g, '/');
    const padded = cleanToken + '==='.slice((cleanToken.length + 3) % 4);
    const jsonStr = decodeURIComponent(atob(padded));
    const data = JSON.parse(jsonStr) as CompactOrderPayload;
    if (!data || !data.i || !data.n) return null;

    const shoes: ShoeItemDetail[] = (data.sh || []).map((sh, idx) => {
      const matchedServices = (sh.s || [])
        .map((id) => SERVICES_CATALOG.find((s) => s.id === id))
        .filter((s): s is NonNullable<typeof s> => Boolean(s));
      const finalServices = matchedServices.length > 0 ? matchedServices : [SERVICES_CATALOG[0]];
      return {
        id: `pair-${idx + 1}`,
        pairNumber: idx + 1,
        shoeBrand: sh.b || `Sepatu #${idx + 1}`,
        shoeType: sh.t || 'Sneakers',
        material: (sh.m as any) || 'Canvas / Kain',
        severity: sh.v || 'normal',
        selectedServices: finalServices,
        price: sh.p || finalServices.reduce((acc, s) => acc + getServiceTierDetail(s, sh.v || 'normal').price, 0),
        damageNotes: sh.n,
      };
    });

    const allServices = shoes.flatMap((sh) => sh.selectedServices);
    const summaryBrand =
      shoes.length === 1
        ? shoes[0].shoeBrand
        : `${shoes[0].shoeBrand} (+${shoes.length - 1} psg lain)`;

    const timeStr = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });

    return {
      id: data.i,
      customerName: data.n,
      customerPhone: data.p,
      shoeBrand: summaryBrand,
      shoeType: shoes[0]?.shoeType || 'Sneakers',
      material: shoes[0]?.material || 'Canvas / Kain',
      severity: shoes[0]?.severity || 'normal',
      pairsCount: data.c || shoes.length || 1,
      selectedServices: allServices.length > 0 ? allServices : [SERVICES_CATALOG[0]],
      shoes,
      customNotes: data.cn,
      pickupType: data.pt || 'antar_jemput',
      preferredTimeSlot: data.ts || 'siang',
      distanceZone: data.at === 'Kota' ? 'dekat_kota' : data.at === 'Luar_Cirebon' ? 'luar_cirebon' : 'jauh_kabupaten',
      logisticsPartner: 'kurir_soleman',
      location: {
        areaName: data.an || 'Kesambi',
        areaType: data.at || 'Kota',
        shareLocViaWhatsApp: true,
        landmark: data.lm || `Titik Sherlock WA (${data.an || 'Cirebon'})`,
        fullAddress: data.lm ? `${data.lm} (Kec. ${data.an})` : `Kec. ${data.an} (Sherlock Asli WA)`,
        lat: data.la,
        lng: data.ln,
        accuracy: data.la ? 5 : undefined,
        mapsUrl: data.mu,
      },
      paymentMethod: data.pm || 'cod',
      paymentStatus: data.pm === 'cod' ? 'cod_pending' : 'menunggu_pembayaran',
      totalServicesPrice: data.sp || data.ta || 0,
      deliveryFee: data.df || 0,
      totalAmount: data.ta || 0,
      status: 'menunggu_jemput',
      isAcceptedByAdmin: false,
      assignedCourier: courierName,
      assignedCourierPhone: '08814519955',
      createdAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      estimatedFinishedAt: '1 - 3 Hari Kerja',
      technicianName: 'Master Teknisi Soleman',
      timeline: [
        {
          status: 'menunggu_jemput',
          label: 'Pesanan Masuk ke Portal Kurir Soleman',
          timestamp: timeStr,
          description: `Pesanan ${data.c || 1} pasang sepatu atas nama ${data.n} (${data.an}) siap diterima & dijemput oleh ${courierName}.`,
        },
      ],
    };
  } catch {
    return null;
  }
}

/**
 * Ekstrak otomatis teks pesan WhatsApp pelanggan (baik dengan token link maupun teks biasa)
 * menjadi objek Order yang akurat dengan seluruh sepatu, tingkat kerusakan, layanan, dan lokasi
 */
export function parseWhatsAppOrderTextToOrder(
  text: string,
  courierName: string = 'Kurir Soleman'
): { order: Order; isFromToken: boolean } | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // 1. Cek apakah ada token ?kurir_order= di dalam teks yang ditempel
  const tokenMatch = trimmed.match(/[?&]kurir_order=([A-Za-z0-9\-_]+)/);
  if (tokenMatch && tokenMatch[1]) {
    const decoded = decodeOrderFromCourierLink(tokenMatch[1], courierName);
    if (decoded) {
      // Cek juga apakah pelanggan menempelkan link Sherlock tambahan di teks yang sama
      const extraLoc = parseShareLocInput(trimmed.replace(tokenMatch[0], ''));
      if (extraLoc.lat || extraLoc.cleanUrl) {
        decoded.location.lat = extraLoc.lat ?? decoded.location.lat;
        decoded.location.lng = extraLoc.lng ?? decoded.location.lng;
        decoded.location.mapsUrl = extraLoc.cleanUrl ?? decoded.location.mapsUrl;
        decoded.location.accuracy = 5;
      }
      return { order: decoded, isFromToken: true };
    }
  }

  // 2. Ekstrak dari format teks chat WhatsApp standar
  const idMatch = trimmed.match(/#(SLC-\d{3,6})/i);
  const orderId = idMatch ? idMatch[1].toUpperCase() : `SLC-${Math.floor(1000 + Math.random() * 9000)}`;

  const nameMatch = trimmed.match(/Nama Pelanggan:\*?\s*([^\n\r*]+)/i);
  const customerName = nameMatch ? nameMatch[1].trim() : '';

  const phoneMatch = trimmed.match(/No\.\s*WhatsApp:\*?\s*([0-9+\-\s]{9,16})/i);
  const customerPhone = phoneMatch ? phoneMatch[1].replace(/[^0-9]/g, '').trim() : '';

  const pairsMatch = trimmed.match(/Total Jumlah:\*?\s*\*?(\d+)\s*Pasang/i);
  const pairsCountFromText = pairsMatch ? parseInt(pairsMatch[1], 10) : 1;

  const areaMatch = trimmed.match(/Wilayah\s*\/\s*(?:Kecamatan|Jarak):\*?\s*\*?([^(\n\r*]+)/i);
  const areaName = areaMatch ? areaMatch[1].trim() : 'Kesambi';

  const patokanMatch = trimmed.match(/Patokan(?:\s*Rumah\s*\/\s*Lokasi|\s*Lokasi|\s*Tambahan)?[^:]*:\*?\s*\*?([^\n\r*]+)/i);
  const landmark = patokanMatch ? patokanMatch[1].trim() : `Titik Sherlock WA (${areaName})`;

  const slotMatch = trimmed.match(/Jadwal Jemput:\*?\s*Sesi\s*(PAGI|SIANG|SORE)/i);
  const preferredTimeSlot = (slotMatch ? slotMatch[1].toLowerCase() : 'siang') as 'pagi' | 'siang' | 'sore';

  const paymentMethod: 'qris' | 'cod' = /Metode Pembayaran:[^\n]*QRIS/i.test(trimmed) ? 'qris' : 'cod';

  const subtotalMatch = trimmed.match(/Subtotal Servis[^:]*:\*?\s*Rp\s*([0-9.]+)/i);
  const parsedSubtotal = subtotalMatch ? parseInt(subtotalMatch[1].replace(/\./g, ''), 10) : 0;

  const ongkirMatch = trimmed.match(/Ongkir Kurir Cirebon:\*?\s*\*?Rp\s*([0-9.]+)/i);
  const parsedOngkir = ongkirMatch ? parseInt(ongkirMatch[1].replace(/\./g, ''), 10) : 0;

  const totalMatch = trimmed.match(/TOTAL BIAYA:\*?\s*\*?Rp\s*([0-9.]+)/i);
  const parsedTotal = totalMatch ? parseInt(totalMatch[1].replace(/\./g, ''), 10) : 0;

  // Ekstrak blok sepatu (#1, #2, dst.)
  const shoeBlocks = trimmed.split(/👟\s*\*?SEPATU\s*#\d+:\*?/i).slice(1);
  const parsedShoes: ShoeItemDetail[] = [];

  if (shoeBlocks.length > 0) {
    shoeBlocks.forEach((block, idx) => {
      const firstLine = block.split('\n')[0]?.trim() || `Sepatu #${idx + 1}`;
      const catMatch = block.match(/Kategori:\s*([^\n\r*]+)/i);
      const matMatch = block.match(/Bahan Material:\s*\*?([^\n\r*]+)/i);
      const subShoeMatch = block.match(/Subtotal Sepatu\s*#\d+:\s*\*?Rp\s*([0-9.]+)/i);

      let sev: DamageSeverity = 'normal';
      if (/Tingkat Berat|Berat\s*\(Parah\)|Berat\s*\/\s*Parah/i.test(block)) sev = 'hard';
      else if (/Tingkat Ringan|Ringan\s*\(Sebagian\)/i.test(block)) sev = 'kecil';

      const matchedServices = SERVICES_CATALOG.filter((s) =>
        block.toLowerCase().includes(s.name.toLowerCase())
      );
      const finalServices = matchedServices.length > 0 ? matchedServices : [SERVICES_CATALOG[0]];
      const calcPrice = subShoeMatch
        ? parseInt(subShoeMatch[1].replace(/\./g, ''), 10)
        : finalServices.reduce((acc, s) => acc + getServiceTierDetail(s, sev).price, 0);

      parsedShoes.push({
        id: `pair-${idx + 1}`,
        pairNumber: idx + 1,
        shoeBrand: firstLine.replace(/\*/g, '').trim(),
        shoeType: (catMatch ? catMatch[1].trim() : 'Sneakers') as ShoeType,
        material: (matMatch ? matMatch[1].trim() : 'Canvas / Kain') as any,
        severity: sev,
        selectedServices: finalServices,
        price: calcPrice,
      });
    });
  } else {
    // Fallback 1 sepatu
    const brandMatch = trimmed.match(/Merk\/Model:\*?\s*([^\n\r*]+)/i);
    let sev: DamageSeverity = 'normal';
    if (/Tingkat Berat|Berat\s*\(Parah\)|Berat\s*\/\s*Parah/i.test(trimmed)) sev = 'hard';
    else if (/Tingkat Ringan|Ringan\s*\(Sebagian\)/i.test(trimmed)) sev = 'kecil';

    const matchedServices = SERVICES_CATALOG.filter((s) =>
      trimmed.toLowerCase().includes(s.name.toLowerCase())
    );
    const finalServices = matchedServices.length > 0 ? matchedServices : [SERVICES_CATALOG[0]];
    const calcPrice =
      parsedSubtotal ||
      parsedTotal ||
      finalServices.reduce((acc, s) => acc + getServiceTierDetail(s, sev).price, 0);

    parsedShoes.push({
      id: 'pair-1',
      pairNumber: 1,
      shoeBrand: brandMatch ? brandMatch[1].trim() : 'Sepatu Pelanggan',
      shoeType: 'Sneakers',
      material: 'Canvas / Kain',
      severity: sev,
      selectedServices: finalServices,
      price: calcPrice,
    });
  }

  // Jika tidak ada satupun indikator order WA dan tidak ada nama/sepatu, return null
  if (!nameMatch && !idMatch && shoeBlocks.length === 0) {
    return null;
  }

  const allServices = parsedShoes.flatMap((sh) => sh.selectedServices);
  const totalServicesPrice =
    parsedSubtotal || parsedShoes.reduce((acc, sh) => acc + sh.price, 0);
  const totalAmount = parsedTotal || totalServicesPrice + parsedOngkir;
  const isKota = ['kesambi', 'kejaksan', 'pekalipan', 'lemahwungkuk', 'harjamukti'].some((k) =>
    areaName.toLowerCase().includes(k)
  );
  const parsedLoc = parseShareLocInput(trimmed);
  const timeStr = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });

  const order: Order = {
    id: orderId,
    customerName: customerName || 'Pelanggan WA Soleman',
    customerPhone: customerPhone || '08814519955',
    shoeBrand:
      parsedShoes.length === 1
        ? parsedShoes[0].shoeBrand
        : `${parsedShoes[0].shoeBrand} (+${parsedShoes.length - 1} psg lain)`,
    shoeType: parsedShoes[0].shoeType,
    material: parsedShoes[0].material,
    severity: parsedShoes[0].severity,
    pairsCount: Math.max(pairsCountFromText, parsedShoes.length),
    selectedServices: allServices,
    shoes: parsedShoes,
    pickupType: 'antar_jemput',
    preferredTimeSlot,
    distanceZone: isKota ? 'dekat_kota' : 'jauh_kabupaten',
    logisticsPartner: 'kurir_soleman',
    location: {
      areaName,
      areaType: isKota ? 'Kota' : 'Kabupaten',
      shareLocViaWhatsApp: true,
      landmark,
      fullAddress: `${landmark} (Kec. ${areaName})`,
      lat: parsedLoc.lat,
      lng: parsedLoc.lng,
      accuracy: parsedLoc.lat ? 5 : undefined,
      mapsUrl: parsedLoc.cleanUrl,
    },
    paymentMethod,
    paymentStatus: paymentMethod === 'cod' ? 'cod_pending' : 'menunggu_pembayaran',
    totalServicesPrice,
    deliveryFee: parsedOngkir,
    totalAmount,
    status: 'menunggu_jemput',
    isAcceptedByAdmin: false,
    assignedCourier: courierName,
    assignedCourierPhone: '08814519955',
    createdAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
    estimatedFinishedAt: '1 - 3 Hari Kerja',
    technicianName: 'Master Teknisi Soleman',
    timeline: [
      {
        status: 'menunggu_jemput',
        label: 'Diekstrak Akurat dari Chat WA Pelanggan',
        timestamp: timeStr,
        description: `Pesanan #${orderId} (${customerName || 'Pelanggan'}) beserta patokan "${landmark}" berhasil disinkronkan ke Portal Kurir Soleman.`,
      },
    ],
  };

  return { order, isFromToken: false };
}

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
    ? `\n🚩 *Patokan Rumah / Lokasi:* *${order.location.landmark}*`
    : '';

  const locationText = order.pickupType === 'drop_off'
    ? `🏢 *Metode:* Drop-off Langsung ke Workshop Soleman (Jl. Sukalila Selatan Cirebon)`
    : `${logisticsLabel}
📍 *Wilayah / Kecamatan:* *${order.location.areaName}* (${order.distanceZone === 'luar_cirebon' ? 'Luar Cirebon' : order.location.areaType || 'Cirebon'})${patokanInfo}
⏰ *Jadwal Jemput:* Sesi ${order.preferredTimeSlot.toUpperCase()}

📌 *SHERLOCK ASLI FITUR WHATSAPP KE KURIR:*
*(Setelah pesan ini terkirim, saya langsung kirimkan SHERLOCK ASLI lewat fitur 📍 Lokasi bawaan WhatsApp: klik ikon 📎 Lampiran ➔ pilih 📍 Lokasi ➔ "Kirim Lokasi Anda Saat Ini / Berbagi Lokasi Terkini" tepat di bawah chat ini agar lokasi Kurir Soleman 100% akurat!)* 👇📍🛵`;

  const photoNote = (order.photos && order.photos.length > 0) || order.photoUrl
    ? `📸 *FOTO SEPATU RUSAK:* Sudah terunggah di sistem & saya siap kirim foto tambahan ke chat ini agar admin mudah cek kondisinya.${photoConfirmText}`
    : `📸 *FOTO SEPATU RUSAK:* Saya akan kirim foto fisiknya ke chat ini untuk dicek admin Soleman.${photoConfirmText}`;

  const ongkirText = order.deliveryFee === 0 
    ? (order.location.areaType === 'Kota' || order.distanceZone === 'dekat_kota' ? 'GRATIS (Khusus Seluruh Kota Cirebon)' : 'GRATIS (Promo Kab. Cirebon 2+ Pasang)')
    : `Rp ${order.deliveryFee.toLocaleString('id-ID')} (${order.distanceZone === 'luar_cirebon' ? 'Ekspedisi J&T Express' : 'Ongkir Jarak Jauh Grab/Maxim/Kurir'})`;

  const courierToken = encodeOrderForCourierLink(order);
  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://soleman.vercel.app';
  const courierDirectLinkText = courierToken
    ? `\n\n⚡ *LINK TERIMA CEPAT PORTAL KURIR SOLEMAN:*\n${originUrl}/?kurir_order=${courierToken}`
    : '';

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

Pesanan sudah tercatat di sistem Soleman Cirebon. Mohon konfirmasi jadwal kurirnya ya Kak. Terima kasih! 🙏${courierDirectLinkText}`;

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

  const courierToken = encodeOrderForCourierLink(order);
  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://soleman.vercel.app';
  const directLink = courierToken ? `\n\n⚡ *KLIK BUKA DI PORTAL KURIR:*\n${originUrl}/?kurir_order=${courierToken}` : '';

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

Harap segera meluncur dan konfirmasi jika sepatu sudah diambil. Semangat di jalan Kurir Soleman! 🚀${directLink}`;

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

  // Cari URL http/https di dalam teks WA (abaikan link aplikasi sendiri ?kurir_order=)
  const urlMatches = trimmed.match(/https?:\/\/[^\s]+/gi) || [];
  for (const url of urlMatches) {
    if (!url.includes('kurir_order=')) {
      return { cleanUrl: url };
    }
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

/**
 * Link WhatsApp bagi Kurir untuk meminta / membuka Sherlock Asli (Fitur Lokasi Bawaan WA) dari Pelanggan
 */
export function buildRequestRealWaSherlockUrl(order: Order): string {
  let cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith('62')) {
    cleanPhone = '62' + cleanPhone;
  }

  const message = `Halo Kak *${order.customerName}*! 👋🛵
Saya *Kurir Soleman Cirebon* yang bertugas untuk *Order #${order.id}* (${order.shoeBrand}).

🚩 *Patokan di Dashboard Kurir:* "${order.location.landmark || order.location.fullAddress}" (${order.location.areaName})

Agar lokasi penjemputan saya *100% akurat sampai depan rumah*, mohon kirimkan *SHERLOCK ASLI dari fitur Lokasi bawaan WhatsApp* di chat ini ya Kak:
1️⃣ Tekan ikon *📎 (Lampiran / Klip Kertas)* atau tanda *(+)* di pojok bawah chat WA ini
2️⃣ Pilih menu *📍 Lokasi (Location)*
3️⃣ Klik *"Kirim Lokasi Anda Saat Ini"* atau *"Berbagi Lokasi Terkini"*

Begitu titik Sherlock WA asli Kakak masuk di chat ini, saya langsung meluncur ke titik tersebut. Terima kasih Kak! 🙏👟`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
