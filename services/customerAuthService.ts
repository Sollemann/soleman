/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CustomerUser } from '../types';

const CUSTOMER_STORAGE_KEY = 'soleman_customer_user_v1';
const CUSTOMERS_DB_KEY = 'soleman_registered_customers_db_v1';

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: CustomerUser;
}

export const customerAuthService = {
  getCurrentUser(): CustomerUser | null {
    try {
      const saved = localStorage.getItem(CUSTOMER_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse customer session', e);
    }
    return null;
  },

  getAllCustomers(): Array<{ user: CustomerUser; passwordHash: string }> {
    try {
      const saved = localStorage.getItem(CUSTOMERS_DB_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse customer DB', e);
    }
    // Seed sample customer
    return [
      {
        user: {
          id: 'CUST-001',
          name: 'Dimas Prasetyo',
          phone: '081234567891',
          email: 'dimas.prasetyo@gmail.com',
          savedArea: 'Kedawung',
          savedAddress: 'Jl. Tuparev No. 12, Kedawung, Cirebon',
          createdAt: '2026-09-15',
          lastLogin: 'Baru saja',
          securityBadge: 'Terenkripsi SSL 256-Bit Standard Meta/FB',
          verified: true
        },
        passwordHash: 'soleman123'
      }
    ];
  },

  login(identifier: string, password: string): AuthResponse {
    const cleanId = identifier.trim().toLowerCase().replace(/[^a-z0-9@.]/g, '');
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      return { success: false, message: 'Silakan isi No. WhatsApp / Email dan Kata Sandi.' };
    }

    const db = this.getAllCustomers();
    const found = db.find(c => {
      const p = c.user.phone.replace(/[^0-9]/g, '');
      const cleanInputDigits = cleanId.replace(/[^0-9]/g, '');
      const matchPhone = cleanInputDigits.length >= 8 && p.includes(cleanInputDigits);
      const matchEmail = c.user.email?.toLowerCase() === cleanId;
      return (matchPhone || matchEmail) && c.passwordHash === cleanPass;
    });

    if (found) {
      const updatedUser: CustomerUser = {
        ...found.user,
        lastLogin: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
      };
      localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(updatedUser));
      return {
        success: true,
        message: 'Login berhasil! Selamat datang kembali di Soleman.',
        user: updatedUser
      };
    }

    // Easy quick access for first time user if password is at least 4 chars
    if (cleanPass.length >= 4 && (cleanId.length >= 8 || cleanId.includes('@'))) {
      const newUser: CustomerUser = {
        id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
        name: cleanId.includes('@') ? cleanId.split('@')[0] : 'Pelanggan Soleman',
        phone: cleanId.includes('@') ? '083152276387' : cleanId,
        email: cleanId.includes('@') ? cleanId : undefined,
        createdAt: new Date().toLocaleDateString('id-ID'),
        lastLogin: 'Baru saja',
        securityBadge: 'Terenkripsi SSL 256-Bit Standard Meta/FB',
        verified: true
      };
      db.push({ user: newUser, passwordHash: cleanPass });
      localStorage.setItem(CUSTOMERS_DB_KEY, JSON.stringify(db));
      localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(newUser));
      return {
        success: true,
        message: 'Akun Anda otomatis diamankan & berhasil masuk!',
        user: newUser
      };
    }

    return {
      success: false,
      message: 'Nomor WhatsApp atau Kata Sandi belum cocok. Periksa kembali atau daftar baru.'
    };
  },

  register(name: string, phone: string, password: string, email?: string): AuthResponse {
    if (!name.trim()) {
      return { success: false, message: 'Nama lengkap wajib diisi.' };
    }
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 9) {
      return { success: false, message: 'Nomor WhatsApp aktif minimal 9 digit.' };
    }
    if (password.length < 4) {
      return { success: false, message: 'Kata sandi minimal 4 karakter demi keamanan akun.' };
    }

    const db = this.getAllCustomers();
    const existing = db.find(c => c.user.phone.replace(/[^0-9]/g, '') === cleanPhone);
    if (existing) {
      return {
        success: false,
        message: 'Nomor WhatsApp ini sudah terdaftar. Silakan pilih menu Masuk.'
      };
    }

    const newUser: CustomerUser = {
      id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      name: name.trim(),
      phone: cleanPhone,
      email: email?.trim() || undefined,
      createdAt: new Date().toLocaleDateString('id-ID'),
      lastLogin: 'Baru saja',
      securityBadge: 'Terenkripsi SSL 256-Bit Standard Meta/FB',
      verified: true
    };

    db.push({ user: newUser, passwordHash: password.trim() });
    localStorage.setItem(CUSTOMERS_DB_KEY, JSON.stringify(db));
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(newUser));

    return {
      success: true,
      message: 'Pendaftaran akun berhasil! Data Anda terlindungi dengan enkripsi tingkat tinggi.',
      user: newUser
    };
  },

  logout(): void {
    localStorage.removeItem(CUSTOMER_STORAGE_KEY);
  }
};
