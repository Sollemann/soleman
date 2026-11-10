/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Truck, 
  KeyRound, 
  X, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2,
  Navigation,
  Lock
} from 'lucide-react';
import { courierAuthService } from '../services/courierAuthService';
import { CourierUser } from '../types';
import { SolemanLogo } from './SolemanLogo';

interface CourierLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: CourierUser) => void;
}

export const CourierLoginModal: React.FC<CourierLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [username, setUsername] = useState('soleman');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const res = courierAuthService.login(username, password);
      setIsLoading(false);

      if (res.success && res.user) {
        onLoginSuccess(res.user);
        onClose();
        setPassword('');
      } else {
        setErrorMessage(res.message || 'Sandi kurir salah.');
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/30 p-6 sm:p-8 space-y-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Truck className="w-7 h-7" />
          </div>
          <div className="flex justify-center pt-1">
            <SolemanLogo size="sm" showSubtitle={false} />
          </div>
          <h3 className="text-xl font-black text-white font-display">
            Login Kurir Soleman
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Akses khusus kurir penjemputan & pengantaran sepatu area Kota dan Kabupaten Cirebon.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Akses Ditolak</p>
              <p className="text-[11px] text-red-300/90">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Nama / ID Kurir:
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="soleman"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Kata Sandi Kurir:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan sandi kurir..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-11 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Security notice without displaying password */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Gunakan kata sandi resmi Kurir Soleman. Hubungi Admin Workshop jika lupa akses.</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Memverifikasi...</span>
            ) : (
              <>
                <Truck className="w-4 h-4" />
                <span>Masuk Dashboard Kurir</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800 text-[11px] text-slate-500">
          <p>Soleman Workshop & Shoes Repair Cirebon</p>
        </div>

      </div>
    </div>
  );
};
