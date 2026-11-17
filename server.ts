import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Enable JSON body parser with 25MB limit for image uploads
  app.use(express.json({ limit: '25mb' }));

  const apiKey = process.env.GEMINI_API_KEY || '';
  const ai = apiKey
    ? new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasGeminiKey: !!apiKey,
      model: 'gemini-4-hydrogen',
      service: 'Soleman Cirebon AI Repair Engine',
    });
  });

  // Resolve Google Maps shortlinks (maps.app.goo.gl / goo.gl/maps) into accurate lat/lng coordinates
  app.post('/api/resolve-maps-link', async (req: Request, res: Response) => {
    try {
      const rawUrl = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
      if (!rawUrl) {
        return res.status(400).json({ error: 'URL Maps tidak boleh kosong.' });
      }
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(rawUrl);
      } catch {
        return res.status(400).json({ error: 'Format URL tidak valid.' });
      }
      if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
        return res.status(400).json({ error: 'Protokol URL tidak diizinkan.' });
      }
      const allowedHosts = new Set([
        'maps.app.goo.gl',
        'goo.gl',
        'g.co',
        'maps.google.com',
        'google.com',
        'www.google.com',
        'maps.google.co.id',
        'www.google.co.id',
      ]);
      if (!allowedHosts.has(parsedUrl.hostname.toLowerCase())) {
        return res.status(400).json({ error: 'Domain bukan tautan Google Maps resmi.' });
      }

      const extractCoords = (text: string): { lat?: number; lng?: number } => {
        const patterns = [
          /@(-?\d+\.\d+),(-?\d+\.\d+)/,
          /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
          /[?&](?:q|ll|query|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/,
          /center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/i,
        ];
        for (const regex of patterns) {
          const m = text.match(regex);
          if (m) {
            const lat = Number(parseFloat(m[1]).toFixed(6));
            const lng = Number(parseFloat(m[2]).toFixed(6));
            if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
              return { lat, lng };
            }
          }
        }
        return {};
      };

      const directCheck = extractCoords(parsedUrl.toString());
      if (directCheck.lat && directCheck.lng) {
        return res.json({ resolvedUrl: parsedUrl.toString(), ...directCheck });
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5500);
      try {
        const resp = await fetch(parsedUrl.toString(), {
          method: 'GET',
          redirect: 'follow',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
          },
        });
        const finalUrl = resp.url || parsedUrl.toString();
        let coords = extractCoords(finalUrl);
        if (!coords.lat || !coords.lng) {
          const bodyText = (await resp.text()).slice(0, 120000);
          coords = extractCoords(bodyText);
        }
        return res.json({ resolvedUrl: finalUrl, ...coords });
      } finally {
        clearTimeout(timer);
      }
    } catch (err: any) {
      return res.status(200).json({ resolvedUrl: req.body?.url || '', error: err?.message || 'Gagal resolve shortlink' });
    }
  });

  // Multimodal Gemini Diagnosis Endpoint
  app.post('/api/gemini/diagnose', async (req: Request, res: Response) => {
    try {
      const { prompt, imageBase64, mimeType = 'image/jpeg', shoeType } = req.body;

      if (!prompt && !imageBase64) {
        return res.status(400).json({ error: 'Prompt atau foto sepatu diperlukan.' });
      }

      if (!ai) {
        // Fallback response if API key is not configured
        return res.json({
          summary: 'Analisis teknis workshop Soleman Cirebon.',
          detailedExplanation:
            'Sepatu Anda membutuhkan penanganan reparasi presisi standar workshop. Tim teknisi Soleman siap merekatkan kembali sol, mengganti tapak dengan compound kualitas tinggi, atau menjahit dengan teknik benang tanam tidak terlihat.',
          detectedDamages: ['Keausan sol / tapak', 'Kebutuhan rekondisi lem atau jahit'],
          technicalProcedures: [
            'Pembersihan sisa lem dan debu dengan grinding presisi.',
            'Aplikasi adhesive polyurethane thermo-setting suhu 80°C.',
            'Pengepresan dengan mesin hidrolik 4 bar.',
          ],
          recommendedServiceIds: ['jahit-benang-tersembunyi'],
          estimatedPrice: 'Rp 45.000',
          estimatedDuration: '1 - 2 Hari Kerja',
          warranty: '90 Hari Garansi Resmi',
          requiresPhotoConfirmation: false,
          photoConfirmationNote: 'Teknisi Soleman siap mengonfirmasi detail via WhatsApp.',
          proTip: 'Bersihkan sepatu secara berkala dan hindari penjemuran langsung di bawah terik matahari.',
          whatsappText: 'Halo Soleman Cirebon, saya ingin konsultasi reparasi sepatu.',
        });
      }

      const systemInstruction = `Anda adalah "Soleman AI 3.8 Master Vision Engine" — Master AI Teknisi Reparasi & Perbaikan Sepatu Soleman di Cirebon.
Tugas Anda adalah mendiagnosis kerusakan fisik sepatu secara sangat teliti, cerdas, tajam, dan akurat berdasarkan FOTO SEPATU atau keluhan teks pelanggan.

KATALOG LAYANAN RESMI SOLEMAN CIREBON & ID RESMI:
1. Jahit Sol Tanam (Benang Gak Kelihatan): "jahit-benang-tersembunyi" (Rp 45.000)
   - Sol mangap tapi ingin jahitan rapi rata tertanam dalam parit alur outsole karet 1.5mm tanpa benang tampak dari samping.
2. Jahit Sol Silang X: "jahit-sol-silang" (Rp 40.000) - Gaya streetwear / boots kokoh.
3. Jahit Sol Zig-Zag: "jahit-sol-zigzag" (Rp 40.000) - Elastis untuk futsal & running.
4. Jahit Sol Standar Keliling: "jahit-sol-standar" (Rp 35.000).
5. Ganti Tapak Sepatu Sekolah: "ganti-tapak-sekolah" (Rp 75.000) - Outsole hitam baru tebal anti-licin.
6. Ganti Tapak Sepatu Kantor / Pantofel: "ganti-tapak-kantor" (Rp 110.000) - Hak aus miring / sol pecah.
7. Ganti Tapak Safety / Proyek: "ganti-tapak-proyek" (Rp 140.000) - Heavy-duty lugged tahan minyak & paku.
8. Ganti Tapak Futsal: "ganti-tapak-futsal" (Rp 85.000) - Karet mentah gum rubber non-marking.
9. Ganti Tapak Sepatu Olahraga / Running: "ganti-tapak-olahraga" (Rp 95.000) - Bantalan EVA bouncy.
10. Ganti Tapak Trail (Extreme Grip): "ganti-tapak-trail" (Rp 200.000) - Compound cadas tahan abrasi tinggi (WAJIB konfirmasi foto bahan ke WA).
11. Ganti Tapak Sepatu Gunung / Hiking: "ganti-tapak-gunung" (Rp 150.000) - Model Vibram lugged gerigi pemecah lumpur Ciremai.
12. Ganti Tapak Sepatu Bola / Cleats: "ganti-tapak-bola" (Rp 95.000) - Pul stud FG/AG baru.
13. Ganti Tapak Sendal Biasa: "ganti-tapak-sendal-biasa" (Rp 45.000).
14. Ganti Tapak Sendal Kulit: "ganti-tapak-sendal-kulit" (Rp 65.000).
15. Reglue Total & Pres Manual: "reglue-total" (Rp 50.000) - Lem PU oven press tahan air.
16. Unyellowing & Midsole Detox: "unyellowing" (Rp 45.000) - Oksidasi kuning jadi putih cerah via chamber UV.
17. Recolor & Repaint: "recolor-repaint" (Rp 80.000) - Cat ulang baret / pudar anti retak.
18. Deep Clean & Sterilisasi Antibakteri: "deep-clean" (Rp 35.000) - Cuci luar dalam bebas jamur & bau.
19. Reparasi Busa & Kain Tumit: "heel-repair" (Rp 50.000) - Busa tumit robek anti lecet kaki.
20. Patching Upper Robek: "patch-upper" (Rp 45.000) - Tambal kanvas/kulit bolong rapi.
21. Tambal Hak / Tumit (Sepatu & Sandal): "tambal-hak-tumit" (Rp 35.000) - Tambal hak tumit miring/aus.
22. Tambal Bawah Setengah Sol / Half-Sole: "tambal-bawah-setengah" (Rp 45.000) - Tambal karet bawah setengah (depan/belakang) untuk sepatu & sandal.
23. Tambal Bawah Full / Semuanya: "tambal-bawah-semua" (Rp 70.000) - Tambal karet full seluruh permukaan bawah sepatu & sandal.

KLASIFIKASI TINGKAT KERUSAKAN (SEVERITY TIER):
- "kecil": Kerusakan ringan / sebagian di 1 titik (< 40% area), misal ujung sol mangap tipis, hak sedikit aus, atau kotor ringan.
- "normal": Kerusakan sedang standar (full keliling sepasang), sol lepas standar, tapak botak rata, atau cuci menyeluruh.
- "hard": Kerusakan berat / parah (sol lepas total berkerak lem G, midsole hancur hidrolisis, robek lebar > 5cm, atau sol ekstra tebal boots).

LOGISTIK SOLEMAN CIREBON:
- 100% Antar-Jemput Kurir ke rumah pelanggan.
- GRATIS ONGKIR untuk 5 Kecamatan Kota Cirebon (Kesambi, Kejaksan, Pekalipan, Lemahwungkuk, Harjamukti).
- Ongkir flat Rp 15.000 untuk Kabupaten Cirebon.

OUTPUT: Hasilkan respon HANYA dalam JSON valid (tanpa markdown):
{
  "summary": "Ringkasan diagnosa 1-2 kalimat tajam dan jelas",
  "detectedSeverity": "kecil" | "normal" | "hard",
  "severityReason": "Alasan penentuan tingkat keparahan",
  "detectedDamages": ["Daftar kerusakan spesifik pada foto/keluhan"],
  "recommendedServiceIds": ["id_layanan_resmi_soleman"],
  "recommendedServiceName": "Nama Layanan Utama",
  "shoeTypeEstimated": "Jenis Sepatu",
  "materialEstimated": "Bahan Sepatu",
  "technicalProcedures": ["Langkah 1 teknis", "Langkah 2 teknis", "Langkah 3 teknis"],
  "estimatedPrice": "Rp xx.xxx",
  "estimatedDuration": "x Hari Kerja",
  "warranty": "xx Hari Garansi Resmi",
  "requiresPhotoConfirmation": true / false,
  "photoConfirmationNote": "Penjelasan konfirmasi foto bahan ke WA jika berlaku",
  "proTip": "Tips teknis pencegahan kerusakan agar sepatu awet",
  "whatsappText": "Teks siap kirim ke WhatsApp Soleman"
}`;

      const contentsParts: any[] = [];

      if (imageBase64) {
        // Clean base64 string if it contains data URI prefix
        const cleanData = imageBase64.replace(/^data:[^;]+;base64,/, '');
        contentsParts.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: cleanData,
          },
        });
      }

      const promptText = `Permintaan Pelanggan:
- Deskripsi/Keluhan: ${prompt || 'Tolong periksa dan diagnosis foto sepatu saya ini'}
${shoeType ? `- Jenis Sepatu: ${shoeType}` : ''}
${imageBase64 ? '- Pelanggan mengunggah foto kondisi fisik sepatu. Tolong analisis gambar secara teliti.' : ''}

Mohon diagnosis dan berikan rekomendasi menu servis resmi Soleman dalam format JSON.`;

      contentsParts.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts: contentsParts },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '{}';
      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (err) {
        // Fallback cleanup if model wrapped in markdown
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(cleaned);
      }

      return res.json(parsedData);
    } catch (error: any) {
      console.error('Error in /api/gemini/diagnose:', error);
      return res.status(500).json({
        error: 'Gagal memproses diagnosis Gemini AI',
        details: error?.message || String(error),
      });
    }
  });

  // Mount Vite middlewares in development or serve static in production
  const distDir = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(distDir) && fs.existsSync(path.resolve(distDir, 'index.html'));
  const isDev = process.env.NODE_ENV !== 'production';

  if (!isDev && hasDist) {
    app.use(express.static(distDir));
    // In Express 5, wildcard routing with '*' directly is not allowed by path-to-regexp.
    // Using fallback middleware handles client-side routing cleanly for SPA.
    app.use((_req: Request, res: Response) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  } else {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
          allowedHosts: true,
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn('Vite middleware could not be loaded, using fallback:', viteErr);
      app.use((_req: Request, res: Response) => {
        if (hasDist) {
          res.sendFile(path.resolve(distDir, 'index.html'));
        } else {
          res.status(200).send('<!DOCTYPE html><html><head><title>Soleman Cirebon</title></head><body><h1>Soleman Cirebon</h1><p>Workshop Sol & Reparasi Sepatu Cirebon</p></body></html>');
        }
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Soleman Cirebon Server is listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
