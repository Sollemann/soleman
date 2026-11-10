/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Wrench, 
  ShieldCheck, 
  Clock, 
  Layers, 
  CheckCircle2, 
  Eye, 
  SlidersHorizontal 
} from 'lucide-react';
import { ServiceItem } from '../types';
import { SERVICES_CATALOG } from '../data/solcreftData';
import { soundFx } from '../services/soundEffects';

interface CaseStudy {
  id: string;
  shoeName: string;
  brand: string;
  shoeType: string;
  problem: string;
  solution: string;
  technique: string;
  materialsUsed: string[];
  duration: string;
  warrantyDays: number;
  estimatedPrice: number;
  serviceId: string;
  beforeImage: string;
  afterImage: string;
  beforeDescription: string;
  afterDescription: string;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'aj1-reglue',
    shoeName: 'Air Jordan 1 Retro High OG',
    brand: 'Nike / Jordan',
    shoeType: 'Sneakers Basket',
    problem: 'Outsole lepas total akibat usia lem kering (delaminasi) & midsole menguning parah setelah kehujanan di jalanan Cirebon.',
    solution: 'Pembersihan residu lem lama sampai tuntas, lem polyurethane dengan pres manual presisi, jahit sol keliling benang tanam, dan unyellowing.',
    technique: 'Manual Precision Press & Invisible Insole Stitching',
    materialsUsed: ['Lem PU Daya Rekat Tinggi', 'Primer Karet Khusus', 'Benang Nilon Waxed 1.0mm', 'Oksidator Unyellowing UV'],
    duration: '2 Hari Kerja',
    warrantyDays: 60,
    estimatedPrice: 75000,
    serviceId: 'reglue-total',
    beforeImage: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80',
    beforeDescription: 'Kondisi Datang: Sol menganga 100%, kotor, dan tidak bisa dipakai jalan sama sekali.',
    afterDescription: 'Hasil Soleman: Sol merekat kokoh standar pabrikan, jahitan benang tidak kelihatan, siap diajak melompat!'
  },
  {
    id: 'docmart-resoling',
    shoeName: 'Dr. Martens 1461 Oxford 3-Eyelet',
    brand: 'Dr. Martens',
    shoeType: 'Formal & Boots Kulit',
    problem: 'Outsole PVC bantal udara pecah dan aus licin, benang kuning welt putus di beberapa sudut tumit.',
    solution: 'Penggantian tapak baru (resoling), penjahitan welt ulang dengan tarikan presisi, serta deep polish wax lether balm.',
    technique: 'Goodyear Welt Hand Stitching & Edge Iron Burnish',
    materialsUsed: ['Outsole Commando PVC Bouncing', 'Benang Welt Kuning 1.2mm', 'Mink Oil & Beeswax Conditioning'],
    duration: '3 Hari Kerja',
    warrantyDays: 90,
    estimatedPrice: 165000,
    serviceId: 'resoling-boots-commando',
    beforeImage: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80',
    beforeDescription: 'Kondisi Datang: Tapak licin membahayakan saat hujan, kulit kering kusam dan retak.',
    afterDescription: 'Hasil Soleman: Tapak tebal berdaya cengkeram tinggi, kulit lentur mengkilap kembali elegan.'
  },
  {
    id: 'salomon-outdoor',
    shoeName: 'Salomon XT-6 Trail Running',
    brand: 'Salomon',
    shoeType: 'Sepatu Gunung / Trail Run',
    problem: 'Grip lug outsole rontok tergerus batu tajam di jalur pendakian Gunung Ciremai, toe-cap karet samping mulai terkelupas.',
    solution: 'Resoling tapak outdoor profil lug agresif anti-slip, penguatan toe-cap dengan lem thermo-flex, deep cleaning anti-lumpur.',
    technique: 'Heavy Duty Lug Bonding & Cross Reinforcement',
    materialsUsed: ['Tapak Vibram / Trail Grip Lug', 'Lem PU Fleksibel Anti-Air', 'Sabun Pembersih Enzimatik Solcreft'],
    duration: '3-4 Hari Kerja',
    warrantyDays: 90,
    estimatedPrice: 195000,
    serviceId: 'ganti-sol-gunung-trail',
    beforeImage: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
    beforeDescription: 'Kondisi Datang: Grip botak licin, toe-cap terkelupas dan penuh residu debu tanah kering.',
    afterDescription: 'Hasil Soleman: Grip tajam kembali siap cengkeram medan tanah basah, struktur kokoh 100%.'
  },
  {
    id: 'vans-foxing',
    shoeName: 'Vans Old Skool Classic Black/White',
    brand: 'Vans',
    shoeType: 'Canvas Skate Shoes',
    problem: 'Karet samping (foxing tape) terlipat lepas di bagian lekukan jari kaki, kanvas robek 2 cm di samping.',
    solution: 'Penyuntikan lem vulkanisir elastis pada lekukan foxing, penambalan kanvas dalam (lining patch), jahit sol bawah.',
    technique: 'Lining Reinforcement & Foxing Pressure Curing',
    materialsUsed: ['Lem Elastis Khusus Karet Mentah', 'Kain Kanvas Penguat Dalam', 'Benang Tanam Hitam'],
    duration: '2 Hari Kerja',
    warrantyDays: 60,
    estimatedPrice: 65000,
    serviceId: 'jahit-benang-tersembunyi',
    beforeImage: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80',
    beforeDescription: 'Kondisi Datang: Samping menganga parah saat ditekuk, kanvas dalam robek bolong.',
    afterDescription: 'Hasil Soleman: Samping menyatu kuat tanpa kaku, tambalan kanvas rapi tak terasa di kaki.'
  }
];

interface ShoeRestorationShowcaseProps {
  onSelectService: (service: ServiceItem) => void;
}

export const ShoeRestorationShowcase: React.FC<ShoeRestorationShowcaseProps> = ({ onSelectService }) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(CASE_STUDIES[0].id);
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 to 100%
  const [isInteracting, setIsInteracting] = useState(false);

  const currentCase = CASE_STUDIES.find(c => c.id === selectedCaseId) || CASE_STUDIES[0];

  const handleSelectCase = (caseItem: CaseStudy) => {
    soundFx.playClick();
    setSelectedCaseId(caseItem.id);
    setSliderPosition(50);
  };

  const handleOrderThisCase = () => {
    soundFx.playSuccess();
    const service = SERVICES_CATALOG.find(s => s.id === currentCase.serviceId) || SERVICES_CATALOG[0];
    onSelectService(service);
  };

  return (
    <section id="transformasi" className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800">
      
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Galeri Bukti Nyata Hasil Restorasi</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
          Lihat Transformasi Sebelum & Sesudah <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
            Karya Craftsman Soleman Cirebon
          </span>
        </h2>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Geser garis pembatas interaktif untuk melihat perbedaan sebelum diservis (rusak/mangap) dan setelah selesai direparasi di workshop Sukalila Selatan.
        </p>
      </div>

      {/* Case Selector Tabs */}
      <div className="mt-10 flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CASE_STUDIES.map(caseItem => {
          const isActive = caseItem.id === selectedCaseId;
          return (
            <button
              key={caseItem.id}
              onClick={() => handleSelectCase(caseItem)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.02]'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              <Wrench className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>{caseItem.shoeName}</span>
            </button>
          );
        })}
      </div>

      {/* Interactive Slider Showcase Container */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-sm">
        
        {/* Left Column: Interactive Before/After Visual Slider (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          <div 
            className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden select-none cursor-ew-resize border border-slate-700 shadow-2xl group bg-slate-950"
            onMouseMove={(e) => {
              if (isInteracting || e.buttons === 1) {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = ((e.clientX - rect.left) / rect.width) * 100;
                setSliderPosition(Math.max(5, Math.min(95, pos)));
              }
            }}
            onTouchMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const touch = e.touches[0];
              const pos = ((touch.clientX - rect.left) / rect.width) * 100;
              setSliderPosition(Math.max(5, Math.min(95, pos)));
            }}
            onMouseDown={() => setIsInteracting(true)}
            onMouseUp={() => setIsInteracting(false)}
            onMouseLeave={() => setIsInteracting(false)}
          >
            {/* AFTER Image (Full background) */}
            <img 
              src={currentCase.afterImage} 
              alt={`Sesudah - ${currentCase.shoeName}`}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />

            {/* BEFORE Image (Clipped from left by sliderPosition %) */}
            <div 
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPosition}%` }}
            >
              <img 
                src={currentCase.beforeImage} 
                alt={`Sebelum - ${currentCase.shoeName}`}
                className="absolute inset-0 w-full h-full object-cover filter brightness-90 saturate-75"
                style={{ width: '100%', maxWidth: 'none' }}
              />
              {/* Gradient Darkener on Before */}
              <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />
            </div>

            {/* Slider Dividing Bar */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)] z-20 pointer-events-none flex items-center justify-center -translate-x-1/2"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-slate-950 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-xl group-hover:scale-110 transition-transform">
                <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            {/* Floating Badges */}
            <div className="absolute top-4 left-4 z-30 pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-red-500/40 text-red-400 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                SEBELUM (RUSAK)
              </span>
            </div>

            <div className="absolute top-4 right-4 z-30 pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-400 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                SESUDAH (HASIL SOLEMAN)
              </span>
            </div>

            {/* Hint overlay */}
            <div className="absolute bottom-3 inset-x-0 flex justify-center z-30 pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-[11px] text-slate-300 font-semibold border border-slate-700/80 shadow-md">
                ↔ Geser ke kiri & kanan untuk membandingkan
              </span>
            </div>
          </div>

          {/* Quick comparison text bar */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-red-500/20 text-slate-300">
              <strong className="text-red-400 block mb-1">Masalah Awal:</strong>
              <p className="text-[11px] leading-relaxed text-slate-400">{currentCase.beforeDescription}</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-emerald-500/20 text-slate-300">
              <strong className="text-emerald-400 block mb-1">Hasil Restorasi:</strong>
              <p className="text-[11px] leading-relaxed text-slate-300 font-medium">{currentCase.afterDescription}</p>
            </div>
          </div>

        </div>

        {/* Right Column: Technical Craft Breakdown & Fast Booking (5 cols) */}
        <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">
                {currentCase.shoeType}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Garansi {currentCase.warrantyDays} Hari
              </span>
            </div>

            <h3 className="text-2xl font-black text-white font-display">
              {currentCase.shoeName}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              {currentCase.problem}
            </p>

            {/* Craft Specs */}
            <div className="space-y-2.5 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-amber-400 font-bold block uppercase tracking-wider mb-0.5">
                  Metode & Teknik Reparasi:
                </span>
                <span className="text-white font-medium">{currentCase.technique}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-sky-400 font-bold block uppercase tracking-wider mb-1">
                  Material Standar Pabrik:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentCase.materialsUsed.map((mat, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-700">
                      {mat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Timing & Price estimate */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Waktu Kerja</span>
                    <strong className="text-white text-xs">{currentCase.duration}</strong>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Estimasi Tarif</span>
                    <strong className="text-amber-400 text-xs">Rp {currentCase.estimatedPrice.toLocaleString('id-ID')}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button to Book similar service */}
          <button
            type="button"
            onClick={handleOrderThisCase}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 cursor-pointer active:scale-98"
          >
            <span>Pesan Servis Seperti Ini</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

        </div>

      </div>

    </section>
  );
};
