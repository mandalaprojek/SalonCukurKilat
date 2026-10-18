import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ScissorsIcon, RazorIcon } from '../common/BrandIcon';
import { UserRole } from '../../types';
import {
  Users,
  UserCheck,
  ShieldCheck,
  Phone,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  User,
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (initialTab?: 'home' | 'booking' | 'member' | 'manage') => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const {
    customers,
    barbers,
    setCurrentRole,
    setSelectedBarberId,
    setActiveCustomerId,
    loginWithCustomerWa,
    setIsLoggedIn,
  } = useApp();

  const [selectedRoleTab, setSelectedRoleTab] = useState<UserRole>('customer');
  const [custPhone, setCustPhone] = useState('081398765432');
  const [custName, setCustName] = useState('Andi Prasetyo');
  const [chosenBarberId, setChosenBarberId] = useState(barbers[0]?.id || 'BRB-01');
  const [barberPin, setBarberPin] = useState('1234');
  const [adminPin, setAdminPin] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (selectedRoleTab === 'customer') {
      if (!custPhone.trim()) {
        setErrorMsg('Masukkan nomor WhatsApp Anda.');
        return;
      }
      loginWithCustomerWa(custName, custPhone);
      onLoginSuccess('home');
      return;
    }

    if (selectedRoleTab === 'barber') {
      if (barberPin !== '1234') {
        setErrorMsg('PIN Kapster salah. Gunakan PIN demo: 1234');
        return;
      }
      setSelectedBarberId(chosenBarberId);
      setCurrentRole('barber');
      setIsLoggedIn(true);
      onLoginSuccess('manage');
      return;
    }

    if (selectedRoleTab === 'admin') {
      if (adminPin !== 'admin123') {
        setErrorMsg('PIN Admin salah. Gunakan kode demo: admin123');
        return;
      }
      setCurrentRole('admin');
      setIsLoggedIn(true);
      onLoginSuccess('manage');
    }
  };

  const handleQuickCustomerLogin = (custId: string) => {
    setActiveCustomerId(custId);
    setCurrentRole('customer');
    setIsLoggedIn(true);
    onLoginSuccess('home');
  };

  return (
    <div className="min-h-screen bg-[#041a18] text-slate-100 flex justify-center selection:bg-[#e5a93c] selection:text-[#062320]">
      <div className="w-full max-w-md min-h-screen bg-[#062320] border-x border-white/10 flex flex-col justify-between p-5 relative overflow-hidden shadow-2xl">
        {/* Subtle Background Glow */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#e5a93c]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-6 relative z-10 pt-4">
          {/* Brand Identity Header */}
          <div className="text-center space-y-2.5">
            <div className="w-16 h-16 rounded-2xl bg-[#0b322c] border-2 border-[#e5a93c]/50 flex items-center justify-center text-[#e5a93c] mx-auto shadow-lg">
              <ScissorsIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e5a93c]/15 border border-[#e5a93c]/30 text-[#e5a93c] text-[10px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3" />
                <span>SNIP & SHAVE · EST. 2026</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Salon<span className="text-[#e5a93c]">CukurKilat</span>
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Sistem Manajemen Barbershop & Booking Home Service
              </p>
            </div>
          </div>

          {/* Role Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-[#0b322c] rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => {
                setSelectedRoleTab('customer');
                setErrorMsg(null);
              }}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all min-h-[54px] ${
                selectedRoleTab === 'customer'
                  ? 'bg-[#e5a93c] text-[#062320] shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 mb-1" />
              <span>Pelanggan</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRoleTab('barber');
                setErrorMsg(null);
              }}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all min-h-[54px] ${
                selectedRoleTab === 'barber'
                  ? 'bg-[#e5a93c] text-[#062320] shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4 mb-1" />
              <span>Barber</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRoleTab('admin');
                setErrorMsg(null);
              }}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all min-h-[54px] ${
                selectedRoleTab === 'admin'
                  ? 'bg-[#e5a93c] text-[#062320] shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 mb-1" />
              <span>Owner / Admin</span>
            </button>
          </div>

          {/* Main Login Form Card */}
          <form
            onSubmit={handleLoginSubmit}
            className="bg-[#0b322c] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl"
          >
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-200">
                {errorMsg}
              </div>
            )}

            {/* TAB 1: PELANGGAN */}
            {selectedRoleTab === 'customer' && (
              <div className="space-y-3.5">
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Masuk Member & Booking Cukur
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Masukkan nomor WhatsApp untuk cek stempel loyalitas & jadwal potong
                  </p>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">
                    Nomor WhatsApp Aktif:
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#e5a93c] absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      placeholder="081398765432"
                      className="w-full bg-[#062320] border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#e5a93c]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">
                    Nama Pelanggan:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#e5a93c] absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      placeholder="Nama Lengkap Anda"
                      className="w-full bg-[#062320] border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#e5a93c]"
                    />
                  </div>
                </div>

                {/* Quick Demo Member Selector */}
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  <span className="text-[10px] text-slate-400 block">
                    Pilih Cepat Akun Member Demo:
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {customers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleQuickCustomerLogin(c.id)}
                        className="w-full text-left px-3 py-2 rounded-xl bg-[#062320]/80 hover:bg-[#062320] border border-white/10 flex items-center justify-between text-xs transition-all"
                      >
                        <div>
                          <span className="font-semibold text-white">{c.nama}</span>
                          <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                            ({c.noWa})
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-[#e5a93c] font-mono">
                          {c.totalKunjungan}/15 Potong →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BARBER */}
            {selectedRoleTab === 'barber' && (
              <div className="space-y-3.5">
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Portal Kapster / Barber
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Cek antrean pelanggan, catatan gaya, & komisi otomatis Anda
                  </p>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1.5">
                    Pilih Nama Kapster:
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {barbers.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setChosenBarberId(b.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                          chosenBarberId === b.id
                            ? 'border-[#e5a93c] bg-[#e5a93c]/15 text-white'
                            : 'border-white/10 bg-[#062320] text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={b.avatar}
                            alt={b.nama}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover border border-[#e5a93c]/40"
                          />
                          <div>
                            <div className="text-xs font-bold">{b.nickname}</div>
                            <div className="text-[10px] text-slate-400">
                              Komisi {b.persentaseKomisi}% · {b.spesialisasi}
                            </div>
                          </div>
                        </div>
                        {chosenBarberId === b.id && (
                          <CheckCircle2 className="w-4 h-4 text-[#e5a93c]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">
                    PIN Akses Barber (Demo: <code className="text-[#e5a93c]">1234</code>):
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#e5a93c] absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={barberPin}
                      onChange={(e) => setBarberPin(e.target.value)}
                      className="w-full bg-[#062320] border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#e5a93c]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ADMIN / OWNER */}
            {selectedRoleTab === 'admin' && (
              <div className="space-y-3.5">
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Dashboard Pemilik (Superadmin)
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Laporan omset, rekap komisi, stok pomade, pelamar kerja, & kode GAS
                  </p>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">
                    Kode Akses Owner (Demo: <code className="text-[#e5a93c]">admin123</code>):
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#e5a93c] absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      className="w-full bg-[#062320] border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#e5a93c]"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-[11px] text-slate-300 space-y-1">
                  <div className="font-semibold text-[#e5a93c]">Fitur Superadmin:</div>
                  <div>• Pantau Omset & Laba Bersih Salon</div>
                  <div>• Pengaturan Loyalitas (15x Kunjungan Gratis)</div>
                  <div>• Salin & Hubungkan Google Apps Script (Code.gs)</div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-[#e5a93c] hover:bg-[#f5b73d] text-[#062320] font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#e5a93c]/20 active:scale-95 transition-all min-h-[48px]"
            >
              <span>
                {selectedRoleTab === 'customer'
                  ? 'Masuk sebagai Pelanggan'
                  : selectedRoleTab === 'barber'
                  ? 'Masuk Panel Barber'
                  : 'Masuk Dashboard Pemilik'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Secondary Quick Links: Job Application & GAS Setup */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setCurrentRole('customer');
                setIsLoggedIn(true);
                onLoginSuccess('manage');
              }}
              className="p-3 rounded-xl bg-[#0b322c]/90 hover:bg-[#0b322c] border border-white/10 text-left transition-all"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#e5a93c]">
                <RazorIcon className="w-3.5 h-3.5" />
                <span>Lamar Jadi Barber</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Formulir calon kapster & unggah KTP/KK
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentRole('admin');
                setIsLoggedIn(true);
                onLoginSuccess('manage');
              }}
              className="p-3 rounded-xl bg-[#0b322c]/90 hover:bg-[#0b322c] border border-white/10 text-left transition-all"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Panduan & Code.gs</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Pasang langsung ke Google Apps Script
              </p>
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-[11px] text-slate-400 pt-6 pb-2">
          SalonCukurKilat · Powered by Google Apps Script & Sheets
        </footer>
      </div>
    </div>
  );
};
