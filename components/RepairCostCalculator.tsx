/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Truck, 
  Sparkles, 
  RotateCcw
} from 'lucide-react';
import { ShoeType, ServiceItem, DamageSeverity } from '../types';
import { SERVICES_CATALOG, CIREBON_AREAS, DAMAGE_SEVERITIES, getServiceTierDetail } from '../data/solcreftData';
import { soundFx } from '../services/soundEffects';

interface RepairCostCalculatorProps {
  onApplyEstimate: (data: {
    services: ServiceItem[];
    shoeType: ShoeType;
    pairsCount: number;
    areaName: string;
    severity: DamageSeverity;
  }) => void;
}

export const RepairCostCalculator: React.FC<RepairCostCalculatorProps> = ({ onApplyEstimate }) => {
  const [shoeType, setShoeType] = useState<ShoeType>('Sneakers');
  const [severity, setSeverity] = useState<DamageSeverity>('normal');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(['jahit-benang-tersembunyi']);
  const [pairsCount, setPairsCount] = useState<number>(1);
  const [selectedAreaName, setSelectedAreaName] = useState<string>('Kesambi (Cipto, Sudarsono, Sunyaragi, Drajat)');

  const shoeTypeOptions: { type: ShoeType; label: string; icon: string }[] = [
    { type: 'Sneakers', label: 'Sneakers / Canvas', icon: '👟' },
    { type: 'Sepatu Sekolah', label: 'Sepatu Sekolah', icon: '🎒' },
    { type: 'Sepatu Kantor / Pantofel', label: 'Kulit / Pantofel', icon: '👞' },
    { type: 'Sepatu Futsal', label: 'Sepatu Futsal', icon: '⚽' },
    { type: 'Sepatu Gunung / Hiking', label: 'Gunung / Hiking', icon: '⛰️' },
    { type: 'Sepatu Trail', label: 'Sepatu Trail', icon: '🏔️' }
  ];

  const handleToggleService = (id: string) => {
    soundFx.playClick();
    setSelectedServiceIds(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const selectedServices = useMemo(() => {
    const found = SERVICES_CATALOG.filter(s => selectedServiceIds.includes(s.id));
    return found.length > 0 ? found : [SERVICES_CATALOG[0]];
  }, [selectedServiceIds]);

  const selectedAreaObj = useMemo(() => {
    return CIREBON_AREAS.find(a => a.name === selectedAreaName) || CIREBON_AREAS[0];
  }, [selectedAreaName]);

  // Calculate price for each severity level so user can compare Ringan vs Sedang vs Berat side-by-side
  const tierTotals = useMemo(() => {
    const computeForSeverity = (sev: DamageSeverity) => {
      return selectedServices.reduce((sum, srv) => sum + getServiceTierDetail(srv, sev).price, 0);
    };
    return {
      kecil: computeForSeverity('kecil'),
      normal: computeForSeverity('normal'),
      hard: computeForSeverity('hard')
    };
  }, [selectedServices]);

  // Detailed Calculation
  const calculation = useMemo(() => {
    const baseServicePrice = tierTotals[severity];
    const subtotalServices = baseServicePrice * pairsCount;

    let deliveryFee = 0;
    let isFreeDelivery = false;
    let deliveryNote = '';

    if (selectedAreaObj.type === 'Kota') {
      deliveryFee = 0;
      isFreeDelivery = true;
      deliveryNote = 'Gratis Ongkir se-Kota Cirebon (Dijemput Kurir Soleman)';
    } else {
      deliveryFee = 15000;
      isFreeDelivery = false;
      deliveryNote = 'Ongkir Kurir Kab. Cirebon (Rp 15.000)';
    }

    const totalEstimate = subtotalServices + deliveryFee;

    let maxDays = severity === 'hard' ? 3 : 2;
    if (selectedServices.some(s => s.category === 'sol' && s.id.startsWith('ganti-tapak'))) {
      maxDays = severity === 'hard' ? 4 : 3;
    } else if (selectedServices.every(s => s.category === 'jahit' || s.category === 'kebersihan') && severity !== 'hard') {
      maxDays = 1;
    }

    let warrantyDays = 30;
    if (selectedServices.some(s => s.warrantyDays && s.warrantyDays > 30)) {
      warrantyDays = Math.max(...selectedServices.map(s => s.warrantyDays || 30));
    }

    return {
      baseServicePrice,
      subtotalServices,
      deliveryFee,
      isFreeDelivery,
      deliveryNote,
      totalEstimate,
      maxDays,
      warrantyDays
    };
  }, [selectedServices, severity, tierTotals, pairsCount, selectedAreaObj]);

  const handleApply = () => {
    soundFx.playSuccess();
    onApplyEstimate({
      services: selectedServices,
      shoeType,
      pairsCount,
      areaName: selectedAreaName,
      severity
    });
  };

  const handleReset = () => {
    soundFx.playClick();
    setSelectedServiceIds(['jahit-benang-tersembunyi']);
    setSeverity('normal');
    setPairsCount(1);
    setShoeType('Sneakers');
    setSelectedAreaName(CIREBON_AREAS[0].name);
  };

  const activeSeverityMeta = DAMAGE_SEVERITIES.find(s => s.id === severity) || DAMAGE_SEVERITIES[1];

  return (
    <section id="kalkulator" className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-cyan-500/20">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(0,240,255,0.2)]">
          <Calculator className="w-3.5 h-3.5 text-cyan-400" />
          <span>Kalkulator Estimasi Biaya & Tingkat Kerusakan</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
          Estimasi Transparan Biaya <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 neon-glow-cyan">
            Reparasi Sepatu di Cirebon
          </span>
        </h2>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Pilih jenis kerusakan dan tingkat keparahannya (<strong className="text-white">Ringan, Sedang, atau Berat</strong>) untuk melihat rincian harga masing-masing secara rapi sebelum memesan.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6 bg-slate-900/80 border border-cyan-500/20 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-sm">
          
          {/* Step 1: Jenis Sepatu */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-cyan-400">
                1. Jenis Sepatu Anda:
              </label>
              <span className="text-[11px] text-slate-400 font-semibold">{shoeType}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {shoeTypeOptions.map(opt => {
                const isSelected = shoeType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setShoeType(opt.type);
                    }}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <span className="text-xs font-bold leading-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Pilih Tingkat Kerusakan */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-cyan-400">
                2. Pilih Tingkat Kerusakan (Harga Menyesuaikan):
              </label>
              <span className="text-[11px] text-cyan-300 font-bold">
                Aktif: {activeSeverityMeta.shortLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {DAMAGE_SEVERITIES.map(sev => {
                const isSelected = severity === sev.id;
                const tierSum = tierTotals[sev.id];
                const sampleTier = getServiceTierDetail(selectedServices[0], sev.id);

                return (
                  <button
                    key={sev.id}
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setSeverity(sev.id);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400/50 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${sev.dotColor}`} />
                          <span className="text-xs font-extrabold text-white">{sev.shortLabel}</span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border ${sev.colorClass}`}>
                          {sev.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-semibold line-clamp-1 mt-1">
                        {sampleTier.label.replace(/^(Ringan|Sedang|Berat)\s*\/\s*/i, '')}
                      </p>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-snug mt-0.5">
                        {sampleTier.damageDesc}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Tarif / Pasang:</span>
                      <span className={`text-xs font-black font-mono ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                        Rp {tierSum.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Pilih Kerusakan / Layanan */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-cyan-400">
                3. Pilih Jenis Kerusakan & Layanan Reparasi:
              </label>
              <span className="text-[11px] text-cyan-300 font-semibold font-mono">
                {selectedServiceIds.length} Layanan Dipilih
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {SERVICES_CATALOG.map(srv => {
                const isChecked = selectedServiceIds.includes(srv.id);
                const tierInfo = getServiceTierDetail(srv, severity);

                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => handleToggleService(srv.id)}
                    className={`p-3 rounded-2xl text-left border transition-all flex items-start gap-2.5 cursor-pointer ${
                      isChecked
                        ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                        : 'bg-slate-950 border-slate-800/90 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center shrink-0 border ${
                      isChecked ? 'bg-cyan-400 border-cyan-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                    }`}>
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold leading-tight text-white truncate">{srv.name}</span>
                        <span className="text-xs text-cyan-300 font-mono font-black shrink-0">
                          {tierInfo.priceFormatted}
                        </span>
                      </div>
                      <div className="text-[10px] text-cyan-400/90 font-semibold mt-0.5 truncate">
                        • {tierInfo.label}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {tierInfo.damageDesc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Jumlah Pasang & Lokasi Kecamatan Cirebon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            
            {/* Jumlah Pasang */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-cyan-400">
                4. Jumlah Sepatu:
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setPairsCount(num);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      pairsCount === num
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {num} Pasang
                  </button>
                ))}
              </div>
            </div>

            {/* Wilayah Kecamatan */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-cyan-400">
                5. Wilayah Anda di Cirebon:
              </label>
              <select
                value={selectedAreaName}
                onChange={(e) => {
                  soundFx.playClick();
                  setSelectedAreaName(e.target.value);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                {CIREBON_AREAS.map(area => (
                  <option key={area.name} value={area.name}>
                    {area.type === 'Kota' ? '🏙️' : '📍'} {area.name} ({area.type})
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Harga dijamin sesuai tingkat kerusakan masing-masing layanan.</span>
            <button
              type="button"
              onClick={handleReset}
              className="text-cyan-400 hover:text-cyan-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

        </div>

        {/* Right Output Summary Card (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative overflow-hidden">
          
          <div className="space-y-1.5 border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                Rincian Estimasi Resmi
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${activeSeverityMeta.colorClass}`}>
                Tingkat {activeSeverityMeta.shortLabel}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white">Ringkasan Kerusakan & Biaya</h3>
            <p className="text-xs text-slate-400">
              Untuk {pairsCount} pasang {shoeType} • Wilayah {selectedAreaObj.type} Cirebon
            </p>
          </div>

          {/* Selected Breakdown List with Specific Damage & Price */}
          <div className="space-y-2.5 text-xs">
            <div className="text-slate-300 font-bold">
              Rincian Masing-Masing Kerusakan ({selectedServices.length} Layanan):
            </div>
            <div className="space-y-2">
              {selectedServices.map(srv => {
                const tier = getServiceTierDetail(srv, severity);
                return (
                  <div key={srv.id} className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-white leading-snug">{srv.name}</span>
                      <span className="text-cyan-300 font-mono font-black shrink-0">
                        {tier.priceFormatted}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className={`px-1.5 py-0.2 rounded font-bold uppercase border ${activeSeverityMeta.colorClass}`}>
                        {tier.label}
                      </span>
                      <span className="text-slate-400">• Est. {tier.durationEst}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {tier.damageDesc}
                    </p>
                  </div>
                );
              })}
            </div>

            {pairsCount > 1 && (
              <div className="flex items-center justify-between py-1.5 px-1 text-slate-300 border-t border-slate-800/80">
                <span>Subtotal {pairsCount} Pasang Sepatu:</span>
                <span className="font-bold font-mono text-white">
                  Rp {calculation.subtotalServices.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between py-1.5 px-1 text-xs border-t border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ongkos Kirim Kurir:</span>
              </span>
              <span className={`font-bold font-mono ${calculation.isFreeDelivery ? 'text-cyan-300' : 'text-slate-200'}`}>
                {calculation.isFreeDelivery ? 'GRATIS (Rp 0)' : `Rp ${calculation.deliveryFee.toLocaleString('id-ID')}`}
              </span>
            </div>

            <div className="text-[10px] text-slate-400 italic px-1">
              * {calculation.deliveryNote}
            </div>
          </div>

          {/* Big Total Price */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 text-center space-y-1 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">
              Total Estimasi Biaya ({activeSeverityMeta.shortLabel})
            </span>
            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-200 font-mono tracking-tight">
              Rp {calculation.totalEstimate.toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-slate-400 block">
              Bisa Bayar COD (Saat Sepatu Selesai) atau QRIS / DANA
            </span>
          </div>

          {/* Duration & Warranty Badges */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Waktu Selesai:</span>
                <strong className="text-white text-xs">{calculation.maxDays} Hari Kerja</strong>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Garansi Servis:</span>
                <strong className="text-emerald-400 text-xs">{calculation.warrantyDays} Hari Resmi</strong>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <button
            type="button"
            onClick={handleApply}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-sky-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl shadow-cyan-400/25 cursor-pointer active:scale-98"
          >
            <span>Pesan Jemput Dengan Estimasi Ini</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

        </div>

      </div>

    </section>
  );
};
