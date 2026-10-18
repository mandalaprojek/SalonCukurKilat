import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ScissorsIcon } from '../common/BrandIcon';
import { ShieldCheck, UserCheck, Users, X, Check, LogOut, Cloud } from 'lucide-react';

export const MobileHeader: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    barbers,
    selectedBarberId,
    setSelectedBarberId,
    activeCustomer,
    logout,
    gasSyncStatus,
  } = useApp();

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const getRoleBadge = () => {
    switch (currentRole) {
      case 'admin':
        return {
          label: 'Admin (Pemilik)',
          color: 'text-[#e5a93c] border-[#e5a93c]/30 bg-[#e5a93c]/10',
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
        };
      case 'barber': {
        const barber = barbers.find((b) => b.id === selectedBarberId);
        return {
          label: barber ? barber.nickname : 'Barber',
          color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
          icon: <UserCheck className="w-3.5 h-3.5" />,
        };
      }
      default:
        return {
          label: activeCustomer.nama.split(' ')[0],
          color: 'text-amber-200 border-amber-300/30 bg-amber-400/10',
          icon: <Users className="w-3.5 h-3.5" />,
        };
    }
  };

  const badge = getRoleBadge();

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#062320]/95 backdrop-blur-md border-b border-white/10 px-4 h-14 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0b322c] border border-[#e5a93c]/30 flex items-center justify-center text-[#e5a93c] shadow-sm">
            <ScissorsIcon className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-white whitespace-nowrap">
            Salon<span className="text-[#e5a93c]">CukurKilat</span>
          </span>
        </div>

        {/* Zone 2 & 3: Sync status & Clean Role Trigger */}
        <div className="flex items-center gap-2">
          {gasSyncStatus === 'connected' && (
            <span
              className="text-[10px] font-medium text-emerald-400 flex items-center gap-1"
              title="Terkoneksi ke Google Sheets (GAS)"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Sheets</span>
            </span>
          )}
          <button
            onClick={() => setIsRoleModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all active:scale-95 min-h-[36px] ${badge.color}`}
            title="Ganti Peran / Keluar"
          >
            {badge.icon}
            <span className="truncate max-w-[105px]">{badge.label}</span>
            <span className="text-[10px] opacity-70 ml-0.5">▼</span>
          </button>
        </div>
      </header>

      {/* Role Switcher & Logout Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0b322c] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <h3 className="font-bold text-base text-white">Ganti Peran / Akun</h3>
                <p className="text-xs text-slate-400">
                  Simulasi cepat RBAC atau kembali ke halaman Login utama
                </p>
              </div>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Role: Pelanggan */}
              <button
                onClick={() => {
                  setCurrentRole('customer');
                  setIsRoleModalOpen(false);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between ${
                  currentRole === 'customer'
                    ? 'border-[#e5a93c] bg-[#e5a93c]/10 text-white'
                    : 'border-white/10 hover:border-white/20 bg-[#062320]/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Pelanggan / Member</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Booking antrean, loyalty card ({activeCustomer.totalKunjungan}/15 potong), riwayat gaya rambut & review.
                    </div>
                  </div>
                </div>
                {currentRole === 'customer' && (
                  <Check className="w-4 h-4 text-[#e5a93c] shrink-0 mt-1" />
                )}
              </button>

              {/* Role: Barber */}
              <div className="p-3.5 rounded-xl border border-white/10 bg-[#062320]/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Barber / Kapster</div>
                      <div className="text-xs text-slate-400">
                        Jadwal & komisi pribadi, catatan potong pelanggan.
                      </div>
                    </div>
                  </div>
                  {currentRole === 'barber' && (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </div>

                {/* Barber selector */}
                <div className="pt-2 border-t border-white/10 grid grid-cols-3 gap-2">
                  {barbers.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setSelectedBarberId(b.id);
                        setCurrentRole('barber');
                        setIsRoleModalOpen(false);
                      }}
                      className={`px-2 py-2 rounded-lg text-xs font-medium text-center border transition-all ${
                        currentRole === 'barber' && selectedBarberId === b.id
                          ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {b.nickname}
                    </button>
                  ))}
                </div>
              </div>

              {/* Role: Admin */}
              <button
                onClick={() => {
                  setCurrentRole('admin');
                  setIsRoleModalOpen(false);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between ${
                  currentRole === 'admin'
                    ? 'border-[#e5a93c] bg-[#e5a93c]/10 text-white'
                    : 'border-white/10 hover:border-white/20 bg-[#062320]/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#e5a93c]/20 text-[#e5a93c] flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Admin / Pemilik (Superadmin)</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Laporan omset harian, stok produk, komisi semua barber, approval lamaran pegawai, aturan loyalty.
                    </div>
                  </div>
                </div>
                {currentRole === 'admin' && (
                  <Check className="w-4 h-4 text-[#e5a93c] shrink-0 mt-1" />
                )}
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  setIsRoleModalOpen(false);
                  logout();
                }}
                className="py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Halaman Login</span>
              </button>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
