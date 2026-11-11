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
      model: 'gemini-3.8-flash',
      service: 'Soleman Cirebon AI Repair Engine',
    });
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

      const systemInstruction = `Anda adalah "Soleman AI 3.8 Engine" — Master AI Teknisi Reparasi & Perbaikan Sepatu Workshop Soleman di Cirebon.
Tugas Anda adalah menganalisis kerusakan sepatu pelanggan secara profesional, sangat teliti, dan ramah, baik dari FOTO SEPATU yang diunggah maupun keluhan teks.

PANDUAN DIAGNOSIS DAN KATALOG LAYANAN RESMI SOLEMAN:
1. SEPATU TRAIL (Extreme Grip):
   - ID Layanan: "ganti-tapak-trail"
   - Harga: Rp 200.000 (Pas)
   - Karakteristik: Compound karet trail keras (Hardness 70A) tahan cadas/batu tajam.
   - WAJIB: Teknisi Soleman memotret sampel bahan tapak ke WhatsApp pelanggan terlebih dahulu sebelum dipasang!

2. SEPATU GUNUNG / HIKING:
   - ID Layanan: "ganti-tapak-gunung"
   - Harga: Rp 150.000
   - Karakteristik: Model Vibram lugged gerigi pemecah lumpur & batuan terjal Gunung Ciremai. Konfirmasi foto bahan ke WA pelanggan.

3. JAHIT SOL BENANG GAK KELIHATAN (HIDDEN / TANAM):
   - ID Layanan: "jahit-benang-tersembunyi"
   - Harga: Rp 45.000 (Menu Paling Populer / Favorit)
   - Karakteristik: Dibuat parit alur khusus sedalam 1.5mm di keliling sol, benang wax nilon tertanam rata di dalam sehingga 100% TIDAK KELIHATAN dari samping dan terlindung dari gesekan aspal.

4. JAHIT SOL SILANG (CROSS STITCH X-PATTERN):
   - ID Layanan: "jahit-sol-silang"
   - Harga: Rp 40.000
   - Untuk gaya sporty, streetwear, atau sepatu kerja bertenaga.

5. JAHIT SOL ZIG-ZAG:
   - ID Layanan: "jahit-sol-zigzag"
   - Harga: Rp 40.000
   - Fleksibilitas tinggi mengikuti kelenturan telapak kaki saat sprint futsal / lari.

6. GANTI TAPAK FUTSAL (GUM RUBBER NON-MARKING):
   - ID Layanan: "ganti-tapak-futsal"
   - Harga: Rp 85.000
   - Tapak karet mentah berdaya gigit tinggi, tidak meninggalkan bekas noda di lantai.

7. GANTI TAPAK SEPATU SEKOLAH:
   - ID Layanan: "ganti-tapak-sekolah"
   - Harga: Rp 75.000
   - Untuk sepatu Warrior, Ventela, NB anak yang alasnya bolong/licin.

8. GANTI TAPAK PANTOFEL / KANTOR:
   - ID Layanan: "ganti-tapak-kantor"
   - Harga: Rp 110.000
   - Hak miring atau sol formal retak/pecah.

9. GANTI TAPAK PROYEK / SAFETY:
   - ID Layanan: "ganti-tapak-proyek"
   - Harga: Rp 140.000
   - Karet tebal standar safety tahan minyak & paku.

10. UNYELLOWING MIDSOLE & CUCI:
    - ID Layanan: "unyellowing-midsole" (Rp 40.000) dan "deep-clean" (Rp 35.000).

11. LOGISTIK & PENGIRIMAN:
    - Dalam Kota Cirebon: Antar-Jemput Kurir Soleman atau ojol (Grab/Maxim) berbasis jarak.
    - Luar Kota Cirebon: Kirim ekspedisi via J&T Express / JNE ke workshop Soleman.

PETUNJUK ANALISIS GAMBAR:
Jika ada gambar: Periksa secara saksama bagian sol bawah (outsole), midsole (apakah mangap/lepas lem/kuning), jahitan (apakah putus/rusak), upper (robek/kotor). Sebutkan secara jujur dan detail apa saja yang terlihat rusak pada foto tersebut!

OUTPUT: Berikan respon HANYA dalam format JSON valid murni (tanpa tag markdown json):
{
  "summary": "Ringkasan kerusakan 1-2 kalimat singkat dan ramah",
  "detailedExplanation": "Penjelasan mendalam mengenai kerusakan pada material, penyebab teknis, dan mengapa penanganan workshop Soleman paling tepat",
  "detectedDamages": ["Daftar kerusakan spesifik yang terdeteksi pada gambar/deskripsi"],
  "technicalProcedures": ["Langkah 1 teknis", "Langkah 2 teknis", "Langkah 3 teknis", "Langkah 4 teknis"],
  "recommendedServiceIds": ["id_layanan_1", "id_layanan_2"],
  "estimatedPrice": "Rp xxx.xxx",
  "estimatedDuration": "x Hari Kerja",
  "warranty": "xx Hari Garansi Resmi",
  "requiresPhotoConfirmation": true,
  "photoConfirmationNote": "Penjelasan tentang konfirmasi foto sampel bahan ke WA jika berlaku",
  "proTip": "Tips penting merawat sepatu agar tidak rusak lagi",
  "whatsappText": "Teks siap kirim ke WhatsApp Soleman untuk order langsung"
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
        model: 'gemini-3.8-flash',
        contents: { parts: contentsParts },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.2,
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
