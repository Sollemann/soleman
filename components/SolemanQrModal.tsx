/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  X, 
  Copy, 
  Check, 
  Share2, 
  Download, 
  Smartphone, 
  ShieldCheck, 
  ExternalLink,
  Wallet,
  CreditCard,
  Building2,
  DollarSign
} from 'lucide-react';
import { WORKSHOP_INFO } from '../data/solcreftData';
import { soundFx } from '../services/soundEffects';

interface SolemanQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  nominal?: number;
  orderSerial?: string;
}

export const SolemanQrModal: React.FC<SolemanQrModalProps> = ({
  isOpen,
  onClose,
  nominal: initialNominal,
  orderSerial
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dana' | 'qris' | 'bank'>('dana');
  const [qrDataUrl, setQrDataUrl] = useState<string>('/soleman-dana-qr.svg');
  const [selectedNominal, setSelectedNominal] = useState<number | undefined>(initialNominal);

  const danaPhoneNumber = WORKSHOP_INFO.phoneFormatted; // 0881-4519-955
  const rawDanaNumber = WORKSHOP_INFO.phone; // 628814519955
  const danaAccountName = 'SOLEMAN SHOES REPAIR CIREBON';

  const nominalPresets = [
    { label: 'Jahit Sol', amount: 35000 },
    { label: 'Reglue Press', amount: 50000 },
    { label: 'Reglue Total', amount: 75000 },
    { label: 'Deep Clean', amount: 45000 },
    { label: 'Resoling Baru', amount: 165000 }
  ];

  useEffect(() => {
    // Generate high quality QR code data URL
    const nominalParam = selectedNominal ? `?nominal=${selectedNominal}` : '';
    const qrPayload = activeTab === 'dana' 
      ? `https://link.dana.id/m/${rawDanaNumber}${nominalParam}` 
      : `00020101021126580014ID.LINKAJA.WWW011893600911002200000051440014ID.DANA.WWW0215ID10243589201925204581253033605802ID5920SOLEMAN SHOE REPAIR6007CIREBON61054511862070703A016304${orderSerial || 'SLC'}`;

    QRCode.toDataURL(qrPayload, {
      width: 450,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => {
      console.warn('QR generate fallback', err);
      setQrDataUrl('/soleman-dana-qr.svg');
    });
  }, [activeTab, rawDanaNumber, orderSerial, selectedNominal]);

  if (!isOpen) return null;

  const handleCopyNumber = () => {
    soundFx.playClick();
    navigator.clipboard.writeText('08814519955');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyBank = (accNumber: string, bankName: string) => {
    soundFx.playClick();
    navigator.clipboard.writeText(accNumber);
    setCopiedBank(bankName);
    setTimeout(() => setCopiedBank(null), 2500);
  };

  const handleShare = async () => {
    soundFx.playClick();
    const shareText = `Halo! Ini Kode QR Pembayaran Resmi Soleman Shoes Repair Cirebon (0881-4519-955).`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kode QR Pembayaran Soleman Cirebon',
          text: shareText,
          url: window.location.href,
        });
      } catch (e) {}
    } else {
      handleCopyNumber();
    }
  };

  const handleDownloadQr = () => {
    soundFx.playSuccess();
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR-Soleman-Cirebon-${activeTab.toUpperCase()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-amber-500/30 p-5 sm:p-6 shadow-2xl relative text-center space-y-4 my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Tutup modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Selector: DANA QR vs QRIS vs Bank */}
        <div className="flex items-center justify-center p-1 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveTab('dana');
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'dana'
                ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>QR DANA</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveTab('qris');
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'qris'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QRIS Semua</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveTab('bank');
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'bank'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Transfer Bank</span>
          </button>
        </div>

        {activeTab !== 'bank' ? (
          /* Authentic DANA / QRIS Card UI replica */
          <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-200 text-slate-900 space-y-3 relative overflow-hidden">
            
            {/* Top Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-sky-500 flex items-center justify-center text-white font-black text-[11px] shadow-sm">
                  D
                </div>
                <div className="text-left leading-tight">
                  <span className="text-[11px] font-black tracking-wider text-sky-600 block uppercase">
                    {activeTab === 'dana' ? 'DANA QR PROFIL' : 'QRIS NASIONAL'}
                  </span>
                  <span className="text-[9px] text-slate-500 font-semibold block">Soleman Shoes Repair</span>
                </div>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                Terverifikasi
              </span>
            </div>

            {/* Masked / Full Phone Number Banner */}
            <div className="py-1 px-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-mono font-bold text-slate-700 tracking-wider">
                {activeTab === 'dana' ? '62-8814***9955' : 'NMID: ID1024358920192'}
              </span>
              <span className="block text-[10px] text-slate-500">
                Soleman Workshop (Sukalila Selatan)
              </span>
            </div>

            {/* High Resolution Scannable QR Matrix */}
            <div className="relative mx-auto w-48 h-48 sm:w-52 sm:h-52 bg-white p-2 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
              <img
                src={qrDataUrl}
                alt="Kode QR Resmi Soleman Cirebon"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-9 h-9 rounded-full bg-white shadow-md border-2 border-sky-500 flex items-center justify-center p-1">
                  <div className="w-full h-full rounded-full bg-sky-500 flex items-center justify-center text-white font-black text-xs">
                    {activeTab === 'dana' ? 'D' : 'S'}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 leading-tight px-1 font-medium">
              {activeTab === 'dana'
                ? 'Pindai dengan aplikasi DANA untuk transfer instan tanpa biaya admin'
                : 'Pindai memakai BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay'
              }
            </p>

            {/* Quick Preset Nominal Chips */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[10px] font-bold text-slate-500 text-left mb-1.5">Preset Nominal Cepat:</div>
              <div className="flex flex-wrap gap-1">
                {nominalPresets.map(preset => (
                  <button
                    key={preset.amount}
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedNominal(preset.amount);
                    }}
                    className={`text-[9px] px-2 py-0.5 rounded-lg border font-mono transition-all cursor-pointer ${
                      selectedNominal === preset.amount
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    Rp {(preset.amount / 1000)}k
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Tagihan Display */}
            {selectedNominal && selectedNominal > 0 && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500">Nominal Transfer:</span>
                <span className="text-amber-600 font-mono text-sm">
                  Rp {selectedNominal.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {/* BAGIKAN Blue Button */}
            <button
              type="button"
              onClick={handleShare}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-black text-xs shadow-md shadow-sky-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>BAGIKAN KODE QR</span>
            </button>
          </div>
        ) : (
          /* Transfer Bank Option */
          <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-200 text-slate-900 space-y-4 text-left">
            <div className="border-b border-slate-100 pb-2">
              <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">
                Rekening Resmi Soleman
              </span>
              <h4 className="text-sm font-bold text-slate-950">Transfer Bank Langsung</h4>
            </div>

            {/* BCA */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-700">BANK BCA</span>
                <button
                  type="button"
                  onClick={() => handleCopyBank('1341892044', 'BCA')}
                  className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedBank === 'BCA' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBank === 'BCA' ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
              <div className="font-mono font-bold text-sm text-slate-900">134-189-2044</div>
              <div className="text-[10px] text-slate-500">a.n. SOLEMAN CIREBON WORKSHOP</div>
            </div>

            {/* Mandiri */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-700">BANK MANDIRI</span>
                <button
                  type="button"
                  onClick={() => handleCopyBank('1310018924011', 'Mandiri')}
                  className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedBank === 'Mandiri' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBank === 'Mandiri' ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
              <div className="font-mono font-bold text-sm text-slate-900">131-00-1892401-1</div>
              <div className="text-[10px] text-slate-500">a.n. SOLEMAN CIREBON REPAIR</div>
            </div>

            <p className="text-[10px] text-slate-500 italic">
              * Harap konfirmasi bukti transfer ke WhatsApp admin kami setelah melakukan pembayaran.
            </p>
          </div>
        )}

        {/* Secondary Action Controls */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyNumber}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copied ? 'Tersalin: 08814519955' : 'Salin No. DANA'}</span>
            </button>

            {activeTab !== 'bank' && (
              <button
                type="button"
                onClick={handleDownloadQr}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                title="Unduh file gambar QR"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Simpan</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Layanan Resmi Antar-Jemput Wilayah Cirebon Kota & Kabupaten</span>
          </p>
        </div>

      </div>
    </div>
  );
};
