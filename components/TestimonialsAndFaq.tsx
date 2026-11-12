/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Star, 
  HelpCircle, 
  ChevronDown, 
  CheckCircle, 
  MessageSquare, 
  ShieldCheck, 
  Sparkles, 
  Quote,
  PlusCircle,
  X,
  CheckCircle2,
  ThumbsUp
} from 'lucide-react';
import { buildConsultationWhatsAppUrl } from '../services/whatsappHelper';
import { ALL_CIREBON_KECAMATAN_SUGGESTIONS } from '../data/solcreftData';
import { soundFx } from '../services/soundEffects';

interface ReviewItem {
  id?: string;
  name: string;
  area: string;
  shoe: string;
  comment: string;
  rating: number;
  date?: string;
  isCustom?: boolean;
}

const DEFAULT_TESTIMONIALS: ReviewItem[] = [
  {
    id: 't-1',
    name: 'Rian Hidayat',
    area: 'Kedawung / Tuparev, Cirebon',
    shoe: 'Ventela Public High (Reglue & Unyellowing)',
    comment: 'Gokil hasilnya! Sol yang udah mangap parah gara-gara kena hujan di Tuparev sekarang nempel kenceng kayak baru. Midsole-nya juga kinclong lagi. Kurir Soleman tepat waktu jemput ke rumah dan bisa bayar COD santai.',
    rating: 5,
    date: '3 hari yang lalu'
  },
  {
    id: 't-2',
    name: 'Dinda Lestari',
    area: 'Kesambi (Sunyaragi), Cirebon',
    shoe: 'Vans Old Skool & Docmart (Jahit Sol & Deep Clean)',
    comment: 'Fitur antar jemputnya ngebantu banget pas lagi sibuk kerja. Tinggal share lokasi GPS lewat WA, Kurir Soleman langsung datang. Jahitannya rapi banget dan gratis ongkir karena di Kota Cirebon.',
    rating: 5,
    date: '1 minggu yang lalu'
  },
  {
    id: 't-3',
    name: 'Bambang Suryo',
    area: 'Kejaksan (Kartini), Cirebon',
    shoe: 'Pantofel Kulit Formal (Resoling & Leather Care)',
    comment: 'Sepatu andalan ngantor solnya udah aus licin. Diganti sol baru di Soleman jadi gagah lagi. Pembayaran QRIS instan dan notifikasi di tiap tahap pengerjaannya bikin tenang, gak perlu bolak-balik nanya.',
    rating: 5,
    date: '2 minggu yang lalu'
  },
  {
    id: 't-4',
    name: 'Fikri Maulana',
    area: 'Pekalipan (Sukalila), Cirebon',
    shoe: 'Sepatu Futsal Specs (Jahit Tanam Sol Depan)',
    comment: 'Langsung mampir ke workshopnya di Sukalila Selatan deket Karanggetas. Pengerjaan cepet dan jahitannya gak kerasa ganjel di kaki pas nendang bola. Mantap Soleman Cirebon!',
    rating: 5,
    date: 'Kemarin'
  }
];

const REVIEWS_STORAGE_KEY = 'soleman_custom_reviews_v1';

export const TestimonialsAndFaq: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    try {
      const saved = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...parsed, ...DEFAULT_TESTIMONIALS];
      }
    } catch {}
    return DEFAULT_TESTIMONIALS;
  });

  // Modal State for adding customer review
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewArea, setReviewArea] = useState('Kesambi, Kota Cirebon');
  const [reviewShoe, setReviewShoe] = useState('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittedToast, setSubmittedToast] = useState(false);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) return;

    soundFx.playSuccess();

    const newReview: ReviewItem = {
      id: 'rev-' + Date.now(),
      name: reviewName.trim(),
      area: reviewArea,
      shoe: reviewShoe.trim() || 'Sneakers Reparasi',
      comment: reviewComment.trim(),
      rating: reviewRating,
      date: 'Baru saja',
      isCustom: true
    };

    const updated = [newReview, ...reviews];
    setReviews(updated);

    // Save only custom ones to localStorage
    try {
      const onlyCustom = updated.filter(r => r.isCustom);
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(onlyCustom));
    } catch {}

    setReviewName('');
    setReviewShoe('');
    setReviewComment('');
    setIsReviewModalOpen(false);
    setSubmittedToast(true);
    setTimeout(() => setSubmittedToast(false), 4000);
  };

  const faqs = [
    {
      q: 'Bagaimana cara kerja layanan antar-jemput sepatu di Soleman Cirebon?',
      a: 'Sangat mudah! Anda cukup mengisi form di web ini, pilih bahan sepatu & upload foto, lalu kunci titik lokasi GPS rumah Anda di Cirebon. Pesanan langsung masuk ke sistem. Kurir Soleman akan meluncur sesuai titik maps tersebut untuk mengambil sepatu Anda, dan mengantarkannya kembali setelah selesai diperbaiki.'
    },
    {
      q: 'Apakah saya perlu repot datang langsung ke lokasi workshop?',
      a: 'Tidak perlu! Soleman berfokus penuh pada kemudahan layanan antar-jemput langsung ke rumah Anda di seluruh Cirebon. Cukup isi form di website, kurir kami yang akan datang menjemput dan mengantarkan kembali sepatu Anda setelah selesai dengan Gratis Ongkir wilayah Kota Cirebon (Kabupaten flat Rp 15.000).'
    },
    {
      q: 'Apakah lem sol di Soleman tahan air dan tidak mudah lepas lagi?',
      a: 'Ya, 100%! Kami tidak menggunakan lem kuning sembarangan. Soleman menggunakan lem Polyurethane (PU) khusus sepatu, dilengkapi cairan primer pengikis kotoran mikroskopis dan diproses menggunakan teknik Pres Manual bertekanan merata & presisi. Kami memberikan garansi servis hingga 60 - 90 hari.'
    },
    {
      q: 'Bagaimana aturan promo Gratis Ongkir antar-jemput di Cirebon?',
      a: 'Khusus wilayah Kota Cirebon (Kesambi, Kejaksan, Pekalipan, Lemahwungkuk, Harjamukti), layanan antar-jemput 100% GRATIS ONGKIR tanpa syarat jumlah pasang! Untuk wilayah Kabupaten Cirebon, ongkir flat hanya Rp 15.000 (15k).'
    },
    {
      q: 'Bagaimana saya mengetahui progres pengerjaan sepatu saya?',
      a: 'Anda bisa mengecek status kapan saja di kolom "Lacak Status Sepatu" dengan memasukkan nomor kode seri pesanan Anda (misal: SLC-3891). Anda juga dapat mencetak / mengunduh Struk Tanda Terima Digital & Kartu Garansi 30 Hari langsung dari sistem.'
    },
    {
      q: 'Berapa lama estimasi pengerjaan servis sepatu?',
      a: 'Tergantung jenis kerusakan: Reglue sol butuh 1-2 hari (perlu waktu curing lem yang matang), Jahit sol 1 hari, Deep Clean 1 hari, Unyellowing 1-2 hari, dan Resoling ganti sol baru 3-4 hari kerja.'
    },
    {
      q: 'Bagaimana metode pembayarannya?',
      a: 'Soleman menyediakan metode pembayaran yang sangat praktis: bisa COD (Bayar Tunai ke Kurir Soleman saat sepatu diantar kembali tanpa DP) atau scan Kode QR DANA / QRIS Resmi Workshop yang tersedia di aplikasi.'
    }
  ];

  return (
    <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-cyan-500/20">
      
      {/* Toast Notification */}
      {submittedToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-cyan-400 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          <span>Terima kasih! Ulasan Anda berhasil ditampilkan di Soleman Cirebon.</span>
        </div>
      )}

      {/* Testimonials Section */}
      <div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <Star className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
              <span>Kepuasan Nyata Pelanggan Cirebon</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              Apa Kata Mereka Tentang <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">Soleman Cirebon</span>?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Ribuan pasang sepatu warga Cirebon telah kembali tampil kokoh, rapi, dan percaya diri.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setIsReviewModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0 shadow-lg shadow-cyan-500/10"
          >
            <PlusCircle className="w-4 h-4 text-cyan-400" />
            <span>Tulis Ulasan Anda</span>
          </button>
        </div>

        {/* Reviews Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {reviews.map((item, idx) => (
            <div 
              key={item.id || idx}
              className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3.5 shadow-xl flex flex-col justify-between group hover:shadow-[0_0_20px_rgba(0,240,255,0.15)]"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5 text-cyan-400">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                    ))}
                  </div>
                  {item.isCustom && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 font-bold">
                      Baru Ditulis
                    </span>
                  )}
                </div>

                <Quote className="w-5 h-5 text-slate-700 group-hover:text-cyan-400/40 transition-colors" />
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{item.comment}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1">
                    <span>{item.name}</span>
                    <CheckCircle className="w-3 h-3 text-cyan-400 shrink-0" />
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{item.area}</p>
                </div>
                <span className="text-[9px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20 font-mono max-w-[110px] truncate">
                  {item.shoe}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Write Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-cyan-500/30 p-6 space-y-4 shadow-2xl relative my-auto">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                Ulasan Pelanggan Soleman
              </span>
              <h3 className="text-lg font-bold text-white">Bagikan Pengalaman Servis Anda</h3>
              <p className="text-xs text-slate-400">
                Ulasan Anda membantu pemilik sepatu lain di Cirebon menemukan solusi perbaikan terbaik.
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-3.5">
              {/* Star rating selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Rating Kepuasan:</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setReviewRating(star);
                      }}
                      className="p-1 cursor-pointer transition-transform hover:scale-125"
                    >
                      <Star 
                        className={`w-6 h-6 ${
                          star <= reviewRating 
                            ? 'text-cyan-400 fill-cyan-400' 
                            : 'text-slate-700'
                        }`} 
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-cyan-300 ml-2 font-mono">
                    {reviewRating} Bintang
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Nama Anda:</label>
                <input
                  type="text"
                  required
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Wilayah di Cirebon:</label>
                <select
                  value={reviewArea}
                  onChange={(e) => setReviewArea(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Sukalila Selatan, Kota Cirebon">Sukalila Selatan, Kota Cirebon (Dekat Workshop - Gratis Ongkir)</option>
                  <option value="Kesambi, Kota Cirebon">Kesambi, Kota Cirebon (Gratis Ongkir)</option>
                  <option value="Kejaksan, Kota Cirebon">Kejaksan, Kota Cirebon (Gratis Ongkir)</option>
                  <option value="Pekalipan, Kota Cirebon">Pekalipan, Kota Cirebon (Gratis Ongkir)</option>
                  <option value="Lemahwungkuk, Kota Cirebon">Lemahwungkuk, Kota Cirebon (Gratis Ongkir)</option>
                  <option value="Harjamukti, Kota Cirebon">Harjamukti, Kota Cirebon (Gratis Ongkir)</option>
                  <option value="Kedawung / Tuparev, Cirebon">Kedawung / Tuparev, Cirebon (Ongkir 15k)</option>
                  <option value="Weru / Plered Trusmi, Cirebon">Weru / Plered Trusmi, Cirebon (Ongkir 15k)</option>
                  <option value="Sumber, Cirebon">Sumber, Cirebon (Ongkir 15k)</option>
                  <option value="Gunung Jati, Cirebon">Gunung Jati, Cirebon (Ongkir 15k)</option>
                  <option value="Plumbon / Palimanan, Cirebon">Plumbon / Palimanan, Cirebon (Ongkir 15k)</option>
                  <option value="Luar Cirebon (Kuningan/Majalengka/Indramayu)">Luar Cirebon (Kuningan/Majalengka/Indramayu)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Sepatu & Jenis Servis:</label>
                <input
                  type="text"
                  value={reviewShoe}
                  onChange={(e) => setReviewShoe(e.target.value)}
                  placeholder="Contoh: Sepatu Futsal Nike (Jahit Tanam Sol)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Ulasan Anda:</label>
                <textarea
                  required
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Ceritakan kepuasan Anda mengenai kekuatan lem, jahitan rapi, atau layanan kurir antar-jemput Soleman..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-sky-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-cyan-400/20 active:scale-98"
              >
                Kirim Ulasan Sekarang
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="mt-20">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Paling Sering Ditanyakan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Pertanyaan Seputar Servis & Antar-Jemput
          </h2>
        </div>

        <div className="mt-8 max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx}
                className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setActiveFaq(isOpen ? null : idx);
                  }}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-bold text-white">
                    {faq.q}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-amber-400' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <a
            href={buildConsultationWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Masih Ada Pertanyaan? Chat Admin WhatsApp</span>
          </a>
        </div>
      </div>

    </section>
  );
};
